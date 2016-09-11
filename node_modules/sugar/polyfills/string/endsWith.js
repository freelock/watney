'use strict';

var Sugar = require('sugar-core'),
    isDefined = require('../../common/internal/isDefined'),
    mathAliases = require('../../common/var/mathAliases'),
    getCoercedSearchString = require('../../es6/internal/getCoercedSearchString'),
    getCoercedStringSubject = require('../../es6/internal/getCoercedStringSubject');

var min = mathAliases.min,
    max = mathAliases.max;

Sugar.String.defineInstancePolyfill({

  'endsWith': function(searchString) {
    // Force compiler to respect argument length.
    var argLen = arguments.length, endPosition = arguments[1];
    var str, start, end, pos, len, searchLength;
    str = getCoercedStringSubject(this);
    searchString = getCoercedSearchString(searchString);
    len = str.length;
    pos = len;
    if (isDefined(endPosition)) {
      pos = +endPosition || 0;
    }
    end = min(max(pos, 0), len);
    searchLength = searchString.length;
    start = end - searchLength;
    if (start < 0) {
      return false;
    }
    if (str.substr(start, searchLength) === searchString) {
      return true;
    }
    return false;
  }

});

// This package does not export anything as it is mapping a
// polyfill to String.prototype which cannot be called statically.