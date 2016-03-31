/**
 * Created by john on 3/28/16.
 */

module.exports = {
    container: null,
    setup: function(container) {
        container.bangCommands['login'] = {
            help: 'Get a login link for env - dev, stage, prod',
            args: ['{env}'],
            cb: this.login.bind(this)
        };
        container.canLogin = this.canLogin.bind(this);
        this.container = container;
    },

    login: function(room, body, event) {
        var container = this.container,
            matrixClient = this.container.mx;
        if (!container.canLogin(event.getSender())) {
            this.container.send(room, 'Not authorized.', 'error');
            return;
        }
        var alias, state = room.currentState.getStateEvents(container.config.stateName, 'alias');
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

        drush.stdout.on('data', function(data){
            container.send(room, data, 'green');
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