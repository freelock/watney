'use strict';

var Sugar = require('sugar-core');

Sugar.String.defineInstance({

  'unescapeURL': function(str, param) {
    return param ? decodeURI(str) : decodeURIComponent(str);
  }

});

module.exports = Sugar.String.unescapeURL;