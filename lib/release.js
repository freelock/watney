/**
 * Created by john on 3/29/16.
 */
"use strict";

module.exports = {
    container: null,
    setup: function(container) {
        container.bangCommands['release'] = {
            help: 'Get the current release notes or add a release note',
            args: ['note','step', 'test', 'case','commit','status'],
            cb: this.releaseNotes.bind(this)
        };
        this.container = container;
    },
    
    releaseNotes: function(event, room, body) {
        var active, args, currStatus, msg, newState, props, 
            version, container = this.container,
            matrixClient = container.mx,
            state = room.currentState.getStateEvents(container.config.releaseName,'');
        if (state) {
            props = state.getContent();
            active = props.active;
            version = props.version ? props.version : '';
            currStatus = props.status ? props.status : 'dev';
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
        if (cmd == 'status' && !args[2]) {
            msg = 'Status is <b>' + currStatus;
            container.send(room, msg, 'green');
            return;
        }
        if (!args[2]) {
            msg = '<b>' + cmd + '</b> requires a message to add.';
            container.send(room, msg, 'error');
            return;
        }
        if (cmd != 'status' && currStatus.match(/released/)) {
            msg = '<b>Release has shipped, and can no longer be modified.</b>';
            container.send(room, msg, 'error');
            return;
        }
        switch (cmd) {
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
                matrixClient.sendStateEvent(room.roomId, container.config.releaseName, props)
                    .then(function(){
                            container.send(room, 'Release '+cmd+' added to  ' + version);
                        },
                        function(data){
                            if (data && data.errcode && data.errcode == 'M_LIMIT_EXCEEDED') {
                                var retryAfter = data.data.retry_after_ms + 100;
                                setTimeout(function(){
                                    matrixClient.sendStateEvent(room.roomId, container.config.stateName, envstate, 'envs')
                                        .then(function(){
                                            msg = 'Added ' + currEnv + ' to environments.';
                                            container.send(room, msg, 'green');
                                        })
                                }, retryAfter);
                            } else {
                                container.send(room, data);

                            }
                        });
                console.log(props);
                break;
            case 'status':
                msg = body.substring(args[0].length + cmd.length + 2);
                if (!msg.match(/(released|dev|stage)/)) {
                    msg = '<font color="red">Valid statuses are: <b>dev, stage, or released</b>.</font>';
                    container.send(room, msg);
                    return;
                }
                props[cmd] = msg;
                matrixClient.sendStateEvent(room.roomId, container.config.releaseName, props)
                    .then(function(){
                            container.send(room, 'Release '+version + ' '+cmd+' set to  ' + msg);
                        },
                        function(code,data){
                            var msg = 'There was a problem processing this request: '+code;
                            console.log('Error on setting state',code,data);
                            container.send(room, msg);

                        });
                break;

            default:
                msg = 'Request not recognized. Recognized release commands: create, note, step, task, commit, case, status.';
                container.send(room, msg, 'error');

        }
        
    }
};