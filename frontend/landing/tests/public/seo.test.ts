import { describe, expect, it } from 'vitest'
import { publicCanonical, publicLocales, stringifyJsonLd } from '~/utils/public-seo'
import { getPublicNavigation } from '~/utils/navigation'

describe('public search metadata', () => {
  it('keeps one canonical for campaign and default-language URLs', () => {
    expect(publicCanonical('https://coreasia.id', '/products/pantau?utm_source=mail#fitur', 'id')).toBe('https://coreasia.id/products/pantau')
    expect(publicCanonical('https://coreasia.id', '/products/pantau', 'en')).toBe('https://coreasia.id/products/pantau?lang=en')
  })
  it('does not advertise translations that are not available', () => {
    expect(publicLocales('/artikel/biaya-website')).toEqual(['id'])
    expect(publicLocales('/portfolio/leadku-crm-tim-penjualan')).toEqual(['id'])
    expect(publicCanonical('https://coreasia.id', '/artikel/biaya-website', 'en')).not.toContain('lang=en')
  })
  it('keeps an untrusted title inside JSON-LD instead of ending the script', () => {
    const name = '</script><script>alert(1)</script>'
    const json = stringifyJsonLd({ name })
    expect(json).not.toContain('<')
    expect(JSON.parse(json).name).toBe(name)
  })
  it('uses the approved menu order and keeps destinations in both languages', () => {
    expect(getPublicNavigation().map(n => n.label)).toEqual(['Layanan', 'Portofolio', 'Produk', 'Harga', 'Artikel', 'Tentang'])
    const id = getPublicNavigation().flatMap(n => n.children?.map(c => c.to) || [n.to])
    const en = getPublicNavigation('en').flatMap(n => n.children?.map(c => c.to) || [n.to])
    expect(en).toEqual(id)
    expect(id).toContain('/layanan/jasa-pembuatan-aplikasi-web')
    expect(id).toContain('/products/beres')
  })
})
