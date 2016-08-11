/**
 * Created by john on 3/29/16.
 */
"use strict";

module.exports = {
    container: null,
    setup: function(container) {

        container.bangCommands['concourse'] = {
            help: 'Set up concourse pipeline, kick off tests -- update, wraith, test',
            args: ['update','wraith', 'test', 'bump'],
            cb: this.setConcourse.bind(this)
        };
        container.bangCommands['deploy'] = {
            help: 'Run deployment commands - stagedb, devdb',
            args: ['stagedb', 'devdb', 'prod'],
            cb: this.setConcourse.bind(this)
        };


        container.senderCommands['@concourse:matrix.freelock.com'] =
            this.concourseMessage.bind(this);

        // Get notified of commits...
        container.PubSub.subscribe('commit',
            this.activatePipeline.bind(this)
        );
        this.container = container;

        this.flyLogin();

        setInterval(this.flyLogin.bind(this), 8*3600*1000);

    },

    /**
     * BangCommand.
     *
     * @param room
     * @param body
     * @param event
     */
    setConcourse: function(room, body, event) {
        var container = this.container,
            args = container.parseArgs(body);
        var state = room.currentState.getStateEvents(container.config.stateName, 'alias'),
            alias = state.getContent().alias;

        if (!alias) {
            this.container.send(room, 'No alias/site configured here!');
            return;
        }

        if (!args[1]) {
            var self = this;
            var exec = require('child_process').exec;
            exec('fly -t concourse pipelines|grep "^'+alias+'\ "',
              function(err,stdout,stderr) {
                  if (err) {
                      self.container.send(room, 'Concourse is not set up for this project.','error');
                  } else {
                      self.container.send(room, 'A concourse pipeline is set up.');
                  }
              }
            );

            return;
        }

        switch (args[1]) {
            case 'update':
                this.setPipeline(room, body, alias);
                break;
            case 'wraith':
                this.triggerJob(room, body, alias, 'run-wraith');
                break;
            case 'stagedb':
                this.triggerJob(room, body, alias, 'import-db-stage');
                break;
            case 'devdb':
                this.triggerJob(room, body, alias, 'import-db-dev');
                break;
            case 'bump':
                this.triggerJob(room, body, alias, 'patch');
                break;
            case 'prod':
                this.triggerJob(room, body, alias, 'deploy-code-prod');
                break;

            case 'test':
                this.triggerJob(room, body, alias, 'run-behat');
                break;
        }

    },


    setPipeline: function(room, body, alias, cb){
        var self = this, args = [
            alias,
            this.container.config.concourseCredentials
        ];

        var spawn = require('child_process').spawn,
            fly = spawn('./set_pipeline.sh', args, {
                cwd: this.container.config.concourseDir
            }),
            util = require('util');

        fly.stdout.on('data', function(data){
            console.log('stdout:' + data);
        });

        fly.stderr.on('data', function(data){
            console.error('stderr:' +data);
        });

        fly.on('exit', function(code){
            if (code > 0) {
                self.container.send(room, 'Error setting pipeline. Check watney log.');

            }else {
                self.container.send(room, 'Pipeline enabled!');
            }
            if (util.isFunction(cb)){
                cb(code);
            }
        });

    },

    triggerJob: function(room, body, alias, job) {
        var args = [
            '-j',
            alias + '/' + job
        ];
        this.activatePipeline('triggerJob',{alias:alias, branch:'develop'}, 60, this.flyCommand.bind(this,'trigger-job',args));

    },

    pausePipeline: function(alias) {
        var args = [
            '-p',
            alias
        ];
        this.flyCommand('pause-pipeline', args);
    },

    /**
     * Logins last approximately 12 hours.
     *
     * Log in at startup, and again every 8 hours.
     * Note: you must first log in on the shell with the full syntax - e.g.
     *
     * fly -t concourse login --concourse-url= http://path-to-concourse:8080.
     *
     * Set credentials in the app config.js, concourseUser and concoursePass
     */
    flyLogin: function() {
        var 
            args = [
            '--username',
            this.container.config.concourseUser,
            '--password',
            this.container.config.concoursePass
        ];

        console.log('Logging in with fly');

        this.flyCommand('login', args);
    },

    /**
     * Execute a fly command
     *
     * @param command Command to execute
     * @param args Args to pass to fly
     * @param complete Callback to call when command is complete
     * @param err Callback to call with stderr data
     * @param data_cb Callback to call with stdout data
     */
    flyCommand: function(command, args, complete, err, data_cb) {
        args.unshift(command);
        args.unshift('concourse');
        args.unshift('-t');

        var spawn = require('child_process').spawn,
            fly = spawn('fly', args, {
            }),
            util = require('util');

        fly.stdout.on('data', function(data){
            console.log('stdout:'+data);
            if (util.isFunction(data_cb)) {
                data_cb(data);
            }
        });

        fly.stderr.on('data', function(data){
            console.error('stderr:'+data);
            if (util.isFunction(err)){
                err(data);
            }
        });

        fly.on('exit', function(code){
            console.log('fly login exited with code '+code);
            if (util.isFunction(complete)) {
                complete(code);
            }
        });

    },

    /**
     * Pubsub callback for "commit" messages.
     *
     * @param topic Pubsub topic that matched
     * @param data object containing alias, old, new, ref, branch
     * @param minutes integer number of minutes to activate
     * @param function Callback to call when operation has data
     */
    activatePipeline: function(topic, data, minutes, cb) {
        var room,
            util = require('util');
        // First check if alias is one of our known rooms...
        if (room = this.container.roomsByAlias[data.alias]) {
            // sugar shorthand -- don't enable for non-magic branches
            if (['develop','release','master'].any(data.branch)) {
                if (!minutes) {
                    minutes = 60;
                }
                var scheduler = require('node-schedule');
                var expires = Date.create().addMinutes(minutes);
                var jobKey = 'pipeline-'+data.alias;
                if (this.container.scheduledJobs[jobKey]) {
                    this.container.scheduledJobs[jobKey].cancel();
                    this.container.scheduledJobs[jobKey] = scheduler.scheduleJob(expires, this.deactivatePipeline.bind(this,data));
                    if (util.isFunction(cb)) {
                        cb();
                    }
                } else {
                    this.container.scheduledJobs[jobKey] = scheduler.scheduleJob(expires, this.deactivatePipeline.bind(this,data));
                    this.setPipeline(room, 'gitCommit', data.alias, cb);
                }

            } else {
                util.isFunction(cb) && cb();
            }
        } else {
            util.isFunction(cb) && cb();
        }

    },

    /**
     * Deactivate pipeline when timeout expires
     *
     * @param data
     */
    deactivatePipeline: function(data) {
        this.pausePipeline(data.alias);
        var jobKey = 'pipeline-' + data.alias;
        delete(this.container.scheduledJobs[jobKey]);
    },

    /**
    * Forward concourse notifications to room
    * @param event
    * @param room
    * @param body
    *
    * Concourse message: alias|job|build|trigger|message
    */
    concourseMessage: function(room, body, event) {
        var regexp = /^([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^]*)$/;
        var matches = body.match(regexp), container = this.container,
            alias, job, build, trigger,
            message, version, data;
        if (matches) {
            alias = matches[1];
            job = matches[2];
            build = matches[3];
            trigger = matches[4];
            message = matches[5];
            if (room = container.roomsByAlias[alias]) {
                var type = 'notice';
                if (trigger == 'data') {
                    // if data, message is a json string
                    message = message.trim();
                    message = message.replace(/\n/g,'\\n').replace(/"/g, '\"');
                    console.log('message data:',message);
                    data = JSON.parse(message);
                    message = false;

                    // sugarjs helper method
                    Object.each(data, function(key, value){
                       switch (key) {
                           case 'production_features':
                           case 'production_config':
                           case 'production_fs':
                           case 'production_branch':
                           case 'production_deploy':
                           case 'stage_lastdb':
                           case 'dev_lastdb':
                           case 'dev_branch':
                           case 'dev_fs':
                           case 'dev_features':
                           case 'dev_config':
                           case 'state':
                               container.setState(room, container.config.stateName, value, key);
                               break;
                           case 'version':
                               // Publish data to "version" topic
                               data.alias = matches[1];
                               data.room = room;
                               container.PubSub.publish('version', data);
                               if (job == 'deploy-code-prod') {
                                   // Wait for other state to set up
                                   container.PubSub.publish('newRelease', data);
                               }
                               break;
                           case 'message':
                               message = value;
                               break;
                           case 'type':
                               trigger = value;
                               break;
                           // ignore these
                           case 'alias':
                           case 'room':
                           case 'commits': // handled in version
                               break;
                           default:
                               console.log('unrecognized data:',key,value);
                       }
                    });
                    

                    // if "message" key, send as usual, otherwise exit here
                    if (!message) {
                        return;
                    }

                }
                switch (trigger) {
                    case 'end':
                        type = 'greenMessage';
                        break;
                    case 'fail':
                        type = 'error';
                        break;
                }
                container.send(room, message, type);
            }
        }

    }
};
