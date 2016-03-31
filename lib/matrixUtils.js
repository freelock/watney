/**
 * Created by john on 3/28/16.
 */
"use strict";

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
        this.container = container;
    },
    setRoomList: function() {
        var i, room, state, alias, container = this.container;
        container.roomList = container.mx.getRooms();
        for (i=0; i< container.roomList.length; i++){
            room= container.roomList[i];
            state = room.currentState.getStateEvents(container.config.stateName, 'alias');
            if (state) {
                alias = state.getContent().alias;
                if (alias) {
                    container.roomsByAlias[alias] = room;
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
            case 'message':
                // CAUTION! Use carefully, regular room messages are parsed for commands, don't get in a loop!
                method = 'sendHtmlMessage';
            case 'notice':
            default:
                // already set
        }
        this.container.mx[method](room.roomId, body, body);
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