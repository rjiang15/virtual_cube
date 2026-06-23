const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('http://localhost:8731/index.html',{waitUntil:'networkidle'});
  await p.waitForTimeout(500);
  await p.click('#timer');
  await p.keyboard.press('h');          // F move (non-rotation) -> should start timer
  const samples=[];
  for (let i=0;i<6;i++){ await p.waitForTimeout(80); samples.push((await p.textContent('#timer')).trim()); }
  console.log('timer samples after first move:', samples.join('  '));
  await b.close();
})();
