/**
 * Created by john on 3/29/16.
 */
"use strict";

let Sugar = require('sugar');
module.exports = {
    container: null,
    setup: function(container) {
        container.bangCommands['release'] = {
            help: 'Get the current release notes or add a release note',
            args: ['note','step', 'test', 'case','commit','status','date','markdown|md'],
            cb: this.releaseNotes.bind(this)
        };

        container.PubSub.subscribe('version',
            this.updateVersion.bind(this)
        );
        container.PubSub.subscribe('newRelease',
            this.postNotes.bind(this)
        );
        container.PubSub.subscribe('releaseCase.add',
            this.releaseCase.bind(this)
        );
        container.PubSub.subscribe('releaseCase.remove',
            this.releaseCase.bind(this)
        );

        container.roomUpdates.push(this.loadScheduledReleases.bind(this));
        container.getReleaseManager = this.getReleaseManager.bind(this);
        container.isReleaseManager = this.isReleaseManager.bind(this);
        container.getReleaseDate = this.getReleaseDate.bind(this);
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
        let active, args, currStatus, msg = '', newState, targetDate, jobKey,
            version, container = this.container,
            matrixClient = container.mx, alias,
            props = container.getState(room, '', container.config.releaseName);
        if (props) {
            active = props.active;
            version = props.version ? props.version : '';
            currStatus = container.getState(room, 'state');
            alias = container.getState(room, 'alias');
            targetDate = props.targetDate ? props.targetDate : '';
        }

        args = container.parseArgs(body);
        if (args[1] === 'create' || !active) {
            if (args[1] === 'create' && args[2]) {
                version = args[2];
            } else if (version) {
                version = version.replace(/\d+$/, function(n) { return ++n });
            } else {
                msg = 'No previous version. Please provide a version number!';
                container.send(room, msg, 'error');
                return;
            }
            if (args[1] === 'create' || version) {
                msg = 'Creating new release, version <b>'+version+'</b>';
                container.send(room, msg);
                newState = {
                    active: true,
                    targetDate: '',
                    version: version,
                    notes: [],
                    steps: [],
                    tests: [],
                    cases: {},
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
            let self = this, cases = [];
            Sugar.Object.forEach(props.cases, function(val) {
                cases.push(self.printCase(val));
            });
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
                '<ul><li>' + cases.join('</li><li>') +
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
                case 'markdown':
                case 'md':
                    let self = this, cases = [];
                    Sugar.Object.forEach(props.cases, function(val) {
                        cases.push(self.printCase(val,'markdown'));
                    });
                    msg = '## Release '+version +"<br/><br/>\n\n" +
                        '### Status: '+ currStatus + "<br/><br/>\n\n" +
                        "### Notes <br/>\n<br/>\n" +
                        '- ' + props.notes.join("<br/>\n- ") +
                        "<br/><br/>\n\n" +
                        "### Deployment Steps<br/><br/>\n\n" +
                        '- ' + props.steps.join("<br/>\n- ") +
                        "<br/><br/>\n\n" +
                        "### Test on production after deploy<br/><br/>\n\n" +
                        '- ' + props.tests.join("<br/>\n- ") +
                        "<br/><br/>\n\n" +
                        "### Cases<br/><br/>\n\n" +
                        '- ' + cases.join("<br/>\n- ") +
                        "<br/><br/>\n\n" +
                        "### Commits<br/><br/>\n\n" +
                        '- ' + props.commits.join("<br/>\n- ") +
                        "<br/><br/>\n\n";
                    container.send(room, msg);
                    return;
                case 'case':
                    msg = '<b>case</b> (taiga, atrium, carina) (case id) (title)';
                    container.send(room, msg, 'error');
                    break;
                default:
                    msg = '<b>' + cmd + '</b> requires a message to add.';
                    container.send(room, msg, 'error');
            }
            return;
        }
        switch (cmd) {
            case 'date':
                msg = body.substring(args[0].length + cmd.length + 2);
                props.targetDate = Sugar.Date.create(msg, {future: true});
                if (!props.targetDate || props.targetDate === 'Invalid Date'){
                    container.send(room, 'Sorry, I could not understand that date!', 'error');
                    return;
                }
                jobKey = 'release-'+room.name;
                var scheduler = require('node-schedule');
                if (container.scheduledJobs[jobKey]) {
                    container.scheduledJobs[jobKey].cancel();
                }
                container.scheduledJobs[jobKey] = scheduler.scheduleJob(props.targetDate, this.notifyRelease.bind(this, room));
                msg = 'Release '+version+' date set to ' + props.targetDate;
                break;
            case 'note':
            case 'test':
            case 'step':
            case 'commit':
                msg = body.substring(args[0].length + cmd.length + 2);
                var arr = msg.split("\n");
                for (var i=0; i<arr.length; i++) {
                    props[cmd + 's'].push(arr[i]);
                }
                console.log(props);
                msg = 'Release '+cmd+' added to  ' + version;
                break;
            case 'case':
                var valid, case_id, case_data = {};
                if (args[2] === 'remove' || args[2] === 'rm') {
                    case_id = args[3];
                    if (props.cases[case_id]) {
                        delete props.cases[case_id];
                        msg = 'Removed ' + case_id;
                        break;
                    } else {
                        msg = 'Case ' + case_id + ' not recognized. Combine the source with the id - e.g. "taiga-234".';
                        container.send(room, msg, 'error');
                        return;
                    }
                }
                if (Array.isArray(props.cases)) {
                    props.cases = {};
                    msg = "Converted case list to object, removed existing cases.\n<br/>";
                }
                // args[2] = source, args[3] = id, remainder = body
                if (!container.config.sources[args[2]]) {
                    msg = 'Case source ' + args[2] + ' not recognized.';
                    container.send(room, msg, 'error');
                    return;
                }
                if (args[3] < 1) {
                    msg = 'Case id ' + args[3] + ' expected to be an integer.';
                    container.send(room, msg, 'error');
                    return;
                }
                case_id = args[2] + '-' + args[3];
                case_data.source = args[2];
                case_data.id = args[3];
                case_data.alias = alias;
                case_data.title = body.substring(args[0].length + cmd.length + args[2].length + args[3].length + 4);
                props.cases[case_id] = case_data;
                msg += case_data.source + " case " + case_data.id + " added to release.";
                break;

            case 'status':
                msg = 'Release status now handled by Concourse.';
                container.send(room, msg, 'error');
                return;

            default:
                msg = 'Request not recognized. Recognized release commands: create, date, note, step, task, commit, case.';
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
        var props, targetDate, jobKey, container = this.container,
            schedule = require('node-schedule');
        container.roomList.forEach(function(room){
            props = container.getState(room, '', container.config.releaseName);
            if (props) {
                targetDate = props.targetDate ? Sugar.Date.create(props.targetDate) : false;
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
     * Pubsub callback for "commit" messages.
     *
     * @param topic string topic that was matched in pubsub
     * @param data object containing version, message, alias, room
     */
    updateVersion: function(topic, data) {
        var container = this.container, room = data.room, version,
            props = container.getState(room, '', container.config.releaseName);
        if (props) {
            version = props.version ? props.version : '';
        } else {
            props = {};
        }

       /* if (!version && data.version) {
            // no previous release is set up. Create a new one...
            this.releaseNotes(room, '!release create ' + data.version);
        } else */
        if (version !== data.version || data.commits) {
            props.version = data.version;
            if (data.commits) {
                props.commits = data.commits.split("\n");
            }
            container.setState(room, container.config.releaseName, props);

        }


    },
    /**
     * Load the current release from the room state.
     * 
     * @param room
     * @return object
     */
    getCurrRelease: function(room) {
        let container = this.container, releaseState = container.getState(room, '', container.config.releaseName);
        if (releaseState) {
            releaseState.releaseManager = this.getReleaseManager(room);
            releaseState.status = container.getState(room, 'state');
            return releaseState;
        }
        return false;
    },

    /**
     *
     * @param topic string - either 'releaseCase.add' or 'releaseCase.remove'
     * @param data object: {
     *   source: 'taiga', 'atrium', 'auriga', 'carina',
     *   id: ID in source system,
     *   title: Title of case,
     *   url: URL of case in source system
     *   room: room object
     * }
     */
    releaseCase: function (topic, data) {
        let container = this.container, msg = '',
            matrixClient = container.mx,
            room = data.room, case_id, case_data,
            props = container.getState(data.room, '', container.config.releaseName);
        if (Array.isArray(props.cases)) {
            props.cases = {};
            msg = "Converted case list to object, removed existing cases.\n<br/>";
        }
        case_id = data.source + '-' + data.id;
        if (topic === 'releaseCase.add') {
            case_data = {
                source: data.source,
                id: data.id,
                url: data.url,
                title: data.title
            };
            props.cases[case_id] = case_data;
        } else if (topic === 'releaseCase.remove') {
            delete props.cases[case_id];
        }
        matrixClient.sendStateEvent(room.roomId, container.config.releaseName, props)
            .then(function(){
                    container.send(room, msg);
                },
                function(code,data){
                    let msg = 'There was a problem processing this request: '+code;
                    console.log('Error on setting state',code,data);
                    container.send(room, msg);

                });

    },
    /**
     * Callback to print a case object as a string
     * @param item
     */
    printCase: function (item, format) {
        let container = this.container,
            msg = '<a href="{url}">{source} #{id}</a> - {title}';
        if (format === 'markdown') {
            msg = '[{source} #{id}]({url}) - {title}';
        }
        if (typeof item === 'string') {
            msg = item;
        } else {
            if (!item.url) {
                item.itemtype = 'us';
                item.url = Sugar.String.format(container.config.sources[item.source], item);
            }
        }
        return Sugar.String.format(msg, item);
    },
    getReleaseManager: function(room) {
        var container = this.container,
            releaseManager = container.getState(room, 'releaseManager');
        if (!releaseManager) {
            releaseManager = container.config.defaultReleaseManager;
        }
        return releaseManager;
    },

    getReleaseDate: function(room) {
        var container = this.container, targetDate,
            props = container.getState(room, '', container.config.releaseName);
        if (props && props.targetDate) {
            return props.targetDate;
        }
    },

    isReleaseManager: function(room, event) {
        var container = this.container,
            releaseManager = this.getReleaseManager(room),
            sender = event.getSender(),
            releaseId = '@' + releaseManager + ':' + container.config.adminHomeServer;

        return sender === releaseId;

    },

    postNotes: function(topic, data) {
        try {
            var self = this;
            setTimeout(function(){
                self.releaseNotes(data.room, '!release markdown');
                setTimeout(self.createRelease.bind(self),3000, data);
            }, 3000);

        }
        catch (e) {

        }

    },

    createRelease: function(data) {
        this.releaseNotes(data.room, '!release create');
    },

    /**
     * Callback run when scheduled time is reached.
     * @param room
     */
    notifyRelease: function(room){
        var release = this.getCurrRelease(room);
        var Notice = "<b>{releaseManager}: Release time reached for {version}!</b> Current status: {status}";
        // use "message" type to bing release manager
        this.container.send(room, Sugar.String.format(Notice, release), 'message');
        var jobKey = 'release-'+room.name;
        if (this.container.scheduledJobs[jobKey]) {
            delete(this.container.scheduledJobs[jobKey]);
        }
        var data = {
            jobKey: jobKey,
            room: room
        }
        this.container.PubSub.publish('deploy.prod', room);
    }
};
