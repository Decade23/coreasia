// Uji tata letak tab Domi AI di Pengguna 360 dengan riwayat panjang: 48
// percakapan berhalaman dan satu percakapan 60 pesan (data sintetis
// mode.domiPanjang). Yang diperiksa: dua panel setinggi layar yang masing-
// masing bergulir sendiri, kepala isi tetap di tempat, halaman tidak memanjang
// saat daftar bertambah, pencarian judul, sorotan dan panah atas/bawah,
// tombol ke awal dan ke pesan terbaru, info admin yang bisa dilipat, ponsel
// 390 (daftar dulu, isi dengan tombol kembali), bahasa Inggris, dan jumlah
// panggilan RPC (tiap panggilan menulis satu audit, jadi tidak boleh ada
// panggilan tambahan dari pencarian atau panah). Lalu Segarkan: tombol memuat
// daftar dan isi, jendela kembali dilihat hanya memuat daftar dan paling sering
// sekali per 30 detik (bagian ini menunggu 31 detik sungguhan), tawaran pesan
// baru, dan anak kasus yang habis berujung ajakan membuka lagi tanpa kasus
// anak baru yang dibuka sendiri. Terang dan gelap, 1440 dan 390. Chrome
// headless lewat CDP, tanpa jendela.
//
// Jalankan server lokal TANPA .env (tidak ada kunci sungguhan):
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_URL=http://127.0.0.1:4398 \
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY=anon-sintetis \
//   npx nuxi dev --port 4399 --host 127.0.0.1
// lalu:
//   PLAYWRIGHT_CORE_PATH=<playwright-core/index.mjs> CF_QA_ARTIFACTS=<folder> \
//   node scripts/uji-console-domi-tampil-headless.mjs
// CF_QA_SEBELUM=1 hanya memotret (berkas sebelum-*.png) tanpa memeriksa tata
// letak baru, untuk pembanding sebelum perubahan. CF_QA_APP, CF_QA_SUPABASE,
// dan CF_QA_TMP sama dengan skrip uji console lainnya.
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'
import { tmpdir, homedir } from 'node:os'
import { join } from 'node:path'
import { SAAT, U, uuid, buatServer, PERCAKAPAN_PANJANG } from './data-sintetis-console.mjs'

const pwPath = process.env.PLAYWRIGHT_CORE_PATH
const { chromium } = await (pwPath ? import(pathToFileURL(pwPath).href) : import('playwright-core'))
const output = process.env.CF_QA_ARTIFACTS || join(homedir(), 'Codex', 'artifact', 'coreasia')
const APP = process.env.CF_QA_APP || 'http://127.0.0.1:4399'
const SUPABASE = process.env.CF_QA_SUPABASE || 'http://127.0.0.1:4398'
const PORT_BOLEH = [new URL(APP).port, new URL(SUPABASE).port]
const SEBELUM = process.env.CF_QA_SEBELUM === '1'
const FASE = SEBELUM ? 'sebelum' : 'sesudah'
await mkdir(output, { recursive: true })
const portServer = createServer()
await new Promise(r => portServer.listen(0, '127.0.0.1', r))
const cdpPort = portServer.address().port
await new Promise(r => portServer.close(r))
const dir = await mkdtemp(join(process.env.CF_QA_TMP || tmpdir(), 'cf-domi-tampil-'))
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--user-data-dir=${dir}`, `--remote-debugging-port=${cdpPort}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

const JALUR = `/console/cashflow/pengguna/${U}/domi`
const JUDUL_PANJANG = PERCAKAPAN_PANJANG[0].judul
const server = buatServer()
const hasil = {}
const potret = []

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
    // Jam dibekukan supaya waktu di daftar sama di setiap putaran.
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
    sessionStorage.setItem('cf_izin', JSON.stringify(['cashflow:view', 'cashflow:pii', 'cashflow:investigasi', 'cashflow:tindak', 'cashflow:ekspor']))
    addEventListener('DOMContentLoaded', () => {
      const gaya = document.createElement('style')
      gaya.textContent = '[id^="nuxt-devtools"]{display:none!important}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}html,*{scroll-behavior:auto!important}'
      document.head.append(gaya)
    })
  }, { session, saat: SAAT })
  await ctx.route('**/*', (route) => {
    const u = new URL(route.request().url())
    return u.hostname === '127.0.0.1' && PORT_BOLEH.includes(u.port) ? route.continue() : route.abort()
  })
  const saatIso = new Date(SAAT - 60_000).toISOString()
  await page.route('**/api/gw/**', r => r.fulfill({ status: 404, json: { error: 'gateway sintetis' } }))
  await page.route('**/api/gw/admin/auth/me', r => r.fulfill({ json: { data: {
    id: 'admin-test', email: 'admin@contoh.invalid', full_name: 'Admin Contoh', role: 'super_admin', is_active: true, created_at: '2026-01-01T00:00:00Z',
    mfa: true, mfa_at: saatIso, totp_enabled_at: '2026-01-01T00:00:00Z', totp_enabled: true,
  } } }))
  const mode = { kosong: false, izin: true, belumAda: null, domiPanjang: true, domiBaru: false }
  /** Server menolak kasus anak Domi seperti jendela 10 menitnya sudah habis. */
  let anakHabis = false
  /** Setiap RPC yang sampai ke server tiruan, urut. */
  const seen = []
  const galat = []
  page.on('pageerror', e => galat.push(e.message))
  const cors = { 'access-control-allow-origin': '*' }
  await page.route(`${SUPABASE}/**`, async (r) => {
    const req = r.request()
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' } })
    const nama = new URL(req.url()).pathname.split('/').pop()
    let p = {}
    try { p = req.postDataJSON() || {} } catch { /* Badan bukan JSON. */ }
    seen.push({ nama, p })
    if (anakHabis && nama.startsWith('admin_ai_')) return r.fulfill({ status: 403, headers: cors, json: { code: '42501', message: 'kasus-kedaluwarsa', hint: 'kasus-kedaluwarsa', details: null } })
    const j = server.jawab(nama, p, mode)
    return r.fulfill({ status: j.status ?? 200, headers: cors, json: j.json })
  })

  const gagal = (pesan) => { throw new Error(pesan) }
  const hitung = nama => seen.filter(x => x.nama === nama).length
  const tema = async (t) => {
    await ctx.clearCookies()
    await ctx.addCookies([{ name: 'coreasia-theme', value: t === 'terang' ? 'light' : 'dark', domain: '127.0.0.1', path: '/' }])
  }
  const lebar = async (w) => { await page.setViewportSize({ width: w, height: w > 500 ? 900 : 844 }); await page.waitForTimeout(250) }
  const tenang = async () => {
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(400)
  }
  const foto = async (nama, { penuh = false, atas = false } = {}) => {
    if (atas) await page.evaluate(() => scrollTo(0, 0))
    await page.evaluate(() => document.activeElement?.blur?.())
    await page.waitForTimeout(300)
    await page.screenshot({ path: join(output, `${nama}.png`), fullPage: penuh })
    potret.push(`${nama}.png`)
  }
  const meluber = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  const tinggiHalaman = () => page.evaluate(() => document.documentElement.scrollHeight)
  const tombol = nama => page.getByRole('button', { name: nama, exact: true })
  const baris = () => page.locator('[data-uji="domi-baris"]')
  const sel = s => page.locator(`[data-uji="${s}"]`)
  /** Keadaan gulir satu bidang: puncak, tinggi tampak, tinggi isi. */
  const gulir = s => sel(s).evaluate(el => ({ atas: Math.round(el.scrollTop), tampak: el.clientHeight, isi: el.scrollHeight }))
  const diBawah = g => g.atas + g.tampak >= g.isi - 4

  const bukaTab = async (query = '') => {
    await page.goto(`${APP}${JALUR}${query}`, { waitUntil: 'domcontentloaded' })
    await page.locator('h1').first().waitFor({ timeout: 60000 })
    await tenang()
    const buka = query.includes('lang=en') ? 'Open Domi conversations' : 'Buka percakapan Domi'
    await tombol(buka).click()
    await page.getByText(JUDUL_PANJANG, { exact: false }).first().waitFor({ timeout: 15000 })
    await tenang()
  }
  const muatSemuaDaftar = async (label = 'Muat percakapan lain') => {
    for (const n of [40, 48]) {
      await tombol(label).click()
      await page.waitForFunction(n => document.body.innerText.includes(`${n} / 48`) || document.body.innerText.includes(`${n} dari 48`) || document.body.innerText.includes(`${n} of 48`), n, { timeout: 15000 })
      await page.waitForTimeout(250)
    }
  }
  const bukaPanjang = async () => {
    await page.getByText(JUDUL_PANJANG, { exact: false }).first().click()
    await page.getByText('Muat pesan lebih lama', { exact: true }).waitFor({ timeout: 15000 })
    await tenang()
  }

  // ── 1. Desktop 1440, terang dan gelap ─────────────────────────────────
  for (const t of ['terang', 'gelap']) {
    await tema(t)
    await lebar(1440)
    await bukaTab()
    const tinggiAwal = await tinggiHalaman()
    await muatSemuaDaftar()
    const tinggiPenuh = await tinggiHalaman()
    hasil[`tinggiHalaman1440_${t}`] = { awal: tinggiAwal, sesudahMuat48: tinggiPenuh }
    await bukaPanjang()
    hasil[`tinggiHalamanIsi1440_${t}`] = await tinggiHalaman()
    // Diukur sebelum potret penuh (potret penuh menggulir jendela ke atas).
    const ukurBingkai = () => sel('domi-bingkai').evaluate(el => { const k = el.getBoundingClientRect(); return { atas: Math.round(k.top), bawah: Math.round(k.bottom), tinggi: Math.round(k.height), layar: innerHeight, bilah: Math.round(document.querySelector('.ca-console-topbar')?.getBoundingClientRect().bottom ?? 0), gulirJendela: Math.round(scrollY) } })
    const bingkai = SEBELUM ? null : await ukurBingkai()
    await foto(`${FASE}-${t}-1440-penuh`, { penuh: true, atas: true })
    if (SEBELUM) {
      // Gulir jendela sampai kepala isi tepat di bawah bilah atas, seperti orang membaca.
      await page.evaluate(() => { const h = document.querySelector('.domi-chat header'); if (h) scrollTo(0, h.getBoundingClientRect().top + scrollY - 88) })
      await foto(`${FASE}-${t}-1440-layar`)
      continue
    }
    // Halaman tidak memanjang karena daftar atau isi percakapan.
    if (tinggiPenuh !== tinggiAwal) gagal(`${t}: tinggi halaman berubah ${tinggiAwal} ke ${tinggiPenuh} sesudah daftar dimuat 48`)
    if (hasil[`tinggiHalamanIsi1440_${t}`] !== tinggiAwal) gagal(`${t}: tinggi halaman berubah sesudah percakapan dibuka`)
    if (await meluber()) gagal(`${t}: halaman meluber ke samping di 1440`)
    // Bingkai muat di layar di bawah bilah atas, sesudah digulir masuk sendiri.
    hasil[`bingkai1440_${t}`] = bingkai
    if (bingkai.atas < bingkai.bilah || bingkai.bawah > bingkai.layar) gagal(`${t}: bingkai tidak utuh di layar ${JSON.stringify(bingkai)}`)
    if (Math.abs(bingkai.atas - (bingkai.bilah + 16)) > 2 || Math.abs(bingkai.bawah - (bingkai.layar - 16)) > 2) gagal(`${t}: bingkai tidak setinggi layar tersisa ${JSON.stringify(bingkai)}`)
    // Potret penuh tadi menggulir jendela ke atas: kembalikan seperti sesudah percakapan dipilih.
    await page.evaluate(y => scrollTo(0, y), bingkai.gulirJendela)
    const daftar = await gulir('domi-daftar')
    const isi = await gulir('domi-isi')
    hasil[`gulir1440_${t}`] = { daftar, isi }
    if (daftar.isi <= daftar.tampak) gagal(`${t}: daftar tidak bergulir sendiri ${JSON.stringify(daftar)}`)
    if (isi.isi <= isi.tampak) gagal(`${t}: isi tidak bergulir sendiri ${JSON.stringify(isi)}`)
    // Dibuka di pesan terbaru.
    if (!diBawah(isi)) gagal(`${t}: percakapan tidak dibuka di pesan terbaru ${JSON.stringify(isi)}`)
    if (!(await page.locator('[data-uji="domi-baris"][aria-current="true"]').count())) gagal(`${t}: percakapan terpilih tidak tersorot`)
    await foto(`${FASE}-${t}-1440-layar`)
    // Kepala isi tetap di tempat saat isi digulir.
    const kepalaSebelum = await sel('domi-kepala').evaluate(el => Math.round(el.getBoundingClientRect().top))
    if (!(await sel('domi-ke-awal').isVisible())) gagal(`${t}: tombol ke awal tidak tampil di pesan terbaru`)
    if (await sel('domi-ke-akhir').isVisible()) gagal(`${t}: tombol ke pesan terbaru tampil padahal sudah di bawah`)
    await sel('domi-ke-awal').click()
    await page.waitForTimeout(500)
    const diAwal = await gulir('domi-isi')
    if (diAwal.atas > 4) gagal(`${t}: ke awal tidak sampai atas ${JSON.stringify(diAwal)}`)
    const kepalaSesudah = await sel('domi-kepala').evaluate(el => Math.round(el.getBoundingClientRect().top))
    if (kepalaSebelum !== kepalaSesudah) gagal(`${t}: kepala isi ikut bergeser ${kepalaSebelum} ke ${kepalaSesudah}`)
    if (!(await sel('domi-ke-akhir').isVisible())) gagal(`${t}: tombol ke pesan terbaru tidak tampil di awal`)
    await foto(`${FASE}-${t}-1440-awal`)
    // Muat pesan lebih lama: yang sedang dibaca tidak melompat.
    const jangkar = await page.locator('[data-uji="domi-isi"] [data-pesan]').first().evaluate(el => ({ id: el.dataset.pesan, atas: Math.round(el.getBoundingClientRect().top) }))
    const pesanSebelum = hitung('admin_ai_pesan_daftar')
    await tombol('Muat pesan lebih lama').click()
    await page.waitForFunction(() => document.querySelectorAll('[data-uji="domi-isi"] [data-pesan]').length === 60, null, { timeout: 15000 })
    await page.waitForTimeout(400)
    const jangkarSesudah = await page.locator(`[data-uji="domi-isi"] [data-pesan="${jangkar.id}"]`).evaluate(el => Math.round(el.getBoundingClientRect().top))
    if (Math.abs(jangkarSesudah - jangkar.atas) > 4) gagal(`${t}: pesan yang dibaca melompat ${jangkar.atas} ke ${jangkarSesudah} sesudah muat lebih lama`)
    if (hitung('admin_ai_pesan_daftar') !== pesanSebelum + 1) gagal(`${t}: muat lebih lama tidak tepat satu panggilan`)
    await sel('domi-ke-akhir').click()
    await page.waitForTimeout(500)
    if (!diBawah(await gulir('domi-isi'))) gagal(`${t}: ke pesan terbaru tidak sampai bawah`)
    // Info admin dilipat dan dibuka lagi.
    const info = () => page.locator('[data-uji="domi-isi"] [data-uji="domi-info"]')
    if (!(await info().count())) gagal(`${t}: info admin tidak tampil`)
    const satuBaris = await info().first().evaluate(el => el.getClientRects().length <= 1 && el.getBoundingClientRect().height < 22)
    if (!satuBaris) gagal(`${t}: info admin lebih dari satu baris`)
    await sel('domi-info-lipat').click()
    if (await info().count()) gagal(`${t}: info admin masih tampil sesudah dilipat`)
    await foto(`${FASE}-${t}-1440-info-dilipat`)
    await sel('domi-info-lipat').click()
    if (!(await info().count())) gagal(`${t}: info admin tidak kembali`)
    // Pencarian judul hanya di daftar yang sudah dimuat, tanpa panggilan server.
    const rpcSebelumCari = seen.length
    await sel('domi-cari').fill('listrik')
    await page.waitForTimeout(300)
    const judulCocok = await baris().allInnerTexts()
    if (judulCocok.length !== 3 || judulCocok.some(x => !x.toLowerCase().includes('listrik'))) gagal(`${t}: hasil cari salah ${JSON.stringify(judulCocok)}`)
    await foto(`${FASE}-${t}-1440-cari`)
    await sel('domi-cari').fill('tidak ada judul seperti ini')
    if (await baris().count()) gagal(`${t}: cari tanpa hasil masih menampilkan baris`)
    if (!(await sel('domi-cari-kosong').isVisible())) gagal(`${t}: keterangan cari kosong tidak tampil`)
    await sel('domi-cari').press('Escape')
    if ((await sel('domi-cari').inputValue()) !== '' || (await baris().count()) !== 48) gagal(`${t}: Escape tidak mengosongkan pencarian`)
    if (seen.length !== rpcSebelumCari) gagal(`${t}: pencarian memanggil server ${JSON.stringify(seen.slice(rpcSebelumCari).map(x => x.nama))}`)
    // Panah atas/bawah memindah sorotan tanpa memanggil server; Enter membuka.
    await sel('domi-cari').focus()
    await page.keyboard.press('ArrowDown')
    const fokus = () => page.evaluate(() => document.activeElement?.closest('[data-uji="domi-baris"]')?.dataset.id ?? null)
    const urutan = PERCAKAPAN_PANJANG.map(x => x.id)
    if ((await fokus()) !== urutan[0]) gagal(`${t}: panah bawah dari pencarian tidak ke baris terpilih/pertama (${await fokus()})`)
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    if ((await fokus()) !== urutan[2]) gagal(`${t}: panah bawah tidak ke baris ketiga`)
    await page.keyboard.press('ArrowUp')
    if ((await fokus()) !== urutan[1]) gagal(`${t}: panah atas tidak ke baris kedua`)
    await page.keyboard.press('End')
    if ((await fokus()) !== urutan[47]) gagal(`${t}: End tidak ke baris terakhir`)
    const tampakTerakhir = await page.locator(`[data-uji="domi-baris"][data-id="${urutan[47]}"]`).evaluate((el) => {
      const w = el.closest('[data-uji="domi-daftar"]').getBoundingClientRect()
      const k = el.getBoundingClientRect()
      return k.top >= w.top - 1 && k.bottom <= w.bottom + 1
    })
    if (!tampakTerakhir) gagal(`${t}: baris yang disorot tidak digulir masuk daftar`)
    await page.keyboard.press('Home')
    await page.keyboard.press('ArrowDown')
    if (seen.length !== rpcSebelumCari) gagal(`${t}: panah memanggil server`)
    await page.keyboard.press('Enter')
    await page.locator(`[data-uji="domi-kepala"]`).getByText(PERCAKAPAN_PANJANG[1].judul, { exact: true }).waitFor({ timeout: 15000 })
    await tenang()
    const sesudahEnter = seen.slice(rpcSebelumCari).map(x => x.nama)
    if (sesudahEnter.join() !== 'admin_ai_pesan_daftar') gagal(`${t}: Enter memanggil ${JSON.stringify(sesudahEnter)}`)
    if ((await page.locator('[data-uji="domi-baris"][aria-current="true"]').getAttribute('data-id')) !== urutan[1]) gagal(`${t}: sorotan tidak pindah ke percakapan yang dibuka`)
    await foto(`${FASE}-${t}-1440-keyboard`)
  }

  // ── 1b. Segarkan: tombol, jendela kembali dilihat, pesan baru, anak habis ──
  if (!SEBELUM) {
    await tema('terang')
    await lebar(1440)
    await bukaTab()
    await muatSemuaDaftar()
    await bukaPanjang()
    const dimuat = (await sel('domi-dimuat').innerText()).trim()
    if (!/^Dimuat \d{2}[.:]\d{2}$/.test(dimuat)) gagal(`Label waktu muat salah: "${dimuat}"`)
    const lihatLagi = () => page.evaluate(() => { dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')) })
    let awal = seen.length
    await lihatLagi()
    await page.waitForTimeout(800)
    if (seen.length !== awal) gagal(`Jendela dilihat lagi sebelum 30 detik memanggil ${JSON.stringify(seen.slice(awal).map(x => x.nama))}`)
    // Lewat 30 detik, dan ada dua pesan baru di percakapan yang sedang dibuka.
    await page.waitForTimeout(31_000)
    mode.domiBaru = true
    awal = seen.length
    await lihatLagi()
    await sel('domi-pesan-baru').waitFor({ timeout: 15000 })
    await page.waitForTimeout(600)
    const otomatis = seen.slice(awal).map(x => x.nama)
    hasil.segarOtomatis = otomatis
    if (otomatis.join() !== 'admin_ai_percakapan_daftar') gagal(`Segar otomatis memanggil ${JSON.stringify(otomatis)}, mestinya daftar saja`)
    if ((await baris().count()) !== 48) gagal(`Segar otomatis mengubah jumlah baris jadi ${await baris().count()}`)
    if (!(await page.locator(`[data-uji="domi-baris"][data-id="${PERCAKAPAN_PANJANG[0].id}"]`).innerText()).includes('62 pesan')) gagal('Baris percakapan tidak diperbarui ke 62 pesan')
    if ((await page.locator('[data-uji="domi-isi"] [data-pesan]').count()) !== 30) gagal('Segar otomatis mengubah isi percakapan')
    await foto(`${FASE}-terang-1440-pesan-baru`)
    awal = seen.length
    await lihatLagi()
    await page.waitForTimeout(800)
    if (seen.length !== awal) gagal('Segar otomatis kedua dalam 30 detik tetap memanggil server')
    // Tawaran pesan baru: satu panggilan isi, tetap di pesan terbaru.
    await sel('domi-pesan-baru').getByRole('button').click()
    await page.waitForFunction(() => document.querySelectorAll('[data-uji="domi-isi"] [data-pesan]').length === 32, null, { timeout: 15000 })
    await page.waitForTimeout(400)
    const tawaran = seen.slice(awal).map(x => x.nama)
    if (tawaran.join() !== 'admin_ai_pesan_daftar') gagal(`Tampilkan pesan baru memanggil ${JSON.stringify(tawaran)}`)
    if (!diBawah(await gulir('domi-isi'))) gagal('Sesudah pesan baru dimuat, isi tidak di pesan terbaru')
    if (await sel('domi-pesan-baru').count()) gagal('Tawaran pesan baru masih tampil sesudah dimuat')
    // Tombol Segarkan: daftar lalu isi.
    awal = seen.length
    await sel('domi-segarkan').click()
    await page.waitForFunction(n => document.querySelector('[data-uji="domi-segarkan"]') && !document.querySelector('[data-uji="domi-segarkan"]').disabled, null, { timeout: 15000 })
    await page.waitForTimeout(600)
    const manual = seen.slice(awal).map(x => x.nama)
    hasil.segarManual = manual
    if (manual.join() !== 'admin_ai_percakapan_daftar,admin_ai_pesan_daftar') gagal(`Segarkan memanggil ${JSON.stringify(manual)}`)
    if ((await page.locator('[data-uji="domi-isi"] [data-pesan]').count()) !== 32) gagal('Segarkan menggandakan atau membuang pesan')
    await foto(`${FASE}-terang-1440-segar`)
    // Anak kasus habis di server: ajakan membuka lagi, bukan galat mentah, dan tidak ada kasus anak baru.
    anakHabis = true
    awal = seen.length
    await sel('domi-segarkan').click()
    await sel('domi-habis').waitFor({ timeout: 15000 })
    await page.waitForTimeout(600)
    const habis = seen.slice(awal).map(x => x.nama)
    hasil.anakHabis = habis
    if (habis.includes('admin_kasus_investigasi')) gagal('Segarkan membuka kasus anak baru sendiri')
    if (await page.locator('.ca-console-main [role="alert"]').count()) gagal('Anak habis berujung galat merah')
    if (!(await sel('domi-habis').innerText()).includes('Jendela 10 menit')) gagal('Ajakan membuka lagi tidak tampil')
    await foto(`${FASE}-terang-1440-kasus-habis`)
    anakHabis = false
    awal = seen.length
    await tombol('Buka lagi').click()
    await page.getByText(JUDUL_PANJANG, { exact: false }).first().waitFor({ timeout: 15000 })
    const bukaLagi = seen.slice(awal).map(x => x.nama)
    if (bukaLagi.join() !== 'admin_kasus_investigasi,admin_ai_percakapan_daftar') gagal(`Buka lagi memanggil ${JSON.stringify(bukaLagi)}`)
    mode.domiBaru = false
    hasil.segarkan = 'lulus'
  }

  // ── 2. Ponsel 390: daftar dulu, ketuk membuka isi, tombol kembali ─────
  for (const t of ['terang', 'gelap']) {
    await tema(t)
    await lebar(390)
    await bukaTab()
    await foto(`${FASE}-${t}-390-daftar-penuh`, { penuh: true, atas: true })
    if (!SEBELUM) {
      const tinggiAwal = await tinggiHalaman()
      await muatSemuaDaftar()
      if ((await tinggiHalaman()) !== tinggiAwal) gagal(`${t} 390: tinggi halaman berubah sesudah daftar dimuat`)
      if (await meluber()) gagal(`${t} 390: halaman meluber ke samping`)
      await foto(`${FASE}-${t}-390-daftar`)
    }
    await bukaPanjang()
    if (SEBELUM) {
      await foto(`${FASE}-${t}-390-isi-penuh`, { penuh: true, atas: true })
      await page.evaluate(() => { const h = document.querySelector('.domi-chat header'); if (h) scrollTo(0, h.getBoundingClientRect().top + scrollY - 80) })
      await foto(`${FASE}-${t}-390-isi`)
      continue
    }
    if (await sel('domi-cari').isVisible()) gagal(`${t} 390: daftar masih tampil saat isi dibuka`)
    const kembali = sel('domi-kembali')
    if (!(await kembali.isVisible())) gagal(`${t} 390: tombol kembali tidak tampil`)
    const k = await kembali.evaluate(el => { const r = el.getBoundingClientRect(); return { atas: Math.round(r.top), bawah: Math.round(r.bottom), lebar: Math.round(r.width) } })
    if (k.atas < 72 || k.bawah > 844 || k.lebar < 44) gagal(`${t} 390: tombol kembali tidak di layar atau terlalu kecil ${JSON.stringify(k)}`)
    const isi = await gulir('domi-isi')
    if (isi.isi <= isi.tampak || !diBawah(isi)) gagal(`${t} 390: isi tidak bergulir sendiri atau tidak di pesan terbaru ${JSON.stringify(isi)}`)
    if (await meluber()) gagal(`${t} 390: isi meluber ke samping`)
    await foto(`${FASE}-${t}-390-isi`)
    await sel('domi-ke-awal').click()
    await page.waitForTimeout(400)
    await foto(`${FASE}-${t}-390-isi-awal`)
    await kembali.click()
    await sel('domi-cari').waitFor()
    if (await sel('domi-isi').isVisible()) gagal(`${t} 390: isi masih tampil sesudah kembali`)
  }

  // ── 3. Bahasa Inggris ─────────────────────────────────────────────────
  if (!SEBELUM) {
    await tema('terang')
    await lebar(1440)
    await bukaTab('?lang=en')
    await muatSemuaDaftar('Load more conversations')
    if ((await sel('domi-cari').getAttribute('placeholder')) !== 'Search conversation titles') gagal('EN: placeholder cari tidak diterjemahkan')
    await page.getByText(JUDUL_PANJANG, { exact: false }).first().click()
    await page.getByText('Load older messages', { exact: true }).waitFor({ timeout: 15000 })
    await tenang()
    if (!(await sel('domi-ke-awal').getAttribute('aria-label'))?.startsWith('To the start')) gagal('EN: tombol ke awal tidak diterjemahkan')
    await foto(`${FASE}-en-terang-1440`)
    hasil.en = 'lulus'
  }

  hasil.rpc = { daftar: hitung('admin_ai_percakapan_daftar'), pesan: hitung('admin_ai_pesan_daftar'), foto: seen.filter(x => x.nama === 'admin-lampiran').length }
  if (galat.length) gagal(`Galat browser: ${galat.join('; ')}`)
  console.log(JSON.stringify({ fase: FASE, ...hasil, potret, takDikenal: [...server.takDikenal] }, null, 1))
} finally {
  if (browser) try { const s = await browser.newBrowserCDPSession(); await s.send('Browser.close') } catch { /* Chrome sudah tertutup. */ }
  chrome.kill()
  await rm(dir, { recursive: true, force: true }).catch(() => {})
}
