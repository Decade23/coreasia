/**
 * Perilaku tab bersama Fase 2 yang dulu hanya dijaga regex teks sumber
 * (fase2-penjaga): ranah dompet otomatis, p_ws tab Dompet, argumen Jejak,
 * dan Selidiki sekali jalan. Tanpa Nuxt: fungsinya murni atau hanya memakai
 * reaktivitas vue.
 */
import { nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { subjekJejak, wsTabDompet } from '~/adapters/cashflowRuang'
import { useCashflowRanahOtomatis } from '~/composables/cashflow/useCashflowRanahOtomatis'
import { useCashflowSekaliJalan } from '~/composables/cashflow/useCashflowSekaliJalan'
import type { Kasus } from '~/adapters/cashflowKasus'

const W1 = '0b6f5c1e-2d3a-4b5c-8d7e-9f0a1b2c3d4e'
const U = '3f0c2a4e-8b1d-4c6a-9e2f-1a2b3c4d5e6f'

function kasusPalsu(awal: Partial<Kasus> | null) {
  const kasus = ref<Kasus | null>(awal ? ({ id: 'k1', ranah: ['akun'], anak: false, ...awal } as Kasus) : null)
  const tambah = vi.fn(async () => {})
  return { kasus, tambah, punyaRanah: (r: string) => !!kasus.value?.ranah.includes(r) }
}
const jalankan = (kerja: () => Promise<void>) => kerja()

describe('ranah dompet otomatis (tab Dompet)', () => {
  it('tab dibuka SESUDAH kasus terpasang (kasus tidak berubah lagi) → ranah ditambah seketika', () => {
    const k = kasusPalsu({ id: 'k1' })
    useCashflowRanahOtomatis(k, 'dompet', jalankan)
    expect(k.tambah).toHaveBeenCalledTimes(1)
    expect(k.tambah).toHaveBeenCalledWith(['dompet'])
  })
  it('sekali per kasus; kasus baru mencoba lagi; ranah yang sudah ada dan kasus anak tidak ditambah', async () => {
    const k = kasusPalsu(null)
    useCashflowRanahOtomatis(k, 'dompet', jalankan)
    expect(k.tambah).not.toHaveBeenCalled()
    k.kasus.value = { id: 'k1', ranah: ['akun'], anak: false } as unknown as Kasus
    await nextTick()
    k.kasus.value = { id: 'k1', ranah: ['akun', 'jejak'], anak: false } as unknown as Kasus
    await nextTick()
    expect(k.tambah).toHaveBeenCalledTimes(1)
    k.kasus.value = { id: 'k2', ranah: ['akun'], anak: false } as unknown as Kasus
    await nextTick()
    expect(k.tambah).toHaveBeenCalledTimes(2)
    k.kasus.value = { id: 'k3', ranah: ['akun', 'dompet'], anak: false } as unknown as Kasus
    await nextTick()
    k.kasus.value = { id: 'k4', ranah: ['teks'], anak: true } as unknown as Kasus
    await nextTick()
    expect(k.tambah).toHaveBeenCalledTimes(2)
  })
})

describe('p_ws tab Dompet', () => {
  it('pengguna = null (semua lingkup); ruang = ruang itu; ruang tak diketahui = jangan muat', () => {
    expect(wsTabDompet('pengguna', W1)).toBeNull()
    expect(wsTabDompet('pengguna', null)).toBeNull()
    expect(wsTabDompet('ruang', W1)).toBe(W1)
    // Bukan null: p_ws null di Ruang 360 menampilkan dompet ruang LAIN di lingkup kasus.
    expect(wsTabDompet('ruang', null)).toBeUndefined()
    expect(wsTabDompet('ruang', '')).toBeUndefined()
  })
})

describe('argumen admin_jejak', () => {
  it('ruang: aktor null, p_ws = subjek (saringan diabaikan); pengguna: aktor = subjek, p_ws = saringan', () => {
    expect(subjekJejak('ruang', W1, U)).toEqual({ aktor: null, ruang: W1 })
    expect(subjekJejak('pengguna', U, W1)).toEqual({ aktor: U, ruang: W1 })
    expect(subjekJejak('pengguna', U, null)).toEqual({ aktor: U, ruang: null })
  })
})

describe('Selidiki sekali jalan', () => {
  it('dua klik serentak (baris sama atau lain) = satu kerja; sesudah selesai boleh lagi', async () => {
    let selesai!: () => void
    const kerja = vi.fn((_id: number) => new Promise<void>((a) => { selesai = a }))
    const s = useCashflowSekaliJalan(kerja)
    const p1 = s.jalankan(7)
    const p2 = s.jalankan(7)
    const p3 = s.jalankan(8)
    expect(s.sibuk.value).toBe(7)
    expect(await p2).toBe(false)
    expect(await p3).toBe(false)
    selesai()
    expect(await p1).toBe(true)
    expect(kerja).toHaveBeenCalledTimes(1)
    expect(s.sibuk.value).toBeNull()
    const p4 = s.jalankan(8)
    selesai()
    await p4
    expect(kerja).toHaveBeenCalledTimes(2)
  })
  it('kerja gagal → sibuk dilepas', async () => {
    const s = useCashflowSekaliJalan(async () => { throw new Error('x') })
    await expect(s.jalankan(1)).rejects.toThrow('x')
    expect(s.sibuk.value).toBeNull()
  })
})
