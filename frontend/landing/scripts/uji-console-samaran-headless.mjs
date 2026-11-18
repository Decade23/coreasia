// Uji tampilan buka samaran console CashFlow (spek console laporan 19 Nov 2026,
// T1: SM-01 sampai SM-04, TP-01 sampai TP-05) dengan data sintetis
// scripts/data-sintetis-console.mjs. Chrome headless lewat CDP, tanpa jendela.
//
// Yang dituntut:
//   SM-01  daftar Ruang v3: sesi ber-pii mengirim alasan tetap dan nama, email,
//          serta nama pemilik tampil utuh. Tanpa pii tersamar dan tanpa alasan.
//          Server lama (tanpa v3) jatuh ke v2 tanpa galat.
//   SM-02  klik baris (dan kartu ponsel) membuka Ruang 360.
//   SM-03  Ruang 360 memanggil admin_ruang_360_v2: pemilik di kepala, email
//          anggota, bekas anggota, dan undangan utuh.
//   SM-04  kepala Pengguna 360 memanggil admin_pengguna_kepala_v2 dengan alasan:
//          email, nama tampilan, dan waktu ber-detik.
//   TP-01  tabel Pengguna memuat semua kolom v5 (18 kepala).
//   TP-02  setiap kepala kolom bisa diklik dan mengirim p_urut kolom itu.
//   TP-03  waktu "19 Nov 2026 14.05.09" saat kontak dibuka, tanggal saja bila tidak.
//   TP-04  kolom pertama lengket, tabel bergulir ke samping di dalam bingkainya,
//          halaman tidak meluber di 1440 maupun 390.
//   TP-05  kolom Sumber berisi asal pengguna.
//
// Jalankan server lokal TANPA .env (tidak ada kunci sungguhan):
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_URL=http://127.0.0.1:4398 \
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY=anon-sintetis \
//   npx nuxi dev --port 4399 --host 127.0.0.1
// lalu:
//   PLAYWRIGHT_CORE_PATH=<playwright-core/index.mjs> CF_QA_ARTIFACTS=<folder> \
//   node scripts/uji-console-samaran-headless.mjs
// CF_QA_APP dan CF_QA_SUPABASE mengganti alamat bawaan di atas.
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'
import { tmpdir, homedir } from 'node:os'
import { join } from 'node:path'
import { AKUN, EMAIL_PANJANG, SAAT, U, W, uuid, buatServer } from './data-sintetis-console.mjs'

const pwPath = process.env.PLAYWRIGHT_CORE_PATH
const { chromium } = await (pwPath ? import(pathToFileURL(pwPath).href) : import('playwright-core'))
const output = process.env.CF_QA_ARTIFACTS || join(homedir(), 'Codex', 'artifact', 'coreasia')
const APP = process.env.CF_QA_APP || 'http://127.0.0.1:4399'
const SUPABASE = process.env.CF_QA_SUPABASE || 'http://127.0.0.1:4398'
const PORT_BOLEH = [new URL(APP).port, new URL(SUPABASE).port]
await mkdir(output, { recursive: true })
const portServer = createServer()
await new Promise(r => portServer.listen(0, '127.0.0.1', r))
const cdpPort = portServer.address().port
await new Promise(r => portServer.close(r))
const dir = await mkdtemp(join(process.env.CF_QA_TMP || tmpdir(), 'cf-samaran-'))
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--user-data-dir=${dir}`, `--remote-debugging-port=${cdpPort}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

const C = '/console/cashflow'
const ALASAN_RUANG = '[admin@contoh.invalid] Nama ruang dan pemilik lengkap di daftar Ruang Console'
const ALASAN_KEPALA = '[admin@contoh.invalid] Kepala Pengguna 360 lengkap di Console'
const KOLOM = ['Pengguna', 'Nama', 'WhatsApp', 'Status WhatsApp', 'Versi', 'Status', 'Daftar', 'Masuk terakhir', 'Aktif terakhir',
  'Ruang', 'Transaksi', 'Total nominal', 'Tanya Domi', 'Domi 30 hari', 'Terakhir pakai Domi', 'Sisa kredit', 'Kredit dibeli', 'Sumber']
const URUT_KOLOM = ['email', 'nama', 'wa', 'status_wa', 'versi', 'status', 'daftar', 'masuk', 'aktif',
  'ruang', 'tx', 'nominal', 'domi', 'domi_30', 'domi_terakhir', 'kredit', 'kredit_beli', 'sumber']
const POLA_DETIK = /^\d{1,2} [A-Z][a-z]{2} \d{4} \d{2}\.\d{2}\.\d{2}$/
const POLA_TANGGAL = /^\d{1,2} [A-Z][a-z]{2} \d{4}$/

const server = buatServer()
const IZIN_PENUH = ['cashflow:view', 'cashflow:pii', 'cashflow:investigasi', 'cashflow:tindak', 'cashflow:ekspor']
const mode = { kosong: false, izin: true, belumAda: null }
const seen = []
const hasil = {}
const gagal = (pesan) => { throw new Error(pesan) }

let browser
try {
  for (let i = 0; i < 100; i++) { try { const r = await fetch(`http://127.0.0.1:${cdpPort}/json/version`); if (r.ok) break } catch { /* Chrome belum siap. */ } await new Promise(r => setTimeout(r, 100)) }
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`)
  const ctx = browser.contexts()[0]
  const page = ctx.pages()[0]
  const masa = Math.floor(SAAT / 1000) + 86_400
  const jwt = ['eyJhbGciOiJub25lIn0', Buffer.from(JSON.stringify({ sub: uuid(900), role: 'authenticated', exp: masa })).toString('base64url'), 'test'].join('.')
  const session = { access_token: jwt, refresh_token: 'test-refresh', expires_at: masa, expires_in: 86_400, token_type: 'bearer', user: { id: uuid(900), aud: 'authenticated', role: 'authenticated', email: 'admin@contoh.invalid' } }
  await ctx.addInitScript(({ session, saat }) => {
    if (location.protocol !== 'http:') return
    const Asli = Date
    function Beku(...a) {
      if (!new.target) return new Asli(saat).toString()
      return a.length ? new Asli(...a) : new Asli(saat)
    }
    Beku.prototype = Asli.prototype
    Beku.now = () => saat
    Beku.parse = Asli.parse
    Beku.UTC = Asli.UTC
    window.Date = Beku
    sessionStorage.setItem('cf-console-sesi', JSON.stringify(session))
    addEventListener('DOMContentLoaded', () => {
      const gaya = document.createElement('style')
      gaya.textContent = '[id^="nuxt-devtools"]{display:none!important}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
      document.head.append(gaya)
    })
  }, { session, saat: SAAT })
  const pasangIzin = async (izin) => {
    await ctx.addInitScript((izin) => { if (location.protocol === 'http:') sessionStorage.setItem('cf_izin', JSON.stringify(izin)) }, izin)
  }
  await pasangIzin(IZIN_PENUH)
  await ctx.route('**/*', (route) => {
    const u = new URL(route.request().url())
    return u.hostname === '127.0.0.1' && PORT_BOLEH.includes(u.port) ? route.continue() : route.abort()
  })
  const saatIso = new Date(SAAT - 60_000).toISOString()
  const me = () => ({ data: {
    id: 'admin-test', email: 'admin@contoh.invalid', full_name: 'Admin Contoh', role: 'super_admin', is_active: true, created_at: '2026-01-01T00:00:00Z',
    mfa: mode.izin, mfa_at: mode.izin ? saatIso : null, totp_enabled_at: mode.izin ? '2026-01-01T00:00:00Z' : null, totp_enabled: mode.izin,
  } })
  await page.route('**/api/gw/**', r => r.fulfill({ status: 404, json: { error: 'gateway sintetis' } }))
  await page.route('**/api/gw/admin/auth/me', r => r.fulfill({ json: me() }))
  const errors = []
  page.on('pageerror', e => errors.push(`${new URL(page.url()).pathname}: ${e.message}`))
  const cors = { 'access-control-allow-origin': '*' }
  await page.route(`${SUPABASE}/**`, async (r) => {
    const req = r.request()
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' } })
    const nama = new URL(req.url()).pathname.split('/').pop()
    let p = {}
    try { p = req.postDataJSON() || {} } catch { /* Badan bukan JSON. */ }
    seen.push({ nama, p })
    const j = server.jawab(nama, p, mode)
    return r.fulfill({ status: j.status ?? 200, headers: cors, json: j.json })
  })

  const tema = async (t) => {
    await ctx.clearCookies()
    await ctx.addCookies([{ name: 'coreasia-theme', value: t === 'terang' ? 'light' : 'dark', domain: '127.0.0.1', path: '/' }])
  }
  const lebar = async (w) => { await page.setViewportSize({ width: w, height: w > 500 ? 900 : 844 }); await page.waitForTimeout(250) }
  const meluber = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  const potret = async (nama, { penuh = true } = {}) => {
    await page.evaluate(() => { document.activeElement?.blur?.() })
    await page.waitForTimeout(400)
    await page.screenshot({ path: join(output, `${nama}.png`), fullPage: penuh })
  }
  const buka = async (jalur) => {
    await page.goto(`${APP}${jalur}`, { waitUntil: 'domcontentloaded' })
    await page.locator('h1').first().waitFor({ timeout: 60000 })
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(500)
  }
  const terakhir = (nama) => seen.filter(x => x.nama === nama).at(-1)
  const tunggu = async (nama, cocok) => {
    for (let i = 0; i < 80; i++) { const t = terakhir(nama); if (t && cocok(t.p)) return t; await page.waitForTimeout(100) }
    return null
  }

  // Pemanasan: server dev Vite menyiapkan modul pada muatan pertama (galat impor dinamis sekali jalan).
  await buka(`${C}/ruang`).catch(() => {})
  await page.waitForTimeout(1500)
  errors.length = 0
  seen.length = 0

  // ── SM-01, SM-02: daftar Ruang v3 ─────────────────────────────────────
  for (const t of ['terang', 'gelap']) {
    await tema(t)
    await lebar(1440)
    await buka(`${C}/ruang`)
    await page.locator('.ca-console-main table').getByText('Toko Berkah Jaya Abadi Sentosa Makmur Cabang Pasar Baru', { exact: true }).waitFor({ timeout: 30000 })
    const v3 = terakhir('admin_daftar_ruang_v3')
    if (!v3) gagal('Ruang: v3 tidak dipanggil')
    if (v3.p.p_alasan !== ALASAN_RUANG) gagal(`Ruang: alasan ${v3.p.p_alasan}`)
    if (seen.some(x => x.nama === 'admin_daftar_ruang_v2')) gagal('Ruang: v2 dipanggil padahal v3 ada')
    for (const teks of ['sari@contoh.invalid', 'Sari Wulandari', 'Keluarga Wulandari']) {
      if (!(await page.locator('.ca-console-main table').getByText(teks, { exact: true }).first().isVisible())) gagal(`Ruang ${t}: "${teks}" tidak tampil utuh`)
    }
    if (await page.locator('.ca-console-main table').getByText('***', { exact: false }).count()) gagal(`Ruang ${t}: masih ada bentuk tersamar`)
    if (!(await page.locator('[data-uji="sakelar-kontak"]').getAttribute('aria-checked') === 'true')) gagal('Ruang: sakelar kontak tidak menyala')
    if (await meluber()) gagal(`Ruang ${t}: halaman meluber di 1440`)
    await potret(`sm01-ruang-utuh-${t}-1440`)
    if (t === 'terang') {
      // Urut per kolom di server: kepala Nama mengirim nama naik, klik lagi turun.
      await page.locator('.ca-console-main thead').getByRole('button', { name: 'Nama', exact: true }).click()
      if (!(await tunggu('admin_daftar_ruang_v3', p => p.p_urut === 'nama' && p.p_arah === 'asc'))) gagal('Ruang: kepala Nama tidak mengurutkan')
      await page.waitForTimeout(400)
      const pertama = await page.locator('.ca-console-main tbody tr').first().innerText()
      if (!pertama.startsWith('Arisan Ibu RT 05')) gagal(`Ruang: urut nama naik, baris pertama ${pertama.slice(0, 40)}`)
      for (const [kepala, urut] of [['Pemilik', 'pemilik'], ['Anggota', 'anggota'], ['Transaksi', 'tx'], ['Dibuat', 'dibuat']]) {
        await page.locator('.ca-console-main thead').getByRole('button', { name: kepala, exact: true }).click()
        if (!(await tunggu('admin_daftar_ruang_v3', p => p.p_urut === urut))) gagal(`Ruang: kepala ${kepala} tidak mengurutkan`)
      }
      hasil.ruangUrut = 'nama, pemilik, anggota, tx, dibuat'
      // SM-02: klik baris membuka Ruang 360.
      await page.locator('.ca-console-main tbody tr').first().locator('td').nth(3).click()
      await page.waitForURL(u => /\/console\/cashflow\/ruang\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 15000 })
      hasil.barisKe360 = new URL(page.url()).pathname
      // Cari nilai asli saat dibuka.
      await buka(`${C}/ruang`)
      await page.locator('input[type="search"]').first().fill('Arisan')
      if (!(await tunggu('admin_daftar_ruang_v3', p => p.p_cari === 'Arisan' && p.p_alasan === ALASAN_RUANG))) gagal('Ruang: cari tidak dikirim ke v3 dengan alasan')
      await page.locator('.ca-console-main table').getByText('Arisan Ibu RT 05', { exact: true }).waitFor()
      await page.locator('input[type="search"]').first().fill('')
      await page.waitForTimeout(700)
    }
    await lebar(390)
    if (await meluber()) gagal(`Ruang ${t}: halaman meluber di 390`)
    await potret(`sm01-ruang-utuh-${t}-390`)
    if (t === 'terang') {
      await page.locator('[data-uji="ruang-kartu-buka"]').first().click()
      await page.waitForURL(u => /\/console\/cashflow\/ruang\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 15000 })
      hasil.kartuKe360 = new URL(page.url()).pathname
    }
  }
  // Sakelar dimatikan: tersamar lagi, tanpa alasan.
  await tema('terang')
  await lebar(1440)
  await buka(`${C}/ruang`)
  await page.locator('.ca-console-main table').getByText('Keluarga Wulandari', { exact: true }).waitFor()
  await page.locator('[data-uji="sakelar-kontak"]').click()
  if (!(await tunggu('admin_daftar_ruang_v3', p => p.p_alasan === null))) gagal('Ruang: sakelar mati masih mengirim alasan')
  await page.locator('.ca-console-main table').getByText('sar***@contoh.invalid', { exact: true }).waitFor({ timeout: 15000 })
  if (await page.locator('.ca-console-main table').getByText('Keluarga Wulandari', { exact: true }).count()) gagal('Ruang: nama utuh masih tampil sesudah sakelar mati')
  await potret('sm01-ruang-sakelar-mati-terang-1440')
  await page.locator('[data-uji="sakelar-kontak"]').click()
  if (!(await tunggu('admin_daftar_ruang_v3', p => p.p_alasan === ALASAN_RUANG))) gagal('Ruang: sakelar hidup lagi tidak mengirim alasan')
  // Server lama: v3 belum ada, jatuh ke v2 tersamar tanpa galat.
  mode.belumAda = ['admin_daftar_ruang_v3']
  await page.evaluate(() => sessionStorage.clear())
  await buka(`${C}/ruang`)
  await page.locator('.ca-console-main table').getByText('sar***@contoh.invalid', { exact: true }).first().waitFor({ timeout: 30000 })
  if (!terakhir('admin_daftar_ruang_v2')) gagal('Ruang server lama: v2 tidak dipanggil')
  if (await page.getByRole('alert').count()) gagal('Ruang server lama: ada galat')
  await potret('sm01-ruang-server-lama-terang-1440')
  mode.belumAda = null
  hasil.ruang = 'lulus'

  // ── SM-03: Ruang 360 v2 ───────────────────────────────────────────────
  await buka(`${C}/ruang/${W}/anggota`)
  await page.locator('[data-uji="anggota-email"]').first().waitFor({ timeout: 30000 })
  if (!terakhir('admin_ruang_360_v2')) gagal('Ruang 360: v2 tidak dipanggil')
  const emailAnggota = await page.locator('[data-uji="anggota-email"]').allInnerTexts()
  if (!emailAnggota.includes(AKUN[1].email) || emailAnggota.some(e => e.includes('***'))) gagal(`Ruang 360: email anggota ${emailAnggota}`)
  const emailBekas = await page.locator('[data-uji="bekas-email"]').allInnerTexts()
  if (!emailBekas.includes(AKUN[8].email)) gagal(`Ruang 360: email bekas ${emailBekas}`)
  const emailUndangan = await page.locator('[data-uji="undangan-email"]').allInnerTexts()
  if (!emailUndangan.includes('kasir.cabang.1.pasar.baru@contoh.invalid')) gagal(`Ruang 360: email undangan ${emailUndangan}`)
  const pemilik = (await page.locator('[data-uji="kepala-pemilik"]').innerText()).trim()
  if (!pemilik.startsWith(EMAIL_PANJANG)) gagal(`Ruang 360: pemilik di kepala ${pemilik}`)
  for (const t of ['terang', 'gelap']) {
    await tema(t)
    for (const w of [1440, 390]) {
      await lebar(w)
      await buka(`${C}/ruang/${W}/anggota`)
      await page.locator('[data-uji="anggota-email"]').first().waitFor({ timeout: 30000 })
      if (await meluber()) gagal(`Ruang 360 ${t} meluber di ${w}`)
      await potret(`sm03-ruang360-anggota-${t}-${w}`)
    }
  }
  await tema('terang')
  await lebar(1440)
  hasil.ruang360 = 'lulus'

  // ── SM-04: kepala Pengguna 360 v2 ─────────────────────────────────────
  await buka(`${C}/pengguna/${U}`)
  await page.locator('[data-uji="rinci-nama-tampilan"]').waitFor({ timeout: 30000 })
  const kv2 = terakhir('admin_pengguna_kepala_v2')
  if (!kv2 || kv2.p.p_alasan !== ALASAN_KEPALA) gagal(`Kepala: v2 tidak dipanggil dengan alasan (${kv2?.p.p_alasan})`)
  const namaKepala = (await page.locator('[data-uji="rinci-nama"]').innerText()).replace(/\s+/g, '')
  if (namaKepala !== EMAIL_PANJANG) gagal(`Kepala: email ${namaKepala}`)
  for (const s of ['rinci-daftar', 'rinci-masuk']) {
    const teks = (await page.locator(`[data-uji="${s}"]`).innerText()).trim()
    if (!POLA_DETIK.test(teks.replace(/ WIB$/, ''))) gagal(`Kepala: ${s} tanpa detik (${teks})`)
  }
  for (const w of [1440, 390]) {
    await lebar(w)
    if (await meluber()) gagal(`Kepala meluber di ${w}`)
    await potret(`sm04-kepala-pengguna-terang-${w}`)
  }
  await lebar(1440)
  // Tanpa pii: kepala v1, tersamar.
  mode.izin = false
  await pasangIzin(['cashflow:view'])
  const sebelum = seen.length
  await buka(`${C}/pengguna/${U}`)
  await page.locator('[data-uji="rinci-nama"]').waitFor({ timeout: 30000 })
  await page.waitForTimeout(800)
  if (seen.slice(sebelum).some(x => x.nama === 'admin_pengguna_kepala_v2')) gagal('Kepala tanpa pii: v2 dipanggil')
  if (!(await page.locator('[data-uji="rinci-nama"]').innerText()).includes('***')) gagal('Kepala tanpa pii: email tidak tersamar')
  await potret('sm04-kepala-pengguna-tanpa-pii-terang-1440')
  mode.izin = true
  await pasangIzin(IZIN_PENUH)
  hasil.kepala = 'lulus'

  // ── TP-01 sampai TP-05: tabel Pengguna v5 ─────────────────────────────
  const kepalaTabel = () => page.locator('[data-uji="tabel-pengguna"] thead th').evaluateAll(th => th.map(x => x.innerText.trim()))
  const wadah = page.locator('[data-uji="tabel-pengguna"] .ca-console-table-wrap')
  for (const t of ['terang', 'gelap']) {
    await tema(t)
    await lebar(1440)
    await buka(`${C}/pengguna`)
    await page.getByText(EMAIL_PANJANG, { exact: true }).first().waitFor({ timeout: 60000 })
    if (!terakhir('admin_daftar_pengguna_v5')) gagal('Pengguna: v5 tidak dipanggil')
    const kolom = await kepalaTabel()
    if (kolom.join('|') !== KOLOM.join('|')) gagal(`Pengguna ${t}: kolom ${kolom.join('|')}`)
    // TP-02: setiap kepala adalah tombol urut.
    const tombol = await page.locator('[data-uji="tabel-pengguna"] thead th').evaluateAll(th => th.map(x => !!x.querySelector('button')))
    if (tombol.some(x => !x)) gagal(`Pengguna ${t}: kepala tanpa tombol urut ${tombol}`)
    // TP-03: waktu ber-detik saat kontak dibuka.
    const waktu = await page.locator('[data-uji="sel-daftar"], [data-uji="sel-masuk"], [data-uji="sel-aktif"], [data-uji="sel-wa-pada"]').allInnerTexts()
    if (!waktu.length || waktu.some(x => !POLA_DETIK.test(x.trim()))) gagal(`Pengguna ${t}: waktu tanpa detik ${waktu.slice(0, 4)}`)
    hasil[`contohWaktu_${t}`] = waktu[0]
    // TP-05: kolom Sumber.
    const sumber = await page.locator('[data-uji="sel-sumber"]').allInnerTexts()
    if (!sumber.includes('Instagram') || !sumber.includes('WhatsApp atau teman')) gagal(`Pengguna ${t}: sumber ${sumber}`)
    // TP-04: tabel bergulir ke samping di dalam bingkainya, halaman tidak meluber, kolom pertama lengket.
    const ukur = await wadah.evaluate(w => ({ lebih: w.scrollWidth - w.clientWidth }))
    if (ukur.lebih <= 0) gagal(`Pengguna ${t}: tabel tidak bergulir (lebih ${ukur.lebih})`)
    if (await meluber()) gagal(`Pengguna ${t}: halaman meluber di 1440`)
    const kiri0 = await page.locator('[data-uji="tabel-pengguna"] tbody tr').first().locator('td').first().evaluate(td => Math.round(td.getBoundingClientRect().left))
    await potret(`tp-pengguna-kolom-${t}-1440`, { penuh: false })
    await wadah.evaluate(w => { w.scrollLeft = w.scrollWidth })
    await page.waitForTimeout(300)
    const lengket = await page.locator('[data-uji="tabel-pengguna"] tbody tr').first().locator('td').first().evaluate((td) => {
      const w = td.closest('.ca-console-table-wrap')
      return { kiri: Math.round(td.getBoundingClientRect().left), wadah: Math.round(w.getBoundingClientRect().left), gulir: Math.round(w.scrollLeft), posisi: getComputedStyle(td).position }
    })
    hasil[`lengket_${t}`] = lengket
    if (lengket.posisi !== 'sticky' || lengket.gulir <= 0 || Math.abs(lengket.kiri - kiri0) > 1) gagal(`Pengguna ${t}: kolom pertama tidak lengket ${JSON.stringify(lengket)} awal ${kiri0}`)
    await potret(`tp-pengguna-gulir-kanan-${t}-1440`, { penuh: false })
    await wadah.evaluate(w => { w.scrollLeft = 0 })
    await lebar(390)
    if (await meluber()) gagal(`Pengguna ${t}: halaman meluber di 390`)
    await potret(`tp-pengguna-${t}-390`)
  }
  await tema('terang')
  await lebar(1440)
  // TP-02: klik setiap kepala kolom mengirim p_urut kolom itu (server v5).
  await buka(`${C}/pengguna`)
  await page.getByText(EMAIL_PANJANG, { exact: true }).first().waitFor({ timeout: 60000 })
  const terkirim = []
  for (let i = 0; i < KOLOM.length; i++) {
    const th = page.locator('[data-uji="tabel-pengguna"] thead th').nth(i)
    await th.scrollIntoViewIfNeeded()
    await th.locator('button').click()
    const t = await tunggu('admin_daftar_pengguna_v5', p => p.p_urut === URUT_KOLOM[i])
    if (!t) gagal(`Kepala ${KOLOM[i]} tidak mengirim p_urut ${URUT_KOLOM[i]}`)
    terkirim.push(`${URUT_KOLOM[i]}:${t.p.p_arah}`)
    await page.waitForTimeout(150)
  }
  hasil.urutKolom = terkirim.join(' ')
  // Tanpa kontak: tanggal saja, nama tidak bisa diurutkan.
  await page.getByRole('switch', { name: 'Kontak lengkap' }).click()
  if (!(await tunggu('admin_daftar_pengguna_v5', p => p.p_alasan === null))) gagal('Pengguna: sakelar mati masih mengirim alasan')
  await page.waitForTimeout(800)
  const waktuSamar = await page.locator('[data-uji="sel-masuk"]').allInnerTexts()
  if (!waktuSamar.length || waktuSamar.some(x => !POLA_TANGGAL.test(x.trim()))) gagal(`Pengguna tersamar: waktu ${waktuSamar.slice(0, 3)}`)
  if (await page.locator('[data-uji="tabel-pengguna"] thead th').nth(1).locator('button').count()) gagal('Pengguna tersamar: kepala Nama masih bisa diurutkan')
  await potret('tp-pengguna-tersamar-terang-1440', { penuh: false })
  await page.getByRole('switch', { name: 'Kontak lengkap' }).click()
  await tunggu('admin_daftar_pengguna_v5', p => !!p.p_alasan)
  // Server lama: v5 belum ada, jatuh ke v4 tanpa kolom Sumber dan tanpa galat.
  mode.belumAda = ['admin_daftar_pengguna_v5']
  await page.evaluate(() => sessionStorage.clear())
  await buka(`${C}/pengguna`)
  await page.getByText(EMAIL_PANJANG, { exact: true }).first().waitFor({ timeout: 60000 })
  const kolomLama = await kepalaTabel()
  if (kolomLama.includes('Sumber') || kolomLama.length !== KOLOM.length - 1) gagal(`Pengguna server lama: kolom ${kolomLama.join('|')}`)
  if (!terakhir('admin_daftar_pengguna_v4')) gagal('Pengguna server lama: v4 tidak dipanggil')
  if (await page.getByRole('alert').count()) gagal('Pengguna server lama: ada galat')
  const bisaUrut = await page.locator('[data-uji="tabel-pengguna"] thead th').evaluateAll(th => th.map(x => !!x.querySelector('button')))
  hasil.serverLamaUrut = bisaUrut.filter(Boolean).length
  await potret('tp-pengguna-server-lama-terang-1440', { penuh: false })
  mode.belumAda = null
  hasil.pengguna = 'lulus'

  if (errors.length) gagal(`Galat browser: ${errors.join('; ')}`)
  console.log(JSON.stringify({ ...hasil, takDikenal: [...server.takDikenal] }))
} finally {
  if (browser) try { const s = await browser.newBrowserCDPSession(); await s.send('Browser.close') } catch { /* Chrome sudah tertutup. */ }
  chrome.kill()
  await rm(dir, { recursive: true, force: true }).catch(() => {})
}
