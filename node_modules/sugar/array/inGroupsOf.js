'use strict';

var Sugar = require('sugar-core'),
    isUndefined = require('../common/internal/isUndefined'),
    mathAliases = require('../common/var/mathAliases'),
    simpleRepeat = require('../common/internal/simpleRepeat');

var ceil = mathAliases.ceil;

Sugar.Array.defineInstance({

  'inGroupsOf': function(arr, num, padding) {
    var result = [], len = arr.length, group;
    if (len === 0 || num === 0) return arr;
    if (isUndefined(num)) num = 1;
    if (isUndefined(padding)) padding = null;
    simpleRepeat(ceil(len / num), function(i) {
      group = arr.slice(num * i, num * i + num);
      while(group.length < num) {
        group.push(padding);
      }
      result.push(group);
    });
    return result;
  }

});

module.exports = Sugar.Array.inGroupsOf;