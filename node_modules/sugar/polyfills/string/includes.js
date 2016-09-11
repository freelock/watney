'use strict';

var Sugar = require('sugar-core'),
    getCoercedSearchString = require('../../es6/internal/getCoercedSearchString'),
    getCoercedStringSubject = require('../../es6/internal/getCoercedStringSubject');

Sugar.String.defineInstancePolyfill({

  'includes': function(searchString) {
    // Force compiler to respect argument length.
    var argLen = arguments.length, pos = arguments[1];
    var str = getCoercedStringSubject(this);
    searchString = getCoercedSearchString(searchString);
    return str.indexOf(searchString, pos) !== -1;
  }

});

// This package does not export anything as it is mapping a
// polyfill to String.prototype which cannot be called statically.