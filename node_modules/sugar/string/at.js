'use strict';

var Sugar = require('sugar-core'),
    getEntriesForIndexes = require('../common/internal/getEntriesForIndexes');

Sugar.String.defineInstance({

  'at': function(str, index, loop) {
    return getEntriesForIndexes(str, index, loop, true);
  }

});

module.exports = Sugar.String.at;