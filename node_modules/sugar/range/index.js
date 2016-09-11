'use strict';

// Static Methods
require('../date/range');
require('../number/range');
require('../string/range');

// Instance Methods
require('../number/cap');
require('../number/clamp');
require('../number/upto');

// Prototype Methods
require('./clamp');
require('./clone');
require('./contains');
require('./days');
require('./every');
require('./hours');
require('./intersect');
require('./isValid');
require('./milliseconds');
require('./minutes');
require('./months');
require('./seconds');
require('./span');
require('./toArray');
require('./toString');
require('./union');
require('./weeks');
require('./years');

// Aliases
require('../number/downto');

module.exports = require('sugar-core');