var esprima = require('esprima'),
    curry = require('curry'),
    xtend = require('xtend'),
    staticEval = require('static-eval'),
    GLOBAL_IMPORTS = require('./lib/globals.js');

function parse(src) {
  return esprima.parse(src).body[0].expression;
}

module.exports = {
  evaluate: evaluate,
  evaluator: evaluator,
  evaluateWith: curry(evaluateWith),
  context: context,
  GLOBAL_IMPORTS: GLOBAL_IMPORTS
};

/*
 * evaluate an expression with optional data
 */
function evaluate(src, data) {
  var ast = parse(src);
  return staticEval(ast, data || {});
}

/*
 * return a function that evaluates the given expression
 * with data
 */
function evaluator(src) {
  var ast = parse(src);
  return function(data) {
    return staticEval(ast, data);
  };
}

/*
 * the curried version of evaluate(), which takes 0-2 arguments:
 *
 * evaluateWith() -> function(src, data) { ... }
 * evaluateWith(src) -> function(data) { ... }
 * evaluateWith(src, data) -> value
 */
function evaluateWith(src, data) {
  var ast = parse(src);
  return staticEval(ast, data);
}

/*
 * a configurable evaluation context:
 *
 * var c = context('foo + 1')
 *   .set('foo', 100)
 *   .call() -> 101
 *
 * // given a module 'sum':
 * module.exports = function() {
 *   return [].reduce.call(arguments, function(a, b) {
   *   return a + b;
 *   }, 0);
 * };
 *
 * // contexts can require modules
 * var c = context('sum(foo, bar)')
 *   .require('sum')
 *   .set('foo', 1)
 *   .set({bar: 2})
 *   .call() -> 3
 *
 * // you can alias modules with invalid identifier names:
 * c.require('module-with-dashes', 'localAlias');
 */
function context(src) {
  var data = {},
      evaluate = evaluator(src),
      self,
      context = function(d) {
        if (self) d[self] = this;
        if (d) d = xtend({}, data, d);
        return evaluate(d || data);
      };

  // context.require('fs'); or
  // context.require('fs', '_fs');
  context.require = function(name, key) {
    if (name in GLOBAL_IMPORTS) {
      var vars = GLOBAL_IMPORTS[name]();
      return context.set(vars);
    }
    return context.set(key || name, require(name));
  };

  // context.set('foo', 123);
  // context.set({foo: 123, bar: 'xxx'});
  context.set = function(key, val) {
    if (typeof key === 'object') {
      data = xtend(data, key);
      return context;
    }
    data[key] = val;
    return context;
  };

  context.keys = function() {
    return Object.keys(data);
  };

  // context.get('foo');
  context.get = function(key) {
    return data[key];
  };

  // alias `this` calling context to a local variable
  context.self = function(alias) {
    self = alias;
    return context;
  };

  return context;
}
