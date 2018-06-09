/**
 * Email notifications for releases
 */

"use strict";

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const Mustache = require('mustache');
const mjml2html = require('mjml');
const nodemailer = require('nodemailer');
const htmlToText = require('nodemailer-html-to-text').htmlToText;

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

    defaultData: {
        mergeData: {},
        mergeFile: ''
    },
    /**
     * Accepts a PubSub event.
     * 
     * @param {string} topic -- PubSub event "notelify"
     * @param {object} data -- template🔗, alias🔗, mergeData, mergeFile
     */
    notelifyEvent(topic, data) {
      const items = {
        ...this.defaultData,
        ...data
      }
    }
}