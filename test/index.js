var datex = require('../'),
    esprima = require('esprima'),
    unparse = require('escodegen').generate,
    assert = require('assert');

describe('evaluate()', function() {
  it('evaluates expressions without data', function() {
    assert.equal(datex.evaluate('100 + 1'), 101);
  });
  it('evaluates expressions with data', function() {
    assert.equal(datex.evaluate('foo + 1', {foo: 100}), 101);
  });
  it('returns undefined for bad expressions', function() {
    assert.strictEqual(datex.evaluate('foo', null), undefined);
  });
});

describe('evalutor()', function() {
  it('returns a function', function() {
    var e = datex.evaluator('foo + 1');
    assert.equal(typeof e, 'function');
  });

  it('evaluates expressions with data', function() {
    var e = datex.evaluator('foo + 1');
    assert.equal(e({foo: 100}), 101);
  });

  it('returns undefined with bad data', function() {
    var e = datex.evaluator('foo + 1');
    assert.strictEqual(e(null), undefined);
  });
});

describe('contexts', function() {
  it('create setters', function() {
    var set = datex('a = b + 1');
    var data = {b: 2};
    assert.equal(set(data), 3);
    assert.equal(data.a, 3);
  });

  it('evaluate expressions', function() {
    var c = datex('foo > bar');
    assert.strictEqual(c({foo: 2, bar: 1}), true);
  });

  it('can set variables', function() {
    var c = datex('foo + bar')
      .set('foo', -100)
      .set('bar', -1);

    assert.equal(c(), -101);
    c.set('foo', 100);
    assert.equal(c(), 99);
    assert.equal(c({foo: 0}), -1);
  });

  it('can require modules', function() {
    var c = datex('curry(function(x, y) { return x + y; })(99)(2)')
      .require('curry');
    assert.equal(c(), 101);
  });

  it('can require Math methods', function() {
    var c = datex('Math.pow(2, 2)')
      .require('Math');
    assert.strictEqual(c(), 4);
  });

  it('can require Array methods', function() {
    var c = datex('Array.prototype.reverse.call([1, 2, 3])')
      .require('Array');
    assert.deepEqual(c(), [3, 2, 1]);
  });
});

describe('map()', function() {
  it('creates maps with object expressions', function() {
    var map = datex.map('{foo: bar, bar: baz}');
    assert.deepEqual(map({bar: 1, baz: 2}), {foo: 1, bar: 2});
  });

  it('creates maps with key/value pairs', function() {
    var map = datex.map({
      foo: 'bar + 1',
      bar: 'baz + 2'
    });
    assert.deepEqual(map({bar: 1, baz: 2}), {foo: 2, bar: 4});
  });

  it('can set keys', function() {
    var map = datex.map({
      foo: 'bar + 1',
      bar: 'baz + 2'
    })
    .key('qux', 'bar + 2');
    // FIXME: should keys be set in the context as they're mapped?
    assert.deepEqual(map({bar: 1, baz: 2}), {foo: 2, bar: 4, qux: 3});
  });
});

describe('ES6', function() {
  it('parses arrow functions', function() {
    var a = esprima.parse('var a = function(x) { return x + 1; }').body[0].expression,
        b = datex.parse('var a = x => x + 1;');
    assert.deepEqual(a, b);
  });

  it('evaluates arrow functions', function() {
    var c = datex.evaluate('[1, 2, 3].map(x => x + 1)');
    assert.deepEqual(c, [2, 3, 4]);
  });
});
