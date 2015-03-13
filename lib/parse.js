var esprima = require('esprima'),
    walk = require('esprima-walk'),
    parseOptions = {},
    TRANSFORMS = {
      'ArrowFunctionExpression': arrowToFunction
    };

module.exports = function parse(src) {
  var ast = (typeof src === 'string')
    ? esprima.parse(src, parseOptions).body[0].expression
    : src;
  walk(ast, transform);
  return ast;
};

function transform(node) {
  if (!node) return; // XXX why does this happen?
  if (node.type in TRANSFORMS) {
    TRANSFORMS[node.type](node);
  }
}

function arrowToFunction(node) {
  node.expression = false;
  node.type = 'FunctionExpression';
  node.body = {
    type: 'BlockStatement',
    body: [
      {
        type: 'ReturnStatement',
        argument: node.body
      }
    ]
  };
}
