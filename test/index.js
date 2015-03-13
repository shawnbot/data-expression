var expr = require('../'),
    assert = require('assert');

describe('evaluate()', function() {
  it('works', function() {
    assert.equal(expr.evaluate('100 + 1'), 101);
    assert.equal(expr.evaluate('foo + 1', {foo: 100}), 101);
  });
});

describe('evalutor()', function() {
  it('works', function() {
    var e = expr.evaluator('foo + 1');
    assert.equal(e({foo: 100}), 101);
  });
});

describe('evaluateWith()', function() {
  it('works', function() {
    var e = expr.evaluateWith();
    assert.equal(typeof e(), 'function');
    assert.equal(typeof e('foo'), 'function');
    assert.equal(e('foo')({foo: 101}), 101);
    assert.equal(e('foo', {foo: 101}), 101);
  });
});

describe('context()', function() {
  it('works', function() {
    var c = expr.context('foo + bar')
      .set('foo', -100)
      .set('bar', -1);

    assert.equal(c(), -101);
    c.set('foo', 100);
    assert.equal(c(), 99);
    assert.equal(c({foo: 0}), -1);
  });

  it('can require modules', function() {
    var c = expr.context('curry(function(x, y) { return x + y; })(99)(2)')
      .require('curry');
    assert.equal(c(), 101);
  });

  it('can require Array methods', function() {
    var c = expr.context('reverse([1, 2, 3])')
      .require('Array');
    assert.equal(typeof c.get('reverse'), 'function');
    assert.deepEqual(c(), [3, 2, 1]);
  });
});
