'use strict';

var Sugar = require('sugar-core'),
    padNumber = require('../../common/internal/padNumber'),
    hasISOSupport = require('../../es5/internal/hasISOSupport');

Sugar.Date.defineInstancePolyfill({

  'toISOString': function() {
    return padNumber(this.getUTCFullYear(), 4) + '-' +
           padNumber(this.getUTCMonth() + 1, 2) + '-' +
           padNumber(this.getUTCDate(), 2) + 'T' +
           padNumber(this.getUTCHours(), 2) + ':' +
           padNumber(this.getUTCMinutes(), 2) + ':' +
           padNumber(this.getUTCSeconds(), 2) + '.' +
           padNumber(this.getUTCMilliseconds(), 3) + 'Z';
  }

}, !hasISOSupport());

// This package does not export anything as it is mapping a
// polyfill to Date.prototype which cannot be called statically.