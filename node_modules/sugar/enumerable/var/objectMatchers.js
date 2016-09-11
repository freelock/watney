'use strict';

var wrapObjectMatcher = require('../internal/wrapObjectMatcher');

module.exports = {
  objectSome: wrapObjectMatcher('some'),
  objectFind: wrapObjectMatcher('find'),
  objectEvery: wrapObjectMatcher('every')
};