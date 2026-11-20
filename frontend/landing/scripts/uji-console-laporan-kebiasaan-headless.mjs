// Uji tampilan bagian "Kebiasaan pengguna aktif" di halaman Laporan CashFlow
// (components/cashflow/CashflowLaporanKebiasaan.vue) dengan data sintetis
// (scripts/data-sintetis-console.mjs). Chrome headless lewat CDP, tanpa jendela.
//
// Yang diperiksa:
//   1. Tabel butir dan daftar orang, terang dan gelap, lebar 1440 dan 390:
//      tidak meluber ke samping, tanpa kode mentah, tanpa galat peramban.
//      Satu baris diketuk, daftar orangnya tampil, tautan tiap orang menuju
//      rincian pengguna.
//   2. Jumlah butir cukup sekali panggil. Daftar baru dipanggil saat baris
//      diketuk, dengan kunci, rentang, halaman, dan alasan tetap.
//   3. Papan ketik: baris adalah tombol, Enter membukanya, fokus pindah ke
//      daftar. Halaman berikutnya, ganti rentang, tutup, dan Back dari
//      rincian pengguna kembali ke daftar yang sama.
//   4. Kunci butir yang belum dikenal console tetap tampil dengan kuncinya,
//      dan galat server untuk kunci asing dilokalkan.
//   5. Server lama (PGRST202): "belum aktif", bukan galat. Data kosong: nol
//      di semua baris dan daftar kosong yang jelas.
//   6. Sesi lihat saja: jumlah butir tampil, daftar orang tidak dipanggil
//      sama sekali dan halaman menawarkan verifikasi.
//
// Jalankan server lokal TANPA .env (tidak ada kunci sungguhan):
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_URL=http://127.0.0.1:4418 \
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY=anon-sintetis \
//   npx nuxi dev --port 4419 --host 127.0.0.1
// lalu:
//   PLAYWRIGHT_CORE_PATH=<playwright-core/index.mjs> CF_QA_ARTIFACTS=<folder> \
//   CF_QA_APP=http://127.0.0.1:4419 CF_QA_SUPABASE=http://127.0.0.1:4418 \
//   node scripts/uji-console-laporan-kebiasaan-headless.mjs
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
const output = process.env.CF_QA_ARTIFACTS || join(tmpdir(), 'cf-laporan-kebiasaan-potret')
const APP = process.env.CF_QA_APP || 'http://127.0.0.1:4419'
const SUPABASE = process.env.CF_QA_SUPABASE || 'http://127.0.0.1:4418'
const PORT_BOLEH = [new URL(APP).port, new URL(SUPABASE).port]
await mkdir(output, { recursive: true })
let cdpPort = 0
while (cdpPort <= 20000) {
  const s = createServer()
  await new Promise(r => s.listen(0, '127.0.0.1', r))
  cdpPort = s.address().port
  await new Promise(r => s.close(r))
}
const dir = await mkdtemp(join(process.env.CF_QA_TMP || tmpdir(), 'cf-kebiasaan-'))
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--user-data-dir=${dir}`, `--remote-debugging-port=${cdpPort}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

/** Kode server dan jalur kamus yang tidak boleh terbaca di layar. */
const MENTAH = /\blaporan\.[a-z]|\bgalat\.[a-z]|\badmin_laporan|\bundefined\b|\bNaN\b|\[object |satu_ruang|banyak_ruang|berbagi_ruang|banyak_hp|catat_usaha|pakai_domi|beli_kredit|aktif_7|baru_bertahan|pesan_domi|ruang_bersama|terakhir_catat/
const ALASAN = /Daftar orang per kebiasaan di Laporan console$/
const POLA_PENGGUNA = /^\/console\/cashflow\/pengguna\/00000000-0000-4000-8000-\d{12}$/

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
  const tombol = kunci => page.locator(`[data-uji="kebiasaan-tabel"] tr[data-butir="${kunci}"] button`)
  const buka = async (query = '', siap = 'kebiasaan-tabel') => {
    panggilan.length = 0
    await page.goto(`${APP}/console/cashflow/laporan?bagian=kebiasaan${query}`, { waitUntil: 'domcontentloaded' })
    await uji(siap).first().waitFor({ timeout: 90000 })
    await page.waitForTimeout(400)
  }
  /** Daftar untuk kunci|hari|hal ini sudah tampil. */
  const daftarSiap = kunci => page.locator(`[data-uji="kebiasaan-daftar"][data-kunci="${kunci}"]`).waitFor({ timeout: 20000 })
  const bersih = async (di, pola = MENTAH) => {
    const teks = await page.evaluate(() => document.querySelector('main')?.innerText ?? document.body.innerText)
    const m = teks.match(pola)
    if (m) catat(`${di}: kode mentah atau teks rusak terbaca: "${m[0]}"`)
    // Tanda pisah sebagai isi sel kosong boleh. Di dalam kalimat tidak.
    const k = teks.match(/[^\n\t]{0,30}(?:;|[^\s—]\s?—\s?[^\s—])[^\n\t]{0,30}/)
    if (k) catat(`${di}: tanda baca terlarang: "${k[0]}"`)
  }
  const rpc = n => panggilan.filter(x => x.nama === n)
  /** Tautan orang yang terlihat di lebar ini (tabel di layar lebar, kartu di layar sempit). */
  const tautanOrang = () => page.locator('[data-uji="kebiasaan-daftar"] a[href*="/pengguna/"]').evaluateAll(a => a.filter(x => x.offsetParent !== null).map(x => x.getAttribute('href')))

  // 1. Tabel dan daftar, terang dan gelap, 1440 dan 390 (sesi ber-TOTP).
  for (const t of ['terang', 'gelap']) {
    await tema(t === 'terang' ? 'light' : 'dark')
    for (const w of [1440, 390]) {
      await lebar(w)
      await buka()
      if (await page.getByRole('alert').count()) catat(`tabel ${t} ${w}: ada galat merah`)
      if (await uji('kebiasaan-daftar').count()) gagal(`Daftar orang tampil sebelum ada baris yang diketuk (${t} ${w})`)
      if (rpc('admin_laporan_kebiasaan_daftar').length) gagal(`Daftar orang dipanggil sebelum ada baris yang diketuk (${t} ${w})`)
      await bersih(`tabel ${t} ${w}`)
      // Persen: kolom sendiri di layar lebar, turun ke bawah label di layar sempit. Tidak pernah dua-duanya.
      const persen = await page.evaluate(() => ({
        kolom: [...document.querySelectorAll('[data-uji="kebiasaan-tabel"] tbody td:nth-child(3)')].filter(x => x.offsetParent !== null).length,
        bawah: [...document.querySelectorAll('[data-uji="kebiasaan-persen-sempit"]')].filter(x => x.offsetParent !== null).length,
      }))
      if (w > 640 ? (persen.kolom !== 12 || persen.bawah !== 0) : (persen.kolom !== 0 || persen.bawah !== 12)) gagal(`Persen di ${w} (${t}): ${JSON.stringify(persen)}`)
      if (await meluber()) catat(`tabel ${t}: meluber di ${w}`)
      await potret(`kebiasaan-tabel-${t}-${w}`)
      // Baris diketuk, daftar tampil, tautan menuju rincian pengguna.
      await tombol('banyak_ruang').click()
      await daftarSiap('banyak_ruang|30|1')
      await page.waitForTimeout(300)
      const href = await tautanOrang()
      if (href.length !== 50 || !href.every(h => POLA_PENGGUNA.test(h ?? ''))) gagal(`Tautan orang (${t} ${w}): ${href.length} tautan, contoh ${href[0]}`)
      if (href[0] !== `/console/cashflow/pengguna/${uuid(1)}`) gagal(`Tautan orang pertama (${t} ${w}): ${href[0]}`)
      if (await page.getByRole('alert').count()) catat(`daftar ${t} ${w}: ada galat merah`)
      await bersih(`daftar ${t} ${w}`)
      if (await meluber()) catat(`daftar ${t}: meluber di ${w}`)
      await uji('kebiasaan-daftar').scrollIntoViewIfNeeded()
      await page.waitForTimeout(300)
      await page.screenshot({ path: join(output, `kebiasaan-daftar-${t}-${w}.png`) })
      await page.screenshot({ path: join(output, `kebiasaan-daftar-${t}-${w}-penuh.png`), fullPage: true })
    }
  }
  hasil.tampilan = 'tabel dan daftar dipotret, terang dan gelap, 1440 dan 390'

  // 2. Isi tabel dan panggilan (terang, 1440).
  await tema('light')
  await lebar(1440)
  await buka()
  const r1 = rpc('admin_laporan_kebiasaan')
  if (r1.length !== 1 || r1[0].p.p_hari !== 30 || Object.keys(r1[0].p).join() !== 'p_hari') gagal(`Panggilan jumlah butir: ${JSON.stringify(r1.map(x => x.p))}`)
  const aktifNav = await page.locator('[data-uji="laporan-alat"] button[data-seg="kebiasaan"]').getAttribute('aria-pressed').catch(() => null)
  const pembuka = (await uji('kebiasaan-pembuka').innerText()).trim()
  if (pembuka !== 'Dari 1.204 akun pengguna luar, 312 mencatat dalam 30 hari terakhir.') gagal(`Kalimat pembuka: "${pembuka}"`)
  const baris = await page.locator('[data-uji="kebiasaan-tabel"] tbody tr').evaluateAll(tr => tr.map(x => ({
    kunci: x.getAttribute('data-butir'), tombol: x.querySelectorAll('button[type="button"]').length,
    sel: [...x.querySelectorAll('td')].map(td => td.innerText.trim().split('\n')[0]),
  })))
  const kunciUrut = baris.map(b => b.kunci).join(',')
  if (kunciUrut !== 'aktif,satu_ruang,banyak_ruang,catat_banyak_ruang,berbagi_ruang,banyak_hp,catat_usaha,pakai_domi,beli_kredit,aktif_7,baru,baru_bertahan') gagal(`Urutan baris: ${kunciUrut}`)
  if (!baris.every(b => b.tombol === 1)) gagal('Ada baris tanpa tombol sungguhan')
  const sel = k => baris.find(b => b.kunci === k).sel
  const harap = {
    aktif: ['Semua yang mencatat dalam rentang ini', '312', '26% dari semua akun'],
    satu_ruang: ['Punya 1 ruang saja', '201', '64% dari yang aktif'],
    beli_kredit: ['Pernah membeli kredit Domi', '9', '1% dari semua akun'],
    baru: ['Mendaftar dalam rentang ini', '132', '11% dari semua akun'],
    baru_bertahan: ['Pendaftar baru yang masih mencatat sesudah minggu pertama', '41', '31% dari pendaftar baru'],
  }
  for (const [k, h] of Object.entries(harap)) if (sel(k).join('|') !== h.join('|')) gagal(`Baris ${k}: ${JSON.stringify(sel(k))}`)
  const ketSemua = await uji('kebiasaan-ket-semua').innerText()
  if (!/dihitung dari semua akun luar, bukan hanya yang aktif/.test(ketSemua)) gagal(`Keterangan semua akun: "${ketSemua}"`)
  hasil.tabel = { baris: baris.length, pembuka, bagianAktif: aktifNav }

  // 3. Papan ketik: Enter di tombol baris membuka daftar, fokus pindah ke daftar.
  await tombol('aktif').focus()
  await page.keyboard.press('Enter')
  await daftarSiap('aktif|30|1')
  const d1 = rpc('admin_laporan_kebiasaan_daftar')
  if (d1.length !== 1) gagal(`Daftar dipanggil ${d1.length} kali saat baris dibuka`)
  const a1 = d1[0].p
  if (a1.p_kunci !== 'aktif' || a1.p_hari !== 30 || a1.p_hal !== 1 || !ALASAN.test(a1.p_alasan ?? '') || Object.keys(a1).sort().join() !== 'p_alasan,p_hal,p_hari,p_kunci') gagal(`Argumen daftar: ${JSON.stringify(a1)}`)
  if (await tombol('aktif').getAttribute('aria-expanded') !== 'true') gagal('aria-expanded baris terbuka bukan true')
  if (await tombol('satu_ruang').getAttribute('aria-expanded') !== 'false') gagal('aria-expanded baris lain bukan false')
  const fokus = await page.evaluate(() => document.activeElement?.getAttribute('data-uji'))
  if (fokus !== 'kebiasaan-daftar') gagal(`Fokus sesudah membuka daftar: ${fokus}`)
  if (!/[?&]butir=aktif\b/.test(page.url())) gagal(`Butir tidak masuk URL: ${page.url()}`)
  if (rpc('admin_laporan_kebiasaan').length !== 1) gagal('Membuka daftar memanggil ulang jumlah butir')
  const jumlah = (await uji('kebiasaan-daftar-jumlah').innerText()).trim()
  if (jumlah !== '312 orang') gagal(`Jumlah daftar: "${jumlah}"`)
  const kepala = await page.locator('[data-uji="kebiasaan-orang-tabel"] thead th').evaluateAll(th => th.map(x => x.innerText.trim()))
  if (kepala.join('|') !== 'Pengguna|Daftar|Terakhir mencatat|Catatan|Ruang|Ruang bersama|HP|Pesan Domi|Beli kredit') gagal(`Kepala kolom daftar: ${kepala.join('|')}`)
  const orang1 = await page.locator('[data-uji="kebiasaan-orang-tabel"] tbody tr').first().innerText()
  if (!orang1.includes('sari@contoh.invalid') || !orang1.includes('Sari Wulandari')) gagal(`Orang pertama: "${orang1}"`)
  if (!(await uji('kebiasaan-audit').innerText()).includes('tercatat di Audit')) gagal('Keterangan audit tidak tampil')
  // Halaman berikutnya: 312 orang, 50 per halaman.
  const pager = await uji('kebiasaan-daftar').getByText('Halaman 1 dari 7').count()
  if (!pager) gagal('Pager "Halaman 1 dari 7" tidak tampil')
  panggilan.length = 0
  await uji('kebiasaan-daftar').getByRole('button', { name: 'Berikutnya' }).click()
  await daftarSiap('aktif|30|2')
  const a2 = rpc('admin_laporan_kebiasaan_daftar').at(-1)?.p
  if (a2?.p_hal !== 2 || a2?.p_kunci !== 'aktif') gagal(`Halaman berikutnya: ${JSON.stringify(a2)}`)
  if (!/[?&]hal=2\b/.test(page.url())) gagal(`Halaman tidak masuk URL: ${page.url()}`)
  const hrefHal2 = (await tautanOrang())[0]
  if (hrefHal2 !== `/console/cashflow/pengguna/${uuid(2050)}`) gagal(`Orang pertama halaman 2: ${hrefHal2}`)
  // Buka satu orang, lalu Back: daftar yang sama terbuka lagi.
  await page.locator('[data-uji="kebiasaan-orang-tabel"] tbody tr a').first().click()
  await page.waitForURL(u => u.pathname === `/console/cashflow/pengguna/${uuid(2050)}`, { timeout: 20000 })
  await page.waitForTimeout(600)
  await page.goBack()
  await daftarSiap('aktif|30|2')
  if (!/butir=aktif/.test(page.url()) || !/hal=2/.test(page.url())) gagal(`URL sesudah Back: ${page.url()}`)
  // Ganti rentang: jumlah butir dan daftar dimuat ulang untuk 7 hari, halaman kembali ke 1.
  panggilan.length = 0
  await page.locator('[data-uji="laporan-alat"] button[data-seg="7"]').click()
  await daftarSiap('aktif|7|1')
  const r7 = rpc('admin_laporan_kebiasaan').at(-1)?.p
  const d7 = rpc('admin_laporan_kebiasaan_daftar').at(-1)?.p
  if (r7?.p_hari !== 7 || d7?.p_hari !== 7 || d7?.p_hal !== 1) gagal(`Rentang 7 hari: ${JSON.stringify({ r7, d7 })}`)
  const pembuka7 = (await uji('kebiasaan-pembuka').innerText()).trim()
  if (pembuka7 !== 'Dari 1.204 akun pengguna luar, 125 mencatat dalam 7 hari terakhir.') gagal(`Kalimat pembuka 7 hari: "${pembuka7}"`)
  // Tutup: daftar hilang, butir keluar dari URL, fokus kembali ke tombol barisnya.
  await uji('kebiasaan-tutup').click()
  await uji('kebiasaan-daftar').waitFor({ state: 'detached', timeout: 10000 })
  if (/butir=/.test(page.url())) gagal(`Butir masih di URL sesudah ditutup: ${page.url()}`)
  const fokusTutup = await page.evaluate(() => document.activeElement?.closest('tr')?.getAttribute('data-butir'))
  if (fokusTutup !== 'aktif') gagal(`Fokus sesudah menutup daftar: ${fokusTutup}`)
  // Ketuk baris yang sama dua kali: buka lalu tutup.
  await tombol('pakai_domi').click()
  await daftarSiap('pakai_domi|7|1')
  await tombol('pakai_domi').click()
  await uji('kebiasaan-daftar').waitFor({ state: 'detached', timeout: 10000 })
  hasil.daftar = { argumen: 'kunci, rentang, halaman, alasan tetap', jumlah, halaman2: hrefHal2, kembali: 'Back membuka daftar yang sama', rentang7: pembuka7 }

  // 4. Kunci butir baru dari server: tampil dengan kuncinya, galat kunci dilokalkan.
  mode.butirAsing = true
  await buka()
  const asing = await page.locator('[data-uji="kebiasaan-tabel"] tr[data-butir="butir_baru_server"]').innerText()
  if (!asing.includes('butir_baru_server') || !/\b5\b/.test(asing) || asing.includes('%')) gagal(`Baris kunci asing: "${asing}"`)
  await tombol('butir_baru_server').click()
  await page.getByRole('alert').first().waitFor({ timeout: 15000 })
  const pesanAsing = await uji('kebiasaan-daftar').getByRole('alert').innerText()
  if (!pesanAsing.includes('Pilihan ini tidak dikenal server') || pesanAsing.includes('Butir tidak dikenal')) gagal(`Galat kunci asing: "${pesanAsing}"`)
  await potret('kebiasaan-kunci-asing-terang-1440')
  mode.butirAsing = false
  hasil.kunciAsing = 'tampil dengan kuncinya, galat dilokalkan'

  // 5. Server lama dan data kosong.
  mode.belumAda = ['admin_laporan_kebiasaan', 'admin_laporan_kebiasaan_daftar']
  for (const t of ['terang', 'gelap']) {
    await tema(t === 'terang' ? 'light' : 'dark')
    for (const w of [1440, 390]) {
      await lebar(w)
      await buka('', 'laporan-belum-aktif')
      if (await page.getByRole('alert').count()) gagal(`Belum aktif ${t} ${w}: ada galat merah`)
      if (await meluber()) catat(`belum aktif ${t}: meluber di ${w}`)
      await potret(`kebiasaan-belum-aktif-${t}-${w}`)
    }
  }
  mode.belumAda = []
  await tema('light')
  await lebar(1440)
  mode.kosong = true
  await buka()
  const nol = await page.locator('[data-uji="kebiasaan-tabel"] tbody tr td:nth-child(2)').evaluateAll(td => td.map(x => x.innerText.trim()))
  if (nol.length !== 12 || nol.some(x => x !== '0')) gagal(`Data kosong: ${nol}`)
  await bersih('kosong')
  await tombol('baru').click()
  await uji('kebiasaan-daftar').getByText('Belum ada orang di kelompok ini.').waitFor({ timeout: 15000 })
  await potret('kebiasaan-kosong-terang-1440')
  mode.kosong = false
  hasil.belumAktifDanKosong = 'belum aktif tanpa galat, kosong terbaca'

  // 6. Sesi lihat saja: jumlah butir tampil, daftar orang tidak pernah dipanggil.
  await pasangIzin(['cashflow:view'])
  mfa = false
  mode.izin = false
  for (const t of ['terang', 'gelap']) {
    await tema(t === 'terang' ? 'light' : 'dark')
    for (const w of [1440, 390]) {
      await lebar(w)
      await buka()
      if ((await page.locator('[data-uji="kebiasaan-tabel"] tbody tr').count()) !== 12) gagal(`Sesi lihat saja tidak melihat tabel butir (${t} ${w})`)
      await tombol('berbagi_ruang').click()
      await uji('kebiasaan-daftar').getByText('Sebagian isinya masih terkunci').first().waitFor({ timeout: 20000 })
      const pesan = await uji('kebiasaan-daftar').innerText()
      if (!pesan.includes('Daftar orang hanya terbuka untuk login console ber-TOTP.')) gagal(`Pesan izin kurang (${t} ${w}): "${pesan}"`)
      await page.waitForTimeout(500)
      if (rpc('admin_laporan_kebiasaan_daftar').length) gagal(`Sesi lihat saja memanggil daftar orang (${t} ${w})`)
      if (await page.locator('[data-uji="kebiasaan-daftar"] a[href*="/pengguna/"]').count()) gagal(`Sesi lihat saja melihat tautan orang (${t} ${w})`)
      if (await meluber()) catat(`tanpa izin ${t}: meluber di ${w}`)
      await bersih(`tanpa izin ${t} ${w}`)
      await uji('kebiasaan-daftar').scrollIntoViewIfNeeded()
      await page.waitForTimeout(300)
      await page.screenshot({ path: join(output, `kebiasaan-tanpa-izin-${t}-${w}.png`) })
      await page.screenshot({ path: join(output, `kebiasaan-tanpa-izin-${t}-${w}-penuh.png`), fullPage: true })
    }
  }
  // Tautan langsung ke daftar dengan sesi lihat saja: tetap tidak dipanggil.
  await buka('&butir=aktif&hal=3', 'kebiasaan-daftar')
  await page.waitForTimeout(600)
  if (rpc('admin_laporan_kebiasaan_daftar').length) gagal('Tautan langsung membuat sesi lihat saja memanggil daftar orang')
  hasil.tanpaIzin = 'jumlah butir tampil, daftar tidak dipanggil'

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
