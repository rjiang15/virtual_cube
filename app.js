/* app.js — timer, stats, scrambles, and the keybinding UI, driving csTimer's
 * twisty cube via puzzleFactory. */
(function () {
  'use strict';

  var $id = function (id) { return document.getElementById(id); };

  // token -> csTimer keyCode (so a bound key replays csTimer's own move logic)
  var TOKEN2CODE = {
    R: 73, "R'": 75, L: 68, "L'": 69, U: 74, "U'": 70,
    D: 83, "D'": 76, F: 72, "F'": 71, B: 87, "B'": 79,
    M: 53, "M'": 190, E: 50, "E'": 57, S: 48, "S'": 49,
    x: 84, "x'": 78, y: 186, "y'": 65, z: 80, "z'": 81,
    r: 85, "r'": 77, l: 86, "l'": 82, u: 188, "u'": 67, d: 90, "d'": 191
  };

  // ---------- state ----------
  var puzzleObj = null;
  var binds = Keybinds.load();
  var rev = Keybinds.reverse(binds);
  var scr = '';
  var started = false;
  var startTime = 0;
  var tick = null;
  var solves = loadSession();

  var armed = false;          // true once a scramble is applied and ready
  var applyingScramble = false;
  var configOpen = false;
  var listeningMove = null;

  // hold-to-start ("ready") state
  var holdSecs = loadHold();
  var HOLD_MS = holdSecs * 1000;
  var holding = false;
  var ready = false;
  var holdStart = 0;
  var holdTimer = null;

  function isRotToken(t) { return t[0] === 'x' || t[0] === 'y' || t[0] === 'z'; }

  var CUBE_OPTS = { puzzle: 'cube3', style: 'virtual', allowDragging: true };

  // ---------- cube / scramble ----------
  function moveListener(move, mstep, ts) {
    if (applyingScramble || !armed) return;
    // timer is started by the hold-to-start ritual, not by moves
    if (mstep === 2 && started) {            // move animation finished
      if (puzzleObj.isSolved() === 0) finishSolve(ts);
    }
  }

  function newScramble() {
    scr = scramble(20);
    $id('scramble').textContent = scr;
    armed = false;
    applyingScramble = true;
    started = false;
    cancelHold();
    clearInterval(tick);
    puzzleFactory.init(CUBE_OPTS, moveListener, jQ('#net'), function (obj) {
      puzzleObj = obj;
      var moves = puzzleObj.parseScramble(scr, true);
      puzzleObj.applyMoves(moves);
      puzzleObj.resize();
      applyingScramble = false;
      armed = true;
      $id('hint').classList.remove('hidden');
    });
  }

  // ---------- timer ----------
  function fmt(ms) {
    if (ms == null) return '–';
    var s = ms / 1000;
    if (s < 60) return s.toFixed(2);
    var m = Math.floor(s / 60);
    return m + ':' + (s - m * 60).toFixed(2).padStart(5, '0');
  }
  function showTime(ms, cls) {
    var t = $id('timer');
    t.textContent = fmt(ms);
    t.className = 'timer' + (cls ? ' ' + cls : '');
  }
  // csTimer's move timestamps come from $.now() == performance.now(); use the
  // same clock for the live display so they don't mix epoch and page-load time.
  function nowMs() {
    return (window.performance && performance.now) ? Math.floor(performance.now()) : Date.now();
  }
  function startTimer(ts) {
    started = true;
    startTime = ts || nowMs();
    $id('hint').classList.add('hidden');
    showTime(0, 'running');
    tick = setInterval(function () {
      showTime(nowMs() - startTime, 'running');
    }, 30);
  }

  // ---------- hold-to-start ("ready") ----------
  function beginHold() {
    if (!armed || started || holding) return;
    holding = true;
    ready = false;
    holdStart = nowMs();
    showTime(0, 'hold-red');
    holdTimer = setInterval(function () {
      if (nowMs() - holdStart >= HOLD_MS) {
        ready = true;
        showTime(0, 'hold-green');
        clearInterval(holdTimer);
        holdTimer = null;
      }
    }, 30);
  }
  function endHold() {
    if (!holding) return;
    holding = false;
    if (holdTimer) { clearInterval(holdTimer); holdTimer = null; }
    if (ready) { ready = false; startTimer(nowMs()); }
    else { showTime(0); }   // released too early -> cancel
  }
  function cancelHold() {
    holding = false;
    ready = false;
    if (holdTimer) { clearInterval(holdTimer); holdTimer = null; }
  }

  // give up: end the current solve without recording, load a new scramble
  function abortSolve() {
    clearInterval(tick);
    started = false;
    cancelHold();
    showTime(0);
    newScramble();
  }
  function finishSolve(ts) {
    clearInterval(tick);
    started = false;
    armed = false;
    var ms = (ts || nowMs()) - startTime;
    showTime(ms, 'done');
    solves.push({ ms: ms, scramble: scr, ts: Date.now() });
    saveSession();
    renderStats();
    setTimeout(newScramble, 60);   // keep finished time on screen until next move
  }

  // ---------- stats ----------
  function avgOfN(n) {
    if (solves.length < n) return null;
    var last = solves.slice(-n).map(function (s) { return s.ms; });
    last.sort(function (a, b) { return a - b; });
    var trimmed = last.slice(1, last.length - 1);
    var sum = trimmed.reduce(function (a, b) { return a + b; }, 0);
    return sum / trimmed.length;
  }
  function renderStats() {
    var n = solves.length;
    var last = n ? solves[n - 1].ms : null;
    var best = n ? Math.min.apply(null, solves.map(function (s) { return s.ms; })) : null;
    var mean = n ? solves.reduce(function (a, s) { return a + s.ms; }, 0) / n : null;
    $id('st-last').textContent = fmt(last);
    $id('st-best').textContent = fmt(best);
    $id('st-ao5').textContent = fmt(avgOfN(5));
    $id('st-ao12').textContent = fmt(avgOfN(12));
    $id('st-mean').textContent = fmt(mean);
    $id('st-count').textContent = n;

    var ol = $id('times');
    ol.innerHTML = '';
    for (var i = solves.length - 1; i >= 0; i--) {
      (function (idx) {
        var li = document.createElement('li');
        li.innerHTML = '<span class="idx">' + (idx + 1) + '.</span><span>' + fmt(solves[idx].ms) + '</span>';
        li.title = solves[idx].scramble + '\n(click to delete)';
        li.onclick = function () { solves.splice(idx, 1); saveSession(); renderStats(); };
        ol.appendChild(li);
      })(i);
    }
  }

  // ---------- persistence ----------
  function loadSession() {
    try { var raw = localStorage.getItem('vc_session'); if (raw) return JSON.parse(raw); } catch (e) {}
    return [];
  }
  function saveSession() {
    try { localStorage.setItem('vc_session', JSON.stringify(solves)); } catch (e) {}
  }
  function loadHold() {
    try { var v = parseFloat(localStorage.getItem('vc_hold')); if (!isNaN(v)) return v; } catch (e) {}
    return 1;
  }
  function saveHold() {
    try { localStorage.setItem('vc_hold', String(holdSecs)); } catch (e) {}
  }

  // ---------- backup / restore ----------
  // localStorage is scoped to the page's origin (scheme+host+port), so saved
  // data "disappears" if the dev server comes back on a different port. These
  // let you snapshot everything to a file and restore it into any origin.
  function exportState() {
    var data = {
      version: 1,
      keybinds: binds,
      session: solves,
      hold: holdSecs,
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = 'virtual-cube-backup-' + stamp + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importState(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var data;
      try { data = JSON.parse(reader.result); }
      catch (e) { alert('Could not read that file — it is not valid backup JSON.'); return; }

      if (data.keybinds && typeof data.keybinds === 'object') {
        binds = data.keybinds;
        persistBinds();
      }
      if (Array.isArray(data.session)) {
        solves = data.session;
        saveSession();
        renderStats();
      }
      if (typeof data.hold === 'number' && !isNaN(data.hold)) {
        holdSecs = data.hold;
        HOLD_MS = holdSecs * 1000;
        saveHold();
        var hi = $id('hold-secs');
        if (hi) hi.value = holdSecs;
      }
      updateBindStatus();
      alert('Backup restored.');
    };
    reader.readAsText(file);
  }

  // ---------- input ----------
  function normKey(e) {
    if (e.key === ' ') return ' ';
    return e.key.length === 1 ? e.key.toLowerCase() : e.key;
  }
  function handlePlayKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // Esc gives up: abort solve and re-scramble
    if (e.key === 'Escape') { e.preventDefault(); abortSolve(); return; }
    var k = normKey(e);
    // spacebar is reserved for the hold-to-start ritual
    if (k === ' ') {
      e.preventDefault();
      if (!e.repeat) beginHold();
      return;
    }
    // arrow keys rotate the camera (csTimer built-in)
    if (e.keyCode >= 37 && e.keyCode <= 40) {
      if (puzzleObj) { puzzleObj.twistyScene.keydown({ keyCode: e.keyCode }); e.preventDefault(); }
      return;
    }
    var token = rev[k];
    if (token && puzzleObj) {
      e.preventDefault();
      // face/slice/wide turns are blocked until the solve has started; rotations always allowed
      if (!started && !isRotToken(token)) return;
      puzzleObj.twistyScene.keydown({ keyCode: TOKEN2CODE[token] });
    }
  }
  function handlePlayKeyUp(e) {
    if (normKey(e) === ' ') { e.preventDefault(); endHold(); }
  }

  // ---------- keybinding UI ----------
  function keyLabel(k) { return k === ' ' ? 'space' : k; }
  function setBind(move, key) {
    Object.keys(binds).forEach(function (m) { if (binds[m] === key) delete binds[m]; });
    binds[move] = key;
    persistBinds();
  }
  function clearBind(move) { delete binds[move]; persistBinds(); }
  function persistBinds() { Keybinds.save(binds); rev = Keybinds.reverse(binds); renderConfig(); }

  function renderMovesView() {
    var host = $id('view-moves');
    host.innerHTML = '';
    Keybinds.GROUPS.forEach(function (g) {
      var grp = document.createElement('div');
      grp.className = 'group';
      grp.innerHTML = '<h4>' + g.name + '</h4>';
      var chips = document.createElement('div');
      chips.className = 'chips';
      g.moves.forEach(function (mv) {
        var key = binds[mv];
        var chip = document.createElement('div');
        chip.className = 'chip' + (listeningMove === mv ? ' listening' : '');
        chip.innerHTML = '<span class="mv">' + mv + '</span><span class="key ' +
          (key ? '' : 'empty') + '">' + (key ? keyLabel(key) : '·') + '</span>';
        chip.onclick = function () {
          listeningMove = (listeningMove === mv) ? null : mv;
          updateBindStatus(); renderMovesView();
        };
        chips.appendChild(chip);
      });
      grp.appendChild(chips);
      host.appendChild(grp);
    });
  }

  var KBD_ROWS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
  ];
  function renderKbdView() {
    var host = $id('view-kbd');
    host.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'kbd';
    KBD_ROWS.forEach(function (row) {
      var r = document.createElement('div');
      r.className = 'kbd-row';
      row.forEach(function (k) { r.appendChild(keycap(k)); });
      wrap.appendChild(r);
    });
    var sp = document.createElement('div');
    sp.className = 'kbd-row';
    sp.appendChild(keycap(' '));
    wrap.appendChild(sp);
    var hint = document.createElement('div');
    hint.className = 'kbd-hint';
    hint.textContent = 'Click a bound key to clear it · assign keys from the Moves tab.';
    wrap.appendChild(hint);
    host.appendChild(wrap);
  }
  function keycap(k) {
    var mv = rev[k];
    var cap = document.createElement('div');
    cap.className = 'keycap' + (mv ? ' bound' : '') + (k === ' ' ? ' space' : '');
    cap.innerHTML = '<span class="bind">' + (mv || '') + '</span><span class="cap">' +
      (k === ' ' ? 'space' : k) + '</span>';
    cap.onclick = function () { if (mv) clearBind(mv); };
    return cap;
  }
  function renderConfig() { renderMovesView(); renderKbdView(); }
  function updateBindStatus() {
    var el = $id('bind-status');
    if (listeningMove) {
      el.textContent = 'Press a key to bind ' + listeningMove + '  ·  Backspace clears  ·  Esc cancels';
      el.classList.add('listening');
    } else {
      el.textContent = 'Click a move, then press a key. Backspace clears · Esc cancels.';
      el.classList.remove('listening');
    }
  }
  function handleBindKey(e) {
    if (!listeningMove) {
      if (e.key === 'Escape') closeConfig();
      return;
    }
    e.preventDefault();
    if (e.key === 'Escape') { listeningMove = null; updateBindStatus(); renderMovesView(); return; }
    if (e.key === 'Backspace' || e.key === 'Delete') { clearBind(listeningMove); listeningMove = null; updateBindStatus(); return; }
    var k = normKey(e);
    if (k.length !== 1 && k !== ' ') return;
    setBind(listeningMove, k);
    listeningMove = null;
    updateBindStatus();
  }
  function openConfig() { configOpen = true; listeningMove = null; $id('config').classList.remove('hidden'); updateBindStatus(); renderConfig(); }
  function closeConfig() { configOpen = false; listeningMove = null; $id('config').classList.add('hidden'); }

  // jQuery accessor (csTimer libs ship their own $)
  function jQ(sel) { return window.$(sel); }

  // ---------- wiring ----------
  function init() {
    renderStats();
    newScramble();

    window.addEventListener('keydown', function (e) {
      if (configOpen) handleBindKey(e);
      else handlePlayKey(e);
    });
    window.addEventListener('keyup', function (e) {
      if (!configOpen) handlePlayKeyUp(e);
    });

    var hi = $id('hold-secs');
    hi.value = holdSecs;
    hi.addEventListener('change', function () {
      var v = parseFloat(hi.value);
      if (isNaN(v) || v < 0) v = 0;
      if (v > 10) v = 10;
      holdSecs = v; HOLD_MS = v * 1000; hi.value = v; saveHold();
    });

    $id('btn-scramble').onclick = function () { showTime(0); newScramble(); };
    $id('btn-keys').onclick = openConfig;
    $id('btn-done').onclick = closeConfig;
    $id('btn-clear').onclick = function () {
      if (confirm('Clear all solves in this session?')) { solves = []; saveSession(); renderStats(); }
    };
    $id('btn-export').onclick = exportState;
    $id('btn-import').onclick = function () { $id('import-file').click(); };
    $id('import-file').onchange = function (e) {
      var f = e.target.files && e.target.files[0];
      if (f) importState(f);
      e.target.value = '';
    };
    $id('btn-reset').onclick = function () { binds = Object.assign({}, Keybinds.DEFAULTS); persistBinds(); };
    $id('btn-clear-binds').onclick = function () { binds = {}; listeningMove = null; updateBindStatus(); persistBinds(); };
    $id('config').onclick = function (e) { if (e.target === $id('config')) closeConfig(); };
    $id('tab-moves').onclick = function () { switchTab('moves'); };
    $id('tab-kbd').onclick = function () { switchTab('kbd'); };
    window.addEventListener('resize', function () { puzzleObj && puzzleObj.resize(); });
  }
  function switchTab(which) {
    var m = which === 'moves';
    $id('tab-moves').classList.toggle('active', m);
    $id('tab-kbd').classList.toggle('active', !m);
    $id('view-moves').classList.toggle('hidden', !m);
    $id('view-kbd').classList.toggle('hidden', m);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
