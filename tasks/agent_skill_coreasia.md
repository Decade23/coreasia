# Skill: CoreAsia Frontend Development
name: coreasia-frontend-rules
description: Aturan mutlak pengembangan UI/UX dan arsitektur untuk project CoreAsia LMS dan Landing. Wajib dibaca sebelum mengubah kode.

## 1. Aturan UI/UX Dasar
- **Komponen Custom**: SELALU gunakan form field kustom yang sudah disediakan, seperti `CaInputSearch`, `CaSelectSearch`, `CaDatePicker`. Dilarang keras menggunakan `<input>` form standar HTML tanpa dibungkus styling project.
- **Alert & Konfirmasi**: Dilarang menggunakan alert() dari browser. Gunakan komponen `<Modal>` atau `<ConfirmDialog>` bawaan project.
- **Micro-animations**: Berikan efek transisi (seperti hover opacity, translate, atau shadow) pada setiap elemen interaktif (tombol, card, baris tabel). Project harus terasa *dynamic* dan *premium*.
- **Bahasa**: Project menggunakan 2 bahasa (Indonesia & English) dengan **Indonesia sebagai default**. Dilarang menampilkan *language switcher* di UI.
- **Tema (Light/Dark Mode)**: Desain harus mendukung 2 tema. Tailwind setup menggunakan class `dark:` untuk mengatur warna tema gelap, dan warna dasar (`text-content`, `bg-core-800`, dsb.) akan merespons tema jika variabelnya diatur dengan baik. Gunakan variabel semantic tailwind (jika ada).

## 2. Aturan Backend / Pengembangan
- **Docker**: Project selalu dijalankan melalui docker bahkan untuk *local development*. Pastikan untuk mengupdate image (menggunakan docker-compose up --build) jika menginstall dependency baru.
- **Port Development**: Dilarang mengubah port default di docker-compose tanpa persetujuan eksplisit.
- **Error Handling**: Jangan expose log error sensitif di sisi client/frontend. Simpan informasi di backend, dan berikan pesan ramah pengguna di frontend.
- **Audit Log**: Setiap ada penambahan *action* / CRUD (Create, Update, Delete) yang krusial, wajib direkam ke Audit Log dan pastikan format datanya *readable* oleh user.

## 3. Aturan Version Control (Git)
- **Commit Message**: Saat membuat commit, gunakan bahasa senatural mungkin dan jelaskan secara ringkas perubahan yang dilakukan. Dilarang keras menggunakan gaya bahasa *robotic* / AI.
- **Author**: Gunakan `Dedi Fardiyanto <dedif15@gmail.com>` sebagai git commit author.
- **Push**: Selalu lakukan commit ketika satu fungsionalitas selesai, tetapi **JANGAN MELAKUKAN PUSH** kecuali diperintahkan.

## Referensi Berkas:
- Komponen berada di `frontend/lms/app/components/` (dikelompokkan dengan metodologi atomic: atoms, molecules, organisms, templates).
- Pastikan semua page diletakkan di `app/pages/`.
