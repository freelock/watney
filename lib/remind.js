/**
 * Created by john on 6/16/16.
 *
 * This module is a generic "reminder" that will replay a message at a specific time in the room it was created.
 *
 */
"use strict";

module.exports = {
    container: null,
    setup: function (container) {
        container.bangCommands['remind'] = {
            help: 'Set a reminder for me to replay back to you at a specified time',
            args: ['me', 'show'],
            cb: this.remind.bind(this)
        };
        container.roomUpdates.push(this.loadScheduledReminders.bind(this));
        this.container = container;
    },

    remind: function(){
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
        if (args[1] == 'me' || !active) {
            msg = body.substring(args[0].length + cmd.length + 2);
            props.targetDate = Sugar.Date.create(msg,{future: true});
            if (!props.targetDate || props.targetDate == 'Invalid Date') {
                container.send(room, 'Sorry, I could not understand that date!', 'error');
                return;
            }
            jobKey = 'release-' + room.name;
            var scheduler = require('node-schedule');
            if (container.scheduledJobs[jobKey]) {
                container.scheduledJobs[jobKey].cancel();
            }
            container.scheduledJobs[jobKey] = scheduler.scheduleJob(props.targetDate, this.notifyRelease.bind(this, room));
            msg = 'Release ' + version + ' date set to ' + props.targetDate;
        }

    },

    
    /**
     * Called when roomlist changes, e.g. at startup.
     *
     * Populates the schedule with the current reminder notifications.
     */
    loadScheduledReminders: function() {
        var state, props, targetDate, jobKey, container = this.container,
            schedule = require('node-schedule');
        container.roomList.forEach(function(room){
            state = room.currentState.getStateEvents(container.config.reminderName,'');
            if (state) {
                props = state.getContent();
                targetDate = props.targetDate ? Date.create(props.targetDate) : false;
                jobKey = 'reminder-'+room.name;
                if (targetDate) {
                    if (container.scheduledJobs[jobKey]){
                        container.scheduledJobs[jobKey].cancel();
                    }
                    container.scheduledJobs[jobKey] = schedule.scheduleJob(targetDate, this.notifyReminder.bind(this, room));
                }
            }

        }, this);

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
        var jobKey = 'release-'+room.name;
        if (this.container.scheduledJobs[jobKey]) {
            delete(this.container.scheduledJobs[jobKey]);
        }
    }

};
