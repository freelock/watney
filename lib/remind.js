/**
 * Created by john on 6/16/16.
 *
 * This module is a generic "reminder" that will replay a message at a specific time in the room it was created.
 *
 */
"use strict";

var easypattern = require('easypattern');
var Sugar = require('sugar');

var patterns = [
  'to {task} on {time}',
  'to {task} at {time}',
  'to {task} in {interval}',
  'in {interval} to {task}',
  'on {time} to {task}',
  'at {time} to {task}',
  '{time} to {task}',
  'that {task} on {time}',
  'that {task} at {time}',
  'that {task} in {interval}',
  'to {task} tomorrow'
];

module.exports = {
    container: null,
    setup: function (container) {
        container.bangCommands['remind'] = {
            help: 'Set a reminder for me to replay back to you at a specified time',
            args: ['me', 'show', 'at', 'add'],
            cb: this.remind.bind(this)
        };
        container.roomUpdates.push(this.loadScheduledReminders.bind(this));
        this.container = container;
    },

    remind: function(room, body, event){
        var active, args, currStatus, msg, newState, props, targetDate, jobKey,
            version, container = this.container,
            reminders,
            matrixClient = container.mx,
            state = room.currentState.getStateEvents(container.config.reminderName,'');
        if (state) {
            reminders = state.getContent();
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
     *
     * @param room Object
     * @param time: Sugar.Date object
     * @param recipient - username to bing
     * @param message string - Message to send
     *
     */
    setReminder: function(room, time, recipient, message) {
        var state = room.currentState.getStateEvents(container.config.reminderName,''),
            reminders, container = this.container, keys, jobKey, reminder,
            targetDate, indx, highest = 1, reminderKey,
            matrixClient = container.mx;
        reminders = state.getContent();
        keys = Object.keys(container.scheduledJobs);
        keys.forEach(function(k) {
            indx = k.match(/^reminder-.*-(\d+)$/);
            if (indx) {
                indx = indx[1] * 1;
                if (indx > highest) {
                    highest = indx;
                }
            }
        });
        reminderKey = highest + 1;
        jobKey = 'reminder-' + room.name + '-' + reminderKey;
        targetDate = Sugar.Date.create(time, {future: true});
        if (targetDate) {
            reminder = {
                targetDate: targetDate,
                recipient: recipient,
                message: message
            }
            container.scheduledJobs[jobKey] = schedule.scheduleJob(targetDate, this.remindSend.bind(this, room, reminderKey));
            reminders.push(reminder);

            matrixClient.sendStateEvent(room.roomId, container.config.reminderName, props)
                .then(function(){
                        container.send(room, msg);
                    },
                    function(code,data){
                        var msg = 'There was a problem processing this request: '+code;
                        console.log('Error on setting state',code,data);
                        container.send(room, msg);

                    });
        }

    },

    
    /**
     * Called when roomlist changes, e.g. at startup.
     *
     * Populates the schedule with the current reminder notifications.
     */
    loadScheduledReminders: function() {
        var state, props, reminders, targetDate, jobKey, container = this.container,
            reminderKey = 1,
            schedule = require('node-schedule');
        container.roomList.forEach(function(room){
            state = room.currentState.getStateEvents(container.config.reminderName,'');
            if (state) {
                reminders = state.getContent();
                reminders.forEach(function(props) {
                    targetDate = props.targetDate ? Date.create(props.targetDate) : false;
                    jobKey = 'reminder-'+room.name+'-'+reminderKey++;
                    if (targetDate && Sugar.Date.isFuture(targetDate)) {
                        container.scheduledJobs[jobKey] = schedule.scheduleJob(targetDate, this.remindSend.bind(this, room, reminderKey));
                    }

                });
            }

        }, this);

    },

    /**
     * Callback run when scheduled time is reached.
     * @param room
     */
    remindSend: function(room, reminderKey){
        var jobKey = 'reminder-' + room.name + '-' + reminderKey,
            container = this.container,
            reminder = container.scheduledJobs[jobKey],
            matrixClient = container.mx, i,
            state = room.currentState.getStateEvents(container.config.reminderName,''),
            reminders = state.getContent(),
            Notice = "<b>{recipient}: {message}</b>";
        // use "message" type to bing release manager
        if (reminder != undefined) {
            this.container.send(room, Notice.assign(reminder), 'message');
            delete(this.container.scheduledJobs[jobKey]);
            reminders = reminders.filter(function(reminder){
                return Sugar.Date.isFuture(reminder.targetDate);
            });
            matrixClient.sendStateEvent(room.roomId, container.config.reminderName, reminders)
                .then(function(){
                    },
                    function(code,data){
                        var msg = 'There was a problem processing this request: '+code;
                        console.log('Error on setting state',code,data);
                        container.send(room, msg);

                    });
        } else {
            this.container.send(room, 'reminder not found: '+reminderKey);
        }
    }

};
