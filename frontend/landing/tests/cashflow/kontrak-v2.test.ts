/**
 * Kontrak adapter Fase 0b terhadap RPC v2 di migrasi 0087 (admin_tutup_celah).
 *
 * Contoh jawaban di bawah ditulis sebagai TEKS JSON persis seperti yang dikirim
 * PostgREST (timestamptz +00:00, date 'YYYY-MM-DD', numeric/bigint jadi angka,
 * uuid jadi teks). Kunci setiap contoh DIBANDINGKAN dengan kolom `returns
 * table (…)` definisi terakhir fungsinya di folder migrasi — contoh yang
 * menyimpang dari server membuat uji merah, bukan diam-diam dipercaya.
 *
 * Yang dikunci di sini (celah 0087):
 * - admin_ukuran_keberhasilan_v2 tanpa daftar email (jumlah_pengecualian);
 * - admin_daftar_ruang_v2 sudah tersamar di server, adapter idempoten di atasnya;
 * - admin_daftar_config_v2 mengirim bentuk tersamar yang TIDAK boleh disimpan
 *   balik — penanda yang diperiksa adapter = penanda yang ditolak server.
 *
 * Kontrak RPC yang dicabut 0091 (admin_baca_transaksi_v2,
 * admin_baca_catatan_transaksi, admin_daftar_audit_v2) sudah pindah ke
 * penggantinya di tests/cashflow/kontrak-fase1.test.ts.
 */
import { describe, expect, it } from 'vitest'
import {
  keKeberhasilan, keRuang, keConfig,
  daftarTeks, bacaDaftarEmail, keadaanPengecualian, nilaiMasihTersamar, periksaEmailPengecualian,
  JENIS_RUANG, KUNCI_PENGECUALIAN, PENANDA_NILAI_TERSAMAR,
  type KeberhasilanDTO, type RuangDTO, type ConfigDTO,
} from '../../adapters/cashflow'
import { adaMigrasi, fungsiTerakhir, kolomKembalian } from './migrasi'

const urut = (xs: string[]) => [...xs].sort()
const kunci = (teks: string) => urut(Object.keys((JSON.parse(teks) as unknown[])[0] as object))

// ── admin_ukuran_keberhasilan_v2 ─────────────────────────────────────────
const KEBERHASILAN = `[{"jumlah": 3, "pembanding": 2, "jumlah_pengecualian": 7}]`

describe('kontrak KeberhasilanDTO ↔ admin_ukuran_keberhasilan_v2', () => {
  it.skipIf(!adaMigrasi)('contoh memuat persis kolom returns table — tanpa daftar email', () => {
    expect(kunci(KEBERHASILAN)).toEqual(urut(kolomKembalian('admin_ukuran_keberhasilan_v2')))
    expect(kolomKembalian('admin_ukuran_keberhasilan_v2')).not.toContain('pengecualian')
  })
  it('satu baris → angka; tanpa baris → null', () => {
    const [baris] = JSON.parse(KEBERHASILAN) as KeberhasilanDTO[]
    expect(keKeberhasilan(baris)).toEqual({ jumlah: 3, pembanding: 2, pengecualian: 7 })
    expect(keKeberhasilan(undefined)).toBeNull()
  })
})

// ── admin_daftar_ruang_v2 ────────────────────────────────────────────────
// Nama dan pemilik dalam bentuk yang DIHASILKAN server (samar_nama, samar_email).
const RUANG = `[
  {"workspace_id": "0b6f5c1e-2d3a-4b5c-8d7e-9f0a1b2c3d4e", "nama": "Wa······", "pemilik_email": "ded***@gmail.com", "jenis": "usaha",
   "jumlah_anggota": 2, "jumlah_tx": 1200, "undangan_aktif": 1, "created_at": "2026-09-01T16:30:00+00:00", "total_semua": 3},
  {"workspace_id": "7c8d9e0f-1a2b-4c3d-9e4f-5a6b7c8d9e0f", "nama": "Keuangan Saya", "pemilik_email": null, "jenis": "pribadi",
   "jumlah_anggota": 1, "jumlah_tx": 0, "undangan_aktif": 0, "created_at": "2026-08-01T00:00:00+00:00", "total_semua": 3},
  {"workspace_id": "8d9e0f1a-2b3c-4d5e-8f60-718293a4b5c6", "nama": "······", "pemilik_email": "a***@x.id", "jenis": "kantor",
   "jumlah_anggota": 1, "jumlah_tx": 5, "undangan_aktif": 0, "created_at": "2026-07-01T00:00:00+00:00", "total_semua": 3}
]`

describe('kontrak RuangDTO ↔ admin_daftar_ruang_v2', () => {
  it.skipIf(!adaMigrasi)('contoh memuat persis kolom returns table', () => {
    expect(kunci(RUANG)).toEqual(urut(kolomKembalian('admin_daftar_ruang_v2')))
  })
  it.skipIf(!adaMigrasi)('JENIS_RUANG = nilai yang diterima p_jenis di server', () => {
    const m = /v_jenis\s+not\s+in\s*\(([^)]*)\)/i.exec(fungsiTerakhir('admin_daftar_ruang_v2').badan)
    const server = [...(m?.[1] ?? '').matchAll(/'([^']+)'/g)].map(x => x[1]!)
    expect(urut([...JENIS_RUANG])).toEqual(urut(server))
  })
  it.skipIf(!adaMigrasi)('nama dan pemilik disamarkan DI SERVER', () => {
    const { badan } = fungsiTerakhir('admin_daftar_ruang_v2')
    expect(badan).toMatch(/public\.samar_nama\(w\.name\)\s*,/i)
    expect(badan).toMatch(/public\.samar_email\(u\.email\)\s*,/i)
  })
})

describe('keRuang', () => {
  const ruang = () => (JSON.parse(RUANG) as RuangDTO[]).map(keRuang)
  it('penyamaran adapter idempoten atas bentuk server', () => {
    const [warung, bawaan, pendek] = ruang()
    expect(warung).toMatchObject({ nama: 'Wa······', pemilik: 'ded***@gmail.com', jenis: 'usaha', tx: 1200 })
    expect(bawaan).toMatchObject({ nama: 'Keuangan Saya', pemilik: '—', jenis: 'pribadi' })
    expect(pendek!.nama).toBe('······')
  })
  it('jenis yang tidak dikenal → null, bukan dipaksa', () => {
    expect(ruang()[2]!.jenis).toBeNull()
  })
})

// ── admin_daftar_config_v2 + admin_config_buka + admin_set_config ─────────
const CONFIG = `[
  {"key": "admin.pengecualian_email", "value": ["ded*** · gmail.com", "sit*** · contoh.id"], "is_public": false,
   "note": "Email yang dikecualikan dari ukuran keberhasilan.", "updated_by": "3f0c2a4e-8b1d-4c6a-9e2f-1a2b3c4d5e6f",
   "updated_at": "2026-09-18T08:12:45.123456+00:00", "tersamar": true},
  {"key": "auth.verifikasi_email", "value": "wajib", "is_public": true, "note": "wajib | longgar.",
   "updated_by": null, "updated_at": "2026-09-10T00:00:00+00:00", "tersamar": false},
  {"key": "kontak.dukungan", "value": "*** ${PENANDA_NILAI_TERSAMAR}", "is_public": false,
   "note": "*** (catatan tersamar)", "updated_by": null, "updated_at": "2026-09-10T00:00:00+00:00", "tersamar": true}
]`

describe('kontrak ConfigDTO ↔ admin_daftar_config_v2', () => {
  it.skipIf(!adaMigrasi)('contoh memuat persis kolom returns table', () => {
    expect(kunci(CONFIG)).toEqual(urut(kolomKembalian('admin_daftar_config_v2')))
  })
  it.skipIf(!adaMigrasi)('bentuk tersamar contoh = bentuk yang dibangun server', () => {
    const { badan } = fungsiTerakhir('admin_daftar_config_v2')
    expect(badan).toContain(`'${KUNCI_PENGECUALIAN}'`)
    expect(badan).toContain("'***@', '*** · '")
    expect(badan).toContain(PENANDA_NILAI_TERSAMAR)
  })
  it.skipIf(!adaMigrasi)('penanda yang diperiksa adapter = penanda yang ditolak admin_set_config (22023 nilai-tersamar)', () => {
    const { badan } = fungsiTerakhir('admin_set_config')
    expect(badan).toContain(`'%${PENANDA_NILAI_TERSAMAR}%'`)
    expect(badan).toMatch(new RegExp(`v_key\\s*=\\s*'${KUNCI_PENGECUALIAN.replace('.', '\\.')}'\\s+and\\s+p_value::text\\s+like\\s+'%\\*\\*\\*%'`))
    expect(badan).toContain("hint = 'nilai-tersamar'")
    expect(badan).toContain("hint = 'nilai-pribadi-publik'")
  })
  it.skipIf(!adaMigrasi)('admin_config_buka memulangkan nilai jsonb apa adanya, dengan alasan', () => {
    const { kepala, badan } = fungsiTerakhir('admin_config_buka')
    expect(kepala).toMatch(/\(\s*p_key\s+text\s*,\s*p_alasan\s+text\s*\)\s*returns\s+jsonb/i)
    expect(badan).toContain("'buka_config'")
  })
})

describe('sakelar: nilai tersamar tidak pernah dikirim balik', () => {
  const config = () => (JSON.parse(CONFIG) as ConfigDTO[]).map(keConfig)
  it('keConfig membawa tanda tersamar dari server', () => {
    expect(config().map(c => c.tersamar)).toEqual([true, false, true])
  })
  it('daftar pengecualian tersamar dikenali sebagai tersamar; daftar utuh tidak', () => {
    const [pengecualian, otp, lain] = config()
    expect(nilaiMasihTersamar(KUNCI_PENGECUALIAN, pengecualian!.nilai)).toBe(true)
    expect(nilaiMasihTersamar(` ${KUNCI_PENGECUALIAN} `, pengecualian!.nilai)).toBe(true)
    expect(nilaiMasihTersamar('kontak.dukungan', lain!.nilai)).toBe(true)
    expect(nilaiMasihTersamar('auth.verifikasi_email', otp!.nilai)).toBe(false)
    expect(nilaiMasihTersamar(KUNCI_PENGECUALIAN, ['dedi@gmail.com', 'siti@contoh.id'])).toBe(false)
  })
  it('daftarTeks: larik teks saja; bukan larik → []', () => {
    expect(daftarTeks(['a@b.id', 3, null, 'c@d.id'])).toEqual(['a@b.id', 'c@d.id'])
    expect(daftarTeks('*** (tersamar; buka dengan alasan)')).toEqual([])
    expect(daftarTeks(undefined)).toEqual([])
  })
  it('bacaDaftarEmail: larik teks murni → tidak asing; entri bukan teks atau bukan larik → asing', () => {
    expect(bacaDaftarEmail(['a@b.id', 'c@d.id'])).toEqual({ daftar: ['a@b.id', 'c@d.id'], asing: false })
    expect(bacaDaftarEmail([])).toEqual({ daftar: [], asing: false })
    expect(bacaDaftarEmail(['a@b.id', { email: 'c@d.id' }, 3])).toEqual({ daftar: ['a@b.id'], asing: true })
    expect(bacaDaftarEmail('a@b.id, c@d.id')).toEqual({ daftar: [], asing: true })
    expect(bacaDaftarEmail(null)).toEqual({ daftar: [], asing: true })
  })
  it('keadaanPengecualian: kosong hanya untuk larik kosong (server memetakan entri satu-satu)', () => {
    const [pengecualian, , lain] = config()
    expect(keadaanPengecualian(null)).toBe('tiada')
    expect(keadaanPengecualian({ nilai: [] })).toBe('kosong')
    expect(keadaanPengecualian(pengecualian)).toBe('isi')
    expect(keadaanPengecualian(lain)).toBe('lain')
  })
  it.skipIf(!adaMigrasi)('larik tersamar dibangun per entri (with ordinality) — [] tersamar berarti [] utuh', () => {
    const { badan } = fungsiTerakhir('admin_daftar_config_v2')
    expect(badan).toMatch(/jsonb_array_elements_text\(c\.value\)\s+with\s+ordinality/i)
    expect(badan).toMatch(/coalesce\(jsonb_agg\([\s\S]*?'\[\]'::jsonb\)/i)
  })
  it('email baru: bentuk tersamar, bukan email, dan ganda ditolak', () => {
    expect(periksaEmailPengecualian('ded*** · gmail.com', [])).toBe('tersamar')
    expect(periksaEmailPengecualian('ded***@gmail.com', [])).toBe('tersamar')
    expect(periksaEmailPengecualian('dedi', [])).toBe('bukan-email')
    expect(periksaEmailPengecualian(' Dedi@Gmail.com ', ['dedi@gmail.com'])).toBe('ganda')
    expect(periksaEmailPengecualian('siti@contoh.id', ['dedi@gmail.com'])).toBeNull()
  })
})
