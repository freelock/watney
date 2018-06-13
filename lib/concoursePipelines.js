/**
 * Created by john on 3/29/16.
 */
"use strict";

const Sugar = require('sugar');
module.exports = {
    container: null,
    setup: function(container) {

        container.bangCommands['concourse'] = {
            help: 'Set up concourse pipeline, kick off tests -- update, wraith, test',
            args: ['update','wraith', 'test', 'bump'],
            cb: this.setAction.bind(this)
        };
        container.bangCommands['deploy'] = {
            help: 'Run deployment commands - check, prod, release',
            args: ['prod', 'check', 'release', 'hotfix', 'send summary'],
            cb: this.setAction.bind(this)
        };

        container.bangCommands['db'] = {
            help: 'Run database commands - export prod, export stage, import stage, import dev',
            args: ['export', 'import'],
            cb: this.setAction.bind(this)
        };

        container.bangCommands['queue'] = {
            help: 'View/manage concourse job queue',
            args: ['list', 'kill', 'bump', 'add', 'check', 'hotfix'],
            cb: this.setAction.bind(this)
        };

        container.bangCommands['test'] = {
            help: 'Run or approve tests',
            args: ['approve', 'behat', 'wraith'],
            cb: this.setAction.bind(this)
        };

        container.bangCommands['dev'] = {
            help: 'Claim or release a site',
            args: ['claim', 'unclaim', 'release'],
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

        const schedule = require('node-schedule');

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
        const container = this.container;
        let args = container.parseArgs(body),
            state = room.currentState.getStateEvents(container.config.stateName, 'alias'),
            user, message, template,
            alias, item, i, job, matches, found, finish, self;
        if (state) {
            alias = state.getContent().alias;
        }
        if (event) {
            user = event.getSender();
        } else {
            user = container.config.myUserId;
        }

        if (!alias) {
            if (args[0] !== '!queue') {
                this.container.send(room, 'No alias/site configured here!');
                return;
            }
        }

        if (!args[1]) {
            const self = this;
            if (args[0] === '!queue') {
                args[1] = 'list';

            } else {

                const exec = require('child_process').exec;
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
                message = ''; template = "<li>{jobId}: {alias} / {job} - end: {finish}</li>";
                if (Object.keys(this.currentJob).length) {
                    message += "<h3>Current Jobs:</h3>\n<ul>";
                    message = Object.keys(this.currentJob).reduce((msg, item) => {
                        msg += Sugar.String.format(template, this.currentJob[item]);
                        return msg;
                    }, message);
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
                    case 'dev-stage':
                        this.queueJob(alias, 'wraith-dev-stage', 'extract-results-wraith', 0);
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
                if (args[0] === '!queue') {
                    if (args[2] > 0) {
                        found = 0;
                        for (i=0;i<this.jobQueue.length;i++) {
                            if (this.jobQueue[i].jobId == args[2]) {
                                found=1;
                                if (i === 0) {
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
                           if (this.jobQueue[i].alias === alias) {
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
            case 'release': // deploy release, dev release
                const note = container.getReleaseNote(room);
                if (note && note.length) {
                    this.queueJob(alias, 'create-release', 'extract-results-wraith');
                    this.container.send(room, 'Stage deploy triggered.');
                    this.unclaim(room);
                } else {
                    this.container.send(room, 'Please provide a release note for this release.');
                }
                break;

            case 'prod': // deploy prod
                // Rules:
                // (deploy policy default):
                //   - clean_check is OK
                //   - last_check_time < 24 hours ago
                // OR
                //   - "deploy prod force"
                //   - Sender is release manager
                let last_check = container.getState(room, 'last_check_time'), check_valid_until;
                if (last_check) {
                    check_valid_until = Sugar.Date.addHours(new Date(last_check), 24);
                }
                if (args[2] === 'force' && container.isReleaseManager(room, event)) {
                    this.queueJob(alias, 'deploy-code-prod', 'apply-config-prod', 0);
                } else if (container.getState(room, 'clean_check') === 'OK' && last_check && Sugar.Date.isFuture(check_valid_until)) {
                    if (container.getState(room, 'test_behat') === "1") {
                        if (container.getState(room, 'test_wraith') === "1") {
                            if (container.getState(room, 'state') === 'stage') {
                                this.queueJob(alias, 'deploy-code-prod', 'apply-config-prod');
                                this.container.send(room, 'Deploy prod triggered.');
                            } else {
                                this.container.send(room, 'Not on Stage -- the release is not ready to deploy.');
                            }
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
                if (args[0] === '!queue') {
                    message = 'Sites to be checked: <ul><li>' + this.checkSites.join('</li><li>') + '</li></ul>' 
                    container.send(room, message);
                } else {
                  this.queueJob(alias, 'check-clean', 'check-clean', 0);
                }
                break;
            case 'hotfix':
                let platform, sites;
                if (args[0] === '!queue') {
                    if (!args[2]) {
                        sites = this.hotfixQueue.reduce((agg, site) => {
                            agg[site.platform] && agg[site.platform].push(site.alias)
                            || (agg[site.platform] = [site.alias]);
                            return agg;
                        }, {});
                        message = Object.keys(sites)
                          .reduce((message, platform) => message += `Hotfixes for ${platform}:<ul><li>`
                            + sites[platform].join('</li><li>')
                            + '</li></ul>',
                           '');
                        container.send(room, message);
                    } else {
                        message = args[2] + ' Hotfixes still applying to: <ul><li>' + 
                            this.hotfixQueue.filter(site => site.platform == args[2])
                              .map(site => site.alias)
                              .join('</li><li>') + '</li></ul>' 
                        container.send(room, message);
                    }
                } else if (args[0] === '!deploy') {
                    if (!args[2]) {
                        this.queueJob(alias, 'hotfix-prod', 'apply-hotfix-prod',0);
                    } else {
                        sites = this.getPlatformSites(args[2]);
                        if (!sites.length) {
                           this.container.send(room, `No sites found for platform ${args[2]}`);
                        } else {
                            message = 'Applying hotfixes for: <ul><li>' + sites.join('</li><li>') + '</li></ul>' 
                            container.send(room, message);
                            sites.map(alias => {
                                this.queueJob(alias, 'hotfix-prod', 'apply-hotfix-prod');
                                this.hotfixQueue.push({alias: alias, platform: args[2]});
                                return alias;
                            });
                        }
                    }
                }
                break;
            case 'send':
                this.sendSummary(alias);
                break;
            case 'test':
            case 'behat':
                this.queueJob(alias, 'run-behat', 'extract-results-behat', 0);
                break;
            case 'approve':
                let stateName = 'test_' + args[2];
                if ((stateName === 'test_behat') || (stateName === 'test_wraith')) {
                    container.setState(room, container.config.stateName, "1", stateName);
                    container.send(room, 'Test approved.');
                }
                break;
                // Dev commands
            case 'claim':
                let user_claim = args[2];
                if (!user_claim) {
                    if (matches = user.match(/^@(.*):matrix.freelock.com$/)) {
                        user_claim = matches[1];
                    } else {
                        this.container.send(room, 'Please specify a username for who is claiming this project.');
                    }
                }
                if (user_claim) {
                    container.setState(room, container.config.stateName, user_claim, 'dev_user');
                    container.send(room, Sugar.String.format('Dev claimed by {user}', {user: user_claim}));
                }
                break;
            case 'unclaim':
                this.unclaim(room);
                break;
        }

    },

    unclaim: function(room) {
        const container = this.container;
        let dev_user = container.getState(room, 'dev_user');

        if (dev_user) {
            container.setState(room, container.config.stateName, "", 'dev_user');
            container.send(room, Sugar.String.format('Dev unclaimed by {user}', {user: dev_user}));
        }
    },

    deployProd: function(topic, data) {
        this.setAction(data.room, '!deploy prod');
    },

    setPipeline: function(room, body, alias, cb){
        const container = this.container;
        let pipeline, platform = '',
            state = room.currentState.getStateEvents(container.config.stateName, 'platform');
        if (state) {
            platform = state.getContent().platform;
        }
        switch (platform) {
            case 'wp':
                pipeline = 'wp_pipeline';
                break;
            case 'drupal_lan':
                pipeline = 'drupal_lan_pipeline';
                break;
            case 'drupal':
            default:
                pipeline = 'drupal_pipeline';
        }

        let self = this, args = [
            alias,
            this.container.config.concourseCredentials,
            pipeline
        ];

        const spawn = require('child_process').spawn,
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
                    let deployroom = self.container.getDeployroom();
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
        let item = {
            alias: alias,
            job: job,
            finish: finish,
            jobId: this.jobId++
        };
        // check to see if it's a current job...
        if (this.currentJob[alias] && this.currentJob[alias].job === job) {
            console.log('Attempt to re-run already running job.', item);
            return;
        }

        // also check queue.
        for (let i=0; i< this.jobQueue.length; i++) {
            if (this.jobQueue[i].alias === alias &&
                this.jobQueue[i].job === job) {
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
        let item, skip = [], skipped = 0;
        while ((this.jobQueue.length > skipped) && Object.keys(this.currentJob).length < this.maxJobs ) {
            item = this.jobQueue.shift();
            while (item && this.currentJob[item.alias]) {
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
                    skipped++;
                }
            }
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
        let args = [
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
        let args = [
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
        let args = [
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

        const spawn = require('child_process').spawn,
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
        let room,
            util = require('util');
        // First check if alias is one of our known rooms...
        if (room = this.container.roomsByAlias[data.alias]) {
            if (data.branch === 'develop') {
                // trigger dev-update job
                this.queueJob(data.alias, 'dev-update', 'extract-results-behat');
            } else if (data.branch === 'release') {
                // trigger stage-update job
                //this.queueJob(data.alias, 'deploy-code-stage', 'extract-results-wraith');
            } else if (data.branch === 'master') {
                // no job at the moment....
            } else
            // sugar shorthand -- don't enable for non-magic branches
            if (['develop','release','master'].indexOf(data.branch) > -1) {
                if (!minutes) {
                    minutes = 60;
                }
                const scheduler = require('node-schedule');
                let expires = Sugar.Date.addMinutes(new Date(), minutes);
                let jobKey = 'pipeline-'+data.alias;
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
        let jobKey = 'pipeline-' + data.alias;
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

        let content = event.getContent();
        if (content.msgtype === 'com.freelock.data') {
            let builddata = content.build,
                data = content.data,
                message = body,
                container = this.container,
                alias = builddata.build_pipeline_name,
                job = builddata.build_job_name,
                build = builddata.build_name,
                log, releaseDate, releaseNote, releaseStatus,
                url = builddata.atc_external_url + '/teams/' + builddata.build_team_name + '/pipelines/' +
                    alias + '/jobs/' + job + '/builds/' + build,
                trigger = content.trigger,
                cleancheck = 'OK',
                cleanerrors = '';
      //  } else {
            // Don't post default body to room if trigger is "data"
            if (trigger === 'data') {
                message = false;
            } else {
                // .. but do use the formatted body if not overridden later...
                if (content.formatted_body) {
                    message = content.formatted_body;
                }
            }

            if (room = container.roomsByAlias[alias]) {
                let type = 'notice';
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
                            case 'prod_lastrelease':
                            case 'stage_lastdb':
                            case 'test_wraith':
                            case 'test_behat':
                            case 'dev_lastdb':
                            case 'dev_branch':
                            case 'dev_fs':
                            case 'dev_features':
                            case 'dev_config':
                            case 'platform_version':
                            case 'dev_user':
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
                                break;
                            case 'prod_version':
                                data.alias = alias;
                                data.room = room;
                                container.setState(room, container.config.stateName, value, key);
                                    // Wait for other state to set up
                                    container.PubSub.publish('newRelease', data);
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
                            case 'hotfix_result':
                            case 'hotfix_message':
                            case 'hotfix_commits':
                                break;
                            default:
                                console.log('unrecognized data:', key, value);
                        }
                    });
                }

                if (job === 'check-clean') {
                    // Need to set the room state as appropriate.
                    if (cleancheck === 'OK') {
                        let prevCheck = container.getState(room, 'clean_check');
                        if (prevCheck !== 'OK') {
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

                    if (this.cleanRun && this.currentJob[alias]) {
                        if (cleancheck !== 'OK') {
                            this.sitesFail.push(alias);
                        }
                        this.currentJob[alias].finish = 'check-clean';
                        let state = container.getState(room, 'state');
                        switch (state) {
                            case 'released':
                                // then we want to bump to clean...
                                this.queueJob(alias, 'patch', 'sanitize-stage');
                                // fallthrough
                            case 'clean':
                                if (cleancheck === 'OK') {
                                    this.sitesClean.push(alias);
                                }
                                break;
                            case 'stage':
                                releaseDate = container.getReleaseDate(container.roomsByAlias[alias]);
                                releaseNote = container.getReleaseNote(container.roomsByAlias[alias]);
                                releaseStatus = container.getQuickStatus(container.roomsByAlias[alias]);
                                if (releaseDate) {
                                    this.sitesStage.push(alias + releaseStatus.summary + ' - ' + releaseNote + ' (release at: ' + releaseDate + ')');
                                } else {
                                    this.sitesStage.push(alias + releaseStatus.summary + ' - ' + releaseNote);
                                }
                                break;
                            case 'dev':
                                this.sitesBeta.push(alias);
                                break;
                            default:
                                message += alias + " site does not have a recognized state: " + state;
                                type = 'error';

                        }
                        this.checkSites = this.checkSites.filter((x)=> x != alias);
                        if (this.checkSites.length == 0) {
                            this.cleanRun = false;
                            this.sendSummary();
                        }
                    } else {
                        console.log('NOT FOUND CLEAN RUN:', alias);
                    }
                      console.log('check clean check:',alias,this.checkSites.length);
                }

                // now handle queue events...
                let item = this.currentJob[alias];
                if (item) {
                    // determine if we are at the end...
                    if ((job === item.finish) || (trigger === 'fail')) {
                        this.pausePipeline(alias);
                        delete this.currentJob[alias];
                        setTimeout(this.startNextJob.bind(this),1);

                    }
                }

                if (job === 'hotfix-prod' && data && data.hotfix_result) {
                    // data should contain hotfix_result, hotfix_message, hotfix_commits
                    switch (data.hotfix_result) {
                        case 'nochange':
                          message = data.hotfix_message;
                          break;
                        case 'fail':
                            message = data.hotfix_message;
                            type = 'error';
                            break;
                        case 'pass':
                            let commits = data.hotfix_commits.split("\n");
                            message = '## Release '+data.version +"<br/><br/>\n\n" +
                                '### Status: released<br/><br/>\n\n' +
                                "### Notes <br/>\n<br/>\n" +
                                '- ' + data.hotfix_message + "<br/><br/>\n\n" +
                                "### Commits<br/><br/>\n\n" +
                                '- ' + commits.join("<br/>\n- ") +
                                "<br/><br/>\n\n";
                    }
                    this.hotfixQueue = this.hotfixQueue.filter(site => site.alias != alias);
                }

                // if "message" key, send as usual, otherwise exit here
                if (!message) {
                    return;
                }
                // handle job logging, links
                if (job === 'run-behat') {
                    message = '<a href="' + url +'">Behat log</a>. ' + message;
                    if (log) {
                        message += "<br/><h4>Summary:</h4> " + log.replace(/\n/g, "<br />\n");
                    }
                }
                if (job === 'run-wraith' || job === 'wraith-dev-prod' || job === 'wraith-dev-stage') {
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
    checkSites: [],
    checkCount: 0,
    sitesClean: [],
    sitesFail: [],
    sitesDev: [],
    sitesBeta: [],
    sitesStage: [],
    /**
     * Run the checkClean job for every room in maintenance
     */
    checkClean: function() {
        let container = this.container, count = 0, maint, dev_user, alias = '', lastJob = '', self = this;

        // reset data...
        this.cleanRun = true;
        this.sitesClean = [];
        this.sitesFail = [];
        this.sitesBeta = [];
        this.sitesDev = [];
        this.sitesStage = [];
        container.roomList.forEach(function(room) {
            alias = container.getState(room, 'alias');
            dev_user = container.getState(room, 'dev_user');
            if (dev_user && alias) {
                self.sitesDev.push(`${alias} claimed by ${dev_user}`);
            }
            maint = container.getState(room, 'maintenance');
            if (maint === 'yes') {
                count++;
                self.queueJob(alias, 'check-clean','clean-run');
                self.checkSites.push(alias);
            }
        });
        this.checkCount = count;
        container.send(this.getHomeroom(), 'Starting nightly checks on ' + count + ' sites.');
    },

    /**
     * Send a report to the alias room, or default room if not specified.
     *
     * @param alias
     */
    sendSummary: function(alias) {
        const container = this.container;
        let room, msg, data;
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
            betaCount: this.sitesBeta.length,
            stageCount: this.sitesStage.length,
            failSites: this.sitesFail.join('</li><li>'),
            devSites: this.sitesDev.join('</li><li>'),
            betaSites: this.sitesBeta.join('</li><li>'),
            stageSites: this.sitesStage.join('</li><li>')
        };
        msg = '<h2>Check run completed for {count} sites.</h2>' +
            '<fieldset>' +
            '<h3>Clean sites: {cleanCount}</h3>' +
            '<font color="red"><h3>Dirty sites: {failCount}</h3>' +
            '<ul><li>{failSites}</li></ul></font><br>' +
            '<font color="orange"><h3>Stage sites: {stageCount}</h3>' +
            '<ul><li>{stageSites}</li></ul></font><br>' +
            '<font color="blue"><h3>Beta sites: {betaCount}</h3>' +
            '<ul><li>{betaSites}</li></ul></font><br>' +
            '<font color="green"><h3>Dev sites: {devCount}</h3>' +
            '<ul><li>{devSites}</li></ul></font><br>' +
            '</fieldset>';

        container.send(room, Sugar.String.format(msg, data));

    },

    // List of remaining hotfix jobs
    hotfixQueue: [
      // {alias: site1, platform: wp},
      // {alias: site2, platform: d8],
    ],

    getPlatformSites: function(platform) {
        let container = this.container, count = 0, version, maint, dev_user, alias = '', lastJob = '', self = this,
        rooms = container.roomList.filter(room => {
            version = container.getState(room, 'platform_version');
            maint = container.getState(room, 'maintenance');
            if (maint === 'yes') {
                switch (platform) {
                    case version:
                    case 'd' + version:
                        return true;
                }
                if (!version) {
                    let plat = container.getState(room, 'platform');
                    if (plat == 'wp') {
                        return platform == 'wp';
                    }
                    return platform == 'd7';
                }
            }
            return false;
        });
        return rooms.map(room => container.getState(room, 'alias'));
    },

    getHomeroom: function() {
        const container = this.container;
        return Sugar.Array.find(container.roomList, function(room) {
            return room.roomId === container.config.homeroom;
        });
    }
};
