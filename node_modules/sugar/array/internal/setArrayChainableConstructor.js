'use strict';

var arrayCreate = require('./arrayCreate'),
    namespaceAliases = require('../../common/var/namespaceAliases'),
    setChainableConstructor = require('../../common/internal/setChainableConstructor');

var sugarArray = namespaceAliases.sugarArray;

function setArrayChainableConstructor() {
  setChainableConstructor(sugarArray, arrayCreate);
}

module.exports = setArrayChainableConstructor;