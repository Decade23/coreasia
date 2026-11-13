// Uji tampilan sasaran pengumuman berbasis aturan di console CashFlow dengan
// data sintetis: Pengumuman (penerima aturan, pratinjau penerima, ringkasan di
// tabel, simpan saringan sebagai segmen, kelola segmen dan penolakan
// segmen-dipakai) dan kartu Akun internal di Sakelar. Server baru dan server
// lama (RPC belum ada), terang dan gelap, ID dan EN, lebar 1440 dan 390.
// Chrome headless lewat CDP, tanpa jendela.
//
// Jalankan server lokal TANPA .env (tidak ada kunci sungguhan):
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_URL=http://127.0.0.1:4398 \
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY=anon-sintetis \
//   npx nuxi dev --port 4399 --host 127.0.0.1
// lalu:
//   PLAYWRIGHT_CORE_PATH=<playwright-core/index.mjs> CF_QA_ARTIFACTS=<folder> \
//   node scripts/uji-console-pengumuman-sasaran-headless.mjs
// CF_QA_APP dan CF_QA_SUPABASE boleh menunjuk port lain. CF_QA_TMP boleh
// menunjuk folder profil Chrome sementara (bawaan tmpdir).
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createServer } from 'node:net'
import { tmpdir, homedir } from 'node:os'
import { join } from 'node:path'

const pwPath = process.env.PLAYWRIGHT_CORE_PATH
const { chromium } = await (pwPath ? import(pathToFileURL(pwPath).href) : import('playwright-core'))
const output = process.env.CF_QA_ARTIFACTS || join(homedir(), 'Codex', 'artifact', 'coreasia')
const APP = process.env.CF_QA_APP || 'http://127.0.0.1:4399'
const SUPA = new URL(process.env.CF_QA_SUPABASE || 'http://127.0.0.1:4398')
await mkdir(output, { recursive: true })
const portServer = createServer()
await new Promise(r => portServer.listen(0, '127.0.0.1', r))
const cdpPort = portServer.address().port
await new Promise(r => portServer.close(r))
const dir = await mkdtemp(join(process.env.CF_QA_TMP || tmpdir(), 'cf-sasaran-'))
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--user-data-dir=${dir}`, `--remote-debugging-port=${cdpPort}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

// ── Data sintetis ────────────────────────────────────────────────────────
const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const jam = (h) => new Date(Date.now() - h * 3600e3).toISOString()
const S1 = uuid(901), S2 = uuid(902), G1 = uuid(801)
const PENGGUNA = Array.from({ length: 30 }, (_, i) => ({ id: uuid(i + 1), email: `pengguna${i + 1}@contoh.invalid` }))
const aturan = (ubah) => ({ v: 1, segmen_id: null, saring: {}, kecuali_internal: true, kecuali_pengguna: [], kecuali_kelompok: [], ...ubah })
const baris = (n, judul, ubah) => ({
  id: uuid(100 + n), title: judul, body: 'Perbarui aplikasi untuk memakai fitur terbaru.', level: 'info',
  starts_at: jam(24 * n), ends_at: null, created_by: null, created_at: jam(24 * n + 1), updated_at: jam(24 * n),
  action_label: null, action_url: null, audience_type: 'all', user_ids: [], group_ids: [], group_names: [], recipient_count: 1204,
  ...ubah,
})
const daftarBaru = () => [
  baris(0, 'CashFlow 1.4.1 sudah tersedia', { audience_type: 'aturan', audience_rules: aturan({ saring: { versi_di_bawah: 26111301 } }), segmen_nama: null, recipient_count: 1180 }),
  baris(1, 'Tips Domi minggu ini', { audience_type: 'aturan', audience_rules: aturan({ segmen_id: S1, saring: null, kecuali_pengguna: [uuid(3)] }), segmen_nama: 'Pengguna aktif 30 hari', recipient_count: 640 }),
  baris(2, 'Pemeliharaan server', { audience_type: 'all', audience_rules: null, segmen_nama: null }),
  baris(3, 'Uji fitur kelompok', { audience_type: 'groups', group_ids: [G1], group_names: ['Penguji internal'], recipient_count: 3, audience_rules: null, segmen_nama: null }),
]
// Server v3 tidak mengenal audience_rules dan segmen_nama.
const daftarLama = () => daftarBaru().slice(2).map((x) => { const y = { ...x }; delete y.audience_rules; delete y.segmen_nama; return y })
let segmen = []
let internal = []
const awal = () => {
  segmen = [
    { id: S1, nama: 'Pengguna aktif 30 hari', saring: { aktif_dalam_hari: 30 }, jumlah: 640, dipakai: 1, diubah: jam(48) },
    { id: S2, nama: 'Belum pernah pakai Domi', saring: { domi_pakai: false, ruang: 'usaha' }, jumlah: 410, dipakai: 0, diubah: jam(72) },
  ]
  internal = [
    { user_id: uuid(501), email: 'pemilik@contoh.invalid', jenis: 'pemilik', catatan: 'Akun pemilik', diubah: jam(5) },
    { user_id: uuid(502), email: 'uji.anggota@contoh.invalid', jenis: 'uji', catatan: 'Uji anggota ruang', diubah: jam(5) },
    { user_id: uuid(503), email: 'uji.pribadi@contoh.invalid', jenis: 'uji', catatan: null, diubah: jam(5) },
    { user_id: uuid(504), email: 'peninjau@contoh.invalid', jenis: 'peninjau', catatan: 'Peninjau Google Play', diubah: jam(5) },
  ]
}
const pratinjau = (p) => {
  const a = p.p_aturan
  const internalKeluar = p.p_penerima === 'aturan' && a?.kecuali_internal ? 4 : 0
  const lain = p.p_penerima === 'aturan' ? (a?.kecuali_pengguna?.length ?? 0) + 3 * (a?.kecuali_kelompok?.length ?? 0) : 0
  const dasar = p.p_penerima === 'all' ? 1204 : p.p_penerima === 'aturan' ? (a?.saring?.aktif_dalam_hari ? 640 : 1184) : (p.p_pengguna?.length || 3)
  return {
    jumlah: dasar - internalKeluar - lain, tak_terjangkau_versi_lama: p.p_penerima === 'all' ? 0 : 37,
    versi_tak_diketahui: a?.saring?.versi_tak_diketahui === 'tidak' ? 0 : 12, dikecualikan_internal: internalKeluar, dikecualikan_lain: lain,
    contoh: [['pe***@co***.invalid', 26111216], ['ra***@co***.invalid', 26110702], ['si***@co***.invalid', null], ['an***@co***.invalid', 26111216], ['bu***@co***.invalid', 26103106]]
      .map(([email_tersamar, versi]) => ({ email_tersamar, versi })),
  }
}

let browser
const hasil = { cek: [] }
const cek = (nama, ok = true) => { if (!ok) throw new Error(`Gagal: ${nama}`); hasil.cek.push(nama) }
try {
  for (let i = 0; i < 100; i++) { try { const r = await fetch(`http://127.0.0.1:${cdpPort}/json/version`); if (r.ok) break } catch { /* Chrome belum siap. */ } await new Promise(r => setTimeout(r, 100)) }
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`)
  const ctx = browser.contexts()[0]
  const page = ctx.pages()[0]
  const jwt = ['eyJhbGciOiJub25lIn0', Buffer.from(JSON.stringify({ sub: uuid(1000), role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'test'].join('.')
  const session = { access_token: jwt, refresh_token: 'test-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user: { id: uuid(1000), aud: 'authenticated', role: 'authenticated', email: 'admin@contoh.invalid' } }
  await ctx.addInitScript(({ session }) => {
    if (location.protocol !== 'http:') return
    sessionStorage.setItem('cf-console-sesi', JSON.stringify(session))
    sessionStorage.setItem('cf_izin', JSON.stringify(['cashflow:view', 'cashflow:pii', 'cashflow:investigasi', 'cashflow:tindak', 'cashflow:ekspor']))
    addEventListener('DOMContentLoaded', () => {
      const gaya = document.createElement('style')
      gaya.textContent = '[id^="nuxt-devtools"]{display:none!important}'
      document.head.append(gaya)
    })
  }, { session })
  const appUrl = new URL(APP)
  await ctx.route('**/*', (route) => {
    const u = new URL(route.request().url())
    return u.hostname === '127.0.0.1' && [appUrl.port, SUPA.port].includes(u.port) ? route.continue() : route.abort()
  })
  await page.route('**/api/gw/**', r => r.fulfill({ status: 404, json: { error: 'gateway sintetis' } }))
  await page.route('**/api/gw/admin/auth/me', r => r.fulfill({ json: { data: { id: 'admin-test', email: 'admin@contoh.invalid', full_name: 'Admin Contoh', role: 'super_admin', is_active: true, mfa: true, mfa_at: new Date().toISOString(), totp_enabled_at: '2026-01-01T00:00:00Z' } } }))

  let baru = true
  const simpanan = []
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  const cors = { 'access-control-allow-origin': '*' }
  const galat = (status, json) => ({ status, headers: cors, json })
  const BARU_SAJA = new Set(['admin_daftar_pengumuman_v4', 'admin_simpan_pengumuman_v4', 'admin_pratinjau_penerima_pengumuman', 'admin_daftar_segmen_pengumuman',
    'admin_simpan_segmen_pengumuman', 'admin_hapus_segmen_pengumuman', 'admin_daftar_akun_internal', 'admin_simpan_akun_internal', 'admin_hapus_akun_internal'])
  await page.route(`${SUPA.origin}/**`, async (r) => {
    const req = r.request()
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' } })
    const name = new URL(req.url()).pathname.split('/').pop()
    const p = req.postDataJSON() || {}
    if (!baru && BARU_SAJA.has(name)) return r.fulfill(galat(404, { code: 'PGRST202', message: `Could not find the function public.${name}`, hint: null }))
    let data = null
    if (name === 'admin_daftar_pengumuman_v4') data = daftarBaru()
    else if (name === 'admin_daftar_pengumuman_v3') data = daftarLama()
    else if (name === 'admin_simpan_pengumuman_v4' || name === 'admin_simpan_pengumuman_v3') { simpanan.push({ name, p }); data = p.p_id }
    else if (name === 'admin_pratinjau_penerima_pengumuman') data = pratinjau(p)
    else if (name === 'admin_jumlah_penerima_pengumuman') data = p.p_penerima === 'all' ? 1204 : 3
    else if (name === 'admin_pengumuman_pengguna') {
      const rows = p.p_ids ? PENGGUNA.filter(x => p.p_ids.includes(x.id)) : PENGGUNA.filter(x => !p.p_cari || x.email.includes(p.p_cari))
      data = { total: rows.length, baris: rows.slice(p.p_offset || 0, (p.p_offset || 0) + (p.p_limit || 25)) }
    } else if (name === 'admin_daftar_kelompok_pengumuman') data = { total: 1, baris: [{ id: G1, name: 'Penguji internal', updated_at: jam(10), members: 3 }] }
    else if (name === 'admin_detail_kelompok_pengumuman') data = { id: G1, name: 'Penguji internal', updated_at: jam(10), members: 3, user_ids: [uuid(1), uuid(2), uuid(3)] }
    else if (name === 'admin_daftar_segmen_pengumuman') data = segmen
    else if (name === 'admin_simpan_segmen_pengumuman') {
      simpanan.push({ name, p })
      const ada = segmen.find(s => s.id === p.p_id)
      if (ada) Object.assign(ada, { nama: p.p_nama, saring: p.p_saring, diubah: new Date().toISOString() })
      else segmen = [...segmen, { id: p.p_id, nama: p.p_nama, saring: p.p_saring, jumlah: 512, dipakai: 0, diubah: new Date().toISOString() }]
      data = p.p_id
    } else if (name === 'admin_hapus_segmen_pengumuman') {
      simpanan.push({ name, p })
      if (segmen.find(s => s.id === p.p_id)?.dipakai) return r.fulfill(galat(409, { code: '23503', message: 'Segmen masih dipakai.', hint: 'segmen-dipakai' }))
      segmen = segmen.filter(s => s.id !== p.p_id)
    } else if (name === 'admin_daftar_akun_internal') data = internal
    else if (name === 'admin_simpan_akun_internal') {
      simpanan.push({ name, p })
      if (p.p_email === 'tidak.ada@contoh.invalid') return r.fulfill(galat(404, { code: 'P0002', message: 'Akun tidak ditemukan.', hint: null }))
      const id = p.p_user || uuid(600 + internal.length)
      const lama = internal.find(a => a.user_id === id)
      if (lama) Object.assign(lama, { jenis: p.p_jenis, catatan: p.p_catatan, diubah: new Date().toISOString() })
      else internal = [...internal, { user_id: id, email: p.p_email, jenis: p.p_jenis, catatan: p.p_catatan, diubah: new Date().toISOString() }]
      data = id
    } else if (name === 'admin_hapus_akun_internal') { simpanan.push({ name, p }); internal = internal.filter(a => a.user_id !== p.p_user) }
    else if (name === 'admin_daftar_config_v2') data = []
    else if (name === 'admin_versi_aplikasi') data = { hari: 30, aktif: 0, aktif_luar: 0, diketahui: 0, diketahui_luar: 0, baris: [], tertinggi: [], konfig: { versi_android: null, versi_android_uat: null, versi_android_ias: null } }
    return r.fulfill({ json: data, headers: cors })
  })

  const tema = async (t, bahasa = 'id') => {
    await ctx.clearCookies()
    await ctx.addCookies([
      { name: 'coreasia-theme', value: t, domain: '127.0.0.1', path: '/' },
      { name: 'coreasia-locale', value: bahasa, domain: '127.0.0.1', path: '/' },
    ])
  }
  const lebar = async (w, h) => { await page.setViewportSize({ width: w, height: h ?? (w > 500 ? 900 : 844) }); await page.waitForTimeout(250) }
  const meluber = () => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  // Halaman penuh selalu dari atas: sidebar dan kepala console fixed/sticky ikut tergambar di tengah bila sudah digulir.
  const potret = async (nama) => { await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300); await page.screenshot({ path: join(output, `${nama}.png`), fullPage: true }) }
  // Kartu: tunggu toast hilang, viewport ditinggikan supaya kartu terpotret utuh.
  const potretKartu = async (nama, pilih) => {
    await page.waitForFunction(() => !document.querySelector('.ca-toast'), null, { timeout: 15000 }).catch(() => {})
    const ukuran = page.viewportSize()
    await page.setViewportSize({ width: ukuran.width, height: 2600 })
    const el = page.locator(pilih)
    await el.scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    await el.screenshot({ path: join(output, `${nama}.png`) })
    await page.setViewportSize(ukuran)
  }
  // Muat pertama server dev memudar masuk: tunggu jaringan tenang dan sedikit jeda sebelum memotret.
  const buka = async (jalur, tunggu) => {
    await page.goto(`${APP}${jalur}`, { waitUntil: 'domcontentloaded' })
    await page.getByText(tunggu, { exact: true }).first().waitFor({ timeout: 60000 })
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(700)
  }
  const RINGKAS_ID = 'Semua pengguna, versi di bawah 1.4.1, kecuali akun internal'
  const RINGKAS_EN = 'All users, version below 1.4.1, except internal accounts'
  const pratinjauAngka = () => page.locator('[data-uji="pratinjau-jumlah"]').innerText()
  const tungguPratinjau = async (angka) => { await page.locator('[data-uji="pratinjau-jumlah"]', { hasText: angka }).waitFor({ timeout: 10000 }) }
  const bukaFormAturan = async () => {
    await page.getByRole('button', { name: 'Buat pengumuman', exact: true }).click()
    await page.locator('#cf-p-penerima').selectOption('aturan')
    await page.locator('[data-uji="aturan-penerima"]').waitFor()
  }

  // 1. Pengumuman, server baru, ID terang 1440: tabel, buat dengan aturan, simpan.
  awal()
  await tema('light')
  await lebar(1440)
  await buka('/console/cashflow/pengumuman', RINGKAS_ID)
  cek('tabel menulis aturan dalam kalimat awam', true)
  cek('ringkasan segmen menyebut nama segmen', await page.getByText('Segmen Pengguna aktif 30 hari, kecuali akun internal dan 1 pengguna', { exact: true }).isVisible())
  cek('jenis lama tetap berlabel', await page.locator('td', { hasText: 'Kelompok' }).first().isVisible())
  cek('tombol Segmen tampil di server baru', await page.getByRole('button', { name: 'Segmen', exact: true }).isVisible())
  await potret('pengumuman-daftar-terang-1440')

  await bukaFormAturan()
  await tungguPratinjau('1.180')
  cek('pratinjau aturan kosong = semua kecuali internal', (await pratinjauAngka()) === '1.180')
  await page.getByLabel('Di bawah versi', { exact: true }).selectOption('26111301')
  await page.getByLabel('Aktif dalam berapa hari terakhir', { exact: true }).fill('30')
  await tungguPratinjau('636')
  cek('pratinjau disegarkan sesudah saringan berubah', true)
  cek('jumlah ditulis dengan satuan', (await page.locator('[data-uji="pratinjau-penerima"] p', { has: page.locator('[data-uji="pratinjau-jumlah"]') }).innerText()).replace(/\s+/g, ' ') === '636 penerima')
  cek('versi lama ditulis sebagai bagian dari jumlah', (await page.locator('[data-uji="pratinjau-tak-terjangkau"]').innerText()) === 'Di antaranya 37 belum bisa menerima karena aplikasinya di bawah 1.3.8.')
  cek('versi tak diketahui ditulis sebagai bagian dari jumlah', (await page.locator('[data-uji="pratinjau-versi-tak-diketahui"]').innerText()) === 'Di antaranya 12 belum diketahui versi aplikasinya, jadi belum pasti menerima.')
  await potretKartu('pratinjau-penerima-terang-1440', '[data-uji="pratinjau-penerima"]')
  cek('contoh email tersamar tampil', await page.getByText('pe***@co***.invalid', { exact: true }).isVisible())
  await page.locator('#cf-p-judul').fill('CashFlow 1.4.1 sudah tersedia')
  await page.locator('#cf-p-isi').fill('Perbarui aplikasi untuk memakai Domi yang lebih cepat.')
  await page.locator('#cf-p-alasan').fill('Umumkan rilis 1.4.1')
  await lebar(1440, 2300)
  await page.waitForTimeout(600)
  await potret('pengumuman-buat-aturan-terang-1440')
  await lebar(1440)
  await page.getByRole('button', { name: 'Simpan', exact: true }).click()
  await page.locator('#cf-p-judul').waitFor({ state: 'hidden' })
  const kirim = simpanan.find(s => s.name === 'admin_simpan_pengumuman_v4')
  cek('simpan lewat v4 dengan p_aturan sesuai kontrak', !!kirim && kirim.p.p_penerima === 'aturan' && JSON.stringify(kirim.p.p_aturan) === JSON.stringify({
    v: 1, segmen_id: null, saring: { versi_di_bawah: 26111301, versi_tak_diketahui: 'ikut', aktif_dalam_hari: 30 }, kecuali_internal: true, kecuali_pengguna: [], kecuali_kelompok: [],
  }) && kirim.p.p_versi === null && Array.isArray(kirim.p.p_pengguna) && kirim.p.p_pengguna.length === 0)
  hasil.pAturan = kirim.p.p_aturan

  // 2. Sunting pengumuman bersegmen: dasar terpilih, pengecualian terbaca.
  await page.locator('tbody tr', { hasText: 'Tips Domi minggu ini' }).getByRole('button', { name: 'Sunting', exact: true }).click()
  await page.locator('[data-uji="aturan-penerima"]').waitFor()
  await page.getByText('Semua pengguna, aktif dalam 30 hari terakhir', { exact: true }).waitFor()
  cek('sunting memulihkan segmen', (await page.locator('#cf-aturan-dasar').inputValue()) === S1)
  cek('sunting memulihkan pengecualian pengguna', await page.getByText('Pengguna yang dikecualikan · 1', { exact: true }).isVisible())
  await page.getByRole('button', { name: 'Batal', exact: true }).last().click()
  await page.locator('#cf-p-judul').waitFor({ state: 'hidden' })

  // 3. Simpan saringan sebagai segmen, lalu dipakai pengumuman ini.
  await bukaFormAturan()
  await page.getByLabel('Pernah pakai Domi', { exact: true }).selectOption('ya')
  await page.getByRole('button', { name: 'Simpan saringan sebagai segmen', exact: true }).click()
  await page.locator('#cf-aturan-nama-segmen').fill('Pengguna Domi')
  await page.getByRole('button', { name: 'Simpan segmen', exact: true }).click()
  await page.getByText('Semua pengguna, pernah pakai Domi', { exact: true }).waitFor()
  const segBaru = simpanan.find(s => s.name === 'admin_simpan_segmen_pengumuman')
  cek('segmen tersimpan dengan saring sesuai kontrak', !!segBaru && segBaru.p.p_versi === null && JSON.stringify(segBaru.p.p_saring) === JSON.stringify({ domi_pakai: true }))
  cek('dasar pindah ke segmen baru', (await page.locator('#cf-aturan-dasar').inputValue()) === segBaru.p.p_id)
  await page.getByRole('button', { name: 'Batal', exact: true }).last().click()
  await page.locator('#cf-p-judul').waitFor({ state: 'hidden' })

  // 4. Kelola segmen: daftar, penolakan segmen-dipakai, hapus yang tidak dipakai.
  await page.getByRole('button', { name: 'Segmen', exact: true }).click()
  await page.locator('[data-uji="kelola-segmen"]').waitFor()
  await page.locator(`[data-uji="segmen-${S1}"]`).getByRole('button', { name: 'Hapus', exact: true }).click()
  await page.locator(`[data-uji="segmen-${S1}"] form`).getByRole('button', { name: 'Hapus', exact: true }).click()
  await page.locator('[data-uji="segmen-dipakai"]').waitFor()
  cek('penolakan segmen-dipakai ditulis dengan kalimat awam', (await page.locator('[data-uji="segmen-dipakai"]').innerText()).startsWith('Segmen ini masih dipakai pengumuman aktif atau terjadwal.'))
  await potretKartu('segmen-kelola-terang-1440', '[role="dialog"]')
  await page.locator(`[data-uji="segmen-${S2}"]`).getByRole('button', { name: 'Hapus', exact: true }).click()
  await page.locator(`[data-uji="segmen-${S2}"] form`).getByRole('button', { name: 'Hapus', exact: true }).click()
  await page.locator(`[data-uji="segmen-${S2}"]`).waitFor({ state: 'detached' })
  cek('segmen yang tidak dipakai terhapus', true)
  await page.locator(`[data-uji="segmen-${S1}"]`).getByRole('button', { name: 'Sunting', exact: true }).click()
  await page.locator('#cf-segmen-nama').fill('Pengguna aktif 14 hari')
  await page.getByLabel('Aktif dalam berapa hari terakhir', { exact: true }).fill('14')
  await page.getByRole('button', { name: 'Simpan segmen', exact: true }).click()
  await page.getByText('Pengguna aktif 14 hari', { exact: true }).waitFor()
  const segUbah = simpanan.filter(s => s.name === 'admin_simpan_segmen_pengumuman').at(-1)
  cek('sunting segmen mengirim versi yang dimuat', segUbah.p.p_id === S1 && !!segUbah.p.p_versi && segUbah.p.p_saring.aktif_dalam_hari === 14)
  await page.keyboard.press('Escape')

  // 5. Gelap 1440 dan 390, terang 390.
  for (const t of ['gelap', 'terang']) {
    awal()
    await tema(t === 'gelap' ? 'dark' : 'light')
    await lebar(1440)
    await buka('/console/cashflow/pengumuman', RINGKAS_ID)
    if (t === 'gelap') await potret('pengumuman-daftar-gelap-1440')
    await bukaFormAturan()
    await page.getByLabel('Di bawah versi', { exact: true }).selectOption('26111301')
    await tungguPratinjau('1.180')
    if (t === 'gelap') {
      await potretKartu('pratinjau-penerima-gelap-1440', '[data-uji="pratinjau-penerima"]')
      await lebar(1440, 2300); await page.waitForTimeout(500); await potret('pengumuman-buat-aturan-gelap-1440')
    }
    await lebar(390)
    cek(`form aturan ${t} tidak meluber di 390`, !(await meluber()))
    await lebar(390, 3600)
    await page.waitForTimeout(500)
    await potret(`pengumuman-buat-aturan-${t}-390`)
    await lebar(390)
    await page.getByRole('button', { name: 'Batal', exact: true }).last().click()
    cek(`daftar ${t} tidak meluber di 390`, !(await meluber()))
    await potret(`pengumuman-daftar-${t}-390`)
  }

  // 6. Bahasa Inggris.
  awal()
  await tema('light', 'en')
  await lebar(1440)
  await buka('/console/cashflow/pengumuman', RINGKAS_EN)
  cek('ringkasan EN', true)
  await page.getByRole('button', { name: 'Create announcement', exact: true }).click()
  await page.locator('#cf-p-penerima').selectOption('aturan')
  await page.getByLabel('Below version', { exact: true }).selectOption('26111301')
  await tungguPratinjau('1,180')
  cek('pratinjau EN', (await page.locator('[data-uji="pratinjau-tak-terjangkau"]').innerText()) === "Of these, 37 can't get it yet because their app is below 1.3.8.")
  await potretKartu('pratinjau-penerima-en-terang-1440', '[data-uji="pratinjau-penerima"]')
  await lebar(1440, 2300)
  await page.waitForTimeout(500)
  await potret('pengumuman-buat-aturan-en-terang-1440')
  await lebar(1440)
  await page.getByRole('button', { name: 'Cancel', exact: true }).last().click()
  await potret('pengumuman-daftar-en-terang-1440')

  // 7. Sakelar: kartu Akun internal.
  for (const t of ['terang', 'gelap']) {
    awal()
    await tema(t === 'gelap' ? 'dark' : 'light')
    await lebar(1440)
    await buka('/console/cashflow/sakelar', 'Akun internal')
    await page.getByText('pemilik@contoh.invalid', { exact: true }).waitFor()
    if (t === 'terang') {
      await page.getByRole('button', { name: 'Tambah akun', exact: true }).click()
      await page.locator('#cf-internal-email').fill('tidak.ada@contoh.invalid')
      await page.locator('[data-uji="akun-internal"] form').getByRole('button', { name: 'Simpan', exact: true }).click()
      await page.getByText('Email itu tidak ditemukan di CashFlow.', { exact: true }).first().waitFor()
      cek('email yang tidak ada dijawab dengan kalimat awam', true)
      await page.locator('#cf-internal-email').fill('hello.uji@contoh.invalid')
      await page.locator('#cf-internal-jenis').selectOption('lain')
      await page.locator('#cf-internal-catatan').fill('Kotak masuk tim')
      await page.locator('[data-uji="akun-internal"] form').getByRole('button', { name: 'Simpan', exact: true }).click()
      await page.getByText('hello.uji@contoh.invalid', { exact: true }).waitFor()
      const tambah = simpanan.filter(s => s.name === 'admin_simpan_akun_internal').at(-1)
      cek('tambah lewat email: p_user null, p_email terisi, alasan otomatis', tambah.p.p_user === null && tambah.p.p_email === 'hello.uji@contoh.invalid' && tambah.p.p_jenis === 'lain' && /Tambah akun internal/.test(tambah.p.p_alasan))
      const baris503 = page.locator('[data-uji="akun-internal"] li', { hasText: 'uji.pribadi@contoh.invalid' })
      await baris503.getByRole('button', { name: 'Ubah', exact: true }).click()
      await baris503.locator('input').first().fill('Uji pribadi tanpa ruang usaha')
      await baris503.getByRole('button', { name: 'Simpan', exact: true }).click()
      await page.getByText('Uji pribadi tanpa ruang usaha', { exact: true }).waitFor()
      const ubah = simpanan.filter(s => s.name === 'admin_simpan_akun_internal').at(-1)
      cek('ubah memakai p_user, tanpa p_email', ubah.p.p_user === uuid(503) && ubah.p.p_email === null)
      await page.locator('[data-uji="akun-internal"] li', { hasText: 'peninjau@contoh.invalid' }).getByRole('button', { name: 'Hapus', exact: true }).click()
      await potretKartu('sakelar-internal-hapus-terang-1440', '[data-uji="akun-internal"]')
      await page.locator('[data-uji="akun-internal"] li', { hasText: 'peninjau@contoh.invalid' }).locator('form').getByRole('button', { name: 'Hapus', exact: true }).click()
      await page.getByText('peninjau@contoh.invalid', { exact: true }).waitFor({ state: 'detached' })
      cek('hapus akun internal beralasan', /Hapus akun internal/.test(simpanan.filter(s => s.name === 'admin_hapus_akun_internal').at(-1).p.p_alasan))
    }
    await potretKartu(`sakelar-internal-${t}-1440`, '[data-uji="akun-internal"]')
    await lebar(390)
    cek(`sakelar ${t} tidak meluber di 390`, !(await meluber()))
    await potretKartu(`sakelar-internal-${t}-390`, '[data-uji="akun-internal"]')
  }

  // 8. Server lama: tanpa pilihan aturan, tanpa Segmen, tanpa galat.
  baru = false
  awal()
  await tema('light')
  await lebar(1440)
  await buka('/console/cashflow/pengumuman', 'Pemeliharaan server')
  cek('server lama: tanpa tombol Segmen', !(await page.getByRole('button', { name: 'Segmen', exact: true }).count()))
  cek('server lama: tanpa galat di halaman', !(await page.locator('[role="alert"]').count()))
  await page.getByRole('button', { name: 'Buat pengumuman', exact: true }).click()
  const opsi = await page.locator('#cf-p-penerima option').evaluateAll(o => o.map(x => x.value))
  cek('server lama: pilihan aturan disembunyikan', JSON.stringify(opsi) === JSON.stringify(['all', 'single', 'users', 'groups']))
  cek('server lama: kotak pratinjau penerima tidak tampil', !(await page.locator('[data-uji="pratinjau-penerima"]').count()))
  await page.locator('#cf-p-judul').fill('Pengumuman server lama')
  await page.locator('#cf-p-isi').fill('Tetap tersimpan lewat v3.')
  await page.locator('#cf-p-alasan').fill('Uji server lama')
  await page.getByRole('button', { name: 'Simpan', exact: true }).click()
  await page.locator('#cf-p-judul').waitFor({ state: 'hidden' })
  cek('server lama: simpan lewat v3', simpanan.at(-1).name === 'admin_simpan_pengumuman_v3' && !('p_aturan' in simpanan.at(-1).p))
  await potret('pengumuman-server-lama-terang-1440')
  await buka('/console/cashflow/sakelar', 'Akun internal')
  await page.locator('[data-uji="akun-internal-belum-aktif"]').waitFor()
  cek('server lama: kartu Akun internal menulis belum aktif', true)
  await potretKartu('sakelar-server-lama-terang-1440', '[data-uji="akun-internal"]')

  cek('tanpa galat JavaScript', errors.length === 0)
  hasil.errors = errors
  await writeFile(join(output, 'hasil.json'), JSON.stringify(hasil, null, 2))
  console.log(`${hasil.cek.length} lulus, 0 gagal.`)
} finally {
  if (browser) try { await (await browser.newBrowserCDPSession()).send('Browser.close') } catch { /* sudah tertutup */ }
  chrome.kill()
  if (chrome.exitCode === null) await Promise.race([new Promise(r => chrome.once('exit', r)), new Promise(r => setTimeout(r, 1500))])
  await rm(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
}
