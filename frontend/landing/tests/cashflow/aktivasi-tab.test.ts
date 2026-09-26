/**
 * Kontrak pemicu admin_kasus_tambah tab Fase 3 (spek console Fase 3 §6,
 * F3-21): ranah ditambah HANYA dari aktivasi tab oleh pengguna (peristiwa
 * isTrusted) atau tombol "Muat data" — tidak dari URL/refresh/Back, tidak
 * dari peristiwa buatan skrip, paling banyak sekali per aktivasi. Ditambah
 * lencana tab Fase 3 murni dari hitung{} (K-F3-7).
 */
import { nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import {
  ambilAktivasi, aktivasiSah, catatAktivasi, jalurTab, useCashflowRanahAktivasi, BATAS_AKTIVASI_MS, type TandaAktivasi,
} from '~/composables/cashflow/useCashflowAktivasiTab'
import { lencanaTabRuang, tabAktivasiRuang, RANAH_BUKU_RUANG, RANAH_TAB_RUANG, TAB_RUANG, type HitungRuangDTO } from '~/adapters/cashflowRuang'
import { lencanaTabPengguna, tabAktivasiPengguna, TAB_PENGGUNA, RANAH_FASE1 } from '~/adapters/cashflowKasus'
import type { Kasus } from '~/adapters/cashflowKasus'

const DASAR = '/console/cashflow/ruang/5a60c1e2-2d3a-4b5c-8d7e-9f0a1b2c3d4e'
const klik = (isTrusted = true) => ({ isTrusted }) as Event

function kasusPalsu(awal: Partial<Kasus> | null) {
  const kasus = ref<Kasus | null>(awal ? ({ id: 'k1', ranah: ['ruang'], anak: false, ...awal } as Kasus) : null)
  const tambah = vi.fn(async (r: readonly string[]) => { if (kasus.value) kasus.value = { ...kasus.value, ranah: [...kasus.value.ranah, ...r] } })
  return { kasus, tambah, punyaRanah: (r: string) => !!kasus.value?.ranah.includes(r) }
}
const jalankan = (kerja: () => Promise<void>) => kerja()

describe('tanda aktivasi tab', () => {
  it('hanya peristiwa isTrusted yang menandai; jalur dinormalkan (tanpa query/hash/garis miring akhir)', () => {
    const t = ref<TandaAktivasi | null>(null)
    expect(catatAktivasi(t, `${DASAR}/usaha`, klik(false), 1000)).toBe(false)
    expect(catatAktivasi(t, `${DASAR}/usaha`, null, 1000)).toBe(false)
    expect(t.value).toBeNull()
    expect(catatAktivasi(t, `${DASAR}/usaha/?produk=x#a`, klik(), 1000)).toBe(true)
    expect(t.value).toEqual({ jalur: `${DASAR}/usaha`, pada: 1000 })
    expect(aktivasiSah(klik())).toBe(true)
    expect(jalurTab('/a/b/')).toBe('/a/b')
  })
  it('diambil SEKALI oleh tab tujuan; jalur lain tidak mengambilnya; basi sesudah batas waktu', () => {
    const t = ref<TandaAktivasi | null>(null)
    catatAktivasi(t, `${DASAR}/usaha`, klik(), 1000)
    expect(ambilAktivasi(t, `${DASAR}/jadwal`, 1100)).toBe(false)
    expect(t.value).not.toBeNull()
    expect(ambilAktivasi(t, `${DASAR}/usaha`, 1100)).toBe(true)
    expect(ambilAktivasi(t, `${DASAR}/usaha`, 1200)).toBe(false) // Back/refresh sesudahnya: tidak ada tanda
    catatAktivasi(t, `${DASAR}/usaha`, klik(), 1000)
    expect(ambilAktivasi(t, `${DASAR}/usaha`, 1000 + BATAS_AKTIVASI_MS + 1)).toBe(false)
    expect(t.value).toBeNull()
  })
  it('klik tab yang SEDANG terbuka tidak menandai dan membuang tanda lama (Back→Forward bukan aktivasi)', () => {
    const t = ref<TandaAktivasi | null>(null)
    catatAktivasi(t, `${DASAR}/usaha`, klik(), 900)
    expect(catatAktivasi(t, `${DASAR}/katalog`, klik(), 1000, `${DASAR}/katalog/`)).toBe(false)
    expect(t.value).toBeNull()
    // Back ke Transaksi lalu Forward ke Katalog dalam 30 detik: tidak ada tanda.
    expect(ambilAktivasi(t, `${DASAR}/katalog`, 5000)).toBe(false)
    expect(catatAktivasi(t, `${DASAR}/katalog`, klik(), 1000, `${DASAR}/transaksi`)).toBe(true)
  })
})

describe('penambahan ranah saat tab diaktifkan (useCashflowRanahAktivasi)', () => {
  it('diaktifkan + kasus tanpa ranah → tambah SEKALI; kasus berganti sesudahnya tidak mewarisi aktivasi', async () => {
    const k = kasusPalsu({ id: 'k1' })
    useCashflowRanahAktivasi(k, 'usaha', true, jalankan)
    await nextTick()
    expect(k.tambah).toHaveBeenCalledTimes(1)
    expect(k.tambah).toHaveBeenCalledWith(['usaha'])
    k.kasus.value = { id: 'k2', ranah: ['ruang'], anak: false } as unknown as Kasus
    await nextTick()
    expect(k.tambah).toHaveBeenCalledTimes(1)
  })
  it('dibuka dari URL/refresh/Back (tanpa aktivasi) → tidak menambah apa pun', async () => {
    const k = kasusPalsu({ id: 'k1' })
    useCashflowRanahAktivasi(k, 'usaha', false, jalankan)
    await nextTick()
    k.kasus.value = { id: 'k2', ranah: ['ruang'], anak: false } as unknown as Kasus
    await nextTick()
    expect(k.tambah).not.toHaveBeenCalled()
  })
  it('aktivasi sebelum kasus terpasang → ditambah saat kasus pertama tiba', async () => {
    const k = kasusPalsu(null)
    useCashflowRanahAktivasi(k, 'kabar', true, jalankan)
    expect(k.tambah).not.toHaveBeenCalled()
    k.kasus.value = { id: 'k1', ranah: ['akun'], anak: false } as unknown as Kasus
    await nextTick()
    expect(k.tambah).toHaveBeenCalledWith(['kabar'])
  })
  it('kasus pertama sudah memegang ranah → aktivasi habis; kasus anak tidak pernah ditambah', async () => {
    const k = kasusPalsu({ id: 'k1', ranah: ['ruang', 'usaha'] })
    useCashflowRanahAktivasi(k, 'usaha', true, jalankan)
    k.kasus.value = { id: 'k2', ranah: ['ruang'], anak: false } as unknown as Kasus
    await nextTick()
    expect(k.tambah).not.toHaveBeenCalled()
    const a = kasusPalsu({ id: 'a1', ranah: ['teks'], anak: true })
    useCashflowRanahAktivasi(a, 'usaha', true, jalankan)
    expect(a.tambah).not.toHaveBeenCalled()
  })
  it('"Muat data": hanya klik isTrusted; tidak untuk ranah yang sudah ada; tidak ganda saat masih menambah', async () => {
    const k = kasusPalsu({ id: 'k1' })
    const { muatData } = useCashflowRanahAktivasi(k, 'struk', false, jalankan)
    expect(await muatData(klik(false))).toBe(false)
    expect(await muatData(null)).toBe(false)
    expect(k.tambah).not.toHaveBeenCalled()
    const [a, b] = await Promise.all([muatData(klik()), muatData(klik())])
    expect([a, b]).toEqual([true, false])
    expect(k.tambah).toHaveBeenCalledTimes(1)
    expect(await muatData(klik())).toBe(false) // ranah sudah dipegang
  })
})

describe('tab & lencana Fase 3', () => {
  const h: HitungRuangDTO = { anggota: 2, bekas_anggota: 1, undangan_aktif: 0, transaksi: 40, dompet: 3, jejak: 9, sampah: 3 }
  it('tab ranah buku = aktivasi; ranah Fase 3 tidak ikut kasus otomatis', () => {
    expect(TAB_RUANG.filter(tabAktivasiRuang)).toEqual([...RANAH_BUKU_RUANG])
    for (const t of RANAH_BUKU_RUANG) expect(RANAH_TAB_RUANG[t]).toBe(t)
    expect(TAB_PENGGUNA.filter(tabAktivasiPengguna)).toEqual(['perangkat', 'kabar'])
    expect(RANAH_FASE1).not.toContain('perangkat')
    expect(RANAH_FASE1).not.toContain('kabar')
    expect(TAB_RUANG.length).toBeGreaterThan(9) // pintasan angka hanya 1–9
  })
  it('Ruang 360: katalog/usaha/struk dari hitung 0095; jadwal = jadwal aktif (0 → null); tanpa kunci 0095 = belum diketahui', () => {
    const baru = { ...h, kategori: 12, anggaran: 3, jadwal_aktif: 0, produk: 0, struk: 1840, patungan_bagi: 6, pelunasan: 1 }
    expect(['katalog', 'jadwal', 'usaha', 'struk'].map(t => lencanaTabRuang(t as never, baru, null))).toEqual([12, null, 0, 1840])
    expect(lencanaTabRuang('jadwal', { ...baru, jadwal_aktif: 2 }, null)).toBe(2)
    expect(['katalog', 'jadwal', 'usaha', 'struk'].map(t => lencanaTabRuang(t as never, h, null))).toEqual([null, null, null, null])
  })
  it('Pengguna 360: perangkat & kabar dari hitung 0095; null = belum diketahui; transaksi + sampah', () => {
    const p = { ruang: 2, transaksi: 40, jejak: 12, sampah: 1, perangkat: 2, kabar: 0 }
    expect(TAB_PENGGUNA.map(t => lencanaTabPengguna(t, p, 5))).toEqual([null, 2, 41, 12, 5, null, 2, 0])
    expect(lencanaTabPengguna('perangkat', { ...p, perangkat: null }, 5)).toBeNull()
    // 0 token push ≠ tab kosong (sesi auth & antrean ikut tampil): jangan ke "Lainnya (0)".
    expect(lencanaTabPengguna('perangkat', { ...p, perangkat: 0 }, 5)).toBeNull()
    expect(lencanaTabPengguna('kabar', null, 5)).toBeNull()
  })
})
