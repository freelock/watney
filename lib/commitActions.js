/**
 * Created by john on 3/29/16.
 *
 * This module listens and reacts to git commits sent by @gitolite:matrix.freelock.com.
 *
 * Current actions:
 *
 * - fire a salt event consisting of oldcommit, newcommit, project alias, branch.
 *
 * - Look for a room with an alias state set to the project alias, and enable the corresponding concourse pipeline.
 *
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
        const regexp = /^(.*):\ (.*\/([^\/]*))\ updated\.\ new:\ (.*)\ old:\ (.*)\ .$/;
        let matches = body.match(regexp);
        let data = {
            old: matches[5],
            new: matches[4],
            ref: matches[2],
            branch: matches[3]
        };
        const sudo = require('sudo');
        const call = sudo(['/usr/bin/salt-call', 'event.fire_master', JSON.stringify(data), 'fl/git/'+matches[1]]);

        call.stdout.on('data', function(data){
            console.log('stdout:' + data);
        });
        call.stderr.on('data', function(data){
            console.log('stderr:' + data);
        });

        // Publish data to "commit" topic
        data.alias = matches[1];
        this.container.PubSub.publish('commit', data)

    }
};
