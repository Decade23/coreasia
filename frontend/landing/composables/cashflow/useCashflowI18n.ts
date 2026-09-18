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
import { tanggalPendek, jamWib, waktuPendekWib, type BahasaWaktu } from '~/adapters/cashflowWaktu'

const KAMUS = {
  id: {
    nav: { ringkasan: 'Ringkasan', pengguna: 'Pengguna', aktivitas: 'Aktivitas', ruang: 'Ruang', kesehatan: 'Kesehatan', sakelar: 'Sakelar', pengumuman: 'Pengumuman', audit: 'Audit' },
    umum: {
      memuat: 'Memuat…', gagal: 'Gagal memuat.', kosong: 'Belum ada data.', tutup: 'Tutup', batal: 'Batal', simpan: 'Simpan',
      cari: 'Cari…', semua: 'Semua', ya: 'Ya', tidak: 'Tidak', alasan: 'Alasan', keluar: 'Keluar dari CashFlow',
      bukanAdmin: 'Identitas konsol belum terdaftar sebagai admin CashFlow (admin_users.lewat_konsol). Periksa migrasi 0077/0078.',
      perluTotp: 'Sesi CashFlow ditolak server. Menyambung ulang…',
      belumKonfigurasi: 'Modul CashFlow belum dikonfigurasi: NUXT_PUBLIC_CASHFLOW_SUPABASE_URL dan ANON_KEY belum dipasang.',
      tidakAda: 'Data tidak ditemukan.', tersimpan: 'Tersimpan.', kosongSaring: 'Tidak ada yang cocok dengan saringan.',
      sebelumnya: 'Sebelumnya', berikutnya: 'Berikutnya',
      halaman: (hal: number, n: number) => `Halaman ${hal} dari ${n}`,
      rentang: (a: number, b: number, total: number) => `${a}–${b} dari ${total}`,
      potong: (n: number, total: number) => `Menampilkan ${n} dari ${total} baris; sisanya terpotong batas server.`,
      vsSebelumnya: 'vs periode sebelumnya',
    },
    palet: {
      judul: 'Cari dan pindah', tombol: 'Cari', placeholder: 'Halaman, UUID pengguna, atau email tersamar (ded***)',
      ket: 'Hanya bentuk tersamar yang bisa dicari; pencarian tidak menulis audit.',
      halaman: 'Halaman', orang: 'Pengguna (tersamar)', bukaPengguna: 'Buka pengguna', tidakDiDaftar: 'Tidak ada di daftar',
      memuat: 'Memuat daftar tersamar…', kosong: 'Tidak ada yang cocok.', petunjuk: '↑↓ pilih · Enter buka · Esc tutup',
    },
    masuk: {
      judul: 'Menyambung ke CashFlow',
      keterangan: 'Sesi data CashFlow dibuat otomatis dari login console. Tidak ada kata sandi kedua.',
      menyambung: 'Menyambungkan…', cobaLagi: 'Coba lagi', masukUlangConsole: 'Masuk ulang ke console',
      sebab: {
        konfigurasi: 'Modul belum dikonfigurasi: env Supabase publik belum dipasang.',
        'belum-konfigurasi': 'Server console belum memegang kunci layanan CashFlow.',
        'tanpa-cookie': 'Sesi console tidak ditemukan. Masuk ulang ke console.',
        'cookie-ditolak': 'Sesi console ditolak gateway. Masuk ulang ke console.',
        'gateway-gagal': 'Gateway console tidak menjawab. Bukan salah sesi Master — coba lagi sebentar.',
        'lintas-situs': 'Permintaan tidak datang dari halaman console.',
        sibuk: 'Masih menyambungkan…',
        'tanpa-izin': 'Peran akun console ini tidak punya izin membuka CashFlow.',
        'mint-gagal': 'Supabase menolak membuat sesi. Periksa identitas konsol dan kuncinya di server.',
        jaringan: 'Tidak bisa menghubungi server console.',
        sesi: 'Sesi diterima, tapi tidak bisa dipasang di peramban ini.',
        totp: 'Sesi lama ditolak server. Coba sambung ulang.',
        lain: 'Gagal menyambung.',
      },
    },
    ringkasan: {
      judul: 'Ringkasan', ket: 'Hidup atau tidaknya produk, dalam lima detik.',
      keberhasilan: 'Orang di luar lingkaran pemilik dengan ≥ 10 transaksi dalam 14 hari',
      keberhasilanKet: (n: number) => `Ukuran keberhasilan yang disepakati. ${n} email tidak dihitung: admin dan pengecualian di Sakelar.`,
      pengguna: 'Pengguna', ruang: 'Ruang', transaksi: 'Transaksi', perHari: 'Transaksi per hari, 30 hari terakhir',
      corong: 'Corong aktivasi, 90 hari', corongKet: 'Berapa yang berhenti, dan di langkah mana.',
      kohort: 'Retensi per bulan pendaftaran',
      kohortKolom: { kohort: 'Kohort', daftar: 'Daftar', pernah: 'Pernah mencatat', masih: 'Masih 30 hari', retensi: 'Retensi' },
      berjalan: 'berjalan',
      langkah: { daftar: 'Daftar', masuk_lagi: 'Buka lagi', menyiapkan: 'Menyiapkan dompet/ruang', tx_pertama: 'Transaksi pertama', sepuluh_tx: 'Sepuluh transaksi' },
      sedikit: (n: number, batas: number) => `Baru ${n} data. Grafik muncul begitu ada ${batas}.`,
    },
    pengguna: {
      judul: 'Pengguna', ket: 'Email tersamar. Email lengkap butuh alasan yang diketik, dan setiap pembukaan tercatat di audit.',
      email: 'Email', daftar: 'Daftar', masuk: 'Masuk terakhir', aktifTerakhir: 'Terakhir aktif', ruang: 'Ruang', tx: 'Transaksi', status: 'Status',
      aktif: 'Aktif', ditangguhkan: 'Ditangguhkan', buka: 'Buka', belumCatat: 'Tidak pernah mencatat', catat7: 'Mencatat 7 hari',
      emailPenuh: 'Email lengkap', emailSamar: 'Tersamar',
      tampilkanEmail: 'Tampilkan email lengkap', samarkanLagi: 'Samarkan lagi',
      alasanDaftarKet: 'Email lengkap semua orang di daftar ini akan tampil. Alasan dicatat permanen dan dipakai ulang 30 menit di tab ini.',
      terbukaDengan: (alasan: string, jam: string) => `Email lengkap dibuka: "${alasan}". Berlaku sampai ${jam} WIB.`,
      potong: (n: number, total: number) => `Menampilkan ${n} pengguna terbaru dari ${total}.`,
      aktifTerakhirKet: 'Terakhir aktif = yang terbaru antara masuk terakhir dan transaksi terakhir. Masuk terakhir sendiri tidak bergerak selama sesi aplikasi masih hidup.',
      detail: 'Detail pengguna', dibukaDengan: 'Dibuka dengan alasan', pada: 'pada',
      jeda: 'Jeda daftar → transaksi pertama', ruangnya: 'Ruang', aktivitas: 'Lini masa aktivitas', transaksi: 'Transaksi',
      jedaBelum: 'Belum pernah mencatat',
      jedaSetelah: (n: number, satuan: 'menit' | 'jam' | 'hari') => `Mencatat pertama kali ${n} ${satuan} setelah daftar`,
      jedaTakLengkap: 'Jeda ke catatan pertama tidak dihitung: hanya transaksi terbaru yang dimuat.',
      ubinKet: 'Dicatat olehnya, termasuk transfer',
      dompetJadwal: (d: number, j: number) => `Dompet dibuatnya: ${d} · Jadwal dibuatnya: ${j}`,
      perRuangMenyusul: 'Angka per ruang belum dikirim server; menyusul di Pengguna 360.',
      pemilik: 'pemilik',
      catatanTersembunyi: 'Catatan bebas tidak dikirim server. Membukanya butuh alasan tingkat investigasi; setiap transaksi yang dibuka tercatat di audit.',
      tampilkanCatatan: 'Tampilkan catatan',
      bercatatan: (n: number) => `${n} transaksi di sini punya catatan (bertanda “Catatan”).`,
      tanpaCatatan: 'Tidak ada transaksi bercatatan di sini.',
      catatanDibuka: (n: number) => `${n} catatan dibuka dengan alasan investigasi.`,
      investigasiKet: (n: number) => `Catatan bebas ${n} transaksi di halaman ini akan dibuka. Id setiap transaksi dan alasanmu dicatat permanen.`,
      adaCatatan: 'Ada catatan (tersembunyi)', catatanPil: 'Catatan',
      membukaCatatan: 'Membuka catatan…',
      txBasi: 'Sebagian transaksi berubah sejak dimuat. Muat ulang (tercatat dengan alasan yang sama), lalu buka catatan lagi.',
      muatUlangTx: 'Muat ulang transaksi',
      transfer: 'Transfer', transferKet: 'Kaki transfer antardompet, bukan pemasukan atau pengeluaran sungguhan.',
      transferKeluar: 'Transfer keluar', transferMasuk: 'Transfer masuk',
      kembaliKeDaftar: 'Kembali ke daftar pengguna',
      txPotong: (n: number, total: number) => `Menampilkan ${n} transaksi terbaru dari ${total}.`,
      kolom: { nama: 'Nama', peran: 'Peran', anggota: 'Anggota', tx: 'Tx', masuk: 'Pemasukan', keluar: 'Pengeluaran', dompet: 'Dompet', jadwal: 'Jadwal', kategori: 'Kategori', catatan: 'Catatan' },
    },
    alasan: {
      judul: 'Kenapa data ini dibuka?', ket: 'Dicatat permanen — siapa, kapan, data siapa, dan alasannya — sebelum data tampil. Ini janji di kebijakan privasi.',
      preset: { keluhan: 'Keluhan pengguna', penyalahgunaan: 'Dugaan penyalahgunaan', pembayaran: 'Verifikasi pembayaran', galat: 'Investigasi galat', berkala: 'Peninjauan berkala' },
      lengkapi: 'Lengkapi: nomor tiket, nama pelapor, atau konteksnya (min. 8 aksara)', buka: 'Buka data', pendek: 'Alasan masih terlalu pendek.',
      investigasi: 'Menampilkan catatan bebas butuh alasan tingkat investigasi.',
    },
    aktivitas: { judul: 'Aktivitas', ket: 'Denyut produk lintas ruang — tanpa nama, tanpa catatan, nominal hanya rentang.', jenis: 'Jenis', nominal: 'Nominal', tanggal: 'Tanggal', ruang: 'Ruang', waktu: 'Waktu' },
    ruang: {
      judul: 'Ruang', ket: 'Nama buatan pengguna dan pemilik disamarkan oleh server.', nama: 'Nama', pemilik: 'Pemilik', anggota: 'Anggota', tx: 'Transaksi', undangan: 'Undangan aktif', dibuat: 'Dibuat',
      jenis: 'Jenis', jenisOpsi: { pribadi: 'Pribadi', usaha: 'Usaha' },
      cari: 'Bentuk tersamar (Wa······, ded***) atau id ruang',
      cariKet: 'Pencarian hanya atas bentuk tersamar yang tampil di tabel; nama asli tidak bisa ditebak lewat kotak ini.',
    },
    kesehatan: { judul: 'Kesehatan', ket: 'Yang dilihat saat ada keluhan.', db: 'Ukuran basis data', tabel: 'Tabel', baris: 'Baris', ukuran: 'Ukuran', yatim: 'Foto yatim', yatimKet: 'Objek storage tanpa induk. Disapu lewat Storage API di luar console; salin daftarnya.', salin: 'Salin daftar jalur', yatimPotong: (batas: number) => `Lebih dari ${batas} foto yatim; yang tampil dan tersalin hanya ${batas} pertama. Sapu, lalu muat ulang untuk sisanya.`, ocr: 'Status OCR struk', telemetri: 'Telemetri klien, 30 hari', telemetriKet: 'Muncul setelah aplikasi 1.2.0 tayang.', kolom: { jenis: 'Jenis', layar: 'Layar', jumlah: 'Jumlah', pengguna: 'Pengguna' } },
    sakelar: {
      judul: 'Sakelar', ket: 'Konfigurasi jarak jauh. Setiap perubahan beraudit.',
      otpJudul: 'Verifikasi email pendaftar baru', otpWajib: 'Wajib (normal)', otpLonggar: 'Longgar (darurat)',
      otpKet: 'Longgar = pendaftar baru dikonfirmasi otomatis tanpa kode email. Nyalakan hanya saat pengiriman email bermasalah, lalu kembalikan. Pemulihan sandi tetap wajib kode — itu bukti kepemilikan email.',
      otpAktif: 'Sedang LONGGAR — pendaftar baru tidak diminta kode.', otpNormal: 'Normal — kode email wajib.',
      pengecualian: 'Pengecualian ukuran keberhasilan', pengecualianKet: 'Email keluarga/rekan yang memasang karena kenal, bukan karena butuh. Email admin selalu dikecualikan otomatis.',
      tambahEmail: 'Tambah email', semua: 'Semua kunci', kunci: 'Kunci', nilai: 'Nilai', publik: 'Publik', catatan: 'Catatan', diperbarui: 'Diperbarui',
      alasanUbah: 'Alasan perubahan',
      hapusEmail: (e: string) => `Hapus ${e}`,
      tersamar: 'tersamar',
      pengecualianTersamar: (n: number) => `${n} email, tersamar. Buka untuk melihat utuh dan menyunting.`,
      pengecualianKosong: 'Belum ada email yang dikecualikan.',
      pengecualianBentukLain: 'Nilai tersimpan bukan daftar email biasa. Buka untuk melihatnya.',
      bukaSunting: 'Buka untuk menyunting', membuka: 'Membuka…', menyimpan: 'Menyimpan…',
      alasanDaftar: 'Alasan perubahan daftar',
      alasanDaftarKet: 'Terisi alasan pembukaan; ganti bila alasan perubahannya lain.',
      bentukAsing: 'Nilai tersimpan bukan larik email biasa. Bagian yang bukan teks tidak tampil di sini dan hilang bila disimpan.',
      bentukAsingSetuju: 'Ganti nilai tersimpan dengan daftar ini',
      berubahDiServer: 'Daftar ini diubah di server sejak kamu membukanya, jadi tidak disimpan. Buka lagi, lalu ulangi perubahanmu.',
      kunciHilang: 'Daftar ini sudah dihapus di server. Tampilan sudah dimuat ulang.',
      bukaKet: 'Daftar email pengecualian akan tampil utuh untuk disunting. Alasannya dicatat permanen sebelum nilainya dikirim.',
      bukaPreset: { perbarui: 'Perbarui daftar pengecualian', periksa: 'Periksa daftar pengecualian' },
      terbukaKet: 'Nilai utuh terbuka. Perubahan baru tersimpan setelah Simpan daftar; Tutup membuang nilai utuh dari layar.',
      simpanDaftar: 'Simpan daftar', tutupSunting: 'Tutup tanpa menyimpan', belumBerubah: 'Belum ada perubahan.',
      emailGalat: { 'bukan-email': 'Tulis email lengkap (nama@domain).', tersamar: 'Itu bentuk tersamar, bukan email. Tulis email lengkapnya.', ganda: 'Email itu sudah ada di daftar.' },
    },
    audit: { judul: 'Audit CashFlow', ket: 'Log pembukaan data — dibaca langsung dari Supabase, tidak disalin ke mana pun.', aksi: 'Aksi', admin: 'Admin', target: 'Target', alasan: 'Alasan', waktu: 'Waktu (WIB)', semuaPelaku: 'Semua pelaku', akunHilang: 'Akun sudah tidak ada' },
    pengumuman: {
      judul: 'Pengumuman', ket: 'Tampil di aplikasi semua pengguna.', judulKolom: 'Judul', level: 'Level', mulai: 'Mulai', sampai: 'Sampai', hentikan: 'Hentikan', buat: 'Buat pengumuman', isi: 'Isi',
      mulaiWib: 'Mulai (WIB)', sampaiWib: 'Sampai (WIB, boleh kosong)', wajibIsi: 'Judul dan isi wajib diisi.', tanggalRusak: 'Tanggal mulai atau sampai tidak valid.',
      hentikanJudul: 'Hentikan pengumuman?', hentikanKet: (judul: string) => `"${judul}" berhenti tampil di aplikasi. Alasannya dicatat di audit.`,
      alasanHentikan: 'Alasan menghentikan (min. 8 aksara)', dibuat: 'Pengumuman dibuat.', dihentikan: 'Pengumuman dihentikan.',
      sampaiSebelumMulai: 'Waktu sampai harus sesudah waktu mulai.',
      levelOpsi: { info: 'Info', warning: 'Peringatan', critical: 'Penting' },
    },
    galat: {
      nilaiTersamar: 'Nilai yang dikirim masih tersamar, jadi tidak disimpan. Buka daftarnya dengan alasan (Buka untuk menyunting), lalu simpan lagi.',
      nilaiPribadiPublik: 'Nilai atau catatan yang memuat email tidak boleh diterbitkan ke aplikasi.',
      versiLama: 'Halaman ini memanggil fungsi server versi lama yang sudah ditutup untuk console. Muat ulang halaman.',
      bukanMilikSubjek: 'Sebagian transaksi sudah berubah atau dihapus sejak dimuat. Tidak satu catatan pun dibuka.',
    },
  },
  en: {
    nav: { ringkasan: 'Overview', pengguna: 'Users', aktivitas: 'Activity', ruang: 'Workspaces', kesehatan: 'Health', sakelar: 'Switches', pengumuman: 'Announcements', audit: 'Audit' },
    umum: {
      memuat: 'Loading…', gagal: 'Failed to load.', kosong: 'No data yet.', tutup: 'Close', batal: 'Cancel', simpan: 'Save',
      cari: 'Search…', semua: 'All', ya: 'Yes', tidak: 'No', alasan: 'Reason', keluar: 'Sign out of CashFlow',
      bukanAdmin: 'The console identity is not registered as a CashFlow admin (admin_users.lewat_konsol). Check migrations 0077/0078.',
      perluTotp: 'The server rejected the CashFlow session. Reconnecting…',
      belumKonfigurasi: 'CashFlow module is not configured: NUXT_PUBLIC_CASHFLOW_SUPABASE_URL and ANON_KEY are missing.',
      tidakAda: 'Not found.', tersimpan: 'Saved.', kosongSaring: 'Nothing matches the filters.',
      sebelumnya: 'Previous', berikutnya: 'Next',
      halaman: (hal: number, n: number) => `Page ${hal} of ${n}`,
      rentang: (a: number, b: number, total: number) => `${a}–${b} of ${total}`,
      potong: (n: number, total: number) => `Showing ${n} of ${total} rows; the rest is cut off by the server limit.`,
      vsSebelumnya: 'vs previous period',
    },
    palet: {
      judul: 'Search and jump', tombol: 'Search', placeholder: 'Page, user UUID, or masked email (ded***)',
      ket: 'Only masked forms are searchable; searching writes no audit row.',
      halaman: 'Pages', orang: 'Users (masked)', bukaPengguna: 'Open user', tidakDiDaftar: 'Not in the list',
      memuat: 'Loading masked list…', kosong: 'Nothing matches.', petunjuk: '↑↓ select · Enter open · Esc close',
    },
    masuk: {
      judul: 'Connecting to CashFlow',
      keterangan: 'The CashFlow data session is created automatically from your console login. No second password.',
      menyambung: 'Connecting…', cobaLagi: 'Try again', masukUlangConsole: 'Sign in to the console again',
      sebab: {
        konfigurasi: 'Module not configured: public Supabase env is missing.',
        'belum-konfigurasi': 'The console server does not hold the CashFlow service key yet.',
        'tanpa-cookie': 'No console session found. Sign in to the console again.',
        'cookie-ditolak': 'The gateway rejected the console session. Sign in again.',
        'gateway-gagal': 'The console gateway did not respond. Not a session problem — try again shortly.',
        'lintas-situs': 'The request did not come from a console page.',
        sibuk: 'Still connecting…',
        'tanpa-izin': 'This console role is not allowed to open CashFlow.',
        'mint-gagal': 'Supabase refused to create a session. Check the console identity and key on the server.',
        jaringan: 'Could not reach the console server.',
        sesi: 'Session received, but it could not be installed in this browser.',
        totp: 'The server rejected the old session. Try reconnecting.',
        lain: 'Failed to connect.',
      },
    },
    ringkasan: {
      judul: 'Overview', ket: 'Whether the product is alive, in five seconds.',
      keberhasilan: 'People outside the owner\'s circle with ≥ 10 transactions in 14 days',
      keberhasilanKet: (n: number) => `The agreed success metric. ${n} ${n === 1 ? 'email is' : 'emails are'} not counted: admins and exclusions in Switches.`,
      pengguna: 'Users', ruang: 'Workspaces', transaksi: 'Transactions', perHari: 'Transactions per day, last 30 days',
      corong: 'Activation funnel, 90 days', corongKet: 'How many stop, and at which step.',
      kohort: 'Retention by signup month',
      kohortKolom: { kohort: 'Cohort', daftar: 'Signed up', pernah: 'Ever recorded', masih: 'Active 30 days', retensi: 'Retention' },
      berjalan: 'in progress',
      langkah: { daftar: 'Signed up', masuk_lagi: 'Opened again', menyiapkan: 'Set up wallet/workspace', tx_pertama: 'First transaction', sepuluh_tx: 'Ten transactions' },
      sedikit: (n: number, batas: number) => `Only ${n} data points. The chart appears at ${batas}.`,
    },
    pengguna: {
      judul: 'Users', ket: 'Emails are masked. Full emails need a typed reason, and every opening is recorded in the audit log.',
      email: 'Email', daftar: 'Signed up', masuk: 'Last sign-in', aktifTerakhir: 'Last active', ruang: 'Workspaces', tx: 'Transactions', status: 'Status',
      aktif: 'Active', ditangguhkan: 'Suspended', buka: 'Open', belumCatat: 'Never recorded', catat7: 'Recorded in 7 days',
      emailPenuh: 'Full emails', emailSamar: 'Masked',
      tampilkanEmail: 'Show full emails', samarkanLagi: 'Mask again',
      alasanDaftarKet: 'Full emails of everyone in this list will be shown. The reason is recorded permanently and reused for 30 minutes in this tab.',
      terbukaDengan: (alasan: string, jam: string) => `Full emails opened: "${alasan}". Valid until ${jam} WIB.`,
      potong: (n: number, total: number) => `Showing the ${n} most recent users out of ${total}.`,
      aktifTerakhirKet: 'Last active = the later of last sign-in and last transaction. Last sign-in alone does not move while an app session stays alive.',
      detail: 'User detail', dibukaDengan: 'Opened with reason', pada: 'at',
      jeda: 'Signup → first transaction', ruangnya: 'Workspaces', aktivitas: 'Activity timeline', transaksi: 'Transactions',
      jedaBelum: 'Never recorded',
      jedaSetelah: (n: number, satuan: 'menit' | 'jam' | 'hari') =>
        `First recorded ${n} ${({ menit: ['minute', 'minutes'], jam: ['hour', 'hours'], hari: ['day', 'days'] })[satuan][n === 1 ? 0 : 1]} after signing up`,
      jedaTakLengkap: 'Time to first record not computed: only the latest transactions are loaded.',
      ubinKet: 'Recorded by them, transfers included',
      dompetJadwal: (d: number, j: number) => `Wallets they created: ${d} · Schedules they created: ${j}`,
      perRuangMenyusul: 'Per-workspace numbers are not sent by the server yet; they arrive with User 360.',
      pemilik: 'owner',
      catatanTersembunyi: 'The server does not send free-text notes. Opening them needs an investigation-level reason; every transaction opened is recorded in the audit log.',
      tampilkanCatatan: 'Show notes',
      bercatatan: (n: number) => `${n} ${n === 1 ? 'transaction here has' : 'transactions here have'} a note (tagged “Note”).`,
      tanpaCatatan: 'No transaction here has a note.',
      catatanDibuka: (n: number) => `${n} ${n === 1 ? 'note' : 'notes'} opened with an investigation reason.`,
      investigasiKet: (n: number) => `The free-text notes of ${n} ${n === 1 ? 'transaction' : 'transactions'} on this page will be opened. Each transaction id and your reason are recorded permanently.`,
      adaCatatan: 'Has a note (hidden)', catatanPil: 'Note',
      membukaCatatan: 'Opening notes…',
      txBasi: 'Some transactions changed after loading. Reload them (recorded with the same reason), then open the notes again.',
      muatUlangTx: 'Reload transactions',
      transfer: 'Transfer', transferKet: 'A leg of a transfer between wallets, not real income or expense.',
      transferKeluar: 'Transfer out', transferMasuk: 'Transfer in',
      kembaliKeDaftar: 'Back to the user list',
      txPotong: (n: number, total: number) => `Showing the ${n} most recent transactions out of ${total}.`,
      kolom: { nama: 'Name', peran: 'Role', anggota: 'Members', tx: 'Tx', masuk: 'Income', keluar: 'Expense', dompet: 'Wallets', jadwal: 'Schedules', kategori: 'Category', catatan: 'Note' },
    },
    alasan: {
      judul: 'Why is this data being opened?', ket: 'Recorded permanently — who, when, whose data, and why — before the data appears. This is a privacy-policy promise.',
      preset: { keluhan: 'User complaint', penyalahgunaan: 'Suspected abuse', pembayaran: 'Payment verification', galat: 'Error investigation', berkala: 'Periodic review' },
      lengkapi: 'Add context: ticket number, reporter, or details (min. 8 characters)', buka: 'Open data', pendek: 'Reason is still too short.',
      investigasi: 'Showing free-text notes requires an investigation-level reason.',
    },
    aktivitas: { judul: 'Activity', ket: 'Product pulse across workspaces — no names, no notes, amounts as ranges only.', jenis: 'Type', nominal: 'Amount', tanggal: 'Date', ruang: 'Workspace', waktu: 'Time' },
    ruang: {
      judul: 'Workspaces', ket: 'User-created names and owners are masked by the server.', nama: 'Name', pemilik: 'Owner', anggota: 'Members', tx: 'Transactions', undangan: 'Active invites', dibuat: 'Created',
      jenis: 'Type', jenisOpsi: { pribadi: 'Personal', usaha: 'Business' },
      cari: 'Masked form (Wa······, ded***) or workspace id',
      cariKet: 'Search matches only the masked forms shown in the table; real names cannot be guessed through this box.',
    },
    kesehatan: { judul: 'Health', ket: 'What you look at when something is reported.', db: 'Database size', tabel: 'Table', baris: 'Rows', ukuran: 'Size', yatim: 'Orphaned photos', yatimKet: 'Storage objects without a parent. Swept via the Storage API outside the console; copy the list.', salin: 'Copy path list', yatimPotong: (batas: number) => `More than ${batas} orphaned photos; only the first ${batas} are shown and copied. Sweep them, then reload for the rest.`, ocr: 'Receipt OCR status', telemetri: 'Client telemetry, 30 days', telemetriKet: 'Appears after app 1.2.0 ships.', kolom: { jenis: 'Type', layar: 'Screen', jumlah: 'Count', pengguna: 'Users' } },
    sakelar: {
      judul: 'Switches', ket: 'Remote configuration. Every change is audited.',
      otpJudul: 'Email verification for new signups', otpWajib: 'Required (normal)', otpLonggar: 'Relaxed (emergency)',
      otpKet: 'Relaxed = new signups are auto-confirmed without an email code. Enable only while email delivery is broken, then revert. Password recovery still requires the code — it proves email ownership.',
      otpAktif: 'Currently RELAXED — new signups are not asked for a code.', otpNormal: 'Normal — email code required.',
      pengecualian: 'Success-metric exclusions', pengecualianKet: 'Family/colleague emails who installed out of goodwill, not need. Admin emails are always excluded automatically.',
      tambahEmail: 'Add email', semua: 'All keys', kunci: 'Key', nilai: 'Value', publik: 'Public', catatan: 'Note', diperbarui: 'Updated',
      alasanUbah: 'Reason for change',
      hapusEmail: (e: string) => `Remove ${e}`,
      tersamar: 'masked',
      pengecualianTersamar: (n: number) => `${n} ${n === 1 ? 'email' : 'emails'}, masked. Open to see them in full and edit.`,
      pengecualianKosong: 'No emails are excluded yet.',
      pengecualianBentukLain: 'The stored value is not a plain email list. Open it to see it.',
      bukaSunting: 'Open to edit', membuka: 'Opening…', menyimpan: 'Saving…',
      alasanDaftar: 'Reason for changing the list',
      alasanDaftarKet: 'Prefilled with the reason you opened it; change it if this edit has a different reason.',
      bentukAsing: 'The stored value is not a plain email array. Parts that are not text are not shown here and are lost on save.',
      bentukAsingSetuju: 'Replace the stored value with this list',
      berubahDiServer: 'This list changed on the server after you opened it, so it was not saved. Open it again and redo your change.',
      kunciHilang: 'This list was deleted on the server. The view has been reloaded.',
      bukaKet: 'The exclusion list will be shown in full for editing. The reason is recorded permanently before the value is sent.',
      bukaPreset: { perbarui: 'Update the exclusion list', periksa: 'Review the exclusion list' },
      terbukaKet: 'Full values are open. Changes are stored only after Save list; Close removes the full values from the screen.',
      simpanDaftar: 'Save list', tutupSunting: 'Close without saving', belumBerubah: 'Nothing has changed yet.',
      emailGalat: { 'bukan-email': 'Enter a full email (name@domain).', tersamar: 'That is a masked form, not an email. Enter the full email.', ganda: 'That email is already on the list.' },
    },
    audit: { judul: 'CashFlow audit', ket: 'Data-access log — read directly from Supabase, never copied anywhere.', aksi: 'Action', admin: 'Admin', target: 'Target', alasan: 'Reason', waktu: 'Time (WIB)', semuaPelaku: 'All actors', akunHilang: 'Account no longer exists' },
    pengumuman: {
      judul: 'Announcements', ket: 'Shown in the app to all users.', judulKolom: 'Title', level: 'Level', mulai: 'Starts', sampai: 'Ends', hentikan: 'Stop', buat: 'Create announcement', isi: 'Body',
      mulaiWib: 'Starts (WIB)', sampaiWib: 'Ends (WIB, optional)', wajibIsi: 'Title and body are required.', tanggalRusak: 'Invalid start or end date.',
      hentikanJudul: 'Stop announcement?', hentikanKet: (judul: string) => `"${judul}" stops showing in the app. The reason is recorded in the audit log.`,
      alasanHentikan: 'Reason for stopping (min. 8 characters)', dibuat: 'Announcement created.', dihentikan: 'Announcement stopped.',
      sampaiSebelumMulai: 'The end time must be after the start time.',
      levelOpsi: { info: 'Info', warning: 'Warning', critical: 'Critical' },
    },
    galat: {
      nilaiTersamar: 'The value sent is still masked, so it was not saved. Open the list with a reason (Open to edit), then save again.',
      nilaiPribadiPublik: 'A value or note containing an email may not be published to the app.',
      versiLama: 'This page called an old server function that is closed to the console. Reload the page.',
      bukanMilikSubjek: 'Some transactions changed or were deleted after loading. No note was opened.',
    },
  },
} as const

type Kamus = typeof KAMUS.id
/** Untuk uji (kalimat berfungsi seperti jamak EN); halaman memakai useCashflowI18n. */
export const KAMUS_CASHFLOW = KAMUS

/* Paritas ID ↔ EN diperiksa kompilator: kunci yang hanya ada di satu bahasa
   gagal vue-tsc, bukan tampil sebagai jalur mentah 'pengguna.xxx' di layar. */
type Bentuk<T> = { [K in keyof T]: T[K] extends (...a: never[]) => unknown ? 'fungsi' : T[K] extends object ? Bentuk<T[K]> : 'teks' }
const _enLengkap: Bentuk<typeof KAMUS.id> = null as unknown as Bentuk<typeof KAMUS.en>
const _idLengkap: Bentuk<typeof KAMUS.en> = null as unknown as Bentuk<typeof KAMUS.id>
void _enLengkap; void _idLengkap

export const useCashflowI18n = () => {
  const { locale } = useConsoleI18n()
  const kamus = computed<Kamus>(() => (locale.value === 'en' ? (KAMUS.en as unknown as Kamus) : KAMUS.id))
  /** tcf('pengguna.kolom.nama') — kunci bertitik; fungsi dipulangkan apa adanya. */
  const tcf = (jalur: string): any =>
    jalur.split('.').reduce<any>((acc, k) => acc?.[k], kamus.value) ?? jalur
  /* Waktu tetap WIB; bahasa hanya mengganti nama bulan dan pemisah jam.
     Diikat di sini supaya halaman tidak meneruskan locale satu per satu. */
  const bahasa = computed<BahasaWaktu>(() => (locale.value === 'en' ? 'en' : 'id'))
  const formatTanggal = (v: string | null | undefined) => tanggalPendek(v, bahasa.value)
  const formatJam = (v: string | Date | null | undefined) => jamWib(v, bahasa.value)
  const formatWaktu = (v: string | Date | null | undefined) => waktuPendekWib(v, bahasa.value)
  return { tcf, kamus, bahasa, formatTanggal, formatJam, formatWaktu }
}
