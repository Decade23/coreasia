export default defineEventHandler(() => {
    return [
        {
            id: 'UNIT-001',
            code: 'J.620100.009.01',
            title: 'Menggunakan Struktur Data',
            elements: [
                {
                    id: 'E1',
                    title: 'Mengidentifikasi konsep struktur data',
                    criteria: [
                        { id: 'KUK-1.1', text: 'Konsep struktur data dijelaskan sesuai dengan kueri data.', status: null },
                        { id: 'KUK-1.2', text: 'Tipe data diidentifikasi sesuai dengan kebutuhan aplikasi.', status: null }
                    ]
                },
                {
                    id: 'E2',
                    title: 'Menerapkan struktur data pada memori',
                    criteria: [
                        { id: 'KUK-2.1', text: 'Algoritma struktur data diimplementasikan pada bahasa pemrograman.', status: null }
                    ]
                }
            ]
        },
        {
            id: 'UNIT-002',
            code: 'J.620100.012.01',
            title: 'Menggunakan Bahasa Pemrograman Berorientasi Objek',
            elements: [
                {
                    id: 'E1',
                    title: 'Membuat kelas',
                    criteria: [
                        { id: 'KUK-1.1', text: 'Kelas dibuat dan diatur sesuai dengan kebutuhan program.', status: null }
                    ]
                }
            ]
        }
    ]
})
