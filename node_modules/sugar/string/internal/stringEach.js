'use strict';

var isDefined = require('../../common/internal/isDefined'),
    classChecks = require('../../common/var/classChecks'),
    escapeRegExp = require('../../common/internal/escapeRegExp'),
    getRegExpFlags = require('../../common/internal/getRegExpFlags'),
    runGlobalMatch = require('./runGlobalMatch');

var isString = classChecks.isString,
    isRegExp = classChecks.isRegExp,
    isFunction = classChecks.isFunction;

function stringEach(str, search, fn) {
  var chunks, chunk, reg, result = [];
  if (isFunction(search)) {
    fn = search;
    reg = /[\s\S]/g;
  } else if (!search) {
    reg = /[\s\S]/g;
  } else if (isString(search)) {
    reg = RegExp(escapeRegExp(search), 'gi');
  } else if (isRegExp(search)) {
    reg = RegExp(search.source, getRegExpFlags(search, 'g'));
  }
  // Getting the entire array of chunks up front as we need to
  // pass this into the callback function as an argument.
  chunks = runGlobalMatch(str, reg);

  if (chunks) {
    for(var i = 0, len = chunks.length, r; i < len; i++) {
      chunk = chunks[i];
      result[i] = chunk;
      if (fn) {
        r = fn.call(str, chunk, i, chunks);
        if (r === false) {
          break;
        } else if (isDefined(r)) {
          result[i] = r;
        }
      }
    }
  }
  return result;
}

module.exports = stringEach;