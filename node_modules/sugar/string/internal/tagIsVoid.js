'use strict';

var HTML_VOID_ELEMENTS = require('../var/HTML_VOID_ELEMENTS'),
    indexOf = require('../../common/internal/indexOf');

function tagIsVoid(tag) {
  return indexOf(HTML_VOID_ELEMENTS, tag.toLowerCase()) !== -1;
}

module.exports = tagIsVoid;