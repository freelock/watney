'use strict';

var Sugar = require('sugar-core'),
    getRegExpFlags = require('../common/internal/getRegExpFlags');

Sugar.RegExp.defineInstance({

  'addFlags': function(r, flags) {
    return RegExp(r.source, getRegExpFlags(r, flags));
  }

});

module.exports = Sugar.RegExp.addFlags;