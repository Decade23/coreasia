// Data sintetis untuk uji tampilan console CashFlow (uji-console-halaman-headless.mjs).
// Semua isi di sini karangan: email berakhiran contoh.invalid, nama dan angka dibuat-buat,
// id berpola 00000000-0000-4000-8000-. Waktunya dihitung dari SAAT yang tetap supaya
// potret bisa dibandingkan dari satu putaran ke putaran berikutnya.
//
// Yang diekspor: buatServer() memulangkan jawab(nama, argumen, mode). `mode.kosong`
// membuat semua daftar menjawab kosong, `mode.izin = false` meniru sesi tanpa izin
// data pribadi (hanya cashflow:view). `mode.domiPanjang` mengganti daftar percakapan Domi
// dengan 48 percakapan berhalaman, satu di antaranya 60 pesan (uji tata letak tab Domi).
// `mode.belumAda` (nama RPC) meniru server tanpa migrasinya (PGRST202), `mode.belumBerlaku`
// (nama RPC) meniru server yang menahan laporan sampai waktu berlakunya (P0001 berhint).
// RPC yang belum dikarang dicatat di `takDikenal`.

export const SAAT = Date.parse('2026-11-16T05:00:00Z')
export const jam = j => new Date(SAAT - j * 3_600_000).toISOString()
export const tanggal = h => new Date(SAAT + 7 * 3_600_000 - h * 86_400_000).toISOString().slice(0, 10)
export const uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const samar = e => `${e.slice(0, 3)}***@${e.split('@')[1]}`

// ── Akun ─────────────────────────────────────────────────────────────────
/* Sepuluh akun karangan. Email terpanjang 38 huruf. */
export const AKUN = [
  { email: 'sari@contoh.invalid', nama: 'Sari Wulandari', wa: 'masuk', tanya: 412, tiga: 96, sisa: 37, beli: 3 },
  { email: 'rahmawati.kusumaningsih@contoh.invalid', nama: 'Rahmawati Kusumaningsih Putri Handayani Wiryaatmadja Sastrowardoyo', wa: 'kirim', tanya: 42, tiga: 9, sisa: 8, beli: 0, kira: true },
  { email: 'tim.uji@contoh.invalid', nama: 'Akun uji internal', wa: 'kirim', tanya: 1280, tiga: 310, sisa: 9999, beli: 0, tim: true },
  { email: 'dewi@contoh.invalid', nama: 'Dewi Lestari', wa: 'belum', tanya: 0, tiga: 0, sisa: 20, beli: 0, ios: true },
  { email: 'raka@contoh.invalid', nama: 'Raka Pratama', wa: 'lewat', tanya: 3, tiga: 3, sisa: 17, beli: 0 },
  { email: 'toko.berkah.jaya.abadi@contoh.invalid', nama: 'Toko Berkah Jaya Abadi', wa: 'masuk', tanya: 58, tiga: 0, sisa: 0, beli: 1, tangguh: true, ramai: true },
  { email: 'agus@contoh.invalid', nama: 'Agus Setiawan', wa: 'kirim', tanya: 14, tiga: 2, sisa: 70, beli: 2, ios: true },
  { email: 'nina@contoh.invalid', nama: 'Nina Maharani', wa: 'masuk', tanya: 0, tiga: 0, sisa: null, beli: 0 },
  { email: 'yoga@contoh.invalid', nama: '', wa: 'lewat', lewat: 'tanpa_nomor', tanya: 9, tiga: 1, sisa: 61, beli: 0, hapus: true, ditahan: true },
  { email: 'lina@contoh.invalid', nama: 'Lina Marlina', wa: 'belum', tanya: 1, tiga: 1, sisa: 19, beli: 0 },
]
export const EMAIL_PANJANG = AKUN[1].email
if (EMAIL_PANJANG.length !== 38) throw new Error(`Email uji harus 38 huruf, ini ${EMAIL_PANJANG.length}`)
const idAkun = i => uuid(i + 1)

/** Subjek rincian pengguna: akun beremail 38 huruf dan bernama panjang. */
export const U = idAkun(1)
/** Akun yang sedang ditangguhkan, untuk potret kepala rincian. */
export const U_TANGGUH = idAkun(3)
/** Subjek rincian ruang: ruang usaha bernama panjang. */
export const W = uuid(101)
const W_KELUARGA = uuid(100)
const W_PRIBADI = uuid(102)
const W_LUAR = uuid(103)
const NAMA_RUANG = 'Toko Berkah Jaya Abadi Sentosa Makmur Cabang Pasar Baru Bandung Timur'
const KASUS_U = uuid(700)
const KASUS_W = uuid(701)
const KASUS_ANAK = uuid(710)
const CATATAN_PANJANG = 'Tiket 4821, pelapor meminta pengecekan transaksi ganda di ruang usaha yang dipakai bersama tiga anggota lain sejak awal bulan'

/* Asal pengguna (v5): sumber dari tautan Play, jawaban pertanyaan sekali ketuk, atau keduanya. */
const ASAL = [
  { sumber: 'ig', medium: 'bio', kampanye: 'nov', jawaban: 'instagram' }, { sumber: null, jawaban: 'whatsapp_teman' }, null,
  { sumber: 'tt', medium: 'video', jawaban: null }, { sumber: 'google-play', medium: 'organic', jawaban: 'play_store' }, { sumber: 'wa', jawaban: 'whatsapp_teman' },
  { sumber: null, jawaban: 'lewati' }, null, { sumber: 'web', medium: 'landing', jawaban: 'google' }, { sumber: null, jawaban: 'lainnya' },
]
const barisPengguna = (a, i, { v4, v5, alasan, pii }) => {
  const dasar = {
    user_id: idAkun(i), email: alasan ? a.email : samar(a.email), display_name: alasan ? a.nama : '',
    created_at: jam(24 * (i + 3) * 9), last_sign_in: jam(5 * (i + 1)), aktivitas_terakhir: jam(4 * (i + 1)),
    banned_until: a.tangguh || a.hapus ? jam(-24 * 365) : null, menunggu_hapus: !!a.hapus,
    jumlah_ruang: pii ? [3, 4, 12, 1, 1, 4, 1, 1, 2, 1][i] : null, jumlah_tx: pii ? [1240, 48_213, 4310, 0, 12, 978, 44, 7, 133, 3][i] : null,
    jumlah_nominal: pii ? [184_250_000, 7_412_905_500, 2_415_000_000, 0, 1_250_000, 612_900_000, 4_800_000, 350_000, 27_600_000, 95_000][i] : null,
    terbuka: !!alasan,
    nomor_wa: a.wa === 'masuk' || a.wa === 'kirim' ? (alasan ? `62811000${1000 + i}` : `0811 •••• ${1000 + i}`) : null,
    versi_aplikasi: i % 3 ? '1.4.1' : '1.4.0', platform: a.ios ? 'ios' : i === 2 ? 'android-uat' : 'android',
    status_wa: a.wa, status_wa_pada: a.wa === 'belum' ? null : jam(24 * (i + 2)), lewat_sebab: a.wa === 'lewat' ? (a.lewat ?? 'gangguan') : null,
    nomor_ramai: !!a.ramai, kredit_ditahan: !!a.ditahan,
  }
  if (!v4) return dasar
  const baris4 = {
    ...dasar,
    domi_tanya: pii ? a.tanya : null, domi_tanya_30: pii ? a.tiga : null, domi_tanya_kira: pii ? !!a.kira : null,
    domi_terakhir: pii && a.tanya ? jam(7 * (i + 1)) : null,
    kredit_sisa: pii ? a.sisa : null, kredit_beli: pii ? a.beli : null, internal: !!a.tim,
  }
  if (!v5) return baris4
  // Tanpa alasan server membulatkan waktu ke awal hari WIB, dengan alasan presisi sampai detik.
  const hari = iso => (iso ? new Date(Math.floor((Date.parse(iso) + 7 * 3_600_000) / 86_400_000) * 86_400_000 - 7 * 3_600_000).toISOString() : iso)
  const dicatat = jam(24 * (i + 3) * 9 - 0.25)
  return {
    ...baris4,
    ...(alasan ? {} : { last_sign_in: hari(baris4.last_sign_in), aktivitas_terakhir: hari(baris4.aktivitas_terakhir), status_wa_pada: hari(baris4.status_wa_pada), domi_terakhir: hari(baris4.domi_terakhir) }),
    asal: pii && ASAL[i] ? { medium: null, kampanye: null, ...ASAL[i], dicatat: alasan ? dicatat : hari(dicatat) } : null,
  }
}
const daftarPengguna = (p, mode, v4, v5 = false) => {
  const pii = mode.izin
  let rows = mode.kosong ? [] : AKUN.map((a, i) => ({ a, d: barisPengguna(a, i, { v4, v5, alasan: pii ? p.p_alasan : null, pii }) }))
  if (p.p_cari) rows = rows.filter(x => x.a.email.includes(p.p_cari))
  return {
    total: rows.length, baris: rows.map(x => ({ ...x.d, total_semua: rows.length })),
    versi_terbaru: { android: '0001000400010000100000', ios: '0001000400010000100000' }, hapus_tersedia: true,
    ...(v4 ? { jumlah_pakai_domi: pii ? AKUN.filter(a => a.tanya > 0 && !a.tim).length : null } : {}),
  }
}

// ── Daftar ruang, pembelian, paket, audit, kasus ─────────────────────────
// Jenis ruang hanya 'pribadi' dan 'usaha', sama dengan yang diterima server.
const RUANG = [
  ['Kel***', 'sar***@contoh.invalid', 'pribadi', 4, 1240, 1], ['Tok*** *** *** *** *** *** *** *** *** *** ***', 'rah***@contoh.invalid', 'usaha', 12, 48_213, 3],
  ['Pri***', 'rah***@contoh.invalid', 'pribadi', 1, 86, 0], ['Aru*** *** *** *** ***', 'agu***@contoh.invalid', 'pribadi', 38, 7_902, 5],
  ['War*** *** ***', 'nin***@contoh.invalid', 'usaha', 3, 512, 0], ['Tab***', 'dew***@contoh.invalid', 'pribadi', 1, 0, 0],
  ['Kop*** *** *** ***', 'tok***@contoh.invalid', 'usaha', 126, 1_204_877, 14], ['Pan*** ***', 'lin***@contoh.invalid', 'pribadi', 6, 2_310, 2],
].map((r, i) => ({ workspace_id: uuid(100 + i), nama: r[0], pemilik_email: r[1], jenis: r[2], jumlah_anggota: r[3], jumlah_tx: r[4], undangan_aktif: r[5], created_at: jam(24 * (i + 1) * 17), total_semua: 8 }))
/* v3 (20261119100000): dengan alasan nama, email, dan nama pemilik utuh. Karangan semua. */
const RUANG_UTUH = [
  ['Keluarga Wulandari', 0], ['Toko Berkah Jaya Abadi Sentosa Makmur Cabang Pasar Baru', 1], ['Pribadi Rahma', 1], ['Arisan Ibu RT 05', 6],
  ['Warung Nina', 7], ['Tabungan Dewi', 3], ['Koperasi Toko Berkah', 5], ['Panitia Lomba 17an', 9],
]
const daftarRuangV3 = (p, m) => {
  const buka = m.izin && !!p.p_alasan
  let baris = m.kosong ? [] : RUANG.map((r, i) => {
    const [nama, siapa] = RUANG_UTUH[i]
    const { created_at, total_semua: _t, ...sisa } = r
    return {
      ...sisa, dibuat: created_at,
      ...(buka ? { nama, pemilik_email: AKUN[siapa].email, pemilik_id: idAkun(siapa), pemilik_nama: AKUN[siapa].nama || null } : { pemilik_id: null, pemilik_nama: null }),
      ...(m.izin ? {} : { jumlah_anggota: null, jumlah_tx: null, undangan_aktif: null }),
    }
  })
  if (p.p_cari) baris = baris.filter(b => `${b.nama} ${b.pemilik_email} ${b.pemilik_nama ?? ''}`.toLowerCase().includes(String(p.p_cari).toLowerCase()))
  const kunci = { nama: 'nama', pemilik: 'pemilik_email', jenis: 'jenis', anggota: 'jumlah_anggota', tx: 'jumlah_tx', undangan: 'undangan_aktif', dibuat: 'dibuat' }[p.p_urut ?? 'dibuat']
  const arah = p.p_arah === 'asc' ? 1 : -1
  baris.sort((a, b) => (typeof a[kunci] === 'number' ? arah * (a[kunci] - b[kunci]) : arah * String(a[kunci]).localeCompare(String(b[kunci]))))
  const dari = p.p_offset ?? 0
  return { total: baris.length, terbuka: buka, baris: baris.slice(dari, dari + (p.p_limit ?? 50)) }
}
const PEMBELIAN = [
  { status: 'lunas', jalur: 'play', paket: 'kredit_123', kredit: 123, nominal: 99_000, siapa: 1, play: true },
  { status: 'lunas', jalur: 'qris', paket: 'kredit_70', kredit: 70, nominal: 59_000, siapa: 0 },
  { status: 'menunggu', jalur: 'qris', paket: 'kredit_30', kredit: 30, nominal: 29_000, siapa: 5 },
  { status: 'batal', jalur: 'play', paket: 'kredit_70', kredit: 70, nominal: 59_000, siapa: 6, play: true, batal: true },
  { status: 'kedaluwarsa', jalur: 'qris', paket: 'kredit_1000_promo', kredit: 1000, nominal: 1_499_000, siapa: 2, uji: true },
  { status: 'lunas', jalur: 'play', paket: 'kredit_30', kredit: 30, nominal: 29_000, siapa: 7, play: true },
  { status: 'lunas', jalur: 'qris', paket: 'kredit_123', kredit: 123, nominal: 99_000, siapa: 4 },
  { status: 'menunggu', jalur: 'play', paket: 'kredit_70', kredit: 70, nominal: 59_000, siapa: 9, play: true },
].map((p, i) => ({
  id: uuid(200 + i), kode: `CF${4821 + i}`, waktu: jam(3 + i * 11), status: p.status, jalur: p.jalur, paket: p.paket, kredit: p.kredit, nominal: p.nominal, uji: !!p.uji,
  pembeli: { user_id: idAkun(p.siapa), email: AKUN[p.siapa].email, nama: AKUN[p.siapa].nama },
  play: p.play ? {
    order: `GPA.3300-1111-2222-${33330 + i}`, dikonsumsi: !p.batal, batal_pada: p.batal ? jam(1 + i * 11) : null,
    harga_mikro: p.nominal * 1_000_000, mata_uang: 'IDR', pajak_mikro: Math.round(p.nominal * 0.11) * 1_000_000, total_mikro: Math.round(p.nominal * 1.11) * 1_000_000,
    diterima_mikro: Math.round(p.nominal * 0.85) * 1_000_000, sumber_harga: 'google',
    google_lunas_pada: jam(3 + i * 11), rtdn_pada: jam(3 + i * 11 - 0.01), aplikasi_lapor_pada: jam(3 + i * 11 - 0.02), kredit_masuk_pada: jam(3 + i * 11 - 0.03),
  } : null,
}))
const PAKET = [
  { kode: 'kredit_30', kredit: 30, harga: 29_000, urutan: 10, terjual: 214, bawaan: false, play: 'kredit_30' },
  { kode: 'kredit_70', kredit: 70, harga: 59_000, urutan: 20, terjual: 12_048, bawaan: true, label: 'Paling laris minggu ini', play: 'kredit_70', promo: 49_000 },
  { kode: 'kredit_123', kredit: 123, harga: 99_000, urutan: 30, terjual: 96, bawaan: false, play: 'kredit_123' },
  { kode: 'kredit_1000_promo', kredit: 1000, harga: 1_499_000, urutan: 40, terjual: 0, bawaan: false, aktif: false, uji: true },
  { kode: 'kredit_250_usaha', kredit: 250, harga: 189_000, urutan: 50, terjual: 31, bawaan: false, label: 'Untuk ruang usaha' },
  { kode: 'kredit_10_coba', kredit: 10, harga: 9_900, urutan: 5, terjual: 4, bawaan: false, aktif: false },
].map(p => ({
  kode: p.kode, kredit: p.kredit, harga: p.harga, harga_promo: p.promo ?? null, promo_mulai: p.promo ? jam(48) : null, promo_sampai: p.promo ? jam(-240) : null,
  label: p.label ?? null, bawaan: p.bawaan, aktif: p.aktif ?? true, khusus_uji: !!p.uji, urutan: p.urutan, diubah: jam(30), diubah_oleh: 'admin@contoh.invalid',
  play_produk_id: p.play ?? null, efektif: p.promo ?? p.harga, promo: p.promo ? 'berjalan' : 'tanpa', terjual: p.terjual, pernah_dibeli: p.terjual > 0,
}))
const AUDIT = [
  ['lihat_kepala', 'user', 0, ['akun'], 'Pengguna 360 dibuka otomatis dari daftar pengguna'],
  ['baca_daftar_kontak', null, null, [], 'Kontak lengkap (email dan WhatsApp) di daftar pengguna Console'],
  ['set_ai_paket', 'ai_paket', null, [], 'Promo akhir tahun untuk paket 70 kredit, berlaku sampai 31 Des'],
  ['baca_transaksi', 'user', 5, ['akun', 'transaksi', 'dompet'], CATATAN_PANJANG],
  ['hapus_akun_permanen', 'user', 8, ['akun'], 'Permintaan hapus akun dari pengguna, sudah lewat masa tunggu'],
  ['batas_akses', null, null, [], null],
  ['baca_perangkat', 'user', 1, ['akun', 'perangkat', 'kabar', 'jejak'], 'Aplikasi menutup sendiri saat memindai struk, dilaporkan lewat WhatsApp dukungan'],
  ['buka_foto', 'workspace', null, ['foto'], 'Foto dibuka dari console CashFlow'],
  ['set_config', 'app_config', null, [], 'Menaikkan batas harian kode WhatsApp selama kampanye'],
  ['tambah_ranah', 'user', 1, ['dompet'], 'Dibuka dari console CashFlow, Pengguna 360'],
].map((a, i, semua) => ({
  id: 9000 - i, admin_id: uuid(900), pelaku: i % 2 ? 'admin.kedua.yang.panjang@contoh.invalid' : 'admin@contoh.invalid', action: a[0], target_type: a[1],
  target_id: a[2] === null ? null : idAkun(a[2]), target_email: a[2] === null ? null : samar(AKUN[a[2]].email), detail: null, reason: a[4], alasan_utuh: i !== 3,
  ranah: a[3], kasus: a[3].length ? uuid(700 + i) : null, terdampak: null, jumlah_terdampak: i === 3 ? 4 : null, created_at: jam(2 + i * 5), total_semua: semua.length,
}))
const KASUS_DAFTAR = [
  ['aktif', 'keluhan', ['akun', 'transaksi', 'jejak', 'dompet', 'perangkat', 'kabar'], 1, CATATAN_PANJANG],
  ['ditutup', 'pembayaran', ['akun'], 5, 'Pembelian kredit lunas tetapi kredit belum masuk'],
  ['kedaluwarsa', 'galat', ['akun', 'jejak'], 0, 'Aplikasi menutup sendiri saat memindai struk, dilaporkan lewat WhatsApp dukungan'],
  ['aktif', 'keluhan', ['ruang', 'dompet', 'transaksi', 'jejak', 'katalog', 'jadwal', 'usaha', 'struk'], null, 'Dibuka dari console CashFlow, Ruang 360'],
  ['dicabut', 'keamanan', ['akun', 'perangkat'], 8, 'Dugaan akun dipakai orang lain, dilaporkan pemilik lewat surel'],
  ['kedaluwarsa', 'penyalahgunaan', ['akun', 'transaksi'], 2, 'Pola transaksi berulang yang tidak wajar pada akun uji'],
].map((k, i, semua) => ({
  id: uuid(700 + i), induk: null, pelaku: i % 2 ? 'admin.kedua.yang.panjang@contoh.invalid' : 'admin@contoh.invalid',
  subjek_tipe: k[3] === null ? 'workspace' : 'user', subjek_id: k[3] === null ? W : idAkun(k[3]), subjek_label: k[3] === null ? 'Tok*** *** ***' : samar(AKUN[k[3]].email),
  ruang: [uuid(100 + i)], jumlah_ruang: 1 + i, skenario: k[3] === null ? 'ruang_360' : 'pengguna_360', preset: k[1], alasan: k[4], alasan_utuh: i !== 4, ranah: k[2], tingkat: i === 0 ? 'T2' : 'T1',
  jumlah_terdampak: i === 0 ? 37 : null, lanjutan_dari: null, dibuka: jam(1 + i * 30), berlaku_sampai: jam(-0.4 + i * 30), ditutup: i === 1 ? jam(20) : null,
  status: k[0], milik_saya: i % 2 === 0, total_semua: semua.length,
}))

// ── Kasus aktif (dipakai rincian pengguna dan rincian ruang) ─────────────
const kasusInti = (tambah) => ({
  id: KASUS_U, induk: null, subjek_tipe: 'user', subjek_id: U, ruang: [W_KELUARGA, W, W_PRIBADI], jumlah_ruang: 3,
  skenario: 'pengguna_360', preset: 'keluhan', alasan: 'Dibuka dari console CashFlow, Pengguna 360', ranah: ['akun', 'transaksi', 'jejak', 'dompet', 'perangkat', 'kabar'],
  tingkat: 'T2', lanjutan_dari: null, dibuka: jam(0.2), akar_dibuka: jam(0.2), berlaku_sampai: jam(-0.4), batas_perpanjang: jam(-1.8),
  ditutup: null, status: 'aktif', jumlah_terdampak: 37, ...tambah,
})
const kasusPengguna = (subjek) => kasusInti({ subjek_id: subjek })
const kasusRuang = (ws) => kasusInti({
  id: KASUS_W, subjek_tipe: 'workspace', subjek_id: ws, ruang: [ws], jumlah_ruang: 1, skenario: 'ruang_360',
  alasan: 'Dibuka dari console CashFlow, Ruang 360', ranah: ['ruang', 'dompet', 'transaksi', 'jejak', 'katalog', 'jadwal', 'usaha', 'struk'], jumlah_terdampak: 12,
})
const kasusAnak = (induk, ranah) => kasusInti({
  id: KASUS_ANAK, induk, ranah, tingkat: 'T3', alasan: 'Percakapan Domi dibuka dari console CashFlow', berlaku_sampai: jam(-0.15), batas_perpanjang: jam(-0.15),
  subjek_tipe: induk === KASUS_W ? 'workspace' : 'user', subjek_id: induk === KASUS_W ? W : U, ruang: induk === KASUS_W ? [W] : [W_KELUARGA, W, W_PRIBADI],
})
const kasusUntuk = id => (id === KASUS_W ? kasusRuang(W) : kasusPengguna(U))

// ── Buku: transaksi, dompet, jejak, sampah ───────────────────────────────
const DOMPET = ['Kas Toko Cabang Pasar Baru Lantai Dua', 'Bank Tabungan Usaha', 'Dompet Digital Kasir', 'Piutang Pelanggan Tetap', 'Kartu Kredit Belanja Stok', 'Tabungan Darurat (arsip)']
const TIPE_DOMPET = ['tunai', 'bank', 'ewallet', 'piutang', 'kredit', 'bank']
const KATEGORI = ['Penjualan barang dagangan harian', 'Belanja stok', 'Gaji karyawan', 'Sewa tempat usaha dan iuran pasar', 'Listrik dan air', 'Transportasi', 'Lain-lain']
const NOMINAL = [1_250_000, 48_500, 7_412_905_500, 325_000, 15_000_000, 15_000_000, 2_750_000, 99_900, 184_250_000, 12_500, 640_000, 3_300_000]
const transaksi = (i, ws) => {
  const transfer = i === 4 || i === 5
  return {
    id: uuid(3000 + i), workspace_id: ws, pencatat: idAkun(i % 4), dompet_id: uuid(400 + (i % 5)), dompet: DOMPET[i % 5],
    kategori_id: transfer ? null : uuid(500 + (i % 7)), kategori: transfer ? null : KATEGORI[i % 7],
    kind: i % 3 === 0 ? 'income' : 'expense', amount: NOMINAL[i % NOMINAL.length], occurred_at: tanggal(i === 1 ? -3 : i), occurred_time: i % 2 ? `${String(8 + (i % 10)).padStart(2, '0')}:4${i % 10}` : null,
    created_at: jam(i * 26 + 1), updated_at: i % 4 === 0 ? jam(i * 26) : null, dicatat_pada: jam(i * 26 + 1), rekonsiliasi_id: i === 9 ? uuid(3900) : null,
    transfer_group: transfer ? uuid(3500) : null, pasangan_id: transfer ? uuid(3000 + (i === 4 ? 5 : 4)) : null, group_id: i === 2 || i === 7 ? uuid(3600) : null,
    schedule_id: i === 6 ? uuid(3700) : null, installment_no: i === 6 ? 7 : null, schedule_periods: i === 6 ? 24 : null,
    product_id: i === 3 ? uuid(3800) : null, qty: i === 3 ? 12 : null, unit_price: i === 3 ? 27_500 : null, cost_at_sale: i === 3 ? 19_000 : null,
    ada_catatan: i % 2 === 0, ada_lampiran: i % 3 === 0, masa_depan: i === 1,
  }
}
const sampah = (i, ws) => ({
  id: uuid(3100 + i), tx_id: uuid(3150 + i), workspace_id: ws, kind: i % 2 ? 'expense' : 'income', amount: NOMINAL[(i + 3) % NOMINAL.length],
  occurred_at: tanggal(i + 2), dompet_id: uuid(400 + (i % 5)), dompet_nama: DOMPET[i % 5], kategori_id: uuid(500 + (i % 7)), kategori: KATEGORI[i % 7],
  rekonsiliasi_id: null, transfer_group: i === 3 ? uuid(3550) : null, group_id: i === 1 ? uuid(3650) : null, schedule_id: null,
  ada_foto: i % 2 === 0, ada_catatan: i % 3 === 0, ada_judul: i % 2 === 1, pencatat: idAkun(i % 4),
  dihapus_oleh: idAkun((i + 1) % 4), dihapus_pada: jam(i * 20 + 3), dipulihkan_oleh: i === 2 ? idAkun(1) : null, dipulihkan_pada: i === 2 ? jam(5) : null,
  status: i === 2 ? 'dipulihkan' : i === 5 ? 'dibuang' : 'dihapus',
})
const transaksiCari = (p, mode) => {
  const ruang = p.p_mode === 'ruang'
  const ws = i => (ruang ? p.p_ws ?? W : [W, W_KELUARGA, W_PRIBADI][i % 3])
  if (p.p_grup) {
    const baris = mode.kosong ? [] : Array.from({ length: 5 }, (_, i) => ({ ...transaksi(i + 20, ws(0)), group_id: p.p_grup, kind: 'expense', transfer_group: null, pasangan_id: null }))
    return { baris, kursor_berikut: null, total: baris.length, sampah: null, sampah_lebih: false, halaman_pertama: true, mode: 'ruang' }
  }
  const baris = mode.kosong ? [] : Array.from({ length: 12 }, (_, i) => transaksi(i, ws(i)))
  return {
    baris, kursor_berikut: mode.kosong || p.p_kursor ? null : { o: tanggal(11), c: jam(300), i: uuid(3011) }, total: mode.kosong ? 0 : 48_213,
    sampah: p.p_termasuk_sampah && !mode.kosong ? Array.from({ length: 3 }, (_, i) => sampah(i, ws(i))) : (p.p_termasuk_sampah ? [] : null), sampah_lebih: false,
    halaman_pertama: !p.p_kursor, mode: ruang ? 'ruang' : 'pengguna',
  }
}
const JENIS_JEJAK = ['tx.catat', 'tx.ubah', 'tx.hapus', 'tx.pulih', 'struk.catat', 'dompet.arsip', 'anggota.gabung', 'anggota.peran', 'rekonsiliasi.simpan', 'kategori.arsip', 'tx.buang', 'anggota.keluar']
const jejak = (p, mode) => {
  const baris = mode.kosong ? [] : JENIS_JEJAK.map((jenis, i) => ({
    id: 880_000 - i, workspace_id: p.p_ws ?? [W, W_KELUARGA, W_PRIBADI][i % 3], aktor: p.p_aktor ?? idAkun(i % 4), jenis, sasaran_id: uuid(3000 + i),
    nominal: jenis.startsWith('tx') || jenis.startsWith('struk') ? NOMINAL[i % NOMINAL.length] : null, arah: jenis.startsWith('tx') ? (i % 2 ? 'expense' : 'income') : null,
    tanggal: jenis.startsWith('tx') ? tanggal(i) : null, pada: jam(i * 7 + 0.5), pada_perangkat: i === 3 ? null : jam(i * 7 + 0.5 + (i === 5 ? 30 : 0.001)),
    jeda_tiba_detik: i === 3 ? null : i === 5 ? 108_000 : 4, kunci: jenis === 'tx.ubah' ? ['amount', 'category_id', 'occurred_at', 'wallet_id'] : [], ada_judul: i % 3 === 0,
  }))
  return { baris, kursor_berikut: mode.kosong || p.p_kursor ? null : { p: jam(80), i: 879_989 }, total: mode.kosong ? 0 : 12_904, halaman_pertama: !p.p_kursor }
}
const dompetRuang = (p, mode) => {
  const daftarWs = p.p_ws ? [p.p_ws] : [W, W_KELUARGA, W_PRIBADI]
  const baris = mode.kosong ? [] : daftarWs.flatMap((ws, w) => DOMPET.slice(0, w === 0 ? 6 : 2).map((nama, i) => ({
    id: uuid(400 + i + w * 10), workspace_id: ws, nama, tipe: TIPE_DOMPET[i], warna: ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'][i],
    opening_balance: i === 1 ? 250_000_000 : 0, credit_limit: i === 4 ? 50_000_000 : null, archived: i === 5, dibuat: jam(24 * 200 + i),
    pembuat: idAkun(i % 4), mutasi: [184_250_000, 7_162_905_500, -1_250_000, 36_400_000, -12_750_000, 0][i], saldo: [184_250_000, 7_412_905_500, -1_250_000, 36_400_000, -12_750_000, 5_000_000][i],
    jumlah_transaksi: [31_204, 12_877, 3_310, 412, 96, 0][i], terakhir_tanggal: i === 5 ? null : tanggal(i), masa_depan: i === 0 ? 2 : 0,
  })))
  return {
    kasus: p.p_kasus, baris,
    ringkas: mode.kosong ? [] : daftarWs.map((ws, w) => ({ workspace_id: ws, jumlah_dompet: w === 0 ? 6 : 2, aset: w === 0 ? 7_583_155_500 : 7_597_155_500, piutang: w === 0 ? 36_400_000 : 0, arsip: w === 0 ? 5_000_000 : 0 })),
  }
}
const mutasiDompet = (p, mode) => ({
  kasus: p.p_kasus,
  dompet: { id: p.p_wallet, workspace_id: W, nama: DOMPET[0], tipe: 'tunai', opening_balance: 0, credit_limit: null, archived: false, saldo: 184_250_000 },
  baris: mode.kosong ? [] : Array.from({ length: 10 }, (_, i) => ({ ...transaksi(i, W), dompet_id: p.p_wallet, dompet: DOMPET[0], saldo_setelah: 184_250_000 - i * 3_125_000 })),
  kursor_berikut: null, total: mode.kosong ? 0 : 31_204, halaman_pertama: true,
})
const sampahRuang = (p, mode) => {
  const baris = mode.kosong ? [] : Array.from({ length: 8 }, (_, i) => sampah(i, p.p_ws ?? W))
  return { kasus: p.p_kasus, baris, kursor_berikut: null, total: baris.length ? 1_204 : 0, halaman_pertama: true }
}

// ── Pengguna 360 ─────────────────────────────────────────────────────────
const RUANG_SUBJEK = [
  [W, NAMA_RUANG, 'usaha', 'owner', true, 12, 31_204], [W_KELUARGA, 'Keluarga Besar Wiryaatmadja Sastrowardoyo', 'pribadi', 'admin', false, 4, 16_923], [W_PRIBADI, 'Pribadi', 'pribadi', 'owner', true, 1, 86],
]
/* v2 (20261119101000): dengan alasan email, nama, nama ruang, dan waktu utuh. */
const kepalaPenggunaV2 = (p, mode) => {
  const buka = mode.izin && !!p.p_alasan
  const k = kepalaPengguna(p, mode)
  return {
    ...k,
    ...(buka ? {
      email: EMAIL_PANJANG, display_name: AKUN[1].nama,
      ruang: k.ruang.map((r, i) => ({ ...r, nama: [NAMA_RUANG, 'Keluarga Wulandari', 'Arisan Ibu RT 05', 'Pribadi Rahma'][i] ?? r.nama })),
      status_wa: 'kirim', status_wa_pada: jam(24 * 3 + 2.0875),
    } : { display_name: null }),
    terbuka: buka,
  }
}
const kepalaPengguna = (p, mode) => ({
  user_id: p.p_user, email: samar(EMAIL_PANJANG), daftar: jam(24 * 412), masuk_terakhir: jam(5), banned_until: p.p_user === U_TANGGUH ? jam(-24 * 21) : null,
  jumlah_ruang: mode.izin ? 4 : null, jumlah_transaksi: mode.izin ? 48_213 : null, akses_30hari: 14,
  ruang: mode.izin ? RUANG_SUBJEK.map(r => ({ workspace_id: r[0], nama: r[1], jenis: r[2], peran: r[3], pemilik: r[4], bekas_anggota: false, jumlah_anggota: r[5], tx_oleh_dia: r[6] })) : null,
  nomor_wa: mode.izin ? '6281100001001' : '0811 •••• 1001',
})
const pengguna360 = (p, mode) => ({
  kasus: p.p_kasus,
  akun: {
    user_id: p.p_user, email: EMAIL_PANJANG, display_name: AKUN[1].nama, nama_meta: 'Rahmawati K. P. H.', email_confirmed_at: jam(24 * 412),
    provider: 'google', providers: ['google', 'email'], daftar: jam(24 * 412), masuk_terakhir: jam(5), banned_until: null,
    sesi: { jumlah: 4, terakhir: jam(0.3) }, mfa: false,
  },
  hitung: mode.kosong
    ? { ruang: 0, ruang_dalam_lingkup: 0, transaksi: 0, jejak: 0, sampah: 0, perangkat: 0, kabar: 0, kabar_belum: 0 }
    : { ruang: 4, ruang_dalam_lingkup: 3, transaksi: 48_213, jejak: 12_904, sampah: 1_204, perangkat: 3, kabar: 2_417, kabar_belum: 38 },
  pertama_catat: mode.kosong ? null : jam(24 * 411),
  total: mode.kosong ? { transaksi: 0, masuk_bersih: 0, keluar_bersih: 0 } : { transaksi: 48_213, masuk_bersih: 7_412_905_500, keluar_bersih: 6_981_340_250 },
  ruang: mode.kosong ? [] : [
    ...RUANG_SUBJEK.map((r, i) => ({
      workspace_id: r[0], dalam_lingkup: true, nama: r[1], jenis: r[2], peran: r[3], pemilik: r[4], bekas_anggota: false, joined_at: jam(24 * (400 - i * 90)),
      jumlah_anggota: r[5], tx_oleh_dia: r[6], masuk_bersih_dia: [6_204_100_000, 1_208_805_500, 0][i], keluar_bersih_dia: [5_911_200_250, 1_069_340_000, 800_000][i],
      terakhir_catat_dia: jam(i * 30 + 2), agregat: i === 2 ? null : { transaksi: [1_204_877, 16_923][i], masuk_bersih: [48_213_905_000, 1_208_805_500][i], keluar_bersih: [41_100_000_000, 1_069_340_000][i], terakhir_catat: jam(1), dompet: [6, 2][i] },
    })),
    { workspace_id: W_LUAR, dalam_lingkup: false, nama: 'Aru*** *** *** *** ***', jenis: 'pribadi', peran: 'member', pemilik: false, bekas_anggota: true, jumlah_anggota: 38, tx_oleh_dia: 17 },
  ],
})
const perangkatPengguna = (p, mode) => ({
  kasus: p.p_kasus, user_id: p.p_user, hari: p.p_hari ?? 30,
  perangkat: mode.kosong ? [] : [
    { sidik: 'a1b2c3d4e5', platform: 'android', varian: 'prod', versi_aplikasi: '1.4.1', kode_build: '26111301', versi_tak_sah: false, updated_at: jam(2) },
    { sidik: 'f6a7b8c9d0', platform: 'android', varian: 'uat', versi_aplikasi: '1.4.2-rc.3', kode_build: '26111502', versi_tak_sah: false, updated_at: jam(26) },
    { sidik: '0f9e8d7c6b', platform: 'ios', varian: 'prod', versi_aplikasi: 'tidak-dikenal-0.0', kode_build: null, versi_tak_sah: true, updated_at: jam(24 * 40) },
  ],
  sesi: mode.kosong ? [] : Array.from({ length: 6 }, (_, i) => ({
    sidik: `5e55${i}0a1b2`, created_at: jam(24 * (i * 9 + 1)), updated_at: jam(i * 30 + 1), refreshed_at: i % 2 ? jam(i * 30 + 1) : null,
    aal: i === 0 ? 'aal2' : 'aal1', not_after: i === 4 ? jam(24) : null, aktif: i < 4,
  })),
  sesi_disembunyikan: false, terpotong: { perangkat: false, sesi: false },
  jeda: {
    ringkas: mode.kosong
      ? { n: 0, p50: null, p95: null, maks: null, lebih_1_menit: 0, lebih_1_jam: 0, lebih_1_hari: 0, jam_maju: 0, tanpa_jam_perangkat: 0 }
      : { n: 12_904, p50: 3, p95: 412, maks: 108_000, lebih_1_menit: 310, lebih_1_jam: 42, lebih_1_hari: 3, jam_maju: 7, tanpa_jam_perangkat: 19 },
    per_hari: mode.kosong ? [] : Array.from({ length: 14 }, (_, i) => ({ tanggal: tanggal(13 - i), n: 300 + ((i * 97) % 500), p95: 40 + ((i * 53) % 900), maks: i === 9 ? 108_000 : 1_200 + i * 310 })),
    terbesar: mode.kosong ? [] : Array.from({ length: 5 }, (_, i) => ({
      peristiwa_id: 880_000 - i * 3, workspace_id: [W, W_KELUARGA, W_PRIBADI][i % 3], sasaran_id: uuid(3000 + i), pada: jam(i * 40 + 3), pada_perangkat: jam(i * 40 + 33), jeda_tiba_detik: 108_000 - i * 17_000,
    })),
    rinci: { terbesar: true },
  },
})
const JENIS_KABAR = ['tx.hapus', 'tx.besar', 'anggota.masuk', 'peran.ubah', 'rangkuman', 'tx.ubah', 'tx.buang', 'anggota.keluar', 'ruang.ubah', 'undangan.buat', 'dompet.saldo', 'aktivitas']
const kabarPengguna = (p, mode) => {
  const baris = mode.kosong ? [] : JENIS_KABAR.map((jenis, i) => ({
    id: 55_000 - i, workspace_id: [W, W_KELUARGA, W_PRIBADI][i % 3], jenis, kode_tak_dikenal: false, aktor: i === 4 ? null : idAkun(i % 4), akun_ada: i !== 7, ada_nama_aktor: i % 2 === 0,
    sasaran_id: jenis.startsWith('tx') ? uuid(3000 + i) : null, nominal: jenis.startsWith('tx') ? NOMINAL[(i + 2) % NOMINAL.length] : null,
    tanggal: jenis.startsWith('tx') ? tanggal(i) : null, pada: jam(i * 9 + 1), dibaca_pada: i % 3 === 0 ? null : jam(i * 9), kategori: jenis.startsWith('tx') ? KATEGORI[i % 7] : null,
    kunci: jenis === 'tx.ubah' ? ['amount', 'category_id'] : [], peran_baru: jenis === 'peran.ubah' ? 'admin' : null, peran_undangan: jenis === 'undangan.buat' ? 'viewer' : null,
    isi: jenis === 'rangkuman' ? { cacah: 214, masuk: 131, keluar: 83, pencatat: 5 } : jenis === 'dompet.saldo' ? { dompet: DOMPET[0], selisih: -1_250_000, per_tanggal: tanggal(1) } : jenis === 'aktivitas' ? { jumlah_pelaku: 4, jenis: { 'tx.catat': 31, 'tx.ubah': 6 } } : undefined,
  }))
  return {
    kasus: p.p_kasus, user_id: p.p_user,
    ringkas: p.p_kursor ? null : { total: baris.length ? 2_417 : 0, belum_dibaca: baris.length ? 38 : 0, per_jenis: Object.fromEntries([...JENIS_KABAR.map((j, i) => [j, baris.length ? 400 - i * 31 : 0]), ['lain', 0]]) },
    setelan: p.p_kursor ? null : (mode.kosong ? [] : [W, W_KELUARGA, W_PRIBADI].map((ws, i) => ({
      workspace_id: ws, tersimpan: i !== 2, hapus: true, masuk: i === 0, peran: true, ambang: i === 0 ? 5_000_000 : null, rangkuman_jam: i === 0 ? 20 : null, zona: 'Asia/Jakarta',
      tingkat: ['semua', 'penting', 'senyap'][i], jendela_menit: i === 0 ? 30 : null, ubah: i < 2, keluar: i === 0, ruang: true,
    }))),
    baris, kursor_berikut: mode.kosong || p.p_kursor ? null : { p: jam(100), i: 54_989 }, total: baris.length ? 2_417 : 0, halaman_pertama: !p.p_kursor,
  }
}
const perjalanan = (p, mode) => {
  const b = (n, j, sesi, jenis, langkah, kategori, layar, rincian_aman = {}, sumber = 'aplikasi') => ({
    id: String(n).padStart(32, '0'), pada: jam(j), sumber, jenis, langkah, kategori, layar, rincian_aman, sesi, versi: sesi ? '1.4.1' : null,
    sesi_mulai: sesi ? jam(sesi === 'peluncuran-2' ? 2.01 : 26.02) : null,
  })
  const baris = mode.kosong ? [] : [
    b(12, 1.9, 'peluncuran-2', 'tx.batal', null, 'transaksi', '/transactions'),
    b(11, 1.92, 'peluncuran-2', 'tx.mulai', null, 'transaksi', '/transactions'),
    b(10, 1.95, 'peluncuran-2', 'layar.buka', null, 'aplikasi', '/transactions'),
    b(9, 2.0, 'peluncuran-2', 'onboarding.langkah', 'aplikasi.versi', 'aplikasi', null, { versi: '1.4.1', platform: 'android', varian: 'prod' }),
    b(8, 25.9, 'peluncuran-1', 'nomor_wa.tersimpan', null, 'nomor_wa', null, { cara: 'wa_masuk' }, 'server'),
    b(7, 25.92, 'peluncuran-1', 'onboarding.langkah', 'nomor_wa.terbalik.buka_wa', 'nomor_wa', '/nomor-wa', { hasil: 'pertama' }),
    b(6, 25.95, 'peluncuran-1', 'onboarding.langkah', 'nomor_wa.petunjuk', 'nomor_wa', '/nomor-wa', { hasil: 'batal' }),
    b(5, 25.96, 'peluncuran-1', 'galat.js', null, 'galat', null, { fatal: true, sebab: 'fetch-lambat-beruntun', beruntun: 4, batasMs: 12_000, umurProsesDetik: 81 }),
    b(4, 25.97, 'peluncuran-1', 'onboarding.langkah', 'ruang.panel_baru', 'usaha', null, { asal: 'beranda' }),
    b(3, 25.98, 'peluncuran-1', 'onboarding.langkah', 'ruang.pilih_usaha', 'usaha', null),
    b(2, 26.0, 'peluncuran-1', 'onboarding.langkah', 'aplikasi.versi', 'aplikasi', null, { versi: '1.4.1' }),
    b(1, 26.01, 'peluncuran-1', 'layar.buka', null, 'aplikasi', '/'),
  ].filter(x => (!p.p_hanya_galat || x.kategori === 'galat') && (!p.p_kategori || p.p_kategori.includes(x.kategori)))
  return { baris, halaman_pertama: !p.p_kursor, kursor_berikut: null, akun_internal: false, telemetri_sejak: '2026-07-16T04:00:00Z' }
}
const riwayatAkses = (p, mode) => {
  const AKSI = ['lihat_kepala', 'baca_akun', 'baca_transaksi', 'baca_jejak', 'baca_dompet', 'tambah_ranah', 'baca_perangkat', 'baca_kabar', 'baca_teks', 'buka_foto']
  const baris = mode.kosong ? [] : AKSI.map((aksi, i) => ({
    id: 7000 - i, pada: jam(i * 13 + 0.3), pelaku: i % 3 === 2 ? 'admin.kedua.yang.panjang@contoh.invalid' : 'admin@contoh.invalid', aksi, target_type: 'user',
    langsung: i < 2, kasus: i === 0 ? null : uuid(700 + (i % 3)), ranah: i === 0 ? [] : [['akun'], ['transaksi'], ['jejak'], ['dompet'], ['dompet'], ['perangkat'], ['kabar'], ['teks'], ['foto']][i - 1],
    rpc: i === 0 ? 'admin_pengguna_kepala' : 'admin_transaksi_cari', jumlah: i === 2 ? 100 : i === 8 ? '3' : null,
    alasan: i % 4 === 3 ? null : i === 2 ? CATATAN_PANJANG : 'Dibuka dari console CashFlow, Pengguna 360', alasan_utuh: i % 3 !== 2, milik_saya: i % 3 !== 2,
  }))
  return { baris, kursor_berikut: mode.kosong || p.p_kursor ? null : { t: jam(130), i: 6990 }, total: baris.length ? 214 : 0, tersembunyi: null, halaman_pertama: !p.p_kursor }
}

// ── Ruang 360 ────────────────────────────────────────────────────────────
const kepalaRuang = (p, mode) => ({
  workspace_id: p.p_ws, nama: mode.izin ? NAMA_RUANG : 'Tok*** *** *** *** *** *** *** *** *** *** ***', jenis: 'usaha', pemilik_email: samar(EMAIL_PANJANG), dibuat: jam(24 * 400),
  jumlah_anggota: mode.izin ? 12 : null, jumlah_transaksi: mode.izin ? 1_204_877 : null, jumlah_dompet: mode.izin ? 6 : null, akses_30hari: 9,
})
/* v2 (20261119101000): email utuh. ruang360 di bawah sudah memakai email karangan utuh, v1 menyamarkannya. */
const ruang360V2 = (p, mode) => {
  const r = ruang360(p, mode)
  return { ...r, ruang: { ...r.ruang, pemilik_email: EMAIL_PANJANG, pemilik_nama: AKUN[1].nama }, email_utuh: true }
}
const ruang360 = (p, mode) => ({
  kasus: p.p_kasus,
  ruang: {
    workspace_id: p.p_ws, nama: NAMA_RUANG, jenis: 'usaha', owner_nick: 'Bu Rahma Pemilik Toko', aturan_hapus: 'pemilik', fitur_patungan: true,
    ada_cara_bayar: true, ada_qris: true, pemilik_id: U, dibuat: jam(24 * 400),
  },
  hitung: mode.kosong
    ? { anggota: 1, bekas_anggota: 0, undangan_aktif: 0, transaksi: 0, dompet: 0, jejak: 0, sampah: 0, kategori: 0, anggaran: 0, jadwal_aktif: 0, produk: 0, struk: 0, patungan_bagi: 0, pelunasan: 0 }
    : { anggota: 12, bekas_anggota: 3, undangan_aktif: 3, transaksi: 1_204_877, dompet: 6, jejak: 412_904, sampah: 1_204, kategori: 41, anggaran: 9, jadwal_aktif: 17, produk: 1_312, struk: 96_410, patungan_bagi: 214, pelunasan: 61 },
  agregat: mode.kosong ? null : { transaksi: 1_204_877, masuk_bersih: 48_213_905_000, keluar_bersih: 41_100_000_000, terakhir_catat: jam(0.6) },
  anggota: (mode.kosong ? AKUN.slice(1, 2) : [AKUN[1], AKUN[0], AKUN[5], AKUN[6], AKUN[4], AKUN[7], AKUN[9], AKUN[3]]).map((a, i) => ({
    user_id: idAkun(AKUN.indexOf(a)), email: a.email, peran: i === 0 ? 'owner' : ['admin', 'member', 'viewer'][i % 3], joined_at: jam(24 * (400 - i * 31)), pemilik: i === 0,
    tx_oleh_dia: mode.kosong ? 0 : [31_204, 612_877, 48_213, 3_310, 0, 412, 96, 7][i], terakhir_catat_dia: mode.kosong || i === 4 ? null : jam(i * 11 + 1),
  })),
  bekas: mode.kosong ? [] : [{ user_id: idAkun(8), email: AKUN[8].email, tx_oleh_dia: 133 }, { user_id: idAkun(2), email: AKUN[2].email, tx_oleh_dia: 4_310 }, { user_id: uuid(99), email: null, tx_oleh_dia: 12 }],
  undangan: mode.kosong ? [] : ['aktif', 'diterima', 'dicabut', 'ditolak', 'kedaluwarsa', 'aktif'].map((status, i) => ({
    id: uuid(600 + i), peran: ['admin', 'member', 'viewer'][i % 3], status, ada_label: i % 2 === 0, target_email: i === 5 ? null : `kasir.cabang.${i + 1}.pasar.baru@contoh.invalid`,
    diundang_oleh: U, diterima_oleh: status === 'diterima' ? idAkun(6) : null, dibuat: jam(24 * (i * 6 + 1)), kedaluwarsa: jam(24 * (i * 6 - 6)),
    diterima_pada: status === 'diterima' ? jam(24 * 5) : null, dicabut_pada: status === 'dicabut' ? jam(24 * 10) : null, ditolak_pada: status === 'ditolak' ? jam(24 * 17) : null,
  })),
})
const katalogRuang = (p, mode) => ({
  kasus: p.p_kasus, workspace_id: p.p_ws, bulan: p.p_bulan ?? '2026-11',
  kategori: mode.kosong ? [] : [...KATEGORI, 'Pajak dan retribusi daerah', 'Perawatan alat', 'Bonus akhir tahun (arsip)'].map((name, i) => ({
    id: uuid(500 + i), name, kind: i === 0 ? 'income' : 'expense', icon: ['cart', 'box', 'users', 'home', 'zap', 'car', 'more', 'file', 'tool', 'gift'][i], color: '#0ea5e9',
    tampilan_tak_sah: i === 8, kode_tak_dikenal: false, archived: i === 9, created_at: jam(24 * (300 - i)), user_id: idAkun(i % 4),
    jumlah_transaksi: [612_877, 310_204, 48, 12, 96, 4_310, 133_000, 7, 0, 3][i], terakhir_dipakai: i === 8 ? null : jam(i * 20 + 1),
  })),
  anggaran: mode.kosong ? [] : [
    { lingkup: 'keseluruhan', category_id: uuid(0), target: 4_500_000_000, terpakai: 4_110_000_000, rasio: 0.9133 },
    ...[[1, 3_200_000_000, 3_412_905_500], [2, 480_000_000, 240_000_000], [3, 96_000_000, 96_000_000], [4, 18_000_000, 21_450_000], [5, 9_000_000, 1_250_000], [7, 12_000_000, 0], [9, 60_000_000, 0]]
      .map(([k, target, terpakai]) => ({ lingkup: 'kategori', category_id: uuid(500 + k), target, terpakai, rasio: terpakai / target })),
  ].map((a, i) => ({
    berulang: i % 2 === 0, sumber_id: uuid(540 + i), tepat_id: i % 2 ? uuid(540 + i) : null, berulang_id: i % 2 ? null : uuid(540 + i),
    kategori_kind: a.lingkup === 'kategori' ? 'expense' : null, kategori_archived: a.lingkup === 'kategori' ? i === 7 : null, tampil_di_aplikasi: i !== 7, ...a,
  })),
  baris_anggaran: mode.kosong ? [] : Array.from({ length: 8 }, (_, i) => ({ id: uuid(540 + i), category_id: uuid(500 + i + 1), month: i % 2 ? '2026-11-01' : '2026-01-01', amount: 9_000_000 * (i + 1), created_at: jam(24 * (i + 2)), user_id: idAkun(i % 4) })),
  terpotong: { kategori: false, baris_anggaran: false },
})
const JADWAL = [
  ['Cicilan mesin kasir dan timbangan digital toko cabang Pasar Baru', 'expense', 2_750_000, 'month', 24, 7, 'akan-datang'],
  ['Sewa kios tahunan', 'expense', 184_250_000, 'year', null, 2, 'terlambat'], ['Gaji karyawan mingguan', 'expense', 15_000_000, 'week', null, 96, 'hari-ini'],
  ['Setoran harian ke bank', 'income', 3_300_000, 'day', null, 310, 'akan-datang'], ['Pinjaman modal usaha', 'expense', 12_500_000, 'month', 36, 36, 'selesai'],
  ['Iuran keamanan pasar', 'expense', 99_900, 'month', null, 14, 'arsip'], ['Arisan pedagang', 'expense', 640_000, 'month', 12, 5, 'terlambat'],
  ['Tagihan pemasok beras', 'expense', 48_500_000, 'month', null, 9, 'akan-datang'],
]
const jadwalBaris = (j, i) => ({
  id: uuid(3700 + i), user_id: idAkun(i % 4), wallet_id: uuid(400 + (i % 5)), dompet_nama: DOMPET[i % 5], category_id: uuid(500 + (i % 7)), kategori_nama: KATEGORI[i % 7],
  title: j[0], kind: j[1], amount: j[2], cadence: j[3], anchor_day: 5 + i, anchor_month: j[3] === 'year' ? 3 : null, start_on: tanggal(200 + i * 30),
  next_due: j[6] === 'selesai' || j[6] === 'arsip' ? null : tanggal(j[6] === 'terlambat' ? 9 : j[6] === 'hari-ini' ? 0 : -12), total_count: j[4], paid_count: j[5], skipped_count: i % 3,
  partial_paid: i === 0 ? 1_000_000 : 0, dibayar_tercatat: j[2] * j[5], dibayar_awal: i === 4 ? 25_000_000 : 0, progress_reset_at: null, archived: j[6] === 'arsip', created_at: jam(24 * (200 + i * 30)),
  ada_catatan: i % 2 === 0, jumlah_pembayaran: j[5], jumlah_dilewati: i % 3, jumlah_penyesuaian: i === 0 ? 2 : 0, pembayaran_di_sampah: i === 1 ? 1 : 0,
  tempo_sekarang: j[6] === 'selesai' || j[6] === 'arsip' ? null : tanggal(j[6] === 'terlambat' ? 9 : j[6] === 'hari-ini' ? 0 : -12), next_due_basi: i === 6,
  terlambat: j[6] === 'terlambat', selesai: j[6] === 'selesai', keadaan: j[6], kode_tak_dikenal: false,
})
const jadwalRuang = (p, mode) => ({
  kasus: p.p_kasus, workspace_id: p.p_ws,
  ringkas: mode.kosong ? { total: 0, aktif: 0, arsip: 0, selesai: 0, terlambat: 0, cicilan: 0, berulang: 0 } : { total: 23, aktif: 17, arsip: 4, selesai: 2, terlambat: 3, cicilan: 6, berulang: 17 },
  baris: mode.kosong ? [] : JADWAL.map(jadwalBaris).filter(b => p.p_arsip == null || b.archived === p.p_arsip), terpotong: false,
})
const jadwalRinci = (p) => ({
  kasus: p.p_kasus, jadwal: jadwalBaris(JADWAL[0], 0),
  lewati: [{ id: uuid(3750), period_no: 3, due_on: tanggal(120), reason: 'belum_ada_uang', kode_tak_dikenal: false, created_at: jam(24 * 120), user_id: U }], lewati_lebih: false,
  penyesuaian: [{ id: uuid(3760), tx_id: uuid(3006), arah: 'tambah', nominal: 50_000, sebab: 'denda', kode_tak_dikenal: false, periode_ke: 4, created_at: jam(24 * 90), user_id: U }], penyesuaian_lebih: false,
  pembayaran: Array.from({ length: 7 }, (_, i) => ({ id: uuid(3770 + i), occurred_at: tanggal(i * 30 + 2), created_at: jam(24 * (i * 30 + 2)), amount: 2_750_000, kind: 'expense', installment_no: 7 - i, schedule_periods: 1, pencatat: U, ada_catatan: i === 0, jejak_jadwal: null })),
  pembayaran_lebih: false, di_sampah: [], di_sampah_lebih: false, rinci: { pembayaran: true, di_sampah: true },
})
const PRODUK = ['Beras premium pandan wangi karung 25 kilogram cap Dua Angsa', 'Minyak goreng 2 liter', 'Gula pasir 1 kg', 'Telur ayam negeri per kilogram', 'Mi instan kardus isi 40', 'Kopi bubuk 200 g', 'Sabun cuci piring', 'Air mineral galon', 'Jasa antar dalam kota', 'Tepung terigu 1 kg (arsip)']
const usahaRuang = (p, mode) => ({
  kasus: p.p_kasus, workspace_id: p.p_ws,
  ringkas: mode.kosong ? { total: 0, aktif: 0, arsip: 0, berstok: 0, menipis: 0, minus: 0 } : { total: 1_312, aktif: 1_240, arsip: 72, berstok: 1_198, menipis: 41, minus: 3 },
  produk: mode.kosong ? [] : PRODUK.map((name, i) => ({
    id: uuid(3800 + i), user_id: idAkun(i % 4), name, unit: ['karung', 'botol', 'kg', 'kg', 'dus', 'bungkus', 'botol', 'galon', 'kali', 'kg'][i], kategori: i % 3 ? 'Sembako' : 'Kebutuhan dapur dan rumah tangga', ada_kategori: i !== 8,
    sell_price: [412_500, 38_000, 17_500, 29_000, 118_000, 24_500, 12_000, 21_000, 15_000, 13_000][i], cost_price: i === 8 ? null : [371_000, 33_500, 15_200, 26_400, 104_000, 19_000, 9_500, 17_000, 0, 11_000][i],
    track_stock: i !== 8, stok_min: i !== 8 ? 10 : null, archived: i === 9, created_at: jam(24 * (300 - i * 7)), masuk: [12_400, 3_100, 900, 410, 96, 240, 120, 800, 0, 50][i], keluar: [12_388, 3_240, 480, 402, 30, 12, 20, 640, 0, 50][i],
    penyesuaian: i === 1 ? -4 : 0, stok: i === 8 ? null : [12, -144, 420, 8, 66, 228, 100, 160, 0, 0][i], menipis: i === 3, minus: i === 1,
    jumlah_terjual: [48_213, 31_204, 4_310, 3_310, 96, 12, 20, 640, 133, 50][i], terakhir_terjual: i === 9 ? null : jam(i * 5 + 1), ada_foto: i % 2 === 0,
  })).filter(b => p.p_arsip == null || b.archived === p.p_arsip),
  terpotong: false,
})
const stokRuang = (p, mode) => {
  const baris = mode.kosong ? [] : Array.from({ length: 10 }, (_, i) => ({
    id: uuid(3850 + i), product_id: uuid(3800 + (i % 5)), produk_nama: PRODUK[i % 5], delta: [120, -4, 400, -12, 50, -1, -30, 96, -8, 12][i], reason: ['awal', 'susut', 'opname', 'pakai'][i % 4],
    sebab_rinci: i % 4 === 1 ? ['rusak', 'kedaluwarsa', 'hilang'][i % 3] : i % 4 === 3 ? 'rumah' : null, kode_tak_dikenal: false, occurred_at: tanggal(i * 2), created_at: jam(i * 48 + 2), user_id: idAkun(i % 4), ada_catatan: i % 3 === 0,
  }))
  return { kasus: p.p_kasus, baris, kursor_berikut: null, total: baris.length ? 4_120 : 0, halaman_pertama: true }
}
const strukRuang = (p, mode) => {
  const baris = mode.kosong ? [] : Array.from({ length: 10 }, (_, i) => ({
    id: uuid(3600 + i), user_id: idAkun(i % 4), kind: i % 4 === 0 ? 'income' : 'expense', ocr_status: ['done', 'pending', 'failed', null, 'done'][i % 5], kode_tak_dikenal: false,
    uang_diterima: i % 4 === 0 ? 500_000 : null, created_at: jam(i * 9 + 1), tanggal: tanggal(Math.floor(i / 2)), ada_merchant: i % 2 === 0, ada_catatan: i % 3 === 0,
    ada_foto: i % 5 !== 3, jumlah_foto: i % 5 === 3 ? 0 : 1 + (i % 3), ada_kontak: i === 2 || i === 6, kontak_sidik: i === 2 || i === 6 ? 'c0ffee1234' : null, jumlah_baris: [5, 1, 23, 2, 8, 3, 41, 1, 6, 12][i],
    nominal_total: [412_500, 48_500, 7_412_905, 99_900, 1_250_000, 325_000, 15_000_000, 12_500, 640_000, 3_300_000][i], kembalian: i % 4 === 0 ? 87_500 : null,
    dompet_ids: [uuid(400 + (i % 5))], kasbon: i === 2 || i === 6, jumlah_produk: i % 2 ? 0 : 3 + i, baris_di_sampah: i === 4 ? 2 : 0,
  }))
  return {
    kasus: p.p_kasus, ringkas: p.p_kursor ? null : (mode.kosong
      ? { total: 0, masuk: 0, keluar: 0, kasbon: 0, ocr: { pending: 0, done: 0, failed: 0, tanpa: 0 }, dengan_foto: 0 }
      : { total: 96_410, masuk: 71_204, keluar: 25_206, kasbon: 1_312, ocr: { pending: 14, done: 61_877, failed: 310, tanpa: 34_209 }, dengan_foto: 62_201 }),
    baris, kursor_berikut: mode.kosong || p.p_kursor ? null : { c: jam(90), i: uuid(3609) }, total: baris.length ? 96_410 : 0, halaman_pertama: !p.p_kursor,
  }
}
const saldoPatungan = (i) => ({ user_id: idAkun([1, 0, 5, 6, 4][i]), saldo: [12_500_000, -4_250_000, -8_250_000, 0, 1_250_000][i], ditalangi: [48_500_000, 3_300_000, 0, 640_000, 2_750_000][i], ditanggung: [31_000_000, 9_550_000, 8_250_000, 640_000, 1_500_000][i], bayar_lunas: [0, 2_000_000, 0, 0, 0][i], terima_lunas: [5_000_000, 0, 0, 0, 0][i] })
const patunganRuang = (p, mode) => ({
  kasus: p.p_kasus, workspace_id: p.p_ws, fitur_patungan: true,
  saldo: mode.kosong ? [] : Array.from({ length: 5 }, (_, i) => saldoPatungan(i)), bekas: mode.kosong ? [] : [{ ...saldoPatungan(2), user_id: idAkun(8), saldo: -1_250_000 }],
  ringkas: mode.kosong
    ? { transaksi_dibagi: 0, total_dibagi: 0, pelunasan: 0, total_pelunasan: 0, pelunasan_tanpa_transfer: 0, selisih_bagi: 0, jumlah_saldo: 0, dibagi_tak_dihitung: 0 }
    : { transaksi_dibagi: 214, total_dibagi: 184_250_000, pelunasan: 61, total_pelunasan: 96_400_000, pelunasan_tanpa_transfer: 4, selisih_bagi: 1_500, jumlah_saldo: 0, dibagi_tak_dihitung: 2 },
})
const patunganRiwayat = (p, mode) => (p.p_jenis === 'lunas'
  ? {
      kasus: p.p_kasus, jenis: 'lunas', kursor_berikut: null, total: mode.kosong ? 0 : 61, halaman_pertama: true,
      baris: mode.kosong ? [] : Array.from({ length: 6 }, (_, i) => ({ id: uuid(3950 + i), dari: idAkun([0, 5, 6, 4, 0, 5][i]), ke: U, nominal: NOMINAL[(i + 3) % 12], transfer_group: i === 2 ? null : uuid(3560 + i), dicatat_oleh: idAkun(i % 4), pada: jam(i * 50 + 4), ada_catatan: i % 2 === 0, ada_bukti: i % 3 === 0, transfer_hidup: i !== 4 })),
    }
  : {
      kasus: p.p_kasus, jenis: 'bagi', kursor_berikut: null, total: mode.kosong ? 0 : 214, halaman_pertama: true,
      baris: mode.kosong ? [] : Array.from({ length: 6 }, (_, i) => ({
        id: uuid(3900 + i), occurred_at: tanggal(i * 3), created_at: jam(i * 72 + 2), amount: NOMINAL[(i + 6) % 12], kind: 'expense', pencatat: idAkun(i % 4), kategori_id: uuid(500 + (i % 7)), kategori: KATEGORI[i % 7], ada_catatan: i % 2 === 0,
        bagian: [1, 0, 5, 6].slice(0, 2 + (i % 3)).map(a => ({ user_id: idAkun(a), nominal: Math.round(NOMINAL[(i + 6) % 12] / (2 + (i % 3))) })), jumlah_bagian: 2 + (i % 3), selisih: i === 3 ? 1_500 : 0, dihitung_saldo: i !== 5,
      })),
    })

// ── Domi ─────────────────────────────────────────────────────────────────
const PERCAKAPAN = ['Berapa total pengeluaran belanja stok bulan ini dibanding bulan lalu, dan kategori mana yang paling naik', 'Catat belanja beras', 'Buat jadwal cicilan mesin kasir', 'Ringkasan laba kotor minggu ini', 'Kenapa saldo kas toko tidak cocok', 'Struk dari pemasok', 'Anggaran November']
const percakapanBaris = (judul, i) => ({ id: uuid(8000 + i), judul, jumlah_pesan: [14, 2, 6, 4, 22, 3, 8][i], dibuat: jam(i * 30 + 4), diperbarui: jam(i * 30 + 1) })
// Varian panjang (mode.domiPanjang, uji tata letak tab Domi): 48 percakapan
// dibagi per p_limit dengan kursor, total hanya di halaman pertama, seperti
// server. Percakapan pertama berisi 60 pesan, dibagi per p_limit dari yang
// terbaru lewat p_sebelum. mode.domiBaru menambah dua pesan baru di sana
// (uji Segarkan). Bawaan tetap tujuh percakapan pendek di atas.
const TOPIK_DOMI = [
  'Catat belanja beras', 'Ringkasan laba kotor minggu ini', 'Kenapa saldo kas toko tidak cocok', 'Struk dari pemasok',
  'Anggaran November', 'Buat jadwal cicilan mesin kasir', 'Pengeluaran listrik dan air', 'Bandingkan omzet dua cabang',
  'Transfer ke rekening tabungan', 'Catat gaji karyawan', 'Utang ke pemasok sayur', 'Target tabungan lebaran',
  'Penjualan pulsa hari ini', 'Rekap kasbon pelanggan', 'Harga pokok minyak goreng', 'Setoran harian ke bank',
]
const AKHIRAN_DOMI = ['', ' untuk cabang Pasar Baru', ' bulan lalu']
export const PERCAKAPAN_PANJANG = Array.from({ length: 48 }, (_, i) => ({
  id: uuid(8100 + i),
  // Satu judul kosong: console menulis "Percakapan tanpa judul".
  judul: i === 0 ? PERCAKAPAN[0] : i === 7 ? '' : `${TOPIK_DOMI[i % 16]}${AKHIRAN_DOMI[Math.floor(i / 16)]}`,
  jumlah_pesan: i === 0 ? 60 : 2 + ((i * 7) % 19),
  dibuat: jam(i * 9 + 30), diperbarui: jam(i * 9 + 0.5),
}))
const TANYA_DOMI = [
  'Berapa total penjualan kemarin?', 'Catat beli gas elpiji 3 tabung, bayar tunai', 'Kenapa saldo Bank Tabungan Usaha beda dengan mutasi?',
  'Tolong rangkum pengeluaran minggu ini per kategori', 'Bandingkan omzet cabang Pasar Baru dengan cabang Terminal bulan ini', 'Catat setoran ke bank Rp 3.300.000',
  'Berapa sisa anggaran belanja stok November?', 'Ubah catatan transaksi tadi jadi belanja telur, bukan beras', 'Siapa saja pelanggan yang masih kasbon lebih dari sebulan?',
  'Buat pengingat bayar sewa kios tiap tanggal 5', 'Berapa untung kotor dari penjualan minyak goreng?', 'Oke',
]
/** Daftar panjang menurut mode: percakapan pertama naik ke 62 pesan saat ada pesan baru. */
const daftarPanjang = mode => (mode.domiBaru
  ? [{ ...PERCAKAPAN_PANJANG[0], jumlah_pesan: 62, diperbarui: jam(0.1) }, ...PERCAKAPAN_PANJANG.slice(1)]
  : PERCAKAPAN_PANJANG)
const pesanPanjang = (p, mode) => {
  const n = Math.min(50, Math.max(1, p.p_limit ?? 30))
  const jumlah = mode.domiBaru ? 62 : 60
  const semua = Array.from({ length: jumlah }, (_, k) => {
    const id = k + 1
    const waktu = id > 60 ? jam(0.1 + (62 - id) * 0.05) : jam(0.5 + (60 - id) * 0.6)
    const ke = Math.floor(k / 2)
    if (k % 2 === 0) return { id, peran: 'user', isi: { teks: TANYA_DOMI[ke % TANYA_DOMI.length] }, dibuat: waktu, model: null, token_masuk: null, token_keluar: null, biaya: null }
    const jenis = ke % 6
    const blok = jenis === 0
      ? [{ tipe: 'teks', teks: `Penjualan kemarin **Rp ${2_400_000 + ke * 37_500}** dari ${40 + ke} transaksi.\n- Paling laku: beras premium\n- Jam ramai: 07.00 sampai 09.00` }]
      : jenis === 1
        ? [{ tipe: 'teks', teks: 'Saya siapkan drafnya. Periksa dulu sebelum disimpan.' }, { tipe: 'transaksi', draf: { nominal: 66_000 + ke * 1_000, jenis: 'keluar', kategori: KATEGORI[(ke % 6) + 1], dompet: DOMPET[ke % 3], tanggal: tanggal(ke % 4), catatan: 'Gas elpiji 3 tabung' } }]
        : jenis === 2
          ? [{ tipe: 'teks', teks: 'Selisihnya karena satu transfer belum dicatat. Coba cek mutasi tanggal 12.' }, { tipe: 'angka', label: 'Selisih saldo', nilai: 1_250_000 + ke * 10_000, satuan: 'rupiah', utama: true }]
          : jenis === 3
            ? [{ tipe: 'teks', teks: 'Ini rangkumannya.' }, { tipe: 'tabel', kolom: ['Kategori', 'Minggu ini', 'Minggu lalu'], baris: [['Belanja stok', 'Rp 4.120.000', 'Rp 3.870.000'], ['Listrik dan air', 'Rp 310.000', 'Rp 296.000'], ['Transportasi', 'Rp 96.000', 'Rp 120.000']] }]
            : jenis === 4
              ? [{ tipe: 'teks', teks: 'Cabang Pasar Baru masih unggul, selisihnya mengecil dibanding bulan lalu.' }, { tipe: 'saran', pilihan: ['Lihat per minggu', 'Tampilkan grafiknya'] }]
              : [{ tipe: 'teks', teks: 'Sudah saya catat.' }]
    // Jawaban lama belum menyimpan kredit, jadi kredit_dipakai tidak ada.
    const isi = ke < 4 ? { blok } : { blok, kredit_dipakai: 1 + (ke % 2) }
    return { id, peran: 'asisten', isi, dibuat: waktu, model: ke % 3 ? 'model-sintetis-1' : 'model-sintetis-teliti-panjang-namanya', token_masuk: 3_800 + ke * 41, token_keluar: 420 + ke * 9, biaya: 0.009 + ke * 0.0004 }
  })
  const batas = p.p_sebelum == null ? semua.length : semua.findIndex(x => x.id === p.p_sebelum)
  const pesan = semua.slice(Math.max(0, batas - n), batas)
  const adaLagi = batas - n > 0
  return { percakapan: daftarPanjang(mode)[0], pesan, kursor_sebelum: pesan.length ? pesan[0].id : null, ada_lagi: adaLagi, halaman_pertama: p.p_sebelum == null }
}
const aiPercakapanDaftar = (p, mode) => {
  if (mode.domiPanjang && !mode.kosong) {
    const semua = daftarPanjang(mode)
    const n = Math.min(50, Math.max(1, p.p_limit ?? 20))
    const mulai = p.p_kursor ? semua.findIndex(x => x.id === p.p_kursor.i) + 1 : 0
    const baris = semua.slice(mulai, mulai + n)
    const akhir = mulai + n >= semua.length
    return { baris, kursor_berikut: akhir ? null : { d: baris.at(-1).diperbarui, i: baris.at(-1).id }, total: p.p_kursor ? null : semua.length, halaman_pertama: !p.p_kursor }
  }
  const baris = mode.kosong ? [] : PERCAKAPAN.map(percakapanBaris)
  return { baris, kursor_berikut: null, total: baris.length, halaman_pertama: true }
}
const aiPesanDaftar = (p, mode = {}) => {
  if (mode.domiPanjang && p.p_percakapan === PERCAKAPAN_PANJANG[0].id) return pesanPanjang(p, mode)
  const panjang = mode.domiPanjang ? PERCAKAPAN_PANJANG.find(x => x.id === p.p_percakapan) : null
  const i = Math.max(0, PERCAKAPAN.findIndex((_, n) => uuid(8000 + n) === p.p_percakapan))
  const asisten = (id, j, blok) => ({ id, peran: 'asisten', isi: { blok, kredit_dipakai: 1 }, dibuat: jam(j), model: 'model-sintetis-1', token_masuk: 4_812, token_keluar: 612, biaya: 0.0123 })
  const pengguna = (id, j, teks) => ({ id, peran: 'user', isi: { teks }, dibuat: jam(j), model: null, token_masuk: null, token_keluar: null, biaya: null })
  return {
    percakapan: panjang ?? percakapanBaris(PERCAKAPAN[i], i), kursor_sebelum: null, ada_lagi: false, halaman_pertama: true,
    pesan: [
      pengguna(1, 4.0, PERCAKAPAN[0]),
      asisten(2, 3.99, [
        { tipe: 'teks', teks: 'Bulan ini belanja stok naik dibanding Oktober.\n**Yang paling naik**\n- Beras premium, naik **Rp 41200000**\n- Minyak goreng, naik Rp 9800000' },
        { tipe: 'angka', label: 'Belanja stok November', nilai: 3_412_905_500, satuan: 'rupiah', utama: true },
        { tipe: 'angka', label: 'Belanja stok Oktober', nilai: 3_200_000_000, satuan: 'rupiah' },
        { tipe: 'angka', label: 'Kenaikan', nilai: 6.7, satuan: 'persen' },
        { tipe: 'grafik', spec: { jenis: 'batang', judul: 'Belanja stok enam bulan terakhir', satuan: 'rupiah', data: ['Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov'].map((label, n) => ({ label, nilai: 2_400_000_000 + n * 190_000_000 })) } },
        { tipe: 'tabel', kolom: ['Kategori', 'Oktober', 'November', 'Total selisih'], baris: [['Beras premium pandan wangi', 'Rp 1.204.000.000', 'Rp 1.245.200.000', 'Rp 41.200.000'], ['Minyak goreng', 'Rp 310.000.000', 'Rp 319.800.000', 'Rp 9.800.000'], ['Gula pasir', 'Rp 96.000.000', 'Rp 94.500.000', '-Rp 1.500.000']] },
        { tipe: 'saran', pilihan: ['Bandingkan dengan tahun lalu', 'Tampilkan per pemasok', 'Buat anggaran belanja stok'] },
      ]),
      pengguna(3, 3.5, 'Catat belanja beras 25 karung dari pemasok langganan, bayar pakai kas toko, tolong sekalian masukkan ke stok'),
      asisten(4, 3.49, [
        { tipe: 'teks', teks: 'Saya siapkan drafnya. Periksa dulu sebelum disimpan.' },
        { tipe: 'transaksi', draf: { nominal: 9_275_000, jenis: 'keluar', kategori: KATEGORI[1], dompet: DOMPET[0], tanggal: tanggal(0), catatan: 'Beras premium 25 karung dari pemasok langganan' } },
        { tipe: 'aksi', label: 'Buka transaksi', tautan: '/transactions' },
      ]),
      pengguna(5, 3.2, 'Terima kasih'),
      asisten(6, 3.19, [{ tipe: 'teks', teks: 'Sama-sama. Kalau ada yang belum cocok di buku, tanya saja.' }]),
    ],
  }
}

// ── Halaman operasional ──────────────────────────────────────────────────
const waStatus = () => ({
  sekarang: new Date(SAAT).toISOString(),
  sesi: { status: 'connected', sejak: jam(30), dicek_pada: jam(0.03), galat: null },
  gangguan: ['kirim'], kirim_gangguan_sampai: null,
  otp: { aktif: true, wajib: true, darurat: false },
  batas: { terpakai_hari_ini: 214, harian: 300 },
  kiriman_24j: { diminta: 4_012, terkirim: 3_871, gagal: 141, tanpa_wa: 22, diketik: 3_640 },
  sebab_gagal_24j: [{ sebab: 'dibatasi', jumlah: 96 }, { sebab: 'nomor_tidak_terdaftar', jumlah: 31 }, { sebab: 'waktu_habis', jumlah: 14 }],
  terkirim_terakhir: jam(0.2),
  mode: { mode: 'keduanya', uji_mode: 'terbalik', tujuan_tersamar: '0811 •••• 0000', balas: false, ambang_tak_masuk: 8, batas_harian_masuk: 500, tahan_kredit: false },
  lapis: { bersama: [], kirim: ['kirim'], masuk: [] },
  cara_sehat: ['terbalik'],
  masuk_sapa: { ada: true, aktif: true, tertahan: 1, tertua_detik: 45, terakhir_ok: jam(0.02), dicek_pada: jam(0.03) },
  masuk_24j: { dibuat: 5_212, pesan: 4_904, berhasil: 4_433, beda: 21, habis: 0, tanpa_nomor: 37, kedaluwarsa: 112, tak_dikenal: 9, batas: 0, lid: 31 },
  masuk_batas: { terpakai_hari_ini: 421, harian: 500 },
  jendela_7h: [
    { mulai: jam(1.5), selesai: null, lapis: ['kirim'], wajib: false },
    { mulai: jam(30), selesai: jam(27.5), lapis: ['kirim', 'tak_diketik', 'tak_masuk'], wajib: true },
    { mulai: jam(100), selesai: jam(99.8), lapis: ['sesi'], wajib: true },
  ],
  pengguna: { terverifikasi_masuk: 44_120, terverifikasi_kirim: 31_077, lewat_gangguan_7h: 612, kredit_ditahan: 41, nomor_ramai_30h: 17 },
})
const LANGKAH_WA = [['lihat', 19_204, 89.5, 2_016], ['petunjuk', 17_188, 87.5, 2_148], ['pilih', 15_040, 100, 0], ['kirim', 14_012, 92.9, 994], ['kode_terkirim', 13_018, 100, 0], ['ketik', 12_640, 96.1, 492], ['mulai_terbalik', 2_104, 100, 0], ['buka_wa', 2_104, 81.2, 395], ['berhasil', 13_857, null, 0], ['lewat_email', 612, null, 0], ['hapus_akun', 14, null, 0], ['hubungi', 231, null, 0]]
  .map(([kunci, orang, lanjut, berhenti]) => ({ kunci, orang, lanjut, berhenti }))
const corongAlur = (p, mode) => {
  const langkah = mode.kosong ? LANGKAH_WA.map(l => ({ ...l, orang: 0, lanjut: null, berhenti: 0 })) : LANGKAH_WA
  return {
    alur: 'nomor_wa', dari: p.p_dari, sampai: p.p_sampai, batas_akhir: p.p_batas_akhir ?? null, total: { cara: null, versi: null, langkah },
    pecahan: mode.kosong ? [] : [
      { cara: 'wa_masuk', versi: '1.4.1', langkah: langkah.filter(l => ['lihat', 'mulai_terbalik', 'buka_wa', 'berhasil'].includes(l.kunci)).map(l => ({ ...l, orang: Math.round(l.orang / 6) })) },
      { cara: 'wa_sapa', versi: '1.4.1', langkah: langkah.filter(l => !['mulai_terbalik', 'buka_wa'].includes(l.kunci)).map(l => ({ ...l, orang: Math.round(l.orang / 2) })) },
      { cara: 'wa_sapa', versi: '1.4.0', langkah: langkah.filter(l => !['mulai_terbalik', 'buka_wa'].includes(l.kunci)).map(l => ({ ...l, orang: Math.round(l.orang / 3) })) },
      { cara: 'belum_diketahui', versi: null, langkah: langkah.slice(0, 2).map(l => ({ ...l, orang: 96 })) },
    ],
    telemetri: mode.kosong ? {} : { 'nomor_wa.lihat': 24_812, 'nomor_wa.petunjuk': 17_904, 'nomor_wa.kirim': 15_310 },
  }
}
const versiAplikasi = (p, mode) => ({
  hari: p.p_hari ?? 30, aktif: mode.kosong ? 0 : 48_213, aktif_luar: mode.kosong ? 0 : 48_101, diketahui: mode.kosong ? 0 : 46_877, diketahui_luar: mode.kosong ? 0 : 46_790,
  baris: mode.kosong ? [] : [
    ['android', 'prod', 26111301, '1.4.1', 31_204], ['android', 'prod', 26110702, '1.4.0', 9_877], ['android', 'prod', 26103106, '1.3.9', 3_310], ['android', 'prod', 26091504, '1.3.2', 1_240],
    ['android', 'uat', 26111502, '1.4.2-rc.3', 14], ['ios', 'prod', 26111301, '1.4.1', 1_232], ['android', 'prod', null, null, 1_336],
  ].map(([platform, varian, kode, versi, pengguna], i) => ({ platform, varian, kode, versi, pengguna, pengguna_luar: pengguna - (varian === 'uat' ? 14 : 3), terakhir: jam(i * 3 + 0.2) })),
  tertinggi: mode.kosong ? [] : [{ platform: 'android', varian: 'prod', kode: 26111301, versi: '1.4.1' }, { platform: 'android', varian: 'uat', kode: 26111502, versi: '1.4.2-rc.3' }, { platform: 'ios', varian: 'prod', kode: 26111301, versi: '1.4.1' }],
  konfig: {
    versi_android: { terbaru: 26111301, minimum: 26091504, catatan: 'Perbaikan masuk lewat WhatsApp dan tujuh masukan dari pengguna. Perbarui supaya kode masuk lebih cepat sampai.', catatan_en: 'Sign-in fixes and seven user requests.' },
    versi_android_uat: { terbaru: 26111502, minimum: null }, versi_android_ias: null,
  },
})
const ajakanPembaruan = (p, mode) => {
  const baris = mode.kosong ? [] : [
    ['pembaruan.ajakan_lihat', 26111301, null, null, 41_204, 12_877], ['pembaruan.ajakan_ketuk', 26111301, 'dalam', null, 6_120, 5_904], ['pembaruan.ajakan_ketuk', 26111301, 'pasar', null, 1_204, 1_188],
    ['pembaruan.ajakan_ketuk', 26111301, 'gagal', null, 96, 91], ['pembaruan.ajakan_tutup', 26111301, null, null, 9_310, 4_012], ['pembaruan.wajib_lihat', 26111301, null, true, 3_310, 1_240], ['pembaruan.wajib_ketuk', 26111301, 'pasar', true, 1_198, 1_102],
  ].map(([langkah, ke, jalur, tertahan, kejadian, orang]) => ({ langkah, ke, jalur, tertahan, kejadian, orang, orang_luar: orang - 3 }))
  return {
    hari: p.p_hari ?? 30, baris,
    ringkas: mode.kosong ? [] : ['pembaruan.ajakan_lihat', 'pembaruan.ajakan_ketuk', 'pembaruan.ajakan_tutup', 'pembaruan.wajib_lihat', 'pembaruan.wajib_ketuk'].map((langkah, i) => ({ langkah, ke: 26111301, kejadian: [41_204, 7_420, 9_310, 3_310, 1_198][i], orang: [12_877, 7_183, 4_012, 1_240, 1_102][i], orang_luar: [12_874, 7_180, 4_009, 1_237, 1_099][i] })),
    sampai: mode.kosong ? [] : [{ ke: 26111301, orang: 8_104, orang_luar: 8_101 }],
  }
}
const langkahUsaha = (p, mode) => ({
  hari: p.p_hari ?? 30,
  baris: mode.kosong ? [] : [
    ['ruang.panel_baru', 'beranda', 4_120, 3_310], ['ruang.panel_baru', 'pengaturan', 612, 540], ['ruang.pilih_usaha', '', 1_204, 1_102], ['ruang.buat_usaha', 'beranda', 912, 877], ['ruang.kelola', '', 310, 214], ['ruang.jadikan_usaha', '', 96, 91],
    ['ajakan_usaha.lihat', '', 12_877, 9_310], ['ajakan_usaha.ketuk', '', 1_240, 1_198], ['ajakan_usaha.tutup', '', 3_310, 3_104], ['usaha.produk_pertama', 'meja', 640, 640], ['usaha.jual_pertama', 'meja', 412, 412],
    ['usaha.beranda_lihat', 'kosong', 2_104, 912], ['usaha.langkah_ketuk', 'produk', 877, 640], ['usaha.pintasan', 'jual', 3_310, 540], ['usaha.langkah_tutup', '2', 96, 91], ['usaha.pulang', '', 214, 133],
  ].map(([langkah, isi, kejadian, orang]) => ({ langkah, isi, kejadian, orang, orang_luar: orang - 2 })),
  ruang_usaha_baru: mode.kosong ? [] : Array.from({ length: 5 }, (_, i) => ({ minggu: tanggal(i * 7 + 6), jumlah: 214 - i * 31, jumlah_luar: 212 - i * 31 })),
})
const CONFIG = [
  ['auth.verifikasi_email', 'wajib', true, 'Kode verifikasi email wajib sebelum masuk. Longgar hanya dipakai saat layanan surel terganggu.'],
  ['admin.pengecualian_email', ['tim***@contoh.invalid', 'uji***@contoh.invalid'], false, 'Akun yang tidak dihitung di ukuran keberhasilan', true],
  ['dukung_web', { aktif: true, batas_harian: 500, batas_ip_10menit: 5, batas_ip_harian: 20, penerima: 'CoreAsia Contoh' }, false, 'Dukung CashFlow lewat web. aktif true berarti halaman dukung menerima dukungan.'],
  ['versi_android', { terbaru: 26111301, minimum: 26091504, catatan: 'Perbaikan masuk lewat WhatsApp dan tujuh masukan dari pengguna.' }, true, 'Versi Play terbaru dan minimum'],
  ['versi_android_uat', { terbaru: 26111502, minimum: null }, true, 'Versi UAT terbaru dan minimum, hanya build UAT'],
  ['ai_play_billing', true, true, 'Pembelian kredit Domi lewat Google Play'],
  ['otp_wa.mode', 'keduanya', false, 'Cara membuktikan nomor WhatsApp: kirim, terbalik, keduanya, atau mati'],
  ['otp_wa.batas_harian', 300, false, 'Jumlah kode WhatsApp per hari untuk semua orang, dinaikkan sementara selama kampanye akhir tahun sampai tanggal 31 Desember'],
  ['fitur.pindai_struk', { aktif: true, mesin: 'sintetis-ocr-2', batas_per_hari: 40, bahasa: ['id', 'en'], cadangan: { aktif: false, mesin: null } }, true, null],
  ['domi.kredit_gratis', 20, true, 'Kredit gratis untuk akun baru'],
].map(([key, value, is_public, note, tersamar], i) => ({ key, value, is_public, note, updated_by: i % 2 ? 'admin.kedua.yang.panjang@contoh.invalid' : 'admin@contoh.invalid', updated_at: jam(i * 40 + 3), tersamar: !!tersamar }))
const dukunganRingkas = (p, mode) => ({
  dari: p.p_dari, sampai: p.p_sampai,
  ...(mode.kosong
    ? { masuk: 0, lunas: 0, rata: 0, qr_dibuat: 0, qr_tidak_dibayar: 0, gagal_dibuat: 0, menunggu: 0, perlu_tinjau: 0, dikembalikan: 0, biaya_qr: 0, biaya_mdr: 0, biaya_perkiraan: 0, bersih_perkiraan: 0, per_nominal: [], play: { lunas: 0, masuk: 0 }, uji_disembunyikan: 0 }
    : {
        masuk: 1_284_250_000, lunas: 31_204, rata: 41_156, qr_dibuat: 48_213, qr_tidak_dibayar: 16_877, gagal_dibuat: 14, menunggu: 96, perlu_tinjau: 3, dikembalikan: 2,
        biaya_qr: 9_642_600, biaya_mdr: 8_989_750, biaya_perkiraan: 18_632_350, bersih_perkiraan: 1_265_617_650,
        per_nominal: [{ nominal: '25000', qr: 21_204, dibayar: 14_012 }, { nominal: '50000', qr: 15_310, dibayar: 10_104 }, { nominal: '100000', qr: 8_877, dibayar: 5_612 }, { nominal: 'lain', qr: 2_822, dibayar: 1_476 }],
        play: { lunas: 412, masuk: 20_600_000 }, uji_disembunyikan: 7,
      }),
  buka: true,
})
const dukunganDaftar = (p, mode) => ({
  dari: p.p_dari, sampai: p.p_sampai, ada_lagi: !mode.kosong && !p.p_sebelum,
  baris: mode.kosong ? [] : ['lunas', 'menunggu', 'kedaluwarsa', 'gagal', 'perlu_tinjau', 'dikembalikan', 'lunas', 'lunas', 'lunas', 'menunggu'].map((status, i) => ({
    kode: `DK-2611-${String(48213 - i).padStart(6, '0')}`, sumber: i % 4 === 3 ? 'play' : 'web_qris', uji: i === 9, jumlah: [25_000, 50_000, 100_000, 1_000_000_000, 25_000, 50_000, 2_500_000, 25_000, 75_000, 50_000][i],
    jumlah_dibayar: status === 'lunas' || status === 'perlu_tinjau' || status === 'dikembalikan' ? [25_000, 0, 0, 0, 24_000, 50_000, 2_500_000, 25_000, 75_000, 0][i] : 0, status,
    nama: [null, 'Rahmawati Kusumaningsih Putri Handayani Wiryaatmadja Sastrowardoyo', 'Agus', null, 'Pedagang Pasar Baru Bandung', 'Nina', 'Toko Berkah Jaya Abadi', null, 'Lina', 'Penguji'][i],
    pesan: i % 3 === 0 ? 'Terima kasih, aplikasinya sangat membantu mencatat penjualan harian toko kami. Semoga terus berkembang dan fiturnya makin lengkap ya.' : i === 4 ? 'Semangat' : null,
    penerbit: i % 4 === 3 ? null : ['Bank Contoh Satu', 'Dompet Contoh', 'Bank Contoh Dua'][i % 3], ref_luar: i % 4 === 3 ? `GPA.3300-4444-5555-${66660 + i}` : `qr_sintetis_${1000 + i}`,
    dibuat: jam(i * 6 + 0.4), dibayar_pada: status === 'lunas' ? jam(i * 6 + 0.3) : null, habis_pada: jam(i * 6 + 0.4 - 0.25),
  })),
})
// ── Laporan (20261119110000, 20261119111000, asal 20261119130000) ────────
/* Grafik sampai kemarin: tanggal(1) .. tanggal(p_hari). Angka besar dan pola
   jam yang wajar (pagi, siang, malam) supaya peta dan grafik terbaca. */
const hariLaporan = p => Math.min(90, Math.max(7, Number(p.p_hari ?? 30)))
const POLA_JAM = [1, 0, 0, 0, 1, 3, 9, 18, 22, 16, 12, 14, 20, 15, 11, 10, 12, 15, 21, 26, 24, 17, 9, 4]
const POLA_HARI = [1.15, 1.05, 1, 1.02, 1.1, 0.8, 0.62]
const laporanJamRamai = (p, mode) => {
  const hari = hariLaporan(p)
  const skala = (hari / 30) * (p.p_jenis === 'usaha' ? 0.4 : p.p_jenis === 'pribadi' ? 0.6 : 1) * 61
  const sel = mode.kosong ? [] : POLA_HARI.flatMap((fh, d) => POLA_JAM.map((fj, jam) => {
    const usahaSiang = p.p_jenis === 'usaha' && jam >= 10 && jam <= 15 ? 1.8 : 1
    const transaksi = Math.round(fj * fh * skala * usahaSiang)
    return { dow: d + 1, jam, transaksi, orang: Math.max(1, Math.round(transaksi * 0.31)) }
  })).filter(x => x.transaksi > 0)
  const total = sel.reduce((a, x) => a + x.transaksi, 0)
  return { hari, dari: tanggal(hari), sampai: tanggal(1), jenis: p.p_jenis ?? null, zona: 'Asia/Jakarta', sel, total: { transaksi: total, orang: mode.kosong ? 0 : Math.round(total * 0.07) } }
}
const laporanHarian = (p, mode) => {
  const hari = hariLaporan(p)
  const baris = Array.from({ length: hari }, (_, i) => {
    const lalu = hari - i
    const g = 1 + 0.35 * Math.sin(i / 2.3) + (i % 7 === 5 ? -0.3 : 0)
    const v = x => (mode.kosong ? 0 : Math.max(0, Math.round(x * g)))
    return {
      tanggal: tanggal(lalu), pendaftar: v(412), aktif: v(31_204), pencatat: v(21_877), transaksi: v(96_410),
      tanya_domi: v(4_812), penanya_domi: v(1_204), beli_kredit: v(37), beli_rupiah: v(37) * 59_000,
      dukung_lunas: lalu <= 4 ? v(12) : 0, dukung_rupiah: lalu <= 4 ? v(12) * 50_000 : 0,
    }
  })
  const jumlah = k => baris.reduce((a, b) => a + b[k], 0)
  return {
    hari, dari: tanggal(hari), sampai: tanggal(1), baris,
    ringkas: {
      pendaftar: jumlah('pendaftar'), aktif: mode.kosong ? 0 : 61_877, pencatat: mode.kosong ? 0 : 41_204, transaksi: jumlah('transaksi'),
      tanya_domi: jumlah('tanya_domi'), penanya_domi: mode.kosong ? 0 : 9_310, beli_kredit: jumlah('beli_kredit'), beli_rupiah: jumlah('beli_rupiah'),
      dukung_lunas: jumlah('dukung_lunas'), dukung_rupiah: jumlah('dukung_rupiah'),
    },
  }
}
const laporanDukung = (p, mode) => {
  const hari = hariLaporan(p)
  /* Aplikasi 1.4.4 baru empat hari: ketukan hanya ada di empat hari terakhir. */
  const harian = Array.from({ length: hari }, (_, i) => {
    const lalu = hari - i
    const ada = !mode.kosong && lalu <= 4
    return { tanggal: tanggal(lalu), ketuk: ada ? 310 + lalu * 47 : 0, orang_ketuk: ada ? 204 + lalu * 31 : 0, qr: ada ? 96 + lalu : 0, lunas: ada ? 41 + lalu : 0, rupiah: ada ? (41 + lalu) * 50_000 : 0 }
  })
  const jumlah = k => harian.reduce((a, b) => a + b[k], 0)
  return {
    hari, dari: tanggal(hari), sampai: tanggal(1), ketuk_pertama: mode.kosong ? null : tanggal(4), harian,
    asal: mode.kosong ? [] : [{ kunci: 'setelan', ketuk: 1_204, orang: 877 }, { kunci: 'pengumuman', ketuk: 312, orang: 290 }, { kunci: 'tanpa', ketuk: 4, orang: 3 }],
    ringkas: { ketuk: jumlah('ketuk'), orang_ketuk: mode.kosong ? 0 : 1_077, qr: jumlah('qr'), lunas: jumlah('lunas'), rupiah: jumlah('rupiah') },
  }
}
const laporanAsal = (p, mode) => ({
  hari: Number(p.p_hari ?? 30),
  sumber: mode.kosong ? [] : [['instagram', 1_204], ['whatsapp', 877], ['tiktok', 312], ['(tanpa_utm)', 96], ['web', 41], ['(lain)', 7]].map(([kunci, orang]) => ({ kunci, orang })),
  jawaban: [['instagram', 2_310], ['tiktok', 1_077], ['whatsapp_teman', 3_104], ['google', 412], ['play_store', 1_877], ['lainnya', 96], ['lewati', 4_120]]
    .map(([kunci, orang]) => ({ kunci, orang: mode.kosong ? 0 : orang })),
  tanpa_data: mode.kosong ? 0 : 9_310,
})
/* Minat Kilas Pasar (spek analitik pasar 23 Nov 2026). Kartunya baru ada di
   aplikasi 1.6.0, jadi minat hanya ada di sepuluh hari terakhir dan hari
   sebelumnya nol (server tetap mengirim setiap tanggal). `mode.pasarLain`
   menambah baris sumber 'lain' dan sumber yang belum dikenal console. */
const SUMBER_PASAR = [
  ['gopay', 'dompet', 412, 310], ['bca', 'dompet', 296, 204], ['logammulia', 'emas_saham', 241, 188], ['pegadaian', 'emas', 177, 131],
  ['dana', 'dompet', 142, 120], ['indomaret', 'belanja', 96, 77], ['idx', 'emas_saham', 88, 70], ['shopeepay', 'dompet', 61, 52],
  ['mandiri', 'dompet', 47, 41], ['mypertamina', 'belanja', 33, 29], ['pegadaian', 'emas_saham', 21, 19], ['seabank', 'dompet', 9, 9],
]
// Laporan catat lewat WhatsApp (admin_wa_catat_laporan). p_hari 1, 7, atau 30. Tanpa pii per_pengguna null.
// mode.waKodeBaru menambah satu golongan berkode yang belum dikenal console.
// Server hanya mengirim kata huruf latin kecil 3..40 yang dipakai 3 orang atau lebih.
const KATA_WA = [['galon', 14, 7], ['parkir', 9, 5], ['laundry', 7, 4], ['sembako', 6, 4], ['fotokopi', 5, 3], ['jajan', 5, 3], ['sabun', 4, 3], ['tambalban', 4, 3], ['servis', 3, 3], ['ongkir', 3, 3], ['arisan', 3, 3], ['iuran', 3, 3]]
const waCatatLaporan = (p, mode) => {
  const hari = Number(p.p_hari) || 7
  const kecuali = p.p_kecuali_internal !== false
  const buka = !!p.p_alasan
  const sejak = new Date(SAAT - hari * 86_400_000).toISOString()
  const jejakUtuh = hari <= 2
  const k = mode.kosong ? 0 : 1
  const skala = hari === 1 ? 1 : hari === 7 ? 4 : 11
  const nHari = Math.round((SAAT + 7 * 3_600_000) / 86_400_000) - Math.round((SAAT - hari * 86_400_000 + 7 * 3_600_000) / 86_400_000) + 1
  const harian = Array.from({ length: nHari }, (_, i) => {
    const mundur = nHari - 1 - i
    const pesan = k * (mundur > 3 && hari === 30 && mundur > 20 ? 0 : [21, 19, 6, 14, 9, 12, 4, 7, 11, 3][mundur % 10])
    return {
      tanggal: tanggal(mundur), pesan, pengirim: Math.ceil(pesan / 3), dicatat: Math.round(pesan * 0.7),
      catatan: jejakUtuh || mundur <= 1 ? Math.round(pesan * 0.8) : null,
    }
  })
  const pesan = harian.reduce((a, h) => a + h.pesan, 0)
  const orang = AKUN.filter(a => !(kecuali && a.tim)).slice(0, mode.kosong ? 0 : 8)
  const samarE = e => `${e.slice(0, 3)}***@${e.split('@')[1]}`
  const hariAwal = iso => new Date(Math.floor((Date.parse(iso) + 7 * 3_600_000) / 86_400_000) * 86_400_000 - 7 * 3_600_000).toISOString()
  const golongan = mode.kosong ? [] : [
    ['catat', 'dicatat', 31, 6], ['domi', 'dijawab', 9, 3], ['batal', 'dibatalkan', 4, 2], ['bantuan', 'dijawab', 3, 3],
    ['foto', 'dicatat', 3, 2], ['catat', 'kuota', 2, 1], ['lain', 'basa_basi', 2, 2], ['stop', 'dimatikan', 1, 1], ['catat', 'gagal', 1, 1],
    ['ubah', 'diubah', 3, 2], ['rekap', 'dijawab', 2, 2], ['ubah', 'pilih_butir', 1, 1], ['rekap', 'ruang_tidak_ada', 1, 1],
    ...(mode.waKodeBaru ? [['pindah', 'dipindah', 2, 1]] : []),
  ].map(([jenis, hasil, jumlah, o]) => ({ jenis, hasil, jumlah: jumlah * skala, orang: o }))
  return {
    hari, kecuali_internal: kecuali, terbuka: buka && !!mode.izin, sekarang: new Date(SAAT).toISOString(),
    cakupan: { sejak, jejak_sejak: new Date(Math.max(SAAT - hari * 86_400_000, SAAT - 48 * 3_600_000)).toISOString(), jejak_jam: 48, jejak_utuh: jejakUtuh, telemetri_hari: 120 },
    ringkas: {
      menyala: k * (kecuali ? 212 : 219), pengirim: k * Math.min(orang.length + 4 * (skala - 1), 40), pesan, pesan_dicatat: Math.round(pesan * 0.7),
      catatan: k * 23, catatan_ada: k * 21, tanpa_kategori: k * 9, persen_tanpa_kategori: mode.kosong ? null : 43,
      batal: k * 4 * skala, domi: k * 12 * skala, domi_jawaban: k * 11 * skala, domi_biaya: k * 2_418.75 * skala,
      kuota: k * 2 * skala, stop: k * skala, gagal: k * skala,
      proses_median_dtk: mode.kosong ? null : 2.37, proses_p90_dtk: mode.kosong ? null : 6.2,
      simpan_median_dtk: mode.kosong ? null : 1.86, simpan_p90_dtk: mode.kosong ? null : 3.4,
    },
    corong: {
      pengumuman: 1, tampil: null, tampil_terukur: false, ketuk: k * 6 * Math.min(skala, 3), tutup: k * 8 * Math.min(skala, 3),
      pesan_pertama: k * 5 * Math.min(skala, 3), catatan_pertama: k * 4 * Math.min(skala, 3), kembali: k * 2 * Math.min(skala, 3),
    },
    harian,
    golongan,
    kata_tanpa_kategori: !mode.izin ? null : mode.kosong ? [] : KATA_WA.map(([kata, jumlah, o]) => ({ kata, jumlah, orang: o })),
    kesehatan: {
      pesan: k * 48, selesai: k * 46, gagal: k * 1, proses: k * 1, macet: k * 1, balas: k * 41, diam: k * 3, inbox: k * 2,
      terakhir_masuk: mode.kosong ? null : jam(0.2), terakhir_simpan: mode.kosong ? null : jam(0.25),
    },
    per_pengguna: !mode.izin ? null : orang.map((a, i) => {
      const terakhir = jam(0.3 + i * 5.5)
      const idx = AKUN.indexOf(a)
      return {
        user_id: idAkun(idx), nama: buka ? (a.nama || null) : null, email: buka ? a.email : samarE(a.email), internal: !!a.tim,
        pesan: [18, 11, 9, 7, 5, 3, 2, 1][i] ?? 1, dicatat: [14, 8, 6, 5, 3, 2, 1, 0][i] ?? 0, catatan: [9, 5, 4, 3, 2, 0, 0, 0][i] ?? 0,
        terakhir: buka ? terakhir : hariAwal(terakhir),
        status: i === 4 ? 'mati' : i === 6 ? 'tanpa_setelan' : 'menyala',
        kuota: i === 1 ? { pro: true, sakelar: true, sisa: 0, batas: 0 } : i === 3 ? { pro: false, sakelar: true, sisa: 0, batas: 150 } : { pro: false, sakelar: true, sisa: 150 - 17 * i, batas: 150 },
        versi: i === 5 ? null : { versi: i % 2 ? '1.6.1' : '1.7.0', kode: i % 2 ? '26112501' : '26112602', platform: a.ios ? 'ios' : 'android' },
      }
    }),
    per_pengguna_total: !mode.izin ? null : orang.length,
  }
}

const laporanPasar = (p, mode) => {
  const hari = hariLaporan(p)
  const f = hari / 30
  const v = x => (mode.kosong ? 0 : Math.round(x * f))
  const harian = Array.from({ length: hari }, (_, i) => {
    const lalu = hari - i
    const ada = !mode.kosong && lalu <= 10
    const g = 1 + 0.3 * Math.sin(lalu / 1.7)
    const x = n => (ada ? Math.max(0, Math.round(n * g)) : 0)
    return { tanggal: tanggal(lalu), lihat: x(612), detail: x(204), ketuk: x(118), halaman: x(131), domi: x(41) }
  })
  const sumber = mode.kosong ? [] : [
    ...SUMBER_PASAR.map(([s, jenis, ketuk, orang]) => ({ sumber: s, jenis, ketuk: v(ketuk), orang: v(orang) })),
    ...(mode.pasarLain ? [{ sumber: 'lain', jenis: 'dompet', ketuk: 6, orang: 5 }, { sumber: 'dompet_baru', jenis: 'dompet', ketuk: 4, orang: 4 }] : []),
  ].sort((a, b) => b.ketuk - a.ketuk || a.sumber.localeCompare(b.sumber)).slice(0, 20)
  const topik = (tanya, orang) => ({ tanya: v(tanya), orang: v(orang) })
  return {
    hari, dari: tanggal(hari), sampai: tanggal(1),
    ringkas: { lihat: v(3_104), detail: v(1_204), ketuk: v(712), halaman: v(796), domi: v(310) },
    harian,
    tab: { pasar: v(1_877), promo: v(1_310) },
    detail_dari: { kepala: v(904), ubin: v(612), promo: v(288), lain: v(4) },
    sumber,
    dari_promo: { cocok: v(877), semua: v(412), lihat_semua: v(530) },
    halaman: {
      asal: { kartu: v(1_204), domi: v(310), lain: v(12) },
      lama: { kurang_10: v(412), sampai_60: v(604), sampai_180: v(310), lebih_180: v(96) },
      browser: v(77), pindah: v(41),
    },
    tanya_kartu: { kurs: v(204), emas: v(131), promo: v(96) },
    domi: { kurs: topik(412, 204), emas: topik(310, 177), saham: topik(96, 61), promo: topik(131, 88), umum: topik(41, 33) },
  }
}
/* Kebiasaan pengguna aktif: jumlah orang per butir dan daftar orangnya. Jumlah
   di daftar sama dengan angka butirnya. Daftar butuh izin data pribadi. Dengan
   alasan nama dan email utuh, tanpa alasan email tersamar dan nama kosong.
   Kunci di luar daftar dijawab 22023 hint kunci. */
const BUTIR_KEBIASAAN = [
  ['satu_ruang', 201, 1], ['banyak_ruang', 111, 1], ['catat_banyak_ruang', 64, 1], ['berbagi_ruang', 47, 1], ['banyak_hp', 23, 1],
  ['catat_usaha', 58, 1], ['pakai_domi', 96, 1], ['beli_kredit', 9, 0], ['aktif_7', 187, 0], ['baru', 132, 1], ['baru_bertahan', 41, 1],
]
const skalaKebiasaan = hari => (hari <= 7 ? 0.4 : hari >= 90 ? 1.7 : 1)
const hitungKebiasaan = (p, mode) => {
  const hari = hariLaporan(p)
  const f = skalaKebiasaan(hari)
  const butir = BUTIR_KEBIASAAN.map(([kunci, orang, ikutRentang]) => ({ kunci, orang: mode.kosong ? 0 : Math.round(orang * (ikutRentang ? f : 1)) }))
  return { hari, akun: mode.kosong ? 0 : 1_204, aktif: mode.kosong ? 0 : Math.round(312 * f), butir }
}
const laporanKebiasaan = (p, mode) => ({ ...hitungKebiasaan(p, mode), ...(mode.butirAsing ? { butir: [...hitungKebiasaan(p, mode).butir, { kunci: 'butir_baru_server', orang: 5 }] } : {}) })
const AKUN_LUAR = AKUN.map((a, i) => ({ a, i })).filter(x => !x.a.tim)
const orangKebiasaan = (n, buka) => {
  const kenal = AKUN_LUAR[n]
  const id = kenal ? idAkun(kenal.i) : uuid(2000 + n)
  const nama = kenal ? (kenal.a.nama || null) : (n % 6 === 0 ? null : `Orang Contoh ${n + 1}`)
  const email = kenal ? kenal.a.email : `orang${n + 1}@contoh.invalid`
  return {
    user_id: id, nama: buka ? nama : null, email: buka ? email : samar(email),
    daftar: jam(24 * (3 + n * 2.4)), terakhir_catat: n % 11 === 7 ? null : jam(1.5 + n * 3.1),
    catatan: n % 11 === 7 ? 0 : 4_812 - Math.min(4_800, n * 37), ruang: 1 + (n % 4), ruang_bersama: n % 3 === 0 ? 1 + (n % 2) : 0,
    hp: 1 + (n % 5 === 0 ? 1 : 0), pesan_domi: n % 2 ? 0 : 120 - Math.min(119, n), beli_kredit: n % 9 === 0 ? 1 + (n % 3) : 0,
  }
}
const laporanKebiasaanDaftar = (p, mode) => {
  const h = hitungKebiasaan(p, mode)
  const total = p.p_kunci === 'aktif' ? h.aktif : h.butir.find(b => b.kunci === p.p_kunci)?.orang
  const hal = Math.max(1, Number(p.p_hal ?? 1))
  const perHal = 50
  const awal = (hal - 1) * perHal
  return {
    kunci: p.p_kunci, hari: h.hari, total, hal, per_hal: perHal, terbuka: !!p.p_alasan,
    baris: Array.from({ length: Math.max(0, Math.min(perHal, total - awal)) }, (_, i) => orangKebiasaan(awal + i, !!p.p_alasan)),
  }
}
const KUNCI_KEBIASAAN_SAH = new Set(['aktif', ...BUTIR_KEBIASAAN.map(b => b[0])])
/* Saldo: ruang bernama panjang, uang miliaran, minus dan internal ikut. */
const RUANG_SALDO = [
  [1, 'Toko Berkah Jaya Abadi Sentosa Makmur Cabang Pasar Baru Bandung Timur', 'usaha', 12, 4, 7_412_905_500, 412_000_000, 0, 1, -1_250_000],
  [0, 'Keuangan Saya', 'pribadi', 1, 5, 184_250_000, 0, 2_500_000, 0, 0],
  [2, 'Ruang uji internal tim', 'pribadi', 3, 9, 999_999_999_999, 0, 0, 0, 0],
  [3, 'Tabungan Dewi', 'pribadi', 1, 2, 12_877_000, 0, 0, 0, 0],
  [4, 'Dompet harian Raka', 'pribadi', 1, 3, -4_310_000, 0, 0, 2, -9_800_000],
  [5, 'Warung Kopi Toko Berkah', 'usaha', 3, 3, 96_410_000, 18_204_000, 0, 0, 0],
  [6, 'Keluarga Agus', 'pribadi', 4, 6, 27_600_000, 1_500_000, 310_000, 1, -2_104_000],
  [7, 'Bisnis', 'usaha', 1, 1, 0, 0, 0, 0, 0],
  [9, 'Catatan Lina', 'pribadi', 1, 2, 95_000, 0, 0, 0, 0],
].map(([siapa, nama, jenis, anggota, dompet, uang, piutang, arsip, minus, minusTotal], i) => ({
  workspace_id: uuid(100 + i), nama, jenis, pemilik_id: idAkun(siapa), pemilik_email: AKUN[siapa].email, pemilik_nama: AKUN[siapa].nama,
  internal: !!AKUN[siapa].tim, jumlah_anggota: anggota, jumlah_dompet: dompet, uang_nyata: uang, piutang, arsip,
  dompet_minus: minus, dompet_minus_total: minusTotal, terakhir_catat: jam(3 + i * 7.3),
}))
const ISI_KOSONG = { ruang: 0, dompet: 0, uang_nyata: 0, piutang: 0, arsip: 0, dompet_minus: 0, dompet_minus_total: 0 }
const isiDari = rs => rs.reduce((a, r) => ({
  ruang: a.ruang + 1, dompet: a.dompet + r.jumlah_dompet, uang_nyata: a.uang_nyata + r.uang_nyata, piutang: a.piutang + r.piutang,
  arsip: a.arsip + r.arsip, dompet_minus: a.dompet_minus + r.dompet_minus, dompet_minus_total: a.dompet_minus_total + r.dompet_minus_total,
}), { ...ISI_KOSONG })
const urutSaldo = (rows, urut, arah, nilai) => {
  const kali = arah === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const x = nilai(a, urut)
    const y = nilai(b, urut)
    if (x === y) return 0
    if (x === null) return 1
    if (y === null) return -1
    return (typeof x === 'string' ? x.localeCompare(y) : x - y) * kali
  })
}
const laporanSaldo = (p, mode) => {
  const cari = (p.p_cari ?? '').toLowerCase()
  let ruang = mode.kosong ? [] : RUANG_SALDO
  if (p.p_tanpa_internal) ruang = ruang.filter(r => !r.internal)
  const limit = Math.min(100, Math.max(1, Number(p.p_limit ?? 25)))
  const offset = Math.max(0, Number(p.p_offset ?? 0))
  const ringkasDari = (jumlah, isi, rs) => ({
    jumlah, ...isi, internal: rs.filter(r => r.internal).length,
    pribadi: (x => ({ ruang: x.ruang, uang_nyata: x.uang_nyata, piutang: x.piutang }))(isiDari(rs.filter(r => r.jenis === 'pribadi'))),
    usaha: (x => ({ ruang: x.ruang, uang_nyata: x.uang_nyata, piutang: x.piutang }))(isiDari(rs.filter(r => r.jenis === 'usaha'))),
  })
  const kepala = { mode: p.p_mode, jenis: p.p_jenis ?? null, limit, offset, dihitung_pada: new Date(SAAT).toISOString() }
  if (p.p_mode === 'pengguna') {
    let orang = AKUN.map((a, i) => {
      const milik = ruang.filter(r => r.pemilik_id === idAkun(i))
      const pr = isiDari(milik.filter(r => r.jenis === 'pribadi'))
      const us = isiDari(milik.filter(r => r.jenis === 'usaha'))
      return {
        user_id: idAkun(i), email: a.email, nama: a.nama, internal: !!a.tim, pribadi: pr, usaha: us, total: isiDari(milik),
        ruang_lain: [2, 0, 1, 0, 3, 0, 1, 0, 0, 1][i], terakhir_catat: milik.length ? milik[0].terakhir_catat : null, _milik: milik,
      }
    }).filter(o => (!p.p_tanpa_internal || !o.internal) && (!p.p_jenis || o[p.p_jenis].ruang > 0))
    if (cari) orang = orang.filter(o => o.email.includes(cari) || o.nama.toLowerCase().includes(cari))
    const pilih = o => (p.p_jenis ? o[p.p_jenis] : o.total)
    const nilai = (o, u) => ({ uang_nyata: pilih(o).uang_nyata, piutang: pilih(o).piutang, arsip: pilih(o).arsip, dompet: pilih(o).dompet, minus: pilih(o).dompet_minus_total, nama: (o.nama || o.email).toLowerCase(), terakhir: o.terakhir_catat, ruang_lain: o.ruang_lain })[u] ?? null
    const urut = urutSaldo(orang, p.p_urut ?? 'uang_nyata', p.p_arah ?? 'desc', nilai)
    const rs = orang.flatMap(o => o._milik).filter(r => !p.p_jenis || r.jenis === p.p_jenis)
    return { ...kepala, total: orang.length, baris: urut.slice(offset, offset + limit).map(({ _milik, ...o }) => o), ringkas: ringkasDari(orang.length, isiDari(rs), rs) }
  }
  if (p.p_jenis) ruang = ruang.filter(r => r.jenis === p.p_jenis)
  if (cari) ruang = ruang.filter(r => r.nama.toLowerCase().includes(cari) || r.pemilik_email.includes(cari) || r.pemilik_nama.toLowerCase().includes(cari))
  const nilai = (r, u) => ({ uang_nyata: r.uang_nyata, piutang: r.piutang, arsip: r.arsip, dompet: r.jumlah_dompet, minus: r.dompet_minus_total, nama: r.nama.toLowerCase(), terakhir: r.terakhir_catat, anggota: r.jumlah_anggota })[u] ?? null
  const urut = urutSaldo(ruang, p.p_urut ?? 'uang_nyata', p.p_arah ?? 'desc', nilai)
  return { ...kepala, total: ruang.length, baris: urut.slice(offset, offset + limit), ringkas: ringkasDari(ruang.length, isiDari(ruang), ruang) }
}
const hapusAkunDaftar = (p, mode) => {
  const status = p.p_status ?? 'menunggu'
  const baris = mode.kosong ? [] : Array.from({ length: status === 'menunggu' ? 7 : 5 }, (_, i) => ({
    id: uuid(1100 + i), user_id: idAkun((i + 8) % 10), email_samar: samar(AKUN[(i + 8) % 10].email), nama: mode.izin ? (AKUN[(i + 8) % 10].nama || null) : null, lewat: i % 3 === 0 ? 'surel' : 'aplikasi', status,
    diminta_pada: jam(24 * (i * 2 + 1) + 3), umur_hari: i * 2 + 1, lewat_7_hari: i * 2 + 1 >= 7, selesai_pada: status === 'selesai' ? jam(24 * i + 1) : null, dibatalkan_pada: status === 'dibatalkan' ? jam(24 * i + 1) : null,
    oleh: status === 'menunggu' ? null : 'admin@contoh.invalid', blokir: ['sql', 'edge', 'gagal'][i % 3], blokir_pada: i % 3 === 2 ? null : jam(24 * (i * 2 + 1) + 2.9),
    isi: { buku_milik: [1, 3, 0, 12, 2, 1, 4][i], buku_anggota: [0, 2, 1, 4, 0, 0, 7][i], transaksi_milik: [86, 48_213, 0, 1_204_877, 133, 7, 31_204][i], transaksi_pindah: [0, 16_923, 12, 612_877, 0, 0, 96][i], foto: [3, 9_310, 0, 96_410, 14, 0, 2_104][i], tertahan: i === 3 },
    tertahan: i === 3, foto_menunggu: i === 3 ? 4_120 : 0, foto_gagal: i === 1 ? 12 : 0,
  }))
  return { status, batas: p.p_batas ?? 200, jumlah: mode.kosong ? { menunggu: 0, selesai: 0, dibatalkan: 0 } : { menunggu: 7, selesai: 1_312, dibatalkan: 214 }, baris }
}
const S1 = uuid(901)
const aturan = ubah => ({ v: 1, segmen_id: null, saring: {}, kecuali_internal: true, kecuali_pengguna: [], kecuali_kelompok: [], ...ubah })
const PENGUMUMAN = [
  ['CashFlow 1.4.1 sudah tersedia di Play Store, perbarui supaya masuk lewat WhatsApp lebih cepat', 'info', { audience_type: 'aturan', audience_rules: aturan({ saring: { versi_di_bawah: 26111301 } }), recipient_count: 118_204, action_label: 'Perbarui sekarang', action_url: 'https://contoh.invalid/perbarui' }],
  ['Tips Domi minggu ini', 'info', { audience_type: 'aturan', audience_rules: aturan({ segmen_id: S1, saring: null, kecuali_pengguna: [idAkun(3)] }), segmen_nama: 'Pengguna aktif 30 hari yang punya ruang usaha', recipient_count: 64_012 }],
  ['Pemeliharaan server Sabtu malam', 'warning', { audience_type: 'all', audience_rules: null, recipient_count: 128_412, ends_at: jam(-48) }],
  ['Uji fitur kelompok', 'info', { audience_type: 'groups', group_ids: [uuid(801)], group_names: ['Penguji internal dan mitra toko percontohan'], recipient_count: 3, audience_rules: null }],
  ['Gangguan pembayaran QRIS sudah pulih', 'critical', { audience_type: 'all', audience_rules: null, recipient_count: 128_412, ends_at: jam(20) }],
  ['Untuk tiga akun yang melapor', 'info', { audience_type: 'users', user_ids: [idAkun(0), idAkun(4), idAkun(6)], recipient_count: 3, audience_rules: null }],
  // Pengumuman rutin bergaya kartu (20261119123000) dan "beberapa pengguna kecuali" (saring pengguna).
  ['Malas mengetik satu per satu?', 'info', { audience_type: 'aturan', audience_rules: aturan({ saring: { domi_pakai: false, daftar_lebih_dari_hari: 3, versi_min: 26111900, versi_tak_diketahui: 'tidak' } }), recipient_count: 41_077, gaya: 'kartu', rutin_id: uuid(1301), created_by: null, starts_at: jam(14), ends_at: jam(3) }],
  ['Uji kartu untuk mitra toko', 'info', { audience_type: 'aturan', audience_rules: aturan({ saring: { pengguna: [idAkun(0), idAkun(2), idAkun(5)] }, kecuali_pengguna: [idAkun(5)] }), recipient_count: 1, gaya: 'kartu' }],
].map(([title, level, ubah], n) => ({
  id: uuid(1200 + n), title, body: 'Perbarui aplikasi untuk memakai fitur terbaru. Catatan lama tetap aman, dan kamu tidak perlu masuk ulang sesudah memperbarui. Kalau ada kendala, balas pesan ini lewat menu Bantuan.',
  level, starts_at: jam(24 * n - 2), ends_at: null, created_by: null, created_at: jam(24 * n + 1), updated_at: jam(24 * n), action_label: null, action_url: null,
  audience_type: 'all', user_ids: [], group_ids: [], group_names: [], recipient_count: 0, segmen_nama: null, ...ubah,
}))
const SEGMEN = [
  { id: S1, nama: 'Pengguna aktif 30 hari yang punya ruang usaha', saring: { aktif_dalam_hari: 30, ruang: 'usaha' }, jumlah: 64_012, dipakai: 1, diubah: jam(48) },
  { id: uuid(902), nama: 'Belum pernah pakai Domi', saring: { domi_pakai: false }, jumlah: 41_077, dipakai: 0, diubah: jam(72) },
]
// Pengumuman rutin (20261119123000): tiga templat draf dan satu aktif, sakelar mati.
const TEMPLAT_RUTIN = [
  [uuid(1301), 'domi', 'Malas mengetik satu per satu?', 'Ketik saja ke Domi, misalnya bensin 20rb, makan siang 35rb, parkir 5rb. Domi memecahnya jadi tiga catatan, lalu kamu simpan semuanya dengan satu tombol. Domi ada di tombol bulat di atas tombol tambah.', null, null, { domi_pakai: false }, true, 2],
  [uuid(1302), 'dukung', 'Suka mencatat pakai CashFlow?', 'Kalau CashFlow membantu kamu tahu ke mana uangmu pergi, kamu bisa ikut menjaganya tetap jalan. Dukungannya sukarela, mulai dari Rp25.000. Bayarnya lewat QRIS dari aplikasi bank atau dompet digital yang biasa kamu pakai.', 'Dukung CashFlow', 'https://contoh.invalid/dukung', {}, false, 0],
  [uuid(1303), 'dukung', 'Terima kasih sudah pakai CashFlow', 'Catatan kecil setiap hari itu yang bikin laporanmu masuk akal. Kalau kamu merasa terbantu, kirim dukungan sukarela lewat QRIS dari halaman Dukung CashFlow.', 'Dukung CashFlow', 'https://contoh.invalid/dukung', { aktif_dalam_hari: 14 }, false, 0],
  [uuid(1304), 'lain', 'Mencatat bareng keluarga', 'Uang rumah sering dipegang lebih dari satu orang. Di Pengaturan, buka Anggota lalu undang pasangan atau keluargamu lewat email.', null, null, {}, false, 0],
].map(([id, topik, judul, isi, tombol, url, saring, aktif, terbit], i) => ({
  id, topik, judul, isi, tombol, url, aturan: aturan({ saring }), jeda_hari: 3, jam_mulai: 9, jam_akhir: 20, bobot: i === 0 ? 2 : 1, aktif,
  dibuat: jam(72 - i), versi: jam(30 - i), terbit, terakhir_terbit: terbit ? jam(14) : null,
}))
const daftarRutin = (p, mode) => ({
  sakelar: false, versi_min: 26111900, umur_min_hari: 3, gaya_ada: !mode.tanpaGaya,
  templat: mode.kosong ? [] : TEMPLAT_RUTIN,
  terakhir: mode.kosong ? null : { id: uuid(1206), rutin_id: uuid(1301), topik: 'domi', judul: TEMPLAT_RUTIN[0].judul, mulai: jam(14), sampai: jam(3) },
  rencana: mode.kosong
    ? { templat_id: null, topik: null, mulai: null, sampai: null, sebab: 'tanpa_templat', paling_cepat: null }
    : { templat_id: uuid(1301), topik: 'domi', mulai: jam(-28), sampai: jam(-39), sebab: 'jeda', paling_cepat: tanggal(-2) },
})
/** Cari penerima v2: utuh hanya bila dibuka (alasan) dan sesi ber-pii. */
const penggunaV2 = (p, mode) => {
  const buka = !!p.p_alasan && mode.izin
  const q = String(p.p_cari ?? '').trim().toLowerCase()
  const baris = AKUN.map((a, i) => ({ id: idAkun(i), a }))
    .filter(({ id, a }) => (!p.p_ids || p.p_ids.includes(id)) && (!q || id === q || a.email === q
      || (buka && (a.email.includes(q) || a.nama.toLowerCase().includes(q)))))
    .map(({ id, a }, i) => ({ id, email: buka ? a.email : samar(a.email), nama: buka ? (a.nama || null) : null, versi: a.ios ? null : i % 3 ? '1.4.3' : '1.4.4',
      internal: !!a.tim, jenis_internal: a.tim ? 'uji' : null }))
  return { total: mode.kosong ? 0 : baris.length, terbuka: buka, baris: mode.kosong ? [] : baris }
}
const AKUN_INTERNAL = [
  { user_id: uuid(501), email: 'pemilik@contoh.invalid', jenis: 'pemilik', catatan: 'Akun pemilik', diubah: jam(5) },
  { user_id: uuid(502), email: 'uji.anggota.ruang.usaha@contoh.invalid', jenis: 'uji', catatan: 'Uji anggota ruang usaha, dipakai skrip uji penerimaan tiap rilis', diubah: jam(5) },
  { user_id: uuid(503), email: 'uji.pribadi@contoh.invalid', jenis: 'uji', catatan: null, diubah: jam(5) },
  { user_id: uuid(504), email: 'peninjau@contoh.invalid', jenis: 'peninjau', catatan: 'Peninjau toko aplikasi', diubah: jam(5) },
]
const MODEL = ['model-sintetis-cepat', 'model-sintetis-teliti', 'model-sintetis-hemat']
const aiCadangan = (mode) => (mode.kosong
  ? { aktif: false, model: MODEL[0], model_pilihan: MODEL, kunci_ada: false, kunci_sidik: null, kunci_diubah_pada: null, terakhir_dipakai_pada: null, dipakai_24_jam: 0, terakhir_galat: null, terakhir_galat_pada: null, utama_terakhir_galat: null, utama_terakhir_galat_pada: null }
  : {
      aktif: true, model: MODEL[1], model_pilihan: MODEL, kunci_ada: true, kunci_sidik: 'ab12cd34ef', kunci_diubah_pada: jam(2), terakhir_dipakai_pada: jam(0.4), dipakai_24_jam: 48_213,
      terakhir_galat: 'Penyedia cadangan menolak permintaan karena batas laju tercapai, coba lagi beberapa saat. Kode sintetis 429 dari layanan tiruan.', terakhir_galat_pada: jam(6),
      utama_terakhir_galat: 'Penyedia utama tidak menjawab dalam batas waktu 30 detik pada tiga percobaan berturut-turut.', utama_terakhir_galat_pada: jam(0.5),
    })

const JENIS_AKTIVITAS = ['tx.catat', 'tx.ubah', 'tx.hapus', 'struk.catat', 'anggota.gabung', 'tx.pulih', 'dompet.arsip', 'rekonsiliasi.simpan', 'tx.catat', 'tx.buang', 'anggota.peran', 'kategori.arsip']
const RENTANG = ['< Rp 100 rb', 'Rp 100 rb sampai 1 jt', 'Rp 1 jt sampai 10 jt', 'Rp 10 jt sampai 100 jt', '> Rp 1 M', '']

/** Jawaban galat PostgREST untuk sesi tanpa izin data pribadi. */
const IZIN_KURANG = { status: 403, json: { code: '42501', message: 'izin-kurang', hint: 'izin-kurang', details: null } }
/** RPC yang ditolak server kalau sesi tidak memegang cashflow:pii. */
const BUTUH_PII = new Set([
  'admin_kasus_aktif_ruang', 'admin_kasus_buka', 'admin_kasus_tambah', 'admin_kasus_investigasi', 'admin_kasus_buka_dari_peristiwa', 'admin_corong_buka_kasus',
  'admin_pengguna_360', 'admin_ruang_360', 'admin_ruang_360_v2', 'admin_transaksi_cari', 'admin_transaksi_rinci', 'admin_jejak', 'admin_perjalanan_pengguna', 'admin_teks', 'admin_cari_v2',
  'admin_dompet_ruang', 'admin_laporan_saldo', 'admin_laporan_kebiasaan_daftar', 'admin_mutasi_dompet', 'admin_periksa_ruang', 'admin_sampah_ruang', 'admin_katalog_ruang', 'admin_jadwal_ruang', 'admin_jadwal_rinci',
  'admin_usaha_ruang', 'admin_stok_ruang', 'admin_struk_ruang', 'admin_patungan_ruang', 'admin_patungan_riwayat', 'admin_perangkat_pengguna', 'admin_kabar_pengguna',
  'admin_ai_percakapan_daftar', 'admin_ai_pesan_daftar', 'admin_ai_pembelian_daftar', 'admin_config_buka',
  'admin_hapus_pengumuman_rutin', 'admin_simpan_pengumuman_rutin',
])

const RPC = {
  // Ringkasan
  admin_stats: (p, m) => ({
    total_pengguna: m.kosong ? 0 : 128_412, total_ruang: m.kosong ? 0 : 161_077, total_transaksi: m.kosong ? 0 : 48_213_905,
    transaksi_per_hari: m.kosong ? [] : Array.from({ length: 30 }, (_, i) => ({ tanggal: tanggal(29 - i), jumlah: 90_000 + ((i * 13_711) % 42_000) })),
  }),
  admin_ukuran_keberhasilan_v2: (p, m) => [m.kosong ? { jumlah: 0, pembanding: 0, jumlah_pengecualian: 0 } : { jumlah: 41_204, pembanding: 38_077, jumlah_pengecualian: 4 }],
  admin_corong_aktivasi: (p, m) => (m.kosong ? [] : [['daftar', 32_012], ['masuk_lagi', 30_104], ['menyiapkan', 26_277], ['tx_pertama', 21_412], ['sepuluh_tx', 9_704]].map(([langkah, jumlah], i) => ({ urut: i + 1, langkah, jumlah }))),
  admin_retensi: (p, m) => (m.kosong ? [] : Array.from({ length: 6 }, (_, i) => ({ kohort: `2026-${String(6 + i).padStart(2, '0')}-01`, mendaftar: 15_000 + i * 2_200, pernah_catat: 11_000 + i * 1_500, catat_30hari: 6_000 + i * 900, bulan_berjalan: i === 5 }))),
  // Daftar
  admin_daftar_pengguna_v4: (p, m) => daftarPengguna(p, m, true),
  admin_daftar_pengguna_v5: (p, m) => daftarPengguna(p, m, true, true),
  admin_daftar_pengguna_v3: (p, m) => daftarPengguna(p, m, false),
  admin_daftar_pengguna_v2: () => [],
  admin_daftar_ruang_v2: (p, m) => (m.kosong ? [] : RUANG.map(r => (m.izin ? r : { ...r, jumlah_anggota: null, jumlah_tx: null, undangan_aktif: null }))),
  admin_daftar_ruang_v3: daftarRuangV3,
  admin_aktivitas_terbaru_v2: (p, m) => (m.kosong ? [] : JENIS_AKTIVITAS.map((jenis, i) => ({ id: 880_000 - i, jenis, rentang_nominal: RENTANG[i % RENTANG.length], tanggal: jenis.startsWith('tx') ? tanggal(Math.floor(i / 3)) : null }))),
  admin_langkah_usaha: langkahUsaha,
  admin_corong_alur: corongAlur,
  admin_kesehatan: (p, m) => ({
    ukuran_db: m.kosong ? 8_192 : 48_213_905_408,
    tabel: m.kosong ? {} : Object.fromEntries([['transactions', 48_213_905, 21_474_836_480], ['activity_events', 412_904_112, 16_106_127_360], ['transaction_groups', 9_641_077, 2_147_483_648], ['wallets', 412_877, 96_468_992], ['workspace_members', 310_204, 48_234_496], ['ai_messages', 2_104_877, 4_294_967_296], ['admin_audit', 1_312_044, 536_870_912], ['telemetry_events', 96_410_233, 3_221_225_472]].map(([n, baris, ukuran]) => [n, { baris, ukuran }])),
  }),
  admin_ocr_ringkas: (p, m) => (m.kosong ? [] : [{ status: 'done', jumlah: 61_877 }, { status: 'pending', jumlah: 14 }, { status: 'failed', jumlah: 310 }]),
  admin_foto_yatim: (p, m) => (m.kosong ? [] : Array.from({ length: 9 }, (_, i) => ({ bucket: i % 2 ? 'struk' : 'lampiran-transaksi', jalur: `${uuid(100 + i)}/${uuid(3000 + i)}/${uuid(9000 + i)}.jpg`, ukuran: 2_412_905 + i * 310_204, dibuat: jam(24 * (i + 2)), sebab: ['baris-hilang', 'unggah-batal', 'ruang-dihapus'][i % 3] }))),
  admin_telemetri_ringkas: (p, m) => (m.kosong ? [] : [['layar.buka', '/transactions', 4_812_905, 41_204], ['layar.buka', '/', 3_310_204, 48_101], ['tx.mulai', '/transactions', 1_204_877, 31_204], ['tx.batal', '/transactions', 310_204, 12_877], ['galat.js', '', 4_120, 1_312], ['onboarding.langkah', '/nomor-wa', 96_410, 19_204], ['layar.buka', '/pengaturan/ruang/anggota/undangan', 14_012, 9_310]].map(([jenis, layar, jumlah, pengguna]) => ({ jenis, layar, jumlah, pengguna }))),
  admin_versi_aplikasi: versiAplikasi,
  admin_ajakan_pembaruan: ajakanPembaruan,
  admin_wa_status: waStatus,
  admin_daftar_config_v2: (p, m) => (m.kosong ? [] : CONFIG),
  admin_dukungan_ringkas: dukunganRingkas,
  admin_dukungan_daftar: dukunganDaftar,
  admin_laporan_asal: laporanAsal,
  admin_laporan_dukung: laporanDukung,
  admin_laporan_harian: laporanHarian,
  admin_laporan_jam_ramai: laporanJamRamai,
  admin_laporan_kebiasaan: laporanKebiasaan,
  admin_laporan_kebiasaan_daftar: laporanKebiasaanDaftar,
  admin_laporan_pasar: laporanPasar,
  admin_wa_catat_laporan: waCatatLaporan,
  admin_laporan_saldo: laporanSaldo,
  admin_hapus_akun_daftar: hapusAkunDaftar,
  admin_daftar_pengumuman_v4: (p, m) => (m.kosong ? [] : PENGUMUMAN),
  admin_daftar_pengumuman_v3: (p, m) => (m.kosong ? [] : PENGUMUMAN.filter(x => x.audience_type !== 'aturan')),
  admin_daftar_segmen_pengumuman: (p, m) => (m.kosong ? [] : SEGMEN),
  admin_daftar_akun_internal: (p, m) => (m.kosong ? [] : AKUN_INTERNAL),
  admin_daftar_kelompok_pengumuman: (p, m) => (m.kosong ? { total: 0, baris: [] } : { total: 1, baris: [{ id: uuid(801), name: 'Penguji internal dan mitra toko percontohan', updated_at: jam(10), members: 3 }] }),
  admin_detail_kelompok_pengumuman: () => ({ id: uuid(801), name: 'Penguji internal dan mitra toko percontohan', updated_at: jam(10), members: 3, user_ids: [idAkun(0), idAkun(1), idAkun(2)] }),
  admin_pengumuman_pengguna: (p, m) => (m.kosong ? { total: 0, baris: [] } : { total: AKUN.length, baris: AKUN.map((a, i) => ({ id: idAkun(i), email: a.email })) }),
  admin_pengumuman_pengguna_v2: penggunaV2,
  admin_daftar_pengumuman_rutin: daftarRutin,
  admin_simpan_pengumuman_rutin: p => p.p_id,
  admin_hapus_pengumuman_rutin: () => null,
  admin_simpan_pengumuman_v5: p => p.p_id,
  admin_jumlah_penerima_pengumuman: (p, m) => (m.kosong ? 0 : 128_412),
  admin_pratinjau_penerima_pengumuman: (p, m) => ({ jumlah: m.kosong ? 0 : 118_204, tak_terjangkau_versi_lama: m.kosong ? 0 : 3_704, versi_tak_diketahui: m.kosong ? 0 : 1_336, dikecualikan_internal: 4, dikecualikan_lain: 0, contoh: m.kosong ? [] : AKUN.slice(0, 5).map((a, i) => ({ email_tersamar: samar(a.email), versi: i === 2 ? null : 26110702 })) }),
  admin_daftar_kasus: (p, m) => (m.kosong ? [] : KASUS_DAFTAR.map(k => (m.izin ? k : { ...k, ruang: null, jumlah_terdampak: null }))),
  admin_daftar_audit_v3: (p, m) => (m.kosong ? [] : AUDIT),
  admin_daftar_aksi_audit: (p, m) => (m.kosong ? [] : [...new Set(AUDIT.map(a => a.action))].map(action => ({ action, jumlah: AUDIT.filter(a => a.action === action).length * 1_204 }))),
  admin_ai_paket_daftar: (p, m) => ({ paket: m.kosong ? [] : PAKET, kini: new Date(SAAT).toISOString() }),
  admin_ai_pembelian_daftar: (p, m) => (m.kosong
    ? { baris: [], ringkas: { lunas: 0, nominal_lunas: 0, perkiraan_diterima: 0, batal: 0 }, lanjut: null }
    : { baris: PEMBELIAN, ringkas: { lunas: 12_877, nominal_lunas: 1_058_412_000, perkiraan_diterima: 912_340_150, batal: 214 }, lanjut: p.p_sebelum ? null : jam(90) }),
  admin_ai_cadangan_baca: (p, m) => aiCadangan(m),
  // Kasus
  admin_kasus_aktif: (p, m) => (m.izin ? { kasus: kasusPengguna(p.p_subjek), investigasi: [] } : { kasus: null, investigasi: [] }),
  admin_kasus_aktif_ruang: p => ({ kasus: kasusRuang(p.p_ws), investigasi: [] }),
  admin_kasus_buka: p => (p.p_subjek_tipe === 'workspace' ? kasusRuang(p.p_subjek) : kasusPengguna(p.p_subjek)),
  admin_kasus_tambah: (p) => { const k = kasusUntuk(p.p_kasus); return { ...k, ranah: [...new Set([...k.ranah, ...(p.p_ranah ?? [])])], ruang: [...new Set([...k.ruang, ...(p.p_ruang ?? [])])] } },
  admin_kasus_perpanjang: p => kasusUntuk(p.p_kasus),
  admin_kasus_tutup: p => ({ ...kasusUntuk(p.p_kasus), status: 'ditutup', ditutup: new Date(SAAT).toISOString() }),
  admin_kasus_investigasi: p => kasusAnak(p.p_induk, p.p_ranah ?? ['teks']),
  admin_kasus_buka_dari_peristiwa: p => ({ ...kasusRuang(W), peristiwa_id: p.p_peristiwa }),
  admin_corong_buka_kasus: () => kasusPengguna(U),
  admin_riwayat_akses: riwayatAkses,
  admin_cari_v2: () => ({ jenis_kueri: 'email', jumlah: 1, hasil: [{ jenis: 'pengguna', id: U, email: samar(EMAIL_PANJANG) }] }),
  admin_teks: p => ({ jenis: p.p_jenis, baris: (p.p_ids ?? []).map(id => ({ id, note: 'Catatan karangan untuk uji tampilan, cukup panjang supaya terlihat cara teksnya dibungkus di layar sempit.' })) }),
  // Pengguna 360
  admin_pengguna_kepala: kepalaPengguna,
  admin_pengguna_kepala_v2: kepalaPenggunaV2,
  admin_pengguna_360: pengguna360,
  admin_transaksi_cari: transaksiCari,
  admin_transaksi_rinci: p => ({ sumber: 'transaksi', transaksi: { ...transaksi(0, W), id: p.p_tx, jejak_jadwal: null }, pasangan: [], grup: null, jadwal: null, produk: null, lampiran: { ada_bukti: true, jumlah: 2 }, riwayat: [] }),
  admin_jejak: jejak,
  admin_perjalanan_pengguna: perjalanan,
  admin_perangkat_pengguna: perangkatPengguna,
  admin_kabar_pengguna: kabarPengguna,
  admin_ai_percakapan_daftar: aiPercakapanDaftar,
  admin_ai_pesan_daftar: aiPesanDaftar,
  // Ruang 360
  admin_ruang_kepala: kepalaRuang,
  admin_ruang_360: ruang360,
  admin_ruang_360_v2: ruang360V2,
  admin_dompet_ruang: dompetRuang,
  admin_mutasi_dompet: mutasiDompet,
  admin_periksa_ruang: (p, m) => ({ kasus: p.p_kasus, workspace_id: p.p_ws, cek: m.kosong ? [] : [{ cek: 'masa_depan', jumlah: 2 }, { cek: 'transfer_pincang', jumlah: 0 }, { cek: 'dompet_arsip', jumlah: 1 }, { cek: 'calon_ganda', jumlah: 3 }], jumlah_bermasalah: m.kosong ? 0 : 6, diperiksa_pada: new Date(SAAT).toISOString() }),
  admin_sampah_ruang: sampahRuang,
  admin_katalog_ruang: katalogRuang,
  admin_jadwal_ruang: jadwalRuang,
  admin_jadwal_rinci: jadwalRinci,
  admin_usaha_ruang: usahaRuang,
  admin_stok_ruang: stokRuang,
  admin_struk_ruang: strukRuang,
  admin_patungan_ruang: patunganRuang,
  admin_patungan_riwayat: patunganRiwayat,
}

export function buatServer() {
  /** Nama RPC yang dipanggil tetapi belum dikarang di sini. */
  const takDikenal = new Set()
  /** Nama RPC yang dijawab, untuk laporan. */
  const terpanggil = new Set()
  /** @returns {{ status?: number, json: unknown }} */
  const jawab = (nama, p, mode) => {
    // Server yang belum memasang migrasinya: PostgREST tidak menemukan fungsinya.
    if (mode.belumAda?.includes(nama)) {
      terpanggil.add(nama)
      return { status: 404, json: { code: 'PGRST202', details: null, hint: null, message: `Could not find the function public.${nama} in the schema cache` } }
    }
    // Server menahan laporan sampai waktu berlakunya: PostgREST menjawab P0001 dengan HTTP 400.
    if (mode.belumBerlaku?.includes(nama)) {
      terpanggil.add(nama)
      return { status: 400, json: { code: 'P0001', details: null, hint: 'laporan_wa_belum_berlaku', message: 'Laporan WhatsApp baru bisa dibuka mulai 30-11-2026 pukul 00.00 WIB.' } }
    }
    if (!mode.izin && BUTUH_PII.has(nama)) { terpanggil.add(nama); return IZIN_KURANG }
    if (nama === 'admin_laporan_kebiasaan_daftar' && !KUNCI_KEBIASAAN_SAH.has(p.p_kunci)) {
      terpanggil.add(nama)
      return { status: 400, json: { code: '22023', message: 'Butir tidak dikenal.', hint: 'kunci', details: null } }
    }
    const f = RPC[nama]
    if (!f) {
      takDikenal.add(nama)
      // Jawaban aman supaya halaman tidak macet: daftar kosong atau objek kosong.
      return { json: /^admin_(daftar_|ocr_|foto_|telemetri_)/.test(nama) ? [] : {} }
    }
    terpanggil.add(nama)
    return { json: f(p, mode) }
  }
  return { jawab, takDikenal, terpanggil, ditiru: Object.keys(RPC) }
}
