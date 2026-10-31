#!/usr/bin/env bash
# Pasang atau perbarui Jaga Layanan (Worker Cloudflare) dan aturan bucket
# coreasia-backup. Aman diulang.
#
#   cd deploy/jaga-layanan && pnpm install && ./siapkan.sh
#
# Token dibaca dari ~/DEV/coreasia/iat/credentials/cloudflare-ops.env
# (CF_API_TOKEN: Workers Scripts/KV/R2 Edit) dan kunci Resend dari all_cred.md.
set -euo pipefail
cd "$(dirname "$0")"
KRED_DIR=${KRED_DIR:-$HOME/DEV/coreasia/iat/credentials}
# `|| true` supaya grep yang tidak menemukan apa-apa tidak menghentikan skrip
# lewat pipefail sebelum pesan galat di bawah sempat tercetak.
baca() { { grep -E "^$1=" "$KRED_DIR/cloudflare-ops.env" || true; } | tail -n1 | cut -d= -f2-; }
CLOUDFLARE_API_TOKEN=$(baca CF_API_TOKEN)
CLOUDFLARE_ACCOUNT_ID=$(baca CF_ACCOUNT_ID)
export CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID
[ -n "$CLOUDFLARE_API_TOKEN" ] || { echo "CF_API_TOKEN kosong di $KRED_DIR/cloudflare-ops.env"; exit 1; }
RESEND_API_KEY=$({ grep -i -m1 'resend' "$KRED_DIR/all_cred.md" || true; } | { grep -oE 're_[A-Za-z0-9_]+' || true; } | head -n1)
[ -n "$RESEND_API_KEY" ] || { echo "Kunci Resend tidak ditemukan di $KRED_DIR/all_cred.md"; exit 1; }
W=(npx wrangler)
B=coreasia-backup

echo "== bucket $B: hapus otomatis 35 hari, kunci 30 hari"
"${W[@]}" r2 bucket info "$B" >/dev/null
if ! "${W[@]}" r2 bucket lifecycle list "$B" 2>/dev/null | grep -q hapus-35-hari; then
  "${W[@]}" r2 bucket lifecycle add "$B" hapus-35-hari "" --expire-days 35 --abort-multipart-days 1 --force
fi
if ! "${W[@]}" r2 bucket lock list "$B" 2>/dev/null | grep -q kunci-30-hari; then
  "${W[@]}" r2 bucket lock add "$B" kunci-30-hari "" --retention-days 30 --force
fi

# Id namespace dari daftar KV akun (keluaran JSON), dicocokkan lewat judulnya.
id_kv() {
  "${W[@]}" kv namespace list 2>/dev/null | node -e '
    let s = ""
    process.stdin.on("data", (d) => (s += d)).on("end", () => {
      try {
        const n = JSON.parse(s.slice(s.indexOf("["))).find((x) => x.title === "JAGA_KV")
        if (n) console.log(n.id)
      } catch {}
    })' || true
}

if grep -q '__KV_ID__' wrangler.toml; then
  echo "== namespace KV JAGA_KV"
  # Idempoten: bila create gagal karena namespace sudah ada (mis. run sebelumnya
  # terputus sebelum wrangler.toml terisi), id-nya diambil dari daftar.
  id=''
  if buat=$("${W[@]}" kv namespace create JAGA_KV 2>&1); then
    # Hanya baris `id = "..."` dari potongan konfigurasi, bukan sembarang 32 hex (id akun).
    id=$(printf '%s\n' "$buat" | grep -oE 'id"? *[:=] *"[0-9a-f]{32}"' | grep -oE '[0-9a-f]{32}' | head -n1) || true
  fi
  [ -n "$id" ] || id=$(id_kv)
  [ -n "$id" ] || { printf '%s\n' "$buat"; echo "gagal membuat atau menemukan namespace KV JAGA_KV"; exit 1; }
  sed -i.bak "s/__KV_ID__/$id/" wrangler.toml && rm -f wrangler.toml.bak
fi

echo "== uji logika dan putaran"
node --test test/*.test.js

echo "== deploy"
# Rahasia ikut di versi yang sama dengan kode, supaya cron tidak pernah jalan
# tanpa kunci Resend. Lewat berkas sementara bermode 600, bukan argumen perintah.
SEMENTARA=$(mktemp -d)
trap 'rm -rf "$SEMENTARA"' EXIT
trap 'exit 130' INT TERM
RAHASIA="$SEMENTARA/rahasia.env"
SAPA_MONITOR_TOKEN=$({ grep -E '^SAPA_MONITOR_TOKEN=' "$KRED_DIR/sapa-monitor.env" 2>/dev/null || true; } | tail -n1 | cut -d= -f2-)
[ -n "$SAPA_MONITOR_TOKEN" ] || { echo "SAPA_MONITOR_TOKEN tidak ditemukan di $KRED_DIR/sapa-monitor.env"; exit 1; }
(umask 077 && printf 'RESEND_API_KEY=%s\nSAPA_MONITOR_TOKEN=%s\n' "$RESEND_API_KEY" "$SAPA_MONITOR_TOKEN" >"$RAHASIA")
chmod 600 "$RAHASIA"
"${W[@]}" deploy --secrets-file "$RAHASIA"
rm -rf "$SEMENTARA"
echo "== selesai. Putaran cron berikutnya menulis kunci 'keadaan' di KV dan mengirim email '[Jaga] Aktif: ...':"
echo "   npx wrangler kv key get keadaan --binding JAGA_KV --remote"
