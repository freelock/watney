'use strict';

var map = require('../../common/internal/map'),
    classChecks = require('../../common/var/classChecks'),
    escapeRegExp = require('../../common/internal/escapeRegExp'),
    runTagReplacements = require('./runTagReplacements');

var isString = classChecks.isString;

function replaceTags(str, find, replacement, strip) {
  var tags = isString(find) ? [find] : find, reg, src;
  tags = map(tags || [], function(t) {
    return escapeRegExp(t);
  }).join('|');
  src = tags.replace('all', '') || '[^\\s>]+';
  src = '<(\\/)?(' + src + ')(\\s+[^<>]*?)?\\s*(\\/)?>';
  reg = RegExp(src, 'gi');
  return runTagReplacements(str.toString(), reg, strip, replacement);
}

module.exports = replaceTags;