/**
 * Halaman Hapus akun (0112): adapter, tombol per izin, galat 42883 dan P0001,
 * argumen RPC, kamus, dan kontrak terhadap migrasi.
 *
 * Kontrak DTO dibandingkan dengan definisi TERAKHIR fungsinya di migrasi
 * (tests/cashflow/migrasi.ts). Sebelum 0112 ada di folder migrasi, bagian itu
 * DILEWATI dan terlihat "skipped"; halaman sendiri tetap aman karena 42883 /
 * PGRST202 dibaca sebagai "fitur belum aktif".
 *
 * Semua id dan email di sini karangan.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { computed, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  aksiPermintaan, alasanBatalOtomatis, alasanHapusOtomatis, bagianIsi, BAGIAN_ISI, BATAS_DAFTAR_HAPUS, HASIL_HAPUS,
  idMenungguHapus, jenisGagalHapus, keadaanFoto, keHasilHapus, kePermintaanHapus, LEWAT_HAPUS, STATUS_HAPUS, urutPermintaan,
  type HapusAkunDTO, type HasilHapusDTO,
} from '../../adapters/cashflowHapusAkun'
import { kePengguna, type PenggunaDTO } from '../../adapters/cashflow'
import { izinSesiCashflow } from '../../utils/rbac'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'
import { adaMigrasiNomor, fungsiTerakhir, kolomKembalian, parameterFungsi, semuaPohonJsonb } from './migrasi'

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

/** Contoh jawaban satu baris admin_hapus_akun_daftar (bigint bisa pulang sebagai string). */
const baris = (lain: Partial<HapusAkunDTO> = {}): HapusAkunDTO => ({
  id: ID1, user_id: U1, email_samar: 'bud***@contoh.id', nama: 'Budi', diminta_pada: new Date(KINI - 2 * HARI).toISOString(),
  lewat: 'aplikasi', status: 'menunggu', selesai_pada: null,
  jumlah_buku_milik: 2, jumlah_buku_anggota: 1, jumlah_transaksi: '340', jumlah_foto: 12,
  tertahan: false, foto_menunggu: 0, foto_gagal: 0, ...lain,
})

beforeEach(() => {
  panggilan.length = 0
  jawaban = { data: [], error: null }
})

describe('kePermintaanHapus', () => {
  it('memetakan baris server; angka string terbaca, email tetap tersamar', () => {
    const p = kePermintaanHapus(baris(), KINI)
    expect(p).toMatchObject({
      id: ID1, userId: U1, emailTersamar: 'bud***@contoh.id', nama: 'Budi', status: 'menunggu', lewat: 'aplikasi',
      umurHari: 2, lewatBatas: false, bukuMilik: 2, bukuAnggota: 1, transaksi: 340, foto: 12, tertahan: false,
      keadaanFoto: 'tersimpan', ke360: `/console/cashflow/pengguna/${U1}`,
    })
    // Sabuk kedua: email utuh yang lolos dari server tetap disamarkan di sini.
    expect(kePermintaanHapus(baris({ email_samar: 'budiman@contoh.id' }), KINI).emailTersamar).toBe('bud***@contoh.id')
    expect(kePermintaanHapus(baris({ email_samar: null }), KINI).emailTersamar).toBe('—')
  })

  it('merah hanya untuk yang MENUNGGU lebih dari 7 hari', () => {
    const umur = (ms: number, status = 'menunggu') =>
      kePermintaanHapus(baris({ diminta_pada: new Date(KINI - ms).toISOString(), status }), KINI)
    expect(umur(7 * HARI)).toMatchObject({ umurHari: 7, lewatBatas: false })
    expect(umur(7 * HARI + 1000)).toMatchObject({ umurHari: 7, lewatBatas: true })
    expect(umur(30 * HARI, 'selesai').lewatBatas).toBe(false)
    expect(umur(30 * HARI, 'dibatalkan').lewatBatas).toBe(false)
    expect(umur(0).umurHari).toBe(0)
  })

  it('hitungan yang ditahan server tetap null, bukan 0; nilai asing jadi null', () => {
    const p = kePermintaanHapus(baris({ jumlah_buku_milik: null, jumlah_transaksi: '', jumlah_foto: null, lewat: 'faks', status: 'aneh', nama: '  ' }), KINI)
    expect(p).toMatchObject({ bukuMilik: null, transaksi: null, foto: null, lewat: null, status: null, nama: null })
    expect(bagianIsi(p)).toEqual([{ kunci: 'ruangAnggota', n: 1 }])
    expect(bagianIsi({ bukuMilik: null, bukuAnggota: null, transaksi: null, foto: null })).toEqual([])
  })

  it('sesudah hapus permanen tidak ada tautan Pengguna 360; foto mengikuti antrean penyapu', () => {
    const selesai = (menunggu: number, gagal: number) =>
      kePermintaanHapus(baris({ status: 'selesai', selesai_pada: new Date(KINI).toISOString(), foto_menunggu: menunggu, foto_gagal: String(gagal) }), KINI)
    expect(selesai(0, 0)).toMatchObject({ ke360: null, keadaanFoto: 'bersih' })
    expect(selesai(3, 0)).toMatchObject({ keadaanFoto: 'menunggu', fotoMenunggu: 3 })
    expect(selesai(3, 1)).toMatchObject({ keadaanFoto: 'gagal', fotoGagal: 1 })
    expect(kePermintaanHapus(baris({ status: 'dibatalkan' }), KINI)).toMatchObject({ ke360: `/console/cashflow/pengguna/${U1}`, keadaanFoto: 'tersimpan' })
    expect(keadaanFoto('menunggu', 5, 5)).toBe('tersimpan')
  })
})

describe('urutPermintaan', () => {
  const a = kePermintaanHapus(baris({ id: ID1, diminta_pada: '2026-10-01T00:00:00Z', selesai_pada: '2026-10-10T00:00:00Z' }), KINI)
  const b = kePermintaanHapus(baris({ id: ID2, diminta_pada: '2026-10-05T00:00:00Z', selesai_pada: '2026-10-06T00:00:00Z' }), KINI)
  it('menunggu: paling lama dulu; selesai: terbaru dihapus dulu; dibatalkan: terbaru diminta dulu', () => {
    expect(urutPermintaan([b, a], 'menunggu').map(p => p.id)).toEqual([ID1, ID2])
    expect(urutPermintaan([b, a], 'selesai').map(p => p.id)).toEqual([ID1, ID2])
    expect(urutPermintaan([a, b], 'dibatalkan').map(p => p.id)).toEqual([ID2, ID1])
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

describe('galat: 42883 fitur belum aktif, P0001 dijelaskan', () => {
  it('42883 dan PGRST202 → belum-aktif (console boleh tayang sebelum 0112)', () => {
    expect(petakanGalat({ code: '42883', message: 'function public.admin_hapus_akun_daftar(text, integer) does not exist' }).jenis).toBe('belum-aktif')
    expect(petakanGalat({ code: 'PGRST202', message: 'Could not find the function' }).jenis).toBe('belum-aktif')
    expect(jenisGagalHapus(petakanGalat({ code: '42883' }))).toBe('belum-aktif')
  })
  it('P0001 alihkan-kepemilikan → tertahan; 42501 izin-kurang → izin; lainnya → lain', () => {
    expect(jenisGagalHapus(petakanGalat({ code: 'P0001', hint: 'alihkan-kepemilikan', message: 'Masih ada 1 catatan bersama…' }))).toBe('tertahan')
    expect(jenisGagalHapus(petakanGalat({ code: '42501', hint: 'izin-kurang' }))).toBe('izin')
    expect(jenisGagalHapus(petakanGalat({ code: 'P0001', hint: 'lain' }))).toBe('lain')
    expect(jenisGagalHapus(petakanGalat(new TypeError('Failed to fetch')))).toBe('lain')
  })
  it('kalimatnya bahasa awam dari kamus, bukan kalimat mentah server', () => {
    const { pesanUntuk } = useCashflowMuat()
    expect(pesanUntuk(petakanGalat({ code: '42883' }))).toBe('galat.belumAktif')
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
    jawaban = { data: { hasil: 'dihapus', permintaan: ID1 }, error: null }
    expect(keHasilHapus(await useCashflowAdmin().hapusAkunPermanen(ID1))).toBe('dihapus')
    expect(panggilan.at(-1)).toEqual({
      nama: 'admin_hapus_akun_permanen',
      a: { p_permintaan: ID1, p_alasan: `[staf@contoh.id] ${alasanHapusOtomatis(ID1)}` },
    })
    jawaban = { data: { hasil: 'sudah_selesai', permintaan: ID2 }, error: null }
    expect(keHasilHapus(await useCashflowAdmin().hapusAkunBatalkan(ID2))).toBe('sudah_selesai')
    expect(panggilan.at(-1)).toEqual({
      nama: 'admin_hapus_akun_batalkan',
      a: { p_permintaan: ID2, p_alasan: `[staf@contoh.id] ${alasanBatalOtomatis(ID2)}` },
    })
    expect(alasanHapusOtomatis(ID1)).not.toBe(alasanBatalOtomatis(ID1))
    expect(alasanHapusOtomatis(ID1)).toContain(ID1)
  })
  it('galat server sampai ke halaman sebagai GalatAdmin berjenis', async () => {
    jawaban = { data: null, error: { code: '42883', message: 'function does not exist' } }
    await expect(useCashflowAdmin().hapusAkunDaftar()).rejects.toMatchObject({ jenis: 'belum-aktif' })
    jawaban = { data: null, error: { code: 'P0001', hint: 'alihkan-kepemilikan', message: 'Masih ada…' } }
    const g = await useCashflowAdmin().hapusAkunPermanen(ID1).catch((e: unknown) => e)
    expect(g).toBeInstanceOf(GalatAdmin)
    expect(jenisGagalHapus(g as InstanceType<typeof GalatAdmin>)).toBe('tertahan')
  })
  it('jawaban aksi: nilai dikenal, sisanya "lain"', () => {
    for (const h of HASIL_HAPUS) expect(keHasilHapus({ hasil: h, permintaan: ID1 })).toBe(h)
    expect(keHasilHapus({ hasil: 'aneh' })).toBe('lain')
    expect(keHasilHapus(null)).toBe('lain')
    expect(keHasilHapus('dihapus')).toBe('lain')
  })
})

describe('daftar pengguna: "Menunggu dihapus" menggantikan "Ditangguhkan"', () => {
  const pengguna = (id: string, banned: string | null): PenggunaDTO => ({
    user_id: id, email: 'x***@contoh.id', display_name: null, created_at: '2026-09-01T00:00:00Z', last_sign_in: null,
    banned_until: banned, jumlah_ruang: null, jumlah_tx: null, total_semua: 2,
  })
  it('akun berpermintaan menunggu → menunggu_hapus walau ber-ban; akun ber-ban lain tetap ditangguhkan', () => {
    const tunggu = idMenungguHapus([baris({ user_id: U1 }), baris({ id: ID2, user_id: U2, status: 'selesai' })])
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
    expect(f).toMatch(/api\.hapusAkunDaftar\('menunggu'\)\.then\(\(r\) => \{ menungguHapus\.value = idMenungguHapus\(r\) \}\)\.catch\(\(\) => \{\}\)/)
    expect(f).toMatch(/kePengguna\(d, bahasa\.value, menungguHapus\.value\)/)
    expect(f).toMatch(/if \(q\.value\.seg === 'ditangguhkan'\) return p\.status === 'ditangguhkan'/)
    expect(f).toMatch(/tcf\('pengguna\.menungguHapus'\)/)
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
    ]
    const fungsi = [...BAGIAN_ISI.map(k => `hapusAkun.isi.${k}`), 'hapusAkun.foto.menunggu', 'hapusAkun.foto.gagal', 'hapusAkun.umur', 'hapusAkun.diminta']
    const salah = [
      ...teks.flatMap(k => (['id', 'en'] as const).filter(b => typeof ambil(b, k) !== 'string').map(b => `${b}:${k}`)),
      ...fungsi.flatMap(k => (['id', 'en'] as const).filter(b => typeof ambil(b, k) !== 'function').map(b => `${b}:${k}`)),
    ]
    expect(salah).toEqual([])
  })
  it('kalimat satu baris tanpa kata "admin_" atau kode galat mentah', () => {
    for (const b of ['id', 'en'] as const) {
      for (const k of ['izinTindak', 'belumAktif', 'tertahan', 'konfirmasiKet', 'konfirmasiPindah']) {
        const t = ambil(b, `hapusAkun.${k}`) as string
        expect(t, `${b}:${k}`).not.toMatch(/admin_|P0001|42883|\n/)
        expect(t.length, `${b}:${k}`).toBeLessThan(160)
      }
    }
    const umur = ambil('id', 'hapusAkun.umur') as (n: number) => string
    expect(umur(0)).toBe('Diminta hari ini')
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
  it('Batalkan dikonfirmasi sebaris di kartu; Hapus permanen lewat konfirmasi halaman', () => {
    const kartu = baca(KARTU)
    expect(kartu).toMatch(/@click="tanyaBatal = true"/)
    expect(kartu).toMatch(/tcf\('hapusAkun\.batalTanya'\)/)
    expect(kartu).toMatch(/@click="emit\('hapus'\)"/)
    const hal = baca(HAL)
    expect(hal).toMatch(/@hapus="mintaHapus\(p\)"/)
    expect(hal).toMatch(/@setuju="setujuHapus"/)
  })
  it('izin tindak dari sesi; izin-kurang lewat CashflowIzinKurang; 42883 = fitur belum aktif', () => {
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
    for (const f of [HAL, KARTU, KONF, 'adapters/cashflowHapusAkun.ts', 'tests/cashflow/hapus-akun.test.ts']) {
      const isi = baca(f)
      expect(isi, f).not.toMatch(/\/Users\/|@gmail\.|@coreasia\.id/)
    }
  })
})

/* Kontrak terhadap migrasi 0112 (folder migrasi CashFlow, CASHFLOW_MIGRASI). */
const CONTOH_DAFTAR = baris()
const CONTOH_HASIL: Required<HasilHapusDTO> = { hasil: 'dihapus', permintaan: ID1, foto_antre: 0 }
describe.skipIf(!adaMigrasiNomor('0112'))('kontrak 0112', () => {
  it('admin_hapus_akun_daftar: kolom kembalian = kunci HapusAkunDTO', () => {
    expect([...kolomKembalian('admin_hapus_akun_daftar')].sort()).toEqual(Object.keys(CONTOH_DAFTAR).sort())
  })
  it('parameter ketiga RPC = argumen yang dikirim useCashflowAdmin', () => {
    expect(parameterFungsi('admin_hapus_akun_daftar')).toEqual([{ nama: 'p_status', bawaan: true }, { nama: 'p_batas', bawaan: true }])
    for (const n of ['admin_hapus_akun_permanen', 'admin_hapus_akun_batalkan']) {
      expect(parameterFungsi(n).map(p => p.nama), n).toEqual(['p_permintaan', 'p_alasan'])
    }
  })
  it('penjaga: daftar izin view; hapus permanen dan batalkan izin tindak', () => {
    expect(fungsiTerakhir('admin_hapus_akun_daftar').badan).toMatch(/konsol_boleh\(\s*'cashflow:view'\s*\)/)
    for (const n of ['admin_hapus_akun_permanen', 'admin_hapus_akun_batalkan']) {
      const { kepala, badan } = fungsiTerakhir(n)
      expect(kepala, n).toMatch(/returns\s+jsonb/i)
      expect(badan, n).toMatch(/konsol_boleh\(\s*'cashflow:tindak'\s*\)/)
      expect(badan, n).toMatch(/is_platform_admin\(\)/)
    }
    expect(fungsiTerakhir('admin_hapus_akun_permanen').badan).toMatch(/errcode\s*=\s*'P0001'\s*,\s*hint\s*=\s*'alihkan-kepemilikan'/)
  })
  it('jawaban aksi: objek ber-hasil dan permintaan; nilai hasil dikenal console', () => {
    for (const n of ['admin_hapus_akun_permanen', 'admin_hapus_akun_batalkan']) {
      const { badan } = fungsiTerakhir(n)
      const pohon = semuaPohonJsonb(badan).filter(t => 'hasil' in t)
      expect(pohon.length, n).toBeGreaterThan(0)
      for (const t of pohon) {
        expect(Object.keys(t), n).toContain('permintaan')
        for (const k of Object.keys(t)) expect(Object.keys(CONTOH_HASIL), `${n}: ${k}`).toContain(k)
      }
      const nilai = [...badan.matchAll(/'hasil'\s*,\s*'([a-z_]+)'/g)].map(m => m[1]!)
      for (const h of nilai) expect(HASIL_HAPUS as readonly string[], `${n}: ${h}`).toContain(h)
    }
  })
})
