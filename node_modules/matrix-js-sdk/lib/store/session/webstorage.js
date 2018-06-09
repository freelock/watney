/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 New Vector Ltd
Copyright 2018 New Vector Ltd

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
 * @module store/session/webstorage
 */

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var utils = require("../../utils");

var DEBUG = false; // set true to enable console logging.
var E2E_PREFIX = "session.e2e.";

/**
 * Construct a web storage session store, capable of storing account keys,
 * session keys and access tokens.
 * @constructor
 * @param {WebStorage} webStore A web storage implementation, e.g.
 * 'window.localStorage' or 'window.sessionStorage' or a custom implementation.
 * @throws if the supplied 'store' does not meet the Storage interface of the
 * WebStorage API.
 */
function WebStorageSessionStore(webStore) {
    this.store = webStore;
    if (!utils.isFunction(webStore.getItem) || !utils.isFunction(webStore.setItem) || !utils.isFunction(webStore.removeItem) || !utils.isFunction(webStore.key) || typeof webStore.length !== 'number') {
        throw new Error("Supplied webStore does not meet the WebStorage API interface");
    }
}

WebStorageSessionStore.prototype = {
    /**
     * Remove the stored end to end account for the logged-in user.
     */
    removeEndToEndAccount: function removeEndToEndAccount() {
        this.store.removeItem(KEY_END_TO_END_ACCOUNT);
    },

    /**
     * Load the end to end account for the logged-in user.
     * Note that the end-to-end account is now stored in the
     * crypto store rather than here: this remains here so
     * old sessions can be migrated out of the session store.
     * @return {?string} Base64 encoded account.
     */
    getEndToEndAccount: function getEndToEndAccount() {
        return this.store.getItem(KEY_END_TO_END_ACCOUNT);
    },

    /**
     * Retrieves the known devices for all users.
     * @return {object} A map from user ID to map of device ID to keys for the device.
     */
    getAllEndToEndDevices: function getAllEndToEndDevices() {
        var prefix = keyEndToEndDevicesForUser('');
        var devices = {};
        for (var i = 0; i < this.store.length; ++i) {
            var key = this.store.key(i);
            var userId = key.substr(prefix.length);
            if (key.startsWith(prefix)) devices[userId] = getJsonItem(this.store, key);
        }
        return devices;
    },

    getEndToEndDeviceTrackingStatus: function getEndToEndDeviceTrackingStatus() {
        return getJsonItem(this.store, KEY_END_TO_END_DEVICE_LIST_TRACKING_STATUS);
    },

    /**
     * Get the sync token corresponding to the device list.
     *
     * @return {String?} token
     */
    getEndToEndDeviceSyncToken: function getEndToEndDeviceSyncToken() {
        return getJsonItem(this.store, KEY_END_TO_END_DEVICE_SYNC_TOKEN);
    },

    /**
     * Removes all end to end device data from the store
     */
    removeEndToEndDeviceData: function removeEndToEndDeviceData() {
        removeByPrefix(this.store, keyEndToEndDevicesForUser(''));
        removeByPrefix(this.store, KEY_END_TO_END_DEVICE_LIST_TRACKING_STATUS);
        removeByPrefix(this.store, KEY_END_TO_END_DEVICE_SYNC_TOKEN);
    },

    /**
     * Retrieve the end-to-end sessions between the logged-in user and another
     * device.
     * @param {string} deviceKey The public key of the other device.
     * @return {object} A map from sessionId to Base64 end-to-end session.
     */
    getEndToEndSessions: function getEndToEndSessions(deviceKey) {
        return getJsonItem(this.store, keyEndToEndSessions(deviceKey));
    },

    /**
     * Retrieve all end-to-end sessions between the logged-in user and other
     * devices.
     * @return {object} A map of {deviceKey -> {sessionId -> session pickle}}
     */
    getAllEndToEndSessions: function getAllEndToEndSessions() {
        var deviceKeys = getKeysWithPrefix(this.store, keyEndToEndSessions(''));
        var results = {};
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = (0, _getIterator3.default)(deviceKeys), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var k = _step.value;

                var unprefixedKey = k.substr(keyEndToEndSessions('').length);
                results[unprefixedKey] = getJsonItem(this.store, k);
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

        return results;
    },

    /**
     * Remove all end-to-end sessions from the store
     * This is used after migrating sessions awat from the sessions store.
     */
    removeAllEndToEndSessions: function removeAllEndToEndSessions() {
        removeByPrefix(this.store, keyEndToEndSessions(''));
    },

    /**
     * Retrieve a list of all known inbound group sessions
     *
     * @return {{senderKey: string, sessionId: string}}
     */
    getAllEndToEndInboundGroupSessionKeys: function getAllEndToEndInboundGroupSessionKeys() {
        var prefix = E2E_PREFIX + 'inboundgroupsessions/';
        var result = [];
        for (var i = 0; i < this.store.length; i++) {
            var key = this.store.key(i);
            if (!key.startsWith(prefix)) {
                continue;
            }
            // we can't use split, as the components we are trying to split out
            // might themselves contain '/' characters. We rely on the
            // senderKey being a (32-byte) curve25519 key, base64-encoded
            // (hence 43 characters long).

            result.push({
                senderKey: key.substr(prefix.length, 43),
                sessionId: key.substr(prefix.length + 44)
            });
        }
        return result;
    },

    getEndToEndInboundGroupSession: function getEndToEndInboundGroupSession(senderKey, sessionId) {
        var key = keyEndToEndInboundGroupSession(senderKey, sessionId);
        return this.store.getItem(key);
    },

    removeAllEndToEndInboundGroupSessions: function removeAllEndToEndInboundGroupSessions() {
        removeByPrefix(this.store, E2E_PREFIX + 'inboundgroupsessions/');
    },

    /**
     * Get the end-to-end state for all rooms
     * @return {object} roomId -> object with the end-to-end info for the room.
     */
    getAllEndToEndRooms: function getAllEndToEndRooms() {
        var roomKeys = getKeysWithPrefix(this.store, keyEndToEndRoom(''));
        var results = {};
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = (0, _getIterator3.default)(roomKeys), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var k = _step2.value;

                var unprefixedKey = k.substr(keyEndToEndRoom('').length);
                results[unprefixedKey] = getJsonItem(this.store, k);
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

        return results;
    },

    removeAllEndToEndRooms: function removeAllEndToEndRooms() {
        removeByPrefix(this.store, keyEndToEndRoom(''));
    }
};

var KEY_END_TO_END_ACCOUNT = E2E_PREFIX + "account";
var KEY_END_TO_END_DEVICE_SYNC_TOKEN = E2E_PREFIX + "device_sync_token";
var KEY_END_TO_END_DEVICE_LIST_TRACKING_STATUS = E2E_PREFIX + "device_tracking";

function keyEndToEndDevicesForUser(userId) {
    return E2E_PREFIX + "devices/" + userId;
}

function keyEndToEndSessions(deviceKey) {
    return E2E_PREFIX + "sessions/" + deviceKey;
}

function keyEndToEndInboundGroupSession(senderKey, sessionId) {
    return E2E_PREFIX + "inboundgroupsessions/" + senderKey + "/" + sessionId;
}

function keyEndToEndRoom(roomId) {
    return E2E_PREFIX + "rooms/" + roomId;
}

function getJsonItem(store, key) {
    try {
        // if the key is absent, store.getItem() returns null, and
        // JSON.parse(null) === null, so this returns null.
        return JSON.parse(store.getItem(key));
    } catch (e) {
        debuglog("Failed to get key %s: %s", key, e);
        debuglog(e.stack);
    }
    return null;
}

function getKeysWithPrefix(store, prefix) {
    var results = [];
    for (var i = 0; i < store.length; ++i) {
        var key = store.key(i);
        if (key.startsWith(prefix)) results.push(key);
    }
    return results;
}

function removeByPrefix(store, prefix) {
    var toRemove = [];
    for (var i = 0; i < store.length; ++i) {
        var key = store.key(i);
        if (key.startsWith(prefix)) toRemove.push(key);
    }
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = (0, _getIterator3.default)(toRemove), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var _key = _step3.value;

            store.removeItem(_key);
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

function debuglog() {
    if (DEBUG) {
        var _console;

        (_console = console).log.apply(_console, arguments);
    }
}

/** */
module.exports = WebStorageSessionStore;
//# sourceMappingURL=webstorage.js.map