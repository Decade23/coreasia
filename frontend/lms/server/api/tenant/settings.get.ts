export default defineEventHandler(() => {
    return {
        general: {
            name: 'LSP CoreAsia Teknologi',
            license_number: 'KEP.1234/BNSP/2024',
            address: 'Jl. Sudirman No. 123, Jakarta Selatan 12190',
            phone: '021-1234567',
            email: 'info@coreasia.id',
            website: 'https://lms.coreasia.id',
        },
        branding: {
            logo_url: '/img/default-logo.png',
            primary_color: '#06B6D4',
            secondary_color: '#10B981',
            custom_domain: 'lms.coreasia.id',
        },
        users: [
            { id: 'USR-001', name: 'Admin LSP', email: 'admin@coreasia.id', role: 'admin', is_active: true, last_login: '2026-02-25T14:30:00Z' },
            { id: 'USR-002', name: 'Manajer Mutu', email: 'quality@coreasia.id', role: 'quality_manager', is_active: true, last_login: '2026-02-24T10:00:00Z' },
            { id: 'USR-003', name: 'Staff Administrasi', email: 'staff@coreasia.id', role: 'admin', is_active: false, last_login: '2025-12-01T08:00:00Z' },
        ],
    }
})
