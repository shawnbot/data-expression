var staticEval = require('static-eval'),
    extend = require('extend'),
    parse = require('./lib/parse'),
    THIS = this;

function evaluate(expr, vars) {
  var e = evaluator(expr);
  if (arguments.length === 1) {
    return e;
  }
  return e(vars);
}

function evaluator(expr) {
  if (typeof expr !== 'object') expr = parse(expr);

  var context = {},
      evaluator = expr.type === 'AssignmentExpression'
        ? assignment(expr, evalWith)
        : function(vars) {
          return evalWith(expr, vars);
        };

  function evalWith(expr, vars) {
    var ctx = extend(context, vars);
    return staticEval(expr, ctx);
  }

  evaluator.set = function(name, value) {
    if (typeof name == 'object') {
      return evaluator.update(name);
    }
    context[name] = value;
    return evaluator;
  };

  evaluator.update = function(ctx) {
    extend(context, ctx);
    return evaluator;
  };

  evaluator.get = function(name) {
    return context[name];
  };
  
  evaluator.require = function(mod, name) {
    if (Array.isArray(mod)) {
      mod.forEach(function(m) {
        evaluator.require(m);
      });
      return evaluator;
    }
    if (mod.indexOf('=') > -1) {
      var bits = mod.split(/\s*=\s*/);
      name = bits[0];
      mod = bits[1];
      console.log('require "%s" as "%s"', mod, name);
    }
    var value;
    switch (mod) {
      case 'Array':
      case 'Math':
      case 'Number':
      case 'Object':
        value = global[mod];
        break;
      default:
        value = require(mod);
    }
    return evaluator.set(name || mod, value);
  };

  return evaluator;
}

function assignment(expr, evaluate) {
  if (!evaluate) evaluate = staticEval;
  var left = expr.left,
      right = expr.right;
  switch (left.type) {
    case 'Identifier':
      return function(vars) {
        vars[left.name] = evaluate(right, vars);
        return vars;
      };
    case 'MemberExpression':
      var obj = left.object,
          key;
      if (obj.type === 'ThisExpression') {
        key = function(vars) { return vars['this'] || this; };
      } else /* if (obj.type === 'Identifier') */ {
        key = function(vars) { return vars[obj.name]; };
      }
      return function(vars) {
        var o = key.call(this, vars);
        if (o === THIS) return undefined;
        o[left.property.name] = evaluate(right, vars);
        return o;
      };
    default:
      throw 'expected Identifier or MemberExpression; got: ' + expr.left.type;
  }
}

function map(expr) {
  var ast;
  switch (typeof expr) {
    case 'string':
      ast = parse('(' + expr + ')');
      if (ast.type === 'Identifier') {
        // just use the identifier
      } else if (ast.type !== 'ObjectExpression') {
        throw 'expected ObjectExpression, got: ' + ast.type;
      }
      break;
    case 'object':
      ast = {
        type: 'ObjectExpression',
        properties: Object.keys(expr).map(function(key) {
          return property(key, expr[key]);
        })
      };
      break;
  }

  var e = evaluator(ast);
  e.key = function(key, expr) {
    ast.properties.push(property(key, expr));
    return e;
  };

  return e;
}

function property(key, expr) {
  return {
    type: 'Property',
    key: {
      type: 'Identifier',
      name: key
    },
    value: parse(expr),
    // XXX not sure if these are necessary
    computed: false,
    kind: 'init',
    method: false,
    shorthand: false
  };
}

evaluate.evaluator = evaluator;
evaluate.map = map;
evaluate.parse = parse;

module.exports = evaluate;
module.exports.evaluate = function(expr, vars) {
  return evaluate(expr, vars || null);
};
