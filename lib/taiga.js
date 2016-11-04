/**
 * Created by john on 9/10/16.
 */
"use strict";

var Sugar = require('sugar');
module.exports = {
    container: null,
    setup: function(container) {
        this.container = container;

        container.senderCommands['@taiga:matrix.freelock.com'] =
            this.taigaMessage.bind(this);

    },

    /**
     * Handle Taiga messages as desired.
     *
     * @param event
     * @param room
     * @param body
     *
     * Concourse message: alias|job|build|trigger|message
     */
    taigaMessage: function(room, body, event) {

        var content = event.getContent();
        if (content.msgtype == 'com.freelock.data') {
            var payload = content.data,
                container = this.container,
                message, action, project,
                alias, user_story, task, diff,
                timer_name, milestone, project_id = false,
                trigger, data,
                type = payload.type;

            if (type == 'test') {
                // skip...
                return;
            }

            action = payload.action;
            project = (payload.data && payload.data.project) ? payload.data.project : '';
            alias = this.getProjectAlias(project);
            if (!alias) {
                return;
            }

            switch(type) {
                case 'task':
                    user_story = payload.data.user_story;
                    timer_name = user_story.subject;
                    milestone = user_story.milestone;
                    if (milestone) {
                        project_id = this.getProjectAlias(milestone);
                    }
                    if (action == 'change') {
                        diff = payload.change.diff;
                        if (diff.status) {
                            message = "<b>{by}</b> changed <b>{item}</b> from <b>{from}</b> to <b>{to}</b>";
                            data = {
                                by: payload.by.username,
                                item: payload.data.subject,
                                from: diff.status.from,
                                to: diff.status.to,
                                timer_name: timer_name,
                                project_id: project_id,
                                alias: alias
                            };
                            if (diff.status.from == 'In progress') {
                                container.PubSub.publish('timerStop', data);
                            }
                            if (diff.status.to == 'In progress'){
                                container.PubSub.publish('timerStart', data);
                            }
                        }
                    }


                    break;
                case 'user_story':

                    break;

            }
            console.log(payload);

            if (room = container.roomsByAlias[alias]) {
                var msgtype = 'notice';
                if (data) {

                }
                // if "message" key, send as usual, otherwise exit here
                if (!message) {
                    return;
                }

                switch (trigger) {
                    case 'end':
                        msgtype = 'greenMessage';
                        break;
                    case 'fail':
                        msgtype = 'error';
                        break;
                }
                container.send(room, Sugar.String.format(message, data), msgtype);
            }
        }

    },

    getProjectAlias: function(project) {
        var name = project.name, i;
        if (i = name.indexOf(':')) {
            return name.substr(0, i);
        }
        return null;
    }


};