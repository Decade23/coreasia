/**
 * Galat basi saat kunci kembali ke jawaban yang SUDAH tersimpan.
 *
 * Tab berkursor (struk, stok, kabar, riwayat patungan, transaksi, jejak,
 * sampah) hanya memuat kunci yang belum tersimpan. Dulu galat/memuat dari
 * kunci sebelumnya tidak dibuang saat kunci pindah ke simpanan: halaman 2
 * gagal → Back ke halaman 1 yang tersimpan → CashflowPanelTab tetap
 * menampilkan galat halaman 2 di atas data yang sebenarnya ada, sampai tab
 * dipasang ulang. Hal serupa bila permintaan A masih berjalan saat pindah ke
 * kunci B yang tersimpan: memuat tetap true, dan galat A muncul di atas B.
 *
 * Tanpa Nuxt: useCashflowKasus diganti simpanan tiruan yang reaktif;
 * useCashflowMuat yang asli.
 */
import { computed, nextTick, ref, shallowReactive, watch } from 'vue'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { GalatAdmin } from '~/composables/cashflow/useCashflowAdmin'
import { useCashflowMuat } from '~/composables/cashflow/useCashflowMuat'

const toast = { success: vi.fn(), error: vi.fn() }

/** Simpanan kasus tiruan: kunci kasus tetap, semua ranah dipegang. */
function kasusTiruan() {
  const simpanan = shallowReactive(new Map<string, unknown>())
  const berjalan = new Map<string, Promise<unknown>>()
  return {
    simpanan,
    kunciKasus: ref('K1|ws'),
    punyaRanah: () => true,
    data: <T>(k: string | null) => (k ? simpanan.get(k) as T | undefined : undefined),
    muatData<T>(k: string, kerja: (kk: { id: string }) => Promise<T>): Promise<T> {
      if (simpanan.has(k)) return Promise.resolve(simpanan.get(k) as T)
      const ada = berjalan.get(k)
      if (ada) return ada as Promise<T>
      const janji = kerja({ id: 'K1' }).then((v) => { simpanan.set(k, v); return v })
        .finally(() => { berjalan.delete(k) })
      berjalan.set(k, janji)
      return janji
    },
    buang: (k: string) => { simpanan.delete(k); berjalan.delete(k) },
  }
}
let kasus = kasusTiruan()

beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('onBeforeUnmount', () => {})
  vi.stubGlobal('useCashflowI18n', () => ({ tcf: (k: string) => k }))
  vi.stubGlobal('useRoute', () => ({ fullPath: '/console/cashflow/ruang/x/struk' }))
  vi.stubGlobal('useToast', () => toast)
  vi.stubGlobal('navigateTo', vi.fn())
  vi.stubGlobal('useCashflowMuat', useCashflowMuat)
  vi.stubGlobal('useCashflowKasus', () => kasus)
})
afterAll(() => vi.unstubAllGlobals())

const modul = async () => (await import('~/composables/cashflow/useCashflowRanahBuku')).useCashflowDataRanah

function tunda() {
  let selesai!: (v: unknown) => void
  let gagal!: (e: unknown) => void
  const janji = new Promise<unknown>((a, b) => { selesai = a; gagal = b })
  return { janji, selesai, gagal }
}
const tenang = async () => { for (let i = 0; i < 5; i++) { await Promise.resolve(); await nextTick() } }

describe('useCashflowDataRanah: galat basi', () => {
  it('kunci A gagal → kembali ke kunci B yang tersimpan: galat null, data B tampil', async () => {
    kasus = kasusTiruan()
    const useDataRanah = await modul()
    const halaman = ref('1')
    const jawaban = new Map<string, ReturnType<typeof tunda>>()
    const r = useDataRanah({
      ranah: 'struk',
      kunci: () => halaman.value,
      panggil: () => { const t = tunda(); jawaban.set(halaman.value, t); return t.janji },
      ubah: (d: unknown) => d,
    })
    jawaban.get('1')!.selesai({ hal: 1 })
    await tenang()
    expect(r.data.value).toEqual({ hal: 1 })

    halaman.value = '2'
    await tenang()
    jawaban.get('2')!.gagal(new GalatAdmin('argumen', 'kursor rusak', 'kursor'))
    await tenang()
    expect(r.galat.value).not.toBeNull()

    halaman.value = '1' // Back ke halaman yang tersimpan: tidak ada RPC baru
    await tenang()
    expect(jawaban.size).toBe(2)
    expect(r.galat.value).toBeNull()
    expect(r.memuat.value).toBe(false)
    expect(r.data.value).toEqual({ hal: 1 })
  })

  it('A masih berjalan saat pindah ke B yang tersimpan: memuat mati, galat A yang tiba belakangan tidak tampil', async () => {
    kasus = kasusTiruan()
    const useDataRanah = await modul()
    const halaman = ref('1')
    const jawaban = new Map<string, ReturnType<typeof tunda>>()
    const r = useDataRanah({
      ranah: 'struk',
      kunci: () => halaman.value,
      panggil: () => { const t = tunda(); jawaban.set(halaman.value, t); return t.janji },
      ubah: (d: unknown) => d,
    })
    jawaban.get('1')!.selesai({ hal: 1 })
    await tenang()
    halaman.value = '2'
    await tenang()
    expect(r.memuat.value).toBe(true)
    halaman.value = '1'
    await tenang()
    expect(r.memuat.value).toBe(false)
    jawaban.get('2')!.gagal(new TypeError('Failed to fetch'))
    await tenang()
    expect(r.galat.value).toBeNull()
    expect(r.data.value).toEqual({ hal: 1 })
  })
})

describe('pakaiSimpanan', () => {
  it('membuang galat, mematikan memuat, dan membuat muat yang berjalan basi', async () => {
    const { memuat, galat, muat, pakaiSimpanan } = useCashflowMuat()
    await muat(async () => { throw new GalatAdmin('argumen', 'x') })
    expect(galat.value).not.toBeNull()
    const j = tunda()
    let saatTiba: boolean | null = null
    const p = muat(async (terbaru) => { await j.janji; saatTiba = terbaru() })
    pakaiSimpanan()
    expect(galat.value).toBeNull()
    expect(memuat.value).toBe(false)
    j.selesai(null)
    await p
    expect(saatTiba).toBe(false)
  })
})

describe('penjaga: semua watcher simpanan membuang galat kunci lama', () => {
  it('tidak ada lagi `if (!k || mentah…) return` — kunci tersimpan memanggil pakaiSimpanan()', async () => {
    const { readFileSync } = await import('node:fs')
    const { join, resolve } = await import('node:path')
    const { fileURLToPath } = await import('node:url')
    const akar = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
    const BERKAS = [
      'components/cashflow/CashflowTabTransaksi.vue', 'components/cashflow/CashflowTabDompet.vue',
      'components/cashflow/CashflowTabJejak.vue', 'components/cashflow/CashflowLaciTransaksi.vue',
      'pages/console/cashflow/ruang/[id]/sampah.vue', 'composables/cashflow/useCashflowRanahBuku.ts',
    ]
    for (const b of BERKAS) {
      const isi = readFileSync(join(akar, b), 'utf8')
      expect(isi, b).not.toMatch(/if \(!?k (\|\||&&) !?mentah/)
      expect(isi, b).toMatch(/pakaiSimpanan\(\)/)
    }
  })
})
