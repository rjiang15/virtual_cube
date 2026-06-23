/* keybinds.js — move metadata, default keymap, and durable persistence. */
(function (root) {
  'use strict';

  // Ordered, grouped list of every bindable move token.
  var GROUPS = [
    {
      name: 'Faces',
      moves: ['U', "U'", 'D', "D'", 'R', "R'", 'L', "L'", 'F', "F'", 'B', "B'"],
    },
    { name: 'Slices', moves: ['M', "M'", 'E', "E'", 'S', "S'"] },
    {
      name: 'Wide',
      moves: ['u', "u'", 'd', "d'", 'r', "r'", 'l', "l'", 'f', "f'", 'b', "b'"],
    },
    { name: 'Rotations', moves: ['x', "x'", 'y', "y'", 'z', "z'"] },
  ];

  // Human label for each token (wide moves shown with lowercase = "wide").
  function label(tok) { return tok; }

  // csTimer's canonical QWERTY layout (fully remappable). Matches the keys a
  // csTimer user already knows; every token maps to a real move.
  var DEFAULTS = {
    U: 'j', "U'": 'f',
    D: 's', "D'": 'l',
    R: 'i', "R'": 'k',
    L: 'd', "L'": 'e',
    F: 'h', "F'": 'g',
    B: 'w', "B'": 'o',
    M: '5', "M'": '.',
    E: '2', "E'": '9',
    S: '0', "S'": '1',
    r: 'u', "r'": 'm',
    l: 'v', "l'": 'r',
    u: ',', "u'": 'c',
    d: 'z', "d'": '/',
    x: 't', "x'": 'n',
    y: ';', "y'": 'a',
    z: 'p', "z'": 'q',
  };

  var STORE_KEY = 'vc_keybinds';

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return Object.assign({}, DEFAULTS);
  }

  function save(map) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(map)); } catch (e) {}
  }

  // Build reverse lookup: key -> move token (for fast play + keyboard view).
  function reverse(map) {
    var r = {};
    Object.keys(map).forEach(function (mv) {
      if (map[mv]) r[map[mv]] = mv;
    });
    return r;
  }

  function allTokens() {
    var t = [];
    GROUPS.forEach(function (g) { t = t.concat(g.moves); });
    return t;
  }

  root.Keybinds = {
    GROUPS: GROUPS,
    DEFAULTS: DEFAULTS,
    label: label,
    load: load,
    save: save,
    reverse: reverse,
    allTokens: allTokens,
  };
})(typeof window !== 'undefined' ? window : this);
