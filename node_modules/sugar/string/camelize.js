'use strict';

var Sugar = require('sugar-core'),
    stringCamelize = require('./internal/stringCamelize');

Sugar.String.defineInstance({

  'camelize': function(str, upper) {
    return stringCamelize(str, upper);
  }

});

module.exports = Sugar.String.camelize;