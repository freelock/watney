'use strict';

var Sugar = require('sugar-core'),
    replaceTags = require('./internal/replaceTags');

Sugar.String.defineInstance({

  'stripTags': function(str, tag, replace) {
    return replaceTags(str, tag, replace, true);
  }

});

module.exports = Sugar.String.stripTags;