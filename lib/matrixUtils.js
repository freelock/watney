/**
 * Created by john on 3/28/16.
 */
"use strict";

var Sugar = require('sugar');
module.exports = {
    container: null,
    setup: function(container) {
        container.bangCommands['help'] = {
            help: "this message",
            cb: this.sendHelp.bind(this)
        };
        container.send = this.send.bind(this);
        container.isAdmin = this.isAdmin.bind(this);
        container.parseBang = this.parseBang.bind(this);
        container.matrixUtils = this;
        container.setState = this.setState.bind(this);
        container.getState = this.getState.bind(this);

        this.container = container;
    },
    setRoomList: function() {
        var i, room, state, alias, container = this.container;
        container.roomList = container.mx.getRooms();
        for (i=0; i< container.roomList.length; i++){
            room= container.roomList[i];
//                    console.log('loading room for: ', room.roomId, room.name);
            state = room.currentState.getStateEvents(container.config.stateName, 'alias');
            if (state) {
                alias = state.getContent().alias;
                if (alias) {
                    container.roomsByAlias[alias] = room;
                }
                else {
                    console.log('alias not found for: ', room.roomId, room.name);
                }
            }
        }
        container.roomList.sort(function(a,b) {
            // < 0 = a comes first (lower index) - we want high indexes = newer
            var aMsg = a.timeline[a.timeline.length-1];
            if (!aMsg) {
                return -1;
            }
            var bMsg = b.timeline[b.timeline.length-1];
            if (!bMsg) {
                return 1;
            }
            if (aMsg.getTs() > bMsg.getTs()) {
                return 1;
            }
            else if (aMsg.getTs() < bMsg.getTs()) {
                return -1;
            }
            return 0;
        });
        // now call any other module schedule setup
        container.roomUpdates.forEach(function(cb){
            cb();
        });
    },

    isAdmin: function(user_id) {
        var localmatch = user_id.match(/^@(.*):matrix\.freelock\.com$/);
        if (localmatch){
            return this.container.config.admins.indexOf(localmatch[1]) != -1;
        }
        return false;

    },

    send: function(room, body, type) {
        var method = 'sendHtmlNotice';
        switch (type) {
            case 'emote':
                method = 'sendHtmlEmote';
                break;
            case 'green':
                body = '<font color="green">' + body + '</font>';
                break;
            case 'error':
                // set text color
                body = '<font color="red">' + body + '</font>';
                break;
            case 'greenMessage':
                body = '<font color="green">' + body + '</font>';
                // Continue down to send message instead of notice
                // CHANGE! Send as notice...
                break;
            case 'message':
                // CAUTION! Use carefully, regular room messages are parsed for commands, don't get in a loop!
                method = 'sendHtmlMessage';
            case 'notice':
            default:
                // already set
        }
        this.container.mx[method](room.roomId, body, body);
    },

    /**
     * Get a single state key
     * 
     * @param room
     * @param stateKey
     * @param stateName, defaults to container.config.stateName
     * @returns {*}
     */
    getState: function(room, stateKey, stateName){
        var container = this.container, matrixClient = container.mx, timeout, next;
        if (!stateName) {
            stateName = container.config.stateName;
        }
        if (!stateKey) {
            stateKey = '';
        }
        var currState = room.currentState.getStateEvents(stateName, stateKey);
        if (currState && currState.getContent) {
            var props = currState.getContent();
            if (stateKey.length) {
                return props[stateKey];
            } else {
                return props;
            }
        } else {
            return undefined;
        }
    },
    /**
     * FIFO stack of states to set
     */
    stateStack: [],

    /**
     * Set a State key in the matrix room, with handling for rate limiting
     *
     * @param room - room object
     * @param stateName - string statename
     * @param data - object to set as state
     * @param stateKey - key to set
     * @param _processing - flag to indicate running from stack
     */
    setState: function(room, stateName, data, stateKey, _processing){
        var container = this.container, matrixClient = container.mx, timeout, next, props;
        // Make sure we have an object
        if (Sugar.Object.isString(data)) {
            var tmp = {};
            tmp[stateKey] = data;
            data = tmp;
        }
        // See if the state is already set to this
        var currState = room.currentState.getStateEvents(stateName, stateKey);
        if (currState && currState.getContent) {
            props = currState.getContent();
        } else {
            console.log('No current state for '+ stateKey);
            props = {};
        }
        if (Sugar.Object.isEqual(data, props)) {
            console.log('State matches current state.');
            return;
        }
        //console.log('old state for '+stateKey,currState.getContent()[stateKey]);

        // We are already rate-limited, add to stack
        if (this.stateStack.length) {
            this.stateStack.push([room, stateName, props, stateKey]);
            console.log('pushing to setState stack');
            return;
        }
        matrixClient.sendStateEvent(room.roomId, stateName, data, stateKey)
           .then(function(){
               props = data;
               console.log('state set:', room.roomId, stateName, data, stateKey);
           },
           function(errData){
               if (errData && errData.errcode && errData.errcode == 'M_LIMIT_EXCEEDED') {
                   timeout = data.data.retry_after_ms;
                   console.log('setState timeout, pushing');
                   this.stateStack.push([room, stateName, data, stateKey]);
                   setTimeout(container.setState,
                        timeout, room, stateName, data, stateKey, true);
               }
               else {
                   container.send(room, 'Error: ' + errData.errcode + ' Message: ' + errData.message + ' Data: '+data, 'error');
               }
           });
        if (_processing) {
            // we just processed the first one
            console.log('skip:',this.stateStack.shift());
            // do the next one on a timeout 2 seconds later...
            next = this.stateStack.shift();
            console.log('running from setState stack', next);
            setTimeout(container.setState,
              2000, next[0],next[1],next[2],next[3], true);
        }
    },

    parseBang: function(room, body, event){
        var matches, cb;
        // TIL: in JS regex, . does not match \n. To match any character including newlines, fastest is [^]*.
        matches = body.match(/^!([a-z]*)( [^]*)?$/);
        if (matches) {
            cb = this.container.bangCommands[matches[1]];
            if (cb) {
                cb.cb(room, body, event);
            }
            return matches[1];
        }
        return false;
    },

    sendHelp: function(room, body, event) {
        var item, cmds = this.container.bangCommands,
            body = "Hi, I'm Watney...<br/>\n" +
            "Your options: <br/><br/>\n\n";
        for (item in cmds){
            body += "<b>!" + item + " ";
            if (cmds[item].args) {
                body += "["+cmds[item].args.join('|')+"] ";
            }
            body += "</b>- " + cmds[item].help +"<br/>\n";
        }
        this.container.send(room, body, 'notice');
    }


};
