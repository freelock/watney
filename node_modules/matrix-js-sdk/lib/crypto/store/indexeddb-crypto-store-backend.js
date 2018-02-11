'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Backend = exports.VERSION = undefined;

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

exports.upgradeDatabase = upgradeDatabase;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _utils = require('../../utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var VERSION = exports.VERSION = 1;

/**
 * Implementation of a CryptoStore which is backed by an existing
 * IndexedDB connection. Generally you want IndexedDBCryptoStore
 * which connects to the database and defers to one of these.
 *
 * @implements {module:crypto/store/base~CryptoStore}
 */

var Backend = exports.Backend = function () {
    /**
     * @param {IDBDatabase} db
     */
    function Backend(db) {
        var _this = this;

        (0, _classCallCheck3.default)(this, Backend);

        this._db = db;

        // make sure we close the db on `onversionchange` - otherwise
        // attempts to delete the database will block (and subsequent
        // attempts to re-create it will also block).
        db.onversionchange = function (ev) {
            console.log('versionchange for indexeddb ' + _this._dbName + ': closing');
            db.close();
        };
    }

    /**
     * Look for an existing outgoing room key request, and if none is found,
     * add a new one
     *
     * @param {module:crypto/store/base~OutgoingRoomKeyRequest} request
     *
     * @returns {Promise} resolves to
     *    {@link module:crypto/store/base~OutgoingRoomKeyRequest}: either the
     *    same instance as passed in, or the existing one.
     */


    (0, _createClass3.default)(Backend, [{
        key: 'getOrAddOutgoingRoomKeyRequest',
        value: function getOrAddOutgoingRoomKeyRequest(request) {
            var requestBody = request.requestBody;

            var deferred = _bluebird2.default.defer();
            var txn = this._db.transaction("outgoingRoomKeyRequests", "readwrite");
            txn.onerror = deferred.reject;

            // first see if we already have an entry for this request.
            this._getOutgoingRoomKeyRequest(txn, requestBody, function (existing) {
                if (existing) {
                    // this entry matches the request - return it.
                    console.log('already have key request outstanding for ' + (requestBody.room_id + ' / ' + requestBody.session_id + ': ') + 'not sending another');
                    deferred.resolve(existing);
                    return;
                }

                // we got to the end of the list without finding a match
                // - add the new request.
                console.log('enqueueing key request for ' + requestBody.room_id + ' / ' + requestBody.session_id);
                var store = txn.objectStore("outgoingRoomKeyRequests");
                store.add(request);
                txn.onsuccess = function () {
                    deferred.resolve(request);
                };
            });

            return deferred.promise;
        }

        /**
         * Look for an existing room key request
         *
         * @param {module:crypto~RoomKeyRequestBody} requestBody
         *    existing request to look for
         *
         * @return {Promise} resolves to the matching
         *    {@link module:crypto/store/base~OutgoingRoomKeyRequest}, or null if
         *    not found
         */

    }, {
        key: 'getOutgoingRoomKeyRequest',
        value: function getOutgoingRoomKeyRequest(requestBody) {
            var deferred = _bluebird2.default.defer();

            var txn = this._db.transaction("outgoingRoomKeyRequests", "readonly");
            txn.onerror = deferred.reject;

            this._getOutgoingRoomKeyRequest(txn, requestBody, function (existing) {
                deferred.resolve(existing);
            });
            return deferred.promise;
        }

        /**
         * look for an existing room key request in the db
         *
         * @private
         * @param {IDBTransaction} txn  database transaction
         * @param {module:crypto~RoomKeyRequestBody} requestBody
         *    existing request to look for
         * @param {Function} callback  function to call with the results of the
         *    search. Either passed a matching
         *    {@link module:crypto/store/base~OutgoingRoomKeyRequest}, or null if
         *    not found.
         */

    }, {
        key: '_getOutgoingRoomKeyRequest',
        value: function _getOutgoingRoomKeyRequest(txn, requestBody, callback) {
            var store = txn.objectStore("outgoingRoomKeyRequests");

            var idx = store.index("session");
            var cursorReq = idx.openCursor([requestBody.room_id, requestBody.session_id]);

            cursorReq.onsuccess = function (ev) {
                var cursor = ev.target.result;
                if (!cursor) {
                    // no match found
                    callback(null);
                    return;
                }

                var existing = cursor.value;

                if (_utils2.default.deepCompare(existing.requestBody, requestBody)) {
                    // got a match
                    callback(existing);
                    return;
                }

                // look at the next entry in the index
                cursor.continue();
            };
        }

        /**
         * Look for room key requests by state
         *
         * @param {Array<Number>} wantedStates list of acceptable states
         *
         * @return {Promise} resolves to the a
         *    {@link module:crypto/store/base~OutgoingRoomKeyRequest}, or null if
         *    there are no pending requests in those states. If there are multiple
         *    requests in those states, an arbitrary one is chosen.
         */

    }, {
        key: 'getOutgoingRoomKeyRequestByState',
        value: function getOutgoingRoomKeyRequestByState(wantedStates) {
            if (wantedStates.length === 0) {
                return _bluebird2.default.resolve(null);
            }

            // this is a bit tortuous because we need to make sure we do the lookup
            // in a single transaction, to avoid having a race with the insertion
            // code.

            // index into the wantedStates array
            var stateIndex = 0;
            var result = void 0;

            function onsuccess(ev) {
                var cursor = ev.target.result;
                if (cursor) {
                    // got a match
                    result = cursor.value;
                    return;
                }

                // try the next state in the list
                stateIndex++;
                if (stateIndex >= wantedStates.length) {
                    // no matches
                    return;
                }

                var wantedState = wantedStates[stateIndex];
                var cursorReq = ev.target.source.openCursor(wantedState);
                cursorReq.onsuccess = onsuccess;
            }

            var txn = this._db.transaction("outgoingRoomKeyRequests", "readonly");
            var store = txn.objectStore("outgoingRoomKeyRequests");

            var wantedState = wantedStates[stateIndex];
            var cursorReq = store.index("state").openCursor(wantedState);
            cursorReq.onsuccess = onsuccess;

            return promiseifyTxn(txn).then(function () {
                return result;
            });
        }

        /**
         * Look for an existing room key request by id and state, and update it if
         * found
         *
         * @param {string} requestId      ID of request to update
         * @param {number} expectedState  state we expect to find the request in
         * @param {Object} updates        name/value map of updates to apply
         *
         * @returns {Promise} resolves to
         *    {@link module:crypto/store/base~OutgoingRoomKeyRequest}
         *    updated request, or null if no matching row was found
         */

    }, {
        key: 'updateOutgoingRoomKeyRequest',
        value: function updateOutgoingRoomKeyRequest(requestId, expectedState, updates) {
            var result = null;

            function onsuccess(ev) {
                var cursor = ev.target.result;
                if (!cursor) {
                    return;
                }
                var data = cursor.value;
                if (data.state != expectedState) {
                    console.warn('Cannot update room key request from ' + expectedState + ' ' + ('as it was already updated to ' + data.state));
                    return;
                }
                (0, _assign2.default)(data, updates);
                cursor.update(data);
                result = data;
            }

            var txn = this._db.transaction("outgoingRoomKeyRequests", "readwrite");
            var cursorReq = txn.objectStore("outgoingRoomKeyRequests").openCursor(requestId);
            cursorReq.onsuccess = onsuccess;
            return promiseifyTxn(txn).then(function () {
                return result;
            });
        }

        /**
         * Look for an existing room key request by id and state, and delete it if
         * found
         *
         * @param {string} requestId      ID of request to update
         * @param {number} expectedState  state we expect to find the request in
         *
         * @returns {Promise} resolves once the operation is completed
         */

    }, {
        key: 'deleteOutgoingRoomKeyRequest',
        value: function deleteOutgoingRoomKeyRequest(requestId, expectedState) {
            var txn = this._db.transaction("outgoingRoomKeyRequests", "readwrite");
            var cursorReq = txn.objectStore("outgoingRoomKeyRequests").openCursor(requestId);
            cursorReq.onsuccess = function (ev) {
                var cursor = ev.target.result;
                if (!cursor) {
                    return;
                }
                var data = cursor.value;
                if (data.state != expectedState) {
                    console.warn('Cannot delete room key request in state ' + data.state + ' ' + ('(expected ' + expectedState + ')'));
                    return;
                }
                cursor.delete();
            };
            return promiseifyTxn(txn);
        }
    }]);
    return Backend;
}();

function upgradeDatabase(db, oldVersion) {
    console.log('Upgrading IndexedDBCryptoStore from version ' + oldVersion + (' to ' + VERSION));
    if (oldVersion < 1) {
        // The database did not previously exist.
        createDatabase(db);
    }
    // Expand as needed.
}

function createDatabase(db) {
    var outgoingRoomKeyRequestsStore = db.createObjectStore("outgoingRoomKeyRequests", { keyPath: "requestId" });

    // we assume that the RoomKeyRequestBody will have room_id and session_id
    // properties, to make the index efficient.
    outgoingRoomKeyRequestsStore.createIndex("session", ["requestBody.room_id", "requestBody.session_id"]);

    outgoingRoomKeyRequestsStore.createIndex("state", "state");
}

function promiseifyTxn(txn) {
    return new _bluebird2.default(function (resolve, reject) {
        txn.oncomplete = resolve;
        txn.onerror = reject;
    });
}
//# sourceMappingURL=indexeddb-crypto-store-backend.js.map