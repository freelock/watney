'use strict';

var coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var getOwn = coreUtilityAliases.getOwn;

function getCollationCharacter(str, index, sortEquivalents) {
  var chr = str.charAt(index);
  return getOwn(sortEquivalents, chr) || chr;
}

module.exports = getCollationCharacter;