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
        'prod_version',
        'prod_lastrelease',
        'clean_check',
        'last_check_time',
        'stage_lastdb',
        'test_wraith',
        'test_behat',
        'dev_user',
        'dev_lastdb',
        'policy',
        'targetDate',
        'maintenance'
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
        container.bangCommands['maintenance'] = {
            'help': 'List sites due for maintenance',
            cb: this.printMaintenance.bind(this)
        };
        container.PubSub.subscribe('project-state',
            this.updateWidget.bind(this)
            );
        this.container = container;

        container.getQuickStatus = this.getQuickStatus.bind(this);
        container.checkReleaseStatus = this.checkReleaseStatus.bind(this);
    },

    printStatus: function(room, body, event) {
        const container = this.container;
        let args = container.parseArgs(body), msg, alias = container.getState(room,'alias');
        if (args[1] == 'quick') {
            msg = this.getQuickStatus(room).summary;
            container.send(room, `${alias} - ${msg}`);
            return;
        }
        let data = this.loadStatus(room);
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
                break;
            default:
                data.status_color = 'white';
        }
        data.target_text = data.targetDate ? 'Scheduled: ' + data.targetDate + '<br/>' : '';
        data.behat_result = data.test_behat == 1 ? '<font color="green">Pass</font>' : '<font color="red">Not approved</font>';
        data.wraith_result = data.test_wraith == 1 ? '<font color="green">Pass</font>' : '<font color="red">Not approved</font>';
        data.claimed = data.dev_user ? '<h4>Claimed by ' + data.dev_user + '</h4>': '';

        msg = '<h2>{alias} Status</h2>' +
            '<fieldset>' +
            '<h3>Production</h3>' +
            '<font color="{clean_color}">{clean_text}</font><br>' +
            'Last release: {prod_lastrelease}<br>' +
            'Version: {prod_version}<br>' +
            'Policy: {policy}<br/><br>' +
            '<h3>Next release</h3>' +
            '{target_text}' +
            'Status: <font color="{status_color}">{state}</font><br>' +
            'Behat: {behat_result}<br>' +
            'Wraith: {wraith_result}<br>' +
            'Last Stage DB update: {stage_lastdb}<br>' +
            '<br>' +
            '<h3>Dev</h3>' +
            '{claimed}' +
            'Last checked: {last_check_time}<br>' +
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
            parts, queryString, url, content,
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
            release = container.getState(room, '', container.config.releaseName),
            parts = {}, content;
        if (release && release.targetDate) {
            parts.targetDate = release.targetDate;
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

    },

    /**
     * 
     * Returns icons for: dirty, behat, wraith, scheduled.
     * ✔️ ❌
     */
    getQuickStatus(room) {
        const container = this.container,
            status = this.loadStatus(room);
        let dirty = '❌', behat = '❌', wraith = '❌', release = '❌', releaseDate,
            result = {
                prod_clean: false,
                test_behat: false,
                test_wraith: false,
                ready: false,
                scheduled: false
            };
        if (status.clean_check == 'OK') {
            result.prod_clean = true;
            dirty = '✔️';
        }
        if (status.test_behat && (status.test_behat == 1)) {
            result.test_behat = true;
            behat = '✔️'
        }
        if (status.test_wraith && (status.test_wraith == 1)) {
            wraith = '✔️';
            result.test_wraith = true;
        }
        if (status.targetDate) {
            releaseDate = new Date(status.targetDate️).getTime();
            if (status.state == 'stage' && releaseDate > Date.now()) {
                release = '✔️';
                result.scheduled = true;
            }
        }
        result.ready = result.prod_clean && result.test_behat && result.test_wraith;
        result.summary = dirty + behat + wraith + release;
        return result;
    },

    /**
     * Release is ready to go if:
     * - state is 'stage"
     * - clean_check is "OK"
     * - test_behat is 1
     * - test_wraith is 1
     * - targetDate is in the future
     * @param {*} room 
     * @param immediate - set to true if release is triggered now (ignore reelease date)
     */
    checkReleaseStatus(room, immediate) {
        const container = this.container,
            status = this.loadStatus(room);
        let result = true, releaseDate;

        if (status.clean_check != 'OK') {
            return false;
        }
        if (status.state != 'stage') {
            return false;
        }
        if (status.test_behat != 1) {
            return false;
        }
        if (status.test_wraith != 1) {
            return false;
        }
        if (immediate) {
            return true;
        }
        if (status.targetDate) {
            releaseDate = new Date(status.targetDate️).getTime();
            if (releaseDate < Date.now()) {
                return false;
            }
        } else {
            return false;
        }
        return true;
    },

    /**
     * Sites are due for maintenance when:
     *   - maintenance == yes
     *   - now() - prod_lastrelease > 21 days
     * 
     * @param {*} room 
     * @param {*} body 
     * @param {*} event 
     */
    printMaintenance(room, body, event) {
        const container = this.container;
        if (!container.canLogin(event.getSender())) {
            container.send(room, 'Not authorized.', 'error');
            return;
        }
        let msg, days = 21, args = container.parseArgs(body);

        if (args[1] > 0) {
            days = args[1];
        }
        // Get the rooms that are 21 days since last prod release
        const alertRooms = container.roomList.filter(room => {
            const roomState = this.loadStatus(room);
            if (!(roomState && roomState.prod_lastrelease && roomState.maintenance)) {
                return false;
            }
            const lastRelease = new Date(roomState.prod_lastrelease),
              elapsed = Date.now() - lastRelease.getTime();
            return (roomState.maintenance === 'yes' && elapsed > (1000 * 86400 * days));
        }, this);
        if (!alertRooms.length) {
            msg = '<h3>Rooms that are due:</h3><ul><li>(None)</li></ul>';
            container.send(room, msg);
            return;
        }

        msg = alertRooms.reduce((msg, room) => {
            let roomState = this.loadStatus(room);
            msg += `<li>${roomState.alias} - ${roomState.state} - last: ${roomState.prod_lastrelease}</li>`;
            return msg;
        }, '<h3>Rooms that are due:</h3><ul>');
        msg += "</ul>";
        container.send(room, msg);
    }
};
