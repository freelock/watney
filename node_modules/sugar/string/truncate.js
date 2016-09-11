'use strict';

var Sugar = require('sugar-core'),
    truncateString = require('./internal/truncateString');

Sugar.String.defineInstance({

  'truncate': function(str, length, from, ellipsis) {
    return truncateString(str, length, from, ellipsis);
  }

});

module.exports = Sugar.String.truncate;