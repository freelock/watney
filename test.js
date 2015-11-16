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
  var localmatch = user_id.match(/@(.*):matrix\.freelock\.com/);
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
        "<b>!state</b> - Print freelock project info for this room<br/>\n" +
        "<b>!state {item} {value}</b> - Set a freelock item to value<br/>\n" +
        "<b>!status [{env}]</b> - print the status of an environment - dev, stage, prod or blank for all<br/>\n";
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
                msg = '<font color="red">There was a problem processing this request: '+code;
                console.log('Error on setting state',code,data);
                matrixClient.sendHtmlNotice(room.roomId, msg, msg);

            })
    }
}

function login(event, room, body) {

    var alias, state = room.currentState.getStateEvents(config.stateName, 'alias');
    alias = state.getContent().alias;
    var env, user = '';
    var matches = body.match(/!login ([a-z]*)( ('|")?([a-zA-Z0-9 _-]+)('|")?)?$/);
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
        user = '"' + user + '"';
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

}

/**
 * Automatically join room when invited
 */
matrixClient.on("RoomMember.membership", function(event, member) {
    if (member.membership === "invite" && member.userId === config.myUserId) {
        matrixClient.joinRoom(member.roomId).done(function() {
            console.log("Auto-joined %s", member.roomId);
        });
    }
});

/**
 * Execute a drush command... maintain a call queue
 *
 * @param args array of arguments to pass along to exec
 */
function exec_drush(args){

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
