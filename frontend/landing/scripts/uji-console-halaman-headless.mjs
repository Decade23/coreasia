// Uji tampilan SEMUA halaman area CashFlow di console dengan data sintetis yang
// menekan tata letak: nama dan catatan panjang, email 38 huruf, angka miliaran,
// daftar 6 sampai 12 baris. Yang dipotret: halaman daftar dan operasional,
// rincian pengguna beserta semua tabnya, rincian ruang beserta semua tabnya,
// varian kosong, dan varian tanpa izin data pribadi. Terang dan gelap, lebar
// 1440 dan 390, satu halaman penuh. Chrome headless lewat CDP, tanpa jendela.
//
// Skrip ini TIDAK berhenti di temuan pertama. Tiap potret diperiksa (meluber ke
// samping, kepala kolom, huruf besar semua, kartu melewati tepi, galat browser),
// semua temuan dikumpulkan lalu dicetak sebagai JSON di akhir. Kode keluar 1
// kalau ada temuan, kecuali CF_QA_LUNAK=1.
//
// Jalankan server lokal TANPA .env (tidak ada kunci sungguhan):
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_URL=http://127.0.0.1:4398 \
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY=anon-sintetis \
//   npx nuxi dev --port 4399 --host 127.0.0.1
// lalu:
//   PLAYWRIGHT_CORE_PATH=<playwright-core/index.mjs> CF_QA_ARTIFACTS=<folder> \
//   node scripts/uji-console-halaman-headless.mjs
//
// Pilihan lain lewat variabel lingkungan:
//   CF_QA_APP, CF_QA_SUPABASE  alamat aplikasi dan Supabase tiruan
//   CF_QA_TMP                  folder profil Chrome sementara (bawaan tmpdir)
//   CF_QA_HANYA                regex nama halaman, untuk memotret sebagian saja
//   CF_QA_TANPA_LEMBAR=1       lewati lembar gabungan
//   CF_QA_LUNAK=1              selalu keluar dengan kode 0
//
// Hasil di folder CF_QA_ARTIFACTS: <nama>-<terang|gelap>-<1440|390>.png,
// <nama>-kosong-terang-<lebar>.png, <nama>-tanpa-izin-terang-<lebar>.png,
// _lembar-<nama>.png (empat potret berdampingan), dan _temuan.json.
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, rm, readFile, writeFile, access } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'
import { tmpdir, homedir } from 'node:os'
import { join } from 'node:path'
import { SAAT, U, W, uuid, buatServer } from './data-sintetis-console.mjs'

const pwPath = process.env.PLAYWRIGHT_CORE_PATH
const { chromium } = await (pwPath ? import(pathToFileURL(pwPath).href) : import('playwright-core'))
const output = process.env.CF_QA_ARTIFACTS || join(homedir(), 'Codex', 'artifact', 'coreasia')
const APP = process.env.CF_QA_APP || 'http://127.0.0.1:4399'
const SUPABASE = process.env.CF_QA_SUPABASE || 'http://127.0.0.1:4398'
const PORT_BOLEH = [new URL(APP).port, new URL(SUPABASE).port]
const HANYA = process.env.CF_QA_HANYA ? new RegExp(process.env.CF_QA_HANYA) : null
await mkdir(output, { recursive: true })
const portServer = createServer()
await new Promise(r => portServer.listen(0, '127.0.0.1', r))
const cdpPort = portServer.address().port
await new Promise(r => portServer.close(r))
const dir = await mkdtemp(join(process.env.CF_QA_TMP || tmpdir(), 'cf-halaman-'))
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--user-data-dir=${dir}`, `--remote-debugging-port=${cdpPort}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

// ── Daftar halaman ───────────────────────────────────────────────────────
// `harus`: teks dari data sintetis yang wajib tampil, bukti bahwa isi benar-benar
// dimuat dan bukan gerbang "buka kasus dulu". `aksi`: klik yang diperlukan.
const C = '/console/cashflow'
const P = `${C}/pengguna/${U}`
const R = `${C}/ruang/${W}`
const bukaDomi = async (page, { kosong }) => {
  await page.getByRole('button', { name: 'Buka percakapan Domi', exact: true }).click()
  if (kosong) { await page.waitForTimeout(800); return }
  const pertama = page.getByText('Berapa total pengeluaran belanja stok', { exact: false }).first()
  await pertama.waitFor({ timeout: 15000 })
  await pertama.click()
  await page.getByText('Belanja stok November', { exact: false }).first().waitFor({ timeout: 15000 })
}
const DAFTAR = [
  { nama: 'ringkasan', jalur: C, harus: 'Menyiapkan dompet/ruang' },
  { nama: 'pengguna', jalur: `${C}/pengguna`, harus: 'rahmawati.kusumaningsih@contoh.invalid' },
  { nama: 'ruang', jalur: `${C}/ruang`, harus: 'sar***@contoh.invalid' },
  { nama: 'aktivitas', jalur: `${C}/aktivitas`, harus: 'rekonsiliasi.simpan', tanpaIzin: true },
  { nama: 'corong', jalur: `${C}/corong` },
  { nama: 'kesehatan', jalur: `${C}/kesehatan`, harus: 'activity_events' },
  { nama: 'sakelar', jalur: `${C}/sakelar`, harus: 'otp_wa.batas_harian' },
  { nama: 'dukungan', jalur: `${C}/dukungan`, harus: 'DK-2611-048213', tanpaIzin: true },
  { nama: 'hapus-akun', jalur: `${C}/hapus-akun`, harus: 'yog***@contoh.invalid', tanpaIzin: true },
  { nama: 'pengumuman', jalur: `${C}/pengumuman`, harus: 'Tips Domi minggu ini' },
  { nama: 'kasus', jalur: `${C}/kasus?lingkup=semua`, harus: 'Tiket 4821' },
  { nama: 'audit', jalur: `${C}/audit`, harus: 'hapus_akun_permanen' },
  { nama: 'paket', jalur: `${C}/paket`, harus: 'kredit_1000_promo' },
  { nama: 'pembelian', jalur: `${C}/pembelian`, harus: 'CF4821', tanpaIzin: true },
  { nama: 'domi', jalur: `${C}/domi`, harus: 'ab12cd34ef' },
]
const TAB_PENGGUNA = [
  { nama: 'pengguna-rinci', jalur: P, harus: 'Rahmawati Kusumaningsih', tanpaIzin: true },
  { nama: 'pengguna-rinci-transaksi', jalur: `${P}/transaksi`, harus: 'Kas Toko Cabang Pasar Baru' },
  { nama: 'pengguna-rinci-dompet', jalur: `${P}/dompet`, harus: 'Bank Tabungan Usaha' },
  { nama: 'pengguna-rinci-domi', jalur: `${P}/domi`, harus: 'Belanja stok November', aksi: bukaDomi },
  { nama: 'pengguna-rinci-perangkat', jalur: `${P}/perangkat`, harus: 'a1b2c3d4e5' },
  { nama: 'pengguna-rinci-jejak', jalur: `${P}/jejak` },
  { nama: 'pengguna-rinci-kabar', jalur: `${P}/kabar`, harus: 'Rangkuman harian' },
  { nama: 'pengguna-rinci-perjalanan', jalur: `${P}/perjalanan`, harus: 'Membuka formulir transaksi' },
  { nama: 'pengguna-rinci-ruang', jalur: `${P}/ruang`, harus: 'Keluarga Besar Wiryaatmadja' },
  { nama: 'pengguna-rinci-akses', jalur: `${P}/akses`, harus: 'admin.kedua.yang.panjang@contoh.invalid' },
]
const TAB_RUANG = [
  { nama: 'ruang-rinci', jalur: R, harus: 'Bu Rahma Pemilik Toko', tanpaIzin: true },
  { nama: 'ruang-rinci-anggota', jalur: `${R}/anggota`, harus: 'kas***@contoh.invalid' },
  { nama: 'ruang-rinci-dompet', jalur: `${R}/dompet`, harus: 'Piutang Pelanggan Tetap' },
  { nama: 'ruang-rinci-dompet-patungan', jalur: `${R}/dompet?lihat=patungan` },
  { nama: 'ruang-rinci-transaksi', jalur: `${R}/transaksi`, harus: 'Kas Toko Cabang Pasar Baru' },
  { nama: 'ruang-rinci-jadwal', jalur: `${R}/jadwal`, harus: 'Cicilan mesin kasir' },
  { nama: 'ruang-rinci-struk', jalur: `${R}/struk` },
  { nama: 'ruang-rinci-katalog', jalur: `${R}/katalog`, harus: 'Sewa tempat usaha dan iuran pasar' },
  { nama: 'ruang-rinci-usaha', jalur: `${R}/usaha`, harus: 'Beras premium pandan wangi' },
  { nama: 'ruang-rinci-usaha-stok', jalur: `${R}/usaha?lihat=stok`, harus: 'Beras premium pandan wangi' },
  { nama: 'ruang-rinci-sampah', jalur: `${R}/sampah` },
  { nama: 'ruang-rinci-jejak', jalur: `${R}/jejak` },
  { nama: 'ruang-rinci-akses', jalur: `${R}/akses`, harus: 'admin.kedua.yang.panjang@contoh.invalid' },
]
const cocok = h => !HANYA || HANYA.test(h.nama)
const SEMUA = [...DAFTAR, ...TAB_PENGGUNA, ...TAB_RUANG].filter(cocok)
/* Varian kosong: semua halaman daftar dan semua tab rincian. */
const KOSONG = SEMUA
const TANPA_IZIN = SEMUA.filter(h => h.tanpaIzin)

const server = buatServer()
/** Temuan otomatis, satu baris per masalah. */
const temuan = []
/** Catatan per potret (tinggi halaman, keadaan yang tampil), untuk laporan. */
const catatan = {}
const potretDibuat = []
const catat = (nama, potret, jenis, rinci) => temuan.push({ halaman: nama, potret, jenis, ...rinci })
const log = (...a) => process.stderr.write(`${a.join(' ')}\n`)

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
    // Jam peramban dibekukan di SAAT supaya "5 jam lalu", hitung mundur kasus,
    // dan tanggal bawaan saringan sama di setiap putaran.
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
    // Panel devtools server dev menutupi isi tangkapan layar. Transisi dimatikan supaya potret stabil.
    addEventListener('DOMContentLoaded', () => {
      const gaya = document.createElement('style')
      gaya.textContent = '[id^="nuxt-devtools"]{display:none!important}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
      document.head.append(gaya)
    })
  }, { session, saat: SAAT })
  const IZIN_PENUH = ['cashflow:view', 'cashflow:pii', 'cashflow:investigasi', 'cashflow:tindak', 'cashflow:ekspor']
  /** Keadaan server tiruan: `kosong` = semua daftar kosong, `izin` = sesi memegang izin data pribadi. */
  const mode = { kosong: false, izin: true }
  const pasangIzin = izin => ctx.addInitScript((izin) => { if (location.protocol === 'http:') sessionStorage.setItem('cf_izin', JSON.stringify(izin)) }, izin)
  await pasangIzin(IZIN_PENUH)
  // Tidak ada akses ke layanan luar atau gateway sungguhan.
  const ditolak = new Set()
  await ctx.route('**/*', (route) => {
    const u = new URL(route.request().url())
    if (u.hostname === '127.0.0.1' && PORT_BOLEH.includes(u.port)) return route.continue()
    if (u.protocol.startsWith('http')) ditolak.add(u.host)
    return route.abort()
  })
  const saatIso = new Date(SAAT - 60_000).toISOString()
  const me = () => ({ data: {
    id: 'admin-test', email: 'admin@contoh.invalid', full_name: 'Admin Contoh', role: 'super_admin', is_active: true, created_at: '2026-01-01T00:00:00Z',
    mfa: mode.izin, mfa_at: mode.izin ? saatIso : null, totp_enabled_at: mode.izin ? '2026-01-01T00:00:00Z' : null, totp_enabled: mode.izin,
  } })
  await page.route('**/api/gw/**', r => r.fulfill({ status: 404, json: { error: 'gateway sintetis' } }))
  await page.route('**/api/gw/admin/auth/me', r => r.fulfill({ json: me() }))

  const galatHalaman = []
  page.on('pageerror', e => galatHalaman.push(e.message))
  const cors = { 'access-control-allow-origin': '*' }
  await page.route(`${SUPABASE}/**`, async (r) => {
    const req = r.request()
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' } })
    const nama = new URL(req.url()).pathname.split('/').pop()
    let p = {}
    try { p = req.postDataJSON() || {} } catch { /* Badan bukan JSON. */ }
    const j = server.jawab(nama, p, mode)
    return r.fulfill({ status: j.status ?? 200, headers: cors, json: j.json })
  })

  const tema = async (t) => {
    await ctx.clearCookies()
    await ctx.addCookies([{ name: 'coreasia-theme', value: t === 'terang' ? 'light' : 'dark', domain: '127.0.0.1', path: '/' }])
  }
  const lebar = async (w) => { await page.setViewportSize({ width: w, height: w > 500 ? 900 : 844 }); await page.waitForTimeout(250) }
  const tenang = async () => {
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    await page.waitForFunction(() => !document.querySelector('.ca-console-main [aria-busy="true"], .ca-console-main .animate-pulse, .ca-console-main .animate-spin'), null, { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(350)
  }
  const buka = async (jalur) => {
    await page.goto(`${APP}${jalur}`, { waitUntil: 'domcontentloaded' })
    await page.locator('h1').first().waitFor({ timeout: 60000 })
    await tenang()
  }
  const potret = async (berkas) => {
    await page.evaluate(() => { scrollTo(0, 0); document.activeElement?.blur?.() })
    await page.waitForTimeout(300)
    await page.screenshot({ path: join(output, `${berkas}.png`), fullPage: true })
    potretDibuat.push(`${berkas}.png`)
  }

  /** Pemeriksaan satu potret, dijalankan di dalam halaman. */
  const ukur = () => page.evaluate(() => {
    const utama = document.querySelector('.ca-console-main')
    const lebarLayar = document.documentElement.clientWidth
    const tampak = (el) => {
      if (!el.getClientRects().length) return false
      const g = getComputedStyle(el)
      if (g.visibility === 'hidden' || g.display === 'none' || Number(g.opacity) === 0) return false
      const k = el.getBoundingClientRect()
      return k.width > 1 && k.height > 1
    }
    const ringkas = s => (s || '').replace(/\s+/g, ' ').trim().slice(0, 60)
    const kelas = el => (typeof el.className === 'string' ? el.className : el.getAttribute('class') || '').slice(0, 90)
    // Jumlah baris teks: kotak baris yang puncaknya berbeda lebih dari setengah tinggi baris.
    const jumlahBaris = (el) => {
      const jangkau = document.createRange()
      jangkau.selectNodeContents(el)
      const puncak = []
      for (const k of jangkau.getClientRects()) {
        if (k.width < 1 || k.height < 6) continue
        if (!puncak.some(p => Math.abs(p - k.top) < Math.max(8, k.height * 0.6))) puncak.push(k.top)
      }
      return puncak.length
    }
    const kepala = []
    const besar = []
    const kartu = []
    if (utama) {
      for (const th of utama.querySelectorAll('thead th')) {
        if (!tampak(th)) continue
        const teks = ringkas(th.textContent)
        if (!ringkas(th.innerText) || (th.children.length === 1 && th.firstElementChild.classList.contains('sr-only'))) continue
        const isi = th.querySelector('button') ?? th
        const huruf = getComputedStyle(isi).textTransform === 'uppercase' || getComputedStyle(th).textTransform === 'uppercase'
        const tinggi = Math.round(th.getBoundingClientRect().height)
        const baris = jumlahBaris(th)
        if (huruf || baris > 1 || tinggi > 48) kepala.push({ teks, hurufBesar: huruf, baris, tinggi })
      }
      const sudah = new Set()
      const jalan = document.createTreeWalker(utama, NodeFilter.SHOW_TEXT)
      while (jalan.nextNode() && besar.length < 5) {
        const simpul = jalan.currentNode
        if (!/\p{L}/u.test(simpul.nodeValue || '')) continue
        const el = simpul.parentElement
        if (!el || el.closest('.sr-only') || !tampak(el)) continue
        if (getComputedStyle(el).textTransform !== 'uppercase') continue
        const kunci = `${ringkas(simpul.nodeValue)}|${kelas(el)}`
        if (sudah.has(kunci)) continue
        sudah.add(kunci)
        besar.push({ teks: ringkas(simpul.nodeValue), tag: el.tagName.toLowerCase(), kelas: kelas(el) })
      }
      for (const el of utama.querySelectorAll('section.ca-console-dialog, .cf-tabel-wadah, .ca-console-stat')) {
        if (!tampak(el)) continue
        const kanan = Math.round(el.getBoundingClientRect().right)
        if (kanan > lebarLayar) kartu.push({ kelas: kelas(el), teks: ringkas(el.innerText), kanan, lebarLayar })
      }
    }
    // Bidang yang bergulir ke samping di dalam halaman (tabel lebih lebar dari kartunya).
    const gulir = []
    for (const el of utama?.querySelectorAll('*') ?? []) {
      if (!tampak(el) || el.scrollWidth <= el.clientWidth + 1) continue
      const g = getComputedStyle(el).overflowX
      if (g !== 'auto' && g !== 'scroll') continue
      if (el.closest('.cf-nav, .cf-tab, .cf-seg-gulir')) continue
      gulir.push({ kelas: kelas(el), teks: ringkas(el.innerText), lebih: el.scrollWidth - el.clientWidth })
    }
    const tombol = teks => !!utama && [...utama.querySelectorAll('button')].some(b => tampak(b) && b.innerText.trim() === teks)
    return {
      luber: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      tinggi: document.documentElement.scrollHeight,
      kepala, besar, kartu, gulir,
      keadaan: {
        terbatas: !!utama?.querySelector('[data-keadaan="terbatas"]'),
        galat: [...(utama?.querySelectorAll('[data-keadaan="galat"], [role="alert"]') ?? [])].filter(tampak).map(e => ringkas(e.innerText)).filter(Boolean).slice(0, 3),
        memuat: !!utama?.querySelector('[aria-busy="true"]'),
        kosong: utama?.querySelectorAll('[data-keadaan="kosong"]').length ?? 0,
        muatData: tombol('Muat data'),
        bukaDomi: tombol('Buka percakapan Domi'),
      },
      teks: utama?.innerText ?? '',
    }
  })
  /** Ukur, catat temuan, lalu potret. `varian`: 'biasa' | 'kosong' | 'tanpa-izin'. */
  const periksaDanPotret = async (h, berkas, w, varian) => {
    const u = await ukur()
    if (u.luber) catat(h.nama, berkas, 'meluber', { px: u.luber, lebar: w })
    for (const k of u.kepala) catat(h.nama, berkas, 'kepala-kolom', k)
    for (const b of u.besar) catat(h.nama, berkas, 'huruf-besar', b)
    if (w === 390) for (const k of u.kartu) catat(h.nama, berkas, 'kartu-melewati-tepi', k)
    // Di layar lebar tabel seharusnya muat. Di ponsel gulir samping di dalam kartu masih wajar, jadi tidak dicatat.
    if (w === 1440) for (const g of u.gulir) catat(h.nama, berkas, 'gulir-samping', g)
    if (varian === 'biasa') {
      if (u.keadaan.terbatas) catat(h.nama, berkas, 'isi-tidak-tampil', { sebab: 'akses terbatas' })
      if (u.keadaan.galat.length) catat(h.nama, berkas, 'galat-di-halaman', { pesan: u.keadaan.galat })
      if (u.keadaan.memuat) catat(h.nama, berkas, 'isi-tidak-tampil', { sebab: 'masih memuat' })
      if (u.keadaan.muatData || u.keadaan.bukaDomi) catat(h.nama, berkas, 'isi-tidak-tampil', { sebab: 'gerbang Muat data atau Buka percakapan' })
      if (h.harus && w === 1440 && !u.teks.toLowerCase().includes(h.harus.toLowerCase())) catat(h.nama, berkas, 'isi-tidak-tampil', { sebab: `teks "${h.harus}" tidak ada` })
    }
    if (varian !== 'biasa' && u.keadaan.galat.length) catat(h.nama, berkas, 'galat-di-halaman', { pesan: u.keadaan.galat })
    for (const pesan of galatHalaman.splice(0)) catat(h.nama, berkas, 'pageerror', { pesan })
    catatan[berkas] = { tinggi: u.tinggi, luber: u.luber, ...u.keadaan, galat: u.keadaan.galat.length }
    await potret(berkas)
  }
  /** Satu halaman pada satu tema: 1440 lalu 390, tanpa memuat ulang di antaranya. */
  const jalankan = async (h, akhiran, varian) => {
    log(`  ${h.nama}-${akhiran}`)
    try {
      await lebar(1440)
      await buka(h.jalur)
      if (h.aksi) {
        await h.aksi(page, mode).catch(e => catat(h.nama, `${h.nama}-${akhiran}-1440`, 'aksi-gagal', { pesan: String(e.message).split('\n')[0] }))
        await tenang()
      }
      await periksaDanPotret(h, `${h.nama}-${akhiran}-1440`, 1440, varian)
      await lebar(390)
      await page.waitForTimeout(300)
      await periksaDanPotret(h, `${h.nama}-${akhiran}-390`, 390, varian)
    } catch (e) {
      catat(h.nama, `${h.nama}-${akhiran}`, 'gagal-dipotret', { pesan: String(e.message).split('\n')[0] })
      galatHalaman.splice(0)
    }
  }

  // 1 sampai 3. Semua halaman dan tab, terang dan gelap.
  for (const t of ['terang', 'gelap']) {
    log(`Tema ${t}`)
    await tema(t)
    for (const h of SEMUA) await jalankan(h, t, 'biasa')
  }

  // 4. Varian kosong: semua RPC daftar menjawab kosong. Terang saja.
  log('Varian kosong')
  await tema('terang')
  mode.kosong = true
  for (const h of KOSONG) await jalankan(h, 'kosong-terang', 'kosong')
  mode.kosong = false

  // 5. Varian tanpa izin data pribadi: sesi hanya memegang cashflow:view.
  log('Varian tanpa izin')
  mode.izin = false
  await pasangIzin(['cashflow:view'])
  const tanpaIzin = {}
  for (const h of TANPA_IZIN) {
    await jalankan(h, 'tanpa-izin-terang', 'tanpa-izin')
    tanpaIzin[h.nama] = { izinKurangTampil: !!catatan[`${h.nama}-tanpa-izin-terang-1440`]?.terbatas }
  }
  mode.izin = true
  await pasangIzin(IZIN_PENUH)

  // Lembar gabungan: empat potret berdampingan per halaman, dipotong di 2400 px.
  const lembar = []
  if (!process.env.CF_QA_TANPA_LEMBAR) {
    log('Lembar gabungan')
    const ada = async f => access(join(output, f)).then(() => true, () => false)
    let isiLembar = ''
    await page.route(`${APP}/__lembar/**`, async (r) => {
      const jalur = new URL(r.request().url()).pathname.replace('/__lembar/', '')
      if (jalur === 'indeks') return r.fulfill({ contentType: 'text/html; charset=utf-8', body: isiLembar })
      return r.fulfill({ contentType: 'image/png', body: await readFile(join(output, decodeURIComponent(jalur))) })
    })
    const buatLembar = async (nama, judul, kolom) => {
      const tersedia = []
      for (const k of kolom) if (await ada(k.berkas)) tersedia.push(k)
      if (!tersedia.length) return
      const total = tersedia.reduce((s, k) => s + k.lebar + 16, 16)
      isiLembar = `<!doctype html><html lang="id"><meta charset="utf-8"><title>${judul}</title><style>
        html,body{margin:0;background:#e5e7eb;font:13px/1.3 system-ui,sans-serif;color:#111827}
        main{display:flex;gap:16px;padding:16px;align-items:flex-start;width:max-content}
        figure{margin:0;background:#fff;border:1px solid #9ca3af}
        figcaption{padding:6px 8px;font-weight:600;border-bottom:1px solid #9ca3af;background:#f9fafb}
        .bingkai{max-height:2330px;overflow:hidden}
        img{display:block;height:auto}
      </style><main>${tersedia.map(k => `<figure><figcaption>${judul} · ${k.label}</figcaption><div class="bingkai"><img src="/__lembar/${encodeURIComponent(k.berkas)}" width="${k.lebar}" alt=""></div></figure>`).join('')}</main></html>`
      await page.setViewportSize({ width: total, height: 1200 })
      await page.goto(`${APP}/__lembar/indeks`, { waitUntil: 'load' })
      await page.waitForFunction(() => [...document.images].every(g => g.complete && g.naturalWidth > 0), null, { timeout: 20000 }).catch(() => {})
      const tinggi = Math.min(2400, await page.evaluate(() => document.documentElement.scrollHeight))
      await page.setViewportSize({ width: total, height: tinggi })
      await page.screenshot({ path: join(output, `_lembar-${nama}.png`) })
      lembar.push(`_lembar-${nama}.png`)
    }
    const empat = (awalan, t = ['terang', 'gelap']) => [1440, 390].flatMap(w => t.map(x => ({ berkas: `${awalan}-${x}-${w}.png`, label: `${x} ${w}`, lebar: w === 1440 ? 820 : 300 })))
    for (const h of SEMUA) {
      await buatLembar(h.nama, h.nama, empat(h.nama))
      await buatLembar(`${h.nama}-kosong`, `${h.nama} kosong`, empat(`${h.nama}-kosong`, ['terang']))
      if (h.tanpaIzin) await buatLembar(`${h.nama}-tanpa-izin`, `${h.nama} tanpa izin`, empat(`${h.nama}-tanpa-izin`, ['terang']))
    }
    galatHalaman.splice(0)
  }

  // Ringkasan temuan per halaman dan jenis.
  const perHalaman = {}
  for (const t of temuan) {
    perHalaman[t.halaman] ??= {}
    perHalaman[t.halaman][t.jenis] = (perHalaman[t.halaman][t.jenis] ?? 0) + 1
  }
  const hasil = {
    folder: output, jumlahPotret: potretDibuat.length, jumlahLembar: lembar.length, jumlahTemuan: temuan.length,
    rpcDitiru: server.ditiru, rpcTerpanggil: [...server.terpanggil].sort(), rpcTidakDikenal: [...server.takDikenal].sort(),
    rpcDitiruTidakTerpanggil: server.ditiru.filter(n => !server.terpanggil.has(n)),
    jaringanLuarDitolak: [...ditolak].sort(), tanpaIzin, temuanPerHalaman: perHalaman, temuan,
  }
  await writeFile(join(output, '_temuan.json'), JSON.stringify({ ...hasil, catatan }, null, 2))
  console.log(JSON.stringify(hasil, null, 1))
  if (temuan.length && process.env.CF_QA_LUNAK !== '1') process.exitCode = 1
} finally {
  if (browser) try { const s = await browser.newBrowserCDPSession(); await s.send('Browser.close') } catch { /* Chrome sudah tertutup. */ }
  chrome.kill()
  await rm(dir, { recursive: true, force: true }).catch(() => {})
}
