'use strict';

var Sugar = require('sugar-core'),
    isUndefined = require('../common/internal/isUndefined');

Sugar.String.defineInstance({

  'insert': function(str, substr, index) {
    index = isUndefined(index) ? str.length : index;
    return str.slice(0, index) + substr + str.slice(index);
  }

});

module.exports = Sugar.String.insert;