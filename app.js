"use strict";

/**
 * Main app controller for Watney bot
 *
 * Uses a basic dependency injection model to allow libs to be built
 * with relatively self-contained code dedicated to a group of commands.
 *
 * This file should essentially wire them all together and start up
 * the core Matrix client.
 */

var config = require('./config');

var sdk = require("matrix-js-sdk");
var store = sdk.MatrixInMemoryStore();
var matrixClient = sdk.createClient({
    baseUrl: "https://matrix.freelock.com:8448",
    accessToken: config.myAccessToken,
    userId: config.myUserId,
    store: store
});
//var util = require('util');

// Syntactic sugar, including date parsing... see http://sugarjs.com
require('sugar');

// Global Data structures
var container = {
    // Array of all known rooms
    roomList: [],

    // Hash of rooms with an alias as the key
    roomsByAlias: {},

    // Last viewed room (unused?)
    viewingRoom: null,

    // Hash of !commands to parse, with key of the command and value of the callback
    bangCommands: {},

    // Hash of special handlers keyed by the sender
    senderCommands: {},

    // Hash of special rooms to listen to for extra functionality
    roomCommands: {},

    // Handles for scheduled jobs, should cancel these before overwriting
    scheduledJobs: {},

    // callbacks when roomlist changes, used to populate scheduledJobs...
    roomUpdates: [],

    /**
     * The methods below are added by matrixUtils on startup, and other modules may inject dependencies on them.
     */
    // Send method, set in matrixUtils, used to send a message to a room
    send: null,
    // Auth method, used to determine if event sender is an admin
    isAdmin: null,
    // Auth method, used to determine if event sender is allowed to execute a drush command
    canLogin: null,
    // command dispatcher, used to call a matching bangCommend on the container
    parseBang: null,

    mx: matrixClient,
    config: config,
    matrixUtils: null,
    PubSub: require('pubsub-js')
};

var numMessagesToShow = 10;

require('./lib/matrixUtils').setup(container);

// bangCommands
require('./lib/drupalLogin').setup(container);
require('./lib/release').setup(container);
require('./lib/drupalState').setup(container);
require('./lib/siteStatus').setup(container);
require('./lib/concoursePipelines').setup(container);
require('./lib/auriga').setup(container);
require('./lib/taiga').setup(container);
require('./lib/remind').setup(container);

// senderCommands
require('./lib/commitActions').setup(container);

var syncComplete = false;

matrixClient.on("sync", function(state, prevState, data) {
   switch (state) {
       case "ERROR":
           // update UI to say "Connection Lost"
           console.log(data);
           break;
       case "SYNCING":
           // update UI to remove any "Connection Lost" message
           break;
       case "PREPARED":
           // the client instance is ready to be queried.
           container.matrixUtils.setRoomList();
           console.log('Startup complete.');
           syncComplete = true;
           matrixClient.on("Room.timeline", readTimeline);
           break;
       default:
           console.log('sync:',state,prevState,data);
   }
});



matrixClient.on("Room", function(room){
console.log('processing room:', room.roomId, room.name);
    container.matrixUtils.setRoomList();

});

// search for messages I understand
var readTimeline = function(event, room, toStartOfTimeline) {
    if (toStartOfTimeline) {
        return; // don't print paginated results
    }

    var match, sender, room, body = "";
    if (event.getType() === "m.room.message") {
        body = event.getContent().body;
        if (match = container.parseBang(room, body, event)){
            console.log(match + ' fired.');
        } else {
            sender = event.getSender();
            if (container.senderCommands[sender]) {
                container.senderCommands[sender](room, body, event);
            }
        }
    }
    if (event.getType() == 'com.freelock.project') {
      console.log('timeline:',event);
    }
};

matrixClient.on("event", function(event) {
//    if (event.getType() == 'com.freelock.project') {
//      console.log('event:', event);
//    }
});

/**
 * Automatically join room when invited
 */
matrixClient.on("RoomMember.membership", function(event, member) {
    if (container.isAdmin(event.getSender())) {

        if (member.membership === "invite" && member.userId === config.myUserId) {
            matrixClient.joinRoom(member.roomId).done(function() {
                console.log("Auto-joined %s", member.roomId);
            });
        }
    }
});

matrixClient.startClient({
    initialSyncLimit: numMessagesToShow
});  // messages for each room.
