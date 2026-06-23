const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1000, height: 760 } });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8731/index.html',{waitUntil:'networkidle'});
  await p.waitForTimeout(500);
  await p.click('#btn-keys');
  await p.waitForTimeout(200);
  await p.screenshot({ path:'test/shot-moves.png' });
  await p.click('#tab-kbd');
  await p.waitForTimeout(200);
  await p.screenshot({ path:'test/shot-kbd.png' });
  console.log('errors:', errs.length?errs.join('; '):'none');
  await b.close();
})();
