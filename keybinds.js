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

  // Default layout (fully remappable). Captured from a saved user config;
  // tokens omitted here start unbound until the user maps them.
  var DEFAULTS = {
    U: '6', "U'": '4',
    D: 'n', "D'": 'v',
    R: 'y', "R'": 'h',
    L: 'f', "L'": 'r',
    F: 't', "F'": 'g',
    B: '5', "B'": 'b',
    M: 'x', "M'": 'w',
    x: 'u', "x'": 'm',
    y: 'j', "y'": 'd',
    z: 's', "z'": 'a',
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
