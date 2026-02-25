export default defineEventHandler((event) => {
    const query = getQuery(event)
    const page = Number(query.page) || 1

    const data = [
        { id: 'LOG-001', user_id: 'USR-001', user_name: 'Admin LSP', user_role: 'admin', action: 'approve', resource: 'verification', resource_id: 'APP-2026-080', description: 'Menyetujui verifikasi berkas Andi Kusuma', ip_address: '192.168.1.10', timestamp: '2026-02-25T14:30:00Z' },
        { id: 'LOG-002', user_id: 'ASR-001', user_name: 'Hendrik Kurniawan', user_role: 'assessor', action: 'submit', resource: 'assessment', resource_id: 'QR-001', description: 'Mengirim hasil penilaian Andi Kusuma - Kompeten', ip_address: '192.168.1.15', timestamp: '2026-02-25T14:00:00Z' },
        { id: 'LOG-003', user_id: 'USR-001', user_name: 'Admin LSP', user_role: 'admin', action: 'create', resource: 'schedule', resource_id: 'JAD-1201', description: 'Membuat jadwal Ujian JWD Gelombang 1', ip_address: '192.168.1.10', timestamp: '2026-02-24T10:00:00Z' },
        { id: 'LOG-004', user_id: 'USR-001', user_name: 'Admin LSP', user_role: 'admin', action: 'update', resource: 'scheme', resource_id: 'SCH-001', description: 'Memperbarui skema Junior Web Developer', ip_address: '192.168.1.10', timestamp: '2026-02-23T09:00:00Z' },
        { id: 'LOG-005', user_id: 'USR-010', user_name: 'Budi Santoso', user_role: 'assessee', action: 'submit', resource: 'registration', resource_id: 'APP-2026-081', description: 'Mengirim formulir pendaftaran sertifikasi JWD', ip_address: '103.28.12.50', timestamp: '2026-02-20T09:30:00Z' },
        { id: 'LOG-006', user_id: 'ASR-002', user_name: 'Anita Widyastuti', user_role: 'assessor', action: 'login', resource: 'auth', resource_id: '', description: 'Login ke sistem', ip_address: '192.168.1.20', timestamp: '2026-02-20T08:00:00Z' },
    ]

    return { data, total: data.length, page, per_page: 10 }
})
