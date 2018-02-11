"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
Copyright 2015, 2016 OpenMarket Ltd
Copyright 2017 Vector Creations Ltd
Copyright 2017 New Vector Ltd

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
 * @module
 */

var Reemitter = function () {
    function Reemitter(target) {
        (0, _classCallCheck3.default)(this, Reemitter);

        this.target = target;

        // We keep one bound event handler for each event name so we know
        // what event is arriving
        this.boundHandlers = {};
    }

    (0, _createClass3.default)(Reemitter, [{
        key: "_handleEvent",
        value: function _handleEvent(eventName) {
            var _target;

            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            (_target = this.target).emit.apply(_target, [eventName].concat(args));
        }
    }, {
        key: "reEmit",
        value: function reEmit(source, eventNames) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = (0, _getIterator3.default)(eventNames), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var eventName = _step.value;

                    if (this.boundHandlers[eventName] === undefined) {
                        this.boundHandlers[eventName] = this._handleEvent.bind(this, eventName);
                    }
                    var boundHandler = this.boundHandlers[eventName];

                    source.on(eventName, boundHandler);
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
        }
    }]);
    return Reemitter;
}();

exports.default = Reemitter;
//# sourceMappingURL=ReEmitter.js.map