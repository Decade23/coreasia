// Uji tampilan saringan Sedang diproses dan Ditolak di halaman Pembelian kredit
// dengan data sintetis. Tiga keadaan server:
//   - menggantung: ada pembelian Google Play yang menunggu lebih dari 1 jam,
//     ditambah keadaan, sebab, dan sumber yang belum dikenal console serta baris
//     tanpa kunci proses;
//   - kosong: tidak ada yang menunggu;
//   - server-lama: RPC menolak p_status baru (22023 masukan_tidak_sah).
// Terang dan gelap, lebar 1440 dan 390. Juga: pindah saringan lewat pil,
// pilihan QRIS mati di saringan proses, tombol dari panel perhatian, dan jalan
// kembali dari keadaan server lama. Chrome headless lewat CDP, tanpa jendela.
//
// Jalankan server lokal TANPA .env (tidak ada kunci sungguhan):
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_URL=http://127.0.0.1:4398 \
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY=anon-sintetis \
//   npx nuxi dev --port 4399 --host 127.0.0.1
// lalu:
//   PLAYWRIGHT_CORE_PATH=<playwright-core/index.mjs> CF_QA_ARTIFACTS=<folder> \
//   node scripts/uji-console-pembelian-proses-headless.mjs
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
const dir = await mkdtemp(join(process.env.CF_QA_TMP || tmpdir(), 'cf-pembelian-proses-'))
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--user-data-dir=${dir}`, `--remote-debugging-port=${cdpPort}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

// ── Data sintetis (karangan). Waktunya relatif terhadap jam mesin, karena
//    halaman menghitung lama menunggu dari jam peramban. ──────────────────
const KINI = Date.now()
const lalu = menit => new Date(KINI - menit * 60_000).toISOString()
const uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const pembeli = (n, nama = null) => ({ user_id: uuid(100 + n), email: `pembeli.${['sari', 'agus', 'nina', 'rahmat', 'dewi', 'tono', 'lina', 'bayu', 'putri'][n]}@contoh.invalid`, nama })
const PAKET = { kredit_40: [40, 49_000], kredit_90: [90, 99_000], kredit_136: [136, 149_000] }
const baris = (n, status, { paket = 'kredit_40', menit, uji = false, siapa = n, nama = null, proses }) => ({
  id: uuid(500 + n), kode: null, waktu: lalu(menit), status, jalur: 'play',
  paket: paket in PAKET ? paket : null, kredit: PAKET[paket]?.[0] ?? null, nominal: PAKET[paket]?.[1] ?? null, uji,
  pembeli: pembeli(siapa, nama), play: null,
  ...(proses === undefined ? {} : { proses: proses && { produk: paket, sejak: lalu(menit), terakhir: lalu(Math.max(0, menit - 3)), dicoba_pada: null, percobaan: 0, bisa_dicoba: true, sumber: 'aplikasi', rinci: null, ...proses } }),
})
const DIPROSES = [
  baris(1, 'diproses', { menit: 12, nama: 'Sari Contoh', proses: { keadaan: 'tertunda' } }),
  baris(2, 'diproses', { paket: 'kredit_90', menit: 74, proses: { keadaan: 'tertunda', sumber: 'rtdn', dicoba_pada: lalu(8), percobaan: 6 } }),
  baris(3, 'diproses', { paket: 'kredit_136', menit: 190, nama: 'Nina Contoh', proses: { keadaan: 'gagal_sementara', sumber: 'sapu', dicoba_pada: lalu(25), percobaan: 9, bisa_dicoba: false } }),
  baris(4, 'diproses', { menit: 35, uji: true, proses: { keadaan: 'gagal_sementara', dicoba_pada: lalu(4), percobaan: 1 } }),
  // Keadaan dan sumber yang belum dikenal console, dan baris tanpa kunci proses.
  baris(5, 'diproses', { paket: 'kredit_lama_99', menit: 20, proses: { keadaan: 'baru_nanti', sumber: 'pos_merpati', percobaan: '-1' } }),
  baris(6, 'diproses', { menit: 6 }),
]
const DITOLAK = [
  baris(7, 'ditolak', { menit: 40, proses: { keadaan: 'ditolak', rinci: 'batal_google', sumber: 'rtdn', bisa_dicoba: false } }),
  baris(8, 'ditolak', { paket: 'kredit_90', menit: 300, proses: { keadaan: 'ditolak', rinci: 'akun_lain', bisa_dicoba: false } }),
  baris(0, 'ditolak', { menit: 1500, proses: { keadaan: 'ditolak', rinci: 'sudah_batal', sumber: 'sapu', percobaan: 3, dicoba_pada: lalu(1450), bisa_dicoba: false } }),
  baris(1, 'ditolak', { paket: 'kredit_136', menit: 3000, nama: 'Sari Contoh', proses: { keadaan: 'ditolak', rinci: 'tidak_dikenal', bisa_dicoba: false } }),
  baris(2, 'ditolak', { menit: 4400, proses: { keadaan: 'ditolak', rinci: 'sebab_baru', bisa_dicoba: false } }),
]
const RINGKAS_NOL = { lunas: 0, nominal_lunas: 0, perkiraan_diterima: 0, batal: 0, total_tidak_tersedia: 0, diterima_tidak_tersedia: 0, diterima_perkiraan: 0 }
const HITUNG = { diproses: 5, tertunda: 2, gagal_sementara: 3, ditolak: 5, tertua: lalu(190) }
const HITUNG_KOSONG = { diproses: 0, tertunda: 0, gagal_sementara: 0, ditolak: 0, tertua: null }
/* Saringan lama: satu pembelian lunas, supaya jalan kembali terlihat berisi. */
const LUNAS = [{
  id: uuid(900), kode: 'CF4821', waktu: lalu(600), status: 'lunas', jalur: 'qris', paket: 'kredit_40', kredit: 40, nominal: 49_000, uji: false,
  pembeli: pembeli(5, 'Dewi Contoh'), play: null,
}]
const daftarLama = () => ({ baris: LUNAS, ringkas: { lunas: 1, nominal_lunas: 49_000, perkiraan_diterima: 44_560, batal: 0 }, lanjut: null })
const JAWAB = {
  menggantung: p => (p.p_status === 'diproses' ? { baris: p.p_jalur === 'qris' ? [] : DIPROSES, ringkas: RINGKAS_NOL, lanjut: null, proses: HITUNG }
    : p.p_status === 'ditolak' ? { baris: p.p_jalur === 'qris' ? [] : DITOLAK, ringkas: RINGKAS_NOL, lanjut: null, proses: HITUNG }
      : daftarLama()),
  kosong: p => (['diproses', 'ditolak'].includes(p.p_status) ? { baris: [], ringkas: RINGKAS_NOL, lanjut: null, proses: HITUNG_KOSONG } : daftarLama()),
  'server-lama': p => (['diproses', 'ditolak'].includes(p.p_status) ? null : daftarLama()),
}
/** Kode server dan jalur kamus yang tidak boleh terbaca di layar. */
const MENTAH = /\b(?:gagal_sementara|batal_google|akun_lain|sudah_batal|tidak_dikenal|baru_nanti|sebab_baru|pos_merpati|masukan_tidak_sah)\b|pembelian\.\w|undefined|\bNaN\b/

let browser
const hasil = {}
try {
  for (let i = 0; i < 100; i++) { try { const r = await fetch(`http://127.0.0.1:${cdpPort}/json/version`); if (r.ok) break } catch { /* Chrome belum siap. */ } await new Promise(r => setTimeout(r, 100)) }
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`)
  const ctx = browser.contexts()[0]
  const page = ctx.pages()[0]
  const jwt = ['eyJhbGciOiJub25lIn0', Buffer.from(JSON.stringify({ sub: uuid(1), role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'test'].join('.')
  const session = { access_token: jwt, refresh_token: 'test-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user: { id: uuid(1), aud: 'authenticated', role: 'authenticated', email: 'admin@contoh.invalid' } }
  const izin = ['cashflow:view', 'cashflow:pii', 'cashflow:investigasi', 'cashflow:tindak', 'cashflow:ekspor']
  await ctx.addInitScript(({ session, izin }) => {
    if (location.protocol !== 'http:') return
    sessionStorage.setItem('cf-console-sesi', JSON.stringify(session))
    sessionStorage.setItem('cf_izin', JSON.stringify(izin))
    // Panel devtools server dev menutupi isi tangkapan layar.
    addEventListener('DOMContentLoaded', () => {
      const gaya = document.createElement('style')
      gaya.textContent = '[id^="nuxt-devtools"]{display:none!important}'
      document.head.append(gaya)
    })
  }, { session, izin })
  // Tidak ada akses ke layanan luar atau gateway sungguhan.
  await ctx.route('**/*', (route) => {
    const u = new URL(route.request().url())
    return u.hostname === '127.0.0.1' && PORT_BOLEH.includes(u.port) ? route.continue() : route.abort()
  })
  await page.route('**/api/gw/**', r => r.fulfill({ status: 404, json: { error: 'gateway sintetis' } }))
  await page.route('**/api/gw/admin/auth/me', r => r.fulfill({ json: { data: { id: 'admin-test', email: 'admin@contoh.invalid', full_name: 'Admin Contoh', role: 'super_admin', is_active: true, mfa: true, mfa_at: new Date().toISOString(), totp_enabled_at: '2026-01-01T00:00:00Z' } } }))

  let keadaan = 'menggantung'
  const seen = []
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  const cors = { 'access-control-allow-origin': '*' }
  await page.route(`${SUPABASE}/**`, async (r) => {
    const req = r.request()
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' } })
    const name = new URL(req.url()).pathname.split('/').pop()
    const p = req.postDataJSON() || {}
    if (name !== 'admin_ai_pembelian_daftar') return r.fulfill({ json: {}, headers: cors })
    seen.push(p)
    const isi = JAWAB[keadaan](p)
    if (!isi) return r.fulfill({ status: 400, headers: cors, json: { code: '22023', details: null, hint: 'status', message: 'masukan_tidak_sah' } })
    return r.fulfill({ json: isi, headers: cors })
  })

  const tema = async (t) => {
    await ctx.clearCookies()
    await ctx.addCookies([{ name: 'coreasia-theme', value: t, domain: '127.0.0.1', path: '/' }])
  }
  const lebar = async (w) => { await page.setViewportSize({ width: w, height: w > 500 ? 900 : 844 }); await page.waitForTimeout(250) }
  const meluber = () => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  const tabelBergulir = () => page.evaluate(() => [...document.querySelectorAll('.cf-tabel-gulir')]
    .some(e => e.offsetParent !== null && e.scrollWidth > e.clientWidth + 1))
  const potret = async (nama) => {
    await page.evaluate(() => scrollTo(0, 0))
    await page.waitForTimeout(500)
    await page.screenshot({ path: join(output, `${nama}.png`), fullPage: true })
  }
  const gagal = (pesan) => { throw new Error(pesan) }
  const uji = id => page.locator(`[data-uji="${id}"]`)
  const buka = async (status, penanda) => {
    await page.goto(`${APP}/console/cashflow/pembelian?status=${status}`, { waitUntil: 'domcontentloaded' })
    await uji(penanda).first().waitFor({ timeout: 60000 })
  }
  /** Teks tampil di salah satu tempat. Tabel dan kartu memuat teks yang sama, salah satunya tersembunyi. */
  const tampil = async (teks, di) => {
    for (const t of teks) {
      const semua = await page.getByText(t, { exact: false }).all()
      let ada = false
      for (const l of semua) if (await l.isVisible()) { ada = true; break }
      if (!ada) gagal(`${di}: "${t}" tidak tampil`)
    }
  }
  const bersih = async (di) => {
    const teks = await page.evaluate(() => document.querySelector('main')?.innerText ?? document.body.innerText)
    const m = teks.match(MENTAH)
    if (m) gagal(`${di}: kode mentah atau teks rusak terbaca: "${m[0]}"`)
    if (await page.getByRole('alert').count()) gagal(`${di}: ada galat merah`)
  }

  // 1. Tiga keadaan, dua saringan, terang dan gelap, 1440 dan 390.
  const KASUS = [
    ['menggantung', 'diproses', 'pembelian-proses-tabel', ['Ada pembelian yang menunggu lebih dari 1 jam', 'Menunggu pembayaran', 'Belum bisa diperiksa', 'Server tidak bisa mencoba lagi sendiri', 'Keadaan rincinya belum dikenal halaman ini', 'Server tidak mengirim rincian keadaannya', '9 kali', '3 jam']],
    ['menggantung', 'ditolak', 'pembelian-proses-tabel', ['Google membatalkan pembayaran ini sebelum lunas', 'milik akun CashFlow lain', 'Google sudah mengembalikan dana pesanan ini', 'tidak lolos pemeriksaan', 'Sebab rincinya belum dikenal halaman ini', 'Lihat yang sedang diproses']],
    ['kosong', 'diproses', 'pembelian-proses-ringkas', ['Tidak ada yang menunggu', 'Tidak ada pembelian Google Play yang sedang menunggu', 'Tidak ada pembelian yang sedang menunggu.']],
    ['server-lama', 'diproses', 'pembelian-proses-server-lama', ['Saringan ini belum dikenal server', 'Kembali ke semua status']],
  ]
  for (const [k, status, penanda, teks] of KASUS) {
    for (const t of ['terang', 'gelap']) {
      keadaan = k
      await tema(t === 'terang' ? 'light' : 'dark')
      await lebar(1440)
      await buka(status, penanda)
      await page.waitForTimeout(300)
      await tampil(teks, `${k} ${status} ${t} 1440`)
      await bersih(`${k} ${status} ${t} 1440`)
      if (await meluber()) gagal(`${k} ${status} ${t}: meluber di 1440`)
      if (await tabelBergulir()) gagal(`${k} ${status} ${t}: tabel bergulir ke samping di 1440`)
      if (k === 'server-lama' && await uji('pembelian-proses-ringkas').count()) gagal('Server lama: ringkasan proses tetap tampil')
      if (k === 'menggantung' && status === 'diproses' && await uji('pembelian-ringkas').count()) gagal('Ringkasan pembelian berisi nol ikut tampil di saringan proses')
      await potret(`${k}-${status}-${t}-1440`)
      await lebar(390)
      if (await meluber()) gagal(`${k} ${status} ${t}: meluber di 390`)
      if (k === 'menggantung') {
        // Tunggu tata letak ponsel selesai (server dev kadang memuat ulang modul sesudah ukuran berubah).
        await uji('pembelian-proses-kartu').waitFor({ state: 'visible', timeout: 5000 }).catch(() => gagal(`${k} ${status} ${t}: kartu ponsel tidak tampil di 390`))
        if (await uji('pembelian-proses-tabel').isVisible()) gagal(`${k} ${status} ${t}: tabel tetap tampil di 390`)
        const kartuLewat = await page.evaluate(() => [...document.querySelectorAll('[data-uji="pembelian-proses-kartu"] > li')]
          .some(li => li.getBoundingClientRect().right > document.documentElement.clientWidth + 1))
        if (kartuLewat) gagal(`${k} ${status} ${t}: kartu melewati tepi di 390`)
      }
      await bersih(`${k} ${status} ${t} 390`)
      // Kalimat panel (server lama, perhatian) tidak terjepit tombol di sampingnya.
      const sempit = await page.evaluate(() => [...document.querySelectorAll('[data-uji="teks-panel"]')]
        .filter(e => e.offsetParent !== null).map(e => Math.round(e.getBoundingClientRect().width)).filter(w => w < 220))
      if (sempit.length) gagal(`${k} ${status} ${t}: kalimat panel terjepit di 390 (${sempit.join(', ')} px)`)
      // Pilihan status yang aktif terlihat tanpa menggeser.
      const aktifTerlihat = await page.evaluate(() => {
        const b = document.querySelector('[role="group"] button[aria-pressed="true"]')
        if (!b) return true
        const r = b.getBoundingClientRect()
        return r.left >= 0 && r.right <= document.documentElement.clientWidth
      })
      if (!aktifTerlihat) gagal(`${k} ${status} ${t}: pilihan status aktif tidak terlihat di 390`)
      await potret(`${k}-${status}-${t}-390`)
    }
  }
  hasil.empatKeadaan = 'lulus'

  // 2. Panggilan server: p_status diteruskan, QRIS mati di saringan proses, pindah saringan lewat pil dan panel.
  keadaan = 'menggantung'
  await tema('light')
  await lebar(1440)
  await buka('diproses', 'pembelian-proses-tabel')
  if (seen.at(-1)?.p_status !== 'diproses' || seen.at(-1)?.p_jalur !== null) gagal(`p_status/p_jalur salah: ${JSON.stringify(seen.at(-1))}`)
  const qris = page.locator('[role="group"] button[data-seg="qris"]')
  if (!(await qris.isDisabled())) gagal('Pilihan QRIS tidak mati di saringan Sedang diproses')
  await page.locator('[role="group"] button[data-seg="ditolak"]').click()
  await page.waitForURL(/status=ditolak/)
  await uji('pembelian-proses-lihat-diproses').waitFor()
  if (seen.at(-1)?.p_status !== 'ditolak') gagal('Pil Ditolak tidak memanggil p_status ditolak')
  await uji('pembelian-proses-lihat-diproses').click()
  await page.waitForURL(/status=diproses/)
  await uji('pembelian-proses-tabel').waitFor()
  if (seen.at(-1)?.p_status !== 'diproses') gagal('Tombol panel tidak kembali ke p_status diproses')
  // Dari saringan lama berjalur QRIS ke Sedang diproses: jalurnya kembali ke semua.
  await page.goto(`${APP}/console/cashflow/pembelian?jalur=qris`, { waitUntil: 'domcontentloaded' })
  await uji('pembelian-tabel').waitFor({ timeout: 60000 })
  await page.locator('[role="group"] button[data-seg="diproses"]').click()
  await uji('pembelian-proses-tabel').waitFor()
  if (/jalur=qris/.test(page.url()) || seen.at(-1)?.p_jalur !== null) gagal('Jalur QRIS tidak dikembalikan ke semua saat pindah ke Sedang diproses')
  // Tautan langsung berjalur QRIS di saringan proses: kosong dengan kalimat yang tepat.
  await page.goto(`${APP}/console/cashflow/pembelian?status=ditolak&jalur=qris`, { waitUntil: 'domcontentloaded' })
  await uji('pembelian-proses-ringkas').waitFor({ timeout: 60000 })
  await tampil(['Keadaan ini hanya ada untuk Google Play.'], 'ditolak QRIS')
  await potret('menggantung-ditolak-qris-terang-1440')
  hasil.pindahSaringan = 'lulus'

  // 3. Server lama: jalan kembali ke semua status memuat daftar biasa.
  keadaan = 'server-lama'
  await buka('ditolak', 'pembelian-proses-server-lama')
  await uji('pembelian-proses-kembali').click()
  await uji('pembelian-tabel').waitFor()
  if (/status=/.test(page.url())) gagal('Kembali ke semua status: saringan tetap di URL')
  if (seen.at(-1)?.p_status !== null) gagal('Kembali ke semua status: p_status bukan null')
  await bersih('server lama sesudah kembali')
  hasil.serverLamaKembali = 'lulus'

  if (errors.length) gagal(`Galat browser: ${errors.join('; ')}`)
  console.log(JSON.stringify({ ...hasil, panggilan: seen.length, errors }))
} finally {
  if (browser) try { const s = await browser.newBrowserCDPSession(); await s.send('Browser.close') } catch { /* Chrome sudah tertutup. */ }
  chrome.kill()
  await rm(dir, { recursive: true, force: true }).catch(() => {})
}
