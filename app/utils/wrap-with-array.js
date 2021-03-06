import Ember from 'ember';

// Wraps a given object with an Array if it's not an array
// already, otherwise just returns the argument unchanged.
// In case the argument is not defined or null just return
// an empty array.
export default function (object) {
  if (Ember.isArray(object)) {
    return object;
  } else if (object) {
    return [object];
  } else {
    return [];
  }
}
