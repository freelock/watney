'use strict';

var Sugar = require('sugar-core');

Sugar.String.defineInstance({

  'remove': function(str, f) {
    return str.replace(f, '');
  }

});

module.exports = Sugar.String.remove;