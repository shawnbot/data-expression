#!/usr/bin/env node
var datex = require('../'),
    fs = require('fs'),
    ndjson = require('ndjson'),
    through2 = require('through2'),
    util = require('../lib/util'),
    yargs = require('yargs')
      .usage('datex [options] [input] [--filter expr] [--map expr] [--set expr]')
      .describe('set', 'Manipulate data with an assignment expression, e.g.\n"foo = bar + 1"')
      .describe('filter', 'Filter data with an expression, e.g. "foo > 1"')
      .describe('map', 'Map data with an object expression, e.g.\n"{foo: bar + 1}")')
      .describe('require', 'Expose the named module in every expression. You can also use the form "name=module".')
      .alias('require', 'r')
      .alias('filter', 'f')
      .alias('map', 'm')
      .alias('help', 'h'),
    options = yargs.argv,
    args = options._;

if (options.help) {
  yargs.showHelp();
  return process.exit(1);
}

var input = (args.length && args[0] !== '-')
  ? fs.createReadStream(args[0])
  : process.stdin;

var settings = util.objectify(options.set),
    reqs = util.arrayify(options.require);

var expr = function(expr) {
  // console.warn('expression:', expr, reqs);
  return datex(expr)
    .require(reqs);
};

var setters = util.arrayify(options.set)
  .map(expr)
  .map(function(ex) {
    return ex.setter();
  });

var transforms = util.arrayify(options.map)
  .map(expr)
  .concat(setters);

var filters = util.arrayify(options.filter)
      .map(expr),
    filter = function(d) {
      for (var i = 0, len = filters.length; i < len; i++) {
        if (!filters[i].call(d, d)) {
          return false;
        }
      }
      return true;
    };

var transform = function(d) {
  for (var i = 0, len = transforms.length; i < len; i++) {
    d = transforms[i](d);
  }
  return d;
};

var output = options.out
  ? fs.createWriteStream(options.out)
  : process.stdout;

input
  .pipe(ndjson.parse())
  .pipe(through2.obj(function(d, enc, next) {
    if (filter(d)) {
      return next(null, d);
    }
    next();
  }))
  .pipe(through2.obj(function(d, enc, next) {
    return next(null, transform(d));
  }))
  .pipe(ndjson.serialize())
  .pipe(output);
