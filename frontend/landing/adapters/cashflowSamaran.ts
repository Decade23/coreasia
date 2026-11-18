/**
 * Buka samaran untuk sesi console ber-pii (spek console laporan 19 Nov 2026,
 * keputusan K1). Tiga RPC baru di migrasi CashFlow 20261119100000 dan
 * 20261119101000:
 *   admin_daftar_ruang_v3     daftar Ruang berurut per kolom, utuh dengan alasan
 *   admin_ruang_360_v2        Ruang 360 dengan email pemilik, anggota, undangan utuh
 *   admin_pengguna_kepala_v2  kepala Pengguna 360 utuh dengan alasan
 * Alasannya tetap dan dikirim otomatis oleh halaman (pola daftar Pengguna
 * v4). Setiap pembukaan dicatat server lewat admin_catat_baca. Sesi tanpa pii
 * tetap melihat bentuk tersamar.
 *
 * Console boleh tayang lebih dulu dari migrasinya: setiap pemanggil jatuh ke
 * RPC lama bila RPC baru dijawab 'belum-aktif' (PGRST202), lihat denganCadangan.
 *
 * Fungsi murni semua: tanpa jaringan, tanpa state.
 */
import type { RuangDTO } from './cashflow'

/** Alasan tetap yang dikirim halaman. rpc() menambahkan "[pelaku] " di depannya. */
export const ALASAN_DAFTAR_RUANG = 'Nama ruang dan pemilik lengkap di daftar Ruang Console'
export const ALASAN_KEPALA_PENGGUNA = 'Kepala Pengguna 360 lengkap di Console'

/**
 * Panggil RPC baru, jatuh ke RPC lama bila yang baru belum ada di server.
 * `kenal` = yang sudah diketahui tentang server (null belum tahu, false RPC
 * baru tidak ada, jadi langsung lama). `jatuhJuga` = jenis galat lain yang
 * juga jatuh ke lama (mis. 'izin' bila sesi kehilangan pii di tengah jalan).
 */
export async function denganCadangan<T>(o: {
  kenal: boolean | null
  baru: () => Promise<T>
  lama: () => Promise<T>
  jatuhJuga?: readonly string[]
}): Promise<{ hasil: T; baru: boolean }> {
  if (o.kenal !== false) {
    try {
      return { hasil: await o.baru(), baru: true }
    } catch (e) {
      const jenis = (e as { jenis?: unknown } | null)?.jenis
      if (jenis !== 'belum-aktif' && !(o.jatuhJuga ?? []).includes(jenis as string)) throw e
      if (jenis !== 'belum-aktif') return { hasil: await o.lama(), baru: true }
    }
  }
  return { hasil: await o.lama(), baru: false }
}

// ── Daftar Ruang v3 ──────────────────────────────────────────────────────
/** Nilai p_urut admin_daftar_ruang_v3. Hitungan butuh cashflow:pii. */
export const URUT_RUANG = ['dibuat', 'nama', 'pemilik', 'jenis', 'anggota', 'tx', 'undangan'] as const
export type UrutRuang = typeof URUT_RUANG[number]
export const URUT_RUANG_PRIBADI: readonly UrutRuang[] = ['anggota', 'tx', 'undangan']
/** Batas server: 100 baris per halaman saat dibuka dengan alasan. */
export const PER_RUANG = 50

/** Baris v3 memakai kunci RuangDTO (dibuat menggantikan created_at). */
export type RuangV3DTO = RuangDTO
export interface DaftarRuangV3DTO { total: number | string; terbuka: boolean; baris: RuangV3DTO[] }

export const arahBawaanRuang = (k: UrutRuang): 'asc' | 'desc' => (k === 'nama' || k === 'pemilik' || k === 'jenis' ? 'asc' : 'desc')

/** Kepala kolom: kunci sama membalik arah, kunci lain memakai arah bawaannya. null = tidak boleh. */
export function gantiUrutRuang(
  kini: { urut: string; arah: 'asc' | 'desc' }, kunci: string, o: { tanpaHitungan: boolean },
): { urut: UrutRuang; arah: 'asc' | 'desc'; hal: 1 } | null {
  const k = URUT_RUANG.find(u => u === kunci)
  if (!k || (o.tanpaHitungan && URUT_RUANG_PRIBADI.includes(k))) return null
  return { urut: k, arah: kini.urut === k ? (kini.arah === 'asc' ? 'desc' : 'asc') : arahBawaanRuang(k), hal: 1 }
}
