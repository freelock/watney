'use strict';

function getReducedMinMaxResult(result, obj, all, asObject) {
  if (asObject && all) {
    // The method has returned an array of keys so use this array
    // to build up the resulting object in the form we want it in.
    return result.reduce(function(o, key) {
      o[key] = obj[key];
      return o;
    }, {});
  } else if (result && !all) {
    result = result[0];
  }
  return result;
}

module.exports = getReducedMinMaxResult;