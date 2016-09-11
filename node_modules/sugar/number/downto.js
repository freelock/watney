'use strict';

var Sugar = require('sugar-core'),
    upto = require('./upto');

Sugar.Number.alias('downto', 'upto');

module.exports = Sugar.Number.downto;