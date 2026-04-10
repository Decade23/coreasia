<script setup lang="ts">
import { transformSync } from 'ultrahtml'
import sanitize from 'ultrahtml/transformers/sanitize'

const props = defineProps<{
  content: string
}>()

const requestUrl = import.meta.server ? useRequestURL() : null

const currentOrigin = computed(() => {
  if (import.meta.server && requestUrl) {
    return requestUrl.origin
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return 'https://coreasia.id'
})

const internalHosts = computed(() => {
  const hosts = new Set(['coreasia.id', 'www.coreasia.id'])

  try {
    hosts.add(new URL(currentOrigin.value).host.toLowerCase())
  } catch {
    // Ignore invalid origins and keep the default CoreAsia host aliases.
  }

  return hosts
})

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const renderInlineMarkdown = (value: string) => {
  const escaped = escapeHtml(value)

  return escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
}

const markdownToHtml = (markdown: string) => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const html: string[] = []
  let paragraphBuffer: string[] = []
  let bulletItems: string[] = []
  let orderedItems: string[] = []

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return
    html.push(`<p>${renderInlineMarkdown(paragraphBuffer.join(' '))}</p>`)
    paragraphBuffer = []
  }

  const flushBullets = () => {
    if (!bulletItems.length) return
    html.push(`<ul>${bulletItems.map(item => `<li>${item}</li>`).join('')}</ul>`)
    bulletItems = []
  }

  const flushOrdered = () => {
    if (!orderedItems.length) return
    html.push(`<ol>${orderedItems.map(item => `<li>${item}</li>`).join('')}</ol>`)
    orderedItems = []
  }

  const flushAll = () => {
    flushParagraph()
    flushBullets()
    flushOrdered()
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (!line) {
      flushAll()
      continue
    }

    if (/^<\/?[a-z][\s\S]*>$/i.test(line)) {
      flushAll()
      html.push(line)
      continue
    }

    if (/^###{1}\s+/.test(line)) {
      flushAll()
      html.push(`<h3>${renderInlineMarkdown(line.replace(/^###\s+/, ''))}</h3>`)
      continue
    }

    if (/^##\s+/.test(line)) {
      flushAll()
      html.push(`<h2>${renderInlineMarkdown(line.replace(/^##\s+/, ''))}</h2>`)
      continue
    }

    if (/^>\s+/.test(line)) {
      flushAll()
      html.push(`<blockquote><p>${renderInlineMarkdown(line.replace(/^>\s+/, ''))}</p></blockquote>`)
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      flushParagraph()
      flushBullets()
      orderedItems.push(renderInlineMarkdown(line.replace(/^\d+\.\s+/, '')))
      continue
    }

    if (/^-\s+/.test(line)) {
      flushParagraph()
      flushOrdered()
      bulletItems.push(renderInlineMarkdown(line.replace(/^-\s+/, '')))
      continue
    }

    paragraphBuffer.push(line)
  }

  flushAll()

  return html.join('\n')
}

const isUnsafeScheme = (value: string) => /^(?:javascript|data|vbscript|file):/i.test(value)

const normalizeHref = (href: string) => {
  const trimmedHref = href.trim()

  if (!trimmedHref || isUnsafeScheme(trimmedHref)) {
    return { href: '#', internal: true }
  }

  if (trimmedHref.startsWith('#') || trimmedHref.startsWith('mailto:') || trimmedHref.startsWith('tel:')) {
    return { href: trimmedHref, internal: true }
  }

  if (trimmedHref.startsWith('/')) {
    return { href: trimmedHref, internal: true }
  }

  try {
    const parsed = new URL(trimmedHref, currentOrigin.value)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { href: '#', internal: true }
    }

    if (internalHosts.value.has(parsed.host.toLowerCase())) {
      return {
        href: `${parsed.pathname}${parsed.search}${parsed.hash}` || '/',
        internal: true,
      }
    }

    return { href: parsed.toString(), internal: false }
  } catch {
    return { href: '#', internal: true }
  }
}

const normalizeImageSrc = (src: string) => {
  const trimmedSrc = src.trim()

  if (!trimmedSrc || isUnsafeScheme(trimmedSrc)) {
    return ''
  }

  if (trimmedSrc.startsWith('/')) {
    return trimmedSrc
  }

  try {
    const parsed = new URL(trimmedSrc, currentOrigin.value)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return ''
    }

    if (internalHosts.value.has(parsed.host.toLowerCase())) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}` || ''
    }

    return parsed.toString()
  } catch {
    return ''
  }
}

const sanitizeHtml = (html: string) => {
  return transformSync(html, [
    sanitize({
      allowElements: ['a', 'blockquote', 'br', 'code', 'em', 'figure', 'figcaption', 'h2', 'h3', 'h4', 'hr', 'img', 'li', 'ol', 'p', 'pre', 'strong', 'ul'],
      allowAttributes: {
        href: ['a'],
        title: ['a', 'img'],
        src: ['img'],
        alt: ['img'],
        width: ['img'],
        height: ['img'],
        loading: ['img'],
        decoding: ['img'],
      },
      blockElements: ['html', 'body'],
      dropElements: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    }),
  ])
}

const normalizeLinks = (html: string) => html.replace(
  /<a\b([^>]*?)href=(['"])(.*?)\2([^>]*)>/gi,
  (_match, before, quote, href, after) => {
    const normalized = normalizeHref(href)
    const attrs = `${before}${after}`.toLowerCase()
    let extraAttrs = ''

    if (!normalized.internal) {
      if (!attrs.includes('target=')) {
        extraAttrs += ' target="_blank"'
      }
      if (!attrs.includes('rel=')) {
        extraAttrs += ' rel="noopener noreferrer"'
      }
    }

    return `<a${before}href=${quote}${normalized.href}${quote}${after}${extraAttrs}>`
  },
)

const normalizeImages = (html: string) => html.replace(
  /<img\b([^>]*?)src=(['"])(.*?)\2([^>]*)\/?\s*>/gi,
  (_match, before, quote, src, after) => {
    const normalizedSrc = normalizeImageSrc(src)
    if (!normalizedSrc) {
      return ''
    }

    return `<img${before}src=${quote}${normalizedSrc}${quote}${after}>`
  },
)

const renderedHtml = computed(() => {
  const rawContent = props.content?.trim() || ''
  if (!rawContent) return ''

  const html = /<\/?[a-z][\s\S]*>/i.test(rawContent)
    ? rawContent
    : markdownToHtml(rawContent)

  const sanitizedHtml = sanitizeHtml(html)

  return normalizeImages(normalizeLinks(sanitizedHtml))
})
</script>

<template>
  <div class="ca-article-prose" v-html="renderedHtml" />
</template>

<style scoped>
.ca-article-prose {
  color: var(--ca-muted);
}

.ca-article-prose :deep(*) {
  max-width: 100%;
}

.ca-article-prose :deep(p) {
  margin: 0;
  font-size: 1.03rem;
  line-height: 1.9;
  color: var(--ca-muted);
}

.ca-article-prose :deep(p + p),
.ca-article-prose :deep(p + ul),
.ca-article-prose :deep(p + ol),
.ca-article-prose :deep(ul + p),
.ca-article-prose :deep(ol + p),
.ca-article-prose :deep(blockquote + p),
.ca-article-prose :deep(h2 + p),
.ca-article-prose :deep(h3 + p),
.ca-article-prose :deep(hr + p) {
  margin-top: 1.1rem;
}

.ca-article-prose :deep(h2),
.ca-article-prose :deep(h3),
.ca-article-prose :deep(h4) {
  margin: 2.25rem 0 0;
  font-family: var(--font-display);
  color: var(--ca-text);
  letter-spacing: -0.02em;
}

.ca-article-prose :deep(h2) {
  font-size: clamp(1.6rem, 3.2vw, 2.25rem);
  line-height: 1.15;
}

.ca-article-prose :deep(h3) {
  font-size: clamp(1.2rem, 2.4vw, 1.55rem);
  line-height: 1.22;
}

.ca-article-prose :deep(h4) {
  font-size: 1.05rem;
  line-height: 1.35;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.ca-article-prose :deep(ul),
.ca-article-prose :deep(ol) {
  margin: 1.15rem 0 0;
  padding-left: 1.35rem;
  color: var(--ca-muted);
}

.ca-article-prose :deep(li) {
  margin-top: 0.7rem;
  padding-left: 0.2rem;
  font-size: 1rem;
  line-height: 1.8;
}

.ca-article-prose :deep(blockquote) {
  margin: 1.5rem 0 0;
  border-left: 3px solid var(--ca-kicker);
  padding-left: 1rem;
  color: var(--ca-text);
}

.ca-article-prose :deep(code) {
  border-radius: 0.45rem;
  background: color-mix(in oklab, var(--ca-panel-bg-strong) 86%, black 14%);
  padding: 0.15rem 0.45rem;
  font-size: 0.92em;
}

.ca-article-prose :deep(pre) {
  margin-top: 1.2rem;
  overflow-x: auto;
  border-radius: 1rem;
  background: color-mix(in oklab, var(--ca-panel-bg-strong) 88%, black 12%);
  padding: 1rem;
}

.ca-article-prose :deep(pre code) {
  background: transparent;
  padding: 0;
}

.ca-article-prose :deep(a) {
  color: var(--ca-text);
  text-decoration: underline;
  text-decoration-color: color-mix(in oklab, var(--ca-kicker) 70%, transparent 30%);
  text-underline-offset: 0.16em;
}

.ca-article-prose :deep(img) {
  margin-top: 1.4rem;
  width: 100%;
  border-radius: 1.35rem;
  border: 1px solid var(--ca-border);
}
</style>