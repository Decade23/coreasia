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
