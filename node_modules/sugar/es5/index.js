'use strict';

// Fixes
require('./fixes/ChainableNativeMethods');
require('./fixes/DontEnum');

// Static Methods
require('../polyfills/array/isArray');
require('../polyfills/date/now');
require('../polyfills/object/keys');

// Instance Methods
require('../polyfills/array/every');
require('../polyfills/array/filter');
require('../polyfills/array/forEach');
require('../polyfills/array/indexOf');
require('../polyfills/array/lastIndexOf');
require('../polyfills/array/map');
require('../polyfills/array/reduce');
require('../polyfills/array/reduceRight');
require('../polyfills/array/some');
require('../polyfills/date/toISOString');
require('../polyfills/date/toJSON');
require('../polyfills/function/bind');
require('../polyfills/string/trim');

module.exports = require('sugar-core');