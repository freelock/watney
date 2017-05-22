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
  '{person} to {task} on {time}',
  '{person} to {task} at {time}',
  '{person} to {task} in {interval}',
  '{person} in {interval} to {task}',
  '{person} on {time} to {task}',
  '{person} at {time} to {task}',
  '{person} {time} to {task}',
  '{person} that {task} on {time}',
  '{person} that {task} at {time}',
  '{person} that {task} in {interval}',
  '{person} to {task} tomorrow'
];

module.exports = {
    container: null,
    setup: function (container) {
        container.bangCommands['remind'] = {
            help: 'Set a reminder for me to replay back to you at a specified time',
            args: ['me', 'show', 'cancel', '{name}'],
            cb: this.remind.bind(this)
        };
        container.roomUpdates.push(this.loadScheduledReminders.bind(this));
        this.container = container;
    },

    remind: function(room, body, event){
        var active, args, currStatus, msg, newState, props, targetDate, jobKey,
            version, container = this.container,
            reminders, reminder, items = [],
            matrixClient = container.mx,
            state;

        args = container.parseArgs(body);
        state = container.getState(room, '', container.config.reminderName);
        switch (args[1]) {
            case 'cancel':
            case 'delete':
                if (state) {
                    reminders = state; //.getContent();
                    jobKey = 'reminder-' + room.name + '-' + args[2]
                    if (reminder = container.scheduledJobs[jobKey]){
                        delete (reminders[args[2]]);
                        reminders.forceNotEmpty = 'something';
                        reminder.cancel();
                        delete (container.scheduledJobs[jobKey]);
                        container.setState(room, container.config.reminderName, reminders);
                        container.send(room, 'Deleted.');

                        break;
                    }
                    container.send(room, 'Reminder not found.', 'error');
                } else {
                    container.send(room, 'No reminders set in this room.', 'error');
                    break;
                };
                // continue on to show.
            case 'show':
                msg = 'Current reminders: <br/><ul><li>';
                if (state) {
                    reminders = state; //.getContent();
                    if (Sugar.Object.size(reminders)) {
                        Sugar.Object.forEach(reminders, function(val, key) {
                            targetDate = val.targetDate ? Sugar.Date.create(val.targetDate) : false;
                            if (targetDate) {
                                val.formattedDate = Sugar.Date.format(targetDate);
                                items.push(Sugar.String.format('{key} - {recipient} - {formattedDate} - {message}', val));
                            }
                        });
                    } else {
                        items.push('None');
                    }
                } else {
                    items.push('None');
                }
                msg += items.join('</li><li>')

                msg += '</li></ul>';
                container.send(room, msg);
                break;
            case 'me':
            default:
                // parse what's left...
                msg = body.substring(args[0].length + 1);
                msg = msg.replace(/ to /ig, '__to__') // hack to circumvent greedy regex matches for the wrong 'to'
                    .replace(/__to__/i, ' to ');
                var result = {
                    input: msg
                };
                patterns.some(function(pattern) {
                    var pat = easypattern(pattern);
                    if (pat.test(msg)) {
                        result = pat.match(msg)

                        // special case for trailing tomorrow
                        if (!result.time &&  pattern.match(/tomorrow$/i)) {
                            result.time = Sugar.Date.create('tomorrow 9:00am');
                        }
                        if (result.interval) {
                            result.time = Sugar.Date.create('in '+result.interval, {future: true});
                        }
                        // undo the regex 'to' hack
                        result.task = result.task.replace(/__to__/ig, ' to ')

                        if (typeof result.time === 'string') {
                            if (result.day) {
                                result.time = result.day + ' at ' + result.time
                            }
                            result.time = Sugar.Date.create(result.time, {future: true});
                        }
                        if (Sugar.Date.isValid(result.time)) {
                            return true;
                        }
                    }
                });
                if (result.time && Sugar.Date.isValid(result.time) && result.task) {
                    if (result.person == 'me') {
                        result.person = event.sender.name;
                    }
                    this.setReminder(room, result.time, result.person, result.task);
                    container.send(room, 'Reminder set.');
                } else {
                    container.send(room, 'Reminder not understood!');
                }
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
        var container = this.container,
            state = container.getState(room, '', container.config.reminderName),
            reminders = {}, keys, jobKey, reminder,
            targetDate, indx, highest = 0, reminderKey,
            matrixClient = container.mx;
        if (state) {
            reminders = state; //.getContent();
            keys = Object.keys(reminders);
            keys.forEach(function(k) {
                // Cast to integer.
                k = k * 1;
                if (k > highest) {
                    highest = k;
                }
            });
        }
        reminderKey = highest + 1;
        jobKey = 'reminder-' + room.name + '-' + reminderKey;
        targetDate = time; //Sugar.Date.create(time, {future: true});
        if (targetDate) {
            var scheduler = require('node-schedule');
            reminder = {
                targetDate: targetDate,
                recipient: recipient,
                message: message,
                key: reminderKey
            }
            container.scheduledJobs[jobKey] = scheduler.scheduleJob(targetDate, this.remindSend.bind(this, room, reminderKey));
            reminders[reminderKey] = reminder;

            container.setState(room, container.config.reminderName, reminders);
        }

    },

    
    /**
     * Called when roomlist changes, e.g. at startup.
     *
     * Populates the schedule with the current reminder notifications.
     */
    loadScheduledReminders: function() {
        var state, reminders, targetDate, jobKey, container = this.container,
            reminderKey = 1,
            schedule = require('node-schedule');
        container.roomList.forEach(function(room){
            state = container.getState(room, '', container.config.reminderName);
            if (state) {
                reminders = state; //.getContent();
                var self = this;
                //container.setState(room, container.config.reminderName, reminders);
                Sugar.Object.forEach(reminders, function(reminder) {
                    targetDate = reminder.targetDate ? Sugar.Date.create(reminder.targetDate) : false;
                    reminderKey = reminder.key;
                    jobKey = 'reminder-'+room.name+'-'+ reminderKey;
                    if (targetDate && Sugar.Date.isFuture(targetDate)) {
                        // for some reason, sync loads up twice. Don't schedule two jobs.
                        if (!container.scheduledJobs[jobKey]) {
                            container.scheduledJobs[jobKey] = schedule.scheduleJob(targetDate, self.remindSend.bind(self, room, reminderKey));
                        }
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
            scheduledReminder = container.scheduledJobs[jobKey],
            state = container.getState(room, '', container.config.reminderName),
            reminders = state, //.getContent(),
            reminder = reminders[reminderKey],
            Notice = "<b>{recipient}: {message}</b>";
        // use "message" type to bing release manager
        if (reminder != undefined) {
            this.container.send(room, Sugar.String.format(Notice, reminder), 'message');
            delete(this.container.scheduledJobs[jobKey]);
            reminders = Sugar.Object.filter(reminders, function(reminder){
                if (!reminder || typeof reminder !== 'object') {
                    return false;
                }
                if (!reminder) {
                    return false;
                }
                if (!reminder.targetDate) {
                    return false;
                }
                var targetDate = Sugar.Date.create(reminder.targetDate);
                if (!Sugar.Date.isValid(targetDate)) {
                    return false;
                }
                return Sugar.Date.isFuture(targetDate);
            });
            // you cannot set an empty blob here, Matrix won't change the existing state.
            // So lets set a dummy state
            reminders.forceNotEmpty = 'dummy';
            container.setState(room, container.config.reminderName, reminders);
        } else {
            this.container.send(room, 'reminder not found: '+reminderKey);
        }
    }

};
