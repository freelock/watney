'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _indexeddbLocalBackend = require('./indexeddb-local-backend.js');

var _indexeddbLocalBackend2 = _interopRequireDefault(_indexeddbLocalBackend);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * This class lives in the webworker and drives a LocalIndexedDBStoreBackend
 * controlled by messages from the main process.
 *
 * It should be instantiated by a web worker script provided by the application
 * in a script, for example:
 *
 * import {IndexedDBStoreWorker} from 'matrix-js-sdk/lib/indexeddb-worker.js';
 * const remoteWorker = new IndexedDBStoreWorker(postMessage);
 * onmessage = remoteWorker.onMessage;
 *
 * Note that it is advisable to import this class by referencing the file directly to
 * avoid a dependency on the whole js-sdk.
 *
 */
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

var IndexedDBStoreWorker = function () {
    /**
     * @param {function} postMessage The web worker postMessage function that
     * should be used to communicate back to the main script.
     */
    function IndexedDBStoreWorker(postMessage) {
        (0, _classCallCheck3.default)(this, IndexedDBStoreWorker);

        this.backend = null;
        this.postMessage = postMessage;

        this.onMessage = this.onMessage.bind(this);
    }

    /**
     * Passes a message event from the main script into the class. This method
     * can be directly assigned to the web worker `onmessage` variable.
     *
     * @param {Object} ev The message event
     */


    (0, _createClass3.default)(IndexedDBStoreWorker, [{
        key: 'onMessage',
        value: function onMessage(ev) {
            var _backend,
                _backend2,
                _this = this;

            var msg = ev.data;
            var prom = void 0;

            switch (msg.command) {
                case '_setupWorker':
                    this.backend = new _indexeddbLocalBackend2.default(
                    // this is the 'indexedDB' global (where global != window
                    // because it's a web worker and there is no window).
                    indexedDB, msg.args[0]);
                    prom = _bluebird2.default.resolve();
                    break;
                case 'connect':
                    prom = this.backend.connect();
                    break;
                case 'clearDatabase':
                    prom = this.backend.clearDatabase().then(function (result) {
                        // This returns special classes which can't be cloned
                        // across to the main script, so don't try.
                        return {};
                    });
                    break;
                case 'getSavedSync':
                    prom = this.backend.getSavedSync(false);
                    break;
                case 'setSyncData':
                    prom = (_backend = this.backend).setSyncData.apply(_backend, (0, _toConsumableArray3.default)(msg.args));
                    break;
                case 'syncToDatabase':
                    prom = (_backend2 = this.backend).syncToDatabase.apply(_backend2, (0, _toConsumableArray3.default)(msg.args)).then(function () {
                        // This also returns IndexedDB events which are not cloneable
                        return {};
                    });
                    break;
                case 'getUserPresenceEvents':
                    prom = this.backend.getUserPresenceEvents();
                    break;
            }

            if (prom === undefined) {
                postMessage({
                    command: 'cmd_fail',
                    seq: msg.seq,
                    // Can't be an Error because they're not structured cloneable
                    error: "Unrecognised command"
                });
                return;
            }

            prom.done(function (ret) {
                _this.postMessage.call(null, {
                    command: 'cmd_success',
                    seq: msg.seq,
                    result: ret
                });
            }, function (err) {
                console.error("Error running command: " + msg.command);
                console.error(err);
                _this.postMessage.call(null, {
                    command: 'cmd_fail',
                    seq: msg.seq,
                    // Just send a string because Error objects aren't cloneable
                    error: "Error running command"
                });
            });
        }
    }]);
    return IndexedDBStoreWorker;
}();

module.exports = IndexedDBStoreWorker;
//# sourceMappingURL=indexeddb-store-worker.js.map