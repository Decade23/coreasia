// Uji tampilan Pengumuman: form baru (galat per kolom, sisa huruf, galat server),
// pencarian penerima v2, pengecualian di semua mode, gaya kartu, tautan dalam
// aplikasi, dan bagian Pengumuman rutin (spek console 19 Nov 2026, K5 dan K8).
// Data sintetis (scripts/data-sintetis-console.mjs) lewat page.route, tanpa
// Supabase sungguhan. Chrome headless lewat CDP, tanpa jendela di layar.
//
// Jalankan server lokal TANPA .env (tidak ada kunci sungguhan):
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_URL=http://127.0.0.1:4418 \
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY=anon-sintetis \
//   npx nuxi dev --port 4419 --host 127.0.0.1
// lalu:
//   PLAYWRIGHT_CORE_PATH=<playwright-core/index.mjs> CF_QA_ARTIFACTS=<folder> \
//   node scripts/uji-console-pengumuman-rutin-headless.mjs
// CF_QA_APP dan CF_QA_SUPABASE mengganti alamat bawaan di atas.
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buatServer, uuid, SAAT } from './data-sintetis-console.mjs'

const pwPath = process.env.PLAYWRIGHT_CORE_PATH
const { chromium } = await (pwPath ? import(pathToFileURL(pwPath).href) : import('playwright-core'))
const output = process.env.CF_QA_ARTIFACTS || join(tmpdir(), 'cf-pengumuman-rutin-potret')
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
const dir = await mkdtemp(join(process.env.CF_QA_TMP || tmpdir(), 'cf-pengumuman-rutin-'))
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--user-data-dir=${dir}`, `--remote-debugging-port=${cdpPort}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

const MENTAH = /pengumuman\.(form|rutin)\.|\bundefined\b|\bNaN\b|\[object/
const hasil = { potret: [], cek: [], kiriman: {} }
const cek = (nama, ok, rinci = '') => { if (!ok) throw new Error(`${nama}${rinci ? `: ${rinci}` : ''}`); hasil.cek.push(nama) }
let browser
try {
  for (let i = 0; i < 100; i++) { try { const r = await fetch(`http://127.0.0.1:${cdpPort}/json/version`); if (r.ok) break } catch { /* belum siap */ } await new Promise(r => setTimeout(r, 100)) }
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`)
  const ctx = browser.contexts()[0]
  const page = ctx.pages()[0]
  const masa = Math.floor(SAAT / 1000) + 86_400
  const jwt = ['eyJhbGciOiJub25lIn0', Buffer.from(JSON.stringify({ sub: uuid(900), role: 'authenticated', exp: masa })).toString('base64url'), 'test'].join('.')
  const session = { access_token: jwt, refresh_token: 'test-refresh', expires_at: masa, expires_in: 86_400, token_type: 'bearer', user: { id: uuid(900), aud: 'authenticated', role: 'authenticated', email: 'admin@contoh.invalid' } }
  const IZIN_PII = ['cashflow:view', 'cashflow:pii', 'cashflow:investigasi', 'cashflow:tindak', 'cashflow:ekspor']
  await ctx.addInitScript(({ session, izin, saat }) => {
    if (location.protocol !== 'http:') return
    const Asli = Date
    function Beku(...a) { if (!new.target) return new Asli(saat).toString(); return a.length ? new Asli(...a) : new Asli(saat) }
    Beku.prototype = Asli.prototype; Beku.now = () => saat; Beku.parse = Asli.parse; Beku.UTC = Asli.UTC
    window.Date = Beku
    sessionStorage.setItem('cf-console-sesi', JSON.stringify(session))
    // Izin sesi bisa diganti uji lewat localStorage 'uji-izin' (sesi tanpa pii).
    let ganti = null
    try { ganti = localStorage.getItem('uji-izin') } catch { /* abaikan */ }
    sessionStorage.setItem('cf_izin', ganti ?? JSON.stringify(izin))
    addEventListener('DOMContentLoaded', () => {
      const gaya = document.createElement('style')
      gaya.textContent = '[id^="nuxt-devtools"]{display:none!important}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
      document.head.append(gaya)
    })
  }, { session, izin: IZIN_PII, saat: SAAT })
  await ctx.route('**/*', (route) => {
    const u = new URL(route.request().url())
    return u.hostname === '127.0.0.1' && PORT_BOLEH.includes(u.port) ? route.continue() : route.abort()
  })
  const saatIso = new Date(SAAT - 60_000).toISOString()
  await page.route('**/api/gw/**', r => r.fulfill({ status: 404, json: { error: 'gateway sintetis' } }))
  const server = buatServer()
  const mode = { kosong: false, izin: true, belumAda: null, tanpaGaya: false }
  // Tanpa MFA = tanpa izin data pribadi (pola uji-console-halaman-headless.mjs).
  await page.route('**/api/gw/admin/auth/me', r => r.fulfill({ json: { data: {
    id: 'admin-test', email: 'admin@contoh.invalid', full_name: 'Admin Contoh', role: 'super_admin', is_active: true, created_at: '2026-01-01T00:00:00Z',
    mfa: mode.izin, mfa_at: mode.izin ? saatIso : null, totp_enabled_at: mode.izin ? '2026-01-01T00:00:00Z' : null, totp_enabled: mode.izin,
  } } }))
  /** Jawaban galat yang ditimpakan sekali untuk RPC tertentu. */
  const timpa = new Map()
  const kiriman = []
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  const cors = { 'access-control-allow-origin': '*' }
  await page.route(`${SUPABASE}/**`, async (r) => {
    const req = r.request()
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' } })
    const nama = new URL(req.url()).pathname.split('/').pop()
    let p = {}
    try { p = req.postDataJSON() || {} } catch { /* bukan JSON */ }
    kiriman.push({ nama, p })
    if (timpa.has(nama)) { const j = timpa.get(nama); timpa.delete(nama); return r.fulfill({ status: j.status, json: j.json, headers: cors }) }
    const j = server.jawab(nama, p, mode)
    return r.fulfill({ status: j.status ?? 200, json: j.json, headers: cors })
  })

  const tema = async (t) => {
    await ctx.clearCookies()
    await ctx.addCookies([
      { name: 'coreasia-theme', value: t === 'terang' ? 'light' : 'dark', domain: '127.0.0.1', path: '/' },
      { name: 'coreasia-locale', value: 'id', domain: '127.0.0.1', path: '/' },
    ])
  }
  const lebar = async (w) => { await page.setViewportSize({ width: w, height: w > 500 ? 900 : 844 }); await page.waitForTimeout(200) }
  const meluber = () => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  const buka = async () => {
    await page.goto(`${APP}/console/cashflow/pengumuman`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'Buat pengumuman', exact: true }).waitFor({ timeout: 90_000 })
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
    await page.waitForTimeout(400)
  }
  const potret = async (nama, opsi = {}) => {
    await page.waitForTimeout(250)
    await page.screenshot({ path: join(output, `${nama}.png`), fullPage: opsi.penuh ?? true })
    hasil.potret.push(`${nama}.png`)
  }
  const bersih = async (di) => {
    const teks = await page.evaluate(() => document.body.innerText)
    const m = teks.match(MENTAH)
    cek(`${di}: tanpa kode kamus mentah`, !m, m?.[0])
  }
  const modal = () => page.locator('[role="dialog"]').last()
  const terakhir = nama => [...kiriman].reverse().find(k => k.nama === nama)

  // ── 1. Halaman dengan fitur T3 lengkap (kolom gaya ada) ───────────────
  for (const t of ['terang', 'gelap']) {
    await tema(t)
    for (const w of [1440, 390]) {
      await lebar(w)
      await buka()
      await page.locator('[data-uji="bagian-rutin"]').waitFor()
      cek(`halaman ${t} ${w}: bagian rutin tampil`, await page.locator('[data-uji="bagian-rutin"]').isVisible())
      cek(`halaman ${t} ${w}: sakelar mati`, (await page.locator('[data-uji="rutin-sakelar"]').innerText()).includes('Mati'))
      // Tombol sakelar: tampil, membuka form beralasan, Batal menutupnya tanpa menyimpan.
      const ubah = page.locator('[data-uji="rutin-sakelar-ubah"]')
      cek(`halaman ${t} ${w}: tombol Nyalakan ada`, (await ubah.innerText()).includes('Nyalakan'))
      if (!(await ubah.isDisabled())) {
        await ubah.click()
        cek(`halaman ${t} ${w}: form sakelar beralasan`, (await page.locator('#cf-rt-sakelar-alasan').inputValue()).length >= 8)
        await page.locator('[data-uji="rutin-sakelar-form"]').screenshot({ path: join(output, `sakelar-form-${t}-${w}.png`) }).catch(() => {})
        await page.locator('[data-uji="rutin-sakelar-form"] button[type="button"]').click()
        cek(`halaman ${t} ${w}: Batal menutup form`, await page.locator('[data-uji="rutin-sakelar-form"]').count() === 0)
      }
      cek(`halaman ${t} ${w}: tanpa luber samping`, !(await meluber()))
      await bersih(`halaman ${t} ${w}`)
      await potret(`halaman-${t}-${w}`)
    }
  }
  await tema('terang'); await lebar(1440); await buka()
  cek('baris rutin berlabel Rutin dan Kartu', (await page.locator('[data-uji="label-rutin"]').count()) >= 1)

  // ── 2. Form baru: galat per kolom sesudah Simpan ──────────────────────
  await page.getByRole('button', { name: 'Buat pengumuman', exact: true }).click()
  await modal().locator('[data-uji="form-pengumuman"]').waitFor()
  await page.locator('#cf-p-judul').fill('')
  await page.getByRole('button', { name: 'Simpan', exact: true }).click()
  const invalid = await modal().locator('[aria-invalid="true"]').count()
  cek('Simpan kosong: galat per kolom dengan aria-invalid', invalid >= 3, `${invalid} kolom`)
  cek('fokus pindah ke kolom pertama yang salah', await page.evaluate(() => document.activeElement?.id === 'cf-p-judul'))
  cek('galat judul tertulis di kolomnya', (await page.locator('#cf-p-judul-galat').innerText()).includes('Isi judulnya'))
  await potret('form-galat-kolom', { penuh: false })
  await page.locator('#cf-p-judul').fill('Struk menumpuk? Kirim ke Domi')
  cek('galat judul hilang begitu diketik', (await page.locator('#cf-p-judul-galat').count()) === 0)
  cek('sisa huruf judul', /sisa 51/i.test(await page.locator('#cf-p-judul-ket').innerText()), await page.locator('#cf-p-judul-ket').innerText())
  await page.locator('#cf-p-isi').fill('Foto struknya, lalu kirim ke Domi. Domi membaca isinya dan menyiapkan catatannya. Kamu tinggal cek, lalu simpan.')
  await page.locator('#cf-p-alasan').fill('Uji form pengumuman console')

  // ── 3. Gaya kartu dan tautan dalam aplikasi ───────────────────────────
  await modal().locator('[data-uji="pilihan-gaya"] input[value="kartu"]').check()
  await page.locator('#cf-p-tombol').fill('Kirim struk ke Domi')
  await modal().locator('[data-uji="tautan-ai"]').click()
  cek('alamat tombol terisi cashflow://ai', (await page.locator('#cf-p-url').inputValue()) === 'cashflow://ai')
  await modal().locator('[data-uji="pratinjau-kartu"]').waitFor()
  cek('pratinjau kartu menyebut Domi di aplikasi', (await modal().locator('[data-uji="pratinjau-kartu"]').innerText()).includes('Domi di aplikasi'))
  cek('pratinjau tautan dalam bukan tautan peramban', (await modal().locator('[data-uji="pratinjau-kartu"] a').count()) === 0)

  // ── 4. Pengecualian di mode Beberapa pengguna + cari v2 terbuka ───────
  await page.locator('#cf-p-penerima').selectOption('users')
  await modal().locator('[data-uji="cari-penerima"]').first().waitFor()
  const cari = modal().locator('[data-uji="cari-penerima"]').first()
  await cari.getByRole('textbox').fill('sari')
  await cari.getByRole('button', { name: 'Cari', exact: true }).click()
  await cari.getByText('sari@contoh.invalid', { exact: true }).waitFor()
  const v2 = terakhir('admin_pengumuman_pengguna_v2')
  cek('cari v2 dikirim dengan alasan tetap (sesi pii)', !!v2 && typeof v2.p.p_alasan === 'string' && v2.p.p_alasan.includes('Cari penerima pengumuman'), JSON.stringify(v2?.p))
  cek('cari v2: nama utuh tampil', await cari.getByText('Sari Wulandari', { exact: true }).isVisible())
  cek('cari v2: keterangan terbuka dan tercatat audit', (await cari.locator('[data-uji="cari-penerima-mode"]').innerText()).includes('tercatat di audit'))
  await cari.locator('label').filter({ hasText: 'sari@contoh.invalid' }).locator('input').check()
  await cari.getByRole('textbox').fill('raka')
  await cari.getByRole('button', { name: 'Cari', exact: true }).click()
  await cari.getByText('raka@contoh.invalid', { exact: true }).waitFor()
  await cari.locator('label').filter({ hasText: 'raka@contoh.invalid' }).locator('input').check()
  const kec = modal().locator('[data-uji="kecuali-penerima"]').last()
  cek('pengecualian tersedia di mode Beberapa pengguna', await kec.isVisible())
  await kec.locator('[data-uji="kecuali-internal"]').check()
  cek('hitungan penerima ditandai sebelum pengecualian', await modal().getByText(/sebelum pengecualian/).first().isVisible())
  await potret('form-kartu-kecuali', { penuh: false })
  await modal().locator('form').evaluate(f => f.scrollTo?.(0, 0))
  await modal().screenshot({ path: join(output, 'form-kartu-kecuali-modal.png') }); hasil.potret.push('form-kartu-kecuali-modal.png')

  // ── 5. Galat server menempel di kolom, lalu simpan sungguhan ──────────
  timpa.set('admin_simpan_pengumuman_v5', { status: 400, json: { code: '22023', message: 'Judul harus berisi 1–80 karakter.', hint: 'pengumuman-judul', details: null } })
  await page.getByRole('button', { name: 'Simpan', exact: true }).click()
  await page.locator('#cf-p-judul-galat').waitFor()
  cek('galat server menempel di kolom judul', (await page.locator('#cf-p-judul-galat').innerText()).includes('ditolak server'))
  cek('kolom judul aria-invalid karena galat server', (await page.locator('#cf-p-judul').getAttribute('aria-invalid')) === 'true')
  await potret('form-galat-server', { penuh: false })
  await page.locator('#cf-p-judul').fill('Struk menumpuk? Kirim ke Domi saja')
  await page.getByRole('button', { name: 'Simpan', exact: true }).click()
  await modal().locator('[data-uji="form-pengumuman"]').waitFor({ state: 'detached', timeout: 15_000 })
  const v5 = terakhir('admin_simpan_pengumuman_v5')
  hasil.kiriman.simpan_v5 = v5?.p
  cek('simpan lewat v5 dengan gaya kartu', v5?.p.p_gaya === 'kartu')
  cek('beberapa pengguna kecuali dikirim sebagai aturan saring pengguna', v5?.p.p_penerima === 'aturan' && Array.isArray(v5?.p.p_aturan?.saring?.pengguna)
    && v5.p.p_aturan.saring.pengguna.length === 2 && v5.p.p_aturan.kecuali_internal === true && v5.p.p_pengguna.length === 0, JSON.stringify(v5?.p.p_aturan))
  cek('tombol tautan dalam ikut terkirim', v5?.p.p_url === 'cashflow://ai' && v5?.p.p_tombol === 'Kirim struk ke Domi')

  // ── 6. Mode Semua + pengecualian: catatan jangkauan aplikasi lama ─────
  await page.getByRole('button', { name: 'Buat pengumuman', exact: true }).click()
  await modal().locator('[data-uji="form-pengumuman"]').waitFor()
  await modal().locator('[data-uji="kecuali-penerima"]').locator('[data-uji="kecuali-internal"]').check()
  cek('semua kecuali: keterangan 1.3.7 ke atas', await modal().getByText(/hanya sampai ke aplikasi 1\.3\.7 ke atas/).isVisible())
  await page.getByRole('button', { name: 'Batal', exact: true }).click()

  // ── 7. Sunting "beberapa pengguna kecuali": kembali ke modenya ────────
  const baris = page.locator('tr', { hasText: 'Uji kartu untuk mitra toko' })
  await baris.getByRole('button', { name: 'Sunting', exact: true }).click()
  await modal().locator('[data-uji="form-pengumuman"]').waitFor()
  cek('sunting: mode kembali Beberapa pengguna', (await page.locator('#cf-p-penerima').inputValue()) === 'users')
  cek('sunting: pengecualian terbaca (1 pengguna)', await modal().locator('[data-uji="kecuali-penerima"]').getByText('Pengguna yang dikecualikan · 1').isVisible())
  cek('sunting: gaya kartu terbaca', await modal().locator('[data-uji="pilihan-gaya"] input[value="kartu"]').isChecked())
  await page.getByRole('button', { name: 'Batal', exact: true }).click()

  // ── 8. Templat rutin: form, kartu, akun internal terkunci ─────────────
  await page.locator('[data-uji="rutin-tambah"]').click()
  await modal().locator('[data-uji="form-rutin"]').waitFor()
  cek('templat baru: draf (tidak aktif)', !(await modal().locator('[data-uji="rutin-aktif"]').isChecked()))
  const internal = modal().locator('[data-uji="kecuali-internal"]')
  cek('templat: akun internal tercentang dan terkunci', (await internal.isChecked()) && (await internal.isDisabled()))
  await page.getByRole('button', { name: 'Simpan templat', exact: true }).click()
  cek('templat kosong: galat per kolom', (await modal().locator('[aria-invalid="true"]').count()) >= 2)
  await page.locator('#cf-rt-topik').selectOption('dukung')
  await page.locator('#cf-rt-judul').fill('Suka mencatat pakai CashFlow?')
  await page.locator('#cf-rt-isi').fill('Kalau CashFlow membantu kamu tahu ke mana uangmu pergi, kamu bisa ikut menjaganya tetap jalan. Dukungannya sukarela, mulai dari Rp25.000.')
  await page.locator('#cf-rt-tombol').fill('Dukung CashFlow')
  await modal().locator('[data-uji="tautan-dukung"]').click()
  await page.locator('#cf-rt-jam-mulai').selectOption('12')
  await page.locator('#cf-rt-jam-akhir').selectOption('10')
  await page.locator('#cf-rt-jam-akhir').blur()
  cek('jam akhir sebelum jam mulai ditolak di kolomnya', (await page.locator('#cf-rt-jam-akhir-galat').innerText()).includes('sesudah jam mulai'))
  await page.locator('#cf-rt-jam-akhir').selectOption('20')
  cek('pratinjau rutin = kartu', await modal().locator('[data-uji="pratinjau-kartu"]').isVisible())
  cek('aturan otomatis saat terbit tertulis', (await modal().locator('[data-uji="rutin-otomatis"]').innerText()).includes('kurang dari 3 hari'))
  await modal().screenshot({ path: join(output, 'rutin-form-modal.png') }); hasil.potret.push('rutin-form-modal.png')
  await page.getByRole('button', { name: 'Simpan templat', exact: true }).click()
  await modal().locator('[data-uji="form-rutin"]').waitFor({ state: 'detached', timeout: 15_000 })
  const sr = terakhir('admin_simpan_pengumuman_rutin')
  hasil.kiriman.simpan_rutin = sr?.p
  cek('templat terkirim: kecuali_internal true, draf, jam 12 sampai 20, tautan dukung', sr?.p.p_aturan?.kecuali_internal === true && sr?.p.p_aktif === false
    && sr?.p.p_jam_mulai === 12 && sr?.p.p_jam_akhir === 20 && sr?.p.p_url === 'cashflow://dukung' && sr?.p.p_versi === null, JSON.stringify(sr?.p))

  // ── 9. Hapus templat: konfirmasi beralasan ────────────────────────────
  const kartu = page.locator(`[data-uji="rutin-${uuid(1304)}"]`)
  await kartu.getByRole('button', { name: 'Hapus', exact: true }).click()
  await kartu.locator('input').waitFor()
  await potret('rutin-hapus')
  await kartu.locator('form').getByRole('button', { name: 'Hapus', exact: true }).click()
  await page.waitForTimeout(500)
  cek('hapus templat terkirim dengan alasan', terakhir('admin_hapus_pengumuman_rutin')?.p.p_alasan?.includes('Hapus templat pengumuman rutin'))

  // ── 10. Server tanpa kolom gaya (T4 belum terpasang) ──────────────────
  mode.tanpaGaya = true
  await buka()
  cek('tanpa kolom gaya: peringatan di bagian rutin', await page.locator('[data-uji="rutin-gaya-belum"]').isVisible())
  await page.getByRole('button', { name: 'Buat pengumuman', exact: true }).click()
  await modal().locator('[data-uji="form-pengumuman"]').waitFor()
  cek('tanpa kolom gaya: kartu terkunci', await modal().locator('[data-uji="pilihan-gaya"] input[value="kartu"]').isDisabled())
  await modal().screenshot({ path: join(output, 'form-tanpa-gaya.png') }); hasil.potret.push('form-tanpa-gaya.png')
  await page.getByRole('button', { name: 'Batal', exact: true }).click()
  mode.tanpaGaya = false

  // ── 11. Server lama: tanpa RPC T3 ─────────────────────────────────────
  mode.belumAda = ['admin_daftar_pengumuman_rutin', 'admin_simpan_pengumuman_v5', 'admin_pengumuman_pengguna_v2']
  await buka()
  cek('server lama: bagian rutin tidak tampil', (await page.locator('[data-uji="bagian-rutin"]').count()) === 0)
  await page.getByRole('button', { name: 'Buat pengumuman', exact: true }).click()
  await modal().locator('[data-uji="form-pengumuman"]').waitFor()
  cek('server lama: tanpa pilihan gaya dan tanpa pengecualian di mode semua', (await modal().locator('[data-uji="pilihan-gaya"]').count()) === 0
    && (await modal().locator('[data-uji="kecuali-penerima"]').count()) === 0)
  await page.locator('#cf-p-penerima').selectOption('users')
  await modal().locator('[data-uji="cari-penerima"]').getByText('sari@contoh.invalid', { exact: true }).waitFor()
  cek('server lama: cari jatuh ke v1 tanpa galat', (await modal().getByRole('alert').count()) === 0 && !!terakhir('admin_pengumuman_pengguna'))
  await potret('server-lama', { penuh: false })
  await page.getByRole('button', { name: 'Batal', exact: true }).click()
  mode.belumAda = null

  // ── 12. Sesi tanpa pii: tersamar, tulis rutin terkunci ────────────────
  mode.izin = false
  await page.evaluate(() => localStorage.setItem('uji-izin', JSON.stringify(['cashflow:view'])))
  await buka()
  cek('tanpa pii: Tambah templat terkunci', await page.locator('[data-uji="rutin-tambah"]').isDisabled())
  cek('tanpa pii: keterangan butuh TOTP', await page.getByText('Mengubah templat butuh login console ber-TOTP.').isVisible())
  const n0 = kiriman.length
  await page.getByRole('button', { name: 'Buat pengumuman', exact: true }).click()
  await page.locator('#cf-p-penerima').selectOption('users')
  await modal().locator('[data-uji="cari-penerima"]').getByText('sar***@contoh.invalid', { exact: true }).waitFor()
  const v2b = kiriman.slice(n0).filter(k => k.nama === 'admin_pengumuman_pengguna_v2').pop()
  cek('tanpa pii: cari v2 tanpa alasan, email tersamar', !!v2b && (v2b.p.p_alasan ?? null) === null, JSON.stringify(v2b?.p))
  await potret('tanpa-pii', { penuh: false })

  cek('tanpa galat halaman', errors.length === 0, errors.join(' | '))
  hasil.takDikenal = [...server.takDikenal]
  await writeFile(join(output, 'hasil.json'), JSON.stringify(hasil, null, 2))
  console.log(`LULUS ${hasil.cek.length} cek, ${hasil.potret.length} potret di ${output}`)
  if (hasil.takDikenal.length) console.log(`RPC tanpa data sintetis: ${hasil.takDikenal.join(', ')}`)
} catch (e) {
  console.error(`GAGAL: ${e.message}`)
  console.error(`cek lulus sebelum gagal: ${hasil.cek.length}`)
  try { const p = browser?.contexts()[0]?.pages()[0]; if (p) await p.screenshot({ path: join(output, 'gagal.png'), fullPage: true }) } catch { /* abaikan */ }
  process.exitCode = 1
} finally {
  try {
    if (browser) {
      const s = await browser.newBrowserCDPSession()
      await s.send('Browser.close').catch(() => {})
    }
  } catch { /* abaikan */ }
  chrome.kill('SIGKILL')
  await rm(dir, { recursive: true, force: true }).catch(() => {})
}
