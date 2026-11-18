# Runbook console: token bocor, dan cara kerja sesi (Fase 0c)

Untuk kejadian "token atau cookie console bocor", termasuk bahan notifikasi
UU PDP 3×24 jam. Rincian gateway (TOTP, `token_version`, rotasi `JWT_SECRET`,
kueri audit gateway) ada di `backend/gateway/README.md`. Berkas ini merangkum
urutannya dari sisi console dan modul CashFlow.

## Sesi console sejak Fase 0c

- **Login langsung ke gateway.** Halaman `/console/login` mengirim sandi ke
  `POST {gateway}/admin/auth/login` dan kode TOTP ke `/admin/auth/totp/verify`
  langsung dari peramban (`credentials: 'omit'`). Pembatas per IP dan audit
  gateway (`login`, `login_mfa_challenge`, `totp_failed`) jadi melihat IP admin
  yang asli. Sandi dan kode tidak pernah melewati server Nitro.
  - Tantangan MFA hanya disimpan di memori halaman login, bukan di storage
    atau cookie.
  - Pasangan token hasil login langsung diserahkan ke BFF
    `POST /api/admin/sesi`. BFF memeriksa bentuk dan pasangannya, memvalidasi
    token akses ke gateway `/admin/auth/me`, lalu memasang cookie HttpOnly.
  - Sesudah itu halaman login memuat dokumen console baru, sehingga token yang
    sempat lewat di memori halaman login ikut dibuang.
  - `POST /api/admin/login` dan `/api/admin/totp-verify` dipensiunkan: keduanya
    menjawab 410 tanpa membaca badan.
- Token gateway hanya ada di cookie **HttpOnly** yang dipasang server Nitro
  (BFF). JS di coreasia.id, termasuk GTM atau XSS, tidak bisa membacanya.
  - Di https: `__Host-Http-ca_konsol_akses` (access, umur = `exp`, 60 menit)
    dan `__Host-Http-ca_konsol_segar` (refresh, 30 hari; sesi ber-TOTP paling
    lama 12 jam sejak kode diverifikasi).
  - `__Host-Http-ca_konsol_ikat`: nilai acak pengikat dokumen console, bukan
    kredensial (lihat "Ikatan dokumen" di bawah).
  - Semua `HttpOnly; Secure; SameSite=Lax; Path=/`. Awalan `__Host-` menolak
    cookie tanaman subdomain dan mewajibkan `Path=/`. Awalan `Http-` membuat
    peramban menolak cookie itu bila dipasang skrip (`document.cookie`), jadi
    skrip halaman publik tidak bisa menanam sesi admin lain (Chrome/Edge 140+,
    Firefox 143+; Safari belum, lihat "Batas yang diketahui").
  - Cookie lama `auth_admin_token` dan `refresh_admin_token` (dipasang JS)
    dihapus peramban saat halaman pertama kali dimuat.
- Rute BFF: `POST /api/admin/{sesi,refresh,logout}`, dan proxy
  `/api/gw/admin/**` → gateway.
  - Proxy mengubah cookie menjadi `Authorization: Bearer`.
  - Gateway menjawab 401 → proxy me-refresh sekali di server lalu mengulang.
  - Hanya menerima `Sec-Fetch-Site: same-origin`. Metode selain GET wajib
    membawa `X-Console: 1`.
  - Rute gateway milik BFF (`admin/auth/{login,refresh,totp/verify,logout}`)
    ditolak proxy tanpa peduli huruf.
  - Logout-all, mengaktifkan/mematikan TOTP, dan mengubah akun sendiri yang
    membuat gateway mencabut sesi (sandi, email, peran, atau menonaktifkan diri)
    yang berhasil lewat proxy menghapus cookie dan mencabut sesi CashFlow admin
    itu per id admin gateway (`admin_konsol_sesi_cabut_admin` +
    `admin_kasus_tutup_admin`, 0092). Lihat "Identitas admin di CashFlow" di
    bawah.
  - Tindakan atas admin LAIN yang membuat gateway mencabut semua sesinya
    (`users/<id>/revoke-sessions`, `users/<id>/totp/reset`, `DELETE users/<id>`,
    dan `PUT users/<id>` yang membawa sandi, `is_active: false`, email, atau
    peran) yang berhasil lewat proxy mencabut sesi CashFlow admin itu **per id
    saja** (`admin_konsol_sesi_cabut_admin` + `admin_kasus_tutup_admin`, id dari
    jalur). Cookie pemanggil tidak disentuh. Hasilnya dilaporkan di header
    `X-Konsol-Cashflow-Cabut` (`dicabut`, `gagal`, `tak-terkonfigurasi`). Untuk
    keempat tindakan itu (tombol Cabut semua sesi, Reset TOTP, Hapus, dan
    simpan form/ganti password yang membawa kolom di atas), bila header `gagal`
    atau tidak ada, halaman Users menampilkan peringatan yang menetap (bukan
    toast sukses) untuk menjalankan Langkah 1. Form "Edit user" hanya mengirim
    email dan peran bila berubah, jadi mengganti nama tidak mencabut apa pun.
  - Proxy meneruskan IP peramban di `X-Konsol-Klien-IP`. Gateway mencatatnya di
    `gateway_audit_logs.reported_client_ip`, bukan di `ip_address`.
- **Ikatan dokumen.** Setiap panggilan BFF (kecuali logout) wajib membawa
  `X-Konsol-Ikat`: HMAC dari cookie `ikat` dengan kunci server
  (`NUXT_KONSOL_IKAT_KUNCI`, cadangan: turunan kunci service-role CashFlow).
  - Token ini hanya dititipkan di HTML navigasi dokumen `/console/**`
    (`Sec-Fetch-Dest: document`), dibaca sekali ke memori, lalu elemennya dibuang.
  - Halaman publik satu-asal tidak bisa mendapatkannya: `fetch('/console')`
    tidak diberi token, iframe ditolak, popup terputus oleh COOP, dan HTML
    console `no-store`.
  - Cookie `ikat` dipasang ulang (nilai sama) di setiap navigasi dokumen
    console dan setiap refresh token. Umur 30 harinya dihitung dari aktivitas
    terakhir, bukan dari login.
  - Login di tab lain mengganti `ikat`, jadi token tab console yang sudah
    terbuka jadi basi (403 `ikatan`). Sesi yang habis menghasilkan 401.
    - Untuk baca, dokumen dimuat ulang atau pindah ke login secara otomatis.
    - Untuk simpan/hapus/unggah, tidak ada yang otomatis: isi form tetap dan
      admin mendapat toast bertombol **Muat ulang** / **Masuk lagi**.
    - Isian editor artikel dititipkan di sessionStorage tab itu dan dipulihkan
      sesudah muat ulang atau masuk lagi. Draf ini terikat id admin, berumur
      24 jam, dan dihapus saat dokumen publik dimuat.
  - Tanpa kunci server di Vercel, setiap instans fungsi memakai kunci acak
    sendiri dan console sering meminta muat ulang (log `[konsol] … kunci
    ikatan acak per proses`). **Pasang `NUXT_KONSOL_IKAT_KUNCI` (≥ 32 aksara
    acak) di Vercel.**
- `POST /api/cashflow/sesi` memvalidasi cookie yang sama ke gateway `/me`
  (lewat inti proxy), dan menolak permintaan tanpa `Sec-Fetch-Site: same-origin`
  atau tanpa token ikatan.
- **Identitas admin di CashFlow (sejak 0092).** Semua admin console memakai
  satu identitas Supabase (identitas layanan), jadi pembeda antar admin ada di
  `admin_konsol_sesi`. `sesi.post.ts` menulis `admin_gw_id` = `id` dari gateway
  `/me`, dan `pelaku` = email. Batas laju kasus, kepemilikan kasus, atribusi
  audit (`admin_audit.admin_gw_id`), dan pencabutan memakai **id**. Email hanya
  label tampilan, karena admin bisa menggantinya sendiri.
  - `/me` tanpa `id` yang sah: sesi CashFlow tidak dicetak (502
    `gateway-gagal`), bukan dicetak dengan kunci email saja.
  - Landing hanya mencabut **per id** (`admin_konsol_sesi_cabut_admin` +
    `admin_kasus_tutup_admin`). Jalur per email untuk sesi sebelum 0092
    dibuang sesudah transisi paket A (lihat "Paket A" di bawah): sesi tanpa
    `admin_gw_id` terakhir habis ≤ 12 jam sesudah landing paket A tayang, dan
    cabut per label email bisa mengenai admin lain yang pernah memakai email
    itu. `DELETE /api/cashflow/sesi` atas baris tanpa id mencabut sesi tab itu
    saja (`admin_konsol_sesi_cabut` per `session_id`). RPC per email tetap ada
    di SQL untuk Langkah 1 runbook di bawah.
- **Tiga jenis dokumen.** Kebijakan melekat pada dokumen, jadi berpindah jenis
  selalu memuat ulang dokumen penuh (`plugins/konsol-isolasi.client.ts`).

  | Dokumen | GTM/iklan | CSP `connect-src` |
  |---|---|---|
  | publik | ya | longgar (`/**`) |
  | `/console/**` | tidak | `'self'` + Supabase CashFlow |
  | `/console/login` | tidak | `'self'` + origin gateway publik saja |

  CSP console ber-hash, tanpa `'unsafe-inline'`, dengan `frame-ancestors 'none'`
  (`server/plugins/konsol-csp.ts`). Header console: `X-Frame-Options: DENY`,
  `Cross-Origin-Opener-Policy: same-origin`, noindex.
- Path console beda huruf atau ter-encode (`/Console/login`, `/%63onsole`)
  dialihkan 301 ke huruf kecil sebelum dirender (`server/middleware/konsol-kanon.ts`).
- Fungsi Vercel berjalan di Singapura (`nitro.vercel.functions.regions: ['sin1']`
  di `nuxt.config.ts`).

## Token console bocor

### Langkah 0: hentikan pencetakan sesi

Tujuannya: token curian gagal di gateway `/me`. Dengan begitu
`POST /api/cashflow/sesi` tidak bisa lagi mencetak sesi Supabase, dan proxy
tidak bisa me-refresh. Mencabut sesi Supabase saja tidak cukup, karena klien
console otomatis mencetak ulang sesi selama cookie gateway-nya masih diterima.

Token console ada di cookie HttpOnly, jadi tidak bisa disalin dari console.
Untuk opsi 2–3, super admin mengambil token Bearer-nya sendiri dengan login
langsung ke gateway. Sandi dibaca tanpa gema dan dikirim lewat stdin, tidak
lewat argumen proses:

```bash
GW=https://api.coreasia.id/api
read -r -p 'Email super admin: ' EMAIL; read -rs -p 'Sandi: ' SANDI; echo
export EMAIL SANDI
J=$(jq -n '{email: env.EMAIL, password: env.SANDI}' | curl -s -X POST "$GW/admin/auth/login" -H 'content-type: application/json' --data-binary @-)
unset SANDI
# Admin ber-TOTP: jawaban berisi challenge (5 menit); lanjutkan dengan kode.
if [ "$(jq -r .data.mfa_required <<<"$J")" = true ]; then
  read -r -p 'Kode TOTP: ' KODE
  export CH="$(jq -r .data.challenge <<<"$J")" KODE
  J=$(jq -n '{challenge: env.CH, code: env.KODE}' | curl -s -X POST "$GW/admin/auth/totp/verify" -H 'content-type: application/json' --data-binary @-)
  unset CH KODE
fi
TOKEN=$(jq -r .data.access_token <<<"$J"); unset J
[ "$TOKEN" != null ] && echo "token siap (60 menit)" || echo "login gagal"
```

Login ini ikut pembatas gateway (5 per 15 menit per IP). Token berlaku
60 menit; `unset TOKEN` sesudah selesai.

**Token super admin yang bocor: langsung rotasi `JWT_SECRET`** (README gateway,
opsi 4), jangan mulai dari opsi 1 di bawah. Access token super admin yang
sudah dicabut lewat opsi 1–4 masih lolos endpoint admin di luar `/me`,
`/refresh`, TOTP, `/users`, dan `/api-keys` sampai kedaluwarsa (≤ 60 menit),
termasuk `POST /api/admin/cad/licenses/generate` dan
`GET /api/admin/cad/licenses/:id/copy`. Rotasi memutusnya seketika. Akibatnya
semua admin keluar dan semua pendaftaran TOTP ikut gugur. Sesudah rotasi:
ikuti langkah pasca-rotasi di README gateway (rahasia TOTP semua admin tidak
terbaca lagi dan harus di-reset; kunci Redis penghitung percobaan), jalankan
Langkah 1 untuk admin itu, lalu audit jendela insiden (kueri `admin_users`,
`api_keys`, dan `gateway_audit_logs` di README gateway).

**Admin biasa (bukan super admin):** pilih yang pertama yang tersedia.

1. **Pemilik akun masih bisa masuk:** buka `/console/keamanan`, lalu pilih
   **Keluar dari semua perangkat** (`logout-all`). Setelah itu ganti sandi di
   halaman Users (butuh sandi saat ini). Keduanya lewat proxy, dan keduanya
   ikut menghapus cookie dan mencabut sesi CashFlow admin itu.
2. **Super admin mencabut sesi admin lain:** halaman Users, tombol
   **Cabut semua sesi** di baris admin itu (konfirmasi satu langkah). Tanpa
   console:
   ```bash
   curl -s -X POST "$GW/admin/users/<id>/revoke-sessions" -H "Authorization: Bearer $TOKEN"
   ```
   - Pelaku yang memegang sandi masih bisa login ulang. Ganti juga sandinya dari
     halaman Users (atau `PUT $GW/admin/users/<id> {"password": …}`), yang ikut
     mencabut sesi.
   - Authenticator dicurigai dipasang orang lain: tombol **Reset TOTP** di
     halaman Users, atau
     `curl -s -X POST "$GW/admin/users/<id>/totp/reset" -H "Authorization: Bearer $TOKEN"`.
     Target ber-TOTP butuh sesi kuat (lihat README gateway); tanpa itu gateway
     menjawab 403 dan halaman menampilkan sebabnya.
   - Lewat console, sesi CashFlow admin itu ikut dicabut per id. Peringatan
     "sesi CashFlow-nya belum tentu ikut" berarti pencabutan itu gagal:
     jalankan Langkah 1. **Lewat `curl` langsung ke gateway, Langkah 1 selalu
     wajib**: BFF tidak melihat panggilan itu.
3. **Nonaktifkan admin itu:** halaman Users, atau
   `curl -s -X PUT "$GW/admin/users/<id>" -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"is_active": false}'`.
4. **Console tidak bisa dipakai:** naikkan `token_version` lewat SQL di VPS
   (`ssh coreasia-cad`, lihat README gateway, bagian runbook opsi 3).
5. **Butuh putus seketika di semua endpoint:** rotasi `JWT_SECRET` (sama
   dengan cabang super admin di atas).

Batas yang tersisa: opsi 1–4 tidak memutus access token lama di endpoint admin
selain `/me`, `/refresh`, TOTP, `/users`, dan `/api-keys`. Di endpoint lain
token itu masih lolos sampai kedaluwarsa (paling lama 60 menit). Pencetakan
sesi CashFlow tetap berhenti seketika, karena `sesi.post.ts` selalu
bertanya ke `/me`.

### Langkah 1: cabut sesi CashFlow milik pelaku

Cabut **per id admin gateway**, bukan hanya per email: email bisa diganti
pelaku sendiri, sedangkan id tidak. Id admin ada di halaman Users console,
atau di jawaban `curl -s "$GW/admin/users" -H "Authorization: Bearer $TOKEN"`.

Di Supabase CashFlow (SQL editor, peran `postgres`):

```sql
-- 1) Semua email yang pernah dipakai id ini untuk sesi CashFlow (label).
select distinct lower(btrim(pelaku)) as email
  from public.admin_konsol_sesi
 where admin_gw_id = '<id admin gateway>';

-- 2) Cabut per id (sesi yang dicetak sesudah 0092) dan tutup kasusnya.
select public.admin_konsol_sesi_cabut_admin('<id admin gateway>');
select public.admin_kasus_tutup_admin('<id admin gateway>');

-- 3) Cabut per email untuk SETIAP email dari (1) dan email saat ini: sesi yang
--    dicetak sebelum 0092 tidak punya id. Email lama yang tidak tampil di (1)
--    ada di gateway_audit_logs (perubahan admin_users) — cabut juga.
select public.admin_konsol_sesi_cabut_pelaku('<email>');
select public.admin_kasus_tutup_pelaku('<email>');
```

`POST /api/admin/logout`, `DELETE /api/cashflow/sesi`, dan proxy (setelah
logout-all, TOTP diaktifkan/dimatikan, akun sendiri diubah, atau tindakan
console atas admin LAIN: cabut sesi, reset TOTP, hapus, ubah
sandi/email/peran/status) sudah menjalankan langkah (2) untuk admin itu, per
id saja. Langkah ini tetap wajib karena pelaku tidak akan
menekan tombol keluar, karena tindakan lewat `curl` langsung ke gateway tidak
lewat BFF, dan karena sesi lama tanpa `admin_gw_id` hanya kena jalur per email.

### Langkah 2: pastikan pintunya tertutup

Gunakan token atau cookie yang bocor. Semua cek di bawah harus dijawab 401:

```bash
# gateway langsung
curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer <access lama>" https://api.coreasia.id/api/admin/auth/me
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'content-type: application/json' \
  -d '{"refresh_token":"<refresh lama>"}' https://api.coreasia.id/api/admin/auth/refresh
```

Lewat console, cookie yang ditolak gateway menghasilkan 401. Pemeriksaan itu
butuh token ikatan yang cocok dengan cookie `ikat` (ambil dari HTML
`/console/login` dengan `Sec-Fetch-Dest: document` dan `Sec-Fetch-Mode: navigate`).
Cek gateway langsung di atas sudah cukup, karena BFF selalu bertanya ke gateway.

Mulai Fase 1, `admin_kasus_aktif` untuk pelaku itu juga harus kosong.

### Langkah 3: tarik jejak akses

- CashFlow: kueri langsung ke `public.admin_audit` di SQL editor (peran
  `postgres`), rentang waktu dari saat token diduga bocor sampai langkah 0
  selesai. Kueri siap jalan ada di Langkah 4; untuk kronologi per aksi:

  ```sql
  select a.created_at, a.action, a.target_type, a.target_id, a.pelaku,
         to_jsonb(a) ->> 'admin_gw_id' as admin_gw_id,
         cardinality(a.terdampak) as terdampak, a.detail, a.reason
    from public.admin_audit a
   where a.created_at >= timestamptz '<mulai, mis. 2026-09-24 08:00+07>'
     and a.created_at <  timestamptz '<selesai>'
     and (lower(btrim(a.pelaku)) in (select lower(btrim(e)) from unnest(array['<email 1>', '<email 2>']) e)
          or to_jsonb(a) ->> 'admin_gw_id' = '<id admin gateway>')
   order by a.created_at;
  ```

  Jangan memakai `admin_daftar_audit_v3` untuk ini: tidak punya saringan
  waktu, hanya 500 baris per panggilan, menolak pemanggil tanpa sesi console
  (42501 dari SQL editor), dan menahan `terdampak`/`detail.ids` bagi sesi
  tanpa `cashflow:pii`. Halaman `/console/cashflow/audit` juga hanya memuat
  500 baris terakhir tanpa UUID terdampak.
- Gateway: `gateway_audit_logs` pada rentang yang sama (kueri di README
  gateway). Mencakup artikel, API key, lisensi CAD, admin, `logout_all`,
  `revoke_sessions`, dan `totp_*`. Cara membaca IP-nya:
  - `login`, `login_mfa_challenge`, `totp_failed`: `ip_address` = IP peramban
    admin (login langsung ke gateway, `mw.ClientIP`);
  - aksi lewat console (proxy BFF): `ip_address` = IP keluar Vercel, dan
    `reported_client_ip` = IP peramban yang **dilaporkan BFF**. Nilai itu tidak
    diverifikasi gateway: pemanggil langsung (token curian dengan `curl`) bisa
    mengarangnya atau membiarkannya kosong. Baris tanpa `reported_client_ip`
    dengan `ip_address` bukan Vercel berarti token dipakai di luar console;
  - salinan sisi Vercel: log fungsi (baris `[konsol]` berisi peristiwa, jalur,
    status, email dari klaim, IP klien, `x-vercel-id`).

### Langkah 4: susun daftar subjek dan pemberitahuan

- Subjek = `target_id` ∪ `terdampak` ∪ `detail.ids` dari baris audit
  CashFlow di langkah 3. Kueri siap jalan (SQL editor, peran `postgres`; isi
  empat nilai di `p`, lalu jalankan seluruhnya):

  ```sql
  with p as (
    select array['<email 1>', '<email 2>']::text[] as email,  -- SEMUA email admin itu (Langkah 1)
           array['<id admin gateway>']::uuid[]      as gw,     -- '{}'::uuid[] bila id tidak diketahui
           timestamptz '<mulai>'                    as mulai,
           timestamptz '<selesai>'                  as selesai
  ), baris as (
    select a.*
      from public.admin_audit a, p
     where a.created_at >= p.mulai and a.created_at < p.selesai
       and (lower(btrim(a.pelaku)) in (select lower(btrim(e)) from unnest(p.email) e)
            or (to_jsonb(a) ->> 'admin_gw_id')::uuid = any (p.gw))
  ), subjek as (
    select b.target_id as id, 'target_id' as sumber
      from baris b
     where b.target_id is not null and coalesce(b.target_type, 'user') = 'user'
    union
    select unnest(b.terdampak), 'terdampak' from baris b
    union
    select x.v::uuid, 'detail.ids'
      from baris b,
           jsonb_array_elements_text(case when jsonb_typeof(b.detail -> 'ids') = 'array'
                                          then b.detail -> 'ids' else '[]'::jsonb end) x(v)
     where b.action = 'daftar_pengguna_terbuka'
    union
    -- Baris yang menyasar ruang tanpa `terdampak` (ditulis sebelum 0089):
    -- anggota ruang itu SAAT INI. Keanggotaan bisa sudah berubah sejak
    -- barisnya ditulis; periksa manual bila ada.
    select m.user_id, 'anggota ruang (kini)'
      from baris b join public.workspace_members m on m.workspace_id = b.target_id
     where b.target_type = 'workspace' and b.terdampak is null
  )
  select s.id, u.email, string_agg(distinct s.sumber, ', ' order by s.sumber) as dari
    from subjek s left join auth.users u on u.id = s.id
   group by s.id, u.email
   order by u.email nulls last, s.id;
  ```

  Admin manusia yang masuk langsung (admin-next, aal2) tidak punya `pelaku`;
  barisnya dikenali dari `admin_id` = id akun Supabase-nya. Tambahkan
  `or a.admin_id = '<uuid>'` di `baris` bila pelakunya admin semacam itu.
- Siapkan pemberitahuan kepada subjek dan otoritas dalam 3×24 jam sejak
  kegagalan pelindungan data diketahui (UU 27/2022).
- Catat kronologinya: kapan bocor, kapan diketahui, langkah 0–3 dijalankan
  jam berapa dan oleh siapa.

## Cek setelah rilis (produksi)

**Urutan rilis: gateway dulu, landing sesudahnya.** Landing 0c di depan gateway
sebelum 0c mematikan login console untuk semua admin:
- sandi diterima, lalu halaman login menampilkan "Login diterima, tetapi sesi
  console gagal dibuat";
- log fungsi Vercel berisi `[konsol] {"peristiwa":"sesi-ditolak","sebab":"jenis",…}`,
  karena token gateway lama tidak membawa `typ`/`tv`.

Push ke master memicu Vercel dan build gateway sekaligus, dan landing tayang 1–3
menit lebih dulu. Jadi push gateway dalam commit terpisah, tunggu image-nya
terpasang (`"version":15` di log start gateway), baru push landing. Rollback
kebalikannya: landing ke deployment sebelum 0c (`c7f9d97`) dulu atau bersamaan,
baru image gateway lama. Perintah lengkapnya ada di README gateway, bagian "Urutan
rilis bersama landing" dan "Rollback rilis".

> **Rollback landing ke `c7f9d97` sesudah migrasi CashFlow 0091 diterapkan
> merusak modul CashFlow console.** Landing `c7f9d97` (Fase 0b) memanggil lima
> RPC yang dicabut 0091: detail pengguna dan `/console/cashflow/audit` menjawab
> `permission denied for function …`. Pilih salah satu:
> - rollback landing hanya ke deployment Fase 1 atau sesudahnya (`33b4502`
>   ke atas), yang memakai RPC 0089/0090; atau
> - bila memang harus ke `c7f9d97`, jalankan dulu GRANT di bawah (SQL editor
>   Supabase CashFlow, peran `postgres`), dan REVOKE kembali begitu landing
>   maju lagi ke Fase 1 atau sesudahnya. Selama GRANT berlaku, kelima RPC
>   membuka data subjek tanpa kasus untuk sesi Fase 0b (itulah alasan 0091),
>   jadi jendelanya sesingkat mungkin.
>
> ```sql
> -- Pemulihan sementara untuk landing c7f9d97 (membalik 0091):
> grant execute on function public.admin_detail_pengguna_v2(uuid, text) to authenticated;
> grant execute on function public.admin_aktivitas_pengguna(uuid, text, integer) to authenticated;
> grant execute on function public.admin_baca_transaksi_v2(uuid, text, integer) to authenticated;
> grant execute on function public.admin_baca_catatan_transaksi(uuid, text, uuid[]) to authenticated;
> grant execute on function public.admin_daftar_audit_v2(integer, integer, text, uuid) to authenticated;
>
> -- Begitu landing kembali ke Fase 1 atau sesudahnya (= isi 0091):
> revoke execute on function public.admin_detail_pengguna_v2(uuid, text) from public, anon, authenticated, service_role;
> revoke execute on function public.admin_aktivitas_pengguna(uuid, text, integer) from public, anon, authenticated, service_role;
> revoke execute on function public.admin_baca_transaksi_v2(uuid, text, integer) from public, anon, authenticated, service_role;
> revoke execute on function public.admin_baca_catatan_transaksi(uuid, text, uuid[]) from public, anon, authenticated, service_role;
> revoke execute on function public.admin_daftar_audit_v2(integer, integer, text, uuid) from public, anon, authenticated, service_role;
> ```
>
> Sesi yang dicetak `c7f9d97` tidak punya kolom `izin`, jadi di 0089 ia sesi
> `'{}'` yang memang masih dilayani kelima RPC itu. `toko/uji-acl-admin.sql`
> akan gagal selama GRANT berlaku; itu tanda yang benar.

**Paket A (review 24 Sep): SQL 0092 → gateway → landing.**
- 0092 dulu. Landing yang sedang tayang (Fase 1, `33b4502`) tetap jalan di
  atasnya: kolom `admin_gw_id` nullable, sesinya memakai kunci email sampai
  kedaluwarsa, dan RPC lama per email tetap ada.
- Gateway kedua: `/admin/auth/me` memulangkan `id`.
- Landing terakhir. Landing ini menulis `admin_gw_id` dan GAGAL mencetak sesi
  CashFlow (`mint-gagal`) bila 0092 belum diterapkan. Itu disengaja: tanpa
  id, batas laju kasus bisa di-reset dengan mengganti email.
- Landing lama (`33b4502`) hanya tetap jalan di atas 0092 sampai 15 menit
  sesudah landing paket A mencetak sesi ber-id pertama. Sesudah itu pemicu
  `admin_konsol_sesi_wajib_id` (0092 bagian 1b) menolak sesi tanpa id
  (`42501`, hint `sesi-tanpa-id`) dan landing lama gagal `mint-gagal`.
  Karena itu:
  - Jangan login console dari landing paket A, termasuk preview Vercel yang
    memakai kunci service produksi, sebelum landing itu siap dipromosikan.
    Sesi ber-id pertama memulai hitungan 15 menit.
  - Jangan mengganti email admin console selama 24 jam sesudah landing
    paket A tayang (lihat CATATAN RILIS di kepala 0092).
  - **Rollback landing paket A ke `33b4502` wajib didahului
    `./toko/sql.sh toko/rollback-0092.sql` (tahap 1).** Tahap 1 membuang
    pemicu ujung transisi dan mengembalikan badan fungsi ke 0091; kolom
    `admin_gw_id` dan fungsi per id dibiarkan. Tanpa langkah ini landing lama
    tidak bisa membuka modul CashFlow.
  - Jangan me-rollback 0092 selagi landing paket A tayang.
- **Rilis berikutnya sesudah paket A: jalur email dibuang (sudah).** Begitu
  landing paket A tayang lebih dari 12 jam, tidak ada lagi sesi tanpa
  `admin_gw_id` yang hidup, dan cabut sesi per email bisa mengenai sesi admin
  lain yang memakai email itu. Landing kini tidak memanggil
  `admin_konsol_sesi_cabut_pelaku` maupun `admin_kasus_tutup_pelaku` (RPC-nya
  tetap ada di SQL untuk runbook "Token console bocor"). **Rilis landing ini
  hanya boleh tayang sesudah** cek 12 jam di bawah menghasilkan 0:
  `select count(*) from public.admin_konsol_sesi where admin_gw_id is null and dicabut is null and dibuat > now() - interval '12 hours';`
  Bila belum 0, rilis tanpa commit pembuangan jalur email dulu.
- Sesudah landing tayang: login console dengan TOTP, buka satu Pengguna 360,
  lalu pastikan sesinya ber-id:
  `select admin_gw_id, pelaku, dibuat from public.admin_konsol_sesi order by dibuat desc limit 3;`

```bash
# CSP console: ber-hash, tanpa 'unsafe-inline' di script-src, tanpa googletagmanager, ditambah header /**
curl -sI https://coreasia.id/console/cashflow | grep -iE 'content-security-policy|strict-transport|x-frame|x-content-type|referrer-policy|permissions-policy|cross-origin-opener'
# URL console tidak menjadi referrer halaman publik (GTM/GA): no-referrer, hanya SATU header
curl -sI https://coreasia.id/console/login | grep -i '^referrer-policy'    # referrer-policy: no-referrer
curl -sI https://coreasia.id/ | grep -i '^referrer-policy'                 # strict-origin-when-cross-origin
# dokumen login: connect-src memuat https://api.coreasia.id; dokumen console lain TIDAK
curl -sI https://coreasia.id/console/login | grep -io "connect-src[^;]*"
curl -sI https://coreasia.id/console/users | grep -io "connect-src[^;]*"
# path beda huruf dialihkan ke huruf kecil
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://coreasia.id/Console/login        # 301 …/console/login
# BFF menolak permintaan tanpa asal yang benar; login lama dipensiunkan
curl -s -o /dev/null -w '%{http_code}\n' https://coreasia.id/api/gw/admin/auth/me              # 403
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://coreasia.id/api/cashflow/sesi         # 403
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://coreasia.id/api/admin/login           # 410
# fungsi di Singapura: x-vercel-id berisi ::sin1::
curl -s -o /dev/null -D - -X POST https://coreasia.id/api/cashflow/sesi | grep -i x-vercel-id
# gateway mengizinkan login langsung dari console (CORS) dan mengekspos Retry-After
curl -s -o /dev/null -D - -X OPTIONS https://api.coreasia.id/api/admin/auth/login \
  -H 'Origin: https://coreasia.id' -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type' | grep -i 'access-control-allow-origin'
```

Sesudah setiap deploy landing, jalankan juga pemeriksaan berkas build di bagian
"Sesudah deploy: berkas build dan tembolok" di akhir dokumen ini.

Di Vercel, header routeRules dipasang di tepi. Rute `/console/**` sengaja
tidak memuat CSP statis. Kalau `curl -I` di atas menunjukkan CSP
`'unsafe-inline'` milik `/**`, berarti CSP ber-hash dari fungsi tertimpa.
Laporkan: console tetap berjalan, tetapi tanpa CSP ketat.

## Fase 2 (0094): Ruang 360

**Urutan rilis: SQL 0094 dulu, landing sesudahnya.** Landing Fase 2 memanggil
`admin_aktivitas_terbaru_v2`, `admin_cari_v2`, `admin_kasus_aktif_ruang`,
`admin_kasus_buka_dari_peristiwa`, `admin_ruang_kepala`, `admin_ruang_360`,
`admin_dompet_ruang`, `admin_mutasi_dompet`, `admin_periksa_ruang`, dan
`admin_sampah_ruang`. Tanpa 0094 halaman Aktivitas dan palet langsung gagal
(PGRST202). Landing yang sedang tayang tetap jalan di atas 0094 karena v1
aktivitas dan cari belum dicabut. Keduanya baru dicabut sesudah landing Fase 2
tayang.

### Uji peramban (sesi console ber-TOTP)

Uji dengan dua akun admin: A (pemilik sesi) dan B (admin lain). Keduanya
login ber-TOTP. Siapkan satu pengguna U yang punya dua ruang, W1 bersama satu
anggota lain dan W2 pribadi. Jalankan di 1280 px dan 375 px, dengan tema
terang dan gelap.

1. **Pengguna → ruang tanpa gerbang.** A membuka `/pengguna/U` dan data tampil
   tanpa dialog. Di tab Ruang, klik nama W1. `/ruang/W1` tampil tanpa dialog.
   Tab Ringkas, Anggota, Transaksi, Dompet, Jejak, dan Sampah terisi.
   `/kasus` hanya menampilkan SATU kasus aktif milik A atas U, dengan ranah
   ruang dan dompet sudah bertambah, bukan kasus baru.
   Ruang U yang DI LUAR lingkup kasus (bagian "di luar lingkup") sengaja
   tidak bertaut: klik "Masukkan ke lingkup" dulu, lalu nama ruangnya
   bertaut dan kasus yang sama dipakai. Kalau ruang itu dibuka langsung
   (palet, URL), Ruang 360 membuka kasus ruang kedua.
2. **Refresh.** Tekan F5 di `/ruang/W1/dompet`. Data tampil lagi dan tetap
   tidak ada kasus baru di `/kasus`.
3. **Tautan yang dibagikan.** B membuka URL `/ruang/W1` yang disalin A. B
   mendapat kasus baru miliknya (subjek ruang W1). Tidak ada dialog. Kasus A
   tidak dipakai.
4. **Saldo salah, ≤ 3 klik.** `/ruang/W1` → tab Dompet → Mutasi di dompet
   yang dicurigai. Saldo di kartu sama dengan saldo di aplikasi pemilik
   (Beranda/Dompet). Saldo sesudahnya di baris teratas mutasi sama dengan
   saldo dompet. Baris bertanggal masa depan berpil.
5. **Pemeriksaan.** Di tab Dompet, cek yang jumlahnya > 0 bertaut ke tab
   Transaksi `?cek=<jenis>` dan jumlah barisnya sama. Di URL tidak ada daftar
   id.
6. **Sengketa anggota, ≤ 3 klik.** `/ruang/W1` → tab Anggota → kolom pencatat
   di tab Transaksi atau Jejak. Bekas anggota yang hanya tersisa di sampah
   tampil dengan "hanya tersisa di sampah". Undangan tidak menampilkan kode.
7. **Sampah.** Tab Sampah menampilkan status dihapus/dipulihkan. "Berikutnya"
   dan Back berjalan per halaman. Catatan terkunci hanya terbuka untuk baris
   yang diklik.
8. **Selidiki.** `/aktivitas` tidak menampilkan ruang maupun jam. Klik Selidiki
   pada satu baris: halaman pindah ke `/ruang/<W>/jejak` dengan data tampil.
   Klik Selidiki lagi pada baris yang sama: `/kasus` menunjukkan kasus lama
   ditutup dan kasus baru bertanda "lanjutan".
9. **Palet.** Tekan Cmd+K, tempel uuid W2 (atau 8 hex awalnya), lalu Enter.
   Hasil "Ruang" tersamar muncul dan membuka `/ruang/W2`.
10. **Riwayat akses dua orang.** Sesudah langkah 1, tab Akses di
    `/pengguna/U` dan di `/pengguna/<anggota lain W1>` sama-sama memuat baris
    `baca_ruang` milik A. Tab Akses di `/ruang/W1` memuat `lihat_kepala`.
11. **Tanpa TOTP.** Sesi console tanpa TOTP membuka `/ruang/W1`. Kepala tampil
    tersamar dengan hitungan "—", tab data menampilkan "butuh login console
    ber-TOTP", dan Selidiki menampilkan toast izin. Tidak ada yang terbuka.
12. **Batas laju.** Buka ruang ke-21 berbeda dalam satu jam (boleh di
    preview): tab menampilkan kalimat batas "20 subjek berbeda (pengguna atau
    ruang)". Selidiki pada saat itu menampilkan toast yang sama.

Sesudah lolos, cabut v1 lewat jalur SQL (`admin_aktivitas_terbaru`,
`admin_cari`).

### Lencana Kasir di anggota, undangan, dan ruang pengguna

Kasir adalah Anggota yang diberi tanda: boleh menjual dan menerima bayaran kasbon, tanpa melihat harga
modal. Console menulis lencana **Kasir** (ikon toko, nada info) di samping peran, di tiga tempat:

- `/ruang/<W>/anggota`, daftar anggota: di samping pil peran `member`.
- `/ruang/<W>/anggota`, daftar undangan: undangan Kasir, apa pun statusnya (menunggu, diterima,
  dicabut). Penerimanya langsung jadi Kasir begitu bergabung.
- `/pengguna/<U>/ruang`, kartu ruang DALAM lingkup kasus: di samping peran pada baris "member · n anggota".
  Ruang di luar lingkup tidak pernah membawa tanda ini, karena objeknya sengaja hanya berisi kunci kepala.
  Masukkan ruang itu ke lingkup untuk melihatnya.

Detailnya:

- **Sumber.** Kunci `kasir` di `admin_ruang_360` (anggota dan undangan) dan `admin_pengguna_360` (ruang
  dalam lingkup), dari migrasi CashFlow `20261117180000_console_anggota_kasir`. Kunci lain, audit
  `baca_ruang`/`baca_akun`, dan izin tidak berubah.
- **Aturan tampil.** Lencana hanya bila `kasir` benar DAN perannya `member` (`tandaKasir` di
  `adapters/cashflowBuku.ts`), sama dengan `adalah_kasir` di server.
- **Server lama.** Tanpa kunci `kasir`, halaman tampil sama piksel demi piksel dengan sebelum fitur ini.
  Uji tampilan di bawah memastikan keadaan tanpa kunci dan keadaan semua false sama persis. Untuk
  membandingkan dengan cabang lain, jalankan skripnya dengan `CF_QA_HANYA=lama` ke server dev cabang itu
  lalu bandingkan potretnya. Urutan rilis bebas.

```bash
CASHFLOW_MIGRASI=<repo cashflow>/supabase/migrations npx vitest run tests/cashflow/kasir-tanda.test.ts tests/cashflow/kontrak-fase1.test.ts tests/cashflow/kontrak-fase2.test.ts
# Tiga keadaan server (ada Kasir, semua false, kunci belum dikirim), terang dan gelap, 1440 dan 390,
# plus bahasa Inggris (cara menjalankan ada di kepala skrip):
node scripts/uji-console-kasir-headless.mjs
```

## Fase 3 (0095): ranah buku

**Urutan rilis: SQL 0095 dulu, landing sesudahnya.** Landing Fase 3 memanggil
`admin_katalog_ruang`, `admin_jadwal_ruang`, `admin_jadwal_rinci`,
`admin_usaha_ruang`, `admin_stok_ruang`, `admin_struk_ruang`,
`admin_patungan_ruang`, `admin_patungan_riwayat`, `admin_perangkat_pengguna`,
dan `admin_kabar_pengguna`, dan membaca kunci `hitung` baru di
`admin_ruang_360` dan `admin_pengguna_360` untuk lencana. Tanpa 0095 tab baru
gagal (PGRST202) dan lencananya "—". Laci baris struk memakai
`admin_transaksi_cari p_grup` (sudah ada sejak 0090).

### Uji peramban (sesi console ber-TOTP)

Siapkan data di ruang milik Master (K-F3-8), bukan ruang pelanggan: satu
ruang usaha WU (produk berstok dan tanpa lacak stok, beberapa struk
penjualan termasuk kasbon dan pelanggan yang sama di dua struk, satu struk
berfoto, satu baris struk di sampah), satu ruang bersama WB dengan patungan
(dua transaksi dibagi, satu pelunasan, satu anggota yang sudah keluar
dengan saldo), dan pengguna U (Master) yang punya dua pemasangan aplikasi,
kabar belum dibaca, dan setidaknya satu transaksi yang dicatat luring.
Jalankan di 1280 px dan 375 px, tema terang dan gelap, bahasa ID dan EN.

1. **Aktivasi satu klik.** Buka `/ruang/WU` (kasus baru). Klik tab Struk:
   data tampil tanpa dialog dan tanpa teks ranah. `/kasus` menunjukkan
   ranah `struk` bertambah pada kasus yang sama; audit memuat
   `tambah_ranah` lalu `baca_struk`. Ulangi untuk Katalog, Jadwal, Usaha.
2. **Refresh tidak menambah ranah.** Tutup kasus di `/kasus`, lalu tekan F5
   di `/ruang/WU/struk`. Tab menampilkan tombol "Muat data" (tanpa nama
   ranah). Audit TIDAK memuat `tambah_ranah` sebelum tombol diklik. Klik
   sekali: data tampil. Back ke tab ini juga tidak menambah ranah sendiri.
3. **Lencana tanpa RPC tab.** Buka `/ruang/WU` di tab Ringkas. Lencana
   Katalog/Jadwal/Usaha/Struk terisi, tab bernilai 0 pindah ke
   "Lainnya (0)". Audit hanya memuat `baca_ruang` (360), tidak ada
   `baca_struk`, `baca_usaha`, dan seterusnya.
4. **Struk: saringan dan kursor.** Saring Penjualan, Kasbon saja, OCR, dan
   rentang tanggal: ringkas berubah dan halaman kembali ke pertama. Pilih
   pencatat: URL tetap hanya `?kursor=`/`?struk=` (tidak ada id orang).
   "Berikutnya" dan Back berjalan per halaman; ringkas tetap tampil di
   halaman 2. Nama pedagang dan catatan hanya berupa penanda "tidak
   dikirim"; baris di sampah berpil.
5. **Struk: pelanggan.** Klik chip "Pelanggan ·xxxxxx" pada satu struk:
   struk lain dengan pelanggan yang sama di halaman itu tersorot dan
   jumlah struknya tampil, tanpa total rupiah atau kasbon per pelanggan.
   Nama dan telepon pelanggan tidak ada di mana pun. Buka kasus baru
   (tutup, lalu buka lagi): tanda pelanggan yang sama BERBEDA.
6. **Struk: baris item.** Klik "Baris struk": laci `?struk=` berisi item
   dengan qty dan nominal, Back menutup laci. Klik satu item: laci
   transaksi `?tx=` terbuka di tab Transaksi.
7. **Patungan.** `/ruang/WB/dompet` → segmen Patungan (`?lihat=patungan`).
   Saldo anggota sama dengan layar Patungan aplikasi; anggota yang keluar
   tampil di "Bekas anggota" dengan saldonya; teks "Jumlah semua saldo 0"
   berwarna hijau. Riwayat Pembagian menampilkan bagian per orang dan
   selisih; Pelunasan menampilkan dari/ke, bukti, dan penanda transfer
   hilang. Ganti jenis: `?jenis=lunas`, kursor kembali ke halaman pertama.
   Kembali ke segmen Dompet: mutasi dan Pemeriksaan jalan seperti Fase 2.
8. **Perangkat.** `/pengguna/U` → tab Perangkat. Pemasangan menampilkan
   platform, varian, versi (teks biasa), terakhir aktif, dan tanda sidik
   pendek (tanpa token). Sesi tanpa IP maupun peramban. Ganti rentang 7/90
   hari: angka jeda berubah, URL tidak berubah, dan setiap rentang tercatat
   satu `baca_perangkat`. Jeda terlama bertaut ke Jejak (ruang dan tanggal
   yang sama) dan ke laci transaksi. Buka staf platform sebagai subjek:
   sesi berbunyi "staf platform; sesinya tidak ditampilkan".
9. **Kabar.** Tab Kabar: ringkas (total, belum dibaca, per jenis) dan
   setelan per ruang (bawaan berpil). Saring "Belum dibaca", jenis, dan
   ruang: URL tetap hanya `?kursor=`. Kabar transaksi dihapus/besar
   menampilkan kategori dan nominal, bertaut ke laci transaksi; nama
   pengirim hanya penanda "tidak dikirim". Ruang U di luar lingkup kasus
   tidak muncul di saringan dan kabarnya tidak dihitung.
10. **Audit tanpa angka (F3-11).** Di `/audit`, baris `baca_perangkat` dan
    `baca_kabar` hanya membawa `{rpc, ranah, halaman_pertama?, saring}`;
    tidak ada `jumlah` atau hitungan per jenis.
11. **Tanpa TOTP.** Sesi console tanpa TOTP membuka `/ruang/WU/struk` dan
    `/pengguna/U/perangkat`: "butuh login console ber-TOTP", tidak ada RPC
    tab dan tidak ada tombol "Muat data".
12. **Tampilan.** Di 375 px tidak ada gulir samping selain tabel per hari
    Perangkat (bergulir di dalam kotaknya). Setelan Kabar tampil sebagai
    daftar per ruang, tanpa tabel. Pil,
    tanda belum dibaca, dan warna saldo (hijau/merah) terbaca di tema
    gelap. Semua kode (OCR, jenis kabar, peran, platform) tampil sebagai
    kata, bukan kode mentah.

## 1.3.2 (0110): versi aplikasi, ajakan pembaruan, langkah usaha

Tiga RPC agregat baru (T0, tanpa audit, tanpa TOTP): `admin_versi_aplikasi`,
`admin_ajakan_pembaruan`, dan `admin_langkah_usaha`, ditambah pembantu privat
`akun_dalam_inti`. Migrasi 0110 hanya membuat fungsi, tidak menyentuh tabel.
Penyunting versi di Sakelar menulis lewat `admin_set_config` dan
`admin_hapus_config` yang sudah ada.

**Urutan rilis: SQL 0110 dulu, landing sesudahnya.** Landing lama tetap jalan
di atas 0110. Landing baru tanpa 0110 hanya membuat ketiga bagian baru
menampilkan galat di bagiannya sendiri (PGRST202). Kartu Versi aplikasi tetap
bisa menyimpan, jumlah yang tertahan minimum jadi "belum bisa diketahui".

Penerapan 0110 (di repo CashFlow):

1. Cek nama di `pg_proc` (keempat fungsi harus belum ada).
2. Gladi: `begin;` + isi 0110 tanpa `notify` + blok `do` yang memanggil
   ketiga RPC sebagai admin + `raise exception 'GLADI-OK ...'`. Jawaban yang
   benar adalah galat `GLADI-OK`.
3. Terap: `./toko/sql.sh supabase/migrations/0110_admin_versi_aplikasi.sql`.
4. Uji baca sekali sebagai admin, cetak angka saja.
5. `toko/uji-acl-admin.sql` lulus (ketiga RPC tergolong admin).

Mundur SQL: `toko/rollback-0110.sql` (membuang keempat fungsi, aman diulang).
Mundur landing: promosikan deployment Vercel sebelumnya, tanpa langkah SQL.

### Uji lokal

```bash
# repo CashFlow
toko/lokal/jalankan-uji.sh toko/uji-0110.sql toko/uji-acl-admin.sql toko/uji-corong-usaha.sql
toko/lokal/uji-tanpa-superuser.sh toko/uji-0110.sql
toko/lokal/uji-mutan-0110.sh
node uji/konsol-0110.mjs
# landing
CASHFLOW_MIGRASI=<repo cashflow>/supabase/migrations npx vitest run
node scripts/cek-komponen-cashflow.mjs
```

Uji tampilan memakai data tiruan di Chromium headless (tanpa jendela), dan
server dev dimatikan lagi di perintah yang sama.

### Uji peramban (sesi console ber-TOTP, sesudah tayang)

1. **Sakelar, kartu Versi aplikasi.** Segmen Play, UAT, Uji IAS. Kunci yang
   belum ada berbunyi "Belum disetel". Di segmen Play, "Pakai angka ini"
   mengisi rilis Play terakhir. Segmen UAT dan IAS tidak punya tombol itu dan
   tidak memperingatkan "di atas rilis Play". Isi minimum: panel kuning
   menyebut jumlah pengguna aktif yang tertahan dan baru bisa disimpan sesudah
   dicentang.
2. **Simpan pertama.** Audit `set_config` memuat nilai lama (null) dan baru
   `{"terbaru": ...}` sebagai angka, `is_public` true. Daftar "Semua kunci"
   memuat `versi_android` dengan catatan kunci.
3. **Kesehatan.** Versi aplikasi (7, 30, 90 hari) dan Ajakan pembaruan
   memakai rentang yang sama. Ubin "Di bawah versi terbaru" muncul sesudah
   `versi_android` disetel.
4. **Aktivitas.** Langkah usaha di atas tabel peristiwa, bisa dilipat.

Acuan "tertinggi yang pernah tercatat di HP" diambil sepanjang waktu dan ikut
menghitung akun uji. Build IAS tercatat sebagai Play di pendaftaran
notifikasi, jadi angka Play bisa lebih tinggi dari rilis Play. Pakai sebagai
petunjuk, bukan patokan.

### Setiap rilis Play

Naikkan `RILIS_PLAY_TERAKHIR` (dan tambahkan namanya di `RILIS_PLAY`) di
`adapters/cashflowVersi.ts`, lalu sesudah rilis tayang setel `versi_android`
dari kartu Versi aplikasi. `tests/cashflow/versi.test.ts` memeriksa
versionCode-nya ada di `toko/catatan-rilis-<versi>.md` repo CashFlow.

## Percakapan Domi (tab Domi AI di Pengguna 360)

Isi percakapan adalah data pribadi tingkat tinggi. Tab Domi AI memakai kasus
anak gabungan `{teks, foto}` yang dibuka otomatis satu klik (alasan otomatis
menyebut percakapan Domi), jadi butuh login console ber-TOTP
(`cashflow:investigasi`) dan kasus induk memegang ranah `akun`.

- RPC: `admin_ai_percakapan_daftar`, `admin_ai_pesan_daftar` (audit `baca_teks`),
  gambar lewat fungsi edge `admin-lampiran` jenis `ai` (audit `buka_foto`).
- Dibuka lewat klik tab atau tombol "Buka percakapan Domi"; URL, refresh, dan
  Back tidak membuka otomatis.
- Isi dan foto hidup di memori tab dan dibuang saat tab ditinggal, anak Domi
  habis, kasus berganti, atau subjek berganti. Membuka lagi berarti baca baru
  dan audit baru. Tidak ada tombol tulis, simpan, atau hapus.
- Keadaan simpan draf tidak disimpan server, jadi kartu draf tampil tanpa cap
  TERSIMPAN. Blok yang tidak dikenal tampil sebagai kotak kecil berisi nama
  tipenya. Di bawah jawaban tampil kredit (jawaban baru saja), biaya, token,
  dan model sebagai info admin yang tidak ada di aplikasi.

Pasang (urut): SQL CashFlow, fungsi edge `admin-lampiran`, lalu landing.

## Status WhatsApp OTP

Ringkasan CashFlow menampilkan keadaan singkat, Kesehatan menampilkan rinciannya, dari RPC
`admin_wa_status` (agregat T0, tanpa kasus dan audit). Daftar gangguannya sama dengan gerbang
aplikasi. Menyegarkan tiap 60 detik. Pasang: SQL CashFlow dulu, baru landing. Sebelum SQL
terpasang kartunya menulis status belum bisa dibaca, ubin lain tetap tampil.
Mundur landing cukup; tab menjawab "belum aktif" bila RPC belum terpasang.

### Cara terbalik (pengguna mengirim kode)

Sesudah migrasi cara terbalik terpasang, `admin_wa_status` membawa kunci tambahan dan
Kesehatan menampilkan dua kartu di bawah status:

- **Cara verifikasi WhatsApp.** Mode dari Sakelar (kami kirim kode, pengguna kirim kode,
  keduanya, mati), mode akun uji, nomor tujuan tersamar, balasan otomatis, cara mana yang
  jalan, apa yang sedang menghalangi tiap cara, dan penerus pesan masuk di Sapa. Lapis cara
  yang tidak dipakai mode sekarang tampil redup dan tidak dihitung sebagai sebab.
- **Pesan masuk 24 jam.** Kode dibuat, pesan masuk, cocok, nomor beda, nomor tidak terbaca,
  dan seterusnya, pemakaian batas harian, jendela gangguan 7 hari, dan hitungan pengguna
  (terverifikasi lewat pesan masuk atau kode terkirim, lewat saat gangguan, kredit gratis
  ditahan, nomor dipakai banyak akun).

Keadaan di kartu status dihitung dari cara yang sehat: **Sebagian terganggu** bila satu cara
sakit di mode keduanya (pengguna hanya ditawari cara yang jalan), **Ada gangguan** bila tidak
ada cara sehat (pengguna baru masuk dengan email dan ditandai lewat saat gangguan).

Daftar pengguna mendapat kolom **Status WhatsApp** (terverifikasi lewat pesan masuk atau kode
terkirim, lewat saat gangguan dengan tanggal, belum) dengan tanda kecil nomor dipakai banyak
akun dan kredit gratis ditahan, segmen **Belum WhatsApp** (`p_segmen = belum_wa`, tanpa izin
pii), dan saringan kolom status (`p_filter.status_wa`). Tanpa kontak lengkap, tanggalnya
dibulatkan server ke hari WIB.

Server lama (sebelum migrasi): kartu tambahan tidak tampil, kolom Status WhatsApp kosong,
segmen dan saringannya tidak ditawarkan. Tautan lama `?seg=belum_wa` dijawab server dengan
22023 `saringan`, lalu console kembali ke Semua tanpa galat. Pasang: SQL CashFlow dulu, baru
landing. Mundur landing cukup.

```bash
CASHFLOW_MIGRASI=<repo cashflow>/supabase/migrations CASHFLOW_TOKO=<repo cashflow>/toko \
  npx vitest run tests/cashflow/otp-terbalik.test.ts tests/cashflow/wa-status.test.ts
node scripts/cek-komponen-cashflow.mjs
# Tampilan (data sintetis, Chrome headless, server dev tanpa .env di port 4399):
PLAYWRIGHT_CORE_PATH=<playwright-core/index.mjs> CF_QA_ARTIFACTS=<folder> \
  node scripts/uji-console-otp-terbalik-headless.mjs
```

## Paket kredit Domi

Halaman `/console/cashflow/paket` mengatur paket kredit Domi yang dilihat pengguna di aplikasi
dan di halaman kredit. Sumbernya satu tabel di database CashFlow, jadi perubahan langsung berlaku
tanpa rilis aplikasi. Harga yang ditagih tetap dihitung server saat pembelian dibuat.

- RPC: `admin_ai_paket_daftar` (izin view, tanpa audit), `admin_ai_paket_simpan` dan
  `admin_ai_paket_hapus` (izin pii, audit `set_ai_paket` dan `hapus_ai_paket`). Ketiganya
  memulangkan daftar terbaru beserta jam server, dan status promo dihitung dengan jam itu.
- Simpan menggabung per kode. Paket baru dengan kode yang sudah ada ditolak console sebelum
  dikirim, ubah lewat form memeriksa `diubah` lebih dulu, dan aksi baris (aktif, bawaan, urutan)
  hanya mengirim kolom yang berubah.
- Paket bawaan harus aktif dan bukan khusus uji. Menonaktifkan paket bawaan ikut melepas bawaannya.
- Paket yang pernah dibeli tidak bisa dihapus (23503 `paket_sudah_dibeli`). Dialog hapus lalu
  menawarkan Nonaktifkan.
- Tanpa login ber-TOTP daftar tetap terbaca dan tombol tulis mati. Penolakan tulisan tanpa pii
  (42501 tanpa hint) dibaca console sebagai izin kurang, bukan "bukan admin".
- Produk Google Play (`play_produk_id`, boleh kosong, unik, pola `^[a-z0-9_.]{1,40}$`) menautkan
  paket ke produk sekali beli di Play Console. Kolom Google Play di tabel menulis id-nya atau
  "Belum di Play". Harga Play diatur di Play Console, bukan di console ini, dan harus sama dengan
  harga normal paket. Form hanya mengirim id ini bila berubah, mengosongkannya mengirim null.
  Id yang sudah dipakai paket lain ditolak di kolomnya, dari daftar segar atau dari pelanggaran
  unik server.

Pasang: SQL CashFlow dulu, baru landing. Sebelum SQL terpasang halaman menulis "fitur belum
aktif". Mundur landing cukup. Sebelum migrasi `play_produk_id` terpasang, semua paket tampil
"Belum di Play" dan form tetap menyimpan selama isian Google Play tidak diisi.

```bash
CASHFLOW_MIGRASI=<repo cashflow>/supabase/migrations npx vitest run tests/cashflow/paket.test.ts tests/cashflow/rpc-console.test.ts
node scripts/cek-komponen-cashflow.mjs
```

## Domi: penyedia cadangan

Halaman `/console/cashflow/domi` mengatur penyedia cadangan Domi. Domi dijawab penyedia utama. Bila
penyedia utama bermasalah dan cadangan menyala, server pindah sendiri ke cadangan. Halaman ini
tempat menyalakan cadangan, memilih modelnya, dan mengganti kunci API-nya.

- RPC: `admin_ai_cadangan_baca()`, `admin_ai_cadangan_simpan(p_aktif, p_model)`,
  `admin_ai_cadangan_kunci(p_kunci)`. Ketiganya memulangkan keadaan terbaru dalam bentuk yang sama.
  `p_kunci` null menghapus kunci dan mematikan cadangan.
- Izinnya sama dengan Paket kredit: membaca butuh `cashflow:view`, menulis butuh `cashflow:pii`
  (login console ber-TOTP). Tanpa izin tulis keadaannya tetap terbaca dan semua tombol tulis mati.
- Cadangan tidak bisa dinyalakan selama kunci belum ada. Sakelar dan tombol Simpan mati dengan
  keterangan, dan server menolak dengan `kunci_belum_ada`.
- Kunci API tidak pernah dipulangkan server. Halaman hanya menampilkan sidik dan waktu gantinya.
  Kunci yang diketik hidup di memori halaman saja, dikosongkan sesudah tersimpan dan saat halaman
  ditinggal, dan tidak ditulis ke URL, storage, log, atau pesan galat. Galat server dibersihkan
  dari kunci itu sebelum ditampilkan.
- Mengganti kunci yang sudah ada dan menghapus kunci meminta konfirmasi dulu.
- Galat `model_tidak_dikenal`, `kunci_belum_ada`, dan `kunci_tidak_sah` ditulis dengan kalimat awam.
  Dua yang pertama juga membaca ulang keadaan, karena layar sudah basi.
- Catatan galat penyedia di kartu status dipotong, dan apa pun yang rupanya kunci disamarkan.

Pasang: SQL CashFlow dulu, baru landing. Sebelum SQL terpasang halaman menulis "Belum tersedia di
server", bukan galat. Mundur landing cukup.

Migrasinya sudah tergabung di CashFlow, jadi ketiga RPC tidak lagi ada di `MENDAHULUI_MIGRASI` dan
`rpc-console.test.ts` memeriksanya penuh: nama argumen, blok rpc-console, dan baris kepala di
`toko/uji-console-rpc.sql`. Uji kontrak terhadap migrasi ada di `tests/cashflow/ai-cadangan.test.ts`
(bagian "kontrak migrasi") dan berjalan bila folder `CASHFLOW_MIGRASI` memuat fungsinya. Tanpa folder
itu bagiannya terlihat "skipped". Yang dijaga:

- Ketiga RPC memulangkan dua belas kunci yang sama dengan yang dibaca `adapters/cashflowAiCadangan.ts`.
- Galat isian memakai SQLSTATE 22023, pesannya kode (`model_tidak_dikenal`, `kunci_belum_ada`,
  `kunci_tidak_sah`, `setelan_tidak_sah`), dan hint-nya nama isian (`model`, `aktif`, `kunci`).
  `setelan_tidak_sah` muncul bila nyala/mati dikirim kosong. Halaman tidak pernah mengirimnya, tetapi
  kalimatnya tetap ada supaya admin tidak melihat kode mentah.
- Batas panjang kunci di halaman sama dengan server: awalan `sk-ant-`, seluruhnya 27 sampai 307 aksara.

```bash
CASHFLOW_MIGRASI=<repo cashflow>/supabase/migrations CASHFLOW_TOKO=<repo cashflow>/toko \
  npx vitest run tests/cashflow/ai-cadangan.test.ts tests/cashflow/rpc-console.test.ts
node scripts/cek-komponen-cashflow.mjs
# Tampilan dengan data sintetis (cara menjalankan ada di kepala skrip):
node scripts/uji-console-domi-cadangan-headless.mjs
```

## Pembelian kredit Domi

Halaman `/console/cashflow/pembelian` menjawab siapa yang membeli kredit Domi, paket apa, lewat
Google Play atau QRIS, dan statusnya. Isinya hanya baca, tidak ada tombol tulis.

- RPC: `admin_ai_pembelian_daftar(p_batas, p_sebelum, p_status, p_jalur)`. Terbaru dulu, 50 baris
  per halaman. "Muat lebih banyak" mengirim `lanjut` dari jawaban terakhir sebagai `p_sebelum`.
- Ringkasan di atas (lunas, nominal kotor, perkiraan diterima, batal) dihitung server atas semua
  pembelian yang cocok saringan, tanpa pembelian uji. Halaman menyebutnya di bawah ubin. Pembelian
  uji tetap tampil di daftar, lebih redup dan bercap Uji.
- Saringan status dan jalur ada di URL (`?status=`, `?jalur=`). Nilai yang ditolak server
  (22023 `masukan_tidak_sah`) ditulis dengan kalimat awam.
- Daftar memuat email pembeli, jadi server mencatat setiap panggilan di audit. Halaman tidak memuat
  berkala. Server hanya dipanggil saat halaman dibuka, saringan diganti, atau admin menekan
  Muat ulang, Coba lagi, atau Muat lebih banyak.
- Sesi tanpa izin membuka data pengguna (42501 `izin-kurang`) melihat penjelasan dan jalan keluarnya,
  sama dengan halaman lain yang membuka data pengguna.

Pasang: SQL CashFlow dulu, baru landing. Sebelum SQL terpasang halaman menulis "fitur belum aktif".
Mundur landing cukup.

Uji kontrak terhadap migrasi berjalan begitu fungsinya ada di folder `CASHFLOW_MIGRASI`. Sebelum itu
bagiannya terlihat "skipped", dan `rpc-console.test.ts` melewatinya lewat `MENDAHULUI_MIGRASI`.
Sesudah migrasinya tergabung, hapus namanya dari daftar itu dan pastikan
`toko/uji-console-rpc.sql` di repo CashFlow memuatnya (blok rpc-console dan baris kepala
`admin_ai_pembelian_daftar ← aiPembelianDaftar`).

```bash
CASHFLOW_MIGRASI=<repo cashflow>/supabase/migrations npx vitest run tests/cashflow/pembelian.test.ts tests/cashflow/rpc-console.test.ts
node scripts/cek-komponen-cashflow.mjs
```

### Pembelian Google Play yang sedang diproses atau ditolak

Dua saringan status tambahan, **Sedang diproses** dan **Ditolak**, menjawab pembelian Google Play mana
yang belum menjadi kredit. Datanya dari migrasi CashFlow `20261117140000_play_proses`: RPC yang sama
menerima `p_status` = `diproses` atau `ditolak`, dan barisnya diambil dari catatan proses, bukan dari
pembelian yang sudah tercatat.

- **Baris.** Kode kosong, jalur selalu Google Play, harga yang tertulis harga paket. Kunci tambahan
  `proses` membawa keadaan (`tertunda`, `gagal_sementara`, `ditolak`), sebab penolakan (`rinci`), siapa
  yang terakhir melapor (`sumber`), sejak kapan, kapan terakhir dilaporkan, kapan dan berapa kali server
  mencobanya lagi, dan apakah server masih bisa mencoba sendiri. Halaman tidak pernah menulis kode itu
  mentah: kalimatnya dipilih `kunciKeadaanProses` dan `kunciSebabProses` di
  `adapters/cashflowPembelian.ts`. Nilai yang belum dikenal console jatuh ke kalimat umum, dan baris tanpa
  kunci `proses` tetap tampil dengan status saringannya.
- **Ringkasan.** Empat ubin lunas, total, diterima, dan batal tidak dipakai di dua saringan ini (server
  mengirimnya berisi nol). Gantinya `CashflowPembelianProsesRingkas` dari kunci `proses` jawaban: sedang
  diproses, menunggu pembayaran, belum bisa diperiksa, ditolak, dan sejak kapan yang paling lama menunggu.
  Hitungan ini tanpa akun uji dan tidak mengikuti saringan jalur. Angka yang tidak dikirim tertulis
  "Tidak tersedia", bukan 0.
- **Lebih dari 1 jam** (`AMBANG_GANTUNG_MENIT`). Kalimat yang paling lama naik jadi panel emas lembut, dan
  baris yang menunggu selama itu diberi tanda jam emas. Tidak ada merah. Di saringan Ditolak panel itu
  membawa tombol ke Sedang diproses. Lamanya dihitung dari saat jawaban diterima, jadi angkanya diam sampai
  admin memuat ulang. Tidak ada muat berkala, karena setiap panggilan tercatat di audit.
- **QRIS.** Keadaan ini hanya ada di Google Play. Pilihan QRIS mati di dua saringan itu, dan pindah ke
  saringan proses dari jalur QRIS mengembalikan jalurnya ke Semua. Tautan lama `?status=ditolak&jalur=qris`
  menulis kalimat kosong yang tepat.
- **Server lama.** Sebelum migrasi itu terpasang, server menolak kedua nilai dengan 22023
  `masukan_tidak_sah` hint `status`. Halaman menulis "Saringan ini belum dikenal server" dengan tombol
  **Kembali ke semua status**, bukan galat merah (`prosesBelumDikenalServer`). Urutan rilis bebas.
- **Kesehatan menautkan ke saringan Sedang diproses** sejak migrasi CashFlow
  `20261117170000_kesehatan_play_proses` (bagian di bawah). Ringkasan tidak, karena halaman itu tidak
  memanggil `admin_kesehatan`. Daftar pembelian tetap tidak dipanggil dari Ringkasan maupun Kesehatan,
  karena setiap panggilannya tercatat di audit.

```bash
CASHFLOW_MIGRASI=<repo cashflow>/supabase/migrations npx vitest run tests/cashflow/pembelian-proses.test.ts tests/cashflow/pembelian.test.ts
# Tiga keadaan server (menggantung, kosong, server lama), terang dan gelap, 1440 dan 390
# (cara menjalankan ada di kepala skrip):
node scripts/uji-console-pembelian-proses-headless.mjs
```

`tests/cashflow/pembelian-proses.test.ts` membandingkan kunci baris dan hitungan dengan badan
`admin_ai_pembelian_daftar`, dan nilai keadaan, sebab, serta sumber dengan cek tabel
`ai_pembelian_play_proses` di folder migrasi. Tanpa migrasi itu bagiannya terlihat "skipped". Tabel dan
ringkasannya juga dirender untuk setiap keadaan dan sebab, termasuk yang belum dikenal, di dua bahasa.

### Pembelian Google Play yang menggantung di Kesehatan

Halaman `/console/cashflow/kesehatan` menulis satu baris paling atas, sebelum status WhatsApp: "N
pembelian Google Play sedang diproses, yang paling lama X", dengan tautan **Lihat di Pembelian** ke
`/console/cashflow/pembelian?status=diproses`.

- **Sumber.** Kunci `play_proses` di `admin_kesehatan` (migrasi CashFlow
  `20261117170000_kesehatan_play_proses`): `{diproses, tertunda, gagal_sementara, ditolak, tertua_menit}`.
  Barisnya sama dengan hitungan `proses` di `admin_ai_pembelian_daftar`: tanpa akun uji dan tanpa catatan
  yang kreditnya sudah masuk. Hanya hitungan dan umur dalam menit, tanpa data orang. RPC itu tetap agregat
  dengan gerbang admin yang sama dan tetap tanpa audit, jadi membuka Kesehatan tidak menulis apa pun.
- **Nada.** Menunggu: baris tenang. Yang paling lama lewat `AMBANG_GANTUNG_MENIT` (60 menit, sama dengan
  halaman Pembelian): bidang emas lembut. Tidak ada merah. Nol: kalimat kecil "Tidak ada pembelian Google
  Play yang menggantung", tanpa tautan.
- **Umur** dihitung server saat menjawab, dalam menit penuh, jadi tidak bergantung pada jam peramban.
  Angkanya diam sampai halaman dimuat ulang, sama dengan bagian Kesehatan yang lain.
- **Server lama.** Sebelum migrasi itu terpasang, kuncinya tidak ada dan barisnya tidak tampil, tanpa
  galat. `diproses` yang tidak terbaca (bukan bilangan bulat, atau negatif) juga membuat barisnya tidak
  tampil, bukan 0. Urutan rilis bebas, mundur landing atau SQL saja sama-sama aman.
- Adapter `kePlayProsesKesehatan` dan `keadaanGantung` di `adapters/cashflowPembelian.ts`, komponen
  `CashflowKesehatanPlayGantung`.

```bash
CASHFLOW_MIGRASI=<repo cashflow>/supabase/migrations npx vitest run tests/cashflow/kesehatan-play.test.ts tests/cashflow/kesehatan.test.ts
node scripts/cek-komponen-cashflow.mjs
# Empat keadaan server (menunggu, lebih dari 1 jam, nol, server lama), terang dan gelap, 1440 dan 390,
# plus tautan ke Pembelian (cara menjalankan ada di kepala skrip):
node scripts/uji-console-kesehatan-play-headless.mjs
```

`tests/cashflow/kesehatan-play.test.ts` membandingkan kunci `play_proses` dengan badan `admin_kesehatan`,
memastikan saringan barisnya sama persis dengan hitungan proses `admin_ai_pembelian_daftar`, dan bahwa
badannya tidak mencatat audit. Tanpa migrasi itu bagiannya terlihat "skipped", dan
`tests/cashflow/kesehatan.test.ts` membandingkan contoh tanpa kunci baru.

## Pemakai Domi di daftar pengguna

Daftar pengguna (`/console/cashflow/pengguna`) menjawab siapa yang sudah memakai Domi. Ada dua kolom
untuk itu: **Tanya Domi** (jumlah pertanyaan sejak akun dibuat, dengan baris kecil 30 hari terakhir
atau "Belum pernah") dan **Kredit** (sisa kredit, dengan baris kecil "Pernah beli" atau "Gratis").
Kapan terakhir memakai Domi tidak punya kolom: ia bisa dipakai mengurutkan lewat pilihan **Urut**, dan
tanggalnya ada di rincian pengguna. Akun tim diberi lencana **Tim** di bawah emailnya. Susunan tabelnya
dijelaskan di "Tabel dan daftar area CashFlow".

- RPC: `admin_daftar_pengguna_v4`, argumennya sama persis dengan v3. Per baris bertambah `domi_tanya`,
  `domi_tanya_30`, `domi_tanya_kira`, `domi_terakhir`, `kredit_sisa`, `kredit_beli`, dan `internal`.
- Angka Domi bertanda **+** (misalnya "42+") bila `domi_tanya_kira` benar: orang itu pernah menghapus
  sebagian riwayatnya, jadi angkanya paling sedikit segitu. Keterangannya muncul saat disorot.
- Kredit bergaris, bukan 0, untuk akun yang belum punya catatan kredit sama sekali. Saat diurutkan
  menurut Kredit atau Terakhir pakai Domi, yang kosong selalu di akhir untuk kedua arah.
- Kepala hasil membawa `jumlah_pakai_domi`, yang tampil sebagai kalimat kecil di atas tabel. Angkanya
  dihitung dari seluruh pengguna tanpa akun tim, dan tidak berubah saat mencari, memilih segmen, atau
  menyaring.
- Urutan baru: `p_urut` = `domi`, `domi_terakhir`, `kredit`. Segmen baru: **Pakai Domi**
  (`pakai_domi`) dan **Beli kredit** (`beli_kredit`). Saringan **Akun tim** mengirim
  `p_filter.internal` bernilai `ya` atau `tidak`. Pilihannya ada di panel **Saring**.
- Tanpa izin `cashflow:pii` hitungan Domi dan kredit pulang kosong dan tampil sebagai garis. Urutan
  dan kedua segmen itu mati, sama seperti Ruang, Tx, dan Total nominal. Tautan lama yang membawanya
  kembali ke urutan bawaan. Lencana Tim dan saringan akun tim tetap ada.
- Server lama (v4 belum terpasang): PostgREST menjawab `PGRST202`, lalu halaman membaca daftar lewat v3
  seperti sebelumnya. Kolom, urutan, segmen, saringan akun tim, dan kalimat jumlahnya tidak tampil
  sama sekali. Tautan yang membawa `?urut=domi` atau `?seg=pakai_domi` kembali ke bawaan tanpa galat,
  dan v3 tidak pernah menerima nilai itu. Selama tab yang sama, v4 hanya ditanyai sekali. Sesudah
  migrasinya terpasang, muat ulang halaman supaya kolomnya muncul.
- Tabelnya tidak bergulir ke samping di jendela 1280 px ke atas. Di bawah 1024 px daftar berupa kartu.

Pasang: SQL CashFlow dulu, baru landing. Landing boleh tayang lebih dulu karena jatuh ke v3. Mundur
landing cukup.

Migrasinya sudah tergabung di CashFlow, jadi `admin_daftar_pengguna_v4` tidak lagi ada di
`MENDAHULUI_MIGRASI` dan `rpc-console.test.ts` memeriksanya penuh. `toko/uji-console-rpc.sql` di repo
CashFlow memuatnya di blok rpc-console dan di baris kepala
`admin_daftar_pengguna_v4 ← daftarPenggunaHalamanV4`. Uji kontrak terhadap migrasi ada di
`tests/cashflow/pengguna-domi.test.ts`: nama kolom, nilai `p_urut`, `p_segmen`, kunci `p_filter`, dan
penolakan tanpa izin (hint `izin-kurang`) dicocokkan dengan `adapters/cashflowPenggunaDomi.ts`. Tanpa
folder `CASHFLOW_MIGRASI` bagiannya terlihat "skipped".

Yang tersisa: sesudah v4 terpasang di produksi dan tidak akan dimundurkan, jatuh-mundur ke v3
(`bacaDaftarBerjenjang`, `daftarPenggunaHalaman`, `serverDomi`) boleh dicabut.

```bash
CASHFLOW_MIGRASI=<repo cashflow>/supabase/migrations CASHFLOW_TOKO=<repo cashflow>/toko \
  npx vitest run tests/cashflow/pengguna-domi.test.ts tests/cashflow/rpc-console.test.ts
node scripts/cek-komponen-cashflow.mjs
# Tampilan dengan data sintetis (cara menjalankan ada di kepala skrip):
node scripts/uji-console-pengguna-domi-headless.mjs
```

## Sasaran pengumuman berbasis aturan

Pengumuman bisa dikirim ke penerima **Otomatis dengan aturan**, jadi tidak perlu memilih akun satu per
satu. Penerimanya dihitung server setiap kali aplikasi bertanya, sehingga pendaftar baru yang cocok
ikut menerima.

Cara memakai:

1. Di `/console/cashflow/pengumuman`, Buat pengumuman, lalu pilih penerima **Otomatis dengan aturan**.
2. **Mulai dari** Semua pengguna atau sebuah segmen tersimpan. Untuk Semua pengguna, isi saringan yang
   perlu saja: versi aplikasi (mulai versi, di bawah versi, dan apakah yang versinya tak diketahui ikut),
   tanggal daftar WIB, aktif dalam N hari terakhir, ruang, Domi (pernah pakai, pernah beli kredit,
   kredit habis), dan nomor WhatsApp. Versi memakai nama rilis Play bila kodenya dikenal (`RILIS_PLAY`
   di `adapters/cashflowVersi.ts`), kode lain bisa diketik.
3. **Kecualikan**: "Kecualikan akun internal" bawaannya nyala. Pengguna dan kelompok tertentu bisa
   ditambahkan dengan pemilih yang sama dengan penerima lama.
4. Kotak **Siapa yang menerima** di samping pratinjau menulis jumlah penerima saat ini. Jumlah itu
   sudah mencakup yang belum bisa menerima karena aplikasinya di bawah 1.3.8 dan yang versinya belum
   diketahui, jadi keduanya ditulis sebagai bagian ("Di antaranya 4 belum bisa menerima ..."). Akun
   internal dan pengecualian lain tidak dihitung dan ditulis terpisah, lalu contoh email tersamar.
   Kotak ini disegarkan dengan jeda setiap isian berubah. Batas di server memakai build pertama yang
   membaca `pengumuman_aktif_v3` (1.3.7, tidak pernah di Play), teks console menyebut 1.3.8 karena itu
   rilis Play pertamanya.
5. **Simpan saringan sebagai segmen** menyimpan saringan yang sedang diisi dengan nama. Bila "Pakai
   segmen ini" dicentang, pengumuman merujuk segmennya. Segmen dibaca hidup: mengubah segmen ikut
   mengubah penerima pengumuman yang memakainya.
6. Tombol **Segmen** di kepala halaman membuka daftar segmen: jumlah anggota, dipakai berapa pengumuman
   aktif atau terjadwal, sunting, dan hapus. Segmen yang masih dipakai ditolak server (23503
   `segmen-dipakai`) dan console menulis alasannya di kartu segmen itu.

Tabel pengumuman menulis aturan dalam kalimat awam, misalnya "Semua pengguna, versi di bawah 1.4.1,
kecuali akun internal". Penerima jenis lama (semua, satu, beberapa, kelompok) tidak berubah.

Kartu **Akun internal** di Sakelar mengelola akun milik kita sendiri (pemilik, akun uji, peninjau
Google) yang dikecualikan pengumuman beraturan. Tambah lewat email, ubah jenis dan catatan, atau hapus.
Setiap tulisan beralasan dan beraudit. Email tampil utuh hanya untuk sesi ber-izin pii. Tahap ini hanya
pengumuman yang membaca daftar itu.

Batas yang perlu diingat: pengumuman beraturan hanya sampai ke aplikasi 1.3.8 ke atas
(`pengumuman_aktif_v3`). Aplikasi lebih lama hanya menerima pengumuman Semua pengguna.

RPC: `admin_daftar_pengumuman_v4`, `admin_simpan_pengumuman_v4`, `admin_pratinjau_penerima_pengumuman`,
`admin_daftar_segmen_pengumuman`, `admin_simpan_segmen_pengumuman`, `admin_hapus_segmen_pengumuman`,
`admin_daftar_akun_internal`, `admin_simpan_akun_internal`, `admin_hapus_akun_internal`.

### Urutan rilis

1. **SQL CashFlow dulu**: migrasi sasaran pengumuman dan isi awal akun internal, lewat `toko/sql.sh`
   dengan gladi seperti biasa.
2. **Landing sesudahnya.** Console memeriksa sendiri: bila `admin_daftar_pengumuman_v4` belum ada
   (PGRST202), halaman kembali ke v3, pilihan aturan, tombol Segmen, dan kotak pratinjau penerima tidak
   tampil, dan kartu Akun internal menulis "belum aktif". Jadi landing yang tayang lebih dulu tidak
   rusak, hanya belum menawarkan fitur baru.
3. Sesudah tayang, tambahkan akun internal yang belum ada di isi awal lewat kartu Akun internal.

Mundur landing cukup. Pengumuman beraturan yang sudah terbit tetap dibaca aplikasi lewat server.

Uji kontrak terhadap migrasi berjalan begitu fungsinya ada di folder `CASHFLOW_MIGRASI`. Sebelum itu
bagiannya terlihat "skipped", dan `rpc-console.test.ts` melewatinya lewat `MENDAHULUI_MIGRASI`. Sesudah
migrasinya tergabung, hapus kesembilan nama dari daftar itu dan pastikan `toko/uji-console-rpc.sql` di
repo CashFlow memuatnya (blok rpc-console dan baris kepala metode ke RPC).

```bash
CASHFLOW_MIGRASI=<repo cashflow>/supabase/migrations CASHFLOW_TOKO=<repo cashflow>/toko \
  npx vitest run tests/cashflow/pengumuman-aturan.test.ts tests/cashflow/pengumuman.test.ts tests/cashflow/rpc-console.test.ts
node scripts/cek-komponen-cashflow.mjs
# Tampilan (data sintetis, Chrome headless, server dev tanpa .env di port 4399):
PLAYWRIGHT_CORE_PATH=<playwright-core/index.mjs> CF_QA_ARTIFACTS=<folder> \
  node scripts/uji-console-pengumuman-sasaran-headless.mjs
```

## Batas yang diketahui

- **Console dan halaman publik satu origin (risiko sisa yang disadari, K6).**
  GTM, tag iklan, atau XSS di halaman publik coreasia.id berjalan di origin
  yang sama dengan console. Yang sudah menahannya:
  - token di cookie HttpOnly (tidak terbaca JS);
  - token ikatan dokumen: BFF menolak fetch dari halaman publik walau
    `Sec-Fetch-Site`-nya `same-origin` dan cookie ikut terkirim;
  - console tidak bisa dibingkai (`DENY`, `frame-ancestors 'none'`) dan
    terputus dari opener publik (COOP);
  - HTML console `no-store` dan ber-CSP ketat; sesi CashFlow di sessionStorage
    dihapus setiap kali dokumen publik dimuat, termasuk saat dipulihkan dari
    back/forward cache (pageshow, lalu dimuat ulang);
  - console ber-`Referrer-Policy: no-referrer`, dan plugin GTM mengosongkan
    `page_referrer` yang berjalur console: UUID subjek dan saringan di URL
    console tidak sampai ke GA.

  Yang **tidak** tertutup tanpa origin terpisah:
  - skrip di halaman publik bisa menampilkan form login palsu di coreasia.id,
    dan pengelola sandi bisa mengisinya otomatis karena origin-nya sama
    (phishing satu origin). TOTP membatasi dampaknya, tetapi tidak menahan
    penerusan kode seketika;
  - skrip halaman publik bisa memanggil `POST /api/admin/logout` (tanpa token
    ikatan, sengaja) dan mengeluarkan admin dari peramban itu. Gangguan, bukan
    kebocoran;
  - XSS di dalam dokumen console sendiri tidak tertahan ikatan dokumen; itu
    tugas CSP console;
  - **penanaman sesi di Safari** (session fixation / login-CSRF). Skrip halaman
    publik bisa memasang cookie sesi lewat `document.cookie` di peramban yang
    belum punya sesi console. Isinya pasangan token admin milik penyerang
    (admin nakal atau token curian). Korban lalu membuka `/console`, navigasi
    itu sendiri menerbitkan token ikatan, dan korban bekerja di akun penyerang
    tanpa sadar: API key atau isian yang ia masukkan jatuh ke akun itu. Ikatan
    dokumen tidak menahannya, karena ia menahan penunggangan sesi, bukan
    penanaman. Di Chrome/Edge 140+ dan Firefox 143+ awalan `__Host-Http-`
    menolak cookie tanaman (diuji di peramban nyata: Chrome 153, Chromium 149).
    Safari (WebKit 26.5) belum mendukung awalan itu, jadi di sana penanaman
    masih bisa. Cookie HttpOnly yang sudah ada tidak bisa ditimpa skrip,
    sehingga admin yang sedang login tidak terkena. HMAC atas nilai token di
    cookie pendamping tidak menolong: pemilik token mendapat cookie
    pendampingnya sendiri dari `Set-Cookie` dan ikut menanamnya. Sampai
    origin terpisah ada, admin sebaiknya memakai Chrome, Edge, atau Firefox
    untuk console, dan memeriksa nama dan email akun di menu kanan atas
    console sebelum memasukkan rahasia.

  Penutup tuntasnya origin terpisah (mis. `konsol.coreasia.id`, cookie `__Host-`
  di sana), ditunda sampai admin-next pensiun (keputusan K6). Putuskan dengan
  Master sebelum Fase 1 membuka data pribadi.
- **IP aksi lewat proxy di audit gateway.** `ip_address` untuk aksi console
  yang lewat BFF adalah IP keluar Vercel. IP peramban hanya ada sebagai
  `reported_client_ip` (dilaporkan, tidak diverifikasi) dan di log fungsi
  Vercel. Menjadikannya tepercaya butuh header bertanda rahasia bersama
  BFF–gateway.
- **Pratinjau Vercel.** Login langsung ke gateway butuh origin console di
  `CORS_ORIGINS` gateway. Deployment pratinjau (`*.vercel.app`) tidak ada di
  sana, jadi login console di pratinjau gagal (sama seperti sebelum Fase 0c).
- **Batas fungsi Vercel.** Semua panggilan console selain login melewati fungsi
  Nitro (Singapura).
  - Unggah gambar dibatasi 4 MB di klien. Vercel menolak badan di atas ±4,5 MB
    sebelum sampai ke gateway (batas gateway 5 MB).
  - Panggilan panjang seperti `POST /admin/ai/generate` tunduk pada batas
    durasi fungsi proyek Vercel.

## Hapus akun bertahap (0114) dan pembatas cetak sesi

Hapus akun bertahap memakai migrasi **0114** di repo CashFlow. Nomor 0112
dipakai retensi telemetri dan 0113 aturan ubah. Saat menguji, arahkan
`CASHFLOW_MIGRASI` ke folder migrasi yang sudah memuat 0114 supaya semua
kontrak 0114 ikut dijalankan. Console boleh tayang lebih dulu dari
migrasinya: selama 0114 belum terpasang, daftar pengguna tetap bisa dimuat dan
halaman Hapus akun menulis "Fitur ini belum diaktifkan di server".

Itu keadaan tersendiri (`CashflowKeadaan` jenis `belum-aktif`), bukan galat:
tanpa warna merah, tanpa saringan status, dengan tombol **Periksa lagi**.
Halaman mengenalinya dari jawaban PostgREST `PGRST202` (fungsi tidak ada di
cache skema), atau `42883` yang menyebut RPC itu sendiri. Di tab Jaringan
peramban permintaannya tetap tampak 404. Itu jawaban wajar PostgREST untuk
fungsi yang belum ada, bukan halaman yang rusak. Begitu 0114 terpasang,
**Periksa lagi** atau muat ulang menampilkan daftarnya.

Pembatas cetak sesi (30 per 15 menit per IP) hidup di memori tiap instans.
Jatahnya terpisah dari serah terima login dan bukan kuota terpusat lintas
instans. Permintaan yang ditolak penjaga asal atau ikatan tidak memakai
jatah cetak. Setiap jawaban cetak sesi memakai no-store dan nosniff. Izin
tetap mengikuti peran dan kesegaran MFA. Bila kunci ikatan khusus
(`NUXT_KONSOL_IKAT_KUNCI`) belum dipasang, tiap instans di Vercel mencatat
peringatan sekali; nilainya tidak dicetak dan turunan kunci layanan tetap
dipakai.

## Laporan (`/console/cashflow/laporan`)

Halaman kedua di pintu Ringkasan. Lima bagian, satu terbuka sekali waktu lewat `?bagian=`: Harian
(bawaan), Jam ramai, Dukung CashFlow, Asal pengguna, dan Saldo. Rentang 7, 30, atau 90 hari ada di
`?hari=`. Teks cari saldo tidak pernah masuk URL.

- Harian, Jam ramai, dan Dukung membaca `admin_laporan_harian`, `admin_laporan_jam_ramai`, dan
  `admin_laporan_dukung` (migrasi CashFlow 20261119110000). Izin view, tanpa audit. Angkanya berhenti
  di kemarin menurut WIB, jadi hari ini tidak pernah ikut. Akun tim (akun internal, admin, daftar
  pengecualian Sakelar, akun uji pembelian) tidak dihitung, begitu juga catatan di ruang milik akun tim.
  Transfer dihitung satu catatan, penyesuaian Cocokkan saldo tidak ikut.
- Jam ramai memakai jam HP saat catatan disimpan (`dicatat_pada`), cadangannya jam tiba di server. Peta
  7 hari x 24 jam digambar `CashflowPetaJam` (SVG sendiri, token tema). Di bawah 768 px petanya
  diputar: jam ke bawah, hari ke samping.
- Dukung menghitung ketukan tombol Dukung CashFlow dari telemetri `dukung.ketuk`, yang baru dicatat
  aplikasi 1.4.4. Ketukan di versi sebelumnya tidak pernah tercatat, dan halaman selalu menulis itu.
  QR dibuat, lunas, dan rupiah memakai aturan halaman Dukungan, ditambah tanpa dukungan Play dari akun
  tim.
- Asal pengguna membaca `admin_laporan_asal` dari migrasi aplikasi 1.4.4 (tiket asal pengguna). Selama
  RPC itu belum ada, bagian ini menulis "belum aktif" dan bagian lain tetap jalan. Namanya ada di
  `MENDAHULUI_MIGRASI` sampai migrasinya tergabung di cabang rilis CashFlow.
- Saldo membaca `admin_laporan_saldo` (migrasi 20261119111000): per ruang, atau per pengguna dari ruang
  miliknya saja, dengan kolom terpisah "Ikut ruang lain". Uang nyata = saldo dompet yang tidak diarsip
  dan bukan piutang, sama dengan angka total di aplikasi, dompet minus ikut mengurangi. Butuh izin pii.
  Alasannya tetap dari halaman dan setiap muatan menulis satu baris audit `laporan_saldo`, jadi saldo
  hanya dimuat saat bagiannya dibuka dan cari baru dikirim saat tombol Cari ditekan. Sesi tanpa pii
  melihat ajakan verifikasi dan RPC saldo tidak dipanggil sama sekali.

Pasang: SQL CashFlow dulu (20261119110000, lalu 20261119111000, masing-masing dengan gladi dari repo
CashFlow), baru landing. Landing boleh tayang lebih dulu: bagian yang RPC-nya belum ada menulis "belum
aktif". Mundur landing cukup.

```bash
CASHFLOW_MIGRASI=<repo cashflow>/supabase/migrations CASHFLOW_TOKO=<repo cashflow>/toko \
  npx vitest run tests/cashflow/laporan.test.ts tests/cashflow/navigasi.test.ts tests/cashflow/rpc-console.test.ts
node scripts/cek-komponen-cashflow.mjs
# Tampilan dengan data sintetis (cara menjalankan ada di kepala skrip):
node scripts/uji-console-laporan-headless.mjs
```

## Perjalanan pengguna dan corong WhatsApp

Terapkan kedua migrasi CashFlow sebelum merilis landing. Perjalanan memakai ranah
`jejak` pada kasus Pengguna 360. Audit `baca_perjalanan` mencatat setiap halaman
yang dibaca dari server. Saringan dan jam memakai WIB. Periksa tonggak
`nomor_wa.tersimpan` untuk konfirmasi resmi ketika aplikasi tidak sempat mencatat
keberhasilan. Tombol Salin jejak membawa label, jam, dan rincian yang sedang terbuka.

Corong WhatsApp menghitung satu orang per langkah dan menampilkan hitungan
peristiwa aplikasi secara terpisah. Isi jam akhir WIB untuk mengulang potret pada
jam tertentu. Pilih cara dan versi untuk memeriksa pecahannya.
Angka berhenti dapat dibuka oleh pemegang izin baca pribadi. Pilih urutan orang dan
isi alasan. Server menilai kembali hasilnya saat membuka kasus dan menulis audit
`baca_corong`. Tautan membawa rentang yang sama ke Perjalanan.

Untuk verifikasi lokal, gunakan `scripts/uji-console-peristiwa-headless.mjs`
dengan Nuxt dev di loopback dan kredensial sintetis. Periksa kondisi 1440 dan 390,
terang dan gelap, termasuk tab aktif di ponsel, kursor, salinan, dan akses agregat.

## Tema dan navigasi area CashFlow

Halaman CashFlow di console memakai tema aplikasi CashFlow (terang dan gelap).
Bagian console lain, sidebar, dan bilah atas tetap memakai warna console.

- **Cakupan.** `CashflowNav` (ada di setiap halaman modul) memanggil
  `useCashflowTema`, yang memasang kelas `cf-area` di `<body>`. Aturan di
  `assets/css/cashflow-tema.css` hanya berlaku di bawah kelas itu, pada isi
  halaman (`.ca-console-main`) dan lapisan yang dipindah ke `<body>` (modal,
  laci, palet, toast). Kelasnya lepas sendiri saat pindah ke modul lain.
- **Token.** Komponen tetap memakai `var(--ca-*)` dan kelas `.ca-*` bersama.
  Di dalam cakupan nilai `--ca-*` dibaca dari token `--cf-*`. Mengganti warna
  cukup di berkas itu. Token `--cf-*` harus warna padat (hex), karena
  `tests/cashflow/tema-kontras.test.ts` menghitung kontras tiap pasangan teks
  dan latar dari berkas yang sama (minimal 4,5:1).
- **Navigasi.** Lima pintu dan halaman di dalamnya ditulis sekali di
  `utils/cashflow/navigasi.ts`, dipakai `CashflowNav` dan `CashflowPalet`.
  Halaman baru di `pages/console/cashflow/` wajib didaftarkan di sana.
  `tests/cashflow/navigasi.test.ts` gagal bila ada halaman tanpa tempat di
  menu. Alamat halaman tidak berubah.
- **Kepala halaman.** Halaman CashFlow memakai `ConsolePageHeader` dengan prop
  `ringkas`: navigasi di atas, lalu judul dan aksi dalam satu baris. Tanpa prop
  itu komponennya tampil seperti semula, jadi modul lain tidak terpengaruh.

```bash
npx vitest run tests/cashflow/navigasi.test.ts tests/cashflow/tema-kontras.test.ts
node scripts/cek-komponen-cashflow.mjs
# Tampilan dengan data sintetis (cara menjalankan ada di kepala skrip):
node scripts/uji-console-kerangka-headless.mjs
```

Skrip itu juga memeriksa bahwa gaya sidebar dan bilah atas sama di dalam dan di
luar CashFlow. Dengan `CF_QA_DASAR=1` di cabang pembanding, lalu tanpa variabel
itu di cabang kerja ke folder yang sama, potret halaman console di luar
CashFlow dibandingkan piksel demi piksel dengan potret dasarnya. Selisih
sampai 2/255 per kanal dianggap derau render, lebih dari itu gagal.

## Tabel dan daftar area CashFlow

Semua tabel dan daftar di halaman CashFlow memakai rupa dan komponen yang sama.

- **Rupa tabel.** Diatur sekali di `assets/css/cashflow-tema.css`: kepala kolom satu baris dan tidak
  huruf besar semua, sorot baris, dan angka tabular. Berlaku untuk `DataTable` console di dalam area
  CashFlow (Pengguna, Ruang, Pengumuman) dan untuk tabel berkelas `cf-tabel`. Tabel baru memakai
  `CashflowTabel` (bingkai, gulir samping, kaki). Di dalam sel: `cf-dua` untuk baris kedua yang lebih
  kecil, `cf-ka` untuk angka rata kanan, `cf-kuat` untuk nilai utama. `DataTable` di luar CashFlow
  tidak berubah.
- **Keadaan.** `CashflowKeadaan` menulis lima keadaan: memuat (kerangka baris), kosong (sebab dan jalan
  keluarnya), galat (dengan Coba lagi), akses terbatas, dan belum aktif di server (fiturnya belum
  dipasang, lihat "Hapus akun bertahap"). Urutannya ada di
  `utils/cashflow/keadaan.ts`: baris yang sudah tampil bertahan saat memuat ulang, dan muatan yang
  gagal tidak pernah ditulis sebagai "belum ada data". `CashflowIzinKurang` memakai rupa akses terbatas.
- **Pil segmen.** Hanya `CashflowSegmen`. Hitungan di samping label ditulis bila angkanya memang sudah
  ada (`jumlah`). Di daftar pengguna itu berarti hanya segmen yang sedang tampil, tanpa kata cari dan
  saringan, karena server tidak mengirim hitungan per segmen.
- **Daftar pengguna.** Tujuh kolom dan panah ke rincian: Pengguna, WhatsApp, Versi, Aktif terakhir,
  Tanya Domi, Kredit, Ruang. Lebar kolomnya tetap dan kolom Pengguna mengambil sisanya, jadi email 38
  huruf muat utuh di jendela 1440 px tanpa gulir samping.
  - **Urut.** Satu pilihan di atas tabel memuat semua nilai `p_urut`, termasuk yang tidak punya kolom
    (tanggal daftar, jumlah transaksi, total nominal, terakhir pakai Domi). Saat salah satunya dipakai,
    nilainya ditulis kecil di baris kedua kolom terdekat. Kepala kolom tetap bisa diklik.
  - **Saring.** Saringan kolom pindah ke satu panel. Kunci dan nilai `p_filter` tidak berubah.
  - Parameter URL tidak berubah (`?seg`, `?urut`, `?arah`, `?hal`), jadi tautan lama tetap bekerja.
    Pemetaannya ada di `adapters/cashflowPenggunaDaftar.ts`.
  - Sakelar **Kontak lengkap** pindah ke baris judul. Perilaku dan pencatatan auditnya tidak berubah.
  - Keterangan kolom pindah ke tautan **Arti tiap kolom** di samping paginasi.
- **Yang pindah ke rincian pengguna.** Terakhir pakai Domi, cara nomor dibuktikan (kalimat panjangnya),
  ID akun, dan masuk terakhir tampil di kepala Pengguna 360.
  - **Dari kepala sendiri, bila server mengirimnya.** Migrasi CashFlow `20261117130000` menambah empat
    kunci ke `admin_pengguna_kepala`: `status_wa`, `status_wa_pada`, `domi_tanya`, `domi_terakhir`.
    Rumusnya sama dengan baris `admin_daftar_pengguna_v4`, dan kedua waktunya dibulatkan server ke awal
    hari WIB. Dengan kunci itu kepala selalu terisi, juga saat rincian dibuka lewat tautan langsung, dan
    ada satu baris tambahan **Tanya Domi** berisi jumlah pertanyaan. Tanpa izin data pribadi server
    mengirim dua kunci Domi sebagai null, dan barisnya menulis garis (butuh TOTP).
  - **Server lama tetap jalan.** Keempat kunci dibaca sebagai opsional (`keKepala`). Selama migrasinya
    belum terpasang, kuncinya tidak ada dan halaman tampil seperti sebelumnya: dua baris itu memakai
    nilai yang dibawa dari baris daftar di tab yang sama (`useCashflowBawaanRinci`, tanpa email, nama,
    atau nomor), kosong dengan keterangan bila dibuka langsung, dan baris Tanya Domi tidak ditulis.
    Aturan memilih sumbernya ada di `rinciKepala` (`adapters/cashflowPenggunaDaftar.ts`).
  - Tanda nomor dipakai banyak akun, kredit gratis ditahan, dan sebab lewat tidak dikirim kepala.
    Ketiganya tetap dipinjam dari baris daftar, hanya bila statusnya sama dengan yang dikirim kepala.
  - Urutan rilis bebas. Console ini boleh tayang sebelum atau sesudah migrasinya, dan migrasinya boleh
    dimundurkan tanpa menyentuh console.

```bash
npx vitest run tests/cashflow/tabel-pil.test.ts tests/cashflow/pengguna-daftar.test.ts
node scripts/cek-komponen-cashflow.mjs
# Tampilan dengan data sintetis (cara menjalankan ada di kepala skrip):
node scripts/uji-console-tabel-daftar-headless.mjs
# Kepala Pengguna 360 di server baru (empat kunci) dan server lama (tanpa kunci):
node scripts/uji-console-kepala-rinci-headless.mjs
```

Skrip itu menuntut gulir samping tabel pengguna 0 di 1440 px, email 38 huruf utuh, dan tidak ada
halaman yang meluber di 390 px. `tests/cashflow/pengguna-daftar.test.ts` membandingkan parameter yang
dikirim pilihan Urut dan panel Saring dengan yang dikirim kepala kolom sebelumnya, untuk semua
kombinasi. Uji komponen (`tabel-pil.test.ts`) merender berkas `.vue` lewat `sfcUntukUji` di
`vitest.config.ts`, tanpa memuat Nuxt.

## Halaman rinci, Domi, dan kartu ponsel

- **Tab rincian.** `CashflowTab` (Pengguna 360 dan Ruang 360) memakai rupa yang sama dengan baris kedua
  navigasi: garis bawah untuk tab aktif, hitungan di lencana kecil. Di ponsel barisnya menempel di atas
  dan digeser ke samping. Alamat tab, pintasan angka, dan penandaan aktivasi tidak berubah.
- **Kepala rincian.** `CashflowKepala360` dan `CashflowKepalaRuang`: nama besar (email dipotong di depan
  `@` supaya di ponsel tidak pecah di tengah kata), lencana status, tombol salin di kanan, lalu deret
  fakta berlabel kecil. Gayanya di `assets/css/cashflow-tema.css` (`cf-kepala-nama`, `cf-kepala-fakta`,
  `cf-lencana`).
- **Judul kecil dan kepala tabel.** Tidak ada lagi huruf besar semua di area CashFlow. Judul kecil di
  dalam kartu memakai `cf-subjudul`, kepala tabel kecil di dalam kartu memakai `cf-kepala-polos` di
  barisnya. Satu-satunya pengecualian jawaban Domi (`CashflowDomi*`), yang sengaja meniru tampilan
  aplikasi.
- **Kartu ponsel.** Di bawah 640 px daftar Ruang, Audit, Pembelian, Aktivitas, Dukungan, Paket kredit,
  dan Pengumuman tampil sebagai kartu, satu per baris, dengan isi dan aksi yang sama. Tabelnya tetap
  dipakai di layar yang lebih lebar. Rincian uang dan waktu Google Play pada pembelian hanya ada di
  tabel.
- **Setelan kabar per ruang** (Pengguna 360, tab Kabar) berupa daftar: nama ruang, kabar yang nyala,
  kabar yang mati, lalu tingkat, jendela gabung, ambang, dan jam rangkuman. Tidak ada lagi tabel
  sebelas kolom.
- **Aktivitas tanpa izin data pribadi.** Daftarnya tetap terbaca, tombol Selidiki mati, dan
  `CashflowIzinKurang` menulis jalan keluarnya. Dukungan hanya butuh izin lihat, jadi tidak punya
  bagian terkunci.
- **Ditangguhkan sampai kapan.** Lencana di kepala Pengguna 360 menulis tanggalnya dari `banned_until`.
  Tanggal yang lebih dari lima tahun lagi tidak ditulis (penangguhan tanpa batas).
- **Domi.** `CashflowDomiMaskot` adalah gambar diam Domi. Ia hanya dipakai di tiga tempat: sapaan
  Ringkasan, kepala halaman Cadangan Domi, dan keadaan kosong sebuah daftar (`CashflowKeadaan` jenis
  kosong). Tidak di tabel, galat, konfirmasi, atau saat memuat. Hanya Domi di sapaan yang bergerak
  pelan, dan gerak itu mati bila perangkat meminta gerak dikurangi. `tests/cashflow/domi-maskot.test.ts`
  menjaga daftar pemakainya.
- **Sapaan Ringkasan.** Judul Ringkasan menyapa menurut jam WIB, lalu satu kalimat keadaan dari data
  yang sudah dimuat halaman itu (status kode WhatsApp dan jumlah pengguna). Tidak ada panggilan server
  tambahan: `CashflowStatusWa` mengabarkan tingkatnya lewat peristiwa `tingkat`. Aturannya di
  `utils/cashflow/sapaan.ts`.
- **Tanda versi di daftar pengguna.** Tanda "belum diperbarui" hanya untuk versi di bawah rilis publik
  terbaru. Pembandingnya `pembandingVersi` di `adapters/cashflow.ts`: versi pra-rilis (`-internal`,
  `-uat`, `-rc`) dan build yang hanya dilaporkan akun tim tidak dihitung. Untuk Android pembandingnya
  `RILIS_PLAY_TERAKHIR` di `adapters/cashflowVersi.ts`, jadi tetapan itu tetap wajib dinaikkan di
  setiap rilis Play.

```bash
npx vitest run tests/cashflow/domi-maskot.test.ts tests/cashflow/versi-pembanding.test.ts
# Potret semua halaman CashFlow dengan data sintetis, terang dan gelap, 1440 dan 390:
node scripts/uji-console-halaman-headless.mjs
# Tabel tetap tampil saat sort, cari, pindah halaman, dan ganti sakelar kontak:
node scripts/uji-console-tabel-stabil-headless.mjs
```

`uji-console-halaman-headless.mjs` memotret semua halaman dan tab rincian (juga keadaan kosong, tanpa
izin data pribadi, dan Hapus akun saat RPC-nya belum ada di server), lalu mencatat halaman yang meluber,
kepala kolom yang pecah atau huruf besar
semua, kartu yang melewati tepi di 390 px, dan tabel yang bergulir ke samping di 1440 px. Datanya di
`scripts/data-sintetis-console.mjs`. `CF_QA_HANYA='<regex nama>'` memotret sebagian halaman saja,
`CF_QA_LUNAK=1` mencetak temuan tanpa menggagalkan.

## Pemeriksaan tipe

`vue-tsc --noEmit` di folder landing selalu keluar 0 tanpa memeriksa apa pun. `tsconfig.json` di akar
berisi `"files": []` dan hanya menunjuk `.nuxt/tsconfig*.json` lewat `references`, yang baru diikuti
dengan `-b`. Pakai skrip ini, yang menunjuk proyeknya langsung:

```bash
npx nuxi prepare
node scripts/cek-tipe-console.mjs          # atau: npm run cek:tipe
node scripts/cek-tipe-console.mjs --rinci  # cetak juga galat lama di berkas console
```

- Skrip menolak jalan bila berkas console tidak ikut diperiksa (pemeriksaan hampa).
- Galat lama dicatat di `scripts/tipe-console-dasar.json` dan tidak menggagalkan. Galat baru
  menggagalkan (kode keluar 1). Sidiknya tanpa nomor baris, jadi menyisipkan baris tidak terbaca sebagai
  galat baru.
- Sesudah memperbaiki galat lama, tulis ulang catatannya dengan `--tulis` dan commit berkasnya.
- `vue-tsc` tidak tercantum di `package.json`. Skrip mencarinya di `VUE_TSC`, lalu
  `node_modules/.bin`, lalu `npx` dengan versi yang dikunci di kepala skrip.

## Sesudah deploy: berkas build dan tembolok

### Yang pernah terjadi

Beberapa menit sesudah sebuah push ke master, berkas `/_nuxt/<hash>.js` milik build baru sempat
dijawab 404, dan 404 itu membawa `cache-control: public, max-age=31536000, immutable`. Peramban
yang membuka console pada saat itu menyimpan 404-nya, jadi console tampil tanpa menu sampai
tembolok dihapus. CDN di depan ikut menyimpannya (`cf-cache-status: HIT`).

Yang terbukti dari konfigurasi:

- `routeRules['/_nuxt/**']` di `nuxt.config.ts` memberi header itu. Preset Vercel milik Nitro
  menuliskannya ke `.vercel/output/config.json` sebagai rute sebelum `handle: filesystem`, dan
  rute di fase itu menempel pada jawaban apa pun untuk jalur yang cocok, tanpa melihat status.
  Preset menulis aturan serupa sendiri untuk semua folder aset publik.
- Landing dirilis oleh integrasi Git Vercel dari push ke master. Repo ini tidak memakai
  `vercel deploy --skip-domain`, `promote`, atau perlindungan beda versi (skew protection).
- Untuk 404 yang dijawab fungsi, header dari fungsi yang menang, bukan header rute. Sebelum
  perbaikan fungsi tidak mengirim cache-control yang tegas untuk permintaan dari peramban, lalu
  CDN menggantinya dengan umur tembolok peramban bawaannya (terukur `max-age=14400` pada 404
  berakhiran `.js`). Jadi 404 tersimpan berjam-jam di peramban walau tanpa `immutable`.

Yang masih dugaan:

- Kenapa HTML build baru sempat merujuk berkas yang belum terjawab 200. Pergantian deployment
  di Vercel mestinya serentak. Dugaan terkuat: selama pergantian, permintaan HTML dan
  permintaan berkas dilayani keadaan yang berbeda di tepi, dan jawaban 404 saat itu tidak datang
  dari fungsi (404 dari fungsi tidak membawa `immutable`, lihat butir di atas). Ini tidak bisa
  diulang dari luar.
- Sekali satu 404 ber-`immutable` lewat, CDN menyimpannya sesuai header itu. Itu yang
  memperpanjang gangguan dari hitungan detik menjadi menit, dan menjelaskan `HIT`.

### Yang diubah

- `nuxt.config.ts`: aturan `'/_nuxt/**'` dicabut dari `routeRules`. Kait `nitro:init` menulis
  ulang `config.json` Vercel lewat `server/lib/aset/rute-vercel.ts`: tembolok setahun hanya di
  fase `hit` (berkas ditemukan), `no-store` di fase `miss`, dan tidak ada lagi cache-control
  untuk `/_nuxt` di fase awal. Kalau susunan rute preset berubah, build gagal dengan pesan jelas.
- `server/middleware/aset-hilang.ts`: berkas build yang tidak ada dijawab 404 polos dengan
  `cache-control: no-store`.
- `utils/pulih-chunk.ts`: skrip kecil di `<head>` semua halaman. Bila berkas build gagal dimuat,
  ia meminta ulang berkas itu dengan melewati tembolok peramban, lalu memuat ulang halaman satu
  kali. Dokumen hasil muat ulang itu tidak pernah memuat ulang dirinya lagi. Kesempatan kedua
  hanya diberikan bila permintaan ulang membuktikan berkasnya sudah 200, dan tidak ada yang
  ketiga dalam sepuluh menit.

Batasnya, supaya tidak salah harap:

- Fase `hit` dan `miss` hanya bisa dibuktikan di Vercel. Build lokal membuktikan isi
  `config.json` dan jawaban fungsi, bukan perilaku tepi.
- Di server Node (Docker, `nuxi preview`) berkas yang tidak ada dijawab penangan aset Nitro:
  404 dengan `no-cache` atau `max-age=0, must-revalidate`, bukan `no-store`. Tetap tidak awet.
- Pengaman klien tidak bisa menembus 404 yang disimpan CDN. Untuk itu lihat usulan di bawah.
- Folder `/_fonts` masih memakai aturan lama. Nama berkasnya tidak berganti di tiap rilis, jadi
  tidak ikut masalah ini.

### Pemeriksaan sesudah deploy

Tunggu sampai deployment di Vercel berstatus Ready, lalu dua menit lagi. Sesudah itu:

```bash
# 1. Berkas yang tidak ada: 404, no-store, dan CDN tidak menyimpannya.
u="https://coreasia.id/_nuxt/periksa-$(date +%s).js"
curl -sI "$u" | grep -iE '^HTTP|^cache-control|^cf-cache-status'
curl -sI -A 'Mozilla/5.0' "$u" | grep -iE '^HTTP|^cache-control|^cf-cache-status'
# Harapan, dua-duanya: HTTP/2 404, cache-control: no-store,
# cf-cache-status: BYPASS atau DYNAMIC. Yang salah: HIT, atau cache-control berisi max-age.

# 2. Semua berkas build yang dirujuk halaman login console: 200 dan immutable.
for f in $(curl -s https://coreasia.id/console/login | grep -oE '/_nuxt/[A-Za-z0-9_.-]+\.(js|css)' | sort -u); do
  printf '%s  ' "$f"
  curl -sI "https://coreasia.id$f" | grep -iE '^HTTP|^cache-control' | tr -d '\r' | tr '\n' ' '
  echo
done
# Harapan tiap baris: HTTP/2 200  cache-control: public, max-age=31536000, immutable

# 3. Manifest build tetap berumur pendek.
curl -sI https://coreasia.id/_nuxt/builds/latest.json | grep -iE '^HTTP|^cache-control'
# Harapan: HTTP/2 200, cache-control: public, max-age=1, immutable

# 4. Skrip pengaman ada di HTML dan CSP console tetap ber-hash.
curl -s https://coreasia.id/console/login | grep -c '__caPulihChunk'          # 1
curl -sI https://coreasia.id/console/login | grep -io "script-src[^;]*"       # berisi 'sha256-…', tanpa 'unsafe-inline'
```

Ulangi langkah 2 sepuluh menit kemudian. Rilis pertama yang membawa perubahan ini sebaiknya
diperiksa dulu di deployment pratinjau cabangnya (alamat `*.vercel.app`, tanpa CDN di depan)
dengan langkah 1 dan 2, sebelum digabung ke master.

Membaca hasilnya:

- Langkah 2 menunjukkan 404 untuk berkas yang dirujuk HTML: itu kejadian yang sama. Minta ulang
  setelah satu menit. Kalau `cf-cache-status: HIT`, 404-nya tersimpan di CDN: hapus alamat itu
  dari tembolok CDN (Purge by URL), lalu periksa lagi.
- Langkah 2 menunjukkan 200 tetapi cache-control bukan `immutable`: fase `hit` tidak bekerja
  seperti yang diharapkan. Situs tetap benar, hanya lebih lambat karena berkas divalidasi ulang
  di tiap kunjungan. Tidak perlu mundur, catat dan perbaiki.
- Langkah 1 menunjukkan `max-age=14400` atau angka lain: CDN masih mengganti header 404.
  Terapkan usulan di bawah.

### Pengguna melihat console tanpa menu

1. Minta ia membuka ulang halamannya sekali. Pengaman klien meminta ulang berkas yang gagal dan
   memuat ulang sendiri bila berkasnya sudah benar di server.
2. Belum pulih: muat ulang paksa, Ctrl+Shift+R (Windows/Linux) atau Cmd+Shift+R (Mac).
3. Masih belum: jalankan langkah 2 di atas. Kalau ada berkas yang 404 atau `HIT` berisi 404,
   masalahnya di server atau CDN, bukan di peramban pengguna. Hapus alamat itu dari tembolok
   CDN, lalu ulangi dari nomor 1.
4. Jalan terakhir di peramban: hapus data situs untuk coreasia.id (ikon gembok di bilah alamat,
   Setelan situs, Hapus data). Ia perlu login lagi.

### Usulan untuk CDN (belum diterapkan)

Perubahan di repo ini tidak menyentuh setelan CDN. Tiga hal yang layak dipasang di sana:

1. Aturan tembolok untuk jalur yang diawali `/_nuxt/`: umur tembolok tepi mengikuti header asal,
   dengan pengecualian per status, yaitu status 400 sampai 599 tidak disimpan sama sekali.
2. Untuk jalur yang sama, umur tembolok peramban mengikuti header asal (Respect Existing
   Headers), supaya `no-store` pada 404 tidak diganti umur bawaan.
3. Dalam daftar periksa rilis: bila langkah 2 pernah menunjukkan 404, hapus alamat itu dari
   tembolok CDN sebelum memberi tahu pengguna.

### Uji lokal

```bash
npx vitest run tests/public/tembolok-aset.test.ts tests/public/pulih-chunk.test.ts tests/cashflow/muat-ulang-bersih.test.ts
# Isi config.json Vercel: fase miss dan hit ada, fase awal tanpa cache-control untuk /_nuxt.
NITRO_PRESET=vercel npx nuxi build
node -e 'const r=require("./.vercel/output/config.json").routes;let f="awal";for(const x of r){if(x.handle){f=x.handle;continue}if(/_nuxt/.test(x.src))console.log(f,x.src,JSON.stringify(x.headers))}'
# Pengaman klien di Chrome headless (cara menjalankan ada di kepala skrip):
node scripts/uji-pulih-chunk-headless.mjs
```
