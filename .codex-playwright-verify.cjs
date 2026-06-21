const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
  await page.goto('http://127.0.0.1:19006/', { waitUntil: 'networkidle', timeout: 120000 });
  const text = await page.locator('body').innerText();
  console.log(JSON.stringify({
    title: await page.title(),
    hasFolder: text.includes('收藏夹'),
    hasManage: text.includes('管理'),
    hasWiki: text.includes('Wiki'),
    hasArchived: text.includes('已归档'),
    hasDeleted: text.includes('最近删除')
  }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
