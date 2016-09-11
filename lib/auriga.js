/**
 * Created by john on 9/10/16.
 */
"use strict";

var Sugar = require('sugar');
module.exports = {
    container: null,
    setup: function(container) {

        container.bangCommands['timer'] = {
            help: 'Start, stop, or check your current timer. Use today for list of today timers, send a task id to start a task',
            args: ['help','start','stop', 'get', 'today', 'set', '[username]'],
            cb: this.setAction.bind(this)
        };
        container.bangCommands['auriga'] = {
            help: 'Show active projects, show/create tasks for this account',
            args: ['projects', 'tasks', 'create'],
            cb: this.setAction.bind(this)
        };
        this.container = container;

    },

    /**
     * BangCommand.
     *
     * @param room
     * @param body
     * @param event
     */
    setAction: function(room, body, event) {
        var container = this.container, state, alias, matches,
            user = event.getSender(),
            args = container.parseArgs(body),
            sendObj = { view: 'json' };
        state = room.currentState.getStateEvents(container.config.stateName, 'alias');
        if (state) {
            alias = state.getContent().alias;
        }
        if (matches = user.match(/^@(.*):matrix.freelock.com$/)) {
            sendObj.bot_user = matches[1];
        } else {
            this.container.send(room, 'You are not a recognized freelock user.');
            return;
        }

        if (args[0] == '!timer') {
            switch (args[1]) {
                case 'help':
                    this.help(room, args);
                    break;
                case 'start':
                    sendObj.action = 'start';
                    if (args[2]) {
                        if (args[2] > 0) {
                            sendObj.task_id = args[2];
                        } else if (args[2] == "temp") {
                            // don't set a task_id -- creates temp task
                        } else {
                            sendObj.task_id = this.getTaskId(room,args[2]);
                            if (!sendObj.task_id) {
                                container.send(room, 'Task ' + args[2]+' not found. Please use <b>!state task_'+args[2]+
                                    ' [task_id]</b> in this or the Freelock room to set this alias.');
                                return;
                            }
                        }
                    } else {
                        sendObj.task_id = this.getDefaultTimer(sendObj.bot_user);
                    }
                    this.post(room, 'timer', sendObj, this.formatTimer.bind(this));
                    break;
                case 'stop':
                    sendObj.action = 'stop';
                    this.post(room, 'timer', sendObj, this.formatTimer.bind(this));
                    break;
                case 'set':
                    container.send(room, 'Set is not actually implemented yet.');
                    break;
                case 'today':
                    if (args[2]){
                        sendObj.bot_user = args[2];
                    }
                    this.get(room, 'tasklist/today', sendObj, this.formatTasklist.bind(this));
                    break;
                case 'get':
                default:
                    if (args[1]) {
                        if (args[1] != 'get') {
                            sendObj.bot_user = args[1];
                        } else if (args[2]) {
                            sendObj.bot_user = args[2];
                        }
                    }
                    this.get(room, 'timer', sendObj, this.formatTimer.bind(this));

            }
            return;
        }
        if (!alias) {
            this.container.send(room, 'No alias/site configured here!');
            return;
        }

        if (!args[1]) {
            this.help(room, args);
            return;
        }

        sendObj.alias = alias;
        switch (args[1]) {
            case 'projects':
                sendObj.active = 'true';
                this.get(room, 'project', sendObj, this.formatProjects.bind(this));
                break;
            case 'tasks':
                sendObj.complete = 0;
                if (args[2]) {
                    if (args[2] > 0) {
                        sendObj.project_id = args[2];
                    }
                }
                this.get(room, 'task', sendObj, this.formatTasks.bind(this));
                break;
            case 'create':
                break;

            case 'help':
            default:
                this.help(room, args);
                return;
        }

    },

    formatTimer: function(room, dataString) {
        var data = JSON.parse(dataString), msg, type;

        if (data.state == 'stop') {
            msg = 'Timer for {user_id} is stopped.';
            type = 'redmessage';

        } else {
            data.time = Sugar.Date.relative(Sugar.Date.create(data.serverStart * 1000));
            if (data.type == 'T') {
                // temporary task
                msg = '{user_id}: <b>{task_id}</b> Temporary Timer, started {time}';

            } else {
                msg = '{user_id}: <b>{task_id}</b> started {time}, <b>{task}</b> - {project} ({account})';

            }

        }
        this.container.send(room, Sugar.String.format(msg,data), type);

    },

    formatTasklist: function(room, dataString, postData) {
        var data = JSON.parse(dataString), total = 0;
        var body = Sugar.String.format('Tasklist for {bot_user}: <br/><ul>', postData), i;

        for (i=0;i<data.children.length; i++){
            body += Sugar.String.format('<li><b>{task_id}</b> {type}: <b>{task}</b> - {project} ({account}): <b>{today_actual}</b></li>', data.children[i]);
            total += 1 * data.children[i].today_actual
        }
        body += '</ul>';
        body += Sugar.String.format('Total time: {0}', total);
        this.container.send(room, body);
    },

    formatProjects: function(room, dataString, postData) {
        var data = JSON.parse(dataString), total = 0;
        var body = Sugar.String.format('Projects for {alias}: <br/><ul>', postData), i;

        for (i=0; i< data.length; i++) {
            body += Sugar.String.format('<li><b>{project_id}</b> {project}</li>', data[i]);

        }
        body += '</ul>';

        this.container.send(room, body);
    },

    formatTasks: function(room, dataString, postData) {
        var data = JSON.parse(dataString), total = 0;
        var body, i,
            template = '<li><b>{task_id}</b> {name} - {project}</li>';
        if (postData.project_id) {
            if (data[0]) {
                body = Sugar.String.format('Open Tasks for {0}: <br/><ul>', data[0].project);
                template = '<li><b>{task_id}</b> {name}</li>';
            }
            else {
                this.container.send(room, 'No tasks defined for that project.');
                return;
            }
        } else {
            body = Sugar.String.format('Open Tasks for {alias}: <br/><ul>', postData), i;
        }

        for (i=0; i< data.length; i++) {
            body += Sugar.String.format(template, data[i]);

        }
        body += '</ul>';

        this.container.send(room, body);
    },
    getTaskId: function(room, alias) {
        var container = this.container,
            state = room.currentState.getStateEvents(container.config.stateName, 'task_' + alias);
        if (state) {
            return state.getContent()['task_'+alias];
        }
        var homeroom = Sugar.Array.find(container.roomList, function(room) {
                return room.roomId == container.config.homeroom;
            });
        if (homeroom) {
            state = homeroom.currentState.getStateEvents(container.config.stateName, 'task_' + alias);
            if (state) {
                return state.getContent()['task_'+alias];
            }
        }
        return false;
    },
    /**
     * Get default timer for user
     *
     * This is stored in the "freelock" room state
     * as [user_id].default_task
     *
     * @param user_id
     */
    getDefaultTimer: function(user_id) {
        var container = this.container, state, task,
            homeroom = Sugar.Array.find(container.roomList, function(room) {
                return room.roomId == container.config.homeroom;
            });
        if (homeroom){
            state = homeroom.currentState.getStateEvents(container.config.stateName, user_id+'_default_task');
            task = state.getContent()[user_id + '_default_task'];
            }
        return task;

    },

    post: function(room, endpoint, data, callback) {
        var https = require('https'),
            container = this.container;

        var postData = Sugar.Object.toQueryString(data);

        var options = Sugar.Object.clone(this.container.config.auriga);
        options.method = 'POST';
        options.headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        };
        options.path += endpoint;

        if (!callback) {
            callback = function(room, dataString) {
                container.send(room,dataString);
            }
        }

        var req = https.request(options, function(response){
            var body = '';
            response.on('data', function(d){
                body += d;
            });
            response.on('end', function(){
                callback(room, body, data);
            })

        });

        /* @var https.clientRequest req */
        req.on('error', function(e) {
            container.send(room, 'problem with request: ${e.message}', 'error');
        });

        req.write(postData);
        req.end();

    },

    get: function(room, endpoint, params, callback) {
        var https = require('https'),
            container = this.container;
        var options = Sugar.Object.clone(this.container.config.auriga);

        options.headers = {
            'Content-Type': 'application/json'
        };
        options.path += endpoint;
        if (params) {
            options.path += '?' + Sugar.Object.toQueryString(params);
        }
        if (!callback) {
            callback = function(room, dataString) {
                container.send(room, dataString);
            }
        }
        var req = https.get(options, function(response){
            var body = '';
            response.on('data', function(d){
                body += d;
            });
            response.on('end', function(){
                callback(room, body, params);
            })

        });

        /* @var https.clientRequest req */
        req.on('error', function(e) {
            container.send(room, 'problem with request: ${e.message}', 'error');
        });


    },

    /**
     * More help on commands...
     *
     * @param args Command sent
     *
     * args[0] - base command
     * args[1] - 'help'
     * args[2] - specific sub command
     */
    help: function(room, args) {
        switch (args[0]) {
            case '!timer':
                this.container.send(room, 'Timer actions:' +
                    '<ul>' +
                    '<li><b>start</b> Start a temporary task</li>' +
                    '<li><b>start [task id]</b> Start timer on task with this id</li>' +
                    '<li><b>start [task alias]</b> Start timer on task with this alias, set per room or in the Freelock homeroom</li>' +
                    '<li><b>stop</b> Stop your timer</li>' +
                    '<li><b>get</b> (or blank) - show your current timer</li>' +
                    '<li><b>get [username]</b> (or [username]) - show the timer for another user</li>' +
                    '<li><b>today</b> - get a list of tasks you have on today (in Auriga)</li>' +
                    '<li><b>set [task id]</b> Set the current temporary timer to [task_id]</li>' +
                    '</ul>');
                return;

                break;
            case '!auriga':
                this.container.send(room, 'Auriga actions:' +
                    '<ul>' +
                    '<li><b>projects</b> List projects available in this room</li>' +
                    '<li><b>tasks</b> List open tasks for this account</li>' +
                    '<li><b>tasks [project_id]</b> List open tasks for this project</li>' +
                    '<li><b>create task [project_id] "Task name"</b> Creates a single task in the auriga project. Be sure to use quotes!</li>' +
                    '</ul>');
        }
    }


};
