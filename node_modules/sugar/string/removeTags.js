'use strict';

var Sugar = require('sugar-core'),
    replaceTags = require('./internal/replaceTags');

Sugar.String.defineInstance({

  'removeTags': function(str, tag, replace) {
    return replaceTags(str, tag, replace, false);
  }

});

module.exports = Sugar.String.removeTags;