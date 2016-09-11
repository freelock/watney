'use strict';

var Sugar = require('sugar-core'),
    mathAliases = require('../../common/var/mathAliases'),
    getCoercedSearchString = require('../../es6/internal/getCoercedSearchString'),
    getCoercedStringSubject = require('../../es6/internal/getCoercedStringSubject');

var min = mathAliases.min,
    max = mathAliases.max;

Sugar.String.defineInstancePolyfill({

  'startsWith': function(searchString) {
    // Force compiler to respect argument length.
    var argLen = arguments.length, position = arguments[1];
    var str, start, pos, len, searchLength;
    str = getCoercedStringSubject(this);
    searchString = getCoercedSearchString(searchString);
    pos = +position || 0;
    len = str.length;
    start = min(max(pos, 0), len);
    searchLength = searchString.length;
    if (searchLength + start > len) {
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