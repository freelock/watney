"use strict";

var config = require('./config');

var sdk = require("matrix-js-sdk");
var matrixClient = sdk.createClient({
    baseUrl: "https://matrix.freelock.com:8448",
    accessToken: config.myAccessToken,
    userId: config.myUserId
});
var util = require('util');

// Data structures
var roomList = [];
var viewingRoom = null;
var numMessagesToShow = 20;

// set the room list after syncing.
matrixClient.on("syncComplete", function() {
    setRoomList();
    console.log('Startup complete.');
});

matrixClient.on("Room", function() {
    setRoomList();
    if (!viewingRoom) {
    }
});

// search for messages I understand
matrixClient.on("Room.timeline", function(event, room, toStartOfTimeline) {
    if (toStartOfTimeline) {
        return; // don't print paginated results
    }

    var matches, body = "";
    if (event.getType() === "m.room.message") {
        body = event.getContent().body;
        matches = body.match(/^!([a-z]*)( .*)?$/);
        if (matches) {
            switch (matches[1]) {
                case 'help':
                    sendHelp(event, room);
                    break;
                case 'state':
                    handleState(event,room,body);
                    break;
                case 'login':
                    login(event, room, body);
                    break;
                case 'release':
                    releaseNotes(event, room, body);
                    break;
                case 'status':
                    printStatus(event, room, body);
                    break;
            }
        }
    }
});


function setRoomList() {
    roomList = matrixClient.getRooms();
    roomList.sort(function(a,b) {
        // < 0 = a comes first (lower index) - we want high indexes = newer
        var aMsg = a.timeline[a.timeline.length-1];
        if (!aMsg) {
            return -1;
        }
        var bMsg = b.timeline[b.timeline.length-1];
        if (!bMsg) {
            return 1;
        }
        if (aMsg.getTs() > bMsg.getTs()) {
            return 1;
        }
        else if (aMsg.getTs() < bMsg.getTs()) {
            return -1;
        }
        return 0;
    });
}

function isAdmin(user_id){
  var localmatch = user_id.match(/^@(.*):matrix\.freelock\.com$/);
    if (localmatch){
        return config.admins.indexOf(localmatch[1]) != -1;
    }
    return false;
}

/**
 * Right now, allow logins to anyone @:matrix.freelock.com.
 * @param user_id
 */
function canLogin(user_id){
    var localmatch = user_id.match(/^@(.*):matrix\.freelock\.com$/);
    if (localmatch){
        return config.admins.indexOf(localmatch[1]) != -1;
    }
    return false;

}

function sendHelp(event, room) {
    var body = "Hi, I'm Watney...<br/>\n" +
        "Your options:<br/><br/>\n\n" +
        "<b>!help</b> - this message<br/>\n" +
        "<b>!login [{env}]</b> - Get a login link for env - dev, stage, prod<br/>\n" +
        "<b>!release</b> - Get the current release notes<br/>\n" +
        "<b>!release [note|step|test|create|status]</b> - Add a release note, step, or test<br/>\n" +
        "<b>!state</b> - Print freelock project info for this room<br/>\n" +
        "<b>!state {item} {value}</b> - Set a freelock item to value<br/>\n" +
        "<b>!status [update] [{env}]</b> - print the version of an environment - dev, stage, prod or blank for all<br/>\n";

    matrixClient.sendHtmlNotice(room.roomId, body, body);
}

/**
 *
 * @param event - Matrix m.room.message event object
 * @param room - Matrix room object
 * @param body - String body content
 */
function handleState(event, room, body) {
    var args, stateKey, item, value, states = room.currentState.getStateEvents(config.stateName);
    if (body === '!state') {
        // print com.freelock state
        for (var i=0; i< states.length; i++) {
            stateKey = states[i].getStateKey();
            item = states[i].getContent();
            value = item[stateKey];
            matrixClient.sendNotice(room.roomId, stateKey + ': ' + value);
        }

    } else {
        if (!isAdmin(event.getSender())){
            matrixClient.sendNotice(room.roomId, 'Only admins can do that!');
           return;
        }
        args = parseArgs(body, true);
        args.shift();
        stateKey = args.shift();
        value = args.shift();
        var newState = {};
        newState[stateKey] = value;

        matrixClient.sendStateEvent(room.roomId, config.stateName, newState, stateKey)
            .then(function(){
                    matrixClient.sendNotice(room.roomId, stateKey + ' set to: ' + value);
            },
            function(code,data){
                var msg = '<font color="red">There was a problem processing this request: '+code;
                console.log('Error on setting state',code,data);
                matrixClient.sendHtmlNotice(room.roomId, msg, msg);

            })
    }
}

function printStatus(event, room, body){
    var env, envstate, envs, fullAlias, alias, resetEnvs = 0, update=0, state = room.currentState.getStateEvents(config.stateName, 'alias');
    alias = state.getContent().alias;
    envstate = room.currentState.getStateEvents(config.stateName, 'envs');
    envs = envstate ? envstate.getContent().envs : [];

    var matches = body.match(/!status( update)? ?([.a-z]*)/);
    if (matches) {
        env = matches[2];
        if (matches[1]) {
            update = 1;
        }
        if (env) {
            fullAlias = '@' + alias + '.' + env;
        }
        else {
            fullAlias = '@' + alias;
            resetEnvs = 1; // reset overzealous environment pushes
        }
    } else {
        fullAlias = '@' + alias;
    }

    if (update) {
        var msg = 'Running <b>drush ' + fullAlias + ' variable-get site_version</b>.';
        matrixClient.sendHtmlNotice(room.roomId, msg, msg);

        if (resetEnvs) {
            envs = [];
        }
        var args = [fullAlias, 'vget', 'site_version', '-y'];

        // Now execute drush...
        var _ = require('underscore'); // for some utility goodness
        var spawn = require('child_process').spawn,
            drush = spawn('drush', args, {});

        drush.stdout.on('data', function (data) {
            // if data starts with alias, parse and store it..
            var currEnv, version, newState, pattern1 = "^" + alias + "\.([a-z]+)\ .*site_version: (.*)\n",
                pattern2 = /site_version: \'(.+)\'\n/,
                str = data.toString();
            var matches = str.match(pattern1);
            if (matches) {
                currEnv = matches[1];
                version = matches[2];
            } else {
                matches = str.match(pattern2);
                if (matches) {
                    currEnv = env;
                    version = matches[1];
                }
            }
            if (currEnv) {
                newState = {};
                newState[currEnv + '.version'] = version;
                matrixClient.sendStateEvent(room.roomId, config.stateName, newState, currEnv + '.version')
                    .then(function () {
                        var envstate = {};
                        msg = '<font color="green">' + currEnv + '.version set to: ' + version + '</font>';
                        matrixClient.sendHtmlNotice(room.roomId, msg, msg);
                        if (envs.indexOf(currEnv) == -1) {
                            envs.push(currEnv);
                            envstate['envs'] = envs;
                            matrixClient.sendStateEvent(room.roomId, config.stateName, envstate, 'envs')
                                .then(function () {
                                    msg = '<font color="green">Added ' + currEnv + ' to environments.</font>';
                                    matrixClient.sendHtmlNotice(room.roomId, msg, msg);
                                },
                                function(data){
                                    if (data && data.errcode && data.errcode == 'M_LIMIT_EXCEEDED') {
                                        var retryAfter = data.data.retry_after_ms;
                                        setTimeout(function(){
                                            matrixClient.sendStateEvent(room.roomId, config.stateName, envstate, 'envs')
                                                .then(function(){
                                                    msg = '<font color="green">Added ' + currEnv + ' to environments.</font>';
                                                    matrixClient.sendHtmlNotice(room.roomId, msg, msg);
                                                })
                                        }, retryAfter);
                                    } else {
                                        sendError(room, data);

                                    }
                                })
                        }

                    },
                    function(data){
                        sendError(room, data);
                    });
            } else {
                msg = 'Unknown message: <font color="green">' + data + '</font>';
                matrixClient.sendHtmlNotice(room.roomId, msg, msg);
            }

        });

        drush.stderr.on('data', function (data) {
            msg = '<font color="red">Drush returned an error: ' + data + '</font>';
            matrixClient.sendHtmlNotice(room.roomId, msg, msg);
        });
        drush.on('exit', function(code){
           console.log('drush child exited with code '+code);
        });
    } else {
        var envState, version, currEnv;
        if (env) {
            envState = room.currentState.getStateEvents(config.stateName, env+'.version');
            if (envState) {
                version = envState.getContent()[env+'.version'];
                msg = '<font color="green">' + env + ' version: ' + version + '</font>';
                matrixClient.sendHtmlNotice(room.roomId, msg, msg);
            } else {
                msg = '<font color="red">Status not collected. Run !status update...</font>';
                matrixClient.sendHtmlNotice(room.roomId, msg, msg);
            }
        } else {
            if (envs.length) {
                for (var i = 0; i < envs.length; i++) {
                    currEnv = envs[i];
                    envState = room.currentState.getStateEvents(config.stateName, currEnv + '.version');
                    version = envState.getContent()[currEnv+'.version'];
                    msg = '<font color="green">' + currEnv + ' version: ' + version + '</font>';
                    matrixClient.sendHtmlNotice(room.roomId, msg, msg);
                }
            } else {
                msg = '<font color="red">Status not collected. Run !status update...</font>';
                matrixClient.sendHtmlNotice(room.roomId, msg, msg);
            }
        }
    }

}

function login(event, room, body) {

    if (!canLogin(event.getSender())) {
        matrixClient.sendNotice(room.roomId, 'Not authorized.');
        return;
    }
    var alias, state = room.currentState.getStateEvents(config.stateName, 'alias');
    alias = state.getContent().alias;
    var env, user = '';
    var matches = body.match(/!login ([-a-z0-9_.]*)( ('|")?([-a-zA-Z0-9 _.]+)('|")?)?$/);
    if (matches) {
        env = matches[1];
        if (matches[4]) {
            user = matches[4];
        }
    }
    if (!env) {
        env = room.currentState.getStateEvents(config.stateName,'default_env');
        if (!env) {
            env = 'dev';
        }
    }
    if (user) {
      //  user = '"' + user + '"';
    }
    var fullAlias = '@'+alias+'.'+env;
    var msg = 'Running <b>drush '+fullAlias+' user-login '+ user+'</b>.';
    matrixClient.sendHtmlNotice(room.roomId, msg, msg);

    var args = [fullAlias, 'uli', '--browser=0'];
    if (user) {
        args.push(user);
    }
    // Now execute drush...
    var _ = require('underscore'); // for some utility goodness
    var spawn = require('child_process').spawn,
        drush = spawn('drush', args, {
        });

    drush.stdout.on('data', function(data){
        msg = '<font color="green">' + data + '</font>';
        matrixClient.sendHtmlNotice(room.roomId, msg, msg);
    });

    drush.stderr.on('data', function(data){
        msg = '<font color="red">Drush returned an error: ' + data + '</font>';
        matrixClient.sendHtmlNotice(room.roomId, msg, msg);
    });

    drush.on('exit', function(code){
        console.log('drush child exited with code '+code);
    });
}

function siteVersion(event,room,body) {

}


function releaseNotes(event,room,body) {
    var active, args, msg, newState, props, version, state = room.currentState.getStateEvents(config.releaseName,'');
    if (state) {
        props = state.getContent();
        active = props.active;
        version = props.version ? props.version : '';
    }

    args = parseArgs(body);
    if (args[1] == 'create' || !active) {
        if (args[1] == 'create' && args[2]) {
            version = args[2];
        } else if (version) {
            version = version.replace(/\d+$/, function(n) { return ++n });
        } else {
            msg = '<font color="red">No previous version. Please provide a version number!</font>';
            matrixClient.sendHtmlNotice(room.roomId, msg, msg);
            return;
        }
        if (args[1] == 'create' || version) {
            msg = 'Creating new release, version <b>'+version+'</b>';
            matrixClient.sendHtmlNotice(room.roomId, msg, msg);
            newState = {
                active: true,
                status: 'dev',
                version: version,
                notes: [],
                steps: [],
                tests: [],
                cases: [],
                commits: []
            };

            matrixClient.sendStateEvent(room.roomId, config.releaseName, newState)
                .then(function(){
                        matrixClient.sendNotice(room.roomId, 'New release created. ' + version);
                    },
                    function(code,data){
                        var msg = '<font color="red">There was a problem processing this request: '+code;
                        console.log('Error on setting state',code,data);
                        matrixClient.sendHtmlNotice(room.roomId, msg, msg);

                    });
            return;
        } else {
            msg = '<font color="red">No previous version. Please provide a version number!</font>';
            matrixClient.sendHtmlNotice(room.roomId, msg, msg);
            return;

        }

    }
    if (!args[1]) {
        msg = '<h2>Release '+version +'</h2>\n' +
            '<h3>Notes</h3>\n' +
            '<ul><li>' + props.notes.join('</li><li>') +
            '</li></ul>' +
            '<h3>Deployment Steps</h3>\n' +
            '<ul><li>' + props.steps.join('</li><li>') +
            '</li></ul>' +
            '<h3>Test on production after deploy</h3>\n' +
            '<ul><li>' + props.tests.join('</li><li>') +
            '</li></ul>' +
            '<h3>Cases</h3>\n' +
            '<ul><li>' + props.cases.join('</li><li>') +
            '</li></ul>' +
            '<h3>Commits</h3>\n' +
            '<ul><li>' + props.commits.join('</li><li>') +
            '</li></ul>';
        matrixClient.sendHtmlMessage(room.roomId, msg, msg);
        return;
    }
    var cmd = args[1];
    if (cmd == 'status' && !args[2]) {
        var curStatus = props.status ? props.status : 'dev';
        msg = '<font color="green">Status is <b>' + curStatus +'</b>';
        matrixClient.sendHtmlNotice(room.roomId, msg, msg);
        return;
    }
    if (!args[2]) {
        msg = '<font color="red"><b>' + cmd + '</b> requires a message to add.</font>';
        matrixClient.sendHtmlNotice(room.roomId, msg, msg);
        return;
    }
    switch (cmd) {
        case 'note':
        case 'test':
        case 'step':
        case 'case':
        case 'commit':
            msg = body.substring(args[0].length + cmd.length + 2);
            props[cmd+'s'].push(msg);
            matrixClient.sendStateEvent(room.roomId, config.releaseName, props)
                .then(function(){
                        matrixClient.sendNotice(room.roomId, 'Release '+cmd+' added to  ' + version);
                    },
                    function(code,data){
                        var msg = '<font color="red">There was a problem processing this request: '+code;
                        console.log('Error on setting state',code,data);
                        matrixClient.sendHtmlNotice(room.roomId, msg, msg);

                    });
            break;
        case 'status':
            msg = body.substring(args[0].length + cmd.length + 2);
            props[cmd] = msg;
            matrixClient.sendStateEvent(room.roomId, config.releaseName, props)
                .then(function(){
                        matrixClient.sendNotice(room.roomId, 'Release '+version + ' '+cmd+' set to  ' + msg);
                    },
                    function(code,data){
                        var msg = '<font color="red">There was a problem processing this request: '+code;
                        console.log('Error on setting state',code,data);
                        matrixClient.sendHtmlNotice(room.roomId, msg, msg);

                    });
            break;

        default:
            msg = '<font color="red">Request not recognized. Recognized release commands: create, note, step, task, commit, case, status.</font>';
            matrixClient.sendHtmlNotice(room.roomId, msg, msg);

    }

}

/**
 * Automatically join room when invited
 */
matrixClient.on("RoomMember.membership", function(event, member) {
    if (isAdmin(event.event.user_id)) {

    if (member.membership === "invite" && member.userId === config.myUserId) {
        matrixClient.joinRoom(member.roomId).done(function() {
            console.log("Auto-joined %s", member.roomId);
        });
    }
    }
});

/**
 * Execute a drush command... maintain a call queue
 *
 * @param args array of arguments to pass along to exec
 */
function exec_drush(args){

}

function sendError(room, data) {
    console.log(data);
    var msg = '<font color="red">Unknown issue: '+data+'</font>';
    matrixClient.sendHtmlNotice(room.roomId, msg, msg);
}

var parseArgs = function(str, lookForQuotes) {
    var args = [];
    var readingPart = false;
    var part = '';
    for(var i=0; i < str.length;i++) {
        if(str.charAt(i) === ' ' && !readingPart && part !='') {
            args.push(part);
            part = '';
        } else {
            if (str.charAt(i) === '\"' && lookForQuotes) {
                readingPart = !readingPart;
            } else {
                part += str.charAt(i);
            }
        }
    }

    args.push(part);
    return args;
}

matrixClient.startClient(numMessagesToShow);  // messages for each room.
