'use strict';

var createInstanceFromPrototype = Object.create || function(prototype) {
  var ctor = function() {};
  ctor.prototype = prototype;
  return new ctor;
};

module.exports = createInstanceFromPrototype;