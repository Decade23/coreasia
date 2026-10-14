/**
 * Halaman Hapus akun (0112): adapter, tombol per izin, galat RPC belum ada dan P0001,
 * argumen RPC, kamus, dan penjaga halaman.
 *
 * Kontrak DTO terhadap migrasi ada di kontrak-0112.test.ts. Halaman sendiri
 * tetap aman sebelum 0112 terpasang karena RPC yang belum ada (PGRST202, atau
 * 42883 yang menyebut RPC itu sendiri) dibaca sebagai "fitur belum aktif".
 * 42883 dari fungsi lain di dalamnya tetap galat biasa.
 *
 * Semua id dan email di sini karangan.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { computed, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  aksiPermintaan, alasanBatalOtomatis, alasanHapusOtomatis, bagianIsi, barisHapus, BAGIAN_ISI, BATAS_BADGE_HAPUS, BATAS_DAFTAR_HAPUS,
  HASIL_BERHASIL, HASIL_HAPUS, idMenungguHapus, jenisGagalHapus, jumlahPerStatus, keadaanFoto, keHasilHapus, keIsiHapus, kePermintaanHapus,
  LEWAT_HAPUS, muatUlangSesudahGagal, STATUS_HAPUS, STATUS_JAWAB, urutPermintaan,
  type HapusAkunDaftarDTO, type HapusAkunDTO, type IsiHapusDTO,
} from '../../adapters/cashflowHapusAkun'
import { kePengguna, type PenggunaDTO } from '../../adapters/cashflow'
import { izinSesiCashflow } from '../../utils/rbac'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'

// ── Global tiruan (tanpa Nuxt, lihat vitest.config.ts) ───────────────────
type Jawab = { data: unknown; error: unknown }
const panggilan: Array<{ nama: string; a: Record<string, unknown> }> = []
let jawaban: Jawab = { data: [], error: null }
const sb = {
  auth: { getSession: async () => ({ data: { session: { access_token: 'x' } } }), signOut: async () => ({}) },
  rpc: async (nama: string, a: Record<string, unknown>) => { panggilan.push({ nama, a }); return jawaban },
}
const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn() }
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('useAdminAuth', () => ({ user: ref({ id: 'a', email: 'staf@contoh.id' }) }))
vi.stubGlobal('useCashflowSesi', () => ({ ambil: async () => sb, sambung: async () => ({ ok: true }), pelaku: ref('staf@contoh.id') }))
vi.stubGlobal('useCashflowI18n', () => ({ tcf: (k: string) => k }))
vi.stubGlobal('useRoute', () => ({ fullPath: '/console/cashflow/hapus-akun' }))
vi.stubGlobal('useToast', () => toast)
vi.stubGlobal('navigateTo', vi.fn())
const { useCashflowAdmin, petakanGalat, GalatAdmin } = await import('~/composables/cashflow/useCashflowAdmin')
const { useCashflowMuat } = await import('~/composables/cashflow/useCashflowMuat')

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (rel: string) => readFileSync(join(AKAR, rel), 'utf8')

const ID1 = '00000000-0000-4000-8000-0000000000a1'
const ID2 = '00000000-0000-4000-8000-0000000000a2'
const U1 = '00000000-0000-4000-8000-0000000000b1'
const U2 = '00000000-0000-4000-8000-0000000000b2'
const KINI = Date.parse('2026-10-14T05:00:00Z')
const HARI = 864e5

/** Contoh `isi` (hapus_akun_hitung_inti); bigint bisa pulang sebagai string. */
const ISI: IsiHapusDTO = { buku_milik: 2, buku_anggota: 1, transaksi_milik: '340', transaksi_pindah: 5, foto: 12, tertahan: false }
/** Contoh satu baris `baris` admin_hapus_akun_daftar. */
const baris = (lain: Partial<HapusAkunDTO> = {}): HapusAkunDTO => ({
  id: ID1, user_id: U1, email_samar: 'bud***@contoh.id', nama: 'Budi', lewat: 'aplikasi', status: 'menunggu',
  diminta_pada: new Date(KINI - 2 * HARI).toISOString(), umur_hari: null, lewat_7_hari: null,
  selesai_pada: null, dibatalkan_pada: null, oleh: null, blokir: 'sql', blokir_pada: new Date(KINI - 2 * HARI).toISOString(),
  isi: ISI, tertahan: false, foto_menunggu: 0, foto_gagal: 0, ...lain,
})
const daftarDTO = (rows: HapusAkunDTO[]): HapusAkunDaftarDTO => ({
  status: 'menunggu', batas: 100, jumlah: { menunggu: rows.length, selesai: '3', dibatalkan: 0 }, baris: rows,
})

beforeEach(() => {
  panggilan.length = 0
  jawaban = { data: daftarDTO([]), error: null }
})

describe('kePermintaanHapus', () => {
  it('memetakan baris server; angka string terbaca, email tetap tersamar', () => {
    const p = kePermintaanHapus(baris(), KINI)
    expect(p).toMatchObject({
      id: ID1, userId: U1, emailTersamar: 'bud***@contoh.id', nama: 'Budi', status: 'menunggu', lewat: 'aplikasi',
      umurHari: 2, lewatBatas: false, blokirTertunda: false, tertahan: false, keadaanFoto: 'tersimpan', ke360: `/console/cashflow/pengguna/${U1}`,
      isi: { ruangMilik: 2, ruangAnggota: 1, transaksi: 340, transaksiPindah: 5, foto: 12 },
    })
    // Sabuk kedua: email utuh yang lolos dari server tetap disamarkan di sini.
    expect(kePermintaanHapus(baris({ email_samar: 'budiman@contoh.id' }), KINI).emailTersamar).toBe('bud***@contoh.id')
    expect(kePermintaanHapus(baris({ email_samar: null }), KINI).emailTersamar).toBe('—')
  })

  it('merah hanya untuk yang MENUNGGU lebih dari 7 hari; jam server lebih dulu', () => {
    const umur = (ms: number, status = 'menunggu', lain: Partial<HapusAkunDTO> = {}) =>
      kePermintaanHapus(baris({ diminta_pada: new Date(KINI - ms).toISOString(), status, ...lain }), KINI)
    expect(umur(7 * HARI)).toMatchObject({ umurHari: 7, lewatBatas: false })
    expect(umur(7 * HARI + 1000)).toMatchObject({ umurHari: 7, lewatBatas: true })
    expect(umur(30 * HARI, 'selesai').lewatBatas).toBe(false)
    expect(umur(30 * HARI, 'dibatalkan').lewatBatas).toBe(false)
    expect(umur(0).umurHari).toBe(0)
    // Jam laptop admin meleset: yang dipakai umur_hari dan lewat_7_hari dari server.
    expect(umur(HARI, 'menunggu', { umur_hari: 9, lewat_7_hari: true })).toMatchObject({ umurHari: 9, lewatBatas: true })
    expect(umur(9 * HARI, 'menunggu', { umur_hari: 1, lewat_7_hari: false })).toMatchObject({ umurHari: 1, lewatBatas: false })
    expect(umur(9 * HARI, 'selesai', { lewat_7_hari: true }).lewatBatas).toBe(false)
  })

  it('isi: angka 0 dan null dilewati; isi tak dikirim → null; nilai asing jadi null', () => {
    const p = kePermintaanHapus(baris({ isi: { ...ISI, buku_milik: 0, transaksi_milik: '', foto: null, transaksi_pindah: 0 }, lewat: 'faks', status: 'aneh', nama: '  ' }), KINI)
    expect(p).toMatchObject({ lewat: null, status: null, nama: null })
    expect(bagianIsi(p.isi)).toEqual([{ kunci: 'ruangAnggota', n: 1 }])
    expect(kePermintaanHapus(baris({ isi: null }), KINI).isi).toBeNull()
    expect(bagianIsi(null)).toEqual([])
    expect(bagianIsi(keIsiHapus({ buku_milik: 0, buku_anggota: 0, transaksi_milik: 0, transaksi_pindah: 0, foto: 0, tertahan: false }))).toEqual([])
    expect(bagianIsi(keIsiHapus(ISI)).map(b => b.kunci)).toEqual([...BAGIAN_ISI])
  })

  it('blokir masuk yang belum pasti (jalur edge) ditandai selama menunggu', () => {
    expect(kePermintaanHapus(baris({ blokir: 'edge', blokir_pada: null }), KINI).blokirTertunda).toBe(true)
    expect(kePermintaanHapus(baris({ blokir: 'gagal', blokir_pada: null }), KINI).blokirTertunda).toBe(true)
    expect(kePermintaanHapus(baris({ blokir: 'edge', blokir_pada: new Date(KINI).toISOString() }), KINI).blokirTertunda).toBe(false)
    expect(kePermintaanHapus(baris({ status: 'selesai', selesai_pada: new Date(KINI).toISOString(), blokir_pada: null }), KINI).blokirTertunda).toBe(false)
  })

  it('sesudah hapus permanen tidak ada tautan Pengguna 360; foto mengikuti antrean penyapu', () => {
    const selesai = (menunggu: number, gagal: number) =>
      kePermintaanHapus(baris({ status: 'selesai', selesai_pada: new Date(KINI).toISOString(), oleh: 'adm@contoh.id', foto_menunggu: menunggu, foto_gagal: String(gagal) }), KINI)
    expect(selesai(0, 0)).toMatchObject({ ke360: null, keadaanFoto: 'bersih', oleh: 'adm@contoh.id' })
    expect(selesai(3, 0)).toMatchObject({ keadaanFoto: 'menunggu', fotoMenunggu: 3 })
    expect(selesai(3, 1)).toMatchObject({ keadaanFoto: 'gagal', fotoGagal: 1 })
    expect(kePermintaanHapus(baris({ status: 'dibatalkan', dibatalkan_pada: new Date(KINI).toISOString() }), KINI))
      .toMatchObject({ ke360: `/console/cashflow/pengguna/${U1}`, keadaanFoto: 'tersimpan', dibatalkanIso: new Date(KINI).toISOString() })
    expect(keadaanFoto('menunggu', 5, 5)).toBe('tersimpan')
  })

  it('jawaban daftar: baris, jumlah per status, id yang menunggu', () => {
    const d = daftarDTO([baris(), baris({ id: ID2, user_id: U2, status: 'selesai' })])
    expect(barisHapus(d)).toHaveLength(2)
    expect(barisHapus(null)).toEqual([])
    expect(barisHapus({ ...d, baris: null })).toEqual([])
    expect(jumlahPerStatus(d)).toEqual({ menunggu: 2, selesai: 3, dibatalkan: 0 })
    expect(jumlahPerStatus({ ...d, jumlah: null })).toBeNull()
    expect([...idMenungguHapus(d)]).toEqual([U1])
  })
})

describe('urutPermintaan', () => {
  const a = kePermintaanHapus(baris({ id: ID1, diminta_pada: '2026-10-01T00:00:00Z', selesai_pada: '2026-10-10T00:00:00Z', dibatalkan_pada: '2026-10-03T00:00:00Z' }), KINI)
  const b = kePermintaanHapus(baris({ id: ID2, diminta_pada: '2026-10-05T00:00:00Z', selesai_pada: '2026-10-06T00:00:00Z', dibatalkan_pada: '2026-10-02T00:00:00Z' }), KINI)
  it('menunggu: paling lama dulu; selesai: terbaru dihapus dulu; dibatalkan: terbaru dibatalkan dulu', () => {
    expect(urutPermintaan([b, a], 'menunggu').map(p => p.id)).toEqual([ID1, ID2])
    expect(urutPermintaan([b, a], 'selesai').map(p => p.id)).toEqual([ID1, ID2])
    expect(urutPermintaan([b, a], 'dibatalkan').map(p => p.id)).toEqual([ID1, ID2])
  })
})

describe('tombol per izin (keputusan P3: hanya cashflow:tindak)', () => {
  const sah = { mfa: true, mfa_at: new Date(KINI - 3_600_000).toISOString(), totp_enabled_at: new Date(KINI - 72 * 3_600_000).toISOString() }
  const tindak = (bukti: Parameters<typeof izinSesiCashflow>[1]) => izinSesiCashflow('super_admin', bukti, KINI).includes('cashflow:tindak')

  it('super admin ber-TOTP: kedua tombol aktif', () => {
    expect(aksiPermintaan({ status: 'menunggu' }, tindak(sah))).toEqual({ tampil: true, aktif: true, sebab: null })
  })
  it('login tanpa TOTP (hanya cashflow:view): tombol tampil tapi mati, sebabnya izin', () => {
    expect(tindak({ mfa: false })).toBe(false)
    expect(aksiPermintaan({ status: 'menunggu' }, tindak({ mfa: false }))).toEqual({ tampil: true, aktif: false, sebab: 'izin' })
  })
  it('selesai, dibatalkan, atau status asing: tanpa tombol, apa pun izinnya', () => {
    for (const status of ['selesai', 'dibatalkan', null] as const) {
      expect(aksiPermintaan({ status }, true)).toEqual({ tampil: false, aktif: false, sebab: null })
    }
  })
})

/* Jawaban PostgREST v12 yang sebenarnya, disalin dari wadah lokal
   (postgres 16 + postgrest v12.2.12): RPC yang belum ada, RPC yang hilang
   sesudah cache skema dimuat, dan fungsi di DALAM RPC yang hilang. */
const PETUNJUK_42883 = 'No function matches the given name and argument types. You might need to add explicit type casts.'
const BELUM_ADA = { code: 'PGRST202', hint: null, message: 'Could not find the function public.admin_hapus_akun_daftar(p_batas, p_status) in the schema cache' }
const CACHE_BASI = { code: '42883', hint: PETUNJUK_42883, message: 'function public.admin_hapus_akun_daftar(p_status => text, p_batas => integer) does not exist' }
const DALAM_HILANG = { code: '42883', hint: PETUNJUK_42883, message: 'function public.hapus_foto_milik(uuid) does not exist' }

describe('galat: RPC yang belum ada = fitur belum aktif, P0001 dijelaskan', () => {
  it('PGRST202 → belum-aktif (console boleh tayang sebelum 0112)', () => {
    expect(petakanGalat(BELUM_ADA).jenis).toBe('belum-aktif')
    expect(petakanGalat(BELUM_ADA, 'admin_hapus_akun_daftar').jenis).toBe('belum-aktif')
    expect(jenisGagalHapus(petakanGalat(BELUM_ADA))).toBe('belum-aktif')
  })
  it('42883 belum-aktif HANYA bila yang hilang RPC yang dipanggil itu sendiri (cache skema basi)', () => {
    expect(petakanGalat(CACHE_BASI, 'admin_hapus_akun_daftar').jenis).toBe('belum-aktif')
    // Tanpa nama RPC, atau nama lain: tidak bisa dipastikan RPC-nya yang belum ada.
    expect(petakanGalat(CACHE_BASI).jenis).toBe('lain')
    expect(petakanGalat(CACHE_BASI, 'admin_hapus_akun_permanen').jenis).toBe('lain')
    expect(petakanGalat({ ...CACHE_BASI, message: 'function public.admin_hapus_akun_daftar_v2(text) does not exist' }, 'admin_hapus_akun_daftar').jenis).toBe('lain')
    expect(petakanGalat({ code: '42883' }, 'admin_hapus_akun_daftar').jenis).toBe('lain')
  })
  it('fungsi di dalam RPC yang hilang (0112 terpasang tapi rusak) → lain, kalimat Postgres-nya terbaca', () => {
    for (const n of ['admin_hapus_akun_daftar', 'admin_hapus_akun_permanen', 'admin_hapus_akun_batalkan']) {
      const g = petakanGalat(DALAM_HILANG, n)
      expect(g, n).toMatchObject({ jenis: 'lain', message: DALAM_HILANG.message })
      expect(jenisGagalHapus(g), n).toBe('lain')
    }
    expect(useCashflowMuat().pesanUntuk(petakanGalat(DALAM_HILANG, 'admin_hapus_akun_permanen'))).toBe(DALAM_HILANG.message)
  })
  it('P0001 alihkan-kepemilikan → tertahan; 42501 izin-kurang → izin; lainnya → lain', () => {
    expect(jenisGagalHapus(petakanGalat({ code: 'P0001', hint: 'alihkan-kepemilikan', message: 'Masih ada 1 catatan bersama…' }))).toBe('tertahan')
    expect(jenisGagalHapus(petakanGalat({ code: '42501', hint: 'izin-kurang' }))).toBe('izin')
    expect(jenisGagalHapus(petakanGalat({ code: 'P0001', hint: 'lain' }))).toBe('lain')
    expect(jenisGagalHapus(petakanGalat(new TypeError('Failed to fetch')))).toBe('lain')
  })
  it('aksi gagal tanpa kepastian (jaringan, galat lain) → daftar dimuat ulang; penolakan yang jelas tidak', () => {
    // Server mungkin sudah commit sebelum jawabannya hilang: kartunya harus menunjukkan keadaan sebenarnya.
    expect(muatUlangSesudahGagal(petakanGalat(new TypeError('Failed to fetch')))).toBe(true)
    expect(muatUlangSesudahGagal(petakanGalat({ code: '23503', message: 'update or delete on table "users" violates foreign key constraint' }))).toBe(true)
    expect(muatUlangSesudahGagal(petakanGalat(DALAM_HILANG, 'admin_hapus_akun_permanen'))).toBe(true)
    // Ditolak sebelum apa pun berubah, atau halaman sudah punya jawabannya sendiri.
    expect(muatUlangSesudahGagal(petakanGalat({ code: 'P0001', hint: 'alihkan-kepemilikan', message: 'Masih ada…' }))).toBe(false)
    expect(muatUlangSesudahGagal(petakanGalat({ code: '42501', hint: 'izin-kurang' }))).toBe(false)
    expect(muatUlangSesudahGagal(petakanGalat({ code: '42501', hint: 'sesi-konsol' }))).toBe(false)
    expect(muatUlangSesudahGagal(petakanGalat({ code: '42501' }))).toBe(false)
    expect(muatUlangSesudahGagal(petakanGalat({ code: '22023', hint: 'alasan' }))).toBe(false)
    expect(muatUlangSesudahGagal(petakanGalat(BELUM_ADA))).toBe(false)
  })
  it('kalimatnya bahasa awam dari kamus, bukan kalimat mentah server', () => {
    const { pesanUntuk } = useCashflowMuat()
    expect(pesanUntuk(petakanGalat(BELUM_ADA))).toBe('galat.belumAktif')
    expect(pesanUntuk(petakanGalat(CACHE_BASI, 'admin_hapus_akun_daftar'))).toBe('galat.belumAktif')
    expect(pesanUntuk(petakanGalat({ code: 'P0001', hint: 'alihkan-kepemilikan', message: 'Masih ada 1 catatan bersama…' }))).toBe('galat.alihkanKepemilikan')
    expect(pesanUntuk(petakanGalat({ code: '42501', hint: 'izin-kurang' }))).toBe('galat.izinKurang')
  })
})

describe('argumen RPC (klien Supabase tiruan)', () => {
  it('daftar: status + batas bawaan server', async () => {
    await useCashflowAdmin().hapusAkunDaftar()
    expect(panggilan.at(-1)).toEqual({ nama: 'admin_hapus_akun_daftar', a: { p_status: 'menunggu', p_batas: BATAS_DAFTAR_HAPUS } })
    await useCashflowAdmin().hapusAkunDaftar('dibatalkan')
    expect(panggilan.at(-1)!.a).toEqual({ p_status: 'dibatalkan', p_batas: 100 })
  })
  it('hapus permanen dan batalkan: alasan OTOMATIS menamai tindakannya, berawalan pelaku', async () => {
    jawaban = { data: { status: 'selesai', permintaan: ID1, user_id: U1, sudah_tiada: false, foto_antre: 12 }, error: null }
    expect(keHasilHapus(await useCashflowAdmin().hapusAkunPermanen(ID1))).toBe('dihapus')
    expect(panggilan.at(-1)).toEqual({
      nama: 'admin_hapus_akun_permanen',
      a: { p_permintaan: ID1, p_alasan: `[staf@contoh.id] ${alasanHapusOtomatis(ID1)}` },
    })
    jawaban = { data: { status: 'sudah_selesai', permintaan: ID2, user_id: U2 }, error: null }
    expect(keHasilHapus(await useCashflowAdmin().hapusAkunBatalkan(ID2))).toBe('sudah_selesai')
    expect(panggilan.at(-1)).toEqual({
      nama: 'admin_hapus_akun_batalkan',
      a: { p_permintaan: ID2, p_alasan: `[staf@contoh.id] ${alasanBatalOtomatis(ID2)}` },
    })
    expect(alasanHapusOtomatis(ID1)).not.toBe(alasanBatalOtomatis(ID1))
    expect(alasanHapusOtomatis(ID1)).toContain(ID1)
  })
  it('galat server sampai ke halaman sebagai GalatAdmin berjenis', async () => {
    jawaban = { data: null, error: BELUM_ADA }
    await expect(useCashflowAdmin().hapusAkunDaftar()).rejects.toMatchObject({ jenis: 'belum-aktif' })
    // rpc() memberi tahu petakanGalat nama RPC yang dipanggil.
    jawaban = { data: null, error: CACHE_BASI }
    await expect(useCashflowAdmin().hapusAkunDaftar()).rejects.toMatchObject({ jenis: 'belum-aktif' })
    jawaban = { data: null, error: DALAM_HILANG }
    await expect(useCashflowAdmin().hapusAkunDaftar()).rejects.toMatchObject({ jenis: 'lain', message: DALAM_HILANG.message })
    await expect(useCashflowAdmin().hapusAkunPermanen(ID1)).rejects.toMatchObject({ jenis: 'lain', message: DALAM_HILANG.message })
    // Nama RPC lain yang kebetulan hilang di dalam: bukan RPC ini → lain.
    jawaban = { data: null, error: CACHE_BASI }
    await expect(useCashflowAdmin().hapusAkunBatalkan(ID1)).rejects.toMatchObject({ jenis: 'lain' })
    jawaban = { data: null, error: { code: 'P0001', hint: 'alihkan-kepemilikan', message: 'Masih ada…' } }
    const g = await useCashflowAdmin().hapusAkunPermanen(ID1).catch((e: unknown) => e)
    expect(g).toBeInstanceOf(GalatAdmin)
    expect(jenisGagalHapus(g as InstanceType<typeof GalatAdmin>)).toBe('tertahan')
  })
  it('jawaban aksi: status server → kalimat; sudah_tiada dibedakan; sisanya "lain"', () => {
    expect(keHasilHapus({ status: 'selesai', permintaan: ID1, sudah_tiada: false })).toBe('dihapus')
    expect(keHasilHapus({ status: 'selesai', permintaan: ID1, sudah_tiada: true })).toBe('sudah_tiada')
    for (const st of ['dibatalkan', 'sudah_selesai', 'sudah_dibatalkan', 'tidak_ada'] as const) {
      expect(keHasilHapus({ status: st, permintaan: ID1 })).toBe(st)
    }
    for (const st of STATUS_JAWAB) expect([...HASIL_HAPUS, 'lain']).toContain(keHasilHapus({ status: st, permintaan: ID1 }))
    // Pembatalan lewat jalur cadangan: blokirnya dibuka fungsi edge, belum pasti.
    expect(keHasilHapus({ status: 'dibatalkan', permintaan: ID1, buka_blokir: 'edge' })).toBe('dibatalkan_tertunda')
    expect(keHasilHapus({ status: 'dibatalkan', permintaan: ID1, buka_blokir: 'sql' })).toBe('dibatalkan')
    expect(keHasilHapus({ status: 'sudah_dibatalkan', permintaan: ID1, buka_blokir: 'edge' })).toBe('sudah_dibatalkan')
    // Akunnya sudah terhapus lewat jalur lain: tidak ada blokir yang dibuka (buka_blokir null).
    expect(keHasilHapus({ status: 'dibatalkan', permintaan: ID1, user_id: U1, buka_blokir: null })).toBe('dibatalkan_tiada')
    expect([...HASIL_BERHASIL].sort()).toEqual(['dibatalkan', 'dibatalkan_tertunda', 'dihapus'])
    expect(keHasilHapus({ status: 'aneh' })).toBe('lain')
    expect(keHasilHapus({ hasil: 'dihapus' })).toBe('lain')
    expect(keHasilHapus(null)).toBe('lain')
    expect(keHasilHapus('selesai')).toBe('lain')
  })
})

describe('daftar pengguna: "Menunggu dihapus" menggantikan "Ditangguhkan"', () => {
  const pengguna = (id: string, banned: string | null): PenggunaDTO => ({
    user_id: id, email: 'x***@contoh.id', display_name: null, created_at: '2026-09-01T00:00:00Z', last_sign_in: null,
    banned_until: banned, jumlah_ruang: null, jumlah_tx: null, total_semua: 2,
  })
  it('akun berpermintaan menunggu → menunggu_hapus walau ber-ban; akun ber-ban lain tetap ditangguhkan', () => {
    const tunggu = idMenungguHapus(daftarDTO([baris({ user_id: U1 }), baris({ id: ID2, user_id: U2, status: 'selesai' })]))
    expect([...tunggu]).toEqual([U1])
    const nanti = '2126-01-01T00:00:00Z'
    expect(kePengguna(pengguna(U1, nanti), 'id', tunggu).status).toBe('menunggu_hapus')
    expect(kePengguna(pengguna(U2, nanti), 'id', tunggu).status).toBe('ditangguhkan')
    expect(kePengguna(pengguna(U2, null), 'id', tunggu).status).toBe('aktif')
    expect(kePengguna(pengguna(U1, nanti)).status).toBe('ditangguhkan')
  })
  it('tidak ada .map(kePengguna): map meneruskan larik ke parameter menungguHapus', () => {
    for (const f of ['composables/cashflow/useCashflowIndeks.ts', 'pages/console/cashflow/pengguna/index.vue']) {
      expect(baca(f), f).not.toMatch(/\.map\(kePengguna\)/)
    }
  })
  it('halaman daftar memuat permintaan menunggu terpisah, gagalnya tidak menutup daftar', () => {
    const f = baca('pages/console/cashflow/pengguna/index.vue')
    expect(f).toMatch(/api\.hapusAkunDaftar\('menunggu', BATAS_BADGE_HAPUS\)\.then\(\(r\) => \{ menungguHapus\.value = idMenungguHapus\(r\) \}\)\.catch\(\(\) => \{\}\)/)
    expect(BATAS_BADGE_HAPUS).toBeLessThanOrEqual(500)
    expect(f).toMatch(/kePengguna\(d, bahasa\.value, menungguHapus\.value\)/)
    expect(f).toMatch(/if \(q\.value\.seg === 'ditangguhkan'\) return p\.status === 'ditangguhkan'/)
    expect(f).toMatch(/tcf\('pengguna\.menungguHapus'\)/)
  })
})

describe('saringan status tidak membuang ?lang (useCashflowQuery)', () => {
  it('setel mempertahankan ?lang=en dan tetap membuang kunci di luar skema', async () => {
    const route = { path: '/console/cashflow/hapus-akun', query: { status: 'menunggu', lang: 'en', asing: 'x' } as Record<string, unknown> }
    const replace = vi.fn(async () => {})
    vi.stubGlobal('useRoute', () => route)
    vi.stubGlobal('useRouter', () => ({ replace, push: vi.fn() }))
    const { useCashflowQuery } = await import('~/composables/cashflow/useCashflowQuery')
    const { setel } = useCashflowQuery({ status: { jenis: 'pilihan', opsi: STATUS_HAPUS, bawaan: 'menunggu' } } as const)
    await setel({ status: 'dibatalkan' })
    expect(replace).toHaveBeenLastCalledWith({ path: route.path, query: { status: 'dibatalkan', lang: 'en' } })
    route.query = { status: 'dibatalkan' }
    await setel({ status: 'selesai' })
    expect(replace).toHaveBeenLastCalledWith({ path: route.path, query: { status: 'selesai' } })
    vi.stubGlobal('useRoute', () => ({ fullPath: '/console/cashflow/hapus-akun' }))
  })
})

describe('kamus ID dan EN', () => {
  const ambil = (bahasa: 'id' | 'en', jalur: string): unknown =>
    jalur.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), KAMUS_CASHFLOW[bahasa])
  it('kunci dinamis halaman ini ada di kedua bahasa dengan bentuk yang benar', () => {
    const teks = [
      ...STATUS_HAPUS.map(s => `hapusAkun.status.${s}`),
      ...STATUS_HAPUS.map(s => `hapusAkun.kosong.${s}`),
      ...LEWAT_HAPUS.map(l => `hapusAkun.lewat.${l}`),
      ...[...HASIL_HAPUS, 'lain'].map(h => `hapusAkun.hasil.${h}`),
      'hapusAkun.foto.tersimpan', 'hapusAkun.foto.bersih',
      'nav.hapusAkun', 'pengguna.menungguHapus', 'galat.belumAktif', 'galat.alihkanKepemilikan',
      'hapusAkun.isiKosong', 'hapusAkun.blokirTertunda',
    ]
    const fungsi = [
      ...BAGIAN_ISI.map(k => `hapusAkun.isi.${k}`), 'hapusAkun.foto.menunggu', 'hapusAkun.foto.gagal', 'hapusAkun.umur', 'hapusAkun.diminta',
      'hapusAkun.dihapusPada', 'hapusAkun.dibatalkanPada', 'hapusAkun.oleh', 'hapusAkun.isiSaatDihapus', 'hapusAkun.terpotong',
    ]
    const salah = [
      ...teks.flatMap(k => (['id', 'en'] as const).filter(b => typeof ambil(b, k) !== 'string').map(b => `${b}:${k}`)),
      ...fungsi.flatMap(k => (['id', 'en'] as const).filter(b => typeof ambil(b, k) !== 'function').map(b => `${b}:${k}`)),
    ]
    expect(salah).toEqual([])
  })
  it('kalimat satu baris tanpa kata "admin_" atau kode galat mentah', () => {
    for (const b of ['id', 'en'] as const) {
      for (const k of ['izinTindak', 'belumAktif', 'tertahan', 'konfirmasiKet', 'konfirmasiPindah', 'blokirTertunda']) {
        const t = ambil(b, `hapusAkun.${k}`) as string
        expect(t, `${b}:${k}`).not.toMatch(/admin_|P0001|42883|\n/)
        expect(t.length, `${b}:${k}`).toBeLessThan(160)
      }
    }
    // Kalimat "bisa masuk lagi" hanya untuk pembatalan yang benar-benar membuka blokirnya.
    for (const k of ['dibatalkan_tertunda', 'dibatalkan_tiada']) {
      expect(ambil('id', `hapusAkun.hasil.${k}`), k).not.toMatch(/bisa masuk lagi/)
      expect(ambil('en', `hapusAkun.hasil.${k}`), k).not.toMatch(/can sign in again/)
    }
    expect(ambil('id', 'hapusAkun.hasil.dibatalkan_tiada')).toMatch(/sudah tidak ada/)
    // "sudah_*" juga terjadi pada admin yang sama (dua tab, menekan ulang sesudah jawaban hilang).
    for (const k of ['sudah_selesai', 'sudah_dibatalkan']) {
      expect(ambil('id', `hapusAkun.hasil.${k}`), k).not.toMatch(/admin lain/i)
      expect(ambil('en', `hapusAkun.hasil.${k}`), k).not.toMatch(/another admin/i)
    }
    const umur = ambil('id', 'hapusAkun.umur') as (n: number) => string
    expect(umur(0)).toBe('Hari ini')
    expect(umur(9)).toBe('Menunggu 9 hari')
    expect((ambil('en', 'hapusAkun.umur') as (n: number) => string)(1)).toBe('Waiting 1 day')
  })
})

describe('penjaga halaman (keputusan P3: satu konfirmasi, tanpa kolom alasan)', () => {
  const HAL = 'pages/console/cashflow/hapus-akun.vue'
  const KARTU = 'components/cashflow/CashflowHapusAkunKartu.vue'
  const KONF = 'components/cashflow/CashflowHapusAkunKonfirmasi.vue'
  it('berkas ada; komponen berawalan nama berkas (pathPrefix:false)', () => {
    for (const f of [HAL, KARTU, KONF, 'adapters/cashflowHapusAkun.ts']) expect(existsSync(join(AKAR, f)), f).toBe(true)
    expect(baca(HAL)).toMatch(/<CashflowHapusAkunKartu\b/)
    expect(baca(HAL)).toMatch(/<CashflowHapusAkunKonfirmasi\b/)
  })
  it('satu ConsoleModal (di konfirmasi), tanpa textarea atau isian alasan di mana pun', () => {
    expect(baca(KONF).match(/<ConsoleModal\b/g)).toHaveLength(1)
    for (const f of [HAL, KARTU, KONF]) {
      expect(baca(f), f).not.toMatch(/<textarea\b|<input\b|v-model/)
    }
    expect(baca(HAL)).not.toMatch(/<ConsoleModal\b/)
    expect(baca(KARTU)).not.toMatch(/<ConsoleModal\b/)
  })
  it('aksi gagal tanpa kepastian tetap memuat ulang daftar (muatUlangSesudahGagal)', () => {
    const hal = baca(HAL)
    expect(hal).toMatch(/if \(muatUlangSesudahGagal\(g\)\) muatUlang = true/)
    expect(hal).toMatch(/if \(!ok\) \{\s+if \(muatUlang\) await muatDaftar\(\)\s+return\s+\}/)
  })
  it('toast sukses hanya untuk aksi yang benar-benar dikerjakan sekarang (HASIL_BERHASIL)', () => {
    expect(baca(HAL)).toMatch(/if \(jawab\.hasil !== 'lain' && HASIL_BERHASIL\.includes\(jawab\.hasil\)\) toast\.success\(kalimat\)\s+else toast\.info\(kalimat\)/)
  })
  it('Batalkan dikonfirmasi sebaris di kartu; Hapus permanen lewat konfirmasi halaman', () => {
    const kartu = baca(KARTU)
    expect(kartu).toMatch(/@click="tanyaBatal = true"/)
    expect(kartu).toMatch(/tcf\('hapusAkun\.batalTanya'\)/)
    expect(kartu).toMatch(/@click="emit\('hapus'\)"/)
    const hal = baca(HAL)
    expect(hal).toMatch(/@hapus="mintaHapus\(p\)"/)
    expect(hal).toMatch(/@setuju="setujuHapus"/)
  })
  it('izin tindak dari sesi; izin-kurang lewat CashflowIzinKurang; RPC belum ada = fitur belum aktif', () => {
    const hal = baca(HAL)
    expect(hal).toMatch(/sesi\.boleh\('cashflow:tindak'\)/)
    expect(hal).toMatch(/<CashflowIzinKurang v-if="tampilIzin" :pesan="tcf\('hapusAkun\.izinTindak'\)" \/>/)
    expect(hal).toMatch(/galat\.value\?\.jenis === 'belum-aktif'/)
    expect(hal).toMatch(/tcf\('hapusAkun\.belumAktif'\)/)
  })
  it('alasan otomatis di useCashflowAdmin, bukan masukan orang', () => {
    const admin = baca('composables/cashflow/useCashflowAdmin.ts')
    expect(admin).toMatch(/'admin_hapus_akun_permanen', \{ p_permintaan: permintaan, p_alasan: alasanHapusOtomatis\(permintaan\) \}/)
    expect(admin).toMatch(/'admin_hapus_akun_batalkan', \{ p_permintaan: permintaan, p_alasan: alasanBatalOtomatis\(permintaan\) \}/)
  })
  it('entri nav dan palet menuju halaman ini', () => {
    expect(baca('components/cashflow/CashflowNav.vue')).toMatch(/\{ kunci: 'hapusAkun', to: '\/console\/cashflow\/hapus-akun' \}/)
    expect(baca('components/cashflow/CashflowPalet.vue')).toMatch(/\{ kunci: 'hapusAkun', ke: '\/console\/cashflow\/hapus-akun'/)
  })
  it('repo publik: berkas baru tanpa jalur lokal, email nyata, atau angka produksi', () => {
    for (const f of [HAL, KARTU, KONF, 'adapters/cashflowHapusAkun.ts', 'tests/cashflow/hapus-akun.test.ts', 'tests/cashflow/kontrak-0112.test.ts']) {
      const isi = baca(f)
      expect(isi, f).not.toMatch(/\/Users\/|@gmail\.|@coreasia\.id/)
    }
  })
})
