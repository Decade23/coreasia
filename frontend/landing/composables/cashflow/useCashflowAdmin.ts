/**
 * Pembungkus RPC admin CashFlow — satu tempat untuk semua panggilan ke Supabase.
 *
 * Jenis kegagalan dibedakan supaya halaman bisa menjawab dengan benar:
 *   'sesi'        tidak ada sesi Supabase di tab ini, atau 42501 hint
 *                 sesi-konsol/mfa-wajib (sesi tidak dikenal server) → sambung
 *                 ulang lewat /masuk
 *   'totp'        (lama) diperlakukan sama dengan 'sesi'
 *   'bukan-admin' 42501 lainnya → identitas sesi ini bukan admin CashFlow
 *   'alasan'      alasan kurang dari 8 aksara — diperiksa DI SINI
 *                 (alasanBerpelaku) sebelum awalan pelaku ditambahkan, dan
 *                 TANPA awalan "INVESTIGASI — ": tidak satu awalan pun boleh
 *                 memenuhi syarat panjang atas nama pengguna
 *   'argumen'     22023 dari server. Server memakai kode itu untuk argumen apa
 *                 pun yang ditolak (jendela pengumuman terbalik, level tak
 *                 dikenal, kunci konfigurasi kosong, alasan), jadi kalimatnya
 *                 diambil dari server — "alasan terlalu pendek" untuk tanggal
 *                 yang terbalik menyuruh admin memperbaiki hal yang salah.
 *                 Juga 42501 hint bukan-milik-subjek (catatan transaksi):
 *                 kalimatnya dilokalkan useCashflowMuat lewat hint-nya
 *   'tidak-ada'   P0002 — mis. UUID yang ditempel di palet bukan pengguna
 *   'versi-lama'  42501 hint pakai-versi-baru: RPC v1 yang ditutup 0088 untuk
 *                 sesi console. Halaman ini tidak memanggilnya lagi; yang
 *                 melihat galat ini memegang bundel lama → muat ulang
 *   'lain'        sisanya
 * `hint` server ikut dibawa (mis. nilai-tersamar, nilai-pribadi-publik) supaya
 * useCashflowMuat bisa memberi kalimat yang menyuruh hal yang benar.
 *
 * Halaman tidak menulis blok catch sendiri: useCashflowMuat yang mengubah
 * jenis ini menjadi kalimat dan mengarahkan ke /masuk bila sesi hilang.
 *
 * SESI HILANG DI TENGAH HALAMAN. sessionStorage bisa kosong (tab dipulihkan,
 * refresh token ditolak). rpc() memeriksa sesi dulu; kalau tidak ada, minta
 * server mencetak lagi SEKALI lalu lanjut — pengguna tidak melihat apa-apa.
 *
 * RPC yang membuka data pribadi WAJIB menerima `alasan` di sini — tanda tangan
 * TypeScript-nya yang memaksa, supaya tidak ada halaman baru yang lupa.
 *
 * HANYA RPC v2 (Fase 0b). Sesudah migrasi 0088, sesi console ditolak di
 * admin_baca_transaksi, admin_detail_pengguna, admin_ekspor_pengguna,
 * admin_daftar_ruang, admin_daftar_config, dan admin_daftar_audit v1
 * (42501 pakai-versi-baru), dan admin_ukuran_keberhasilan v1 serta
 * admin_buka_email dicabut dari authenticated. Setiap nama RPC di berkas ini
 * WAJIB juga ada di cashflow/toko/uji-console-rpc.sql, yang memanggil semuanya
 * dengan sesi console di atas 0088 — tests/cashflow/rpc-console.test.ts
 * membandingkan kedua daftar itu.
 *
 * PELAKU. Sesi Supabase-nya milik identitas konsol bersama (lihat
 * server/api/cashflow/sesi.post.ts), jadi admin_id di admin_audit selalu
 * identitas itu. Bukti siapa manusianya ada di SERVER: admin_audit.pelaku
 * diisi trigger dari admin_konsol_sesi (migrasi 0078). Awalan "[email]" pada
 * p_alasan di sini hanya keterangan yang enak dibaca di daftar audit — tapi ia
 * ada di depan SETIAP alasan, termasuk "[email] INVESTIGASI — …" (lihat
 * AWALAN_INVESTIGASI di adapter).
 *
 * NAMA ARGUMEN. PostgREST memilih fungsi menurut nama argumen, bukan urutan:
 * kunci p_* yang salah ketik baru gagal di produksi (PGRST202). Kunci setiap
 * objek argumen di bawah dibandingkan dengan parameter fungsi di migrasi oleh
 * tests/cashflow/rpc-console.test.ts — jadi argumen WAJIB objek literal.
 */
import type {
  StatsDTO, PenggunaDTO, CorongDTO, KeberhasilanDTO, RetensiDTO, AktivitasDTO,
  RuangDTO, DetailPenggunaDTO, TransaksiDTO, CatatanTransaksiDTO, PengumumanDTO, KesehatanDTO,
  AuditDTO, ConfigDTO, NilaiJson, JenisRuang,
} from '~/adapters/cashflow'
import { alasanInvestigasi, intiAlasan } from '~/adapters/cashflow'

/* DTO audit & sakelar pindah ke adapter (bertipe, tanpa any); diekspor ulang
   supaya impor lama dari berkas ini tetap jalan. */
export type { AuditDTO, ConfigDTO } from '~/adapters/cashflow'

export type JenisGalat = 'sesi' | 'totp' | 'bukan-admin' | 'alasan' | 'argumen' | 'konfigurasi' | 'tidak-ada' | 'versi-lama' | 'lain'
export class GalatAdmin extends Error {
  constructor(public jenis: JenisGalat, pesan: string, public hint: string = '') { super(pesan) }
}

/** Bentuk galat PostgREST yang dibaca di sini (galat jaringan: hanya message). */
interface GalatMentah { code?: unknown; hint?: unknown; message?: unknown }
const teks = (v: unknown): string => (typeof v === 'string' ? v : '')

/** Galat PostgREST/jaringan → GalatAdmin. GalatAdmin yang sudah jadi dipulangkan apa adanya. */
export function petakanGalat(e: unknown): GalatAdmin {
  if (e instanceof GalatAdmin) return e
  const g: GalatMentah = e && typeof e === 'object' ? (e as GalatMentah) : {}
  const kode = teks(g.code)
  const hint = teks(g.hint)
  const pesan = teks(g.message) || 'Gagal memanggil server.'
  if (kode === '42501' && (hint === 'mfa-wajib' || hint === 'sesi-konsol')) return new GalatAdmin('sesi', pesan, hint)
  if (kode === '42501' && hint === 'pakai-versi-baru') return new GalatAdmin('versi-lama', pesan, hint)
  // admin_baca_catatan_transaksi: id milik orang lain → seluruh panggilan ditolak.
  // Itu argumen yang ditolak, bukan "identitas konsol bukan admin".
  if (kode === '42501' && hint === 'bukan-milik-subjek') return new GalatAdmin('argumen', pesan, hint)
  if (kode === '42501') return new GalatAdmin('bukan-admin', pesan, hint)
  if (kode === '22023') return new GalatAdmin('argumen', pesan, hint)
  if (kode === 'P0002') return new GalatAdmin('tidak-ada', pesan, hint)
  return new GalatAdmin('lain', pesan, hint)
}

/** p_alasan yang dikirim: "[pelaku] alasan". Syarat 8 aksara diukur pada
 *  bagian yang ditulis orang (intiAlasan: tanpa awalan INVESTIGASI) SEBELUM
 *  awalan pelaku ditambahkan — tidak satu awalan pun memenuhinya. */
export function alasanBerpelaku(siapa: string, alasan: string): string {
  const asli = alasan.trim()
  if (intiAlasan(asli).length < 8) throw new GalatAdmin('alasan', 'Alasan minimal 8 aksara.')
  return `[${siapa}] ${asli}`
}

export interface FotoYatimDTO { bucket: string; jalur: string; ukuran: number; dibuat: string; sebab: string }
export interface OcrDTO { status: string; jumlah: number }
export interface TelemetriDTO { jenis: string; layar: string; jumlah: number; pengguna: number }

export const useCashflowAdmin = () => {
  const { user: adminConsole } = useAdminAuth()
  const sesiKonsol = useCashflowSesi()

  /** Klien + sesi siap; kalau sesi tidak ada, cetak sekali. */
  async function pastikanSesi() {
    const sb = await sesiKonsol.ambil()
    if (!sb) throw new GalatAdmin('konfigurasi', 'Modul CashFlow belum dikonfigurasi.')
    const { data } = await sb.auth.getSession()
    if (!data.session) {
      const h = await sesiKonsol.sambung()
      if (!h.ok) throw new GalatAdmin('sesi', h.sebab)
    }
    return sb
  }

  async function rpc<T>(nama: string, args?: Record<string, unknown>): Promise<T> {
    const sb = await pastikanSesi()
    const a: Record<string, unknown> = { ...(args ?? {}) }
    if (typeof a.p_alasan === 'string') {
      a.p_alasan = alasanBerpelaku(sesiKonsol.pelaku.value || adminConsole.value?.email || 'console', a.p_alasan)
    }
    const { data, error } = await sb.rpc(nama, a)
    if (error) {
      const g = petakanGalat(error)
      // Sesi ditolak server (dicabut, atau tab memegang sesi basi): cetak
      // ulang sekali dan coba lagi — kalau masih ditolak, biar halaman yang bicara.
      if (g.jenis === 'sesi') {
        await sb.auth.signOut({ scope: 'local' }).catch(() => {})
        const h = await sesiKonsol.sambung()
        if (h.ok) {
          const ulang = await sb.rpc(nama, a)
          if (!ulang.error) return ulang.data as T
          throw petakanGalat(ulang.error)
        }
      }
      throw g
    }
    return data as T
  }

  return {
    // ── agregat, tanpa alasan ──────────────────────────────────────────
    stats: () => rpc<StatsDTO>('admin_stats'),
    kesehatan: () => rpc<KesehatanDTO>('admin_kesehatan'),
    corong: (hari = 90) => rpc<CorongDTO[]>('admin_corong_aktivasi', { p_hari: hari }),
    /** v2: angka yang sama dengan v1, tanpa daftar email — hanya jumlah_pengecualian. */
    ukuranKeberhasilan: (jendela = 14, minTx = 10) =>
      rpc<KeberhasilanDTO[]>('admin_ukuran_keberhasilan_v2', { p_jendela_hari: jendela, p_min_tx: minTx }).then(r => r[0] ?? null),
    retensi: (bulan = 6) => rpc<RetensiDTO[]>('admin_retensi', { p_bulan: bulan }),
    aktivitasTerbaru: (limit = 100) => rpc<AktivitasDTO[]>('admin_aktivitas_terbaru', { p_limit: limit }),
    ocr: () => rpc<OcrDTO[]>('admin_ocr_ringkas'),
    fotoYatim: (limit = 200) => rpc<FotoYatimDTO[]>('admin_foto_yatim', { p_limit: limit }),
    telemetri: (hari = 30) => rpc<TelemetriDTO[]>('admin_telemetri_ringkas', { p_hari: hari }),

    // ── daftar tersamar (adapter yang menyamarkan) ─────────────────────
    /** Tersamar oleh server bila `alasan` null — tanpa baris audit, dan
     *  display_name dikirim kosong (0082). `alasan` (≥ 8 aksara) membuka email
     *  utuh dan menulis SATU baris audit untuk seluruh daftar (0081). */
    daftarPengguna: (limit = 50, offset = 0, cari = '', alasan: string | null = null) =>
      rpc<PenggunaDTO[]>('admin_daftar_pengguna_v2', { p_limit: limit, p_offset: offset, p_cari: cari || null, p_alasan: alasan }),
    /** v2: nama & pemilik tersamar DI SERVER; `cari` hanya mencocokkan bentuk
     *  tersamar (atau id ruang persis), jadi aman dikirim tanpa alasan. */
    daftarRuang: (limit = 50, offset = 0, cari = '', jenis: JenisRuang | null = null) =>
      rpc<RuangDTO[]>('admin_daftar_ruang_v2', { p_limit: limit, p_offset: offset, p_cari: cari.trim() || null, p_jenis: jenis }),

    // ── membuka data pribadi: alasan WAJIB, audit ditulis server ───────
    detailPengguna: (user: string, alasan: string) =>
      rpc<DetailPenggunaDTO>('admin_detail_pengguna_v2', { p_user: user, p_alasan: alasan }),
    aktivitasPengguna: (user: string, alasan: string, limit = 200) =>
      rpc<AktivitasDTO[]>('admin_aktivitas_pengguna', { p_user: user, p_alasan: alasan, p_limit: limit }),
    /** v2: TANPA note — hanya ada_catatan (server membatasi limit 1..200). */
    transaksiPengguna: (user: string, alasan: string, limit = 100) =>
      rpc<TransaksiDTO[]>('admin_baca_transaksi_v2', { p_user: user, p_alasan: alasan, p_limit: limit }),
    /** Isi catatan untuk id terpilih (1..100, semuanya milik `user`); server
     *  mencatat id mana saja yang dibuka. Satu id asing = seluruhnya ditolak
     *  (42501 bukan-milik-subjek). Awalan INVESTIGASI dipasang DI SINI, jadi
     *  halaman mengirim alasan yang diketik apa adanya. */
    catatanTransaksi: (user: string, alasan: string, ids: readonly string[]) =>
      rpc<CatatanTransaksiDTO[]>('admin_baca_catatan_transaksi', { p_user: user, p_alasan: alasanInvestigasi(alasan), p_ids: ids }),

    // ── audit ──────────────────────────────────────────────────────────
    daftarAudit: (limit = 50, offset = 0, aksi: string | null = null) =>
      rpc<AuditDTO[]>('admin_daftar_audit_v2', { p_limit: limit, p_offset: offset, p_aksi: aksi, p_admin: null }),
    aksiAudit: () => rpc<Array<{ action: string; jumlah: number }>>('admin_daftar_aksi_audit'),

    // ── sakelar fitur (termasuk auth.verifikasi_email) ─────────────────
    /** v2: admin.pengecualian_email dan nilai/catatan ber-'@' tersamar (`tersamar`). */
    daftarConfig: () => rpc<ConfigDTO[]>('admin_daftar_config_v2'),
    /** Nilai UTUH satu kunci — alasan wajib, audit buka_config. Satu-satunya
     *  jalan menyunting nilai yang tersamar di daftarConfig. */
    bukaConfig: (key: string, alasan: string) =>
      rpc<NilaiJson>('admin_config_buka', { p_key: key, p_alasan: alasan }),
    /** Nilai tersamar ditolak server (22023 hint nilai-tersamar); menerbitkan
     *  nilai/catatan ber-'@' juga (22023 nilai-pribadi-publik). */
    setConfig: (key: string, value: NilaiJson, publik: boolean, note: string, alasan: string) =>
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
