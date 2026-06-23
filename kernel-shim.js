/* kernel-shim.js — minimal stand-in for csTimer's kernel, providing just the
 * props the twisty cube renderer + puzzleFactory read. Everything else is a
 * no-op. Must load before the twisty/puzzlefactory scripts are used. */
(function () {
  'use strict';
  var props = {
    // default cube color scheme: U R F D L B -> white red green yellow orange blue
    colcube: '#ff0#fa0#00f#fff#f00#0d0',
    vrcOri: '6,12',   // camera orientation (theta,phi) used by twisty.resize
    vrcSpeed: 100,    // animation speed (ms-ish); 0 = instant
    vrcMP: 'n',       // multi-phase method: 'n' = plain solved detection
    vrcAH: '01',      // auto-hide stickers (unused here)
    vrcKBL: 'qwerty',
    preScr: '', preScrT: ''   // no pre-scramble
  };
  // minimal stand-in for csTimer's `tools` (cubeutil.parseScramble touches it)
  window.tools = {
    isCurTrainScramble: function () { return false; },
    isPuzzle: function () { return true; },
    puzzleType: function (t) { return t; }
  };
  window.kernel = {
    getProp: function (key, def) {
      return props[key] !== undefined ? props[key] : def;
    },
    setProp: function (key, val) { props[key] = val; },
    regProp: function () {},
    regListener: function () {},
    pushSignal: function () {},
    addButton: function () {},
    clrKey: function () {},
    showDialog: function () {},
    getInstProp: function (key, def) { return def; }
  };
})();
