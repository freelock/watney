/**
 * Created by john on 3/29/16.
 */
"use strict";

module.exports = {
    container: null,
    setup: function(container) {
        container.bangCommands['release'] = {
            help: 'Get the current release notes or add a release note',
            args: ['note','step', 'test', 'case','commit','status','date'],
            cb: this.releaseNotes.bind(this)
        };
        container.roomUpdates.push(this.loadScheduledReleases.bind(this));
        this.container = container;
    },

    /**
     * BangCommand.
     * 
     * @param room
     * @param body
     * @param event
     */
    releaseNotes: function(room, body, event) {
        var active, args, currStatus, msg, newState, props, targetDate, jobKey,
            version, container = this.container,
            matrixClient = container.mx,
            state = room.currentState.getStateEvents(container.config.releaseName,'');
        if (state) {
            props = state.getContent();
            active = props.active;
            version = props.version ? props.version : '';
            currStatus = props.status ? props.status : 'dev';
            targetDate = props.targetDate ? props.targetDate : '';
        }

        args = container.parseArgs(body);
        if (args[1] == 'create' || !active) {
            if (args[1] == 'create' && args[2]) {
                version = args[2];
            } else if (version) {
                version = version.replace(/\d+$/, function(n) { return ++n });
            } else {
                msg = 'No previous version. Please provide a version number!';
                container.send(room, msg, 'error');
                return;
            }
            if (args[1] == 'create' || version) {
                msg = 'Creating new release, version <b>'+version+'</b>';
                container.send(room, msg);
                newState = {
                    active: true,
                    status: 'dev',
                    targetDate: '',
                    version: version,
                    notes: [],
                    steps: [],
                    tests: [],
                    cases: [],
                    commits: []
                };

                matrixClient.sendStateEvent(room.roomId, container.config.releaseName, newState)
                    .then(function(){
                            container.send(room, 'New release created. ' + version);
                        },
                        function(code,data){
                            var msg = 'There was a problem processing this request: '+code;
                            console.log('Error on setting state',code,data);
                            container.send(room, msg,'error');

                        });
                return;
            } else {
                msg = 'No previous version. Please provide a version number!';
                container.send(room, msg,'error');
                return;

            }

        }
        if (!args[1]) {
            msg = '<h2>Release '+version +'</h2>\n' +
                '<h3>Status: '+ currStatus +'</h3>\n' +
                '<h3>Target Release: '+ targetDate +'</h3>\n' +
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
            container.send(room, msg);
            return;
        }
        var cmd = args[1];
        if (!args[2]) {
            switch (cmd){
                case 'status':
                    msg = 'Status is <b>' + currStatus + '</b>';
                    container.send(room, msg, 'green');
                    break;
                case 'date':
                    msg = 'Release date is <b>' + targetDate + '</b>';
                    container.send(room, msg, 'green');
                    break;
                default:
                    msg = '<b>' + cmd + '</b> requires a message to add.';
                    container.send(room, msg, 'error');
            }
            return;
        }
        if (cmd != 'status' && cmd != 'date' && currStatus.match(/released|stage/)) {
            msg = '<b>Release has shipped, and can no longer be modified.</b>';
            container.send(room, msg, 'error');
            return;
        }
        switch (cmd) {
            case 'date':
                msg = body.substring(args[0].length + cmd.length + 2);
                props.targetDate = Date.future(msg);
                if (!props.targetDate){
                    container.send(room, 'Sorry, I could not understand that date!', 'error');
                    return;
                }
                jobKey = 'release-'+room.name;
                var scheduler = require('node-schedule');
                container.scheduledJobs[jobKey] = scheduler.scheduleJob(props.targetDate, this.notifyRelease.bind(this, room));
                msg = 'Release '+version+' date set to ' + props.targetDate;
                break;
            case 'note':
            case 'test':
            case 'step':
            case 'case':
            case 'commit':
                msg = body.substring(args[0].length + cmd.length + 2);
                var arr = msg.split("\n");
                for (var i=0; i<arr.length; i++) {
                    props[cmd + 's'].push(arr[i]);
                }
                console.log(props);
                msg = 'Release '+cmd+' added to  ' + version;
                break;
            case 'status':
                msg = body.substring(args[0].length + cmd.length + 2);
                if (!msg.match(/(released|dev|stage)/)) {
                    msg = '<font color="red">Valid statuses are: <b>dev, stage, or released</b>.</font>';
                    container.send(room, msg);
                    return;
                }
                props[cmd] = msg;
                msg = 'Release '+version + ' '+cmd+' set to  ' + msg;
                break;

            default:
                msg = 'Request not recognized. Recognized release commands: create, date, note, step, task, commit, case, status.';
                container.send(room, msg, 'error');
                return;

        }
        matrixClient.sendStateEvent(room.roomId, container.config.releaseName, props)
            .then(function(){
                    container.send(room, msg);
                },
                function(code,data){
                    var msg = 'There was a problem processing this request: '+code;
                    console.log('Error on setting state',code,data);
                    container.send(room, msg);

                });

    },

    /**
     * Called when roomlist changes, e.g. at startup.
     * 
     * Populates the schedule with the current release notifications.
     */
    loadScheduledReleases: function() {
        var state, props, targetDate, jobKey, container = this.container,
            schedule = require('node-schedule');
        container.roomList.forEach(function(room){
            state = room.currentState.getStateEvents(container.config.releaseName,'');
            if (state) {
                props = state.getContent();
                targetDate = props.targetDate ? Date.create(props.targetDate) : false;
                jobKey = 'release-'+room.name;
                if (targetDate) {
                    if (container.scheduledJobs[jobKey]){
                        container.scheduledJobs[jobKey].cancel();
                    }
                    container.scheduledJobs[jobKey] = schedule.scheduleJob(targetDate, this.notifyRelease.bind(this, room));
                }
            }

        }, this);

    },

    /**
     * Load the current release from the room state.
     * 
     * @param room
     * @return object
     */
    getCurrRelease: function(room) {
        var props, container = this.container, releaseState = room.currentState.getStateEvents(container.config.releaseName,'');
        if (releaseState) {
            props = releaseState.getContent();
            var roomState = room.currentState.getStateEvents(container.config.stateName,'releaseManager');
            props.releaseManager = roomState ? roomState.getContent().releaseManager : 'John';
            return props;
        }
        return false;
    },

    /**
     * Callback run when scheduled time is reached.
     * @param room
     */
    notifyRelease: function(room){
        var release = this.getCurrRelease(room);
        var Notice = "<b>{releaseManager}: Release time reached for {version}!</b> Current status: {status}";
        // use "message" type to bing release manager
        this.container.send(room, Notice.assign(release), 'message');
    }
};