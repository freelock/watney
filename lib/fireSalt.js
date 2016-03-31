/**
 * Created by john on 3/29/16.
 */
"use strict";

module.exports = {
    container: null,
    setup: function(container) {
        container.senderCommands['@gitolite:matrix.freelock.com'] =
            this.gitCommit.bind(this);
        this.container = container;
    },

    /**
    * Fire a salt event
    * @param event
    * @param room
    * @param body
    *
    * To make this work, the user account running this process should have a sudo entry allowing nopassword access to
    * salt-call event.fire_master.
    *
    * Git message: "alias: refs/heads/branchname updated. new: 858b385a8a06... old: 3e1826ee2.... .
    */
    gitCommit: function(room, body, event) {
        var regexp = /^(.*):\ (.*\/([^\/]*))\ updated\.\ new:\ (.*)\ old:\ (.*)\ .$/;
        var matches = body.match(regexp);
        var data = {
            old: matches[5],
            new: matches[4],
            ref: matches[2],
            branch: matches[3]
        };
        var sudo = require('sudo');
        var call = sudo(['/usr/bin/salt-call', 'event.fire_master', JSON.stringify(data), 'fl/git/'+matches[1]]);

        call.stdout.on('data', function(data){
            console.log(data);
        });
        call.stderr.on('data', function(data){
            console.log(data);
        });

    }
};
