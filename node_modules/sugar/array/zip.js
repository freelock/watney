'use strict';

var Sugar = require('sugar-core'),
    map = require('../common/internal/map');

Sugar.Array.defineInstanceWithArguments({

  'zip': function(arr, args) {
    return map(arr, function(el, i) {
      return [el].concat(map(args, function(k) {
        return (i in k) ? k[i] : null;
      }));
    });
  }

});

module.exports = Sugar.Array.zip;