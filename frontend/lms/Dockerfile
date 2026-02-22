# Gunakan image resmi Bun berbasis Debian (glibc)
FROM oven/bun:1 AS builder

# Set working directory
WORKDIR /app

# Salin file konfigurasi package
COPY package.json bun.lock ./

# Install dependensi
RUN bun install --frozen-lockfile

# Salin sisa kode sumber
COPY . .

# Generate .nuxt types/templates secara eksplisit
RUN bun run postinstall

# Tambahkan memory limit jika build gagal karena kehabisan RAM
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build project Nuxt
RUN bun run build

# Tahap production runner
FROM node:20-slim AS runner

WORKDIR /app

# Salin hasil build dari tahap builder
COPY --from=builder /app/.output ./

# Set environment variables untuk produksi
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Ekspose port 3000
EXPOSE 3000

# Jalankan server Nuxt
CMD ["node", "./server/index.mjs"]
