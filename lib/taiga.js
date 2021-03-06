/**
 * Created by john on 9/10/16.
 */
"use strict";

const Sugar = require('sugar');
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

        const content = event.getContent();
        if (content.msgtype === 'com.freelock.data') {
            let payload = content.data,
                container = this.container,
                message = '', action, project,
                alias, user_story, task, diff,
                timer_name, milestone, project_id = false,
                trigger, data,
                type = payload.type;

            if (type === 'test') {
                // skip...
                return;
            }

            action = payload.action;
            project = (payload.data && payload.data.project) ? payload.data.project : '';
            alias = this.getProjectAlias(project);
            if (!alias) {
                return;
            }
            data = {
              by: payload.by.username,
              item: payload.data.subject,
                source: 'taiga',
                id: payload.data.ref,
              alias: alias
            };

            switch(type) {
                case 'task':
                    user_story = payload.data.user_story;
                    timer_name = user_story.subject;
                    milestone = user_story.milestone;
                    if (milestone) {
                        project_id = this.getProjectAlias(milestone);
                    }
                    data.timer_name = timer_name;
                    data.project_id = project_id;
                    data.link = project.permalink + '/task/' + payload.data.ref;
                    data.itemtype = 'task';

                    if (action === 'change') {
                        diff = payload.change.diff;
                        if (diff.status) {
                            message = '<b>{by}</b> changed <b><a href="{link}">{item}</a></b> from <b>{from}</b> to <b>{to}</b>\n';
                            data.to = diff.status.to;
                            data.from = diff.status.from;

                            if (diff.status.from === 'In progress') {
                                container.PubSub.publish('timerStop', data);
                            }
                            if (diff.status.to === 'In progress'){
                                container.PubSub.publish('timerStart', data);
                            }
                            if (diff.status.to === 'Ready for release'){
                                container.PubSub.publish('releaseCase.add', data);
                            }
                            if (diff.status.from === 'Ready for release'){
                                container.PubSub.publish('releaseCase.remove', data);
                            }
                        }
                        if (payload.change.comment && payload.change.comment.length) {
                          message += 'Comment on <b><a href="{link}">{item}</a></b> by <b>{by}</b>: ' + payload.change.comment;
                        }
                      if (diff.description_diff) {
                        message += 'Task <b><a href="{link}">{item}</a></b> description changed by <b>{by}</b>';
                      }
                    } else if (action === 'create') {
                      message += 'New task created by <b>{by}</b>: <a href="{link}">{item}</a>';
                    }



                    break;
                case 'userstory':
                    user_story = payload.data;
                    timer_name = user_story.subject;
                    milestone = user_story.milestone;
                    if (milestone) {
                        project_id = this.getProjectAlias(milestone);
                    }
                    data.timer_name = timer_name;
                    data.project_id = project_id;
                    data.link = project.permalink + '/us/' + payload.data.ref;
                    data.itemtype = 'us';

                    if (action === 'change') {
                        diff = payload.change.diff;
                        if (diff.status) {
                            message = '<b>{by}</b> changed <b><a href="{link}">{item}</a></b> from <b>{from}</b> to <b>{to}</b>.';
                            data.to = diff.status.to;
                            data.from = diff.status.from;
                            if (diff.status.from === 'In progress') {
                                container.PubSub.publish('timerStop', data);
                            }
                            if (diff.status.to === 'In progress'){
                                container.PubSub.publish('timerStart', data);
                            }
                            if (diff.status.to === 'Ready for release'){
                                container.PubSub.publish('releaseCase.add', data);
                                message += ' Added to release.';
                            }
                            if (diff.status.from === 'Ready for release'){
                                container.PubSub.publish('releaseCase.remove', data);
                                message += ' Removed from release.';
                            }
                        }
                        if (diff.description_diff) {
                          message += 'User story <b><a href="{link}">{item}</a></b> description changed by <b>{by}</b>';
                        }
                      if (payload.change.comment && payload.change.comment.length) {
                        message += 'Comment on <b><a href="{link}">{item}</a></b> by <b>{by}</b>: ' + payload.change.comment;
                      }
                    } else if (action === 'create') {
                      message += 'New userstory created by <b>{by}</b>: <a href="{link}">{item}</a>';
                    }


                    break;
              case 'issue':
                data.link = project.permalink + '/issue/' + payload.data.ref;
                if (action === 'change') {
                  if (payload.change.comment && payload.change.comment.length) {
                    message += '{ping}: Comment on <b><a href="{link}">{item}</a></b> by <b>{by}</b>: ' + payload.change.comment;
                  } else if (payload.change.diff.description_diff) {
                    message += '{ping}: Issue <b><a href="{link}">{item}</a></b> description changed by <b>{by}</b>';
                  }
                  if (payload.change.diff.status) {
                    data.oldstatus = payload.change.diff.status.from;
                    data.newstatus = payload.change.diff.status.to;
                    message += '{ping}: Issue <b><a href="{link}">{item}</a></b> status changed from <b>{oldstatus}</b> to <b>{newstatus}</b>.'
                  }
                } else if (action === 'create') {
                  message += '{ping}: New issue created by <b>{by}</b>: <a href="{link}">{item}</a>';
                }


            }
            console.log(payload);

            if (room = container.roomsByAlias[alias]) {
                let msgtype = 'notice';
                if (data) {

                }
                // if "message" key, send as usual, otherwise exit here
                if (!message.length) {
                    return;
                }
                data.ping = this.getProjectManager(room);

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
        let name = project.name, i;
        if (!name) {
            return null;
        }
        if (i = name.indexOf(':')) {
            return name.substr(0, i);
        }
        return null;
    },

    getProjectManager: function(room) {
        const container = this.container;
        let projectManager = container.getState(room, 'projectManager');
        if (!projectManager) {
            projectManager = container.config.defaultProjectManager;
        }
        return projectManager;
    }


};
