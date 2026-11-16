// Uji tampilan tabel dan daftar console CashFlow dengan data sintetis: tabel
// bersama (kepala satu baris, baris dua tingkat, angka rata kanan), deret pil,
// keadaan memuat, kosong, galat, dan akses terbatas, daftar Pengguna tujuh
// kolom dengan pilihan Urut dan panel Saring, kartu ponsel, panel Arti tiap
// kolom, rincian pengguna, dan Ringkasan. Terang dan gelap, lebar 1440 dan 390.
// Chrome headless lewat CDP, tanpa jendela.
//
// Yang dituntut: tabel Pengguna TIDAK bergulir ke samping di 1440 (gulir 0),
// email 38 huruf tampil utuh, dan tidak ada halaman yang meluber di 390.
//
// Jalankan server lokal TANPA .env (tidak ada kunci sungguhan):
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_URL=http://127.0.0.1:4398 \
//   NUXT_PUBLIC_CASHFLOW_SUPABASE_ANON_KEY=anon-sintetis \
//   npx nuxi dev --port 4399 --host 127.0.0.1
// lalu:
//   PLAYWRIGHT_CORE_PATH=<playwright-core/index.mjs> CF_QA_ARTIFACTS=<folder> \
//   node scripts/uji-console-tabel-daftar-headless.mjs
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
const dir = await mkdtemp(join(process.env.CF_QA_TMP || tmpdir(), 'cf-tabel-daftar-'))
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--user-data-dir=${dir}`, `--remote-debugging-port=${cdpPort}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

// ── Data sintetis (karangan, waktunya tetap supaya potret bisa dibandingkan) ──
const SAAT = Date.parse('2026-11-16T05:00:00Z')
const jam = j => new Date(SAAT - j * 3_600_000).toISOString()
const uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
/* Sepuluh akun karangan. Email terpanjang 38 huruf. Nama, angka, dan status dibuat beragam. */
const AKUN = [
  { email: 'sari@contoh.invalid', nama: 'Sari Wulandari', wa: 'masuk', tanya: 412, tiga: 96, sisa: 37, beli: 3 },
  { email: 'rahmawati.kusumaningsih@contoh.invalid', nama: 'Rahmawati Kusumaningsih Putri Handayani', wa: 'kirim', tanya: 42, tiga: 9, sisa: 8, beli: 0, kira: true },
  { email: 'tim.uji@contoh.invalid', nama: 'Akun uji internal', wa: 'kirim', tanya: 1280, tiga: 310, sisa: 9999, beli: 0, tim: true },
  { email: 'dewi@contoh.invalid', nama: 'Dewi Lestari', wa: 'belum', tanya: 0, tiga: 0, sisa: 20, beli: 0, ios: true },
  { email: 'raka@contoh.invalid', nama: 'Raka Pratama', wa: 'lewat', tanya: 3, tiga: 3, sisa: 17, beli: 0 },
  { email: 'toko.berkah.jaya.abadi@contoh.invalid', nama: 'Toko Berkah Jaya Abadi', wa: 'masuk', tanya: 58, tiga: 0, sisa: 0, beli: 1, tangguh: true, ramai: true },
  { email: 'agus@contoh.invalid', nama: 'Agus Setiawan', wa: 'kirim', tanya: 14, tiga: 2, sisa: 70, beli: 2, ios: true },
  { email: 'nina@contoh.invalid', nama: 'Nina Maharani', wa: 'masuk', tanya: 0, tiga: 0, sisa: null, beli: 0 },
  { email: 'yoga@contoh.invalid', nama: '', wa: 'lewat', lewat: 'tanpa_nomor', tanya: 9, tiga: 1, sisa: 61, beli: 0, hapus: true, ditahan: true },
  { email: 'lina@contoh.invalid', nama: 'Lina Marlina', wa: 'belum', tanya: 1, tiga: 1, sisa: 19, beli: 0 },
]
const EMAIL_PANJANG = AKUN[1].email
if (EMAIL_PANJANG.length !== 38) throw new Error(`Email uji harus 38 huruf, ini ${EMAIL_PANJANG.length}`)
const samar = e => `${e.slice(0, 3)}***@${e.split('@')[1]}`
const barisPengguna = (a, i, { v4, alasan, pii }) => {
  const dasar = {
    user_id: uuid(i + 1), email: alasan ? a.email : samar(a.email), display_name: alasan ? a.nama : '',
    created_at: jam(24 * (i + 3) * 9), last_sign_in: jam(5 * (i + 1)), aktivitas_terakhir: jam(4 * (i + 1)),
    banned_until: a.tangguh || a.hapus ? jam(-24 * 365) : null, menunggu_hapus: !!a.hapus,
    jumlah_ruang: pii ? [3, 2, 12, 1, 1, 4, 1, 1, 2, 1][i] : null, jumlah_tx: pii ? [1240, 86, 4310, 0, 12, 978, 44, 7, 133, 3][i] : null,
    jumlah_nominal: pii ? [184_250_000, 9_400_000, 2_415_000_000, 0, 1_250_000, 612_900_000, 4_800_000, 350_000, 27_600_000, 95_000][i] : null,
    terbuka: !!alasan,
    nomor_wa: a.wa === 'masuk' || a.wa === 'kirim' ? (alasan ? `62811000${1000 + i}` : `0811 •••• ${1000 + i}`) : null,
    versi_aplikasi: i % 3 ? '1.4.1' : '1.4.0', platform: a.ios ? 'ios' : i === 2 ? 'android-uat' : 'android',
    status_wa: a.wa, status_wa_pada: a.wa === 'belum' ? null : jam(24 * (i + 2)), lewat_sebab: a.wa === 'lewat' ? (a.lewat ?? 'gangguan') : null,
    nomor_ramai: !!a.ramai, kredit_ditahan: !!a.ditahan,
  }
  if (!v4) return dasar
  return {
    ...dasar,
    domi_tanya: pii ? a.tanya : null, domi_tanya_30: pii ? a.tiga : null, domi_tanya_kira: pii ? !!a.kira : null,
    domi_terakhir: pii && a.tanya ? jam(7 * (i + 1)) : null,
    kredit_sisa: pii ? a.sisa : null, kredit_beli: pii ? a.beli : null, internal: !!a.tim,
  }
}
const RUANG = [
  ['Kel***', 'sar***@contoh.invalid', 'keluarga', 4, 1240, 1], ['Tok*** *** *** *** *** *** ***', 'tok***@contoh.invalid', 'usaha', 12, 48_213, 3],
  ['Pri***', 'rah***@contoh.invalid', 'pribadi', 1, 86, 0], ['Aru*** *** ***', 'agu***@contoh.invalid', 'komunitas', 38, 7_902, 5],
  ['War*** *** ***', 'nin***@contoh.invalid', 'usaha', 3, 512, 0], ['Tab***', 'dew***@contoh.invalid', 'pribadi', 1, 0, 0],
].map((r, i) => ({ workspace_id: uuid(100 + i), nama: r[0], pemilik_email: r[1], jenis: r[2], jumlah_anggota: r[3], jumlah_tx: r[4], undangan_aktif: r[5], created_at: jam(24 * (i + 1) * 17), total_semua: 6 }))
const PEMBELIAN = [
  { status: 'lunas', jalur: 'play', paket: 'kredit_123', kredit: 123, nominal: 99_000, siapa: 1, play: true },
  { status: 'lunas', jalur: 'qris', paket: 'kredit_70', kredit: 70, nominal: 59_000, siapa: 0 },
  { status: 'menunggu', jalur: 'qris', paket: 'kredit_30', kredit: 30, nominal: 29_000, siapa: 5 },
  { status: 'batal', jalur: 'play', paket: 'kredit_70', kredit: 70, nominal: 59_000, siapa: 6, play: true, batal: true },
  { status: 'kedaluwarsa', jalur: 'qris', paket: 'kredit_1000_promo', kredit: 1000, nominal: 1_499_000, siapa: 2, uji: true },
].map((p, i) => ({
  id: uuid(200 + i), kode: `CF${4821 + i}`, waktu: jam(3 + i * 11), status: p.status, jalur: p.jalur, paket: p.paket, kredit: p.kredit, nominal: p.nominal, uji: !!p.uji,
  pembeli: { user_id: uuid(p.siapa + 1), email: AKUN[p.siapa].email, nama: AKUN[p.siapa].nama },
  play: p.play ? {
    order: `GPA.3300-1111-2222-${33330 + i}`, dikonsumsi: !p.batal, batal_pada: p.batal ? jam(1 + i * 11) : null,
    harga_mikro: p.nominal * 1_000_000, mata_uang: 'IDR', pajak_mikro: Math.round(p.nominal * 0.11) * 1_000_000, total_mikro: Math.round(p.nominal * 1.11) * 1_000_000,
    diterima_mikro: Math.round(p.nominal * 0.85) * 1_000_000, sumber_harga: 'google',
    google_lunas_pada: jam(3 + i * 11), rtdn_pada: jam(3 + i * 11 - 0.01), aplikasi_lapor_pada: jam(3 + i * 11 - 0.02), kredit_masuk_pada: jam(3 + i * 11 - 0.03),
  } : null,
}))
const PAKET = [
  { kode: 'kredit_30', kredit: 30, harga: 29_000, urutan: 10, terjual: 214, bawaan: false, play: 'kredit_30' },
  { kode: 'kredit_70', kredit: 70, harga: 59_000, urutan: 20, terjual: 1_048, bawaan: true, label: 'Paling laris', play: 'kredit_70', promo: 49_000 },
  { kode: 'kredit_123', kredit: 123, harga: 99_000, urutan: 30, terjual: 96, bawaan: false, play: 'kredit_123' },
  { kode: 'kredit_1000_promo', kredit: 1000, harga: 1_499_000, urutan: 40, terjual: 0, bawaan: false, aktif: false, uji: true },
].map(p => ({
  kode: p.kode, kredit: p.kredit, harga: p.harga, harga_promo: p.promo ?? null, promo_mulai: p.promo ? jam(48) : null, promo_sampai: p.promo ? jam(-240) : null,
  label: p.label ?? null, bawaan: p.bawaan, aktif: p.aktif ?? true, khusus_uji: !!p.uji, urutan: p.urutan, diubah: jam(30), diubah_oleh: 'admin@contoh.invalid',
  play_produk_id: p.play ?? null, efektif: p.promo ?? p.harga, promo: p.promo ? 'berjalan' : 'tanpa', terjual: p.terjual, pernah_dibeli: p.terjual > 0,
}))
const AUDIT = [
  ['lihat_kepala', 'user', 0, ['akun'], 'Pengguna 360 dibuka otomatis dari daftar pengguna'],
  ['baca_daftar_kontak', null, null, [], 'Kontak lengkap (email dan WhatsApp) di daftar pengguna Console'],
  ['set_ai_paket', 'ai_paket', null, [], 'Promo akhir tahun untuk paket 70 kredit, berlaku sampai 31 Des'],
  ['baca_transaksi', 'user', 5, ['akun', 'transaksi', 'dompet'], 'Tiket 4821, pelapor meminta pengecekan transaksi ganda di ruang usaha yang dipakai bersama tiga anggota lain'],
  ['hapus_akun_permanen', 'user', 8, ['akun'], 'Permintaan hapus akun dari pengguna, sudah lewat masa tunggu'],
  ['batas_akses', null, null, [], null],
].map((a, i) => ({
  id: 9000 - i, admin_id: uuid(900), pelaku: i % 2 ? 'admin.kedua@contoh.invalid' : 'admin@contoh.invalid', action: a[0], target_type: a[1],
  target_id: a[2] === null ? null : uuid(a[2] + 1), target_email: a[2] === null ? null : samar(AKUN[a[2]].email), detail: null, reason: a[4], alasan_utuh: i !== 3,
  ranah: a[3], kasus: a[3].length ? uuid(700 + i) : null, terdampak: null, jumlah_terdampak: i === 3 ? 4 : null, created_at: jam(2 + i * 5), total_semua: 6,
}))
const KASUS = [
  ['aktif', 'keluhan', ['akun', 'transaksi'], 0, 'Tiket 4821, pelapor meminta pengecekan transaksi ganda'],
  ['ditutup', 'pembayaran', ['akun'], 5, 'Pembelian kredit lunas tetapi kredit belum masuk'],
  ['kedaluwarsa', 'galat', ['akun', 'jejak'], 1, 'Aplikasi menutup sendiri saat memindai struk, dilaporkan lewat WhatsApp dukungan'],
].map((k, i) => ({
  id: uuid(700 + i), induk: null, pelaku: 'admin@contoh.invalid', subjek_tipe: 'user', subjek_id: uuid(k[3] + 1), subjek_label: samar(AKUN[k[3]].email),
  ruang: [uuid(100 + i)], jumlah_ruang: 1 + i, skenario: 'pengguna_360', preset: k[1], alasan: k[4], alasan_utuh: true, ranah: k[2], tingkat: 'T1',
  jumlah_terdampak: i === 0 ? 3 : null, lanjutan_dari: null, dibuka: jam(1 + i * 30), berlaku_sampai: jam(-2 + i * 30), ditutup: i === 1 ? jam(20) : null,
  status: k[0], milik_saya: true, total_semua: 3,
}))
const RPC = {
  admin_stats: () => ({
    total_pengguna: 1248, total_ruang: 1610, total_transaksi: 48213,
    transaksi_per_hari: Array.from({ length: 30 }, (_, i) => ({ tanggal: new Date(SAAT - (29 - i) * 86_400_000).toISOString().slice(0, 10), jumlah: 900 + ((i * 137) % 420) })),
  }),
  admin_ukuran_keberhasilan_v2: () => [{ jumlah: 412, pembanding: 380, jumlah_pengecualian: 4 }],
  admin_corong_aktivasi: () => [
    { urut: 1, langkah: 'daftar', jumlah: 320 }, { urut: 2, langkah: 'masuk_lagi', jumlah: 301 }, { urut: 3, langkah: 'menyiapkan', jumlah: 262 },
    { urut: 4, langkah: 'tx_pertama', jumlah: 214 }, { urut: 5, langkah: 'sepuluh_tx', jumlah: 97 },
  ],
  admin_retensi: () => Array.from({ length: 6 }, (_, i) => ({
    kohort: `2026-${String(6 + i).padStart(2, '0')}-01`, mendaftar: 150 + i * 22, pernah_catat: 110 + i * 15, catat_30hari: 60 + i * 9, bulan_berjalan: i === 5,
  })),
  admin_daftar_ruang_v2: () => RUANG,
  admin_ai_pembelian_daftar: () => ({ baris: PEMBELIAN, ringkas: { lunas: 2, nominal_lunas: 158_000, perkiraan_diterima: 143_150, batal: 1 }, lanjut: null }),
  admin_ai_paket_daftar: () => ({ paket: PAKET, kini: new Date(SAAT).toISOString() }),
  admin_daftar_audit_v3: () => AUDIT,
  admin_daftar_aksi_audit: () => [...new Set(AUDIT.map(a => a.action))].map(action => ({ action, jumlah: AUDIT.filter(a => a.action === action).length })),
  admin_daftar_kasus: () => KASUS,
  admin_pengguna_kepala: p => ({
    user_id: p.p_user, email: samar(AKUN[0].email), daftar: jam(24 * 27), masuk_terakhir: jam(5), banned_until: null,
    jumlah_ruang: 3, jumlah_transaksi: 1240, akses_30hari: 2, ruang: [], nomor_wa: '6281100001000',
  }),
}

let browser
const hasil = {}
try {
  for (let i = 0; i < 100; i++) { try { const r = await fetch(`http://127.0.0.1:${cdpPort}/json/version`); if (r.ok) break } catch { /* Chrome belum siap. */ } await new Promise(r => setTimeout(r, 100)) }
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`)
  const ctx = browser.contexts()[0]
  const page = ctx.pages()[0]
  const jwt = ['eyJhbGciOiJub25lIn0', Buffer.from(JSON.stringify({ sub: uuid(900), role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'test'].join('.')
  const session = { access_token: jwt, refresh_token: 'test-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user: { id: uuid(900), aud: 'authenticated', role: 'authenticated', email: 'admin@contoh.invalid' } }
  let izin = ['cashflow:view', 'cashflow:pii', 'cashflow:investigasi', 'cashflow:tindak', 'cashflow:ekspor']
  await ctx.addInitScript(({ session }) => {
    if (location.protocol !== 'http:') return
    sessionStorage.setItem('cf-console-sesi', JSON.stringify(session))
    // Panel devtools server dev menutupi isi tangkapan layar. Transisi dimatikan supaya potret stabil.
    addEventListener('DOMContentLoaded', () => {
      const gaya = document.createElement('style')
      gaya.textContent = '[id^="nuxt-devtools"]{display:none!important}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'
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
  const me = mfa => ({ data: { id: 'admin-test', email: 'admin@contoh.invalid', full_name: 'Admin Contoh', role: 'super_admin', is_active: true, mfa, mfa_at: mfa ? new Date().toISOString() : null, totp_enabled_at: mfa ? '2026-01-01T00:00:00Z' : null, totp_enabled: mfa } })
  let mfa = true
  await page.route('**/api/gw/**', r => r.fulfill({ status: 404, json: { error: 'gateway sintetis' } }))
  await page.route('**/api/gw/admin/auth/me', r => r.fulfill({ json: me(mfa) }))

  /** Keadaan server tiruan untuk daftar pengguna. */
  const server = { v4: true, kosong: false, galat: false, tahan: null }
  const seen = []
  const errors = []
  page.on('pageerror', e => errors.push(`${new URL(page.url()).pathname}: ${e.message}`))
  const cors = { 'access-control-allow-origin': '*' }
  await page.route(`${SUPABASE}/**`, async (r) => {
    const req = r.request()
    if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' } })
    const name = new URL(req.url()).pathname.split('/').pop()
    const p = req.postDataJSON() || {}
    seen.push({ name, p })
    if (name !== 'admin_daftar_pengguna_v3' && name !== 'admin_daftar_pengguna_v4') {
      // RPC yang tidak dikarang menjawab kosong: daftar kosong atau objek kosong.
      const kosong = /^admin_(daftar_|ocr_|foto_|telemetri_)/.test(name) ? [] : {}
      return r.fulfill({ json: RPC[name] ? RPC[name](p) : kosong, headers: cors })
    }
    const baru = name === 'admin_daftar_pengguna_v4'
    if (baru && !server.v4) return r.fulfill({ status: 404, headers: cors, json: { code: 'PGRST202', details: null, hint: null, message: `Could not find the function public.${name} in the schema cache` } })
    if (server.tahan) await server.tahan
    if (server.galat) return r.fulfill({ status: 500, headers: cors, json: { code: 'XX000', message: 'galat sintetis' } })
    const pii = izin.includes('cashflow:pii')
    const urutV4 = ['domi', 'domi_terakhir', 'kredit']
    const segV4 = ['pakai_domi', 'beli_kredit']
    const asing = urutV4.includes(p.p_urut) || segV4.includes(p.p_segmen) || (p.p_filter && 'internal' in p.p_filter)
    if (!baru && asing) return r.fulfill({ status: 400, headers: cors, json: { code: '22023', message: 'Saringan tidak dikenal.', hint: 'saringan' } })
    const pribadi = ['ruang', 'tx', 'nominal', ...urutV4].includes(p.p_urut) || ['catat7', 'belum', ...segV4].includes(p.p_segmen) || !!p.p_alasan
    if (!pii && pribadi) return r.fulfill({ status: 403, headers: cors, json: { code: '42501', message: 'izin-kurang', hint: 'izin-kurang' } })
    let rows = server.kosong ? [] : AKUN.map((a, i) => ({ a, i, d: barisPengguna(a, i, { v4: baru, alasan: p.p_alasan, pii }) }))
    if (p.p_cari) rows = rows.filter(x => x.a.email.includes(p.p_cari))
    if (p.p_segmen === 'pakai_domi') rows = rows.filter(x => x.a.tanya > 0)
    if (p.p_segmen === 'beli_kredit') rows = rows.filter(x => x.a.beli > 0)
    if (p.p_segmen === 'ditangguhkan') rows = rows.filter(x => x.a.tangguh)
    if (p.p_segmen === 'belum_wa') rows = rows.filter(x => x.a.wa === 'belum' || x.a.wa === 'lewat')
    if (p.p_filter?.internal) rows = rows.filter(x => !!x.a.tim === (p.p_filter.internal === 'ya'))
    if (p.p_filter?.status_wa) rows = rows.filter(x => x.a.wa === p.p_filter.status_wa)
    if (p.p_filter?.email) rows = rows.filter(x => x.a.email.includes(p.p_filter.email))
    if (p.p_filter?.status) rows = rows.filter(x => (p.p_filter.status === 'ditangguhkan' ? x.a.tangguh : p.p_filter.status === 'menunggu_hapus' ? x.a.hapus : !x.a.tangguh && !x.a.hapus))
    const arah = p.p_arah === 'asc' ? 1 : -1
    const menurut = { domi: x => x.a.tanya, kredit: x => x.a.sisa ?? -1, tx: x => x.d.jumlah_tx ?? 0, nominal: x => x.d.jumlah_nominal ?? 0, ruang: x => x.d.jumlah_ruang ?? 0, domi_terakhir: x => (x.a.tanya ? -x.i : -99) }[p.p_urut]
    if (menurut) rows.sort((x, y) => arah * (menurut(x) - menurut(y)))
    if (p.p_urut === 'email') rows.sort((x, y) => arah * x.a.email.localeCompare(y.a.email))
    return r.fulfill({ headers: cors, json: {
      total: rows.length, baris: rows.map(x => ({ ...x.d, total_semua: rows.length })),
      versi_terbaru: { android: '0001000400010000100000', ios: '0001000400010000100000' }, hapus_tersedia: true,
      ...(baru ? { jumlah_pakai_domi: pii ? AKUN.filter(a => a.tanya > 0 && !a.tim).length : null } : {}),
    } })
  })

  const tema = async (t) => {
    await ctx.clearCookies()
    await ctx.addCookies([{ name: 'coreasia-theme', value: t === 'terang' ? 'light' : 'dark', domain: '127.0.0.1', path: '/' }])
  }
  const lebar = async (w) => { await page.setViewportSize({ width: w, height: w > 500 ? 900 : 844 }); await page.waitForTimeout(250) }
  const meluber = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  const potret = async (nama) => {
    await page.evaluate(() => { scrollTo(0, 0); document.activeElement?.blur?.() })
    await page.waitForTimeout(500)
    await page.screenshot({ path: join(output, `${nama}.png`), fullPage: true })
  }
  const gagal = (pesan) => { throw new Error(pesan) }
  const buka = async (jalur) => {
    await page.goto(`${APP}${jalur}`, { waitUntil: 'domcontentloaded' })
    await page.locator('h1').first().waitFor({ timeout: 60000 })
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(600)
  }
  const daftar = () => seen.filter(x => x.name === 'admin_daftar_pengguna_v4' || x.name === 'admin_daftar_pengguna_v3')
  const terkirim = async (cocok) => {
    for (let i = 0; i < 60; i++) { const t = daftar().at(-1); if (t && cocok(t.p)) return true; await page.waitForTimeout(100) }
    return false
  }
  const kepalaTabel = () => page.locator('.ca-daftar-pengguna thead th').evaluateAll(th => th.map(x => x.innerText.trim()))
  /** Kepala kolom: tidak huruf besar semua dan tidak pecah baris, di tabel mana pun pada halaman ini. */
  const periksaKepala = async (nama) => {
    const buruk = await page.locator('.ca-console-main thead th').evaluateAll(th => th.filter(x => x.offsetParent !== null).map((x) => {
      const g = getComputedStyle(x)
      const isi = x.querySelector('button') ?? x
      return { teks: x.innerText.trim(), besar: getComputedStyle(isi).textTransform, tinggi: Math.round(x.getBoundingClientRect().height), nowrap: g.whiteSpace }
    }).filter(k => k.teks && (k.besar === 'uppercase' || k.nowrap !== 'nowrap' || k.tinggi > 48)))
    if (buruk.length) gagal(`${nama}: kepala kolom huruf besar atau pecah baris ${JSON.stringify(buruk)}`)
  }

  // 1. Halaman daftar: Pengguna, Ruang, Pembelian, Paket, Audit, Kasus, Ringkasan. Terang dan gelap, 1440 dan 390.
  const HALAMAN = [
    { nama: 'pengguna', jalur: '/console/cashflow/pengguna', tunggu: () => page.getByText('10 pengguna', { exact: true }).waitFor({ timeout: 60000 }) },
    { nama: 'ruang', jalur: '/console/cashflow/ruang', tunggu: () => page.getByText('Tok***', { exact: false }).first().waitFor() },
    { nama: 'pembelian', jalur: '/console/cashflow/pembelian', tunggu: () => page.locator('[data-uji="pembelian-tabel"]').waitFor() },
    { nama: 'paket', jalur: '/console/cashflow/paket', tunggu: () => page.getByText('kredit_1000_promo', { exact: true }).waitFor() },
    { nama: 'audit', jalur: '/console/cashflow/audit', tunggu: () => page.getByText('hapus_akun_permanen', { exact: true }).first().waitFor() },
    { nama: 'kasus', jalur: '/console/cashflow/kasus?lingkup=semua', tunggu: () => page.getByText('Tiket 4821', { exact: false }).first().waitFor() },
    { nama: 'ringkasan', jalur: '/console/cashflow', tunggu: () => page.getByText('Menyiapkan dompet/ruang', { exact: true }).waitFor() },
  ]
  for (const t of ['terang', 'gelap']) {
    await tema(t)
    for (const h of HALAMAN) {
      await lebar(1440)
      await buka(h.jalur)
      await h.tunggu()
      if (await meluber()) gagal(`${h.nama} ${t}: halaman meluber di 1440`)
      await periksaKepala(`${h.nama} ${t}`)
      if (h.nama === 'pengguna') {
        const kolom = await kepalaTabel()
        if (kolom.join('|') !== 'Pengguna|WhatsApp|Versi|Aktif terakhir|Tanya Domi|Kredit|Ruang|Buka') gagal(`Kolom pengguna: ${kolom.join('|')}`)
        // Keputusan pemilik: tabel pengguna tidak boleh bergulir ke samping di 1440.
        const gulir = await page.locator('.ca-daftar-pengguna .ca-console-table-wrap').evaluate(w => w.scrollWidth - w.clientWidth)
        hasil[`gulirTabel1440_${t}`] = gulir
        if (gulir !== 0) gagal(`Tabel pengguna ${t} bergulir ke samping ${gulir}px di 1440`)
        hasil[`lebarKolom1440_${t}`] = (await page.locator('.ca-daftar-pengguna thead th').evaluateAll(th => th.map(x => Math.round(x.getBoundingClientRect().width)))).join(' ')
      }
      if (h.nama === 'ringkasan') {
        // Label ubin tidak huruf besar semua.
        const besar = await page.locator('.ca-console-stat p').evaluateAll(p => p.filter(x => getComputedStyle(x).textTransform === 'uppercase').length)
        if (besar) gagal('Ringkasan: label ubin masih huruf besar semua')
      }
      await potret(`${h.nama}-${t}-1440`)
      await lebar(390)
      await page.waitForTimeout(300)
      const luber = await meluber()
      if (luber) gagal(`${h.nama} ${t}: halaman meluber ${luber}px di 390`)
      if (h.nama === 'ringkasan') {
        // Kartu Corong dan Retensi tidak lebih lebar dari layar, dan label corong tidak terpotong.
        const kartu = await page.locator('.ca-console-main section.ca-console-dialog').evaluateAll(s => s.map(x => Math.round(x.getBoundingClientRect().right)))
        if (kartu.some(k => k > 390)) gagal(`Ringkasan ${t}: kartu melewati tepi layar ${kartu}`)
        const label = page.getByText('Menyiapkan dompet/ruang', { exact: true })
        if (await label.evaluate(x => x.scrollWidth > x.clientWidth + 1)) gagal(`Ringkasan ${t}: label corong terpotong di 390`)
      }
      await potret(`${h.nama}-${t}-390`)
    }
  }
  hasil.halaman = 'lulus'

  // 2. Kontak lengkap: email 38 huruf utuh di 1440, tercatat lewat alasan yang sama.
  for (const t of ['terang', 'gelap']) {
    await tema(t)
    await lebar(1440)
    await buka('/console/cashflow/pengguna')
    await page.getByText('10 pengguna', { exact: true }).waitFor({ timeout: 60000 })
    await page.getByText(EMAIL_PANJANG, { exact: true }).first().waitFor({ timeout: 15000 })
    const alasan = daftar().at(-1).p.p_alasan
    // Pelaku ditambahkan di depan alasan oleh lapisan RPC, seperti sebelumnya.
    if (alasan !== '[admin@contoh.invalid] Kontak lengkap (email dan WhatsApp) di daftar pengguna Console') gagal(`Alasan kontak lengkap berubah: ${alasan}`)
    const sel = page.locator('[data-uji="sel-email"]').filter({ hasText: EMAIL_PANJANG })
    const ukur = await sel.evaluate(x => ({ isi: x.scrollWidth, tampak: x.clientWidth, tinggi: Math.round(x.getBoundingClientRect().height) }))
    hasil[`email38_${t}`] = `${ukur.isi}/${ukur.tampak}`
    if (ukur.isi > ukur.tampak) gagal(`Email 38 huruf terpotong di 1440 ${t}: ${ukur.isi} > ${ukur.tampak}`)
    if (ukur.tinggi > 26) gagal(`Email 38 huruf pecah baris di 1440 ${t}`)
    const gulir = await page.locator('.ca-daftar-pengguna .ca-console-table-wrap').evaluate(w => w.scrollWidth - w.clientWidth)
    if (gulir !== 0) gagal(`Kontak lengkap ${t}: tabel bergulir ke samping ${gulir}px di 1440`)
    for (const teks of ['96 dalam 30 hari', 'Belum pernah', 'Pernah beli', 'Gratis', 'Belum ada nomor', 'Lolos saat gangguan', 'Belum dibuktikan', 'Ditangguhkan', 'Menunggu dihapus', 'Nomor dipakai banyak akun', 'Kredit gratis ditahan']) {
      if (!(await page.locator('.ca-daftar-pengguna table').getByText(teks, { exact: true }).first().isVisible())) gagal(`Tabel ${t}: "${teks}" tidak tampil`)
    }
    if (await page.locator('.ca-daftar-pengguna table').getByText('Tim', { exact: true }).count() !== 1) gagal('Lencana Tim tidak tepat satu')
    const kira = await page.locator('.ca-daftar-pengguna tbody tr').filter({ hasText: 'rahmawati' }).locator('td').nth(4).innerText()
    if (!kira.trim().startsWith('42+')) gagal(`Tanda batas bawah hilang: ${kira}`)
    const kreditKosong = await page.locator('.ca-daftar-pengguna tbody tr').filter({ hasText: 'nina@' }).locator('td').nth(5).innerText()
    if (kreditKosong.trim() !== '—') gagal(`Kredit kosong tampil sebagai "${kreditKosong}"`)
    await potret(`pengguna-kontak-lengkap-${t}-1440`)
    await lebar(390)
    if (await meluber()) gagal(`Kontak lengkap ${t} meluber di 390`)
    await potret(`pengguna-kontak-lengkap-${t}-390`)
    // Sakelar dimatikan: kembali tersamar, dan muatan berikutnya tanpa alasan.
    await lebar(1440)
    await page.getByRole('switch', { name: 'Kontak lengkap' }).click()
    if (!(await terkirim(p => p.p_alasan === null))) gagal('Sakelar mati masih mengirim alasan')
    await page.getByText(samar(EMAIL_PANJANG), { exact: true }).first().waitFor()
    if (await page.getByText(EMAIL_PANJANG, { exact: true }).count()) gagal('Sakelar mati: email utuh masih tampil')
    await page.getByRole('switch', { name: 'Kontak lengkap' }).click()
    if (!(await terkirim(p => !!p.p_alasan))) gagal('Sakelar hidup lagi tidak mengirim alasan')
  }
  hasil.kontakLengkap = 'lulus'

  // 3. Urut: semua nilai lewat satu pilihan, parameter yang dikirim sama dengan sebelumnya. Tautan lama tetap bekerja.
  await tema('terang')
  await lebar(1440)
  await buka('/console/cashflow/pengguna')
  await page.getByText('10 pengguna', { exact: true }).waitFor({ timeout: 60000 })
  const pilihan = await page.locator('[data-uji="urut"] option').evaluateAll(o => o.map(x => x.value))
  if (pilihan.join() !== 'email,wa,versi,daftar,aktif,ruang,tx,nominal,domi,domi_terakhir,kredit') gagal(`Pilihan Urut: ${pilihan}`)
  for (const k of pilihan) {
    await page.locator('[data-uji="urut"]').selectOption(k)
    await page.waitForFunction(k => new URL(location.href).searchParams.get('urut') === k || (k === 'daftar' && !location.search.includes('urut=')), k)
    const arah = k === 'email' || k === 'wa' ? 'asc' : 'desc'
    if (!(await terkirim(p => p.p_urut === k && p.p_arah === arah))) gagal(`Urut ${k} mengirim ${JSON.stringify(daftar().at(-1).p)}`)
  }
  // Yang tidak punya kolom tetap terbaca: nilainya di baris kedua.
  await page.locator('[data-uji="urut"]').selectOption('nominal')
  await page.locator('.ca-daftar-pengguna table').getByText('Rp 2,4 M', { exact: true }).waitFor()
  await potret('pengguna-urut-nominal-terang-1440')
  await page.locator('[data-uji="urut"]').selectOption('tx')
  await page.locator('.ca-daftar-pengguna table').getByText('4.310 tx', { exact: true }).waitFor()
  await page.locator('[data-uji="urut"]').selectOption('domi_terakhir')
  await page.locator('.ca-daftar-pengguna table').getByText(/^Terakhir \d/).first().waitFor()
  await potret('pengguna-urut-domi-terakhir-terang-1440')
  // Tombol arah membalik, kepala kolom memakai aturan yang sama.
  await page.locator('[data-uji="urut-arah"]').click()
  if (!(await terkirim(p => p.p_urut === 'domi_terakhir' && p.p_arah === 'asc'))) gagal('Tombol arah tidak membalik urutan')
  await page.locator('.ca-daftar-pengguna thead').getByRole('button', { name: 'Tanya Domi', exact: true }).click()
  if (!(await terkirim(p => p.p_urut === 'domi' && p.p_arah === 'desc'))) gagal('Kepala kolom Tanya Domi tidak mengurutkan')
  await page.locator('.ca-daftar-pengguna thead').getByRole('button', { name: 'Tanya Domi', exact: true }).click()
  if (!(await terkirim(p => p.p_urut === 'domi' && p.p_arah === 'asc'))) gagal('Kepala kolom tidak membalik arah')
  // Tautan lama dengan ?urut dan ?seg.
  await buka('/console/cashflow/pengguna?urut=nominal&arah=asc&seg=beli_kredit')
  await page.getByText('3 pengguna', { exact: true }).waitFor({ timeout: 30000 })
  const lama = daftar().at(-1).p
  if (lama.p_urut !== 'nominal' || lama.p_arah !== 'asc' || lama.p_segmen !== 'beli_kredit') gagal(`Tautan lama mengirim ${JSON.stringify(lama)}`)
  if (await page.locator('[data-uji="urut"]').inputValue() !== 'nominal') gagal('Pilihan Urut tidak mengikuti tautan')
  if (await page.locator('[data-seg="beli_kredit"]').getAttribute('aria-pressed') !== 'true') gagal('Pil segmen tidak mengikuti tautan')
  // Hitungan di pil hanya untuk segmen yang sedang tampil.
  if ((await page.locator('[data-seg="beli_kredit"]').innerText()).replace(/\s+/g, ' ').trim() !== 'Beli kredit 3') gagal('Hitungan pil segmen aktif salah')
  if ((await page.locator('[data-seg="semua"]').innerText()).trim() !== 'Semua') gagal('Pil lain ikut diberi hitungan')
  hasil.urut = 'lulus'

  // 4. Saring: satu panel menggantikan saringan kolom, parameter p_filter sama.
  await buka('/console/cashflow/pengguna')
  await page.getByText('10 pengguna', { exact: true }).waitFor({ timeout: 60000 })
  await page.locator('[data-uji="saring-buka"]').click()
  await page.locator('[data-uji="saring-panel"]').waitFor()
  const isian = await page.locator('[data-uji="saring-panel"] [data-uji^="saring-"]').evaluateAll(e => e.map(x => x.dataset.uji.replace('saring-', '')))
  if (isian.join() !== 'email,wa,versi,daftar,aktif,status,status_wa,tim') gagal(`Isian panel Saring: ${isian}`)
  await potret('pengguna-saring-terang-1440')
  await page.locator('[data-uji="saring-status_wa"]').selectOption('lewat')
  await page.getByText('2 pengguna', { exact: true }).waitFor({ timeout: 10000 })
  if (daftar().at(-1).p.p_filter?.status_wa !== 'lewat') gagal('Saring status WhatsApp tidak dikirim')
  await page.locator('[data-uji="saring-tim"]').selectOption('tidak')
  if (!(await terkirim(p => p.p_filter?.internal === 'tidak' && p.p_filter?.status_wa === 'lewat'))) gagal('Saring akun tim tidak dikirim')
  await page.locator('[data-uji="saring-email"]').fill('yoga')
  await page.getByText('1 pengguna', { exact: true }).waitFor({ timeout: 10000 })
  if (JSON.stringify(daftar().at(-1).p.p_filter) !== JSON.stringify({ email: 'yoga', status_wa: 'lewat', internal: 'tidak' })) gagal(`p_filter: ${JSON.stringify(daftar().at(-1).p.p_filter)}`)
  await page.locator('[data-uji="saring-selesai"]').click()
  if ((await page.locator('[data-uji="saring-jumlah"]').innerText()).trim() !== '3') gagal('Lencana tombol Saring tidak menghitung saringan')
  await lebar(390)
  await page.locator('[data-uji="saring-buka"]').click()
  await page.locator('[data-uji="saring-panel"]').waitFor()
  await potret('pengguna-saring-terang-390')
  await page.locator('[data-uji="saring-hapus"]').click()
  await page.locator('[data-uji="saring-selesai"]').click()
  await page.getByText('10 pengguna', { exact: true }).waitFor({ timeout: 10000 })
  if (Object.keys(daftar().at(-1).p.p_filter ?? {}).length) gagal('Hapus semua masih mengirim saringan')
  await lebar(1440)
  hasil.saring = 'lulus'

  // 5. Arti tiap kolom: paragraf panjang kini di panel.
  if (await page.getByText('Aktif terakhir = yang terbaru', { exact: false }).count()) gagal('Keterangan kolom masih ditulis di bawah tabel')
  await page.locator('[data-uji="arti-kolom"]').click()
  await page.locator('[data-uji="arti-kolom-isi"]').waitFor()
  for (const teks of ['Aktif terakhir = yang terbaru', 'Versi = versi aplikasi terakhir', 'Status WhatsApp menunjukkan', 'Domi = berapa kali']) {
    if (!(await page.locator('[data-uji="arti-kolom-isi"]').getByText(teks, { exact: false }).isVisible())) gagal(`Panel arti kolom tanpa "${teks}"`)
  }
  await potret('pengguna-arti-kolom-terang-1440')
  await page.keyboard.press('Escape')
  await page.locator('[data-uji="arti-kolom-isi"]').waitFor({ state: 'detached' })
  hasil.artiKolom = 'lulus'

  // 6. Rincian pengguna: cara nomor dibuktikan, terakhir pakai Domi, ID, dan masuk terakhir.
  const sebelumRinci = seen.length
  await page.locator('.ca-daftar-pengguna tbody tr').first().locator('a[aria-label^="Buka rincian"]').click()
  await page.waitForURL(u => u.pathname === `/console/cashflow/pengguna/${uuid(1)}`)
  await page.locator('[data-uji="rinci-dari-daftar"]').waitFor({ timeout: 30000 })
  const rinci = await page.locator('[data-uji="rinci-dari-daftar"]').innerText()
  for (const teks of ['Cara nomor dibuktikan', 'Terverifikasi lewat pesan masuk', 'Terakhir pakai Domi', 'ID akun', uuid(1)]) {
    if (!rinci.includes(teks)) gagal(`Rincian tanpa "${teks}": ${rinci}`)
  }
  if (!/Terakhir pakai Domi\s+\d{1,2} \w{3} 2026/.test(rinci)) gagal(`Terakhir pakai Domi tanpa tanggal: ${rinci}`)
  if (!(await page.getByText('Masuk terakhir', { exact: true }).first().isVisible())) gagal('Rincian tanpa Masuk terakhir')
  // Tidak ada panggilan daftar tambahan hanya untuk mengisi baris itu.
  if (seen.slice(sebelumRinci).some(x => x.name.startsWith('admin_daftar_pengguna_v'))) gagal('Rincian memanggil daftar pengguna lagi')
  await potret('rinci-pengguna-terang-1440')
  await lebar(390)
  if (await meluber()) gagal('Rincian meluber di 390')
  await potret('rinci-pengguna-terang-390')
  await lebar(1440)
  // Dibuka langsung: dua baris itu berkata apa adanya, ID tetap ada.
  await buka(`/console/cashflow/pengguna/${uuid(4)}`)
  await page.locator('[data-uji="rinci-dari-daftar"]').waitFor({ timeout: 30000 })
  const langsung = await page.locator('[data-uji="rinci-dari-daftar"]').innerText()
  if (!langsung.includes('Baru terisi kalau halaman ini dibuka dari daftar pengguna.') || !langsung.includes(uuid(4))) gagal(`Rincian dibuka langsung: ${langsung}`)
  await potret('rinci-pengguna-langsung-terang-1440')
  hasil.rincian = 'lulus'

  // 7. Keadaan daftar pengguna: memuat, kosong, galat. Terang dan gelap, 1440 dan 390.
  for (const t of ['terang', 'gelap']) {
    await tema(t)
    for (const w of [1440, 390]) {
      await lebar(w)
      // Memuat: jawaban ditahan, kerangka barisnya yang tampil.
      let lepas
      server.tahan = new Promise((r) => { lepas = r })
      await page.goto(`${APP}/console/cashflow/pengguna`, { waitUntil: 'domcontentloaded' })
      await page.locator('[data-keadaan="memuat"]').waitFor({ timeout: 60000 })
      if (await page.getByText('Belum ada data.', { exact: true }).count()) gagal('Memuat: sudah menulis kosong')
      await potret(`pengguna-memuat-${t}-${w}`)
      lepas()
      server.tahan = null
      await page.getByText('10 pengguna', { exact: true }).waitFor({ timeout: 30000 })
      // Kosong karena saringan: ada jalan keluarnya.
      await buka('/console/cashflow/pengguna?seg=ditangguhkan')
      await page.getByText('1 pengguna', { exact: true }).waitFor({ timeout: 30000 })
      server.kosong = true
      await page.locator('[data-seg="belum_wa"]').click()
      await page.locator('[data-keadaan="kosong"]').waitFor({ timeout: 15000 })
      if (!(await page.getByText('Belum ada yang cocok', { exact: true }).isVisible())) gagal('Kosong: judul tidak tampil')
      if (await meluber()) gagal(`Kosong ${t} meluber di ${w}`)
      await potret(`pengguna-kosong-${t}-${w}`)
      server.kosong = false
      await page.locator('[data-uji="lepas-saringan"]').click()
      await page.getByText('10 pengguna', { exact: true }).waitFor({ timeout: 15000 })
      if (new URL(page.url()).searchParams.get('seg')) gagal('Lepas saringan tidak mengembalikan segmen')
      // Galat tanpa baris: galat saja, dengan coba lagi. Tidak menulis "Belum ada data".
      server.galat = true
      await page.goto(`${APP}/console/cashflow/pengguna`, { waitUntil: 'domcontentloaded' })
      await page.locator('[data-keadaan="galat"]').waitFor({ timeout: 60000 })
      if (await page.locator('[data-keadaan="kosong"]').count()) gagal('Galat: ikut menulis kosong')
      if (await page.getByRole('alert').count() !== 1) gagal('Galat: role alert tidak tepat satu')
      if (await meluber()) gagal(`Galat ${t} meluber di ${w}`)
      await potret(`pengguna-galat-${t}-${w}`)
      server.galat = false
      await page.locator('[data-uji="keadaan-ulang"]').click()
      await page.getByText('10 pengguna', { exact: true }).waitFor({ timeout: 15000 })
    }
  }
  hasil.keadaan = 'lulus'

  // 8. Server lama (tanpa v4): lima kolom dan panah, tanpa apa pun tentang Domi.
  server.v4 = false
  for (const t of ['terang', 'gelap']) {
    await tema(t)
    await lebar(1440)
    await buka('/console/cashflow/pengguna')
    await page.getByText('10 pengguna', { exact: true }).waitFor({ timeout: 60000 })
    const kolom = await kepalaTabel()
    if (kolom.join('|') !== 'Pengguna|WhatsApp|Versi|Aktif terakhir|Ruang|Buka') gagal(`Server lama, kolom: ${kolom.join('|')}`)
    const urut = await page.locator('[data-uji="urut"] option').evaluateAll(o => o.map(x => x.value))
    if (urut.join() !== 'email,wa,versi,daftar,aktif,ruang,tx,nominal') gagal(`Server lama, pilihan Urut: ${urut}`)
    for (const s of ['pakai_domi', 'beli_kredit']) if (await page.locator(`[data-seg="${s}"]`).count()) gagal(`Server lama: segmen ${s} tampil`)
    if (await page.locator('[data-uji="jumlah-pakai-domi"]').count()) gagal('Server lama: jumlah pakai Domi tampil')
    if (await page.locator('.ca-daftar-pengguna .ca-console-table-wrap').evaluate(w => w.scrollWidth - w.clientWidth)) gagal(`Server lama ${t}: tabel bergulir ke samping di 1440`)
    await page.locator('[data-uji="saring-buka"]').click()
    if (await page.locator('[data-uji="saring-tim"]').count()) gagal('Server lama: saringan akun tim tampil')
    await page.locator('[data-uji="saring-selesai"]').click()
    if (await page.getByRole('alert').count()) gagal('Server lama: ada galat merah')
    await potret(`pengguna-server-lama-${t}-1440`)
    await lebar(390)
    if (await meluber()) gagal(`Server lama ${t} meluber di 390`)
    if (await page.locator('ul').getByText('Tanya Domi', { exact: true }).count()) gagal('Server lama 390: kartu memuat Domi')
    await potret(`pengguna-server-lama-${t}-390`)
  }
  hasil.serverLama = 'lulus'

  // 9. Tanpa izin data pribadi: kolom ada, isinya garis, urut dan segmen berhitungan mati.
  server.v4 = true
  izin = ['cashflow:view']
  mfa = false
  await pasangIzin()
  for (const t of ['terang', 'gelap']) {
    await tema(t)
    await lebar(1440)
    await buka('/console/cashflow/pengguna')
    await page.getByText('10 pengguna', { exact: true }).waitFor({ timeout: 60000 })
    await page.waitForTimeout(800)
    if (daftar().at(-1).p.p_alasan) gagal('Tanpa izin: daftar diminta dengan alasan')
    if (await page.getByText('@contoh.invalid').evaluateAll(e => e.filter(x => !x.textContent.includes('***')).length)) gagal('Tanpa izin: ada email utuh')
    const mati = await page.locator('[data-uji="urut"] option').evaluateAll(o => o.filter(x => x.disabled).map(x => x.value))
    if (mati.join() !== 'ruang,tx,nominal,domi,domi_terakhir,kredit') gagal(`Tanpa izin, urut yang mati: ${mati}`)
    for (const s of ['catat7', 'belum', 'pakai_domi', 'beli_kredit']) if (!(await page.locator(`[data-seg="${s}"]`).isDisabled())) gagal(`Tanpa izin: segmen ${s} masih hidup`)
    if (await page.locator('.ca-daftar-pengguna thead').getByRole('button', { name: 'Tanya Domi', exact: true }).count()) gagal('Tanpa izin: kepala Tanya Domi masih bisa diurutkan')
    const sel = await page.locator('.ca-daftar-pengguna tbody tr').evaluateAll(tr => tr.map(r => [4, 5, 6].map(n => r.children[n].innerText.trim().split('\n')[0]).join('|')))
    if (sel.some(x => x !== '—|—|—')) gagal(`Tanpa izin: hitungan tampil ${sel}`)
    if (await page.locator('[data-uji="jumlah-pakai-domi"]').count()) gagal('Tanpa izin: jumlah pakai Domi tampil')
    await potret(`pengguna-tanpa-izin-${t}-1440`)
    await lebar(390)
    if (await meluber()) gagal(`Tanpa izin ${t} meluber di 390`)
    await potret(`pengguna-tanpa-izin-${t}-390`)
    // Sakelar kontak lengkap tanpa izin: keterangan akses terbatas, bukan kontak.
    await lebar(1440)
    const sebelumSakelar = daftar().length
    await page.getByRole('switch', { name: 'Kontak lengkap' }).click()
    await page.locator('[data-keadaan="terbatas"]').waitFor({ timeout: 10000 })
    await page.waitForTimeout(500)
    if (daftar().slice(sebelumSakelar).some(x => x.p.p_alasan)) gagal('Tanpa izin: sakelar mengirim alasan')
    await potret(`pengguna-akses-terbatas-${t}-1440`)
    await lebar(390)
    await potret(`pengguna-akses-terbatas-${t}-390`)
  }
  // Tautan berurut atau bersegmen yang butuh izin kembali ke bawaan, bukan galat.
  await lebar(1440)
  await buka('/console/cashflow/pengguna?urut=nominal&seg=pakai_domi')
  await page.waitForFunction(() => !location.search.includes('nominal') && !location.search.includes('pakai_domi'), null, { timeout: 30000 })
  await page.getByText('10 pengguna', { exact: true }).waitFor({ timeout: 30000 })
  hasil.tanpaIzin = 'lulus'

  if (errors.length) gagal(`Galat browser: ${errors.join('; ')}`)
  console.log(JSON.stringify({ ...hasil, errors }))
} finally {
  if (browser) try { const s = await browser.newBrowserCDPSession(); await s.send('Browser.close') } catch { /* Chrome sudah tertutup. */ }
  chrome.kill()
  await rm(dir, { recursive: true, force: true }).catch(() => {})
}
