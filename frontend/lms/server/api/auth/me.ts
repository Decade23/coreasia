export default defineEventHandler((event) => {
    const cookies = parseCookies(event)
    const token = cookies.auth_token

    if (!token) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        })
    }

    // Mock admin user (AuthUserDTO format)
    if (token.includes('admin')) {
        return {
            id: 'usr_admin123',
            name: 'LSP Administrator',
            email: 'admin@lsp.com',
            role: 'admin',
            tenant_id: 't-coreasia-01',
            is_active: true,
            last_login_at: new Date().toISOString(),
        }
    }

    // Mock assessor user
    if (token.includes('assessor')) {
        return {
            id: 'usr_assessor01',
            name: 'Asesor Utama',
            email: 'asesor@lsp.com',
            role: 'assessor',
            tenant_id: 't-coreasia-01',
            is_active: true,
            last_login_at: new Date().toISOString(),
        }
    }

    // Mock assessee user (default)
    return {
        id: 'usr_asesi123',
        name: 'Peserta Ujian',
        email: 'peserta@test.com',
        role: 'assessee',
        tenant_id: 't-coreasia-01',
        is_active: true,
        last_login_at: new Date().toISOString(),
    }
})
