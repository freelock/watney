'use strict';

var Sugar = require('sugar-core'),
    HTML_ESCAPE_REG = require('./var/HTML_ESCAPE_REG'),
    HTMLToEntityMap = require('./var/HTMLToEntityMap'),
    coreUtilityAliases = require('../common/var/coreUtilityAliases');

var getOwn = coreUtilityAliases.getOwn;

Sugar.String.defineInstance({

  'escapeHTML': function(str) {
    return str.replace(HTML_ESCAPE_REG, function(chr) {
      return getOwn(HTMLToEntityMap, chr);
    });
  }

});

module.exports = Sugar.String.escapeHTML;