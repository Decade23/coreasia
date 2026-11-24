/**
 * Kosakata Perjalanan untuk telemetri aplikasi dan tonggak server.
 * Rincian yang diterjemahkan mengikuti daftar putih RPC Perjalanan.
 */
import { NAMA_SITUS_PASAR, NAMA_SUMBER_PASAR, POLA_ID_SUMBER } from './cashflowLaporanPasar'

type Bahasa = 'id' | 'en'
type Dwibahasa = Readonly<Record<Bahasa, string>>
const teks = (id: string, en: string): Dwibahasa => ({ id, en })

const KATEGORI = {
  aplikasi: teks('Aplikasi', 'App'),
  onboarding: teks('Pendaftaran dan pengenalan', 'Sign-up and onboarding'),
  nomor_wa: teks('Nomor WhatsApp', 'WhatsApp number'),
  pembaruan: teks('Pembaruan aplikasi', 'App updates'),
  transaksi: teks('Transaksi', 'Transactions'),
  usaha: teks('Ruang usaha', 'Business workspace'),
  galat: teks('Galat', 'Errors'),
  domi: teks('Domi', 'Domi'),
  kredit: teks('Kredit Domi', 'Domi credits'),
} as const
export type KategoriPerjalanan = keyof typeof KATEGORI
export const KATEGORI_PERJALANAN = Object.keys(KATEGORI) as KategoriPerjalanan[]

const BELUM_DIKENAL = teks('Belum dikenal', 'Unrecognized')
export function namaKategoriPerjalanan(kategori: string, bahasa: Bahasa): string {
  return ambil(KATEGORI, kategori)?.[bahasa] ?? BELUM_DIKENAL[bahasa]
}

type Bidang = {
  label: Dwibahasa
  nilai?: Readonly<Record<string, Dwibahasa>>
  /** kode: id katalog (huruf kecil, angka, garis bawah) yang boleh tampil apa adanya bila tidak punya label. */
  bentuk?: 'versi' | 'paket' | 'angka' | 'kode_build' | 'kode'
  maks?: number
  /** Nilainya larik anggota `nilai` (mis. topik domi.pasar). Satu anggota tunggal juga diterima. */
  larik?: true
}
const pilihan = (label: Dwibahasa, nilai: NonNullable<Bidang['nilai']>): Bidang => ({ label, nilai })
const yaTidak = (label: Dwibahasa): Bidang => pilihan(label, { true: teks('Ya', 'Yes'), false: teks('Tidak', 'No') })
const angka = (label: Dwibahasa, maks = 2_100_000_000): Bidang => ({ label, bentuk: 'angka', maks })
const versi = (label: Dwibahasa): Bidang => ({ label, bentuk: 'versi' })
const kodeBuild = (label: Dwibahasa): Bidang => ({ label, bentuk: 'kode_build' })

const HASIL = teks('Hasil', 'Result')
const SEBAB = teks('Alasan', 'Reason')
const ASAL = teks('Asal', 'Entry point')
const TAHAP = teks('Tahap', 'Step')
const JALUR = teks('Jalur', 'Channel')
const GANGGUAN = teks('Layanan WhatsApp sedang terganggu', 'WhatsApp service was disrupted')
const TANPA_NOMOR = teks('Nomor pengirim tidak terbaca', 'Sender number could not be read')
const TANPA_WA = teks('Nomor itu tidak punya WhatsApp', 'That number is not on WhatsApp')
const TERKIRIM = teks('Kode dikirim ke WhatsApp', 'Code sent to WhatsApp')
const MENUNGGU = teks('Menunggu', 'Pending')
const GAGAL_KIRIM = teks('Kode gagal dikirim', 'Code could not be sent')
const KEDALUWARSA = teks('Kode kedaluwarsa', 'Code expired')
const HABIS = teks('Batas percobaan habis', 'No attempts left')
const HUBUNGAN_WA = {
  tanpa_sesi: teks('Sesi masuk sudah berakhir', 'Sign-in session expired'),
  fitur_mati: teks('Verifikasi sedang tidak aktif', 'Verification was disabled'),
  nomor_salah: teks('Bentuk nomor tidak valid', 'Number format was invalid'),
  sudah_tersimpan: teks('Nomor WhatsApp sudah tersimpan', 'WhatsApp number was already saved'),
  terlalu_sering: teks('Permintaan terlalu sering', 'Too many requests'),
  gangguan: GANGGUAN,
  tak_sampai: teks('Kode tidak sampai', 'Code did not arrive'),
  luring: teks('Perangkat tidak terhubung ke internet', 'Device was offline'),
  lain: teks('Kendala lain', 'Other issue'),
}
const PILIH_NOMOR = pilihan(HASIL, {
  pilih: teks('Memilih nomor dari Google', 'Selected a number from Google'),
  batal: teks('Menutup pilihan nomor dari Google', 'Dismissed the Google number picker'),
  tidak_ada: teks('Google tidak menawarkan nomor', 'Google did not offer a number'),
})
const ASAL_WA = pilihan(ASAL, { gerbang: teks('Layar wajib', 'Required screen'), setelan: teks('Setelan', 'Settings') })
const ASAL_RUANG = pilihan(ASAL, {
  baris_baru: teks('Tombol Ruang baru', 'New workspace button'),
  baris_usaha: teks('Tombol Ruang usaha', 'Business workspace button'),
  ajakan_beranda: teks('Ajakan di Beranda', 'Home invitation'),
  tanya_awal: teks('Kartu tujuan akun baru', 'New account purpose card'),
  lain: teks('Pintu lain', 'Other entry point'),
})
const STATUS_OTP = pilihan(teks('Status kode', 'Code status'), {
  menunggu: MENUNGGU,
  berhasil: teks('Verifikasi berhasil', 'Verification succeeded'),
  kedaluwarsa: KEDALUWARSA,
  habis: HABIS,
  batal: teks('Dibatalkan', 'Cancelled'),
  diganti: teks('Diganti oleh kode baru', 'Replaced by a new code'),
})
const KIRIM_OTP = pilihan(teks('Pengiriman kode', 'Code delivery'), {
  menunggu: MENUNGGU, terkirim: TERKIRIM, gagal: GAGAL_KIRIM, tanpa_wa: TANPA_WA,
})
const PERCOBAAN = angka(teks('Percobaan', 'Attempts'), 5)
const STATUS_PEMBELIAN = pilihan(teks('Status pembelian', 'Purchase status'), {
  menunggu: MENUNGGU, lunas: teks('Lunas', 'Paid'),
  kedaluwarsa: teks('Kedaluwarsa', 'Expired'), batal: teks('Dibatalkan', 'Cancelled'),
})

type Peristiwa = {
  kategori: KategoriPerjalanan
  judul: Dwibahasa
  arti: Dwibahasa
  bidang: Readonly<Record<string, Bidang>>
  judulDari?: string
}
function peristiwa(
  kategori: KategoriPerjalanan, judul: Dwibahasa, arti: Dwibahasa,
  bidang: Peristiwa['bidang'] = {}, judulDari?: string,
): Peristiwa {
  return { kategori, judul, arti, bidang, judulDari }
}
const usaha = (judul: Dwibahasa, arti: Dwibahasa, bidang?: Peristiwa['bidang']) => peristiwa('usaha', judul, arti, bidang)
const whatsapp = (judul: Dwibahasa, arti: Dwibahasa, bidang: Peristiwa['bidang'] = {}, judulDari?: string) =>
  peristiwa('nomor_wa', judul, arti, { asal: ASAL_WA, ...bidang }, judulDari)
const BUILD_PEMBARUAN = {
  dari: kodeBuild(teks('Kode build terpasang', 'Installed build code')),
  ke: kodeBuild(teks('Kode build tujuan', 'Target build code')),
}
const PEMBARUAN_TERTAHAN = yaTidak(teks('Menunggu sinkronisasi', 'Waiting for sync'))
const PEMBARUAN_JALUR = pilihan(JALUR, {
  dalam: teks('Pembaruan dalam aplikasi', 'In-app update'),
  pasar: teks('Aplikasi toko', 'Store app'),
  web: teks('Situs toko', 'Store website'),
  gagal: teks('Toko gagal dibuka', 'Could not open store'),
})
const GAYA_PENGUMUMAN = pilihan(teks('Gaya pengumuman', 'Announcement style'), {
  modal: teks('Popup', 'Popup'), kartu: teks('Kartu di Beranda', 'Home card'),
})
const pembaruan = (judul: Dwibahasa, arti: Dwibahasa, bidang?: Peristiwa['bidang']) =>
  peristiwa('pembaruan', judul, arti, { ...BUILD_PEMBARUAN, ...bidang })

/* Kilas Pasar dan halaman resmi (spek analitik pasar dan promo 23 Nov 2026,
   E1 sampai E10 dari aplikasi 1.6.0, S1 dari server). Nama merek sama di
   kedua bahasa. */
const merek = (nama: Readonly<Record<string, string>>): Record<string, Dwibahasa> =>
  Object.fromEntries(Object.entries(nama).map(([k, n]) => [k, teks(n, n)]))
const SUMBER = teks('Sumber', 'Source')
const TAB_KARTU = pilihan(teks('Tab', 'Tab'), { pasar: teks('Pasar', 'Market'), promo: teks('Promo', 'Promos') })
const ASAL_HALAMAN = pilihan(ASAL, {
  kartu: teks('Kartu Kilas Pasar', 'Market card'), domi: teks('Jawaban Domi', 'Domi answer'), lain: teks('Pintu lain', 'Other entry point'),
})
const SITUS_HALAMAN = pilihan(teks('Situs', 'Site'), { ...merek(NAMA_SITUS_PASAR), lain: teks('Situs lain', 'Other site') })
const pasar = (judul: Dwibahasa, arti: Dwibahasa, bidang?: Peristiwa['bidang']) => peristiwa('aplikasi', judul, arti, bidang)
const halaman = (judul: Dwibahasa, arti: Dwibahasa, bidang?: Peristiwa['bidang']) =>
  peristiwa('aplikasi', judul, arti, { asal: ASAL_HALAMAN, sumber: SITUS_HALAMAN, ...bidang })

/* Rilis 1.7.0 (katalog 20261124230000_perjalanan_katalog_170): catatan
   pertama, form catat, pengingat harian, pilihan siap pakai jadwal, widget,
   catat lewat WhatsApp, dan catat dari notifikasi. */
const aplikasi = (judul: Dwibahasa, arti: Dwibahasa, bidang?: Peristiwa['bidang']) => peristiwa('aplikasi', judul, arti, bidang)
const PINTU_LAIN = teks('Pintu lain', 'Other entry point')
const SETELAN = teks('Setelan', 'Settings')
const ASAL_CATAT = {
  plus: teks('Tombol +', 'Plus button'),
  kartu: teks('Kartu catatan pertama di Beranda', 'First record card on Home'),
  otomatis: teks('Terbuka sendiri untuk akun baru', 'Opened automatically for a new account'),
  widget: teks('Widget di layar utama HP', 'Home screen widget'),
  pengingat: teks('Notifikasi pengingat harian', 'Daily reminder notification'),
  lain: PINTU_LAIN,
}
const FORM_CATAT = {
  form: pilihan(teks('Form', 'Form'), {
    transaksi: teks('Form transaksi lengkap', 'Full transaction form'), cepat: teks('Catat cepat', 'Quick record'),
  }),
  mode: pilihan(teks('Mode', 'Mode'), {
    baru: teks('Catatan baru', 'New record'), ubah: teks('Mengubah catatan', 'Editing a record'), salin: teks('Menyalin catatan', 'Copying a record'),
  }),
  asal: pilihan(ASAL, { ...ASAL_CATAT, cocokkan: teks('Cocokkan saldo', 'Reconcile balance') }),
  pertama: yaTidak(teks('Akun belum pernah mencatat', 'Account had no records yet')),
}
const PILIHAN_CEPAT = teks('Pilihan cepat', 'Quick choice')
const NILAI_PILIHAN_CEPAT = {
  makan: teks('Makan', 'Food'), bensin: teks('Bensin', 'Fuel'), jajan: teks('Jajan', 'Snacks'),
  belanja: teks('Belanja', 'Shopping'), pulsa: teks('Pulsa', 'Phone credit'), lainnya: teks('Lainnya', 'Other'),
  gaji: teks('Gaji', 'Salary'), kiriman: teks('Kiriman', 'Money sent to me'), jualan: teks('Jualan', 'Sales'),
}
const JAM_PENGINGAT = angka(teks('Jam pengingat', 'Reminder hour'), 23)
const PRESET_JADWAL = pilihan(teks('Pilihan siap pakai', 'Ready-made option'), {
  paylater: teks('Paylater', 'Pay later'), autodebet: teks('Autodebet', 'Auto debit'), gajian: teks('Gajian', 'Payday'),
})
const ASAL_PRESET = {
  kosong: teks('Layar Jadwal yang masih kosong', 'Empty schedules screen'),
  pintu: teks('Lembar Jadwal baru', 'New schedule sheet'),
}
const KEADAAN_WIDGET = {
  jatah: teks('Sisa jatah tampil', 'Remaining budget shown'),
  lewat: teks('Jatah hari ini sudah terpakai', 'Today’s budget already used'),
  habis: teks('Jatah harian nol', 'Daily budget is zero'),
  tanpa_jatah: teks('Jatah belum bisa dihitung', 'Budget not available yet'),
  tersembunyi: teks('Angka disembunyikan', 'Amount hidden'),
  basi: teks('Isi widget dari hari sebelumnya', 'Widget content from an earlier day'),
}
const LABEL_KEADAAN_WIDGET = teks('Keadaan widget', 'Widget state')
const JENIS_APLIKASI_NOTIF = pilihan(teks('Jenis aplikasi', 'App type'), {
  dompet: teks('Dompet digital', 'E-wallet'), bank: teks('Bank', 'Bank'),
})
const MODE_NOTIF = pilihan(teks('Cara simpan', 'Saving mode'), {
  tanya: teks('Tanya dulu', 'Ask first'), otomatis: teks('Simpan otomatis', 'Save automatically'),
})
const hitungNotif = (id: string, en: string) => angka(teks(id, en), 300)

export const KAMUS_JENIS_PERJALANAN = {
  'layar.buka': peristiwa('aplikasi', teks('Membuka layar', 'Opened screen'),
    teks('Aplikasi berpindah ke layar lain.', 'The app navigated to another screen.')),
  'onboarding.langkah': peristiwa('onboarding', teks('Langkah pengenalan', 'Onboarding step'),
    teks('Aplikasi mencatat satu langkah pengguna.', 'The app recorded a user step.')),
  'galat.js': peristiwa('galat', teks('Galat aplikasi', 'App error'),
    teks('Aplikasi mencatat galat saat berjalan.', 'The app recorded a runtime error.'), {
      fatal: yaTidak(teks('Galat fatal', 'Fatal error')),
      sumber: pilihan(teks('Bagian aplikasi', 'App area'), { kedepan: teks('Analisa ke depan', 'Forecast') }),
      sebab: pilihan(SEBAB, {
        'fetch-lambat-beruntun': teks('Permintaan berulang kali melewati batas waktu', 'Repeated request timeouts'),
        'antrean-macet': teks('Perubahan lama tertahan di antrean kirim', 'Changes stuck in the send queue'),
      }),
      tahap: pilihan(TAHAP, { kepala: teks('Menunggu awal balasan', 'Waiting for response headers'), badan: teks('Membaca isi balasan', 'Reading response body') }),
      beruntun: angka(teks('Permintaan yang gagal beruntun', 'Consecutive failed requests')),
      batasMs: angka(teks('Batas waktu (ms)', 'Timeout (ms)')),
      umurProsesDetik: angka(teks('Detik sejak aplikasi berjalan', 'Seconds since app startup')),
      menunggu: angka(teks('Perubahan yang belum terkirim', 'Unsent changes'), 10_000),
      tertuaDetik: angka(teks('Umur perubahan tertua (detik)', 'Oldest change age (seconds)'), 31_536_000),
      sebabTerakhir: pilihan(teks('Sebab gagal terakhir', 'Last failure reason'), {
        luring: teks('Perangkat tidak terhubung', 'Device offline'),
        lambat: teks('Sambungan terlalu lambat', 'Connection too slow'),
        kedaluwarsa: teks('Sesi kedaluwarsa', 'Session expired'),
        jam: teks('Jam perangkat tidak tepat', 'Device clock is off'),
        sesi: teks('Sesi masuk bermasalah', 'Sign-in session problem'),
        izin: teks('Ditolak karena izin', 'Rejected for permissions'),
        sibuk: teks('Server sedang sibuk', 'Server busy'),
        lain: teks('Kendala lain', 'Other issue'),
      }),
      tersangkut: angka(teks('Putaran antrean yang tersangkut', 'Stuck queue rounds'), 10_000),
      luring: yaTidak(teks('Percobaan terakhir saat luring', 'Last attempt was offline')),
      macet: yaTidak(teks('Terlalu sering gagal', 'Failed too often')),
    }),
  'tx.mulai': peristiwa('transaksi', teks('Membuka formulir transaksi', 'Opened transaction form'),
    teks('Pengguna membuka formulir untuk melihat atau mencatat transaksi.', 'The user opened the form to view or record a transaction.')),
  'tx.batal': peristiwa('transaksi', teks('Menutup formulir transaksi', 'Closed transaction form'),
    teks('Pengguna menutup formulir tanpa menyimpan dari formulir itu.', 'The user closed the form without saving from it.')),
} as const

export const KAMUS_LANGKAH_PERJALANAN = {
  'aplikasi.versi': peristiwa('aplikasi', teks('Aplikasi diluncurkan', 'App launched'),
    teks('Aplikasi mencatat versi pada peluncuran ini.', 'The app recorded its version for this launch.'), {
      versi: versi(teks('Versi aplikasi', 'App version')),
      kode: kodeBuild(teks('Kode build', 'Build code')),
      platform: pilihan(teks('Platform', 'Platform'), {
        android: teks('Android', 'Android'), ios: teks('iOS', 'iOS'), web: teks('Web', 'Web'),
        macos: teks('macOS', 'macOS'), windows: teks('Windows', 'Windows'), native: teks('Aplikasi perangkat', 'Native app'),
      }),
      varian: pilihan(teks('Varian aplikasi', 'App variant'), {
        prod: teks('Publik', 'Public'), uat: teks('Uji internal', 'Internal testing'), ias: teks('Uji toko', 'Store testing'),
      }),
    }),
  'ruang.panel_baru': usaha(teks('Membuka panel Ruang baru', 'Opened new workspace panel'),
    teks('Pengguna membuka pilihan untuk membuat ruang.', 'The user opened the options for creating a workspace.'), { asal: ASAL_RUANG }),
  'ruang.pilih_usaha': usaha(teks('Memilih jenis ruang usaha', 'Selected a business workspace'),
    teks('Pengguna memilih Usaha di panel Ruang baru.', 'The user selected Business in the new workspace panel.')),
  'ruang.buat_usaha': usaha(teks('Membuat ruang usaha', 'Created a business workspace'),
    teks('Pengguna menyelesaikan pembuatan ruang usaha.', 'The user finished creating a business workspace.'), { asal: ASAL_RUANG }),
  'ruang.kelola': usaha(teks('Membuka Kelola ruang', 'Opened workspace management'),
    teks('Pengguna masuk ke pengelolaan ruang.', 'The user opened workspace management.')),
  'ruang.jadikan_usaha': usaha(teks('Menjadikan ruang sebagai usaha', 'Converted a workspace to business'),
    teks('Pengguna mengubah ruang yang sudah ada menjadi ruang usaha.', 'The user converted an existing workspace to a business workspace.')),
  'ajakan_usaha.lihat': usaha(teks('Melihat ajakan ruang usaha', 'Saw the business workspace invitation'),
    teks('Beranda menampilkan ajakan membuat ruang usaha.', 'Home showed an invitation to create a business workspace.')),
  'ajakan_usaha.ketuk': usaha(teks('Mengetuk ajakan ruang usaha', 'Tapped the business workspace invitation'),
    teks('Pengguna mengetuk ajakan di Beranda.', 'The user tapped the invitation on Home.')),
  'ajakan_usaha.tutup': usaha(teks('Menutup ajakan ruang usaha', 'Dismissed the business workspace invitation'),
    teks('Pengguna menutup ajakan di Beranda.', 'The user dismissed the invitation on Home.')),
  'usaha.produk_pertama': usaha(teks('Mencatat barang pertama', 'Added the first item'),
    teks('Ruang usaha mencatat barang pertamanya.', 'The business workspace recorded its first item.'), { asal: ASAL_RUANG }),
  'usaha.jual_pertama': usaha(teks('Mencatat penjualan pertama', 'Recorded the first sale'),
    teks('Ruang usaha mencatat penjualan pertamanya.', 'The business workspace recorded its first sale.'), {
      asal: ASAL_RUANG,
      jenis: pilihan(teks('Jenis penjualan', 'Sale type'), {
        barang: teks('Barang dari katalog', 'Catalog item'), nominal: teks('Nominal tanpa barang', 'Amount without an item'),
      }),
    }),
  'usaha.beranda_lihat': usaha(teks('Melihat meja usaha', 'Saw the business dashboard'),
    teks('Beranda menampilkan meja usaha pada peluncuran ini.', 'Home displayed the business dashboard during this launch.'), {
      keadaan: pilihan(teks('Tampilan meja usaha', 'Dashboard view'), {
        langkah: teks('Langkah awal', 'Getting started'), harian: teks('Kegiatan harian', 'Daily activity'),
      }),
    }),
  'usaha.langkah_ketuk': usaha(teks('Mengetuk langkah awal usaha', 'Tapped a business setup step'),
    teks('Pengguna memilih salah satu langkah awal di meja usaha.', 'The user selected a setup step from the business dashboard.'), {
      tahap: pilihan(TAHAP, {
        barang: teks('Barang', 'Items'), jual: teks('Jual', 'Sell'), kasbon: teks('Kasbon', 'Customer tabs'), qris: teks('QRIS', 'QRIS'),
        nominal: teks('Jual tanpa barang', 'Sell without an item'),
      }),
    }),
  'usaha.pintasan': usaha(teks('Membuka pintasan usaha', 'Opened a business shortcut'),
    teks('Pengguna mengetuk pintasan dari meja usaha.', 'The user tapped a shortcut from the business dashboard.'), {
      ke: pilihan(teks('Tujuan pintasan', 'Shortcut destination'), {
        jual: teks('Jual', 'Sell'), beli: teks('Beli', 'Buy'), barang: teks('Barang', 'Items'),
        stok: teks('Stok', 'Stock'), kasbon: teks('Kasbon', 'Customer tabs'), laporan: teks('Laporan', 'Reports'), usaha: teks('Usaha', 'Business'),
      }),
    }),
  'usaha.langkah_tutup': usaha(teks('Menutup langkah awal usaha', 'Dismissed a business setup step'),
    teks('Pengguna memilih untuk melewati langkah awal itu.', 'The user chose to skip that setup step.'), {
      nomor: pilihan(teks('Nomor langkah', 'Step number'), { 3: teks('Langkah 3', 'Step 3') }),
    }),
  'usaha.pulang': usaha(teks('Kembali ke Beranda usaha', 'Returned to business Home'),
    teks('Pengguna memilih kembali ke tampilan Beranda usaha.', 'The user chose to return to business Home.')),
  'tujuan.lihat': peristiwa('onboarding', teks('Melihat kartu tujuan', 'Saw the purpose card'),
    teks('Beranda menanyakan CashFlow mau dipakai untuk apa.', 'Home asked what CashFlow will be used for.')),
  'tujuan.jawab': peristiwa('onboarding', teks('Menjawab kartu tujuan', 'Answered the purpose card'),
    teks('Pengguna memilih untuk apa CashFlow dipakai.', 'The user picked what CashFlow is for.'), {
      pilihan: pilihan(teks('Pilihan', 'Choice'), {
        pribadi: teks('Uang pribadi', 'Personal money'), usaha: teks('Jualan warung', 'Shop sales'), lewati: teks('Dilewati', 'Skipped'),
      }),
    }),
  'plus_minat.lihat': peristiwa('onboarding', teks('Melihat kartu CashFlow Plus', 'Saw the CashFlow Plus card'),
    teks('Beranda menampilkan kartu CashFlow Plus pada peluncuran ini.', 'Home showed the CashFlow Plus card during this launch.')),
  'plus_minat.tutup': peristiwa('onboarding', teks('Menunda CashFlow Plus', 'Dismissed CashFlow Plus'),
    teks('Pengguna memilih Nanti saja di kartu CashFlow Plus.', 'The user selected Not now on the CashFlow Plus card.')),
  'domi.kenalan': peristiwa('domi', teks('Perkenalan Domi di Beranda', 'Domi introduction on Home'),
    teks('Aplikasi mencatat satu tahap perkenalan Domi di Beranda.', 'The app recorded one step of the Domi introduction on Home.'), {
      tahap: pilihan(TAHAP, {
        tampil: teks('Cerita tampil', 'Story shown'), adegan_2: teks('Adegan kedua', 'Second scene'),
        adegan_3: teks('Adegan ketiga', 'Third scene'), pertanyaan: teks('Pilihan pertanyaan tampil', 'Question choices shown'),
        ketuk: teks('Memilih pertanyaan', 'Picked a question'), tulis_sendiri: teks('Menulis pertanyaan sendiri', 'Wrote own question'),
        lewati: teks('Melewati cerita', 'Skipped the story'), nanti: teks('Memilih nanti saja', 'Chose later'),
        buka_domi: teks('Membuka Domi', 'Opened Domi'), terpotong: teks('Cerita terpotong', 'Story interrupted'),
        kartu_tampil: teks('Kartu sapaan tampil', 'Greeting card shown'), kartu_ketuk: teks('Mengetuk kartu sapaan', 'Tapped the greeting card'),
        kartu_tutup: teks('Menutup kartu sapaan', 'Dismissed the greeting card'),
      }),
      varian: pilihan(teks('Bentuk cerita', 'Story format'), {
        tuntun: teks('Tuntunan di layar', 'On-screen guide'), lembar: teks('Lembar', 'Sheet'), kartu: teks('Kartu', 'Card'),
      }),
      keadaan: pilihan(teks('Keadaan catatan', 'Records state'), {
        pribadi_isi: teks('Pribadi, ada catatan', 'Personal, has records'),
        pribadi_tagihan: teks('Pribadi, ada tagihan', 'Personal, has bills'),
        pribadi_isi_sepi: teks('Pribadi, catatan sedikit', 'Personal, few records'),
        pribadi_tagihan_sepi: teks('Pribadi, tagihan dan catatan sedikit', 'Personal, bills and few records'),
        pribadi_awal: teks('Pribadi, baru mulai', 'Personal, just started'),
        pribadi_kosong: teks('Pribadi, belum ada catatan', 'Personal, no records yet'),
        usaha_jual: teks('Usaha, ada penjualan', 'Business, has sales'),
        usaha_kosong: teks('Usaha, belum ada catatan', 'Business, no records yet'),
        kredit_habis: teks('Kredit Domi habis', 'Domi credits used up'),
      }),
      pilihan: pilihan(teks('Kode pertanyaan', 'Question code'), {
        terbesar: teks('Pengeluaran terbesar', 'Largest spending'), ringkas: teks('Ringkasan', 'Summary'),
        saldo: teks('Saldo', 'Balance'), tagihan: teks('Tagihan', 'Bills'), catat: teks('Mencatat', 'Recording'),
        tabungan: teks('Tabungan', 'Savings'), omzet: teks('Omzet', 'Revenue'), stok: teks('Stok', 'Stock'),
        kasbon: teks('Kasbon', 'Customer tabs'), modal: teks('Modal', 'Capital'),
      }),
      ke: angka(teks('Pengingat ke', 'Reminder number'), 2),
      ms: angka(teks('Lama (ms)', 'Duration (ms)')),
    }),
  'dukung.ketuk': peristiwa('aplikasi', teks('Mengetuk Dukung CashFlow', 'Tapped Support CashFlow'),
    teks('Pengguna membuka alur Dukung CashFlow. Tercatat sejak 1.4.4.', 'The user opened the Support CashFlow flow. Recorded since 1.4.4.'), {
      asal: pilihan(ASAL, { setelan: teks('Setelan', 'Settings'), pengumuman: teks('Tombol pengumuman', 'Announcement button'), surel: teks('Tautan di email', 'Link in an email') }),
    }),
  'pengumuman.ketuk': peristiwa('aplikasi', teks('Mengetuk tombol pengumuman', 'Tapped an announcement button'),
    teks('Pengguna mengetuk tombol di sebuah pengumuman.', 'The user tapped the button on an announcement.'), { gaya: GAYA_PENGUMUMAN }),
  'pengumuman.tutup': peristiwa('aplikasi', teks('Menutup pengumuman', 'Dismissed an announcement'),
    teks('Pengguna menutup sebuah pengumuman.', 'The user dismissed an announcement.'), { gaya: GAYA_PENGUMUMAN }),
  'lokasi.izin': peristiwa('aplikasi', teks('Menjawab izin lokasi', 'Answered the location permission'),
    teks('Pengguna menjawab jendela izin lokasi. Tercatat sejak 1.5.0, tanpa koordinat dan tanpa nama tempat.', 'The user answered the location permission dialog. Recorded since 1.5.0, without coordinates or place names.'), {
      hasil: pilihan(HASIL, { diberi: teks('Diberi, lokasi akurat', 'Granted, precise location'), perkiraan: teks('Diberi, lokasi perkiraan', 'Granted, approximate location'), ditolak: teks('Ditolak', 'Denied'), nanti: teks('Nanti saja', 'Not now') }),
      asal: pilihan(ASAL, { priming: teks('Sesudah mencatat', 'After saving a note'), setelan: teks('Sakelar di Setelan', 'Switch in Settings') }),
    }),
  'pasar.kartu_lihat': pasar(teks('Melihat kartu Kilas Pasar', 'Saw the Market card'),
    teks('Beranda menampilkan kartu Kilas Pasar dan Promo pada peluncuran ini. Tercatat sejak 1.6.0.', 'Home showed the Market and Promos card during this launch. Recorded since 1.6.0.'), {
      isi: pilihan(teks('Isi kartu', 'Card content'), {
        lengkap: teks('Pasar dan Promo', 'Market and Promos'), pasar: teks('Pasar saja', 'Market only'), promo: teks('Promo saja', 'Promos only'),
      }),
    }),
  'pasar.detail_buka': pasar(teks('Membuka Detail Kilas Pasar', 'Opened Market card details'),
    teks('Pengguna membuka lembar Detail dari kartu Kilas Pasar.', 'The user opened the details sheet from the Market card.'), {
      tab: TAB_KARTU,
      dari: pilihan(teks('Dibuka dari', 'Opened from'), {
        kepala: teks('Judul atau tombol Detail', 'Title or Details button'), ubin: teks('Ubin Emas, USD, atau SAR', 'Gold, USD, or SAR tile'),
        promo: teks('Baris Promo resmi', 'Official promos row'),
      }),
    }),
  'pasar.tab': pasar(teks('Melihat bagian promo Kilas Pasar', 'Saw the Market card promos section'),
    teks('Bagian promo mulai terlihat di lembar Detail sesudah dibuka di bagian pasar.', 'The promos section came into view in the details sheet after it opened on the market section.'), { tab: TAB_KARTU }),
  'pasar.promo_ketuk': pasar(teks('Mengetuk sumber promo', 'Tapped a promo source'),
    teks('Pengguna mengetuk satu sumber promo resmi, sebelum halamannya dibuka.', 'The user tapped an official promo source, before its page opened.'), {
      sumber: { label: SUMBER, nilai: { ...merek(NAMA_SUMBER_PASAR), lain: teks('Sumber lain', 'Other source') }, bentuk: 'kode' },
      jenis: pilihan(teks('Jenis', 'Type'), {
        dompet: teks('Dompet dan bank', 'Wallets and banks'), belanja: teks('Belanja dan BBM', 'Shopping and fuel'), emas: teks('Emas', 'Gold'),
      }),
      dari: pilihan(teks('Dari daftar', 'From list'), {
        cocok: teks('Cocok dengan dompetnya', 'Matching the user wallets'), semua: teks('Lihat semua', 'See all'),
      }),
    }),
  'pasar.lihat_semua': pasar(teks('Mengetuk Lihat semua promo', 'Tapped See all promos'),
    teks('Pengguna membuka daftar lengkap promo dompet dan bank.', 'The user opened the full list of wallet and bank promos.')),
  'pasar.tautan_ketuk': pasar(teks('Mengetuk tautan emas atau saham', 'Tapped a gold or stock link'),
    teks('Pengguna mengetuk tautan harga resmi di tab Pasar.', 'The user tapped an official price link in the Market tab.'), {
      sumber: pilihan(SUMBER, {
        logammulia: teks(NAMA_SUMBER_PASAR.logammulia!, NAMA_SUMBER_PASAR.logammulia!),
        pegadaian: teks(NAMA_SUMBER_PASAR.pegadaian!, NAMA_SUMBER_PASAR.pegadaian!),
        idx: teks(NAMA_SUMBER_PASAR.idx!, NAMA_SUMBER_PASAR.idx!),
        lain: teks('Sumber lain', 'Other source'),
      }),
    }),
  'pasar.tanya_domi': pasar(teks('Mengetuk Tanya Domi di kartu Kilas Pasar', 'Tapped Ask Domi on the Market card'),
    teks('Pengguna membuka Domi dengan pertanyaan siap pakai dari kartu.', 'The user opened Domi with a ready-made question from the card.'), {
      topik: pilihan(teks('Topik', 'Topic'), { kurs: teks('Kurs', 'Exchange rates'), emas: teks('Emas', 'Gold'), promo: teks('Promo', 'Promos') }),
    }),
  'halaman.buka': halaman(teks('Membuka halaman resmi', 'Opened an official page'),
    teks('Layar halaman resmi di dalam aplikasi terbuka dengan alamat yang sah. Alamat lengkapnya tidak dicatat.', 'The in-app official page screen opened with a valid address. The full address is not recorded.')),
  'halaman.tutup': halaman(teks('Menutup halaman resmi', 'Closed an official page'),
    teks('Pengguna menutup layar halaman resmi.', 'The user closed the official page screen.'), {
      lama: pilihan(teks('Lama dibaca', 'Time spent'), {
        kurang_10: teks('Kurang dari 10 detik', 'Under 10 seconds'), sampai_60: teks('10 sampai 60 detik', '10 to 60 seconds'),
        sampai_180: teks('1 sampai 3 menit', '1 to 3 minutes'), lebih_180: teks('Lebih dari 3 menit', 'Over 3 minutes'),
      }),
      pindah: yaTidak(teks('Pindah ke situs lain', 'Moved to another site')),
    }),
  'halaman.browser': halaman(teks('Membuka halaman di browser', 'Opened the page in a browser'),
    teks('Halaman resmi atau tautan di dalamnya diteruskan ke browser HP.', 'The official page or a link in it was handed over to the phone browser.')),
  'domi.pasar': peristiwa('domi', teks('Bertanya ke Domi soal pasar', 'Asked Domi about the market'),
    teks('Server mencatat pertanyaan Domi yang memakai data kurs, emas, saham, atau promo. Isi pertanyaannya tidak disimpan.', 'The server recorded a Domi question that used exchange rate, gold, stock, or promo data. The question text is not stored.'), {
      topik: {
        label: teks('Topik', 'Topics'), larik: true,
        nilai: {
          kurs: teks('Kurs dan valas', 'Exchange rates'), emas: teks('Emas', 'Gold'), saham: teks('Saham', 'Stocks'),
          promo: teks('Promo', 'Promos'), umum: teks('Umum', 'General'),
        },
      },
    }),
  'form_catat.buka': peristiwa('transaksi', teks('Membuka form catat', 'Opened a record form'),
    teks('Pengguna membuka form transaksi atau catat cepat. Tercatat sejak 1.7.0.', 'The user opened the transaction form or quick record. Recorded since 1.7.0.'),
    FORM_CATAT),
  'form_catat.keluar': peristiwa('transaksi', teks('Keluar dari form catat', 'Left a record form'),
    teks('Form catat tertutup. Aplikasi mencatat halaman dan isian terakhir, lama di form, dan jumlah catatan yang tersimpan, tanpa isinya.', 'A record form closed. The app logged the last page and field, time in the form, and number of saved records, without their content.'), {
      ...FORM_CATAT,
      cara: pilihan(teks('Cara keluar', 'How it closed'), {
        simpan: teks('Sesudah menyimpan', 'After saving'), tutup: teks('Form ditutup', 'Form closed'),
        alih: teks('Pindah ke jadwal atau kasbon', 'Moved to schedules or customer tabs'),
        mati: teks('Aplikasi tertutup saat form terbuka', 'App closed while the form was open'), lain: teks('Cara lain', 'Other way'),
      }),
      halaman: pilihan(teks('Halaman terakhir', 'Last page'), {
        berapa: teks('Berapa', 'Amount'), untuk_apa: teks('Untuk apa', 'What for'), periksa: teks('Periksa', 'Review'),
        tersimpan: teks('Tersimpan', 'Saved'), rincian: teks('Rincian', 'Details'),
        isi: teks('Isian catat cepat', 'Quick record entry'), tawar: teks('Tawaran pengingat', 'Reminder offer'),
      }),
      kolom: pilihan(teks('Isian terakhir disentuh', 'Last field touched'), {
        tanpa: teks('Belum ada yang disentuh', 'Nothing touched'), nominal: teks('Nominal', 'Amount'),
        jenis: teks('Uang masuk atau keluar', 'Money in or out'), kategori: teks('Kategori', 'Category'),
        dompet: teks('Dompet', 'Wallet'), tanggal: teks('Tanggal', 'Date'), jam: teks('Jam', 'Time'),
        catatan: teks('Catatan', 'Note'), foto: teks('Foto', 'Photo'), biaya: teks('Biaya admin', 'Admin fee'),
        patungan: teks('Patungan', 'Shared expense'), pilihan: PILIHAN_CEPAT,
      }),
      isi: yaTidak(teks('Ada isian yang belum tersimpan', 'Had unsaved input')),
      simpan: angka(teks('Catatan tersimpan', 'Records saved'), 50),
      detik: angka(teks('Lama di form (detik)', 'Time in form (seconds)'), 3600),
    }),
  'form_catat.tahan': peristiwa('transaksi', teks('Catatan tertahan aturan lokasi', 'Record held by the location rule'),
    teks('Aturan lokasi wajib menahan pengguna sebelum form terbuka atau sebelum catatan tersimpan.', 'The required location rule stopped the user before the form opened or before the record was saved.'), {
      sebab: pilihan(SEBAB, { lokasi: teks('Lokasi', 'Location') }),
      tahap: pilihan(TAHAP, { buka: teks('Saat membuka form', 'When opening the form'), simpan: teks('Saat menyimpan', 'When saving') }),
    }),
  'catat_pertama.lihat': peristiwa('onboarding', teks('Melihat layar catatan pertama', 'Saw the first record screen'),
    teks('Layar catat cepat terbuka untuk akun yang belum pernah mencatat. Tercatat sejak 1.7.0.', 'Quick record opened for an account with no records yet. Recorded since 1.7.0.'), {
      asal: pilihan(ASAL, ASAL_CATAT),
    }),
  'catat_pertama.simpan': peristiwa('onboarding', teks('Menyimpan catatan pertama', 'Saved the first record'),
    teks('Akun mencatat untuk pertama kali.', 'The account saved its first record.'), {
      jalur: pilihan(JALUR, {
        cepat: teks('Catat cepat', 'Quick record'), transaksi: teks('Form transaksi lengkap', 'Full transaction form'), lain: teks('Jalan lain', 'Other path'),
      }),
      pilihan: pilihan(PILIHAN_CEPAT, { ...NILAI_PILIHAN_CEPAT, tanpa: teks('Tanpa pilihan cepat', 'No quick choice') }),
    }),
  'catat_pertama.kartu_lihat': peristiwa('onboarding', teks('Melihat kartu catatan pertama', 'Saw the first record card'),
    teks('Beranda menampilkan kartu ajakan mencatat pengeluaran pertama pada peluncuran ini.', 'Home showed the card inviting a first spending record during this launch.')),
  'catat_pertama.kartu_ketuk': peristiwa('onboarding', teks('Mengetuk pilihan di kartu catatan pertama', 'Tapped a choice on the first record card'),
    teks('Pengguna memilih satu pilihan cepat di kartu Beranda.', 'The user picked a quick choice on the Home card.'), {
      pilihan: pilihan(PILIHAN_CEPAT, NILAI_PILIHAN_CEPAT),
    }),
  'catat_pertama.ke_usaha': peristiwa('onboarding', teks('Memilih catat jualan warung', 'Chose to record shop sales'),
    teks('Pengguna mengetuk ajakan jualan warung di layar catatan pertama.', 'The user tapped the shop sales link on the first record screen.')),
  'catat_pertama.ke_lainnya': peristiwa('onboarding', teks('Memilih Catat yang lain', 'Chose Record something else'),
    teks('Pengguna membuka pilihan catat lengkap dari layar catatan pertama.', 'The user opened the full record options from the first record screen.')),
  'pengingat.tawar_lihat': aplikasi(teks('Melihat tawaran pengingat harian', 'Saw the daily reminder offer'),
    teks('Tawaran pengingat tiap malam tampil sesudah catatan pertama tersimpan. Tercatat sejak 1.7.0.', 'The nightly reminder offer appeared after the first record was saved. Recorded since 1.7.0.'), {
      asal: pilihan(ASAL, { catat_pertama: teks('Sesudah catatan pertama', 'After the first record') }),
    }),
  'pengingat.tawar_jawab': aplikasi(teks('Menjawab tawaran pengingat', 'Answered the reminder offer'),
    teks('Pengguna menyalakan pengingat harian atau menundanya.', 'The user turned on the daily reminder or put it off.'), {
      hasil: pilihan(HASIL, {
        nyala: teks('Pengingat dinyalakan', 'Reminder turned on'), nanti: teks('Nanti saja', 'Not now'),
        izin_ditolak: teks('Izin notifikasi ditolak', 'Notification permission denied'),
      }),
      jam: JAM_PENGINGAT,
      ganti: yaTidak(teks('Jam diganti dari bawaan', 'Hour changed from default')),
    }),
  'pengingat.atur': aplikasi(teks('Mengatur pengingat harian', 'Set the daily reminder'),
    teks('Pengguna menyalakan, mematikan, atau mengganti jam pengingat di Setelan.', 'The user turned the reminder on or off, or changed its hour, in Settings.'), {
      asal: pilihan(ASAL, { setelan: SETELAN }),
      nyala: yaTidak(teks('Pengingat menyala', 'Reminder on')),
      jam: JAM_PENGINGAT,
    }),
  'pengingat.ketuk': aplikasi(teks('Mengetuk pengingat harian', 'Tapped the daily reminder'),
    teks('Pengguna membuka aplikasi dari notifikasi pengingat harian.', 'The user opened the app from the daily reminder notification.'), {
      isi: pilihan(teks('Isi pengingat', 'Reminder text'), {
        jatah: teks('Menyebut jatah harian', 'Mentioned the daily budget'), umum: teks('Ajakan umum', 'General nudge'),
        tanya: teks('Pertanyaan singkat', 'Short question'),
      }),
    }),
  'preset_jadwal.lihat': aplikasi(teks('Melihat pilihan siap pakai jadwal', 'Saw ready-made schedule options'),
    teks('Layar Jadwal menampilkan pilihan siap pakai pada peluncuran ini. Tercatat sejak 1.7.0.', 'The schedules screen showed ready-made options during this launch. Recorded since 1.7.0.'), {
      asal: pilihan(ASAL, ASAL_PRESET),
    }),
  'preset_jadwal.pilih': aplikasi(teks('Memilih jadwal siap pakai', 'Picked a ready-made schedule'),
    teks('Pengguna mengetuk salah satu pilihan siap pakai atau Tambah gajian.', 'The user tapped a ready-made option or Add payday.'), {
      preset: PRESET_JADWAL,
      asal: pilihan(ASAL, { ...ASAL_PRESET, analisa: teks('Tombol Tambah gajian di Analisa', 'Add payday button in Analysis') }),
    }),
  'preset_jadwal.batas': aplikasi(teks('Jadwal siap pakai tertahan batas gratis', 'Ready-made schedule hit the free limit'),
    teks('Form dari pilihan siap pakai tertahan batas jadwal versi gratis.', 'The form from a ready-made option was stopped by the free schedule limit.'), {
      preset: PRESET_JADWAL,
    }),
  'preset_jadwal.simpan': aplikasi(teks('Menyimpan jadwal siap pakai', 'Saved a ready-made schedule'),
    teks('Jadwal dari pilihan siap pakai tersimpan. Nama, nominal, dan tanggalnya tidak dicatat.', 'A schedule from a ready-made option was saved. Its name, amount, and date are not logged.'), {
      preset: PRESET_JADWAL,
      bentuk: pilihan(teks('Bentuk jadwal', 'Schedule type'), {
        tiap_bulan: teks('Tiap bulan', 'Every month'), dicicil: teks('Dicicil', 'Installments'), sekali: teks('Sekali saja', 'One time'),
        tiap_hari: teks('Tiap hari', 'Every day'), hari_kerja: teks('Hari kerja saja', 'Weekdays only'), irama_lain: teks('Irama lain', 'Other frequency'),
      }),
      irama: pilihan(teks('Irama', 'Frequency'), {
        day: teks('Harian', 'Daily'), week: teks('Mingguan', 'Weekly'), month: teks('Bulanan', 'Monthly'), year: teks('Tahunan', 'Yearly'),
      }),
      nama_diubah: yaTidak(teks('Nama diubah', 'Name changed')),
    }),
  'preset_jadwal.tutup': aplikasi(teks('Menutup jadwal siap pakai', 'Closed a ready-made schedule'),
    teks('Pengguna menutup form dari pilihan siap pakai tanpa menyimpan.', 'The user closed the form from a ready-made option without saving.'), {
      preset: PRESET_JADWAL,
    }),
  'widget.dipasang': aplikasi(teks('Memasang widget', 'Added the widget'),
    teks('Widget catat cepat dipasang di layar utama HP. Terkirim saat aplikasi dibuka berikutnya. Tercatat sejak 1.7.0.', 'The quick record widget was added to the home screen. Sent the next time the app opened. Recorded since 1.7.0.'), {
      ukuran: pilihan(teks('Ukuran', 'Size'), {
        ringkas: teks('Ringkas, satu baris', 'Compact, one row'), kotak: teks('Kotak', 'Square'), penuh: teks('Penuh', 'Full'),
      }),
    }),
  'widget.dihapus': aplikasi(teks('Menghapus widget', 'Removed the widget'),
    teks('Widget catat cepat dilepas dari layar utama HP.', 'The quick record widget was removed from the home screen.')),
  'widget.ketuk_catat': aplikasi(teks('Mengetuk tombol catat di widget', 'Tapped record on the widget'),
    teks('Pengguna mengetuk tombol catat di widget. Nominal dan nama ruang tidak dicatat.', 'The user tapped a record button on the widget. Amounts and workspace names are not logged.'), {
      jenis: pilihan(teks('Tombol', 'Button'), { keluar: teks('Catat keluar', 'Record money out'), masuk: teks('Catat masuk', 'Record money in') }),
      keadaan: pilihan(LABEL_KEADAAN_WIDGET, KEADAAN_WIDGET),
    }),
  'widget.ketuk_buka': aplikasi(teks('Membuka aplikasi dari widget', 'Opened the app from the widget'),
    teks('Pengguna mengetuk badan widget.', 'The user tapped the body of the widget.'), {
      keadaan: pilihan(LABEL_KEADAAN_WIDGET, {
        ...KEADAAN_WIDGET, kasir: teks('Akun kasir', 'Cashier account'), keluar: teks('Belum masuk akun', 'Signed out'),
      }),
    }),
  'wa_catat.lihat': aplikasi(teks('Membuka Catat lewat WhatsApp', 'Opened Record via WhatsApp'),
    teks('Layar setelan catat lewat WhatsApp tampil. Tercatat sejak 1.7.0.', 'The Record via WhatsApp settings screen appeared. Recorded since 1.7.0.'), {
      dari: pilihan(teks('Dibuka dari', 'Opened from'), {
        setelan: SETELAN, nomor_wa: teks('Layar Nomor WhatsApp', 'WhatsApp number screen'), lain: PINTU_LAIN,
      }),
    }),
  'wa_catat.nyala': aplikasi(teks('Menyalakan catat lewat WhatsApp', 'Turned on Record via WhatsApp'),
    teks('Pengguna menyalakan catat lewat WhatsApp untuk satu ruang.', 'The user turned on Record via WhatsApp for one workspace.'), {
      ruang: pilihan(teks('Ruang tujuan', 'Target workspace'), { pribadi: teks('Pribadi', 'Personal'), usaha: teks('Usaha', 'Business') }),
      dompet: pilihan(teks('Dompet', 'Wallet'), { bawaan: teks('Dompet bawaan', 'Default wallet'), pilih: teks('Dipilih sendiri', 'Picked by the user') }),
    }),
  'wa_catat.mati': aplikasi(teks('Mematikan catat lewat WhatsApp', 'Turned off Record via WhatsApp'),
    teks('Pengguna mematikan catat lewat WhatsApp dari aplikasi.', 'The user turned off Record via WhatsApp in the app.')),
  'wa_catat.ubah': aplikasi(teks('Mengubah setelan catat lewat WhatsApp', 'Changed Record via WhatsApp settings'),
    teks('Pengguna mengganti ruang tujuan atau dompet untuk catatan dari WhatsApp.', 'The user changed the target workspace or wallet for WhatsApp records.'), {
      apa: pilihan(teks('Yang diubah', 'Changed'), { ruang: teks('Ruang tujuan', 'Target workspace'), dompet: teks('Dompet', 'Wallet') }),
    }),
  'wa_catat.buka_wa': aplikasi(teks('Membuka WhatsApp CashFlow', 'Opened CashFlow on WhatsApp'),
    teks('Pengguna mengetuk tombol untuk mengirim pesan ke WhatsApp CashFlow.', 'The user tapped the button to message CashFlow on WhatsApp.')),
  'wa_catat.butuh_nomor': aplikasi(teks('Mengetuk verifikasi nomor WhatsApp', 'Tapped verify WhatsApp number'),
    teks('Catat lewat WhatsApp butuh nomor terverifikasi, dan pengguna membuka layar Nomor WhatsApp dari sana.', 'Record via WhatsApp needs a verified number, and the user opened the WhatsApp number screen from there.')),
  'wa_catat.galat': aplikasi(teks('Setelan catat lewat WhatsApp gagal disimpan', 'Record via WhatsApp settings failed'),
    teks('Perubahan setelan ditolak server atau perangkat tidak terhubung.', 'The server rejected the settings change or the device was offline.'), {
      hasil: pilihan(HASIL, {
        tanpa_sesi: HUBUNGAN_WA.tanpa_sesi, fitur_mati: teks('Fitur sedang tidak aktif', 'Feature was disabled'),
        butuh_nomor: teks('Nomor WhatsApp belum terverifikasi', 'WhatsApp number not verified'),
        ruang_salah: teks('Ruang tidak bisa dipakai', 'Workspace could not be used'),
        dompet_salah: teks('Dompet tidak bisa dipakai', 'Wallet could not be used'),
        galat_server: teks('Server mengalami galat', 'Server error'), luring: HUBUNGAN_WA.luring,
      }),
    }),
  'wa_catat.pesan': aplikasi(teks('Mengirim pesan ke WhatsApp CashFlow', 'Sent a message to CashFlow on WhatsApp'),
    teks('Server mencatat satu pesan catat lewat WhatsApp beserta hasilnya. Isi pesan, nominal, dan nama dompet tidak disimpan.', 'The server logged one Record via WhatsApp message and its outcome. The message text, amounts, and wallet names are not stored.'), {
      jenis: pilihan(teks('Jenis pesan', 'Message type'), {
        catat: teks('Catatan uang', 'Money record'), batal: teks('Perintah batal', 'Cancel command'),
        sisa: teks('Tanya sisa jatah', 'Asked what is left'), bantuan: teks('Bantuan atau salam', 'Help or greeting'),
        stop: teks('Perintah stop', 'Stop command'), admin: teks('Minta admin', 'Asked for an admin'),
        domi: teks('Pertanyaan untuk Domi', 'Question for Domi'), foto: teks('Foto', 'Photo'), lain: teks('Pesan lain', 'Other message'),
      }),
      hasil: pilihan(HASIL, {
        dicatat: teks('Tercatat', 'Recorded'), kuota: teks('Batas catatan gratis habis', 'Free record limit reached'),
        dompet: teks('Dompet yang disebut tidak ditemukan', 'Mentioned wallet not found'),
        dompet_bawaan: teks('Dompet bawaan sudah tidak ada', 'Default wallet no longer exists'),
        ruang: teks('Ruang tujuan tidak bisa ditulisi', 'Target workspace not writable'),
        dibatalkan: teks('Catatan terakhir dibatalkan', 'Last record cancelled'),
        tidak_ada: teks('Tidak ada catatan untuk dibatalkan', 'Nothing to cancel'),
        aturan: teks('Batal ditolak aturan ruang', 'Cancel blocked by workspace rules'),
        dijawab: teks('Dijawab', 'Answered'), dimatikan: teks('Catat lewat WhatsApp dimatikan', 'Record via WhatsApp turned off'),
        inbox: teks('Diteruskan ke admin', 'Forwarded to an admin'), basa_basi: teks('Basa-basi, tidak dibalas', 'Small talk, no reply'),
        diam: teks('Tidak dibalas', 'No reply sent'), gagal: teks('Gagal diproses', 'Could not be processed'),
        domi_mati: teks('Domi sedang mati', 'Domi was turned off'), kredit_habis: teks('Kredit Domi habis', 'Domi credits used up'),
        sibuk: teks('Domi sedang sibuk', 'Domi was busy'), foto_mati: teks('Baca foto sedang mati', 'Photo reading was turned off'),
        foto_besar: teks('Foto terlalu besar', 'Photo too large'), foto_tak_terbaca: teks('Foto tidak bisa dibaca', 'Photo could not be read'),
        kebanyakan: teks('Lebih dari 10 catatan dalam satu pesan', 'More than 10 items in one message'),
        proses: teks('Pesan sebelumnya masih diproses', 'Previous message still processing'),
        domi_batas: teks('Batas Domi per jam tercapai', 'Hourly Domi limit reached'),
      }),
      butir: pilihan(teks('Catatan dalam pesan', 'Items in the message'), {
        '1': teks('1', '1'), '2_5': teks('2 sampai 5', '2 to 5'), '6_10': teks('6 sampai 10', '6 to 10'),
      }),
    }),
  'notif_catat.lihat': aplikasi(teks('Membuka Catat dari notifikasi', 'Opened Record from notifications'),
    teks('Layar catat dari notifikasi tampil. Tercatat sejak 1.7.0. Nama aplikasi, nominal, dan teks notifikasi tidak pernah dicatat.', 'The Record from notifications screen appeared. Recorded since 1.7.0. App names, amounts, and notification text are never logged.'), {
      keadaan: pilihan(teks('Keadaan fitur', 'Feature state'), {
        ajakan: teks('Ajakan CashFlow Pro', 'CashFlow Pro invitation'), mati: teks('Belum menyala', 'Not turned on'),
        perlu_izin: teks('Perlu izin akses notifikasi', 'Needs notification access'), nyala: teks('Menyala', 'On'),
        pro_habis: teks('Pro sudah berakhir', 'Pro has ended'),
      }),
      asal: pilihan(ASAL, { setelan: SETELAN, kabar: teks('Notifikasi CashFlow', 'CashFlow notification'), lain: PINTU_LAIN }),
    }),
  'notif_catat.ajakan_pro': aplikasi(teks('Mengetuk Lihat CashFlow Pro', 'Tapped See CashFlow Pro'),
    teks('Pengguna gratis membuka penawaran Pro dari layar catat dari notifikasi.', 'A free user opened the Pro offer from the Record from notifications screen.')),
  'notif_catat.izin': aplikasi(teks('Mengurus akses notifikasi', 'Handled notification access'),
    teks('Aplikasi mencatat langkah pengguna memberi akses notifikasi lewat Setelan HP.', 'The app logged the user step of granting notification access in phone settings.'), {
      hasil: pilihan(HASIL, {
        buka_setelan: teks('Setelan HP dibuka', 'Phone settings opened'), diberi: teks('Akses diberikan', 'Access granted'),
        belum: teks('Kembali tanpa akses', 'Came back without access'), gagal_buka: teks('Setelan HP gagal dibuka', 'Phone settings could not open'),
      }),
    }),
  'notif_catat.nyala': aplikasi(teks('Menyalakan catat dari notifikasi', 'Turned on Record from notifications'),
    teks('Pengguna menyalakan fitur dan memilih aplikasi pembayaran yang dibaca.', 'The user turned the feature on and picked the payment apps to read.'), {
      mode: MODE_NOTIF,
      aplikasi_n: angka(teks('Aplikasi yang dibaca', 'Apps read'), 20),
    }),
  'notif_catat.mati': aplikasi(teks('Catat dari notifikasi mati', 'Record from notifications turned off'),
    teks('Fitur berhenti membaca notifikasi.', 'The feature stopped reading notifications.'), {
      sebab: pilihan(SEBAB, {
        pengguna: teks('Dimatikan pengguna', 'Turned off by the user'), pro_habis: teks('Pro berakhir', 'Pro ended'),
        akses_dicabut: teks('Akses notifikasi dicabut', 'Notification access revoked'), keluar: teks('Keluar akun', 'Signed out'),
        sakelar_server: teks('Dimatikan dari server', 'Turned off from the server'),
      }),
    }),
  'notif_catat.mode': aplikasi(teks('Mengganti cara simpan', 'Changed the saving mode'),
    teks('Pengguna memilih tanya dulu atau simpan otomatis.', 'The user chose ask first or save automatically.'), {
      mode: MODE_NOTIF,
      asal: pilihan(ASAL, { setelan: teks('Pengaturan di layar ini', 'Settings on this screen'), tawaran: teks('Tawaran simpan otomatis', 'Auto-save offer') }),
    }),
  'notif_catat.proses': aplikasi(teks('Memproses notifikasi yang tertangkap', 'Processed captured notifications'),
    teks('Aplikasi mengolah notifikasi pembayaran yang menunggu. Hanya hitungan, satu baris per jenis aplikasi.', 'The app processed waiting payment notifications. Counts only, one row per app type.'), {
      jenis: JENIS_APLIKASI_NOTIF,
      temuan: hitungNotif('Temuan', 'Findings'),
      otomatis: hitungNotif('Disimpan otomatis', 'Saved automatically'),
      tanya: hitungNotif('Ditanyakan dulu', 'Asked first'),
      dobel: hitungNotif('Mungkin sudah dicatat', 'Possible duplicates'),
      pindah: hitungNotif('Pindah dompet', 'Wallet transfers'),
      abaikan: hitungNotif('Dilewati karena tidak terbaca', 'Skipped, could not be read'),
      dibuang: hitungNotif('Dibuang karena terlalu lama atau antrean penuh', 'Dropped for age or a full queue'),
    }),
  'notif_catat.urai_gagal': aplikasi(teks('Notifikasi tidak bisa dibaca', 'Notification could not be read'),
    teks('Aplikasi gagal membaca notifikasi pembayaran yang tertangkap. Hanya hitungan per alasan.', 'The app could not read captured payment notifications. Counts per reason only.'), {
      jenis: JENIS_APLIKASI_NOTIF,
      sebab: pilihan(SEBAB, {
        tanpa_nominal: teks('Tidak ada nominal', 'No amount'), arah_tak_jelas: teks('Masuk atau keluar tidak jelas', 'Unclear if money in or out'),
        bukan_transaksi: teks('Bukan transaksi', 'Not a transaction'), terlalu_besar: teks('Nominal terlalu besar', 'Amount too large'),
      }),
      n: hitungNotif('Jumlah', 'Count'),
    }),
  'notif_catat.putus': aplikasi(teks('Memutuskan temuan dari notifikasi', 'Decided on a notification finding'),
    teks('Pengguna memutuskan satu temuan atau membatalkan catatan yang tersimpan otomatis.', 'The user decided on one finding or cancelled an auto-saved record.'), {
      jenis: JENIS_APLIKASI_NOTIF,
      putusan: pilihan(teks('Putusan', 'Decision'), {
        simpan: teks('Disimpan', 'Saved'), ubah_simpan: teks('Diubah lalu disimpan', 'Edited then saved'),
        abaikan: teks('Diabaikan', 'Ignored'), batal: teks('Catatan yang tersimpan dibatalkan', 'Saved record cancelled'),
        pindah: teks('Dialihkan ke Pindah antar dompet', 'Sent to wallet transfer'),
      }),
    }),
  'pembaruan.ajakan_lihat': pembaruan(teks('Melihat ajakan pembaruan', 'Saw an update invitation'),
    teks('Beranda menampilkan ajakan memperbarui aplikasi.', 'Home displayed an invitation to update the app.')),
  'pembaruan.ajakan_ketuk': pembaruan(teks('Mengetuk Perbarui', 'Tapped Update'),
    teks('Pengguna memilih Perbarui dari kartu di Beranda.', 'The user selected Update from the card on Home.'), { jalur: PEMBARUAN_JALUR }),
  'pembaruan.ajakan_tutup': pembaruan(teks('Menutup ajakan pembaruan', 'Dismissed an update invitation'),
    teks('Pengguna menutup kartu pembaruan di Beranda.', 'The user dismissed the update card on Home.')),
  'pembaruan.wajib_lihat': pembaruan(teks('Melihat layar wajib perbarui', 'Saw the required update screen'),
    teks('Aplikasi menampilkan layar pembaruan wajib.', 'The app displayed the required update screen.'), { tertahan: PEMBARUAN_TERTAHAN }),
  'pembaruan.wajib_ketuk': pembaruan(teks('Mengetuk Perbarui di layar wajib', 'Tapped Update on the required screen'),
    teks('Pengguna memilih Perbarui dari layar pembaruan wajib.', 'The user selected Update from the required update screen.'), {
      tertahan: PEMBARUAN_TERTAHAN, jalur: PEMBARUAN_JALUR,
    }),
  'nomor_wa.lihat': whatsapp(teks('Melihat layar Nomor WhatsApp', 'Saw the WhatsApp number screen'),
    teks('Layar verifikasi WhatsApp tampil pada peluncuran ini.', 'The WhatsApp verification screen appeared during this launch.')),
  'nomor_wa.petunjuk': whatsapp(teks('Membuka pilihan nomor dari Google', 'Opened the Google number picker'),
    teks('Aplikasi meminta Google menawarkan nomor untuk verifikasi.', 'The app asked Google to offer a number for verification.'), { hasil: PILIH_NOMOR }, 'hasil'),
  'nomor_wa.kirim': whatsapp(teks('Meminta kode WhatsApp', 'Requested a WhatsApp code'),
    teks('Aplikasi meminta kode dikirim lewat WhatsApp.', 'The app requested that a code be sent over WhatsApp.'), {
      hasil: pilihan(HASIL, {
        ...HUBUNGAN_WA, terkirim: TERKIRIM, tanpa_wa: TANPA_WA,
        batas_nomor: teks('Nomor mencapai batas permintaan', 'Number reached the request limit'),
        gagal_kirim: GAGAL_KIRIM, galat_server: teks('Server mengalami galat', 'Server error'),
      }),
    }, 'hasil'),
  'nomor_wa.ketik': whatsapp(teks('Mencoba memasukkan kode', 'Tried entering the code'),
    teks('Aplikasi mencatat percobaan atau pembatalan saat memasukkan kode.', 'The app recorded an attempt or cancellation while entering the code.'), {
      hasil: pilihan(HASIL, {
        salah: teks('Kode salah', 'Incorrect code'), habis: HABIS, kedaluwarsa: KEDALUWARSA,
        batal: teks('Batal memasukkan kode', 'Cancelled code entry'), galat: teks('Kode gagal diperiksa', 'Code could not be checked'),
        luring: HUBUNGAN_WA.luring,
      }),
    }),
  'nomor_wa.berhasil': whatsapp(teks('Aplikasi mencatat verifikasi berhasil', 'App recorded successful verification'),
    teks('Aplikasi melihat nomor WhatsApp sudah terverifikasi.', 'The app saw that the WhatsApp number was verified.')),
  'nomor_wa.lewat': whatsapp(teks('Melanjutkan dengan email', 'Continued with email'),
    teks('Pengguna memilih melanjutkan dengan email dari alur menerima kode.', 'The user chose to continue with email in the flow for receiving a code.'), {
      sebab: pilihan(SEBAB, {
        gangguan: GANGGUAN, gagal_kirim: GAGAL_KIRIM,
        galat_server: teks('Server mengalami galat', 'Server error'), tak_datang: HUBUNGAN_WA.tak_sampai,
      }),
    }),
  'nomor_wa.lepas': whatsapp(teks('Layar wajib Nomor WhatsApp dilepas', 'Required WhatsApp screen dismissed'),
    teks('Aplikasi melepas layar wajib ketika keadaan berubah.', 'The app removed the required screen when conditions changed.'), {
      sebab: pilihan(SEBAB, { fitur_mati: HUBUNGAN_WA.fitur_mati, tanpa_sesi: HUBUNGAN_WA.tanpa_sesi }),
    }),
  'nomor_wa.ganti': whatsapp(teks('Memilih ganti nomor WhatsApp', 'Chose to change WhatsApp number'),
    teks('Pengguna mengetuk pilihan untuk memakai nomor lain.', 'The user tapped the option to use another number.')),
  'nomor_wa.keluar': whatsapp(teks('Memilih keluar akun', 'Chose to sign out'),
    teks('Pengguna mengetuk Keluar dari layar Nomor WhatsApp.', 'The user tapped Sign out on the WhatsApp number screen.')),
  'nomor_wa.hapus_akun': whatsapp(teks('Mengetuk Hapus akun', 'Tapped Delete account'),
    teks('Pengguna membuka pilihan penghapusan akun dari layar Nomor WhatsApp.', 'The user opened the account deletion option from the WhatsApp number screen.')),
  'nomor_wa.hubungi': whatsapp(teks('Mengetuk Hubungi kami', 'Tapped Contact us'),
    teks('Pengguna memilih bantuan dari layar Nomor WhatsApp.', 'The user selected support from the WhatsApp number screen.')),
  'nomor_wa.terbalik.mulai': whatsapp(teks('Meminta kode untuk dikirim lewat WhatsApp', 'Requested a code to send via WhatsApp'),
    teks('Aplikasi meminta kode yang akan dikirim pengguna ke CashFlow.', 'The app requested a code for the user to send to CashFlow.'), {
      hasil: pilihan(HASIL, { ...HUBUNGAN_WA, ok: teks('Memulai verifikasi dengan kirim pesan', 'Started verification by sending a message') }),
    }, 'hasil'),
  'nomor_wa.terbalik.buka_wa': whatsapp(teks('Membuka WhatsApp', 'Opened WhatsApp'),
    teks('Pengguna memilih membuka WhatsApp atau menyatakan sudah mengirim dari ponsel lain.', 'The user chose to open WhatsApp or indicated they sent the message from another phone.'), {
      hasil: pilihan(HASIL, {
        pertama: teks('Membuka WhatsApp', 'Opened WhatsApp'), ulang: teks('Membuka WhatsApp lagi', 'Reopened WhatsApp'),
        hp_lain: teks('Memilih Sudah terkirim dari ponsel lain', 'Selected Already sent from another phone'),
      }),
    }, 'hasil'),
  'nomor_wa.terbalik.berhasil': whatsapp(teks('Aplikasi mencatat verifikasi lewat kirim pesan berhasil', 'App recorded successful message verification'),
    teks('Aplikasi melihat verifikasi dengan kirim pesan berhasil.', 'The app saw that verification by sending a message succeeded.')),
  'nomor_wa.terbalik.beda': whatsapp(teks('Nomor pengirim berbeda', 'Sender number differed'),
    teks('Nomor WhatsApp yang mengirim pesan berbeda dari yang dimasukkan di aplikasi.', 'The WhatsApp sender number differed from the number entered in the app.')),
  'nomor_wa.terbalik.tanpa_nomor': whatsapp(teks('Nomor pengirim tidak terbaca', 'Sender number could not be read'),
    teks('Aplikasi melihat bahwa nomor pengirim pesan tidak dapat dikenali.', 'The app saw that the message sender number could not be identified.')),
  'nomor_wa.terbalik.lewat': whatsapp(teks('Melanjutkan dengan email dari cara kirim pesan', 'Continued with email from message verification'),
    teks('Pengguna memilih melanjutkan dengan email dari alur kirim pesan.', 'The user chose to continue with email from the message verification flow.'), {
      sebab: pilihan(SEBAB, { gangguan: GANGGUAN, tanpa_nomor: TANPA_NOMOR }),
    }),
  'nomor_wa.terbalik.belum_sampai': whatsapp(teks('Pesan WhatsApp belum sampai', 'WhatsApp message not received yet'),
    teks('Pengguna kembali dari WhatsApp dan pesannya belum diterima server.', 'The user returned from WhatsApp and the server had not received the message.'), {
      hasil: pilihan(HASIL, {
        pertama: teks('Sesudah WhatsApp dibuka sekali', 'After opening WhatsApp once'),
        ulang: teks('Sesudah WhatsApp dibuka dua kali atau lebih', 'After opening WhatsApp twice or more'),
      }),
    }),
  'nomor_wa.terbalik.ke_kirim': whatsapp(teks('Beralih ke kode dikirim', 'Switched to receiving a code'),
    teks('Pengguna mengetuk Minta kode dikirim dari cara kirim pesan.', 'The user tapped Request a code from the message verification flow.'), {
      dari: pilihan(teks('Dari layar', 'From screen'), {
        siap: teks('Kode tampil', 'Code shown'), menunggu: MENUNGGU,
        belum_sampai: teks('Pesan belum sampai', 'Message not received'),
        belum_sampai_lagi: teks('Pesan belum sampai dua kali', 'Message not received twice'),
        sakit: teks('Cara kirim pesan terganggu', 'Message verification disrupted'),
      }),
    }),
} as const

export const KAMUS_TONGGAK_PERJALANAN = {
  'akun.daftar': peristiwa('onboarding', teks('Akun dibuat', 'Account created'),
    teks('Server mencatat waktu pembuatan akun.', 'The server recorded when the account was created.')),
  'akun.email_terverifikasi': peristiwa('onboarding', teks('Email terverifikasi', 'Email verified'),
    teks('Alamat email akun berhasil dikonfirmasi.', 'The account email address was confirmed.')),
  'akun.masuk_terakhir': peristiwa('onboarding', teks('Masuk terakhir', 'Last sign-in'),
    teks('Server mencatat waktu masuk terakhir untuk akun ini.', 'The server recorded the most recent sign-in for this account.')),
  'nomor_wa.kode_diminta': peristiwa('nomor_wa', teks('Server membuat kode untuk dikirim', 'Server created a code for delivery'),
    teks('Server membuat kode yang akan diterima pengguna lewat WhatsApp.', 'The server created a code for the user to receive over WhatsApp.'), { kirim: KIRIM_OTP }),
  'nomor_wa.kode_selesai': peristiwa('nomor_wa', teks('Permintaan kode WhatsApp selesai', 'WhatsApp code request ended'),
    teks('Server mencatat hasil akhir kode yang diminta pengguna.', 'The server recorded the final outcome of the requested code.'), {
      status: STATUS_OTP, kirim: KIRIM_OTP, percobaan: PERCOBAAN,
    }),
  'nomor_wa.masuk_dimulai': peristiwa('nomor_wa', teks('Server membuat kode untuk dikirim pengguna', 'Server created a code for the user to send'),
    teks('Server siap menerima pesan WhatsApp berkode dari pengguna.', 'The server was ready to receive the user’s WhatsApp message with the code.')),
  'nomor_wa.masuk_selesai': peristiwa('nomor_wa', teks('Verifikasi dengan kirim pesan selesai', 'Message verification ended'),
    teks('Server mencatat hasil akhir verifikasi lewat pesan masuk.', 'The server recorded the final outcome of verification through an incoming message.'), {
      status: STATUS_OTP, percobaan: PERCOBAAN, tanpa_nomor: angka(teks('Pesan tanpa nomor yang terbaca', 'Messages without a readable number'), 1000),
    }),
  'nomor_wa.tersimpan': peristiwa('nomor_wa', teks('Nomor WhatsApp tersimpan', 'WhatsApp number saved'),
    teks('Server menyimpan nomor WhatsApp setelah verifikasi berhasil.', 'The server saved the WhatsApp number after successful verification.'), {
      cara: pilihan(teks('Cara verifikasi', 'Verification method'), {
        wa_sapa: teks('Nomor WhatsApp tersimpan lewat cara terima kode', 'WhatsApp number saved by receiving a code'),
        wa_masuk: teks('Nomor WhatsApp tersimpan lewat cara kirim pesan', 'WhatsApp number saved by sending a message'),
      }),
    }, 'cara'),
  'nomor_wa.gangguan_lewat': peristiwa('nomor_wa', teks('Verifikasi WhatsApp dilewati', 'WhatsApp verification skipped'),
    teks('Server mengizinkan pengguna melanjutkan dengan email.', 'The server allowed the user to continue with email.'), {
      sebab: pilihan(SEBAB, { gangguan: GANGGUAN, tanpa_nomor: TANPA_NOMOR }),
    }),
  'domi.kredit_ditahan': peristiwa('kredit', teks('Kredit gratis Domi ditahan', 'Free Domi credits held'),
    teks('Server menahan kredit gratis selama verifikasi WhatsApp belum selesai.', 'The server held free credits while WhatsApp verification was incomplete.'), {
      jumlah: angka(teks('Jumlah kredit', 'Credits')),
      dilepas: yaTidak(teks('Kredit sudah dilepas', 'Credits released')),
    }),
  'domi.pembelian': peristiwa('kredit', teks('Pembelian kredit Domi', 'Domi credit purchase'),
    teks('Server mencatat pembelian paket kredit Domi.', 'The server recorded a purchase of a Domi credit pack.'), {
      status: STATUS_PEMBELIAN,
      jalur: pilihan(JALUR, { play: teks('Google Play', 'Google Play'), qris: teks('QRIS', 'QRIS') }),
      paket: { label: teks('Kode paket', 'Pack code'), bentuk: 'paket' },
      kredit: angka(teks('Jumlah kredit', 'Credits')),
    }),
  'domi.pemakaian': peristiwa('domi', teks('Memakai Domi', 'Used Domi'),
    teks('Server merangkum pesan dan percakapan Domi pada hari ini.', 'The server counted Domi messages and conversations for the day.'), {
      pesan_pengguna: angka(teks('Pesan pengguna', 'User messages')),
      pesan_domi: angka(teks('Balasan Domi', 'Domi replies')),
      percakapan: angka(teks('Percakapan', 'Conversations')),
    }),
  'aplikasi.versi_berganti': peristiwa('pembaruan', teks('Versi aplikasi berganti', 'App version changed'),
    teks('Versi yang tercatat berbeda dari peluncuran sebelumnya.', 'The recorded version differed from the previous launch.'), {
      dari_versi: versi(teks('Versi sebelumnya', 'Previous version')),
      ke_versi: versi(teks('Versi baru', 'New version')),
    }),
} as const

export const KAMUS_LAYAR_PERJALANAN = {
  '/': teks('Beranda', 'Home'),
  '/account': teks('Akun', 'Account'),
  '/ai': teks('Domi', 'Domi'),
  '/aktivitas': teks('Aktivitas', 'Activity'),
  '/budget': teks('Anggaran', 'Budget'),
  '/budget-target': teks('Target anggaran', 'Budget target'),
  '/catat-cepat': teks('Catat cepat', 'Quick record'),
  '/categories': teks('Kategori', 'Categories'),
  '/category': teks('Formulir kategori', 'Category form'),
  '/g/:kode': teks('Tautan undangan', 'Invitation link'),
  '/hapus-akun': teks('Hapus akun', 'Delete account'),
  '/jadwal': teks('Jadwal', 'Schedules'),
  '/jadwal-analisa': teks('Analisa jadwal', 'Schedule analysis'),
  '/jadwal-bayar': teks('Bayar jadwal', 'Pay schedule'),
  '/jadwal-item': teks('Formulir jadwal', 'Schedule form'),
  '/jadwal-lewati': teks('Lewati jadwal', 'Skip schedule'),
  '/jadwal-rinci': teks('Rincian jadwal', 'Schedule details'),
  '/jadwal-tanggal': teks('Ubah tanggal jadwal', 'Change schedule date'),
  '/jadwal-tunggakan': teks('Tunggakan jadwal', 'Overdue schedules'),
  '/join': teks('Gabung ruang', 'Join workspace'),
  '/kabar': teks('Kabar', 'Updates'),
  '/kabar-setelan': teks('Setelan kabar', 'Update settings'),
  '/kasbon': teks('Kasbon', 'Customer tabs'),
  '/laporan-rentang': teks('Rentang laporan', 'Report date range'),
  '/laporan-usaha': teks('Laporan usaha', 'Business report'),
  '/lupa-sandi': teks('Lupa sandi', 'Forgot password'),
  '/nomor-wa': teks('Nomor WhatsApp', 'WhatsApp number'),
  '/notif-catat': teks('Catat dari notifikasi', 'Record from notifications'),
  '/notifikasi': teks('Notifikasi', 'Notifications'),
  '/patungan': teks('Patungan', 'Shared expenses'),
  '/patungan-saldo': teks('Saldo patungan', 'Shared expense balances'),
  '/pelanggan': teks('Pelanggan', 'Customers'),
  '/pelanggan-baru': teks('Pelanggan baru', 'New customer'),
  '/pelanggan-item': teks('Rincian pelanggan', 'Customer details'),
  '/penjualan': teks('Penjualan', 'Sales'),
  '/pilih-catat': teks('Pilih yang mau dicatat', 'Choose what to record'),
  '/plus': teks('CashFlow Plus', 'CashFlow Plus'),
  '/ppob': teks('Pulsa dan tagihan', 'Top-ups and bills'),
  '/ppob-pesanan': teks('Pesanan pulsa dan tagihan', 'Top-up and bill order'),
  '/ppob-riwayat': teks('Riwayat pulsa dan tagihan', 'Top-up and bill history'),
  '/priming-kabar': teks('Izin notifikasi', 'Notification permission'),
  '/produk': teks('Barang', 'Items'),
  '/produk-item': teks('Formulir barang', 'Item form'),
  '/produk-rinci': teks('Rincian barang', 'Item details'),
  '/qris': teks('QRIS', 'QRIS'),
  '/rekap-cabang': teks('Rekap cabang', 'Branch summary'),
  '/rekonsiliasi': teks('Cocokkan saldo', 'Reconcile balance'),
  '/rencana': teks('Rencana beli', 'Purchase plans'),
  '/rencana-baru': teks('Rencana beli baru', 'New purchase plan'),
  '/rencana-form': teks('Formulir rencana beli', 'Purchase plan form'),
  '/rencana-rinci': teks('Rincian rencana beli', 'Purchase plan details'),
  '/riwayat-stok': teks('Riwayat stok', 'Stock history'),
  '/salin-katalog': teks('Salin katalog', 'Copy catalog'),
  '/sampah': teks('Sampah', 'Trash'),
  '/semua-kredit': teks('Paket kredit Domi', 'Domi credit packs'),
  '/settings': teks('Setelan', 'Settings'),
  '/sign-in': teks('Masuk', 'Sign in'),
  '/sign-up': teks('Daftar', 'Sign up'),
  '/stok': teks('Stok', 'Stock'),
  '/stok-awal': teks('Stok awal', 'Opening stock'),
  '/stok-hitung': teks('Hitung stok', 'Count stock'),
  '/stok-ubah': teks('Ubah stok', 'Adjust stock'),
  '/struk': teks('Catat struk', 'Record receipt'),
  '/struk-lihat': teks('Lihat struk', 'View receipt'),
  '/transaction': teks('Formulir transaksi', 'Transaction form'),
  '/transactions': teks('Transaksi', 'Transactions'),
  '/transfer': teks('Pindah antar dompet', 'Transfer between wallets'),
  '/undangan': teks('Undangan', 'Invitations'),
  '/usaha': teks('Usaha', 'Business'),
  '/verifikasi': teks('Verifikasi email', 'Email verification'),
  '/wa': teks('Buka CashFlow dari WhatsApp', 'Open CashFlow from WhatsApp'),
  '/wa-catat': teks('Catat lewat WhatsApp', 'Record via WhatsApp'),
  '/wallet': teks('Formulir dompet', 'Wallet form'),
  '/wallets': teks('Dompet', 'Wallets'),
  '/workspace': teks('Ruang', 'Workspaces'),
  '/workspace-members': teks('Anggota ruang', 'Workspace members'),
  jaringan: teks('Jaringan', 'Network'),
} as const

const UNKNOWN_EVENT = teks('Peristiwa belum dikenal', 'Unrecognized event')
const UNKNOWN_SCREEN = teks('Layar belum dikenal', 'Unrecognized screen')
const POTONGAN = yaTidak(teks('Rincian terpotong', 'Details truncated'))
const POLA_VERSI = /^(0|[1-9][0-9]{0,2})(\.(0|[1-9][0-9]{0,2})){2,3}(-(rc|ias|uat|beta|alpha)\.[0-9]{1,2})?$/
const POLA_KODE_BUILD = /^[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])(0[1-9]|[1-9][0-9])$/
const POLA_PAKET = /^[a-z0-9_-]{1,24}$/
const POLA_ENUM = /^[a-z][a-z0-9_-]{0,31}$/
const POLA_DERET_ANGKA = /[0-9]{6}/

const ambil = <T>(objek: Readonly<Record<string, T>>, kunci: string): T | undefined =>
  Object.hasOwn(objek, kunci) ? objek[kunci] : undefined

export interface RincianPerjalananTampil {
  kunci: string
  label: string
  nilai: string
  belumDikenal: boolean
}
type PeristiwaMasuk = {
  jenis: string
  langkah: string | null
  layar: string | null
  rincian_aman: Readonly<Record<string, unknown>>
}
function terjemahBidang(kunci: string, bidang: Bidang, nilai: unknown, bahasa: Bahasa): RincianPerjalananTampil {
  const label = bidang.label[bahasa]
  const dikenal = (isi: string): RincianPerjalananTampil => ({ kunci, label, nilai: isi, belumDikenal: false })
  if (bidang.bentuk === 'angka' && typeof nilai === 'number' && Number.isSafeInteger(nilai)
    && nilai >= 0 && nilai <= (bidang.maks ?? 0)) {
    return dikenal(new Intl.NumberFormat(bahasa === 'id' ? 'id-ID' : 'en', { useGrouping: false }).format(nilai))
  }
  if (bidang.bentuk === 'kode_build' && typeof nilai === 'number' && POLA_KODE_BUILD.test(String(nilai))) {
    return dikenal(String(nilai))
  }
  if (typeof nilai === 'string' && !POLA_DERET_ANGKA.test(nilai)) {
    if (bidang.bentuk === 'versi' && POLA_VERSI.test(nilai)) return dikenal(nilai)
    if (bidang.bentuk === 'paket' && nilai !== 'belum_dikenal' && POLA_PAKET.test(nilai)) return dikenal(nilai)
  }
  if (bidang.nilai && (typeof nilai === 'string' || typeof nilai === 'boolean' || typeof nilai === 'number')) {
    const terjemahan = ambil(bidang.nilai, String(nilai))
    if (terjemahan) return dikenal(terjemahan[bahasa])
  }
  // Larik: dikenal hanya bila SEMUA anggotanya dikenal. Larik kosong atau
  // campuran tidak ditampilkan isinya.
  if (bidang.larik && bidang.nilai && Array.isArray(nilai) && nilai.length > 0) {
    const isi = nilai.map(x => (typeof x === 'string' ? ambil(bidang.nilai!, x) : undefined))
    if (isi.every(Boolean)) return dikenal(isi.map(t => t![bahasa]).join(', '))
  }
  // Id katalog baru (mis. sumber promo yang ditambah sesudah console rilis).
  if (bidang.bentuk === 'kode' && typeof nilai === 'string' && nilai !== 'belum_dikenal'
    && POLA_ID_SUMBER.test(nilai) && !POLA_DERET_ANGKA.test(nilai)) {
    return dikenal(nilai)
  }
  // Bentuk enum asing yang sudah lolos daftar putih server bisa membantu
  // penelusuran. Jangan ulangi nilai mentah lain, termasuk penanda SQL.
  const kodeAman = bidang.nilai && typeof nilai === 'string' && nilai !== 'belum_dikenal'
    && POLA_ENUM.test(nilai) && !POLA_DERET_ANGKA.test(nilai)
  return { kunci, label, nilai: kodeAman ? nilai : BELUM_DIKENAL[bahasa], belumDikenal: true }
}

export function terjemahPeristiwa(baris: PeristiwaMasuk, bahasa: Bahasa): {
  judul: string
  arti: string
  layar: string | null
  rincian: RincianPerjalananTampil[]
} {
  const entri = baris.jenis === 'onboarding.langkah' && baris.langkah
    ? ambil(KAMUS_LANGKAH_PERJALANAN, baris.langkah)
    : ambil(KAMUS_JENIS_PERJALANAN, baris.jenis) ?? ambil(KAMUS_TONGGAK_PERJALANAN, baris.jenis)
  const layarDikenal = baris.layar ? ambil(KAMUS_LAYAR_PERJALANAN, baris.layar)?.[bahasa] : null
  const layar = layarDikenal ?? (baris.layar ? UNKNOWN_SCREEN[bahasa] : null)
  const aman = baris.rincian_aman
  const rincian = Object.entries(entri?.bidang ?? {})
    .filter(([kunci]) => Object.hasOwn(aman, kunci) && aman[kunci] != null)
    .map(([kunci, bidang]) => terjemahBidang(kunci, bidang, aman[kunci], bahasa))
  if (aman.terpotong != null) rincian.push(terjemahBidang('terpotong', POTONGAN, aman.terpotong, bahasa))
  const hasil = rincian.find(r => r.kunci === entri?.judulDari && !r.belumDikenal)?.nilai
  const judul = baris.jenis === 'layar.buka' && layarDikenal
    ? (bahasa === 'id' ? `Membuka ${layarDikenal}` : `Opened ${layarDikenal}`)
    : hasil ?? entri?.judul[bahasa] ?? UNKNOWN_EVENT[bahasa]
  return { judul, arti: entri?.arti[bahasa] ?? '', layar, rincian }
}
