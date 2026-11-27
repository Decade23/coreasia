// Uji tampilan halaman CashFlow > WhatsApp (pages/console/cashflow/whatsapp.vue,
// CashflowWaLaporanIsi, CashflowWaHarian, CashflowWaPengguna) dengan data sintetis
// (scripts/data-sintetis-console.mjs). Chrome headless lewat CDP, tanpa jendela.
//
// Yang diperiksa:
//   1. Terang dan gelap, lebar 1440 dan 390: tidak meluber ke samping, tanpa kode
//      mentah, tanpa tanda baca terlarang, tanpa galat peramban.
//   2. RPC admin_wa_catat_laporan dipanggil sekali per muatan dengan p_hari,
//      p_kecuali_internal, dan p_alasan. Pil periode dan akun tim memuat ulang dan
//      masuk URL. Sakelar Kontak lengkap mengganti alasan (tersamar <-> utuh).
//   3. Menu CashFlow: tab WhatsApp aktif di pintu Ringkasan, palet menemukan halamannya.
//   4. Tautan Perjalanan 360 per pengguna membawa ?dari= awal periode.
//   5. Server lama (PGRST202): kalimat tenang "belum aktif". Data kosong: kalimat
//      kosong, kesehatan tetap tampil.
//   6. Sesi lihat saja (izin view): agregat tampil, daftar orang dan kata terkunci.
//
// Jalankan server lokal TANPA .env (tidak ada kunci sungguhan):
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_URL=http://127.0.0.1:4428 \
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY=anon-sintetis \
//   npx nuxi dev --port 3091 --host 127.0.0.1
// lalu:
//   PLAYWRIGHT_CORE_PATH=<playwright-core/index.mjs> CF_QA_ARTIFACTS=<folder> \
//   CF_QA_APP=http://127.0.0.1:3091 CF_QA_SUPABASE=http://127.0.0.1:4428 CF_QA_CDP=9469 \
//   node scripts/uji-console-wa-laporan-headless.mjs
// CF_QA_TMP boleh menunjuk folder profil Chrome sementara (bawaan tmpdir).
// Batas waktu keras: CF_QA_BATAS detik (bawaan 240), lalu Chrome ditutup dan keluar 2.
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buatServer, uuid } from './data-sintetis-console.mjs'

const pwPath = process.env.PLAYWRIGHT_CORE_PATH
const { chromium } = await (pwPath ? import(pathToFileURL(pwPath).href) : import('playwright-core'))
const output = process.env.CF_QA_ARTIFACTS || join(tmpdir(), 'cf-wa-laporan-potret')
const APP = process.env.CF_QA_APP || 'http://127.0.0.1:3091'
const SUPABASE = process.env.CF_QA_SUPABASE || 'http://127.0.0.1:4428'
const cdpPort = Number(process.env.CF_QA_CDP || 9469)
const BATAS = Number(process.env.CF_QA_BATAS || 240) * 1000
const PORT_BOLEH = [new URL(APP).port, new URL(SUPABASE).port]
await mkdir(output, { recursive: true })
const dir = await mkdtemp(join(process.env.CF_QA_TMP || tmpdir(), 'cf-wa-'))
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--user-data-dir=${dir}`, `--remote-debugging-port=${cdpPort}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })
/* Watchdog: apa pun yang macet, Chrome uji ikut mati. */
const anjing = setTimeout(() => {
  console.error(`BATAS WAKTU ${BATAS / 1000} detik tercapai, Chrome uji ditutup`)
  try { chrome.kill('SIGKILL') } catch { /* sudah mati */ }
  process.exit(2)
}, BATAS)
anjing.unref()
const dengan = (janji, ms, apa) => Promise.race([janji, new Promise((_, tolak) => setTimeout(() => tolak(new Error(`Batas ${ms} ms: ${apa}`)), ms))])

/** Kode server dan jalur kamus yang tidak boleh terbaca di layar. */
const MENTAH = /\bwaCatat\.[a-z]|\blaporan\.[a-z]|\bpengguna\.[a-z]|\badmin_wa|\bundefined\b|\bNaN\b|\[object |pesan_pertama|catatan_pertama|tanpa_setelan|basa_basi|dompet_bawaan|kata_tanpa/

let browser
let page
const hasil = {}
const temuan = []
try {
  for (let i = 0; i < 100; i++) { try { const r = await fetch(`http://127.0.0.1:${cdpPort}/json/version`); if (r.ok) break } catch { /* Chrome belum siap. */ } await new Promise(r => setTimeout(r, 100)) }
  browser = await dengan(chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`), 15000, 'sambung CDP')
  const ctx = browser.contexts()[0]
  page = ctx.pages()[0]
  page.setDefaultTimeout(30000)
  const jwt = ['eyJhbGciOiJub25lIn0', Buffer.from(JSON.stringify({ sub: uuid(1), role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'test'].join('.')
  const session = { access_token: jwt, refresh_token: 'test-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user: { id: uuid(1), aud: 'authenticated', role: 'authenticated', email: 'admin@contoh.invalid' } }
  await ctx.addInitScript(({ session }) => {
    if (location.protocol !== 'http:') return
    sessionStorage.setItem('cf-console-sesi', JSON.stringify(session))
    addEventListener('DOMContentLoaded', () => {
      const gaya = document.createElement('style')
      gaya.textContent = '[id^="nuxt-devtools"]{display:none!important}'
      document.head.append(gaya)
    })
  }, { session })
  const pasangIzin = izin => ctx.addInitScript((x) => { if (location.protocol === 'http:') sessionStorage.setItem('cf_izin', JSON.stringify(x)) }, izin)
  await pasangIzin(['cashflow:view', 'cashflow:pii', 'cashflow:investigasi', 'cashflow:tindak', 'cashflow:ekspor'])
  await ctx.route('**/*', (route) => {
    const u = new URL(route.request().url())
    return u.hostname === '127.0.0.1' && PORT_BOLEH.includes(u.port) ? route.continue() : route.abort()
  })
  let mfa = true
  await page.route('**/api/gw/**', r => r.fulfill({ status: 404, json: { error: 'gateway sintetis' } }))
  await page.route('**/api/gw/admin/auth/me', r => r.fulfill({ json: { data: {
    id: 'admin-test', email: 'admin@contoh.invalid', full_name: 'Admin Contoh', role: 'super_admin', is_active: true,
    mfa, mfa_at: mfa ? new Date().toISOString() : null, totp_enabled_at: '2026-01-01T00:00:00Z', totp_enabled: true,
  } } }))

  const server = buatServer()
  const mode = { izin: true, belumAda: [] }
  const panggilan = []
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  const cors = { 'access-control-allow-origin': '*' }
  await page.route(`${SUPABASE}/**`, async (r) => {
    const req = r.request()
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' } })
    const nama = new URL(req.url()).pathname.split('/').pop()
    const p = req.postDataJSON() || {}
    panggilan.push({ nama, p })
    const j = server.jawab(nama, p, mode)
    return r.fulfill({ status: j.status ?? 200, json: j.json, headers: cors })
  })

  const tema = async (t) => {
    await ctx.clearCookies()
    await ctx.addCookies([{ name: 'coreasia-theme', value: t, domain: '127.0.0.1', path: '/' }])
  }
  const lebar = async (w) => { await page.setViewportSize({ width: w, height: w > 500 ? 900 : 844 }); await page.waitForTimeout(300) }
  const meluber = () => dengan(page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), 5000, 'periksa luber')
  const potret = async (nama) => {
    await page.evaluate(() => scrollTo(0, 0))
    await page.waitForTimeout(400)
    await dengan(page.screenshot({ path: join(output, `${nama}.png`) }), 20000, `potret ${nama}`)
    await dengan(page.screenshot({ path: join(output, `${nama}-penuh.png`), fullPage: true }), 30000, `potret penuh ${nama}`)
  }
  const gagal = (pesan) => { throw new Error(pesan) }
  const catat = (pesan) => { temuan.push(pesan) }
  const uji = id => page.locator(`[data-uji="${id}"]`)
  const buka = async (query = '', siap = 'wa-isi') => {
    panggilan.length = 0
    await dengan(page.goto(`${APP}/console/cashflow/whatsapp${query}`, { waitUntil: 'domcontentloaded' }), 90000, 'buka halaman')
    await uji(siap).first().waitFor({ timeout: 90000 })
    await page.waitForTimeout(600)
  }
  const bersih = async (di, pola = MENTAH) => {
    const teks = await dengan(page.evaluate(() => document.querySelector('main')?.innerText ?? document.body.innerText), 5000, 'baca teks')
    const m = teks.match(pola)
    if (m) catat(`${di}: kode mentah atau teks rusak terbaca: "${m[0]}"`)
    const k = teks.match(/[^\n\t]{0,30}(?:;|[^\s—]\s?—\s?[^\s—])[^\n\t]{0,30}/)
    if (k) catat(`${di}: tanda baca terlarang: "${k[0]}"`)
  }
  const rpc = n => panggilan.filter(x => x.nama === n)

  // 1. Terang dan gelap, 1440 dan 390 (bawaan 7 hari, tanpa akun tim, sesi pii: kontak lengkap terbuka
  //    seperti daftar Pengguna dan Ruang).
  for (const t of ['terang', 'gelap']) {
    await tema(t === 'terang' ? 'light' : 'dark')
    for (const w of [1440, 390]) {
      await lebar(w)
      await buka()
      if (await page.getByRole('alert').count()) catat(`lengkap ${t} ${w}: ada galat merah`)
      await bersih(`lengkap ${t} ${w}`)
      if (await meluber()) catat(`lengkap ${t}: meluber di ${w}`)
      await potret(`wa-lengkap-${t}-${w}`)
    }
  }
  hasil.tampilan = 'lengkap dipotret, terang dan gelap, 1440 dan 390'

  // 2. Panggilan, pil, dan sakelar (terang, 1440).
  await tema('light')
  await lebar(1440)
  await buka()
  const r7 = rpc('admin_wa_catat_laporan')
  if (r7.length !== 1 || r7[0].p.p_hari !== 7 || r7[0].p.p_kecuali_internal !== true || !String(r7[0].p.p_alasan).includes('Kontak lengkap di laporan WhatsApp Console')) {
    gagal(`Panggilan awal: ${JSON.stringify(r7.map(x => x.p))}`)
  }
  if (await uji('wa-laporan').getAttribute('data-kunci') !== '7|tanpa|terbuka') gagal(`Penanda awal: ${await uji('wa-laporan').getAttribute('data-kunci')}`)
  panggilan.length = 0
  await page.locator('[data-uji="wa-alat"] button[data-seg="1"]').click()
  await page.locator('[data-uji="wa-laporan"][data-kunci^="1|"]').waitFor({ timeout: 20000 })
  if (!/[?&]hari=1\b/.test(page.url())) gagal(`Periode tidak masuk URL: ${page.url()}`)
  if (rpc('admin_wa_catat_laporan')[0]?.p.p_hari !== 1) gagal('Pil 24 jam tidak mengirim p_hari 1')
  if (await uji('wa-cakupan').count()) gagal('24 jam masih menulis catatan cakupan 48 jam')
  await potret('wa-24jam-terang-1440')
  panggilan.length = 0
  await page.locator('[data-uji="wa-alat"] button[data-seg="ikut"]').click()
  await page.locator('[data-uji="wa-laporan"][data-kunci^="1|ikut"]').waitFor({ timeout: 20000 })
  if (rpc('admin_wa_catat_laporan')[0]?.p.p_kecuali_internal !== false) gagal('Pil akun tim tidak mengirim p_kecuali_internal false')
  const tabelTim = await uji('wa-pengguna-tabel').innerText()
  if (!/\bTim\b/.test(tabelTim)) gagal('Akun tim tidak ditandai Tim saat ikut dihitung')
  const tabelBuka = await uji('wa-pengguna-tabel').innerText()
  if (!tabelBuka.includes('Sari Wulandari') || !tabelBuka.includes('sari@contoh.invalid')) gagal('Kontak lengkap tidak menampilkan nama dan email utuh')
  await potret('wa-terbuka-terang-1440')
  panggilan.length = 0
  await uji('sakelar-kontak').click()
  await page.locator('[data-uji="wa-laporan"][data-kunci$="|samar"]').waitFor({ timeout: 20000 })
  const samar1 = rpc('admin_wa_catat_laporan').at(-1)
  if (!samar1 || samar1.p.p_alasan !== null) gagal(`Disamarkan masih mengirim alasan: ${JSON.stringify(samar1?.p)}`)
  if ((await uji('wa-pengguna-tabel').innerText()).includes('sari@contoh.invalid')) gagal('Sesudah disamarkan email utuh masih tampil')
  await potret('wa-tersamar-terang-1440')
  /* Sakelar diingat lintas halaman (state yang sama dengan daftar Pengguna): buka lagi. */
  await uji('sakelar-kontak').click()
  await page.locator('[data-uji="wa-laporan"][data-kunci$="|terbuka"]').waitFor({ timeout: 20000 })
  hasil.panggilan = { awal: { ...r7[0].p, p_alasan: '(alasan tetap)' }, samar: samar1.p }

  // 3. Menu dan palet.
  await buka()
  const tab = page.locator('[data-uji="cf-nav-halaman"] a[data-halaman="whatsapp"]')
  if (await tab.getAttribute('aria-current') !== 'page') gagal('Tab WhatsApp tidak aktif di menu')
  if (await page.locator('[data-uji="cf-nav-pintu"] a[data-pintu="ringkasan"]').getAttribute('aria-current') !== 'true') gagal('Pintu Ringkasan tidak aktif')
  await uji('cf-nav-cari').click()
  await page.keyboard.type('WhatsApp')
  await page.waitForTimeout(400)
  const palet = await page.locator('[role="dialog"]').innerText().catch(() => '')
  if (!palet.includes('WhatsApp')) gagal('Palet tidak menemukan halaman WhatsApp')
  await potret('wa-palet-terang-1440')
  await page.keyboard.press('Escape')
  hasil.menu = 'tab WhatsApp aktif di Ringkasan, palet menemukannya'

  // 4. Tautan Perjalanan 360.
  const href = await page.locator('[data-uji="wa-pengguna-perjalanan"]').first().getAttribute('href')
  if (!/^\/console\/cashflow\/pengguna\/00000000-0000-4000-8000-\d{12}\/perjalanan\?dari=\d{4}-\d{2}-\d{2}$/.test(href ?? '')) gagal(`Tautan Perjalanan: ${href}`)
  hasil.perjalanan = href

  // 5. Server lama dan data kosong.
  mode.belumAda = ['admin_wa_catat_laporan']
  for (const t of ['terang', 'gelap']) {
    await tema(t === 'terang' ? 'light' : 'dark')
    await lebar(390)
    await buka('', 'wa-belum-aktif')
    if (await page.getByRole('alert').count()) gagal(`Belum aktif ${t}: ada galat merah`)
    const kalimat = (await uji('wa-belum-aktif').innerText()).trim()
    if (kalimat !== 'Laporan WhatsApp belum aktif di server. Halaman lain tetap jalan.') gagal(`Kalimat belum aktif: "${kalimat}"`)
    await potret(`wa-belum-aktif-${t}-390`)
  }
  mode.belumAda = []
  mode.kosong = true
  for (const t of ['terang', 'gelap']) {
    await tema(t === 'terang' ? 'light' : 'dark')
    await lebar(1440)
    await buka('', 'wa-kosong')
    if (await uji('wa-ubin').count()) gagal(`Kosong ${t}: ubin nol tetap digambar`)
    if (!(await uji('wa-sehat-proses').count())) gagal(`Kosong ${t}: kesehatan hilang`)
    await bersih(`kosong ${t}`)
    await potret(`wa-kosong-${t}-1440`)
  }
  mode.kosong = false
  hasil.belumAktifDanKosong = 'belum aktif tenang, kosong menulis kalimat kosong dan kesehatan tetap tampil'

  // 6. Sesi lihat saja: agregat tampil, daftar orang dan kata terkunci.
  await pasangIzin(['cashflow:view'])
  mfa = false
  mode.izin = false
  for (const t of ['terang', 'gelap']) {
    await tema(t === 'terang' ? 'light' : 'dark')
    await lebar(390)
    await buka()
    if (await page.getByRole('alert').count()) gagal('Sesi lihat saja: ada galat merah')
    if (await uji('wa-pengguna-tabel').count()) gagal('Sesi lihat saja menerima tabel orang')
    if (await uji('wa-kata-daftar').count()) gagal('Sesi lihat saja menerima kata tanpa kategori')
    if (await uji('sakelar-kontak').count()) gagal('Sesi lihat saja melihat sakelar Kontak lengkap')
    const r = rpc('admin_wa_catat_laporan')
    if (r.length !== 1 || r[0].p.p_alasan !== null) gagal(`Sesi lihat saja mengirim alasan: ${JSON.stringify(r.map(x => x.p))}`)
    await bersih(`lihat saja ${t} 390`)
    if (await meluber()) catat(`lihat saja ${t}: meluber di 390`)
    await potret(`wa-lihat-saja-${t}-390`)
  }
  hasil.lihatSaja = 'agregat tampil, daftar orang dan kata terkunci, tanpa alasan'

  if (errors.length) gagal(`Galat browser: ${errors.join('; ')}`)
  if (temuan.length) gagal(`Temuan tampilan:\n  ${temuan.join('\n  ')}`)
  console.log(JSON.stringify({ ...hasil, takDikenal: [...server.takDikenal], errors }, null, 1))
} catch (e) {
  if (page) await dengan(page.screenshot({ path: join(output, 'galat.png'), fullPage: true }), 15000, 'potret galat').catch(() => {})
  if (temuan.length) console.error(temuan.join('\n'))
  console.error(e?.message ?? e)
  process.exitCode = 1
} finally {
  if (browser) try { const s = await dengan(browser.newBrowserCDPSession(), 5000, 'sesi CDP'); await dengan(s.send('Browser.close'), 5000, 'Browser.close') } catch { /* Chrome sudah tertutup. */ }
  try { chrome.kill() } catch { /* sudah mati */ }
  await rm(dir, { recursive: true, force: true }).catch(() => {})
  clearTimeout(anjing)
}
