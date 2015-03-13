module.exports = {
  arrayify: arrayify,
  objectify: objectify
};

function arrayify(d) {
  if (!d) return [];
  return Array.isArray(d) ? d : [d];
}

function objectify(settings) {
  if (typeof settings === 'object') {
    return settings;
  }
  var set = {};
  set[settings] = true;
  return set;
}
