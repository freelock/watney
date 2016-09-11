'use strict';

var coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var forEachProperty = coreUtilityAliases.forEachProperty,
    mapNativeToChainable = coreUtilityAliases.mapNativeToChainable;

function defineNativeMethodsOnChainable() {

  var nativeTokens = {
    'Function': 'apply,call',
    'RegExp':   'compile,exec,test',
    'Number':   'toExponential,toFixed,toLocaleString,toPrecision',
    'Object':   'hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString',
    'Array':    'concat,join,pop,push,reverse,shift,slice,sort,splice,toLocaleString,unshift',
    'Date':     'getTime,getTimezoneOffset,setTime,toDateString,toGMTString,toLocaleDateString,toLocaleString,toLocaleTimeString,toTimeString,toUTCString',
    'String':   'anchor,big,blink,bold,charAt,charCodeAt,concat,fixed,fontcolor,fontsize,indexOf,italics,lastIndexOf,link,localeCompare,match,replace,search,slice,small,split,strike,sub,substr,substring,sup,toLocaleLowerCase,toLocaleUpperCase,toLowerCase,toUpperCase'
  };

  var dateTokens = 'FullYear,Month,Date,Hours,Minutes,Seconds,Milliseconds'.split(',');

  function addDateTokens(prefix, arr) {
    for (var i = 0; i < dateTokens.length; i++) {
      arr.push(prefix + dateTokens[i]);
    }
  }

  forEachProperty(nativeTokens, function(str, name) {
    var tokens = str.split(',');
    if (name === 'Date') {
      addDateTokens('get', tokens);
      addDateTokens('set', tokens);
      addDateTokens('getUTC', tokens);
      addDateTokens('setUTC', tokens);
    }
    tokens.push('toString');
    mapNativeToChainable(name, tokens);
  });

}

module.exports = defineNativeMethodsOnChainable;