#!/usr/bin/env python3
"""bersih-docker: buang image Docker yang sudah tidak relevan, tetap aman untuk mundur.

Dipasang di /usr/local/sbin/bersih-docker.py, dijalankan bersih-docker.timer
(harian) dan boleh dijalankan tangan sesudah deploy:

    sudo KERING=1 python3 -I /usr/local/sbin/bersih-docker.py   # rencana saja
    sudo python3 -I /usr/local/sbin/bersih-docker.py            # jalankan

Image DISIMPAN bila salah satu benar:
  1. dipakai kontainer apa pun (jalan atau berhenti);
  2. disebut .env, *.env, compose*.yml, docker-compose*.yml, atau berkas di DUA
     folder releases/ terbaru milik /opt/coreasia-sapa dan setiap folder proyek
     yang ditulis di /etc/bersih-docker.proyek (satu path per baris, mis. /opt/afra);
  3. disebut /etc/bersih-docker.simpan (satu repo:tag per baris, untuk pin tangan);
  4. dibuat kurang dari UMUR_HARI hari lalu (deploy yang sedang berjalan);
  5. satu image terbaru per repositori di luar aturan 1 sampai 4 (titik mundur umum).
Sisanya dihapus per tag (docker rmi tanpa paksa, jadi image yang ternyata dipakai
ditolak Docker sendiri). Lalu image tanpa nama berumur > 3 hari dan build cache
berumur > 7 hari dibuang. Log kontainer json-file tanpa batas yang lewat 200 MB
dikosongkan (primesotech belum punya batas log).
"""
import glob, json, os, re, subprocess, sys, time

KERING = os.environ.get('KERING') == '1'
UMUR_HARI = int(os.environ.get('UMUR_HARI', '7'))
SAPA = '/opt/coreasia-sapa'
PIN = '/etc/bersih-docker.simpan'
PROYEK = '/etc/bersih-docker.proyek'
LOG_MAKS = 200 * 1024 * 1024
POLA = re.compile(r'\b[a-z0-9][a-z0-9._-]*(?:/[a-z0-9._-]+)+:[A-Za-z0-9._-]+')


def log(m):
    print(time.strftime('[%Y-%m-%dT%H:%M:%SZ]', time.gmtime()), m, flush=True)


def docker(*a, cek=True):
    return subprocess.run(['docker', *a], capture_output=True, text=True, check=cek).stdout


def baca(f):
    try:
        if os.path.isfile(f) and os.path.getsize(f) < 1024 * 1024:
            with open(f, errors='replace') as h:
                return h.read()
    except OSError:
        pass
    return ''


def bebas():
    s = os.statvfs('/')
    return s.f_bavail * s.f_frsize / 1024**3


def main():
    log(f'mulai{" (KERING)" if KERING else ""}, sisa disk {bebas():.2f} GiB')
    kontainer = docker('ps', '-aq', '--no-trunc').split()
    dipakai = set(docker('inspect', '-f', '{{.Image}}', *kontainer).split()) if kontainer else set()

    teks = baca(PIN)
    # Folder proyek: Sapa bawaan, tambahan satu folder per baris di /etc/bersih-docker.proyek (mis. /opt/afra).
    proyek = [SAPA] + [x.strip() for x in baca(PROYEK).splitlines() if x.strip().startswith('/')]
    for p in proyek:
        for f in sorted(set(glob.glob(f'{p}/.env') + glob.glob(f'{p}/*.env') + glob.glob(f'{p}/compose*.y*ml')
                            + glob.glob(f'{p}/docker-compose*.y*ml'))):
            teks += baca(f)
        rilis = sorted((d for d in glob.glob(f'{p}/releases/*/') if os.path.isdir(d)), key=os.path.getmtime, reverse=True)[:2]
        for d in rilis:
            for f in os.listdir(d):
                teks += baca(os.path.join(d, f))
    rujukan = set(POLA.findall(teks))

    baris = [json.loads(x) for x in docker('image', 'ls', '--no-trunc', '--format', '{{json .}}').splitlines() if x.strip()]
    ids = sorted({b['ID'] for b in baris})
    dibuat = {}
    for x in docker('image', 'inspect', '-f', '{{.Id}} {{.Created}}', *ids).splitlines():
        i, c = x.split(' ', 1)
        dibuat[i] = c
    def detik(i):
        c = dibuat.get(i, '')
        m = re.match(r'(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)', c)
        return time.mktime(time.strptime(m.group(1), '%Y-%m-%dT%H:%M:%S')) - time.timezone if m else 0

    sekarang = time.time()
    simpan = set(dipakai)
    alasan = {}
    for b in baris:
        tag = f"{b['Repository']}:{b['Tag']}"
        if b['ID'] in dipakai:
            alasan[tag] = 'dipakai'
        elif tag in rujukan:
            simpan.add(b['ID']); alasan[tag] = 'rujukan rilis'
        elif sekarang - detik(b['ID']) < UMUR_HARI * 86400:
            simpan.add(b['ID']); alasan[tag] = f'< {UMUR_HARI} hari'
    # Satu image terbaru per repositori di luar yang sudah disimpan.
    per_repo = {}
    for b in baris:
        if b['Repository'] == '<none>' or b['ID'] in simpan:
            continue
        r = b['Repository']
        if r not in per_repo or detik(b['ID']) > detik(per_repo[r]['ID']):
            per_repo[r] = b
    for b in per_repo.values():
        simpan.add(b['ID']); alasan[f"{b['Repository']}:{b['Tag']}"] = 'terbaru di repo'

    buang = [b for b in baris if b['Repository'] != '<none>' and b['ID'] not in simpan]
    for t, a in sorted(alasan.items()):
        log(f'simpan {t} ({a})')
    for b in buang:
        tag = f"{b['Repository']}:{b['Tag']}"
        if KERING:
            log(f'akan dibuang {tag}')
            continue
        r = subprocess.run(['docker', 'rmi', tag], capture_output=True, text=True)
        log(f'buang {tag}: {"ok" if r.returncode == 0 else r.stderr.strip()[:160]}')

    if not KERING:
        log('image tanpa nama > 3 hari: ' + docker('image', 'prune', '-f', '--filter', 'until=72h').strip().splitlines()[-1:][0] if True else '')
        log('build cache > 7 hari: ' + (docker('builder', 'prune', '-f', '--filter', 'until=168h', cek=False).strip().splitlines() or ['-'])[-1])

    for k in kontainer:
        info = json.loads(docker('inspect', k))[0]
        lc = info['HostConfig']['LogConfig']
        jalur = info.get('LogPath') or ''
        if lc.get('Type') == 'json-file' and not lc.get('Config', {}).get('max-size') and jalur and os.path.exists(jalur):
            ukuran = os.path.getsize(jalur)
            if ukuran > LOG_MAKS:
                log(f"log {info['Name']} {ukuran / 1024**2:.0f} MB tanpa batas: {'akan dikosongkan' if KERING else 'dikosongkan'}")
                if not KERING:
                    open(jalur, 'w').close()
    log(f'selesai, sisa disk {bebas():.2f} GiB')


if __name__ == '__main__':
    try:
        main()
    except subprocess.CalledProcessError as e:
        log(f'galat docker: {(e.stderr or "").strip()[:300]}')
        sys.exit(1)
