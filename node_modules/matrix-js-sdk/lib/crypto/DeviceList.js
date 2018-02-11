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

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _updateStoredDeviceKeysForUser = function () {
    var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(_olmDevice, userId, userStore, userResult) {
        var updated, deviceId, _deviceId, deviceResult;

        return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        updated = false;

                        // remove any devices in the store which aren't in the response

                        _context2.t0 = _regenerator2.default.keys(userStore);

                    case 2:
                        if ((_context2.t1 = _context2.t0()).done) {
                            _context2.next = 9;
                            break;
                        }

                        deviceId = _context2.t1.value;

                        if (userStore.hasOwnProperty(deviceId)) {
                            _context2.next = 6;
                            break;
                        }

                        return _context2.abrupt('continue', 2);

                    case 6:

                        if (!(deviceId in userResult)) {
                            console.log("Device " + userId + ":" + deviceId + " has been removed");
                            delete userStore[deviceId];
                            updated = true;
                        }
                        _context2.next = 2;
                        break;

                    case 9:
                        _context2.t2 = _regenerator2.default.keys(userResult);

                    case 10:
                        if ((_context2.t3 = _context2.t2()).done) {
                            _context2.next = 27;
                            break;
                        }

                        _deviceId = _context2.t3.value;

                        if (userResult.hasOwnProperty(_deviceId)) {
                            _context2.next = 14;
                            break;
                        }

                        return _context2.abrupt('continue', 10);

                    case 14:
                        deviceResult = userResult[_deviceId];

                        // check that the user_id and device_id in the response object are
                        // correct

                        if (!(deviceResult.user_id !== userId)) {
                            _context2.next = 18;
                            break;
                        }

                        console.warn("Mismatched user_id " + deviceResult.user_id + " in keys from " + userId + ":" + _deviceId);
                        return _context2.abrupt('continue', 10);

                    case 18:
                        if (!(deviceResult.device_id !== _deviceId)) {
                            _context2.next = 21;
                            break;
                        }

                        console.warn("Mismatched device_id " + deviceResult.device_id + " in keys from " + userId + ":" + _deviceId);
                        return _context2.abrupt('continue', 10);

                    case 21:
                        _context2.next = 23;
                        return (0, _bluebird.resolve)(_storeDeviceKeys(_olmDevice, userStore, deviceResult));

                    case 23:
                        if (!_context2.sent) {
                            _context2.next = 25;
                            break;
                        }

                        updated = true;

                    case 25:
                        _context2.next = 10;
                        break;

                    case 27:
                        return _context2.abrupt('return', updated);

                    case 28:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, this);
    }));

    return function _updateStoredDeviceKeysForUser(_x3, _x4, _x5, _x6) {
        return _ref2.apply(this, arguments);
    };
}();

/*
 * Process a device in a /query response, and add it to the userStore
 *
 * returns (a promise for) true if a change was made, else false
 */


var _storeDeviceKeys = function () {
    var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3(_olmDevice, userStore, deviceResult) {
        var deviceId, userId, signKeyId, signKey, unsigned, deviceStore;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        if (deviceResult.keys) {
                            _context3.next = 2;
                            break;
                        }

                        return _context3.abrupt('return', false);

                    case 2:
                        deviceId = deviceResult.device_id;
                        userId = deviceResult.user_id;
                        signKeyId = "ed25519:" + deviceId;
                        signKey = deviceResult.keys[signKeyId];

                        if (signKey) {
                            _context3.next = 9;
                            break;
                        }

                        console.warn("Device " + userId + ":" + deviceId + " has no ed25519 key");
                        return _context3.abrupt('return', false);

                    case 9:
                        unsigned = deviceResult.unsigned || {};
                        _context3.prev = 10;
                        _context3.next = 13;
                        return (0, _bluebird.resolve)(_olmlib2.default.verifySignature(_olmDevice, deviceResult, userId, deviceId, signKey));

                    case 13:
                        _context3.next = 19;
                        break;

                    case 15:
                        _context3.prev = 15;
                        _context3.t0 = _context3['catch'](10);

                        console.warn("Unable to verify signature on device " + userId + ":" + deviceId + ":" + _context3.t0);
                        return _context3.abrupt('return', false);

                    case 19:

                        // DeviceInfo
                        deviceStore = void 0;

                        if (!(deviceId in userStore)) {
                            _context3.next = 27;
                            break;
                        }

                        // already have this device.
                        deviceStore = userStore[deviceId];

                        if (!(deviceStore.getFingerprint() != signKey)) {
                            _context3.next = 25;
                            break;
                        }

                        // this should only happen if the list has been MITMed; we are
                        // best off sticking with the original keys.
                        //
                        // Should we warn the user about it somehow?
                        console.warn("Ed25519 key for device " + userId + ":" + deviceId + " has changed");
                        return _context3.abrupt('return', false);

                    case 25:
                        _context3.next = 28;
                        break;

                    case 27:
                        userStore[deviceId] = deviceStore = new _deviceinfo2.default(deviceId);

                    case 28:

                        deviceStore.keys = deviceResult.keys || {};
                        deviceStore.algorithms = deviceResult.algorithms || [];
                        deviceStore.unsigned = unsigned;
                        return _context3.abrupt('return', true);

                    case 32:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, this, [[10, 15]]);
    }));

    return function _storeDeviceKeys(_x7, _x8, _x9) {
        return _ref3.apply(this, arguments);
    };
}();

var _deviceinfo = require('./deviceinfo');

var _deviceinfo2 = _interopRequireDefault(_deviceinfo);

var _olmlib = require('./olmlib');

var _olmlib2 = _interopRequireDefault(_olmlib);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* State transition diagram for DeviceList._deviceTrackingStatus
 *
 *                                |
 *     stopTrackingDeviceList     V
 *   +---------------------> NOT_TRACKED
 *   |                            |
 *   +<--------------------+      | startTrackingDeviceList
 *   |                     |      V
 *   |   +-------------> PENDING_DOWNLOAD <--------------------+-+
 *   |   |                      ^ |                            | |
 *   |   | restart     download | |  start download            | | invalidateUserDeviceList
 *   |   | client        failed | |                            | |
 *   |   |                      | V                            | |
 *   |   +------------ DOWNLOAD_IN_PROGRESS -------------------+ |
 *   |                    |       |                              |
 *   +<-------------------+       |  download successful         |
 *   ^                            V                              |
 *   +----------------------- UP_TO_DATE ------------------------+
 */

// constants for DeviceList._deviceTrackingStatus
var TRACKING_STATUS_NOT_TRACKED = 0;
var TRACKING_STATUS_PENDING_DOWNLOAD = 1;
var TRACKING_STATUS_DOWNLOAD_IN_PROGRESS = 2;
var TRACKING_STATUS_UP_TO_DATE = 3;

/**
 * @alias module:crypto/DeviceList
 */

var DeviceList = function () {
    function DeviceList(baseApis, sessionStore, olmDevice) {
        (0, _classCallCheck3.default)(this, DeviceList);

        this._sessionStore = sessionStore;
        this._serialiser = new DeviceListUpdateSerialiser(baseApis, sessionStore, olmDevice);

        // which users we are tracking device status for.
        // userId -> TRACKING_STATUS_*
        this._deviceTrackingStatus = sessionStore.getEndToEndDeviceTrackingStatus() || {};
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = (0, _getIterator3.default)((0, _keys2.default)(this._deviceTrackingStatus)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var u = _step.value;

                // if a download was in progress when we got shut down, it isn't any more.
                if (this._deviceTrackingStatus[u] == TRACKING_STATUS_DOWNLOAD_IN_PROGRESS) {
                    this._deviceTrackingStatus[u] = TRACKING_STATUS_PENDING_DOWNLOAD;
                }
            }

            // userId -> promise
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


    (0, _createClass3.default)(DeviceList, [{
        key: 'downloadKeys',
        value: function downloadKeys(userIds, forceDownload) {
            var _this = this;

            var usersToDownload = [];
            var promises = [];

            userIds.forEach(function (u) {
                var trackingStatus = _this._deviceTrackingStatus[u];
                if (_this._keyDownloadsInProgressByUser[u]) {
                    // already a key download in progress/queued for this user; its results
                    // will be good enough for us.
                    console.log('downloadKeys: already have a download in progress for ' + (u + ': awaiting its result'));
                    promises.push(_this._keyDownloadsInProgressByUser[u]);
                } else if (forceDownload || trackingStatus != TRACKING_STATUS_UP_TO_DATE) {
                    usersToDownload.push(u);
                }
            });

            if (usersToDownload.length != 0) {
                console.log("downloadKeys: downloading for", usersToDownload);
                var downloadPromise = this._doKeyDownload(usersToDownload);
                promises.push(downloadPromise);
            }

            if (promises.length === 0) {
                console.log("downloadKeys: already have all necessary keys");
            }

            return _bluebird2.default.all(promises).then(function () {
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
         * @param {string} senderKey  curve25519 key to match
         *
         * @return {module:crypto/deviceinfo?}
         */

    }, {
        key: 'getDeviceByIdentityKey',
        value: function getDeviceByIdentityKey(userId, algorithm, senderKey) {
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
                    if (deviceKey == senderKey) {
                        return _deviceinfo2.default.fromStorage(device, deviceId);
                    }
                }
            }

            // doesn't match a known device
            return null;
        }

        /**
         * flag the given user for device-list tracking, if they are not already.
         *
         * This will mean that a subsequent call to refreshOutdatedDeviceLists()
         * will download the device list for the user, and that subsequent calls to
         * invalidateUserDeviceList will trigger more updates.
         *
         * @param {String} userId
         */

    }, {
        key: 'startTrackingDeviceList',
        value: function startTrackingDeviceList(userId) {
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
            if (!this._deviceTrackingStatus[userId]) {
                console.log('Now tracking device list for ' + userId);
                this._deviceTrackingStatus[userId] = TRACKING_STATUS_PENDING_DOWNLOAD;
            }
            // we don't yet persist the tracking status, since there may be a lot
            // of calls; instead we wait for the forthcoming
            // refreshOutdatedDeviceLists.
        }

        /**
         * Mark the given user as no longer being tracked for device-list updates.
         *
         * This won't affect any in-progress downloads, which will still go on to
         * complete; it will just mean that we don't think that we have an up-to-date
         * list for future calls to downloadKeys.
         *
         * @param {String} userId
         */

    }, {
        key: 'stopTrackingDeviceList',
        value: function stopTrackingDeviceList(userId) {
            if (this._deviceTrackingStatus[userId]) {
                console.log('No longer tracking device list for ' + userId);
                this._deviceTrackingStatus[userId] = TRACKING_STATUS_NOT_TRACKED;
            }
            // we don't yet persist the tracking status, since there may be a lot
            // of calls; instead we wait for the forthcoming
            // refreshOutdatedDeviceLists.
        }

        /**
         * Mark the cached device list for the given user outdated.
         *
         * If we are not tracking this user's devices, we'll do nothing. Otherwise
         * we flag the user as needing an update.
         *
         * This doesn't actually set off an update, so that several users can be
         * batched together. Call refreshOutdatedDeviceLists() for that.
         *
         * @param {String} userId
         */

    }, {
        key: 'invalidateUserDeviceList',
        value: function invalidateUserDeviceList(userId) {
            if (this._deviceTrackingStatus[userId]) {
                console.log("Marking device list outdated for", userId);
                this._deviceTrackingStatus[userId] = TRACKING_STATUS_PENDING_DOWNLOAD;
            }
            // we don't yet persist the tracking status, since there may be a lot
            // of calls; instead we wait for the forthcoming
            // refreshOutdatedDeviceLists.
        }

        /**
         * Mark all tracked device lists as outdated.
         *
         * This will flag each user whose devices we are tracking as in need of an
         * update.
         */

    }, {
        key: 'invalidateAllDeviceLists',
        value: function invalidateAllDeviceLists() {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = (0, _getIterator3.default)((0, _keys2.default)(this._deviceTrackingStatus)), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var userId = _step2.value;

                    this.invalidateUserDeviceList(userId);
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
        }

        /**
         * If we have users who have outdated device lists, start key downloads for them
         *
         * @returns {Promise} which completes when the download completes; normally there
         *    is no need to wait for this (it's mostly for the unit tests).
         */

    }, {
        key: 'refreshOutdatedDeviceLists',
        value: function refreshOutdatedDeviceLists() {
            var usersToDownload = [];
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = (0, _getIterator3.default)((0, _keys2.default)(this._deviceTrackingStatus)), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var userId = _step3.value;

                    var stat = this._deviceTrackingStatus[userId];
                    if (stat == TRACKING_STATUS_PENDING_DOWNLOAD) {
                        usersToDownload.push(userId);
                    }
                }

                // we didn't persist the tracking status during
                // invalidateUserDeviceList, so do it now.
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

            this._persistDeviceTrackingStatus();

            return this._doKeyDownload(usersToDownload);
        }

        /**
         * Fire off download update requests for the given users, and update the
         * device list tracking status for them, and the
         * _keyDownloadsInProgressByUser map for them.
         *
         * @param {String[]} users  list of userIds
         *
         * @return {module:client.Promise} resolves when all the users listed have
         *     been updated. rejects if there was a problem updating any of the
         *     users.
         */

    }, {
        key: '_doKeyDownload',
        value: function _doKeyDownload(users) {
            var _this2 = this;

            if (users.length === 0) {
                // nothing to do
                return _bluebird2.default.resolve();
            }

            var prom = this._serialiser.updateDevicesForUsers(users, this.lastKnownSyncToken).then(function () {
                finished(true);
            }, function (e) {
                console.error('Error downloading keys for ' + users + ":", e);
                finished(false);
                throw e;
            });

            users.forEach(function (u) {
                _this2._keyDownloadsInProgressByUser[u] = prom;
                var stat = _this2._deviceTrackingStatus[u];
                if (stat == TRACKING_STATUS_PENDING_DOWNLOAD) {
                    _this2._deviceTrackingStatus[u] = TRACKING_STATUS_DOWNLOAD_IN_PROGRESS;
                }
            });

            var finished = function finished(success) {
                users.forEach(function (u) {
                    // we may have queued up another download request for this user
                    // since we started this request. If that happens, we should
                    // ignore the completion of the first one.
                    if (_this2._keyDownloadsInProgressByUser[u] !== prom) {
                        console.log('Another update in the queue for', u, '- not marking up-to-date');
                        return;
                    }
                    delete _this2._keyDownloadsInProgressByUser[u];
                    var stat = _this2._deviceTrackingStatus[u];
                    if (stat == TRACKING_STATUS_DOWNLOAD_IN_PROGRESS) {
                        if (success) {
                            // we didn't get any new invalidations since this download started:
                            // this user's device list is now up to date.
                            _this2._deviceTrackingStatus[u] = TRACKING_STATUS_UP_TO_DATE;
                            console.log("Device list for", u, "now up to date");
                        } else {
                            _this2._deviceTrackingStatus[u] = TRACKING_STATUS_PENDING_DOWNLOAD;
                        }
                    }
                });
                _this2._persistDeviceTrackingStatus();
            };

            return prom;
        }
    }, {
        key: '_persistDeviceTrackingStatus',
        value: function _persistDeviceTrackingStatus() {
            this._sessionStore.storeEndToEndDeviceTrackingStatus(this._deviceTrackingStatus);
        }
    }]);
    return DeviceList;
}();

/**
 * Serialises updates to device lists
 *
 * Ensures that results from /keys/query are not overwritten if a second call
 * completes *before* an earlier one.
 *
 * It currently does this by ensuring only one call to /keys/query happens at a
 * time (and queuing other requests up).
 */


exports.default = DeviceList;

var DeviceListUpdateSerialiser = function () {
    function DeviceListUpdateSerialiser(baseApis, sessionStore, olmDevice) {
        (0, _classCallCheck3.default)(this, DeviceListUpdateSerialiser);

        this._baseApis = baseApis;
        this._sessionStore = sessionStore;
        this._olmDevice = olmDevice;

        this._downloadInProgress = false;

        // users which are queued for download
        // userId -> true
        this._keyDownloadsQueuedByUser = {};

        // deferred which is resolved when the queued users are downloaded.
        //
        // non-null indicates that we have users queued for download.
        this._queuedQueryDeferred = null;

        // sync token to be used for the next query: essentially the
        // most recent one we know about
        this._nextSyncToken = null;
    }

    /**
     * Make a key query request for the given users
     *
     * @param {String[]} users list of user ids
     *
     * @param {String} syncToken sync token to pass in the query request, to
     *     help the HS give the most recent results
     *
     * @return {module:client.Promise} resolves when all the users listed have
     *     been updated. rejects if there was a problem updating any of the
     *     users.
     */


    (0, _createClass3.default)(DeviceListUpdateSerialiser, [{
        key: 'updateDevicesForUsers',
        value: function updateDevicesForUsers(users, syncToken) {
            var _this3 = this;

            users.forEach(function (u) {
                _this3._keyDownloadsQueuedByUser[u] = true;
            });
            this._nextSyncToken = syncToken;

            if (!this._queuedQueryDeferred) {
                this._queuedQueryDeferred = _bluebird2.default.defer();
            }

            if (this._downloadInProgress) {
                // just queue up these users
                console.log('Queued key download for', users);
                return this._queuedQueryDeferred.promise;
            }

            // start a new download.
            return this._doQueuedQueries();
        }
    }, {
        key: '_doQueuedQueries',
        value: function _doQueuedQueries() {
            var _this4 = this;

            if (this._downloadInProgress) {
                throw new Error("DeviceListUpdateSerialiser._doQueuedQueries called with request active");
            }

            var downloadUsers = (0, _keys2.default)(this._keyDownloadsQueuedByUser);
            this._keyDownloadsQueuedByUser = {};
            var deferred = this._queuedQueryDeferred;
            this._queuedQueryDeferred = null;

            console.log('Starting key download for', downloadUsers);
            this._downloadInProgress = true;

            var opts = {};
            if (this._nextSyncToken) {
                opts.token = this._nextSyncToken;
            }

            this._baseApis.downloadKeysForUsers(downloadUsers, opts).then(function (res) {
                var dk = res.device_keys || {};

                // do each user in a separate promise, to avoid wedging the CPU
                // (https://github.com/vector-im/riot-web/issues/3158)
                //
                // of course we ought to do this in a web worker or similar, but
                // this serves as an easy solution for now.
                var prom = _bluebird2.default.resolve();
                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;

                try {
                    var _loop = function _loop() {
                        var userId = _step4.value;

                        prom = prom.delay(5).then(function () {
                            return _this4._processQueryResponseForUser(userId, dk[userId]);
                        });
                    };

                    for (var _iterator4 = (0, _getIterator3.default)(downloadUsers), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                        _loop();
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

                return prom;
            }).done(function () {
                console.log('Completed key download for ' + downloadUsers);

                _this4._downloadInProgress = false;
                deferred.resolve();

                // if we have queued users, fire off another request.
                if (_this4._queuedQueryDeferred) {
                    _this4._doQueuedQueries();
                }
            }, function (e) {
                console.warn('Error downloading keys for ' + downloadUsers + ':', e);
                _this4._downloadInProgress = false;
                deferred.reject(e);
            });

            return deferred.promise;
        }
    }, {
        key: '_processQueryResponseForUser',
        value: function () {
            var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(userId, response) {
                var userStore, devs, storage;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                console.log('got keys for ' + userId + ':', response);

                                // map from deviceid -> deviceinfo for this user
                                userStore = {};
                                devs = this._sessionStore.getEndToEndDevicesForUser(userId);

                                if (devs) {
                                    (0, _keys2.default)(devs).forEach(function (deviceId) {
                                        var d = _deviceinfo2.default.fromStorage(devs[deviceId], deviceId);
                                        userStore[deviceId] = d;
                                    });
                                }

                                _context.next = 6;
                                return (0, _bluebird.resolve)(_updateStoredDeviceKeysForUser(this._olmDevice, userId, userStore, response || {}));

                            case 6:

                                // update the session store
                                storage = {};

                                (0, _keys2.default)(userStore).forEach(function (deviceId) {
                                    storage[deviceId] = userStore[deviceId].toStorage();
                                });

                                this._sessionStore.storeEndToEndDevicesForUser(userId, storage);

                            case 9:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function _processQueryResponseForUser(_x, _x2) {
                return _ref.apply(this, arguments);
            }

            return _processQueryResponseForUser;
        }()
    }]);
    return DeviceListUpdateSerialiser;
}();
//# sourceMappingURL=DeviceList.js.map