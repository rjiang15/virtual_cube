const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:760,height:560} });
  await p.goto('http://localhost:8731/index.html',{waitUntil:'networkidle'});
  await p.waitForTimeout(600); await p.click('#timer');
  await p.keyboard.down('Space'); await p.waitForTimeout(600);
  await p.screenshot({ path:'test/shot-hold-red.png' });
  await p.waitForTimeout(2700);
  await p.screenshot({ path:'test/shot-hold-green.png' });
  await p.keyboard.up('Space');
  await b.close();
})();
