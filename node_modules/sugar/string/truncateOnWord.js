'use strict';

var Sugar = require('sugar-core'),
    truncateString = require('./internal/truncateString');

Sugar.String.defineInstance({

  'truncateOnWord': function(str, length, from, ellipsis) {
    return truncateString(str, length, from, ellipsis, true);
  }

});

module.exports = Sugar.String.truncateOnWord;