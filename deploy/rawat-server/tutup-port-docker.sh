#!/bin/bash
# CoreAsia 25 Nov 2026. Docker membuka port container lewat iptables dan melewati ufw, sehingga
# http://<ip-server>:3000, :3001, :8080 bisa dibuka langsung dari internet tanpa HTTPS dan tanpa nginx.
# Aturan ini menolak koneksi BARU yang datang dari antarmuka internet menuju container mana pun.
# nginx di host tetap bisa memanggil localhost:<port> (lalu lintas lokal, tidak lewat FORWARD),
# container tetap bisa keluar ke internet, dan antar-container tidak terpengaruh.
# Lepas sementara: iptables -D DOCKER-USER -j COREASIA-TUTUP   (permanen: systemctl disable --now tutup-port-docker)
set -euo pipefail
IF=$(ip -4 route show default | awk '{print $5; exit}')
[ -n "$IF" ] || { echo "antarmuka default tidak ditemukan"; exit 1; }
iptables -w -N COREASIA-TUTUP 2>/dev/null || iptables -w -F COREASIA-TUTUP
iptables -w -A COREASIA-TUTUP -i "$IF" -m conntrack --ctstate NEW -j DROP
iptables -w -C DOCKER-USER -j COREASIA-TUTUP 2>/dev/null || iptables -w -I DOCKER-USER 1 -j COREASIA-TUTUP
echo "port container tertutup dari $IF"
