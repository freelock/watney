'use strict';

var Sugar = require('sugar-core');

Sugar.RegExp.defineInstance({

  'setFlags': function(r, flags) {
    return RegExp(r.source, flags);
  }

});

module.exports = Sugar.RegExp.setFlags;