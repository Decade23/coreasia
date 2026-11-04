/** Uji komponen SFC asli dengan foto sintetis, tanpa akun atau layanan luar.
 * Chrome headless melalui CDP, profil sementara sendiri, selalu ditutup.
 * PLAYWRIGHT_CORE_PATH menunjuk index.mjs playwright-core bila tidak terpasang.
 * CF_QA_ARTIFACTS menentukan direktori hasil JSON dan tangkapan layar. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer as netServer } from 'node:net';
import { tmpdir, homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = process.env.CF_QA_ARTIFACTS || join(homedir(), 'Codex/artifact/coreasia/console-lightbox');
await mkdir(output, { recursive: true });
const { chromium } = await (process.env.PLAYWRIGHT_CORE_PATH ? import(pathToFileURL(process.env.PLAYWRIGHT_CORE_PATH).href) : import('playwright-core'));
const freePort = async () => {
  const s = netServer(); await new Promise(r => s.listen(0, '127.0.0.1', r));
  const p = s.address().port; await new Promise(r => s.close(r)); return p;
};
const state = `
import { ref, shallowRef, reactive } from 'vue';
import { KAMUS_CASHFLOW } from '/composables/cashflow/useCashflowI18n.ts';
export const foto = shallowRef(null), locale = ref('id'), route = reactive({fullPath:'/uji/transaksi'}), drawer = ref(true), mounted = ref(true);
export const stats = {created:0,revoked:0,closed:0};
export const useCashflowI18n = () => ({tcf:(key)=>key.split('.').reduce((a,k)=>a[k],KAMUS_CASHFLOW[locale.value]),formatJam:()=>'14.13'});
export const useAdminAuth = () => ({user:ref({email:'admin@example.invalid'})});
export const useCashflowSesi = () => ({pelaku:ref('admin@example.invalid')});
export const useRoute = () => route;
const close = () => { if(foto.value) {for(const b of foto.value.berkas)if(b.src){URL.revokeObjectURL(b.src);stats.revoked++} stats.closed++;foto.value=null} };
export const useCashflowKasus = () => ({foto,tutupFoto:close});
const photo = (w,h,label) => {
 let rows='';for(let i=0;i<30;i++)rows+='<text x="70" y="'+(220+i*(h-360)/30)+'" font-size="32" fill="#334155">Barang contoh '+(i+1)+' .... Rp 12.000</text>';
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'"><rect width="100%" height="100%" fill="#fffef9"/><text x="70" y="100" font-size="50" fill="#111827">'+label+'</text><text x="70" y="155" font-size="27" fill="#64748b">DATA SINTETIS UNTUK UJI</text>'+rows+'<text x="70" y="'+(h-60)+'" font-size="36">TOTAL Rp 360.000</text></svg>';
};
export const open = (count=4) => {
 close(); const types=['struk','bukti',null,'struk'];
 const berkas=Array.from({length:count},(_,i)=> {
   if(i===2)return {jenis:types[i],src:null,keadaan:'belum'};
   const content=i===3?'broken-image':photo(i===1?1600:1200,i===1?900:3600,i===1?'BUKTI BAYAR CONTOH':'STRUK CONTOH');
   stats.created++;return {jenis:types[i%4],src:URL.createObjectURL(new Blob([content],{type:'image/svg+xml'})),keadaan:'siap'};
 });
 foto.value={anak:'sintetis',sasaran:{jenis:'transaksi',id:'sintetis'},berkas,berlakuDetik:300};
};
window.fixture={open,close,route,locale,drawer,mounted,stats};
`;
const entry = `
import { createApp,h } from 'vue';
import Lightbox from '/components/cashflow/CashflowLampiranPenampil.vue';
import Laci from '/components/cashflow/CashflowLaci.vue';
import icons from '@iconify-json/lucide/icons.json';
import {drawer,mounted,open} from 'virtual:lightbox-state';
import '/assets/css/main.css';
createApp({setup:()=>()=>h('main',{style:'padding:32px;min-height:200vh'},[
 h('h1','Uji lightbox CashFlow'),h('input',{id:'background',placeholder:'Latar belakang'}),
 h('button',{onClick:()=>drawer.value=true},'Buka transaksi'),
 h(Laci,{show:drawer.value,judul:'Transaksi contoh',onClose:()=>drawer.value=false},()=>[
  h('p',{style:'margin:24px 0'},'Rp 184.000 · Data sintetis'),
  h('button',{id:'open',class:'ca-btn-secondary',onClick:()=>open()},'Lihat foto')]),
 mounted.value?h(Lightbox):null
])}).component('Icon',{props:['name'],setup:(p,{attrs})=>()=>{const d=icons.icons[p.name.split(':')[1]];return h('svg',{...attrs,viewBox:'0 0 24 24',fill:'none',xmlns:'http://www.w3.org/2000/svg','aria-hidden':'true',innerHTML:d?.body||''})}}).mount('#app');
`;
const server = await createServer({
  root, configFile: false, logLevel: 'error',
  define: { 'import.meta.client': 'true' }, resolve: { alias: { '~': root } },
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{
    name: 'lightbox-fixture', enforce: 'pre',
    resolveId(id) { if (id === 'virtual:lightbox-state' || id === '/__uji-lightbox-entry.js') return `\0${id}`; },
    load(id) { if (id === '\0virtual:lightbox-state') return state; if (id === '\0/__uji-lightbox-entry.js') return entry; },
    transform(code, id) {
      if (/components\/cashflow\/Cashflow(LampiranPenampil|Laci)\.vue$/.test(id)) return code.replaceAll('import.meta.client', 'true').replace('<script setup lang="ts">', '<script setup lang="ts">\nimport {computed,ref,watch,nextTick,onBeforeUnmount,useId} from "vue";\nimport {useCashflowI18n,useCashflowKasus,useAdminAuth,useCashflowSesi,useRoute} from "virtual:lightbox-state";');
    },
    configureServer(s) { s.middlewares.use('/__uji-lightbox', (_req, res) => { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html data-theme="light" lang="id"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Uji lightbox</title><div id="app"></div><script type="module" src="/__uji-lightbox-entry.js"></script></html>'); }); },
  }, vue(), tailwindcss()],
});
const checks = [], errors = [];
let browser, chrome, profile;
const check = (name, value = true) => { assert.ok(value, name); checks.push(name); };
try {
  await server.listen();
  const port = server.httpServer.address().port, cdpPort = await freePort();
  profile = await mkdtemp(join(tmpdir(), 'cf-lightbox-headless-'));
  chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--user-data-dir=${profile}`, `--remote-debugging-port=${cdpPort}`, '--no-first-run', '--no-default-browser-check', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).ok) break; } catch { /* Menunggu Chrome. */ } await new Promise(r => setTimeout(r, 100)); }
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`);
  const ctx = browser.contexts()[0], page = ctx.pages()[0];
  page.on('pageerror', e => errors.push(e.message));
  await ctx.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`http://127.0.0.1:${port}/__uji-lightbox`, { waitUntil: 'networkidle' });
  const dialog = () => page.getByRole('dialog', { name: 'Foto lampiran', exact: true });
  const ready = () => page.waitForFunction(() => document.querySelector('.foto-bidang')?.getAttribute('aria-busy') === 'false' && document.querySelector('.foto-kanvas img')?.naturalWidth > 0);
  const zoom = () => dialog().locator('output').innerText();
  const open = async () => { await page.locator('#open').click(); await ready(); };
  const fit = () => dialog().getByRole('button', { name: 'Pas layar', exact: true }).click();
  await open();
  check('foto pertama siap', (await zoom()) === '100%');
  check('fokus awal pada tombol tutup', await dialog().getByRole('button', { name: 'Tutup', exact: true }).evaluate(el => el === document.activeElement));
  check('latar inert dan scroll terkunci', await page.evaluate(() => document.querySelector('#app').inert && document.body.style.overflow === 'hidden'));
  const dims = await dialog().locator('.foto-kanvas img').boundingBox(), stage = await dialog().locator('.foto-bidang').boundingBox();
  check('seluruh struk panjang muat', dims.height <= stage.height + 1 && dims.width <= stage.width + 1);
  check('tanda air tetap terlihat', await dialog().getByText('admin@example.invalid · 14.13 WIB', { exact: true }).isVisible());
  await dialog().getByRole('button', { name: 'Perbesar foto', exact: true }).click();
  check('zoom tombol', (await zoom()) === '150%');
  await page.keyboard.press('+'); check('zoom keyboard', (await zoom()) === '200%');
  const center = { x: stage.x + stage.width / 2, y: stage.y + stage.height / 2 };
  await page.mouse.move(center.x, center.y); await page.mouse.wheel(0, -120);
  await page.waitForFunction(() => document.querySelector('output')?.textContent === '230%'); check('zoom roda mouse');
  await page.mouse.move(center.x, center.y); await page.mouse.down(); await page.mouse.move(center.x, center.y + 150, { steps: 8 }); await page.mouse.up();
  check('foto dapat digeser', await dialog().locator('.foto-kanvas').evaluate(el => !el.style.transform.includes('translate(0px, 0px)')));
  await fit(); check('pas layar memulihkan zoom', (await zoom()) === '100%');
  await page.mouse.dblclick(center.x, center.y); check('klik ganda memperbesar', (await zoom()) === '250%');
  await fit();
  await dialog().getByRole('button', { name: 'Putar foto 90 derajat', exact: true }).click();
  check('putar foto', await dialog().locator('.foto-kanvas').evaluate(el => el.style.transform.includes('rotate(90deg)')));
  await page.waitForTimeout(160);
  const rotated = await dialog().locator('.foto-kanvas img').boundingBox();
  check('foto diputar tetap muat', rotated.width <= stage.width + 1 && rotated.height <= stage.height + 1);
  await page.keyboard.press('ArrowRight'); await ready();
  check('navigasi keyboard dan reset putaran', await dialog().getByText('Bukti bayar · 2 / 4', { exact: true }).isVisible() && await dialog().locator('.foto-kanvas').evaluate(el => el.style.transform.includes('rotate(0deg)')));
  await dialog().getByRole('button', { name: 'Foto 1: Foto struk', exact: true }).click(); await ready(); check('thumbnail memilih foto');
  await dialog().getByRole('button', { name: 'Foto sebelumnya', exact: true }).click();
  await dialog().getByText('Foto gagal dimuat. Tutup, lalu coba lagi.', { exact: true }).waitFor();
  check('berkas rusak memiliki pesan dan zoom nonaktif', await dialog().getByRole('button', { name: 'Perbesar foto', exact: true }).isDisabled());
  await dialog().getByRole('button', { name: 'Foto 3: Foto', exact: true }).click();
  await dialog().getByText('Berkasnya belum terunggah.', { exact: true }).waitFor(); check('foto belum terunggah memiliki pesan');
  await dialog().getByRole('button', { name: 'Foto 1: Foto struk', exact: true }).click(); await ready();
  const close = dialog().getByRole('button', { name: 'Tutup', exact: true });
  await close.focus(); await page.keyboard.press('Shift+Tab');
  check('Shift Tab tetap di lightbox', await dialog().getByRole('button', { name: 'Foto berikutnya', exact: true }).evaluate(el => el === document.activeElement));
  await page.keyboard.press('Tab'); check('Tab berputar ke tombol tutup', await close.evaluate(el => el === document.activeElement));
  const before = await page.evaluate(() => ({ ...window.fixture.stats }));
  check('navigasi dan zoom tidak mengambil foto ulang', before.created === 3 && before.revoked === 0);
  await page.screenshot({ path: join(output, 'desktop-terang.png') });
  await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
  await page.waitForTimeout(350);
  await page.screenshot({ path: join(output, 'desktop-gelap.png') });
  await page.keyboard.press('Escape'); await dialog().waitFor({ state: 'hidden' });
  check('Esc hanya menutup foto', await page.getByRole('dialog', { name: 'Transaksi contoh', exact: true }).isVisible());
  check('fokus kembali ke Lihat foto', await page.locator('#open').evaluate(el => el === document.activeElement));
  check('latar dan scroll pulih', await page.evaluate(() => !document.querySelector('#app').inert && document.body.style.overflow === ''));
  check('blob dicabut saat ditutup', await page.evaluate(() => window.fixture.stats.revoked === 3 && window.fixture.stats.closed === 1));
  await page.evaluate(() => document.documentElement.dataset.theme = 'light');
  await page.setViewportSize({ width: 390, height: 844 }); await open();
  const small = await dialog().boundingBox(); check('ponsel memakai seluruh layar', small.width === 390 && small.height === 844);
  const targets = await dialog().locator('button').evaluateAll(els => els.map(el => { const b = el.getBoundingClientRect(); return { name: el.getAttribute('aria-label') || el.textContent, w: b.width, h: b.height }; }));
  check('semua sasaran sentuh minimal 44 piksel', targets.every(t => t.w >= 44 && t.h >= 44));
  const mobileStage = await dialog().locator('.foto-bidang').boundingBox(), mx = mobileStage.x + mobileStage.width / 2, my = mobileStage.y + mobileStage.height / 2;
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([id, x, y]) => ({ id, x, y, radiusX: 5, radiusY: 5 })) });
  await touch('touchStart', [[1, mx - 40, my], [2, mx + 40, my]]);
  for (let d = 50; d <= 110; d += 10) await touch('touchMove', [[1, mx - d, my], [2, mx + d, my]]);
  await touch('touchEnd', []);
  check('cubit dua jari memperbesar', parseInt(await zoom()) >= 250);
  await fit();
  await touch('touchStart', [[1, mx + 80, my]]);
  for (let d = 60; d >= -80; d -= 20) await touch('touchMove', [[1, mx + d, my]]);
  await touch('touchEnd', []); await ready();
  check('usap berganti foto', await dialog().getByText('Bukti bayar · 2 / 4', { exact: true }).isVisible());
  await page.screenshot({ path: join(output, 'ponsel-terang.png') });
  await page.setViewportSize({ width: 320, height: 568 });
  check('layar 320 piksel tidak meluber', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  check('bidang foto tetap tersedia di layar kecil', (await dialog().locator('.foto-bidang').boundingBox()).height > 180);
  await page.screenshot({ path: join(output, 'ponsel-320.png') });
  await page.evaluate(() => window.fixture.route.fullPath = '/uji/berikutnya'); await dialog().waitFor({ state: 'hidden' }); check('pindah halaman menutup lightbox');
  await page.setViewportSize({ width: 1440, height: 900 }); await open();
  await page.setViewportSize({ width: 720, height: 450 });
  check('ruang CSS setara zoom browser 200 persen tetap dapat dipakai', (await dialog().locator('.foto-bidang').boundingBox()).height > 150 && await dialog().getByRole('button', { name: 'Tutup', exact: true }).isVisible());
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => window.fixture.close()); await dialog().waitFor({ state: 'hidden' }); check('akhir sesi foto memulihkan modal');
  await page.evaluate(() => { window.fixture.locale.value = 'en'; window.fixture.open(1); });
  const english = page.getByRole('dialog', { name: 'Attached photo', exact: true });
  await english.waitFor(); await ready();
  check('bahasa Inggris lengkap', await english.getByRole('button', { name: 'Fit screen', exact: true }).isVisible() && !(await english.innerText()).includes('lampiran.'));
  check('satu foto tanpa navigasi kosong', await english.getByRole('button', { name: 'Next photo', exact: true }).count() === 0);
  await page.keyboard.press('Escape'); await english.waitFor({ state: 'hidden' });
  await page.evaluate(() => window.fixture.locale.value = 'id');
  await open(); await page.evaluate(() => window.fixture.mounted.value = false); await dialog().waitFor({ state: 'hidden' });
  check('unmount membersihkan foto dan scroll', await page.evaluate(() => !document.querySelector('#app').inert && document.body.style.overflow === '' && window.fixture.stats.created === window.fixture.stats.revoked));
  check('tanpa galat JavaScript', errors.length === 0);
  const result = { jenis: 'komponen asli, data sintetis, tanpa akun produksi', checks, count: checks.length, errors, targets };
  await writeFile(join(output, 'hasil-browser.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  if (browser) try { await (await browser.newBrowserCDPSession()).send('Browser.close'); } catch { /* Chrome sudah berhenti. */ }
  chrome?.kill(); if (profile) await rm(profile, { recursive: true, force: true }).catch(() => {});
  await server.close();
}
