module.exports = {
  Math: function(context) {
    var imports = {};
    'pow sin cos asin acos tan tan2 max min'.split(' ')
      .forEach(function(key) {
        imports[key] = Math[key];
      });
    return imports;
  },

  Number: function(context) {
    var imports = {};
    'INFINITY NEGATIVE_INFINITY isFinite'.split(' ')
      .forEach(function(key) {
        imports[key] = Number[key];
      });
    return imports;
  },

  Array: function(context) {
    var array = [],
        imports = {};
    'map filter reduce slice reverse sort'.split(' ')
      .forEach(function(key) {
        var method = function(o) {
          return array[key].apply(o, array.slice.call(arguments, 1));
        };
        imports[key] = method;
      });
    return imports;
  }
};

