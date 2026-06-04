import { expect, test, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test'

const API_BASE_URL = process.env.E2E_API_BASE_URL || 'http://localhost:8083/api'
const APP_BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3002'
const TENANT_ID = process.env.E2E_TENANT_ID || 'demo'

const users = {
    admin: { email: 'admin@coreasia.id', password: 'admin123' },
    assessee: { email: 'assessee@coreasia.id', password: 'admin123' },
} as const

type Role = keyof typeof users

type LoginUserDTO = {
    id: string
    email: string
    full_name?: string
    phone_number?: string | null
    role: string
    is_active?: boolean
    last_login_at?: string | null
}

type LoginResponseDTO = {
    data: {
        access_token: string
        refresh_token: string
        user: LoginUserDTO
    }
}

const expectedConsole = (text: string) =>
    /Failed to load resource: the server responded with a status of (403|404)/i.test(text) ||
    /\[Auth Guard\] Forbidden access/i.test(text)

const sessionFromUser = (user: LoginUserDTO) => ({
    id: user.id,
    email: user.email,
    fullName: user.full_name || 'CoreAsia User',
    phoneNumber: user.phone_number || '',
    role: user.role,
    tenantId: TENANT_ID,
    isActive: user.is_active !== false,
    lastLoginAt: user.last_login_at || null,
})

const loginByApi = async (context: BrowserContext, request: APIRequestContext, role: Role) => {
    const response = await request.post(`${API_BASE_URL}/auth/login`, {
        headers: { 'X-Tenant-ID': TENANT_ID },
        data: users[role],
    })

    expect(response.ok(), `${role} login should succeed`).toBe(true)
    const payload = (await response.json()) as LoginResponseDTO
    const data = payload.data

    await context.addCookies([
        { name: 'auth_token', value: data.access_token, url: APP_BASE_URL },
        { name: 'refresh_token', value: data.refresh_token, url: APP_BASE_URL },
        {
            name: 'user_session',
            value: encodeURIComponent(JSON.stringify(sessionFromUser(data.user))),
            url: APP_BASE_URL,
        },
    ])
}

const installApiProxy = async (page: Page, request: APIRequestContext) => {
    if (API_BASE_URL === 'http://localhost:8083/api') return

    await page.route('http://localhost:8083/api/**', async (route) => {
        const intercepted = route.request()
        const targetUrl = intercepted.url().replace('http://localhost:8083/api', API_BASE_URL)
        const headers = { ...intercepted.headers() }
        delete headers.host

        const response = await request.fetch(targetUrl, {
            method: intercepted.method(),
            headers,
            data: intercepted.postDataBuffer() || undefined,
            failOnStatusCode: false,
        })

        await route.fulfill({ response })
    })
}

const assertPage = async (page: Page, pattern: RegExp) => {
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(500)

    const state = await page.evaluate(() => ({
        text: document.body?.innerText || '',
        bodyLength: document.body?.innerText?.trim().length || 0,
        overflowX: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > window.innerWidth + 2,
    }))

    expect(state.bodyLength, 'page body should not be blank').toBeGreaterThan(0)
    expect(state.overflowX, 'page should not have horizontal overflow').toBe(false)
    expect(state.text).toMatch(pattern)
}

test('CoreAsia LMS public, RBAC, and CBT smoke flow', async ({ context, page, request }, testInfo) => {
    const consoleIssues: string[] = []

    page.on('console', (message) => {
        const text = message.text()
        if (expectedConsole(text)) return
        if (
            message.type() === 'error' ||
            /Vue warn|Hydration|Failed to resolve component|Cannot find module|Unhandled/i.test(text)
        ) {
            consoleIssues.push(`${message.type()}: ${text}`)
        }
    })
    page.on('pageerror', (error) => {
        consoleIssues.push(`pageerror: ${error.message}`)
    })

    await installApiProxy(page, request)

    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await assertPage(page, /Selamat Datang|Masuk ke Dashboard/i)

    await page.goto('/registration', { waitUntil: 'domcontentloaded' })
    await assertPage(page, /Pendaftaran Mandiri|Data Pribadi/i)

    await page.goto('/definitely-not-a-route', { waitUntil: 'domcontentloaded' })
    await assertPage(page, /404|Halaman Tidak Ditemukan|Page not found/i)

    await loginByApi(context, request, 'admin')
    await page.goto('/admin/schemes', { waitUntil: 'domcontentloaded' })
    await assertPage(page, /Skema|Sertifikasi|scheme/i)

    await page.goto('/assessment/apl-02', { waitUntil: 'domcontentloaded' })
    await assertPage(page, /403|Akses Ditolak|Tidak memiliki izin/i)
    await expect(page).toHaveURL(/\/forbidden$/)

    await context.clearCookies()
    await loginByApi(context, request, 'assessee')
    await page.goto('/assessee', { waitUntil: 'domcontentloaded' })
    await assertPage(page, /Portal Asesi|Pendaftaran Ujian|Sertifikat Saya/i)

    await page.goto('/cbt/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', { waitUntil: 'domcontentloaded' })
    await assertPage(page, /Simulasi|CBT|Soal|Ujian/i)

    expect(consoleIssues, `${testInfo.project.name} console issues`).toEqual([])
})
