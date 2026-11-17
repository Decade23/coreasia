// Uji tampilan lencana Kasir di Ruang 360 › Anggota dan Pengguna 360 › Ruang,
// dengan data sintetis (scripts/data-sintetis-console.mjs; admin_ruang_360 dan
// admin_pengguna_360 ditimpa per keadaan). Tiga keadaan server:
//   - baru: kunci kasir dikirim, dua anggota Kasir, dua undangan Kasir
//     (satu menunggu, satu sudah diterima), satu ruang dalam lingkup
//     tempat subjek menjadi Kasir;
//   - nol: kunci kasir dikirim, semuanya false;
//   - lama: kunci kasir belum dikirim (server sebelum migrasinya).
// Keadaan nol dan lama harus menghasilkan isi halaman yang SAMA PERSIS (tanpa
// lencana). Terang dan gelap, lebar 1440 dan 390, plus satu potret bahasa
// Inggris. Chrome headless lewat CDP, tanpa jendela.
//
// Jalankan server lokal TANPA .env (tidak ada kunci sungguhan):
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_URL=http://127.0.0.1:4398 \
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY=anon-sintetis \
//   npx nuxi dev --port 4399 --host 127.0.0.1
// lalu:
//   PLAYWRIGHT_CORE_PATH=<playwright-core/index.mjs> CF_QA_ARTIFACTS=<folder> \
//   node scripts/uji-console-kasir-headless.mjs
// CF_QA_APP dan CF_QA_SUPABASE mengganti alamat bawaan di atas. CF_QA_TMP boleh
// menunjuk folder profil Chrome sementara (bawaan tmpdir). CF_QA_HANYA=lama
// hanya memotret keadaan lama (untuk dibandingkan dengan server cabang lain).
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buatServer, uuid, U, W, SAAT } from './data-sintetis-console.mjs'

const pwPath = process.env.PLAYWRIGHT_CORE_PATH
const { chromium } = await (pwPath ? import(pathToFileURL(pwPath).href) : import('playwright-core'))
const output = process.env.CF_QA_ARTIFACTS || join(tmpdir(), 'cf-kasir-potret')
const APP = process.env.CF_QA_APP || 'http://127.0.0.1:4399'
const SUPABASE = process.env.CF_QA_SUPABASE || 'http://127.0.0.1:4398'
const HANYA = process.env.CF_QA_HANYA || ''
const PORT_BOLEH = [new URL(APP).port, new URL(SUPABASE).port]
await mkdir(output, { recursive: true })
// Port CDP acak dari sistem, di atas 20000.
let cdpPort = 0
while (cdpPort <= 20000) {
  const s = createServer()
  await new Promise(r => s.listen(0, '127.0.0.1', r))
  cdpPort = s.address().port
  await new Promise(r => s.close(r))
}
const dir = await mkdtemp(join(process.env.CF_QA_TMP || tmpdir(), 'cf-kasir-'))
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--user-data-dir=${dir}`, `--remote-debugging-port=${cdpPort}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

// ── Keadaan server (karangan) ────────────────────────────────────────────
/** Anggota ke-n (urutan jawaban sintetis) yang bertanda Kasir: dua member. */
const ANGGOTA_KASIR = new Set([1, 7])
/** Undangan ke-n yang Kasir: 0 menunggu (aktif), 1 sudah diterima. Keduanya ber-peran member. */
const UNDANGAN_KASIR = new Set([0, 1])
/** Ruang subjek dalam lingkup yang ia jadi Kasir di sana (ruang keluarga, perannya dijadikan member). */
const RUANG_KASIR = uuid(100)

const ubahRuang360 = (j, keadaan) => ({
  ...j,
  anggota: j.anggota.map((a, i) => (keadaan === 'lama' ? a : { ...a, kasir: keadaan === 'baru' && ANGGOTA_KASIR.has(i) })),
  undangan: j.undangan.map((u, i) => {
    const peran = UNDANGAN_KASIR.has(i) ? 'member' : u.peran
    return keadaan === 'lama' ? { ...u, peran } : { ...u, peran, kasir: keadaan === 'baru' && UNDANGAN_KASIR.has(i) }
  }),
})
const ubahPengguna360 = (j, keadaan) => ({
  ...j,
  ruang: j.ruang.map((r) => {
    const peran = r.workspace_id === RUANG_KASIR ? 'member' : r.peran
    // Server tidak pernah mengirim kasir di ruang luar lingkup.
    if (keadaan === 'lama' || !r.dalam_lingkup) return { ...r, peran }
    return { ...r, peran, kasir: keadaan === 'baru' && r.workspace_id === RUANG_KASIR }
  }),
})
/** Jumlah lencana yang diharapkan per halaman di keadaan baru. */
const HARAP = {
  anggota: { 'anggota-kasir': ANGGOTA_KASIR.size, 'undangan-kasir': UNDANGAN_KASIR.size },
  ruang: { 'ruang-kasir': 1 },
}
const HALAMAN = [
  { nama: 'anggota', jalur: `/console/cashflow/ruang/${W}/anggota`, harus: 'kas***@contoh.invalid' },
  { nama: 'ruang', jalur: `/console/cashflow/pengguna/${U}/ruang`, harus: 'Keluarga Besar Wiryaatmadja' },
]
/** Jalur kamus dan kode yang tidak boleh terbaca di layar. */
const MENTAH = /r360\.kasir|ruangTab\.|\bundefined\b|\bNaN\b|\[object/

let browser
let page
const hasil = { potret: [], lencana: {}, samaNolLama: {} }
try {
  for (let i = 0; i < 100; i++) { try { const r = await fetch(`http://127.0.0.1:${cdpPort}/json/version`); if (r.ok) break } catch { /* Chrome belum siap. */ } await new Promise(r => setTimeout(r, 100)) }
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`)
  const ctx = browser.contexts()[0]
  page = ctx.pages()[0]
  const masa = Math.floor(SAAT / 1000) + 86_400
  const jwt = ['eyJhbGciOiJub25lIn0', Buffer.from(JSON.stringify({ sub: uuid(900), role: 'authenticated', exp: masa })).toString('base64url'), 'test'].join('.')
  const session = { access_token: jwt, refresh_token: 'test-refresh', expires_at: masa, expires_in: 86_400, token_type: 'bearer', user: { id: uuid(900), aud: 'authenticated', role: 'authenticated', email: 'admin@contoh.invalid' } }
  const izin = ['cashflow:view', 'cashflow:pii', 'cashflow:investigasi', 'cashflow:tindak', 'cashflow:ekspor']
  await ctx.addInitScript(({ session, izin, saat }) => {
    if (location.protocol !== 'http:') return
    // Jam peramban dibekukan supaya tanggal dan hitung mundur kasus sama di setiap putaran.
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
    sessionStorage.setItem('cf_izin', JSON.stringify(izin))
    addEventListener('DOMContentLoaded', () => {
      const gaya = document.createElement('style')
      gaya.textContent = '[id^="nuxt-devtools"]{display:none!important}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
      document.head.append(gaya)
    })
  }, { session, izin, saat: SAAT })
  // Tidak ada akses ke layanan luar atau gateway sungguhan.
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

  const server = buatServer()
  const mode = { kosong: false, izin: true, belumAda: null }
  let keadaan = 'baru'
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  const cors = { 'access-control-allow-origin': '*' }
  await page.route(`${SUPABASE}/**`, async (r) => {
    const req = r.request()
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' } })
    const nama = new URL(req.url()).pathname.split('/').pop()
    let p = {}
    try { p = req.postDataJSON() || {} } catch { /* Badan bukan JSON. */ }
    const j = server.jawab(nama, p, mode)
    if (nama === 'admin_ruang_360') j.json = ubahRuang360(j.json, keadaan)
    if (nama === 'admin_pengguna_360') j.json = ubahPengguna360(j.json, keadaan)
    return r.fulfill({ status: j.status ?? 200, json: j.json, headers: cors })
  })

  const tema = async (t, bahasa = 'id') => {
    await ctx.clearCookies()
    await ctx.addCookies([
      { name: 'coreasia-theme', value: t === 'terang' ? 'light' : 'dark', domain: '127.0.0.1', path: '/' },
      { name: 'coreasia-locale', value: bahasa, domain: '127.0.0.1', path: '/' },
    ])
  }
  const lebar = async (w) => { await page.setViewportSize({ width: w, height: w > 500 ? 900 : 844 }); await page.waitForTimeout(250) }
  const meluber = () => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  const gagal = (pesan) => { throw new Error(pesan) }
  const buka = async (h) => {
    await page.goto(`${APP}${h.jalur}`, { waitUntil: 'domcontentloaded' })
    await page.getByText(h.harus, { exact: false }).first().waitFor({ timeout: 60000 })
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(400)
  }
  const potret = async (nama) => {
    await page.evaluate(() => { scrollTo(0, 0); document.activeElement?.blur?.() })
    await page.waitForTimeout(300)
    await page.screenshot({ path: join(output, `${nama}.png`), fullPage: true })
    hasil.potret.push(`${nama}.png`)
  }
  /** Isi halaman tanpa komentar Vue, untuk membandingkan keadaan nol dan lama. */
  const isi = () => page.evaluate(() => {
    const m = document.querySelector('.ca-console-main')
    if (!m) return ''
    const c = m.cloneNode(true)
    const w = document.createTreeWalker(c, NodeFilter.SHOW_COMMENT)
    const buang = []
    while (w.nextNode()) buang.push(w.currentNode)
    for (const n of buang) n.remove()
    return c.innerHTML
  })
  const hitung = async () => Object.fromEntries(await Promise.all(
    ['anggota-kasir', 'undangan-kasir', 'ruang-kasir'].map(async k => [k, await page.locator(`[data-uji="${k}"]`).count()]),
  ))
  const bersih = async (di) => {
    const teks = await page.evaluate(() => document.querySelector('.ca-console-main')?.innerText ?? '')
    const m = teks.match(MENTAH)
    if (m) gagal(`${di}: kode mentah atau teks rusak terbaca: "${m[0]}"`)
  }

  const daftarKeadaan = HANYA ? [HANYA] : ['baru', 'nol', 'lama']
  const simpanIsi = {}
  for (const k of daftarKeadaan) {
    keadaan = k
    for (const t of ['terang', 'gelap']) {
      await tema(t)
      for (const w of [1440, 390]) {
        await lebar(w)
        for (const h of HALAMAN) {
          const di = `${h.nama} ${k} ${t} ${w}`
          await buka(h)
          if (await page.getByRole('alert').count()) gagal(`${di}: ada galat merah`)
          const n = await hitung()
          const harap = k === 'baru' ? { 'anggota-kasir': 0, 'undangan-kasir': 0, 'ruang-kasir': 0, ...HARAP[h.nama] } : { 'anggota-kasir': 0, 'undangan-kasir': 0, 'ruang-kasir': 0 }
          if (JSON.stringify(n) !== JSON.stringify(harap)) gagal(`${di}: lencana ${JSON.stringify(n)}, harap ${JSON.stringify(harap)}`)
          if (k === 'baru') {
            for (const l of await page.locator('[data-uji$="-kasir"]').all()) {
              const teks = (await l.innerText()).trim()
              if (teks !== 'Kasir') gagal(`${di}: teks lencana "${teks}"`)
              if (!(await l.getAttribute('title'))?.includes('Kasir')) gagal(`${di}: lencana tanpa keterangan`)
              const kotak = await l.boundingBox()
              if (!kotak || kotak.x < 0 || kotak.x + kotak.width > w + 1) gagal(`${di}: lencana melewati tepi (${JSON.stringify(kotak)})`)
            }
            hasil.lencana[di] = n
          }
          await bersih(di)
          if (await meluber()) gagal(`${di}: meluber`)
          if (k !== 'baru') simpanIsi[`${h.nama}|${t}|${w}|${k}`] = await isi()
          await potret(`${h.nama}-${k}-${t}-${w}`)
        }
      }
    }
  }
  // Nol dan lama: isi halaman sama persis.
  if (!HANYA) {
    for (const kunci of Object.keys(simpanIsi).filter(x => x.endsWith('|nol'))) {
      const lama = kunci.replace(/\|nol$/, '|lama')
      const sama = simpanIsi[kunci] === simpanIsi[lama]
      hasil.samaNolLama[kunci.replace(/\|nol$/, '')] = sama
      if (!sama) gagal(`${kunci}: isi halaman keadaan nol berbeda dari keadaan lama`)
    }
  }
  // Bahasa Inggris: lencana Cashier.
  if (!HANYA) {
    keadaan = 'baru'
    await tema('terang', 'en')
    await lebar(1440)
    for (const h of HALAMAN) {
      await buka({ ...h, harus: h.harus })
      const teks = await page.locator('[data-uji$="-kasir"]').allInnerTexts()
      if (!teks.length || teks.some(x => x.trim() !== 'Cashier')) gagal(`${h.nama} en: lencana ${JSON.stringify(teks)}`)
      await bersih(`${h.nama} en`)
      await potret(`${h.nama}-baru-terang-1440-en`)
    }
  }
  if (errors.length) gagal(`Galat browser: ${errors.join('; ')}`)
  for (const [k, v] of Object.entries(simpanIsi)) await writeFile(join(output, `isi-${k.replaceAll('|', '-')}.html`), v)
  console.log(JSON.stringify({ ...hasil, takDikenal: [...server.takDikenal], errors }))
} catch (e) {
  if (page) await page.screenshot({ path: join(output, 'galat.png'), fullPage: true }).catch(() => {})
  throw e
} finally {
  if (browser) try { const s = await browser.newBrowserCDPSession(); await s.send('Browser.close') } catch { /* Chrome sudah tertutup. */ }
  chrome.kill()
  await rm(dir, { recursive: true, force: true }).catch(() => {})
}
