/**
 * Pemakai Domi di daftar pengguna (admin_daftar_pengguna_v4): adapter (bentuk
 * v4, bentuk v3, nilai aneh, sesi tanpa izin data pribadi), jatuh-mundur v4
 * ke v3, lapisan RPC dengan Supabase tiruan, kamus, dan penjaga halaman.
 *
 * Yang paling dijaga: di server lama tidak ada apa pun tentang Domi yang
 * ditawarkan atau dikirim, dan null tidak pernah terbaca sebagai 0.
 *
 * Semua akun, angka, dan waktu di sini karangan.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { computed, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  FILTER_INTERNAL, NILAI_INTERNAL, SEGMEN_BELI_KREDIT, SEGMEN_DOMI, SEGMEN_PAKAI_DOMI, URUT_DOMI,
  adaKolomDomi, akunTim, bacaDaftarBerjenjang, butuhV4, jumlahPakaiDomi, keDomiAkun, nilaiInternal, segmenDomi,
  tanpaHitunganDomi, urutDomi,
} from '../../adapters/cashflowPenggunaDomi'
import { kePengguna, tanpaKontakUtuh, type DaftarPenggunaDTO, type PenggunaDTO } from '../../adapters/cashflow'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'
import { adaMigrasi, fungsiTerakhir, parameterFungsi } from './migrasi'

// ── Global tiruan (tanpa Nuxt, lihat vitest.config.ts) ───────────────────
type Jawab = { data: unknown; error: unknown }
const panggilan: Array<{ nama: string; a: Record<string, unknown> }> = []
let antrean: Jawab[] = []
const sb = {
  auth: { getSession: async () => ({ data: { session: { access_token: 'x' } } }), signOut: async () => ({}) },
  rpc: async (nama: string, a: Record<string, unknown>) => { panggilan.push({ nama, a }); return antrean.shift() ?? { data: null, error: null } },
}
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('useAdminAuth', () => ({ user: ref({ id: 'a', email: 'staf@contoh.id' }) }))
vi.stubGlobal('useCashflowSesi', () => ({
  ambil: async () => sb, sambung: async () => ({ ok: true }), perluSambung: () => false, pelaku: ref('staf@contoh.id'),
}))
const { useCashflowAdmin, GalatAdmin } = await import('~/composables/cashflow/useCashflowAdmin')

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (rel: string) => readFileSync(join(AKAR, rel), 'utf8')
beforeEach(() => { panggilan.length = 0; antrean = [] })

const U = '00000000-0000-0000-0000-000000000001'
/* Baris v3: tanpa satu pun kolom Domi. */
const V3: PenggunaDTO = {
  user_id: U, email: 'sar***@contoh.id', display_name: '', created_at: '2026-08-01T02:00:00Z', last_sign_in: '2026-11-15T02:00:00Z',
  aktivitas_terakhir: '2026-11-15T03:00:00Z', banned_until: null, jumlah_ruang: 2, jumlah_tx: 40, jumlah_nominal: 1_250_000, total_semua: 1,
}
/* Baris v4 persis kontrak. */
const V4: PenggunaDTO = {
  ...V3, domi_tanya: 42, domi_tanya_30: 9, domi_tanya_kira: false, domi_terakhir: '2026-11-13T18:30:00Z', kredit_sisa: 17, kredit_beli: 2, internal: false,
}
const BELUM_ADA = { code: 'PGRST202', message: 'Could not find the function public.admin_daftar_pengguna_v4 in the schema cache' }
const HASIL = (baris: PenggunaDTO[], tambahan: Partial<DaftarPenggunaDTO> = {}): DaftarPenggunaDTO =>
  ({ total: baris.length, baris, versi_terbaru: {}, hapus_tersedia: true, ...tambahan })
const OPSI = { limit: 25, offset: 50, cari: '', segmen: 'pakai_domi', urut: 'domi', arah: 'desc', filter: { internal: 'tidak' }, bahasa: 'id', alasan: null }

// ── Adapter ──────────────────────────────────────────────────────────────
describe('adapter: bentuk v4', () => {
  it('hitungan, 30 hari, tanggal WIB, sisa kredit, jumlah beli', () => {
    expect(keDomiAkun(V4)).toEqual({
      tanya: 42, kira: false, tanya30: 9, terakhir: '14 Nov 2026', terakhirIso: '2026-11-13T18:30:00Z', kreditSisa: 17, kreditBeli: 2,
    })
    expect(keDomiAkun(V4, 'en')?.terakhir).toBe('14 Nov 2026')
    expect(keDomiAkun({ ...V4, domi_terakhir: '2026-08-03T01:00:00Z' }, 'id')?.terakhir).toBe('3 Agu 2026')
    expect(keDomiAkun({ ...V4, domi_terakhir: '2026-08-03T01:00:00Z' }, 'en')?.terakhir).toBe('3 Aug 2026')
  })
  it('belum pernah bertanya: 0 tetap 0, tanggalnya garis', () => {
    const d = keDomiAkun({ ...V4, domi_tanya: 0, domi_tanya_30: 0, domi_terakhir: null, kredit_beli: 0 })
    expect(d).toMatchObject({ tanya: 0, tanya30: 0, terakhir: '—', terakhirIso: null, kreditBeli: 0 })
  })
  it('batas bawah: hanya bila domi_tanya_kira benar-benar true', () => {
    expect(keDomiAkun({ ...V4, domi_tanya_kira: true })).toMatchObject({ tanya: 42, kira: true })
    for (const v of [false, null, undefined, 'true', 1]) expect(keDomiAkun({ ...V4, domi_tanya_kira: v as boolean })?.kira).toBe(false)
    // Kolomnya tidak dikirim sama sekali (server v4 awal): tanpa tanda.
    const { domi_tanya_kira: _buang, ...tanpa } = V4
    expect(keDomiAkun(tanpa)?.kira).toBe(false)
  })
  it('akun tanpa catatan kredit: sisa null (garis), jumlah beli tetap 0', () => {
    expect(keDomiAkun({ ...V4, kredit_sisa: null, kredit_beli: 0 })).toMatchObject({ tanya: 42, kreditSisa: null, kreditBeli: 0 })
    expect(keDomiAkun({ ...V4, kredit_sisa: 0 })?.kreditSisa).toBe(0)
  })
  it('akun tim hanya bila internal benar-benar true', () => {
    expect(akunTim({ internal: true })).toBe(true)
    for (const v of [false, null, undefined, 'ya', 1]) expect(akunTim({ internal: v as boolean })).toBe(false)
  })
  it('kePengguna membawa domi dan tanda tim', () => {
    const p = kePengguna({ ...V4, internal: true })
    expect(p.domi?.tanya).toBe(42)
    expect(p.tim).toBe(true)
    expect(kePengguna(V4).tim).toBe(false)
  })
  it('kepala hasil: jumlah_pakai_domi', () => {
    expect(jumlahPakaiDomi(HASIL([V4], { jumlah_pakai_domi: 37 }))).toBe(37)
    expect(jumlahPakaiDomi(HASIL([V4], { jumlah_pakai_domi: '12' }))).toBe(12)
    expect(jumlahPakaiDomi(HASIL([V4], { jumlah_pakai_domi: null }))).toBeNull()
    expect(jumlahPakaiDomi(HASIL([V3]))).toBeNull()
    expect(jumlahPakaiDomi(null)).toBeNull()
  })
})

describe('adapter: bentuk v3 (server lama)', () => {
  it('tanpa kolom Domi: domi null, bukan nol, dan tanpa lencana tim', () => {
    expect(adaKolomDomi(V3)).toBe(false)
    expect(keDomiAkun(V3)).toBeNull()
    const p = kePengguna(V3)
    expect(p.domi).toBeNull()
    expect(p.tim).toBe(false)
    // Kolom lama tidak terganggu.
    expect(p).toMatchObject({ ruang: 2, tx: 40, nominal: 1_250_000 })
  })
  it('pembersih tidak menambahkan kolom Domi ke baris v3', () => {
    expect('domi_tanya' in tanpaHitunganDomi(V3)).toBe(false)
    expect('domi_tanya' in tanpaKontakUtuh([V3])[0]!).toBe(false)
  })
})

describe('adapter: nilai aneh dan null', () => {
  it('angka sebagai teks, pecahan, dan negatif dirapikan', () => {
    const d = keDomiAkun({ domi_tanya: '42', domi_tanya_30: 9.9, domi_terakhir: '2026-11-13T18:30:00Z', kredit_sisa: -5, kredit_beli: '3' })
    expect(d).toMatchObject({ tanya: 42, tanya30: 9, kreditSisa: 0, kreditBeli: 3 })
  })
  it('yang tak terbaca jadi null, bukan 0', () => {
    const d = keDomiAkun({ domi_tanya: 5, domi_tanya_30: 'abc', domi_terakhir: 'bukan tanggal', kredit_sisa: Number.NaN, kredit_beli: '' })
    expect(d).toEqual({ tanya: 5, kira: false, tanya30: null, terakhir: '—', terakhirIso: null, kreditSisa: null, kreditBeli: null })
    expect(keDomiAkun({ domi_tanya: true as unknown as number })?.tanya).toBeNull()
  })
  it('30 hari tidak pernah lebih dari totalnya', () => {
    expect(keDomiAkun({ domi_tanya: 4, domi_tanya_30: 11 })?.tanya30).toBe(4)
  })
  it('kredit null sendiri (akun tanpa saldo) tidak menghapus hitungan', () => {
    expect(keDomiAkun({ ...V4, kredit_sisa: null })).toMatchObject({ tanya: 42, kreditSisa: null, kreditBeli: 2 })
  })
})

describe('adapter: sesi tanpa izin data pribadi', () => {
  const TANPA: PenggunaDTO = { ...V4, jumlah_ruang: null, jumlah_tx: null, jumlah_nominal: null, domi_tanya: null, domi_tanya_30: null, domi_tanya_kira: null, domi_terakhir: null, kredit_sisa: null, kredit_beli: null, internal: true }
  it('hitungan dan kredit null, tanggal garis, kolomnya tetap dikenali ada', () => {
    expect(adaKolomDomi(TANPA)).toBe(true)
    expect(keDomiAkun(TANPA)).toEqual({ tanya: null, kira: false, tanya30: null, terakhir: '—', terakhirIso: null, kreditSisa: null, kreditBeli: null })
    expect(kePengguna(TANPA).tim).toBe(true)
  })
  it('tanggal tidak tampil bila hitungannya ditahan, apa pun yang dikirim server', () => {
    expect(keDomiAkun({ ...TANPA, domi_terakhir: '2026-11-13T00:00:00Z' })).toMatchObject({ terakhir: '—', terakhirIso: null })
  })
  it('izin hilang di tengah sesi: baris di layar dibersihkan, tanda tim dibiarkan', () => {
    const bersih = tanpaHitunganDomi({ ...V4, domi_tanya_kira: true, internal: true })
    expect(keDomiAkun(bersih)?.kira).toBe(false)
    expect(bersih).toMatchObject({ domi_tanya: null, domi_tanya_30: null, domi_tanya_kira: null, domi_terakhir: null, kredit_sisa: null, kredit_beli: null, internal: true })
    expect(keDomiAkun(bersih)?.tanya).toBeNull()
  })
})

// ── Pilihan yang hanya dikenal v4 ────────────────────────────────────────
describe('urut, segmen, dan saringan Domi', () => {
  it('nilainya persis kontrak', () => {
    expect([...URUT_DOMI]).toEqual(['domi', 'domi_terakhir', 'kredit'])
    expect([SEGMEN_PAKAI_DOMI, SEGMEN_BELI_KREDIT]).toEqual(['pakai_domi', 'beli_kredit'])
    expect([...SEGMEN_DOMI]).toEqual(['pakai_domi', 'beli_kredit'])
    expect(FILTER_INTERNAL).toBe('internal')
    expect([...NILAI_INTERNAL].sort()).toEqual(['tidak', 'ya'])
  })
  it('pengenal', () => {
    for (const u of URUT_DOMI) expect(urutDomi(u)).toBe(true)
    for (const u of ['daftar', 'ruang', '', null]) expect(urutDomi(u)).toBe(false)
    expect(segmenDomi('pakai_domi') && segmenDomi('beli_kredit')).toBe(true)
    for (const s of ['semua', 'belum_wa', 'catat7']) expect(segmenDomi(s)).toBe(false)
    expect(nilaiInternal('ya') && nilaiInternal('tidak')).toBe(true)
    for (const v of ['', 'semua', undefined, 'Ya']) expect(nilaiInternal(v)).toBe(false)
  })
  it('butuhV4: salah satu saja sudah cukup', () => {
    expect(butuhV4({ urut: 'daftar', seg: 'semua' }, {})).toBe(false)
    expect(butuhV4({ urut: 'ruang', seg: 'belum_wa' }, { status_wa: 'masuk' })).toBe(false)
    expect(butuhV4({ urut: 'domi', seg: 'semua' }, {})).toBe(true)
    expect(butuhV4({ urut: 'daftar', seg: 'beli_kredit' }, {})).toBe(true)
    expect(butuhV4({ urut: 'daftar', seg: 'semua' }, { internal: 'ya' })).toBe(true)
  })
})

// ── Kontrak migrasi (hanya bila fungsinya ada di folder CASHFLOW_MIGRASI) ─
const adaV4 = adaMigrasi && (() => { try { fungsiTerakhir('admin_daftar_pengguna_v4'); return true } catch { return false } })()
describe.skipIf(!adaV4)('kontrak migrasi: admin_daftar_pengguna_v4', () => {
  const { badan } = adaV4 ? fungsiTerakhir('admin_daftar_pengguna_v4') : { badan: '' }
  it('argumen sama persis dengan v3', () => {
    expect(parameterFungsi('admin_daftar_pengguna_v4')).toEqual(parameterFungsi('admin_daftar_pengguna_v3'))
  })
  it('kolom per baris dan kepala yang dibaca adapter memang dipulangkan', () => {
    for (const k of ['domi_tanya', 'domi_tanya_30', 'domi_tanya_kira', 'domi_terakhir', 'kredit_sisa', 'kredit_beli', 'internal']) {
      expect(badan, k).toMatch(new RegExp(`\\bas ${k}\\b`))
    }
    expect(badan).toContain("'jumlah_pakai_domi'")
  })
  it('urut, segmen, dan saringan console dikenal server', () => {
    for (const u of URUT_DOMI) expect(badan, u).toMatch(new RegExp(`p_urut = '${u}' and p_arah = 'asc' then [^\\n]+ asc nulls last`))
    for (const u of URUT_DOMI) expect(badan, u).toMatch(new RegExp(`p_urut = '${u}' and p_arah = 'desc' then [^\\n]+ desc nulls last`))
    for (const s of SEGMEN_DOMI) expect(badan, s).toContain(`p_segmen = '${s}'`)
    expect(badan).toContain(`v_filter ? '${FILTER_INTERNAL}'`)
    expect(badan).toContain(`v_filter->>'${FILTER_INTERNAL}' not in ('ya','tidak')`)
  })
  it('tanpa pii: urut dan segmen Domi ditolak bersama ruang, tx, nominal, saringan akun tim tidak', () => {
    expect(badan).toMatch(/p_urut in \('ruang','tx','nominal','domi','domi_terakhir','kredit'\)/)
    expect(badan).toMatch(/errcode = '42501', hint = 'izin-kurang'/)
    expect(badan).toMatch(/ai\.user_id is not null as internal/)
  })
})

// ── Jatuh-mundur v4 ke v3 ────────────────────────────────────────────────
describe('bacaDaftarBerjenjang', () => {
  const belumAktif = () => new GalatAdmin('belum-aktif', 'RPC belum ada')
  it('v4 ada: hasil v4, v3 tidak dipanggil', async () => {
    const v4 = vi.fn(async () => 'v4'); const v3 = vi.fn(async () => 'v3')
    expect(await bacaDaftarBerjenjang({ kenalV4: null, butuh: false, v4, v3 })).toEqual({ hasil: 'v4', v4: true })
    expect(await bacaDaftarBerjenjang({ kenalV4: true, butuh: true, v4, v3 })).toEqual({ hasil: 'v4', v4: true })
    expect(v3).not.toHaveBeenCalled()
  })
  it('v4 belum ada: jatuh ke v3', async () => {
    const v4 = vi.fn(async () => { throw belumAktif() }); const v3 = vi.fn(async () => 'v3')
    expect(await bacaDaftarBerjenjang({ kenalV4: null, butuh: false, v4, v3 })).toEqual({ hasil: 'v3', v4: false })
    expect(v4).toHaveBeenCalledTimes(1)
    expect(v3).toHaveBeenCalledTimes(1)
  })
  it('server sudah diketahui lama: v4 tidak ditanyai lagi', async () => {
    const v4 = vi.fn(async () => 'v4'); const v3 = vi.fn(async () => 'v3')
    expect(await bacaDaftarBerjenjang({ kenalV4: false, butuh: false, v4, v3 })).toEqual({ hasil: 'v3', v4: false })
    expect(v4).not.toHaveBeenCalled()
  })
  it('v4 yang tadinya ada lalu hilang (migrasi dimundurkan): jatuh ke v3 juga', async () => {
    const v4 = vi.fn(async () => { throw belumAktif() }); const v3 = vi.fn(async () => 'v3')
    expect(await bacaDaftarBerjenjang({ kenalV4: true, butuh: false, v4, v3 })).toEqual({ hasil: 'v3', v4: false })
  })
  it('server lama dan permintaan memakai pilihan Domi: tidak dikirim ke v3, hasil null', async () => {
    const v3 = vi.fn(async () => 'v3')
    expect(await bacaDaftarBerjenjang({ kenalV4: false, butuh: true, v4: async () => 'v4', v3 })).toEqual({ hasil: null, v4: false })
    expect(await bacaDaftarBerjenjang({ kenalV4: null, butuh: true, v4: async () => { throw belumAktif() }, v3 })).toEqual({ hasil: null, v4: false })
    expect(v3).not.toHaveBeenCalled()
  })
  it('galat lain dari v4 diteruskan, bukan disembunyikan lewat v3', async () => {
    const v3 = vi.fn(async () => 'v3')
    for (const g of [new GalatAdmin('izin', 'izin-kurang', 'izin-kurang'), new GalatAdmin('argumen', 'ditolak', 'saringan'), new GalatAdmin('lain', 'rusak'), new Error('jaringan')]) {
      await expect(bacaDaftarBerjenjang({ kenalV4: null, butuh: false, v4: async () => { throw g }, v3 })).rejects.toBe(g)
    }
    expect(v3).not.toHaveBeenCalled()
  })
  it('galat v3 sesudah jatuh-mundur tetap sampai ke halaman', async () => {
    const g = new GalatAdmin('izin', 'izin-kurang', 'izin-kurang')
    await expect(bacaDaftarBerjenjang({ kenalV4: false, butuh: false, v4: async () => 'v4', v3: async () => { throw g } })).rejects.toBe(g)
  })
})

// ── Lapisan RPC ──────────────────────────────────────────────────────────
describe('lapisan RPC (Supabase tiruan)', () => {
  const api = useCashflowAdmin()
  const ARGUMEN = {
    p_limit: 25, p_offset: 50, p_cari: null, p_segmen: 'pakai_domi', p_urut: 'domi', p_arah: 'desc',
    p_filter: { internal: 'tidak' }, p_bahasa: 'id', p_alasan: null,
  }
  it('v4 dikirim dengan argumen yang sama persis dengan v3', async () => {
    antrean = [{ data: HASIL([V4], { jumlah_pakai_domi: 1 }), error: null }, { data: HASIL([V3]), error: null }]
    expect((await api.daftarPenggunaHalamanV4(OPSI)).jumlah_pakai_domi).toBe(1)
    await api.daftarPenggunaHalaman(OPSI)
    expect(panggilan).toEqual([{ nama: 'admin_daftar_pengguna_v4', a: ARGUMEN }, { nama: 'admin_daftar_pengguna_v3', a: ARGUMEN }])
  })
  it('v4 belum ada (PGRST202, atau 42883 untuk RPC itu sendiri) jadi belum-aktif', async () => {
    antrean = [{ data: null, error: { ...BELUM_ADA } }]
    await expect(api.daftarPenggunaHalamanV4(OPSI)).rejects.toMatchObject({ jenis: 'belum-aktif' })
    antrean = [{ data: null, error: { code: '42883', message: 'function public.admin_daftar_pengguna_v4(p_limit => integer) does not exist' } }]
    await expect(api.daftarPenggunaHalamanV4(OPSI)).rejects.toMatchObject({ jenis: 'belum-aktif' })
    // 42883 untuk fungsi lain di dalamnya berarti v4 ada tapi rusak: bukan alasan jatuh ke v3.
    antrean = [{ data: null, error: { code: '42883', message: 'function public.lain() does not exist' } }]
    await expect(api.daftarPenggunaHalamanV4(OPSI)).rejects.toMatchObject({ jenis: 'lain' })
  })
  it('rantai utuh di server lama: v4 ditolak, v3 menjawab, dan baris tanpa kolom Domi', async () => {
    const biasa = { ...OPSI, segmen: 'semua', urut: 'daftar', filter: {} }
    antrean = [{ data: null, error: { ...BELUM_ADA } }, { data: HASIL([V3]), error: null }]
    const j = await bacaDaftarBerjenjang({
      kenalV4: null, butuh: butuhV4({ urut: biasa.urut, seg: biasa.segmen }, biasa.filter),
      v4: () => api.daftarPenggunaHalamanV4(biasa), v3: () => api.daftarPenggunaHalaman(biasa),
    })
    expect(panggilan.map(p => p.nama)).toEqual(['admin_daftar_pengguna_v4', 'admin_daftar_pengguna_v3'])
    expect(j.v4).toBe(false)
    expect(j.hasil!.baris.map(d => kePengguna(d).domi)).toEqual([null])
    expect(jumlahPakaiDomi(j.hasil)).toBeNull()
  })
  it('rantai di server lama dengan pilihan Domi: v3 tidak pernah menerima urut atau segmen Domi', async () => {
    antrean = [{ data: null, error: { ...BELUM_ADA } }]
    const j = await bacaDaftarBerjenjang({
      kenalV4: null, butuh: butuhV4({ urut: OPSI.urut, seg: OPSI.segmen }, OPSI.filter),
      v4: () => api.daftarPenggunaHalamanV4(OPSI), v3: () => api.daftarPenggunaHalaman(OPSI),
    })
    expect(j).toEqual({ hasil: null, v4: false })
    expect(panggilan.map(p => p.nama)).toEqual(['admin_daftar_pengguna_v4'])
  })
  it('tanpa izin: v4 menolak urut Domi dengan 42501 izin-kurang, tidak jatuh ke v3', async () => {
    antrean = [{ data: null, error: { code: '42501', hint: 'izin-kurang', message: 'izin-kurang' } }]
    await expect(bacaDaftarBerjenjang({
      kenalV4: true, butuh: true, v4: () => api.daftarPenggunaHalamanV4(OPSI), v3: () => api.daftarPenggunaHalaman(OPSI),
    })).rejects.toMatchObject({ jenis: 'izin', hint: 'izin-kurang' })
    expect(panggilan.map(p => p.nama)).toEqual(['admin_daftar_pengguna_v4'])
  })
})

// ── Penjaga halaman ──────────────────────────────────────────────────────
describe('penjaga daftar pengguna: pemakai Domi', () => {
  const hal = baca('pages/console/cashflow/pengguna/index.vue')
  it('v4 dulu, v3 untuk server lama, dan daftar utama tidak memakai v2', () => {
    expect(hal).toMatch(/v4: \(\) => api\.daftarPenggunaHalamanV4\(opsi\(alasan\)\),\s+v3: \(\) => api\.daftarPenggunaHalaman\(opsi\(alasan\)\),/)
    expect(hal).toMatch(/kenalV4: serverDomi\.value, butuh: butuhV4\(q\.value, filter\)/)
    expect(hal).toMatch(/serverDomi\.value = jawab\.v4/)
    expect(hal).not.toMatch(/api\.daftarPengguna\(/)
    // v2 tetap hanya dipakai indeks pencarian.
    expect(baca('composables/cashflow/useCashflowIndeks.ts')).toMatch(/api\.daftarPengguna\(500, 0, '', null\)/)
  })
  it('pengenalan server lengket selama sesi dan berawal belum tahu', () => {
    expect(hal).toMatch(/const serverDomi = useState<boolean \| null>\('cf_server_domi', \(\) => null\)/)
    expect(hal).toMatch(/const adaDomi = computed\(\(\) => serverDomi\.value === true\)/)
  })
  it('kolom, segmen, saringan tim, jumlah, dan keterangan hanya bila server memasang v4', () => {
    // Sejak v5 kolom berasal dari KOLOM_PENGGUNA: Domi dan kredit bertanda server 4, jadi hanya tampil bila v4 (atau v5) terpasang.
    expect(hal).toMatch(/const tingkatServer = computed<3 \| 4 \| 5>\(\(\) => \(adaV5\.value \? 5 : adaDomi\.value \? 4 : 3\)\)/)
    expect(hal).toMatch(/return kolomUntuk\(tingkatServer\.value\)\.map\(k => \(\{/)
    const kolom = baca('adapters/cashflowPenggunaKolom.ts')
    for (const k of ['domi', 'domi_30', 'domi_terakhir', 'kredit', 'kredit_beli']) expect(kolom).toMatch(new RegExp(`\\{ key: '${k}', urut: '${k}', server: 4 \\}`))
    expect(hal).toMatch(/\.\.\.\(adaDomi\.value \? \[\s+\{ kunci: SEGMEN_PAKAI_DOMI,[^\n]+\n\s+\{ kunci: SEGMEN_BELI_KREDIT,/)
    // Saringan akun tim ada di panel Saring, satu untuk layar lebar dan ponsel.
    expect(hal.match(/<label v-if="adaDomi"/g)).toHaveLength(1)
    expect(hal).toMatch(/<p v-if="adaDomi && jumlahDomi !== null"/)
    // Keterangan kolom Domi pindah ke panel "Arti tiap kolom".
    expect(hal).toMatch(/\.\.\.\(adaDomi\.value \? \[\{ judul: [^\n]*isi: tcf\('pengguna\.domi\.ket'\) \}\] : \[\]\),/)
    // Terakhir pakai Domi kembali jadi kolom sendiri (v5, semua kunci jadi kolom), tanggalnya juga di rincian.
    expect(hal).toMatch(/<template #cell-domi_terakhir="\{ row \}">/)
  })
  it('ketiga urutan Domi bisa dipakai, kecuali tanpa izin, dan tidak punya saringan teks', () => {
    const daftar = baca('adapters/cashflowPenggunaDaftar.ts')
    // Kepala kolom Tanya Domi dan Kredit mengurutkan. Ketiganya ada di pilihan Urut.
    // Setiap kepala kolom mengurutkan lewat urutBoleh: tanpa izin, server lama, dan urut nama tanpa kontak mati.
    expect(hal).toMatch(/key: k\.key, label: tcf\(LABEL_KOLOM\[k\.key\]\), sortable: urut\(k\.urut\), filterable: false/)
    expect(hal).toMatch(/const urut = \(k: string\) => URUT_BERKOLOM\.includes\(k as UrutPengguna\) && urutBoleh\(k as UrutPengguna, keadaanUrut\.value\)/)
    expect(daftar).toMatch(/export const URUT_PENGGUNA = \[[^\]]*'nominal', \.\.\.URUT_DOMI, \.\.\.URUT_V5\] as const/)
    expect(daftar).toMatch(/if \(urutDomi\(k\) && !o\.adaDomi\) return false/)
    expect(daftar).toMatch(/return !\(o\.tanpaHitungan && URUT_PRIBADI\.includes\(k\)\)/)
  })
  it('izin kurang: urut dan segmen Domi diperlakukan sama dengan ruang, tx, nominal', () => {
    const daftar = baca('adapters/cashflowPenggunaDaftar.ts')
    expect(daftar).toMatch(/export const URUT_PRIBADI: readonly UrutPengguna\[\] = \['ruang', 'tx', 'nominal', \.\.\.URUT_DOMI, \.\.\.URUT_PRIBADI_V5\]/)
    expect(daftar).toMatch(/export const segmenButuhHitungan = \(k: string\): boolean => k === 'belum' \|\| k === 'catat7' \|\| segmenDomi\(k\)/)
    // Sejak v5 asal pengguna ikut dibuang bersama hitungan saat izin hilang (hanya bila server mengirim kuncinya).
    expect(hal).toMatch(/tanpaKontakUtuh\(rows\)\s+\.map\(row => tanpaHitunganDomi\(\{ \.\.\.row, jumlah_ruang: null, jumlah_tx: null, jumlah_nominal: null, \.\.\.\(row\.asal !== undefined \? \{ asal: null \} : \{\}\) \}\)\)/)
    expect(hal).toMatch(/jumlahDomi\.value = tanpaHitungan\.value \? null : jumlahPakaiDomi\(hasil\)/)
    expect(hal).toMatch(/if \(tanpaDataPribadi\) \{ jumlahDomi\.value = null; bawaan\.kosongkan\(\) \}/)
  })
  it('server lama: pilihan Domi dilepas, bukan galat', () => {
    expect(hal).toMatch(/if \(!hasil\) \{ lepasDomi\(\); return \}/)
    expect(hal).toMatch(/e instanceof GalatAdmin && e\.hint === 'saringan' && butuhV4\(q\.value, filter\)/)
    expect(hal).toMatch(/segmenDomi\(q\.value\.seg\) \? \{ seg: 'semua' as const \} : \{\}/)
    expect(hal).toMatch(/urutDomi\(q\.value\.urut\) \|\| \(urutV5\(q\.value\.urut\) && !adaV5\.value\) \? \{ urut: 'daftar' as const, arah: 'desc' as const \} : \{\}/)
  })
  it('saringan akun tim hanya mengirim ya atau tidak, terpisah dari saringan kolom dasar', () => {
    const daftar = baca('adapters/cashflowPenggunaDaftar.ts')
    expect(daftar).toMatch(/if \(nilaiInternal\(internal\)\) filter\[FILTER_INTERNAL\] = internal/)
    expect(daftar).toMatch(/export const FILTER_KOLOM = \['email', 'wa', 'versi', 'daftar', 'aktif', 'status'\] as const/)
  })
  it('30 hari ditulis di baris kedua, "Belum pernah" untuk nol, dan lencana Tim ada di tabel dan kartu', () => {
    // Baris kedua selalu ada supaya tinggi baris seragam: 30 hari terakhir, atau "Belum pernah".
    expect(hal).toMatch(/if \(p\.domi\.tanya === 0\) return tcf\('pengguna\.domiBelum'\)\s+return p\.domi\.tanya30 === null \? null : tcf\('pengguna\.domi\.tigaPuluh'\)\(angka\(p\.domi\.tanya30\)\)/)
    // Hitungan yang ditahan (tanpa izin) tidak mendapat baris kedua.
    expect(hal).toMatch(/if \(!p\.domi \|\| p\.domi\.tanya === null\) return null/)
    expect(hal.match(/<span v-if="row\.p\.tim" class="ca-pill-info/g)).toHaveLength(2)
    expect(hal).toMatch(/<template #cell-domi="\{ row \}">/)
    expect(hal).toMatch(/<template #cell-kredit="\{ row \}">/)
    // Tabel punya kolom Kredit dibeli sendiri (v5), jadi baris kedua Pernah beli atau Gratis tinggal di kartu ponsel.
    expect(hal.match(/row\.p\.domi\?\.kreditBeli \? tcf\('pengguna\.kreditBeli'\) : tcf\('pengguna\.kreditGratis'\)/g)).toHaveLength(1)
    expect(hal).toMatch(/<template v-for="k in \(\['ruang', 'tx', 'kredit_beli', 'domi_30'\] as const\)"/)
  })
  it('batas bawah ditulis "42+" dengan keterangan saat disorot, di tabel dan di kartu', () => {
    expect(hal).toMatch(/:title="row\.p\.domi\?\.kira \? tcf\('pengguna\.domi\.kira'\) : undefined"/)
    expect(hal).toMatch(/<template v-if="row\.p\.domi\?\.kira"><span [^>]*aria-hidden="true">\+<\/span><span class="sr-only"> \(\{\{ tcf\('pengguna\.domi\.kira'\) \}\}\)<\/span><\/template>/)
    expect(hal).toMatch(/\{\{ angka\(row\.domi\) \}\}\{\{ row\.p\.domi\?\.kira \? '\+' : '' \}\}/)
  })
  it('lencana Tim dan saringan akun tim tidak bergantung pada izin data pribadi', () => {
    expect(hal).toMatch(/<label v-if="adaDomi" class="grid min-w-0 gap-1/)
    expect(hal).not.toMatch(/v-if="adaDomi && !tanpaHitungan/)
    expect(hal).toMatch(/<span v-if="row\.p\.tim" class="ca-pill-info/)
    // Saringan akun tim tidak termasuk yang memaksa kembali ke bawaan saat izin kurang.
    expect(hal).toMatch(/if \(!tanpaHitungan\.value \|\| \(!segmenButuhHitungan\(q\.value\.seg\) && !URUT_PRIBADI\.includes\(q\.value\.urut\)\)\) return false/)
  })
  it('sel kosong menyebut "akses terbatas" hanya bila izinnya memang kurang', () => {
    expect(hal).toMatch(/const ketKosong = computed\(\(\) => \(tanpaHitungan\.value \? tcf\('umum\.butuhTotp'\) : undefined\)\)/)
  })
})

// ── Kamus ────────────────────────────────────────────────────────────────
describe('kamus ID dan EN', () => {
  const KUNCI = ['judul', 'terakhir', 'kredit', 'kira', 'tim', 'timKet', 'segmenPakai', 'segmenBeli', 'saringTim', 'timSemua', 'timTanpa', 'timHanya', 'ket'] as const
  it('semua label ada di kedua bahasa, tanpa tanda pisah panjang, titik koma, atau emoji', () => {
    for (const b of ['id', 'en'] as const) {
      const d = KAMUS_CASHFLOW[b].pengguna.domi
      const teks = [...KUNCI.map(k => d[k]), d.tigaPuluh('9'), d.beli(2), d.jumlahPakai('37')]
      for (const t of teks) {
        expect(t.length, `${b}: ${t}`).toBeGreaterThan(0)
        expect(t, b).not.toMatch(/[—–;]|\p{Extended_Pictographic}/u)
      }
    }
  })
  it('kalimatnya', () => {
    const id = KAMUS_CASHFLOW.id.pengguna.domi
    const en = KAMUS_CASHFLOW.en.pengguna.domi
    expect([id.judul, id.terakhir, id.kredit, id.tim, id.segmenPakai, id.segmenBeli]).toEqual(['Domi', 'Terakhir pakai Domi', 'Kredit', 'Tim', 'Pakai Domi', 'Beli kredit'])
    expect(id.tigaPuluh('9')).toBe('9 dalam 30 hari')
    // Angka seluruh daftar tanpa akun tim, bukan hitungan hasil saringan.
    expect(id.jumlahPakai('37')).toBe('Dari semua pengguna, 37 akun sudah pernah bertanya ke Domi. Akun tim tidak dihitung.')
    expect(id.kira).toBe('Paling sedikit segini. Sebagian riwayatnya sudah dihapus pengguna.')
    expect(en.kira).toBe('At least this many. The user has deleted part of their history.')
    expect(id.ket).toMatch(/Tanda \+ berarti paling sedikit segitu/)
    expect(en.ket).toMatch(/A \+ means at least that many/)
    expect(en.tigaPuluh('9')).toBe('9 in 30 days')
    expect([en.beli(1), en.beli(2)]).toEqual(['Bought credit 1 time', 'Bought credit 2 times'])
    expect([en.jumlahPakai('1'), en.jumlahPakai('37')]).toEqual([
      'Out of all users, 1 account has asked Domi at least once. Team accounts are not counted.',
      'Out of all users, 37 accounts have asked Domi at least once. Team accounts are not counted.',
    ])
  })
})

describe('repo publik: berkas baru tanpa data nyata', () => {
  it('tanpa jalur lokal, email nyata, atau nomor WhatsApp utuh', () => {
    for (const f of ['adapters/cashflowPenggunaDomi.ts', 'tests/cashflow/pengguna-domi.test.ts', 'scripts/uji-console-pengguna-domi-headless.mjs']) {
      const isi = baca(f)
      expect(isi, f).not.toMatch(new RegExp(['/Us', 'ers/'].join('') + '|@gmail\\.|@coreasia\\.id'))
      expect(isi, f).not.toMatch(/\b628\d{8,11}\b/)
      for (const email of isi.match(/[\w.+*-]+@[\w-]+(?:\.[\w-]+)+/g) ?? []) expect(email, f).toMatch(/@contoh\.(id|invalid)$/)
    }
  })
})
