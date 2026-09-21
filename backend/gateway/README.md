# CoreAsia Gateway

API di `api.coreasia.id`: auth admin console, artikel, lead, lisensi CAD/Mounter,
dan webhook pembayaran. Go + Fiber v3 + Postgres (pgx, golang-migrate dengan
tabel `gateway_schema_migrations`) + Redis. Migrasi berjalan otomatis saat start.

```bash
go vet ./... && go test ./...
# uji opsional terhadap layanan sungguhan (tidak berjalan tanpa env ini):
GATEWAY_TEST_REDIS_ADDR=localhost:6380 go test ./internal/auth/ ./internal/handler/  # pembatas percobaan TOTP dan /login, termasuk paralel (Redis DB 15)
GATEWAY_TEST_DATABASE_URL=postgres://… go test ./internal/repository/                 # SQL admin_users

# menjalankan lokal dengan secret contoh configs/config.yaml: APP_ENV WAJIB eksplisit
APP_ENV=development APP_PORT=8095 DB_PORT=5433 REDIS_PORT=6380 go run ./cmd/server
```

Uji repositori tidak pernah membuat akun dan tidak pernah menyimpan perubahan:
semantik TOTP diuji pada baris admin yang sudah ada, di dalam satu transaksi
yang selalu di-ROLLBACK.

### `JWT_SECRET` wajib kuat di luar development

`configs/config.yaml` berisi secret contoh yang ter-commit dan ikut dikapalkan di
image. Tanpa `JWT_SECRET` di `.env`, nilai itu dipakai diam-diam, sehingga siapa
pun yang punya akses repo bisa merakit token super admin dan membuka rahasia TOTP
(kuncinya diturunkan dari secret yang sama).

Saat start, secret ditolak bila kosong, kurang dari 32 byte, atau sama dengan
salah satu nilai contoh di repo (daftar sidik `publicJWTSecretFingerprints` di
`internal/auth/secret.go`; uji `TestCheckJWTSecret_NilaiDiRepoDitolak` membaca
setiap berkas contoh dan gagal bila ada nilai yang lolos). Akibat penolakan:
- Proses tetap hidup. Aktivasi lisensi, webhook pembayaran, dan lead tetap jalan.
- Semua `/api/admin/**` menjawab 503, dan token yang ditandatangani secret lemah tidak sah.
- Log `JWT_SECRET ditolak` memuat alasan dan sidik 10 aksara (bukan nilainya).

Satu-satunya pengecualian: `APP_ENV=development` **yang di-set eksplisit lewat
environment**, dengan secret yang tidak kosong. Nilai `env: "development"` di
`configs/config.yaml` (ikut di image) tidak dihitung, karena itulah yang terjadi
bila `.env` produksi kehilangan `APP_ENV`.

`APP_ENV` tidak di-set berarti `development` untuk sisa aplikasi (dari
config.yaml): `TrustProxy` mati dan pembatas IP rute non-admin (lead) nonaktif.
Auth admin tidak ikut longgar: penjaga `JWT_SECRET` dan pembatas `/login` serta
`/totp/verify` tetap aktif kecuali `APP_ENV=development` eksplisit.

**Gerbang wajib sebelum push yang menyentuh auth admin.** Watchtower menarik image
baru dalam ±2 menit; bila secret produksi ditolak, login console mati untuk semua
admin. Periksa tanpa mencetak nilainya:

```bash
ssh coreasia-cad
docker exec coreasia-cad-gateway sh -c 'echo "APP_ENV=$APP_ENV len=${#JWT_SECRET} sidik=$(printf %s "$JWT_SECRET" | sha256sum | cut -c1-10)"'
# harus: APP_ENV=production, len >= 32, dan sidik BUKAN salah satu dari
# 65381482cc 501a2089a9 7a5b87994e bbf53c2298 78a6c76148 b3009e9947
```

## Auth admin console

### Token

| Jenis | Klaim `typ` | Umur | Diterima di |
|---|---|---|---|
| access | `access` | `JWT_ACCESS_TTL` (60m); sesi ber-MFA: paling lama sampai `mfa_at` + 12 jam | Bearer / cookie `auth_admin_token` untuk semua `/api/admin/**` |
| refresh | `refresh` | `JWT_REFRESH_TTL` (720h); sesi ber-MFA: paling lama sampai `mfa_at` + 12 jam | hanya `POST /api/admin/auth/refresh` |
| tantangan MFA | `mfa` | 5 menit | hanya `POST /api/admin/auth/totp/verify` |

Setiap validator hanya menerima jenisnya sendiri. Token tanpa `typ` (terbit
sebelum migrasi 000014) ditolak di semua tempat, jadi semua admin login ulang
sekali setelah rilis.

Klaim tambahan:
- `mfa`: `true` hanya untuk token yang terbit setelah kode TOTP diverifikasi. Refresh mewarisi nilainya.
- `mfa_at`: saat (unix detik) kode TOTP diverifikasi. Refresh menyalinnya apa adanya.
- `tv`: `admin_users.token_version` saat token terbit.

**Umur sesi ber-MFA: 12 jam** (`auth.MFAMaxAge`), dihitung dari `mfa_at`, bukan
dari refresh terakhir.
- Access dan refresh token ber-MFA dipotong di `mfa_at` + 12 jam. Refresh sesudahnya
  menjawab 401 `MFA_SESSION_EXPIRED`, BFF menghapus cookie, dan admin login ulang
  memakai sandi + TOTP.
- Tanpa batas ini, setiap `/refresh` menerbitkan refresh token baru 30 hari yang
  mewarisi `mfa=true`. Refresh token Master yang bocor sekali menjadi sesi `mfa=true`
  selamanya, dan masa tenggang Nitro tidak berlaku karena pendaftaran Master sudah lama.
- Refresh token lama yang sudah dirotasi tetap sah sampai `exp`-nya. Untuk sesi
  ber-MFA, `exp` itu paling lama 12 jam sejak TOTP. Deteksi pakai-ulang (jti) tidak
  dipasang: BFF bisa merefresh paralel, dan deteksi itu akan mencabut sesi sah.
- Token ber-`mfa` tanpa `mfa_at` (terbit sebelum klaim ini ada) tidak dihitung
  ber-MFA di mana pun, dan refresh-nya ditolak.
- Sesi tanpa MFA (admin tanpa TOTP) tidak berubah: refresh token 30 hari bergulir.

### Pencabutan sesi (`token_version`)

`token_version` dinaikkan oleh:
- `POST /api/admin/auth/logout-all` (diri sendiri);
- `POST /api/admin/users/:id/revoke-sessions` (izin `users:update` = super admin, diaudit `revoke_sessions`; boleh dari sesi `mfa=false` walau targetnya ber-TOTP, karena sifatnya defensif);
- `PUT /api/admin/users/:id` yang menonaktifkan akun, mengganti sandi, atau mengganti peran.
  Perubahan dan kenaikan `token_version` terjadi dalam **satu** `UPDATE`, dan
  `UPDATE` itu hanya berlaku bila `token_version` baris masih sama dengan saat baris
  dimuat. Permintaan yang memuat baris sebelum penonaktifan/ganti sandi/ganti peran
  lalu menulis sesudahnya mendapat **409** dan tidak menulis apa pun. Tanpa syarat
  ini, PUT diri `{full_name}` berulang dari pelaku mengembalikan `is_active`, peran,
  dan hash sandi lama. PUT akun sendiri juga menolak (401) bila sesinya dicabut di
  antara cek sesi dan pemuatan baris. 409 di console: muat ulang, lalu ulangi;
- mengaktifkan atau mematikan TOTP, dan `POST /api/admin/users/:id/totp/reset`.

Yang memeriksa `is_active` dan `token_version` ke DB:
- `/auth/me`, `/auth/refresh`, endpoint TOTP, dan `logout-all`;
- **semua** `/api/admin/users/**` dan `/api/admin/api-keys/**` (`RequireLiveSession`).
  Di rute ini, peran untuk pemeriksaan izin juga dibaca dari DB, bukan dari klaim.
  Jadi token yang sudah dicabut tidak bisa membuat admin atau API key baru, mengganti
  sandi atau peran admin lain, atau menyalin kunci provider.

Middleware admin umum sengaja **tidak** menambah kueri DB per permintaan. Di
endpoint admin lain (artikel, bot, AI, lisensi CAD termasuk `generate` dan
`copy`), access token yang sudah dicabut masih lolos sampai kedaluwarsa (paling
lama `JWT_ACCESS_TTL`). Butuh putus seketika? Rotasi `JWT_SECRET` (lihat runbook).

### TOTP (opsional per admin)

RFC 6238: SHA1, 6 digit, periode 30 detik, toleransi ±1 langkah.

1. `POST /api/admin/auth/totp/setup {password}` (access token + sandi saat ini).
   - Sandi wajib, supaya access token atau cookie curian saja tidak bisa memasang authenticator milik pencuri.
   - Sandi salah: 400 `PASSWORD_INVALID`. Setiap percobaan memakai jatah yang sama dengan kode TOTP.
   - Jawaban: `{otpauth_url, secret, issuer, account}`. Issuer `CoreAsia Console`, label = email.
   - Rahasia disimpan sebagai `totp_pending_enc`, **belum aktif**.
   - Setup ulang menimpa rahasia tertunda. Kalau TOTP sudah aktif → 409.
2. `POST /api/admin/auth/totp/enable {code}`.
   - Kode dicek terhadap rahasia tertunda. Kalau cocok, TOTP aktif dan `token_version` naik.
   - Semua sesi gugur; admin login ulang memakai TOTP.
3. Login admin ber-TOTP: `POST /api/admin/auth/login` → `200 {data:{mfa_required:true, challenge}}`.
   - Tidak ada token dan tidak ada cookie.
   - Untuk admin tanpa TOTP, bentuk jawabannya **sama persis** seperti sebelumnya.
4. `POST /api/admin/auth/totp/verify {challenge, code}`.
   - Berhasil: jawaban berbentuk sama dengan login biasa, token ber-`mfa=true`, cookie terpasang.
   - Kode salah atau sudah dipakai: 401 `TOTP_INVALID`.
   - Tantangan kedaluwarsa atau tidak sah: 401 `MFA_CHALLENGE_INVALID` → kembali ke form login.
5. `POST /api/admin/auth/totp/disable {code}`.
   - Butuh sesi `mfa=true` yang masih segar (≤ 12 jam) dan kode sah saat ini.
   - Semua kolom TOTP dihapus dan `token_version` naik.

`GET /api/admin/auth/me` juga memulangkan:
- `mfa`: sesi ini lolos TOTP kurang dari 12 jam lalu;
- `mfa_at`: saat TOTP diverifikasi (`null` bila `mfa=false`). Nitro bisa menuntut
  kesegaran yang lebih ketat untuk izin T1+;
- `totp_enabled` dan `totp_enabled_at` (dari DB; `null` bila TOTP mati).

#### Sesi kuat: mengelola admin ber-TOTP dan kredensial super admin

TOTP Master hanya berarti bila sesi yang lebih lemah tidak bisa melucutinya,
**dan** tidak bisa mencetak sesi kuat sendiri. Putaran 2 hanya memeriksa klaim
`mfa`, sehingga rantai berikut lolos dalam semenit.
1. Pelaku memegang sesi `mfa=false` milik super admin tanpa TOTP (token curian tanpa sandi).
2. Pelaku membuat super admin baru, atau mengganti sandinya sendiri tanpa sandi lama, atau mengganti sandi super admin lain.
3. Pelaku login dengan sandi pilihannya, lalu menjalankan `/totp/setup`, `enable`, dan `verify`, sehingga mendapat sesi `mfa=true`.
4. Pelaku mengganti sandi Master dan mereset TOTP Master, lalu login sebagai Master.

**Sesi kuat** memenuhi tiga syarat:
- sesi `mfa=true` yang masih segar (≤ 12 jam);
- milik admin yang TOTP-nya aktif;
- **akun dan pendaftaran TOTP pelaku lebih tua dari 24 jam.** Masa tenggang ini
  sama dengan masa tenggang Nitro untuk izin T1+.

Tindakan yang butuh sesi kuat:

| Tindakan | Kapan berlaku |
|---|---|
| Mengubah kolom apa pun (sandi, email, peran, status, nama), menghapus, atau mereset TOTP **admin lain** yang TOTP-nya aktif | selalu |
| Membuat super admin, atau menaikkan admin menjadi super admin | begitu ada **satu saja** admin ber-TOTP |
| Menyetel sandi **super admin lain** (yang belum ber-TOTP) | begitu ada satu saja admin ber-TOTP |

Penolakan menjawab 403, lalu diaudit `mfa_required_denied` beserta alasannya.
- `MFA_REQUIRED`: sesi belum lolos TOTP, atau TOTP pelaku tidak aktif.
- `MFA_ENROLLMENT_TOO_RECENT`: TOTP atau akun pelaku berumur kurang dari 24 jam.

Aturan untuk akun sendiri dan pengecualian:
- **Akun sendiri.** Mengganti sandi sendiri lewat `PUT /api/admin/users/<id-sendiri>`
  wajib `current_password` **begitu ada satu saja admin ber-TOTP**:
  - tanpa field itu: 400 `CURRENT_PASSWORD_REQUIRED` ("Mengganti sandi akun sendiri butuh sandi saat ini.");
  - sandi salah: 400 `PASSWORD_INVALID`. Setiap percobaan memakai jatah faktor
    kedua yang sama dengan `/totp/setup` dan diaudit `totp_failed`.
  - Masa transisi (belum ada admin ber-TOTP): tanpa `current_password` tetap
    diterima, karena form ganti sandi di console yang sedang tayang hanya
    mengirim `{password}`. Syarat ini tidak mengurangi apa pun di masa itu: sesi
    super admin mana pun sudah bisa membuat super admin baru atau menyetel sandi
    super admin lain tanpa sandi lama. `current_password` yang dikirim selalu diperiksa.
  - Akun sendiri yang ber-TOTP cukup sesi `mfa=true` segar, tanpa masa tenggang.
  - **Console landing perlu kolom "sandi saat ini"** di form ganti sandi untuk akun
    sendiri sebelum TOTP pertama diaktifkan. Tanpa kolom itu, setelah TOTP
    pertama aktif, form menampilkan pesan 400 tadi.
- Admin tanpa TOTP (bukan super admin) tetap bisa dikelola dari sesi mana pun.
  Kolom selain sandi milik super admin tanpa TOTP juga tetap bisa diubah dari sesi mana pun.
- `revoke-sessions` dikecualikan: tidak memberi akses apa pun, dan korban cukup login ulang.
- **Masa transisi** (belum ada satu pun admin ber-TOTP): memberi peran super admin
  dan menyetel sandi super admin lain belum dibatasi, karena belum ada TOTP yang
  bisa dilucuti.
- **Akibatnya:**
  - Setelah TOTP pertama aktif, selama 24 jam **tidak ada** yang bisa membuat super
    admin, menyetel sandi super admin lain, atau mengelola admin ber-TOTP lewat
    console. Jalurnya hanya SQL di VPS.
  - Admin ber-TOTP yang kehilangan perangkat hanya bisa direset oleh super admin
    lain yang punya sesi kuat, atau lewat SQL di VPS.

Sisa risiko (disadari):
- **Pemegang sandi super admin yang belum ber-TOTP** bisa mendaftarkan TOTP atas
  nama akun itu. Setelah 24 jam, sesinya menjadi kuat. Jendela deteksinya adalah
  24 jam itu, dan jejaknya ada di audit: `login_mfa_challenge`, `totp_setup`,
  `totp_enable`, dan `login` dari IP asing.
- Penangkalnya tetap sama: **semua super admin mendaftar TOTP sebelum Fase 1**.
- Setelah TOTP pertama aktif, tinjau daftar super admin dan audit masa transisi,
  lalu hapus akun yang tidak dikenal:
  `action IN ('create','update','totp_setup','totp_enable') AND resource='admin_users'`.

> **Jangan aktifkan TOTP untuk admin mana pun sebelum landing Fase 0c (BFF +
> form kode + kolom "sandi saat ini" di form ganti sandi sendiri) tayang.**
> Landing lama membaca `{mfa_required, challenge}` sebagai login sukses tanpa
> token, lalu berputar kembali ke `/console/login` tanpa pesan. Admin itu terkunci
> dari console sampai landing baru tayang atau TOTP-nya direset. TOTP pertama juga
> mengakhiri masa transisi: form lama tidak bisa lagi mengganti sandi sendiri, dan
> "Ganti sandi" super admin lain / "Tambah admin" super admin dari form lama
> dijawab 403 `MFA_REQUIRED`. Selama belum ada admin ber-TOTP, gateway ini bisa
> dirilis lebih dulu tanpa mengubah perilaku console lama untuk admin tanpa TOTP.
> Gateway memang **wajib** tayang sebelum landing 0c (lihat "Urutan rilis bersama
> landing" di bawah).

#### Pendaftaran TOTP: siapa yang mendaftar pertama?

TOTP mempercayai pendaftar pertama. Sandi di `/totp/setup` menutup jalur token
atau cookie curian. Jalan memutarnya juga ditutup:
- mengganti sandi sendiri butuh `current_password`;
- membuat super admin atau menyetel sandi super admin lain butuh sesi kuat.

Keduanya berlaku begitu ada satu saja admin ber-TOTP (lihat masa transisi di atas).

Meski begitu, **pemegang sandi yang bocor** masih bisa mendaftarkan authenticator
miliknya untuk admin yang belum ber-TOTP, lalu login dengan `mfa=true`. Penangkalnya:
- **Semua admin yang akan memegang izin CashFlow T1+ mendaftar TOTP sebelum Fase 1 tayang.**
  - Setelah terdaftar, sandi admin itu saja tidak cukup.
  - TOTP-nya hanya bisa dilucuti dari **sesi kuat** milik super admin lain (lihat di
    atas: `mfa=true` segar, dan TOTP pelaku berumur lebih dari 24 jam), atau lewat
    akses SQL ke VPS.
  - Sesi `mfa=false` tidak bisa melucutinya. Sesi `mfa=true` dari pendaftaran yang
    baru pun tidak bisa.
- Nitro (`sesi.post.ts`, Fase 1) memberi `pii`/`investigasi`/`tindak`/`ekspor` hanya bila:
  - `mfa=true`, **dan**
  - `totp_enabled_at` lebih tua dari masa tenggang (24 jam, sama dengan gateway).
  - Nitro juga bisa menuntut `mfa_at` yang lebih segar.
- Setiap pendaftaran tercatat di audit (`totp_setup`, `totp_enable`). Admin yang
  tidak merasa mendaftar: super admin menjalankan reset di bawah, lalu mengganti sandinya.

Pengaman:
- **Anti-replay.** `totp_last_step` mencatat langkah terakhir yang diterima, dengan UPDATE bersyarat yang atomik. Kode yang sama tidak bisa dipakai dua kali; setelah enable, tunggu kode berikutnya untuk login.
- **Batas percobaan faktor kedua.** Satu jatah bersama per admin untuk:
  - kode di verify, enable, dan disable;
  - sandi di `/totp/setup`;
  - `current_password` saat mengganti sandi sendiri.

  Jatahnya punya dua lapis (Redis, satu skrip Lua atomik):

  | Lapis | Batas | Kunci Redis | Sesudah batas |
  |---|---|---|---|
  | pendek | 5 per 15 menit | `gateway:admin_totp_gagal:<id>` | 429 + `Retry-After` |
  | panjang | **20 kegagalan per 30 hari** (jendela tetap dari kegagalan pertama) | `gateway:admin_totp_gagal_panjang:<id>` | **423 `TOTP_LOCKED`**; kode benar pun tidak dievaluasi |

  - **Kenapa ada lapis panjang.** Jendela tetap 15 menit saja memberi pemegang sandi
    5 × 96 = 480 tebakan per hari, selamanya. Peluang tembus per tebakan ±3/10⁶
    (jendela ±1 langkah), jadi ±4% per bulan dan ±41% per tahun. Dengan lapis
    panjang, tebakan paling banyak 20 per 30 hari (±0,006%), lalu terkunci.
  - **Pesan dulu, baru evaluasi.** Jatah dipesan **sebelum** kode dievaluasi.
    Permintaan paralel tidak bisa menyelinap di antara cek dan catat, berapa pun
    paralelismenya.
  - **Berhasil** mengosongkan lapis pendek, tetapi hanya mengembalikan jatah panjang
    milik percobaan itu. Kegagalan sebelumnya tetap terhitung, jadi login harian
    pemilik tidak menghapus jejak tebakan pelaku.
  - Percobaan yang ditahan lapis pendek tidak memakai jatah panjang. Banjir
    permintaan tidak mempercepat penguncian.
  - **Membuka kunci:**
    - super admin dengan sesi kuat mereset TOTP akun itu, atau mengganti sandinya.
      Keduanya menghapus kedua kunci. Penguncian berarti sandinya dipegang orang
      lain, jadi sandi memang harus diganti;
    - atau lewat Redis:
      ```bash
      ssh coreasia-cad
      docker exec coreasia-cad-redis redis-cli DEL "gateway:admin_totp_gagal:<id>" "gateway:admin_totp_gagal_panjang:<id>"
      ```
  - **Risiko DoS per admin (disadari).** Kunci hanya bisa dipicu oleh pemegang sandi
    (verify butuh tantangan, dan tantangan butuh sandi benar) atau pemegang sesi yang
    sah. Dengan sandi Master, pelaku bisa mengunci verifikasi Master dalam ±1 jam.
    Master baru bisa masuk setelah dibuka lewat jalur di atas. Kalau Master
    satu-satunya super admin ber-TOTP, jalurnya Redis `DEL` lewat SSH, lalu ganti sandi.
  - `/totp/verify` juga dibatasi 10 permintaan per IP per 15 menit (lihat "IP klien" di bawah).
  - **Audit** (`gateway_audit_logs`, IP dari `mw.ClientIP`):
    - `login_mfa_challenge`: sandi benar, tantangan terbit;
    - `totp_failed`: satu baris per kode atau sandi yang dievaluasi lalu ditolak.
      Jumlahnya terbatas, paling banyak 20 per admin per 30 hari. Di tahap `login`,
      deskripsinya menyebut bahwa sandinya sudah benar;
    - `totp_locked`: saat kunci terpasang.
    - Percobaan yang ditahan (429/423) hanya masuk log. Kode atau sandi tidak pernah dicatat.
  - Email ke admin pemilik akun belum ada. `EmailService` tidak punya metode kirim
    umum, dan menambahnya di luar lingkup perubahan auth ini. Baris `totp_failed`
    dan `totp_locked` adalah pengaitnya.
- **Batas sandi `/login`.** Dua lapis:
  - per IP: 5 permintaan per 15 menit (in-memory);
  - per akun: 10 percobaan per email per 15 menit (Redis `gateway:admin_login_gagal:<sidik email>`), dengan pola pesan-dulu yang sama. Jatah dikembalikan saat sandi benar. Email tak terdaftar dibatasi dengan cara yang sama, jadi 429 tidak membocorkan email mana yang terdaftar.
  - **Asal yang dikenal tidak ikut dikunci.** Siapa pun yang tahu email admin bisa menghabiskan batas per akun (10 permintaan per 15 menit dari 2 IP) dan mengulanginya terus; `DEL` kunci di Redis bukan pemulihan, karena kunci terpasang lagi dalam hitungan detik. Karena itu, pasangan (email, IP klien; IPv6 per /64) yang memasukkan sandi benar dalam 30 hari terakhir (Redis `gateway:admin_login_asal:<sidik email+IP>`, TTL 30 hari, diperpanjang di setiap login benar) melewati batas per akun. Batas per IP (5 per 15 menit) tetap berlaku untuknya.
    - Tebakan dari banyak IP tetap terbatas: 10 per 15 menit untuk semua asal baru, ditambah batas per IP untuk tiap asal yang pernah login benar. Asal yang dikenal untuk email lain tidak berlaku.
    - Login dari asal yang dikenal saat terkunci tidak mengosongkan hitungan, jadi kuncinya tetap berlaku bagi penyerang.
    - **Sisa risiko (disadari):** selama serangan berlangsung, admin tetap tertahan (429) dari jaringan yang belum pernah dipakai untuk login benar dalam 30 hari. Jalan masuknya: login dari jaringan yang biasa dipakai, sesi yang masih hidup (refresh token), atau memblokir sumber serangan di Cloudflare (WAF/rate limiting untuk `/api/admin/auth/login`). Console landing mengirim login langsung dari peramban (lihat "IP klien"), jadi pengecualian asal yang dikenal berlaku seperti biasa.
    - Sidik untuk pemeriksaan manual = 32 aksara hex pertama sha256 email huruf kecil:
      ```bash
      ssh coreasia-cad
      docker exec coreasia-cad-redis redis-cli TTL "gateway:admin_login_gagal:$(printf %s 'admin@contoh.id' | tr 'A-Z' 'a-z' | sha256sum | cut -c1-32)"
      ```
  - Redis tidak terjangkau → batas per akun gagal **terbuka** (dicatat di log); batas per IP tetap berlaku. Beda dengan TOTP yang gagal tertutup: pelaku tidak bisa membuat Redis gagal, dan gagal tertutup di sini mematikan seluruh login console.
- **IP klien** (pembatas `/login` dan `/totp/verify`, log, audit auth dan `admin_users`) diambil `mw.ClientIP`, bukan `c.IP()`.
  - `c.IP()` di produksi memulangkan entri `X-Forwarded-For` paling **kiri**, dan entri itu dikarang klien (Cloudflare dan nginx-proxy hanya menambah di kanan). Dengan `c.IP()`, XFF acak per permintaan cukup untuk lolos dari pembatas per IP.
  - `ClientIP` membaca XFF hanya bila peer TCP adalah proxy internal (loopback/privat), lalu menelusurinya dari **kanan** sambil melewati hop privat dan rentang IP Cloudflare. Entri pertama yang bukan hop tepercaya adalah klien.
  - Kunci pembatas IPv6 dikelompokkan per /64.
  - Sisa celah: permintaan yang keluar dari rentang IP Cloudflare tanpa melalui proxy-nya (mis. Cloudflare Workers ke origin) masih bisa mengarang entri. Penutupnya di infrastruktur: origin hanya menerima Cloudflare.
  - **Login console landing langsung dari peramban.** Halaman `/console/login` memanggil `POST /api/admin/auth/login` dan `/totp/verify` di sini tanpa lewat server Nitro, jadi pembatas per IP, asal yang dikenal, dan `ip_address` audit `login`/`login_mfa_challenge`/`totp_failed` memakai IP admin yang asli. Token hasilnya lalu diserahkan peramban ke BFF (`POST /api/admin/sesi` di landing), yang memvalidasinya lewat `/auth/me` dan menyimpannya di cookie HttpOnly. CORS: origin console harus ada di `CORS_ORIGINS`; `Retry-After` diekspos (`Access-Control-Expose-Headers`) supaya menit tunggu 429 terbaca.
  - **Aksi console lewat proxy BFF** (`/api/gw/**` di Vercel) tetap tiba dari IP keluar Vercel: `ip_address` = IP Vercel. BFF mengirim IP peramban di header `X-Konsol-Klien-IP`, dan gateway mencatatnya di kolom terpisah `gateway_audit_logs.reported_client_ip` (migrasi 000015; `mw.ReportedClientIP` + `internal/auditip`). Nilai itu **dilaporkan, tidak diverifikasi**: siapa pun yang memanggil gateway langsung bisa mengarangnya. Tidak dipakai untuk pembatas, kunci percobaan, atau keputusan keamanan apa pun; `ClientIP`/`ClientIPKey` tidak membacanya. Menutupnya butuh header yang diautentikasi (rahasia bersama BFF–gateway), belum ada.
  - Redis tidak terjangkau atau menolak tulis (putus, `READONLY`, OOM) → 503 tanpa evaluasi (gagal tertutup). Login admin tanpa TOTP tidak terpengaruh.
  - Redis produksi memakai `allkeys-lru`: pada tekanan memori, hitungan bisa terhapus lebih awal.
- **Enkripsi.** Rahasia disimpan AES-256-GCM dengan format `v1:` + base64url(nonce‖ciphertext).
  - Kuncinya HKDF-SHA256 dari `JWT_SECRET` (info `coreasia-admin-totp-v1`), dan AAD mengikat ciphertext ke id admin.
  - Konsekuensi: **rotasi `JWT_SECRET` membuat semua rahasia TOTP tidak terbaca.** Verifikasi menjawab 500 (tidak pernah melewati TOTP); lakukan reset di bawah.

Reset TOTP admin lain (perangkat hilang, atau authenticator dipasang orang lain):

```bash
curl -X POST https://api.coreasia.id/api/admin/users/<id>/totp/reset -H "Authorization: Bearer <token super admin>"
```

- Butuh izin `users:update` (super admin) dan sesi hidup. Diaudit `totp_reset`.
- TOTP yang aktif hanya bisa direset dari sesi kuat. Sesi `mfa=false` mendapat 403 `MFA_REQUIRED`, dan pendaftaran TOTP pelaku yang kurang dari 24 jam mendapat 403 `MFA_ENROLLMENT_TOO_RECENT`. Pendaftaran yang belum aktif boleh direset sesi mana pun.
- Reset juga membuka kunci percobaan faktor kedua akun itu.
- Semua kolom TOTP dihapus dan `token_version` naik, jadi semua sesi admin itu gugur.
- Tidak berlaku untuk akun sendiri (400). Pemilik akun memakai `/auth/totp/disable`, yang menuntut sesi ber-MFA dan kode sah.

Jalur SQL di VPS hanya untuk keadaan tanpa super admin **bersesi kuat** yang bisa
login, atau setelah rotasi `JWT_SECRET` (semua admin):

```bash
ssh coreasia-cad
docker exec -i coreasia-cad-db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'SQL'
UPDATE public.admin_users
   SET totp_secret_enc = NULL, totp_pending_enc = NULL, totp_enabled_at = NULL,
       totp_last_step = NULL, token_version = token_version + 1, updated_at = NOW()
 WHERE email = 'admin@contoh.id';   -- atau hapus WHERE untuk semua admin setelah rotasi
SQL
```

Jalur SQL tidak menyentuh Redis. Bila akun itu terkunci (423 `TOTP_LOCKED`), hapus
juga kedua kunci percobaannya (lihat "Batas percobaan faktor kedua"). Tanpa itu,
pendaftaran ulang di `/totp/setup` ikut tertahan.

### Runbook "token console bocor", langkah 0: hentikan pencetakan sesi

Tujuannya: token curian tidak bisa lagi lolos `/auth/me`, sehingga
`POST /api/cashflow/sesi` tidak bisa mencetak sesi Supabase baru, dan tidak
bisa `/auth/refresh`.

> **Token yang bocor milik super admin? Langsung ke opsi 4.** Sampai
> kedaluwarsa (≤ 60 menit), access token super admin yang sudah dicabut masih
> lolos endpoint admin di luar `/users` dan `/api-keys`, termasuk
> `POST /api/admin/cad/licenses/generate` dan `GET /api/admin/cad/licenses/:id/copy`.
> Sebelum dicabut, token itu juga bisa sudah membuat admin atau API key baru, dan
> keduanya tidak gugur oleh rotasi. Setelah opsi 4, audit jendela insiden (dari
> waktu bocor sampai rotasi):
> ```sql
> SELECT id, email, role, is_active, created_at, updated_at FROM public.admin_users
>  WHERE created_at >= '<mulai>' OR updated_at >= '<mulai>';
> SELECT id, name, provider, is_active, created_by, created_at, updated_at FROM public.api_keys
>  WHERE created_at >= '<mulai>' OR updated_at >= '<mulai>';
> SELECT created_at, user_name, action, resource, resource_id, description, ip_address, reported_client_ip
>   FROM public.gateway_audit_logs WHERE created_at >= '<mulai>' ORDER BY created_at;
> ```
> Nonaktifkan atau hapus akun dan kunci yang tidak dikenal. Rotasi kunci provider
> yang sempat disalin atau diubah di jendela itu, dan tinjau lisensi CAD yang
> terbit di jendela itu.
>
> `ip_address` hanya bisa dipercaya untuk aksi auth dan `admin_users` (`login`,
> `login_mfa_challenge`, `totp_*` termasuk `totp_failed`/`totp_locked`, `logout_all`,
> `create`/`update`/`delete`/`revoke_sessions`/`totp_reset`/`mfa_required_denied`
> atas `admin_users`), yang memakai `mw.ClientIP`. Aksi lain (artikel, API key,
> lisensi CAD, bot) masih mencatat `c.IP()`, yaitu entri `X-Forwarded-For` paling
> kiri yang bisa dikarang pelaku. Untuk aksi lewat proxy console landing,
> `ip_address` adalah IP keluar Vercel; IP peramban admin ada di
> `reported_client_ip` (dilaporkan BFF, tidak diverifikasi; kosong untuk
> pemanggil langsung), dan di log fungsi Vercel (baris `[konsol]`).

Untuk admin biasa, pilih yang pertama yang tersedia:

1. **Cabut sesi admin itu** (akun tetap aktif). Super admin di console atau:
   `POST /api/admin/users/<id>/revoke-sessions` (Bearer super admin).
   Pelaku yang memegang sandi masih bisa login ulang, jadi ganti sandinya juga
   (`PUT /api/admin/users/<id> {"password": …}`, yang ikut mencabut sesi).
   Menyetel sandi super admin lain, atau sandi admin ber-TOTP, butuh sesi kuat
   (lihat "Sesi kuat"). Tanpa sesi kuat, pakai opsi 3 lalu ganti sandi lewat SQL.
2. **Nonaktifkan admin itu**: `PUT /api/admin/users/<id> {"is_active": false}`.
   Ini juga menaikkan `token_version`, jadi token lama tetap mati walau akunnya
   diaktifkan kembali.
3. **Console tidak bisa dipakai?** Jalankan SQL langsung:
   ```bash
   ssh coreasia-cad
   docker exec -i coreasia-cad-db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'SQL'
   UPDATE public.admin_users SET token_version = token_version + 1, updated_at = NOW()
    WHERE email = 'admin@contoh.id';
   SQL
   ```
4. **Jalan terakhir: rotasi `JWT_SECRET`.** Semua admin langsung keluar, di semua
   endpoint, tanpa menunggu access token kedaluwarsa.
   ```bash
   ssh coreasia-cad
   cd /opt/coreasia-cad
   # ganti JWT_SECRET di .env (openssl rand -base64 48), lalu:
   docker compose up -d gateway
   ```
   Semua pendaftaran TOTP ikut gugur. Jalankan reset TOTP (SQL di atas, tanpa
   `WHERE`), lalu admin mendaftar ulang.

Tanda sandi admin bocor tanpa token (TOTP menahannya):
```sql
SELECT created_at, user_name, action, description, ip_address FROM public.gateway_audit_logs
 WHERE action IN ('login_mfa_challenge','totp_failed','totp_locked','login') AND resource = 'admin_users'
   AND created_at >= NOW() - INTERVAL '30 days' ORDER BY created_at;
```
`login_mfa_challenge` dari IP asing tanpa `login` sesudahnya, atau `totp_failed`
di tahap `login`, berarti sandinya sudah dipegang orang lain. Ganti sandinya.

Cek hasilnya:
- `GET /api/admin/users` dengan token Anda sendiri: `is_active` dan `role` admin itu
  sesuai yang Anda setel. `/me` token lama → 401 saja tidak membuktikan perubahan
  kolom bertahan. `PUT` yang dijawab 409 tidak mengubah apa pun: muat ulang, lalu ulangi.
- `GET /api/admin/auth/me` dengan token lama → 401.
- `POST /api/admin/auth/refresh` dengan refresh token lama → 401.
- `GET /api/admin/users` dengan token lama → 401.
- Opsi 1–3 saja: access token lama masih lolos endpoint admin selain `/me`,
  `/refresh`, TOTP, `/users`, dan `/api-keys` sampai kedaluwarsa (≤ 60 menit).
  Mencabut sesi Supabase saja tidak cukup, karena klien otomatis mencetak ulang sesi.

### Urutan rilis bersama landing (Fase 0c): gateway dulu

Landing 0c hanya menerima pasangan token ber-`typ` dan ber-`tv`
(`frontend/landing/server/lib/konsol/sesi.ts`), sedangkan gateway sebelum 0c
menerbitkan token tanpa keduanya. Landing 0c di depan gateway lama berarti login
console mati untuk semua admin:
- halaman login: "Login diterima, tetapi sesi console gagal dibuat";
- log fungsi Vercel: `[konsol] {"peristiwa":"sesi-ditolak","sebab":"jenis",…}`.

Satu push ke master memicu keduanya, dan landing hampir selalu tayang lebih dulu.
Vercel siap dalam ±1,5 menit. Gateway butuh build image (±1,5–2 menit), watchtower
(`--interval 120`), lalu restart dan migrasi. Bila build gateway gagal, console
tetap mati sampai gateway menyusul. Karena itu:

1. Commit dan push **gateway saja** (`backend/gateway/**`, tanpa `frontend/landing/**`).
   Landing lama tetap jalan di gateway 0c selama belum ada admin ber-TOTP (catatan
   di "Sesi kuat"). Semua admin login ulang sekali, karena token tanpa `typ` ditolak.
2. Tunggu run "Build Gateway Image" hijau, lalu pastikan watchtower sudah memasang image-nya:
   ```bash
   ssh coreasia-cad
   docker inspect -f '{{index .Config.Labels "org.opencontainers.image.revision"}}' coreasia-cad-gateway  # = sha commit langkah 1
   docker logs coreasia-cad-gateway 2>&1 | grep 'migrasi selesai' | tail -1                              # "version":15,"dirty":false
   ```
3. Baru commit dan push landing.

### Rollback rilis

**Landing mundur lebih dulu, atau bersamaan.** Landing 0c tidak bisa login ke
gateway sebelum 0c (lihat di atas). Sebelum image gateway diganti, kembalikan
produksi Vercel ke deployment landing sebelum 0c lewat Instant Rollback atau
Promote. Pakai deployment commit `c7f9d97`, atau deployment commit gateway-saja
dari langkah 1 di atas (landing-nya sama). Setelah gateway 0c hidup lagi, maju
dengan Promote (atau Undo Rollback) deployment landing 0c.

Landing boleh mundur sendirian selama belum ada admin ber-TOTP. Setelah itu,
admin ber-TOTP tidak bisa masuk dari landing lama (catatan di "Sesi kuat") sampai
landing maju lagi atau TOTP-nya direset.

Gateway: migrasi 000014 dan 000015 hanya menambah kolom. Image lama menolak start
ketika DB berada di versi yang tidak dikenalnya (`no migration found for version 15`).
1. Di `/opt/coreasia-cad/docker-compose.yml`, ganti `:latest` dengan tag image
   sebelum 0c: `sha-<7 aksara>` dari run "Build Gateway Image" terakhir sebelum 0c
   (saat ini `sha-c91c9f7`). Tanpa tag tetap, watchtower menarik `:latest` (0c) lagi.
2. Turunkan versi migrasi, lalu `docker compose up -d gateway`:
   ```sql
   UPDATE public.gateway_schema_migrations SET version = 13, dirty = false;
   ```

Gateway sebelum 0c tidak memeriksa `typ`, `token_version`, maupun TOTP. Selama
rollback, refresh token diterima sebagai access token, sesi yang sudah dicabut hidup
lagi sampai `exp`, dan login cukup dengan sandi. Maju lagi secepatnya: kembalikan
`:latest`, lalu naikkan landing. Token yang terbit selama rollback tidak ber-`typ`,
jadi otomatis ditolak gateway 0c.

Kolom baru boleh dibiarkan: kode lama memilih kolomnya secara eksplisit, dan saat
maju lagi migrasi 000014/000015 (`IF NOT EXISTS`) tidak mengubah apa pun. Menjalankan
`000014_admin_auth_keras.down.sql` menghapus semua pendaftaran TOTP;
`000015_audit_ip_dilaporkan.down.sql` hanya membuang `reported_client_ip`.
