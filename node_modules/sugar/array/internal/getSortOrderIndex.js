'use strict';

function getSortOrderIndex(chr, sortOrder) {
  if (!chr) {
    return null;
  } else {
    return sortOrder.indexOf(chr);
  }
}

module.exports = getSortOrderIndex;