// Uji tampilan OTP WhatsApp terbalik di console CashFlow dengan data sintetis:
// Kesehatan (kartu cara verifikasi dan pesan masuk) dan daftar pengguna (kolom
// dan saringan Status WhatsApp), untuk server baru dan server lama, terang dan
// gelap, lebar 1440 dan 390. Chrome headless lewat CDP, tanpa jendela.
//
// Jalankan server lokal TANPA .env (tidak ada kunci sungguhan):
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_URL=http://127.0.0.1:4398 \
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY=anon-sintetis \
//   npx nuxi dev --port 4399 --host 127.0.0.1
// lalu:
//   PLAYWRIGHT_CORE_PATH=<playwright-core/index.mjs> CF_QA_ARTIFACTS=<folder> \
//   node scripts/uji-console-otp-terbalik-headless.mjs
// CF_QA_TMP boleh menunjuk folder profil Chrome sementara (bawaan tmpdir).
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'
import { tmpdir, homedir } from 'node:os'
import { join } from 'node:path'

const pwPath = process.env.PLAYWRIGHT_CORE_PATH
const { chromium } = await (pwPath ? import(pathToFileURL(pwPath).href) : import('playwright-core'))
const output = process.env.CF_QA_ARTIFACTS || join(homedir(), 'Codex', 'artifact', 'coreasia')
const APP = process.env.CF_QA_APP || 'http://127.0.0.1:4399'
await mkdir(output, { recursive: true })
const portServer = createServer()
await new Promise(r => portServer.listen(0, '127.0.0.1', r))
const cdpPort = portServer.address().port
await new Promise(r => portServer.close(r))
const dir = await mkdtemp(join(process.env.CF_QA_TMP || tmpdir(), 'cf-otp-terbalik-'))
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--user-data-dir=${dir}`, `--remote-debugging-port=${cdpPort}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

// ── Data sintetis ────────────────────────────────────────────────────────
const jam = (h) => new Date(Date.now() - h * 3600e3).toISOString()
const waLama = () => ({
  sekarang: new Date().toISOString(),
  sesi: { status: 'connected', sejak: jam(30), dicek_pada: jam(0.03), galat: null },
  gangguan: ['kirim'], kirim_gangguan_sampai: null,
  otp: { aktif: true, wajib: true, darurat: false },
  batas: { terpakai_hari_ini: 14, harian: 300 },
  kiriman_24j: { diminta: 40, terkirim: 31, gagal: 9, tanpa_wa: 2, diketik: 24 },
  sebab_gagal_24j: [{ sebab: 'dibatasi', jumlah: 9 }],
  terkirim_terakhir: jam(0.2),
})
const waBaru = () => ({
  ...waLama(),
  mode: { mode: 'keduanya', uji_mode: 'terbalik', tujuan_tersamar: '0811 •••• 0000', balas: false, ambang_tak_masuk: 8, batas_harian_masuk: 500, tahan_kredit: true },
  lapis: { bersama: [], kirim: ['kirim'], masuk: [] },
  cara_sehat: ['terbalik'],
  masuk_sapa: { ada: true, aktif: true, tertahan: 1, tertua_detik: 45, terakhir_ok: jam(0.02), dicek_pada: jam(0.03) },
  masuk_24j: { dibuat: 52, pesan: 49, berhasil: 44, beda: 2, habis: 0, tanpa_nomor: 3, kedaluwarsa: 1, tak_dikenal: 1, batas: 0, lid: 3 },
  masuk_batas: { terpakai_hari_ini: 21, harian: 500 },
  jendela_7h: [
    { mulai: jam(1.5), selesai: null, lapis: ['kirim'], wajib: false },
    { mulai: jam(30), selesai: jam(27.5), lapis: ['kirim', 'tak_diketik', 'tak_masuk'], wajib: true },
    { mulai: jam(100), selesai: jam(99.8), lapis: ['sesi'], wajib: true },
  ],
  pengguna: { terverifikasi_masuk: 44, terverifikasi_kirim: 310, lewat_gangguan_7h: 6, kredit_ditahan: 4, nomor_ramai_30h: 1 },
})
const STATUS = ['masuk', 'kirim', 'lewat', 'lewat', 'belum', 'kirim', 'masuk', 'belum']
const baris = (i, baru, alasan) => {
  const s = STATUS[i % STATUS.length]
  const dasar = {
    user_id: `00000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
    email: alasan ? `orang${i + 1}@contoh.invalid` : 'ora***@contoh.invalid', display_name: '',
    created_at: jam(24 * (i + 1)), last_sign_in: jam(5 * (i + 1)), aktivitas_terakhir: jam(4 * (i + 1)), banned_until: null,
    jumlah_ruang: i % 3, jumlah_tx: i * 7, jumlah_nominal: i * 125000, terbuka: !!alasan, menunggu_hapus: false,
    nomor_wa: s === 'masuk' || s === 'kirim' ? `0811 •••• ${String(1000 + i).slice(-4)}` : null,
    versi_aplikasi: i % 2 ? '1.4.0' : '1.4.1', platform: 'android',
  }
  if (!baru) return dasar
  return {
    ...dasar, status_wa: s,
    status_wa_pada: s === 'belum' ? null : jam(24 * (i + 1)),
    lewat_sebab: s === 'lewat' ? (i % 2 ? 'tanpa_nomor' : 'gangguan') : null,
    nomor_ramai: s === 'masuk' || s === 'kirim' ? i === 1 : null,
    kredit_ditahan: s === 'lewat' && i === 2,
  }
}

let browser
const hasil = {}
try {
  for (let i = 0; i < 100; i++) { try { const r = await fetch(`http://127.0.0.1:${cdpPort}/json/version`); if (r.ok) break } catch { /* Chrome belum siap. */ } await new Promise(r => setTimeout(r, 100)) }
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`)
  const ctx = browser.contexts()[0]
  const page = ctx.pages()[0]
  const jwt = ['eyJhbGciOiJub25lIn0', Buffer.from(JSON.stringify({ sub: '00000000-0000-0000-0000-000000000001', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'test'].join('.')
  const session = { access_token: jwt, refresh_token: 'test-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user: { id: '00000000-0000-0000-0000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'admin@contoh.invalid' } }
  await ctx.addInitScript(({ session }) => {
    if (location.protocol !== 'http:') return
    sessionStorage.setItem('cf-console-sesi', JSON.stringify(session))
    sessionStorage.setItem('cf_izin', JSON.stringify(['cashflow:view', 'cashflow:pii', 'cashflow:investigasi', 'cashflow:tindak', 'cashflow:ekspor']))
    // Panel devtools server dev menutupi isi tangkapan layar.
    addEventListener('DOMContentLoaded', () => {
      const gaya = document.createElement('style')
      gaya.textContent = '[id^="nuxt-devtools"]{display:none!important}'
      document.head.append(gaya)
    })
  }, { session })
  // Tidak ada akses ke layanan luar atau gateway sungguhan.
  await ctx.route('**/*', (route) => {
    const u = new URL(route.request().url())
    return u.hostname === '127.0.0.1' && ['4398', '4399'].includes(u.port) ? route.continue() : route.abort()
  })
  await page.route('**/api/gw/**', r => r.fulfill({ status: 404, json: { error: 'gateway sintetis' } }))
  await page.route('**/api/gw/admin/auth/me', r => r.fulfill({ json: { data: { id: 'admin-test', email: 'admin@contoh.invalid', full_name: 'Admin Contoh', role: 'super_admin', is_active: true, mfa: true, mfa_at: new Date().toISOString(), totp_enabled_at: '2026-01-01T00:00:00Z' } } }))

  let baru = true
  const seen = []
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  const cors = { 'access-control-allow-origin': '*' }
  await page.route('http://127.0.0.1:4398/**', async (r) => {
    const req = r.request()
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' } })
    const name = new URL(req.url()).pathname.split('/').pop()
    const p = req.postDataJSON() || {}
    seen.push({ name, p })
    let data = {}
    if (name === 'admin_wa_status') data = baru ? waBaru() : waLama()
    else if (name === 'admin_daftar_pengguna_v3') {
      const asing = p.p_segmen === 'belum_wa' || (p.p_filter && 'status_wa' in p.p_filter)
      if (!baru && asing) return r.fulfill({ status: 400, headers: cors, json: { code: '22023', message: 'Saringan tidak dikenal.', hint: 'saringan' } })
      let rows = Array.from({ length: 8 }, (_, i) => baris(i, baru, p.p_alasan))
      if (p.p_segmen === 'belum_wa') rows = rows.filter(x => x.status_wa === 'lewat' || x.status_wa === 'belum')
      if (p.p_filter?.status_wa) rows = rows.filter(x => x.status_wa === p.p_filter.status_wa)
      data = { total: rows.length, baris: rows.map(x => ({ ...x, total_semua: rows.length })), versi_terbaru: { android: '0001000400010000100000' }, hapus_tersedia: true }
    } else if (name === 'admin_kesehatan') data = { ukuran_db: 15482880, tabel: { transactions: { baris: 4210, ukuran: 1638400 } } }
    else if (name === 'admin_foto_yatim' || name === 'admin_ocr_ringkas' || name === 'admin_telemetri_ringkas') data = []
    else if (name === 'admin_versi_aplikasi') data = { hari: 30, aktif: 0, aktif_luar: 0, diketahui: 0, diketahui_luar: 0, baris: [], tertinggi: [], konfig: { versi_android: null, versi_android_uat: null, versi_android_ias: null } }
    else if (name === 'admin_ajakan_pembaruan') data = { hari: 30, baris: [], ringkas: [], sampai: [] }
    else if (name === 'admin_stats') data = { total_pengguna: 8, total_ruang: 3, total_transaksi: 120, transaksi_per_hari: [] }
    else if (name === 'admin_ukuran_keberhasilan_v2') data = [{ jumlah: 5, pembanding: 4, jumlah_pengecualian: 0 }]
    else if (name === 'admin_corong_aktivasi' || name === 'admin_retensi') data = []
    return r.fulfill({ json: data, headers: cors })
  })

  const tema = async (t) => {
    await ctx.clearCookies()
    await ctx.addCookies([{ name: 'coreasia-theme', value: t, domain: '127.0.0.1', path: '/' }])
  }
  const lebar = async (w) => { await page.setViewportSize({ width: w, height: w > 500 ? 900 : 844 }); await page.waitForTimeout(250) }
  const meluber = () => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  const potret = async (nama) => { await page.screenshot({ path: join(output, `${nama}.png`), fullPage: true }) }
  const gagal = (pesan) => { throw new Error(pesan) }

  // 1. Kesehatan, server baru: terang dan gelap, 1440 dan 390.
  for (const t of ['terang', 'gelap']) {
    await tema(t === 'terang' ? 'light' : 'dark')
    await lebar(1440)
    await page.goto(`${APP}/console/cashflow/kesehatan`, { waitUntil: 'domcontentloaded' })
    await page.getByText('Cara verifikasi WhatsApp', { exact: true }).waitFor({ timeout: 60000 })
    for (const teks of ['Sebagian terganggu', 'Tahan kredit gratis saat gangguan', 'Pesan masuk 24 jam', 'Gangguan 7 hari terakhir', 'Penerus pesan masuk di Sapa', 'Lewat saat gangguan, 7 hari', 'Banyak kode gagal terkirim dalam 15 menit terakhir.']) {
      if (!(await page.getByText(teks, { exact: true }).first().isVisible())) gagal(`Kesehatan baru: "${teks}" tidak tampil`)
    }
    if (await page.getByText('tak_masuk', { exact: true }).count()) gagal('Kode lapis mentah tampil')
    await potret(`kesehatan-baru-${t}-1440`)
    await lebar(390)
    if (await meluber()) gagal(`Kesehatan baru ${t} meluber di 390`)
    await potret(`kesehatan-baru-${t}-390`)
  }
  hasil.kesehatanBaru = 'lulus'

  // 2. Kesehatan, server lama: kartu baru tidak ada, kartu lama tetap.
  baru = false
  await tema('light')
  await lebar(1440)
  await page.goto(`${APP}/console/cashflow/kesehatan`, { waitUntil: 'domcontentloaded' })
  await page.getByText('Kiriman 24 jam', { exact: true }).waitFor({ timeout: 60000 })
  if (await page.getByText('Cara verifikasi WhatsApp', { exact: true }).count()) gagal('Server lama: kartu cara verifikasi tampil')
  if (!(await page.getByText('Ada gangguan', { exact: true }).isVisible())) gagal('Server lama: keadaan gangguan tidak tampil')
  await potret('kesehatan-lama-terang-1440')
  hasil.kesehatanLama = 'lulus'

  // 3. Daftar pengguna, server baru.
  baru = true
  for (const t of ['terang', 'gelap']) {
    await tema(t === 'terang' ? 'light' : 'dark')
    await lebar(1440)
    await page.goto(`${APP}/console/cashflow/pengguna`, { waitUntil: 'domcontentloaded' })
    await page.getByText('8 pengguna', { exact: true }).waitFor({ timeout: 60000 })
    await page.locator('th', { hasText: 'Status WhatsApp' }).waitFor()
    for (const teks of ['Terverifikasi lewat pesan masuk', 'Terverifikasi lewat kode terkirim', 'Lewat saat gangguan', 'Lewat, nomor tidak terbaca', 'Nomor dipakai banyak akun', 'Kredit gratis ditahan']) {
      if (!(await page.locator('table').getByText(teks, { exact: true }).first().isVisible())) gagal(`Daftar baru: "${teks}" tidak tampil`)
    }
    await potret(`pengguna-baru-${t}-1440`)
    // Di 1440 sepuluh kolom muat tanpa gulir samping di dalam bingkai tabel.
    if (await page.locator('.ca-console-table-wrap').evaluate(w => w.scrollWidth > w.clientWidth)) gagal(`Tabel ${t} bergulir samping di 1440`)
    // Di 1280 tabel boleh bergulir di dalam bingkainya (sudah begitu sebelum
    // kolom ini), tapi kolom email tidak boleh lebih sempit dari sebelumnya (97 px).
    await lebar(1280)
    const email = await page.locator('tbody tr').first().locator('td').first().evaluate(td => td.getBoundingClientRect().width)
    if (email < 95) gagal(`Kolom email ${t} di 1280 hanya ${Math.round(email)} px`)
    hasil[`gulirTabel1280_${t}`] = await page.locator('.ca-console-table-wrap').evaluate(w => w.scrollWidth - w.clientWidth)
    if (await meluber()) gagal(`Daftar baru ${t} meluber di 1280`)
    if (t === 'terang') await potret('pengguna-baru-terang-1280')
    await lebar(390)
    if (await meluber()) gagal(`Daftar baru ${t} meluber di 390`)
    await potret(`pengguna-baru-${t}-390`)
  }
  await lebar(1440)
  await page.getByRole('button', { name: 'Belum WhatsApp', exact: true }).click()
  await page.waitForFunction(() => location.search.includes('seg=belum_wa'))
  await page.getByText('4 pengguna', { exact: true }).waitFor()
  if (seen.filter(x => x.name === 'admin_daftar_pengguna_v3').at(-1)?.p.p_segmen !== 'belum_wa') gagal('Segmen belum_wa tidak dikirim')
  await potret('pengguna-baru-belum-wa-gelap-1440')
  await page.getByRole('button', { name: 'Semua', exact: true }).click()
  await page.getByText('8 pengguna', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Filter Status WhatsApp', exact: true }).click()
  await page.locator('th').getByRole('button', { name: 'Terverifikasi lewat pesan masuk', exact: true }).click()
  await page.getByText('2 pengguna', { exact: true }).waitFor({ timeout: 10000 })
  const saring = seen.filter(x => x.name === 'admin_daftar_pengguna_v3').at(-1)?.p
  if (saring?.p_filter?.status_wa !== 'masuk') gagal(`Saringan status_wa tidak dikirim: ${JSON.stringify(saring?.p_filter)}`)
  hasil.penggunaBaru = 'lulus'

  // 4. Daftar pengguna, server lama: kolom kosong, saringan baru tidak ditawarkan.
  baru = false
  await tema('light')
  await page.goto(`${APP}/console/cashflow/pengguna`, { waitUntil: 'domcontentloaded' })
  await page.getByText('8 pengguna', { exact: true }).waitFor({ timeout: 60000 })
  if (await page.getByRole('button', { name: 'Belum WhatsApp', exact: true }).count()) gagal('Server lama: segmen Belum WhatsApp tampil')
  if (await page.getByRole('button', { name: 'Filter Status WhatsApp', exact: true }).count()) gagal('Server lama: saringan Status WhatsApp tampil')
  if (await page.locator('table').getByText('Terverifikasi lewat pesan masuk', { exact: true }).count()) gagal('Server lama: status tampil tanpa data')
  await potret('pengguna-lama-terang-1440')
  // URL lama berisi seg=belum_wa: server menolak, console kembali ke Semua.
  const sebelum = seen.length
  await page.goto(`${APP}/console/cashflow/pengguna?seg=belum_wa`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => !location.search.includes('belum_wa'), null, { timeout: 30000 })
  await page.getByText('8 pengguna', { exact: true }).waitFor({ timeout: 30000 })
  const tolak = seen.slice(sebelum).filter(x => x.name === 'admin_daftar_pengguna_v3').map(x => x.p.p_segmen)
  if (tolak[0] !== 'belum_wa' || tolak.at(-1) !== 'semua') gagal(`Server lama: urutan segmen ${JSON.stringify(tolak)}`)
  if (await page.getByRole('alert').count()) gagal('Server lama: galat tampil padahal saringan bisa dilepas')
  hasil.penggunaLama = 'lulus'

  // 5. Ringkasan memakai kartu ringkas tanpa kartu baru.
  baru = true
  await page.goto(`${APP}/console/cashflow`, { waitUntil: 'domcontentloaded' })
  await page.getByText('Sebagian terganggu', { exact: true }).waitFor({ timeout: 60000 })
  if (await page.getByText('Cara verifikasi WhatsApp', { exact: true }).count()) gagal('Ringkasan memuat kartu cara verifikasi')
  await potret('ringkasan-baru-terang-1440')
  hasil.ringkasan = 'lulus'

  if (errors.length) gagal(`Galat browser: ${errors.join('; ')}`)
  console.log(JSON.stringify({ ...hasil, errors }))
} finally {
  if (browser) try { const s = await browser.newBrowserCDPSession(); await s.send('Browser.close') } catch { /* Chrome sudah tertutup. */ }
  chrome.kill()
  await rm(dir, { recursive: true, force: true }).catch(() => {})
}
