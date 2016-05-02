/**
 * Created by john on 3/29/16.
 */
"use strict";

module.exports = {
    container: null,
    setup: function(container) {

        container.bangCommands['concourse'] = {
            help: 'Get the current release notes or add a release note',
            args: ['update','wraith', 'test'],
            cb: this.setConcourse.bind(this)
        };

        container.senderCommands['@concourse:matrix.freelock.com'] =
            this.concourseMessage.bind(this);
        this.container = container;

        this.flyLogin();

        setInterval(this.flyLogin.bind(this), 8*3600*1000);

    },

    /**
     * BangCommand.
     *
     * @param room
     * @param body
     * @param event
     */
    setConcourse: function(room, body, event) {
        var container = this.container,
            args = container.parseArgs(body);
        var state = room.currentState.getStateEvents(container.config.stateName, 'alias'),
            alias = state.getContent().alias;

        if (!alias) {
            this.container.send(room, 'No alias/site configured here!');
            return;
        }

        if (!args[1]) {
            var self = this;
            var exec = require('child_process').exec;
            exec('fly -t concourse pipelines|grep "^'+alias+'\ "',
              function(err,stdout,stderr) {
                  if (err) {
                      self.container.send(room, 'Concourse is not set up for this project.','error');
                  } else {
                      self.container.send(room, 'A concourse pipeline is set up.');
                  }
              }
            );

            return;
        }

        switch (args[1]) {
            case 'update':
                this.setPipeline(room, body, alias);
                break;
            case 'wraith':
                this.runWraith(room, body, alias);
                break;

            case 'test':
                this.runWraith(room, body, alias);
                break;
        }

    },


    setPipeline: function(room, body, alias){
        var self = this, args = [
            alias,
            this.container.config.concourseCredentials
        ];

        var spawn = require('child_process').spawn,
            fly = spawn('./set_pipeline.sh', args, {
                cwd: this.container.config.concourseDir
            });

        fly.stdout.on('data', function(data){
            console.log('stdout:' + data);
        });

        fly.stderr.on('data', function(data){
            console.error('stderr:' +data);
        });

        fly.on('exit', function(code){
            if (code > 0) {
                self.container.send(room, 'Error setting pipeline. Check watney log.');

            }else {
                self.container.send(room, 'Pipeline set/updated!');
            }
        });

    },

    runWraith: function(room, body, alias) {
        var args = [
            '-t',
            'concourse',
            'trigger-job',
            '-j',
            alias + '/run-wraith'
        ];

        var spawn = require('child_process').spawn,
            fly = spawn('fly', args, {
            });

        fly.stdout.on('data', function(data){
            console.log('stdout:'+data);
        });

        fly.stderr.on('data', function(data){
            console.error('stderr:'+data);
        });

        fly.on('exit', function(code){
            console.log('fly login exited with code '+code);
        });
    },

    /**
     * Logins last approximately 12 hours.
     *
     * Log in at startup, and again every 8 hours.
     * Note: you must first log in on the shell with the full syntax - e.g.
     *
     * fly -t concourse login --concourse-url= http://path-to-concourse:8080.
     *
     * Set credentials in the app config.js, concourseUser and concoursePass
     */
    flyLogin: function() {
        var 
            args = [
            '-t',
            'concourse',
            'login',
            '--username',
            this.container.config.concourseUser,
            '--password',
            this.container.config.concoursePass
        ];

        console.log('Logging in with fly');
        
        // Now execute fly login...
        var spawn = require('child_process').spawn,
            fly = spawn('fly', args, {
            });

        fly.stdout.on('data', function(data){
            console.log('stdout:'+data);
        });

        fly.stderr.on('data', function(data){
            console.error('stderr:'+data);
        });

        fly.on('exit', function(code){
            console.log('fly login exited with code '+code);
        });
        
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
                        type = 'greenMessage';
                        break;
                    case 'fail':
                        type = 'error';
                }
                this.container.send(room, message, type);
            }
        }

    }
};
