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
})
