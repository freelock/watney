'use strict';

var buildEnhancedMatching = require('../internal/buildEnhancedMatching');

module.exports = {
  enhancedFind: buildEnhancedMatching('find'),
  enhancedSome: buildEnhancedMatching('some'),
  enhancedEvery: buildEnhancedMatching('every'),
  enhancedFilter: buildEnhancedMatching('filter'),
  enhancedFindIndex: buildEnhancedMatching('findIndex')
};