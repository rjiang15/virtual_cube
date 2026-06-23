const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1100,height:760} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8731/index.html',{waitUntil:'networkidle'});
  await p.waitForTimeout(600);
  const cls = async()=> await p.getAttribute('#timer','class');

  // set hold to 1 second
  await p.fill('#hold-secs','1');
  await p.dispatchEvent('#hold-secs','change');
  const persisted = await p.evaluate(()=>localStorage.getItem('vc_hold'));

  await p.click('#timer');
  // hold ~0.5s -> should still be red (since 1s now), then ~1.2s -> green
  await p.keyboard.down('Space'); await p.waitForTimeout(500);
  const at05 = await cls();
  await p.waitForTimeout(700);
  const at12 = await cls();
  await p.keyboard.up('Space'); await p.waitForTimeout(120);
  const afterRelease = await cls();

  // make a couple moves then give up with Esc
  await p.keyboard.press('h'); await p.waitForTimeout(120);
  const scrBefore = (await p.textContent('#scramble')).trim();
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  const afterEsc = await cls();
  const timerText = (await p.textContent('#timer')).trim();
  const solveCount = (await p.textContent('#st-count')).trim();
  const scrAfter = (await p.textContent('#scramble')).trim();

  console.log('persisted vc_hold     :', persisted, '(want 1)');
  console.log('class at 0.5s hold    :', at05, '(want hold-red)');
  console.log('class at 1.2s hold    :', at12, '(want hold-green)');
  console.log('class after release   :', afterRelease, '(want running)');
  console.log('class after Esc       :', afterEsc, '(want timer = idle)');
  console.log('timer text after Esc  :', timerText, '(want 0.00)');
  console.log('solve count after Esc :', solveCount, '(want 0 = not recorded)');
  console.log('new scramble after Esc:', scrAfter !== scrBefore ? 'yes' : 'no');
  console.log('errors                :', errs.length?errs.join('; '):'none');
  await b.close();
})();
