tasks:
    - commit dan push dulu. lalu kerjakan

    - jika ada attach ss. setelah selesai hapus ss dari project
    - selalu gunakan form field customize sesuai khas product yang sudah digunakan pada form field existing di web ini. hindari menggunakan form field umum/standard
    - jika ada action baru selalu integrasikan dengan audit log. pastikan audit log readable oleh user


MUST HAVE / MUST IMPLEMENT:
- implement `.agent\rules\expert-frontend.md`
- implement `.agent\rules\expert-boards.md`
- implement `.agent\rules\expert-backendv3.md`
- refer context 7
- commit hindari menggunakan text contains ai . misal: authored claude ai or something. gunakan bahasa humanis dan skill /commit . gunakan profil saya Dedi Fardiyanto <dedif15@gmail.com> <https://dedi.asia> . selalu commit setelah pekerjaan selesai namun jangan lakukan push sampai saya perintah
- project menggunakan docker selalu ikuti standard prosedur menjalankannya bahkan di local development
- setelah pekerjaan selesai, pastikan build success menghindari issue. dan perubahan sudah di terapkan di docker. jika diperlukan force recreate dan rebuild ulang.
- jangan rubah port development.
 - pastikan design untuk 2 tema ( light dan dark mode)
- pastikan text untuk 2 bahasa ( indonesia dan english ). jangan tampilkan switcher bahasa. default gunakan bahasa indonesia

- jika ada attach ss. setelah selesai hapus ss dari project
- selalu gunakan form field custom yang sudah digunakan pada form field existing di web ini. misal: search select, date picker custom dll. hindari menggunakan form field standard
- jika ada action baru selalu integrasikan dengan audit log. pastikan audit log readable oleh user
- error handling jangan expose hal sensitif . hal sensitif simpan di logs backend. pastikan mudah di trace.
- jangan gunakan alert. selalu gunakan modal

exclude git bukan git ignore:
    - task_coreasia.md
