/**
 * Foto lampiran (0122): tombol "Lihat foto" di console CashFlow.
 *
 * Foto termasuk ranah T3, sejajar dengan catatan bebas. Satu klik membuka
 * (atau memakai ulang) kasus anak ber-ranah `foto`, lalu memanggil fungsi edge
 * admin-lampiran untuk SATU baris. Fungsi itu memeriksa hak di basis data,
 * menulis satu baris audit buka_foto, dan memulangkan tautan bertanda tangan
 * berumur pendek. Console mengambil berkasnya saat itu juga (tanpa cache) dan
 * menampilkannya sebagai blob URL yang dibuang begitu penampil ditutup.
 *
 * Fungsi MURNI semua: bentuk jawaban fungsi edge, pilihan sasaran per tempat
 * di console, alasan otomatis kasus anak, dan penjaga asal tautan. Tidak ada
 * jaringan di sini (lihat useCashflowAdmin.lampiran dan useCashflowKasus).
 *
 * adapters/ tidak di-auto-import Nuxt — selalu impor eksplisit.
 */
import { terbatas, type GrupPenuhDTO, type TerbatasDTO } from './cashflowBuku'
import { capWaktuWib } from './cashflowKasus'

/** `jenis` yang diterima admin-lampiran, dengan ranah induk yang wajib ada:
 *  transaksi → transaksi, struk → struk, pelunasan → dompet. */
export const JENIS_LAMPIRAN = ['transaksi', 'struk', 'pelunasan'] as const
export type JenisLampiran = typeof JENIS_LAMPIRAN[number]
/** Jenis berkas di jawaban: foto nota (bucket receipts) atau foto bukti bayar. */
export const JENIS_BERKAS = ['struk', 'bukti'] as const
export type JenisBerkas = typeof JENIS_BERKAS[number]

/** Ranah kasus anak T3 yang dibuka otomatis oleh console. Satu anak per
 *  ranah: anak teks tidak bisa membuka foto dan sebaliknya (403 kasus-ranah). */
export type RanahAnak = 'teks' | 'foto'

/** Baris yang fotonya dibuka. */
export interface SasaranLampiran { jenis: JenisLampiran; id: string }

// ── DTO: persis jawaban admin-lampiran ───────────────────────────────────
export interface BerkasLampiranDTO { jenis: string; url: string | null; kedaluwarsa_pada: string | null }
export interface LampiranDTO { berkas: BerkasLampiranDTO[]; berlaku_detik: number }

// ── Domain ───────────────────────────────────────────────────────────────
export interface BerkasLampiran {
  /** null = jenis yang tidak dikenal console (tetap ditampilkan sebagai "Foto"). */
  jenis: JenisBerkas | null
  /** null = baris lampirannya ada tapi berkasnya belum di penyimpanan. */
  url: string | null
  kedaluwarsaIso: string | null
}
export interface Lampiran { berkas: BerkasLampiran[]; berlakuDetik: number }

/** Umur tautan menurut kontrak, dipakai bila server tidak menyebutnya. */
export const BERLAKU_BAWAAN_DETIK = 300

const JENIS_BERKAS_SET: ReadonlySet<string> = new Set(JENIS_BERKAS)

/** Jawaban 200 → domain. Toleran: bentuk asing jatuh ke daftar kosong, bukan galat. */
export function keLampiran(d: unknown): Lampiran {
  const o = d && typeof d === 'object' ? (d as Partial<LampiranDTO>) : {}
  const berkas = Array.isArray(o.berkas) ? o.berkas : []
  const detik = Number(o.berlaku_detik)
  return {
    berkas: berkas
      .filter((b): b is BerkasLampiranDTO => !!b && typeof b === 'object')
      .map(b => ({
        jenis: JENIS_BERKAS_SET.has(b.jenis) ? (b.jenis as JenisBerkas) : null,
        url: typeof b.url === 'string' && b.url ? b.url : null,
        kedaluwarsaIso: typeof b.kedaluwarsa_pada === 'string' ? b.kedaluwarsa_pada : null,
      })),
    berlakuDetik: Number.isFinite(detik) && detik > 0 ? detik : BERLAKU_BAWAAN_DETIK,
  }
}

/** Alasan kasus anak foto (kontrak 0122 §2). Bahasa Indonesia apa pun bahasa
 *  layar: audit dibaca lintas admin. Berbeda dari alasan anak teks. */
export const alasanFotoOtomatis = (sekarang: Date = new Date()): string =>
  `Foto lampiran dibuka dari console CashFlow · ${capWaktuWib(sekarang)}`

/**
 * Tautan berkas hanya diambil bila asalnya SAMA dengan Supabase CashFlow yang
 * dikonfigurasi dan jalurnya tautan bertanda tangan Storage. Jawaban server
 * yang aneh tidak bisa membuat console mengambil alamat lain (CSP pun
 * menolaknya, ini lapis pertama).
 */
export function urlBerkasSah(url: string, supabaseUrl: string): boolean {
  try {
    const u = new URL(url)
    const dasar = new URL(supabaseUrl)
    return u.origin === dasar.origin && u.pathname.startsWith('/storage/v1/object/sign/')
  } catch {
    return false
  }
}

// ── Kapan tombol Lihat muncul (kontrak 0122 §4) ──────────────────────────
/** Daftar transaksi (admin_transaksi_cari): `ada_lampiran`. */
export const lampiranTransaksi = (t: { id: string; adaLampiran: boolean }): SasaranLampiran | null =>
  (t.adaLampiran ? { jenis: 'transaksi', id: t.id } : null)

/** Laci transaksi (admin_transaksi_rinci): bukti atau lampiran pada transaksi
 *  yang masih hidup. Transaksi di sampah tidak punya tombol: baris
 *  lampirannya ikut terhapus. Bukti bayar cicilan/tagihan juga lewat sini
 *  (foto pada transaksi pembayarannya). */
export const lampiranRinci = (r: {
  sumber: 'transaksi' | 'sampah'; id: string; lampiran: { adaBukti: boolean; jumlah: number | null }
}): SasaranLampiran | null =>
  (r.sumber === 'transaksi' && (r.lampiran.adaBukti || (r.lampiran.jumlah ?? 0) > 0) ? { jenis: 'transaksi', id: r.id } : null)

/** Blok grup di laci: hanya grup PENUH (ranah struk ada di kasus) yang berfoto. */
export const lampiranGrup = (g: GrupPenuhDTO | TerbatasDTO | null | undefined): SasaranLampiran | null =>
  (g && !terbatas(g) && g.ada_foto === true ? { jenis: 'struk', id: g.id } : null)

/** Tab Struk (admin_struk_ruang): `ada_foto`. */
export const lampiranStruk = (s: { id: string; adaFoto: boolean }): SasaranLampiran | null =>
  (s.adaFoto ? { jenis: 'struk', id: s.id } : null)

/** Riwayat lunas patungan (admin_patungan_riwayat): `ada_bukti`. */
export const lampiranPelunasan = (l: { id: string; adaBukti: boolean }): SasaranLampiran | null =>
  (l.adaBukti ? { jenis: 'pelunasan', id: l.id } : null)
