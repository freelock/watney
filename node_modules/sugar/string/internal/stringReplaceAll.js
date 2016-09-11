'use strict';

var classChecks = require('../../common/var/classChecks'),
    escapeRegExp = require('../../common/internal/escapeRegExp'),
    getRegExpFlags = require('../../common/internal/getRegExpFlags');

var isString = classChecks.isString;

function stringReplaceAll(str, f, replace) {
  var i = 0, tokens;
  if (isString(f)) {
    f = RegExp(escapeRegExp(f), 'g');
  } else if (f && !f.global) {
    f = RegExp(f.source, getRegExpFlags(f, 'g'));
  }
  if (!replace) {
    replace = '';
  } else {
    tokens = replace;
    replace = function() {
      var t = tokens[i++];
      return t != null ? t : '';
    };
  }
  return str.replace(f, replace);
}

module.exports = stringReplaceAll;