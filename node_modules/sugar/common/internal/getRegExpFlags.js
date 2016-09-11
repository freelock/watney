'use strict';

function getRegExpFlags(reg, add) {
  var flags = '';
  add = add || '';
  function checkFlag(prop, flag) {
    if (prop || add.indexOf(flag) > -1) {
      flags += flag;
    }
  }
  checkFlag(reg.global, 'g');
  checkFlag(reg.ignoreCase, 'i');
  checkFlag(reg.multiline, 'm');
  checkFlag(reg.sticky, 'y');
  return flags;
}

module.exports = getRegExpFlags;