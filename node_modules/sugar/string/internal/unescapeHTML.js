'use strict';

var HTML_ENTITY_REG = require('../var/HTML_ENTITY_REG'),
    HTMLFromEntityMap = require('../var/HTMLFromEntityMap'),
    chr = require('../../common/var/chr');

function unescapeHTML(str) {
  return str.replace(HTML_ENTITY_REG, function(full, hex, code) {
    var special = HTMLFromEntityMap[code];
    return special || chr(hex ? parseInt(code, 16) : +code);
  });
}

module.exports = unescapeHTML;