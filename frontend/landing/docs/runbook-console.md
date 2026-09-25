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
    itu: per id admin gateway (`admin_konsol_sesi_cabut_admin`, 0092) dan per
    email (`admin_konsol_sesi_cabut_pelaku`, untuk sesi yang dicetak sebelum
    0092). Lihat "Identitas admin di CashFlow" di bawah.
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
  - Sesi yang dicetak landing sebelum 0092 tidak punya `admin_gw_id` dan
    tetap dilayani dengan kunci email sampai kedaluwarsa (≤ 12 jam). Karena
    itu setiap jalur pencabutan SESI memanggil kedua RPC: per id dan per email.
  - Kasus ditutup per id saja (`admin_kasus_tutup_admin`) bila id diketahui.
    `admin_kasus_tutup_pelaku` hanya dipanggil untuk pemilik tanpa id (sesi
    lama): menutup per label bisa mematikan kasus aktif admin lain yang pernah
    memakai email itu. Kasus lama tanpa id tetap mati aksesnya lewat
    pencabutan sesi, dan umurnya ≤ 2 jam.
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
2. **Super admin mencabut sesi admin lain** (belum ada tombolnya di console):
   ```bash
   curl -s -X POST "$GW/admin/users/<id>/revoke-sessions" -H "Authorization: Bearer $TOKEN"
   ```
   - Pelaku yang memegang sandi masih bisa login ulang. Ganti juga sandinya dari
     halaman Users (atau `PUT $GW/admin/users/<id> {"password": …}`), yang ikut
     mencabut sesi.
   - Authenticator dicurigai dipasang orang lain:
     `curl -s -X POST "$GW/admin/users/<id>/totp/reset" -H "Authorization: Bearer $TOKEN"`.
     Target ber-TOTP butuh sesi kuat (lihat README gateway).
   - **Langkah 1 wajib** setiap kali yang dicabut admin lain: dari console,
     sesi CashFlow hanya dicabut otomatis untuk akun milik pemanggil.
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
logout-all, TOTP diaktifkan/dimatikan, atau akun sendiri diubah) sudah
menjalankan keempat RPC itu untuk admin itu. Langkah ini tetap wajib karena
pelaku tidak akan menekan tombol keluar, dan karena mencabut atau
menonaktifkan admin LAIN tidak mencabut sesi CashFlow-nya.

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
- Rollback landing paket A ke `33b4502` aman selama 0092 tetap ada. Jangan
  me-rollback 0092 selagi landing paket A tayang.
- **Rilis berikutnya sesudah paket A: buang jalur email.** Begitu landing
  paket A tayang lebih dari 12 jam, tidak ada lagi sesi tanpa `admin_gw_id`
  yang hidup. Pemanggilan `admin_konsol_sesi_cabut_pelaku` dan
  `admin_kasus_tutup_pelaku` di `server/lib/konsol/cashflow-cabut.ts` lalu
  tidak berguna, dan cabut sesi per email masih bisa mengenai sesi admin lain
  yang memakai email itu. Hapus keduanya dari landing (RPC-nya tetap ada di
  SQL untuk runbook "Token console bocor").
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

Di Vercel, header routeRules dipasang di tepi. Rute `/console/**` sengaja
tidak memuat CSP statis. Kalau `curl -I` di atas menunjukkan CSP
`'unsafe-inline'` milik `/**`, berarti CSP ber-hash dari fungsi tertimpa.
Laporkan: console tetap berjalan, tetapi tanpa CSP ketat.

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
