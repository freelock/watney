'use strict';

var Sugar = require('sugar-core'),
    append = require('./append');

Sugar.Array.alias('insert', 'append');

module.exports = Sugar.Array.insert;