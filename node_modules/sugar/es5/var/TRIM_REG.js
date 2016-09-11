'use strict';

var TRIM_CHARS = require('../../common/var/TRIM_CHARS');

module.exports = RegExp('^[' + TRIM_CHARS + ']+|['+ TRIM_CHARS +']+$', 'g');