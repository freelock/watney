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

    // Send method, set in matrixUtils
    send: null,
    isAdmin: null,
    canLogin: null,

    mx: matrixClient,
    config: config,
    matrixUtils: null
};

var numMessagesToShow = 1;

require('./lib/matrixUtils').setup(container);

// bangCommands
require('./lib/drupalLogin').setup(container);
require('./lib/release').setup(container);
require('./lib/drupalState').setup(container);
require('./lib/siteStatus').setup(container);

// senderCommands
require('./lib/fireSalt').setup(container);

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
           break;
   }
});



matrixClient.on("Room", function(){
    container.matrixUtils.setRoomList();

});

// search for messages I understand
matrixClient.on("Room.timeline", function(event, room, toStartOfTimeline) {
    if (toStartOfTimeline) {
        return; // don't print paginated results
    }

    var matches, cb, sender, room, body = "";
    if (event.getType() === "m.room.message") {
        body = event.getContent().body;
        // TIL: in JS regex, . does not match \n. To match any character including newlines, fastest is [^]*.
        matches = body.match(/^!([a-z]*)( [^]*)?$/);
        if (matches) {
            cb = container.bangCommands[matches[1]];
            if (cb) {
                // TODO: Handle help
                cb.cb(event, room, body);
            }
        } else {
            sender = event.getSender();
            if (container.senderCommands[sender]) {
                container.senderCommands[sender](event, room, body);
            }
        }
    }
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
