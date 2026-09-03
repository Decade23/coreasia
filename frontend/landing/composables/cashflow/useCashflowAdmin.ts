/**
 * Pembungkus RPC admin CashFlow — satu tempat untuk semua panggilan ke Supabase.
 *
 * Tiga jenis kegagalan dibedakan supaya halaman bisa menjawab dengan benar:
 *   'totp'        42501 hint mfa-wajib → sesi ada tapi belum aal2; arahkan ke /masuk
 *   'bukan-admin' 42501 lainnya        → akun console ini bukan admin CashFlow
 *   'alasan'      22023                → alasan audit kurang panjang
 *   'lain'        sisanya
 *
 * RPC yang membuka data pribadi WAJIB menerima `alasan` di sini — tanda tangan
 * TypeScript-nya yang memaksa, supaya tidak ada halaman baru yang lupa.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  StatsDTO, PenggunaDTO, CorongDTO, KeberhasilanDTO, RetensiDTO, AktivitasDTO,
  RuangDTO, DetailPenggunaDTO,
} from '~/adapters/cashflow'

export type JenisGalat = 'totp' | 'bukan-admin' | 'alasan' | 'konfigurasi' | 'lain'
export class GalatAdmin extends Error {
  constructor(public jenis: JenisGalat, pesan: string) { super(pesan) }
}

function petakanGalat(e: any): GalatAdmin {
  const kode = e?.code ?? ''
  const hint = e?.hint ?? ''
  const pesan = e?.message ?? 'Gagal memanggil server.'
  if (kode === '42501' && hint === 'mfa-wajib') return new GalatAdmin('totp', pesan)
  if (kode === '42501') return new GalatAdmin('bukan-admin', pesan)
  if (kode === '22023') return new GalatAdmin('alasan', pesan)
  return new GalatAdmin('lain', pesan)
}

export interface AuditDTO {
  id: number; admin_id: string; admin_email: string; action: string; target_type: string
  target_id: string | null; target_email: string | null; detail: any; reason: string | null
  created_at: string; total_semua: number
}
export interface KesehatanDTO { ukuran_db: string; tabel: Array<{ tabel: string; baris: number; ukuran: string }> }
export interface FotoYatimDTO { bucket: string; jalur: string; ukuran: number; dibuat: string; sebab: string }
export interface OcrDTO { status: string; jumlah: number }
export interface TelemetriDTO { jenis: string; layar: string; jumlah: number; pengguna: number }
export interface ConfigDTO { key: string; value: any; is_public: boolean; note: string | null; updated_by: string | null; updated_at: string }
export interface PengumumanDTO { id: string; judul: string; isi: string; level: string; mulai: string; sampai: string | null; created_at: string }

export const useCashflowAdmin = () => {
  const { $cashflowSupabase } = useNuxtApp()
  const sb = $cashflowSupabase as SupabaseClient | null

  async function rpc<T>(nama: string, args?: Record<string, unknown>): Promise<T> {
    if (!sb) throw new GalatAdmin('konfigurasi', 'Modul CashFlow belum dikonfigurasi.')
    const { data, error } = await sb.rpc(nama, args ?? {})
    if (error) throw petakanGalat(error)
    return data as T
  }

  return {
    // ── agregat, tanpa alasan ──────────────────────────────────────────
    stats: () => rpc<StatsDTO>('admin_stats'),
    kesehatan: () => rpc<KesehatanDTO>('admin_kesehatan'),
    corong: (hari = 90) => rpc<CorongDTO[]>('admin_corong_aktivasi', { p_hari: hari }),
    ukuranKeberhasilan: (jendela = 14, minTx = 10) =>
      rpc<KeberhasilanDTO[]>('admin_ukuran_keberhasilan', { p_jendela_hari: jendela, p_min_tx: minTx }).then(r => r[0]),
    retensi: (bulan = 6) => rpc<RetensiDTO[]>('admin_retensi', { p_bulan: bulan }),
    aktivitasTerbaru: (limit = 100) => rpc<AktivitasDTO[]>('admin_aktivitas_terbaru', { p_limit: limit }),
    ocr: () => rpc<OcrDTO[]>('admin_ocr_ringkas'),
    fotoYatim: (limit = 200) => rpc<FotoYatimDTO[]>('admin_foto_yatim', { p_limit: limit }),
    telemetri: (hari = 30) => rpc<TelemetriDTO[]>('admin_telemetri_ringkas', { p_hari: hari }),

    // ── daftar tersamar (adapter yang menyamarkan) ─────────────────────
    daftarPengguna: (limit = 50, offset = 0, cari = '') =>
      rpc<PenggunaDTO[]>('admin_daftar_pengguna', { p_limit: limit, p_offset: offset, p_cari: cari }),
    daftarRuang: (limit = 50, offset = 0) =>
      rpc<RuangDTO[]>('admin_daftar_ruang', { p_limit: limit, p_offset: offset }),

    // ── membuka data pribadi: alasan WAJIB, audit ditulis server ───────
    detailPengguna: (user: string, alasan: string) =>
      rpc<DetailPenggunaDTO>('admin_detail_pengguna_v2', { p_user: user, p_alasan: alasan }),
    bukaEmail: (user: string, alasan: string) =>
      rpc<string>('admin_buka_email', { p_user: user, p_alasan: alasan }),
    aktivitasPengguna: (user: string, alasan: string, limit = 200) =>
      rpc<AktivitasDTO[]>('admin_aktivitas_pengguna', { p_user: user, p_alasan: alasan, p_limit: limit }),
    transaksiPengguna: (user: string, alasan: string, limit = 200) =>
      rpc<any[]>('admin_baca_transaksi', { p_user: user, p_alasan: alasan, p_limit: limit }),

    // ── audit ──────────────────────────────────────────────────────────
    daftarAudit: (limit = 50, offset = 0, aksi: string | null = null) =>
      rpc<AuditDTO[]>('admin_daftar_audit', { p_limit: limit, p_offset: offset, p_aksi: aksi, p_admin: null }),
    aksiAudit: () => rpc<Array<{ action: string; jumlah: number }>>('admin_daftar_aksi_audit'),

    // ── sakelar fitur (termasuk auth.verifikasi_email) ─────────────────
    daftarConfig: () => rpc<ConfigDTO[]>('admin_daftar_config'),
    setConfig: (key: string, value: unknown, publik: boolean, note: string, alasan: string) =>
      rpc<void>('admin_set_config', { p_key: key, p_value: value, p_publik: publik, p_note: note, p_alasan: alasan }),
    hapusConfig: (key: string, alasan: string) => rpc<void>('admin_hapus_config', { p_key: key, p_alasan: alasan }),

    // ── pengumuman & entitlement ───────────────────────────────────────
    daftarPengumuman: () => rpc<PengumumanDTO[]>('admin_daftar_pengumuman'),
    buatPengumuman: (judul: string, isi: string, level: string, mulai: string, sampai: string | null, alasan: string) =>
      rpc<string>('admin_buat_pengumuman', { p_judul: judul, p_isi: isi, p_level: level, p_mulai: mulai, p_sampai: sampai, p_alasan: alasan }),
    hentikanPengumuman: (id: string, alasan: string) => rpc<void>('admin_hentikan_pengumuman', { p_id: id, p_alasan: alasan }),
    setEntitlement: (user: string, tier: string, sampai: string | null, alasan: string) =>
      rpc<void>('admin_set_entitlement', { p_user: user, p_tier: tier, p_sampai: sampai, p_alasan: alasan }),
  }
}
