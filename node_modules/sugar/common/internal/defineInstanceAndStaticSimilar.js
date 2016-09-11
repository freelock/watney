'use strict';

var methodDefineAliases = require('../var/methodDefineAliases'),
    collectSimilarMethods = require('./collectSimilarMethods');

var defineInstanceAndStatic = methodDefineAliases.defineInstanceAndStatic;

function defineInstanceAndStaticSimilar(sugarNamespace, set, fn, flags) {
  defineInstanceAndStatic(sugarNamespace, collectSimilarMethods(set, fn), flags);
}

module.exports = defineInstanceAndStaticSimilar;