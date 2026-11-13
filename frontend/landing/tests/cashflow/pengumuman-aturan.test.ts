/**
 * Sasaran pengumuman berbasis aturan di console (spek 13 Nov 2026, bagian K):
 *
 * - adapter: bentuk lengkap, server lama (kunci tidak ada, null), dan nilai
 *   asing (kunci baru, tipe salah) untuk saring, aturan, pratinjau, segmen,
 *   dan akun internal;
 * - ringkasan aturan ke kalimat awam, ID dan EN;
 * - validasi isian saringan, nama segmen, catatan akun internal;
 * - kamus ID dan EN untuk setiap nilai dinamis, tanpa em-dash dan titik koma;
 * - kontrak terhadap migrasi bagian S (dilewati dengan rapi, terlihat
 *   "skipped", selama fungsinya belum ada di CASHFLOW_MIGRASI);
 * - penjaga halaman: server lama kembali ke v3 tanpa galat.
 *
 * Semua email, uuid, dan angka di sini karangan (contoh.invalid).
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  AKTIF_HARI_MAKS, BATAS_KECUALI_KELOMPOK, BATAS_KECUALI_PENGGUNA, CATATAN_INTERNAL_MAKS, ISIAN_SARING_KOSONG, JENIS_AKUN_INTERNAL,
  KODE_GALAT_SARING, KUNCI_SARING, NAMA_SEGMEN_MAKS, NOMOR_WA_SARING, PILIHAN_VERSI, RUANG_SARING, SARING_KOSONG, VERSI_SASARAN,
  VERSI_TAK_DIKETAHUI,
  aturanKeDto, catatanInternalSah, gabungDaftar, isianDariSaring, kalimatAturan, kalimatSaring, keAturan, keDaftarAkunInternal,
  keDaftarSegmen, kePratinjauPenerima, keSaring, labelVersi, periksaAturan, periksaIsianSaring, periksaNamaSegmen, saringKeDto,
  segmenDipakaiDariGalat, segmenGandaDariGalat,
  type AturanDTO, type KamusRingkas, type Saring,
} from '../../adapters/cashflowPengumumanAturan'
import { kePengumuman, type PengumumanDTO } from '../../adapters/cashflow'
import { PILIHAN_PENERIMA, penerimaSah } from '../../adapters/cashflowPengumuman'
import { RILIS_PLAY, RILIS_PLAY_TERAKHIR } from '../../adapters/cashflowVersi'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'
import { HINT_22023, petakanGalat } from '../../composables/cashflow/useCashflowAdmin'
import { adaMigrasi, fungsiTerakhir, kolomTabel, parameterFungsi } from './migrasi'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (rel: string) => readFileSync(join(AKAR, rel), 'utf8')
const ID = KAMUS_CASHFLOW.id.pengumuman.ringkas as unknown as KamusRingkas
const EN = KAMUS_CASHFLOW.en.pengumuman.ringkas as unknown as KamusRingkas

const U1 = '11111111-1111-4111-8111-111111111111'
const U2 = '22222222-2222-4222-8222-222222222222'
const G1 = '33333333-3333-4333-8333-333333333333'
const S1 = '44444444-4444-4444-8444-444444444444'

// ── Contoh jawaban server ────────────────────────────────────────────────
const SARING_LENGKAP = {
  versi_min: 26110702, versi_di_bawah: 26111301, versi_tak_diketahui: 'tidak', daftar_sejak: '2026-11-01', daftar_sampai: '2026-11-13',
  aktif_dalam_hari: 30, ruang: 'usaha', domi_pakai: true, domi_beli: false, kredit_habis: true, nomor_wa: 'belum',
}
const ATURAN_SARING: AturanDTO = { v: 1, segmen_id: null, saring: { versi_di_bawah: 26111301 }, kecuali_internal: true, kecuali_pengguna: [], kecuali_kelompok: [] }
const PRATINJAU = {
  jumlah: 120, tak_terjangkau_versi_lama: 7, versi_tak_diketahui: 3, dikecualikan_internal: 4, dikecualikan_lain: 2,
  contoh: [{ email_tersamar: 'pe***@co***.invalid', versi: 26111301 }, { email_tersamar: 'ui***@co***.invalid', versi: null }],
}

describe('adapter saring', () => {
  it('bentuk lengkap terbaca utuh dan kembali sama persis', () => {
    const { saring, asing } = keSaring(SARING_LENGKAP)
    expect(asing).toEqual([])
    expect(saring).toEqual({
      versiMin: 26110702, versiDiBawah: 26111301, versiTakDiketahui: 'tidak', daftarSejak: '2026-11-01', daftarSampai: '2026-11-13',
      aktifHari: 30, ruang: 'usaha', domiPakai: true, domiBeli: false, kreditHabis: true, nomorWa: 'belum',
    })
    expect(saringKeDto(saring)).toEqual(SARING_LENGKAP)
  })
  it('objek kosong = semua pengguna, null dan undefined bukan galat', () => {
    expect(keSaring({})).toEqual({ saring: SARING_KOSONG, asing: [] })
    expect(keSaring(null)).toEqual({ saring: SARING_KOSONG, asing: [] })
    expect(keSaring(undefined).asing).toEqual([])
    expect(saringKeDto(SARING_KOSONG)).toEqual({})
  })
  it('nilai asing dibuang dan dicatat, bukan dipakai diam-diam', () => {
    const { saring, asing } = keSaring({
      versi_min: '26110702', versi_di_bawah: 0, aktif_dalam_hari: 400, ruang: 'kantor', domi_pakai: 'ya', nomor_wa: true,
      daftar_sejak: '2026-02-30', kunci_baru: 1,
    })
    expect(saring).toEqual(SARING_KOSONG)
    expect(asing.sort()).toEqual(['aktif_dalam_hari', 'daftar_sejak', 'domi_pakai', 'kunci_baru', 'nomor_wa', 'ruang', 'versi_di_bawah', 'versi_min'])
    expect(keSaring([1, 2]).asing).toEqual(['saring'])
  })
  it('versi_tak_diketahui hanya dikirim bila ada saringan versi', () => {
    expect(saringKeDto({ ...SARING_KOSONG, versiTakDiketahui: 'tidak' })).toEqual({})
    expect(saringKeDto({ ...SARING_KOSONG, versiDiBawah: 26111301 })).toEqual({ versi_di_bawah: 26111301, versi_tak_diketahui: 'ikut' })
  })
})

describe('adapter aturan', () => {
  it('aturan bersaring dan bersegmen terbaca, kirim ulang sama', () => {
    const a = keAturan(ATURAN_SARING)!
    expect(a).toMatchObject({ segmenId: null, kecualiInternal: true, kecualiPengguna: [], kecualiKelompok: [], asing: [] })
    expect(aturanKeDto(a)).toEqual({ ...ATURAN_SARING, saring: { versi_di_bawah: 26111301, versi_tak_diketahui: 'ikut' } })
    const b = keAturan({ v: 1, segmen_id: S1, saring: null, kecuali_internal: false, kecuali_pengguna: [U1], kecuali_kelompok: [G1] })!
    expect(b).toMatchObject({ segmenId: S1, saring: null, kecualiInternal: false, kecualiPengguna: [U1], kecualiKelompok: [G1] })
    expect(aturanKeDto(b)).toEqual({ v: 1, segmen_id: S1, saring: null, kecuali_internal: false, kecuali_pengguna: [U1], kecuali_kelompok: [G1] })
  })
  it('server lama atau jenis lain: tidak ada aturan', () => {
    expect(keAturan(null)).toBeNull()
    expect(keAturan(undefined)).toBeNull()
    expect(keAturan('aturan')).toBeNull()
    expect(keAturan({ v: 1, segmen_id: null, saring: null, kecuali_internal: true, kecuali_pengguna: [], kecuali_kelompok: [] })).toBeNull()
  })
  it('nilai asing dicatat, akun internal tetap dikecualikan bila nilainya tak terbaca', () => {
    const a = keAturan({ v: 2, saring: { versi_min: 26110702, nanti: true }, kecuali_pengguna: [U1, 'bukan-uuid', U1], kecuali_kelompok: 'x', tambahan: 1 })!
    expect(a.kecualiInternal).toBe(true)
    expect(a.kecualiPengguna).toEqual([U1])
    expect(a.kecualiKelompok).toEqual([])
    expect(a.asing.sort()).toEqual(['kecuali_internal', 'kecuali_kelompok', 'kecuali_pengguna', 'saring.nanti', 'tambahan', 'v'])
    expect(keAturan({ v: 1, segmen_id: 'bukan-uuid', saring: {}, kecuali_internal: true, kecuali_pengguna: [], kecuali_kelompok: [] })!.asing).toContain('segmen_id')
  })
  it('tepat satu dasar, batas pengecualian dijaga sebelum dikirim', () => {
    expect(periksaAturan(ATURAN_SARING)).toEqual([])
    expect(periksaAturan({ ...ATURAN_SARING, segmen_id: S1 })).toEqual(['dasar'])
    expect(periksaAturan({ ...ATURAN_SARING, saring: null })).toEqual(['dasar'])
    const banyak = (n: number, awal: string) => Array.from({ length: n }, (_, i) => `${awal}${String(i).padStart(12, '0')}`)
    expect(periksaAturan({ ...ATURAN_SARING, kecuali_pengguna: banyak(BATAS_KECUALI_PENGGUNA + 1, '00000000-0000-4000-8000-') })).toEqual(['kecualiPengguna'])
    expect(periksaAturan({ ...ATURAN_SARING, kecuali_kelompok: banyak(BATAS_KECUALI_KELOMPOK + 1, '00000000-0000-4000-8000-') })).toEqual(['kecualiKelompok'])
    expect(periksaAturan({ ...ATURAN_SARING, kecuali_pengguna: banyak(BATAS_KECUALI_PENGGUNA, '00000000-0000-4000-8000-') })).toEqual([])
  })
  it('aturanKeDto membuang duplikat dan memaksa saring null untuk segmen', () => {
    const d = aturanKeDto({ segmenId: S1, saring: { ...SARING_KOSONG, aktifHari: 7 }, kecualiInternal: true, kecualiPengguna: [U1, U1, U2], kecualiKelompok: [G1, G1] })
    expect(d).toEqual({ v: 1, segmen_id: S1, saring: null, kecuali_internal: true, kecuali_pengguna: [U1, U2], kecuali_kelompok: [G1] })
  })
  it('penerima aturan sah hanya dengan p_aturan terbaca', () => {
    expect(penerimaSah('aturan', [], [], null)).toBe(false)
    expect(penerimaSah('aturan', [], [], ATURAN_SARING)).toBe(true)
    expect(penerimaSah('all', [], [])).toBe(true)
    expect(PILIHAN_PENERIMA.map(p => p.id)).toEqual(['all', 'single', 'users', 'groups', 'aturan'])
  })
})

describe('adapter pratinjau penerima', () => {
  it('bentuk lengkap, versi bernama dari RILIS_PLAY', () => {
    expect(kePratinjauPenerima(PRATINJAU)).toEqual({
      jumlah: 120, takTerjangkau: 7, versiTakDiketahui: 3, dikecualikanInternal: 4, dikecualikanLain: 2,
      contoh: [{ email: 'pe***@co***.invalid', versi: RILIS_PLAY_TERAKHIR.versi }, { email: 'ui***@co***.invalid', versi: null }],
    })
  })
  it('bigint sebagai teks, kunci hilang = null (bukan 0), contoh paling banyak 10', () => {
    const p = kePratinjauPenerima({ jumlah: '42', contoh: Array.from({ length: 14 }, (_, i) => ({ email_tersamar: `a${i}***@co***.invalid`, versi: '26110702' })) })
    expect(p.jumlah).toBe(42)
    expect(p.takTerjangkau).toBeNull()
    expect(p.dikecualikanLain).toBeNull()
    expect(p.contoh).toHaveLength(10)
    expect(p.contoh[0]!.versi).toBe('1.3.8')
  })
  it('nilai asing: contoh tanpa email dibuang, kode versi tak dikenal tetap angka', () => {
    const p = kePratinjauPenerima({ jumlah: 'x', contoh: [{ versi: 1 }, null, { email_tersamar: '  ', versi: 1 }, { email_tersamar: 'b***@co***.invalid', versi: 99 }] })
    expect(p.jumlah).toBeNull()
    expect(p.contoh).toEqual([{ email: 'b***@co***.invalid', versi: '99' }])
    expect(kePratinjauPenerima(null)).toEqual({ jumlah: null, takTerjangkau: null, versiTakDiketahui: null, dikecualikanInternal: null, dikecualikanLain: null, contoh: [] })
  })
})

describe('adapter segmen dan akun internal', () => {
  it('daftar segmen lengkap, baris rusak dibuang', () => {
    const d = keDaftarSegmen([
      { id: S1, nama: 'Belum 1.4.1', saring: { versi_di_bawah: 26111301 }, jumlah: '12', dipakai: 2, diubah: '2026-11-13T05:00:00Z' },
      { id: 'rusak', nama: 'x', saring: {}, jumlah: 0, dipakai: 0, diubah: '' }, null,
    ])
    expect(d).toHaveLength(1)
    expect(d[0]).toMatchObject({ id: S1, nama: 'Belum 1.4.1', jumlah: 12, dipakai: 2, asing: [] })
    expect(d[0]!.saring.versiDiBawah).toBe(26111301)
    expect(keDaftarSegmen(null)).toEqual([])
    expect(keDaftarSegmen([{ id: S1, nama: 'x', saring: { baru: 1 }, jumlah: null, dipakai: null, diubah: '2026-11-13T05:00:00Z' }])[0]).toMatchObject({ jumlah: null, dipakai: 0, asing: ['baru'] })
  })
  it('akun internal: email utuh atau tersamar apa adanya, jenis asing ditandai', () => {
    const d = keDaftarAkunInternal([
      { user_id: U1, email: 'uji@contoh.invalid', jenis: 'uji', catatan: 'Akun uji anggota', diubah: '2026-11-13T05:00:00Z' },
      { user_id: U2, email: 'pe***@co***.invalid', jenis: 'auditor', catatan: null, diubah: '2026-11-13T05:00:00Z' },
      { user_id: 'x', email: null, jenis: 'uji', catatan: null, diubah: '' },
    ])
    expect(d).toEqual([
      { userId: U1, email: 'uji@contoh.invalid', jenis: 'uji', jenisAsli: 'uji', catatan: 'Akun uji anggota', diubah: '2026-11-13T05:00:00Z' },
      { userId: U2, email: 'pe***@co***.invalid', jenis: null, jenisAsli: 'auditor', catatan: '', diubah: '2026-11-13T05:00:00Z' },
    ])
    expect(keDaftarAkunInternal({})).toEqual([])
  })
  it('kePengumuman membaca audience_rules dan segmen_nama hanya untuk aturan', () => {
    const dasar: PengumumanDTO = {
      id: S1, title: 'Rilis 1.4.1', body: 'Perbarui aplikasi.', level: 'info', starts_at: '2026-11-13T05:00:00Z', ends_at: null,
      created_by: null, created_at: '2026-11-13T05:00:00Z', updated_at: '2026-11-13T05:00:00Z',
    }
    const p = kePengumuman({ ...dasar, audience_type: 'aturan', audience_rules: ATURAN_SARING, segmen_nama: null, recipient_count: 120 })
    expect(p).toMatchObject({ penerima: 'aturan', jumlahPenerima: 120, namaSegmen: null })
    expect(p.aturan?.saring?.versiDiBawah).toBe(26111301)
    expect(kePengumuman({ ...dasar, audience_type: 'all', audience_rules: ATURAN_SARING })).toMatchObject({ aturan: null })
    expect(kePengumuman({ ...dasar, audience_type: 'aturan', audience_rules: { v: 1, segmen_id: S1, saring: null, kecuali_internal: true, kecuali_pengguna: [], kecuali_kelompok: [] }, segmen_nama: 'Belum 1.4.1' })).toMatchObject({ namaSegmen: 'Belum 1.4.1' })
    // Server v3 tanpa kunci baru.
    expect(kePengumuman({ ...dasar, audience_type: 'all' })).toMatchObject({ aturan: null, namaSegmen: null })
  })
})

describe('ringkasan aturan dalam kalimat awam', () => {
  const aturan = (dto: unknown) => keAturan(dto)
  it('contoh spek: semua pengguna, versi di bawah 1.4.1, kecuali akun internal', () => {
    expect(kalimatAturan(aturan(ATURAN_SARING), ID, { bahasa: 'id' })).toBe('Semua pengguna, versi di bawah 1.4.1, kecuali akun internal')
    expect(kalimatAturan(aturan(ATURAN_SARING), EN, { bahasa: 'en' })).toBe('All users, version below 1.4.1, except internal accounts')
  })
  it('semua saringan, tanggal WIB, pengecualian digabung wajar', () => {
    const dto = { v: 1, segmen_id: null, saring: SARING_LENGKAP, kecuali_internal: true, kecuali_pengguna: [U1, U2, '55555555-5555-4555-8555-555555555555'], kecuali_kelompok: [G1] }
    expect(kalimatAturan(aturan(dto), ID, { bahasa: 'id' })).toBe(
      'Semua pengguna, versi 1.3.8 sampai di bawah 1.4.1, tanpa yang versinya tak diketahui, daftar 1 Nov 2026 sampai 13 Nov 2026, '
      + 'aktif dalam 30 hari terakhir, punya ruang usaha, pernah pakai Domi, belum pernah beli kredit Domi, kredit Domi habis, '
      + 'belum ada nomor WhatsApp, kecuali akun internal, 3 pengguna, dan 1 kelompok',
    )
    expect(kalimatAturan(aturan(dto), EN, { bahasa: 'en' })).toBe(
      'All users, version 1.3.8 up to below 1.4.1, without unknown versions, joined 1 Nov 2026 to 13 Nov 2026, '
      + 'active in the last 30 days, has a business workspace, has used Domi, never bought Domi credits, out of Domi credits, '
      + 'no WhatsApp number yet, except internal accounts, 3 users, and 1 group',
    )
  })
  it('segmen, segmen yang sudah dihapus, termasuk akun internal, dan aturan tak terbaca', () => {
    const seg = { v: 1, segmen_id: S1, saring: null, kecuali_internal: false, kecuali_pengguna: [U1], kecuali_kelompok: [] }
    expect(kalimatAturan(aturan(seg), ID, { bahasa: 'id', segmenNama: 'Belum 1.4.1' })).toBe('Segmen Belum 1.4.1, kecuali 1 pengguna, termasuk akun internal')
    expect(kalimatAturan(aturan(seg), ID, { bahasa: 'id', segmenNama: null })).toBe('Segmen yang sudah dihapus, kecuali 1 pengguna, termasuk akun internal')
    expect(kalimatAturan(null, ID, { bahasa: 'id' })).toBe('Aturan tidak terbaca')
    expect(kalimatAturan(aturan({ ...ATURAN_SARING, saring: {}, kecuali_internal: false }), ID, { bahasa: 'id' })).toBe('Semua pengguna, termasuk akun internal')
  })
  it('versi satu sisi, kode tak dikenal, saringan asing disebut', () => {
    expect(kalimatSaring({ ...SARING_KOSONG, versiMin: 26111216 }, ID, 'id')).toBe('Semua pengguna, versi 1.4.0 ke atas')
    expect(kalimatSaring({ ...SARING_KOSONG, versiMin: 27000001 }, EN, 'en')).toBe('All users, version 27000001 and up')
    expect(kalimatSaring({ ...SARING_KOSONG, daftarSampai: '2026-11-13' }, ID, 'id')).toBe('Semua pengguna, daftar sampai 13 Nov 2026')
    expect(kalimatAturan(aturan({ ...ATURAN_SARING, saring: { nanti: 1 } }), ID, { bahasa: 'id' })).toBe('Semua pengguna, saringan lain, kecuali akun internal')
  })
  it('gabungDaftar ID dan EN', () => {
    expect(gabungDaftar([], 'dan')).toBe('')
    expect(gabungDaftar(['a'], 'dan')).toBe('a')
    expect(gabungDaftar(['a', 'b'], 'and')).toBe('a and b')
    expect(gabungDaftar(['a', 'b', 'c'], 'dan')).toBe('a, b, dan c')
  })
})

describe('validasi isian', () => {
  it('isian kosong = semua pengguna tanpa saringan', () => {
    expect(periksaIsianSaring(ISIAN_SARING_KOSONG)).toEqual({ saring: SARING_KOSONG, galat: [] })
  })
  it('isian lengkap pulang-pergi', () => {
    const s = keSaring(SARING_LENGKAP).saring
    expect(periksaIsianSaring(isianDariSaring(s))).toEqual({ saring: s, galat: [] })
  })
  it('kode versi, tanggal, dan hari yang salah ditolak dengan kode kamus', () => {
    const salah = (ubah: Partial<typeof ISIAN_SARING_KOSONG>) => periksaIsianSaring({ ...ISIAN_SARING_KOSONG, ...ubah })
    expect(salah({ versiMin: '12abc' }).galat).toEqual(['versiMin'])
    expect(salah({ versiMin: '0' }).galat).toEqual(['versiMin'])
    expect(salah({ versiDiBawah: '2100000001' }).galat).toEqual(['versiDiBawah'])
    expect(salah({ versiDiBawah: '2.6e7' }).galat).toEqual(['versiDiBawah'])
    expect(salah({ versiMin: '26111301', versiDiBawah: '26111301' }).galat).toEqual(['versiTerbalik'])
    expect(salah({ daftarSejak: '2026-02-30' }).galat).toEqual(['daftarSejak'])
    expect(salah({ daftarSampai: '13-11-2026' }).galat).toEqual(['daftarSampai'])
    expect(salah({ daftarSejak: '2026-11-14', daftarSampai: '2026-11-13' }).galat).toEqual(['daftarTerbalik'])
    expect(salah({ aktifHari: '0' }).galat).toEqual(['aktifHari'])
    expect(salah({ aktifHari: String(AKTIF_HARI_MAKS + 1) }).galat).toEqual(['aktifHari'])
    expect(salah({ aktifHari: '1.5' }).galat).toEqual(['aktifHari'])
    expect(salah({ aktifHari: String(AKTIF_HARI_MAKS) }).galat).toEqual([])
    expect(salah({ versiMin: 'x', aktifHari: '0' })).toEqual({ saring: null, galat: ['versiMin', 'aktifHari'] })
  })
  it('tanggal sama di kedua sisi boleh (inklusif)', () => {
    expect(periksaIsianSaring({ ...ISIAN_SARING_KOSONG, daftarSejak: '2026-11-13', daftarSampai: '2026-11-13' }).galat).toEqual([])
  })
  it('nama segmen dan catatan akun internal', () => {
    const daftar = [{ id: S1, nama: 'Belum 1.4.1' }]
    expect(periksaNamaSegmen('  ', daftar)).toBe('kosong')
    expect(periksaNamaSegmen('x'.repeat(NAMA_SEGMEN_MAKS + 1), daftar)).toBe('panjang')
    expect(periksaNamaSegmen('belum 1.4.1', daftar)).toBe('ganda')
    expect(periksaNamaSegmen('Belum 1.4.1', daftar, S1)).toBeNull()
    expect(periksaNamaSegmen('Pengguna baru', daftar)).toBeNull()
    expect(catatanInternalSah('x'.repeat(CATATAN_INTERNAL_MAKS))).toBe(true)
    expect(catatanInternalSah('x'.repeat(CATATAN_INTERNAL_MAKS + 1))).toBe(false)
  })
})

describe('versi dan galat', () => {
  it('batas versi sasaran = rilis 1.3.8 di RILIS_PLAY, pilihan versi terbaru dulu', () => {
    expect(RILIS_PLAY[VERSI_SASARAN.kode]).toBe(VERSI_SASARAN.versi)
    expect(PILIHAN_VERSI[0]).toEqual(RILIS_PLAY_TERAKHIR)
    expect(PILIHAN_VERSI.map(p => p.kode)).toEqual([...PILIHAN_VERSI.map(p => p.kode)].sort((a, b) => b - a))
    expect(labelVersi(26111301)).toBe('1.4.1')
    expect(labelVersi(123)).toBe('123')
  })
  it('penolakan segmen-dipakai dan nama ganda dikenali, kalimat Postgres tidak dipakai', () => {
    const g = petakanGalat({ code: '23503', message: 'update or delete violates foreign key', hint: 'segmen-dipakai' })
    expect(segmenDipakaiDariGalat(g)).toBe(true)
    expect(segmenGandaDariGalat(petakanGalat({ code: '23505', message: 'duplicate key value violates unique constraint "announcement_segments_nama_key"' }))).toBe(true)
    expect(segmenGandaDariGalat(petakanGalat({ code: '23505', message: 'Permintaan sudah dipakai.' }))).toBe(false)
    for (const h of ['saring', 'aturan', 'penerima', 'segmen']) expect(HINT_22023 as readonly string[]).toContain(h)
  })
})

describe('kamus ID dan EN', () => {
  const ambil = (bahasa: 'id' | 'en', jalur: string): unknown =>
    jalur.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), KAMUS_CASHFLOW[bahasa])
  it('setiap nilai dinamis punya label di kedua bahasa', () => {
    const jalur = [
      ...PILIHAN_PENERIMA.map(p => `pengumuman.penerimaOpsi.${p.id}`),
      ...KODE_GALAT_SARING.map(k => `pengumuman.saring.galat.${k}`),
      ...['semua', ...RUANG_SARING].map(r => `pengumuman.saring.ruangOpsi.${r}`),
      ...['semua', ...NOMOR_WA_SARING].map(w => `pengumuman.saring.nomorWaOpsi.${w}`),
      ...['semua', 'ya', 'tidak'].map(t => `pengumuman.saring.tigaOpsi.${t}`),
      ...VERSI_TAK_DIKETAHUI.map(v => `pengumuman.saring.versiTakDiketahuiOpsi.${v}`),
      ...['versiMin', 'versiDiBawah', 'domiPakai', 'domiBeli', 'kreditHabis'].map(k => `pengumuman.saring.${k}`),
      ...['kosong', 'panjang', 'ganda'].map(k => `pengumuman.segmen.namaGalat.${k}`),
      ...['dasar', 'kecualiPengguna', 'kecualiKelompok'].map(k => `pengumuman.aturan.galat.${k}`),
      ...JENIS_AKUN_INTERNAL.map(j => `sakelar.internal.jenisOpsi.${j}`),
      ...['segmenDipakai', 'saringDitolak', 'aturanDitolak', 'penerimaDitolak', 'segmenDitolak', 'namaSegmenGanda'].map(k => `galat.${k}`),
    ]
    const hilang = jalur.flatMap(j => (['id', 'en'] as const).filter(b => ambil(b, j) === undefined).map(b => `${b}:${j}`))
    expect(hilang).toEqual([])
  })
  it('kalimat baru tanpa em-dash, titik koma, atau emoji', () => {
    const teks: string[] = []
    const kumpul = (x: unknown) => {
      if (typeof x === 'string') teks.push(x)
      else if (typeof x === 'function') teks.push(String((x as (...a: unknown[]) => string)('A', 'B')))
      else if (x && typeof x === 'object') Object.values(x).forEach(kumpul)
    }
    for (const b of ['id', 'en'] as const) {
      const p = KAMUS_CASHFLOW[b].pengumuman
      kumpul([p.akun, p.kelompok, p.aturan, p.saring, p.ringkas, p.pratinjauPenerima, p.segmen, p.penerimaOpsi, KAMUS_CASHFLOW[b].sakelar.internal])
    }
    expect(teks.length).toBeGreaterThan(150)
    expect(teks.filter(t => /[—;]|\p{Extended_Pictographic}/u.test(t))).toEqual([])
  })
})

// ── Kontrak terhadap migrasi bagian S ────────────────────────────────────
const adaFungsi = (nama: string): boolean => { if (!adaMigrasi) return false; try { fungsiTerakhir(nama); return true } catch { return false } }
const KONTRAK_PARAMETER: Record<string, string[]> = {
  admin_simpan_pengumuman_v4: ['p_id', 'p_versi', 'p_judul', 'p_isi', 'p_level', 'p_mulai', 'p_sampai', 'p_tombol', 'p_url', 'p_alasan', 'p_penerima', 'p_pengguna', 'p_kelompok', 'p_aturan'],
  admin_pratinjau_penerima_pengumuman: ['p_penerima', 'p_pengguna', 'p_kelompok', 'p_aturan'],
  admin_daftar_pengumuman_v4: [],
  admin_daftar_segmen_pengumuman: [],
  admin_simpan_segmen_pengumuman: ['p_id', 'p_versi', 'p_nama', 'p_saring', 'p_alasan'],
  admin_hapus_segmen_pengumuman: ['p_id', 'p_alasan'],
  admin_daftar_akun_internal: [],
  admin_simpan_akun_internal: ['p_user', 'p_email', 'p_jenis', 'p_catatan', 'p_alasan'],
  admin_hapus_akun_internal: ['p_user', 'p_alasan'],
}
/** Kunci jawaban ada di badan fungsi sebagai literal, atau sebagai kolom tabel yang di-to_jsonb-kan. */
const kunciAda = (badan: string, kunci: string, kolom: readonly string[] = []) => badan.includes(`'${kunci}'`) || kolom.includes(kunci)

describe('kontrak RPC sasaran pengumuman ↔ migrasi bagian S', () => {
  for (const [nama, param] of Object.entries(KONTRAK_PARAMETER)) {
    it.skipIf(!adaFungsi(nama))(`${nama}: parameter sama persis dengan kontrak, penjaga admin`, () => {
      expect(parameterFungsi(nama).map(p => p.nama)).toEqual(param)
      const { kepala, badan } = fungsiTerakhir(nama)
      expect(badan).toMatch(/is_platform_admin\(\)/)
      expect(kepala).toMatch(/set\s+search_path\s*=\s*''/i)
    })
  }

  it.skipIf(!adaFungsi('admin_pratinjau_penerima_pengumuman'))('pratinjau memulangkan kunci yang dibaca adapter', () => {
    const { badan } = fungsiTerakhir('admin_pratinjau_penerima_pengumuman')
    for (const k of Object.keys(PRATINJAU)) expect(kunciAda(badan, k), k).toBe(true)
    for (const k of ['email_tersamar', 'versi']) expect(kunciAda(badan, k), k).toBe(true)
  })

  it.skipIf(!adaFungsi('admin_daftar_segmen_pengumuman'))('daftar segmen memulangkan kunci yang dibaca adapter, kolom tabel sesuai kontrak', () => {
    const kolom = kolomTabel('announcement_segments').kolom
    for (const k of ['id', 'nama', 'saring', 'dibuat', 'diubah']) expect(kolom).toContain(k)
    expect(kolomTabel('announcement_segments').definisi.nama).toMatch(new RegExp(`between\\s+1\\s+and\\s+${NAMA_SEGMEN_MAKS}`, 'i'))
    const { badan } = fungsiTerakhir('admin_daftar_segmen_pengumuman')
    for (const k of ['id', 'nama', 'saring', 'jumlah', 'dipakai', 'diubah']) expect(kunciAda(badan, k, kolom), k).toBe(true)
  })

  it.skipIf(!adaFungsi('admin_daftar_akun_internal'))('daftar akun internal: kunci jawaban dan nilai CHECK jenis = adapter', () => {
    const { kolom, definisi } = kolomTabel('akun_internal')
    for (const k of ['user_id', 'jenis', 'catatan', 'dibuat', 'diubah']) expect(kolom).toContain(k)
    const cek = [...(/in\s*\(([^)]*)\)/i.exec(definisi.jenis ?? '')?.[1] ?? '').matchAll(/'([^']+)'/g)].map(m => m[1])
    expect(cek.sort()).toEqual([...JENIS_AKUN_INTERNAL].sort())
    expect(definisi.catatan).toMatch(new RegExp(`<=\\s*${CATATAN_INTERNAL_MAKS}`))
    const { badan } = fungsiTerakhir('admin_daftar_akun_internal')
    for (const k of ['user_id', 'email', 'jenis', 'catatan', 'diubah']) expect(kunciAda(badan, k, kolom), k).toBe(true)
  })

  it.skipIf(!adaFungsi('admin_daftar_pengumuman_v4'))('daftar v4 = bentuk v3 + audience_rules, segmen_nama, recipient_count', () => {
    expect(kolomTabel('announcements').kolom).toContain('audience_rules')
    const { badan } = fungsiTerakhir('admin_daftar_pengumuman_v4')
    for (const k of ['user_ids', 'group_ids', 'group_names', 'recipient_count', 'segmen_nama']) expect(badan, k).toContain(`'${k}'`)
    expect(badan).toMatch(/to_jsonb\(\s*a\s*\)/i)
  })

  it.skipIf(!adaFungsi('pengumuman_saring_sah_inti'))('kunci dan nilai saring yang dikenal console = yang diperiksa server', () => {
    const { badan } = fungsiTerakhir('pengumuman_saring_sah_inti')
    for (const k of KUNCI_SARING) expect(badan, k).toContain(`'${k}'`)
    for (const v of [...RUANG_SARING, ...NOMOR_WA_SARING, ...VERSI_TAK_DIKETAHUI]) expect(badan, v).toContain(`'${v}'`)
    expect(badan).toMatch(new RegExp(`\\b${AKTIF_HARI_MAKS}\\b`))
  })

  it.skipIf(!adaFungsi('admin_simpan_pengumuman_v4'))('setiap hint yang dilokalkan console memang dilempar server', () => {
    const semua = [...Object.keys(KONTRAK_PARAMETER), 'pengumuman_saring_sah_inti', 'pengumuman_aturan_sah_inti']
      .filter(adaFungsi).map(n => fungsiTerakhir(n).badan).join('\n')
    const dilempar = new Set([...semua.matchAll(/hint\s*=\s*'([a-z-]+)'/g)].map(m => m[1]))
    const muat = baca('composables/cashflow/useCashflowMuat.ts')
    const dikenal = ['segmen-dipakai', 'segmen-basi', 'segmen-nama', 'pengumuman-kunci', 'segmen-kunci', 'alasan-pendek', 'akun-internal', 'saring', 'aturan', 'penerima', 'segmen']
    for (const h of dikenal) {
      expect(dilempar.has(h), h).toBe(true)
      expect(muat.includes(`'${h}'`) || baca('adapters/cashflowPengumumanAturan.ts').includes(`'${h}'`), h).toBe(true)
    }
  })

  it.skipIf(!adaFungsi('admin_hapus_segmen_pengumuman'))('hapus segmen yang dipakai ditolak 23503 segmen-dipakai', () => {
    const { badan } = fungsiTerakhir('admin_hapus_segmen_pengumuman')
    expect(badan).toMatch(/23503/)
    expect(badan).toContain('segmen-dipakai')
  })

  it.skipIf(!adaFungsi('admin_simpan_pengumuman_v4'))('simpan v4 menerima kelima jenis penerima dan batas pengecualian sama dengan adapter', () => {
    const { badan } = fungsiTerakhir('admin_simpan_pengumuman_v4')
    for (const j of PILIHAN_PENERIMA.map(p => p.id)) expect(badan, j).toContain(`'${j}'`)
    const semua = ['pengumuman_cocok_aturan_inti', 'pengumuman_saring_sah_inti', 'pengumuman_aturan_sah_inti', 'admin_simpan_pengumuman_v4']
      .filter(adaFungsi).map(n => fungsiTerakhir(n).badan).join('\n')
    expect(semua).toMatch(new RegExp(`\\b${BATAS_KECUALI_PENGGUNA}\\b`))
    expect(semua).toMatch(new RegExp(`\\b${BATAS_KECUALI_KELOMPOK}\\b`))
  })
})

// ── Penjaga halaman dan komponen ─────────────────────────────────────────
describe('halaman dan komponen', () => {
  const halaman = baca('pages/console/cashflow/pengumuman.vue')
  it('server lama: daftar kembali ke v3 dan pilihan aturan, segmen, pratinjau disembunyikan tanpa galat', () => {
    expect(halaman).toMatch(/petakanGalat\(e, 'admin_daftar_pengumuman_v4'\)\.jenis !== 'belum-aktif'/)
    expect(halaman).toMatch(/return api\.daftarPengumuman\(\)/)
    expect(halaman).toMatch(/v-if="sasaranAktif"[^>]*@click="bukaSegmen = true"/)
    expect(halaman).toMatch(/<CashflowPengumumanPratinjauPenerima v-if="sasaranAktif"/)
    expect(halaman).toMatch(/:aturan-aktif="sasaranAktif === true"/)
    expect(baca('components/cashflow/CashflowPengumumanPenerima.vue')).toMatch(/p\.id !== 'aturan' \|\| props\.aturanAktif/)
  })
  it('server lama tetap menyimpan lewat v3, server baru lewat v4', () => {
    expect(halaman).toMatch(/if \(sasaranAktif\.value\) await api\.simpanPengumumanV4\(/)
    expect(halaman).toMatch(/else if \(menyunting\.value\) await api\.ubahPengumuman\(p\)\s*\n\s*else await api\.buatPengumumanV2\(p\)/)
  })
  it('kotak pratinjau penerima hanya menampilkan, tidak memanggil server', () => {
    const kotak = baca('components/cashflow/CashflowPengumumanPratinjauPenerima.vue')
    expect(kotak).not.toMatch(/useCashflowAdmin|api\./)
    expect(baca('components/cashflow/CashflowPengumumanSaringan.vue')).not.toMatch(/useCashflowAdmin|api\./)
  })
  it('komponen baru hanya memakai token warna console, tanpa warna mentah', () => {
    for (const f of ['CashflowPengumumanAturan', 'CashflowPengumumanSaringan', 'CashflowPengumumanPratinjauPenerima', 'CashflowPengumumanSegmen', 'CashflowPengumumanKelompok', 'CashflowAkunInternalKartu']) {
      expect(baca(`components/cashflow/${f}.vue`), f).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/)
    }
  })
  it('kartu Akun internal terpasang di Sakelar', () => {
    expect(baca('pages/console/cashflow/sakelar.vue')).toMatch(/<CashflowAkunInternalKartu \/>/)
  })
  it('data uji tanpa email sungguhan: hanya contoh.invalid', () => {
    const sumber = [halaman, baca('tests/cashflow/pengumuman-aturan.test.ts')].join('\n')
    const email = [...sumber.matchAll(/[\w.+-]+@([\w-]+\.)+[a-z]{2,}/gi)].map(m => m[0]).filter(e => !/contoh\.invalid$|email\.com$/i.test(e))
    expect(email).toEqual([])
  })
})

/* Pastikan contoh Saring bertipe domain dipakai (tipe diekspor untuk komponen). */
const _contoh: Saring = SARING_KOSONG
void _contoh
