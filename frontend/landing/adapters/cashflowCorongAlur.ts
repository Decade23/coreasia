export const LANGKAH_CORONG_WA = [
  'lihat', 'petunjuk', 'pilih', 'kirim', 'kode_terkirim', 'ketik',
  'mulai_terbalik', 'buka_wa', 'berhasil', 'lewat_email', 'hapus_akun', 'hubungi',
] as const
export type LangkahCorongWa = typeof LANGKAH_CORONG_WA[number]
export type CaraCorongWa = 'wa_sapa' | 'wa_masuk' | 'belum_diketahui'

export interface LangkahCorongWaDTO {
  kunci: LangkahCorongWa
  orang: number
  lanjut: number | null
  berhenti: number
}
export interface KelompokCorongWaDTO {
  cara: CaraCorongWa | null
  versi: string | null
  langkah: LangkahCorongWaDTO[]
}
export interface CorongAlurDTO {
  alur: 'nomor_wa'
  dari: string
  sampai: string
  batas_akhir: string | null
  total: KelompokCorongWaDTO
  pecahan: KelompokCorongWaDTO[]
  telemetri: Record<string, number>
}
export interface SaringCorongWa { dari: string; sampai: string; batasAkhir: string | null }
export interface BukaKasusCorongWa extends SaringCorongWa {
  cara: CaraCorongWa | null
  versi: string | null
  langkah: LangkahCorongWa
  posisi: number
  alasan: string
}

/** JSON pair keeps the total distinct from a method with an unknown version. */
export function kunciKelompokCorong(k: KelompokCorongWaDTO): string {
  return JSON.stringify([k.cara, k.versi])
}
