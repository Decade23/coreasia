# Animasi hero beranda

Ilustrasi di hero beranda adalah animasi Lottie yang dibangun dari kode, bukan dari After Effects.
Versi 2 (30 Okt 2026) bercerita dari masalah pelanggan sampai ajakan dalam lima adegan 15 detik:
Masalah, Bertemu, Dibangun, Beres, Ajakan. Saat marker "Ajakan" diputar, `StoryLottie` mengirim event
`marker` dan tombol CTA hero yang asli ikut berdenyut. Brief-nya ada di
`~/claude/artifact/coreasia/_animasi-landing-20261029/brief-hero-coreasia-v2.md`.

- `hero-story/desktop` dan `hero-story/mobile` berisi `scene.svg` (gambar diam) dan `motion.mjs`
  (fungsi `poseStyles(detik)` yang menentukan posisi dan transparansi tiap bagian bergerak).
- `compile_story.py` mengubah keduanya menjadi JSON Lottie dan poster WebP di `public/animations`.
  Compiler ini turunan compiler animasi Afra Training. Huruf diubah jadi outline dari
  `fonts/plus-jakarta-sans-latin-variable-v1.woff2` (OFL), jadi JSON tidak butuh font.
- Pemutarnya `components/ui/StoryLottie.vue`, memakai lottie-web 5.13.0 (build light canvas, MIT)
  yang disajikan sendiri dari `public/lib/lottie`.

## Aturan sumber

Elemen hanya `svg`, `g`, `rect`, `circle`, `ellipse`, `path`, `text`, dengan warna hex. Transform
statis hanya `translate` dan `scale`. Bagian yang bergerak diberi `id`, tanpa atribut `transform`,
dan pivotnya ditulis lewat `style="transform-origin:Xpx Ypx"`. Satu bagian hanya boleh memakai satu
jenis gerak: `translateY`, `translate`, `rotate`, atau `scaleX`, ditambah `opacity`. Pose detik 0 dan
detik terakhir harus sama supaya loop mulus.

Sumber gambar ini dibangkitkan dari kanvas usulan desain (`~/claude/artifact/coreasia/_animasi-landing-20261029/scenes_ca2.py`).
`check_scene.py` memeriksa aturan di atas sebelum kompilasi.

## Membangun ulang

Butuh Python 3 dengan paket di `requirements-build.txt`, Node, dan pustaka cairo (`brew install cairo`).

```sh
python3 -m venv .venv-lottie && .venv-lottie/bin/pip install -r requirements-build.txt
export DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib   # supaya cairo ketemu di Mac

python3 check_scene.py hero-story/desktop 15 && python3 check_scene.py hero-story/mobile 15

.venv-lottie/bin/python compile_story.py --source hero-story/desktop --name coreasia-hero-v2-desktop \
  --seconds 15 --out ../../public/animations --font fonts/plus-jakarta-sans-latin-variable-v1.woff2 \
  --markers Masalah,Bertemu,Dibangun,Beres,Ajakan --poster 10.9 --background '#f7f9fc' --poster-scale 1.5

.venv-lottie/bin/python compile_story.py --source hero-story/mobile --name coreasia-hero-v2-mobile \
  --seconds 15 --out ../../public/animations --font fonts/plus-jakarta-sans-latin-variable-v1.woff2 \
  --markers Masalah,Bertemu,Dibangun,Beres,Ajakan --poster 10.9 --background '#f7f9fc'
```

Ukuran per 30 Okt 2026: JSON desktop 44 KB dan ponsel 41 KB setelah brotli, poster 27 sampai 28 KB.
`generated-manifest.json` di tiap folder sumber mencatat ukuran dan sidik jari hasil terakhir.
