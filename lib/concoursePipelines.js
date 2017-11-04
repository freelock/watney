/**
 * Created by john on 3/29/16.
 */
"use strict";

var Sugar = require('sugar');
module.exports = {
    container: null,
    setup: function(container) {

        container.bangCommands['concourse'] = {
            help: 'Set up concourse pipeline, kick off tests -- update, wraith, test',
            args: ['update','wraith', 'test', 'bump'],
            cb: this.setAction.bind(this)
        };
        container.bangCommands['deploy'] = {
            help: 'Run deployment commands - check, prod',
            args: ['prod', 'check'],
            cb: this.setAction.bind(this)
        };

        container.bangCommands['db'] = {
            help: 'Run database commands - export prod, export stage, import stage, import dev',
            args: ['export', 'import'],
            cb: this.setAction.bind(this)
        };

        container.bangCommands['queue'] = {
            help: 'View/manage concourse job queue',
            args: ['list', 'kill', 'bump', 'add'],
            cb: this.setAction.bind(this)
        };

        container.bangCommands['test'] = {
            help: 'Run or approve tests',
            args: ['approve', 'behat', 'wraith'],
            cb: this.setAction.bind(this)
        };

        container.senderCommands['@concourse:matrix.freelock.com'] =
            this.concourseMessage.bind(this);

        // Get notified of commits...
        container.PubSub.subscribe('commit',
            this.activatePipeline.bind(this)
        );

        // Trigger a release...
        container.PubSub.subscribe('deploy.prod',
            this.deployProd.bind(this)
        );
        this.container = container;

        this.flyLogin();

        setInterval(this.flyLogin.bind(this), 8*3600*1000);

        var schedule = require('node-schedule');

        schedule.scheduleJob('13 0 * * *', this.checkClean.bind(this));

    },

    maxJobs: 1,
    /**
     * BangCommand.
     *
     * @param room
     * @param body
     * @param event
     */
    setAction: function(room, body, event) {
        var container = this.container,
            args = container.parseArgs(body);
        var state = room.currentState.getStateEvents(container.config.stateName, 'alias'),
            alias, item, i, job, found, finish, self;
        if (state) {
            alias = state.getContent().alias;
        }

        if (!alias) {
            if (args[0] != '!queue') {
                this.container.send(room, 'No alias/site configured here!');
                return;
            }
        }

        if (!args[1]) {
            var self = this;
            if (args[0] == '!queue') {
                args[1] = 'list';

            } else {

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
        }

        switch (args[1]) {
            case 'list': // queue list
                var message = '', template = "<li>{jobId}: {alias} / {job} - end: {finish}</li>";
                if (Sugar.Object.keys(this.currentJob).length) {
                    message += "<h3>Current Jobs:</h3>\n<ul>";
                    Sugar.Object.forEach(this.currentJob, function(item) {
                        message += Sugar.String.format(template, item);
                    });
                    message += '</ul>';
                }
                if (this.jobQueue.length) {
                    message += "<h3>Queued Jobs:</h3>\n<ul>";
                    this.jobQueue.forEach(function(item){
                        message += Sugar.String.format(template, item);
                    });
                    message += '</ul>';
                }
                if (!message.length) {
                    message = 'There are no jobs in the queue.';
                }
                this.container.send(room, message);

                break;
            case 'update':
                this.setPipeline(room, body, alias);
                break;
            case 'wraith':
                switch (args[2]) {
                    case 'dev':
                        this.queueJob(alias, 'wraith-dev-prod', 'extract-results-wraith', 0);
                        break;
                    default:
                        this.queueJob(alias, 'run-wraith', 'extract-results-wraith', 0);
                }
                break;
            case 'export':
                switch (args[2]) {
                    case 'stage':
                        this.queueJob(alias, 'export-db-stage', 'import-db-dev', 0);
                        break;
                    case 'prod':
                        this.queueJob(alias, 'export-db-prod', 'sanitize-stage', 0);
                        break;
                    default:
                        this.container.send(room, 'You can export either stage, or prod.');
                }
                break;
            case 'import':
                switch (args[2]) {
                    case 'stage':
                        this.queueJob(alias, 'import-db-stage', 'sanitize-stage', 0);
                        break;
                    case 'dev':
                        this.queueJob(alias, 'import-db-dev', 'import-db-dev', 0);
                        break;
                    default:
                        this.container.send(room, 'You can import either stage (from prod), or dev (from stage).');
                }
                break;
            case 'bump':
                if (args[0] == '!queue') {
                    if (args[2] > 0) {
                        found = 0;
                        for (i=0;i<this.jobQueue.length;i++) {
                            if (this.jobQueue[i].jobId == args[2]) {
                                found=1;
                                if (i == 0) {
                                    this.container.send(room, "Job is already next in queue.");
                                    break;
                                }
                                item = this.jobQueue.splice(i,1).pop();
                                this.jobQueue.unshift(item);
                                this.container.send(room, Sugar.String.format('{alias}/{job} bumped to next in queue.', item));
                                break;
                            }
                        }
                        if (!found) {
                            this.container.send(room, 'Job not found. Use JobID from !queue list.');
                        }
                    } else {
                        this.container.send(room, 'Job not specified. Use JobID from !queue list.');
                    }
                } else {
                    this.queueJob(alias, 'patch', 'sanitize-stage', 0);
                }
                break;
            case 'add': // !queue add job finish
                if (args[2]){
                    if (alias) {
                        job = args[2];
                        finish = args[3] ? args[3] : job;
                    } else {
                        alias = args[2];
                        job = args[3];
                        finish = args[4] ? args[4] : job;
                    }
                    this.queueJob(alias, job, finish);
                    this.container.send(room, 'Job queued.');
                }
                break;
            case 'all': // Queue up nightly jobs manually
                this.checkClean();
                break;
            case 'max': // queue max jobs
                if (args[2] > 0) {
                    this.maxJobs = args[2];
                }
                container.send(room, 'MaxJobs: '+this.maxJobs);
                break;
            case 'kill':
                found = 0;
                self = this;
                if (args[2]){
                    if (args[2] > 0) {
                        // then find jobId in list and delete.
                        Sugar.Object.forEach(this.currentJob, function(item, key) {
                            if (item.jobId == args[2]) {
                                setTimeout(self.startNextJob.bind(self),1);
                                container.send(room,
                                    Sugar.String.format('Job {alias} / {job} canceled. Starting next job...', item));
                                found = 1;
                                delete self.currentJob[key];
                            }
                        });
                        if (!found) {
                            for (i=0;i<this.jobQueue.length;i++) {
                                if (this.jobQueue[i].jobId == args[2]) {
                                    item = this.jobQueue.splice(i, 1).pop();
                                    this.container.send(room,
                                        Sugar.String.format('Job {alias} / {job} canceled.', item));
                                    found = 1;
                                    break;
                                }
                            }
                        }
                    } else {
                        this.container.send(room, 'Provide a job id to remove, or leave blank to remove the first item for '+ alias);

                    }
                } else if (alias) {
                    if (this.currentJob[alias]) {
                        item = this.currentJob[alias];
                        delete this.currentJob[alias];
                        setTimeout(this.startNextJob.bind(this),1);
                        this.container.send(room,
                            Sugar.String.format('Job {alias} / {job} canceled. Starting next job...', item));
                        found = 1;
                    } else {
                        for (i=0; i<this.jobQueue.length;i++) {
                           if (this.jobQueue[i].alias == alias) {
                               item = this.jobQueue.splice(i, 1);
                               this.container.send(room,
                                   Sugar.String.format('Job {alias} / {job} canceled.', item.pop()));
                               found = 1;
                               break;

                           }
                        }
                    }
                }
                if (found) {
                    return;
                }
                this.container.send(room, 'JobId or room alias not found.');
                break;
            case 'prod': // deploy prod
                // Rules:
                // (deploy policy default):
                //   - clean_check is OK
                //   - last_check_time < 24 hours ago
                // OR
                //   - "deploy prod force"
                //   - Sender is release manager
                var last_check = container.getState(room, 'last_check_time'), check_valid_until;
                if (last_check) {
                    check_valid_until = Sugar.Date.addHours(new Date(last_check), 24);
                }
                if (args[2] == 'force' && container.isReleaseManager(room, event)) {
                    this.queueJob(alias, 'deploy-code-prod', 'apply-config-prod', 0);
                } else if (container.getState(room, 'clean_check') == 'OK' && last_check && Sugar.Date.isFuture(check_valid_until)) {
                    if (container.getState(room, 'test_behat') == "1") {
                        if (container.getState(room, 'test_wraith') == "1") {
                            this.queueJob(alias, 'deploy-code-prod', 'apply-config-prod');
                        } else {
                            this.container.send(room, 'The last screenshot test run failed. Either fix the test and push fresh to release, or "!test approve wraith" to override.');
                        }
                    } else {
                        this.container.send(room, 'The last behat run failed. Either fix the test and push fresh to dev, or "!test approve behat" to override.');
                    }
                } else {
                    this.container.send(room, 'The last check of this room failed, or was over 24 hours ago. You can "!deploy check" to run a new check, or the release manager can "!deploy prod force" to override.');
                }
                break;
            case 'check':
                this.queueJob(alias, 'check-clean', 'check-clean', 0);
                break;

            case 'test':
            case 'behat':
                this.queueJob(alias, 'run-behat', 'extract-results-behat', 0);
                break;
            case 'approve':
                var stateName = 'test_' + args[2];
                if ((stateName == 'test_behat') || (stateName == 'test_wraith')) {
                    container.setState(room, container.config.stateName, "1", stateName);
                    container.send(room, 'Test approved.');
                }
        }

    },

    deployProd: function(topic, data) {
        this.setAction(data.room, '!deploy prod');
    },

    setPipeline: function(room, body, alias, cb){
        var container = this.container, pipeline, platform = '',
            state = room.currentState.getStateEvents(container.config.stateName, 'platform');
        if (state) {
            platform = state.getContent().platform;
        }
        switch (platform) {
            case 'wp':
                pipeline = 'wp_pipeline';
                break;
            default:
                pipeline = 'run_tests';
        }

        var self = this, args = [
            alias,
            this.container.config.concourseCredentials,
            pipeline
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
                if (self.container.getDeployroom) {
                    var deployroom = self.container.getDeployroom();
                    self.container.send(deployroom, 'Pipeline for '+ alias +' enabled!');
                } else {
                    self.container.send(room, 'Pipeline enabled!');
                }
            }
            if (util.isFunction(cb)){
                cb(code);
            }
        });

    },

    queueJob: function(alias, job, finish, pos) {
        if (!finish) {
            finish = job;
        }
        var item = {
            alias: alias,
            job: job,
            finish: finish,
            jobId: this.jobId++
        };
        // check to see if it's a current job...
        if (this.currentJob[alias] && this.currentJob[alias].job == job) {
            console.log('Attempt to re-run already running job.', item);
            return;
        }

        // also check queue.
        for (var i=0; i< this.jobQueue.length; i++) {
            if (this.jobQueue[i].alias == alias &&
                this.jobQueue[i].job == job) {
                console.log('Adding job to queue but already exists', item);
                return;
            }
        }

        if (pos === undefined) {
            this.jobQueue.push(item);
        } else {
            this.jobQueue.splice(pos, 0, item);
        }
        if (Sugar.Object.keys(this.currentJob).length < this.maxJobs) {
            setTimeout(this.startNextJob.bind(this),1);
        }

    },

    jobId: 1,
    currentJob: {},

    startNextJob: function() {
        if (this.jobQueue.length && Sugar.Object.keys(this.currentJob).length < this.maxJobs) {
            var item = this.jobQueue.shift(), skip = [];
            while (this.currentJob[item.alias] && item) {
                skip.push(item);
                item = this.jobQueue.shift();
            }
            if (item) {
                this.currentJob[item.alias] = item;
                this.triggerJob(item);
            }
            if (skip.length) {
                while (item = skip.pop()) {
                    this.jobQueue.unshift(item);
                }
            }
        } else {
            // we're done!
        }
    },

    validateJob: function(item) {
        if (!item) return false;
        if (this.currentJob[item.alias]) return false;
        if (!this.container.roomsByAlias[item.alias]) {
            // not a valid item -- get the next one
            console.log('invalid alias for job:', item);
            item=this.jobQueue.shift();
            return this.validateJob(item);
        }
        return true;
    },

    triggerJob: function(item) {
        var args = [
            '-j',
            item.alias + '/' + item.job
        ], room = this.container.roomsByAlias[item.alias];

        console.log('trigger job', item, room);
        if (!room) {
            delete(this.currentJob[item.alias]);
            setTimeout(this.startNextJob.bind(this),1);
        }
        this.setPipeline(room, item, item.alias, this.flyCommand.bind(this, 'trigger-job', args));

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
     * @param cb Callback to call when operation has data
     */
    activatePipeline: function(topic, data, minutes, cb) {
        var room,
            util = require('util');
        // First check if alias is one of our known rooms...
        if (room = this.container.roomsByAlias[data.alias]) {
            if (data.branch == 'develop') {
                // trigger dev-update job
                this.queueJob(data.alias, 'dev-update', 'extract-results-behat');
            } else if (data.branch == 'release') {
                // trigger stage-update job
                this.queueJob(data.alias, 'deploy-code-stage', 'extract-results-wraith');
            } else if (data.branch == 'master') {
                // no job at the moment....
            } else
            // sugar shorthand -- don't enable for non-magic branches
            if (['develop','release','master'].indexOf(data.branch) > -1) {
                if (!minutes) {
                    minutes = 60;
                }
                var scheduler = require('node-schedule');
                var expires = Sugar.Date.addMinutes(new Date(), minutes);
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

        var content = event.getContent();
        if (content.msgtype == 'com.freelock.data') {
            var builddata = content.build,
                data = content.data,
                message = body,
                container = this.container,
                alias = builddata.build_pipeline_name,
                job = builddata.build_job_name,
                build = builddata.build_name,
                log, releaseDate,
                url = builddata.atc_external_url + '/teams/' + builddata.build_team_name + '/pipelines/' +
                    alias + '/jobs/' + job + '/builds/' + build,
                trigger = content.trigger,
                cleancheck = 'OK',
                cleanerrors = '';
            console.log(builddata);
            console.log(data);
      //  } else {
            // Don't post default body to room if trigger is "data"
            if (trigger == 'data') {
                message = false;
            } else {
                // .. but do use the formatted body if not overridden later...
                if (content.formatted_body) {
                    message = content.formatted_body;
                }
            }

            if (room = container.roomsByAlias[alias]) {
                var type = 'notice';
                if (data) {
                    // sugarjs helper method
                    Sugar.Object.forEach(data, function (value, key) {
                        switch (key) {
                            case 'prod_features':
                            case 'prod_config':
                            case 'prod_fs':
                            case 'prod_branch':
                            case 'prod_uncommitted':
                            case 'prod_deploy':
                            case 'prod_lastdb':
                            case 'stage_lastdb':
                            case 'test_wraith':
                            case 'test_behat':
                            case 'dev_lastdb':
                            case 'dev_branch':
                            case 'dev_fs':
                            case 'dev_features':
                            case 'dev_config':
                                cleanerrors += value + " \n";
                                //fallthrough
                            case 'state':
                                container.setState(room, container.config.stateName, value, key);
                                break;
                            case 'log':
                                log = value;
                                break;
                            case 'version':
                                // Publish data to "version" topic
                                data.alias = alias;
                                data.room = room;
                                container.PubSub.publish('version', data);
                                if (job == 'deploy-code-prod') {
                                    // Wait for other state to set up
                                    container.PubSub.publish('newRelease', data);
                                }
                                break;
                            case 'error':
                                trigger = 'error';
                                cleancheck = 'Error: ';
                                // fallthrough to Add message...
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
                                console.log('unrecognized data:', key, value);
                        }
                    });
                }

                if (job == 'check-clean') {
                    // Need to set the room state as appropriate.
                    if (cleancheck == 'OK') {
                        var prevCheck = container.getState(room, 'clean_check');
                        if (prevCheck != 'OK') {
                            message = alias + ' site is now clean. Previously: '+prevCheck;
                            type = 'greenMessage';
                        } else if (!this.cleanRun) {
                            message = alias + ' site is clean.';
                            type = 'greenMessage';
                        }
                    } else {
                        cleancheck += cleanerrors;
                    }
                    container.setState(room, container.config.stateName, cleancheck, 'clean_check');
                    container.setState(room, container.config.stateName, Sugar.Date.format(new Date(), '%c'), 'last_check_time');

                    if (this.cleanRun) {
                        if (cleancheck != 'OK') {
                            this.sitesFail.push(alias);
                        }
                        this.currentJob[alias].finish = 'check-clean';
                        var state = container.getState(room, 'state');
                        switch (state) {
                            case 'released':
                                // then we want to bump to clean...
                                this.queueJob(alias, 'patch', 'sanitize-stage');
                                // fallthrough
                            case 'clean':
                                if (cleancheck == 'OK') {
                                    this.sitesClean.push(alias);
                                }
                                break;
                            case 'stage':
                                releaseDate = container.getReleaseDate(container.roomsByAlias[alias]);
                                if (releaseDate) {
                                    this.sitesStage.push(alias + ' (release at: ' + releaseDate + ')');
                                } else {
                                    this.sitesStage.push(alias);
                                }
                                break;
                            case 'dev':
                                this.sitesDev.push(alias);
                                break;
                            default:
                                message += alias + " site does not have a recognized state: " + state;
                                type = 'error';

                        }
                        if (this.lastCheck == alias) {
                            this.cleanRun = false;
                            this.sendSummary();
                        }
                    }
                }

                // now handle queue events...
                var item = this.currentJob[alias];
                if (item) {
                    // determine if we are at the end...
                    if ((job == item.finish) || (trigger == 'fail')) {
                        this.pausePipeline(alias);
                        delete this.currentJob[alias];
                        setTimeout(this.startNextJob.bind(this),1);

                    }
                }


                // if "message" key, send as usual, otherwise exit here
                if (!message) {
                    return;
                }
                // handle job logging, links
                if (job == 'run-behat') {
                    message = '<a href="' + url +'">Behat log</a>. ' + message;
                    if (log) {
                        message += "<br/><h4>Summary:</h4> " + log.replace(/\n/g, "<br />\n");
                    }
                }
                if (job == 'run-wraith' || job == 'wraith-dev-prod') {
                    message = '<a href="' + url +'">Wraith log</a>. ' + message;
                    if (log) {
                        message += "<br/><h4>Summary:</h4> " + log.replace(/\n/g, "<br />\n");
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

    },

    jobQueue: [],

    cleanRun: false,
    lastCheck: '',
    checkCount: 0,
    sitesClean: [],
    sitesFail: [],
    sitesDev: [],
    sitesStage: [],
    /**
     * Run the checkClean job for every room in maintenance
     */
    checkClean: function() {
        var container = this.container, count = 0, maint, alias = '', lastJob, self = this;

        // reset data...
        this.cleanRun = true;
        this.sitesClean = [];
        this.sitesFail = [];
        this.sitesDev = [];
        this.sitesStage = [];
        container.roomList.forEach(function(room) {
            maint = container.getState(room, 'maintenance');
            if (maint == 'yes') {
                count++;
                alias = container.getState(room, 'alias');
                self.queueJob(alias, 'check-clean','clean-run');
                lastJob = alias;
            }
        });
        this.lastCheck = alias;
        this.checkCount = count;
        container.send(this.getHomeroom(), 'Starting nightly checks on ' + count + ' sites.');
    },

    /**
     * Send a report to the alias room, or default room if not specified.
     *
     * @param alias
     */
    sendSummary: function(alias) {
        var container = this.container, room, msg, data;
        if (alias && container.roomsByAlias[alias]) {
            room = container.roomsByAlias[alias];
        } else {
            room = this.getHomeroom();
        }
        data = {
            count: this.checkCount,
            cleanCount: this.sitesClean.length,
            failCount: this.sitesFail.length,
            devCount: this.sitesDev.length,
            stageCount: this.sitesStage.length,
            failSites: this.sitesFail.join('</li><li>\n'),
            devSites: this.sitesDev.join('</li><li>\n'),
            stageSites: this.sitesStage.join('</li><li>\n')
        };
        msg = '<h3>Check run completed for {count} sites.<h3>\n' +
            '<h4>Clean sites: {cleanCount}</h4>\n' +
            '<font color="red"><h4>Dirty sites: {failCount}</h4>\n' +
            '<ul><li>{failSites}</li></ul></font>\n' +
            '<font color="orange"><h4>Stage sites: {stageCount}</h4>\n' +
            '<ul><li>{stageSites}</li></ul></font>\n' +
            '<font color="blue"><h4>Dev sites: {devCount}</h4>\n' +
            '<ul><li>{devSites}</li></ul></font>\n' +
            '';

        container.send(room, Sugar.String.format(msg, data));

    },

    getHomeroom: function() {
        var container = this.container;
        return Sugar.Array.find(container.roomList, function(room) {
            return room.roomId == container.config.homeroom;
        });
    }
};
