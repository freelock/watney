'use strict';

var Sugar = require('sugar-core'),
    escapeRegExp = require('../common/internal/escapeRegExp');

Sugar.RegExp.defineStatic({

  'escape': function(str) {
    return escapeRegExp(str);
  }

});

module.exports = Sugar.RegExp.escape;