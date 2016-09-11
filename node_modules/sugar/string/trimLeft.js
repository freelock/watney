'use strict';

var Sugar = require('sugar-core'),
    LEFT_TRIM_REG = require('./var/LEFT_TRIM_REG');

Sugar.String.defineInstance({

  'trimLeft': function(str) {
    return str.replace(LEFT_TRIM_REG, '');
  }

});

module.exports = Sugar.String.trimLeft;