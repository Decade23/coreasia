// Nuxt dev di loopback dengan NUXT_PUBLIC_CASHFLOW_SUPABASE_URL=http://127.0.0.1:4398
// dan NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY=anon-sintetis. Tidak perlu server Supabase.
// CF_QA_ARTIFACTS wajib menunjuk folder hasil lokal.
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'

const APP = 'http://127.0.0.1:4399'
const SUPA = 'http://127.0.0.1:4398'
const output = process.env.CF_QA_ARTIFACTS
assert(output, 'Isi CF_QA_ARTIFACTS.')
await mkdir(output, { recursive: true })
const pwPath = process.env.PLAYWRIGHT_CORE_PATH
const { chromium } = await (pwPath ? import(pathToFileURL(pwPath).href) : import('playwright-core'))
const portServer = createServer()
await new Promise(r => portServer.listen(0, '127.0.0.1', r))
const port = portServer.address().port
await new Promise(r => portServer.close(r))
const profil = await mkdtemp(join(tmpdir(), 'cf-peristiwa-'))
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--user-data-dir=${profil}`, `--remote-debugging-port=${port}`,
  '--no-first-run', '--no-default-browser-check', '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })
const alamatCdp = `http://127.0.0.1:${port}`

const subjek = '00000000-0000-4000-8000-000000000022'
const idKasus = '00000000-0000-4000-8000-000000000033'
const idAdmin = '00000000-0000-4000-8000-000000000044'
const utc = (jam) => `2026-10-08T${jam}Z`
const p360 = `/console/cashflow/pengguna/${subjek}`
const kasus = {
  id: idKasus, induk: null, subjek_tipe: 'user', subjek_id: subjek, ruang: [], jumlah_ruang: 0,
  skenario: 'pengguna_360', preset: 'galat', alasan: 'Penelusuran uji',
  ranah: ['akun', 'transaksi', 'jejak'], tingkat: 'T2', lanjutan_dari: null,
  dibuka: new Date().toISOString(), akar_dibuka: new Date().toISOString(),
  berlaku_sampai: new Date(Date.now() + 3600_000).toISOString(),
  batas_perpanjang: new Date(Date.now() + 7200_000).toISOString(),
  ditutup: null, status: 'aktif', jumlah_terdampak: 1,
}
const peristiwa = (id, jam, sesi, jenis, langkah, kategori, layar, rincian_aman = {}, sumber = 'aplikasi') => ({
  id: id.slice(1).padStart(32, '0'), pada: utc(jam), sumber, jenis, langkah, kategori, layar, rincian_aman, sesi, versi: sesi ? '1.4.1' : null,
  sesi_mulai: sesi ? utc(sesi === 'peluncuran-2' ? '11:11:23' : '11:10:30') : null,
})
const baris = [
  peristiwa('p8', '11:11:29', 'peluncuran-2', 'layar.buka', null, 'aplikasi', '/transactions'),
  peristiwa('p7', '11:11:23', 'peluncuran-2', 'onboarding.langkah', 'aplikasi.versi', 'aplikasi', null, { versi: '1.4.1', platform: 'android' }),
  peristiwa('p6', '11:11:14', 'peluncuran-1', 'nomor_wa.tersimpan', null, 'nomor_wa', null, { cara: 'wa_masuk' }, 'server'),
  peristiwa('p5', '11:11:01', 'peluncuran-1', 'onboarding.langkah', 'nomor_wa.terbalik.buka_wa', 'nomor_wa', '/nomor-wa', { hasil: 'pertama' }),
  peristiwa('p4', '11:10:43', 'peluncuran-1', 'onboarding.langkah', 'nomor_wa.petunjuk', 'nomor_wa', '/nomor-wa', { hasil: 'batal', email: 'contoh-rahasia@contoh.invalid' }),
  peristiwa('p3', '11:10:42', 'peluncuran-1', 'galat.js', null, 'galat', null, { fatal: true }),
  peristiwa('p2', '11:10:32', 'peluncuran-1', 'onboarding.langkah', 'aplikasi.versi', 'aplikasi', null, { versi: '1.4.1' }),
  peristiwa('p1', '11:10:30', 'peluncuran-1', 'layar.buka', null, 'aplikasi', '/'),
]
const langkah = [
  ['lihat', 19, 89.5, 1], ['petunjuk', 16, 87.5, 1], ['pilih', 13, 100, 0], ['kirim', 14, 92.9, 1],
  ['kode_terkirim', 13, 100, 0], ['ketik', 2, 50, 1], ['mulai_terbalik', 2, 100, 0], ['buka_wa', 2, 50, 1],
  ['berhasil', 14, null, 0], ['lewat_email', 1, null, 0], ['hapus_akun', 0, null, 0], ['hubungi', 2, null, 0],
].map(([kunci, orang, lanjut, berhenti]) => ({ kunci, orang, lanjut, berhenti }))

let browser
const cek = []
const lulus = (judul, kondisi) => { assert(kondisi, judul); cek.push(judul) }
try {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(`${alamatCdp}/json/version`)).ok) break } catch { /* Chrome sedang mulai. */ }
    await new Promise(r => setTimeout(r, 100))
  }
  browser = await chromium.connectOverCDP(alamatCdp)
  const ctx = browser.contexts()[0]
  const page = ctx.pages()[0]
  const masa = Math.floor(Date.now() / 1000) + 3600
  const jwt = ['eyJhbGciOiJub25lIn0', Buffer.from(JSON.stringify({ sub: idAdmin, role: 'authenticated', exp: masa })).toString('base64url'), 'test'].join('.')
  const sesi = { access_token: jwt, refresh_token: 'sintetis', expires_at: masa, token_type: 'bearer', user: { id: idAdmin, email: 'admin@contoh.invalid' } }
  await ctx.addInitScript(({ sesi }) => {
    if (location.hostname !== '127.0.0.1') return
    sessionStorage.setItem('cf-console-sesi', JSON.stringify(sesi))
    const view = localStorage.getItem('cf-uji-view') === 'ya'
    sessionStorage.setItem('cf_izin', JSON.stringify(view ? ['cashflow:view'] : ['cashflow:view', 'cashflow:pii']))
    Object.defineProperty(navigator.clipboard, 'writeText', { value: async teks => { window.salinanUji = teks } })
    addEventListener('DOMContentLoaded', () => {
      const gaya = document.createElement('style')
      gaya.textContent = '[id^="nuxt-devtools"]{display:none!important}'
      document.head.append(gaya)
    })
  }, { sesi })
  await ctx.route('**/*', r => [APP, SUPA].includes(new URL(r.request().url()).origin) ? r.continue() : r.abort())
  await page.route('**/api/gw/**', r => r.fulfill({ status: 404, json: { error: 'Gateway sintetis' } }))
  let adaPii = true
  await page.route('**/api/gw/admin/auth/me', r => r.fulfill({ json: { data: {
    id: idAdmin, email: 'admin@contoh.invalid', full_name: 'Admin Contoh', role: 'super_admin',
    is_active: true, mfa: adaPii, mfa_at: adaPii ? new Date().toISOString() : null,
    totp_enabled_at: '2026-01-01T00:00:00Z',
  } } }))
  const panggilan = []
  const galat = []
  page.on('pageerror', e => galat.push(e.message))
  await page.route(`${SUPA}/**`, async r => {
    const req = r.request()
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' }
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers })
    const nama = new URL(req.url()).pathname.split('/').pop()
    const p = req.postDataJSON() || {}
    panggilan.push({ nama, p })
    let data = null
    if (nama === 'admin_pengguna_kepala') data = {
      user_id: subjek, email: 'uj***@contoh.invalid', daftar: utc('09:00:00'), ruang: [],
      jumlah_ruang: 0, jumlah_transaksi: 0, akses_30hari: 0,
    }
    if (nama === 'admin_kasus_aktif') data = { kasus, investigasi: [] }
    if (nama === 'admin_pengguna_360') data = {
      kasus: idKasus, akun: { user_id: subjek, email: 'uji@contoh.invalid', display_name: 'Pengguna Contoh', sesi: {} },
      hitung: { ruang: 0, ruang_dalam_lingkup: 0, transaksi: 0, jejak: 0, sampah: 0 }, total: {}, ruang: [],
    }
    if (nama === 'admin_perjalanan_pengguna') {
      const daftar = baris.filter(b => (!p.p_hanya_galat || b.kategori === 'galat') && (!p.p_kategori || p.p_kategori.includes(b.kategori)))
      const awal = !p.p_kursor
      data = {
        baris: awal ? daftar.slice(0, 6) : daftar.slice(6), halaman_pertama: awal,
        kursor_berikut: awal && daftar.length > 6 ? { p: daftar[5].pada, i: daftar[5].id } : null,
        akun_internal: true, telemetri_sejak: '2026-07-16T04:00:00Z',
      }
    }
    if (nama === 'admin_corong_alur') data = {
      alur: 'nomor_wa', dari: p.p_dari, sampai: p.p_sampai, batas_akhir: p.p_batas_akhir, total: { cara: null, versi: null, langkah },
      pecahan: [{ cara: 'wa_masuk', versi: '1.4.1', langkah: langkah.filter(l => ['lihat', 'buka_wa', 'berhasil'].includes(l.kunci)) }],
      telemetri: { 'nomor_wa.lihat': 24, 'nomor_wa.petunjuk': 16 },
    }
    if (nama === 'admin_corong_buka_kasus') data = kasus
    return r.fulfill({ headers, json: data })
  })

  const ke = path => page.goto(`${APP}${path}`, { waitUntil: 'domcontentloaded' })
  const potret = async (nama) => {
    await page.evaluate(() => scrollTo(0, 0))
    lulus(`${nama} tidak meluber`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.screenshot({ path: join(output, `${nama}.png`), fullPage: true })
  }
  const jejak = `${p360}/perjalanan`
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width > 500 ? 900 : 844 })
    for (const theme of ['light', 'dark']) {
      await ctx.addCookies([
        { name: 'coreasia-theme', value: theme, url: APP },
        { name: 'coreasia-locale', value: 'id', url: APP },
      ])
      await ke(jejak)
      await page.getByText('Nomor WhatsApp tersimpan lewat cara kirim pesan', { exact: true }).first().waitFor()
      await page.locator('summary').filter({ hasText: 'Menutup pilihan nomor dari Google' }).click()
      lulus(`tab Perjalanan terlihat pada ${width} ${theme}`, await page.getByRole('navigation', { name: 'Tab pengguna' })
        .getByRole('link', { name: 'Perjalanan' }).evaluate(el => {
          const tab = el.getBoundingClientRect()
          const nav = el.closest('nav').getBoundingClientRect()
          return tab.left >= nav.left - 1 && tab.right <= nav.right + 1
        }))
      lulus(`tema ${theme} ${width}`, await page.locator('html').getAttribute('data-theme') === theme)
      await potret(`perjalanan-${width}-${theme}`)
      await ke('/console/cashflow/corong')
      await page.getByRole('rowheader', { name: 'Nomor tersimpan' }).waitFor()
      await potret(`corong-${width}-${theme}`)
    }
  }
  await ke(jejak)
  await page.locator('summary').filter({ hasText: 'Menutup pilihan nomor dari Google' }).click()
  await page.getByRole('button', { name: 'Salin jejak' }).click()
  const salinan = await page.evaluate(() => window.salinanUji)
  lulus('salinan memakai WIB, rincian yang dibuka, dan tidak membawa identitas', salinan.includes('18.10.43 WIB') &&
    salinan.includes('Menutup pilihan nomor dari Google') && !salinan.includes('@') && !salinan.includes(idKasus))
  await page.getByRole('button', { name: 'Berikutnya', exact: true }).click()
  await page.getByText('Membuka Beranda', { exact: true }).waitFor()
  lulus('halaman berikutnya mengirim kursor dengan kasus yang sama', panggilan.some(({ nama, p }) =>
    nama === 'admin_perjalanan_pengguna' && p.p_kasus === idKasus && p.p_kursor?.i === '3'.padStart(32, '0')))
  await page.getByRole('checkbox', { name: 'Hanya galat' }).check()
  await page.getByText('Galat aplikasi', { exact: true }).waitFor()
  lulus('filter galat kembali ke halaman pertama', panggilan.some(({ nama, p }) =>
    nama === 'admin_perjalanan_pengguna' && p.p_hanya_galat && !p.p_kursor))

  await ke('/console/cashflow/corong')
  await page.getByRole('rowheader', { name: 'Nomor tersimpan' }).waitFor()
  await page.getByLabel('Jam akhir (WIB, opsional)').fill('19:25')
  await page.waitForFunction(() => new URLSearchParams(location.search).get('jam') === '19:25')
  await page.getByRole('rowheader', { name: 'Nomor tersimpan' }).waitFor()
  lulus('jam akhir WIB dipakai sebagai batas RPC', panggilan.some(({ nama, p }) =>
    nama === 'admin_corong_alur' && p.p_batas_akhir?.endsWith('T12:25:00.000Z')))
  await page.getByLabel('Cara dan versi aplikasi').selectOption({ label: 'Kirim pesan · 1.4.1' })
  lulus('memilih pecahan cara dan versi mengubah tabel', await page.locator('tbody tr').count() === 3)
  await page.getByRole('button', { name: 'Selidiki 1 orang yang berhenti pada langkah Membuka WhatsApp' }).click()
  const dialog = page.getByRole('dialog', { name: 'Buka kasus' })
  lulus('alasan wajib sebelum membuka kasus', await dialog.getByRole('button', { name: 'Buka kasus' }).isDisabled())
  await dialog.getByLabel('Alasan membuka kasus').fill('Periksa orang yang berhenti')
  await dialog.getByRole('button', { name: 'Buka kasus' }).click()
  await page.waitForURL(url => url.pathname === jejak && url.searchParams.has('dari') && url.searchParams.has('sampai'))
  lulus('drilldown membuka satu kasus sebelum menampilkan Perjalanan', panggilan.some(({ nama, p }) =>
    nama === 'admin_corong_buka_kasus' && p.p_cara === 'wa_masuk' && p.p_versi === '1.4.1' &&
    p.p_posisi === 1 && p.p_batas_akhir?.endsWith('T12:25:00.000Z') && p.p_alasan === 'Periksa orang yang berhenti'))

  adaPii = false
  await page.evaluate(() => localStorage.setItem('cf-uji-view', 'ya'))
  await ke('/console/cashflow/corong')
  await page.getByRole('rowheader', { name: 'Nomor tersimpan' }).waitFor()
  lulus('izin view tetap mendapat hitungan tanpa tombol membuka kasus', await page.getByRole('button', { name: /Selidiki/ }).count() === 0)
  await ctx.addCookies([{ name: 'coreasia-locale', value: 'en', url: APP }])
  await ke('/console/cashflow/corong')
  await page.getByRole('heading', { name: 'WhatsApp funnel' }).waitFor()
  await page.getByRole('rowheader', { name: 'Number saved' }).waitFor()
  lulus('lokalisasi Inggris tampil', await page.getByRole('rowheader', { name: 'Number saved' }).isVisible())
  assert.deepEqual(galat, [], 'Galat JavaScript halaman')
  await writeFile(join(output, 'hasil-headless.json'), JSON.stringify({ cek, galat }, null, 2) + '\n')
  console.log(`${cek.length} pemeriksaan lulus.`)
} finally {
  if (browser) await browser.close().catch(() => {})
  chrome.kill()
  await rm(profil, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
}
