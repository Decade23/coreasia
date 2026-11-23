// Uji tampilan bagian "Minat Kilas Pasar" di halaman Laporan CashFlow
// (components/cashflow/CashflowLaporanPasar.vue dan CashflowLaporanPasarIsi.vue)
// dengan data sintetis (scripts/data-sintetis-console.mjs). Chrome headless lewat
// CDP, tanpa jendela.
//
// Yang diperiksa:
//   1. Terang dan gelap, lebar 1440 dan 390: tidak meluber ke samping, tanpa
//      kode mentah, tanpa tanda baca terlarang, tanpa galat peramban.
//   2. RPC admin_laporan_pasar dipanggil sekali dengan p_hari saja, mengikuti
//      pemilih rentang. Ganti rentang memuat ulang dengan hari baru.
//   3. Isi: corong orang, nama sumber dari id, kalimat halaman resmi, dan
//      tabel Domi per topik.
//   4. Sumber 'lain' dan id baru dari server tetap tampil tanpa teks mentah.
//   5. Server lama (PGRST202): kalimat tenang "belum aktif" di bagian ini saja,
//      dan bagian Laporan lain tetap jalan. Data kosong: "Belum ada data".
//   6. Sesi lihat saja (izin view): bagian ini tetap tampil.
//
// Jalankan server lokal TANPA .env (tidak ada kunci sungguhan):
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_URL=http://127.0.0.1:4428 \
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY=anon-sintetis \
//   npx nuxi dev --port 4429 --host 127.0.0.1
// lalu:
//   PLAYWRIGHT_CORE_PATH=<playwright-core/index.mjs> CF_QA_ARTIFACTS=<folder> \
//   CF_QA_APP=http://127.0.0.1:4429 CF_QA_SUPABASE=http://127.0.0.1:4428 \
//   node scripts/uji-console-laporan-pasar-headless.mjs
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
const output = process.env.CF_QA_ARTIFACTS || join(tmpdir(), 'cf-laporan-pasar-potret')
const APP = process.env.CF_QA_APP || 'http://127.0.0.1:4429'
const SUPABASE = process.env.CF_QA_SUPABASE || 'http://127.0.0.1:4428'
const PORT_BOLEH = [new URL(APP).port, new URL(SUPABASE).port]
await mkdir(output, { recursive: true })
let cdpPort = 0
while (cdpPort <= 20000) {
  const s = createServer()
  await new Promise(r => s.listen(0, '127.0.0.1', r))
  cdpPort = s.address().port
  await new Promise(r => s.close(r))
}
const dir = await mkdtemp(join(process.env.CF_QA_TMP || tmpdir(), 'cf-pasar-'))
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--user-data-dir=${dir}`, `--remote-debugging-port=${cdpPort}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

/** Kode server dan jalur kamus yang tidak boleh terbaca di layar. */
const MENTAH = /\blaporan\.[a-z]|\bgalat\.[a-z]|\badmin_laporan|\bundefined\b|\bNaN\b|\[object |emas_saham|lihat_semua|kurang_10|sampai_60|sampai_180|lebih_180|detail_dari|tanya_kartu|\bdari_promo\b|https?:\/\//

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
  const buka = async (query = '', siap = 'pasar-isi') => {
    panggilan.length = 0
    await page.goto(`${APP}/console/cashflow/laporan?bagian=pasar${query}`, { waitUntil: 'domcontentloaded' })
    await uji(siap).first().waitFor({ timeout: 90000 })
    await page.waitForTimeout(500)
  }
  const teksBagian = () => uji('pasar').innerText()
  const bersih = async (di, pola = MENTAH) => {
    const teks = await page.evaluate(() => document.querySelector('main')?.innerText ?? document.body.innerText)
    const m = teks.match(pola)
    if (m) catat(`${di}: kode mentah atau teks rusak terbaca: "${m[0]}"`)
    // Tanda pisah sebagai isi sel kosong boleh. Di dalam kalimat tidak.
    const k = teks.match(/[^\n\t]{0,30}(?:;|[^\s—]\s?—\s?[^\s—])[^\n\t]{0,30}/)
    if (k) catat(`${di}: tanda baca terlarang: "${k[0]}"`)
  }
  const rpc = n => panggilan.filter(x => x.nama === n)

  // 1. Terang dan gelap, 1440 dan 390.
  for (const t of ['terang', 'gelap']) {
    await tema(t === 'terang' ? 'light' : 'dark')
    for (const w of [1440, 390]) {
      await lebar(w)
      await buka()
      if (await page.getByRole('alert').count()) catat(`lengkap ${t} ${w}: ada galat merah`)
      await bersih(`lengkap ${t} ${w}`)
      if (await meluber()) catat(`lengkap ${t}: meluber di ${w}`)
      await potret(`pasar-lengkap-${t}-${w}`)
    }
  }
  hasil.tampilan = 'lengkap dipotret, terang dan gelap, 1440 dan 390'

  // 2. Panggilan dan rentang (terang, 1440).
  await tema('light')
  await lebar(1440)
  await buka()
  const r30 = rpc('admin_laporan_pasar')
  if (r30.length !== 1 || r30[0].p.p_hari !== 30 || Object.keys(r30[0].p).join() !== 'p_hari') gagal(`Panggilan 30 hari: ${JSON.stringify(r30.map(x => x.p))}`)
  if (await uji('pasar').getAttribute('data-kunci') !== '30') gagal('Penanda rentang 30 tidak tampil')
  const aktif = await page.locator('[data-uji="laporan-alat"] button[data-seg="pasar"]').getAttribute('aria-pressed')
  if (aktif !== 'true') gagal(`Pil bagian Minat Kilas Pasar tidak aktif: ${aktif}`)
  panggilan.length = 0
  await page.locator('[data-uji="laporan-alat"] button[data-seg="7"]').click()
  await page.locator('[data-uji="pasar"][data-kunci="7"]').waitFor({ timeout: 20000 })
  const r7 = rpc('admin_laporan_pasar')
  if (r7.length !== 1 || r7[0].p.p_hari !== 7) gagal(`Panggilan 7 hari: ${JSON.stringify(r7.map(x => x.p))}`)
  if (!/[?&]hari=7\b/.test(page.url())) gagal(`Rentang tidak masuk URL: ${page.url()}`)
  if (rpc('admin_laporan_harian').length) gagal('Bagian pasar ikut memanggil laporan harian')
  hasil.panggilan = { hari30: r30[0].p, hari7: r7[0].p }

  // 3. Isi (30 hari).
  await buka()
  /* Persen ditulis sebagai span sendiri, innerText bisa tanpa spasi sebelum kurung. */
  const corong = (await uji('pasar-corong').innerText()).replace(/\s+/g, ' ').replace(/\s?\(/g, ' (')
  for (const harap of ['Melihat kartu 3.104', 'Membuka Detail 1.204 (39%)', 'Mengetuk sumber 712 (59%)', 'Membuka halaman resmi 796', 'Bertanya ke Domi soal pasar']) {
    if (!corong.includes(harap)) gagal(`Corong tanpa "${harap}": ${corong}`)
  }
  if (/796 \(\d+%\)/.test(corong)) gagal('Halaman resmi lebih banyak dari yang mengetuk, tetapi persen tetap ditulis')
  const sumber = (await uji('pasar-sumber').innerText()).replace(/\s+/g, ' ')
  for (const harap of ['GoPay 412 310 orang, Dompet dan bank', 'Logam Mulia (Antam) 241 188 orang, Tautan emas dan saham', 'Pegadaian 177 131 orang, Emas', 'Bursa Efek Indonesia 88']) {
    if (!sumber.includes(harap)) gagal(`Sumber tanpa "${harap}": ${sumber}`)
  }
  const halaman = (await uji('pasar-halaman').innerText()).replace(/\s+/g, ' ')
  for (const harap of ['Kartu Kilas Pasar 1.204', 'Jawaban Domi 310', 'Dari 1.422 halaman yang tercatat ditutup.', 'Dibuka di browser 77 kali', 'Pindah ke situs lain 41 kali']) {
    if (!halaman.includes(harap)) gagal(`Halaman resmi tanpa "${harap}": ${halaman}`)
  }
  const domi = await page.locator('[data-uji="pasar-domi-tabel"] tbody tr').evaluateAll(tr => tr.map(x => [...x.querySelectorAll('td')].map(td => td.innerText.trim()).join('|')))
  if (domi.join(',') !== 'Kurs dan valas|412|204,Emas|310|177,Saham|96|61,Promo|131|88,Umum, misalnya investasi atau daya beli|41|33') gagal(`Tabel Domi: ${domi.join(',')}`)
  const garis = await page.locator('[data-uji="pasar-harian"] svg').count()
  if (garis !== 5) gagal(`Garis harian: ${garis}`)
  hasil.isi = { corong, domi: domi.length, garis }

  // 4. Sumber lain dan id baru.
  mode.pasarLain = true
  await buka()
  const sumberLain = (await uji('pasar-sumber').innerText()).replace(/\s+/g, ' ')
  if (!sumberLain.includes('Sumber lain 6') || !sumberLain.includes('dompet_baru 4')) gagal(`Sumber lain dan id baru: ${sumberLain}`)
  await bersih('sumber lain', /\blaporan\.[a-z]|\bundefined\b|\bNaN\b|https?:\/\//)
  mode.pasarLain = false
  hasil.sumberLain = 'lain dan id baru tampil'

  // 5. Server lama dan data kosong.
  mode.belumAda = ['admin_laporan_pasar']
  for (const t of ['terang', 'gelap']) {
    await tema(t === 'terang' ? 'light' : 'dark')
    for (const w of [1440, 390]) {
      await lebar(w)
      await buka('', 'laporan-belum-aktif')
      if (await page.getByRole('alert').count()) gagal(`Belum aktif ${t} ${w}: ada galat merah`)
      const kalimat = (await teksBagian()).trim()
      if (kalimat !== 'Minat Kilas Pasar belum aktif di server. Angkanya muncul sendiri begitu pembaruan server terpasang.') gagal(`Kalimat belum aktif: "${kalimat}"`)
      if (await meluber()) catat(`belum aktif ${t}: meluber di ${w}`)
      await potret(`pasar-belum-aktif-${t}-${w}`)
    }
  }
  // Bagian lain tetap jalan walau fungsi pasar belum ada.
  await tema('light')
  await lebar(1440)
  await page.locator('[data-uji="laporan-alat"] button[data-seg="harian"]').click()
  await uji('laporan-harian-kartu').waitFor({ timeout: 20000 })
  if (await uji('laporan-belum-aktif').count()) gagal('Belum aktif bagian pasar ikut tampil di bagian Harian')
  mode.belumAda = []
  mode.kosong = true
  for (const t of ['terang', 'gelap']) {
    await tema(t === 'terang' ? 'light' : 'dark')
    await lebar(1440)
    await buka('', 'pasar-kosong')
    const kosong = (await uji('pasar-kosong').innerText()).trim()
    if (!kosong.startsWith('Belum ada data di rentang ini.')) gagal(`Kalimat kosong: "${kosong}"`)
    if (await page.getByRole('alert').count()) gagal(`Kosong ${t}: ada galat merah`)
    if (await uji('pasar-corong').count()) gagal(`Kosong ${t}: corong nol tetap digambar`)
    await bersih(`kosong ${t}`)
    await potret(`pasar-kosong-${t}-1440`)
  }
  mode.kosong = false
  hasil.belumAktifDanKosong = 'belum aktif tenang dan hanya di bagian ini, kosong menulis Belum ada data'

  // 6. Sesi lihat saja: agregat berizin view tetap tampil.
  await pasangIzin(['cashflow:view'])
  mfa = false
  mode.izin = false
  await tema('dark')
  await lebar(390)
  await buka()
  if (await page.getByRole('alert').count()) gagal('Sesi lihat saja: ada galat merah')
  await bersih('lihat saja gelap 390')
  await potret('pasar-lihat-saja-gelap-390')
  hasil.lihatSaja = 'tampil'

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
