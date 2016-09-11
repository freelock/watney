'use strict';

var Sugar = require('sugar-core'),
    stringParameterize = require('./internal/stringParameterize');

Sugar.String.defineInstance({

  'parameterize': function(str, separator) {
    return stringParameterize(str, separator);
  }

});

module.exports = Sugar.String.parameterize;