# Data Expressions for JavaScript
`data-expression` makes working with *statically evaluable JavaScript
expressions* safely (specifically, not using `eval()`)... fun, maybe? This
could come in handy if you're making something that allows users to filter, map
or manipulate data. Here are some examples:

The `data-expression` module's `evaluate()` function takes an
expression and an optional object of variable values:
```js
> var datex = require('data-expression');
> datex.evaluate('foo + 1', {foo: 2});
3
```

The `setter()` function takes an assignment statement and evaluates
it in the context of the provided object, then returns the modified
object:
```js
> var setter = datex.set('foo = foo * 2');
> setter({foo: 10});
{foo: 20}
```

And the `evaluator()` function returns a function that can be
re-evaluated with different variable values. In this example, you can
see that we're using [ES6 arrow functions] as a shorthand for
`function(x) { return x * 10 }`:
```js
> var expr = datex.evaluator('foo.split(",").map(x => x * 10)');
> expr({foo: '3,2,1'});
[30, 20, 10]
```

And the `context()` function takes an expression then allows you to
set one or more variables programmatically, and even `require()`
modules for use in the expression:
```js
> var context = datex.context('foo = humanize(foo)')
    .require('humanize-string', 'humanize')
    .setter(); // this is required for now, but shouldn't be
> context({foo: 'fooBar'});
```

### The CLI tool
Think of this as an enabler of [one-line] data transforms.

Reformat dates in a [dat] repository:

```sh
$ dat cat | datex --require 'm = moment' - \
  "date = m(date).format('YYYY-MM-DD')" | dat
```

[dat]: http://dat-data.com/
[ES6 arrow functions]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions
