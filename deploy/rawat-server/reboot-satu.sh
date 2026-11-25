#!/bin/bash
# Reboot satu server lalu tunggu sampai hidup dan container sehat. Pemakaian: _reboot-satu.sh <alias-ssh> [url...]
h=$1; shift
S='^\s*$|_ _|\|_|AUTHORIZED|Terminated|Activity|idcloudhost|___'
q() { ssh -o BatchMode=yes -o ConnectTimeout=6 "$h" "$@" 2>/dev/null | grep -vE "$S"; }
sebelum=$(q 'uptime -s'); [ -n "$sebelum" ] || { echo "[$h] tidak bisa dihubungi sebelum reboot, batal"; exit 1; }
echo "[$h] boot sebelumnya $sebelum, reboot $(date +%H:%M:%S)"
q 'sudo -n systemctl reboot' >/dev/null; t0=$(date +%s); sleep 25
for i in $(seq 1 45); do
  baru=$(q 'uptime -s'); [ -n "$baru" ] && [ "$baru" != "$sebelum" ] && break; sleep 8
done
[ -n "$baru" ] && [ "$baru" != "$sebelum" ] || { echo "[$h] BELUM HIDUP setelah $(( $(date +%s)-t0 )) detik"; exit 2; }
echo "[$h] SSH hidup lagi $(( $(date +%s)-t0 )) detik sesudah perintah reboot, kernel $(q 'uname -r')"
for i in $(seq 1 30); do
  st=$(q 'sudo -n docker ps -a --format "{{.Names}}|{{.Status}}"' | awk -F'|' '($2 !~ /^Up/ && $2 !~ /Exited .* (months|weeks) ago/) || $2 ~ /starting|Restarting/ || ($2 ~ /unhealthy/ && $1 != "primesotech-prod-api") {print $1"("$2")"}' | tr '\n' ' ')
  [ -z "$st" ] && break; sleep 8
done
echo "[$h] container: $(q 'sudo -n docker ps -q | wc -l') jalan$( [ -n "$st" ] && echo ", BELUM SEHAT: $st") ($(( $(date +%s)-t0 )) detik)"
echo "[$h] unit gagal: $(q 'systemctl --failed --no-legend --plain' | awk '{print $1}' | grep -vE 'motd-news|fwupd' | tr '\n' ' ')"
for u in "$@"; do printf '[%s]   %s -> %s\n' "$h" "$u" "$(curl -s -o /dev/null -m 12 -w '%{http_code}' "$u")"; done
