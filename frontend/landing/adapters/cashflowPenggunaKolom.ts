/**
 * Tabel Pengguna berkolom lengkap (admin_daftar_pengguna_v5, migrasi CashFlow
 * 20261119102000, spek console laporan 19 Nov 2026 K3 dan K7).
 *
 * v5 = v4 ditambah tujuh nilai urut (setiap kolom bisa diurutkan di server)
 * dan satu kunci per baris, `asal` {sumber, medium, kampanye, jawaban,
 * dicatat}. Server yang belum memasang v5 dijawab lewat v4 lalu v3
 * (bacaDaftarBerjenjang): kolom Sumber tidak ditampilkan, dan kepala kolom
 * yang urutannya belum dikenal server tidak bisa diklik.
 *
 * Waktu ber-detik (waktuDetikWib) hanya bila kontak dibuka. Tanpa alasan
 * server membulatkan aktif, masuk, status WhatsApp, dan Domi ke awal hari
 * WIB, jadi jam yang ditulis akan menyesatkan: saat itu yang tampil tanggal.
 *
 * Fungsi murni semua: tanpa jaringan, tanpa state.
 */
import { tanggalPendek, waktuDetikWib, type BahasaWaktu } from './cashflowWaktu'

/** Nilai p_urut yang hanya dikenal v5. */
export const URUT_V5 = ['masuk', 'status', 'status_wa', 'kredit_beli', 'domi_30', 'nama', 'sumber'] as const
export type UrutV5 = typeof URUT_V5[number]
/** Urutan v5 yang butuh cashflow:pii (server menolaknya tanpa izin itu). */
export const URUT_PRIBADI_V5: readonly UrutV5[] = ['kredit_beli', 'domi_30', 'sumber']
/** Urut nama hanya bila kontak dibuka (nama tampilan dikirim hanya saat itu). */
export const URUT_BUTUH_KONTAK: readonly string[] = ['nama']
export const urutV5 = (v: unknown): v is UrutV5 => (URUT_V5 as readonly unknown[]).includes(v)

/** Daftar memakai sesuatu yang hanya dikenal v5? Server lama harus melepasnya dulu. */
export const butuhV5 = (q: { urut: string }): boolean => urutV5(q.urut)

/**
 * Semua kolom tabel, berurutan. `urut` = nilai p_urut untuk kepala kolom itu.
 * `server` = server paling lama yang mengirim isinya (v3 selalu ada, v4 untuk
 * Domi dan kredit, v5 untuk Sumber). Setiap kunci baris v5 punya tempat:
 *   email + internal (lencana Tim)          kolom email
 *   display_name                            kolom nama
 *   nomor_wa + nomor_ramai + kredit_ditahan kolom wa
 *   status_wa + status_wa_pada + lewat_sebab kolom status_wa
 *   versi_aplikasi + platform               kolom versi
 *   banned_until + menunggu_hapus           kolom status
 *   created_at / last_sign_in / aktivitas_terakhir  kolom daftar / masuk / aktif
 *   jumlah_ruang / jumlah_tx / jumlah_nominal       kolom ruang / tx / nominal
 *   domi_tanya + domi_tanya_kira / domi_tanya_30 / domi_terakhir  kolom domi / domi_30 / domi_terakhir
 *   kredit_sisa / kredit_beli               kolom kredit / kredit_beli
 *   asal                                    kolom sumber
 * user_id ada di tautan baris, terbuka dan total_semua bukan data orang.
 */
export const KOLOM_PENGGUNA = [
  { key: 'email', urut: 'email', server: 3 },
  { key: 'nama', urut: 'nama', server: 3 },
  { key: 'wa', urut: 'wa', server: 3 },
  { key: 'status_wa', urut: 'status_wa', server: 3 },
  { key: 'versi', urut: 'versi', server: 3 },
  { key: 'status', urut: 'status', server: 3 },
  { key: 'daftar', urut: 'daftar', server: 3 },
  { key: 'masuk', urut: 'masuk', server: 3 },
  { key: 'aktif', urut: 'aktif', server: 3 },
  { key: 'ruang', urut: 'ruang', server: 3 },
  { key: 'tx', urut: 'tx', server: 3 },
  { key: 'nominal', urut: 'nominal', server: 3 },
  { key: 'domi', urut: 'domi', server: 4 },
  { key: 'domi_30', urut: 'domi_30', server: 4 },
  { key: 'domi_terakhir', urut: 'domi_terakhir', server: 4 },
  { key: 'kredit', urut: 'kredit', server: 4 },
  { key: 'kredit_beli', urut: 'kredit_beli', server: 4 },
  { key: 'sumber', urut: 'sumber', server: 5 },
] as const
export type KunciKolom = typeof KOLOM_PENGGUNA[number]['key']
/** Kolom angka: rata kanan. */
export const KOLOM_ANGKA: readonly KunciKolom[] = ['ruang', 'tx', 'nominal', 'domi', 'domi_30', 'kredit', 'kredit_beli']
/** Kolom waktu: ber-detik bila kontak dibuka. */
export const KOLOM_WAKTU: readonly KunciKolom[] = ['daftar', 'masuk', 'aktif', 'domi_terakhir']

/** Kolom yang ditampilkan untuk server ini (3, 4, atau 5). */
export const kolomUntuk = (server: 3 | 4 | 5) => KOLOM_PENGGUNA.filter(k => k.server <= server)

// ── Asal pengguna ────────────────────────────────────────────────────────
/** Kunci `asal` di baris v5 (bentuk kontrak spek). null = tanpa pii, tanpa catatan, atau tabelnya belum ada. */
export interface AsalDTO {
  sumber?: string | null; medium?: string | null; kampanye?: string | null; jawaban?: string | null; dicatat?: string | null
}
export const JAWABAN_ASAL = ['instagram', 'tiktok', 'whatsapp_teman', 'google', 'play_store', 'lainnya', 'lewati'] as const
export type JawabanAsal = typeof JAWABAN_ASAL[number]
export interface Asal {
  /** utm_source dari Play Install Referrer atau tautan pendek. null = tidak ada. */
  sumber: string | null
  medium: string | null
  kampanye: string | null
  /** Jawaban "Kamu tahu CashFlow dari mana?". null = belum menjawab. */
  jawaban: JawabanAsal | null
  dicatatIso: string | null
}
const teksAtauNull = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null)

/** null = server tidak mengirim kunci asal (sebelum v5) atau mengirim null. */
export function keAsal(d: AsalDTO | null | undefined): Asal | null {
  if (!d || typeof d !== 'object') return null
  const j = teksAtauNull(d.jawaban)
  const dicatat = typeof d.dicatat === 'string' && !Number.isNaN(Date.parse(d.dicatat)) ? d.dicatat : null
  const asal: Asal = {
    sumber: teksAtauNull(d.sumber), medium: teksAtauNull(d.medium), kampanye: teksAtauNull(d.kampanye),
    jawaban: (JAWABAN_ASAL as readonly string[]).includes(j ?? '') ? (j as JawabanAsal) : null,
    dicatatIso: dicatat,
  }
  return asal.sumber || asal.jawaban || asal.medium || asal.kampanye ? asal : null
}

// ── Waktu ────────────────────────────────────────────────────────────────
/**
 * Waktu satu sel: '19 Nov 2026 14.05.09' bila kontak dibuka (server mengirim
 * presisi), '19 Nov 2026' bila tidak. '—' untuk kosong.
 */
export function waktuSel(iso: string | null | undefined, o: { terbuka: boolean; bahasa: BahasaWaktu }): string {
  if (!iso) return '—'
  return o.terbuka ? waktuDetikWib(iso, o.bahasa, { zona: false }) : tanggalPendek(iso, o.bahasa)
}

// ── Baca berjenjang v5, v4, v3 ───────────────────────────────────────────
/**
 * Baca daftar lewat v5, lalu lewat `lama` (v4 lalu v3) bila v5 belum ada di
 * server. `kenalV5` false = sudah tahu server lama, langsung `lama`. `butuh`
 * = permintaan memakai urutan yang hanya dikenal v5: di server lama tidak
 * dikirim, `hasil` null, dan pemanggil melepas urutannya lalu memuat ulang.
 * Hanya "RPC belum ada" yang memicu jatuh-mundur.
 */
export async function bacaDaftarV5<T>(o: {
  kenalV5: boolean | null
  butuh: boolean
  v5: () => Promise<T>
  lama: () => Promise<T | null>
}): Promise<{ hasil: T | null; v5: boolean }> {
  if (o.kenalV5 !== false) {
    try {
      return { hasil: await o.v5(), v5: true }
    } catch (e) {
      if ((e as { jenis?: unknown } | null)?.jenis !== 'belum-aktif') throw e
    }
  }
  if (o.butuh) return { hasil: null, v5: false }
  return { hasil: await o.lama(), v5: false }
}
