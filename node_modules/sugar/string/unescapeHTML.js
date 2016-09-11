'use strict';

var Sugar = require('sugar-core'),
    unescapeHTML = require('./internal/unescapeHTML');

Sugar.String.defineInstance({

  'unescapeHTML': function(str) {
    return unescapeHTML(str);
  }

});

module.exports = Sugar.String.unescapeHTML;