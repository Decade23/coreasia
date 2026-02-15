/**
 * Lightweight scroll-reveal composable using Intersection Observer + CSS.
 * Provides Framer Motion-like entrance animations without heavy JS runtime.
 *
 * Usage in templates:
 *   <div ref="el1">  +  const el1 = useReveal()
 *   <div ref="el2">  +  const el2 = useReveal('slideLeft', 200)
 *
 * Or use the directive-style helper for lists:
 *   <div v-for="(item, i) in items" :ref="revealRef('fadeUp', i * 100)">
 *
 * Available presets: fadeUp, fadeIn, slideLeft, slideRight, scaleUp
 *
 * Requires CSS in main.css (sr-init / sr-visible classes).
 */

import type { ComponentPublicInstance } from 'vue'

export type RevealPreset = 'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight' | 'scaleUp'

interface PendingReveal {
  element: HTMLElement
  delay: number
  preset: RevealPreset
}

export function useScrollReveal() {
  // Guard for SSR - IntersectionObserver is not available on server
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    const noop = () => {}
    return {
      useReveal: () => ref(null),
      revealRef: () => noop
    }
  }

  // Single shared observer for all elements
  const pendingReveals = new WeakMap<Element, PendingReveal>()

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pending = pendingReveals.get(entry.target)
          if (pending) {
            const { delay } = pending
            if (delay > 0) {
              setTimeout(() => entry.target.classList.add('sr-visible'), delay)
            } else {
              entry.target.classList.add('sr-visible')
            }
            observer.unobserve(entry.target)
            pendingReveals.delete(entry.target)
          }
        }
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
  )

  onUnmounted(() => {
    observer.disconnect()
  })

  /**
   * Creates a template ref that auto-observes the element for scroll reveal.
   */
  const useReveal = (preset: RevealPreset = 'fadeUp', delay = 0) => {
    const elRef = ref<HTMLElement | null>(null)

    onMounted(() => {
      const el = elRef.value
      if (!el) return
      el.classList.add('sr-init', `sr-${preset}`)
      pendingReveals.set(el, { element: el, delay, preset })
      observer.observe(el)
    })

    return elRef
  }

  /**
   * For v-for lists: returns a ref callback function.
   * Usage: :ref="revealRef('fadeUp', index * 100)"
   */
  const revealRef = (preset: RevealPreset = 'fadeUp', delay = 0) => {
    return (el: Element | ComponentPublicInstance | null) => {
      const htmlEl = (el as ComponentPublicInstance)?.$el ?? el
      if (!htmlEl || !(htmlEl instanceof HTMLElement)) return
      htmlEl.classList.add('sr-init', `sr-${preset}`)
      pendingReveals.set(htmlEl, { element: htmlEl, delay, preset })
      observer.observe(htmlEl)
    }
  }

  return { useReveal, revealRef }
}
