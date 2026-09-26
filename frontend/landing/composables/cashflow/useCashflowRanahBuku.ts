/**
 * Pemanggil RPC ranah buku 0095 untuk tab Fase 3 — satu pola untuk sepuluh
 * RPC: kunci simpanan per kasus+lingkup (useCashflowKasus), muat sekali per
 * kunci (pindah tab tidak memanggil ulang dan tidak menulis audit lagi),
 * jawaban dipetakan adapter, galat lewat useCashflowMuat.
 *
 * Tidak ada yang dimuat sebelum kasus MEMEGANG ranah tab itu. Ranahnya
 * ditambah oleh CashflowPanelTab (aktivasi pengguna atau "Muat data"), tidak
 * pernah dari sini — composable ini tidak memanggil admin_kasus_tambah.
 *
 * Argumen dibaca dari getter saat kunci berubah; kunci memuat semua nilai
 * yang dikirim, jadi jawaban lama tidak pernah dipasang pada saringan baru.
 * Kunci hanya hidup di memori (tidak di URL/storage) — termasuk `pencatat`
 * struk, yang memang tidak boleh ke URL.
 */
import { keKatalog, keJadwalRuang, keJadwalRinci, keUsahaRuang, keGerakStok, keStruk, keRingkasStruk, kePatungan, keBagiBaris, keLunasBaris } from '~/adapters/cashflowRanahBuku'
import type {
  KatalogDTO, JadwalRuangDTO, JadwalRinciDTO, UsahaRuangDTO, StokRuangDTO, KursorStok, StrukRuangDTO, KursorStruk, SaringStruk,
  PatunganRuangDTO, PatunganRiwayatDTO, KursorBagi, KursorLunas, JenisRiwayatPatungan,
} from '~/adapters/cashflowRanahBuku'
import { kePerangkatPengguna, keKabar, keSetelanKabar, keRingkasKabar } from '~/adapters/cashflowPerangkat'
import type { PerangkatPenggunaDTO, KabarPenggunaDTO, KursorKabar, SaringKabar } from '~/adapters/cashflowPerangkat'

type Getter<T> = () => T

/** Halaman berkursor (bentuk domain bersama). */
export interface Halaman<T, K> { baris: T[]; kursorBerikut: K | null; total: number | null; halamanPertama: boolean }
const halaman = <D, T, K>(d: { baris: D[]; kursor_berikut: K | null; total: number | null; halaman_pertama: boolean }, ke: (x: D) => T): Halaman<T, K> => ({
  baris: (d.baris ?? []).map(ke), kursorBerikut: d.kursor_berikut ?? null, total: d.total ?? null, halamanPertama: d.halaman_pertama === true,
})

/**
 * Inti: data satu RPC ranah untuk kasus aktif. `kunci` null = jangan muat
 * (argumen belum lengkap). Kembalian `muatUlang` membuang simpanan kunci itu
 * lalu memuat lagi (disengaja: satu baris audit lagi).
 */
export function useCashflowDataRanah<D, T>(opsi: {
  ranah: string
  kunci: Getter<string | null>
  panggil: (kasus: string) => Promise<D>
  ubah: (d: D) => T
}) {
  const kasus = useCashflowKasus()
  const m = useCashflowMuat()
  const kunci = computed(() => {
    const dasar = kasus.kunciKasus.value
    const sisa = opsi.kunci()
    return dasar && sisa !== null && kasus.punyaRanah(opsi.ranah) ? `${dasar}|${opsi.ranah}:${sisa}` : null
  })
  const mentah = computed(() => kasus.data<D>(kunci.value))
  const data = computed<T | null>(() => (mentah.value ? opsi.ubah(mentah.value) : null))
  const muatKunci = (k: string) => m.muat(async () => { await kasus.muatData(k, kk => opsi.panggil(kk.id)) })
  watch(kunci, (k) => { if (k && !mentah.value) void muatKunci(k) }, { immediate: true })
  onBeforeUnmount(m.batal)
  const muatUlang = async (): Promise<boolean> => {
    const k = kunci.value
    if (!k) return false
    kasus.buang(k)
    return muatKunci(k)
  }
  return { kunci, mentah, data, muatUlang, memuat: m.memuat, galat: m.galat, pesanGalat: m.pesanGalat }
}

const kursorTeks = (k: object | null): string => (k ? JSON.stringify(k) : '')

export const useCashflowRanahBuku = () => {
  const api = useCashflowAdmin()
  return {
    // ── Ruang ──────────────────────────────────────────────────────────
    /** R1 ranah katalog. `bulan` null = bulan WIB kini (server). */
    katalog: (ws: Getter<string | null>, bulan: Getter<string | null>) => useCashflowDataRanah({
      ranah: 'katalog',
      kunci: () => (ws() ? `${ws()}|${bulan() ?? ''}` : null),
      panggil: (k) => api.katalogRuang(k, ws()!, bulan()) as Promise<KatalogDTO>,
      ubah: keKatalog,
    }),
    /** R2 ranah jadwal. `arsip` null = semua. */
    jadwal: (ws: Getter<string | null>, arsip: Getter<boolean | null>) => useCashflowDataRanah({
      ranah: 'jadwal',
      kunci: () => (ws() ? `${ws()}|${String(arsip())}` : null),
      panggil: (k) => api.jadwalRuang(k, ws()!, arsip()) as Promise<JadwalRuangDTO>,
      ubah: keJadwalRuang,
    }),
    /** R3 ranah jadwal (laci ?jadwal=). */
    jadwalRinci: (jadwal: Getter<string | null>) => useCashflowDataRanah({
      ranah: 'jadwal',
      kunci: () => (jadwal() ? `rinci:${jadwal()}` : null),
      panggil: (k) => api.jadwalRinci(k, jadwal()!) as Promise<JadwalRinciDTO>,
      ubah: keJadwalRinci,
    }),
    /** R4 ranah usaha. */
    usaha: (ws: Getter<string | null>, arsip: Getter<boolean | null>) => useCashflowDataRanah({
      ranah: 'usaha',
      kunci: () => (ws() ? `${ws()}|${String(arsip())}` : null),
      panggil: (k) => api.usahaRuang(k, ws()!, arsip()) as Promise<UsahaRuangDTO>,
      ubah: keUsahaRuang,
    }),
    /** R5 ranah usaha: riwayat stok, keyset {o,c,i}. */
    stok: (ws: Getter<string | null>, produk: Getter<string | null>, kursor: Getter<KursorStok | null>) => useCashflowDataRanah({
      ranah: 'usaha',
      kunci: () => (ws() ? `stok:${ws()}|${produk() ?? ''}|${kursorTeks(kursor())}` : null),
      panggil: (k) => api.stokRuang(k, ws()!, produk(), kursor()) as Promise<StokRuangDTO>,
      ubah: (d: StokRuangDTO) => halaman(d, keGerakStok),
    }),
    /** R6 ranah struk, keyset {c,i}; ringkas hanya di halaman pertama. */
    struk: (ws: Getter<string | null>, saring: Getter<SaringStruk>, kursor: Getter<KursorStruk | null>) => useCashflowDataRanah({
      ranah: 'struk',
      kunci: () => (ws() ? `${ws()}|${JSON.stringify(saring())}|${kursorTeks(kursor())}` : null),
      panggil: (k) => api.strukRuang(k, ws()!, saring(), kursor()) as Promise<StrukRuangDTO>,
      ubah: (d: StrukRuangDTO) => ({ ...halaman(d, keStruk), ringkas: keRingkasStruk(d.ringkas) }),
    }),
    /** R7 ranah dompet: saldo patungan. */
    patungan: (ws: Getter<string | null>) => useCashflowDataRanah({
      ranah: 'dompet',
      kunci: () => (ws() ? `patungan:${ws()}` : null),
      panggil: (k) => api.patunganRuang(k, ws()!) as Promise<PatunganRuangDTO>,
      ubah: kePatungan,
    }),
    /** R8 ranah dompet: riwayat bagi {o,c,i} atau lunas {p,i}. */
    patunganRiwayat: (ws: Getter<string | null>, jenis: Getter<JenisRiwayatPatungan>, kursor: Getter<KursorBagi | KursorLunas | null>) => useCashflowDataRanah({
      ranah: 'dompet',
      kunci: () => (ws() ? `patungan-riwayat:${ws()}|${jenis()}|${kursorTeks(kursor())}` : null),
      panggil: (k) => api.patunganRiwayat(k, ws()!, jenis(), kursor()) as Promise<PatunganRiwayatDTO>,
      ubah: (d: PatunganRiwayatDTO) => (d.jenis === 'lunas'
        ? { jenis: 'lunas' as const, ...halaman(d, keLunasBaris) }
        : { jenis: 'bagi' as const, ...halaman(d, keBagiBaris) }),
    }),

    // ── Pengguna ───────────────────────────────────────────────────────
    /** R9 ranah perangkat; `hari` 1..90. */
    perangkat: (user: Getter<string | null>, hari: Getter<number>) => useCashflowDataRanah({
      ranah: 'perangkat',
      kunci: () => (user() ? `${user()}|${hari()}` : null),
      panggil: (k) => api.perangkatPengguna(k, user()!, hari()) as Promise<PerangkatPenggunaDTO>,
      ubah: kePerangkatPengguna,
    }),
    /** R10 ranah kabar, keyset {p,i}; ringkas & setelan hanya di halaman pertama. */
    kabar: (user: Getter<string | null>, saring: Getter<SaringKabar>, kursor: Getter<KursorKabar | null>) => useCashflowDataRanah({
      ranah: 'kabar',
      kunci: () => (user() ? `${user()}|${JSON.stringify(saring())}|${kursorTeks(kursor())}` : null),
      panggil: (k) => api.kabarPengguna(k, user()!, saring(), kursor()) as Promise<KabarPenggunaDTO>,
      ubah: (d: KabarPenggunaDTO) => ({
        ...halaman(d, keKabar), ringkas: keRingkasKabar(d.ringkas), setelan: (d.setelan ?? []).map(keSetelanKabar),
      }),
    }),
  }
}
