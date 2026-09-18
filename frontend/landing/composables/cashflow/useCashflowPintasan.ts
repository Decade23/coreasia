/**
 * Pintasan papan ketik modul CashFlow.
 *
 * Mati saat fokus di input/textarea/select/contenteditable: '/' atau 'k' yang
 * diketik di kolom cari atau alasan harus menjadi huruf, bukan perintah. Mati
 * juga saat ada modal terbuka (gerbang alasan, palet) — modal itu sendiri yang
 * memegang papan ketik, dan dua modal bertumpuk yang sama-sama mendengar Esc
 * menutup keduanya sekaligus.
 */
import { onKeyStroke } from '@vueuse/core'

export interface Pintasan {
  /** e.key dalam huruf kecil: 'k', '/'. */
  kunci: string
  /** Butuh Cmd (macOS) atau Ctrl (lainnya). */
  meta?: boolean
  aksi: (e: KeyboardEvent) => void
}

export const sedangMengetik = (el: EventTarget | null): boolean => {
  const x = el as { tagName?: string; isContentEditable?: boolean } | null
  if (!x) return false
  if (x.isContentEditable) return true
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes((x.tagName ?? '').toUpperCase())
}

export const useCashflowPintasan = (daftar: Pintasan[]) => {
  if (import.meta.server) return
  onKeyStroke((e: KeyboardEvent) => {
    if (e.isComposing || e.defaultPrevented) return
    if (sedangMengetik(e.target) || sedangMengetik(document.activeElement)) return
    if (document.querySelector('[aria-modal="true"]')) return
    const denganMeta = e.metaKey || e.ctrlKey
    for (const p of daftar) {
      if (e.key.toLowerCase() !== p.kunci) continue
      if (p.meta ? !denganMeta : (denganMeta || e.altKey)) continue
      e.preventDefault()
      p.aksi(e)
      return
    }
  })
}
