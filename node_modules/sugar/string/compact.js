'use strict';

var Sugar = require('sugar-core'),
    trim = require('../common/internal/trim');

Sugar.String.defineInstance({

  'compact': function(str) {
    return trim(str).replace(/([\r\n\s　])+/g, function(match, whitespace) {
      return whitespace === '　' ? whitespace : ' ';
    });
  }

});

module.exports = Sugar.String.compact;