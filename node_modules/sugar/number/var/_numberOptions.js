'use strict';

var NUMBER_OPTIONS = require('./NUMBER_OPTIONS'),
    namespaceAliases = require('../../common/var/namespaceAliases'),
    defineOptionsAccessor = require('../../common/internal/defineOptionsAccessor');

var sugarNumber = namespaceAliases.sugarNumber;

module.exports = defineOptionsAccessor(sugarNumber, NUMBER_OPTIONS);