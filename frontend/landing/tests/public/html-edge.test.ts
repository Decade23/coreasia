import { afterAll, describe, expect, it, vi } from 'vitest'

type Html = { bodyPrepend: string[]; bodyAppend: string[] }
type RenderHook = (html: Html, context: { event: { path: string } }) => void
vi.stubGlobal('defineNitroPlugin', (plugin: unknown) => plugin)
const plugin = (await import('~/server/plugins/public-email')).default as unknown as (app: {
  hooks: { hook: (name: string, callback: RenderHook) => void }
}) => void
let render: RenderHook
plugin({ hooks: { hook: (name, callback) => { if (name === 'render:html') render = callback } } })
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

type Response = { body: string; headers: Record<string, string> }
type ResponseHook = (response: Response, context: { event: { path: string } }) => void
let onResponse: ResponseHook
;(plugin as unknown as (app: { hooks: { hook: (name: string, callback: ResponseHook) => void } }) => void)({ hooks: { hook: (name, callback) => { if (name === 'render:response') onResponse = callback } } })
describe('public HTML consent at the edge', () => {
  it('keeps existing cache policy and tells proxies not to inject optional scripts', () => {
    const response = { body: '<!DOCTYPE html><html></html>', headers: { 'cache-control': 'public, max-age=0, must-revalidate' } }
    onResponse(response, { event: { path: '/' } })
    expect(response.headers['cache-control']).toBe('public, max-age=0, must-revalidate, no-transform')
  })
  it('leaves console and non-HTML responses untouched', () => {
    const response = { body: '<!DOCTYPE html><html></html>', headers: { 'cache-control': 'no-store' } }
    onResponse(response, { event: { path: '/console/cashflow/masuk' } })
    expect(response.headers['cache-control']).toBe('no-store')
    const json = { body: '{}', headers: { 'cache-control': 'max-age=60' } }
    onResponse(json, { event: { path: '/api/public/articles' } })
    expect(json.headers['cache-control']).toBe('max-age=60')
  })
})
