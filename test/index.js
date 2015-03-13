var dex = require('../'),
    esprima = require('esprima'),
    assert = require('assert');

describe('evaluate()', function() {
  it('evaluates expressions without data', function() {
    assert.equal(dex.evaluate('100 + 1'), 101);
  });
  it('evaluates expressions with data', function() {
    assert.equal(dex.evaluate('foo + 1', {foo: 100}), 101);
  });
  it('returns undefined for bad expressions', function() {
    assert.strictEqual(dex.evaluate('foo', null), undefined);
  });
});

describe('evalutor()', function() {
  it('returns a function', function() {
    var e = dex.evaluator('foo + 1');
    assert.equal(typeof e, 'function');
  });

  it('evaluates expressions with data', function() {
    var e = dex.evaluator('foo + 1');
    assert.equal(e({foo: 100}), 101);
  });

  it('returns undefined with bad data', function() {
    var e = dex.evaluator('foo + 1');
    assert.strictEqual(e(null), undefined);
  });
});

describe('set()', function() {
  it('sets a simple identifier to the right-hand expression', function() {
    var set = dex.set('a = b + 1'),
        d = set({b: 2});
    assert.equal(d.a, 3);
  });

  it('merges contexts', function() {
    var set = dex.set('a = b + 1'),
        d = {b: 1},
        extra = {b: 2};
    assert.deepEqual(set(d, extra), {b: 1, a: 3});
  });
});

describe('context()', function() {
  it('creates setters', function() {
    var set = dex.context('a = b + 1').setter();
    assert(set({b: 2}).a, 3);
  });

  it('evaluates expressions', function() {
    var c = dex.context('foo > bar');
    assert.strictEqual(c({foo: 2, bar: 1}), true);
  });

  it('can set context variables', function() {
    var c = dex.context('foo + bar')
      .set('foo', -100)
      .set('bar', -1);

    assert.equal(c(), -101);
    c.set('foo', 100);
    assert.equal(c(), 99);
    assert.equal(c({foo: 0}), -1);
  });

  it('can require modules', function() {
    var c = dex.context('curry(function(x, y) { return x + y; })(99)(2)')
      .require('curry');
    assert.equal(c(), 101);
  });

  it('can require Math methods', function() {
    var c = dex.context('pow(2, 2)')
      .require('Math');
    assert.strictEqual(c(), 4);
  });

  it('can require Array methods', function() {
    var c = dex.context('reverse([1, 2, 3])')
      .require('Array');
    assert.equal(typeof c.get('reverse'), 'function');
    assert.deepEqual(c(), [3, 2, 1]);
  });
});

describe('ES6', function() {
  it('parses arrow functions', function() {
    var a = esprima.parse('var a = function(x) { return x + 1; }').body[0].expression,
        b = dex.parse('var a = x => x + 1;');
    assert.deepEqual(a, b);
  });

  it('evaluates arrow functions', function() {
    var c = dex.evaluate('[1, 2, 3].map(x => x + 1)');
    assert.deepEqual(c, [2, 3, 4]);
  });
});
