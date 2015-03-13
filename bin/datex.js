#!/usr/bin/env node
var dex = require('../'),
    fs = require('fs'),
    ndjson = require('ndjson'),
    through2 = require('through2'),
    yargs = require('yargs')
      .usage('$0 [--require module] [<filename> | -] setter(s)')
      .describe('require', 'Expose the named module in each statement')
      .alias('r', 'require')
      .alias('help', 'h'),
    options = yargs.argv,
    args = options._;

var input = (args[0] !== '-')
  ? fs.createReadStream(args[0])
  : process.stdin;

var settings = dex.util.objectify(options.set),
    reqs = dex.util.arrayify(options.require)
      .concat(['Math', 'Array']),
    transforms = args.slice(1)
      .map(function(expr) {
        // console.warn('expression:', expr, reqs);
        return dex.context(expr)
          .set(settings)
          .require(reqs)
          .setter();
      }),
    transform = function(d) {
      for (var i = 0, len = transforms.length; i < len; i++) {
        transforms[i](d);
      }
      return d;
    };

var output = options.out
  ? fs.createWriteStream(options.out)
  : process.stdout;

input
  .pipe(ndjson.parse())
  .pipe(through2.obj(function(d, enc, next) {
    return next(null, transform(d));
  }))
  .pipe(ndjson.serialize())
  .pipe(output);
