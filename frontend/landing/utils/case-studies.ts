export const CASE_STUDIES = [
    {
        slug: 'leadku-crm-tim-penjualan',
        title: 'LeadKu: menghubungkan pipeline, penawaran, dan pekerjaan tim sales',
        summary:
            'Bagaimana produk CoreAsia menempatkan pelanggan, tindak lanjut, penawaran dan faktur dalam alur kerja penjualan yang sama.',
        product: 'LeadKu',
        to: '/products/leadku',
        external: 'https://leadku.coreasia.id',
        context:
            'Dalam pekerjaan penjualan, informasi pelanggan sering terpisah dari tindak lanjut dan dokumen penawaran. LeadKu merupakan produk milik CoreAsia untuk mengelola pekerjaan tersebut dalam ruang kerja tim.',
        decisions: [
            [
                'Pekerjaan mengikuti tahapan penjualan',
                'Pelanggan, aktivitas dan tindak lanjut terhubung dengan pipeline. Tim dapat membaca tahap pekerjaan sebelum menentukan tindakan berikutnya.',
            ],
            [
                'Dokumen tetap dekat dengan pekerjaan',
                'Penawaran dan faktur merupakan bagian dari alur penjualan. Dokumen dapat dibuat sebagai PDF dan dibagikan melalui tautan sesuai fungsi yang tersedia pada produk.',
            ],
            [
                'Batas akses mengikuti ruang kerja',
                'Data perusahaan pelanggan dipisahkan menurut ruang kerja. Peran pengguna menentukan bagian data dan tindakan yang dapat diakses.',
            ],
        ],
        delivered: [
            'Pipeline dan pencatatan aktivitas penjualan',
            'Penawaran dan faktur PDF',
            'Pembagian akses menurut ruang kerja dan peran',
            'Asisten penjualan untuk membaca informasi pipeline',
        ],
        boundary:
            'Ini studi kasus produk milik CoreAsia, bukan testimoni klien. Penjelasannya memakai informasi yang telah dipublikasikan pada portofolio dan halaman LeadKu. Kami tidak mencantumkan kenaikan penjualan atau penghematan waktu yang belum diukur.',
    },
    {
        slug: 'pantau-monitoring-website',
        title: 'Pantau: membaca data website tanpa berpindah antaralat',
        summary:
            'Keputusan penyusunan dashboard pemantauan yang menghubungkan data pengunjung, hasil pencarian, pemeriksaan SEO dan laporan berkala.',
        product: 'Pantau',
        to: '/products/pantau',
        external: 'https://pantau.coreasia.id',
        context:
            'Memeriksa sebuah website melibatkan beberapa sumber data. Pantau merupakan produk milik CoreAsia untuk mengumpulkan informasi tersebut dalam satu alur pemantauan, dari membaca kondisi hingga menyiapkan laporan.',
        decisions: [
            [
                'Data datang dari sumbernya',
                'Data pengunjung dan hasil pencarian dihubungkan melalui sumber resmi yang didukung produk. Pengguna dapat melihat data yang berkaitan dengan website yang dipantau.',
            ],
            [
                'Pemeriksaan memiliki riwayat',
                'Hasil pemeriksaan kecepatan halaman disimpan sebagai riwayat. Pengguna dapat melihat perubahan pemeriksaan, bukan hanya satu angka pada hari ini.',
            ],
            [
                'Laporan mengikuti jadwal',
                'Laporan PDF dapat mengikuti jadwal yang ditetapkan. Informasi pemantauan dapat dibaca tim atau klien tanpa harus menyusun laporan yang sama dari awal.',
            ],
        ],
        delivered: [
            'Dashboard analitik dan hasil pencarian',
            'Pemantauan kata kunci dan pemeriksaan SEO',
            'Riwayat pemeriksaan kecepatan halaman',
            'Laporan PDF berkala dan antarmuka dua bahasa',
        ],
        boundary:
            'Ini studi kasus produk milik CoreAsia. Fitur diuraikan dari portofolio dan halaman Pantau yang telah tersedia untuk umum. Tidak ada janji kenaikan peringkat pencarian atau hasil bisnis tertentu.',
    },
] as const
