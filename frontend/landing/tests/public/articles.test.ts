import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ARTICLES } from '~/utils/articles'
import { mergePublicArticles, normalizePublicArticle } from '~/utils/public-articles'
import { ARTICLE_ASSET_SLUGS, resolveArticleCover, safeArticleImage } from '~/utils/article-assets'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-28T00:00:00Z')) })
afterEach(() => vi.useRealTimers())
describe('published public article catalog', () => {
  it('keeps the authored articles available without a gateway and gives each an asset', () => {
    const result = mergePublicArticles(ARTICLES, [])
    expect(result).toHaveLength(11)
    expect(new Set(result.map(a => a.slug)).size).toBe(11)
    for (const article of result) {
      expect(ARTICLE_ASSET_SLUGS).toContain(article.slug)
      const cover = resolveArticleCover(article)
      expect(cover.alt.length).toBeGreaterThan(15)
      expect(existsSync(fileURLToPath(new URL(`../../public${cover.src}`, import.meta.url)))).toBe(true)
      expect(cover.srcset).toContain('480w')
      const socialFile = fileURLToPath(new URL(`../../public${cover.socialSrc}`, import.meta.url))
      expect([...readFileSync(socialFile).subarray(0, 2)]).toEqual([0xff, 0xd8])
    }
  })
  it('merges published CMS updates once while retaining content absent from a list response', () => {
    const original = ARTICLES[0]!
    const updated = { ...original, title: 'Judul dari penyunting', content: undefined, featured_image: 'https://images.example.com/cover.jpg', status: 'published' }
    const catalog = mergePublicArticles([original], [updated])
    expect(catalog).toHaveLength(1)
    expect(catalog[0]!.title).toBe(updated.title)
    expect(catalog[0]!.content).toBe(original.content)
    expect(resolveArticleCover(catalog[0]!).src).toBe(updated.featured_image)
    expect(resolveArticleCover(catalog[0]!).generated).toBe(false)
  })
  it('excludes draft, scheduled, invalid and unpublished records', () => {
    const item = ARTICLES[0]!
    expect(normalizePublicArticle({ ...item, status: 'draft' })).toBeNull()
    expect(normalizePublicArticle({ ...item, status: 'unpublished' })).toBeNull()
    expect(normalizePublicArticle({ ...item, publishedAt: '2030-01-01' })).toBeNull()
    expect(normalizePublicArticle({ ...item, slug: '../console' })).toBeNull()
    expect(normalizePublicArticle(null)).toBeNull()
  })
  it('uses a real illustration when an editor image is missing or unsafe', () => {
    for (const value of ['javascript:alert(1)', '//evil.example/a.png', '/\\evil.example/a.png', 'data:image/svg+xml,bad']) expect(safeArticleImage(value)).toBeUndefined()
    expect(resolveArticleCover({ slug: 'new-article', title: 'Baru' }).generated).toBe(true)
    expect(resolveArticleCover({ slug: ARTICLES[0]!.slug, featured_image: '/uploads/cover.jpg' }).src).toBe('/uploads/cover.jpg')
  })
})
