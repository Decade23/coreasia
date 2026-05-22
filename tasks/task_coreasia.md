project: coreasia
task:
    - produk pantau sudah live `https://pantau.coreasia.id` arahkan produk pantau ke link tersebut untuk uji coba dan semacamnya.

    - commit dan lakukan push


must implement:
    - all of inside folders `E:\DEV\works\iat\skills`
    - project menggunakan docker selalu ikuti standard prosedur menjalankannya bahkan di local development
    - setelah pekerjaan selesai, pastikan build success menghindari issue. dan perubahan sudah di terapkan di docker. jika diperlukan force recreate dan rebuild ulang.
    - jangan rubah port development.
    - saat membuat commit message hindari menggunakan hal yang berbau ai, buat senatural mungkin. gunakan Dedi Fardiyanto <dedif15@gmail.com> sebagai Auhored By. gunakan format standard dan jelakan cukup jelas apa saja perubahan yang dilakukan. selalu commit setelah pekerjaan selesai namun jangan lakukan push sampai saya perintah

    - pastikan design untuk 2 tema ( light dan dark mode)
    - pastikan text untuk 2 bahasa ( indonesia dan english ). jangan tampilkan switcher bahasa. default gunakan bahasa indonesia

    - jika ada attach ss. setelah selesai hapus ss dari project
    - selalu gunakan form field custom yang sudah digunakan pada form field existing di web ini. misal: search select, date picker custom dll. hindari menggunakan form field standard
    - jika ada action baru selalu integrasikan dengan audit log. pastikan audit log readable oleh user
    - error handling jangan expose hal sensitif . hal sensitif simpan di logs backend. pastikan mudah di trace.
    - jangan gunakan alert. selalu gunakan modal

exclude git bukan git ignore:
    - task_coreasia.md
