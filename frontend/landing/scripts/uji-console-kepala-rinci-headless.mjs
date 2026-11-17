// Uji tampilan kepala Pengguna 360 dengan data sintetis: cara nomor WhatsApp
// dibuktikan dan pemakaian Domi. Dua keadaan server:
//   - baru: admin_pengguna_kepala mengirim status_wa, status_wa_pada,
//     domi_tanya, dan domi_terakhir;
//   - lama: keempat kunci tidak ada. Halaman harus tampil seperti sebelumnya,
//     tanpa galat dan tanpa tulisan "undefined".
// Terang dan gelap, lebar 1440 dan 390. Chrome headless lewat CDP, tanpa jendela.
//
// Jalankan server lokal TANPA .env (tidak ada kunci sungguhan):
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_URL=http://127.0.0.1:4398 \
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY=anon-sintetis \
//   npx nuxi dev --port 4399 --host 127.0.0.1
// lalu:
//   PLAYWRIGHT_CORE_PATH=<playwright-core/index.mjs> CF_QA_ARTIFACTS=<folder> \
//   node scripts/uji-console-kepala-rinci-headless.mjs
// CF_QA_APP dan CF_QA_SUPABASE mengganti alamat bawaan di atas. CF_QA_TMP boleh
// menunjuk folder profil Chrome sementara (bawaan tmpdir). CF_QA_SIMPAN_HTML=<berkas>
// menyimpan HTML kepala di keadaan server lama, untuk dibandingkan antar cabang.
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'
import { tmpdir, homedir } from 'node:os'
import { join } from 'node:path'

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
const dir = await mkdtemp(join(process.env.CF_QA_TMP || tmpdir(), 'cf-kepala-rinci-'))
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--user-data-dir=${dir}`, `--remote-debugging-port=${cdpPort}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

// ── Data sintetis (karangan, waktunya tetap supaya potret bisa dibandingkan) ──
const SAAT = Date.parse('2026-11-16T05:00:00Z')
const jam = j => new Date(SAAT - j * 3_600_000).toISOString()
const uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
/** Awal hari WIB, seperti yang dibulatkan server. */
const hariWib = iso => `${new Date(Date.parse(iso) + 7 * 3_600_000).toISOString().slice(0, 10)}T00:00:00+07:00`
const SUBJEK = uuid(1)
const kepalaLama = pii => ({
  user_id: SUBJEK, email: 'sar***@contoh.invalid', daftar: jam(24 * 27), masuk_terakhir: jam(5), banned_until: null,
  jumlah_ruang: pii ? 3 : null, jumlah_transaksi: pii ? 1240 : null, akses_30hari: 2, ruang: pii ? [] : null,
  nomor_wa: pii ? '6281100001000' : '0811 •••• 1000',
})
/** Empat kunci tambahan per keadaan. Tanpa pii server mengirim dua kunci Domi sebagai null. */
const TAMBAHAN = {
  berdata: pii => ({ status_wa: 'masuk', status_wa_pada: hariWib(jam(48)), domi_tanya: pii ? 412 : null, domi_terakhir: pii ? hariWib(jam(7)) : null }),
  belum: pii => ({ status_wa: 'belum', status_wa_pada: null, domi_tanya: pii ? 0 : null, domi_terakhir: null }),
  lewat: pii => ({ status_wa: 'lewat', status_wa_pada: hariWib(jam(96)), domi_tanya: pii ? 1 : null, domi_terakhir: pii ? hariWib(jam(30)) : null }),
}
const barisDaftar = pii => ({
  user_id: SUBJEK, email: 'sar***@contoh.invalid', display_name: '', created_at: jam(24 * 27), last_sign_in: jam(5), aktivitas_terakhir: jam(4),
  banned_until: null, menunggu_hapus: false, jumlah_ruang: pii ? 3 : null, jumlah_tx: pii ? 1240 : null, jumlah_nominal: pii ? 184_250_000 : null,
  terbuka: false, nomor_wa: '0811 •••• 1000', versi_aplikasi: '1.4.1', platform: 'android',
  status_wa: 'kirim', status_wa_pada: hariWib(jam(24 * 9)), lewat_sebab: null, nomor_ramai: true, kredit_ditahan: false,
  domi_tanya: pii ? 38 : null, domi_tanya_30: pii ? 9 : null, domi_tanya_kira: pii ? false : null, domi_terakhir: pii ? hariWib(jam(24 * 3)) : null,
  kredit_sisa: pii ? 37 : null, kredit_beli: pii ? 1 : null, internal: false, total_semua: 1,
})

let browser
const hasil = {}
try {
  for (let i = 0; i < 100; i++) { try { const r = await fetch(`http://127.0.0.1:${cdpPort}/json/version`); if (r.ok) break } catch { /* Chrome belum siap. */ } await new Promise(r => setTimeout(r, 100)) }
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`)
  const ctx = browser.contexts()[0]
  const page = ctx.pages()[0]
  const jwt = ['eyJhbGciOiJub25lIn0', Buffer.from(JSON.stringify({ sub: uuid(900), role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'test'].join('.')
  const session = { access_token: jwt, refresh_token: 'test-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user: { id: uuid(900), aud: 'authenticated', role: 'authenticated', email: 'admin@contoh.invalid' } }
  let izin = ['cashflow:view', 'cashflow:pii', 'cashflow:investigasi', 'cashflow:tindak', 'cashflow:ekspor']
  await ctx.addInitScript(({ session }) => {
    if (location.protocol !== 'http:') return
    sessionStorage.setItem('cf-console-sesi', JSON.stringify(session))
    // Panel devtools server dev menutupi isi tangkapan layar. Transisi dimatikan supaya potret stabil.
    addEventListener('DOMContentLoaded', () => {
      const gaya = document.createElement('style')
      gaya.textContent = '[id^="nuxt-devtools"]{display:none!important}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
      document.head.append(gaya)
    })
  }, { session })
  const pasangIzin = () => ctx.addInitScript((izin) => { if (location.protocol === 'http:') sessionStorage.setItem('cf_izin', JSON.stringify(izin)) }, izin)
  await pasangIzin()
  // Tidak ada akses ke layanan luar atau gateway sungguhan.
  await ctx.route('**/*', (route) => {
    const u = new URL(route.request().url())
    return u.hostname === '127.0.0.1' && PORT_BOLEH.includes(u.port) ? route.continue() : route.abort()
  })
  const me = mfa => ({ data: { id: 'admin-test', email: 'admin@contoh.invalid', full_name: 'Admin Contoh', role: 'super_admin', is_active: true, mfa, mfa_at: mfa ? new Date().toISOString() : null, totp_enabled_at: mfa ? '2026-01-01T00:00:00Z' : null, totp_enabled: mfa } })
  let mfa = true
  await page.route('**/api/gw/**', r => r.fulfill({ status: 404, json: { error: 'gateway sintetis' } }))
  await page.route('**/api/gw/admin/auth/me', r => r.fulfill({ json: me(mfa) }))

  /** Keadaan server tiruan: `tambahan` null = server lama (tanpa empat kunci). */
  const server = { tambahan: null }
  const seen = []
  const errors = []
  page.on('pageerror', e => errors.push(`${new URL(page.url()).pathname}: ${e.message}`))
  const cors = { 'access-control-allow-origin': '*' }
  await page.route(`${SUPABASE}/**`, async (r) => {
    const req = r.request()
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' } })
    const name = new URL(req.url()).pathname.split('/').pop()
    seen.push(name)
    const pii = izin.includes('cashflow:pii')
    if (name === 'admin_pengguna_kepala') {
      return r.fulfill({ headers: cors, json: { ...kepalaLama(pii), ...(server.tambahan ? TAMBAHAN[server.tambahan](pii) : {}) } })
    }
    if (name === 'admin_daftar_pengguna_v4') {
      return r.fulfill({ headers: cors, json: { total: 1, baris: [barisDaftar(pii)], versi_terbaru: { android: '0001000400010000100000' }, hapus_tersedia: true, jumlah_pakai_domi: pii ? 1 : null } })
    }
    // RPC yang tidak dikarang menjawab kosong: daftar kosong atau objek kosong.
    return r.fulfill({ json: /^admin_(daftar_|ocr_|foto_|telemetri_)/.test(name) ? [] : {}, headers: cors })
  })

  const tema = async (t) => {
    await ctx.clearCookies()
    await ctx.addCookies([{ name: 'coreasia-theme', value: t === 'terang' ? 'light' : 'dark', domain: '127.0.0.1', path: '/' }])
  }
  const lebar = async (w) => { await page.setViewportSize({ width: w, height: w > 500 ? 900 : 844 }); await page.waitForTimeout(250) }
  const meluber = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  const potret = async (nama) => {
    await page.evaluate(() => { scrollTo(0, 0); document.activeElement?.blur?.() })
    await page.waitForTimeout(500)
    await page.screenshot({ path: join(output, `${nama}.png`), fullPage: true })
  }
  const gagal = (pesan) => { throw new Error(pesan) }
  const RINCI = '[data-uji="rinci-dari-daftar"]'
  const bukaRinci = async () => {
    await page.goto(`${APP}/console/cashflow/pengguna/${SUBJEK}`, { waitUntil: 'domcontentloaded' })
    await page.locator(RINCI).waitFor({ timeout: 60000 })
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(600)
    const kepala = await page.locator('section.cf-kepala-rinci').innerText()
    if (/undefined|NaN|null|Invalid/.test(kepala)) gagal(`Kepala memuat nilai mentah: ${kepala}`)
    return page.locator(RINCI).innerText()
  }
  const rapat = s => s.replace(/\s+/g, ' ').trim()
  const DARI_DAFTAR = 'Baru terisi kalau halaman ini dibuka dari daftar pengguna.'

  // 1. Server baru dengan data dan server lama tanpa kunci, dibuka langsung. Terang dan gelap, 1440 dan 390.
  for (const t of ['terang', 'gelap']) {
    await tema(t)
    for (const w of [1440, 390]) {
      await lebar(w)
      server.tambahan = 'berdata'
      const baru = rapat(await bukaRinci())
      for (const teks of ['Cara nomor dibuktikan Terverifikasi lewat pesan masuk 14 Nov 2026', 'Terakhir pakai Domi 16 Nov 2026', 'Tanya Domi 412 kali', `ID akun ${SUBJEK}`]) {
        if (!baru.includes(teks)) gagal(`Server baru ${t} ${w} tanpa "${teks}": ${baru}`)
      }
      if (baru.includes(DARI_DAFTAR)) gagal(`Server baru ${t} ${w} masih menulis keterangan daftar: ${baru}`)
      if (await meluber()) gagal(`Server baru ${t} ${w}: halaman meluber`)
      await potret(`kepala-server-baru-${t}-${w}`)

      server.tambahan = null
      const lama = rapat(await bukaRinci())
      if (lama !== `Cara nomor dibuktikan — ${DARI_DAFTAR} Terakhir pakai Domi — ${DARI_DAFTAR} ID akun ${SUBJEK}`) gagal(`Server lama ${t} ${w} berubah: ${lama}`)
      if (await page.locator('[data-uji="rinci-domi-tanya"]').count()) gagal(`Server lama ${t} ${w} menulis baris Tanya Domi`)
      if (await meluber()) gagal(`Server lama ${t} ${w}: halaman meluber`)
      await potret(`kepala-server-lama-${t}-${w}`)
    }
  }
  hasil.duaKeadaan = 'lulus'
  if (process.env.CF_QA_SIMPAN_HTML) {
    await tema('terang')
    await lebar(1440)
    server.tambahan = null
    await bukaRinci()
    await writeFile(process.env.CF_QA_SIMPAN_HTML, await page.locator('section.cf-kepala-rinci').evaluate(x => x.outerHTML))
  }

  // 2. Server baru, keadaan lain. Terang 1440 dan 390.
  await tema('terang')
  await lebar(1440)
  server.tambahan = 'belum'
  const belum = rapat(await bukaRinci())
  if (belum !== `Cara nomor dibuktikan Belum Terakhir pakai Domi Belum pernah Tanya Domi 0 kali ID akun ${SUBJEK}`) gagal(`Belum WhatsApp dan belum pakai Domi: ${belum}`)
  await potret('kepala-server-baru-belum-terang-1440')
  await lebar(390)
  await potret('kepala-server-baru-belum-terang-390')
  await lebar(1440)
  server.tambahan = 'lewat'
  const lewat = rapat(await bukaRinci())
  if (!lewat.includes('Cara nomor dibuktikan Lewat saat gangguan 12 Nov 2026') || !lewat.includes('Tanya Domi 1 kali')) gagal(`Lewat saat gangguan: ${lewat}`)
  hasil.keadaanLain = 'lulus'

  // 3. Dibuka dari daftar. Server lama memakai nilai baris daftar, server baru memakai nilai kepala
  //    dan hanya meminjam tanda tambahan bila statusnya sama.
  const dariDaftar = async () => {
    await page.goto(`${APP}/console/cashflow/pengguna`, { waitUntil: 'domcontentloaded' })
    await page.locator('.ca-daftar-pengguna tbody tr').first().locator('a[aria-label^="Buka rincian"]').click({ timeout: 60000 })
    await page.waitForURL(u => u.pathname === `/console/cashflow/pengguna/${SUBJEK}`)
    await page.locator(RINCI).waitFor({ timeout: 30000 })
    await page.waitForTimeout(600)
    return rapat(await page.locator(RINCI).innerText())
  }
  server.tambahan = null
  const lamaDaftar = await dariDaftar()
  if (lamaDaftar !== `Cara nomor dibuktikan Terverifikasi lewat kode terkirim 7 Nov 2026 Nomor dipakai banyak akun Terakhir pakai Domi 13 Nov 2026 ID akun ${SUBJEK}`) gagal(`Server lama dari daftar berubah: ${lamaDaftar}`)
  await potret('kepala-server-lama-dari-daftar-terang-1440')
  server.tambahan = 'berdata'
  const baruDaftar = await dariDaftar()
  if (baruDaftar !== `Cara nomor dibuktikan Terverifikasi lewat pesan masuk 14 Nov 2026 Terakhir pakai Domi 16 Nov 2026 Tanya Domi 412 kali ID akun ${SUBJEK}`) gagal(`Server baru dari daftar: ${baruDaftar}`)
  hasil.dariDaftar = 'lulus'

  // 4. Tanpa izin data pribadi: status WhatsApp tetap tampil, hitungan Domi tidak.
  izin = ['cashflow:view']
  mfa = false
  await pasangIzin()
  server.tambahan = 'berdata'
  const tanpaIzin = rapat(await bukaRinci())
  if (tanpaIzin !== `Cara nomor dibuktikan Terverifikasi lewat pesan masuk 14 Nov 2026 Terakhir pakai Domi — (akses terbatas) Tanya Domi — (akses terbatas) ID akun ${SUBJEK}`) gagal(`Tanpa izin: ${tanpaIzin}`)
  await potret('kepala-server-baru-tanpa-izin-terang-1440')
  server.tambahan = null
  const tanpaIzinLama = rapat(await bukaRinci())
  if (tanpaIzinLama !== `Cara nomor dibuktikan — ${DARI_DAFTAR} Terakhir pakai Domi — (akses terbatas) ID akun ${SUBJEK}`) gagal(`Server lama tanpa izin berubah: ${tanpaIzinLama}`)
  hasil.tanpaIzin = 'lulus'

  if (errors.length) gagal(`Galat browser: ${errors.join('; ')}`)
  if (!seen.includes('admin_pengguna_kepala')) gagal('Kepala tidak pernah diminta')
  console.log(JSON.stringify({ ...hasil, errors }))
} finally {
  if (browser) try { const s = await browser.newBrowserCDPSession(); await s.send('Browser.close') } catch { /* Chrome sudah tertutup. */ }
  chrome.kill()
  await rm(dir, { recursive: true, force: true }).catch(() => {})
}
