/**
 * Email notifications for releases
 */

"use strict";

module.exports = {
    container: null,
    setup: function(container) {
        container.bangCommands['notelify'] = {
            'help': 'send a notification to a client',
            cb: this.notelify.bind(this)
        };

        container.PubSub.subscribe('notelify',
            this.notelifyEvent.bind(this)
        );
        this.container = container;
    },

    notelify(room, body, event) {

    },

    /**
     * Accepts a PubSub event.
     * 
     * @param {string} topic -- PubSub event "notelify"
     * @param {object} data -- template🔗, alias🔗, mergeData, mergeFile
     */
    notelifyEvent(topic, data) {

    }
}