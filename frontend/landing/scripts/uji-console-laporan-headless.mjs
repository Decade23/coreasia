// Uji tampilan halaman Laporan CashFlow (pages/console/cashflow/laporan.vue)
// dengan data sintetis (scripts/data-sintetis-console.mjs). Chrome headless
// lewat CDP, tanpa jendela.
//
// Yang diperiksa:
//   1. Lima bagian (harian, jam ramai, dukung, asal, saldo per ruang dan per
//      pengguna), terang dan gelap, lebar 1440 dan 390: tidak meluber ke
//      samping, tanpa kode mentah, tanpa galat peramban, isi benar dimuat.
//   2. Navigasi: Laporan ada di pintu Ringkasan dan aktif di halamannya.
//   3. Peta jam: 168 kotak, diputar di layar sempit, saringan jenis ruang
//      dikirim ke server.
//   4. Dukung: kalimat K9 (ketukan baru sejak 1.4.4) selalu tampil.
//   5. Asal pengguna di server lama (PGRST202): "belum aktif", bukan galat.
//   6. Saldo: hanya dipanggil saat bagiannya dibuka, alasan tetap ikut,
//      kepala kolom mengurutkan di server, cari baru dikirim saat ditekan,
//      baris menuju Ruang 360 dan Pengguna 360. Sesi lihat saja: saldo tidak
//      dipanggil sama sekali dan halaman menawarkan verifikasi, grafik tetap.
//
// Jalankan server lokal TANPA .env (tidak ada kunci sungguhan):
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_URL=http://127.0.0.1:4436 \
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY=anon-sintetis \
//   npx nuxi dev --port 4437 --host 127.0.0.1
// lalu:
//   PLAYWRIGHT_CORE_PATH=<playwright-core/index.mjs> CF_QA_ARTIFACTS=<folder> \
//   CF_QA_APP=http://127.0.0.1:4437 CF_QA_SUPABASE=http://127.0.0.1:4436 \
//   node scripts/uji-console-laporan-headless.mjs
// CF_QA_TMP boleh menunjuk folder profil Chrome sementara (bawaan tmpdir).
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buatServer, uuid } from './data-sintetis-console.mjs'

const pwPath = process.env.PLAYWRIGHT_CORE_PATH
const { chromium } = await (pwPath ? import(pathToFileURL(pwPath).href) : import('playwright-core'))
const output = process.env.CF_QA_ARTIFACTS || join(tmpdir(), 'cf-laporan-potret')
const APP = process.env.CF_QA_APP || 'http://127.0.0.1:4437'
const SUPABASE = process.env.CF_QA_SUPABASE || 'http://127.0.0.1:4436'
const PORT_BOLEH = [new URL(APP).port, new URL(SUPABASE).port]
await mkdir(output, { recursive: true })
let cdpPort = 0
while (cdpPort <= 20000) {
  const s = createServer()
  await new Promise(r => s.listen(0, '127.0.0.1', r))
  cdpPort = s.address().port
  await new Promise(r => s.close(r))
}
const dir = await mkdtemp(join(process.env.CF_QA_TMP || tmpdir(), 'cf-laporan-'))
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--user-data-dir=${dir}`, `--remote-debugging-port=${cdpPort}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

/** Kode server dan jalur kamus yang tidak boleh terbaca di layar. */
const MENTAH = /\blaporan\.[a-z]|\badmin_laporan|\bundefined\b|\bNaN\b|\[object |uang_nyata|dompet_minus|ketuk_pertama|\(tanpa_utm\)|\(lain\)/
const BAGIAN = [
  { nama: 'harian', query: 'bagian=harian', siap: 'laporan-harian-kartu' },
  { nama: 'jam', query: 'bagian=jam', siap: 'peta-jam' },
  { nama: 'dukung', query: 'bagian=dukung', siap: 'laporan-dukung-k9' },
  { nama: 'asal', query: 'bagian=asal', siap: 'laporan-asal-jawaban' },
  { nama: 'saldo-ruang', query: 'bagian=saldo', siap: 'saldo-daftar' },
  { nama: 'saldo-pengguna', query: 'bagian=saldo&mode=pengguna', siap: 'saldo-daftar' },
]

let browser
let page
const hasil = {}
const temuan = []
try {
  for (let i = 0; i < 100; i++) { try { const r = await fetch(`http://127.0.0.1:${cdpPort}/json/version`); if (r.ok) break } catch { /* Chrome belum siap. */ } await new Promise(r => setTimeout(r, 100)) }
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`)
  const ctx = browser.contexts()[0]
  page = ctx.pages()[0]
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
  /* Izin sesi dibaca dari sessionStorage saat halaman dimuat. Skrip awal yang
     ditambahkan belakangan berjalan sesudahnya, jadi izin bisa diganti di tengah uji. */
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
  /** Setiap panggilan RPC: nama dan argumen. */
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
  const meluber = () => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
  const potret = async (nama) => {
    await page.evaluate(() => scrollTo(0, 0))
    await page.waitForTimeout(400)
    await page.screenshot({ path: join(output, `${nama}.png`) })
    await page.screenshot({ path: join(output, `${nama}-penuh.png`), fullPage: true })
  }
  const gagal = (pesan) => { throw new Error(pesan) }
  const catat = (pesan) => { temuan.push(pesan) }
  const uji = id => page.locator(`[data-uji="${id}"]`)
  const buka = async (query, siap) => {
    panggilan.length = 0
    await page.goto(`${APP}/console/cashflow/laporan?${query}`, { waitUntil: 'domcontentloaded' })
    await uji(siap).first().waitFor({ timeout: 90000 })
    await page.waitForTimeout(400)
  }
  const bersih = async (di) => {
    const teks = await page.evaluate(() => document.querySelector('main')?.innerText ?? document.body.innerText)
    const m = teks.match(MENTAH)
    if (m) catat(`${di}: kode mentah atau teks rusak terbaca: "${m[0]}"`)
    if (/[—–;]/.test(teks.replace(/[^\n]*\b(?:Rp|Rp\s)\S*/g, ''))) {
      const k = teks.match(/[^\n]{0,30}[—–;][^\n]{0,30}/)
      if (k && /laporan|ketuk|uang|saldo|catatan|pengguna/i.test(k[0])) catat(`${di}: tanda baca terlarang: "${k[0]}"`)
    }
  }
  const rpc = n => panggilan.filter(x => x.nama === n)

  // 1. Lima bagian, terang dan gelap, 1440 dan 390 (sesi ber-TOTP).
  for (const b of BAGIAN) {
    for (const t of ['terang', 'gelap']) {
      await tema(t === 'terang' ? 'light' : 'dark')
      await lebar(1440)
      await buka(b.query, b.siap)
      if (await page.getByRole('alert').count()) catat(`${b.nama} ${t}: ada galat merah`)
      await bersih(`${b.nama} ${t} 1440`)
      if (await meluber()) catat(`${b.nama} ${t}: meluber di 1440`)
      await potret(`${b.nama}-${t}-1440`)
      await lebar(390)
      if (await meluber()) catat(`${b.nama} ${t}: meluber di 390`)
      await bersih(`${b.nama} ${t} 390`)
      await potret(`${b.nama}-${t}-390`)
    }
  }
  hasil.limaBagian = 'dipotret'

  // 2. Navigasi.
  await tema('light')
  await lebar(1440)
  await buka('bagian=harian', 'laporan-harian-kartu')
  const pintu = await page.locator('[data-uji="cf-nav-pintu"] [aria-current]').getAttribute('data-pintu')
  const hal = await page.locator('[data-uji="cf-nav-halaman"] [aria-current="page"]').getAttribute('data-halaman')
  if (pintu !== 'ringkasan' || hal !== 'laporan') gagal(`Navigasi aktif ${pintu}/${hal}, harus ringkasan/laporan`)
  const tautan = await page.locator('[data-uji="cf-nav-halaman"] a').evaluateAll(a => a.map(x => x.getAttribute('data-halaman')))
  if (tautan.join(',') !== 'ringkasan,laporan') gagal(`Baris bawah pintu Ringkasan: ${tautan}`)
  hasil.navigasi = `${pintu}/${hal}`

  // Harian: tujuh kartu bergaris, tabel satu baris per tanggal (30), tanpa saldo.
  const kartu = await page.locator('[data-uji="laporan-harian-kartu"] section').count()
  const garis = await page.locator('[data-uji="laporan-harian-kartu"] svg').count()
  const tanggal = await page.locator('[data-uji="laporan-harian-tabel"] tbody tr').count()
  if (kartu !== 7 || garis !== 7 || tanggal !== 30) gagal(`Harian: ${kartu} kartu, ${garis} garis, ${tanggal} tanggal`)
  if (rpc('admin_laporan_saldo').length) gagal('Harian memanggil laporan saldo')
  if (rpc('admin_laporan_harian')[0]?.p.p_hari !== 30) gagal(`Harian p_hari ${JSON.stringify(rpc('admin_laporan_harian')[0]?.p)}`)
  // Rentang 7 hari.
  await page.locator('button[data-seg="7"]').click()
  await page.waitForFunction(() => document.querySelectorAll('[data-uji="laporan-harian-tabel"] tbody tr').length === 7, null, { timeout: 15000 })
  if (!/[?&]hari=7\b/.test(page.url())) gagal(`Rentang tidak masuk URL: ${page.url()}`)
  hasil.harian = { kartu, garis, tanggal, tujuhHari: 7 }

  // 3. Peta jam.
  await buka('bagian=jam', 'peta-jam')
  const kotak = await page.locator('svg.cf-peta-mendatar rect').count()
  const tegak = await page.locator('svg.cf-peta-tegak rect').count()
  if (kotak !== 168 || tegak !== 168) gagal(`Peta jam: ${kotak} kotak mendatar, ${tegak} tegak`)
  const ket = await uji('peta-jam-ket').innerText()
  if (!/^Paling ramai \S+ pukul \d{2}\.00, [\d.]+ catatan\.$/.test(ket)) gagal(`Kalimat puncak: "${ket}"`)
  await page.locator('svg.cf-peta-mendatar rect[data-dow="1"][data-jam="19"]').hover()
  const ketSorot = await uji('peta-jam-ket').innerText()
  if (!/^Senin pukul 19\.00: [\d.]+ catatan dari [\d.]+ orang$/.test(ketSorot)) gagal(`Keterangan sorot: "${ketSorot}"`)
  await page.locator('[data-uji="laporan-jam"] button[data-seg="usaha"]').click()
  await page.waitForTimeout(800)
  const jenis = rpc('admin_laporan_jam_ramai').at(-1)?.p
  if (jenis?.p_jenis !== 'usaha' || jenis?.p_hari !== 30) gagal(`Jam ramai saringan usaha: ${JSON.stringify(jenis)}`)
  await lebar(390)
  const lebarHari = await page.locator('section:has(> h2:text("Catatan per hari")) li span[style]').evaluateAll(x => x.map(e => parseFloat(e.style.width)))
  if (lebarHari.length !== 7 || Math.max(...lebarHari) !== 100) gagal(`Batang per hari pekan: ${lebarHari}`)
  const tampil = await page.evaluate(() => ({
    mendatar: getComputedStyle(document.querySelector('svg.cf-peta-mendatar')).display,
    tegak: getComputedStyle(document.querySelector('svg.cf-peta-tegak')).display,
  }))
  if (tampil.mendatar !== 'none' || tampil.tegak === 'none') gagal(`Peta di 390 tidak diputar: ${JSON.stringify(tampil)}`)
  await potret('jam-usaha-terang-390')
  await lebar(1440)
  hasil.petaJam = { kotak, ket, ketSorot, jenis: jenis.p_jenis }

  // 4. Dukung: K9 selalu tampil, juga saat belum ada ketukan.
  await buka('bagian=dukung', 'laporan-dukung-k9')
  const k9 = await uji('laporan-dukung-k9').innerText()
  if (!k9.includes('1.4.4') || !k9.includes('Ketukan pertama yang tercatat')) gagal(`Kalimat K9: "${k9}"`)
  mode.kosong = true
  await buka('bagian=dukung', 'laporan-dukung-k9')
  const k9Kosong = await uji('laporan-dukung-k9').innerText()
  if (!k9Kosong.includes('Belum ada ketukan dari aplikasi 1.4.4.')) gagal(`K9 kosong: "${k9Kosong}"`)
  await bersih('dukung kosong')
  await potret('dukung-kosong-terang-1440')
  mode.kosong = false
  hasil.dukung = { k9: k9.slice(0, 80) }

  // Batang jawaban asal: urutan tetap, lebar relatif terhadap yang terbesar (tidak terpotong di 100%).
  await buka('bagian=asal', 'laporan-asal-jawaban')
  const lebarJawaban = await page.locator('[data-uji="laporan-asal-jawaban"] li span[style]').evaluateAll(x => x.map(e => parseFloat(e.style.width)))
  const label = await page.locator('[data-uji="laporan-asal-jawaban"] li').evaluateAll(x => x.map(e => e.innerText.split('\n')[0]))
  if (lebarJawaban.length !== 7 || Math.max(...lebarJawaban) !== 100 || lebarJawaban.filter(w => w === 100).length !== 1 || label[0] !== 'Instagram' || label[6] !== 'Melewati pertanyaan') {
    gagal(`Batang jawaban asal: ${JSON.stringify({ lebarJawaban, label })}`)
  }
  hasil.asal = { batang: lebarJawaban }

  // 5. Asal pengguna di server lama.
  mode.belumAda = ['admin_laporan_asal']
  for (const t of ['terang', 'gelap']) {
    await tema(t === 'terang' ? 'light' : 'dark')
    for (const w of [1440, 390]) {
      await lebar(w)
      await buka('bagian=asal', 'laporan-belum-aktif')
      if (await page.getByRole('alert').count()) gagal(`Asal belum aktif ${t} ${w}: ada galat merah`)
      if (await meluber()) catat(`asal belum aktif ${t}: meluber di ${w}`)
      await potret(`asal-belum-aktif-${t}-${w}`)
    }
  }
  // Bagian lain tetap jalan di server yang sama.
  await tema('light')
  await lebar(1440)
  await buka('bagian=harian', 'laporan-harian-kartu')
  mode.belumAda = []
  hasil.asalBelumAktif = 'belum aktif, bagian lain tetap'

  // 6. Saldo (sesi ber-TOTP).
  await buka('bagian=saldo', 'saldo-daftar')
  const s1 = rpc('admin_laporan_saldo')
  if (s1.length !== 1) gagal(`Saldo dipanggil ${s1.length} kali saat dibuka`)
  const a1 = s1[0].p
  if (!/Laporan saldo uang nyata di console$/.test(a1.p_alasan ?? '') || a1.p_mode !== 'ruang' || a1.p_limit !== 25 || a1.p_offset !== 0
      || a1.p_urut !== 'uang_nyata' || a1.p_arah !== 'desc' || a1.p_cari !== null || a1.p_tanpa_internal !== false || a1.p_jenis !== null) {
    gagal(`Argumen saldo: ${JSON.stringify(a1)}`)
  }
  const pertama = await page.locator('[data-uji="saldo-daftar"] table tbody tr').first().innerText()
  if (!pertama.includes('Ruang uji internal tim') || !pertama.includes('Tim')) gagal(`Baris pertama saldo: "${pertama}"`)
  // Kepala kolom Dompet minus: urut server.
  panggilan.length = 0
  await page.locator('[data-uji="saldo-daftar"] th button', { hasText: 'Dompet minus' }).click()
  await page.waitForTimeout(800)
  const s2 = rpc('admin_laporan_saldo').at(-1)?.p
  if (s2?.p_urut !== 'minus' || s2?.p_arah !== 'desc') gagal(`Urut kepala kolom: ${JSON.stringify(s2)}`)
  if (!/[?&]urut=minus\b/.test(page.url())) gagal(`Urut tidak masuk URL: ${page.url()}`)
  // Cari: mengetik tidak memanggil server, menekan Cari memanggil sekali. Teks cari tidak masuk URL.
  panggilan.length = 0
  await uji('saldo-cari').fill('berkah')
  await page.waitForTimeout(900)
  if (rpc('admin_laporan_saldo').length) gagal('Mengetik di kolom cari memanggil laporan saldo')
  await page.locator('[data-uji="saldo-alat"] button[type="submit"]').click()
  await page.waitForTimeout(900)
  const s3 = rpc('admin_laporan_saldo')
  if (s3.length !== 1 || s3[0].p.p_cari !== 'berkah') gagal(`Cari: ${JSON.stringify(s3.map(x => x.p.p_cari))}`)
  if (page.url().includes('berkah')) gagal('Teks cari masuk URL')
  const hasilCari = await page.locator('[data-uji="saldo-daftar"] table tbody tr').count()
  if (hasilCari !== 2) gagal(`Hasil cari berkah: ${hasilCari} baris`)
  // Baris menuju Ruang 360.
  const href = await page.locator('[data-uji="saldo-daftar"] table tbody tr a').first().getAttribute('href')
  if (!/^\/console\/cashflow\/ruang\/00000000-0000-4000-8000-0000000001\d\d$/.test(href ?? '')) gagal(`Tautan Ruang 360: ${href}`)
  // Sembunyikan akun tim.
  await uji('saldo-cari').fill('')
  await page.locator('[data-uji="saldo-alat"] button[type="submit"]').click()
  await page.waitForTimeout(700)
  panggilan.length = 0
  await uji('saldo-tanpa-tim').check()
  await page.waitForTimeout(900)
  const s4 = rpc('admin_laporan_saldo').at(-1)?.p
  if (s4?.p_tanpa_internal !== true) gagal(`Tanpa tim: ${JSON.stringify(s4)}`)
  if ((await page.locator('[data-uji="saldo-daftar"]').innerText()).includes('Ruang uji internal tim')) gagal('Akun tim masih tampil')
  // Per pengguna: tautan ke Pengguna 360, urut ikut di ruang lain hanya di mode ini.
  await buka('bagian=saldo&mode=pengguna', 'saldo-daftar')
  const hrefP = await page.locator('[data-uji="saldo-daftar"] table tbody tr a').first().getAttribute('href')
  if (!/^\/console\/cashflow\/pengguna\/00000000-0000-4000-8000-0000000000\d\d$/.test(hrefP ?? '')) gagal(`Tautan Pengguna 360: ${hrefP}`)
  const opsiUrut = await uji('saldo-urut').locator('option').evaluateAll(o => o.map(x => x.value))
  if (!opsiUrut.includes('ruang_lain') || opsiUrut.includes('anggota')) gagal(`Pilihan urut mode pengguna: ${opsiUrut}`)
  if (rpc('admin_laporan_saldo').at(-1)?.p.p_mode !== 'pengguna') gagal('Mode pengguna tidak dikirim')
  await page.goto(`${APP}/console/cashflow/laporan?bagian=saldo&mode=pengguna&urut=anggota`, { waitUntil: 'domcontentloaded' })
  await uji('saldo-daftar').waitFor({ timeout: 60000 })
  await page.waitForTimeout(500)
  if (rpc('admin_laporan_saldo').some(x => x.p.p_mode === 'pengguna' && x.p.p_urut === 'anggota')) gagal('Urut anggota terkirim di mode pengguna')
  hasil.saldo = { argumen: 'sah', urutKepala: s2.p_urut, cari: 'sekali saat ditekan', ruang360: href, pengguna360: hrefP }

  // 7. Sesi lihat saja: grafik jalan, saldo tidak pernah dipanggil.
  await pasangIzin(['cashflow:view'])
  mfa = false
  mode.izin = false
  for (const t of ['terang', 'gelap']) {
    await tema(t === 'terang' ? 'light' : 'dark')
    for (const w of [1440, 390]) {
      await lebar(w)
      panggilan.length = 0
      await page.goto(`${APP}/console/cashflow/laporan?bagian=saldo`, { waitUntil: 'domcontentloaded' })
      await page.getByText('Sebagian isinya masih terkunci').first().waitFor({ timeout: 60000 })
      await page.waitForTimeout(500)
      if (rpc('admin_laporan_saldo').length) gagal(`Sesi lihat saja memanggil laporan saldo (${t} ${w})`)
      if (await meluber()) catat(`saldo tanpa izin ${t}: meluber di ${w}`)
      await potret(`saldo-tanpa-izin-${t}-${w}`)
    }
  }
  await tema('light')
  await lebar(1440)
  await buka('bagian=jam', 'peta-jam')
  if (!rpc('admin_laporan_jam_ramai').length) gagal('Sesi lihat saja tidak memuat jam ramai')
  hasil.tanpaIzin = 'saldo tidak dipanggil, grafik tetap'

  if (errors.length) gagal(`Galat browser: ${errors.join('; ')}`)
  if (temuan.length) gagal(`Temuan tampilan:\n  ${temuan.join('\n  ')}`)
  console.log(JSON.stringify({ ...hasil, takDikenal: [...server.takDikenal], errors }, null, 1))
} catch (e) {
  if (page) await page.screenshot({ path: join(output, 'galat.png'), fullPage: true }).catch(() => {})
  if (temuan.length) console.error(temuan.join('\n'))
  throw e
} finally {
  if (browser) try { const s = await browser.newBrowserCDPSession(); await s.send('Browser.close') } catch { /* Chrome sudah tertutup. */ }
  chrome.kill()
  await rm(dir, { recursive: true, force: true }).catch(() => {})
}
