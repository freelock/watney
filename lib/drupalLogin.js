/**
 * Created by john on 3/28/16.
 */

var Sugar = require('sugar');
module.exports = {
    container: null,
    setup: function(container) {
        container.bangCommands['login'] = {
            help: 'Get a login link for env - dev, stage, prod',
            args: ['{env}'],
            cb: this.login.bind(this)
        };
        container.bangCommands['links'] = {
            help: 'Get the links and aliases for this room\'s sites',
            args: ['{env}'],
            cb: this.links.bind(this)
        };
        container.canLogin = this.canLogin.bind(this);
        this.container = container;
    },

    login: function(room, body, event) {
        var container = this.container;
        if (!container.canLogin(event.getSender())) {
            this.container.send(room, 'Not authorized.', 'error');
            return;
        }
        var alias, platform, state = room.currentState.getStateEvents(container.config.stateName, 'alias'),
            platformstate = room.currentState.getStateEvents(container.config.stateName, 'platform');
        if (platformstate) {
            platform = platformstate.getContent().platform;
        }
        alias = state.getContent().alias;
        var env, user = '';
        var matches = body.match(/!login ([-a-z0-9_.]*)( ('|")?([-a-zA-Z0-9 _.]+)('|")?)?$/);
        if (matches) {
            env = matches[1];
            if (matches[4]) {
                user = matches[4];
            }
        }
        if (!env) {
            env = room.currentState.getStateEvents(container.config.stateName,'default_env');
            if (!env) {
                env = 'dev';
            }
        }
        if (user) {
            //  user = '"' + user + '"';
        }
        switch (platform) {
            case 'wp':
                if (!user) {
                    user = 'Admin';
                }
                var fullAlias = '@'+alias+'-'+env;
                var msg = 'Running <b>wp '+fullAlias+' login create '+ user+'</b>.';
                this.container.send(room, msg);

                var args = [fullAlias, 'login', 'create', user];
                // now execute wp
                var spawn = require('child_process').spawn,
                    wp = spawn('wp', args, {
                    });
                wp.stdout.on('data', function(data){
                    container.send(room, data, 'green');
                });

                wp.stderr.on('data', function(data){
                    container.send(room, 'wp returned an error: '+data, 'error');
                });

                wp.on('exit', function(code){
                    console.log('wp child exited with code '+code);
                });


                break;
            default:
                var fullAlias = '@'+alias+'.'+env;
                var msg = 'Running <b>drush '+fullAlias+' user-login '+ user+'</b>.';
                this.container.send(room, msg);

                var args = [fullAlias, 'uli', '--browser=0'];
                if (user) {
                    args.push(user);
                }
                // Now execute drush...
                var spawn = require('child_process').spawn,
                    drush = spawn('drush', args, {
                    });

                msg = '';
                drush.stdout.on('data', function(data){
                    msg += data.toString();
                    msg = msg.replace(/\/login/, '');
                    container.send(room, msg, 'green');
                });

                drush.stderr.on('data', function(data){
                    container.send(room, 'Drush returned an error: '+data, 'error');
                });

                drush.on('exit', function(code){
                    console.log('drush child exited with code '+code);
                });
        }

    },

    links: function(room, body, event) {
        var container = this.container,
            fullAlias, drushargs, spawn, drush,
           alias, args, state = room.currentState.getStateEvents(container.config.stateName, 'alias');
        alias = state.getContent().alias;
        args = container.parseArgs(body);
        env = args[1] ? args[1] : '';
        fullAlias = '@' + alias;
        if (env) {
            fullAlias += '.' + env;
        }

        if (!alias) {
            this.container.send(room, 'No alias set for this room.', 'error');
            return;
        }

        drushargs = ['sa', fullAlias, '--format=json'];
        spawn = require('child_process').spawn;
        drush = spawn('drush', drushargs, {});

        drush.stdout.on('data', function(data){
            var aliases = JSON.parse(data);
            var Notice = "<b>{alias}: {uri}</b><br/>", msg = '';
            Object.keys(aliases).forEach(function(element, key, _array) {
               var obj = aliases[element];
               obj.alias = element.replace(alias + '.', '');
               msg += Sugar.String.format(Notice, obj);

            });
            container.send(room, msg);
        });

        drush.stderr.on('data', function(data){
            container.send(room, 'Drush returned an error: '+data, 'error');
        });

        drush.on('exit', function(code){
            console.log('drush child exited with code '+code);
        });
    },

    canLogin: function(user_id) {
        var localmatch = user_id.match(/^@(.*):matrix\.freelock\.com$/);
        if (localmatch){
            return this.container.config.admins.indexOf(localmatch[1]) != -1;
        }
        return false;

    }
};