'use strict';

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _verifyKeyAndStartSession = function () {
    var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3(olmDevice, oneTimeKey, userId, deviceInfo) {
        var deviceId, sid;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        deviceId = deviceInfo.deviceId;
                        _context3.prev = 1;
                        _context3.next = 4;
                        return (0, _bluebird.resolve)(_verifySignature(olmDevice, oneTimeKey, userId, deviceId, deviceInfo.getFingerprint()));

                    case 4:
                        _context3.next = 10;
                        break;

                    case 6:
                        _context3.prev = 6;
                        _context3.t0 = _context3['catch'](1);

                        console.error("Unable to verify signature on one-time key for device " + userId + ":" + deviceId + ":", _context3.t0);
                        return _context3.abrupt('return', null);

                    case 10:
                        sid = void 0;
                        _context3.prev = 11;
                        _context3.next = 14;
                        return (0, _bluebird.resolve)(olmDevice.createOutboundSession(deviceInfo.getIdentityKey(), oneTimeKey.key));

                    case 14:
                        sid = _context3.sent;
                        _context3.next = 21;
                        break;

                    case 17:
                        _context3.prev = 17;
                        _context3.t1 = _context3['catch'](11);

                        // possibly a bad key
                        console.error("Error starting session with device " + userId + ":" + deviceId + ": " + _context3.t1);
                        return _context3.abrupt('return', null);

                    case 21:

                        console.log("Started new sessionid " + sid + " for device " + userId + ":" + deviceId);
                        return _context3.abrupt('return', sid);

                    case 23:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, this, [[1, 6], [11, 17]]);
    }));

    return function _verifyKeyAndStartSession(_x11, _x12, _x13, _x14) {
        return _ref3.apply(this, arguments);
    };
}();

/**
 * Verify the signature on an object
 *
 * @param {module:crypto/OlmDevice} olmDevice olm wrapper to use for verify op
 *
 * @param {Object} obj object to check signature on. Note that this will be
 * stripped of its 'signatures' and 'unsigned' properties.
 *
 * @param {string} signingUserId  ID of the user whose signature should be checked
 *
 * @param {string} signingDeviceId  ID of the device whose signature should be checked
 *
 * @param {string} signingKey   base64-ed ed25519 public key
 *
 * Returns a promise which resolves (to undefined) if the the signature is good,
 * or rejects with an Error if it is bad.
 */


function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var anotherjson = require('another-json'); /*
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

/**
 * @module olmlib
 *
 * Utilities common to olm encryption algorithms
 */

var utils = require("../utils");

/**
 * matrix algorithm tag for olm
 */
module.exports.OLM_ALGORITHM = "m.olm.v1.curve25519-aes-sha2";

/**
 * matrix algorithm tag for megolm
 */
module.exports.MEGOLM_ALGORITHM = "m.megolm.v1.aes-sha2";

/**
 * Encrypt an event payload for an Olm device
 *
 * @param {Object<string, string>} resultsObject  The `ciphertext` property
 *   of the m.room.encrypted event to which to add our result
 *
 * @param {string} ourUserId
 * @param {string} ourDeviceId
 * @param {module:crypto/OlmDevice} olmDevice olm.js wrapper
 * @param {string} recipientUserId
 * @param {module:crypto/deviceinfo} recipientDevice
 * @param {object} payloadFields fields to include in the encrypted payload
 *
 * Returns a promise which resolves (to undefined) when the payload
 *    has been encrypted into `resultsObject`
 */
module.exports.encryptMessageForDevice = function () {
    var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(resultsObject, ourUserId, ourDeviceId, olmDevice, recipientUserId, recipientDevice, payloadFields) {
        var deviceKey, sessionId, payload;
        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        deviceKey = recipientDevice.getIdentityKey();
                        _context.next = 3;
                        return (0, _bluebird.resolve)(olmDevice.getSessionIdForDevice(deviceKey));

                    case 3:
                        sessionId = _context.sent;

                        if (!(sessionId === null)) {
                            _context.next = 6;
                            break;
                        }

                        return _context.abrupt('return');

                    case 6:

                        console.log("Using sessionid " + sessionId + " for device " + recipientUserId + ":" + recipientDevice.deviceId);

                        payload = {
                            sender: ourUserId,
                            sender_device: ourDeviceId,

                            // Include the Ed25519 key so that the recipient knows what
                            // device this message came from.
                            // We don't need to include the curve25519 key since the
                            // recipient will already know this from the olm headers.
                            // When combined with the device keys retrieved from the
                            // homeserver signed by the ed25519 key this proves that
                            // the curve25519 key and the ed25519 key are owned by
                            // the same device.
                            keys: {
                                "ed25519": olmDevice.deviceEd25519Key
                            },

                            // include the recipient device details in the payload,
                            // to avoid unknown key attacks, per
                            // https://github.com/vector-im/vector-web/issues/2483
                            recipient: recipientUserId,
                            recipient_keys: {
                                "ed25519": recipientDevice.getFingerprint()
                            }
                        };

                        // TODO: technically, a bunch of that stuff only needs to be included for
                        // pre-key messages: after that, both sides know exactly which devices are
                        // involved in the session. If we're looking to reduce data transfer in the
                        // future, we could elide them for subsequent messages.

                        utils.extend(payload, payloadFields);

                        _context.next = 11;
                        return (0, _bluebird.resolve)(olmDevice.encryptMessage(deviceKey, sessionId, (0, _stringify2.default)(payload)));

                    case 11:
                        resultsObject[deviceKey] = _context.sent;

                    case 12:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function (_x, _x2, _x3, _x4, _x5, _x6, _x7) {
        return _ref.apply(this, arguments);
    };
}();

/**
 * Try to make sure we have established olm sessions for the given devices.
 *
 * @param {module:crypto/OlmDevice} olmDevice
 *
 * @param {module:base-apis~MatrixBaseApis} baseApis
 *
 * @param {object<string, module:crypto/deviceinfo[]>} devicesByUser
 *    map from userid to list of devices
 *
 * @return {module:client.Promise} resolves once the sessions are complete, to
 *    an Object mapping from userId to deviceId to
 *    {@link module:crypto~OlmSessionResult}
 */
module.exports.ensureOlmSessionsForDevices = function () {
    var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(olmDevice, baseApis, devicesByUser) {
        var devicesWithoutSession, result, userId, devices, j, deviceInfo, deviceId, key, sessionId, oneTimeKeyAlgorithm, res, otk_res, promises, _loop, _userId, _ret;

        return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        devicesWithoutSession = [
                            // [userId, deviceId], ...
                        ];
                        result = {};
                        _context2.t0 = _regenerator2.default.keys(devicesByUser);

                    case 3:
                        if ((_context2.t1 = _context2.t0()).done) {
                            _context2.next = 24;
                            break;
                        }

                        userId = _context2.t1.value;

                        if (devicesByUser.hasOwnProperty(userId)) {
                            _context2.next = 7;
                            break;
                        }

                        return _context2.abrupt('continue', 3);

                    case 7:
                        result[userId] = {};
                        devices = devicesByUser[userId];
                        j = 0;

                    case 10:
                        if (!(j < devices.length)) {
                            _context2.next = 22;
                            break;
                        }

                        deviceInfo = devices[j];
                        deviceId = deviceInfo.deviceId;
                        key = deviceInfo.getIdentityKey();
                        _context2.next = 16;
                        return (0, _bluebird.resolve)(olmDevice.getSessionIdForDevice(key));

                    case 16:
                        sessionId = _context2.sent;

                        if (sessionId === null) {
                            devicesWithoutSession.push([userId, deviceId]);
                        }
                        result[userId][deviceId] = {
                            device: deviceInfo,
                            sessionId: sessionId
                        };

                    case 19:
                        j++;
                        _context2.next = 10;
                        break;

                    case 22:
                        _context2.next = 3;
                        break;

                    case 24:
                        if (!(devicesWithoutSession.length === 0)) {
                            _context2.next = 26;
                            break;
                        }

                        return _context2.abrupt('return', result);

                    case 26:

                        // TODO: this has a race condition - if we try to send another message
                        // while we are claiming a key, we will end up claiming two and setting up
                        // two sessions.
                        //
                        // That should eventually resolve itself, but it's poor form.

                        oneTimeKeyAlgorithm = "signed_curve25519";
                        _context2.next = 29;
                        return (0, _bluebird.resolve)(baseApis.claimOneTimeKeys(devicesWithoutSession, oneTimeKeyAlgorithm));

                    case 29:
                        res = _context2.sent;
                        otk_res = res.one_time_keys || {};
                        promises = [];

                        _loop = function _loop(_userId) {
                            if (!devicesByUser.hasOwnProperty(_userId)) {
                                return 'continue';
                            }
                            var userRes = otk_res[_userId] || {};
                            var devices = devicesByUser[_userId];

                            var _loop2 = function _loop2(_j) {
                                var deviceInfo = devices[_j];
                                var deviceId = deviceInfo.deviceId;
                                if (result[_userId][deviceId].sessionId) {
                                    // we already have a result for this device
                                    return 'continue';
                                }

                                var deviceRes = userRes[deviceId] || {};
                                var oneTimeKey = null;
                                for (var keyId in deviceRes) {
                                    if (keyId.indexOf(oneTimeKeyAlgorithm + ":") === 0) {
                                        oneTimeKey = deviceRes[keyId];
                                    }
                                }

                                if (!oneTimeKey) {
                                    console.warn("No one-time keys (alg=" + oneTimeKeyAlgorithm + ") for device " + _userId + ":" + deviceId);
                                    return 'continue';
                                }

                                promises.push(_verifyKeyAndStartSession(olmDevice, oneTimeKey, _userId, deviceInfo).then(function (sid) {
                                    result[_userId][deviceId].sessionId = sid;
                                }));
                            };

                            for (var _j = 0; _j < devices.length; _j++) {
                                var _ret2 = _loop2(_j);

                                if (_ret2 === 'continue') continue;
                            }
                        };

                        _context2.t2 = _regenerator2.default.keys(devicesByUser);

                    case 34:
                        if ((_context2.t3 = _context2.t2()).done) {
                            _context2.next = 41;
                            break;
                        }

                        _userId = _context2.t3.value;
                        _ret = _loop(_userId);

                        if (!(_ret === 'continue')) {
                            _context2.next = 39;
                            break;
                        }

                        return _context2.abrupt('continue', 34);

                    case 39:
                        _context2.next = 34;
                        break;

                    case 41:
                        _context2.next = 43;
                        return (0, _bluebird.resolve)(_bluebird2.default.all(promises));

                    case 43:
                        return _context2.abrupt('return', result);

                    case 44:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, this);
    }));

    return function (_x8, _x9, _x10) {
        return _ref2.apply(this, arguments);
    };
}();

var _verifySignature = module.exports.verifySignature = function () {
    var _ref4 = (0, _bluebird.method)(function (olmDevice, obj, signingUserId, signingDeviceId, signingKey) {
        var signKeyId = "ed25519:" + signingDeviceId;
        var signatures = obj.signatures || {};
        var userSigs = signatures[signingUserId] || {};
        var signature = userSigs[signKeyId];
        if (!signature) {
            throw Error("No signature");
        }

        // prepare the canonical json: remove unsigned and signatures, and stringify with
        // anotherjson
        delete obj.unsigned;
        delete obj.signatures;
        var json = anotherjson.stringify(obj);

        olmDevice.verifySignature(signingKey, json, signature);
    });

    return function (_x15, _x16, _x17, _x18, _x19) {
        return _ref4.apply(this, arguments);
    };
}();
//# sourceMappingURL=olmlib.js.map