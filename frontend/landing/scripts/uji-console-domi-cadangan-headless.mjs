// Uji tampilan halaman "Domi: penyedia cadangan" di console CashFlow dengan
// data sintetis: belum ada kunci, aktif normal, dan RPC belum ada di server,
// terang dan gelap, lebar 1440 dan 390. Juga alur kunci: periksa di klien,
// simpan, konfirmasi ganti dan hapus, dan bahwa kunci yang diketik tidak
// tertinggal di halaman, URL, atau storage. Chrome headless lewat CDP, tanpa
// jendela.
//
// Jalankan server lokal TANPA .env (tidak ada kunci sungguhan):
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_URL=http://127.0.0.1:4398 \
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY=anon-sintetis \
//   npx nuxi dev --port 4399 --host 127.0.0.1
// lalu:
//   PLAYWRIGHT_CORE_PATH=<playwright-core/index.mjs> CF_QA_ARTIFACTS=<folder> \
//   node scripts/uji-console-domi-cadangan-headless.mjs
// CF_QA_APP dan CF_QA_SUPABASE mengganti alamat bawaan di atas. CF_QA_TMP boleh
// menunjuk folder profil Chrome sementara (bawaan tmpdir).
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
const SUPABASE = process.env.CF_QA_SUPABASE || 'http://127.0.0.1:4398'
const PORT_BOLEH = [new URL(APP).port, new URL(SUPABASE).port]
await mkdir(output, { recursive: true })
const portServer = createServer()
await new Promise(r => portServer.listen(0, '127.0.0.1', r))
const cdpPort = portServer.address().port
await new Promise(r => portServer.close(r))
const dir = await mkdtemp(join(process.env.CF_QA_TMP || tmpdir(), 'cf-domi-cadangan-'))
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--user-data-dir=${dir}`, `--remote-debugging-port=${cdpPort}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

// ── Data sintetis ────────────────────────────────────────────────────────
const MODEL = ['model-contoh-cepat', 'model-contoh-teliti']
const kosong = () => ({
  aktif: false, model: MODEL[0], model_pilihan: MODEL, kunci_ada: false, kunci_sidik: null, kunci_diubah_pada: null,
  terakhir_dipakai_pada: null, dipakai_24_jam: 0, terakhir_galat: null, terakhir_galat_pada: null,
  utama_terakhir_galat: null, utama_terakhir_galat_pada: null,
})
const aktif = () => ({
  aktif: true, model: MODEL[1], model_pilihan: MODEL, kunci_ada: true, kunci_sidik: 'ab12cd34ef', kunci_diubah_pada: '2026-11-16T03:05:00Z',
  terakhir_dipakai_pada: '2026-11-16T05:42:00Z', dipakai_24_jam: 7,
  terakhir_galat: 'Batas laju terlampaui. Permintaan diulang sekali lalu berhasil.', terakhir_galat_pada: '2026-11-15T13:20:00Z',
  utama_terakhir_galat: 'Penyedia utama menjawab 503 sesudah menunggu 30 detik.', utama_terakhir_galat_pada: '2026-11-16T05:41:00Z',
})
/* Karangan: bentuknya saja yang mirip kunci. */
const KUNCI = 'sk-ant-sintetis-UJI_0123456789abcdef'
const KUNCI_TOLAK = 'sk-ant-sintetis-TOLAK_0123456789abcd'

let browser
const hasil = {}
try {
  for (let i = 0; i < 100; i++) { try { const r = await fetch(`http://127.0.0.1:${cdpPort}/json/version`); if (r.ok) break } catch { /* Chrome belum siap. */ } await new Promise(r => setTimeout(r, 100)) }
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`)
  const ctx = browser.contexts()[0]
  const page = ctx.pages()[0]
  const jwt = ['eyJhbGciOiJub25lIn0', Buffer.from(JSON.stringify({ sub: '00000000-0000-0000-0000-000000000001', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'test'].join('.')
  const session = { access_token: jwt, refresh_token: 'test-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user: { id: '00000000-0000-0000-0000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'admin@contoh.invalid' } }
  let izin = ['cashflow:view', 'cashflow:pii', 'cashflow:investigasi', 'cashflow:tindak', 'cashflow:ekspor']
  await ctx.addInitScript(({ session }) => {
    if (location.protocol !== 'http:') return
    sessionStorage.setItem('cf-console-sesi', JSON.stringify(session))
    // Panel devtools server dev menutupi isi tangkapan layar.
    addEventListener('DOMContentLoaded', () => {
      const gaya = document.createElement('style')
      gaya.textContent = '[id^="nuxt-devtools"]{display:none!important}'
      document.head.append(gaya)
    })
  }, { session })
  const pasangIzin = () => ctx.addInitScript((izin) => { if (location.protocol === 'http:') sessionStorage.setItem('cf_izin', JSON.stringify(izin)) }, izin)
  await pasangIzin()
  // Tidak ada akses ke layanan luar atau gateway sungguhan.
  const urlDiminta = []
  await ctx.route('**/*', (route) => {
    const u = new URL(route.request().url())
    urlDiminta.push(u.href)
    return u.hostname === '127.0.0.1' && PORT_BOLEH.includes(u.port) ? route.continue() : route.abort()
  })
  await page.route('**/api/gw/**', r => r.fulfill({ status: 404, json: { error: 'gateway sintetis' } }))
  await page.route('**/api/gw/admin/auth/me', r => r.fulfill({ json: { data: { id: 'admin-test', email: 'admin@contoh.invalid', full_name: 'Admin Contoh', role: 'super_admin', is_active: true, mfa: true, mfa_at: new Date().toISOString(), totp_enabled_at: '2026-01-01T00:00:00Z' } } }))

  /** Keadaan server tiruan. null = RPC belum terpasang (PGRST202). */
  let server = kosong()
  const seen = []
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  const logKonsol = []
  page.on('console', m => logKonsol.push(m.text()))
  const cors = { 'access-control-allow-origin': '*' }
  await page.route(`${SUPABASE}/**`, async (r) => {
    const req = r.request()
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' } })
    const name = new URL(req.url()).pathname.split('/').pop()
    const p = req.postDataJSON() || {}
    seen.push({ name, p })
    if (!name.startsWith('admin_ai_cadangan_')) return r.fulfill({ json: {}, headers: cors })
    if (!server) {
      return r.fulfill({ status: 404, headers: cors, json: { code: 'PGRST202', details: null, hint: null, message: `Could not find the function public.${name} in the schema cache` } })
    }
    const tolak = (message) => r.fulfill({ status: 400, headers: cors, json: { code: '22023', details: null, hint: null, message } })
    if (name === 'admin_ai_cadangan_simpan') {
      if (!MODEL.includes(p.p_model)) return tolak('model_tidak_dikenal')
      if (p.p_aktif && !server.kunci_ada) return tolak('kunci_belum_ada')
      server = { ...server, aktif: !!p.p_aktif, model: p.p_model }
    } else if (name === 'admin_ai_cadangan_kunci') {
      if (p.p_kunci === KUNCI_TOLAK) return tolak('kunci_tidak_sah')
      server = p.p_kunci
        ? { ...server, kunci_ada: true, kunci_sidik: 'ff00aa11bb', kunci_diubah_pada: '2026-11-16T07:30:00Z' }
        : { ...server, aktif: false, kunci_ada: false, kunci_sidik: null, kunci_diubah_pada: null }
    }
    return r.fulfill({ json: server, headers: cors })
  })

  const tema = async (t) => {
    await ctx.clearCookies()
    await ctx.addCookies([{ name: 'coreasia-theme', value: t, domain: '127.0.0.1', path: '/' }])
  }
  const lebar = async (w) => { await page.setViewportSize({ width: w, height: w > 500 ? 900 : 844 }); await page.waitForTimeout(250) }
  const meluber = () => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  // Jeda: transisi halaman dan dialog selesai dulu. Dialog dipotret selayar (bilah atas menempel di layar).
  const potret = async (nama, penuh = true) => {
    if (penuh) await page.evaluate(() => scrollTo(0, 0))
    await page.waitForTimeout(500)
    await page.screenshot({ path: join(output, `${nama}.png`), fullPage: penuh })
  }
  const gagal = (pesan) => { throw new Error(pesan) }
  const uji = id => page.locator(`[data-uji="${id}"]`)
  const buka = async (penanda) => {
    await page.goto(`${APP}/console/cashflow/domi`, { waitUntil: 'domcontentloaded' })
    await uji(penanda).waitFor({ timeout: 60000 })
    await page.getByRole('heading', { name: 'Domi: penyedia cadangan', exact: true }).waitFor()
  }
  const tampil = async (teks, di) => {
    for (const t of teks) if (!(await page.getByText(t, { exact: true }).first().isVisible())) gagal(`${di}: "${t}" tidak tampil`)
  }

  // 1. Tiga keadaan, terang dan gelap, 1440 dan 390.
  const KEADAAN = [
    ['belum-ada-kunci', kosong, 'cadangan-status', ['Belum ada kunci', 'Belum pernah dipakai', 'Tidak dipakai', 'Belum ada catatan galat', 'Cadangan baru bisa dinyalakan sesudah kuncinya disimpan.', 'Simpan kunci']],
    ['aktif', aktif, 'cadangan-status', ['Kunci tersimpan, sidik ab12cd34ef, diganti 16 Nov 2026 10.05', '16 Nov 2026 12.42', '7 kali', 'Ganti kunci', 'Hapus kunci', 'Belum ada yang diubah.']],
    ['rpc-belum-tersedia', () => null, 'cadangan-belum-aktif', ['Belum tersedia di server']],
  ]
  for (const [nama, buat, penanda, teks] of KEADAAN) {
    for (const t of ['terang', 'gelap']) {
      server = buat()
      await tema(t === 'terang' ? 'light' : 'dark')
      await lebar(1440)
      await buka(penanda)
      await tampil(teks, `${nama} ${t}`)
      if (await page.getByRole('alert').count()) gagal(`${nama} ${t}: ada galat merah`)
      if (nama === 'rpc-belum-tersedia' && await uji('cadangan-status').count()) gagal('RPC belum ada: kartu status tetap tampil')
      if (await meluber()) gagal(`${nama} ${t} meluber di 1440`)
      await potret(`${nama}-${t}-1440`)
      await lebar(390)
      if (await meluber()) gagal(`${nama} ${t} meluber di 390`)
      await potret(`${nama}-${t}-390`)
    }
  }
  hasil.tigaKeadaan = 'lulus'

  // 2. Belum ada kunci: sakelar dan Simpan mati, kunci salah ditolak di klien, kunci sah tersimpan.
  server = kosong()
  await tema('light')
  await lebar(1440)
  await buka('cadangan-status')
  if (!(await uji('cadangan-sakelar').isDisabled())) gagal('Tanpa kunci: sakelar bisa ditekan')
  if (!(await uji('cadangan-simpan').isDisabled())) gagal('Tanpa kunci: Simpan bisa ditekan')
  const kolom = uji('cadangan-kunci-isi')
  if (await kolom.getAttribute('type') !== 'password' || await kolom.getAttribute('autocomplete') !== 'off' || await kolom.getAttribute('name') !== null) gagal('Kolom kunci: atribut salah')
  if (await kolom.inputValue() !== '') gagal('Kolom kunci terisi saat dibuka')
  await kolom.fill('sk-proj-bukan-kunci-yang-benar-0000')
  await uji('cadangan-kunci-simpan').click()
  await page.getByText('Kunci Anthropic selalu diawali sk-ant-. Periksa lagi yang ditempel.', { exact: true }).waitFor()
  if (seen.some(x => x.name === 'admin_ai_cadangan_kunci')) gagal('Kunci berawalan salah tetap dikirim')
  await potret('kunci-ditolak-klien-terang-1440')
  await kolom.fill(KUNCI_TOLAK)
  await uji('cadangan-kunci-simpan').click()
  await page.getByText('Server menolak kunci ini. Pastikan kuncinya utuh dan masih berlaku.', { exact: true }).waitFor()
  await kolom.fill(KUNCI)
  await uji('cadangan-kunci-simpan').click()
  await page.getByText('Kunci tersimpan, sidik ff00aa11bb, diganti 16 Nov 2026 14.30', { exact: true }).waitFor()
  if (await kolom.inputValue() !== '') gagal('Kolom kunci tidak dikosongkan sesudah berhasil')
  const kirim = seen.filter(x => x.name === 'admin_ai_cadangan_kunci').at(-1)
  if (kirim?.p.p_kunci !== KUNCI || Object.keys(kirim.p).length !== 1) gagal('p_kunci tidak dikirim persis')
  // Kunci tidak tertinggal: DOM, URL, storage, log konsol, dan alamat permintaan.
  const jejak = await page.evaluate(() => JSON.stringify([document.documentElement.outerHTML, location.href, { ...localStorage }, { ...sessionStorage }, document.cookie, history.state]))
  for (const k of [KUNCI, KUNCI_TOLAK]) {
    if (jejak.includes(k)) gagal('Kunci tertinggal di halaman, URL, atau storage')
    if (logKonsol.some(l => l.includes(k))) gagal('Kunci masuk log konsol')
    if (urlDiminta.some(u => u.includes(k))) gagal('Kunci masuk alamat permintaan')
  }
  // Sesudah ada kunci: sakelar hidup, menyalakan lalu Simpan.
  await uji('cadangan-sakelar').click()
  await uji('cadangan-simpan').click()
  await page.getByText('Cadangan: Menyala', { exact: true }).waitFor()
  const simpan = seen.filter(x => x.name === 'admin_ai_cadangan_simpan').at(-1)?.p
  if (simpan?.p_aktif !== true || simpan?.p_model !== MODEL[0]) gagal(`Simpan mengirim ${JSON.stringify(simpan)}`)
  hasil.kunciPertama = 'lulus'

  // 3. Aktif: ganti kunci dan hapus kunci lewat konfirmasi.
  server = aktif()
  await tema('dark')
  await buka('cadangan-status')
  const sebelum = seen.length
  await kolom.fill(KUNCI)
  await uji('cadangan-kunci-simpan').click()
  await page.getByText('Ganti kunci yang tersimpan?', { exact: true }).waitFor()
  if (seen.slice(sebelum).some(x => x.name === 'admin_ai_cadangan_kunci')) gagal('Kunci diganti tanpa konfirmasi')
  await potret('konfirmasi-ganti-gelap-1440', false)
  await page.getByRole('button', { name: 'Batal', exact: true }).click()
  await page.getByText('Ganti kunci yang tersimpan?', { exact: true }).waitFor({ state: 'hidden' })
  if (seen.slice(sebelum).some(x => x.name === 'admin_ai_cadangan_kunci')) gagal('Batal tetap mengirim kunci')
  await uji('cadangan-kunci-simpan').click()
  await uji('cadangan-konfirmasi-setuju').click()
  await page.getByText('Kunci tersimpan, sidik ff00aa11bb, diganti 16 Nov 2026 14.30', { exact: true }).waitFor()
  if (await kolom.inputValue() !== '') gagal('Kolom kunci tidak dikosongkan sesudah diganti')
  await tema('light')
  await buka('cadangan-status')
  await uji('cadangan-kunci-hapus').click()
  await page.getByText('Hapus kunci cadangan?', { exact: true }).waitFor()
  await potret('konfirmasi-hapus-terang-1440', false)
  await lebar(390)
  await potret('konfirmasi-hapus-terang-390', false)
  await lebar(1440)
  await uji('cadangan-konfirmasi-setuju').click()
  await page.getByText('Belum ada kunci', { exact: true }).waitFor()
  await page.getByText('Cadangan: Mati', { exact: true }).waitFor()
  if (seen.filter(x => x.name === 'admin_ai_cadangan_kunci').at(-1)?.p.p_kunci !== null) gagal('Hapus tidak mengirim p_kunci null')
  hasil.gantiHapus = 'lulus'

  // 4. Meninggalkan halaman dengan kunci terketik: kembali, kolomnya kosong.
  await kolom.fill(KUNCI)
  await page.getByRole('link', { name: 'Paket kredit', exact: true }).click()
  await page.waitForURL('**/console/cashflow/paket')
  await page.getByRole('link', { name: 'Cadangan Domi', exact: true }).click()
  await uji('cadangan-status').waitFor()
  if (await kolom.inputValue() !== '') gagal('Kunci tertinggal sesudah meninggalkan halaman')
  hasil.tinggalHalaman = 'lulus'

  // 5. Tanpa izin tulis: keadaan terbaca, semua tombol tulis mati.
  izin = ['cashflow:view']
  await pasangIzin()
  // Login console tanpa TOTP: server tidak mencetak izin tulis, dan sesi tidak perlu disambung ulang.
  await page.route('**/api/gw/admin/auth/me', r => r.fulfill({ json: { data: { id: 'admin-test', email: 'admin@contoh.invalid', full_name: 'Admin Contoh', role: 'super_admin', is_active: true, mfa: false, totp_enabled: false } } }))
  server = aktif()
  await buka('cadangan-status')
  await page.getByText('Mengubah setelan dan kunci butuh login console ber-TOTP. Keadaannya tetap bisa dilihat.', { exact: true }).waitFor()
  for (const id of ['cadangan-sakelar', 'cadangan-model', 'cadangan-simpan', 'cadangan-kunci-isi', 'cadangan-kunci-simpan', 'cadangan-kunci-hapus']) {
    if (!(await uji(id).isDisabled())) gagal(`Tanpa izin: ${id} masih hidup`)
  }
  // Tata letak console dirender ulang sesudah /me yang baru terbaca. Tunggu sampai tenang.
  await page.waitForTimeout(1500)
  await potret('tanpa-izin-tulis-terang-1440')
  hasil.tanpaIzin = 'lulus'

  if (errors.length) gagal(`Galat browser: ${errors.join('; ')}`)
  console.log(JSON.stringify({ ...hasil, errors }))
} finally {
  if (browser) try { const s = await browser.newBrowserCDPSession(); await s.send('Browser.close') } catch { /* Chrome sudah tertutup. */ }
  chrome.kill()
  await rm(dir, { recursive: true, force: true }).catch(() => {})
}
