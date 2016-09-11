'use strict';

var Sugar = require('sugar-core'),
    getEntriesForIndexes = require('../common/internal/getEntriesForIndexes');

Sugar.Array.defineInstance({

  'at': function(arr, index, loop) {
    return getEntriesForIndexes(arr, index, loop);
  }

});

module.exports = Sugar.Array.at;