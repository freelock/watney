'use strict';

var classChecks = require('../../common/var/classChecks');

var isFunction = classChecks.isFunction;

function tap(obj, arg) {
  var fn = arg;
  if (!isFunction(arg)) {
    fn = function() {
      if (arg) obj[arg]();
    };
  }
  fn.call(obj, obj);
  return obj;
}

module.exports = tap;