'use strict';

var Sugar = require('sugar-core');

Sugar.String.defineInstance({

  'escapeURL': function(str, param) {
    return param ? encodeURIComponent(str) : encodeURI(str);
  }

});

module.exports = Sugar.String.escapeURL;