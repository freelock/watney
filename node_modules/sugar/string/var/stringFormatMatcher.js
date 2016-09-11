'use strict';

var deepGetProperty = require('../../common/internal/deepGetProperty'),
    createFormatMatcher = require('../../common/internal/createFormatMatcher');

module.exports = createFormatMatcher(deepGetProperty);