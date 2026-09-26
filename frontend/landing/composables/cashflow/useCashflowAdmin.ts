/**
 * Pembungkus RPC admin CashFlow — satu tempat untuk semua panggilan ke Supabase.
 *
 * Jenis kegagalan dibedakan supaya halaman bisa menjawab dengan benar. Hint
 * server dipetakan LEBIH DULU daripada aturan "42501 lainnya → bukan-admin":
 *   'sesi'        tidak ada sesi Supabase di tab ini, atau 42501 hint
 *                 sesi-konsol/mfa-wajib (sesi tidak dikenal server) → sambung
 *                 ulang lewat /masuk
 *   'totp'        (lama) diperlakukan sama dengan 'sesi'
 *   'versi-lama'  42501 pakai-versi-baru: RPC lama yang ditutup untuk sesi
 *                 console (0088; lima RPC 0b sejak 0089 untuk sesi ber-izin).
 *                 Halaman ini tidak memanggilnya lagi; yang melihat galat ini
 *                 memegang bundel lama → muat ulang
 *   'kasus'       42501 kasus-kedaluwarsa / kasus-tidak-dikenal: kasus habis,
 *                 ditutup, dicabut, atau bukan milik pelaku ini → data ranah
 *                 dibuang lalu kasus dibuka lagi otomatis (useCashflowKasus)
 *   'ranah'       42501 kasus-ranah: ranah itu tidak ada di kasus → "di luar
 *                 kasus: tambah ranah"
 *   'lingkup'     42501 kasus-lingkup: ruang/id di luar lingkup kasus
 *   'izin'        42501 izin-kurang: sesi tanpa cashflow:pii/investigasi →
 *                 "butuh login console ber-TOTP" (/console/keamanan)
 *   'batas'       42501 batas-investigasi (batas-akses TIDAK dilempar server:
 *                 admin_kasus_buka memulangkannya sebagai jsonb 200)
 *   'bukan-admin' 42501 lainnya → identitas sesi ini bukan admin CashFlow
 *   'alasan'      alasan kurang dari 8 aksara — diperiksa DI SINI sebelum
 *                 dikirim
 *   'argumen'     22023 dari server (argumen apa pun yang ditolak:
 *                 batas-2jam, kursor, saringan, kueri-tidak-didukung…) —
 *                 kalimatnya dari server, useCashflowMuat melokalkan hint yang
 *                 dikenal
 *   'tidak-ada'   P0002 — pengguna/transaksi/dompet tidak ada
 *   'lain'        sisanya
 *
 * Halaman tidak menulis blok catch sendiri: useCashflowMuat yang mengubah
 * jenis ini menjadi kalimat dan mengarahkan ke /masuk bila sesi hilang.
 *
 * SESI HILANG DI TENGAH HALAMAN. sessionStorage bisa kosong (tab dipulihkan,
 * refresh token ditolak). rpc() memeriksa sesi dulu; kalau tidak ada, minta
 * server mencetak lagi SEKALI lalu lanjut — pengguna tidak melihat apa-apa.
 *
 * DAFTAR RPC. Fase 1: data pengguna hanya lewat KASUS (0089/0090). Lima RPC
 * yang dicabut 0091 (admin_detail_pengguna_v2, admin_aktivitas_pengguna,
 * admin_baca_transaksi_v2, admin_baca_catatan_transaksi,
 * admin_daftar_audit_v2) tidak dipanggil lagi — sesi ber-izin sudah ditolak
 * kelimanya sejak 0089. Setiap nama RPC di berkas ini WAJIB juga ada di
 * cashflow/toko/uji-console-rpc.sql, yang memanggil semuanya dengan sesi
 * console Fase 1 di atas 0088→0091 — tests/cashflow/rpc-console.test.ts
 * membandingkan kedua daftar itu.
 *
 * PELAKU & ALASAN. Sesi Supabase-nya milik identitas konsol bersama (lihat
 * server/api/cashflow/sesi.post.ts), jadi admin_id di admin_audit selalu
 * identitas itu; manusianya dicatat SERVER (admin_audit.pelaku, admin_kasus.
 * pelaku dari admin_konsol_sesi). Untuk RPC 0b beralasan (daftar pengguna
 * terbuka, config, pengumuman, entitlement) rpc() masih menambahkan awalan
 * "[email] " pada p_alasan sebagai keterangan yang enak dibaca. Alasan KASUS
 * dikirim apa adanya (`tanpaPelaku`): pelakunya sudah kolom sendiri, dan
 * potongan 10 aksara alasan yang tampil di T0 (potong_alasan) harus berisi
 * nomor tiket, bukan email admin.
 *
 * NAMA ARGUMEN. PostgREST memilih fungsi menurut nama argumen, bukan urutan:
 * kunci p_* yang salah ketik baru gagal di produksi (PGRST202). Kunci setiap
 * objek argumen di bawah dibandingkan dengan parameter fungsi di migrasi oleh
 * tests/cashflow/rpc-console.test.ts — jadi argumen WAJIB objek literal.
 */
import type {
  StatsDTO, PenggunaDTO, CorongDTO, KeberhasilanDTO, RetensiDTO,
  RuangDTO, PengumumanDTO, KesehatanDTO, ConfigDTO, NilaiJson, JenisRuang,
} from '~/adapters/cashflow'
import type {
  KasusDTO, KasusAktifDTO, KasusBukaDTO, DaftarKasusDTO, RiwayatAksesDTO, AuditV3DTO,
  PresetKasus, PresetInvestigasi, KursorAkses,
} from '~/adapters/cashflowKasus'
import { MIN_ALASAN } from '~/adapters/cashflowKasus'
import type {
  KepalaPenggunaDTO, Pengguna360DTO, TransaksiCariDTO, TransaksiRinciDTO, TeksDTO, CariDTO,
  KursorTransaksi, SaringTransaksi, JenisTeks,
} from '~/adapters/cashflowBuku'
import type { JejakDTO, KursorJejak, SaringJejak } from '~/adapters/cashflowJejak'
import type {
  KepalaRuangDTO, Ruang360DTO, DompetRuangDTO, MutasiDompetDTO, PeriksaRuangDTO, SampahRuangDTO, KursorSampah,
  AktivitasV2DTO, KasusPeristiwaDTO,
} from '~/adapters/cashflowRuang'
import { RANAH_RUANG, SKENARIO_SELIDIKI } from '~/adapters/cashflowRuang'
import type {
  KatalogDTO, JadwalRuangDTO, JadwalRinciDTO, UsahaRuangDTO, StokRuangDTO, KursorStok, StrukRuangDTO, KursorStruk,
  SaringStruk, PatunganRuangDTO, PatunganRiwayatDTO, KursorBagi, KursorLunas, JenisRiwayatPatungan,
} from '~/adapters/cashflowRanahBuku'
import { kindDariArah } from '~/adapters/cashflowRanahBuku'
import type { PerangkatPenggunaDTO, KabarPenggunaDTO, KursorKabar, SaringKabar } from '~/adapters/cashflowPerangkat'

/* DTO sakelar pindah ke adapter (bertipe, tanpa any); diekspor ulang
   supaya impor lama dari berkas ini tetap jalan. */
export type { ConfigDTO } from '~/adapters/cashflow'

export type JenisGalat =
  | 'sesi' | 'totp' | 'bukan-admin' | 'alasan' | 'argumen' | 'konfigurasi' | 'tidak-ada' | 'versi-lama'
  | 'kasus' | 'ranah' | 'lingkup' | 'izin' | 'batas' | 'lain'
export class GalatAdmin extends Error {
  constructor(public jenis: JenisGalat, pesan: string, public hint: string = '') { super(pesan) }
}

/** Bentuk galat PostgREST yang dibaca di sini (galat jaringan: hanya message). */
interface GalatMentah { code?: unknown; hint?: unknown; message?: unknown }
const teks = (v: unknown): string => (typeof v === 'string' ? v : '')

/** Hint 42501 → jenis. Dicek SEBELUM "42501 lainnya → bukan-admin". */
export const HINT_42501: Readonly<Record<string, JenisGalat>> = {
  'mfa-wajib': 'sesi',
  'sesi-konsol': 'sesi',
  'pakai-versi-baru': 'versi-lama',
  'kasus-kedaluwarsa': 'kasus',
  'kasus-tidak-dikenal': 'kasus',
  'kasus-ranah': 'ranah',
  'kasus-lingkup': 'lingkup',
  'izin-kurang': 'izin',
  'batas-investigasi': 'batas',
  'batas-akses': 'batas',
}

/**
 * Hint 22023 yang dikenal (jenisnya tetap 'argumen'; hint dipertahankan
 * supaya useCashflowMuat melokalkannya — kalimat server hanya berbahasa
 * Indonesia). Fase 1: batas-2jam, kueri-tidak-didukung, kursor; 0094:
 * ranah-ruang; 0095: bulan (p_bulan bukan YYYY-MM), hari (p_hari di luar
 * 1..90), saringan (nilai saringan di luar daftar, rentang terbalik).
 * Id jadwal/struk/produk/dompet/kategori yang tidak ada dijawab 0095 dengan
 * 42501 kasus-lingkup (bukan P0002) → 'lingkup'.
 */
export const HINT_22023 = [
  'batas-2jam', 'kueri-tidak-didukung', 'kursor', 'ranah-ruang', 'nilai-tersamar', 'nilai-pribadi-publik',
  'bulan', 'hari', 'saringan',
] as const

/** Galat PostgREST/jaringan → GalatAdmin. GalatAdmin yang sudah jadi dipulangkan apa adanya. */
export function petakanGalat(e: unknown): GalatAdmin {
  if (e instanceof GalatAdmin) return e
  const g: GalatMentah = e && typeof e === 'object' ? (e as GalatMentah) : {}
  const kode = teks(g.code)
  const hint = teks(g.hint)
  const pesan = teks(g.message) || 'Gagal memanggil server.'
  if (kode === '42501') return new GalatAdmin(HINT_42501[hint] ?? 'bukan-admin', pesan, hint)
  if (kode === '22023') return new GalatAdmin('argumen', pesan, hint)
  if (kode === 'P0002') return new GalatAdmin('tidak-ada', pesan, hint)
  return new GalatAdmin('lain', pesan, hint)
}

/** p_alasan RPC 0b yang dikirim: "[pelaku] alasan". Syarat 8 aksara diukur
 *  pada bagian yang ditulis orang, SEBELUM awalan pelaku ditambahkan. */
export function alasanBerpelaku(siapa: string, alasan: string): string {
  const asli = alasan.trim()
  if (asli.length < MIN_ALASAN) throw new GalatAdmin('alasan', 'Alasan minimal 8 aksara.')
  return `[${siapa}] ${asli}`
}

/** p_alasan kasus: apa adanya (dipangkas), minimal 8 aksara. */
export function alasanKasus(alasan: string): string {
  const asli = alasan.trim()
  if (asli.length < MIN_ALASAN) throw new GalatAdmin('alasan', 'Alasan minimal 8 aksara.')
  return asli
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

  /** `tanpaPelaku`: alasan kasus dikirim apa adanya (lihat PELAKU & ALASAN). */
  async function rpc<T>(nama: string, args?: Record<string, unknown>, opsi: { tanpaPelaku?: boolean } = {}): Promise<T> {
    const a: Record<string, unknown> = { ...(args ?? {}) }
    if (typeof a.p_alasan === 'string') {
      a.p_alasan = opsi.tanpaPelaku
        ? alasanKasus(a.p_alasan)
        : alasanBerpelaku(sesiKonsol.pelaku.value || adminConsole.value?.email || 'console', a.p_alasan)
    }
    const sb = await pastikanSesi()
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
    /** v2 (0094): peristiwa.id, jenis, rentang nominal, tanggal — tanpa ruang,
     *  aktor, jam. v1 dicabut sesudah landing Fase 2 tayang. */
    aktivitasTerbaru: (limit = 100) => rpc<AktivitasV2DTO[]>('admin_aktivitas_terbaru_v2', { p_limit: limit }),
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

    // ── kasus (0089): buka, pulihkan, tambah, perpanjang, tutup ─────────
    /** Kasus aktif milik pelaku atas subjek ini (+ anak investigasi aktif).
     *  T0, tanpa audit — cara memulihkan kasus sesudah refresh/tab baru. */
    kasusAktif: (subjek: string) => rpc<KasusAktifDTO>('admin_kasus_aktif', { p_subjek: subjek }),
    /** Butuh pii. Batas laju → {ditolak:true, hint:'batas-akses'} (jsonb 200).
     *  `tipe` 'workspace' (0094): subjek = ruang, `ruang` = [] atau [subjek],
     *  ranah hanya ranah buku ruang (akun/perangkat/kabar → 22023 ranah-ruang). */
    kasusBuka: (subjek: string, skenario: string | null, preset: PresetKasus, ranah: readonly string[], ruang: readonly string[], alasan: string,
      tipe: 'user' | 'workspace' = 'user') =>
      rpc<KasusBukaDTO>('admin_kasus_buka', {
        p_subjek_tipe: tipe, p_subjek: subjek, p_skenario: skenario, p_preset: preset,
        p_ranah: [...ranah], p_ruang: [...ruang], p_alasan: alasan,
      }, { tanpaPelaku: true }),
    /** 0094: kasus induk aktif MILIK pelaku yang lingkupnya memuat ruang ini
     *  (subjek ruang itu dulu, lalu yang memegang ranah tab ruang terbanyak).
     *  Butuh pii (tanpa pii → 42501 izin-kurang), tanpa audit. */
    kasusAktifRuang: (ws: string) => rpc<KasusAktifDTO>('admin_kasus_aktif_ruang', { p_ws: ws }),
    /** "Selidiki" di /aktivitas: server menentukan ruang dari peristiwa; kasus
     *  ruang baru (kasus lama atas ruang itu ditutup, lanjutan_dari). */
    kasusBukaDariPeristiwa: (peristiwa: number, alasan: string) =>
      rpc<KasusPeristiwaDTO>('admin_kasus_buka_dari_peristiwa', {
        p_peristiwa: peristiwa, p_preset: 'keluhan', p_ranah: [...RANAH_RUANG], p_alasan: alasan, p_skenario: SKENARIO_SELIDIKI,
      }, { tanpaPelaku: true }),
    /** Kasus anak T3 (10 menit, ranah teks), alasan BARU, butuh investigasi. */
    kasusInvestigasi: (induk: string, preset: PresetInvestigasi, alasan: string) =>
      rpc<KasusDTO>('admin_kasus_investigasi', { p_induk: induk, p_ranah: ['teks'], p_preset: preset, p_alasan: alasan }, { tanpaPelaku: true }),
    /** Tambah ranah T1/T2 dan/atau ruang; alasan diwarisi. */
    kasusTambah: (kasus: string, ranah: readonly string[], ruang: readonly string[]) =>
      rpc<KasusDTO>('admin_kasus_tambah', { p_kasus: kasus, p_ranah: [...ranah], p_ruang: [...ruang] }),
    kasusPerpanjang: (kasus: string) => rpc<KasusDTO>('admin_kasus_perpanjang', { p_kasus: kasus }),
    kasusTutup: (kasus: string) => rpc<KasusDTO>('admin_kasus_tutup', { p_kasus: kasus }),
    /** /kasus — subjek selalu tersamar; alasan utuh hanya pii / milik sendiri. */
    daftarKasus: (limit = 200, offset = 0, pelaku: string | null = null, subjek: string | null = null) =>
      rpc<DaftarKasusDTO[]>('admin_daftar_kasus', { p_limit: limit, p_offset: offset, p_pelaku: pelaku, p_subjek: subjek }),

    // ── Pengguna 360 (0090): kepala T0, lalu data lewat kasus ───────────
    /** T0: email tersamar, hitungan; ruang[] hanya untuk pii. Audit lihat_kepala. */
    kepalaPengguna: (user: string) => rpc<KepalaPenggunaDTO>('admin_pengguna_kepala', { p_user: user }),
    /** Ranah akun: akun, hitung{}, total bersih, ruang[]. Audit baca_akun. */
    pengguna360: (kasus: string, user: string) => rpc<Pengguna360DTO>('admin_pengguna_360', { p_kasus: kasus, p_user: user }),
    /** Ranah transaksi, keyset, TANPA note. Audit baca_transaksi per halaman.
     *  mode 'pengguna': yang DICATAT subjek (s.ruang = saringan ruang);
     *  mode 'ruang': semua transaksi di ruang `subjek` (Ruang 360). */
    transaksiCari: (kasus: string, mode: 'pengguna' | 'ruang', subjek: string, s: SaringTransaksi, kursor: KursorTransaksi | null, limit = 100) =>
      rpc<TransaksiCariDTO>('admin_transaksi_cari', {
        p_kasus: kasus, p_user: mode === 'pengguna' ? subjek : null, p_ws: mode === 'ruang' ? subjek : s.ruang, p_mode: mode,
        p_dompet: s.dompet, p_kategori: s.kategori, p_jenis: s.jenis,
        p_dari: s.dari, p_sampai: s.sampai, p_min: s.min, p_maks: s.maks,
        p_cek: s.cek, p_termasuk_sampah: s.sampah, p_kursor: kursor, p_limit: limit,
      }),
    /** Laci ?tx= — jatuh ke sampah bila id tidak hidup. Audit baca_transaksi_rinci. */
    transaksiRinci: (kasus: string, tx: string) => rpc<TransaksiRinciDTO>('admin_transaksi_rinci', { p_kasus: kasus, p_tx: tx }),
    /** Ranah jejak: peristiwa yang dilakukan `aktor` (Pengguna 360), atau
     *  aktor null = semua peristiwa di ruang s.ruang (Ruang 360). Audit baca_jejak. */
    jejak: (kasus: string, aktor: string | null, s: SaringJejak, kursor: KursorJejak | null, limit = 100) =>
      rpc<JejakDTO>('admin_jejak', {
        p_kasus: kasus, p_ws: s.ruang, p_aktor: aktor, p_jenis: s.jenis,
        p_dari: s.dari, p_sampai: s.sampai, p_kursor: kursor, p_limit: limit,
      }),
    /** T3 (kasus ANAK): teks bebas untuk ≤ 100 id. Audit baca_teks {jenis, ids}. */
    teks: (kasusAnak: string, jenis: JenisTeks, ids: readonly string[]) =>
      rpc<TeksDTO>('admin_teks', { p_kasus_anak: kasusAnak, p_jenis: jenis, p_ids: [...ids] }),
    /** Palet (Enter): butuh pii; email lengkap / uuid / awalan ≥ 8 hex; ≤ 20.
     *  v2 (0094): + jenis ruang. Audit cari. v1 dicabut sesudah Fase 2 tayang. */
    cari: (q: string) => rpc<CariDTO>('admin_cari_v2', { p_q: q }),
    /** Siapa melihat data orang ini — T0, tanpa audit. */
    riwayatAkses: (target: string, kursor: KursorAkses | null, limit = 50) =>
      rpc<RiwayatAksesDTO>('admin_riwayat_akses', { p_target: target, p_kursor: kursor, p_limit: limit }),

    // ── Ruang 360 (0094): kepala T0, lalu data lewat kasus ──────────────
    /** T0: nama & pemilik tersamar; jumlah_* hanya pii. Audit lihat_kepala. */
    kepalaRuang: (ws: string) => rpc<KepalaRuangDTO>('admin_ruang_kepala', { p_ws: ws }),
    /** Ranah ruang: pengaturan, anggota, bekas, undangan, hitung{}. Audit baca_ruang. */
    ruang360: (kasus: string, ws: string) => rpc<Ruang360DTO>('admin_ruang_360', { p_kasus: kasus, p_ws: ws }),
    /** Ranah dompet: dompet + saldo; `ws` null = semua ruang lingkup kasus. Audit baca_dompet. */
    dompetRuang: (kasus: string, ws: string | null) => rpc<DompetRuangDTO>('admin_dompet_ruang', { p_kasus: kasus, p_ws: ws }),
    /** Ranah dompet: mutasi satu dompet + saldo berjalan, keyset. Audit baca_dompet. */
    mutasiDompet: (kasus: string, wallet: string, kursor: KursorTransaksi | null, limit = 100) =>
      rpc<MutasiDompetDTO>('admin_mutasi_dompet', { p_kasus: kasus, p_wallet: wallet, p_kursor: kursor, p_limit: limit }),
    /** Ranah dompet: hitungan pemeriksaan integritas. Audit baca_dompet. */
    periksaRuang: (kasus: string, ws: string) => rpc<PeriksaRuangDTO>('admin_periksa_ruang', { p_kasus: kasus, p_ws: ws }),
    /** Ranah jejak: sampah ruang (dihapus & dipulihkan), keyset {d,i}. Audit baca_sampah. */
    sampahRuang: (kasus: string, ws: string, kursor: KursorSampah | null, limit = 100) =>
      rpc<SampahRuangDTO>('admin_sampah_ruang', { p_kasus: kasus, p_ws: ws, p_kursor: kursor, p_limit: limit }),

    // ── Ranah buku (0095): ruang — Katalog, Jadwal, Usaha, Struk, Patungan ─
    /** Ranah katalog: kategori + anggaran bulan `bulan` ('YYYY-MM'; null = bulan WIB kini). Audit baca_katalog. */
    katalogRuang: (kasus: string, ws: string, bulan: string | null = null) =>
      rpc<KatalogDTO>('admin_katalog_ruang', { p_kasus: kasus, p_ws: ws, p_bulan: bulan }),
    /** Ranah jadwal: daftar jadwal (≤ 500) + ringkas; `arsip` null = semua. Audit baca_jadwal. */
    jadwalRuang: (kasus: string, ws: string, arsip: boolean | null = null) =>
      rpc<JadwalRuangDTO>('admin_jadwal_ruang', { p_kasus: kasus, p_ws: ws, p_arsip: arsip }),
    /** Ranah jadwal: satu jadwal (ruang diturunkan server dari barisnya). Id
     *  tak ada / di luar lingkup = 42501 kasus-lingkup. Audit baca_jadwal. */
    jadwalRinci: (kasus: string, jadwal: string) =>
      rpc<JadwalRinciDTO>('admin_jadwal_rinci', { p_kasus: kasus, p_jadwal: jadwal }),
    /** Ranah usaha: produk + stok kini (≤ 1000) + ringkas. Audit baca_usaha. */
    usahaRuang: (kasus: string, ws: string, arsip: boolean | null = null) =>
      rpc<UsahaRuangDTO>('admin_usaha_ruang', { p_kasus: kasus, p_ws: ws, p_arsip: arsip }),
    /** Ranah usaha: riwayat stok (stock_moves), keyset {o,c,i}. Audit baca_usaha. */
    stokRuang: (kasus: string, ws: string, produk: string | null, kursor: KursorStok | null, limit = 100) =>
      rpc<StokRuangDTO>('admin_stok_ruang', { p_kasus: kasus, p_ws: ws, p_produk: produk, p_kursor: kursor, p_limit: limit }),
    /** Ranah struk: metadata struk (tanpa merchant/note/foto/kontak), keyset {c,i}. Audit baca_struk. */
    strukRuang: (kasus: string, ws: string, s: SaringStruk, kursor: KursorStruk | null, limit = 100) =>
      rpc<StrukRuangDTO>('admin_struk_ruang', {
        p_kasus: kasus, p_ws: ws, p_pencatat: s.pencatat, p_kind: kindDariArah(s.jenis), p_kasbon: s.kasbon,
        p_ocr: s.ocr, p_dari: s.dari, p_sampai: s.sampai, p_kursor: kursor, p_limit: limit,
      }),
    /** Laci struk: baris item satu struk lewat admin_transaksi_cari p_grup —
     *  ranah TRANSAKSI (bukan struk), tanpa note. Audit baca_transaksi. */
    strukBaris: (kasus: string, ws: string, grup: string, limit = 200) =>
      rpc<TransaksiCariDTO>('admin_transaksi_cari', { p_kasus: kasus, p_ws: ws, p_mode: 'ruang', p_grup: grup, p_limit: limit }),
    /** Ranah dompet: saldo patungan anggota + bekas anggota + ringkas. Audit baca_dompet. */
    patunganRuang: (kasus: string, ws: string) =>
      rpc<PatunganRuangDTO>('admin_patungan_ruang', { p_kasus: kasus, p_ws: ws }),
    /** Ranah dompet: riwayat bagi {o,c,i} atau pelunasan {p,i}. Audit baca_dompet. */
    patunganRiwayat: (kasus: string, ws: string, jenis: JenisRiwayatPatungan, kursor: KursorBagi | KursorLunas | null, limit = 100) =>
      rpc<PatunganRiwayatDTO>('admin_patungan_riwayat', { p_kasus: kasus, p_ws: ws, p_jenis: jenis, p_kursor: kursor, p_limit: limit }),

    // ── Ranah milik orang (0095): Perangkat, Kabar — Pengguna 360 saja ──
    /** Ranah perangkat: pemasangan (sidik), sesi (sidik), jeda antrean `hari` (1..90). Audit baca_perangkat. */
    perangkatPengguna: (kasus: string, user: string, hari = 30) =>
      rpc<PerangkatPenggunaDTO>('admin_perangkat_pengguna', { p_kasus: kasus, p_user: user, p_hari: hari }),
    /** Ranah kabar: kotak masuk kabar orang ini di ruang lingkup kasus, keyset {p,i}. Audit baca_kabar. */
    kabarPengguna: (kasus: string, user: string, s: SaringKabar, kursor: KursorKabar | null, limit = 100) =>
      rpc<KabarPenggunaDTO>('admin_kabar_pengguna', {
        p_kasus: kasus, p_user: user, p_ws: s.ruang, p_jenis: s.jenis, p_belum: s.belum, p_kursor: kursor, p_limit: limit,
      }),

    // ── audit ──────────────────────────────────────────────────────────
    /** v3: target tersamar, alasan terpotong kecuali pii / milik sendiri; + ranah, kasus, terdampak. */
    daftarAudit: (limit = 50, offset = 0, aksi: string | null = null, kasus: string | null = null) =>
      rpc<AuditV3DTO[]>('admin_daftar_audit_v3', { p_limit: limit, p_offset: offset, p_aksi: aksi, p_pelaku: null, p_target: null, p_kasus: kasus }),
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
