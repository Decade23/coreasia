export default defineEventHandler((event) => {
    const cookies = parseCookies(event)
    const token = cookies.auth_token

    if (!token) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        })
    }

    // Mock admin user
    if (token.includes('admin')) {
        return {
            id: 'usr_admin123',
            name: 'LSP Administrator',
            email: 'admin@lsp.com',
            role: 'admin',
            permissions: ['all']
        }
    }

    // Mock assessee user
    return {
        id: 'usr_asesi123',
        name: 'Peserta Ujian',
        email: 'peserta@test.com',
        role: 'assessee',
        permissions: ['read']
    }
})
