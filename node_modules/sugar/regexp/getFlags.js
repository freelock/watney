'use strict';

var Sugar = require('sugar-core'),
    getRegExpFlags = require('../common/internal/getRegExpFlags');

Sugar.RegExp.defineInstance({

  'getFlags': function(r) {
    return getRegExpFlags(r);
  }

});

module.exports = Sugar.RegExp.getFlags;