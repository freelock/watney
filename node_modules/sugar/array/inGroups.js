'use strict';

var Sugar = require('sugar-core'),
    isDefined = require('../common/internal/isDefined'),
    mathAliases = require('../common/var/mathAliases'),
    simpleRepeat = require('../common/internal/simpleRepeat');

var ceil = mathAliases.ceil;

Sugar.Array.defineInstance({

  'inGroups': function(arr, num, padding) {
    var pad = isDefined(padding);
    var result = new Array(num);
    var divisor = ceil(arr.length / num);
    simpleRepeat(num, function(i) {
      var index = i * divisor;
      var group = arr.slice(index, index + divisor);
      if (pad && group.length < divisor) {
        simpleRepeat(divisor - group.length, function() {
          group.push(padding);
        });
      }
      result[i] = group;
    });
    return result;
  }

});

module.exports = Sugar.Array.inGroups;