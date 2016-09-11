'use strict';

var defineNativeMethodsOnChainable = require('../internal/defineNativeMethodsOnChainable');

function buildChainableNativeMethodsFix() {
  if (!Object.getOwnPropertyNames) {
    defineNativeMethodsOnChainable();
  }
}

buildChainableNativeMethodsFix();