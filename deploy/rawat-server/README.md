# Rawat server

Perlengkapan kecil supaya VPS kita tidak kehabisan disk dan tidak membuka port aplikasi ke internet.
Semua VPS kita bertipe kecil (disk 19 GB). Kalau disk penuh, skrip cadangan menolak jalan, dan itu
yang paling berbahaya karena gagalnya diam-diam. Jaga Layanan (`../jaga-layanan`) memantau umur
cadangan di R2, folder ini mencegah penyebabnya.

Akses server lewat alias SSH di laptop, jangan menulis alamat IP server di repo ini.

## Isi

**Pembersih image Docker** (`bersih-docker.py`, `.service`, `.timer`). Tiap hari pukul 03.40 WIB,
image lama dibuang tanpa menghilangkan titik mundur. Image disimpan bila dipakai container, disebut
`.env` atau compose proyek, disebut di dua folder `releases/` terbaru, di-pin di
`/etc/bersih-docker.simpan`, berumur di bawah 7 hari, atau image terbaru di repositorinya.
Folder proyek selain Sapa ditulis di `/etc/bersih-docker.proyek`, satu path per baris (mis. `/opt/afra`).
Skrip yang sama juga membuang image tanpa nama, build cache lama, dan mengosongkan log container
tanpa batas yang lewat 200 MB. Selalu coba dulu dengan `KERING=1`.

**Batas log.** `daemon.json` (ke `/etc/docker/daemon.json`) membatasi log container baru 10 MB x 3.
Batas ini baru berlaku sesudah Docker dimulai ulang dan hanya untuk container yang dibuat sesudahnya.
`journald-batas-ukuran.conf` membatasi journal sistem. Validasi `daemon.json` sebelum reboot dengan
`sudo dockerd --validate --config-file /etc/docker/daemon.json`, karena berkas rusak membuat Docker
tidak mau hidup.

**Penutup port container** (`tutup-port-docker.sh`, `.service`). Docker membuka port lewat iptables dan
melewati ufw, jadi `http://<ip>:3000` bisa dibuka langsung tanpa HTTPS. Unit ini menolak koneksi baru
dari antarmuka internet ke container mana pun. Pasang hanya di server yang tepinya nginx di host
(proxy ke `localhost:<port>`). Jangan pasang di server yang membuka 80/443 lewat container (Caddy,
nginx-proxy), karena situsnya ikut tertutup. Lepas sementara:
`sudo iptables -D DOCKER-USER -j COREASIA-TUTUP`.

**Buat ulang container untuk batas log** (`buat-ulang-batas-log.sh`, unit `-sekali`). Container lama
baru mendapat batas log setelah dibuat ulang. Skrip ini hanya membuat ulang container yang sedang jalan
bila sidik konfigurasi compose di disk sama dengan label `config-hash` container DAN image di tag itu
masih image yang sama. Kalau tidak, container dilewati, supaya tidak ada versi aplikasi yang ikut naik
diam-diam. Unit `-sekali` menjalankannya tiga menit sesudah boot lalu mematikan dirinya.
Coba dulu: `sudo PERIKSA=1 buat-ulang-batas-log.sh <proyek>`.

**SSH dan fail2ban.** `00-coreasia-keyonly.conf` mematikan login password. `fail2ban-jail.local`
untuk Ubuntu 24.04 (journal + nftables).

**`reboot-satu.sh`** dijalankan dari laptop: reboot satu server lewat alias SSH, tunggu sampai hidup,
container sehat, lalu cek alamat yang diberikan. Reboot server berurutan, satu per satu.

## Pasang di server baru

```sh
scp bersih-docker.py *.service *.timer *.sh daemon.json journald-batas-ukuran.conf <alias>:/tmp/
ssh <alias>
sudo install -m 755 /tmp/bersih-docker.py /tmp/tutup-port-docker.sh /tmp/buat-ulang-batas-log.sh /usr/local/sbin/
sudo install -m 644 /tmp/bersih-docker.service /tmp/bersih-docker.timer /etc/systemd/system/
sudo install -D -m 644 /tmp/journald-batas-ukuran.conf /etc/systemd/journald.conf.d/batas-ukuran.conf
sudo systemctl restart systemd-journald
[ -s /etc/docker/daemon.json ] || sudo install -m 644 /tmp/daemon.json /etc/docker/daemon.json
sudo systemctl daemon-reload && sudo systemctl enable --now bersih-docker.timer
sudo KERING=1 python3 -I /usr/local/sbin/bersih-docker.py
```

Penutup port (hanya bila tepinya nginx di host):

```sh
sudo install -m 644 /tmp/tutup-port-docker.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now tutup-port-docker
curl -m 5 http://<ip>:3000/   # dari luar: harus habis waktu, situs lewat domain tetap 200
```

## Sebelum reboot

Pastikan semua container memakai restart `always` atau `unless-stopped` (yang `on-failure` tidak hidup
lagi sesudah reboot), `ssh.socket` enabled, tidak ada `dpkg` yang berjalan, dan tidak ada cadangan
yang sedang jalan. Pilih jam sepi dengan melihat log akses, bukan menebak malam pasti sepi.
