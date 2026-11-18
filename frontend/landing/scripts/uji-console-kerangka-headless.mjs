// Uji kerangka console CashFlow dengan data sintetis: tema area (terang dan
// gelap), navigasi tab berkelompok lima pintu, kepala halaman ringkas, palet,
// papan ketik, dan layar sempit. Juga membuktikan bagian console di luar
// CashFlow (sidebar, bilah atas, halaman modul lain) tidak ikut berubah.
// Lebar 1440 dan 390. Chrome headless lewat CDP, tanpa jendela.
//
// Jalankan server lokal TANPA .env (tidak ada kunci sungguhan):
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_URL=http://127.0.0.1:4398 \
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY=anon-sintetis \
//   npx nuxi dev --port 4399 --host 127.0.0.1
// lalu:
//   PLAYWRIGHT_CORE_PATH=<playwright-core/index.mjs> CF_QA_ARTIFACTS=<folder> \
//   node scripts/uji-console-kerangka-headless.mjs
// CF_QA_APP dan CF_QA_SUPABASE mengganti alamat bawaan di atas. CF_QA_TMP boleh
// menunjuk folder profil Chrome sementara (bawaan tmpdir).
//
// CF_QA_DASAR=1: hanya memotret (awalan "dasar-"), tanpa pemeriksaan navigasi.
// Dipakai di cabang pembanding sebelum perubahan. Sesudah itu jalankan tanpa
// variabel ini di cabang kerja dengan CF_QA_ARTIFACTS yang sama: halaman di
// luar CashFlow dibandingkan piksel demi piksel dengan potret dasarnya
// (selisih sampai 2/255 per kanal dianggap derau render).
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'
import { tmpdir, homedir } from 'node:os'
import { join } from 'node:path'

const pwPath = process.env.PLAYWRIGHT_CORE_PATH
const { chromium } = await (pwPath ? import(pathToFileURL(pwPath).href) : import('playwright-core'))
const output = process.env.CF_QA_ARTIFACTS || join(homedir(), 'Codex', 'artifact', 'coreasia')
const APP = process.env.CF_QA_APP || 'http://127.0.0.1:4399'
const SUPABASE = process.env.CF_QA_SUPABASE || 'http://127.0.0.1:4398'
const DASAR = process.env.CF_QA_DASAR === '1'
const PORT_BOLEH = [new URL(APP).port, new URL(SUPABASE).port]
await mkdir(output, { recursive: true })
const portServer = createServer()
await new Promise(r => portServer.listen(0, '127.0.0.1', r))
const cdpPort = portServer.address().port
await new Promise(r => portServer.close(r))
const dir = await mkdtemp(join(process.env.CF_QA_TMP || tmpdir(), 'cf-kerangka-'))
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--user-data-dir=${dir}`, `--remote-debugging-port=${cdpPort}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

// ── Data sintetis (karangan, waktunya tetap supaya potret bisa dibandingkan) ──
const SAAT = Date.parse('2026-11-16T05:00:00Z')
const jam = j => new Date(SAAT - j * 3_600_000).toISOString()
const NAMA = ['sari', 'rahmawati.kusumaningsih', 'tim.uji', 'dewi', 'raka', 'toko.berkah.jaya.abadi', 'agus', 'nina']
const STATUS = ['masuk', 'kirim', 'kirim', 'belum', 'lewat', 'masuk', 'kirim', 'masuk']
const pengguna = () => ({
  total: NAMA.length,
  baris: NAMA.map((nama, i) => ({
    user_id: `00000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
    email: `${nama.slice(0, 3)}***@contoh.invalid`, display_name: '',
    created_at: jam(24 * (i + 3) * 9), last_sign_in: jam(5 * (i + 1)), aktivitas_terakhir: jam(4 * (i + 1)), banned_until: null,
    jumlah_ruang: 1 + (i % 3), jumlah_tx: i * 37, jumlah_nominal: i * 1_250_000, terbuka: false, menunggu_hapus: false,
    nomor_wa: STATUS[i] === 'belum' ? null : `0811 •••• ${1000 + i}`,
    versi_aplikasi: i % 3 ? '1.4.1' : '1.4.0', platform: i % 4 === 3 ? 'ios' : 'android',
    status_wa: STATUS[i], status_wa_pada: STATUS[i] === 'belum' ? null : jam(24 * (i + 2)), lewat_sebab: STATUS[i] === 'lewat' ? 'gangguan' : null,
    nomor_ramai: false, kredit_ditahan: false,
    domi_tanya: [412, 42, 1280, 0, 3, 58, 14, 0][i], domi_tanya_30: [96, 9, 310, 0, 3, 0, 2, 0][i], domi_tanya_kira: false,
    domi_terakhir: [412, 42, 1280, 0, 3, 58, 14, 0][i] ? jam(6 * (i + 1)) : null,
    kredit_sisa: [37, 8, 9999, 20, 17, 0, 70, 20][i], kredit_beli: [3, 0, 0, 0, 0, 1, 2, 0][i], internal: i === 2,
    total_semua: NAMA.length,
  })),
  versi_terbaru: { android: '0001000400010000100000' }, hapus_tersedia: true, jumlah_pakai_domi: 5,
})
const RPC = {
  admin_stats: () => ({
    total_pengguna: 1248, total_ruang: 1610, total_transaksi: 48213,
    transaksi_per_hari: Array.from({ length: 30 }, (_, i) => ({ tanggal: new Date(SAAT - (29 - i) * 86_400_000).toISOString().slice(0, 10), jumlah: 900 + ((i * 137) % 420) })),
  }),
  admin_ukuran_keberhasilan_v2: () => [{ jumlah: 412, pembanding: 380, jumlah_pengecualian: 4 }],
  admin_corong_aktivasi: () => [
    { urut: 1, langkah: 'daftar', jumlah: 320 }, { urut: 2, langkah: 'masuk_lagi', jumlah: 301 }, { urut: 3, langkah: 'menyiapkan', jumlah: 262 },
    { urut: 4, langkah: 'tx_pertama', jumlah: 214 }, { urut: 5, langkah: 'sepuluh_tx', jumlah: 97 },
  ],
  admin_retensi: () => Array.from({ length: 6 }, (_, i) => ({
    kohort: `2026-${String(6 + i).padStart(2, '0')}-01`, mendaftar: 150 + i * 22, pernah_catat: 110 + i * 15, catat_30hari: 60 + i * 9, bulan_berjalan: i === 5,
  })),
  admin_daftar_pengguna_v4: pengguna,
  admin_daftar_pengguna_v3: pengguna,
  admin_ai_cadangan_baca: () => ({
    aktif: true, model: 'model-contoh-teliti', model_pilihan: ['model-contoh-cepat', 'model-contoh-teliti'], kunci_ada: true,
    kunci_sidik: 'ab12cd34ef', kunci_diubah_pada: '2026-11-16T03:05:00Z', terakhir_dipakai_pada: '2026-11-16T04:42:00Z', dipakai_24_jam: 7,
    terakhir_galat: null, terakhir_galat_pada: null,
    utama_terakhir_galat: 'Penyedia utama menjawab 503 sesudah menunggu 30 detik.', utama_terakhir_galat_pada: '2026-11-16T04:41:00Z',
  }),
}

/* Halaman yang dipotret: Ringkasan, Pengguna, Cadangan Domi, dan satu halaman
   dari tiap pintu. `pintu`/`halaman` = yang harus aktif di navigasi. */
const HALAMAN = [
  { nama: 'ringkasan', jalur: '/console/cashflow', pintu: 'ringkasan', halaman: 'ringkasan', baris: ['ringkasan', 'laporan'] },
  { nama: 'pengguna', jalur: '/console/cashflow/pengguna', pintu: 'orang', halaman: 'pengguna', baris: ['pengguna', 'ruang', 'aktivitas', 'corongWa'] },
  { nama: 'cadangan-domi', jalur: '/console/cashflow/domi', pintu: 'domi', halaman: 'domi', baris: ['domi', 'paket', 'pembelian'] },
  { nama: 'pengumuman', jalur: '/console/cashflow/pengumuman', pintu: 'kabar', halaman: 'pengumuman', baris: ['pengumuman', 'dukungan', 'kasus'] },
  { nama: 'sakelar', jalur: '/console/cashflow/sakelar', pintu: 'operasional', halaman: 'sakelar', baris: ['kesehatan', 'sakelar', 'hapusAkun', 'audit'] },
]
/* Tidak dipotret, tetapi navigasinya diperiksa: sisa menu dan rute bersarang. */
const ID = '00000000-0000-0000-0000-000000000001'
const RUTE_LAIN = [
  ['/console/cashflow/laporan', 'ringkasan', 'laporan', 'page'],
  ['/console/cashflow/ruang', 'orang', 'ruang', 'page'], ['/console/cashflow/aktivitas', 'orang', 'aktivitas', 'page'],
  ['/console/cashflow/corong', 'orang', 'corongWa', 'page'], ['/console/cashflow/paket', 'domi', 'paket', 'page'],
  ['/console/cashflow/pembelian', 'domi', 'pembelian', 'page'], ['/console/cashflow/dukungan', 'kabar', 'dukungan', 'page'],
  ['/console/cashflow/kasus', 'kabar', 'kasus', 'page'], ['/console/cashflow/kesehatan', 'operasional', 'kesehatan', 'page'],
  ['/console/cashflow/hapus-akun', 'operasional', 'hapusAkun', 'page'], ['/console/cashflow/audit', 'operasional', 'audit', 'page'],
  [`/console/cashflow/ruang/${ID}`, 'orang', 'ruang', 'true'], [`/console/cashflow/ruang/${ID}/anggota`, 'orang', 'ruang', 'true'],
  [`/console/cashflow/pengguna/${ID}`, 'orang', 'pengguna', 'true'], [`/console/cashflow/pengguna/${ID}/domi`, 'orang', 'pengguna', 'true'],
]
const LUAR = [{ nama: 'dashboard', jalur: '/console' }, { nama: 'audit-log', jalur: '/console/audit-log' }]

let browser
const hasil = {}
try {
  for (let i = 0; i < 100; i++) { try { const r = await fetch(`http://127.0.0.1:${cdpPort}/json/version`); if (r.ok) break } catch { /* Chrome belum siap. */ } await new Promise(r => setTimeout(r, 100)) }
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`)
  const ctx = browser.contexts()[0]
  const page = ctx.pages()[0]
  const jwt = ['eyJhbGciOiJub25lIn0', Buffer.from(JSON.stringify({ sub: ID, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'test'].join('.')
  const session = { access_token: jwt, refresh_token: 'test-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user: { id: ID, aud: 'authenticated', role: 'authenticated', email: 'admin@contoh.invalid' } }
  await ctx.addInitScript(({ session, izin }) => {
    if (location.protocol !== 'http:') return
    sessionStorage.setItem('cf-console-sesi', JSON.stringify(session))
    sessionStorage.setItem('cf_izin', JSON.stringify(izin))
    // Panel devtools server dev menutupi isi tangkapan layar; animasi dimatikan supaya potret stabil.
    addEventListener('DOMContentLoaded', () => {
      const gaya = document.createElement('style')
      gaya.textContent = '[id^="nuxt-devtools"]{display:none!important}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
      document.head.append(gaya)
    })
  }, { session, izin: ['cashflow:view', 'cashflow:pii', 'cashflow:investigasi', 'cashflow:tindak', 'cashflow:ekspor'] })
  // Tidak ada akses ke layanan luar atau gateway sungguhan.
  await ctx.route('**/*', (route) => {
    const u = new URL(route.request().url())
    return u.hostname === '127.0.0.1' && PORT_BOLEH.includes(u.port) ? route.continue() : route.abort()
  })
  await page.route('**/api/gw/**', r => r.fulfill({ status: 404, json: { error: 'gateway sintetis' } }))
  await page.route('**/api/gw/admin/auth/me', r => r.fulfill({ json: { data: { id: 'admin-test', email: 'admin@contoh.invalid', full_name: 'Admin Contoh', role: 'super_admin', is_active: true, mfa: true, mfa_at: new Date(SAAT).toISOString(), totp_enabled_at: '2026-01-01T00:00:00Z' } } }))
  const errors = []
  /* Galat halaman hanya dicatat saat `catatGalat` hidup. Di langkah 2 halaman dibuka
     dengan jawaban kosong hanya untuk membaca navigasinya, jadi isi halamannya
     boleh gagal memetakan data kosong itu. */
  let catatGalat = true
  page.on('pageerror', e => { if (catatGalat) errors.push(`${new URL(page.url()).pathname}: ${e.message}`) })
  const cors = { 'access-control-allow-origin': '*' }
  await page.route(`${SUPABASE}/**`, async (r) => {
    const req = r.request()
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' } })
    const name = new URL(req.url()).pathname.split('/').pop()
    // RPC yang tidak dikarang di atas menjawab kosong: daftar kosong atau objek kosong.
    const kosong = /^admin_(daftar_|ocr_|foto_|telemetri_)/.test(name) ? [] : {}
    return r.fulfill({ json: RPC[name] ? RPC[name]() : kosong, headers: cors })
  })

  const tema = async (t) => {
    await ctx.clearCookies()
    await ctx.addCookies([{ name: 'coreasia-theme', value: t === 'terang' ? 'light' : 'dark', domain: '127.0.0.1', path: '/' }])
  }
  const lebar = async (w) => { await page.setViewportSize({ width: w, height: w > 500 ? 900 : 844 }); await page.waitForTimeout(250) }
  const meluber = () => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  const potret = async (nama, penuh = true) => {
    await page.evaluate(() => { scrollTo(0, 0); document.activeElement?.blur?.() })
    await page.waitForTimeout(600)
    const jalur = join(output, `${nama}.png`)
    await page.screenshot({ path: jalur, fullPage: penuh })
    return jalur
  }
  const gagal = (pesan) => { throw new Error(pesan) }
  const buka = async (jalur) => {
    await page.goto(`${APP}${jalur}`, { waitUntil: 'domcontentloaded' })
    await page.locator('.ca-console-sidebar').waitFor({ timeout: 60000 })
    if (jalur.startsWith('/console/cashflow')) await page.locator('h1').first().waitFor({ timeout: 60000 })
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(700)
  }
  const sidik = async jalur => createHash('sha256').update(await readFile(jalur)).digest('hex').slice(0, 10)
  /* Dua potret dibandingkan piksel demi piksel di dalam peramban (tanpa pustaka
     tambahan). Selisih sampai DERAU per kanal dianggap sama: bidang buram di
     bilah atas dirender dengan pembulatan yang bisa bergeser 1/255 antar jalan. */
  const DERAU = 2
  const bandingkan = async (a, b) => page.evaluate(async ({ a, b, derau }) => {
    const data = async (b64) => {
      const gambar = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type: 'image/png' }))
      const kanvas = new OffscreenCanvas(gambar.width, gambar.height)
      const k = kanvas.getContext('2d')
      k.drawImage(gambar, 0, 0)
      return { w: gambar.width, h: gambar.height, d: k.getImageData(0, 0, gambar.width, gambar.height).data }
    }
    const [x, y] = [await data(a), await data(b)]
    if (x.w !== y.w || x.h !== y.h) return { ukuranSama: false, piksel: -1, terbesar: -1 }
    let piksel = 0
    let terbesar = 0
    for (let i = 0; i < x.d.length; i += 4) {
      const s = Math.max(Math.abs(x.d[i] - y.d[i]), Math.abs(x.d[i + 1] - y.d[i + 1]), Math.abs(x.d[i + 2] - y.d[i + 2]))
      if (s > terbesar) terbesar = s
      if (s > derau) piksel++
    }
    return { ukuranSama: true, piksel, terbesar }
  }, { a: (await readFile(a)).toString('base64'), b: (await readFile(b)).toString('base64'), derau: DERAU })
  /** Gaya terhitung kerangka console (sidebar, menu, bilah atas): harus sama di dalam dan di luar CashFlow. */
  const gayaKerangka = () => page.evaluate(() => {
    const ambil = (pemilih, sifat) => {
      const el = document.querySelector(pemilih)
      if (!el) return null
      const g = getComputedStyle(el)
      return Object.fromEntries(sifat.map(s => [s, g.getPropertyValue(s)]))
    }
    const warna = ['color', 'background-color', 'background-image', 'border-right-color', 'border-bottom-color', 'box-shadow', 'font-family', 'font-size', 'font-weight']
    return {
      sidebar: ambil('.ca-console-sidebar', warna),
      // Menu yang TIDAK aktif di kedua halaman, supaya yang dibandingkan memang sama.
      menu: ambil('.ca-console-nav-item[href="/console/articles"]', warna),
      ikonMenu: ambil('.ca-console-nav-item[href="/console/articles"] .ca-console-nav-item-icon', warna),
      logo: ambil('.ca-console-sidebar .font-display', warna),
      bilah: ambil('.ca-console-topbar', warna),
      tombolBilah: ambil('.ca-console-topbar .ca-header-btn', warna),
      kaki: ambil('.ca-console-sidebar-footer', warna),
      token: Object.fromEntries(['--ca-text', '--ca-muted', '--ca-border', '--ca-panel-bg', '--ca-panel-bg-strong', '--ca-brand'].map(t => [t, getComputedStyle(document.querySelector('.ca-console-sidebar')).getPropertyValue(t).trim()])),
    }
  })
  const nav = () => page.locator('[data-uji="cf-nav"]')
  const keadaanNav = () => page.evaluate(() => {
    const n = document.querySelector('[data-uji="cf-nav"]')
    return {
      pintu: [...n.querySelectorAll('[data-pintu]')].map(a => a.dataset.pintu),
      pintuAktif: [...n.querySelectorAll('[data-pintu][aria-current]')].map(a => [a.dataset.pintu, a.getAttribute('aria-current')]),
      baris: [...n.querySelectorAll('[data-halaman]')].map(a => a.dataset.halaman),
      halamanAktif: [...n.querySelectorAll('[data-halaman][aria-current]')].map(a => [a.dataset.halaman, a.getAttribute('aria-current')]),
      kelasBadan: document.body.className,
    }
  })

  // 0. Mode dasar: hanya memotret cabang pembanding.
  if (DASAR) {
    for (const t of ['terang', 'gelap']) {
      await tema(t)
      for (const w of [1440, 390]) {
        await lebar(w)
        for (const h of [...LUAR, ...HALAMAN.slice(0, 3)]) {
          await buka(h.jalur)
          const awalan = LUAR.includes(h) ? 'dasar-luar' : 'dasar'
          hasil[`${awalan}-${h.nama}-${t}-${w}`] = await sidik(await potret(`${awalan}-${h.nama}-${t}-${w}`))
        }
      }
    }
    console.log(JSON.stringify({ mode: 'dasar', ...hasil, errors }))
  } else {
    // 1. Tiap halaman, terang dan gelap, 1440 dan 390: navigasi benar, tidak meluber, dipotret.
    for (const t of ['terang', 'gelap']) {
      await tema(t)
      for (const w of [1440, 390]) {
        await lebar(w)
        for (const h of HALAMAN) {
          await buka(h.jalur)
          const k = await keadaanNav()
          const di = `${h.nama} ${t} ${w}`
          if (k.pintu.join() !== 'ringkasan,orang,domi,kabar,operasional') gagal(`${di}: pintu ${k.pintu}`)
          const harapPintu = h.halaman ? 'true' : 'page'
          if (JSON.stringify(k.pintuAktif) !== JSON.stringify([[h.pintu, harapPintu]])) gagal(`${di}: pintu aktif ${JSON.stringify(k.pintuAktif)}`)
          if (k.baris.join() !== h.baris.join()) gagal(`${di}: baris kedua ${k.baris}`)
          if (h.halaman && JSON.stringify(k.halamanAktif) !== JSON.stringify([[h.halaman, 'page']])) gagal(`${di}: halaman aktif ${JSON.stringify(k.halamanAktif)}`)
          if (!k.kelasBadan.split(' ').includes('cf-area')) gagal(`${di}: body tanpa cf-area`)
          if (await page.locator('.ca-kicker').count()) gagal(`${di}: lencana kepala lama masih tampil`)
          if (await page.locator('.ca-console-header-card').count()) gagal(`${di}: kartu kepala lama masih tampil`)
          if (await page.locator('h1').count() !== 1) gagal(`${di}: h1 tidak tepat satu`)
          if (await meluber()) gagal(`${di}: halaman meluber ke samping`)
          // Tautan aktif terlihat utuh di dalam navigasi (deret bergulir di layar sempit).
          const terlihat = await page.evaluate(() => [...document.querySelectorAll('[data-uji="cf-nav"] [aria-current]')].every((a) => {
            const k = a.getBoundingClientRect(); const u = a.closest('ul').getBoundingClientRect()
            return k.left >= u.left - 1 && k.right <= u.right + 1
          }))
          if (!terlihat) gagal(`${di}: tautan aktif terpotong`)
          await potret(`${h.nama}-${t}-${w}`)
        }
      }
    }
    hasil.halaman = 'lulus'

    // 2. Sisa menu dan rute bersarang: pintu dan halaman aktif.
    await tema('terang')
    await lebar(1440)
    catatGalat = false
    for (const [jalur, pintu, halaman, kini] of RUTE_LAIN) {
      await buka(jalur)
      const k = await keadaanNav()
      if (JSON.stringify(k.pintuAktif) !== JSON.stringify([[pintu, 'true']])) gagal(`${jalur}: pintu aktif ${JSON.stringify(k.pintuAktif)}`)
      if (JSON.stringify(k.halamanAktif) !== JSON.stringify([[halaman, kini]])) gagal(`${jalur}: halaman aktif ${JSON.stringify(k.halamanAktif)}`)
      if (new URL(page.url()).pathname !== jalur) gagal(`${jalur}: alamat berubah jadi ${page.url()}`)
    }
    catatGalat = true
    hasil.ruteLain = 'lulus'

    // 3. Klik pintu dan halaman: alamat lama, tanpa muat ulang dokumen. Tab tidak melompat.
    await buka('/console/cashflow/pengguna')
    await page.evaluate(() => { window.__tetap = true })
    const kotak = async kunci => page.locator(`[data-halaman="${kunci}"]`).evaluate(a => { const k = a.getBoundingClientRect(); return [Math.round(k.left), Math.round(k.width)] })
    const sebelumRuang = await kotak('ruang')
    const tinggiNav = await nav().evaluate(n => n.getBoundingClientRect().height)
    await page.locator('[data-halaman="ruang"]').click()
    await page.waitForURL('**/console/cashflow/ruang')
    await page.locator('[data-halaman="ruang"][aria-current="page"]').waitFor()
    if ((await kotak('ruang')).join() !== sebelumRuang.join()) gagal(`Tab Ruang bergeser saat aktif: ${sebelumRuang} jadi ${await kotak('ruang')}`)
    if (await nav().evaluate(n => n.getBoundingClientRect().height) !== tinggiNav) gagal('Tinggi navigasi berubah antar halaman satu pintu')
    await page.locator('[data-pintu="domi"]').click()
    await page.waitForURL('**/console/cashflow/domi')
    await page.locator('[data-pintu="kabar"]').click()
    await page.waitForURL('**/console/cashflow/pengumuman')
    await page.locator('[data-pintu="operasional"]').click()
    await page.waitForURL('**/console/cashflow/kesehatan')
    await page.locator('[data-pintu="orang"]').click()
    await page.waitForURL(u => u.pathname === '/console/cashflow/pengguna')
    await page.locator('[data-pintu="ringkasan"]').click()
    await page.waitForURL(u => u.pathname === '/console/cashflow')
    if (!(await page.evaluate(() => window.__tetap))) gagal('Pindah pintu memuat ulang dokumen')
    hasil.klik = 'lulus'

    // 4. Papan ketik: Tab sampai ke pintu, fokus terlihat, panah pindah, Enter membuka.
    await buka('/console/cashflow/pengguna')
    await page.locator('[data-pintu="ringkasan"]').focus()
    await page.keyboard.press('ArrowRight')
    let fokus = await page.evaluate(() => document.activeElement?.dataset?.pintu)
    if (fokus !== 'orang') gagal(`Panah kanan: fokus di ${fokus}`)
    await page.keyboard.press('End')
    if (await page.evaluate(() => document.activeElement?.dataset?.pintu) !== 'operasional') gagal('End tidak ke pintu terakhir')
    await page.keyboard.press('ArrowRight')
    if (await page.evaluate(() => document.activeElement?.dataset?.pintu) !== 'ringkasan') gagal('Panah kanan di ujung tidak berputar')
    await page.keyboard.press('Home')
    await page.keyboard.press('Tab')
    fokus = await page.evaluate(() => document.activeElement?.dataset?.pintu)
    if (fokus !== 'orang') gagal(`Tab dari Ringkasan: fokus di ${fokus}`)
    const garis = await page.evaluate(() => { const g = getComputedStyle(document.activeElement); return [g.outlineStyle, parseFloat(g.outlineWidth)] })
    if (garis[0] === 'none' || garis[1] < 2) gagal(`Fokus papan ketik tidak terlihat: ${garis}`)
    for (let i = 0; i < 3; i++) await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    if (await page.evaluate(() => document.activeElement?.dataset?.uji) !== 'cf-nav-cari') gagal('Tab tidak sampai ke tombol cari sesudah lima pintu')
    await page.keyboard.press('Tab')
    if (await page.evaluate(() => document.activeElement?.dataset?.halaman) !== 'pengguna') gagal('Tab tidak lanjut ke baris halaman')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Enter')
    await page.waitForURL('**/console/cashflow/aktivitas')
    hasil.papanKetik = 'lulus'

    // 5. Palet: pintasan, nama pintu di kanan, Enter membuka, Esc mengembalikan fokus.
    await buka('/console/cashflow')
    await page.locator('h1').click()
    await page.keyboard.press('Control+k')
    const palet = page.getByRole('dialog')
    await palet.waitFor()
    const pilihan = await palet.getByRole('option').allInnerTexts()
    if (pilihan.length !== 16) gagal(`Palet memuat ${pilihan.length} halaman, bukan 16`)
    if (!pilihan.some(x => /Pembelian kredit\s+Domi dan kredit/.test(x))) gagal(`Palet tanpa nama pintu: ${JSON.stringify(pilihan)}`)
    await potret('palet-terang-1440', false)
    // Potret melepas fokus: kembalikan ke kolom palet sebelum mengetik.
    await palet.getByRole('combobox').focus()
    await page.keyboard.type('kasus')
    const cocok = await palet.getByRole('option').allInnerTexts()
    if (cocok.length !== 1 || !/Kasus\s+Kabar dan bantuan/.test(cocok[0])) gagal(`Cari "kasus": ${JSON.stringify(cocok)}`)
    await page.keyboard.press('Enter')
    await page.waitForURL('**/console/cashflow/kasus')
    await page.locator('[data-uji="cf-nav-cari"]').click()
    await palet.waitFor()
    await page.keyboard.press('Escape')
    await palet.waitFor({ state: 'detached' })
    if (await page.evaluate(() => document.activeElement?.dataset?.uji) !== 'cf-nav-cari') gagal('Esc tidak mengembalikan fokus ke tombol cari')
    await tema('gelap')
    await buka('/console/cashflow/pengguna')
    await page.locator('[data-uji="cf-nav-cari"]').click()
    await palet.waitFor()
    await potret('palet-gelap-1440', false)
    await page.keyboard.press('Escape')
    await lebar(390)
    await page.locator('[data-uji="cf-nav-cari"]').click()
    await palet.waitFor()
    if (await meluber()) gagal('Palet meluber di 390')
    await potret('palet-gelap-390', false)
    await page.keyboard.press('Escape')
    hasil.palet = 'lulus'

    // 6. Layar sempit: deret pintu bergulir, tidak melipat, pintu terakhir bisa dicapai.
    await tema('terang')
    await buka('/console/cashflow/sakelar')
    const deret = await page.locator('[data-uji="cf-nav-pintu"]').evaluate(u => ({
      gulir: u.scrollWidth > u.clientWidth, satuBaris: new Set([...u.querySelectorAll('a')].map(a => Math.round(a.getBoundingClientRect().top))).size === 1,
      tinggi: Math.min(...[...u.querySelectorAll('a')].map(a => a.getBoundingClientRect().height)),
    }))
    if (!deret.gulir || !deret.satuBaris) gagal(`390: deret pintu ${JSON.stringify(deret)}`)
    if (deret.tinggi < 40) gagal(`390: tinggi sentuh pintu ${deret.tinggi}`)
    await page.locator('[data-pintu="ringkasan"]').scrollIntoViewIfNeeded()
    await page.locator('[data-pintu="ringkasan"]').click()
    await page.waitForURL(u => u.pathname === '/console/cashflow')
    hasil.sempit = 'lulus'

    // 7. Di luar CashFlow tidak ada yang berubah: kelas area lepas, kerangka console
    //    bergaya sama di dalam dan di luar, dan potret halaman lain sama dengan dasarnya.
    for (const t of ['terang', 'gelap']) {
      await tema(t)
      for (const w of [1440, 390]) {
        await lebar(w)
        await buka('/console/cashflow/pengguna')
        const dalam = await gayaKerangka()
        if (w === 1440) {
          // Pindah lewat sidebar (tanpa muat ulang): kelas area harus ikut lepas.
          await page.locator('.ca-console-nav-item[href="/console"]').click()
          await page.waitForURL(u => u.pathname === '/console')
          await page.waitForTimeout(400)
          if (await page.evaluate(() => document.body.classList.contains('cf-area'))) gagal(`${t}: cf-area tertinggal sesudah keluar dari CashFlow`)
        }
        for (const h of LUAR) {
          await buka(h.jalur)
          if (await page.evaluate(() => document.body.classList.contains('cf-area'))) gagal(`${h.nama}: body membawa cf-area`)
          if (await page.evaluate(() => !!document.querySelector('.ca-console-main') && getComputedStyle(document.querySelector('.ca-console-main')).getPropertyValue('--cf-layar').trim() !== '')) gagal(`${h.nama}: token CashFlow bocor`)
          const luar = await gayaKerangka()
          if (JSON.stringify(luar) !== JSON.stringify(dalam)) gagal(`${h.nama} ${t} ${w}: kerangka console berbeda di dalam CashFlow\n${JSON.stringify(dalam)}\n${JSON.stringify(luar)}`)
          const kini = await potret(`luar-${h.nama}-${t}-${w}`)
          const dasar = join(output, `dasar-luar-${h.nama}-${t}-${w}.png`)
          if (existsSync(dasar)) {
            const beda = (await sidik(kini)) === (await sidik(dasar)) ? { ukuranSama: true, piksel: 0, terbesar: 0 } : await bandingkan(kini, dasar)
            hasil[`luar-${h.nama}-${t}-${w}`] = `piksel beda ${beda.piksel}, selisih terbesar ${beda.terbesar}/255`
            if (!beda.ukuranSama || beda.piksel) gagal(`luar-${h.nama}-${t}-${w}: potret berbeda dari dasar ${JSON.stringify(beda)}`)
          } else hasil[`luar-${h.nama}-${t}-${w}`] = 'tanpa potret dasar'
        }
      }
    }
    hasil.luar = 'lulus'

    if (errors.length) gagal(`Galat browser: ${errors.join('; ')}`)
    console.log(JSON.stringify({ ...hasil, errors }))
  }
} finally {
  if (browser) try { const s = await browser.newBrowserCDPSession(); await s.send('Browser.close') } catch { /* Chrome sudah tertutup. */ }
  chrome.kill()
  await rm(dir, { recursive: true, force: true }).catch(() => {})
}
