'use strict';

var escapeRegExp = require('../../common/internal/escapeRegExp');

function stringParameterize(str, separator) {
  if (separator === undefined) separator = '-';
  str = str.replace(/[^a-z0-9\-_]+/gi, separator);
  if (separator) {
    var reg = RegExp('^{s}+|{s}+$|({s}){s}+'.split('{s}').join(escapeRegExp(separator)), 'g');
    str = str.replace(reg, '$1');
  }
  return encodeURI(str.toLowerCase());
}

module.exports = stringParameterize;