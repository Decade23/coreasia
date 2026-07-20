import { DEFAULT_LOCALE, resolveLocaleFromQuery } from '~/utils/i18n'
import { getContent, loadContent } from '~/utils/content'

export default defineNuxtPlugin(async (nuxtApp) => {
  const route = useRoute()
  const contentState = useState('coreasia-content', () => getContent(DEFAULT_LOCALE))

  // Memakai resolver yang SAMA dengan useCoreI18n. Sebelumnya file ini punya
  // salinan logikanya sendiri yang mengabaikan cookie, sementara composable-nya
  // membaca cookie — dua sumber kebenaran yang menulis ke useState yang sama,
  // sehingga <title> bisa jadi EN sementara body kembali ke ID setelah page:finish.
  const syncContent = async () => {
    const active = resolveLocaleFromQuery(route.query)
    // WAJIB sebelum await: setelah await, konteks instance Nuxt hilang dan
    // updateSiteConfig melempar "[nuxt] instance unavailable" (500 di semua halaman).
    // nuxt-seo-utils menurunkan <html lang> dari siteConfig.currentLocale (jatuh ke
    // defaultLocale 'id' kalau kosong), jadi menyetelnya di sini membuat kedua
    // sumber sepakat alih-alih saling berebut prioritas tag.
    updateSiteConfig({ currentLocale: active === 'en' ? 'en-US' : 'id-ID' })
    contentState.value = await loadContent(active)
  }

  await syncContent()

  if (import.meta.client) {
    nuxtApp.hook('page:finish', syncContent)
  }
})