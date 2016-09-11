'use strict';

var Sugar = require('sugar-core'),
    allCharsReg = require('../common/internal/allCharsReg'),
    getRegExpFlags = require('../common/internal/getRegExpFlags');

Sugar.RegExp.defineInstance({

  'removeFlags': function(r, flags) {
    var reg = allCharsReg(flags);
    return RegExp(r.source, getRegExpFlags(r).replace(reg, ''));
  }

});

module.exports = Sugar.RegExp.removeFlags;