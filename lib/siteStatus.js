/**
 * Created by john on 3/28/16.
 */
"use strict";

module.exports = {
    container: null,

    setup: function(container) {
        container.bangCommands['status'] = {
            'help': 'print or update the version of an environment',
            'args': ['update {env}'],
            cb: this.printStatus.bind(this)
        };
        container.bangCommands['room'] = {
            'help': 'print rooms this bot is in',
            cb: this.printRooms.bind(this)
        };
        this.container = container;
    },

    printStatus: function(event, room, body) {
        var env, envstate, envs, fullAlias, alias, resetEnvs = 0,
            update=0, container = this.container, msg,
            matrixClient = container.mx,
            state = room.currentState.getStateEvents(container.config.stateName, 'alias');
        alias = state.getContent().alias;
        envstate = room.currentState.getStateEvents(container.config.stateName, 'envs');
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
            msg = 'Running <b>drush ' + fullAlias + ' variable-get site_version</b>.';
            this.container.send(room, msg);

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
                    matrixClient.sendStateEvent(room.roomId, container.config.stateName, newState, currEnv + '.version')
                        .then(function () {
                                var envstate = {};
                                msg = currEnv + '.version set to: ' + version;
                                container.send(room, msg, 'green');
                                if (envs.indexOf(currEnv) == -1) {
                                    envs.push(currEnv);
                                    envstate['envs'] = envs;
                                    matrixClient.sendStateEvent(room.roomId, container.config.stateName, envstate, 'envs')
                                        .then(function () {
                                                msg = 'Added ' + currEnv + ' to environments.';
                                                container.send(room, msg, 'green');
                                            },
                                            function(data){
                                                if (data && data.errcode && data.errcode == 'M_LIMIT_EXCEEDED') {
                                                    var retryAfter = data.data.retry_after_ms;
                                                    setTimeout(function(){
                                                        matrixClient.sendStateEvent(room.roomId, container.config.stateName, envstate, 'envs')
                                                            .then(function(){
                                                                msg = 'Added ' + currEnv + ' to environments.';
                                                                container.send(room, msg, 'green');
                                                            })
                                                    }, retryAfter);
                                                } else {
                                                    container.send(room, data, 'error');

                                                }
                                            })
                                }

                            },
                            function(data){
                                container.send(room, data, 'error');
                            });
                } else {
                    msg = 'Unknown message: ' + data;
                    container.send(room, msg, 'error');
                }

            });

            drush.stderr.on('data', function (data) {
                msg = 'Drush returned an error: ' + data;
                container.send(room, msg, 'error');
            });
            drush.on('exit', function(code){
                console.log('drush child exited with code '+code);
            });
        } else {
            var envState, version, currEnv;
            if (env) {
                envState = room.currentState.getStateEvents(container.config.stateName, env+'.version');
                if (envState) {
                    version = envState.getContent()[env+'.version'];
                    msg =  env + ' version: ' + version;
                    container.send(room, msg, 'green');
                } else {
                    msg = 'Status not collected. Run !status update...';
                    container.send(room, msg, 'error');
                }
            } else {
                if (envs.length) {
                    for (var i = 0; i < envs.length; i++) {
                        currEnv = envs[i];
                        envState = room.currentState.getStateEvents(container.config.stateName, currEnv + '.version');
                        version = envState.getContent()[currEnv+'.version'];
                        msg = currEnv + ' version: ' + version;
                        container.send(room, msg, 'green');
                    }
                } else {
                    msg = 'Status not collected. Run !status update...';
                    container.send(room, msg, 'error');
                }
            }
        }

    },

    printRooms: function(event, room, body) {
        var container = this.container;
        var roomHtml = [], msg, i;
        for (i=0; i<container.roomList.length;i++) {
            roomHtml.push(container.roomList[i].name);
        }
        msg = "<ul><li>" + roomHtml.join("</li>\n<li>") + "</li></ul>";
        container.send(room, msg);
        console.log(container.roomsByAlias);

    }
};