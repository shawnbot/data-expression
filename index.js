var vm = require('vm');
var extend = require('extend');

function evaluator(expr, context) {
  context = context || {};
  if (typeof expr === 'object') {
    expr = createObjectExpression(expr);
  } else if (expr.match(/^\s*\{/)) {
    // guard against object expressions being interpreted as blocks
    expr = '(' + expr + ')';
  }

  var ev = function(data) {
    data = data ? extend({}, context, data) : context;
    try {
      return vm.runInContext(expr, vm.createContext(data));
    } catch (error) {
      return undefined;
    }
  };

  ev.set = function(symbol, value) {
    if (typeof symbol === 'object') {
      extend(context, symbol);
    } else {
      context[symbol] = value;
    }
    sandbox = null;
    return ev;
  };

  ev.require = function(mod, symbol) {
    if (Array.isArray(mod)) {
      mod.forEach(ev.require);
      return ev;
    }

    var value;
    if (mod.indexOf('=') > -1) {
      var bits = mod.split(/\s*=\s*/);
      symbol = bits[0];
      mod = bits[1];
      // console.log('require "%s" as "%s"', mod, symbol);
    }
    return ev.set(symbol || mod, require(mod));
  };

  ev.setter = function() {
    return setter(expr, context);
  };

  return ev;
}

function setter(expr, context) {
  return evaluator('(' + expr + '), this', context);
}

function evaluate(expr, context) {
  try {
    return vm.runInNewContext(expr, context || {});
  } catch (error) {
    return undefined;
  }
}

function createObjectExpression(obj) {
  return '({' +
    Object.keys(obj).reduce(function(list, key) {
      list.push('"' + key.replace(/"/g, '\\"') + '": ' + obj[key]);
      return list;
    }, []).join(', ') +
  '})';
}

module.exports = evaluator;
module.exports.evaluate = evaluate;
module.exports.setter = setter;
