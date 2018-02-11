/**
 * Created by john on 3/28/16.
 *
 * JSON schema for this is evolving.
 *
 * Current complete set:
 *
 * com.freelock.project (alias) : {
 *   "alias": "diyz"
 * }
 *
 * com.freelock.project : {
 *   "alias": "",
 *   "version": "",
 *   "production.features": disabled, clean, overridden
 *   "production.config": clean, dirty
 *   "production.fs": clean, dirty
 *   "production.branch": master, dirty
 *   "production.deploy": yes, no, manual, skip-config
 *   "stage.lastdb": timestamp of last import
 *   "dev.lastdb": timestamp of last import
 *   "dev.branch": release, develop, feature
 *   "dev.fs": clean, dirty
 *   "dev.features": disabled, clean, overridden
 *   "dev.config": clean, dirty
 *   "state": released, stage, dev, clean
 *   "status": clean, dirty
 *   "dev_user": blank or user
 *   "policy": notifybefore, notifywhen, nonotify
 * }
 *
 *
 */
"use strict";

const Sugar = require('sugar');

module.exports = {
    container: null,

    dashboardKeys: [
        'alias',
        'state',
        'prod.version',
        'prod_lastrelease',
        'clean_check',
        'last_check_time',
        'stage_lastdb',
        'test_wraith',
        'test_behat',
        'dev_user',
        'dev_lastdb',
        'policy',
        'targetDate'
    ],

    setup: function(container) {
        container.bangCommands['status'] = {
            'help': 'print info about this site',
            cb: this.printStatus.bind(this)
        };
        container.bangCommands['room'] = {
            'help': 'print rooms this bot is in',
            cb: this.printRooms.bind(this)
        };
        container.PubSub.subscribe('project-state',
            this.updateWidget.bind(this)
            );
        this.container = container;
    },

    printStatus: function(room, body, event) {
        const container = this.container;
        let msg,
          data = this.loadStatus(room);
        if (data.clean_check == 'OK') {
            data.clean_text = 'Clean';
            data.clean_color = 'green';
        } else {
            data.clean_text = '<b>Dirty</b>';
            data.clean_color = 'red';
        }
        switch (data.state) {
            case 'dev':
                data.status_color = 'blue';
                break;
            case 'stage':
                data.status_color = 'orange';
                break;
            case 'released':
            case 'clean':
                data.status_color = 'green';
                break
            default:
                data.status_color = 'white';
        }
        data.target_text = data.targetDate ? 'Scheduled: ' + data.targetDate + '<br/>' : '';
        data.behat_result = data.test_behat ? '<font color="green">Pass</font>' : '<font color="red">Not approved</font>';
        data.wraith_result = data.test_wraith ? '<font color="green">Pass</font>' : '<font color="red">Not approved</font>';
        data.claimed = data.dev_user ? '<h4>Claimed by ' + data.dev_user + '</h4>': '';

        msg = '<h2>{alias} Status</h2>' +
            '<fieldset>' +
            '<h3>Production</h3>' +
            '<font color="{clean_color}">{clean_text}</font><br/>' +
            'Last release: {prod.last_release}<br/>' +
            'Version: {prod.version}<br/>' +
            'Policy: {policy}<br/><br/>' +
            '<h3>Next release</h3>' +
            '{target_text}' +
            'Status: <font color="{status_color}">{state}</font><br/>' +
            'Behat: {behat_result}<br/>' +
            'Wraith: {wraith_result}<br/>' +
            'Last Stage DB update: {stage_lastdb}<br/>' +
            '<br/>' +
            '<h3>Dev</h3>' +
            '{claimed}' +
            'Last checked: {last_check_time}<br/>' +
            'Last db: {dev_lastdb}' +
            '</fieldset>';
        container.send(room, Sugar.String.format(msg, data));
    },

    updateWidget: function(topic, data) {
        const container = this.container,
            room = data.room,
            dashboardKeys = this.dashboardKeys;
        let widget = room.currentState.getStateEvents('im.vector.modular.widgets','freelock_dashboard'),
            changes = data.event.getContent(), found,
            parts, queryString, url,
            keys = Object.keys(changes);

        // don't add widget if it's not already in the room...
        if (!widget) {
            return;
        }
        found = keys.filter(function(x) {
            return dashboardKeys.includes(x);
        });
        if (found.length) {
            // update dashboard...
            parts = this.loadStatus(room);

            url += parts.alias;
            queryString = Object.keys(parts).map(key => key + '=' + parts[key]).join('&');
            url += '?' + queryString;

            // Now update widget
            content = {
                type: 'com.freelock.dashboard',
                url: url,
                name: parts.alias + ' Dashboard'
            };
            container.mx.sendStateEvent(room.roomId, 'im.vector.modular.widgets', content, 'freelock_dashboard');
        }

    },

    loadStatus: function(room) {
        const dashboardKeys = this.dashboardKeys,
          container = this.container;
        let state = room.currentState.getStateEvents(container.config.stateName),
            targetDate = room.currentState.getStateEvents(container.config.releaseName, 'targetDate'),
            parts = {}, content;
        if (targetDate) {
            parts.targetDate = targetDate;
        }
        state.forEach(function(item){
            if (dashboardKeys.includes(item.getStateKey())) {
                content = item.getContent();
                parts[item.getStateKey()] = content[item.getStateKey()];
            }
        }, this);

        return parts;
    },

    printRooms: function(room, body, event) {
        const container = this.container;
        let roomHtml = [], msg, i;
        for (i=0; i<container.roomList.length;i++) {
            roomHtml.push(container.roomList[i].name);
        }
        msg = "<ul><li>" + roomHtml.join("</li>\n<li>") + "</li></ul>";
        container.send(room, msg);
        console.log(container.roomsByAlias);

    }
};
