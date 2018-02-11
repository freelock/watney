'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _memoryCryptoStore = require('./memory-crypto-store');

var _memoryCryptoStore2 = _interopRequireDefault(_memoryCryptoStore);

var _indexeddbCryptoStoreBackend = require('./indexeddb-crypto-store-backend');

var IndexedDBCryptoStoreBackend = _interopRequireWildcard(_indexeddbCryptoStoreBackend);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Internal module. indexeddb storage for e2e.
 *
 * @module
 */

/**
 * An implementation of CryptoStore, which is normally backed by an indexeddb,
 * but with fallback to MemoryCryptoStore.
 *
 * @implements {module:crypto/store/base~CryptoStore}
 */
var IndexedDBCryptoStore = function () {
    /**
     * Create a new IndexedDBCryptoStore
     *
     * @param {IDBFactory} indexedDB  global indexedDB instance
     * @param {string} dbName   name of db to connect to
     */
    function IndexedDBCryptoStore(indexedDB, dbName) {
        (0, _classCallCheck3.default)(this, IndexedDBCryptoStore);

        this._indexedDB = indexedDB;
        this._dbName = dbName;
        this._backendPromise = null;
    }

    /**
     * Ensure the database exists and is up-to-date, or fall back to
     * an in-memory store.
     *
     * @return {Promise} resolves to either an IndexedDBCryptoStoreBackend.Backend,
     * or a MemoryCryptoStore
     */


    (0, _createClass3.default)(IndexedDBCryptoStore, [{
        key: '_connect',
        value: function _connect() {
            var _this = this;

            if (this._backendPromise) {
                return this._backendPromise;
            }

            this._backendPromise = new _bluebird2.default(function (resolve, reject) {
                if (!_this._indexedDB) {
                    reject(new Error('no indexeddb support available'));
                    return;
                }

                console.log('connecting to indexeddb ' + _this._dbName);

                var req = _this._indexedDB.open(_this._dbName, IndexedDBCryptoStoreBackend.VERSION);

                req.onupgradeneeded = function (ev) {
                    var db = ev.target.result;
                    var oldVersion = ev.oldVersion;
                    IndexedDBCryptoStoreBackend.upgradeDatabase(db, oldVersion);
                };

                req.onblocked = function () {
                    console.log('can\'t yet open IndexedDBCryptoStore because it is open elsewhere');
                };

                req.onerror = function (ev) {
                    reject(ev.target.error);
                };

                req.onsuccess = function (r) {
                    var db = r.target.result;

                    console.log('connected to indexeddb ' + _this._dbName);
                    resolve(new IndexedDBCryptoStoreBackend.Backend(db));
                };
            }).catch(function (e) {
                console.warn('unable to connect to indexeddb ' + _this._dbName + (': falling back to in-memory store: ' + e));
                return new _memoryCryptoStore2.default();
            });

            return this._backendPromise;
        }

        /**
         * Delete all data from this store.
         *
         * @returns {Promise} resolves when the store has been cleared.
         */

    }, {
        key: 'deleteAllData',
        value: function deleteAllData() {
            var _this2 = this;

            return new _bluebird2.default(function (resolve, reject) {
                if (!_this2._indexedDB) {
                    reject(new Error('no indexeddb support available'));
                    return;
                }

                console.log('Removing indexeddb instance: ' + _this2._dbName);
                var req = _this2._indexedDB.deleteDatabase(_this2._dbName);

                req.onblocked = function () {
                    console.log('can\'t yet delete IndexedDBCryptoStore because it is open elsewhere');
                };

                req.onerror = function (ev) {
                    reject(ev.target.error);
                };

                req.onsuccess = function () {
                    console.log('Removed indexeddb instance: ' + _this2._dbName);
                    resolve();
                };
            }).catch(function (e) {
                // in firefox, with indexedDB disabled, this fails with a
                // DOMError. We treat this as non-fatal, so that people can
                // still use the app.
                console.warn('unable to delete IndexedDBCryptoStore: ' + e);
            });
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

    }, {
        key: 'getOrAddOutgoingRoomKeyRequest',
        value: function getOrAddOutgoingRoomKeyRequest(request) {
            return this._connect().then(function (backend) {
                return backend.getOrAddOutgoingRoomKeyRequest(request);
            });
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
            return this._connect().then(function (backend) {
                return backend.getOutgoingRoomKeyRequest(requestBody);
            });
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
            return this._connect().then(function (backend) {
                return backend.getOutgoingRoomKeyRequestByState(wantedStates);
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
            return this._connect().then(function (backend) {
                return backend.updateOutgoingRoomKeyRequest(requestId, expectedState, updates);
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
            return this._connect().then(function (backend) {
                return backend.deleteOutgoingRoomKeyRequest(requestId, expectedState);
            });
        }
    }]);
    return IndexedDBCryptoStore;
}(); /*
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

exports.default = IndexedDBCryptoStore;
//# sourceMappingURL=indexeddb-crypto-store.js.map