/* scramble.js — WCA-style random-move 3x3 scramble generator.
 * Not random-state, but applies the usual constraints: no consecutive moves on
 * the same face, and no A B A where A and B are on the same axis.
 */
(function (root) {
  'use strict';

  var FACES = ['U', 'D', 'R', 'L', 'F', 'B'];
  var AXIS = { U: 1, D: 1, R: 0, L: 0, F: 2, B: 2 };
  var SUFFIX = ['', "'", '2'];

  function scramble(len) {
    len = len || 20;
    var out = [];
    var last = null, last2 = null;
    while (out.length < len) {
      var f = FACES[(Math.random() * FACES.length) | 0];
      if (f === last) continue;                       // no same face twice
      if (last && last2 && AXIS[f] === AXIS[last] && AXIS[f] === AXIS[last2])
        continue;                                     // no A B A on one axis
      out.push(f + SUFFIX[(Math.random() * 3) | 0]);
      last2 = last;
      last = f;
    }
    return out.join(' ');
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = scramble;
  else root.scramble = scramble;
})(typeof window !== 'undefined' ? window : this);
