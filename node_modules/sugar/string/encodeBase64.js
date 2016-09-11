'use strict';

var Sugar = require('sugar-core'),
    base64 = require('./var/base64');

var encodeBase64 = base64.encodeBase64;

Sugar.String.defineInstance({

  'encodeBase64': function(str) {
    return encodeBase64(str);
  }

});

module.exports = Sugar.String.encodeBase64;