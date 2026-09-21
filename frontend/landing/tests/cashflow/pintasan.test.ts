/**
 * useCashflowPintasan — Enter pada tombol/tautan milik peramban (temuan fe p3 #2).
 *
 * Pintasan 'enter' di tab Transaksi/Jejak dulu menelan SETIAP Enter di
 * halaman: tombol ("Tampilkan catatan", pil tab, saringan, pager) dan tautan
 * (CashflowNav, remah) tidak bisa diaktifkan dengan papan ketik, walau tidak
 * ada baris yang disorot.
 *
 * Tanpa DOM (lihat vitest.config.ts): onKeyStroke ditiru untuk menangkap
 * pendengarnya; elemen tiruan punya closest() untuk pemilih sederhana
 * (`tag`, `tag[attr]`, `[attr="nilai"]`).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { pendengar } = vi.hoisted(() => ({ pendengar: [] as ((e: KeyboardEvent) => void)[] }))
vi.mock('@vueuse/core', () => ({ onKeyStroke: (f: (e: KeyboardEvent) => void) => { pendengar.push(f) } }))

interface ElTiruan {
  tagName: string
  attr: Record<string, string>
  induk: ElTiruan | null
  closest: (s: string) => ElTiruan | null
}
function cocok(el: ElTiruan, pemilih: string): boolean {
  const m = /^([a-z]+)?(?:\[([a-z-]+)(?:="([^"]*)")?\])?$/.exec(pemilih.trim())
  if (!m) throw new Error(`pemilih tak didukung: ${pemilih}`)
  const [, tag, nama, nilai] = m
  if (tag && el.tagName.toLowerCase() !== tag) return false
  if (nama && !(nama in el.attr)) return false
  if (nama && nilai !== undefined && el.attr[nama] !== nilai) return false
  return true
}
function el(tag: string, attr: Record<string, string> = {}, induk: ElTiruan | null = null): ElTiruan {
  const x: ElTiruan = {
    tagName: tag.toUpperCase(), attr, induk,
    closest(s) {
      for (let n: ElTiruan | null = x; n; n = n.induk) if (s.split(',').some(p => cocok(n!, p))) return n
      return null
    },
  }
  return x
}
const body = el('body')
const dok = { activeElement: body as unknown, querySelector: () => null as unknown }

function tekan(key: string, target: ElTiruan = body, opsi: Partial<KeyboardEvent> = {}) {
  dok.activeElement = target
  const e = {
    key, target, isComposing: false, metaKey: false, ctrlKey: false, altKey: false, defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true },
    ...opsi,
  }
  for (const f of pendengar) f(e as unknown as KeyboardEvent)
  return e
}

beforeAll(() => vi.stubGlobal('document', dok))
afterAll(() => vi.unstubAllGlobals())
beforeEach(() => { pendengar.length = 0 })

const pasang = async (daftar: Parameters<typeof import('~/composables/cashflow/useCashflowPintasan')['useCashflowPintasan']>[0]) =>
  (await import('~/composables/cashflow/useCashflowPintasan')).useCashflowPintasan(daftar)

describe('Enter pada elemen interaktif milik peramban', () => {
  it('fokus di <button> ("Tampilkan catatan", pil tab, pager) → pintasan tidak menjawab, default tidak dicegah', async () => {
    const aksi = vi.fn()
    await pasang([{ kunci: 'enter', aksi }])
    const e = tekan('Enter', el('button'))
    expect(aksi).not.toHaveBeenCalled()
    expect(e.defaultPrevented).toBe(false)
  })

  it('fokus di <a href> (CashflowNav, remah, kembali) → dibiarkan; juga Cmd+Enter (tab baru)', async () => {
    const aksi = vi.fn()
    await pasang([{ kunci: 'enter', aksi }])
    expect(tekan('Enter', el('a', { href: '/console/cashflow/audit' })).defaultPrevented).toBe(false)
    expect(tekan('Enter', el('a', { href: '#x' }), { metaKey: true }).defaultPrevented).toBe(false)
    expect(aksi).not.toHaveBeenCalled()
  })

  it('fokus di kartu role=button (375 px) atau tombol di dalamnya → dibiarkan ke kartu/tombol', async () => {
    const aksi = vi.fn()
    await pasang([{ kunci: 'enter', aksi }])
    const kartu = el('div', { role: 'button', tabindex: '0' })
    expect(tekan('Enter', kartu).defaultPrevented).toBe(false)
    expect(tekan('Enter', el('button', {}, kartu)).defaultPrevented).toBe(false)
    expect(aksi).not.toHaveBeenCalled()
  })

  it('Spasi pada tombol juga milik tombol', async () => {
    const aksi = vi.fn()
    await pasang([{ kunci: ' ', aksi }])
    expect(tekan(' ', el('button')).defaultPrevented).toBe(false)
    expect(aksi).not.toHaveBeenCalled()
  })

  it('<a> tanpa href dan <div> biasa bukan kontrol → pintasan tetap menjawab', async () => {
    const aksi = vi.fn()
    await pasang([{ kunci: 'enter', aksi }])
    expect(tekan('Enter', el('a')).defaultPrevented).toBe(true)
    expect(tekan('Enter', el('div', { tabindex: '-1' })).defaultPrevented).toBe(true)
    expect(aksi).toHaveBeenCalledTimes(2)
  })

  it('j/k tetap jalan walau fokus di tombol (tombol tidak memakai huruf itu)', async () => {
    const aksi = vi.fn()
    await pasang([{ kunci: 'j', aksi }])
    const e = tekan('j', el('button'))
    expect(aksi).toHaveBeenCalledTimes(1)
    expect(e.defaultPrevented).toBe(true)
  })
})

describe('aksi yang tidak mengerjakan apa-apa tidak mencegah default', () => {
  it('Enter tanpa baris tersorot (aksi → false) → default tidak dicegah', async () => {
    await pasang([{ kunci: 'enter', aksi: () => false }])
    expect(tekan('Enter').defaultPrevented).toBe(false)
  })

  it('Enter dengan baris tersorot (aksi berjalan) → default dicegah', async () => {
    const aksi = vi.fn(() => true)
    await pasang([{ kunci: 'enter', aksi }])
    expect(tekan('Enter').defaultPrevented).toBe(true)
    expect(aksi).toHaveBeenCalledTimes(1)
  })

  it('aksi tanpa nilai kembali (void) tetap dianggap menjawab', async () => {
    await pasang([{ kunci: 'c', aksi: () => {} }])
    expect(tekan('c').defaultPrevented).toBe(true)
  })
})

describe('penjaga lama tetap berlaku', () => {
  it('mengetik di input → tidak menjawab', async () => {
    const aksi = vi.fn()
    await pasang([{ kunci: 'j', aksi }])
    expect(tekan('j', el('input')).defaultPrevented).toBe(false)
    expect(aksi).not.toHaveBeenCalled()
  })

  it('urutan g p tetap jalan; Enter pada tombol di antara g dan p memutus urutan', async () => {
    const aksi = vi.fn()
    await pasang([{ kunci: 'p', awalan: 'g', aksi }])
    tekan('g')
    tekan('p')
    expect(aksi).toHaveBeenCalledTimes(1)
    tekan('g')
    tekan('Enter', el('button'))
    tekan('p')
    expect(aksi).toHaveBeenCalledTimes(1)
  })
})
