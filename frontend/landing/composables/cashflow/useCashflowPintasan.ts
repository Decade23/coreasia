/**
 * Pintasan papan ketik modul CashFlow.
 *
 * Mati saat fokus di input/textarea/select/contenteditable: '/' atau 'k' yang
 * diketik di kolom cari atau alasan harus menjadi huruf, bukan perintah. Mati
 * juga saat ada modal terbuka (palet, laci) — modal itu sendiri yang
 * memegang papan ketik, dan dua modal bertumpuk yang sama-sama mendengar Esc
 * menutup keduanya sekaligus.
 *
 * Enter/Spasi pada tombol, tautan, atau kontrol ber-role milik PERAMBAN
 * (temuan fe p3 #2): fokus di elemen seperti itu = tekanannya dibiarkan,
 * tidak ada pintasan yang menjawab maupun mencegah default-nya. Selain itu
 * aksi yang mengembalikan `false` ("tidak ada yang dikerjakan", mis. Enter
 * tanpa baris tersorot) juga tidak mencegah default-nya.
 */
import { onKeyStroke } from '@vueuse/core'

export interface Pintasan {
  /** e.key dalam huruf kecil: 'k', '/', 'enter', '['. */
  kunci: string
  /** Butuh Cmd (macOS) atau Ctrl (lainnya). */
  meta?: boolean
  /** Tombol awalan urutan dua tekan, mis. 'g' untuk `g p` (maks. 1,5 detik). */
  awalan?: string
  /** `false` = tidak ada yang dikerjakan: tekanan ini dibiarkan ke peramban. */
  aksi: (e: KeyboardEvent) => void | boolean
}

/* Awalan urutan (`g` pada `g p`) yang sedang menunggu tombol kedua. Satu
   untuk semua pendaftar: `g` ditekan sekali, siapa pun pemilik `g p` yang
   menjawab tombol berikutnya. Awalan hanya berlaku untuk SATU tekanan
   sesudahnya (`berikut`) — `g` lalu `x` lalu `p` bukan `g p` — dan setiap
   pendaftar melihat keputusan yang sama untuk tekanan itu. */
let awalanTertunda: { kunci: string; sampai: number; pemicu: KeyboardEvent; berikut?: KeyboardEvent } | null = null
const JEDA_URUTAN_MS = 1500

/** Awalan yang berlaku untuk tekanan `e`, atau null. */
function awalanUntuk(e: KeyboardEvent): string | null {
  const a = awalanTertunda
  if (!a || a.pemicu === e) return null
  a.berikut ??= e
  if (a.berikut === e && a.sampai > Date.now()) return a.kunci
  awalanTertunda = null
  return null
}

export const sedangMengetik = (el: EventTarget | null): boolean => {
  const x = el as { tagName?: string; isContentEditable?: boolean } | null
  if (!x) return false
  if (x.isContentEditable) return true
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes((x.tagName ?? '').toUpperCase())
}

/** Elemen yang Enter/Spasi-nya diaktifkan peramban (atau komponennya) sendiri. */
const INTERAKTIF = [
  'button', 'a[href]', 'area[href]', 'summary',
  '[role="button"]', '[role="link"]', '[role="tab"]', '[role="menuitem"]', '[role="option"]',
  '[role="checkbox"]', '[role="radio"]', '[role="switch"]',
].join(',')

/** Tekanan ini mengaktifkan elemen yang sedang difokus (Enter/Spasi pada tombol, tautan, …)? */
export const aktivasiAsli = (kunci: string, el: EventTarget | null): boolean => {
  if (kunci !== 'enter' && kunci !== ' ') return false
  const x = el as { closest?: (s: string) => unknown } | null
  return typeof x?.closest === 'function' && !!x.closest(INTERAKTIF)
}

export const useCashflowPintasan = (daftar: Pintasan[]) => {
  if (import.meta.server) return
  onKeyStroke((e: KeyboardEvent) => {
    if (e.isComposing || e.defaultPrevented) return
    if (sedangMengetik(e.target) || sedangMengetik(document.activeElement)) return
    if (document.querySelector('[aria-modal="true"]')) return
    const denganMeta = e.metaKey || e.ctrlKey
    const kunci = e.key.toLowerCase()
    const tunda = awalanUntuk(e)
    // Enter pada tombol/tautan yang difokus milik elemen itu (klik, ikuti tautan).
    if (aktivasiAsli(kunci, e.target) || aktivasiAsli(kunci, document.activeElement)) return
    for (const p of daftar) {
      if (kunci !== p.kunci) continue
      if (p.meta ? !denganMeta : (denganMeta || e.altKey)) continue
      // Urutan: hanya menjawab bila awalannya baru ditekan; tombol tunggal
      // tidak menjawab tombol kedua sebuah urutan (`g` lalu `k` ≠ baris naik).
      if ((p.awalan ?? null) !== tunda) continue
      if (p.aksi(e) === false) continue
      e.preventDefault()
      awalanTertunda = null
      return
    }
    // Awalan yang dikenal pendaftar mana pun: tunggu tombol kedua.
    if (!denganMeta && !e.altKey && daftar.some(p => p.awalan === kunci)) {
      awalanTertunda = { kunci, sampai: Date.now() + JEDA_URUTAN_MS, pemicu: e }
    }
  })
}
