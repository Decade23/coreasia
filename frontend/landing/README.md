# CoreAsia Landing (Nuxt + Bun + Docker)

Landing website CoreAsia berbasis **Nuxt 4** dengan workflow utama **Bun** dan containerized workflow untuk **development/local** maupun **production**.

## Stack

- Bun `1.3.9+`
- Nuxt `4.3.1`
- Vite `7.3.1`
- Vue `3.5.27`

## Local (Bun Native)

Install dependency:

```bash
bun install
```

Run development server:

```bash
bun run dev
```

Build production bundle:

```bash
bun run build
```

Preview production bundle:

```bash
bun run preview
```

## Docker Development / Local

Run dev mode in Docker:

```bash
docker compose up --build landing-dev
```

atau via script:

```bash
bun run docker:dev
```

Default dev port: `3000` (ubah dengan `DEV_PORT`).

### Auto-sync with Docker Compose Watch

Jalankan mode watch agar perubahan source tersinkron otomatis ke container:

```bash
bun run docker:dev:watch
```

Mode ini akan:

- `sync` untuk file source (`pages`, `components`, `layouts`, `assets`, `public`, `app.vue`)
- `sync+restart` untuk config penting (`nuxt.config.ts`, `tailwind.config.ts`, `tsconfig.json`)
- `rebuild` saat `package.json`, `bun.lock`, atau `Dockerfile` berubah

Lihat log dev container:

```bash
bun run docker:dev:logs
```

Jika tidak pakai watch, perubahan source memerlukan rebuild container dev:

```bash
docker compose up --build landing-dev
```

Stop dev containers:

```bash
docker compose down
```

## Docker Production

Build and run production container:

```bash
docker compose -f docker-compose.prod.yml up --build -d landing-prod
```

atau via script:

```bash
bun run docker:prod
```

Default prod port: `3000` (ubah dengan `PORT`).

Stop production containers:

```bash
docker compose -f docker-compose.prod.yml down
```

## Environment Variables

Set di `.env` (opsional):

```dotenv
BUN_VERSION=1.3.9
DEV_PORT=3000
PORT=3000
```

## Notes

- Dockerfile mendukung target `development` dan `production`.
- Runtime production menjalankan Nitro output via Bun.
- Dependency lock utama: `bun.lock`.

## Pemeriksaan console CashFlow

Jalankan `npx nuxt prepare` sesudah menambah komponen, lalu:

```bash
CASHFLOW_MIGRASI=<repo-cashflow>/supabase/migrations npx vitest run
node scripts/cek-komponen-cashflow.mjs
npm run build
```

Cetak sesi CashFlow dibatasi 30 kali per 15 menit per IP per instans; jatahnya
terpisah dari serah terima login console. Jawaban sesi memakai no-store dan
nosniff. Peran dan kesegaran MFA tetap menentukan izin, tanpa masa tunggu
pendaftaran TOTP. Lihat `docs/runbook-console.md` untuk urutan rilis.

Hapus akun bertahap memakai migrasi 0114 di repo CashFlow (0112 dipakai
telemetri). Arahkan `CASHFLOW_MIGRASI` ke folder migrasi yang sudah memuat
0114 supaya uji kontraknya ikut berjalan, bukan dilewati.
