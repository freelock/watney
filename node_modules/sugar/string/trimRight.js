'use strict';

var Sugar = require('sugar-core'),
    RIGHT_TRIM_REG = require('./var/RIGHT_TRIM_REG');

Sugar.String.defineInstance({

  'trimRight': function(str) {
    return str.replace(RIGHT_TRIM_REG, '');
  }

});

module.exports = Sugar.String.trimRight;