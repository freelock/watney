/*
Copyright 2017 Vector Creations Ltd

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
 * @module crypto/DeviceList
 *
 * Manages the list of other users' devices
 */

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _q = require('q');

var _q2 = _interopRequireDefault(_q);

var _deviceinfo = require('./deviceinfo');

var _deviceinfo2 = _interopRequireDefault(_deviceinfo);

var _olmlib = require('./olmlib');

var _olmlib2 = _interopRequireDefault(_olmlib);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @alias module:crypto/DeviceList
 */
var DeviceList = function () {
    function DeviceList(baseApis, sessionStore, olmDevice) {
        _classCallCheck(this, DeviceList);

        this._baseApis = baseApis;
        this._sessionStore = sessionStore;
        this._olmDevice = olmDevice;

        // users with outdated device lists
        // userId -> true
        this._pendingUsersWithNewDevices = {};

        // userId -> promise
        this._keyDownloadsInProgressByUser = {};

        this.lastKnownSyncToken = null;
    }

    /**
     * Download the keys for a list of users and stores the keys in the session
     * store.
     * @param {Array} userIds The users to fetch.
     * @param {bool} forceDownload Always download the keys even if cached.
     *
     * @return {Promise} A promise which resolves to a map userId->deviceId->{@link
     * module:crypto/deviceinfo|DeviceInfo}.
     */


    _createClass(DeviceList, [{
        key: 'downloadKeys',
        value: function downloadKeys(userIds, forceDownload) {
            var _this = this;

            // promises we need to wait for while the download happens
            var promises = [];

            var needsRefresh = false;
            userIds.forEach(function (u) {
                if (_this._keyDownloadsInProgressByUser[u]) {
                    // just wait for the existing download to complete
                    promises.push(_this._keyDownloadsInProgressByUser[u]);
                } else {
                    if (forceDownload || !_this.getStoredDevicesForUser(u)) {
                        _this.invalidateUserDeviceList(u);
                    }
                    if (_this._pendingUsersWithNewDevices[u]) {
                        needsRefresh = true;
                    }
                }
            });

            if (needsRefresh) {
                promises.push(this.refreshOutdatedDeviceLists(true));
            }

            return _q2.default.all(promises).then(function () {
                return _this._getDevicesFromStore(userIds);
            });
        }

        /**
         * Get the stored device keys for a list of user ids
         *
         * @param {string[]} userIds the list of users to list keys for.
         *
         * @return {Object} userId->deviceId->{@link module:crypto/deviceinfo|DeviceInfo}.
         */

    }, {
        key: '_getDevicesFromStore',
        value: function _getDevicesFromStore(userIds) {
            var stored = {};
            var self = this;
            userIds.map(function (u) {
                stored[u] = {};
                var devices = self.getStoredDevicesForUser(u) || [];
                devices.map(function (dev) {
                    stored[u][dev.deviceId] = dev;
                });
            });
            return stored;
        }

        /**
         * Get the stored device keys for a user id
         *
         * @param {string} userId the user to list keys for.
         *
         * @return {module:crypto/deviceinfo[]|null} list of devices, or null if we haven't
         * managed to get a list of devices for this user yet.
         */

    }, {
        key: 'getStoredDevicesForUser',
        value: function getStoredDevicesForUser(userId) {
            var devs = this._sessionStore.getEndToEndDevicesForUser(userId);
            if (!devs) {
                return null;
            }
            var res = [];
            for (var deviceId in devs) {
                if (devs.hasOwnProperty(deviceId)) {
                    res.push(_deviceinfo2.default.fromStorage(devs[deviceId], deviceId));
                }
            }
            return res;
        }

        /**
         * Get the stored keys for a single device
         *
         * @param {string} userId
         * @param {string} deviceId
         *
         * @return {module:crypto/deviceinfo?} device, or undefined
         * if we don't know about this device
         */

    }, {
        key: 'getStoredDevice',
        value: function getStoredDevice(userId, deviceId) {
            var devs = this._sessionStore.getEndToEndDevicesForUser(userId);
            if (!devs || !devs[deviceId]) {
                return undefined;
            }
            return _deviceinfo2.default.fromStorage(devs[deviceId], deviceId);
        }

        /**
         * Find a device by curve25519 identity key
         *
         * @param {string} userId     owner of the device
         * @param {string} algorithm  encryption algorithm
         * @param {string} sender_key curve25519 key to match
         *
         * @return {module:crypto/deviceinfo?}
         */

    }, {
        key: 'getDeviceByIdentityKey',
        value: function getDeviceByIdentityKey(userId, algorithm, sender_key) {
            if (algorithm !== _olmlib2.default.OLM_ALGORITHM && algorithm !== _olmlib2.default.MEGOLM_ALGORITHM) {
                // we only deal in olm keys
                return null;
            }

            var devices = this._sessionStore.getEndToEndDevicesForUser(userId);
            if (!devices) {
                return null;
            }

            for (var deviceId in devices) {
                if (!devices.hasOwnProperty(deviceId)) {
                    continue;
                }

                var device = devices[deviceId];
                for (var keyId in device.keys) {
                    if (!device.keys.hasOwnProperty(keyId)) {
                        continue;
                    }
                    if (keyId.indexOf("curve25519:") !== 0) {
                        continue;
                    }
                    var deviceKey = device.keys[keyId];
                    if (deviceKey == sender_key) {
                        return _deviceinfo2.default.fromStorage(device, deviceId);
                    }
                }
            }

            // doesn't match a known device
            return null;
        }

        /**
         * Mark the cached device list for the given user outdated.
         *
         * This doesn't set off an update, so that several users can be batched
         * together. Call refreshOutdatedDeviceLists() for that.
         *
         * @param {String} userId
         */

    }, {
        key: 'invalidateUserDeviceList',
        value: function invalidateUserDeviceList(userId) {
            // sanity-check the userId. This is mostly paranoia, but if synapse
            // can't parse the userId we give it as an mxid, it 500s the whole
            // request and we can never update the device lists again (because
            // the broken userId is always 'invalid' and always included in any
            // refresh request).
            // By checking it is at least a string, we can eliminate a class of
            // silly errors.
            if (typeof userId !== 'string') {
                throw new Error('userId must be a string; was ' + userId);
            }
            this._pendingUsersWithNewDevices[userId] = true;
        }

        /**
         * Start device queries for any users with outdated device lists
         *
         * We tolerate multiple concurrent device queries, but only one query per
         * user.
         *
         * If any users already have downloads in progress, they are ignored - they
         * will be refreshed when the current download completes anyway, so
         * each user with outdated device lists will be updated eventually.
         *
         * The returned promise resolves immediately if there are no users with
         * outdated device lists, or if all users with outdated device lists already
         * have a query in progress.
         *
         * Otherwise, a new query request is made, and the promise resolves
         * once that query completes. If the query fails, the promise will reject
         * if rejectOnFailure was truthy, otherwise it will still resolve.
         *
         * @param {Boolean?} rejectOnFailure  true to make the returned promise
         *   reject if the device list query fails.
         *
         * @return {Promise}
         */

    }, {
        key: 'refreshOutdatedDeviceLists',
        value: function refreshOutdatedDeviceLists(rejectOnFailure) {
            var _this2 = this;

            var users = Object.keys(this._pendingUsersWithNewDevices).filter(function (u) {
                return !_this2._keyDownloadsInProgressByUser[u];
            });

            if (users.length === 0) {
                return (0, _q2.default)();
            }

            var prom = this._doKeyDownloadForUsers(users).then(function () {
                users.forEach(function (u) {
                    delete _this2._keyDownloadsInProgressByUser[u];
                });

                // flush out any more requests that were blocked up while that
                // was going on, but let the initial promise complete now.
                //
                _this2.refreshOutdatedDeviceLists().done();
            }, function (e) {
                console.error('Error updating device key cache for ' + users + ":", e);

                // reinstate the pending flags on any users which failed; this will
                // mean that we will do another download in the future, but won't
                // tight-loop.
                //
                users.forEach(function (u) {
                    delete _this2._keyDownloadsInProgressByUser[u];
                    _this2._pendingUsersWithNewDevices[u] = true;
                });

                // TODO: schedule a retry.
                throw e;
            });

            users.forEach(function (u) {
                delete _this2._pendingUsersWithNewDevices[u];
                _this2._keyDownloadsInProgressByUser[u] = prom;
            });

            if (!rejectOnFailure) {
                // normally we just want to swallow the exception - we've already
                // logged it futher up.
                prom = prom.catch(function (e) {});
            }
            return prom;
        }

        /**
         * @param {string[]} downloadUsers list of userIds
         *
         * @return {Promise}
         */

    }, {
        key: '_doKeyDownloadForUsers',
        value: function _doKeyDownloadForUsers(downloadUsers) {
            var _this3 = this;

            console.log('Starting key download for ' + downloadUsers);

            var token = this.lastKnownSyncToken;
            var opts = {};
            if (token) {
                opts.token = token;
            }
            return this._baseApis.downloadKeysForUsers(downloadUsers, opts).then(function (res) {
                var dk = res.device_keys || {};

                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    var _loop = function _loop() {
                        var userId = _step.value;

                        console.log('got keys for ' + userId + ':', dk[userId]);

                        // map from deviceid -> deviceinfo for this user
                        var userStore = {};
                        var devs = _this3._sessionStore.getEndToEndDevicesForUser(userId);
                        if (devs) {
                            Object.keys(devs).forEach(function (deviceId) {
                                var d = _deviceinfo2.default.fromStorage(devs[deviceId], deviceId);
                                userStore[deviceId] = d;
                            });
                        }

                        _updateStoredDeviceKeysForUser(_this3._olmDevice, userId, userStore, dk[userId] || {});

                        // update the session store
                        var storage = {};
                        Object.keys(userStore).forEach(function (deviceId) {
                            storage[deviceId] = userStore[deviceId].toStorage();
                        });

                        _this3._sessionStore.storeEndToEndDevicesForUser(userId, storage);

                        if (token) {
                            _this3._sessionStore.storeEndToEndDeviceSyncToken(token);
                        }
                    };

                    for (var _iterator = downloadUsers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        _loop();
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
            });
        }
    }]);

    return DeviceList;
}();

exports.default = DeviceList;


function _updateStoredDeviceKeysForUser(_olmDevice, userId, userStore, userResult) {
    var updated = false;

    // remove any devices in the store which aren't in the response
    for (var deviceId in userStore) {
        if (!userStore.hasOwnProperty(deviceId)) {
            continue;
        }

        if (!(deviceId in userResult)) {
            console.log("Device " + userId + ":" + deviceId + " has been removed");
            delete userStore[deviceId];
            updated = true;
        }
    }

    for (deviceId in userResult) {
        if (!userResult.hasOwnProperty(deviceId)) {
            continue;
        }

        var deviceResult = userResult[deviceId];

        // check that the user_id and device_id in the response object are
        // correct
        if (deviceResult.user_id !== userId) {
            console.warn("Mismatched user_id " + deviceResult.user_id + " in keys from " + userId + ":" + deviceId);
            continue;
        }
        if (deviceResult.device_id !== deviceId) {
            console.warn("Mismatched device_id " + deviceResult.device_id + " in keys from " + userId + ":" + deviceId);
            continue;
        }

        if (_storeDeviceKeys(_olmDevice, userStore, deviceResult)) {
            updated = true;
        }
    }

    return updated;
}

/*
 * Process a device in a /query response, and add it to the userStore
 *
 * returns true if a change was made, else false
 */
function _storeDeviceKeys(_olmDevice, userStore, deviceResult) {
    if (!deviceResult.keys) {
        // no keys?
        return false;
    }

    var deviceId = deviceResult.device_id;
    var userId = deviceResult.user_id;

    var signKeyId = "ed25519:" + deviceId;
    var signKey = deviceResult.keys[signKeyId];
    if (!signKey) {
        console.log("Device " + userId + ":" + deviceId + " has no ed25519 key");
        return false;
    }

    var unsigned = deviceResult.unsigned || {};

    try {
        _olmlib2.default.verifySignature(_olmDevice, deviceResult, userId, deviceId, signKey);
    } catch (e) {
        console.log("Unable to verify signature on device " + userId + ":" + deviceId + ":", e);
        return false;
    }

    // DeviceInfo
    var deviceStore = void 0;

    if (deviceId in userStore) {
        // already have this device.
        deviceStore = userStore[deviceId];

        if (deviceStore.getFingerprint() != signKey) {
            // this should only happen if the list has been MITMed; we are
            // best off sticking with the original keys.
            //
            // Should we warn the user about it somehow?
            console.warn("Ed25519 key for device" + userId + ": " + deviceId + " has changed");
            return false;
        }
    } else {
        userStore[deviceId] = deviceStore = new _deviceinfo2.default(deviceId);
    }

    deviceStore.keys = deviceResult.keys || {};
    deviceStore.algorithms = deviceResult.algorithms || [];
    deviceStore.unsigned = unsigned;
    return true;
}
//# sourceMappingURL=DeviceList.js.map