'use strict';

var Sugar = require('sugar-core'),
    base64 = require('./var/base64');

var decodeBase64 = base64.decodeBase64;

Sugar.String.defineInstance({

  'decodeBase64': function(str) {
    return decodeBase64(str);
  }

});

module.exports = Sugar.String.decodeBase64;