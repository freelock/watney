'use strict';

var getSortOrder = require('../internal/getSortOrder'),
    codeIsNumeral = require('../internal/codeIsNumeral'),
    stringToNumber = require('../../common/internal/stringToNumber'),
    namespaceAliases = require('../../common/var/namespaceAliases'),
    getSortOrderIndex = require('../internal/getSortOrderIndex'),
    getSortEquivalents = require('../internal/getSortEquivalents'),
    defineOptionsAccessor = require('../../common/internal/defineOptionsAccessor'),
    getCollationCharacter = require('../internal/getCollationCharacter'),
    getCollationReadyString = require('../internal/getCollationReadyString');

var sugarArray = namespaceAliases.sugarArray;

var ARRAY_OPTIONS = {
  'sortIgnore':      null,
  'sortNatural':     true,
  'sortIgnoreCase':  true,
  'sortOrder':       getSortOrder(),
  'sortCollate':     collateStrings,
  'sortEquivalents': getSortEquivalents()
};

var _arrayOptions = defineOptionsAccessor(sugarArray, ARRAY_OPTIONS);

function collateStrings(a, b) {
  var aValue, bValue, aChar, bChar, aEquiv, bEquiv, index = 0, tiebreaker = 0;

  var sortOrder       = _arrayOptions('sortOrder');
  var sortIgnore      = _arrayOptions('sortIgnore');
  var sortNatural     = _arrayOptions('sortNatural');
  var sortIgnoreCase  = _arrayOptions('sortIgnoreCase');
  var sortEquivalents = _arrayOptions('sortEquivalents');

  a = getCollationReadyString(a, sortIgnore, sortIgnoreCase);
  b = getCollationReadyString(b, sortIgnore, sortIgnoreCase);

  do {

    aChar  = getCollationCharacter(a, index, sortEquivalents);
    bChar  = getCollationCharacter(b, index, sortEquivalents);
    aValue = getSortOrderIndex(aChar, sortOrder);
    bValue = getSortOrderIndex(bChar, sortOrder);

    if (aValue === -1 || bValue === -1) {
      aValue = a.charCodeAt(index) || null;
      bValue = b.charCodeAt(index) || null;
      if (sortNatural && codeIsNumeral(aValue) && codeIsNumeral(bValue)) {
        aValue = stringToNumber(a.slice(index));
        bValue = stringToNumber(b.slice(index));
      }
    } else {
      aEquiv = aChar !== a.charAt(index);
      bEquiv = bChar !== b.charAt(index);
      if (aEquiv !== bEquiv && tiebreaker === 0) {
        tiebreaker = aEquiv - bEquiv;
      }
    }
    index += 1;
  } while(aValue != null && bValue != null && aValue === bValue);
  if (aValue === bValue) return tiebreaker;
  return aValue - bValue;
}

module.exports = {
  ARRAY_OPTIONS: ARRAY_OPTIONS,
  _arrayOptions: _arrayOptions
};