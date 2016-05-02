/**
 * Created by john on 3/29/16.
 */
"use strict";

module.exports = {
    container: null,
    setup: function(container) {
        container.senderCommands['@concourse:matrix.freelock.com'] =
            this.concourseMessage.bind(this);
        this.container = container;



    },

    /**
    * Forward concourse notifications to room
    * @param event
    * @param room
    * @param body
    *
    * Concourse message: alias|job|trigger|message
    */
    concourseMessage: function(room, body, event) {
        var regexp = /^([^|]*)\|([^|]*)\|([^|]*)\|([^]*)$/;
        var matches = body.match(regexp), alias, job, trigger, message;
        if (matches) {
            alias = matches[1];
            job = matches[2];
            trigger = matches[3];
            message = matches[4];
            if (room = this.container.roomsByAlias[alias]) {
                var type = 'notice';
                switch (trigger) {
                    case 'end':
                        type = 'green';
                        break;
                    case 'fail':
                        type = 'error';
                }
                this.container.send(room, message, type);
            }
        }

    }
};
