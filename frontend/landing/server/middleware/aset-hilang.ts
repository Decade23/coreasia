/**
 * Berkas build yang tidak ada (/_nuxt/<hash>.js milik build lain) dijawab 404
 * polos dengan `cache-control: no-store`.
 *
 * Permintaan /_nuxt/** hanya sampai ke sini bila berkasnya tidak ada: di
 * Vercel berkas statis dijawab tepi sebelum fungsi, dan di server Node
 * penangan aset statis Nitro berjalan sebelum middleware. Tanpa berkas ini
 * jawabannya datang dari penangan galat (halaman galat HTML untuk peramban)
 * tanpa cache-control yang tegas, dan CDN di depan menggantinya dengan umur
 * tembolok bawaannya untuk berkas .js/.css. Akibatnya 404 sesaat ketika rilis
 * tersimpan di peramban, dan console tampil setengah jadi sampai tembolok
 * dihapus. `no-store` juga melarang CDN menyimpannya.
 *
 * Mode dev dilewati: di sana /_nuxt/** dilayani Vite.
 */
import { jalurAsetBuild } from '../lib/aset/rute-vercel'

export default defineEventHandler((event) => {
  if (import.meta.dev) return
  const { baseURL, buildAssetsDir } = useRuntimeConfig(event).app
  const dirAset = `${baseURL.replace(/\/+$/, '')}/${buildAssetsDir.replace(/^\/+|\/+$/g, '')}`
  if (!jalurAsetBuild(event.path, dirAset)) return
  setResponseStatus(event, 404)
  setResponseHeaders(event, {
    'cache-control': 'no-store',
    'content-type': 'text/plain; charset=utf-8',
    'x-content-type-options': 'nosniff',
  })
  return 'Not Found'
})
