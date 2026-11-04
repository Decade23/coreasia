/** Aplikasi Nuxt lengkap, API sintetis dengan latensi. Chrome headless/CDP
 * dalam profil sementara, tanpa akun atau penulisan data produksi.
 * Server lokal: NITRO_HOST=127.0.0.1 NITRO_PORT=4399
 * NUXT_PUBLIC_CASHFLOW_SUPABASE_URL=http://127.0.0.1:4398
 * NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY=anon-sintetis node .output/server/index.mjs
 * CF_QA_BASE dan CF_QA_SB boleh menunjuk aplikasi terpasang; seluruh API tetap
 * ditahan route browser. EXPECT_GLITCH=1 merekam reproduksi sebelum perbaikan. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = await (process.env.PLAYWRIGHT_CORE_PATH ? import(pathToFileURL(process.env.PLAYWRIGHT_CORE_PATH).href) : import('playwright-core'));
const base = process.env.CF_QA_BASE || 'http://127.0.0.1:4399';
const origin = new URL(base).origin, sb = process.env.CF_QA_SB || 'http://127.0.0.1:4398';
const output = process.env.CF_QA_ARTIFACTS || join(homedir(), 'Codex/artifact/coreasia/console-tabel-stabil');
await mkdir(output, { recursive: true });
const errors = [], checks = [], requests = [], pending = [];
let held = false, failure = 0, latency = 20;
const people = Array.from({ length: 97 }, (_, i) => ({
  user_id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
  email: `orang${String(i + 1).padStart(3, '0')}@contoh.invalid`, display_name: '',
  created_at: '2026-01-01T00:00:00Z', last_sign_in: null, aktivitas_terakhir: null,
  banned_until: null, jumlah_ruang: i % 4, jumlah_tx: i + 1, nomor_wa: `628121234${String(i + 1).padStart(4, '0')}`,
  versi_aplikasi: '1.3.6', platform: 'android', menunggu_hapus: false,
}));
const rooms = Array.from({ length: 8 }, (_, i) => ({ workspace_id: `22222222-2222-4222-8222-${String(i + 1).padStart(12, '0')}`, nama: `Rua*** ${i + 1}`, pemilik_email: 'ora***@contoh.invalid', jenis: 'pribadi', created_at: '2026-01-01T00:00:00Z', jumlah_anggota: 1, jumlah_tx: i, undangan_aktif: 0, total_semua: 8 }));
const free = createServer(); await new Promise(r => free.listen(0, '127.0.0.1', r));
const port = free.address().port; await new Promise(r => free.close(r));
const dir = await mkdtemp(join(tmpdir(), 'cf-tabel-stabil-'));
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--user-data-dir=${dir}`, `--remote-debugging-port=${port}`, '--no-first-run', '--no-default-browser-check', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
let browser, page, frames = [];
const check = (name, value = true) => { assert.ok(value, name); checks.push(name); };
const release = (i = 0) => pending.splice(i, 1)[0]?.();
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) break; } catch { /* Menunggu Chrome. */ } await new Promise(r => setTimeout(r, 100)); }
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  const ctx = browser.contexts()[0]; page = ctx.pages()[0];
  await page.setViewportSize({ width: 1440, height: 900 }); page.on('pageerror', e => errors.push(e.message));
  await ctx.addInitScript(() => {
    const exp = Math.floor(Date.now() / 1000) + 3600, id = '00000000-0000-4000-8000-000000000001';
    const jwt = ['eyJhbGciOiJub25lIn0', btoa(JSON.stringify({ sub: id, role: 'authenticated', exp })).replaceAll('=', ''), 'sintetis'].join('.');
    sessionStorage.setItem('cf-console-sesi', JSON.stringify({ access_token: jwt, refresh_token: 'sintetis', expires_at: exp, expires_in: 3600, token_type: 'bearer', user: { id, aud: 'authenticated', role: 'authenticated', email: 'admin@example.invalid' } }));
    sessionStorage.setItem('cf_izin', JSON.stringify(['cashflow:view', 'cashflow:pii', 'cashflow:investigasi']));
  });
  await ctx.route('**/*', async r => {
    const req = r.request(), u = new URL(req.url());
    if (u.origin === origin && u.pathname === '/api/gw/admin/auth/me') return r.fulfill({ json: { data: { id: 'admin-sintetis', email: 'admin@example.invalid', full_name: 'Admin Contoh', role: 'super_admin', is_active: true, mfa: true, mfa_at: new Date().toISOString() } } });
    if (u.origin === new URL(sb).origin) {
      const headers = { 'access-control-allow-origin': origin, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST,GET,OPTIONS' };
      if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers });
      const name = u.pathname.split('/').pop(), p = req.postDataJSON() || {}, fail = failure; failure = 0;
      requests.push({ name, p });
      if (held) await new Promise(resolve => pending.push(resolve));
      else await new Promise(resolve => setTimeout(resolve, latency));
      if (fail) return r.fulfill({ status: fail === 42501 ? 403 : 500, json: { code: fail === 42501 ? '42501' : 'XX000', hint: fail === 42501 ? 'izin-kurang' : undefined, message: fail === 42501 ? 'izin-kurang' : 'Gangguan sintetis' }, headers });
      let data;
      if (name === 'admin_daftar_pengguna_v3') {
        let rows = people.filter(x => !p.p_cari || x.email.includes(p.p_cari));
        if (p.p_segmen === 'ditangguhkan') rows = [];
        const term = p.p_filter?.email; if (term) rows = rows.filter(x => x.email.includes(term));
        rows = [...rows].sort((a, b) => p.p_urut === 'email' ? a.email.localeCompare(b.email) : p.p_urut === 'tx' ? a.jumlah_tx - b.jumlah_tx : a.user_id.localeCompare(b.user_id));
        if (p.p_arah === 'desc') rows.reverse();
        data = { total: rows.length, baris: rows.slice(p.p_offset, p.p_offset + p.p_limit).map(x => ({ ...x, email: p.p_alasan ? x.email : 'ora***@contoh.invalid', nomor_wa: p.p_alasan ? x.nomor_wa : '0812 •••• 0000', terbuka: !!p.p_alasan, total_semua: rows.length })), versi_terbaru: {}, hapus_tersedia: true };
      } else if (name === 'admin_daftar_ruang_v2') data = rooms;
      else if (name === 'admin_daftar_pengguna_v2') data = [];
      else return r.fulfill({ status: 400, json: { message: `RPC sintetis belum dibuat: ${name}` }, headers });
      return r.fulfill({ json: data, headers });
    }
    if (u.origin === origin) {
      if (u.pathname.startsWith('/api/') && !u.pathname.startsWith('/api/_nuxt_icon/')) return r.fulfill({ status: 404, json: { error: 'API ditahan saat QA sintetis' } });
      return r.continue();
    }
    return r.abort();
  });
  await page.goto(`${base}/console/cashflow/pengguna`, { waitUntil: 'domcontentloaded' });
  const table = () => page.locator('.ca-daftar-pengguna table');
  const rowCount = () => table().locator('tbody tr').count();
  const emailSort = () => table().getByRole('button', { name: 'Email', exact: true });
  const settled = () => page.waitForFunction(() => !!document.querySelector('.ca-daftar-pengguna table') && document.querySelector('.ca-daftar-pengguna [aria-busy="true"]') === null);
  const waitRequest = async (previous) => { for (let i = 0; i < 100 && requests.length <= previous; i++) await page.waitForTimeout(20); assert.ok(requests.length > previous, 'Permintaan baru terkirim'); };
  const trace = async () => page.evaluate(() => {
    window.qaTable = document.querySelector('.ca-daftar-pengguna table'); window.qaFrames = []; window.qaTrace = true;
    const tick = () => { if (!window.qaTrace) return; const t = document.querySelector('.ca-daftar-pengguna table'); window.qaFrames.push({ connected: window.qaTable.isConnected, same: t === window.qaTable, rows: t?.querySelectorAll('tbody tr').length || 0, height: document.querySelector('.ca-daftar-pengguna')?.getBoundingClientRect().height || 0 }); requestAnimationFrame(tick); }; tick();
  });
  const endTrace = async () => { const f = await page.evaluate(() => { window.qaTrace = false; return window.qaFrames; }); frames.push(...f); return f; };
  await page.waitForFunction(() => document.querySelectorAll('.ca-daftar-pengguna tbody tr').length === 25);
  check('halaman awal 25 dari 97 pengguna', await page.getByText('97 pengguna', { exact: true }).isVisible());
  await table().locator('..').evaluate(el => { el.scrollTop = 180; });
  const scroll = await table().locator('..').evaluate(el => el.scrollTop);
  held = true; await trace(); let n = requests.length; await emailSort().click(); await waitRequest(n); await page.waitForTimeout(150);
  if (process.env.EXPECT_GLITCH === '1') {
    const gone = await table().count() === 0;
    await page.screenshot({ path: join(output, 'sebelum-sort.png') });
    const f = await endTrace();
    await writeFile(join(output, 'sebelum.json'), JSON.stringify({ glitch: gone, missingFrames: f.filter(x => !x.connected || !x.rows).length, frames: f.length }, null, 2));
    assert.ok(gone, 'Bug tabel hilang berhasil direproduksi'); console.log('Reproduksi: tabel hilang selama sort, sebelum hasil baru tiba.');
  } else {
    check('baris dan tabel tetap tampil selama sort', await rowCount() === 25 && await table().evaluate(el => el === window.qaTable));
    check('fokus sort tidak hilang', await emailSort().evaluate(el => el === document.activeElement));
    check('paginasi tetap terpasang saat memuat', await page.getByText('Halaman 1 dari 4', { exact: true }).isVisible());
    check('baris lama tidak menerima aksi selama pembaruan', await table().locator('tbody').evaluate(el => el.inert));
    await page.screenshot({ path: join(output, 'sesudah-sort-memuat.png') });
    release(); await settled();
    check('hasil sort diterapkan', await table().locator('tbody tr').first().getByRole('link').getAttribute('href') === '/console/cashflow/pengguna/00000000-0000-4000-8000-000000000001');
    const stable = await endTrace();
    check('tidak ada bingkai tabel kosong atau berganti elemen', stable.every(f => f.connected && f.same && f.rows === 25));
    check('tinggi tabel tidak runtuh', Math.max(...stable.map(f => f.height)) - Math.min(...stable.map(f => f.height)) < 1);
    check('posisi gulir tabel bertahan saat sort', await table().locator('..').evaluate(el => el.scrollTop) === scroll);
    // Dua sort bersamaan, jawaban lama sengaja datang paling akhir.
    n = requests.length; await emailSort().click(); await waitRequest(n);
    n = requests.length; await emailSort().click(); await waitRequest(n);
    release(1); await settled(); release(0); await page.waitForTimeout(150);
    check('jawaban sort lama tidak menimpa hasil terbaru', (await table().locator('tbody tr').first().getByRole('link').getAttribute('href')).endsWith('000000000001'));
    n = requests.length; await page.getByRole('button', { name: 'Berikutnya', exact: true }).click(); await waitRequest(n);
    check('paginasi tetap berisi baris lama saat menunggu', await rowCount() === 25 && await page.getByText('Halaman 1 dari 4', { exact: true }).isVisible());
    release(); await settled(); check('halaman kedua benar', await page.getByText('Halaman 2 dari 4', { exact: true }).isVisible() && (await table().locator('tbody tr').first().getByRole('link').getAttribute('href')).endsWith('000000000026'));
    n = requests.length; await page.getByRole('switch', { name: 'Kontak lengkap' }).click(); await waitRequest(n);
    check('kontak tersamar tetap tampil saat pembukaan menunggu', await rowCount() === 25 && !(await table().innerText()).includes('orang026@contoh.invalid'));
    release(); await settled(); check('kontak lengkap diperbarui tanpa menghilangkan tabel', await table().getByText('orang026@contoh.invalid', { exact: true }).isVisible());
    // Menutup kontak tetap tersedia meskipun sort berisi kontak utuh sedang berjalan.
    n = requests.length; await emailSort().click(); await waitRequest(n);
    n = requests.length; await page.getByRole('switch', { name: 'Kontak lengkap' }).click(); await waitRequest(n);
    check('menutup kontak segera menyamarkan baris', await rowCount() === 25 && !(await table().innerText()).includes('orang026@contoh.invalid'));
    release(); await page.waitForTimeout(100);
    check('jawaban kontak lama tidak membuka data kembali', !(await table().innerText()).includes('orang026@contoh.invalid'));
    release(); await settled();
    await page.clock.install();
    n = requests.length; await page.getByRole('switch', { name: 'Kontak lengkap' }).click(); await waitRequest(n);
    await page.clock.fastForward(31 * 60 * 1000); release(); await settled();
    check('jawaban kontak setelah alasan kedaluwarsa tetap tersamar', await page.getByRole('switch', { name: 'Kontak lengkap' }).getAttribute('aria-checked') === 'false' && !(await table().innerText()).includes('orang026@contoh.invalid'));
    failure = 500; n = requests.length; await emailSort().click(); await waitRequest(n); release();
    await page.getByRole('button', { name: 'Coba lagi', exact: true }).waitFor();
    check('gangguan jaringan mempertahankan tabel dengan penjelasan hasil lama', await rowCount() === 25 && await page.getByText('Perubahan belum diterapkan. Menampilkan hasil sebelumnya.', { exact: true }).isVisible());
    n = requests.length; await page.getByRole('button', { name: 'Coba lagi', exact: true }).click(); await waitRequest(n); release(); await settled(); check('coba lagi memulihkan hasil');
    n = requests.length; await page.getByRole('searchbox', { name: 'Cari email atau WhatsApp' }).fill('orang040'); await page.getByRole('button', { name: 'Cari', exact: true }).click(); await waitRequest(n);
    check('pencarian tidak mengosongkan tabel saat menunggu', await rowCount() === 25);
    release(); await settled(); check('pencarian mengganti hasil setelah siap', await rowCount() === 1 && await page.getByText('1 pengguna', { exact: true }).isVisible());
    n = requests.length; await page.getByRole('searchbox', { name: 'Cari email atau WhatsApp' }).fill('tidakada'); await page.getByRole('button', { name: 'Cari', exact: true }).click(); await waitRequest(n); release();
    await page.getByText('Tidak ada yang cocok dengan saringan.', { exact: true }).waitFor(); check('hasil kosong asli tampil setelah jawaban tiba');
    held = false; await page.getByRole('searchbox', { name: 'Cari email atau WhatsApp' }).fill(''); await page.getByRole('button', { name: 'Cari', exact: true }).click(); await settled();
    // Halaman ruang memakai DataTable bersama, tanpa pengosongan DTO di pemanggil.
    await page.goto(`${base}/console/cashflow/ruang`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 8);
    latency = 600; n = requests.length; await page.getByRole('button', { name: 'Pribadi', exact: true }).click(); await waitRequest(n);
    check('tabel bersama pada ruang tetap terlihat saat aksi filter', await page.locator('tbody tr').count() === 8);
    await page.waitForTimeout(700);
    await page.setViewportSize({ width: 390, height: 844 });
    check('tabel responsif tidak membuat halaman meluber', await page.evaluate(() => document.documentElement.scrollWidth <= 390));
    await page.screenshot({ path: join(output, 'ponsel.png') });
    latency = 20;
    await page.goto(`${base}/console/cashflow/pengguna?hal=999`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('.ca-daftar-pengguna tbody tr').length === 22);
    check('halaman di luar batas menunggu hasil halaman terakhir yang benar', await page.getByText('Halaman 4 dari 4', { exact: true }).isVisible() && new URL(page.url()).searchParams.get('hal') === '4');
    await page.goto(`${base}/console/cashflow/pengguna`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('.ca-daftar-pengguna tbody tr').length === 25);
    held = true; n = requests.length; await page.getByRole('switch', { name: 'Kontak lengkap' }).click(); await waitRequest(n); release(); await settled();
    failure = 42501; n = requests.length; await emailSort().click(); await waitRequest(n); release();
    await page.waitForFunction(() => document.querySelectorAll('.ca-daftar-pengguna tbody tr').length === 0);
    check('izin dicabut menghapus seluruh data lama', !(await page.locator('body').innerText()).includes('orang001@contoh.invalid') && await table().count() === 0);
    check('tanpa galat JavaScript', errors.length === 0);
    const result = { base, jenis: 'aplikasi lengkap, API sintetis, headless CDP', count: checks.length, checks, errors, tracedFrames: frames.length, missingFrames: frames.filter(x => !x.connected || !x.rows).length };
    await writeFile(join(output, 'hasil-browser.json'), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result, null, 2));
  }
} finally {
  held = false; while (pending.length) release();
  if (page) await page.waitForTimeout(30).catch(() => {});
  if (browser) try { await (await browser.newBrowserCDPSession()).send('Browser.close'); } catch { /* Chrome sudah berhenti. */ }
  chrome.kill(); await rm(dir, { recursive: true, force: true }).catch(() => {});
}
