'use strict';
// LUNOR QA stage 1: real browser startup checks, NOT functional parity certification.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const apps = JSON.parse(fs.readFileSync(path.join(__dirname, 'apps.json'), 'utf8')).apps;
const slug = process.env.LUNOR_QA_APP || process.argv[2];
const app = apps.find(item => item.slug === slug);
if (!app) {
  process.stderr.write('Unknown application: ' + slug + '\n');
  process.exit(2);
}
const outDir = path.resolve(process.env.LUNOR_QA_OUT || path.join('qa-output', slug));
fs.mkdirSync(outDir, { recursive: true });
const info = {
  app: app.slug,
  name: app.name,
  source: 'https://capcuustudio.github.io/wordcraft/lunor-' + app.slug + '/',
  timestamp: new Date().toISOString(),
  browser: 'Chromium headless on GitHub Actions',
  checks: [],
  pageErrors: [],
  consoleErrors: [],
  badResponses: [],
  failedRequests: [],
  functionalFileRoundtrip: 'NOT_TESTED',
  reason: 'Browser startup is NOT evidence of create/edit/save/reopen fidelity.',
  screenshot: 'boot.png',
  bootEvidence: {}
};
const check = (name, status, evidence) => info.checks.push({ name, status, evidence: String(evidence || '').slice(0, 400) });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser, context, page, failed = false;
async function main() {
  browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl','--enable-unsafe-swiftshader','--disable-dev-shm-usage']
  });
  context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
    acceptDownloads: false,
    serviceWorkers: 'block'
  });
  // Register the WASM start event before the module code runs.
  await context.addInitScript(() => {
    window.__lunorTrunkStarted = false;
    addEventListener('TrunkApplicationStarted', () => { window.__lunorTrunkStarted = true; });
  });
  page = await context.newPage();
  let wasmOk = [];
  page.on('pageerror', err => info.pageErrors.push(String(err && err.stack || err).slice(0, 1000)));
  page.on('console', message => {
    if (message.type() === 'error') info.consoleErrors.push(message.text().slice(0, 500));
  });
  page.on('requestfailed', req => {
    if (/\.(wasm|js)(\?|$)/i.test(req.url())) {
      info.failedRequests.push({ url: req.url(), error: req.failure()?.errorText });
    }
  });
  page.on('response', res => {
    if (/\.wasm(\?|$)/i.test(res.url())) {
      if (res.ok()) wasmOk.push({ url: res.url(), status: res.status(), type: res.headers()['content-type'] || '' });
      else info.badResponses.push({ url: res.url(), status: res.status() });
    } else if (/\.js(\?|$)/i.test(res.url()) && res.status() >= 400) {
      info.badResponses.push({ url: res.url(), status: res.status() });
    }
  });

  let http;
  try {
    http = await page.goto(info.source, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (e) {
    check('document-http', 'FAIL', e.message);
    failed = true;
    return;
  }
  check('document-http', http?.status() === 200 ? 'PASS' : 'FAIL', 'HTTP ' + (http?.status() || 'none'));
  check('canvas-found', await page.locator('#' + app.canvas).count() === 1 ? 'PASS' : 'FAIL', 'Expected canvas #' + app.canvas);

  let bootObserved = false;
  try {
    await page.waitForFunction(bootType => {
      if (bootType === 'trunk') return window.__lunorTrunkStarted === true;
      if (bootType === 'filmcraft') return Boolean(window.filmcraftLoad?.readyMs);
      if (bootType === 'effectcraft') return Boolean(window.effectcraftLoad?.readyMs);
      if (bootType === 'lightcraft') return typeof window.lightcraft?.command === 'function';
      return false;
    }, app.boot, { timeout: 135000, polling: 500 });
    bootObserved = true;
  } catch (e) {
    info.bootEvidence.timeout = String(e.message).slice(0, 220);
  }

  await pause(1500);
  const evidence = await page.evaluate(canvasId => {
    const canvas = document.getElementById(canvasId);
    const load = document.getElementById('loading') || document.getElementById(canvasId.replace('_canvas','_loading'));
    const loadingVisible = load ? (() => {
      const style = getComputedStyle(load);
      const r = load.getBoundingClientRect();
      return load.isConnected && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > .01 && r.width > 3 && r.height > 3;
    })() : false;
    const rect = canvas?.getBoundingClientRect();
    return {
      canvasWidth: canvas?.width || 0,
      canvasHeight: canvas?.height || 0,
      canvasCSSWidth: Math.round(rect?.width || 0),
      canvasCSSHeight: Math.round(rect?.height || 0),
      loadingVisible,
      bodyTitle: document.title,
      filmcraftFatal: window.filmcraftLoad?.fatal || null,
      filmcraftError: window.filmcraftLoad?.error || null,
      effectcraftError: window.effectcraftLoad?.error || null,
      startupEvent: window.__lunorTrunkStarted || false,
      hasLightcraftApi: typeof window.lightcraft?.command === 'function'
    };
  }, app.canvas);
  info.bootEvidence = { ...info.bootEvidence, ...evidence };
  check('wasm-start', bootObserved ? 'PASS' : 'FAIL', app.boot + ' startup signal ' + (bootObserved ? 'observed' : 'not observed'));
  check('canvas-sized', evidence.canvasWidth > 20 && evidence.canvasHeight > 20 && evidence.canvasCSSWidth > 200 && evidence.canvasCSSHeight > 200 ? 'PASS' : 'FAIL',
    evidence.canvasWidth + 'x' + evidence.canvasHeight + ' internal; ' + evidence.canvasCSSWidth + 'x' + evidence.canvasCSSHeight + ' CSS');
  // A visible splash after Rust/WASM ready may be a real UI bug; distinguish it.
  if (app.slug !== 'pdf') check('splash-cleared', !evidence.loadingVisible ? 'PASS' : 'FAIL', evidence.loadingVisible ? 'Loading overlay still visible' : 'Not visible');
  check('wasm-network', wasmOk.length > 0 && info.badResponses.length === 0 && info.failedRequests.length === 0 ? 'PASS' : 'FAIL',
    JSON.stringify({ wasm: wasmOk.map(x => ({ status: x.status, type: x.type })), bad: info.badResponses, failed: info.failedRequests }).slice(0, 370));
  const fatal = evidence.filmcraftFatal || evidence.filmcraftError || evidence.effectcraftError ||
    info.pageErrors.some(x => /RuntimeError|panicked at|memory access out of bounds|unreachable|out of memory/i.test(x)) ||
    info.consoleErrors.some(x => /panicked at|memory allocation of|out of memory|RuntimeError: unreachable/i.test(x));
  check('no-fatal-runtime-error', !fatal ? 'PASS' : 'FAIL',
    fatal ? 'Fatal WASM error detected' : 'No fatal browser runtime signal during startup window');
  info.browserWarnings = {
    pageErrors: info.pageErrors.length,
    consoleErrors: info.consoleErrors.length
  };
  await page.screenshot({ path: path.join(outDir, 'boot.png'), fullPage: false, timeout: 20000 });
  check('screenshot-captured', fs.statSync(path.join(outDir, 'boot.png')).size > 1000 ? 'PASS' : 'FAIL', 'boot.png');
  check('file-create-edit-save-reopen', 'NOT_TESTED', 'Requires representative corpus and content comparison; startup screenshot cannot validate this');
} catch (e) {
  info.fatalError = String(e && e.stack || e).slice(0, 2500);
  check('automation-execution', 'FAIL', info.fatalError);
  failed = true;
} finally {
  try { if (context) await context.close(); } catch {}
  try { if (browser) await browser.close(); } catch {}
  info.summary = {
    passed: info.checks.filter(x => x.status === 'PASS').length,
    failed: info.checks.filter(x => x.status === 'FAIL').length,
    notTested: info.checks.filter(x => x.status === 'NOT_TESTED').length
  };
  info.bootStatus = info.summary.failed || failed ? 'FAIL' : 'PASS';
  fs.writeFileSync(path.join(outDir, 'status.json'), JSON.stringify(info, null, 2) + '\n');
  process.stdout.write(JSON.stringify({ app: app.slug, status: info.bootStatus, ...info.summary }) + '\n');
  if (info.bootStatus !== 'PASS') process.exitCode = 1;
}
}
main().catch(error => {
  process.stderr.write(String(error.stack || error) + '\n');
  process.exitCode = 1;
});
