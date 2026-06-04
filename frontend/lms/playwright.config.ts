import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'

const systemChromium =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined)

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 90_000,
    expect: {
        timeout: 10_000,
    },
    retries: 0,
    reporter: [['list']],
    use: {
        baseURL: process.env.E2E_BASE_URL || 'http://localhost:3002',
        launchOptions: systemChromium
            ? {
                  executablePath: systemChromium,
                  args: ['--no-sandbox'],
              }
            : undefined,
        trace: 'off',
        screenshot: 'off',
        video: 'off',
    },
    projects: [
        {
            name: 'desktop',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1440, height: 900 },
            },
        },
        {
            name: 'mobile',
            use: {
                ...devices['Pixel 5'],
                viewport: { width: 390, height: 844 },
            },
        },
    ],
})
