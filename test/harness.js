// Playwright test: hold-to-start ritual + auto-solve via inverse scramble.
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8731/index.html';

function invert(scr) {
  return scr.trim().split(/\s+/).reverse().map(function (t) {
    if (t.indexOf('2') !== -1) return t;
    return t.indexOf("'") !== -1 ? t.replace("'", '') : t + "'";
  });
}
const KEY = {
  U: 'j', "U'": 'f', D: 's', "D'": 'l', R: 'i', "R'": 'k',
  L: 'd', "L'": 'e', F: 'h', "F'": 'g', B: 'w', "B'": 'o'
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.click('#timer');

  const scramble = (await page.textContent('#scramble')).trim();
  const cls = async () => (await page.getAttribute('#timer', 'class'));

  // 1) face turn before starting should be BLOCKED (timer stays idle, not started)
  await page.keyboard.press('h');           // F move
  const afterBlockedMove = await cls();

  // 2) hold space: red, then green after 3s
  await page.keyboard.down('Space');
  await page.waitForTimeout(400);
  const earlyHold = await cls();            // expect hold-red
  await page.waitForTimeout(2900);
  const lateHold = await cls();             // expect hold-green
  await page.keyboard.up('Space');
  await page.waitForTimeout(120);
  const afterRelease = await cls();         // expect running

  // 3) auto-solve by replaying inverse scramble
  for (const tok of invert(scramble)) {
    const base = tok.replace('2', '');
    const presses = tok.indexOf('2') !== -1 ? [KEY[base], KEY[base]] : [KEY[tok]];
    for (const k of presses) { await page.keyboard.press(k); await page.waitForTimeout(70); }
  }
  await page.waitForTimeout(1500);

  console.log('--- RESULTS ---');
  console.log('class after blocked move:', afterBlockedMove, '(want: timer)');
  console.log('class during early hold :', earlyHold, '(want: hold-red)');
  console.log('class during late hold  :', lateHold, '(want: hold-green)');
  console.log('class after release     :', afterRelease, '(want: running)');
  console.log('final timer text        :', (await page.textContent('#timer')).trim());
  console.log('final timer class       :', await cls(), '(want: done)');
  console.log('solve count             :', (await page.textContent('#st-count')).trim());
  console.log('errors                  :', errors.length ? '\n  ' + errors.join('\n  ') : 'none');

  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
