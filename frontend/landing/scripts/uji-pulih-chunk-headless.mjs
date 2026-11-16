/** Pengaman berkas build gagal dimuat (utils/pulih-chunk.ts), di peramban
 * sungguhan: Chrome headless lewat CDP dalam profil sementara, tanpa akun.
 *
 * Aplikasi hasil build dijalankan lokal, lalu skrip ini memasang perantara di
 * depannya yang bisa "merusak" satu berkas /_nuxt: menjawab 404 dengan
 * `cache-control: public, max-age=31536000, immutable`, persis keadaan yang
 * membuat peramban menyimpan 404 selama setahun.
 *
 *   npx nuxi build
 *   NITRO_HOST=127.0.0.1 NITRO_PORT=4399 node .output/server/index.mjs &
 *   node scripts/uji-pulih-chunk-headless.mjs
 *
 * CF_QA_BASE menunjuk aplikasi (bawaan http://127.0.0.1:4399), CF_QA_HALAMAN
 * halaman yang dibuka (bawaan /console/login), CF_QA_RINCI=1 mencetak setiap
 * permintaan dokumen dan berkas yang dirusak.
 *
 * Tiga hal yang dibuktikan:
 *  1. pembanding tanpa pengaman: sesudah server pulih, dokumen yang dibuka
 *     dengan parameter pembeda MASIH memakai 404 dari tembolok (itu sebabnya
 *     parameter saja tidak cukup dan berkasnya harus diminta ulang);
 *  2. berkas utama gagal: satu muat ulang otomatis, tidak berputar; sesudah
 *     server pulih, muat ulang pengguna berikutnya memulihkan halaman;
 *  3. sama untuk berkas yang dimuat belakangan (impor dinamis).
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import http from 'node:http';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = await (process.env.PLAYWRIGHT_CORE_PATH ? import(pathToFileURL(process.env.PLAYWRIGHT_CORE_PATH).href) : import('playwright-core'));
const hulu = new URL(process.env.CF_QA_BASE || 'http://127.0.0.1:4399');
const halaman = process.env.CF_QA_HALAMAN || '/console/login';
const checks = [];
const check = (nama, nilai = true) => { assert.ok(nilai, nama); checks.push(nama); console.log(`  lulus: ${nama}`); };
const jeda = ms => new Promise(r => setTimeout(r, ms));

/** Perantara dengan tembolok terpisah (asal sendiri) untuk tiap skenario. */
async function perantara({ tanpaPengaman = false } = {}) {
  const s = { rusak: new Set(), hit: new Map(), dokumen: 0, js: [], html: '' };
  const server = http.createServer((req, res) => {
    const jalur = req.url.split('?')[0];
    if (jalur.startsWith('/_nuxt/')) {
      s.hit.set(jalur, (s.hit.get(jalur) || 0) + 1);
      if (process.env.CF_QA_RINCI && s.rincian?.has(jalur)) console.log(`    berkas ${jalur} dest=${req.headers['sec-fetch-dest']} cache=${req.headers['cache-control'] || '-'} -> ${s.rusak.has(jalur) ? 404 : 200}`);
      if (jalur.endsWith('.js') && !s.js.includes(jalur)) s.js.push(jalur);
    }
    if (s.rusak.has(jalur)) {
      res.writeHead(404, { 'content-type': 'text/plain', 'cache-control': 'public, max-age=31536000, immutable' });
      return res.end('Not Found');
    }
    const naik = http.request({ host: hulu.hostname, port: hulu.port, path: req.url, method: req.method, headers: { ...req.headers, host: hulu.host, 'accept-encoding': 'identity' } }, (jawab) => {
      // Hanya navigasi dokumen: halaman yang sama bisa juga diminta sebagai sumber daya lain.
      const dok = jalur === halaman && req.headers['sec-fetch-dest'] === 'document' && String(jawab.headers['content-type']).includes('text/html');
      if (!dok) { res.writeHead(jawab.statusCode, jawab.headers); return jawab.pipe(res); }
      s.dokumen++;
      if (process.env.CF_QA_RINCI) console.log(`    dokumen ${s.dokumen}: ${req.url} dest=${req.headers['sec-fetch-dest']} mode=${req.headers['sec-fetch-mode']} cache=${req.headers['cache-control'] || '-'}`);
      const potong = [];
      jawab.on('data', d => potong.push(d));
      jawab.on('end', () => {
        let html = Buffer.concat(potong).toString('utf8');
        assert.ok(html.includes('__caPulihChunk'), 'HTML hasil build memuat skrip pengaman');
        if (tanpaPengaman) html = html.replace(/<script[^>]*>\(function\(w\)\{\s*var PARAM=[\s\S]*?<\/script>/, '');
        if (tanpaPengaman) assert.ok(!html.includes('__caPulihChunk'), 'pembanding: skrip pengaman dilepas');
        s.html = html;
        const kepala = { ...jawab.headers };
        delete kepala['content-length'];
        // CSP ber-hash milik dokumen console dilepas hanya di pembanding, karena di sana isinya diubah.
        if (tanpaPengaman) delete kepala['content-security-policy'];
        res.writeHead(jawab.statusCode, kepala);
        res.end(html);
      });
    });
    naik.on('error', () => { res.writeHead(502); res.end(); });
    req.pipe(naik);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return { s, asal: `http://127.0.0.1:${server.address().port}`, tutup: () => new Promise(r => server.close(r)) };
}

const free = createServer(); await new Promise(r => free.listen(0, '127.0.0.1', r));
const port = free.address().port; await new Promise(r => free.close(r));
const dir = await mkdtemp(join(tmpdir(), 'ca-pulih-chunk-'));
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--user-data-dir=${dir}`, `--remote-debugging-port=${port}`, '--no-first-run', '--no-default-browser-check', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
let browser;
const terbuka = [];
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) break; } catch { /* Menunggu Chrome. */ } await jeda(100); }
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  const page = browser.contexts()[0].pages()[0];
  await page.setViewportSize({ width: 1440, height: 900 });
  const hidup = () => page.evaluate(() => !!document.querySelector('#__nuxt')?.__vue_app__).catch(() => false);
  const tungguHidup = async (ms = 8000) => { for (let t = 0; t < ms; t += 200) { if (await hidup()) return true; await jeda(200); } return false; };
  const buka = async (p) => { terbuka.push(p); return p; };

  // Pemetaan: berkas utama, dan satu berkas yang tidak disebut di HTML (dimuat belakangan).
  const peta = await buka(await perantara());
  await page.goto(peta.asal + halaman, { waitUntil: 'load' });
  check('aplikasi sehat hidup lewat perantara', await tungguHidup());
  await jeda(1500);
  const utama = /<script[^>]+type="module"[^>]+src="(\/_nuxt\/[^"]+\.js)"/.exec(peta.s.html)?.[1];
  check('berkas utama ditemukan di HTML', !!utama);
  const belakangan = peta.s.js.find(j => !peta.s.html.includes(j));
  check('ada berkas yang dimuat belakangan', !!belakangan);

  console.log('1. pembanding tanpa pengaman');
  const a = await buka(await perantara({ tanpaPengaman: true }));
  a.s.rusak.add(utama);
  await page.goto(a.asal + halaman, { waitUntil: 'load' });
  await jeda(1500);
  check('berkas utama 404: aplikasi tidak hidup', !(await hidup()));
  a.s.rusak.clear();
  const hitSebelum = a.s.hit.get(utama);
  await page.goto(a.asal + halaman + '?_mc=coba', { waitUntil: 'load' });
  check('server sudah pulih, tetapi dokumen berparameter pembeda masih memakai 404 dari tembolok', !(await tungguHidup(4000)));
  // Catatan saja, tidak dijadikan syarat: Chrome meminta ulang berkas itu di latar pada muatan
  // tadi, jadi navigasi sesudahnya biasanya pulih sendiri. Itu tidak terjadi bila CDN di depan
  // ikut menyimpan 404-nya, karena permintaan ulang itu pun dijawab 404.
  await page.goto(a.asal + halaman, { waitUntil: 'load' });
  console.log(`  catatan: navigasi kedua sesudah pulih ${(await tungguHidup(4000)) ? 'hidup' : 'masih mati'} (permintaan berkas utama: ${hitSebelum} lalu ${a.s.hit.get(utama)})`);

  const skenario = async (nomor, nama, berkas) => {
    console.log(`${nomor}. ${nama}`);
    const b = await buka(await perantara());
    b.s.rusak.add(berkas);
    b.s.rincian = new Set([berkas]);
    await page.goto(b.asal + halaman, { waitUntil: 'load' });
    await jeda(7000);
    check('server masih 404: tepat satu muat ulang otomatis, lalu berhenti', b.s.dokumen === 2);
    check('berkasnya diminta ulang melewati tembolok', b.s.hit.get(berkas) >= 2);
    check('parameter pembeda dibuang dari alamat', !page.url().includes('_mc='));
    b.s.rusak.clear();
    // Pengguna membuka halaman itu lagi. Navigasi biasa memakai tembolok (lihat pembanding).
    await page.goto(b.asal + halaman, { waitUntil: 'load' });
    await jeda(3000);
    const pulih = await tungguHidup();
    const galat = [];
    page.on('pageerror', e => galat.push(e.message));
    await jeda(1500);
    check('server pulih: kunjungan pengguna berikutnya langsung memulihkan halaman, tanpa hapus tembolok', pulih && galat.length === 0);
    // 4 = awal, otomatis, pengguna, otomatis dengan bukti. 3 bila peramban sudah memulihkan temboloknya sendiri.
    const sebelum = b.s.dokumen;
    check(`jumlah dokumen 3 atau 4 (terukur ${sebelum})`, sebelum === 3 || sebelum === 4);
    check('parameter pembeda tidak tertinggal di alamat', !page.url().includes('_mc='));
    await page.reload({ waitUntil: 'load' });
    check('muat ulang sesudahnya normal, tanpa muat ulang otomatis lagi', (await tungguHidup()) && b.s.dokumen === sebelum + 1);
    page.removeAllListeners('pageerror');
  };
  await skenario(2, 'berkas utama gagal', utama);
  await skenario(3, 'berkas yang dimuat belakangan gagal', belakangan);

  console.log(JSON.stringify({ ok: true, checks: checks.length, halaman }));
} finally {
  try { const sesi = await browser?.newBrowserCDPSession(); await sesi?.send('Browser.close'); } catch { /* Sudah tertutup. */ }
  if (chrome.exitCode === null) chrome.kill('SIGTERM');
  for (const p of terbuka) await p.tutup().catch(() => {});
  await rm(dir, { recursive: true, force: true }).catch(() => {});
}
