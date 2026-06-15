# Deploy CoreAsia Gateway ke VPS Produksi (`api.coreasia.id`)

Runbook ini menjelaskan cara men-deploy **CoreAsia Gateway** (Go / Fiber v3) ke
**VPS baru yang khusus/terisolasi** untuk CoreAsia/CAD. Polanya sama dengan VPS
produk CoreAsia lain (mis. `primesotech`): image `ghcr.io/decade23/<produk>`
dijalankan via `docker compose` di VPS, bersama Postgres + Redis + Caddy.

> Org GitHub: **Decade23**. Image: **`ghcr.io/decade23/coreasia-gateway:latest`**.

File yang dipakai (sudah dibuat di repo):
- `backend/gateway/Dockerfile` — image produksi multi-stage.
- `docker-compose.prod.yml` — stack lengkap (gateway + postgres + redis + caddy).
- `Caddyfile` — reverse proxy + auto-HTTPS untuk `api.coreasia.id`.
- `.env.prod.example` — template env (copy → `.env.prod`).

---

## a. Rekomendasi VPS

**Spesifikasi minimum yang nyaman: 2 vCPU / 4 GB RAM / 50–80 GB SSD.**
(Stack kira-kira pakai ~1,5 GB RAM; 4 GB memberi ruang untuk lonjakan + build
jika sewaktu-waktu build di VPS.)

**Region: Singapura (utama) atau Jakarta.**
- **Singapura** — latensi rendah untuk user ID *dan* global; opsi mudah:
  **Vultr / DigitalOcean / Linode (Akamai)** punya region SGP.
- **Jakarta** — paling rendah latensi untuk user Indonesia: **IDCloudHost** atau
  **Biznet Gio**. Pilih ini kalau target hampir 100% user ID.

**Kenapa VPS terisolasi (terpisah dari VPS produk lain):**
CAD adalah produk *gray-area* (downloader) yang ditolak banyak Merchant-of-Record
/ payment besar. Mengisolasinya di VPS sendiri = **karantina**: kalau ada
keluhan/abuse/takedown terkait CAD, dampaknya tidak menyeret produk CoreAsia
lain (Sapa, LMS, dll.) yang sehat. IP, reputasi, dan tanggung jawab terpisah.

---

## b. Persiapan VPS

SSH masuk sebagai root pertama kali, lalu:

```bash
# 1) User non-root dengan sudo
adduser deploy
usermod -aG sudo deploy

# 2) SSH key-only (copy public key kamu ke user deploy)
mkdir -p /home/deploy/.ssh
# tempelkan public key ke /home/deploy/.ssh/authorized_keys
chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

# 3) Matikan password login & root login (di /etc/ssh/sshd_config):
#    PasswordAuthentication no
#    PermitRootLogin no
systemctl restart ssh

# 4) Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# 5) Docker + compose plugin (skrip resmi Docker)
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy
# logout/login agar grup docker aktif untuk user deploy
docker compose version   # verifikasi plugin compose ada
```

Lanjut sebagai user `deploy` untuk langkah berikutnya.

---

## c. Cloudflare DNS

Buat A record:

| Type | Name | Content        | Proxy            |
|------|------|----------------|------------------|
| A    | api  | `<IP_VPS>`     | lihat di bawah   |

Pilih **salah satu** mode TLS (detail lengkap ada di komentar dalam `Caddyfile`):

- **Opsi A — DNS only (grey cloud):** paling simpel. Caddy mengurus
  Let's Encrypt sendiri (challenge langsung di port 80/443). Konsekuensi: IP
  origin terlihat publik (tanpa proxy/WAF Cloudflare).
- **Opsi B — Proxied (orange cloud) + Cloudflare Origin Certificate:** Caddy
  **tidak bisa** Let's Encrypt lewat proxy → terbitkan *Origin Certificate* di
  Cloudflare, pasang di VPS, dan ubah blok `api.coreasia.id` di `Caddyfile`
  pakai `tls /etc/caddy/origin-cert.pem /etc/caddy/origin-key.pem` (lihat
  contoh di `Caddyfile`). Set SSL/TLS mode Cloudflare ke **Full (strict)**.
  Direkomendasikan untuk produk gray-area karena IP origin tersembunyi + ada WAF.

> Tunggu DNS propagasi sebelum `up -d` agar penerbitan sertifikat berhasil.

---

## d. Build & push image ke GHCR (dari mesin dev / Mac)

`Decade23` sudah punya akses GitHub sesuai setup user. Dari root repo:

```bash
# Build (context = backend/gateway)
docker build -t ghcr.io/decade23/coreasia-gateway:latest backend/gateway

# atau dari root dengan -f eksplisit:
# docker build -t ghcr.io/decade23/coreasia-gateway:latest -f backend/gateway/Dockerfile backend/gateway

# Login ke GHCR (butuh GH Personal Access Token dengan scope write:packages)
echo "$GH_PAT" | docker login ghcr.io -u Decade23 --password-stdin

# Push
docker push ghcr.io/decade23/coreasia-gateway:latest
```

> Catatan: build dari Apple Silicon menghasilkan image `arm64`. Kalau VPS
> arsitekturnya `amd64`, build multi-arch:
> `docker buildx build --platform linux/amd64 -t ghcr.io/decade23/coreasia-gateway:latest --push backend/gateway`

Agar VPS bisa `pull` (jika package GHCR di-set private), di VPS jalankan juga
`docker login ghcr.io -u Decade23` dengan PAT (scope `read:packages`). Kalau
package di-set **public**, tidak perlu login di VPS.

---

## e. Jalankan stack di VPS

Copy 3 file ke VPS (mis. ke `~/coreasia-gateway/`): `docker-compose.prod.yml`,
`Caddyfile`, `.env.prod.example`.

```bash
cd ~/coreasia-gateway
cp .env.prod.example .env.prod
nano .env.prod        # isi nilai REAL (lihat bagian (i) di bawah)

docker compose -f docker-compose.prod.yml pull     # tarik image gateway dari GHCR
docker compose -f docker-compose.prod.yml up -d

docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f gateway
```

Saat start, gateway otomatis:
- **menjalankan migrasi DB** (`file://migrations`, idempotent), dan
- **men-seed admin** dari `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` kalau
  belum ada admin.

Caddy otomatis menerbitkan sertifikat HTTPS untuk `api.coreasia.id`.

---

## f. Import 100 license key

Sumber key: `/Users/dante/DEV/works/coreasia-downloader/releases/license-keys-lifetime.txt`
(100 baris, satu key per baris, tier `lifetime`).

### Cara (i) — via endpoint admin (disarankan)

Endpoint: `POST /api/admin/cad/licenses/import` (butuh JWT admin).
Body: `{"keys": ["...", "..."], "tier": "lifetime"}`.

```bash
# 1) Login admin → ambil access_token
TOKEN=$(curl -s https://api.coreasia.id/api/admin/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@coreasia.id","password":"<ADMIN_PASSWORD>"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')

# 2) Bangun JSON {keys:[...], tier:"lifetime"} dari file txt, lalu POST
python3 - "$TOKEN" <<'PY'
import json, subprocess, sys, urllib.request
token = sys.argv[1]
path = "/Users/dante/DEV/works/coreasia-downloader/releases/license-keys-lifetime.txt"
keys = [l.strip() for l in open(path) if l.strip()]
body = json.dumps({"keys": keys, "tier": "lifetime"}).encode()
req = urllib.request.Request(
    "https://api.coreasia.id/api/admin/cad/licenses/import",
    data=body, method="POST",
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
print(urllib.request.urlopen(req).read().decode())
PY
# → {"imported": 100, "submitted": 100}
```

> Jalankan dari mesin yang punya file txt (Mac dev). Respons `imported` <
> `submitted` berarti sebagian key sudah ada (duplikat) — aman.

### Cara (ii) — langsung via psql (fallback)

```bash
# Copy file key ke VPS dulu, lalu:
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<'SQL'
-- cek nama kolom dulu kalau ragu:  \d cad_licenses
-- contoh INSERT (sesuaikan kolom dengan skema migrasi CAD):
-- INSERT INTO cad_licenses (license_key, tier, status) VALUES ('<key>', 'lifetime', 'active');
SQL
```

Cara (i) lebih disarankan karena memakai logika `ImportBatch` aplikasi
(validasi + audit log), bukan INSERT manual.

---

## g. Arahkan frontend (Vercel) ke gateway produksi

Di project **landing** di Vercel (Settings → Environment Variables, scope
Production), set:

```
GATEWAY_PUBLIC_URL = https://api.coreasia.id
GATEWAY_URL        = https://api.coreasia.id
```

(Sesuaikan dengan key yang dipakai frontend — lihat `frontend/landing`; pola dev
memakai `GATEWAY_URL` untuk server-side dan `GATEWAY_PUBLIC_URL` untuk browser.
Kalau perlu suffix `/api`, pakai `https://api.coreasia.id/api`.)

Setelah set env → **Redeploy** project landing agar env terbaca.

---

## h. Smoke test

```bash
# Health (publik, harus 200)
curl -i https://api.coreasia.id/health
curl -i https://api.coreasia.id/readyz

# Analytics tanpa token → HARUS 401
curl -i https://api.coreasia.id/api/admin/cad/analytics
# → HTTP/1.1 401 Unauthorized

# Login admin → dapat access_token (200)
curl -s https://api.coreasia.id/api/admin/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@coreasia.id","password":"<ADMIN_PASSWORD>"}'

# Analytics DENGAN token → 200
curl -s https://api.coreasia.id/api/admin/cad/analytics \
  -H "Authorization: Bearer $TOKEN"

# License list (verifikasi 100 key terimport)
curl -s "https://api.coreasia.id/api/admin/cad/licenses" \
  -H "Authorization: Bearer $TOKEN"
```

Cek juga sertifikat HTTPS valid (gembok hijau) dan `docker compose ... logs
gateway` bersih (migrasi selesai, admin seeded).

---

## i. Catatan keamanan

- **Ganti semua password/secret default** di `.env.prod`:
  `DB_PASSWORD` (= `POSTGRES_PASSWORD`), `ADMIN_PASSWORD`, `MAYAR_WEBHOOK_TOKEN`,
  `RESEND_API_KEY`.
- **`JWT_SECRET` harus acak ≥ 32 char.** Generate: `openssl rand -base64 48`.
- **`.env.prod` JANGAN di-commit** (sudah masuk `.gitignore` root). Simpan
  salinan secret di tempat aman (password manager), bukan di repo.
- Postgres & Redis **tidak meng-expose port publik** — hanya di network internal
  Docker; hanya Caddy yang buka 80/443. Pertahankan begitu.
- Backup volume `pgdata` secara berkala (`docker compose exec postgres pg_dump ...`).
- Volume `caddy_data` menyimpan sertifikat TLS — **jangan dihapus** (kalau
  hilang, Caddy akan menerbitkan ulang dan bisa kena rate-limit Let's Encrypt).
- Setelah deploy, set `MIDTRANS_IS_PRODUCTION=true` hanya jika memang memakai
  Midtrans live key.
