import { jalurKonsol } from '~/utils/konsol'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    if (jalurKonsol(event.path)) return
    // The public business email is intentional. Cloudflare's documented markers
    // preserve Vue's server HTML instead of adding email spans before hydration.
    // Keep these outside the Vue root so they introduce no client-side nodes.
    html.bodyPrepend.unshift('<!--email_off-->')
    html.bodyAppend.push('<!--/email_off-->')
  })
  nitroApp.hooks.hook('render:response', (response, { event }) => {
    if (jalurKonsol(event.path) || typeof response.body !== 'string' || !/^\s*<!doctype html>/i.test(response.body)) return
    // Respect the application's consent gate: Cloudflare must not inject an
    // optional analytics beacon into the public HTML before the visitor decides.
    const cache = String(response.headers?.['cache-control'] || 'public, max-age=0, must-revalidate')
    response.headers = { ...response.headers, 'cache-control': /(?:^|,)\s*no-transform(?:,|$)/i.test(cache) ? cache : `${cache}, no-transform` }
  })

})
