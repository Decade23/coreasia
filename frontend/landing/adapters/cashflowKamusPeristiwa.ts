/**
 * Kosakata Perjalanan untuk telemetri aplikasi dan tonggak server.
 * Rincian yang diterjemahkan mengikuti daftar putih RPC Perjalanan.
 */
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
  bentuk?: 'versi' | 'paket' | 'angka' | 'kode_build'
  maks?: number
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
const pembaruan = (judul: Dwibahasa, arti: Dwibahasa, bidang?: Peristiwa['bidang']) =>
  peristiwa('pembaruan', judul, arti, { ...BUILD_PEMBARUAN, ...bidang })

export const KAMUS_JENIS_PERJALANAN = {
  'layar.buka': peristiwa('aplikasi', teks('Membuka layar', 'Opened screen'),
    teks('Aplikasi berpindah ke layar lain.', 'The app navigated to another screen.')),
  'onboarding.langkah': peristiwa('onboarding', teks('Langkah pengenalan', 'Onboarding step'),
    teks('Aplikasi mencatat satu langkah pengguna.', 'The app recorded a user step.')),
  'galat.js': peristiwa('galat', teks('Galat aplikasi', 'App error'),
    teks('Aplikasi mencatat galat saat berjalan.', 'The app recorded a runtime error.'), {
      fatal: yaTidak(teks('Galat fatal', 'Fatal error')),
      sumber: pilihan(teks('Bagian aplikasi', 'App area'), { kedepan: teks('Analisa ke depan', 'Forecast') }),
      sebab: pilihan(SEBAB, { 'fetch-lambat-beruntun': teks('Permintaan berulang kali melewati batas waktu', 'Repeated request timeouts') }),
      tahap: pilihan(TAHAP, { kepala: teks('Menunggu awal balasan', 'Waiting for response headers'), badan: teks('Membaca isi balasan', 'Reading response body') }),
      beruntun: angka(teks('Permintaan yang gagal beruntun', 'Consecutive failed requests')),
      batasMs: angka(teks('Batas waktu (ms)', 'Timeout (ms)')),
      umurProsesDetik: angka(teks('Detik sejak aplikasi berjalan', 'Seconds since app startup')),
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
    teks('Ruang usaha mencatat penjualan pertamanya.', 'The business workspace recorded its first sale.'), { asal: ASAL_RUANG }),
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
  'plus_minat.lihat': peristiwa('onboarding', teks('Melihat kartu CashFlow Plus', 'Saw the CashFlow Plus card'),
    teks('Beranda menampilkan kartu CashFlow Plus pada peluncuran ini.', 'Home showed the CashFlow Plus card during this launch.')),
  'plus_minat.tutup': peristiwa('onboarding', teks('Menunda CashFlow Plus', 'Dismissed CashFlow Plus'),
    teks('Pengguna memilih Nanti saja di kartu CashFlow Plus.', 'The user selected Not now on the CashFlow Plus card.')),
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
