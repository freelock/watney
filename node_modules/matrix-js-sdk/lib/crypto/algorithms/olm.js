/*
Copyright 2016 OpenMarket Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
"use strict";

/**
 * Defines m.olm encryption/decryption
 *
 * @module crypto/algorithms/olm
 */

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var utils = require("../../utils");
var olmlib = require("../olmlib");
var DeviceInfo = require("../deviceinfo");
var DeviceVerification = DeviceInfo.DeviceVerification;

var base = require("./base");

/**
 * Olm encryption implementation
 *
 * @constructor
 * @extends {module:crypto/algorithms/base.EncryptionAlgorithm}
 *
 * @param {object} params parameters, as per
 *     {@link module:crypto/algorithms/base.EncryptionAlgorithm}
 */
function OlmEncryption(params) {
    base.EncryptionAlgorithm.call(this, params);
    this._sessionPrepared = false;
    this._prepPromise = null;
}
utils.inherits(OlmEncryption, base.EncryptionAlgorithm);

/**
 * @private

 * @param {string[]} roomMembers list of currently-joined users in the room
 * @return {module:client.Promise} Promise which resolves when setup is complete
 */
OlmEncryption.prototype._ensureSession = function (roomMembers) {
    if (this._prepPromise) {
        // prep already in progress
        return this._prepPromise;
    }

    if (this._sessionPrepared) {
        // prep already done
        return _bluebird2.default.resolve();
    }

    var self = this;
    this._prepPromise = self._crypto.downloadKeys(roomMembers).then(function (res) {
        return self._crypto.ensureOlmSessionsForUsers(roomMembers);
    }).then(function () {
        self._sessionPrepared = true;
    }).finally(function () {
        self._prepPromise = null;
    });
    return this._prepPromise;
};

/**
 * @inheritdoc
 *
 * @param {module:models/room} room
 * @param {string} eventType
 * @param {object} content plaintext event content
 *
 * @return {module:client.Promise} Promise which resolves to the new event body
 */
OlmEncryption.prototype.encryptMessage = function (room, eventType, content) {
    // pick the list of recipients based on the membership list.
    //
    // TODO: there is a race condition here! What if a new user turns up
    // just as you are sending a secret message?

    var users = utils.map(room.getJoinedMembers(), function (u) {
        return u.userId;
    });

    var self = this;
    return this._ensureSession(users).then(function () {
        var payloadFields = {
            room_id: room.roomId,
            type: eventType,
            content: content
        };

        var encryptedContent = {
            algorithm: olmlib.OLM_ALGORITHM,
            sender_key: self._olmDevice.deviceCurve25519Key,
            ciphertext: {}
        };

        var promises = [];

        for (var i = 0; i < users.length; ++i) {
            var userId = users[i];
            var devices = self._crypto.getStoredDevicesForUser(userId);

            for (var j = 0; j < devices.length; ++j) {
                var deviceInfo = devices[j];
                var key = deviceInfo.getIdentityKey();
                if (key == self._olmDevice.deviceCurve25519Key) {
                    // don't bother sending to ourself
                    continue;
                }
                if (deviceInfo.verified == DeviceVerification.BLOCKED) {
                    // don't bother setting up sessions with blocked users
                    continue;
                }

                promises.push(olmlib.encryptMessageForDevice(encryptedContent.ciphertext, self._userId, self._deviceId, self._olmDevice, userId, deviceInfo, payloadFields));
            }
        }

        return _bluebird2.default.all(promises).return(encryptedContent);
    });
};

/**
 * Olm decryption implementation
 *
 * @constructor
 * @extends {module:crypto/algorithms/base.DecryptionAlgorithm}
 * @param {object} params parameters, as per
 *     {@link module:crypto/algorithms/base.DecryptionAlgorithm}
 */
function OlmDecryption(params) {
    base.DecryptionAlgorithm.call(this, params);
}
utils.inherits(OlmDecryption, base.DecryptionAlgorithm);

/**
 * @inheritdoc
 *
 * @param {MatrixEvent} event
 *
 * returns a promise which resolves to a
 * {@link module:crypto~EventDecryptionResult} once we have finished
 * decrypting. Rejects with an `algorithms.DecryptionError` if there is a
 * problem decrypting the event.
 */
OlmDecryption.prototype.decryptEvent = function () {
    var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(event) {
        var content, deviceKey, ciphertext, message, payloadString, payload, claimedKeys;
        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        content = event.getWireContent();
                        deviceKey = content.sender_key;
                        ciphertext = content.ciphertext;

                        if (ciphertext) {
                            _context.next = 5;
                            break;
                        }

                        throw new base.DecryptionError("Missing ciphertext");

                    case 5:
                        if (this._olmDevice.deviceCurve25519Key in ciphertext) {
                            _context.next = 7;
                            break;
                        }

                        throw new base.DecryptionError("Not included in recipients");

                    case 7:
                        message = ciphertext[this._olmDevice.deviceCurve25519Key];
                        payloadString = void 0;
                        _context.prev = 9;
                        _context.next = 12;
                        return (0, _bluebird.resolve)(this._decryptMessage(deviceKey, message));

                    case 12:
                        payloadString = _context.sent;
                        _context.next = 18;
                        break;

                    case 15:
                        _context.prev = 15;
                        _context.t0 = _context["catch"](9);
                        throw new base.DecryptionError("Bad Encrypted Message", {
                            sender: deviceKey,
                            err: _context.t0
                        });

                    case 18:
                        payload = JSON.parse(payloadString);

                        // check that we were the intended recipient, to avoid unknown-key attack
                        // https://github.com/vector-im/vector-web/issues/2483

                        if (!(payload.recipient != this._userId)) {
                            _context.next = 21;
                            break;
                        }

                        throw new base.DecryptionError("Message was intented for " + payload.recipient);

                    case 21:
                        if (!(payload.recipient_keys.ed25519 != this._olmDevice.deviceEd25519Key)) {
                            _context.next = 23;
                            break;
                        }

                        throw new base.DecryptionError("Message not intended for this device", {
                            intended: payload.recipient_keys.ed25519,
                            our_key: this._olmDevice.deviceEd25519Key
                        });

                    case 23:
                        if (!(payload.sender != event.getSender())) {
                            _context.next = 25;
                            break;
                        }

                        throw new base.DecryptionError("Message forwarded from " + payload.sender, {
                            reported_sender: event.getSender()
                        });

                    case 25:
                        if (!(payload.room_id !== event.getRoomId())) {
                            _context.next = 27;
                            break;
                        }

                        throw new base.DecryptionError("Message intended for room " + payload.room_id, {
                            reported_room: event.room_id
                        });

                    case 27:
                        claimedKeys = payload.keys || {};
                        return _context.abrupt("return", {
                            clearEvent: payload,
                            senderCurve25519Key: deviceKey,
                            claimedEd25519Key: claimedKeys.ed25519 || null
                        });

                    case 29:
                    case "end":
                        return _context.stop();
                }
            }
        }, _callee, this, [[9, 15]]);
    }));

    return function (_x) {
        return _ref.apply(this, arguments);
    };
}();

/**
 * Attempt to decrypt an Olm message
 *
 * @param {string} theirDeviceIdentityKey  Curve25519 identity key of the sender
 * @param {object} message  message object, with 'type' and 'body' fields
 *
 * @return {string} payload, if decrypted successfully.
 */
OlmDecryption.prototype._decryptMessage = function () {
    var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(theirDeviceIdentityKey, message) {
        var sessionIds, decryptionErrors, i, sessionId, payload, foundSession, res;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        _context2.next = 2;
                        return (0, _bluebird.resolve)(this._olmDevice.getSessionIdsForDevice(theirDeviceIdentityKey));

                    case 2:
                        sessionIds = _context2.sent;


                        // try each session in turn.
                        decryptionErrors = {};
                        i = 0;

                    case 5:
                        if (!(i < sessionIds.length)) {
                            _context2.next = 26;
                            break;
                        }

                        sessionId = sessionIds[i];
                        _context2.prev = 7;
                        _context2.next = 10;
                        return (0, _bluebird.resolve)(this._olmDevice.decryptMessage(theirDeviceIdentityKey, sessionId, message.type, message.body));

                    case 10:
                        payload = _context2.sent;

                        console.log("Decrypted Olm message from " + theirDeviceIdentityKey + " with session " + sessionId);
                        return _context2.abrupt("return", payload);

                    case 15:
                        _context2.prev = 15;
                        _context2.t0 = _context2["catch"](7);
                        _context2.next = 19;
                        return (0, _bluebird.resolve)(this._olmDevice.matchesSession(theirDeviceIdentityKey, sessionId, message.type, message.body));

                    case 19:
                        foundSession = _context2.sent;

                        if (!foundSession) {
                            _context2.next = 22;
                            break;
                        }

                        throw new Error("Error decrypting prekey message with existing session id " + sessionId + ": " + _context2.t0.message);

                    case 22:

                        // otherwise it's probably a message for another session; carry on, but
                        // keep a record of the error
                        decryptionErrors[sessionId] = _context2.t0.message;

                    case 23:
                        i++;
                        _context2.next = 5;
                        break;

                    case 26:
                        if (!(message.type !== 0)) {
                            _context2.next = 30;
                            break;
                        }

                        if (!(sessionIds.length === 0)) {
                            _context2.next = 29;
                            break;
                        }

                        throw new Error("No existing sessions");

                    case 29:
                        throw new Error("Error decrypting non-prekey message with existing sessions: " + (0, _stringify2.default)(decryptionErrors));

                    case 30:

                        // prekey message which doesn't match any existing sessions: make a new
                        // session.

                        res = void 0;
                        _context2.prev = 31;
                        _context2.next = 34;
                        return (0, _bluebird.resolve)(this._olmDevice.createInboundSession(theirDeviceIdentityKey, message.type, message.body));

                    case 34:
                        res = _context2.sent;
                        _context2.next = 41;
                        break;

                    case 37:
                        _context2.prev = 37;
                        _context2.t1 = _context2["catch"](31);

                        decryptionErrors["(new)"] = _context2.t1.message;
                        throw new Error("Error decrypting prekey message: " + (0, _stringify2.default)(decryptionErrors));

                    case 41:

                        console.log("created new inbound Olm session ID " + res.session_id + " with " + theirDeviceIdentityKey);
                        return _context2.abrupt("return", res.payload);

                    case 43:
                    case "end":
                        return _context2.stop();
                }
            }
        }, _callee2, this, [[7, 15], [31, 37]]);
    }));

    return function (_x2, _x3) {
        return _ref2.apply(this, arguments);
    };
}();

base.registerAlgorithm(olmlib.OLM_ALGORITHM, OlmEncryption, OlmDecryption);
//# sourceMappingURL=olm.js.map