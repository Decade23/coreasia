/**
 * Pratinjau penerima pengumuman (admin_pratinjau_penerima_pengumuman):
 * berapa yang menerima sekarang, berapa tak terjangkau versi lama, berapa
 * versinya tak diketahui, berapa dikecualikan, dan contoh email tersamar.
 *
 * Disegarkan dengan jeda saat isian berubah (setiap ketikan tidak menembak
 * server). Jawaban yang sudah digantikan permintaan berikutnya dibuang
 * (useCashflowMuat). `sumber()` null = pilihan penerima belum lengkap: tidak
 * ada permintaan, kotak meminta isian dilengkapi.
 *
 * RPC-nya agregat tanpa audit, jadi aman disegarkan berulang. Server lama
 * (RPC belum ada) = `belumAktif`, bukan galat.
 */
import type { AturanDTO, PratinjauPenerima } from '~/adapters/cashflowPengumumanAturan'
import { kePratinjauPenerima } from '~/adapters/cashflowPengumumanAturan'
import type { JenisPenerima } from '~/adapters/cashflowPengumuman'

export interface SumberPratinjau { jenis: JenisPenerima; pengguna: string[]; kelompok: string[]; aturan: AturanDTO | null }
export const JEDA_PRATINJAU_MS = 450

export const useCashflowPratinjauPenerima = (sumber: () => SumberPratinjau | null, aktif: () => boolean) => {
  const api = useCashflowAdmin()
  const { muat, memuat, galat, pesanGalat, batal } = useCashflowMuat()
  const data = shallowRef<PratinjauPenerima | null>(null)
  const menunggu = ref(false)
  const belumAktif = computed(() => galat.value?.jenis === 'belum-aktif')
  const lengkap = computed(() => sumber() !== null)
  let jeda: ReturnType<typeof setTimeout> | null = null

  const segarkan = () => {
    const s = sumber()
    if (!s) { batal(); data.value = null; return }
    void muat(async terbaru => {
      const hasil = kePratinjauPenerima(await api.pratinjauPenerimaPengumuman(s.jenis, s.pengguna, s.kelompok, s.aturan))
      if (terbaru()) data.value = hasil
    })
  }
  watch(() => (aktif() ? JSON.stringify(sumber()) : null), (kunci) => {
    if (jeda) clearTimeout(jeda)
    if (kunci === null) { menunggu.value = false; batal(); return }
    menunggu.value = true
    jeda = setTimeout(() => { jeda = null; menunggu.value = false; segarkan() }, JEDA_PRATINJAU_MS)
  }, { immediate: true })
  onBeforeUnmount(() => { if (jeda) clearTimeout(jeda); batal() })

  return { data, memuat: computed(() => memuat.value || menunggu.value), pesanGalat, belumAktif, lengkap }
}
