/**
 * Created by john on 3/28/16.
 */
"use strict";

module.exports = {
    container: null,
    setup: function(container) {
        container.bangCommands['state'] = {
            help: 'Set a freelock item to value, or retrieve value',
            args: ['{item} {value}'],
            cb: this.handleState.bind(this)
        };
        container.parseArgs = this.parseArgs.bind(this);
        this.container = container;
    },

    handleState: function(room, body, event) {
        let args, stateKey, item, value, msg = '',
            container = this.container,
            matrixClient = container.mx,
            states = room.currentState.getStateEvents(container.config.stateName);
        if (body === '!state') {
            if (states) {
                // print com.freelock state
                for (let i=0; i< states.length; i++) {
                    stateKey = states[i].getStateKey();
                    item = states[i].getContent();
                    value = item[stateKey];
                    if (value) {
                        msg += stateKey +": "+value + "<br/>\n";
                    }
                }
                container.send(room, msg);
            } else {
                container.send(room, 'No states set for room.');
            }

        } else {
            if (!container.isAdmin(event.getSender())){
                container.send(room, "Only admins can do that!", 'error');
                return;
            }
            args = container.parseArgs(body, true);
            args.shift();
            stateKey = args.shift();
            value = args.shift();
            let newState = {};
            newState[stateKey] = value;

            matrixClient.sendStateEvent(room.roomId, container.config.stateName, newState, stateKey)
                .then(function(){
                        container.send(room, stateKey + ' set to: '+value);
                    },
                    function(code,data){
                        let msg = 'There was a problem processing this request: '+code;
                        console.log('Error on setting state',code,data);
                        container.send(room, msg, 'error');

                    });
        }

    },

    parseArgs: function(str, lookForQuotes) {
        let args = [];
        let readingPart = false;
        let part = '';
        for(let i=0; i < str.length;i++) {
            if(str.charAt(i) === ' ' && !readingPart && part !=='') {
                args.push(part);
                part = '';
            } else {
                if (str.charAt(i) === '\"' && lookForQuotes) {
                    readingPart = !readingPart;
                } else {
                    part += str.charAt(i);
                }
            }
        }

        args.push(part);
        return args;

    }
};
