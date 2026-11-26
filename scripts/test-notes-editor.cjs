/* Run with PLAYWRIGHT_MODULE=/path/to/playwright-core node scripts/test-notes-editor.cjs. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const runtime = fs.readFileSync(path.join(__dirname, '../assets/runtime.js'));
let changedSource = false;
let reordered = false;
const first = () => `<section class="slide" data-title="First" data-notes-id="first">
  <h1>First</h1><aside class="notes"><p>Timing cue</p>
  <div data-speaker-script><p>${changedSource ? 'Updated author script' : 'Original script'}</p></div>
  <p>Stage direction</p></aside></section>`;
const second = '<section class="slide" data-title="Second"><h2>Second</h2><aside class="notes"><p>Second script</p></aside></section>';
const server = http.createServer((request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  if (request.url.startsWith('/runtime.js')) {
    response.setHeader('Content-Type', 'text/javascript');
    response.end(runtime);
    return;
  }
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.end(`<!doctype html><html><head><style>
  .slide{display:none}.slide.is-active{display:block}.notes{display:none}
  </style></head><body><main class="deck">${reordered ? second + first() : first() + second}</main>
  <script src="/runtime.js"></script></body></html>`);
});

async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
  try {
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const url = `http://127.0.0.1:${server.address().port}/deck.html`;
    await page.goto(url);
    async function openPresenter() {
      const event = page.waitForEvent('popup');
      await page.keyboard.press('s');
      const popup = await event;
      popup.on('pageerror', error => errors.push(error.message));
      await popup.locator('#notes-edit').waitFor();
      return popup;
    }
    let popup = await openPresenter();
    const editor = () => popup.locator('#notes-editor');
    const click = id => popup.locator('#notes-' + id).click();
    const sample = 'Saved <img src=x onerror=alert(1)> </script>\n\nQuoted "text" and \\ backslash';
    await click('edit');
    assert.equal(await editor().inputValue(), 'Original script');
    await editor().fill(sample);
    await click('undo');
    assert.equal(await editor().inputValue(), 'Original script');
    await click('redo');
    assert.equal(await editor().inputValue(), sample);
    await editor().press('ArrowRight');
    await editor().press('Space');
    await editor().press('r');
    assert.equal(await popup.locator('#timer-count').innerText(), '1 / 2');
    await editor().fill(sample);
    await click('save');
    assert.equal(await popup.locator('#notes-view img').count(), 0);
    assert.match(await popup.locator('#notes-view').innerText(), /Timing cue/);
    assert.match(await popup.locator('#notes-view').innerText(), /Stage direction/);
    assert.match(await popup.locator('#notes-status').innerText(), /已保存/);

    // Drafts stay attached to their slide while navigating both ways.
    await click('edit');
    await editor().fill('Unsaved first-page draft');
    await popup.locator('#btn-next').click();
    await popup.locator('#btn-prev').click();
    assert.equal(await editor().inputValue(), 'Unsaved first-page draft');
    await click('cancel');
    await click('edit');
    assert.equal(await editor().inputValue(), sample);
    await click('cancel');

    // Export includes the current draft; invalid imports leave saved notes alone.
    await click('edit');
    await editor().fill('Exported draft');
    const downloadEvent = popup.waitForEvent('download');
    await click('export');
    const download = await downloadEvent;
    const exported = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    assert.equal(exported.slides[0].text, 'Exported draft');
    await click('cancel');
    await popup.locator('#notes-file').setInputFiles({
      name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{bad json')
    });
    await popup.waitForFunction(() => document.getElementById('notes-status').textContent.includes('导入失败'));
    await click('edit');
    assert.equal(await editor().inputValue(), sample);
    await click('cancel');
    popup.once('dialog', dialog => dialog.accept());
    await popup.locator('#notes-file').setInputFiles({
      name: 'notes.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported))
    });
    await popup.waitForFunction(() => document.getElementById('notes-status').textContent.includes('已导入'));

    await popup.close();
    await page.reload();
    popup = await openPresenter();
    await click('edit');
    assert.equal(await editor().inputValue(), 'Exported draft');
    await click('undo');
    assert.equal(await editor().inputValue(), sample);
    await click('save');
    await click('edit');
    await editor().fill('');
    await click('save');
    await popup.close();
    await page.reload();
    popup = await openPresenter();
    await click('edit');
    assert.equal(await editor().inputValue(), '');
    await click('undo');
    assert.equal(await editor().inputValue(), sample);
    await click('save');

    // Reordering retains identity; changing the authored script invalidates overrides.
    await popup.close();
    reordered = true;
    await page.goto(url + '#/2');
    await page.reload();
    popup = await openPresenter();
    await click('edit');
    assert.equal(await editor().inputValue(), sample);
    await click('cancel');
    await popup.close();
    changedSource = true;
    await page.reload();
    popup = await openPresenter();
    await click('edit');
    assert.equal(await editor().inputValue(), 'Updated author script');

    // A concurrent browser save must not silently overwrite this window's draft.
    await editor().fill('Concurrent draft');
    await page.evaluate(() => {
      const key = 'html-ppt-notes:v1:/deck.html:' + JSON.stringify(['first', 1]);
      localStorage.setItem(key, JSON.stringify({ version: 1, original: 'Updated author script',
        text: 'Saved in another window', previous: 'Updated author script' }));
    });
    await click('save');
    assert.equal(await editor().inputValue(), 'Concurrent draft');
    assert.match(await popup.locator('#notes-status').innerText(), /其他窗口已更新/);
    await click('cancel');
    await popup.close();
    popup = await openPresenter();
    await click('edit');
    assert.equal(await editor().inputValue(), 'Saved in another window');

    // Storage failure preserves the unsaved text and leaves the editor open.
    await editor().fill('Keep this on failure');
    await popup.evaluate(() => { Storage.prototype.setItem = function(){ throw Error('quota'); }; });
    await click('save');
    assert.equal(await editor().inputValue(), 'Keep this on failure');
    assert.match(await popup.locator('#notes-status').innerText(), /保存失败/);
    await click('cancel');
    await popup.close();
    assert.deepEqual(errors, []);
    console.log('PASS: save, undo/redo, empty text, literal markup, drafts, refresh, import/export, reorder, source changes, storage failure');
    await context.close();
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

run().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
