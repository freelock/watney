'use strict';

var forEach = require('../../common/internal/forEach'),
    spaceSplit = require('../../common/internal/spaceSplit');

function getSortEquivalents() {
  var equivalents = {};
  forEach(spaceSplit('AÁÀÂÃÄ CÇ EÉÈÊË IÍÌİÎÏ OÓÒÔÕÖ Sß UÚÙÛÜ'), function(set) {
    var first = set.charAt(0);
    forEach(set.slice(1).split(''), function(chr) {
      equivalents[chr] = first;
      equivalents[chr.toLowerCase()] = first.toLowerCase();
    });
  });
  return equivalents;
}

module.exports = getSortEquivalents;