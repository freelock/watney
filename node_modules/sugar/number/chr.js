'use strict';

var Sugar = require('sugar-core'),
    chr = require('../common/var/chr');

Sugar.Number.defineInstance({

  'chr': function(n) {
    return chr(n);
  }

});

module.exports = Sugar.Number.chr;