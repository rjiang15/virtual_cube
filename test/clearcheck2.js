const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('http://localhost:8731/index.html',{waitUntil:'networkidle'});
  await p.waitForTimeout(400);
  await p.click('#btn-keys'); await p.waitForTimeout(150);
  const before = await p.$$eval('#view-moves .chip .key', els=>els.filter(e=>!e.classList.contains('empty')).length);
  await p.click('#btn-clear-binds'); await p.waitForTimeout(150);
  const after = await p.$$eval('#view-moves .chip .key', els=>els.filter(e=>!e.classList.contains('empty')).length);
  const persisted = await p.evaluate(()=>JSON.parse(localStorage.getItem('vc_keybinds')||'null'));
  console.log('bound chips before clear:', before);
  console.log('bound chips after clear :', after);
  console.log('persisted after clear   :', JSON.stringify(persisted));
  await b.close();
})();
