// Uji tampilan "pemakai Domi" di daftar pengguna console CashFlow dengan data
// sintetis: kolom Domi, Terakhir pakai Domi, dan Kredit, lencana Tim, segmen
// Pakai Domi dan Beli kredit, saringan akun tim, urut menurut Domi, server lama
// (v4 belum ada, daftar jatuh ke v3), dan sesi tanpa izin data pribadi. Terang
// dan gelap, lebar 1440 dan 390. Chrome headless lewat CDP, tanpa jendela.
//
// Jalankan server lokal TANPA .env (tidak ada kunci sungguhan):
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_URL=http://127.0.0.1:4398 \
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY=anon-sintetis \
//   npx nuxi dev --port 4399 --host 127.0.0.1
// lalu:
//   PLAYWRIGHT_CORE_PATH=<playwright-core/index.mjs> CF_QA_ARTIFACTS=<folder> \
//   node scripts/uji-console-pengguna-domi-headless.mjs
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
const dir = await mkdtemp(join(process.env.CF_QA_TMP || tmpdir(), 'cf-pengguna-domi-'))
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--user-data-dir=${dir}`, `--remote-debugging-port=${cdpPort}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

// ── Data sintetis ────────────────────────────────────────────────────────
const jam = j => new Date(Date.now() - j * 3_600_000).toISOString()
/* Sepuluh akun karangan: belum pernah, sedikit, banyak, akun tim, pernah beli. */
const AKUN = [
  { nama: 'sari', tanya: 412, tiga: 96, terakhir: 2, sisa: 37, beli: 3, tim: false },
  { nama: 'bima', tanya: 42, tiga: 9, terakhir: 30, sisa: 8, beli: 0, tim: false },
  { nama: 'tim.uji', tanya: 1280, tiga: 310, terakhir: 1, sisa: 9999, beli: 0, tim: true },
  { nama: 'dewi', tanya: 0, tiga: 0, terakhir: null, sisa: 20, beli: 0, tim: false },
  { nama: 'raka', tanya: 3, tiga: 3, terakhir: 50, sisa: 17, beli: 0, tim: false },
  { nama: 'maya.kusumawardhani.toko', tanya: 67, tiga: 0, terakhir: 24 * 45, sisa: 0, beli: 1, tim: false },
  { nama: 'tim.dukungan', tanya: 15, tiga: 15, terakhir: 6, sisa: 500, beli: 0, tim: true },
  { nama: 'yoga', tanya: 0, tiga: 0, terakhir: null, sisa: 20, beli: 0, tim: false },
  { nama: 'lina', tanya: 9, tiga: 1, terakhir: 24 * 12, sisa: 61, beli: 2, tim: false },
  { nama: 'andi', tanya: 1, tiga: 1, terakhir: 80, sisa: 19, beli: 0, tim: false },
]
const STATUS = ['masuk', 'kirim', 'kirim', 'belum', 'lewat', 'masuk', 'kirim', 'belum', 'masuk', 'kirim']
const baris = (a, i, { v4, alasan, pii }) => {
  const s = STATUS[i]
  const dasar = {
    user_id: `00000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
    email: alasan ? `${a.nama}@contoh.invalid` : `${a.nama.slice(0, 3)}***@contoh.invalid`, display_name: '',
    created_at: jam(24 * (i + 3) * 9), last_sign_in: jam(5 * (i + 1)), aktivitas_terakhir: jam(4 * (i + 1)), banned_until: null,
    jumlah_ruang: pii ? 1 + (i % 3) : null, jumlah_tx: pii ? i * 37 : null, jumlah_nominal: pii ? i * 1_250_000 : null,
    terbuka: !!alasan, menunggu_hapus: false,
    nomor_wa: s === 'masuk' || s === 'kirim' ? `0811 •••• ${String(1000 + i).slice(-4)}` : null,
    versi_aplikasi: i % 3 ? '1.4.1' : '1.4.0', platform: i % 4 === 3 ? 'ios' : 'android',
    status_wa: s, status_wa_pada: s === 'belum' ? null : jam(24 * (i + 2)), lewat_sebab: s === 'lewat' ? 'gangguan' : null,
    nomor_ramai: false, kredit_ditahan: false,
  }
  if (!v4) return dasar
  return {
    ...dasar,
    domi_tanya: pii ? a.tanya : null, domi_tanya_30: pii ? a.tiga : null,
    domi_terakhir: pii && a.terakhir !== null ? jam(a.terakhir) : null,
    kredit_sisa: pii ? a.sisa : null, kredit_beli: pii ? a.beli : null, internal: a.tim,
  }
}
const URUT_V4 = ['domi', 'domi_terakhir', 'kredit']
const SEGMEN_V4 = ['pakai_domi', 'beli_kredit']

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
  await ctx.route('**/*', (route) => {
    const u = new URL(route.request().url())
    return u.hostname === '127.0.0.1' && PORT_BOLEH.includes(u.port) ? route.continue() : route.abort()
  })
  await page.route('**/api/gw/**', r => r.fulfill({ status: 404, json: { error: 'gateway sintetis' } }))
  await page.route('**/api/gw/admin/auth/me', r => r.fulfill({ json: { data: { id: 'admin-test', email: 'admin@contoh.invalid', full_name: 'Admin Contoh', role: 'super_admin', is_active: true, mfa: true, mfa_at: new Date().toISOString(), totp_enabled_at: '2026-01-01T00:00:00Z' } } }))

  /** Server tiruan. `v4` false = migrasinya belum terpasang (PGRST202). */
  let v4 = true
  const seen = []
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  const cors = { 'access-control-allow-origin': '*' }
  await page.route(`${SUPABASE}/**`, async (r) => {
    const req = r.request()
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' } })
    const name = new URL(req.url()).pathname.split('/').pop()
    const p = req.postDataJSON() || {}
    seen.push({ name, p })
    if (name === 'admin_daftar_pengguna_v2') return r.fulfill({ json: [], headers: cors })
    if (name !== 'admin_daftar_pengguna_v3' && name !== 'admin_daftar_pengguna_v4') return r.fulfill({ json: {}, headers: cors })
    const baru = name === 'admin_daftar_pengguna_v4'
    if (baru && !v4) return r.fulfill({ status: 404, headers: cors, json: { code: 'PGRST202', details: null, hint: null, message: `Could not find the function public.${name} in the schema cache` } })
    const pii = izin.includes('cashflow:pii')
    const asing = URUT_V4.includes(p.p_urut) || SEGMEN_V4.includes(p.p_segmen) || (p.p_filter && 'internal' in p.p_filter)
    // v3 tidak mengenal pilihan Domi sama sekali.
    if (!baru && asing) return r.fulfill({ status: 400, headers: cors, json: { code: '22023', message: 'Saringan tidak dikenal.', hint: 'saringan' } })
    const pribadi = ['ruang', 'tx', 'nominal', ...URUT_V4].includes(p.p_urut) || ['catat7', 'belum', ...SEGMEN_V4].includes(p.p_segmen) || !!p.p_alasan
    if (!pii && pribadi) return r.fulfill({ status: 403, headers: cors, json: { code: '42501', message: 'izin-kurang', hint: 'izin-kurang' } })
    let rows = AKUN.map((a, i) => ({ a, d: baris(a, i, { v4: baru, alasan: p.p_alasan, pii }) }))
    if (p.p_segmen === 'pakai_domi') rows = rows.filter(x => x.a.tanya > 0)
    if (p.p_segmen === 'beli_kredit') rows = rows.filter(x => x.a.beli > 0)
    if (p.p_filter?.internal) rows = rows.filter(x => x.a.tim === (p.p_filter.internal === 'ya'))
    const arah = p.p_arah === 'asc' ? 1 : -1
    if (p.p_urut === 'domi') rows.sort((x, y) => arah * (x.a.tanya - y.a.tanya))
    if (p.p_urut === 'kredit') rows.sort((x, y) => arah * (x.a.sisa - y.a.sisa))
    // null selalu di akhir, apa pun arahnya.
    if (p.p_urut === 'domi_terakhir') rows.sort((x, y) => (x.a.terakhir === null) - (y.a.terakhir === null) || arah * (y.a.terakhir - x.a.terakhir))
    return r.fulfill({ headers: cors, json: {
      total: rows.length, baris: rows.map(x => ({ ...x.d, total_semua: rows.length })),
      versi_terbaru: { android: '0001000400010000100000' }, hapus_tersedia: true,
      ...(baru ? { jumlah_pakai_domi: pii ? AKUN.filter(a => a.tanya > 0).length : null } : {}),
    } })
  })

  const tema = async (t) => {
    await ctx.clearCookies()
    await ctx.addCookies([{ name: 'coreasia-theme', value: t, domain: '127.0.0.1', path: '/' }])
  }
  const lebar = async (w) => { await page.setViewportSize({ width: w, height: w > 500 ? 900 : 844 }); await page.waitForTimeout(250) }
  const meluber = () => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  const potret = async (nama) => {
    await page.evaluate(() => scrollTo(0, 0))
    await page.waitForTimeout(500)
    await page.screenshot({ path: join(output, `${nama}.png`), fullPage: true })
  }
  const gagal = (pesan) => { throw new Error(pesan) }
  const buka = async (query = '') => {
    await page.goto(`${APP}/console/cashflow/pengguna${query}`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: 'Daftar pengguna', exact: true }).waitFor({ timeout: 60000 })
  }
  const terakhir = () => seen.filter(x => x.name.startsWith('admin_daftar_pengguna_v') && x.name !== 'admin_daftar_pengguna_v2').at(-1)
  // Muatan daftar ditunda sebentar sesudah URL berganti: tunggu sampai permintaannya terkirim.
  const terkirim = async (cocok) => {
    for (let i = 0; i < 50; i++) { if (cocok(terakhir().p)) return true; await page.waitForTimeout(100) }
    return false
  }
  const kepala = teks => page.locator('thead th').filter({ hasText: teks })
  const lebarKolom = () => page.locator('thead th').evaluateAll(th => th.map(x => Math.round(x.getBoundingClientRect().width)))
  const selDomi = () => page.locator('tbody tr').evaluateAll((tr, n) => tr.map(r => r.children[n].innerText.split('\n')[0].trim()), 6)

  // 1. Server v4: kolom terisi beragam, terang dan gelap, 1440 dan 390.
  for (const t of ['terang', 'gelap']) {
    await tema(t === 'terang' ? 'light' : 'dark')
    await lebar(1440)
    await buka()
    await page.getByText('10 pengguna', { exact: true }).waitFor()
    for (const k of ['Domi', 'Terakhir pakai Domi', 'Kredit']) if (!(await kepala(k).first().isVisible())) gagal(`v4 ${t}: kolom ${k} tidak tampil`)
    for (const teks of ['96 dalam 30 hari', '9 dalam 30 hari', '0 dalam 30 hari', '1.280', '9.999']) {
      if (!(await page.locator('table').getByText(teks, { exact: true }).first().isVisible())) gagal(`v4 ${t}: "${teks}" tidak tampil`)
    }
    // 30 hari yang sama dengan totalnya tidak ditulis dua kali.
    if (await page.locator('table').getByText('3 dalam 30 hari', { exact: true }).count()) gagal('30 hari ditulis padahal sama dengan total')
    if (await page.locator('table').getByText('Tim', { exact: true }).count() !== 2) gagal('Lencana Tim tidak tepat dua')
    if (await page.locator('table [aria-label="Pernah beli kredit 3 kali"]').count() !== 1) gagal('Tanda pernah beli tidak tampil')
    if (await page.locator('table [aria-label^="Pernah beli kredit"]').count() !== 3) gagal('Tanda pernah beli tidak tepat tiga')
    if (!(await page.getByText('8 akun sudah pernah bertanya ke Domi.', { exact: true }).isVisible())) gagal('Jumlah pakai Domi tidak tampil')
    for (const s of ['Pakai Domi', 'Beli kredit']) if (!(await page.getByRole('button', { name: s, exact: true }).isVisible())) gagal(`Segmen ${s} tidak tampil`)
    if (terakhir().name !== 'admin_daftar_pengguna_v4') gagal('Daftar tidak dibaca lewat v4')
    if (await meluber()) gagal(`v4 ${t} meluber di 1440`)
    hasil[`gulirTabel1440_${t}`] = await page.locator('.ca-console-table-wrap').evaluate(w => w.scrollWidth - w.clientWidth)
    hasil[`lebarKolom1440_${t}`] = (await lebarKolom()).join(' ')
    await potret(`v4-${t}-1440`)
    await lebar(390)
    if (await meluber()) gagal(`v4 ${t} meluber di 390`)
    await potret(`v4-${t}-390`)
    for (const teks of ['Terakhir pakai Domi', '96 dalam 30 hari', 'Pernah beli kredit 3 kali']) {
      if (!(await page.locator('ul').getByText(teks, { exact: true }).first().isVisible())) gagal(`v4 ${t} 390: "${teks}" tidak tampil di kartu`)
    }
  }
  hasil.v4 = 'lulus'

  // 2. Urut menurut Domi: terbanyak dulu, klik lagi membalik.
  await tema('light')
  await lebar(1440)
  await buka()
  await kepala('Domi').first().getByRole('button', { name: 'Domi', exact: true }).click()
  await page.waitForFunction(() => location.search.includes('urut=domi'))
  await page.waitForFunction(() => document.querySelector('tbody tr td:nth-child(7)')?.textContent?.includes('1.280'))
  if (terakhir().p.p_urut !== 'domi' || terakhir().p.p_arah !== 'desc') gagal(`Urut Domi mengirim ${JSON.stringify(terakhir().p)}`)
  const urut = await selDomi()
  if (urut.join() !== ['1.280', '412', '67', '42', '15', '9', '3', '1', '0', '0'].join()) gagal(`Urutan Domi salah: ${urut}`)
  await potret('v4-urut-domi-terang-1440')
  await kepala('Terakhir pakai Domi').getByRole('button').first().click()
  await page.waitForFunction(() => location.search.includes('urut=domi_terakhir'))
  if (!(await terkirim(p => p.p_urut === 'domi_terakhir'))) gagal('Urut Terakhir pakai Domi tidak dikirim')
  await kepala('Kredit').getByRole('button').first().click()
  await page.waitForFunction(() => location.search.includes('urut=kredit'))
  if (!(await terkirim(p => p.p_urut === 'kredit'))) gagal('Urut Kredit tidak dikirim')
  hasil.urut = 'lulus'

  // 3. Segmen Pakai Domi dan Beli kredit, lalu saringan akun tim.
  await tema('dark')
  await buka()
  await page.getByRole('button', { name: 'Pakai Domi', exact: true }).click()
  await page.waitForFunction(() => location.search.includes('seg=pakai_domi'))
  await page.getByText('8 pengguna', { exact: true }).waitFor()
  if (terakhir().p.p_segmen !== 'pakai_domi') gagal('Segmen pakai_domi tidak dikirim')
  await potret('v4-segmen-pakai-domi-gelap-1440')
  await lebar(390)
  if (await meluber()) gagal('Segmen Pakai Domi meluber di 390')
  await potret('v4-segmen-pakai-domi-gelap-390')
  await lebar(1440)
  await page.getByRole('button', { name: 'Beli kredit', exact: true }).click()
  await page.getByText('3 pengguna', { exact: true }).waitFor()
  if (terakhir().p.p_segmen !== 'beli_kredit') gagal('Segmen beli_kredit tidak dikirim')
  await page.getByRole('button', { name: 'Semua', exact: true }).click()
  await page.getByText('10 pengguna', { exact: true }).waitFor()
  await page.locator('[data-uji="saring-tim"]').selectOption('tidak')
  await page.getByText('8 pengguna', { exact: true }).waitFor({ timeout: 10000 })
  if (terakhir().p.p_filter?.internal !== 'tidak') gagal(`Saringan tanpa tim mengirim ${JSON.stringify(terakhir().p.p_filter)}`)
  if (await page.locator('table').getByText('Tim', { exact: true }).count()) gagal('Tanpa akun tim: lencana Tim masih ada')
  await page.locator('[data-uji="saring-tim"]').selectOption('ya')
  await page.getByText('2 pengguna', { exact: true }).waitFor({ timeout: 10000 })
  if (terakhir().p.p_filter?.internal !== 'ya') gagal('Saringan hanya tim tidak dikirim')
  await potret('v4-hanya-tim-gelap-1440')
  await page.locator('[data-uji="saring-tim"]').selectOption('')
  await page.getByText('10 pengguna', { exact: true }).waitFor({ timeout: 10000 })
  if (terakhir().p.p_filter && 'internal' in terakhir().p.p_filter) gagal('Semua akun masih mengirim saringan internal')
  hasil.segmenDanTim = 'lulus'

  // 4. Server lama: v4 belum ada. Daftar tetap tampil lewat v3, tanpa apa pun tentang Domi.
  v4 = false
  for (const t of ['terang', 'gelap']) {
    await tema(t === 'terang' ? 'light' : 'dark')
    await lebar(1440)
    const sebelum = seen.length
    await buka()
    await page.getByText('10 pengguna', { exact: true }).waitFor()
    const nama = seen.slice(sebelum).filter(x => x.name.startsWith('admin_daftar_pengguna_v') && x.name !== 'admin_daftar_pengguna_v2').map(x => x.name)
    if (nama.join() !== 'admin_daftar_pengguna_v4,admin_daftar_pengguna_v3') gagal(`Server lama: urutan panggilan ${nama}`)
    for (const k of ['Domi', 'Terakhir pakai Domi', 'Kredit']) if (await kepala(k).count()) gagal(`Server lama: kolom ${k} tampil`)
    for (const s of ['Pakai Domi', 'Beli kredit']) if (await page.getByRole('button', { name: s, exact: true }).count()) gagal(`Server lama: segmen ${s} tampil`)
    if (await page.locator('[data-uji="saring-tim"]').count()) gagal('Server lama: saringan akun tim tampil')
    if (await page.locator('[data-uji="jumlah-pakai-domi"]').count()) gagal('Server lama: jumlah pakai Domi tampil')
    if (await page.getByText('Tim', { exact: true }).count()) gagal('Server lama: lencana Tim tampil')
    if (await page.getByRole('alert').count()) gagal('Server lama: ada galat merah')
    if (await page.locator('.ca-console-table-wrap').evaluate(w => w.scrollWidth > w.clientWidth)) gagal(`Server lama ${t}: tabel bergulir samping di 1440`)
    hasil[`lebarKolomLama1440_${t}`] = (await lebarKolom()).join(' ')
    await potret(`server-lama-${t}-1440`)
    await lebar(390)
    if (await meluber()) gagal(`Server lama ${t} meluber di 390`)
    if (await page.locator('ul').getByText('Terakhir pakai Domi', { exact: true }).count()) gagal('Server lama 390: kartu memuat Domi')
    await potret(`server-lama-${t}-390`)
  }
  // Sekali tahu server lama, pindah halaman di sesi yang sama tidak menanyai v4 lagi.
  await lebar(1440)
  let sebelum = seen.length
  await page.getByRole('button', { name: 'Ditangguhkan', exact: true }).click()
  await page.waitForFunction(() => location.search.includes('seg=ditangguhkan'))
  await page.waitForTimeout(800)
  if (seen.slice(sebelum).some(x => x.name === 'admin_daftar_pengguna_v4')) gagal('Server lama: v4 ditanyai lagi di sesi yang sama')
  // Tautan lama membawa urut dan segmen Domi: dilepas tanpa galat, v3 tidak pernah menerimanya.
  sebelum = seen.length
  await buka('?seg=pakai_domi&urut=domi')
  await page.waitForFunction(() => !location.search.includes('domi'), null, { timeout: 30000 })
  await page.getByText('10 pengguna', { exact: true }).waitFor({ timeout: 30000 })
  const lama = seen.slice(sebelum).filter(x => x.name === 'admin_daftar_pengguna_v3')
  if (!lama.length || lama.some(x => URUT_V4.includes(x.p.p_urut) || SEGMEN_V4.includes(x.p.p_segmen))) gagal(`Server lama: v3 menerima pilihan Domi ${JSON.stringify(lama.map(x => x.p))}`)
  if (await page.getByRole('alert').count()) gagal('Server lama: tautan Domi berujung galat')
  hasil.serverLama = 'lulus'

  // 5. Sesi tanpa izin data pribadi: kolom ada, isinya garis, urut dan segmennya mati.
  v4 = true
  izin = ['cashflow:view']
  await pasangIzin()
  await page.route('**/api/gw/admin/auth/me', r => r.fulfill({ json: { data: { id: 'admin-test', email: 'admin@contoh.invalid', full_name: 'Admin Contoh', role: 'super_admin', is_active: true, mfa: false, totp_enabled: false } } }))
  await tema('light')
  await buka()
  await page.getByText('10 pengguna', { exact: true }).waitFor()
  await kepala('Terakhir pakai Domi').waitFor()
  if (await kepala('Domi').first().getByRole('button', { name: 'Domi', exact: true }).count()) gagal('Tanpa izin: kolom Domi masih bisa diurutkan')
  if (!(await page.getByRole('button', { name: 'Pakai Domi', exact: true }).isDisabled())) gagal('Tanpa izin: segmen Pakai Domi masih hidup')
  if (!(await page.getByRole('button', { name: 'Beli kredit', exact: true }).isDisabled())) gagal('Tanpa izin: segmen Beli kredit masih hidup')
  if ((await selDomi()).some(x => !x.startsWith('—'))) gagal('Tanpa izin: hitungan Domi tampil')
  if (await page.locator('[data-uji="jumlah-pakai-domi"]').count()) gagal('Tanpa izin: jumlah pakai Domi tampil')
  if (await page.locator('table').getByText('Tim', { exact: true }).count() !== 2) gagal('Tanpa izin: lencana Tim hilang')
  await page.waitForTimeout(1500)
  await potret('v4-tanpa-izin-terang-1440')
  // Tautan berurut Domi tanpa izin kembali ke urutan bawaan, bukan galat.
  await buka('?urut=domi')
  await page.waitForFunction(() => !location.search.includes('domi'), null, { timeout: 30000 })
  await page.getByText('10 pengguna', { exact: true }).waitFor({ timeout: 30000 })
  hasil.tanpaIzin = 'lulus'

  if (errors.length) gagal(`Galat browser: ${errors.join('; ')}`)
  console.log(JSON.stringify({ ...hasil, errors }))
} finally {
  if (browser) try { const s = await browser.newBrowserCDPSession(); await s.send('Browser.close') } catch { /* Chrome sudah tertutup. */ }
  chrome.kill()
  await rm(dir, { recursive: true, force: true }).catch(() => {})
}
