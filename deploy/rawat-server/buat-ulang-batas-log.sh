#!/bin/bash
# Buat ulang container yang belum punya batas log (dibuat sebelum /etc/docker/daemon.json berlaku),
# supaya batas 10m x 3 ikut terpasang. Hanya container yang SEDANG JALAN, hanya bila sidik konfigurasi
# compose di disk sama persis dengan label com.docker.compose.config-hash container (tidak ada pergeseran).
# Pemakaian (root): PERIKSA=1 buat-ulang-batas-log.sh <proyek>...   (tanpa PERIKSA=1 = jalankan)
set -uo pipefail
for proj in "$@"; do
  ids=$(docker ps -q --filter "label=com.docker.compose.project=$proj")
  [ -n "$ids" ] || { echo "[$proj] tidak ada container jalan"; continue; }
  first=$(echo "$ids" | head -1)
  lab() { docker inspect -f "{{index .Config.Labels \"$1\"}}" "$first"; }
  wd=$(lab com.docker.compose.project.working_dir); cf=$(lab com.docker.compose.project.config_files); ef=$(lab com.docker.compose.project.environment_file)
  args=(-p "$proj" --project-directory "$wd")
  IFS=',' read -ra F <<< "$cf"; for f in "${F[@]}"; do args+=(-f "$f"); done
  if [ -n "$ef" ]; then IFS=',' read -ra E <<< "$ef"; for e in "${E[@]}"; do args+=(--env-file "$e"); done; fi
  hashes=$(cd "$wd" && docker compose "${args[@]}" config --hash '*' 2>/dev/null) || { echo "[$proj] compose config gagal, dilewati"; continue; }
  ok=(); beda=()
  for id in $ids; do
    svc=$(docker inspect -f '{{index .Config.Labels "com.docker.compose.service"}}' "$id")
    h=$(docker inspect -f '{{index .Config.Labels "com.docker.compose.config-hash"}}' "$id")
    ms=$(docker inspect -f '{{index .HostConfig.LogConfig.Config "max-size"}}' "$id")
    [ -n "$ms" ] && continue
    # Tag yang sama bisa menunjuk image lebih baru (mis. :latest ditarik tapi belum dipakai): jangan ikut naik versi.
    img_jalan=$(docker inspect -f '{{.Image}}' "$id"); img_tag=$(docker image inspect -f '{{.Id}}' "$(docker inspect -f '{{.Config.Image}}' "$id")" 2>/dev/null)
    if echo "$hashes" | grep -qx "$svc $h" && [ "$img_jalan" = "$img_tag" ]; then ok+=("$svc"); else beda+=("$svc"); fi
  done
  echo "[$proj] sama: ${ok[*]:-(tidak ada)} | bergeser/dilewati: ${beda[*]:-(tidak ada)}"
  [ ${#ok[@]} -gt 0 ] || continue
  if [ "${PERIKSA:-}" = 1 ]; then continue; fi
  (cd "$wd" && docker compose "${args[@]}" up -d --no-deps --no-build --force-recreate "${ok[@]}" 2>&1 | tail -n +1 | sed "s/^/[$proj] /" | tail -12)
done
