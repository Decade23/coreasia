/**
 * Kamus modul CashFlow — ID default, EN mengikuti locale console.
 *
 * Dipisah dari useConsoleI18n supaya berkas console yang 1.100 baris itu tidak
 * bertambah 200 baris milik satu produk; yang ditaruh di sana hanya SATU kunci:
 * label menu `layout.cashflow`. Modul lain (LeadKu, Pantau) kelak meniru pola
 * yang sama, masing-masing dengan kamusnya sendiri.
 *
 * Aturan wording: singkat, padat, bahasa manusia — bukan bahasa sistem.
 */
const KAMUS = {
  id: {
    nav: { ringkasan: 'Ringkasan', pengguna: 'Pengguna', aktivitas: 'Aktivitas', ruang: 'Ruang', kesehatan: 'Kesehatan', sakelar: 'Sakelar', pengumuman: 'Pengumuman', audit: 'Audit' },
    umum: {
      memuat: 'Memuat…', gagal: 'Gagal memuat.', kosong: 'Belum ada data.', tutup: 'Tutup', batal: 'Batal', simpan: 'Simpan',
      cari: 'Cari…', semua: 'Semua', ya: 'Ya', tidak: 'Tidak', alasan: 'Alasan', keluar: 'Keluar dari CashFlow',
      bukanAdmin: 'Akun ini belum terdaftar sebagai admin CashFlow. Minta pemilik menambahkannya di admin_users.',
      perluTotp: 'Sesi CashFlow-mu belum lewat verifikasi dua langkah.',
      belumKonfigurasi: 'Modul CashFlow belum dikonfigurasi: NUXT_PUBLIC_CASHFLOW_SUPABASE_URL dan ANON_KEY belum dipasang.',
    },
    masuk: {
      judul: 'Masuk ke CashFlow', kicker: 'Gerbang kedua',
      keterangan: 'Data keuangan pengguna dijaga terpisah dari console. Masuk dengan akun admin CashFlow, lalu kode dari aplikasi autentikator.',
      email: 'Email', sandi: 'Kata sandi', lanjut: 'Lanjut', kode: 'Kode 6 angka', verifikasi: 'Verifikasi',
      enrollJudul: 'Pasang autentikator dulu', enrollKet: 'Akun ini belum punya TOTP. Pindai kode QR di aplikasi autentikator, lalu masukkan kode pertamanya.',
      enrollMulai: 'Buat kode QR', enrollSelesai: 'Aktifkan',
      sebabTotp: 'Sesi lama belum lewat verifikasi dua langkah — masuk lagi.',
    },
    ringkasan: {
      judul: 'Ringkasan', ket: 'Hidup atau tidaknya produk, dalam lima detik.',
      keberhasilan: 'Orang di luar lingkaran pemilik dengan ≥ 10 transaksi dalam 14 hari',
      keberhasilanKet: 'Ukuran keberhasilan yang disepakati. Email pemilik dan pengecualian di Sakelar tidak dihitung.',
      pengguna: 'Pengguna', ruang: 'Ruang', transaksi: 'Transaksi', perHari: 'Transaksi per hari, 30 hari terakhir',
      corong: 'Corong aktivasi, 90 hari', corongKet: 'Berapa yang berhenti, dan di langkah mana.',
      kohort: 'Retensi per bulan pendaftaran',
      langkah: { daftar: 'Daftar', masuk_lagi: 'Buka lagi', menyiapkan: 'Menyiapkan dompet/ruang', tx_pertama: 'Transaksi pertama', sepuluh_tx: 'Sepuluh transaksi' },
      sedikit: (n: number, batas: number) => `Baru ${n} data. Grafik muncul begitu ada ${batas}.`,
    },
    pengguna: {
      judul: 'Pengguna', ket: 'Tersamar secara bawaan. Membuka satu orang butuh alasan, dan alasannya tercatat.',
      email: 'Email', daftar: 'Daftar', masuk: 'Masuk terakhir', ruang: 'Ruang', tx: 'Transaksi', status: 'Status',
      aktif: 'Aktif', ditangguhkan: 'Ditangguhkan', buka: 'Buka', belumCatat: 'Tidak pernah mencatat', catat7: 'Mencatat 7 hari',
      detail: 'Detail pengguna', dibukaDengan: 'Dibuka dengan alasan', pada: 'pada',
      jeda: 'Jeda daftar → transaksi pertama', ruangnya: 'Ruang', aktivitas: 'Lini masa aktivitas', transaksi: 'Transaksi',
      catatanTersembunyi: 'Catatan bebas disembunyikan. Butuh alasan tingkat investigasi untuk menampilkannya.',
      tampilkanCatatan: 'Tampilkan catatan', bukaEmail: 'Tampilkan email utuh',
      kolom: { nama: 'Nama', peran: 'Peran', anggota: 'Anggota', tx: 'Tx', masuk: 'Pemasukan', keluar: 'Pengeluaran', dompet: 'Dompet', jadwal: 'Jadwal' },
    },
    alasan: {
      judul: 'Kenapa data ini dibuka?', ket: 'Dicatat permanen — siapa, kapan, data siapa, dan alasannya — sebelum data tampil. Ini janji di kebijakan privasi.',
      preset: { keluhan: 'Keluhan pengguna', penyalahgunaan: 'Dugaan penyalahgunaan', pembayaran: 'Verifikasi pembayaran', galat: 'Investigasi galat', berkala: 'Peninjauan berkala' },
      lengkapi: 'Lengkapi: nomor tiket, nama pelapor, atau konteksnya (min. 8 aksara)', buka: 'Buka data', pendek: 'Alasan masih terlalu pendek.',
      investigasi: 'Menampilkan catatan bebas butuh alasan tingkat investigasi.',
    },
    aktivitas: { judul: 'Aktivitas', ket: 'Denyut produk lintas ruang — tanpa nama, tanpa catatan, nominal hanya rentang.', jenis: 'Jenis', nominal: 'Nominal', tanggal: 'Tanggal', ruang: 'Ruang', waktu: 'Waktu' },
    ruang: { judul: 'Ruang', ket: 'Nama buatan pengguna tersamar; pemilik tersamar.', nama: 'Nama', pemilik: 'Pemilik', anggota: 'Anggota', tx: 'Transaksi', undangan: 'Undangan aktif', dibuat: 'Dibuat' },
    kesehatan: { judul: 'Kesehatan', ket: 'Yang dilihat saat ada keluhan.', db: 'Ukuran basis data', tabel: 'Tabel', baris: 'Baris', ukuran: 'Ukuran', yatim: 'Foto yatim', yatimKet: 'Objek storage tanpa induk. Disapu lewat Storage API di luar console; salin daftarnya.', salin: 'Salin daftar jalur', ocr: 'Status OCR struk', telemetri: 'Telemetri klien, 30 hari', telemetriKet: 'Muncul setelah aplikasi 1.2.0 tayang.' },
    sakelar: {
      judul: 'Sakelar', ket: 'Konfigurasi jarak jauh. Setiap perubahan beraudit.',
      otpJudul: 'Verifikasi email pendaftar baru', otpWajib: 'Wajib (normal)', otpLonggar: 'Longgar (darurat)',
      otpKet: 'Longgar = pendaftar baru dikonfirmasi otomatis tanpa kode email. Nyalakan hanya saat pengiriman email bermasalah, lalu kembalikan. Pemulihan sandi tetap wajib kode — itu bukti kepemilikan email.',
      otpAktif: 'Sedang LONGGAR — pendaftar baru tidak diminta kode.', otpNormal: 'Normal — kode email wajib.',
      pengecualian: 'Pengecualian ukuran keberhasilan', pengecualianKet: 'Email keluarga/rekan yang memasang karena kenal, bukan karena butuh. Email admin selalu dikecualikan otomatis.',
      tambahEmail: 'Tambah email', semua: 'Semua kunci', kunci: 'Kunci', nilai: 'Nilai', publik: 'Publik', catatan: 'Catatan', diperbarui: 'Diperbarui',
      alasanUbah: 'Alasan perubahan',
    },
    audit: { judul: 'Audit CashFlow', ket: 'Log pembukaan data — dibaca langsung dari Supabase, tidak disalin ke mana pun.', aksi: 'Aksi', admin: 'Admin', target: 'Target', alasan: 'Alasan', waktu: 'Waktu' },
    pengumuman: { judul: 'Pengumuman', ket: 'Tampil di aplikasi semua pengguna.', judulKolom: 'Judul', level: 'Level', mulai: 'Mulai', sampai: 'Sampai', hentikan: 'Hentikan', buat: 'Buat pengumuman', isi: 'Isi' },
  },
  en: {
    nav: { ringkasan: 'Overview', pengguna: 'Users', aktivitas: 'Activity', ruang: 'Workspaces', kesehatan: 'Health', sakelar: 'Switches', pengumuman: 'Announcements', audit: 'Audit' },
    umum: {
      memuat: 'Loading…', gagal: 'Failed to load.', kosong: 'No data yet.', tutup: 'Close', batal: 'Cancel', simpan: 'Save',
      cari: 'Search…', semua: 'All', ya: 'Yes', tidak: 'No', alasan: 'Reason', keluar: 'Sign out of CashFlow',
      bukanAdmin: 'This account is not a CashFlow admin yet. Ask the owner to add it to admin_users.',
      perluTotp: 'Your CashFlow session has not passed two-step verification.',
      belumKonfigurasi: 'CashFlow module is not configured: NUXT_PUBLIC_CASHFLOW_SUPABASE_URL and ANON_KEY are missing.',
    },
    masuk: {
      judul: 'Sign in to CashFlow', kicker: 'Second gate',
      keterangan: 'User financial data is guarded separately from the console. Sign in with a CashFlow admin account, then the code from your authenticator app.',
      email: 'Email', sandi: 'Password', lanjut: 'Continue', kode: '6-digit code', verifikasi: 'Verify',
      enrollJudul: 'Set up an authenticator first', enrollKet: 'This account has no TOTP yet. Scan the QR code in your authenticator app, then enter its first code.',
      enrollMulai: 'Generate QR code', enrollSelesai: 'Activate',
      sebabTotp: 'The previous session had not passed two-step verification — sign in again.',
    },
    ringkasan: {
      judul: 'Overview', ket: 'Whether the product is alive, in five seconds.',
      keberhasilan: 'People outside the owner\'s circle with ≥ 10 transactions in 14 days',
      keberhasilanKet: 'The agreed success metric. Owner emails and exclusions in Switches are not counted.',
      pengguna: 'Users', ruang: 'Workspaces', transaksi: 'Transactions', perHari: 'Transactions per day, last 30 days',
      corong: 'Activation funnel, 90 days', corongKet: 'How many stop, and at which step.',
      kohort: 'Retention by signup month',
      langkah: { daftar: 'Signed up', masuk_lagi: 'Opened again', menyiapkan: 'Set up wallet/workspace', tx_pertama: 'First transaction', sepuluh_tx: 'Ten transactions' },
      sedikit: (n: number, batas: number) => `Only ${n} data points. The chart appears at ${batas}.`,
    },
    pengguna: {
      judul: 'Users', ket: 'Masked by default. Opening one person needs a reason, and the reason is recorded.',
      email: 'Email', daftar: 'Signed up', masuk: 'Last sign-in', ruang: 'Workspaces', tx: 'Transactions', status: 'Status',
      aktif: 'Active', ditangguhkan: 'Suspended', buka: 'Open', belumCatat: 'Never recorded', catat7: 'Recorded in 7 days',
      detail: 'User detail', dibukaDengan: 'Opened with reason', pada: 'at',
      jeda: 'Signup → first transaction', ruangnya: 'Workspaces', aktivitas: 'Activity timeline', transaksi: 'Transactions',
      catatanTersembunyi: 'Free-text notes are hidden. An investigation-level reason is required to show them.',
      tampilkanCatatan: 'Show notes', bukaEmail: 'Show full email',
      kolom: { nama: 'Name', peran: 'Role', anggota: 'Members', tx: 'Tx', masuk: 'Income', keluar: 'Expense', dompet: 'Wallets', jadwal: 'Schedules' },
    },
    alasan: {
      judul: 'Why is this data being opened?', ket: 'Recorded permanently — who, when, whose data, and why — before the data appears. This is a privacy-policy promise.',
      preset: { keluhan: 'User complaint', penyalahgunaan: 'Suspected abuse', pembayaran: 'Payment verification', galat: 'Error investigation', berkala: 'Periodic review' },
      lengkapi: 'Add context: ticket number, reporter, or details (min. 8 characters)', buka: 'Open data', pendek: 'Reason is still too short.',
      investigasi: 'Showing free-text notes requires an investigation-level reason.',
    },
    aktivitas: { judul: 'Activity', ket: 'Product pulse across workspaces — no names, no notes, amounts as ranges only.', jenis: 'Type', nominal: 'Amount', tanggal: 'Date', ruang: 'Workspace', waktu: 'Time' },
    ruang: { judul: 'Workspaces', ket: 'User-created names masked; owners masked.', nama: 'Name', pemilik: 'Owner', anggota: 'Members', tx: 'Transactions', undangan: 'Active invites', dibuat: 'Created' },
    kesehatan: { judul: 'Health', ket: 'What you look at when something is reported.', db: 'Database size', tabel: 'Table', baris: 'Rows', ukuran: 'Size', yatim: 'Orphaned photos', yatimKet: 'Storage objects without a parent. Swept via the Storage API outside the console; copy the list.', salin: 'Copy path list', ocr: 'Receipt OCR status', telemetri: 'Client telemetry, 30 days', telemetriKet: 'Appears after app 1.2.0 ships.' },
    sakelar: {
      judul: 'Switches', ket: 'Remote configuration. Every change is audited.',
      otpJudul: 'Email verification for new signups', otpWajib: 'Required (normal)', otpLonggar: 'Relaxed (emergency)',
      otpKet: 'Relaxed = new signups are auto-confirmed without an email code. Enable only while email delivery is broken, then revert. Password recovery still requires the code — it proves email ownership.',
      otpAktif: 'Currently RELAXED — new signups are not asked for a code.', otpNormal: 'Normal — email code required.',
      pengecualian: 'Success-metric exclusions', pengecualianKet: 'Family/colleague emails who installed out of goodwill, not need. Admin emails are always excluded automatically.',
      tambahEmail: 'Add email', semua: 'All keys', kunci: 'Key', nilai: 'Value', publik: 'Public', catatan: 'Note', diperbarui: 'Updated',
      alasanUbah: 'Reason for change',
    },
    audit: { judul: 'CashFlow audit', ket: 'Data-access log — read directly from Supabase, never copied anywhere.', aksi: 'Action', admin: 'Admin', target: 'Target', alasan: 'Reason', waktu: 'Time' },
    pengumuman: { judul: 'Announcements', ket: 'Shown in the app to all users.', judulKolom: 'Title', level: 'Level', mulai: 'Starts', sampai: 'Ends', hentikan: 'Stop', buat: 'Create announcement', isi: 'Body' },
  },
} as const

type Kamus = typeof KAMUS.id

export const useCashflowI18n = () => {
  const { locale } = useConsoleI18n()
  const kamus = computed<Kamus>(() => (locale.value === 'en' ? (KAMUS.en as unknown as Kamus) : KAMUS.id))
  /** tcf('pengguna.kolom.nama') — kunci bertitik; fungsi dipulangkan apa adanya. */
  const tcf = (jalur: string): any =>
    jalur.split('.').reduce<any>((acc, k) => acc?.[k], kamus.value) ?? jalur
  return { tcf, kamus }
}
