import { afterAll, describe, expect, it, vi } from 'vitest'

type Html = { bodyPrepend: string[]; bodyAppend: string[] }
type RenderHook = (html: Html, context: { event: { path: string } }) => void
vi.stubGlobal('defineNitroPlugin', (plugin: unknown) => plugin)
const plugin = (await import('~/server/plugins/public-email')).default as unknown as (app: {
  hooks: { hook: (name: string, callback: RenderHook) => void }
}) => void
let render: RenderHook
plugin({ hooks: { hook: (_name, callback) => { render = callback } } })
afterAll(() => vi.unstubAllGlobals())

describe('public HTML through Cloudflare', () => {
  it('puts email preservation boundaries outside the application and retains existing body additions', () => {
    const html = { bodyPrepend: ['<div id="__nuxt">'], bodyAppend: ['</div>'] }
    render(html, { event: { path: '/contact?lang=en' } })
    expect(html.bodyPrepend.join('')).toBe('<!--email_off--><div id="__nuxt">')
    expect(html.bodyAppend.join('')).toBe('</div><!--/email_off-->')
  })
  it.each(['/console', '/console/cashflow/masuk', '/Console/login', '/%63onsole'])('does not alter private console HTML: %s', (path) => {
    const html = { bodyPrepend: ['private'], bodyAppend: ['binding-script'] }
    render(html, { event: { path } })
    expect(html).toEqual({ bodyPrepend: ['private'], bodyAppend: ['binding-script'] })
  })
})
