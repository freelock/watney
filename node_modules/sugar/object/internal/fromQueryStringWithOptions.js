'use strict';

var forEach = require('../../common/internal/forEach'),
    parseQueryComponent = require('./parseQueryComponent');

function fromQueryStringWithOptions(obj, opts) {
  var str = String(obj || '').replace(/^.*?\?/, ''), result = {}, auto;
  opts = opts || {};
  if (str) {
    forEach(str.split('&'), function(p) {
      var split = p.split('=');
      var key = decodeURIComponent(split[0]);
      var val = split.length === 2 ? decodeURIComponent(split[1]) : '';
      auto = opts.auto !== false;
      parseQueryComponent(result, key, val, opts.deep, auto, opts.separator, opts.transform);
    });
  }
  return result;
}

module.exports = fromQueryStringWithOptions;