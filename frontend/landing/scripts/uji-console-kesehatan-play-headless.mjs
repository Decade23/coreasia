// Uji tampilan baris pembelian Google Play yang menggantung di Kesehatan, dengan
// data sintetis (scripts/data-sintetis-console.mjs, admin_kesehatan ditimpa per
// keadaan). Empat keadaan server:
//   - menunggu: dua pembelian, yang paling lama 25 menit (nada tenang);
//   - lama: tiga pembelian, yang paling lama 3 jam 5 menit (bidang emas lembut);
//   - kosong: kunci play_proses ada, nol yang menunggu (kalimat kecil);
//   - server-lama: kunci play_proses belum dikirim (tidak tampil, tanpa galat).
// Terang dan gelap, lebar 1440 dan 390. Juga: Kesehatan tidak memanggil daftar
// pembelian (yang mencatat audit), dan tautannya membuka Pembelian saringan
// Sedang diproses. Chrome headless lewat CDP, tanpa jendela.
//
// Jalankan server lokal TANPA .env (tidak ada kunci sungguhan):
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_URL=http://127.0.0.1:4398 \
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY=anon-sintetis \
//   npx nuxi dev --port 4399 --host 127.0.0.1
// lalu:
//   PLAYWRIGHT_CORE_PATH=<playwright-core/index.mjs> CF_QA_ARTIFACTS=<folder> \
//   node scripts/uji-console-kesehatan-play-headless.mjs
// CF_QA_APP dan CF_QA_SUPABASE mengganti alamat bawaan di atas. CF_QA_TMP boleh
// menunjuk folder profil Chrome sementara (bawaan tmpdir).
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buatServer, uuid } from './data-sintetis-console.mjs'

const pwPath = process.env.PLAYWRIGHT_CORE_PATH
const { chromium } = await (pwPath ? import(pathToFileURL(pwPath).href) : import('playwright-core'))
const output = process.env.CF_QA_ARTIFACTS || join(tmpdir(), 'cf-kesehatan-play-potret')
const APP = process.env.CF_QA_APP || 'http://127.0.0.1:4399'
const SUPABASE = process.env.CF_QA_SUPABASE || 'http://127.0.0.1:4398'
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
const dir = await mkdtemp(join(process.env.CF_QA_TMP || tmpdir(), 'cf-kesehatan-play-'))
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--user-data-dir=${dir}`, `--remote-debugging-port=${cdpPort}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

// ── Data sintetis (karangan) ─────────────────────────────────────────────
const PLAY = {
  menunggu: { diproses: 2, tertunda: 2, gagal_sementara: 0, ditolak: 1, tertua_menit: 25 },
  lama: { diproses: 3, tertunda: 1, gagal_sementara: 2, ditolak: 4, tertua_menit: 185 },
  kosong: { diproses: 0, tertunda: 0, gagal_sementara: 0, ditolak: 2, tertua_menit: null },
  'server-lama': undefined,
}
const KALIMAT = {
  menunggu: '2 pembelian Google Play sedang diproses, yang paling lama 25 mnt.',
  lama: '3 pembelian Google Play sedang diproses, yang paling lama 3 jam 5 mnt.',
  kosong: 'Tidak ada pembelian Google Play yang menggantung.',
}
/** Kode server dan jalur kamus yang tidak boleh terbaca di layar. */
const MENTAH = /\b(?:play_proses|tertua_menit|gagal_sementara)\b|kesehatan\.play|pembelian\.\w|undefined|\bNaN\b/

let browser
let page
const hasil = {}
try {
  for (let i = 0; i < 100; i++) { try { const r = await fetch(`http://127.0.0.1:${cdpPort}/json/version`); if (r.ok) break } catch { /* Chrome belum siap. */ } await new Promise(r => setTimeout(r, 100)) }
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`)
  const ctx = browser.contexts()[0]
  page = ctx.pages()[0]
  const jwt = ['eyJhbGciOiJub25lIn0', Buffer.from(JSON.stringify({ sub: uuid(1), role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'test'].join('.')
  const session = { access_token: jwt, refresh_token: 'test-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user: { id: uuid(1), aud: 'authenticated', role: 'authenticated', email: 'admin@contoh.invalid' } }
  // Sesi lihat saja: Kesehatan tidak butuh izin data pribadi.
  const izin = ['cashflow:view']
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
  // Login console tanpa TOTP: sesi lihat saja tidak meminta sesi baru ke server.
  await page.route('**/api/gw/admin/auth/me', r => r.fulfill({ json: { data: { id: 'admin-test', email: 'admin@contoh.invalid', full_name: 'Admin Contoh', role: 'super_admin', is_active: true, mfa: false, mfa_at: null, totp_enabled_at: null, totp_enabled: false } } }))

  const server = buatServer()
  let keadaan = 'menunggu'
  const seen = []
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  const cors = { 'access-control-allow-origin': '*' }
  await page.route(`${SUPABASE}/**`, async (r) => {
    const req = r.request()
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' } })
    const nama = new URL(req.url()).pathname.split('/').pop()
    const p = req.postDataJSON() || {}
    seen.push(nama)
    const j = server.jawab(nama, p, { izin: true })
    if (nama === 'admin_kesehatan' && PLAY[keadaan]) j.json = { ...j.json, play_proses: PLAY[keadaan] }
    return r.fulfill({ status: j.status ?? 200, json: j.json, headers: cors })
  })

  const tema = async (t) => {
    await ctx.clearCookies()
    await ctx.addCookies([{ name: 'coreasia-theme', value: t, domain: '127.0.0.1', path: '/' }])
  }
  const lebar = async (w) => { await page.setViewportSize({ width: w, height: w > 500 ? 900 : 844 }); await page.waitForTimeout(250) }
  const meluber = () => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  const potret = async (nama) => {
    await page.evaluate(() => scrollTo(0, 0))
    await page.waitForTimeout(400)
    await page.screenshot({ path: join(output, `${nama}.png`) })
    await page.screenshot({ path: join(output, `${nama}-penuh.png`), fullPage: true })
  }
  const gagal = (pesan) => { throw new Error(pesan) }
  const uji = id => page.locator(`[data-uji="${id}"]`)
  const buka = async () => {
    seen.length = 0
    await page.goto(`${APP}/console/cashflow/kesehatan`, { waitUntil: 'domcontentloaded' })
    // Ubin ukuran basis data = admin_kesehatan sudah dijawab.
    await page.getByText('Ukuran basis data', { exact: false }).first().waitFor({ timeout: 60000 })
    await page.waitForTimeout(300)
  }
  const bersih = async (di) => {
    const teks = await page.evaluate(() => document.querySelector('main')?.innerText ?? document.body.innerText)
    const m = teks.match(MENTAH)
    if (m) gagal(`${di}: kode mentah atau teks rusak terbaca: "${m[0]}"`)
  }
  /** Warna latar baris dihitung peramban, untuk membuktikan emas hanya di keadaan lama. */
  const latar = () => page.evaluate(() => {
    const e = document.querySelector('[data-uji^="kesehatan-play-"]')
    return e ? getComputedStyle(e).backgroundColor : null
  })

  // 1. Empat keadaan, terang dan gelap, 1440 dan 390.
  const warna = {}
  for (const k of ['menunggu', 'lama', 'kosong', 'server-lama']) {
    for (const t of ['terang', 'gelap']) {
      keadaan = k
      await tema(t === 'terang' ? 'light' : 'dark')
      await lebar(1440)
      await buka()
      if (seen.includes('admin_ai_pembelian_daftar')) gagal(`${k} ${t}: Kesehatan memanggil daftar pembelian`)
      if (!seen.includes('admin_kesehatan')) gagal(`${k} ${t}: admin_kesehatan tidak dipanggil`)
      const baris = page.locator('[data-uji^="kesehatan-play-"]').first()
      if (k === 'server-lama') {
        if (await page.locator('[data-uji^="kesehatan-play-"]').count()) gagal('Server lama: baris pembelian Google Play tetap tampil')
      } else {
        await uji(`kesehatan-play-${k}`).waitFor({ timeout: 5000 }).catch(() => gagal(`${k} ${t}: baris kesehatan-play-${k} tidak tampil`))
        const teks = (await baris.innerText()).replace(/\s+/g, ' ').trim()
        if (!teks.includes(KALIMAT[k])) gagal(`${k} ${t}: kalimat "${teks}"`)
        const tautan = uji('kesehatan-play-tautan')
        if (k === 'kosong') {
          if (await tautan.count()) gagal('Nol: tautan tetap tampil')
        } else if ((await tautan.getAttribute('href')) !== '/console/cashflow/pembelian?status=diproses') {
          gagal(`${k} ${t}: tautan ${await tautan.getAttribute('href')}`)
        }
        warna[`${k}-${t}`] = await latar()
      }
      if (await page.getByRole('alert').count()) gagal(`${k} ${t}: ada galat merah`)
      await bersih(`${k} ${t} 1440`)
      if (await meluber()) gagal(`${k} ${t}: meluber di 1440`)
      await potret(`${k}-${t}-1440`)
      await lebar(390)
      if (await meluber()) gagal(`${k} ${t}: meluber di 390`)
      if (k !== 'server-lama') {
        const kotak = await baris.boundingBox()
        if (!kotak || kotak.x < 0 || kotak.x + kotak.width > 391) gagal(`${k} ${t}: baris melewati tepi di 390 (${JSON.stringify(kotak)})`)
        // Kalimat tidak terjepit tautan di sampingnya.
        if (k !== 'kosong') {
          const w = await uji('kesehatan-play-kalimat').evaluate(e => Math.round(e.getBoundingClientRect().width))
          if (w < 200) gagal(`${k} ${t}: kalimat terjepit di 390 (${w} px)`)
        }
      }
      await bersih(`${k} ${t} 390`)
      await potret(`${k}-${t}-390`)
    }
  }
  for (const t of ['terang', 'gelap']) {
    if (warna[`lama-${t}`] === warna[`menunggu-${t}`]) gagal(`${t}: latar keadaan lama sama dengan menunggu (${warna[`lama-${t}`]})`)
    if (!/rgba?\(0, 0, 0, 0\)|transparent/.test(warna[`kosong-${t}`] ?? '')) gagal(`${t}: kalimat nol punya latar ${warna[`kosong-${t}`]}`)
  }
  hasil.empatKeadaan = 'lulus'
  hasil.latar = warna

  // 2. Tautan membuka Pembelian saringan Sedang diproses.
  keadaan = 'lama'
  await tema('light')
  await lebar(1440)
  await buka()
  await uji('kesehatan-play-tautan').click()
  await page.waitForURL(/\/console\/cashflow\/pembelian\?status=diproses/, { timeout: 30000 })
  await page.waitForTimeout(800)
  hasil.tautan = page.url().replace(APP, '')

  if (errors.length) gagal(`Galat browser: ${errors.join('; ')}`)
  console.log(JSON.stringify({ ...hasil, takDikenal: [...server.takDikenal], errors }))
} catch (e) {
  // Potret keadaan saat gagal, untuk dibaca sesudahnya.
  if (page) await page.screenshot({ path: join(output, 'galat.png'), fullPage: true }).catch(() => {})
  throw e
} finally {
  if (browser) try { const s = await browser.newBrowserCDPSession(); await s.send('Browser.close') } catch { /* Chrome sudah tertutup. */ }
  chrome.kill()
  await rm(dir, { recursive: true, force: true }).catch(() => {})
}
