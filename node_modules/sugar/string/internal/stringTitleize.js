'use strict';

var DOWNCASED_WORDS = require('../var/DOWNCASED_WORDS'),
    indexOf = require('../../common/internal/indexOf'),
    eachWord = require('./eachWord'),
    getAcronym = require('../../common/internal/getAcronym'),
    getHumanWord = require('../../common/internal/getHumanWord'),
    runHumanRules = require('../../common/internal/runHumanRules'),
    stringSpacify = require('./stringSpacify'),
    stringCapitalize = require('./stringCapitalize');

function stringTitleize(str) {
  var fullStopPunctuation = /[.:;!]$/, lastHadPunctuation;
  str = runHumanRules(str);
  str = stringSpacify(str);
  return eachWord(str, function(word, index, words) {
    word = getHumanWord(word) || word;
    word = getAcronym(word) || word;
    var hasPunctuation, isFirstOrLast;
    var first = index == 0, last = index == words.length - 1;
    hasPunctuation = fullStopPunctuation.test(word);
    isFirstOrLast = first || last || hasPunctuation || lastHadPunctuation;
    lastHadPunctuation = hasPunctuation;
    if (isFirstOrLast || indexOf(DOWNCASED_WORDS, word) === -1) {
      return stringCapitalize(word, false, true);
    } else {
      return word;
    }
  }).join(' ');
}

module.exports = stringTitleize;