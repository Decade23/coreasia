/**
 * Status WhatsApp OTP di console (admin_wa_status, migrasi 20261110120000).
 *
 * Bentuk jawaban server dipetakan di sini, supaya komponen hanya tahu tiga
 * keadaan: sehat, gangguan, atau nonaktif. Kode gangguan yang belum dikenal
 * tetap dihitung gangguan, bukan hilang diam-diam.
 */
export interface WaStatusDTO {
  sekarang: string
  sesi: { status: string | null; sejak: string | null; dicek_pada: string | null; galat: string | null } | null
  gangguan: string[] | null
  kirim_gangguan_sampai: string | null
  otp: { aktif: boolean; wajib: boolean; darurat: boolean }
  batas: { terpakai_hari_ini: number; harian: number }
  kiriman_24j: { diminta: number; terkirim: number; gagal: number; tanpa_wa: number; diketik: number }
  sebab_gagal_24j: { sebab: string; jumlah: number }[] | null
  terkirim_terakhir: string | null
}

export type TingkatWa = 'sehat' | 'gangguan' | 'nonaktif'
export const KODE_GANGGUAN_WA = ['darurat', 'sesi', 'basi', 'kirim', 'tak_diketik', 'batas'] as const
export type KodeGangguanWa = typeof KODE_GANGGUAN_WA[number] | 'lain'
export const STATUS_SESI_WA = ['connected', 'connecting', 'disconnected', 'unknown', 'reconnecting', 'pairing',
  'logged_out', 'replaced', 'wrong_number', 'stopped', 'tak_terjangkau', 'lain'] as const

export interface StatusWa {
  tingkat: TingkatWa
  /** Pengguna baru sedang melewati OTP karena gangguan. */
  lewatOtp: boolean
  sebab: KodeGangguanWa[]
  /** Kunci label status sesi, selalu ada di kamus. */
  statusSesi: string
  sejak: string | null
  dicekPada: string | null
  otp: 'wajib' | 'tidakWajib' | 'mati'
  batas: { terpakai: number; harian: number }
  kiriman: WaStatusDTO['kiriman_24j']
  sebabGagal: { sebab: string; jumlah: number }[]
  terkirimTerakhir: string | null
}

const kodeSebab = (k: string): KodeGangguanWa => ((KODE_GANGGUAN_WA as readonly string[]).includes(k) ? k as KodeGangguanWa : 'lain')

export function keStatusWa(d: WaStatusDTO): StatusWa {
  const sebab = [...new Set((d.gangguan ?? []).map(kodeSebab))]
  const nonaktif = !d.otp.aktif
  const status = d.sesi?.status ?? null
  return {
    tingkat: nonaktif ? 'nonaktif' : sebab.length ? 'gangguan' : 'sehat',
    lewatOtp: !nonaktif && d.otp.wajib && sebab.length > 0,
    sebab,
    statusSesi: status === null ? 'kosong' : (STATUS_SESI_WA as readonly string[]).includes(status) ? status : 'lain',
    sejak: d.sesi?.sejak ?? null,
    dicekPada: d.sesi?.dicek_pada ?? null,
    otp: nonaktif ? 'mati' : d.otp.wajib ? 'wajib' : 'tidakWajib',
    batas: { terpakai: d.batas.terpakai_hari_ini, harian: d.batas.harian },
    kiriman: d.kiriman_24j,
    sebabGagal: d.sebab_gagal_24j ?? [],
    terkirimTerakhir: d.terkirim_terakhir,
  }
}
