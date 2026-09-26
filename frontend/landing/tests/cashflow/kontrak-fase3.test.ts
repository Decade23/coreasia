/**
 * Kontrak adapter Fase 3 (ranah buku) terhadap migrasi 0095.
 *
 * Contoh jawaban ditulis sebagai TEKS JSON seperti yang dikirim PostgREST;
 * kuncinya dibandingkan dengan jsonb_build_object di definisi TERAKHIR
 * fungsinya. Contoh yang menyimpang dari server membuat uji merah. Bila 0095
 * belum ada di folder migrasi, bagian kontrak dilewati (terlihat "skipped");
 * konversi domain tetap diuji. Termasuk bentuk TANPA ranah silang
 * (rinci:false) untuk admin_jadwal_rinci dan admin_perangkat_pengguna.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  adaMigrasiNomor, DIR_MIGRASI, fungsiTerakhir, parameterFungsi, pohonContoh, pohonDengan, semuaPohonJsonb, urutPohon, type PohonKunci,
} from './migrasi'
import {
  keKatalog, keJadwalRuang, keJadwalRinci, keUsahaRuang, keGerakStok, keStruk, keRingkasStruk, kePatungan, keBagiBaris, keLunasBaris,
  kursorStrukDariUrl, kursorPatunganDariUrl, kursorStokDariUrl, kodeDari, kunciKode, warnaAman, ikonAman, kindDariArah,
  ALASAN_LEWATI, ALASAN_STOK, SEBAB_RINCI_STOK, ARAH_PENYESUAIAN, SEBAB_PENYESUAIAN, IRAMA_JADWAL, KEADAAN_JADWAL, OCR_STRUK,
  type KatalogDTO, type JadwalRuangDTO, type JadwalRinciDTO, type UsahaRuangDTO, type StokRuangDTO, type StrukRuangDTO,
  type PatunganRuangDTO, type PatunganRiwayatDTO, type BagiBarisDTO, type LunasBarisDTO,
} from '../../adapters/cashflowRanahBuku'
import {
  kePerangkatPengguna, keKabar, keRingkasKabar, keSetelanKabar, kursorKabarDariUrl, hariSah,
  JENIS_KABAR, PERAN_KABAR, PLATFORM_PERANGKAT, VARIAN_APLIKASI, AAL_SESI,
  type PerangkatPenggunaDTO, type KabarPenggunaDTO, type KabarDTO,
} from '../../adapters/cashflowPerangkat'
import { kursorKeUrl } from '../../adapters/cashflowBuku'
import { HINT_22023, petakanGalat } from '../../composables/cashflow/useCashflowAdmin'

const ADA = adaMigrasiNomor('0095')
const urut = (xs: readonly string[]) => [...xs].sort()
const sama = (contoh: unknown, server: PohonKunci) => expect(urutPohon(pohonContoh(contoh))).toEqual(urutPohon(server))
const tanpa = (p: PohonKunci, ...k: string[]): PohonKunci => Object.fromEntries(Object.entries(p).filter(([x]) => !k.includes(x)))
const badan = (f: string) => fungsiTerakhir(f).badan
/** Objek jawaban teratas = jsonb_build_object terakhir yang memuat 'kasus'. */
const atas = (f: string): PohonKunci => {
  const p = semuaPohonJsonb(badan(f)).filter(t => 'kasus' in t)
  if (!p.length) throw new Error(`${f}: tidak ada objek jawaban`)
  return p[p.length - 1]!
}
const W = '5a60c1e2-2d3a-4b5c-8d7e-9f0a1b2c3d4e'
const U = '3f0c2a4e-8b1d-4c6a-9e2f-1a2b3c4d5e6f'
const U2 = '7c8d9e0f-1a2b-4c3d-9e4f-5a6b7c8d9e0f'
const K = 'd1e6aa00-1111-4111-8111-111111111111'
const ID = (n: number) => `aa000000-0000-4000-8000-${String(n).padStart(12, '0')}`

// ── R1 Katalog ───────────────────────────────────────────────────────────
const KATALOG = `{"kasus": "${K}", "workspace_id": "${W}", "bulan": "2026-09",
  "kategori": [{"id": "${ID(1)}", "name": "Belanja dapur", "kind": "expense", "icon": "cart", "color": "#e57373",
    "tampilan_tak_sah": false, "kode_tak_dikenal": false, "archived": false, "created_at": "2026-03-02T01:10:00+00:00",
    "user_id": "${U}", "jumlah_transaksi": 412, "terakhir_dipakai": "2026-09-25"}],
  "anggaran": [
    {"lingkup": "kategori", "category_id": "${ID(1)}", "target": 1500000, "berulang": true, "sumber_id": "${ID(7)}",
     "tepat_id": null, "berulang_id": "${ID(7)}", "terpakai": "1210000.00", "rasio": 0.8067, "kategori_kind": "expense",
     "kategori_archived": false, "tampil_di_aplikasi": true},
    {"lingkup": "keseluruhan", "category_id": "00000000-0000-0000-0000-000000000000", "target": 0, "berulang": false,
     "sumber_id": "${ID(9)}", "tepat_id": "${ID(9)}", "berulang_id": null, "terpakai": 4380000, "rasio": null,
     "kategori_kind": null, "kategori_archived": null, "tampil_di_aplikasi": null}],
  "baris_anggaran": [{"id": "${ID(7)}", "category_id": "${ID(1)}", "month": "R:2026-01", "amount": 1500000,
    "created_at": "2026-01-01T02:00:00+00:00", "user_id": "${U}"}],
  "terpotong": {"kategori": false, "baris_anggaran": true}}`

describe('kontrak KatalogDTO ↔ admin_katalog_ruang / admin_anggaran_bangun', () => {
  it.skipIf(!ADA)('jawaban, kategori, anggaran, baris_anggaran = kunci server', () => {
    const d = JSON.parse(KATALOG) as KatalogDTO
    sama(d, { ...atas('admin_katalog_ruang'), kategori: pohonContoh(d.kategori), anggaran: pohonContoh(d.anggaran), baris_anggaran: pohonContoh(d.baris_anggaran) })
    const b = badan('admin_katalog_ruang')
    sama(d.kategori[0], pohonDengan(b, 'jumlah_transaksi', 'terakhir_dipakai'))
    sama(d.baris_anggaran[0], pohonDengan(b, 'month', 'amount'))
    sama(d.anggaran[0], pohonDengan(badan('admin_anggaran_bangun'), 'terpakai', 'tampil_di_aplikasi'))
  })
  it.skipIf(!ADA)('parameter p_kasus, p_ws, p_bulan (bawaan bulan WIB kini); 22023 bulan', () => {
    expect(parameterFungsi('admin_katalog_ruang')).toEqual([{ nama: 'p_kasus', bawaan: false }, { nama: 'p_ws', bawaan: false }, { nama: 'p_bulan', bawaan: true }])
    expect(badan('admin_katalog_ruang')).toMatch(/hint = 'bulan'/)
  })
  it('keKatalog: rasio null = tanpa target; keseluruhan tanpa kategoriId; baris berulang R:', () => {
    const k = keKatalog(JSON.parse(KATALOG) as KatalogDTO)
    expect(k.kategori[0]).toMatchObject({ nama: 'Belanja dapur', arah: 'keluar', ikon: 'cart', warna: '#e57373', transaksi: 412 })
    expect(k.anggaran[0]).toMatchObject({ keseluruhan: false, kategoriId: ID(1), terpakai: 1210000, rasio: 0.8067, tampilDiAplikasi: true })
    expect(k.anggaran[1]).toMatchObject({ keseluruhan: true, kategoriId: null, target: 0, rasio: null, tampilDiAplikasi: null })
    expect(k.barisAnggaran[0]).toMatchObject({ bulan: '2026-01', berulang: true, nominal: 1500000 })
    expect(k.terpotong).toEqual({ kategori: false, barisAnggaran: true })
  })
  it('penyaring ikon/warna klien: nilai tak sah = null (warna netral, tidak masuk style)', () => {
    expect(warnaAman('#abc')).toBe('#abc')
    for (const v of ['red', 'url(x)', '#12', '#123456789', 'expression(1)', null]) expect(warnaAman(v)).toBeNull()
    expect(ikonAman('cart-plus')).toBe('cart-plus')
    for (const v of ['<svg>', 'Cart', 'a b', null]) expect(ikonAman(v)).toBeNull()
    const d = JSON.parse(KATALOG) as KatalogDTO
    expect(keKatalog({ ...d, kategori: [{ ...d.kategori[0]!, color: 'javascript:1', icon: '"><x' }] }).kategori[0]).toMatchObject({ warna: null, ikon: null })
  })
})

// ── R2/R3 Jadwal ─────────────────────────────────────────────────────────
const JADWAL_BARIS = {
  id: ID(11), user_id: U, wallet_id: ID(2), dompet_nama: 'BCA', category_id: ID(3), kategori_nama: 'Cicilan',
  title: 'Cicilan motor', kind: 'expense', amount: 850000, cadence: 'month', anchor_day: 5, anchor_month: null,
  start_on: '2025-11-05', next_due: '2026-09-05', total_count: 24, paid_count: 10, skipped_count: 1, partial_paid: 0,
  dibayar_tercatat: '8500000.00', dibayar_awal: 0, progress_reset_at: null, archived: false, created_at: '2025-11-01T03:00:00+00:00',
  ada_catatan: true, jumlah_pembayaran: 10, jumlah_dilewati: 1, jumlah_penyesuaian: 2, pembayaran_di_sampah: 0,
  tempo_sekarang: '2026-09-05', next_due_basi: false, terlambat: true, selesai: false, keadaan: 'terlambat', kode_tak_dikenal: false,
}
const JADWAL = JSON.stringify({
  kasus: K, workspace_id: W, ringkas: { total: 6, aktif: 4, arsip: 1, selesai: 1, terlambat: 1, cicilan: 3, berulang: 2 },
  baris: [JADWAL_BARIS], terpotong: false,
})
const RINCI_PENUH = JSON.stringify({
  kasus: K, jadwal: JADWAL_BARIS,
  lewati: [{ id: ID(21), period_no: 7, due_on: '2026-05-05', reason: 'belum_ada_uang', kode_tak_dikenal: false, created_at: '2026-05-06T01:00:00+00:00', user_id: U }],
  lewati_lebih: false,
  penyesuaian: [{ id: ID(22), tx_id: ID(23), arah: 'tambah', nominal: 25000, sebab: 'denda', kode_tak_dikenal: false, periode_ke: 9, created_at: '2026-07-06T02:00:00+00:00', user_id: U }],
  penyesuaian_lebih: false,
  pembayaran: [{ id: ID(23), occurred_at: '2026-07-06', created_at: '2026-07-06T02:00:00+00:00', amount: 875000, kind: 'expense',
    installment_no: 9, schedule_periods: 1, pencatat: U, ada_catatan: false, jejak_jadwal: { v: 1, periode: 9, tutup: 1, sebelum: { paid: 8, partial: 0 } } }],
  pembayaran_lebih: false,
  di_sampah: [{ id: ID(24), tx_id: ID(25), amount: 875000, occurred_at: '2026-06-06', pencatat: U, dihapus_oleh: U2,
    dihapus_pada: '2026-06-07T00:00:00+00:00', dipulihkan_pada: null, status: 'dihapus' }],
  di_sampah_lebih: false,
  rinci: { pembayaran: true, di_sampah: true },
})
/** Tanpa ranah transaksi dan jejak (§2.8, K-F3-12). */
const RINCI_TANPA = JSON.stringify({
  ...JSON.parse(RINCI_PENUH), pembayaran: [{ installment_no: 9, occurred_at: '2026-07-06', amount: 875000 }], di_sampah: [],
  rinci: { pembayaran: false, di_sampah: false },
})

describe('kontrak JadwalRuangDTO / JadwalRinciDTO ↔ admin_jadwal_ruang / admin_jadwal_rinci', () => {
  it.skipIf(!ADA)('baris = admin_jadwal_baris_inti; ringkas & jawaban = admin_jadwal_ruang; tanpa note', () => {
    const d = JSON.parse(JADWAL) as JadwalRuangDTO
    sama(d.baris[0], pohonDengan(badan('admin_jadwal_baris_inti'), 'tempo_sekarang', 'keadaan'))
    sama(d.ringkas, pohonDengan(badan('admin_jadwal_ruang'), 'cicilan', 'berulang'))
    sama(d, { ...atas('admin_jadwal_ruang'), ringkas: pohonContoh(d.ringkas), baris: pohonContoh(d.baris) })
    expect(badan('admin_jadwal_baris_inti')).not.toMatch(/'note'/)
  })
  it.skipIf(!ADA)('rinci: lewati, penyesuaian, pembayaran rinci & ringkas, di_sampah, rinci{} = kunci server', () => {
    const b = badan('admin_jadwal_rinci')
    const p = JSON.parse(RINCI_PENUH) as JadwalRinciDTO
    const t = JSON.parse(RINCI_TANPA) as JadwalRinciDTO
    const a = atas('admin_jadwal_rinci')
    expect(urut(Object.keys(p))).toEqual(urut(Object.keys(a)))
    sama(p.rinci, a.rinci!)
    sama(p.lewati[0], pohonDengan(b, 'period_no', 'due_on'))
    sama(p.penyesuaian[0], pohonDengan(b, 'arah', 'periode_ke'))
    sama(tanpa(pohonContoh(p.pembayaran[0]) as PohonKunci, 'jejak_jadwal'), tanpa(pohonDengan(b, 'installment_no', 'jejak_jadwal'), 'jejak_jadwal'))
    const ringkas = semuaPohonJsonb(b).find(x => 'installment_no' in x && !('id' in x))
    expect(ringkas).toBeDefined()
    sama(t.pembayaran[0], ringkas!)
    sama(p.di_sampah[0], pohonDengan(b, 'dihapus_pada', 'status'))
  })
  it.skipIf(!ADA)('kosakata = daftar putih server (lewati, sebab, arah, cadence, keadaan)', () => {
    const r = badan('admin_jadwal_rinci')
    expect(r).toContain(`array[${ALASAN_LEWATI.map(x => `'${x}'`).join(', ')}]`)
    expect(r).toContain(`array[${SEBAB_PENYESUAIAN.map(x => `'${x}'`).join(', ')}]`)
    expect(r).toContain(`in (${ARAH_PENYESUAIAN.map(x => `'${x}'`).join(', ')})`)
    const inti = badan('admin_jadwal_baris_inti')
    expect(inti).toContain(`in (${IRAMA_JADWAL.map(x => `'${x}'`).join(', ')})`)
    const keadaan = new Set([...inti.matchAll(/then '([a-z-]+)'|else '([a-z-]+)' end,/g)].map(m => (m[1] ?? m[2])!))
    for (const k of KEADAAN_JADWAL) expect(keadaan.has(k), k).toBe(true)
    expect(r).toMatch(/hint = 'kasus-lingkup'/)
    expect(r).not.toMatch(/P0002/)
  })
  it('keJadwalRuang / keJadwalRinci: rinci penuh vs tanpa ranah silang', () => {
    const j = keJadwalRuang(JSON.parse(JADWAL) as JadwalRuangDTO)
    expect(j.baris[0]).toMatchObject({ judul: 'Cicilan motor', irama: 'month', dibayarTercatat: 8500000, keadaan: 'terlambat', terlambat: true, adaCatatan: true })
    expect(j.ringkas).toMatchObject({ total: 6, aktif: 4 })
    const p = keJadwalRinci(JSON.parse(RINCI_PENUH) as JadwalRinciDTO)
    expect(p.rinci).toEqual({ pembayaran: true, diSampah: true })
    expect(p.pembayaran[0]).toMatchObject({ rinci: true, id: ID(23), pencatat: U, cicilanKe: 9, jenis: 'keluar' })
    expect(p.lewati[0]).toMatchObject({ alasan: 'belum_ada_uang', periode: 7 })
    expect(p.penyesuaian[0]).toMatchObject({ arah: 'tambah', sebab: 'denda', nominal: 25000 })
    expect(p.diSampah[0]).toMatchObject({ dipulihkan: false, dihapusOleh: U2 })
    const t = keJadwalRinci(JSON.parse(RINCI_TANPA) as JadwalRinciDTO)
    expect(t.rinci).toEqual({ pembayaran: false, diSampah: false })
    expect(t.pembayaran[0]).toEqual({
      rinci: false, id: null, tanggal: '2026-07-06', dibuatIso: null, nominal: 875000, jenis: null, cicilanKe: 9, periode: null,
      pencatat: null, adaCatatan: false, jejak: null,
    })
  })
  it('kode asing → "lain" (kode tidak dikenal); keadaan asing → null', () => {
    const b = keJadwalRuang({ ...(JSON.parse(JADWAL) as JadwalRuangDTO), baris: [{ ...JADWAL_BARIS, cadence: 'lain', keadaan: 'x', kode_tak_dikenal: true }] }).baris[0]!
    expect(b).toMatchObject({ irama: 'lain', keadaan: null, kodeTakDikenal: true })
    expect(kodeDari('xyz', ALASAN_STOK)).toBe('lain')
    expect(kodeDari(null, ALASAN_STOK)).toBeNull()
    expect(kunciKode('hari-ini')).toBe('hari_ini')
    expect(kunciKode('tx.hapus')).toBe('tx_hapus')
  })
})

// ── R4/R5 Usaha & stok ───────────────────────────────────────────────────
const USAHA = `{"kasus": "${K}", "workspace_id": "${W}", "ringkas": {"total": 221, "aktif": 212, "arsip": 9, "berstok": 180, "menipis": 14, "minus": 3},
  "produk": [{"id": "${ID(31)}", "user_id": "${U}", "name": "Beras 5kg", "unit": "karung", "kategori": "Sembako", "ada_kategori": true,
    "sell_price": 72000, "cost_price": "65000.00", "track_stock": true, "stok_min": 5, "archived": false,
    "created_at": "2026-02-01T00:00:00+00:00", "masuk": 140, "keluar": 131, "penyesuaian": -2, "stok": 7, "menipis": false,
    "minus": false, "jumlah_terjual": 118, "terakhir_terjual": "2026-09-25", "ada_foto": true}],
  "terpotong": false}`
const STOK = `{"kasus": "${K}", "baris": [{"id": "${ID(41)}", "product_id": "${ID(31)}", "produk_nama": "Beras 5kg", "delta": -2,
  "reason": "susut", "sebab_rinci": "rusak", "kode_tak_dikenal": false, "occurred_at": "2026-09-20",
  "created_at": "2026-09-20T09:12:00+00:00", "user_id": "${U2}", "ada_catatan": true}],
  "kursor_berikut": {"o": "2026-09-20", "c": "2026-09-20T09:12:00+00:00", "i": "${ID(41)}"}, "total": 57, "halaman_pertama": true}`

describe('kontrak UsahaRuangDTO / StokRuangDTO ↔ admin_usaha_ruang / admin_stok_ruang', () => {
  it.skipIf(!ADA)('produk, ringkas, jawaban = kunci server; kategori produk dikirim (K-F3-13 = T2)', () => {
    const d = JSON.parse(USAHA) as UsahaRuangDTO
    const b = badan('admin_usaha_ruang')
    sama(d.produk[0], pohonDengan(b, 'track_stock', 'jumlah_terjual'))
    sama(d.ringkas, pohonDengan(b, 'berstok', 'menipis'))
    sama(d, { ...atas('admin_usaha_ruang'), ringkas: pohonContoh(d.ringkas), produk: pohonContoh(d.produk) })
    expect(pohonDengan(b, 'track_stock', 'jumlah_terjual')).toHaveProperty('kategori')
  })
  it.skipIf(!ADA)('stok: baris, kursor {o,c,i}, jawaban = kunci server; kosakata reason/sebab_rinci', () => {
    const d = JSON.parse(STOK) as StokRuangDTO
    const b = badan('admin_stok_ruang')
    sama(d.baris[0], pohonDengan(b, 'produk_nama', 'sebab_rinci'))
    sama(d.kursor_berikut, pohonDengan(b, 'o', 'c', 'i'))
    sama(d, { ...atas('admin_stok_ruang'), baris: pohonContoh(d.baris), kursor_berikut: pohonContoh(d.kursor_berikut) })
    expect(b).toContain(`in (${ALASAN_STOK.map(x => `'${x}'`).join(', ')})`)
    for (const x of SEBAB_RINCI_STOK) expect(b).toContain(`'${x}'`)
    expect(b).not.toMatch(/'note'/)
  })
  it('keUsahaRuang: numeric berteks; stok null bila tanpa lacak stok', () => {
    const d = JSON.parse(USAHA) as UsahaRuangDTO
    const u = keUsahaRuang(d)
    expect(u.produk[0]).toMatchObject({ nama: 'Beras 5kg', kategori: 'Sembako', hargaModal: 65000, stok: 7, terjual: 118, adaFoto: true })
    expect(keUsahaRuang({ ...d, produk: [{ ...d.produk[0]!, track_stock: false, stok: null }] }).produk[0]!.stok).toBeNull()
    expect(u.ringkas).toEqual({ total: 221, aktif: 212, arsip: 9, berstok: 180, menipis: 14, minus: 3 })
  })
  it('keGerakStok + kursor stok dari URL (sumbu transaksi {o,c,i})', () => {
    const d = JSON.parse(STOK) as StokRuangDTO
    expect(keGerakStok(d.baris[0]!)).toMatchObject({ delta: -2, alasan: 'susut', sebabRinci: 'rusak', adaCatatan: true })
    expect(kursorStokDariUrl(kursorKeUrl(d.kursor_berikut))).toEqual(d.kursor_berikut)
    expect(kursorStokDariUrl(kursorKeUrl({ c: '2026-09-20T09:12:00Z', i: ID(41) }))).toBeNull()
  })
})

// ── R6 Struk ─────────────────────────────────────────────────────────────
const STRUK = `{"kasus": "${K}",
  "ringkas": {"total": 1840, "masuk": 1790, "keluar": 50, "kasbon": 37, "ocr": {"pending": 0, "done": 12, "failed": 1, "tanpa": 1827}, "dengan_foto": 13},
  "baris": [{"id": "${ID(51)}", "user_id": "${U2}", "kind": "income", "ocr_status": null, "kode_tak_dikenal": false, "uang_diterima": 100000,
    "created_at": "2026-09-25T06:41:10+00:00", "tanggal": "2026-09-25", "ada_merchant": true, "ada_catatan": false, "ada_foto": false,
    "jumlah_foto": 0, "ada_kontak": true, "kontak_sidik": "5be0c1a9d2", "jumlah_baris": 3, "nominal_total": "86500.00", "kembalian": 13500,
    "dompet_ids": ["${ID(2)}"], "kasbon": false, "jumlah_produk": 3, "baris_di_sampah": 0}],
  "kursor_berikut": {"c": "2026-09-25T06:41:10+00:00", "i": "${ID(51)}"}, "total": 1840, "halaman_pertama": true}`

describe('kontrak StrukRuangDTO ↔ admin_struk_ruang', () => {
  it.skipIf(!ADA)('baris, ringkas, kursor {c,i}, jawaban = kunci server; tanpa merchant/note/receipt_path/contact_id', () => {
    const d = JSON.parse(STRUK) as StrukRuangDTO
    const b = badan('admin_struk_ruang')
    sama(d.baris[0], pohonDengan(b, 'kontak_sidik', 'nominal_total'))
    sama(d.ringkas, pohonDengan(b, 'dengan_foto', 'ocr'))
    sama(d.kursor_berikut, semuaPohonJsonb(b).find(p => urut(Object.keys(p)).join() === 'c,i')!)
    sama(d, { ...atas('admin_struk_ruang'), ringkas: pohonContoh(d.ringkas), baris: pohonContoh(d.baris), kursor_berikut: pohonContoh(d.kursor_berikut) })
    for (const k of ["'merchant'", "'note'", "'receipt_path'", "'contact_id'"]) expect(Object.keys(pohonDengan(b, 'kontak_sidik', 'nominal_total'))).not.toContain(k.slice(1, -1))
  })
  it.skipIf(!ADA)('parameter struk = urutan server; p_ocr = OCR_STRUK; p_kind income|expense', () => {
    expect(parameterFungsi('admin_struk_ruang').map(p => p.nama)).toEqual(['p_kasus', 'p_ws', 'p_pencatat', 'p_kind', 'p_kasbon', 'p_ocr', 'p_dari', 'p_sampai', 'p_kursor', 'p_limit'])
    const b = badan('admin_struk_ruang')
    for (const o of OCR_STRUK) expect(b).toContain(`'${o}'`)
    expect(kindDariArah('masuk')).toBe('income')
    expect(kindDariArah('keluar')).toBe('expense')
    expect(kindDariArah(null)).toBeNull()
  })
  it('keStruk: sidik apa adanya, tidak ada saldo kasbon per sidik; ringkas hanya halaman pertama', () => {
    const d = JSON.parse(STRUK) as StrukRuangDTO
    const s = keStruk(d.baris[0]!)
    expect(s).toMatchObject({ arah: 'masuk', ocr: null, nominal: 86500, kembalian: 13500, kontakSidik: '5be0c1a9d2', dompetIds: [ID(2)], kasbon: false })
    expect(Object.keys(s)).not.toContain('saldoKasbon')
    expect(keRingkasStruk(d.ringkas)).toMatchObject({ total: 1840, ocr: { tanpa: 1827, done: 12 }, denganFoto: 13 })
    expect(keRingkasStruk(null)).toBeNull()
    expect(keStruk({ ...d.baris[0]!, ocr_status: 'lain', kode_tak_dikenal: true })).toMatchObject({ ocr: 'lain', kodeTakDikenal: true })
  })
  it('kursor struk {c,i}: kursor sumbu lain (sampah {d,i}, transaksi {o,c,i}) → null', () => {
    const k = { c: '2026-09-25T06:41:10+00:00', i: ID(51) }
    expect(kursorStrukDariUrl(kursorKeUrl(k))).toEqual(k)
    expect(kursorStrukDariUrl(kursorKeUrl({ d: k.c, i: k.i }))).toBeNull()
    expect(kursorStrukDariUrl(kursorKeUrl({ c: k.c, i: 'bukan-uuid' }))).toBeNull()
    expect(kursorStrukDariUrl('!!')).toBeNull()
  })
})

// ── R7/R8 Patungan ───────────────────────────────────────────────────────
const PATUNGAN = `{"kasus": "${K}", "workspace_id": "${W}", "fitur_patungan": true,
  "saldo": [{"user_id": "${U}", "saldo": 135000, "ditalangi": 270000, "ditanggung": 135000, "bayar_lunas": 0, "terima_lunas": 0}],
  "bekas": [{"user_id": "${U2}", "saldo": "-135000.00", "ditalangi": 0, "ditanggung": 135000, "bayar_lunas": 0, "terima_lunas": 0}],
  "ringkas": {"transaksi_dibagi": 6, "total_dibagi": 810000, "pelunasan": 0, "total_pelunasan": 0, "pelunasan_tanpa_transfer": 0,
    "selisih_bagi": 0, "jumlah_saldo": 0, "dibagi_tak_dihitung": 1}}`
const BAGI: BagiBarisDTO = {
  id: ID(61), occurred_at: '2026-09-10', created_at: '2026-09-10T12:00:00+00:00', amount: 270000, kind: 'expense', pencatat: U,
  kategori_id: ID(1), kategori: 'Makan', ada_catatan: false, bagian: [{ user_id: U, nominal: 135000 }, { user_id: U2, nominal: 135000 }],
  jumlah_bagian: 2, selisih: 0, dihitung_saldo: true,
}
const LUNAS: LunasBarisDTO = {
  id: ID(62), dari: U2, ke: U, nominal: 135000, transfer_group: ID(63), dicatat_oleh: U2, pada: '2026-09-11T12:00:00+00:00',
  ada_catatan: true, ada_bukti: false, transfer_hidup: true,
}
const RIWAYAT_BAGI = JSON.stringify({ kasus: K, jenis: 'bagi', baris: [BAGI], kursor_berikut: { o: '2026-09-10', c: BAGI.created_at, i: BAGI.id }, total: 6, halaman_pertama: true })
const RIWAYAT_LUNAS = JSON.stringify({ kasus: K, jenis: 'lunas', baris: [LUNAS], kursor_berikut: { p: LUNAS.pada, i: LUNAS.id }, total: 1, halaman_pertama: true })

describe('kontrak PatunganRuangDTO / PatunganRiwayatDTO ↔ admin_patungan_ruang / admin_patungan_riwayat', () => {
  it.skipIf(!ADA)('saldo & bekas = admin_patungan_saldo_inti tanpa `anggota`; ringkas & jawaban = server; tanpa catatan', () => {
    const d = JSON.parse(PATUNGAN) as PatunganRuangDTO
    const inti = tanpa(pohonDengan(badan('admin_patungan_saldo_inti'), 'ditalangi', 'terima_lunas'), 'anggota')
    sama(d.saldo[0], inti)
    sama(d.bekas[0], inti)
    expect(badan('admin_patungan_ruang')).toMatch(/e - 'anggota'/)
    sama(d.ringkas, pohonDengan(badan('admin_patungan_ruang'), 'jumlah_saldo', 'dibagi_tak_dihitung'))
    sama(d, { ...atas('admin_patungan_ruang'), saldo: pohonContoh(d.saldo), bekas: pohonContoh(d.bekas), ringkas: pohonContoh(d.ringkas) })
  })
  it.skipIf(!ADA)('riwayat bagi {o,c,i} & lunas {p,i}: baris & kursor = kunci server; 22023 saringan/kursor', () => {
    const b = badan('admin_patungan_riwayat')
    const bagi = JSON.parse(RIWAYAT_BAGI) as Extract<PatunganRiwayatDTO, { jenis: 'bagi' }>
    const lunas = JSON.parse(RIWAYAT_LUNAS) as Extract<PatunganRiwayatDTO, { jenis: 'lunas' }>
    sama(bagi.baris[0], { ...pohonDengan(b, 'jumlah_bagian', 'dihitung_saldo'), bagian: pohonDengan(b, 'user_id', 'nominal') })
    sama(lunas.baris[0], pohonDengan(b, 'transfer_hidup', 'ada_bukti'))
    sama(bagi.kursor_berikut, pohonDengan(b, 'o', 'c', 'i'))
    sama(lunas.kursor_berikut, pohonDengan(b, 'p', 'i'))
    sama(bagi, { ...atas('admin_patungan_riwayat'), baris: pohonContoh(bagi.baris), kursor_berikut: pohonContoh(bagi.kursor_berikut) })
    expect(b).toMatch(/hint = 'saringan'/)
    expect(b).toMatch(/hint = 'kursor'/)
  })
  it('kePatungan: bekas terpisah, seimbang bila jumlah_saldo 0; bagi & lunas', () => {
    const p = kePatungan(JSON.parse(PATUNGAN) as PatunganRuangDTO)
    expect(p.saldo).toEqual([{ orang: U, saldo: 135000, ditalangi: 270000, ditanggung: 135000, bayarLunas: 0, terimaLunas: 0 }])
    expect(p.bekas[0]).toMatchObject({ orang: U2, saldo: -135000 })
    expect(p).toMatchObject({ fitur: true, seimbang: true, ringkas: { dibagiTakDihitung: 1, totalDibagi: 810000 } })
    const miring = JSON.parse(PATUNGAN) as PatunganRuangDTO
    miring.ringkas.jumlah_saldo = '10.00'
    expect(kePatungan(miring).seimbang).toBe(false)
    expect(keBagiBaris(BAGI)).toMatchObject({ pembayar: U, jumlahBagian: 2, dihitungSaldo: true, bagian: [{ orang: U, nominal: 135000 }, { orang: U2, nominal: 135000 }] })
    expect(keLunasBaris(LUNAS)).toMatchObject({ dari: U2, ke: U, transferHidup: true, adaCatatan: true })
  })
  it('kursor riwayat menurut jenis: kursor jenis lain → null', () => {
    const kb = { o: '2026-09-10', c: '2026-09-10T12:00:00+00:00', i: ID(61) }
    const kl = { p: '2026-09-11T12:00:00+00:00', i: ID(62) }
    expect(kursorPatunganDariUrl('bagi', kursorKeUrl(kb))).toEqual(kb)
    expect(kursorPatunganDariUrl('lunas', kursorKeUrl(kl))).toEqual(kl)
    expect(kursorPatunganDariUrl('lunas', kursorKeUrl(kb))).toBeNull()
    expect(kursorPatunganDariUrl('bagi', kursorKeUrl(kl))).toBeNull()
  })
})

// ── R9 Perangkat ─────────────────────────────────────────────────────────
const PERANGKAT_RINCI = JSON.stringify({
  kasus: K, user_id: U, hari: 30,
  perangkat: [{ sidik: '3fa91c07be', platform: 'android', varian: 'prod', versi_aplikasi: '1.2.0', kode_build: '26092501', versi_tak_sah: false, updated_at: '2026-09-25T23:10:04+00:00' }],
  sesi: [{ sidik: '91d0e2aa41', created_at: '2026-09-01T02:00:00+00:00', updated_at: '2026-09-25T23:10:00+00:00', refreshed_at: '2026-09-25T23:10:00+00:00', aal: 'aal1', not_after: null, aktif: true }],
  sesi_disembunyikan: false,
  terpotong: { perangkat: false, sesi: false },
  jeda: {
    ringkas: { n: 312, p50: 1, p95: 48, maks: 21540, lebih_1_menit: 9, lebih_1_jam: 2, lebih_1_hari: 0, jam_maju: 3, tanpa_jam_perangkat: 0 },
    per_hari: [{ tanggal: '2026-09-24', n: 14, p95: 6, maks: 21540 }],
    terbesar: [{ peristiwa_id: 88213, workspace_id: W, sasaran_id: ID(71), pada: '2026-09-24T14:03:00+00:00', pada_perangkat: '2026-09-24T08:04:00+00:00', jeda_tiba_detik: 21540 }],
    rinci: { terbesar: true },
  },
})
const PERANGKAT_TANPA = JSON.stringify({
  ...JSON.parse(PERANGKAT_RINCI), sesi: [], sesi_disembunyikan: true,
  jeda: { ...JSON.parse(PERANGKAT_RINCI).jeda, terbesar: [{ pada: '2026-09-24T14:03:00+00:00', pada_perangkat: '2026-09-24T08:04:00+00:00', jeda_tiba_detik: 21540 }], rinci: { terbesar: false } },
})

describe('kontrak PerangkatPenggunaDTO ↔ admin_perangkat_pengguna', () => {
  it.skipIf(!ADA)('perangkat, sesi, jeda (rinci & ringkas), jawaban = kunci server; tanpa token/ip/user_agent', () => {
    const b = badan('admin_perangkat_pengguna')
    const r = JSON.parse(PERANGKAT_RINCI) as PerangkatPenggunaDTO
    const t = JSON.parse(PERANGKAT_TANPA) as PerangkatPenggunaDTO
    const a = atas('admin_perangkat_pengguna')
    expect(urut(Object.keys(r))).toEqual(urut(Object.keys(a)))
    expect(urut(Object.keys(r.jeda))).toEqual(urut(Object.keys(a.jeda!)))
    sama(r.terpotong, a.terpotong!)
    sama(r.perangkat[0], pohonDengan(b, 'versi_tak_sah', 'kode_build'))
    sama(r.sesi[0], pohonDengan(b, 'refreshed_at', 'not_after'))
    sama(r.jeda.ringkas, pohonDengan(b, 'lebih_1_menit', 'tanpa_jam_perangkat'))
    sama(r.jeda.per_hari[0], pohonDengan(b, 'tanggal', 'p95'))
    sama(r.jeda.terbesar[0], pohonDengan(b, 'peristiwa_id', 'jeda_tiba_detik'))
    const ringkas = semuaPohonJsonb(b).find(p => 'jeda_tiba_detik' in p && !('peristiwa_id' in p))
    sama(t.jeda.terbesar[0], ringkas!)
    for (const k of ["'token'", "'user_agent'", "'ip'", "'factor_id'", "'aktor_nama'"]) expect(b).not.toContain(`${k},`)
  })
  it.skipIf(!ADA)('p_hari 1..90 (22023 hari); kosakata platform/varian/aal = server', () => {
    const b = badan('admin_perangkat_pengguna')
    expect(b).toMatch(/hint = 'hari'/)
    expect(b).toContain(`array[${AAL_SESI.map(x => `'${x}'`).join(', ')}]`)
    for (const p of [...PLATFORM_PERANGKAT, ...VARIAN_APLIKASI]) expect(b).toContain(`'${p}'`)
    expect([0, 1, 90, 91, 1.5].map(hariSah)).toEqual([false, true, true, false, false])
  })
  it('kePerangkatPengguna: rinci vs tanpa ranah jejak; staf = sesi disembunyikan', () => {
    const r = kePerangkatPengguna(JSON.parse(PERANGKAT_RINCI) as PerangkatPenggunaDTO)
    expect(r.perangkat[0]).toMatchObject({ platform: 'android', varian: 'prod', versi: '1.2.0', versiTakSah: false })
    expect(r.sesi[0]).toMatchObject({ aal: 'aal1', aktif: true })
    expect(r.jeda.rinci).toBe(true)
    expect(r.jeda.terbesar[0]).toMatchObject({ peristiwaId: 88213, ruangId: W, sasaranId: ID(71), detik: 21540 })
    expect(r.jeda.ringkas).toMatchObject({ p95: 48, lebih1Menit: 9, jamMaju: 3 })
    const t = kePerangkatPengguna(JSON.parse(PERANGKAT_TANPA) as PerangkatPenggunaDTO)
    expect(t).toMatchObject({ sesiDisembunyikan: true, sesi: [] })
    expect(t.jeda.rinci).toBe(false)
    expect(t.jeda.terbesar[0]).toEqual({ peristiwaId: null, ruangId: null, sasaranId: null, padaIso: '2026-09-24T14:03:00+00:00', padaPerangkatIso: '2026-09-24T08:04:00+00:00', detik: 21540 })
    const aneh = JSON.parse(PERANGKAT_RINCI) as PerangkatPenggunaDTO
    aneh.perangkat[0] = { ...aneh.perangkat[0]!, platform: 'lain', varian: null, versi_aplikasi: null, versi_tak_sah: true }
    expect(kePerangkatPengguna(aneh).perangkat[0]).toMatchObject({ platform: 'lain', varian: null, versi: null, versiTakSah: true })
  })
})

// ── R10 Kabar ────────────────────────────────────────────────────────────
const KABAR = `{"kasus": "${K}", "user_id": "${U}",
  "ringkas": {"total": 64, "belum_dibaca": 5, "per_jenis": {"tx.hapus": 3, "tx.besar": 0, "anggota.masuk": 1, "peran.ubah": 0, "rangkuman": 60, "lain": 0}},
  "setelan": [{"workspace_id": "${W}", "tersimpan": true, "hapus": true, "masuk": true, "peran": true, "ambang": 500000, "rangkuman_jam": 20, "zona": "WIB"}],
  "baris": [
    {"id": 9921, "workspace_id": "${W}", "jenis": "tx.hapus", "kode_tak_dikenal": false, "aktor": "${U2}", "akun_ada": true, "ada_nama_aktor": true,
     "sasaran_id": "${ID(81)}", "nominal": 45000, "tanggal": null, "pada": "2026-09-24T10:00:00+00:00", "dibaca_pada": null, "kategori": "Belanja dapur"},
    {"id": 9910, "workspace_id": "${W}", "jenis": "peran.ubah", "kode_tak_dikenal": false, "aktor": "${U2}", "akun_ada": false, "ada_nama_aktor": false,
     "sasaran_id": null, "nominal": null, "tanggal": null, "pada": "2026-09-23T14:00:00+00:00", "dibaca_pada": null, "peran_baru": "admin"},
    {"id": 9900, "workspace_id": "${W}", "jenis": "rangkuman", "kode_tak_dikenal": false, "aktor": null, "akun_ada": null, "ada_nama_aktor": false,
     "sasaran_id": null, "nominal": null, "tanggal": "2026-09-23", "pada": "2026-09-23T13:00:00+00:00", "dibaca_pada": "2026-09-24T01:00:00+00:00",
     "isi": {"cacah": 24, "masuk": 1850000, "keluar": 420000, "pencatat": 2}}],
  "kursor_berikut": {"p": "2026-09-23T13:00:00+00:00", "i": 9900}, "total": 64, "halaman_pertama": true}`

describe('kontrak KabarPenggunaDTO ↔ admin_kabar_pengguna', () => {
  it.skipIf(!ADA)('baris (+ kategori | peran_baru | isi per jenis), ringkas, setelan, kursor {p,i} = kunci server; tanpa aktor_nama/judul', () => {
    const b = badan('admin_kabar_pengguna')
    const d = JSON.parse(KABAR) as KabarPenggunaDTO
    const dasar = pohonDengan(b, 'ada_nama_aktor', 'dibaca_pada')
    const tambahan: Record<string, string> = { 'tx.hapus': 'kategori', 'peran.ubah': 'peran_baru', rangkuman: 'isi' }
    for (const x of d.baris) {
      const ekstra = tambahan[x.jenis]!
      expect(urut(Object.keys(x))).toEqual(urut([...Object.keys(dasar), ekstra]))
      expect(semuaPohonJsonb(b).some(p => urut(Object.keys(p)).join() === ekstra)).toBe(true)
    }
    sama(d.ringkas, pohonDengan(b, 'belum_dibaca', 'per_jenis'))
    sama(d.setelan![0], pohonDengan(b, 'tersimpan', 'rangkuman_jam'))
    sama(d.kursor_berikut, semuaPohonJsonb(b).find(p => urut(Object.keys(p)).join() === 'i,p')!)
    sama(d, { ...atas('admin_kabar_pengguna'), ringkas: pohonContoh(d.ringkas), setelan: pohonContoh(d.setelan), baris: pohonContoh(d.baris), kursor_berikut: pohonContoh(d.kursor_berikut) })
    expect(Object.keys(dasar)).not.toContain('aktor_nama')
    expect(Object.keys(dasar)).not.toContain('judul')
  })
  it.skipIf(!ADA)('kosakata jenis & peran = daftar putih server; p_jenis asing = 22023 saringan', () => {
    const b = badan('admin_kabar_pengguna')
    expect(b).toContain(`array[${PERAN_KABAR.map(x => `'${x}'`).join(', ')}]`)
    for (const j of JENIS_KABAR) expect(b).toContain(`'${j}'`)
    expect(b).toMatch(/hint = 'saringan'/)
  })
  it('keKabar: kategori hanya tx.*, peran_baru hanya peran.ubah, isi hanya rangkuman; jenis asing = lain', () => {
    const d = JSON.parse(KABAR) as KabarPenggunaDTO
    const [hapus, peran, rangkuman] = d.baris.map(keKabar)
    expect(hapus).toMatchObject({ id: 9921, jenis: 'tx.hapus', kategori: 'Belanja dapur', nominal: 45000, dibaca: false, peranBaru: null, isi: null })
    expect(peran).toMatchObject({ jenis: 'peran.ubah', peranBaru: 'admin', kategori: null, akunAda: false })
    expect(rangkuman).toMatchObject({ jenis: 'rangkuman', isi: { cacah: 24, masuk: 1850000, keluar: 420000, pencatat: 2 }, dibaca: true })
    const asing = keKabar({ ...(d.baris[0] as KabarDTO), jenis: 'lain', kode_tak_dikenal: true, kategori: 'bocor?' })
    expect(asing).toMatchObject({ jenis: 'lain', kodeTakDikenal: true, kategori: null })
    expect(keRingkasKabar(d.ringkas)).toMatchObject({ total: 64, belumDibaca: 5, perJenis: { 'tx.hapus': 3, rangkuman: 60, lain: 0 } })
    expect(keSetelanKabar(d.setelan![0]!)).toMatchObject({ ambang: 500000, rangkumanJam: 20, zona: 'WIB' })
  })
  it('kursor kabar {p, i bigint}: i teks/uuid → null', () => {
    const k = { p: '2026-09-23T13:00:00+00:00', i: 9900 }
    expect(kursorKabarDariUrl(kursorKeUrl(k))).toEqual(k)
    expect(kursorKabarDariUrl(kursorKeUrl({ p: k.p, i: ID(1) }))).toBeNull()
    expect(kursorKabarDariUrl(kursorKeUrl({ p: k.p, i: '9900' }))).toBeNull()
  })
})

// ── Galat 0095 ───────────────────────────────────────────────────────────
describe('hint galat 0095', () => {
  it.skipIf(!ADA)('setiap hint 22023 di migrasi 0095 dikenal HINT_22023; id tak ada = 42501 kasus-lingkup (tanpa P0002)', () => {
    const sql = readFileSync(join(DIR_MIGRASI, '0095_admin_ranah_buku.sql'), 'utf8').replace(/--[^\n]*/g, '')
    const hint = new Set([...sql.matchAll(/errcode = '22023', hint = '([a-z0-9-]+)'/g)].map(m => m[1]!))
    expect([...hint].sort()).toEqual(['bulan', 'hari', 'kursor', 'saringan'])
    for (const h of hint) expect(HINT_22023 as readonly string[]).toContain(h)
    for (const f of ['admin_jadwal_rinci', 'admin_transaksi_cari', 'admin_mutasi_dompet']) expect(badan(f), f).not.toMatch(/P0002/)
  })
  it('petakanGalat: 22023 bulan/hari/saringan/kursor → argumen berhint; 42501 kasus-lingkup → lingkup', () => {
    for (const h of ['bulan', 'hari', 'saringan', 'kursor']) expect(petakanGalat({ code: '22023', hint: h, message: 'x' })).toMatchObject({ jenis: 'argumen', hint: h })
    expect(petakanGalat({ code: '42501', hint: 'kasus-lingkup', message: 'Jadwal ini di luar lingkup kasus.' })).toMatchObject({ jenis: 'lingkup' })
  })
})
