'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _utils = require('../../utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Internal module. in-memory storage for e2e.
 *
 * @module
 */

/**
 * @implements {module:crypto/store/base~CryptoStore}
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

var MemoryCryptoStore = function () {
    function MemoryCryptoStore() {
        (0, _classCallCheck3.default)(this, MemoryCryptoStore);

        this._outgoingRoomKeyRequests = [];
    }

    /**
     * Delete all data from this store.
     *
     * @returns {Promise} Promise which resolves when the store has been cleared.
     */


    (0, _createClass3.default)(MemoryCryptoStore, [{
        key: 'deleteAllData',
        value: function deleteAllData() {
            return _bluebird2.default.resolve();
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
            var _this = this;

            var requestBody = request.requestBody;

            return _bluebird2.default.try(function () {
                // first see if we already have an entry for this request.
                var existing = _this._getOutgoingRoomKeyRequest(requestBody);

                if (existing) {
                    // this entry matches the request - return it.
                    console.log('already have key request outstanding for ' + (requestBody.room_id + ' / ' + requestBody.session_id + ': ') + 'not sending another');
                    return existing;
                }

                // we got to the end of the list without finding a match
                // - add the new request.
                console.log('enqueueing key request for ' + requestBody.room_id + ' / ' + requestBody.session_id);
                _this._outgoingRoomKeyRequests.push(request);
                return request;
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
            return _bluebird2.default.resolve(this._getOutgoingRoomKeyRequest(requestBody));
        }

        /**
         * Looks for existing room key request, and returns the result synchronously.
         *
         * @internal
         *
         * @param {module:crypto~RoomKeyRequestBody} requestBody
         *    existing request to look for
         *
         * @return {module:crypto/store/base~OutgoingRoomKeyRequest?}
         *    the matching request, or null if not found
         */

    }, {
        key: '_getOutgoingRoomKeyRequest',
        value: function _getOutgoingRoomKeyRequest(requestBody) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = (0, _getIterator3.default)(this._outgoingRoomKeyRequests), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var existing = _step.value;

                    if (_utils2.default.deepCompare(existing.requestBody, requestBody)) {
                        return existing;
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

            return null;
        }

        /**
         * Look for room key requests by state
         *
         * @param {Array<Number>} wantedStates list of acceptable states
         *
         * @return {Promise} resolves to the a
         *    {@link module:crypto/store/base~OutgoingRoomKeyRequest}, or null if
         *    there are no pending requests in those states
         */

    }, {
        key: 'getOutgoingRoomKeyRequestByState',
        value: function getOutgoingRoomKeyRequestByState(wantedStates) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = (0, _getIterator3.default)(this._outgoingRoomKeyRequests), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var req = _step2.value;
                    var _iteratorNormalCompletion3 = true;
                    var _didIteratorError3 = false;
                    var _iteratorError3 = undefined;

                    try {
                        for (var _iterator3 = (0, _getIterator3.default)(wantedStates), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            var state = _step3.value;

                            if (req.state === state) {
                                return _bluebird2.default.resolve(req);
                            }
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

            return _bluebird2.default.resolve(null);
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
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = (0, _getIterator3.default)(this._outgoingRoomKeyRequests), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var req = _step4.value;

                    if (req.requestId !== requestId) {
                        continue;
                    }

                    if (req.state != expectedState) {
                        console.warn('Cannot update room key request from ' + expectedState + ' ' + ('as it was already updated to ' + req.state));
                        return _bluebird2.default.resolve(null);
                    }
                    (0, _assign2.default)(req, updates);
                    return _bluebird2.default.resolve(req);
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

            return _bluebird2.default.resolve(null);
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
            for (var i = 0; i < this._outgoingRoomKeyRequests.length; i++) {
                var req = this._outgoingRoomKeyRequests[i];

                if (req.requestId !== requestId) {
                    continue;
                }

                if (req.state != expectedState) {
                    console.warn('Cannot delete room key request in state ' + req.state + ' ' + ('(expected ' + expectedState + ')'));
                    return _bluebird2.default.resolve(null);
                }

                this._outgoingRoomKeyRequests.splice(i, 1);
                return _bluebird2.default.resolve(req);
            }

            return _bluebird2.default.resolve(null);
        }
    }]);
    return MemoryCryptoStore;
}();

exports.default = MemoryCryptoStore;
//# sourceMappingURL=memory-crypto-store.js.map