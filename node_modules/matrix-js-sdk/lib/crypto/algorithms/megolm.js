/*
Copyright 2015, 2016 OpenMarket Ltd

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
 * @module crypto/algorithms/megolm
 */

var _defineProperty2 = require("babel-runtime/helpers/defineProperty");

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _set = require("babel-runtime/core-js/set");

var _set2 = _interopRequireDefault(_set);

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var utils = require("../../utils");
var olmlib = require("../olmlib");
var base = require("./base");

/**
 * @private
 * @constructor
 *
 * @param {string} sessionId
 *
 * @property {string} sessionId
 * @property {Number} useCount     number of times this session has been used
 * @property {Number} creationTime when the session was created (ms since the epoch)
 *
 * @property {object} sharedWithDevices
 *    devices with which we have shared the session key
 *        userId -> {deviceId -> msgindex}
 */
function OutboundSessionInfo(sessionId) {
    this.sessionId = sessionId;
    this.useCount = 0;
    this.creationTime = new Date().getTime();
    this.sharedWithDevices = {};
}

/**
 * Check if it's time to rotate the session
 *
 * @param {Number} rotationPeriodMsgs
 * @param {Number} rotationPeriodMs
 * @return {Boolean}
 */
OutboundSessionInfo.prototype.needsRotation = function (rotationPeriodMsgs, rotationPeriodMs) {
    var sessionLifetime = new Date().getTime() - this.creationTime;

    if (this.useCount >= rotationPeriodMsgs || sessionLifetime >= rotationPeriodMs) {
        console.log("Rotating megolm session after " + this.useCount + " messages, " + sessionLifetime + "ms");
        return true;
    }

    return false;
};

OutboundSessionInfo.prototype.markSharedWithDevice = function (userId, deviceId, chainIndex) {
    if (!this.sharedWithDevices[userId]) {
        this.sharedWithDevices[userId] = {};
    }
    this.sharedWithDevices[userId][deviceId] = chainIndex;
};

/**
 * Determine if this session has been shared with devices which it shouldn't
 * have been.
 *
 * @param {Object} devicesInRoom userId -> {deviceId -> object}
 *   devices we should shared the session with.
 *
 * @return {Boolean} true if we have shared the session with devices which aren't
 * in devicesInRoom.
 */
OutboundSessionInfo.prototype.sharedWithTooManyDevices = function (devicesInRoom) {
    for (var userId in this.sharedWithDevices) {
        if (!this.sharedWithDevices.hasOwnProperty(userId)) {
            continue;
        }

        if (!devicesInRoom.hasOwnProperty(userId)) {
            console.log("Starting new session because we shared with " + userId);
            return true;
        }

        for (var deviceId in this.sharedWithDevices[userId]) {
            if (!this.sharedWithDevices[userId].hasOwnProperty(deviceId)) {
                continue;
            }

            if (!devicesInRoom[userId].hasOwnProperty(deviceId)) {
                console.log("Starting new session because we shared with " + userId + ":" + deviceId);
                return true;
            }
        }
    }
};

/**
 * Megolm encryption implementation
 *
 * @constructor
 * @extends {module:crypto/algorithms/base.EncryptionAlgorithm}
 *
 * @param {object} params parameters, as per
 *     {@link module:crypto/algorithms/base.EncryptionAlgorithm}
 */
function MegolmEncryption(params) {
    base.EncryptionAlgorithm.call(this, params);

    // the most recent attempt to set up a session. This is used to serialise
    // the session setups, so that we have a race-free view of which session we
    // are using, and which devices we have shared the keys with. It resolves
    // with an OutboundSessionInfo (or undefined, for the first message in the
    // room).
    this._setupPromise = _bluebird2.default.resolve();

    // default rotation periods
    this._sessionRotationPeriodMsgs = 100;
    this._sessionRotationPeriodMs = 7 * 24 * 3600 * 1000;

    if (params.config.rotation_period_ms !== undefined) {
        this._sessionRotationPeriodMs = params.config.rotation_period_ms;
    }

    if (params.config.rotation_period_msgs !== undefined) {
        this._sessionRotationPeriodMsgs = params.config.rotation_period_msgs;
    }
}
utils.inherits(MegolmEncryption, base.EncryptionAlgorithm);

/**
 * @private
 *
 * @param {Object} devicesInRoom The devices in this room, indexed by user ID
 *
 * @return {module:client.Promise} Promise which resolves to the
 *    OutboundSessionInfo when setup is complete.
 */
MegolmEncryption.prototype._ensureOutboundSession = function (devicesInRoom) {

    // takes the previous OutboundSessionInfo, and considers whether to create
    // a new one. Also shares the key with any (new) devices in the room.
    // Updates `session` to hold the final OutboundSessionInfo.
    //
    // returns a promise which resolves once the keyshare is successful.
    var prepareSession = function () {
        var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(oldSession) {
            var shareMap, userId, userDevices, deviceId, deviceInfo, key;
            return _regenerator2.default.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            session = oldSession;

                            // need to make a brand new session?
                            if (session && session.needsRotation(self._sessionRotationPeriodMsgs, self._sessionRotationPeriodMs)) {
                                console.log("Starting new megolm session because we need to rotate.");
                                session = null;
                            }

                            // determine if we have shared with anyone we shouldn't have
                            if (session && session.sharedWithTooManyDevices(devicesInRoom)) {
                                session = null;
                            }

                            if (session) {
                                _context.next = 8;
                                break;
                            }

                            console.log("Starting new megolm session for room " + self._roomId);
                            _context.next = 7;
                            return (0, _bluebird.resolve)(self._prepareNewSession());

                        case 7:
                            session = _context.sent;

                        case 8:

                            // now check if we need to share with any devices
                            shareMap = {};
                            _context.t0 = _regenerator2.default.keys(devicesInRoom);

                        case 10:
                            if ((_context.t1 = _context.t0()).done) {
                                _context.next = 29;
                                break;
                            }

                            userId = _context.t1.value;

                            if (devicesInRoom.hasOwnProperty(userId)) {
                                _context.next = 14;
                                break;
                            }

                            return _context.abrupt("continue", 10);

                        case 14:
                            userDevices = devicesInRoom[userId];
                            _context.t2 = _regenerator2.default.keys(userDevices);

                        case 16:
                            if ((_context.t3 = _context.t2()).done) {
                                _context.next = 27;
                                break;
                            }

                            deviceId = _context.t3.value;

                            if (userDevices.hasOwnProperty(deviceId)) {
                                _context.next = 20;
                                break;
                            }

                            return _context.abrupt("continue", 16);

                        case 20:
                            deviceInfo = userDevices[deviceId];
                            key = deviceInfo.getIdentityKey();

                            if (!(key == self._olmDevice.deviceCurve25519Key)) {
                                _context.next = 24;
                                break;
                            }

                            return _context.abrupt("continue", 16);

                        case 24:

                            if (!session.sharedWithDevices[userId] || session.sharedWithDevices[userId][deviceId] === undefined) {
                                shareMap[userId] = shareMap[userId] || [];
                                shareMap[userId].push(deviceInfo);
                            }
                            _context.next = 16;
                            break;

                        case 27:
                            _context.next = 10;
                            break;

                        case 29:
                            return _context.abrupt("return", self._shareKeyWithDevices(session, shareMap));

                        case 30:
                        case "end":
                            return _context.stop();
                    }
                }
            }, _callee, this);
        }));

        return function prepareSession(_x) {
            return _ref.apply(this, arguments);
        };
    }();

    // helper which returns the session prepared by prepareSession


    var self = this;

    var session = void 0;function returnSession() {
        return session;
    }

    // first wait for the previous share to complete
    var prom = this._setupPromise.then(prepareSession);

    // _setupPromise resolves to `session` whether or not the share succeeds
    this._setupPromise = prom.then(returnSession, returnSession);

    // but we return a promise which only resolves if the share was successful.
    return prom.then(returnSession);
};

/**
 * @private
 *
 * @return {module:crypto/algorithms/megolm.OutboundSessionInfo} session
 */
MegolmEncryption.prototype._prepareNewSession = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2() {
    var sessionId, key;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
            switch (_context2.prev = _context2.next) {
                case 0:
                    sessionId = this._olmDevice.createOutboundGroupSession();
                    key = this._olmDevice.getOutboundGroupSessionKey(sessionId);
                    _context2.next = 4;
                    return (0, _bluebird.resolve)(this._olmDevice.addInboundGroupSession(this._roomId, this._olmDevice.deviceCurve25519Key, [], sessionId, key.key, { ed25519: this._olmDevice.deviceEd25519Key }));

                case 4:
                    return _context2.abrupt("return", new OutboundSessionInfo(sessionId));

                case 5:
                case "end":
                    return _context2.stop();
            }
        }
    }, _callee2, this);
}));

/**
 * @private
 *
 * @param {module:crypto/algorithms/megolm.OutboundSessionInfo} session
 *
 * @param {number} chainIndex current chain index
 *
 * @param {object<userId, deviceId>} devicemap
 *   mapping from userId to deviceId to {@link module:crypto~OlmSessionResult}
 *
 * @param {object<string, module:crypto/deviceinfo[]>} devicesByUser
 *    map from userid to list of devices
 *
 * @return {array<object<userid, deviceInfo>>}
 */
MegolmEncryption.prototype._splitUserDeviceMap = function (session, chainIndex, devicemap, devicesByUser) {
    var maxToDeviceMessagesPerRequest = 20;

    // use an array where the slices of a content map gets stored
    var mapSlices = [];
    var currentSliceId = 0; // start inserting in the first slice
    var entriesInCurrentSlice = 0;

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = (0, _getIterator3.default)((0, _keys2.default)(devicesByUser)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var userId = _step.value;

            var devicesToShareWith = devicesByUser[userId];
            var sessionResults = devicemap[userId];

            for (var i = 0; i < devicesToShareWith.length; i++) {
                var deviceInfo = devicesToShareWith[i];
                var deviceId = deviceInfo.deviceId;

                var sessionResult = sessionResults[deviceId];
                if (!sessionResult.sessionId) {
                    // no session with this device, probably because there
                    // were no one-time keys.
                    //
                    // we could send them a to_device message anyway, as a
                    // signal that they have missed out on the key sharing
                    // message because of the lack of keys, but there's not
                    // much point in that really; it will mostly serve to clog
                    // up to_device inboxes.

                    // mark this device as "handled" because we don't want to try
                    // to claim a one-time-key for dead devices on every message.
                    session.markSharedWithDevice(userId, deviceId, chainIndex);

                    // ensureOlmSessionsForUsers has already done the logging,
                    // so just skip it.
                    continue;
                }

                console.log("share keys with device " + userId + ":" + deviceId);

                if (entriesInCurrentSlice > maxToDeviceMessagesPerRequest) {
                    // the current slice is filled up. Start inserting into the next slice
                    entriesInCurrentSlice = 0;
                    currentSliceId++;
                }
                if (!mapSlices[currentSliceId]) {
                    mapSlices[currentSliceId] = [];
                }

                mapSlices[currentSliceId].push({
                    userId: userId,
                    deviceInfo: deviceInfo
                });

                entriesInCurrentSlice++;
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    return mapSlices;
};

/**
 * @private
 *
 * @param {module:crypto/algorithms/megolm.OutboundSessionInfo} session
 *
 * @param {number} chainIndex current chain index
 *
 * @param {object<userId, deviceInfo>} userDeviceMap
 *   mapping from userId to deviceInfo
 *
 * @param {object} payload fields to include in the encrypted payload
 *
 * @return {module:client.Promise} Promise which resolves once the key sharing
 *     for the given userDeviceMap is generated and has been sent.
 */
MegolmEncryption.prototype._encryptAndSendKeysToDevices = function (session, chainIndex, userDeviceMap, payload) {
    var _this = this;

    var encryptedContent = {
        algorithm: olmlib.OLM_ALGORITHM,
        sender_key: this._olmDevice.deviceCurve25519Key,
        ciphertext: {}
    };
    var contentMap = {};

    var promises = [];
    for (var i = 0; i < userDeviceMap.length; i++) {
        var val = userDeviceMap[i];
        var userId = val.userId;
        var deviceInfo = val.deviceInfo;
        var deviceId = deviceInfo.deviceId;

        if (!contentMap[userId]) {
            contentMap[userId] = {};
        }
        contentMap[userId][deviceId] = encryptedContent;

        promises.push(olmlib.encryptMessageForDevice(encryptedContent.ciphertext, this._userId, this._deviceId, this._olmDevice, userId, deviceInfo, payload));
    }

    return _bluebird2.default.all(promises).then(function () {
        return _this._baseApis.sendToDevice("m.room.encrypted", contentMap).then(function () {
            // store that we successfully uploaded the keys of the current slice
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = (0, _getIterator3.default)((0, _keys2.default)(contentMap)), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var _userId = _step2.value;
                    var _iteratorNormalCompletion3 = true;
                    var _didIteratorError3 = false;
                    var _iteratorError3 = undefined;

                    try {
                        for (var _iterator3 = (0, _getIterator3.default)((0, _keys2.default)(contentMap[_userId])), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            var _deviceId = _step3.value;

                            session.markSharedWithDevice(_userId, _deviceId, chainIndex);
                        }
                    } catch (err) {
                        _didIteratorError3 = true;
                        _iteratorError3 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                                _iterator3.return();
                            }
                        } finally {
                            if (_didIteratorError3) {
                                throw _iteratorError3;
                            }
                        }
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        });
    });
};

/**
 * @private
 *
 * @param {module:crypto/algorithms/megolm.OutboundSessionInfo} session
 *
 * @param {object<string, module:crypto/deviceinfo[]>} devicesByUser
 *    map from userid to list of devices
 */
MegolmEncryption.prototype._shareKeyWithDevices = function () {
    var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3(session, devicesByUser) {
        var key, payload, devicemap, userDeviceMaps, i;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        key = this._olmDevice.getOutboundGroupSessionKey(session.sessionId);
                        payload = {
                            type: "m.room_key",
                            content: {
                                algorithm: olmlib.MEGOLM_ALGORITHM,
                                room_id: this._roomId,
                                session_id: session.sessionId,
                                session_key: key.key,
                                chain_index: key.chain_index
                            }
                        };
                        _context3.next = 4;
                        return (0, _bluebird.resolve)(olmlib.ensureOlmSessionsForDevices(this._olmDevice, this._baseApis, devicesByUser));

                    case 4:
                        devicemap = _context3.sent;
                        userDeviceMaps = this._splitUserDeviceMap(session, key.chain_index, devicemap, devicesByUser);
                        i = 0;

                    case 7:
                        if (!(i < userDeviceMaps.length)) {
                            _context3.next = 21;
                            break;
                        }

                        _context3.prev = 8;
                        _context3.next = 11;
                        return (0, _bluebird.resolve)(this._encryptAndSendKeysToDevices(session, key.chain_index, userDeviceMaps[i], payload));

                    case 11:
                        console.log("Completed megolm keyshare in " + this._roomId + " " + ("(slice " + (i + 1) + "/" + userDeviceMaps.length + ")"));
                        _context3.next = 18;
                        break;

                    case 14:
                        _context3.prev = 14;
                        _context3.t0 = _context3["catch"](8);

                        console.log("megolm keyshare in " + this._roomId + " " + ("(slice " + (i + 1) + "/" + userDeviceMaps.length + ") failed"));

                        throw _context3.t0;

                    case 18:
                        i++;
                        _context3.next = 7;
                        break;

                    case 21:
                    case "end":
                        return _context3.stop();
                }
            }
        }, _callee3, this, [[8, 14]]);
    }));

    return function (_x2, _x3) {
        return _ref3.apply(this, arguments);
    };
}();

/**
 * @inheritdoc
 *
 * @param {module:models/room} room
 * @param {string} eventType
 * @param {object} content plaintext event content
 *
 * @return {module:client.Promise} Promise which resolves to the new event body
 */
MegolmEncryption.prototype.encryptMessage = function (room, eventType, content) {
    var self = this;
    console.log("Starting to encrypt event for " + this._roomId);

    return this._getDevicesInRoom(room).then(function (devicesInRoom) {
        // check if any of these devices are not yet known to the user.
        // if so, warn the user so they can verify or ignore.
        self._checkForUnknownDevices(devicesInRoom);

        return self._ensureOutboundSession(devicesInRoom);
    }).then(function (session) {
        var payloadJson = {
            room_id: self._roomId,
            type: eventType,
            content: content
        };

        var ciphertext = self._olmDevice.encryptGroupMessage(session.sessionId, (0, _stringify2.default)(payloadJson));

        var encryptedContent = {
            algorithm: olmlib.MEGOLM_ALGORITHM,
            sender_key: self._olmDevice.deviceCurve25519Key,
            ciphertext: ciphertext,
            session_id: session.sessionId,
            // Include our device ID so that recipients can send us a
            // m.new_device message if they don't have our session key.
            device_id: self._deviceId
        };

        session.useCount++;
        return encryptedContent;
    });
};

/**
 * Checks the devices we're about to send to and see if any are entirely
 * unknown to the user.  If so, warn the user, and mark them as known to
 * give the user a chance to go verify them before re-sending this message.
 *
 * @param {Object} devicesInRoom userId -> {deviceId -> object}
 *   devices we should shared the session with.
 */
MegolmEncryption.prototype._checkForUnknownDevices = function (devicesInRoom) {
    var unknownDevices = {};

    (0, _keys2.default)(devicesInRoom).forEach(function (userId) {
        (0, _keys2.default)(devicesInRoom[userId]).forEach(function (deviceId) {
            var device = devicesInRoom[userId][deviceId];
            if (device.isUnverified() && !device.isKnown()) {
                if (!unknownDevices[userId]) {
                    unknownDevices[userId] = {};
                }
                unknownDevices[userId][deviceId] = device;
            }
        });
    });

    if ((0, _keys2.default)(unknownDevices).length) {
        // it'd be kind to pass unknownDevices up to the user in this error
        throw new base.UnknownDeviceError("This room contains unknown devices which have not been verified. " + "We strongly recommend you verify them before continuing.", unknownDevices);
    }
};

/**
 * Get the list of unblocked devices for all users in the room
 *
 * @param {module:models/room} room
 *
 * @return {module:client.Promise} Promise which resolves to a map
 *     from userId to deviceId to deviceInfo
 */
MegolmEncryption.prototype._getDevicesInRoom = function (room) {
    var _this2 = this;

    // XXX what about rooms where invitees can see the content?
    var roomMembers = utils.map(room.getJoinedMembers(), function (u) {
        return u.userId;
    });

    // We are happy to use a cached version here: we assume that if we already
    // have a list of the user's devices, then we already share an e2e room
    // with them, which means that they will have announced any new devices via
    // an m.new_device.
    //
    // XXX: what if the cache is stale, and the user left the room we had in
    // common and then added new devices before joining this one? --Matthew
    //
    // yup, see https://github.com/vector-im/riot-web/issues/2305 --richvdh
    return this._crypto.downloadKeys(roomMembers, false).then(function (devices) {
        // remove any blocked devices
        for (var userId in devices) {
            if (!devices.hasOwnProperty(userId)) {
                continue;
            }

            var userDevices = devices[userId];
            for (var deviceId in userDevices) {
                if (!userDevices.hasOwnProperty(deviceId)) {
                    continue;
                }

                if (userDevices[deviceId].isBlocked() || userDevices[deviceId].isUnverified() && (room.getBlacklistUnverifiedDevices() || _this2._crypto.getGlobalBlacklistUnverifiedDevices())) {
                    delete userDevices[deviceId];
                }
            }
        }

        return devices;
    });
};

/**
 * Megolm decryption implementation
 *
 * @constructor
 * @extends {module:crypto/algorithms/base.DecryptionAlgorithm}
 *
 * @param {object} params parameters, as per
 *     {@link module:crypto/algorithms/base.DecryptionAlgorithm}
 */
function MegolmDecryption(params) {
    base.DecryptionAlgorithm.call(this, params);

    // events which we couldn't decrypt due to unknown sessions / indexes: map from
    // senderKey|sessionId to Set of MatrixEvents
    this._pendingEvents = {};

    // this gets stubbed out by the unit tests.
    this.olmlib = olmlib;
}
utils.inherits(MegolmDecryption, base.DecryptionAlgorithm);

/**
 * @inheritdoc
 *
 * @param {MatrixEvent} event
 *
 * returns a promise which resolves to a
 * {@link module:crypto~EventDecryptionResult} once we have finished
 * decrypting, or rejects with an `algorithms.DecryptionError` if there is a
 * problem decrypting the event.
 */
MegolmDecryption.prototype.decryptEvent = function () {
    var _ref4 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee4(event) {
        var content, res, payload;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        content = event.getWireContent();

                        if (!(!content.sender_key || !content.session_id || !content.ciphertext)) {
                            _context4.next = 3;
                            break;
                        }

                        throw new base.DecryptionError("Missing fields in input");

                    case 3:

                        // we add the event to the pending list *before* we start decryption.
                        //
                        // then, if the key turns up while decryption is in progress (and
                        // decryption fails), we will schedule a retry.
                        // (fixes https://github.com/vector-im/riot-web/issues/5001)
                        this._addEventToPendingList(event);

                        res = void 0;
                        _context4.prev = 5;
                        _context4.next = 8;
                        return (0, _bluebird.resolve)(this._olmDevice.decryptGroupMessage(event.getRoomId(), content.sender_key, content.session_id, content.ciphertext, event.getId(), event.getTs()));

                    case 8:
                        res = _context4.sent;
                        _context4.next = 15;
                        break;

                    case 11:
                        _context4.prev = 11;
                        _context4.t0 = _context4["catch"](5);

                        if (_context4.t0.message === 'OLM.UNKNOWN_MESSAGE_INDEX') {
                            this._requestKeysForEvent(event);
                        }
                        throw new base.DecryptionError(_context4.t0.toString(), {
                            session: content.sender_key + '|' + content.session_id
                        });

                    case 15:
                        if (!(res === null)) {
                            _context4.next = 18;
                            break;
                        }

                        // We've got a message for a session we don't have.
                        //
                        // (XXX: We might actually have received this key since we started
                        // decrypting, in which case we'll have scheduled a retry, and this
                        // request will be redundant. We could probably check to see if the
                        // event is still in the pending list; if not, a retry will have been
                        // scheduled, so we needn't send out the request here.)
                        this._requestKeysForEvent(event);
                        throw new base.DecryptionError("The sender's device has not sent us the keys for this message.", {
                            session: content.sender_key + '|' + content.session_id
                        });

                    case 18:

                        // success. We can remove the event from the pending list, if that hasn't
                        // already happened.
                        this._removeEventFromPendingList(event);

                        payload = JSON.parse(res.result);

                        // belt-and-braces check that the room id matches that indicated by the HS
                        // (this is somewhat redundant, since the megolm session is scoped to the
                        // room, so neither the sender nor a MITM can lie about the room_id).

                        if (!(payload.room_id !== event.getRoomId())) {
                            _context4.next = 22;
                            break;
                        }

                        throw new base.DecryptionError("Message intended for room " + payload.room_id);

                    case 22:
                        return _context4.abrupt("return", {
                            clearEvent: payload,
                            senderCurve25519Key: res.senderKey,
                            claimedEd25519Key: res.keysClaimed.ed25519,
                            forwardingCurve25519KeyChain: res.forwardingCurve25519KeyChain
                        });

                    case 23:
                    case "end":
                        return _context4.stop();
                }
            }
        }, _callee4, this, [[5, 11]]);
    }));

    return function (_x4) {
        return _ref4.apply(this, arguments);
    };
}();

MegolmDecryption.prototype._requestKeysForEvent = function (event) {
    var sender = event.getSender();
    var wireContent = event.getWireContent();

    // send the request to all of our own devices, and the
    // original sending device if it wasn't us.
    var recipients = [{
        userId: this._userId, deviceId: '*'
    }];
    if (sender != this._userId) {
        recipients.push({
            userId: sender, deviceId: wireContent.device_id
        });
    }

    this._crypto.requestRoomKey({
        room_id: event.getRoomId(),
        algorithm: wireContent.algorithm,
        sender_key: wireContent.sender_key,
        session_id: wireContent.session_id
    }, recipients);
};

/**
 * Add an event to the list of those awaiting their session keys.
 *
 * @private
 *
 * @param {module:models/event.MatrixEvent} event
 */
MegolmDecryption.prototype._addEventToPendingList = function (event) {
    var content = event.getWireContent();
    var k = content.sender_key + "|" + content.session_id;
    if (!this._pendingEvents[k]) {
        this._pendingEvents[k] = new _set2.default();
    }
    this._pendingEvents[k].add(event);
};

/**
 * Remove an event from the list of those awaiting their session keys.
 *
 * @private
 *
 * @param {module:models/event.MatrixEvent} event
 */
MegolmDecryption.prototype._removeEventFromPendingList = function (event) {
    var content = event.getWireContent();
    var k = content.sender_key + "|" + content.session_id;
    if (!this._pendingEvents[k]) {
        return;
    }

    this._pendingEvents[k].delete(event);
    if (this._pendingEvents[k].size === 0) {
        delete this._pendingEvents[k];
    }
};

/**
 * @inheritdoc
 *
 * @param {module:models/event.MatrixEvent} event key event
 */
MegolmDecryption.prototype.onRoomKeyEvent = function (event) {
    var _this3 = this;

    var content = event.getContent();
    var sessionId = content.session_id;
    var senderKey = event.getSenderKey();
    var forwardingKeyChain = [];
    var exportFormat = false;
    var keysClaimed = void 0;

    if (!content.room_id || !sessionId || !content.session_key) {
        console.error("key event is missing fields");
        return;
    }

    if (!senderKey) {
        console.error("key event has no sender key (not encrypted?)");
        return;
    }

    if (event.getType() == "m.forwarded_room_key") {
        exportFormat = true;
        forwardingKeyChain = content.forwarding_curve25519_key_chain;
        if (!utils.isArray(forwardingKeyChain)) {
            forwardingKeyChain = [];
        }

        // copy content before we modify it
        forwardingKeyChain = forwardingKeyChain.slice();
        forwardingKeyChain.push(senderKey);

        senderKey = content.sender_key;
        if (!senderKey) {
            console.error("forwarded_room_key event is missing sender_key field");
            return;
        }

        var ed25519Key = content.sender_claimed_ed25519_key;
        if (!ed25519Key) {
            console.error("forwarded_room_key_event is missing sender_claimed_ed25519_key field");
            return;
        }

        keysClaimed = {
            ed25519: ed25519Key
        };
    } else {
        keysClaimed = event.getKeysClaimed();
    }

    console.log("Adding key for megolm session " + senderKey + "|" + sessionId);
    this._olmDevice.addInboundGroupSession(content.room_id, senderKey, forwardingKeyChain, sessionId, content.session_key, keysClaimed, exportFormat).then(function () {
        // cancel any outstanding room key requests for this session
        _this3._crypto.cancelRoomKeyRequest({
            algorithm: content.algorithm,
            room_id: content.room_id,
            session_id: content.session_id,
            sender_key: senderKey
        });

        // have another go at decrypting events sent with this session.
        _this3._retryDecryption(senderKey, sessionId);
    }).catch(function (e) {
        console.error("Error handling m.room_key_event: " + e);
    });
};

/**
 * @inheritdoc
 */
MegolmDecryption.prototype.hasKeysForKeyRequest = function (keyRequest) {
    var body = keyRequest.requestBody;

    return this._olmDevice.hasInboundSessionKeys(body.room_id, body.sender_key, body.session_id);
};

/**
 * @inheritdoc
 */
MegolmDecryption.prototype.shareKeysWithDevice = function (keyRequest) {
    var _this4 = this;

    var userId = keyRequest.userId;
    var deviceId = keyRequest.deviceId;
    var deviceInfo = this._crypto.getStoredDevice(userId, deviceId);
    var body = keyRequest.requestBody;

    this.olmlib.ensureOlmSessionsForDevices(this._olmDevice, this._baseApis, (0, _defineProperty3.default)({}, userId, [deviceInfo])).then(function (devicemap) {
        var olmSessionResult = devicemap[userId][deviceId];
        if (!olmSessionResult.sessionId) {
            // no session with this device, probably because there
            // were no one-time keys.
            //
            // ensureOlmSessionsForUsers has already done the logging,
            // so just skip it.
            return null;
        }

        console.log("sharing keys for session " + body.sender_key + "|" + body.session_id + " with device " + userId + ":" + deviceId);

        return _this4._buildKeyForwardingMessage(body.room_id, body.sender_key, body.session_id);
    }).then(function (payload) {
        var encryptedContent = {
            algorithm: olmlib.OLM_ALGORITHM,
            sender_key: _this4._olmDevice.deviceCurve25519Key,
            ciphertext: {}
        };

        return _this4.olmlib.encryptMessageForDevice(encryptedContent.ciphertext, _this4._userId, _this4._deviceId, _this4._olmDevice, userId, deviceInfo, payload).then(function () {
            var contentMap = (0, _defineProperty3.default)({}, userId, (0, _defineProperty3.default)({}, deviceId, encryptedContent));

            // TODO: retries
            return _this4._baseApis.sendToDevice("m.room.encrypted", contentMap);
        });
    }).done();
};

MegolmDecryption.prototype._buildKeyForwardingMessage = function () {
    var _ref5 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee5(roomId, senderKey, sessionId) {
        var key;
        return _regenerator2.default.wrap(function _callee5$(_context5) {
            while (1) {
                switch (_context5.prev = _context5.next) {
                    case 0:
                        _context5.next = 2;
                        return (0, _bluebird.resolve)(this._olmDevice.getInboundGroupSessionKey(roomId, senderKey, sessionId));

                    case 2:
                        key = _context5.sent;
                        return _context5.abrupt("return", {
                            type: "m.forwarded_room_key",
                            content: {
                                algorithm: olmlib.MEGOLM_ALGORITHM,
                                room_id: roomId,
                                sender_key: senderKey,
                                sender_claimed_ed25519_key: key.sender_claimed_ed25519_key,
                                session_id: sessionId,
                                session_key: key.key,
                                chain_index: key.chain_index,
                                forwarding_curve25519_key_chain: key.forwarding_curve25519_key_chain
                            }
                        });

                    case 4:
                    case "end":
                        return _context5.stop();
                }
            }
        }, _callee5, this);
    }));

    return function (_x5, _x6, _x7) {
        return _ref5.apply(this, arguments);
    };
}();

/**
 * @inheritdoc
 *
 * @param {module:crypto/OlmDevice.MegolmSessionData} session
 */
MegolmDecryption.prototype.importRoomKey = function (session) {
    this._olmDevice.importInboundGroupSession(session);

    // have another go at decrypting events sent with this session.
    this._retryDecryption(session.sender_key, session.session_id);
};

/**
 * Have another go at decrypting events after we receive a key
 *
 * @private
 * @param {String} senderKey
 * @param {String} sessionId
 */
MegolmDecryption.prototype._retryDecryption = function (senderKey, sessionId) {
    var k = senderKey + "|" + sessionId;
    var pending = this._pendingEvents[k];
    if (!pending) {
        return;
    }

    delete this._pendingEvents[k];

    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = (0, _getIterator3.default)(pending), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var ev = _step4.value;

            ev.attemptDecryption(this._crypto);
        }
    } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
                _iterator4.return();
            }
        } finally {
            if (_didIteratorError4) {
                throw _iteratorError4;
            }
        }
    }
};

base.registerAlgorithm(olmlib.MEGOLM_ALGORITHM, MegolmEncryption, MegolmDecryption);
//# sourceMappingURL=megolm.js.map