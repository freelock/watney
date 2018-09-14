# Watney, a Matrix bot

Watney is a bot that Freelock uses extensively internally for all kinds of things: kicking off builds, deploying sites, getting login links to Drupal sites, tracking time, building release notes, setting reminders, and a bunch of other tasks.

What is unusual about Watney is that it has no storage outside of Matrix -- everything it needs to store, it stores as state events inside a Matrix room. This does mean that for most operations, the Watney user needs to have a high enough power level to create state events.

This is used as an internal project, and so it's not yet polished up for any kind of public use. Most of the modules in the lib/* directory are extremely tailored to our internal environments, and may or may not be useful otherwise. However, it has been the backbone of our operations for a couple years already, and works extremely well.

To try it out, you will need to:

1. Create a Matrix user account for the bot, and get a login token through other means (you can do this by logging into the account using Riot and using developer tools to get a token).
2. Copy config-dist.js to config.js.
3. In config.js, configure, at a minimum:
- myUserId
- myAccesstoken
- admins -- localpart of your username -- for privileged actions, Watney only listens to this list.
- adminHomeServer -- homeserver of the admins
4. Start Watney with `node app.js`.
5. Invite your bot to a room, and give it powerlevel of 50 (for default room power levels).
6. Enter `!help` to get a list of commands, and go from there!

You can hit us up on Matrix at #lobby:matrix.freelock.com if you have any feedback, or would like some help getting something like this in place for your organization!