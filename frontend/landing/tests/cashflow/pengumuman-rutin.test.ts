/**
 * Form pengumuman, pencarian penerima v2, pengecualian di semua mode, gaya,
 * dan pengumuman rutin (spek console 19 Nov 2026, K5 dan K8: PF-01..03,
 * PR-01..05).
 *
 * Adapter diuji sebagai fungsi murni. Kontraknya dibandingkan dengan migrasi
 * CashFlow 20261119120000 sampai 20261119123000 begitu fungsinya ada di
 * folder migrasi (CASHFLOW_MIGRASI); sebelum itu kasus kontrak "skipped".
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  KODE_GALAT_PENGUMUMAN, HINT_FORM_PENGUMUMAN, KECUALI_KOSONG, galatServerPengumuman, isianBaru, isianDari, penerimaDari, penerimaKirim,
  periksaIsianPengumuman, type IsianPengumuman, type PenerimaIsian,
} from '../../adapters/cashflowPengumumanForm'
import {
  BOBOT_MAKS, BOBOT_MIN, HINT_FORM_RUTIN, JAM_AKHIR_MAKS, JAM_AKHIR_MIN, JAM_MULAI_MAKS, JAM_MULAI_MIN, JEDA_BAWAAN, JEDA_MAKS, JEDA_MIN,
  KODE_GALAT_RUTIN, SEBAB_RENCANA, TOPIK_RUTIN, VERSI_KARTU_BAWAAN, galatServerRutin, isianDariTemplat, isianRutinBaru, keDaftarRutin,
  periksaIsianRutin,
} from '../../adapters/cashflowPengumumanRutin'
import { KUNCI_SARING, keAturan, keSaring, kalimatAturan, saringKeDto, type KamusRingkas } from '../../adapters/cashflowPengumumanAturan'
import { keAkunPenerimaV2 } from '../../adapters/cashflowPengumuman'
import { kePengumuman, type PengumumanDTO } from '../../adapters/cashflow'
import { TAUTAN_DALAM, tombolPengumuman, urlTombolPengumuman } from '../../adapters/cashflowPengumumanTautan'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'
import { adaMigrasi, adaMigrasiNomor, fungsiTerakhir, kolomTabel, parameterFungsi } from './migrasi'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (rel: string) => readFileSync(join(AKAR, rel), 'utf8')
const U1 = '11111111-1111-4111-8111-111111111111'
const U2 = '22222222-2222-4222-8222-222222222222'
const G1 = '33333333-3333-4333-8333-333333333333'
const ID_RINGKAS = KAMUS_CASHFLOW.id.pengumuman.ringkas as unknown as KamusRingkas

const isian = (x: Partial<IsianPengumuman> = {}): IsianPengumuman => ({
  ...isianBaru(new Date('2026-11-19T03:00:00Z')), judul: 'Kabar baru', isi: 'Isi kabar', alasan: 'Uji form pengumuman', ...x,
})
const penerima = (x: Partial<PenerimaIsian> = {}): PenerimaIsian => ({
  jenis: 'all', pengguna: [], kelompok: [], aturan: null, kecuali: { ...KECUALI_KOSONG, pengguna: [], kelompok: [] }, ...x,
})

// ── PF-01 form: pemeriksaan per kolom ────────────────────────────────────
describe('form pengumuman: periksa isian', () => {
  it('isian sah menjadi muatan, waktu WIB dikirim ISO, tombol dirapikan', () => {
    const h = periksaIsianPengumuman(isian({ tombol: ' Buka ', url: 'https://coreasia.id/a' }), { gayaAda: false, penerimaOk: true })
    expect(h.galat).toEqual({})
    expect(h.muatan).toMatchObject({ judul: 'Kabar baru', gaya: 'modal', mulai: '2026-11-19T03:00:00.000Z', sampai: null, tombol: 'Buka', url: 'https://coreasia.id/a' })
  })
  it('setiap kolom punya galatnya sendiri', () => {
    const h = periksaIsianPengumuman(isian({
      judul: ' ', isi: 'x'.repeat(501), mulai: '2026-02-30T09:00', sampai: 'rusak', tombol: 't'.repeat(41), url: 'http://coreasia.id', alasan: 'pendek', gaya: 'kartu',
    }), { gayaAda: false, penerimaOk: false })
    expect(h.muatan).toBeNull()
    expect(h.galat).toEqual({
      penerima: 'penerimaKosong', judul: 'judulKosong', isi: 'isiPanjang', gaya: 'gayaBelumAda', mulai: 'mulaiRusak', sampai: 'sampaiRusak',
      tombol: 'tombolPanjang', url: 'urlTidakSah', alasan: 'alasanPendek',
    })
  })
  it('judul 80 huruf (termasuk huruf ganda-byte) boleh, 81 tidak, sampai sebelum mulai ditolak, tombol tanpa alamat ditolak', () => {
    expect(periksaIsianPengumuman(isian({ judul: 'é'.repeat(80) }), { gayaAda: true, penerimaOk: true }).galat.judul).toBeUndefined()
    expect(periksaIsianPengumuman(isian({ judul: 'a'.repeat(81) }), { gayaAda: true, penerimaOk: true }).galat.judul).toBe('judulPanjang')
    expect(periksaIsianPengumuman(isian({ sampai: '2026-11-19T09:00' }), { gayaAda: true, penerimaOk: true }).galat.sampai).toBe('sampaiSebelumMulai')
    expect(periksaIsianPengumuman(isian({ tombol: 'Buka' }), { gayaAda: true, penerimaOk: true }).galat).toEqual({ url: 'urlKosong' })
    expect(periksaIsianPengumuman(isian({ url: 'https://coreasia.id' }), { gayaAda: true, penerimaOk: true }).galat).toEqual({ tombol: 'tombolKosong' })
  })
  it('tombol boleh ke layar aplikasi dari daftar terkunci, untai lain ditolak', () => {
    expect(periksaIsianPengumuman(isian({ tombol: 'Tanya Domi', url: 'cashflow://ai' }), { gayaAda: true, penerimaOk: true }).muatan?.url).toBe('cashflow://ai')
    for (const url of ['cashflow://ai/x', 'CASHFLOW://AI', 'cashflow://lain', 'cashflow:ai']) {
      expect(periksaIsianPengumuman(isian({ tombol: 'Buka', url }), { gayaAda: true, penerimaOk: true }).galat.url, url).toBe('urlTidakSah')
    }
    expect(tombolPengumuman('Dukung', 'cashflow://dukung')).toEqual({ label: 'Dukung', url: 'cashflow://dukung', host: 'Dukung CashFlow', dalam: true })
    expect(tombolPengumuman('Buka', 'https://coreasia.id')).toMatchObject({ dalam: false, host: 'coreasia.id' })
    expect(urlTombolPengumuman(' cashflow://ai ')).toBe('cashflow://ai')
  })
  it('kartu sah bila server sudah punya kolom gaya', () => {
    expect(periksaIsianPengumuman(isian({ gaya: 'kartu' }), { gayaAda: true, penerimaOk: true }).muatan?.gaya).toBe('kartu')
  })
  it('sunting: waktu yang tidak diubah dikirim persis (detik tidak hilang)', () => {
    const p = kePengumuman({ id: U1, title: 'A', body: 'B', level: 'warning', starts_at: '2026-11-19T03:00:30.123Z', ends_at: null, created_by: null,
      created_at: '2026-11-19T00:00:00Z', gaya: 'kartu' } as PengumumanDTO)
    const i = { ...isianDari(p), alasan: 'Uji sunting pengumuman' }
    expect(i).toMatchObject({ level: 'warning', gaya: 'kartu', mulai: '2026-11-19T10:00' })
    expect(periksaIsianPengumuman(i, { gayaAda: true, penerimaOk: true }).muatan?.mulai).toBe('2026-11-19T03:00:30.123Z')
  })
  it('galat server menempel di kolomnya, hint lain bukan galat kolom', () => {
    expect(galatServerPengumuman({ hint: 'pengumuman-judul' })).toEqual({ kolom: 'judul', kode: 'judulServer' })
    expect(galatServerPengumuman({ hint: 'pengumuman-tautan' })).toEqual({ kolom: 'url', kode: 'tautanServer' })
    expect(galatServerPengumuman({ hint: 'gaya-belum-ada' })).toEqual({ kolom: 'gaya', kode: 'gayaBelumAda' })
    expect(galatServerPengumuman({ hint: 'saring' })).toEqual({ kolom: 'penerima', kode: 'saringDitolak' })
    expect(galatServerPengumuman({ hint: 'pengumuman-basi' })).toBeNull()
    expect(galatServerPengumuman(null)).toBeNull()
  })
})

// ── PF-03 pengecualian di semua mode ─────────────────────────────────────
describe('pengecualian di semua mode penerima', () => {
  const kecuali = { internal: true, pengguna: [U2], kelompok: [G1] }
  it('tanpa pengecualian modenya tetap (semua tetap sampai ke aplikasi lama)', () => {
    expect(penerimaKirim(penerima())).toEqual({ penerima: 'all', pengguna: [], kelompok: [], aturan: null })
    expect(penerimaKirim(penerima({ jenis: 'users', pengguna: [U1, U2] }))).toEqual({ penerima: 'users', pengguna: [U1, U2], kelompok: [], aturan: null })
  })
  it('semua kecuali = aturan saring kosong', () => {
    expect(penerimaKirim(penerima({ kecuali }))).toEqual({ penerima: 'aturan', pengguna: [], kelompok: [], aturan: {
      v: 1, segmen_id: null, saring: {}, kecuali_internal: true, kecuali_pengguna: [U2], kecuali_kelompok: [G1] } })
  })
  it('beberapa pengguna dan satu pengguna kecuali = aturan saring pengguna', () => {
    expect(penerimaKirim(penerima({ jenis: 'users', pengguna: [U1, U2, U1], kecuali }))?.aturan?.saring).toEqual({ pengguna: [U1, U2] })
    expect(penerimaKirim(penerima({ jenis: 'single', pengguna: [U1], kecuali: { ...kecuali, pengguna: [] } }))?.aturan?.saring).toEqual({ pengguna: [U1] })
  })
  it('kelompok kecuali = aturan saring kelompok', () => {
    const k = penerimaKirim(penerima({ jenis: 'groups', kelompok: [G1], kecuali: { internal: true, pengguna: [U1], kelompok: [] } }))
    expect(k).toEqual({ penerima: 'aturan', pengguna: [], kelompok: [], aturan: {
      v: 1, segmen_id: null, saring: { kelompok: [G1] }, kecuali_internal: true, kecuali_pengguna: [U1], kecuali_kelompok: [] } })
  })
  it('pilihan dasar yang belum lengkap tetap belum sah walau ada pengecualian', () => {
    expect(penerimaKirim(penerima({ jenis: 'users', kecuali }))).toBeNull()
    expect(penerimaKirim(penerima({ jenis: 'aturan' }))).toBeNull()
  })
  it('disunting lagi: aturan buatan form kembali ke modenya, aturan lain tetap aturan', () => {
    const balik = (dto: object) => penerimaDari({ penerima: 'aturan', pengguna: [], kelompok: [], aturan: keAturan(dto) })
    expect(balik(penerimaKirim(penerima({ jenis: 'users', pengguna: [U1, U2], kecuali }))!.aturan!)).toMatchObject({ jenis: 'users', pengguna: [U1, U2], kecuali })
    expect(balik(penerimaKirim(penerima({ jenis: 'groups', kelompok: [G1], kecuali }))!.aturan!)).toMatchObject({ jenis: 'groups', kelompok: [G1], kecuali })
    expect(balik(penerimaKirim(penerima({ kecuali }))!.aturan!)).toMatchObject({ jenis: 'all', kecuali })
    const lain = balik({ v: 1, segmen_id: null, saring: { nomor_wa: 'ada' }, kecuali_internal: true, kecuali_pengguna: [], kecuali_kelompok: [] })
    expect(lain.jenis).toBe('aturan')
    expect(lain.aturanAwal?.saring?.nomorWa).toBe('ada')
    // Semua pengguna tanpa pengecualian sebagai aturan: tetap aturan (jangkauannya tidak berubah diam-diam).
    expect(balik({ v: 1, segmen_id: null, saring: {}, kecuali_internal: false, kecuali_pengguna: [], kecuali_kelompok: [] }).jenis).toBe('aturan')
  })
  it('kalimat ringkas menyebut daftar orang dan kelompok', () => {
    expect(kalimatAturan(keAturan({ v: 1, segmen_id: null, saring: { pengguna: [U1, U2] }, kecuali_internal: true, kecuali_pengguna: [], kecuali_kelompok: [] }),
      ID_RINGKAS, { bahasa: 'id' })).toBe('2 pengguna terpilih, kecuali akun internal')
    expect(kalimatAturan(keAturan({ v: 1, segmen_id: null, saring: { kelompok: [G1], daftar_lebih_dari_hari: 3 }, kecuali_internal: true, kecuali_pengguna: [U2], kecuali_kelompok: [] }),
      ID_RINGKAS, { bahasa: 'id' })).toBe('anggota 1 kelompok, akun berumur 3 hari ke atas, kecuali akun internal dan 1 pengguna')
  })
})

describe('saring baru: umur akun, pengguna, kelompok', () => {
  it('terbaca dan kembali sama, nilai salah dicatat asing', () => {
    const s = keSaring({ daftar_lebih_dari_hari: 3, pengguna: [U1], kelompok: [G1] })
    expect(s.asing).toEqual([])
    expect(s.saring).toMatchObject({ umurMinHari: 3, pengguna: [U1], kelompok: [G1] })
    expect(saringKeDto(s.saring)).toEqual({ daftar_lebih_dari_hari: 3, pengguna: [U1], kelompok: [G1] })
    expect(keSaring({ daftar_lebih_dari_hari: 0, pengguna: [], kelompok: ['x'] }).asing.sort()).toEqual(['daftar_lebih_dari_hari', 'kelompok', 'pengguna'])
  })
})

describe('cari penerima v2', () => {
  it('nama dan versi dibaca bila ada, internal dan jenisnya', () => {
    expect(keAkunPenerimaV2({ id: U1, email: 'a@contoh.invalid', nama: ' Sari ', versi: '1.4.3', internal: true, jenis_internal: 'peninjau' }))
      .toEqual({ id: U1, email: 'a@contoh.invalid', nama: 'Sari', versi: '1.4.3', internal: true, jenisInternal: 'peninjau' })
    expect(keAkunPenerimaV2({ id: U1, email: null, nama: null, versi: null, internal: false, jenis_internal: null }))
      .toEqual({ id: U1, email: '', nama: null, versi: null, internal: false, jenisInternal: null })
  })
  it('komponen: alasan hanya untuk sesi pii, jatuh ke v1 di server lama, izin dicabut dibaca tersamar', () => {
    const k = baca('components/cashflow/CashflowPengumumanPengguna.vue')
    expect(k).toMatch(/sesi\.boleh\('cashflow:pii'\)/)
    expect(k).toMatch(/petakanGalat\(e, 'admin_pengumuman_pengguna_v2'\)/)
    expect(k).toMatch(/g\.jenis === 'izin' && bolehBuka\.value\) \{ adaV2\.value = true; return coba\(null\) \}/)
    expect(k).toMatch(/api\.penggunaPengumuman\(q, offset, ids\)/)
  })
})

// ── PR-01 templat rutin ──────────────────────────────────────────────────
const DAFTAR = {
  sakelar: false, versi_min: 26111900, umur_min_hari: 3, gaya_ada: false,
  templat: [{
    id: U1, topik: 'dukung', judul: 'Suka mencatat?', isi: 'Isi', tombol: 'Dukung CashFlow', url: 'https://cashflow.coreasia.id/dukung',
    aturan: { v: 1, segmen_id: null, saring: { aktif_dalam_hari: 14 }, kecuali_internal: true, kecuali_pengguna: [U2], kecuali_kelompok: [] },
    jeda_hari: 3, jam_mulai: 9, jam_akhir: 20, bobot: '2', aktif: false, dibuat: '2026-11-19T00:00:00Z', versi: '2026-11-19T00:00:00.1Z',
    terbit: '0', terakhir_terbit: null,
  }, { id: 'bukan-uuid', topik: 'domi' }],
  terakhir: null,
  rencana: { templat_id: null, topik: null, mulai: null, sampai: null, sebab: 'tanpa_templat', paling_cepat: null },
}
describe('templat rutin: adapter', () => {
  it('daftar terbaca, baris rusak dibuang, angka teks jadi angka', () => {
    const d = keDaftarRutin(DAFTAR)
    expect(d).toMatchObject({ sakelar: false, versiMin: 26111900, umurMinHari: 3, gayaAda: false, terakhir: null })
    expect(d.templat).toHaveLength(1)
    expect(d.templat[0]).toMatchObject({ topik: 'dukung', bobot: 2, terbit: 0, jedaHari: 3, aktif: false })
    expect(d.rencana).toMatchObject({ sebab: 'tanpa_templat', templatId: null })
    expect(keDaftarRutin(null)).toMatchObject({ sakelar: false, templat: [], versiMin: VERSI_KARTU_BAWAAN })
  })
  it('templat baru: draf, jeda 3, tayang 09.00 sampai 20.00, bobot 1', () => {
    expect(isianRutinBaru()).toMatchObject({ aktif: false, jedaHari: String(JEDA_BAWAAN), jamMulai: '9', jamAkhir: '20', bobot: '1' })
  })
  it('sunting: isian dari templat dan kembali ke muatan yang sama, akun internal selalu dikecualikan', () => {
    const t = keDaftarRutin(DAFTAR).templat[0]!
    const h = periksaIsianRutin({ ...isianDariTemplat(t), alasan: 'Uji templat rutin' })
    expect(h.galat).toEqual({})
    expect(h.muatan).toMatchObject({ topik: 'dukung', bobot: 2, jedaHari: 3, aktif: false, tombol: 'Dukung CashFlow', url: 'https://cashflow.coreasia.id/dukung',
      aturan: { v: 1, segmen_id: null, saring: { aktif_dalam_hari: 14 }, kecuali_internal: true, kecuali_pengguna: [U2], kecuali_kelompok: [] } })
  })
  it('setiap kolom punya galatnya sendiri', () => {
    const h = periksaIsianRutin({ ...isianRutinBaru(), judul: '', isi: 'x'.repeat(501), tombol: 'Buka', url: 'http://a.b', jedaHari: '1', jamMulai: '12', jamAkhir: '12',
      bobot: '11', alasan: 'x', saring: { ...isianRutinBaru().saring, umurMinHari: '0' } })
    expect(h.muatan).toBeNull()
    expect(h.galat).toEqual({ judul: 'judulKosong', isi: 'isiPanjang', url: 'urlTidakSah', saring: 'saring', jeda: 'jeda', jam_akhir: 'jamTerbalik', bobot: 'bobot', alasan: 'alasanPendek' })
    expect(h.galatSaring).toEqual(['umurMinHari'])
    expect(periksaIsianRutin({ ...isianRutinBaru(), judul: 'a', isi: 'b', alasan: 'Uji templat rutin', jamMulai: '5', jamAkhir: '22' }).galat)
      .toEqual({ jam_mulai: 'jamMulai', jam_akhir: 'jamAkhir' })
  })
  it('galat server menempel di kolomnya', () => {
    expect(galatServerRutin({ hint: 'rutin-jeda' })).toEqual({ kolom: 'jeda', kode: 'jedaServer' })
    expect(galatServerRutin({ hint: 'rutin-jam' })).toEqual({ kolom: 'jam_akhir', kode: 'jamServer' })
    expect(galatServerRutin({ hint: 'pengumuman-tautan' })).toEqual({ kolom: 'url', kode: 'tautanServer' })
    expect(galatServerRutin({ hint: 'rutin-basi' })).toBeNull()
  })
})

// ── Kontrak terhadap migrasi T3 ──────────────────────────────────────────
const adaFungsi = (nama: string): boolean => { if (!adaMigrasi) return false; try { fungsiTerakhir(nama); return true } catch { return false } }
const KONTRAK: Record<string, string[]> = {
  admin_pengumuman_pengguna_v2: ['p_cari', 'p_limit', 'p_offset', 'p_ids', 'p_alasan'],
  admin_simpan_pengumuman_v5: ['p_id', 'p_versi', 'p_judul', 'p_isi', 'p_level', 'p_mulai', 'p_sampai', 'p_tombol', 'p_url', 'p_alasan',
    'p_penerima', 'p_pengguna', 'p_kelompok', 'p_aturan', 'p_gaya'],
  admin_daftar_pengumuman_rutin: [],
  admin_simpan_pengumuman_rutin: ['p_id', 'p_versi', 'p_topik', 'p_judul', 'p_isi', 'p_tombol', 'p_url', 'p_aturan', 'p_jeda_hari',
    'p_jam_mulai', 'p_jam_akhir', 'p_bobot', 'p_aktif', 'p_alasan'],
  admin_hapus_pengumuman_rutin: ['p_id', 'p_alasan'],
}
const ADMIN = baca('composables/cashflow/useCashflowAdmin.ts')
/** Kunci objek argumen rpc('nama', { … }) di useCashflowAdmin. */
const kunciKirim = (nama: string): string[] | null => {
  const m = new RegExp(`\\brpc\\b[^(']*\\(\\s*'${nama}'\\s*([,)])`).exec(ADMIN)
  if (!m) return null
  if (m[1] === ')') return []
  const buka = ADMIN.indexOf('{', m.index + m[0].length)
  let dalam = 0
  let akhir = buka
  for (let j = buka; j < ADMIN.length; j++) {
    if (ADMIN[j] === '{') dalam++
    else if (ADMIN[j] === '}' && --dalam === 0) { akhir = j; break }
  }
  return [...ADMIN.slice(buka + 1, akhir).matchAll(/(?:^|,)\s*(p_\w+)\s*:/g)].map(k => k[1]!)
}

describe('kontrak RPC T3 ↔ migrasi 20261119120000..20261119123000', () => {
  for (const [nama, param] of Object.entries(KONTRAK)) {
    it.skipIf(!adaFungsi(nama))(`${nama}: parameter = kontrak = kunci yang dikirim console, penjaga admin, search_path kosong`, () => {
      expect(parameterFungsi(nama).map(p => p.nama)).toEqual(param)
      expect((kunciKirim(nama) ?? []).sort()).toEqual([...param].sort())
      const { kepala, badan } = fungsiTerakhir(nama)
      expect(badan).toMatch(/is_platform_admin\(\)/)
      expect(kepala).toMatch(/set\s+search_path\s*=\s*''/i)
    })
  }
  it.skipIf(!adaFungsi('admin_daftar_pengumuman_rutin'))('daftar rutin memulangkan kunci yang dibaca adapter, izin view', () => {
    const { badan } = fungsiTerakhir('admin_daftar_pengumuman_rutin')
    for (const k of [...Object.keys(DAFTAR), ...Object.keys(DAFTAR.templat[0]!)]) expect(badan.includes(`'${k}'`), k).toBe(true)
    expect(badan).toContain("konsol_boleh('cashflow:view')")
    // Rencana dibangun pembantu yang sama dengan jadwal, jadi console melihat sebab yang sama.
    expect(badan).toContain('public.pengumuman_rutin_rencana_inti(now())')
    const rencana = fungsiTerakhir('pengumuman_rutin_rencana_inti').badan
    for (const k of Object.keys(DAFTAR.rencana)) expect(rencana.includes(`'${k}'`), k).toBe(true)
    for (const s of SEBAB_RENCANA) expect(rencana, s).toContain(`'${s}'`)
  })
  it.skipIf(!adaFungsi('admin_simpan_pengumuman_rutin'))('topik, jeda, jam, dan bobot = CHECK tabel dan penjaga simpan, tulis butuh pii', () => {
    const { definisi } = kolomTabel('pengumuman_rutin')
    expect([...(definisi.topik ?? '').matchAll(/'([a-z]+)'/g)].map(m => m[1])).toEqual([...TOPIK_RUTIN])
    expect(definisi.jeda_hari).toMatch(new RegExp(`default\\s+${JEDA_BAWAAN}\\b[\\s\\S]*between\\s+${JEDA_MIN}\\s+and\\s+${JEDA_MAKS}`, 'i'))
    expect(definisi.jam_mulai).toMatch(new RegExp(`between\\s+${JAM_MULAI_MIN}\\s+and\\s+${JAM_MULAI_MAKS}`, 'i'))
    expect(definisi.jam_akhir).toMatch(new RegExp(`between\\s+${JAM_AKHIR_MIN}\\s+and\\s+${JAM_AKHIR_MAKS}`, 'i'))
    expect(definisi.bobot).toMatch(new RegExp(`between\\s+${BOBOT_MIN}\\s+and\\s+${BOBOT_MAKS}`, 'i'))
    expect(definisi.aktif).toMatch(/default\s+false/i)
    for (const n of ['admin_simpan_pengumuman_rutin', 'admin_hapus_pengumuman_rutin']) expect(fungsiTerakhir(n).badan).toContain("konsol_boleh('cashflow:pii')")
  })
  it.skipIf(!adaFungsi('pengumuman_rutin_sakelar_inti'))('versi kartu bawaan dan umur minimal sama dengan server, sakelar mati bawaan', () => {
    const { badan } = fungsiTerakhir('pengumuman_rutin_sakelar_inti')
    expect(badan).toContain(String(VERSI_KARTU_BAWAAN))
    expect(badan).toMatch(/'nyala'\s*=\s*'true'::jsonb/)
    expect(fungsiTerakhir('pengumuman_rutin_aturan_terbit_inti').badan).toMatch(/'kecuali_internal',\s*true/)
    expect(fungsiTerakhir('pengumuman_rutin_aturan_terbit_inti').badan).toMatch(/'versi_tak_diketahui',\s*'tidak'/)
  })
  it.skipIf(!adaMigrasiNomor('20261119121000'))('kunci saring baru diperiksa server', () => {
    const { badan } = fungsiTerakhir('pengumuman_saring_sah_inti')
    for (const k of KUNCI_SARING) expect(badan, k).toContain(`'${k}'`)
  })
  it.skipIf(!adaFungsi('admin_simpan_pengumuman_rutin'))('setiap hint yang dipetakan console memang dilempar server', () => {
    const semua = ['admin_simpan_pengumuman_rutin', 'admin_hapus_pengumuman_rutin', 'admin_simpan_pengumuman_v5', 'admin_pengumuman_pengguna_v2',
      'pengumuman_saring_sah_inti', 'pengumuman_aturan_sah_inti', 'pengumuman_periksa']
      .filter(adaFungsi).map(n => fungsiTerakhir(n).badan).join('\n')
    const dilempar = new Set([...semua.matchAll(/hint\s*=\s*'([a-z-]+)'/g)].map(m => m[1]))
    for (const h of [...HINT_FORM_PENGUMUMAN, ...HINT_FORM_RUTIN]) expect(dilempar.has(h), h).toBe(true)
  })
  it.skipIf(!adaMigrasi || !fungsiTerakhir('pengumuman_tautan_sah').badan.includes('cashflow://'))('tautan dalam console = daftar terkunci pengumuman_tautan_sah (T4)', () => {
    const daftar = /p_url\s+in\s*\(([^)]*)\)/i.exec(fungsiTerakhir('pengumuman_tautan_sah').badan)?.[1] ?? ''
    expect([...daftar.matchAll(/'([^']+)'/g)].map(m => m[1]).sort()).toEqual([...TAUTAN_DALAM].sort())
  })
  it.skipIf(!adaFungsi('admin_simpan_pengumuman_v5'))('v5 menulis gaya lewat SQL dinamis (kolom gaya milik T4), kartu tanpa kolom ditolak', () => {
    const { badan } = fungsiTerakhir('admin_simpan_pengumuman_v5')
    expect(badan).toContain("hint = 'gaya-belum-ada'")
    expect(badan).toMatch(/execute 'update public\.announcements set gaya/)
  })
})

// ── Halaman dan komponen ────────────────────────────────────────────────
describe('halaman dan komponen', () => {
  const halaman = baca('pages/console/cashflow/pengumuman.vue')
  it('simpan memakai v5 bila fitur T3 ada, lalu v4, lalu v3', () => {
    expect(halaman).toMatch(/if \(fiturT3\.value\) await api\.simpanPengumumanV5\(/)
    expect(halaman).toMatch(/petakanGalat\(e, 'admin_daftar_pengumuman_rutin'\)\.jenis !== 'belum-aktif'/)
    expect(halaman).toMatch(/<CashflowPengumumanRutin v-if="fiturT3 && rutin"/)
    expect(halaman).toMatch(/:kecuali-aktif="sasaranAktif === true && fiturT3"/)
  })
  it('form: kartu terkunci tanpa kolom gaya, pengecualian untuk mode selain aturan', () => {
    const form = baca('components/cashflow/CashflowPengumumanForm.vue')
    expect(form).toMatch(/:disabled="g === 'kartu' && !gayaAda"/)
    expect(form).toMatch(/props\.kecualiAktif && p\.jenis !== 'aturan'/)
    expect(form).toMatch(/:aria-invalid="galatKolom\('judul'\)/)
  })
  it('templat rutin: akun internal terkunci, tulis butuh pii, pratinjau kartu', () => {
    const f = baca('components/cashflow/CashflowPengumumanRutinForm.vue')
    expect(f).toMatch(/:internal="true" internal-tetap/)
    expect(f).toMatch(/gaya="kartu"/)
    expect(baca('components/cashflow/CashflowPengumumanRutin.vue')).toMatch(/sesi\.boleh\('cashflow:pii'\)/)
  })
  it('komponen baru tanpa warna mentah', () => {
    for (const k of ['CashflowPengumumanForm', 'CashflowPengumumanKecuali', 'CashflowPengumumanRutin', 'CashflowPengumumanRutinForm']) {
      expect(baca(`components/cashflow/${k}.vue`), k).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/)
    }
  })
})

// ── Kamus ────────────────────────────────────────────────────────────────
describe('kamus ID dan EN', () => {
  const ambil = (bahasa: 'id' | 'en', jalur: string): unknown =>
    jalur.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), KAMUS_CASHFLOW[bahasa])
  it('setiap kode galat, sebab, dan topik punya label di kedua bahasa', () => {
    const jalur = [
      ...KODE_GALAT_PENGUMUMAN.map(k => `pengumuman.form.galat.${k}`),
      ...KODE_GALAT_RUTIN.map(k => `pengumuman.rutin.galat.${k}`),
      ...SEBAB_RENCANA.map(s => `pengumuman.rutin.sebab.${s}`),
      ...TOPIK_RUTIN.map(t => `pengumuman.rutin.topikOpsi.${t}`),
      ...['modal', 'kartu'].flatMap(g => [`pengumuman.form.gayaOpsi.${g}`, `pengumuman.form.gayaKet.${g}`]),
      'pengumuman.saring.galat.umurMinHari', 'pengumuman.ringkas.umur', 'pengumuman.ringkas.hanyaPengguna', 'pengumuman.ringkas.anggotaKelompok',
    ]
    const hilang = jalur.flatMap(j => (['id', 'en'] as const).filter(b => ambil(b, j) === undefined).map(b => `${b}:${j}`))
    expect(hilang).toEqual([])
  })
  it('kalimat baru tanpa em-dash, titik koma, atau emoji', () => {
    const teks: string[] = []
    const kumpul = (x: unknown) => {
      if (typeof x === 'string') teks.push(x)
      else if (typeof x === 'function') teks.push(String((x as (...a: unknown[]) => string)('A', 'B', 'C', 1)))
      else if (x && typeof x === 'object') Object.values(x).forEach(kumpul)
    }
    for (const b of ['id', 'en'] as const) {
      const p = KAMUS_CASHFLOW[b].pengumuman as unknown as Record<string, unknown>
      kumpul([p.form, p.rutin, p.akun])
    }
    expect(teks.length).toBeGreaterThan(150)
    expect(teks.filter(t => /[—;]|\p{Extended_Pictographic}/u.test(t))).toEqual([])
  })
})

describe('sakelar pengumuman rutin dari console', () => {
  it('nilai sakelar menjaga versi_min dan tidak pernah di bawah aplikasi pertama yang mengenal kartu', async () => {
    const { CATATAN_SAKELAR_RUTIN, KUNCI_SAKELAR_RUTIN, VERSI_MIN_SAKELAR, nilaiSakelarRutin } = await import('../../adapters/cashflowPengumumanRutin')
    expect(KUNCI_SAKELAR_RUTIN).toBe('pengumuman_rutin')
    expect(nilaiSakelarRutin(true, VERSI_KARTU_BAWAAN)).toEqual({ nyala: true, versi_min: VERSI_MIN_SAKELAR })
    expect(nilaiSakelarRutin(true, 26111908)).toEqual({ nyala: true, versi_min: 26111908 })
    expect(nilaiSakelarRutin(false, 26111908)).toEqual({ nyala: false, versi_min: 26111908 })
    expect(nilaiSakelarRutin(true, Number.NaN).versi_min).toBe(VERSI_MIN_SAKELAR)
    expect(CATATAN_SAKELAR_RUTIN).not.toContain('@')
  })
  it('komponen menyimpan lewat setConfig dengan alasan, tidak publik, dan hanya untuk yang boleh mengubah', () => {
    const badan = readFileSync(join(AKAR, 'components/cashflow/CashflowPengumumanRutin.vue'), 'utf8')
    expect(badan).toMatch(/api\.setConfig\(KUNCI_SAKELAR_RUTIN, nilaiSakelarRutin\(tujuan, props\.daftar\.versiMin\), false, CATATAN_SAKELAR_RUTIN, alasanSakelar\.value\.trim\(\)\)/)
    expect(badan).toMatch(/data-uji="rutin-sakelar-ubah"[^>]*|:disabled="!bolehUbah" data-uji="rutin-sakelar-ubah"/)
    expect(badan).toContain('alasanSakelar.value.trim().length < 8')
    for (const b of ['id', 'en'] as const) {
      const r = KAMUS_CASHFLOW[b].pengumuman.rutin as Record<string, unknown>
      for (const k of ['nyalakan', 'matikan', 'dinyalakan', 'dimatikan', 'nyalakanKet', 'matikanKet', 'alasanNyala', 'alasanMati']) expect(r[k], `${b}.${k}`).toBeTruthy()
    }
  })
})
