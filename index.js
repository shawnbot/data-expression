var staticEval = require('static-eval'),
    curry = require('curry'),
    xtend = require('xtend'),
    util = require('./lib/util'),
    parse = require('./lib/parse'),
    GLOBAL_IMPORTS = require('./lib/globals.js');

module.exports = {
  parse: parse,
  evaluate: evaluate,
  evaluateWith: curry(evaluate),
  evaluator: evaluator,
  context: context,
  map: map,
  set: set,
  util: util,
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
        if (d) {
          d = xtend({}, data, d);
          if (self) d[self] = this;
        }
        return evaluate(d || data);
      };

  // context.require('fs'); or
  // context.require('fs', '_fs');
  context.require = function(name, key) {
    if (Array.isArray(name)) {
      name.forEach(function(mod) {
        var bits = mod.split(/\s*=\s*/);
        if (bits.length > 1) {
          context.require(bits[1], bits[0]);
        } else {
          context.require(mod);
        }
      });
      return context;
    }
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

  context.setter = function() {
    return function(d) {
      return set(src)(d, data);
    };
  };

  return context;
}

function map(src) {
  return evaluator('(' + src + ')');
}

/*
 * generates a setter function that assigns the object's key named in the
 * left-hand identifier of the expression to the right-hand expression
 * evaluated with the object as data:
 *
 * var setAtoB = setter('a = b + 1'),
 *     obj = {b: 1};
 * setAtoB(obj);
 * obj === {b: 1, a: 2};
 */
function set(src) {
  var ast = parse(src),
      left = ast.left,
      right = ast.right;
  return function(d) {
    var d0 = xtend.apply(null, [{}].concat([].slice.call(arguments)));
    d[left.name] = evaluate(right, d0);
    return d;
  };
}
