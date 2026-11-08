/**
 * Halaman Dukungan (0118): kontrak RPC terhadap migrasi, adapter, argumen
 * RPC, galat "fitur belum aktif", kartu sakelar dukung_web, kamus, dan
 * penjaga halaman (nama dan pesan pengunjung sebagai teks polos).
 *
 * Kontrak dibandingkan dengan definisi TERAKHIR fungsinya di folder migrasi
 * CashFlow (tests/cashflow/migrasi.ts). Sebelum 0118 ada di folder itu,
 * bagian kontrak DILEWATI dan terlihat "skipped".
 *
 * Semua kode, nama, dan pesan di sini karangan.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { computed, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BATAS_DAFTAR_DUKUNGAN, CATATAN_SAKELAR_DUKUNG, KUNCI_SAKELAR_DUKUNG, NOMINAL_DUKUNGAN, RENTANG_DUKUNGAN, SARING_STATUS, SARING_SUMBER,
  STATUS_DUKUNGAN, SUMBER_DUKUNGAN,
  bacaSakelarDukung, barisDukungan, gabungDukungan, keDukungan, keRingkasDukungan, kursorDukungan, nilaiSakelarDukung, pillStatus,
  rentangDukungan, saringKeServer,
  type DaftarDukunganDTO, type DukunganDTO, type RingkasDukunganDTO,
} from '../../adapters/cashflowDukungan'
import {
  adaMigrasiNomor, fungsiTerakhir, kolomTabel, parameterFungsi, pohonContoh, pohonDengan, urutPohon, DIR_MIGRASI,
} from './migrasi'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'

// ── Global tiruan (tanpa Nuxt, lihat vitest.config.ts) ───────────────────
type Jawab = { data: unknown; error: unknown }
const panggilan: Array<{ nama: string; a: Record<string, unknown> }> = []
let jawaban: Jawab = { data: null, error: null }
const sb = {
  auth: { getSession: async () => ({ data: { session: { access_token: 'x' } } }), signOut: async () => ({}) },
  rpc: async (nama: string, a: Record<string, unknown>) => { panggilan.push({ nama, a }); return jawaban },
}
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('useAdminAuth', () => ({ user: ref({ id: 'a', email: 'staf@contoh.id' }) }))
vi.stubGlobal('useCashflowSesi', () => ({ ambil: async () => sb, sambung: async () => ({ ok: true }), perluSambung: () => false, pelaku: ref('staf@contoh.id') }))
vi.stubGlobal('useCashflowI18n', () => ({ tcf: (k: string) => k }))
vi.stubGlobal('useRoute', () => ({ fullPath: '/console/cashflow/dukungan' }))
vi.stubGlobal('useToast', () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }))
vi.stubGlobal('navigateTo', vi.fn())
const { useCashflowAdmin, petakanGalat } = await import('~/composables/cashflow/useCashflowAdmin')
const { useCashflowMuat } = await import('~/composables/cashflow/useCashflowMuat')

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (rel: string) => readFileSync(join(AKAR, rel), 'utf8')

const W = '2026-10-30T07:10:00+00:00'
/* Satu contoh setiap kunci, persis seperti yang dipulangkan server. */
const RINGKAS: Required<RingkasDukunganDTO> = {
  dari: '2026-10-03', sampai: '2026-11-01', masuk: '325000', lunas: 4, rata: '81250',
  qr_dibuat: 7, qr_tidak_dibayar: 2, gagal_dibuat: 0, menunggu: 0, perlu_tinjau: 1, dikembalikan: 0,
  biaya_qr: 31080, biaya_mdr: 1050, biaya_perkiraan: '32130', bersih_perkiraan: 292870,
  per_nominal: [
    { nominal: '25000', qr: 4, dibayar: 1 }, { nominal: '50000', qr: 1, dibayar: 1 },
    { nominal: '100000', qr: 1, dibayar: 1 }, { nominal: 'lain', qr: '1', dibayar: '1' },
  ],
  play: { lunas: 0, masuk: 0 },
  buka: false,
  uji_disembunyikan: 3,
}
const BARIS: Required<DukunganDTO> = {
  kode: 'DK-7Q2M', sumber: 'web_qris', uji: false, jumlah: 50000, jumlah_dibayar: 50000, status: 'lunas',
  nama: 'Sari', pesan: '<b>tes</b>', penerbit: 'DANA', ref_luar: 'pr-contoh', dibuat: W, dibayar_pada: W, habis_pada: W,
}
const DAFTAR: Required<DaftarDukunganDTO> = { dari: '2026-10-03', sampai: '2026-11-01', ada_lagi: true, baris: [BARIS] }

beforeEach(() => {
  panggilan.length = 0
  jawaban = { data: null, error: null }
})

// ── Kontrak terhadap migrasi ─────────────────────────────────────────────
const nilaiCheck = (definisi: string): string[] => {
  const m = /check\s*\(\s*\w+\s+in\s*\(([^)]*)\)/i.exec(definisi)
  return m ? [...m[1]!.matchAll(/'([^']+)'/g)].map(x => x[1]!) : []
}
const galatDi = (badan: string): string[] =>
  [...new Set([...badan.matchAll(/errcode\s*=\s*'([0-9A-Z]{5})'(?:\s*,\s*hint\s*=\s*'([a-z0-9-]+)')?/g)].map(m => `${m[1]}:${m[2] ?? ''}`))].sort()

describe.skipIf(!adaMigrasiNomor('0118'))('kontrak 0118', () => {
  it('dua RPC didefinisikan terakhir di 0118 dengan parameter yang dikirim console', () => {
    for (const n of ['admin_dukungan_ringkas', 'admin_dukungan_daftar']) {
      expect(fungsiTerakhir(n).berkas, n).toMatch(/^0118_/)
      expect(fungsiTerakhir(n).kepala, n).toMatch(/returns jsonb\s+language plpgsql\s+stable\s+security definer\s+set search_path = ''/i)
    }
    expect(parameterFungsi('admin_dukungan_ringkas')).toEqual([{ nama: 'p_dari', bawaan: true }, { nama: 'p_sampai', bawaan: true }])
    expect(parameterFungsi('admin_dukungan_daftar').map(p => p.nama))
      .toEqual(['p_sumber', 'p_status', 'p_dari', 'p_sampai', 'p_batas', 'p_sebelum'])
  })

  it('hak: authenticated saja, tanpa anon dan service_role', () => {
    const nama = 'admin_dukungan'
    const sql = readFileSync(join(DIR_MIGRASI, '0118_dukungan.sql'), 'utf8').replace(/--[^\n]*/g, '')
    for (const [n, tanda] of [[`${nama}_ringkas`, 'date, date'], [`${nama}_daftar`, 'text, text, date, date, integer, timestamptz']]) {
      expect(sql, n).toContain(`revoke all on function public.${n}(${tanda}) from public, anon;`)
      expect(sql, n).toContain(`grant execute on function public.${n}(${tanda}) to authenticated;`)
      expect(sql, n).toContain(`revoke execute on function public.${n}(${tanda}) from service_role;`)
    }
  })

  it('penjaga is_platform_admin() lalu izin sesi cashflow:view; galat yang bisa dilempar dibaca console', () => {
    for (const n of ['admin_dukungan_ringkas', 'admin_dukungan_daftar']) {
      const { badan } = fungsiTerakhir(n)
      expect(badan.slice(badan.search(/\bbegin\b/)), n)
        .toMatch(/^begin\s+if not public\.is_platform_admin\(\) then\s+raise exception 'Bukan admin platform\.' using errcode = '42501';\s+end if;\s+if not public\.konsol_boleh\('cashflow:view'\) then/)
    }
    expect(galatDi(fungsiTerakhir('admin_dukungan_ringkas').badan)).toEqual(['22023:rentang', '42501:', '42501:izin-kurang'])
    expect(galatDi(fungsiTerakhir('admin_dukungan_daftar').badan)).toEqual(['22023:batas', '22023:rentang', '22023:status', '22023:sumber', '42501:', '42501:izin-kurang'])
    expect(petakanGalat({ code: '42501', message: 'Bukan admin platform.' }).jenis).toBe('bukan-admin')
    expect(petakanGalat({ code: '42501', hint: 'izin-kurang', message: 'Butuh izin cashflow:view.' }).jenis).toBe('izin')
    expect(petakanGalat({ code: '22023', hint: 'rentang', message: 'Rentang tanggal 1..366 hari.' }).jenis).toBe('argumen')
  })

  it('bentuk jawaban ringkas = DTO adapter', () => {
    const server = pohonDengan(fungsiTerakhir('admin_dukungan_ringkas').badan, 'masuk', 'per_nominal')
    expect(urutPohon(server)).toEqual(urutPohon(pohonContoh(RINGKAS)))
  })

  it('bentuk jawaban daftar = DTO adapter (termasuk setiap baris)', () => {
    const server = pohonDengan(fungsiTerakhir('admin_dukungan_daftar').badan, 'ada_lagi', 'baris')
    expect(urutPohon(server)).toEqual(urutPohon(pohonContoh(DAFTAR)))
  })

  it('nilai status, sumber, dan kelompok nominal sama dengan server', () => {
    const { definisi } = kolomTabel('dukungan')
    expect(nilaiCheck(definisi.status!)).toEqual([...STATUS_DUKUNGAN])
    expect(nilaiCheck(definisi.sumber!)).toEqual([...SUMBER_DUKUNGAN])
    const { badan } = fungsiTerakhir('admin_dukungan_ringkas')
    const values = /from \(values ([^)]*\)(?:\s*,\s*\([^)]*\))*)\) x\(nominal, urut\)/.exec(badan)?.[1] ?? ''
    expect([...values.matchAll(/\('([^']+)'/g)].map(m => m[1])).toEqual([...NOMINAL_DUKUNGAN])
    // Daftar menolak status/sumber di luar daftar yang sama.
    const daftar = fungsiTerakhir('admin_dukungan_daftar').badan
    expect(daftar).toContain(`p_status not in (${STATUS_DUKUNGAN.map(s => `'${s}'`).join(', ')})`)
    expect(daftar).toContain(`p_sumber not in (${SUMBER_DUKUNGAN.map(s => `'${s}'`).join(', ')})`)
  })

  it('batas halaman console di dalam jepit server (1..200)', () => {
    expect(fungsiTerakhir('admin_dukungan_daftar').badan).toMatch(/v_batas < 1 or v_batas > 200/)
    expect(BATAS_DAFTAR_DUKUNGAN).toBeGreaterThanOrEqual(1)
    expect(BATAS_DAFTAR_DUKUNGAN).toBeLessThanOrEqual(200)
  })

  it('kunci sakelar dan catatannya sama dengan baris app_config di migrasi; tidak publik', () => {
    const sql = readFileSync(join(DIR_MIGRASI, '0118_dukungan.sql'), 'utf8')
    const m = /values \('([a-z_]+)',\s*'(\{[^']*\})'::jsonb,\s*(true|false),\s*'([^']*)'\)/.exec(sql)
    expect(m?.[1]).toBe(KUNCI_SAKELAR_DUKUNG)
    expect(m?.[3]).toBe('false')
    expect(m?.[4]).toBe(CATATAN_SAKELAR_DUKUNG)
    const bawaan = JSON.parse(m![2]!)
    expect(bacaSakelarDukung({ nilai: bawaan })).toMatchObject({ ada: true, objek: true, aktif: false })
  })
})

// ── Adapter ──────────────────────────────────────────────────────────────
describe('adapter dukungan', () => {
  it('ringkas: angka string terbaca, porsi per nominal, buka hanya true persis', () => {
    const r = keRingkasDukungan(RINGKAS)
    expect(r).toMatchObject({ masuk: 325000, lunas: 4, rata: 81250, qrDibuat: 7, qrTidakDibayar: 2, perluTinjau: 1, biayaPerkiraan: 32130, bersihPerkiraan: 292870, buka: false, ujiDisembunyikan: 3 })
    expect(r.perNominal.map(n => n.nominal)).toEqual([...NOMINAL_DUKUNGAN])
    expect(r.perNominal[0]).toEqual({ nominal: '25000', qr: 4, dibayar: 1, porsi: 0.25 })
    expect(r.perNominal[3]).toEqual({ nominal: 'lain', qr: 1, dibayar: 1, porsi: 1 })
    expect(keRingkasDukungan({ ...RINGKAS, buka: true }).buka).toBe(true)
  })
  it('ringkas kosong: semua nol, porsi null, play nol', () => {
    const r = keRingkasDukungan({ ...RINGKAS, masuk: null, per_nominal: null, play: null, uji_disembunyikan: null })
    expect(r.masuk).toBe(0)
    expect(r.perNominal.every(n => n.qr === 0 && n.porsi === null)).toBe(true)
    expect(r.play).toEqual({ lunas: 0, masuk: 0 })
  })
  it('baris: status/sumber asing jadi null, teks kosong jadi null, HTML tetap teks', () => {
    const d = keDukungan(BARIS)
    expect(d).toMatchObject({ kode: 'DK-7Q2M', sumber: 'web_qris', status: 'lunas', jumlah: 50000, jumlahDibayarBeda: null, pesan: '<b>tes</b>', penerbit: 'DANA', uji: false })
    const asing = keDukungan({ ...BARIS, sumber: 'lain', status: 'aneh', nama: '   ', pesan: '', uji: null })
    expect(asing).toMatchObject({ sumber: null, status: null, nama: null, pesan: null, uji: false })
  })
  it('perlu ditinjau: jumlah dibayar yang beda ditampilkan, yang sama tidak', () => {
    expect(keDukungan({ ...BARIS, status: 'perlu_tinjau', jumlah_dibayar: '20000' }).jumlahDibayarBeda).toBe(20000)
    expect(keDukungan({ ...BARIS, jumlah_dibayar: null }).jumlahDibayarBeda).toBeNull()
  })
  it('daftar, gabung halaman tanpa ganda, dan kursor', () => {
    expect(barisDukungan(null)).toEqual([])
    expect(barisDukungan({ ...DAFTAR, baris: null })).toEqual([])
    const a = keDukungan(BARIS)
    const b = keDukungan({ ...BARIS, kode: 'DK-H4TX', dibuat: '2026-10-29T01:00:00+00:00' })
    expect(gabungDukungan([a], [a, b]).map(d => d.kode)).toEqual(['DK-7Q2M', 'DK-H4TX'])
    expect(kursorDukungan([a, b])).toBe('2026-10-29T01:00:00+00:00')
    expect(kursorDukungan([])).toBeNull()
  })
  it('rentang WIB inklusif', () => {
    expect(rentangDukungan('30', '2026-11-01')).toEqual({ dari: '2026-10-03', sampai: '2026-11-01' })
    expect(rentangDukungan('7', '2026-11-01')).toEqual({ dari: '2026-10-26', sampai: '2026-11-01' })
    expect(rentangDukungan('90', '2026-03-01')).toEqual({ dari: '2025-12-02', sampai: '2026-03-01' })
  })
  it('saringan semua = null ke server; lencana perlu ditinjau kuning, lunas hijau', () => {
    expect(saringKeServer('semua')).toBeNull()
    expect(saringKeServer('play')).toBe('play')
    expect(SARING_SUMBER[0]).toBe('semua')
    expect(SARING_STATUS[0]).toBe('semua')
    expect(pillStatus('perlu_tinjau')).toBe('ca-pill-gold')
    expect(pillStatus('lunas')).toBe('ca-pill-emerald')
    expect(pillStatus(null)).toBe('ca-pill-muted')
  })
})

describe('sakelar dukung_web', () => {
  it('membaca: hanya aktif === true yang hidup; bukan objek ditandai', () => {
    expect(bacaSakelarDukung(null)).toMatchObject({ ada: false, aktif: false })
    expect(bacaSakelarDukung({ nilai: { aktif: 'true' } })).toMatchObject({ ada: true, objek: true, aktif: false })
    expect(bacaSakelarDukung({ nilai: true })).toMatchObject({ ada: true, objek: false, aktif: false })
    expect(bacaSakelarDukung({ nilai: { aktif: true, batas_harian: 100, batas_ip_10menit: 3, batas_ip_harian: 10, penerima: ' Contoh ' } }))
      .toEqual({ ada: true, objek: true, aktif: true, batasHarian: 100, batasIp10: 3, batasIpHarian: 10, penerima: 'Contoh' })
  })
  it('menulis: hanya aktif yang diganti, batas dan penerima dipertahankan', () => {
    const lama = { aktif: false, batas_harian: 50, batas_ip_10menit: 2, batas_ip_harian: 5, penerima: 'Contoh' }
    expect(nilaiSakelarDukung(lama, true)).toEqual({ ...lama, aktif: true })
    expect(lama.aktif).toBe(false)
    expect(nilaiSakelarDukung('rusak', true)).toEqual({ aktif: true })
    expect(nilaiSakelarDukung(undefined, false)).toEqual({ aktif: false })
  })
})

// ── Argumen RPC dan galat ────────────────────────────────────────────────
const PETUNJUK_42883 = 'No function matches the given name and argument types. You might need to add explicit type casts.'
describe('argumen RPC (klien Supabase tiruan)', () => {
  it('ringkas: rentang tanggal; daftar: saringan, batas halaman, kursor', async () => {
    jawaban = { data: RINGKAS, error: null }
    await useCashflowAdmin().dukunganRingkas('2026-10-03', '2026-11-01')
    expect(panggilan.at(-1)).toEqual({ nama: 'admin_dukungan_ringkas', a: { p_dari: '2026-10-03', p_sampai: '2026-11-01' } })
    jawaban = { data: DAFTAR, error: null }
    await useCashflowAdmin().dukunganDaftar(null, 'perlu_tinjau', '2026-10-26', '2026-11-01', W)
    expect(panggilan.at(-1)).toEqual({
      nama: 'admin_dukungan_daftar',
      a: { p_sumber: null, p_status: 'perlu_tinjau', p_dari: '2026-10-26', p_sampai: '2026-11-01', p_batas: BATAS_DAFTAR_DUKUNGAN, p_sebelum: W },
    })
  })
  it('RPC belum ada (PGRST202, atau 42883 yang menyebut RPC itu sendiri) = fitur belum aktif', async () => {
    jawaban = { data: null, error: { code: 'PGRST202', hint: null, message: 'Could not find the function public.admin_dukungan_ringkas(p_dari, p_sampai) in the schema cache' } }
    await expect(useCashflowAdmin().dukunganRingkas('2026-10-03', '2026-11-01')).rejects.toMatchObject({ jenis: 'belum-aktif' })
    jawaban = { data: null, error: { code: '42883', hint: PETUNJUK_42883, message: 'function public.admin_dukungan_daftar(p_sumber => text) does not exist' } }
    await expect(useCashflowAdmin().dukunganDaftar(null, null, '2026-10-03', '2026-11-01', null)).rejects.toMatchObject({ jenis: 'belum-aktif' })
    // 42883 fungsi LAIN di dalamnya: RPC-nya ada tapi rusak, kalimatnya dibiarkan terbaca.
    const dalam = { code: '42883', hint: PETUNJUK_42883, message: 'function public.dukung_konfig_inti() does not exist' }
    expect(petakanGalat(dalam, 'admin_dukungan_ringkas').jenis).toBe('lain')
    expect(useCashflowMuat().pesanUntuk(petakanGalat({ code: 'PGRST202' }))).toBe('galat.belumAktif')
  })
})

// ── Kamus ────────────────────────────────────────────────────────────────
const ambil = (bahasa: 'id' | 'en', jalur: string): unknown =>
  jalur.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), KAMUS_CASHFLOW[bahasa])
describe('kamus dukungan', () => {
  it('kunci dinamis halaman ada di ID dan EN', () => {
    const jalur = [
      ...STATUS_DUKUNGAN.map(s => `dukungan.status.${s}`),
      ...SUMBER_DUKUNGAN.map(s => `dukungan.sumber.${s}`),
      ...SARING_SUMBER.map(s => `dukungan.sumberOpsi.${s}`),
      'nav.dukungan',
    ]
    const hilang = jalur.flatMap(k => (['id', 'en'] as const).filter(b => typeof ambil(b, k) !== 'string').map(b => `${b}:${k}`))
    expect(hilang).toEqual([])
  })
  it('kalimat berfungsi menyebut angkanya', () => {
    const f = (b: 'id' | 'en', k: string) => ambil(b, k) as (...a: unknown[]) => string
    expect(f('id', 'dukungan.ubin.qrNilai')(2, 7)).toBe('2 dari 7')
    expect(f('en', 'dukungan.ubin.qrNilai')(2, 7)).toBe('2 of 7')
    expect(f('id', 'dukungan.dibayarDari')(1, 4)).toBe('1 dari 4 QR dibayar')
    expect(f('id', 'dukungan.ubin.masuk')(30)).toBe('Masuk 30 hari')
    expect(f('en', 'dukungan.ujiDisembunyikan')(1)).toBe('1 test contribution in this range not counted.')
    expect(RENTANG_DUKUNGAN.map(h => f('id', 'dukungan.hari')(Number(h)))).toEqual(['7 hari', '30 hari', '90 hari'])
  })
  it('alasan audit sakelar berbahasa Indonesia di kedua bahasa layar', () => {
    for (const k of ['sakelar.dukung.alasanNyala', 'sakelar.dukung.alasanMati']) {
      expect(ambil('en', k), k).toBe(ambil('id', k))
      expect(String(ambil('id', k)).length, k).toBeGreaterThanOrEqual(8)
    }
  })
})

// ── Penjaga halaman ──────────────────────────────────────────────────────
describe('penjaga halaman Dukungan', () => {
  const HAL = 'pages/console/cashflow/dukungan.vue'
  const KARTU = 'components/cashflow/CashflowSakelarDukung.vue'
  it('berkas ada; komponen berawalan nama berkas (pathPrefix:false)', () => {
    for (const f of [HAL, KARTU, 'adapters/cashflowDukungan.ts']) expect(existsSync(join(AKAR, f)), f).toBe(true)
    expect(baca('pages/console/cashflow/sakelar.vue')).toMatch(/<CashflowSakelarDukung :config="config" :segarkan="segarkanDaftar" \/>/)
  })
  it('nama dan pesan pengunjung teks polos: tanpa v-html, interpolasi biasa (MN-58)', () => {
    for (const f of [HAL, KARTU]) expect(baca(f), f).not.toMatch(/v-html|innerHTML/)
    const hal = baca(HAL)
    expect(hal).toMatch(/\{\{ d\.nama \?\? '—' \}\}/)
    expect(hal).toMatch(/\{\{ d\.pesan \?\? '—' \}\}/)
  })
  it('RPC belum ada = fitur belum aktif; sakelar mati diberi tahu dengan tautan ke Sakelar', () => {
    const hal = baca(HAL)
    expect(hal).toMatch(/galat\.value\?\.jenis === 'belum-aktif'/)
    expect(hal).toMatch(/tcf\('dukungan\.belumAktif'\)/)
    expect(hal).toMatch(/v-if="!ringkas\.buka"/)
    expect(hal).toMatch(/to="\/console\/cashflow\/sakelar"/)
  })
  it('sakelar: tidak publik, catatan dipertahankan, nilai lewat nilaiSakelarDukung, penjaga timpa', () => {
    const kartu = baca(KARTU)
    expect(kartu).toMatch(/api\.setConfig\(KUNCI_SAKELAR_DUKUNG, nilaiSakelarDukung\(b\.nilai, target\), false, b\.catatan \|\| CATATAN_SAKELAR_DUKUNG, alasan\.value\.trim\(\)\)/)
    expect(kartu).toMatch(/diperbaruiIso \?\? null\) === versiDimuat\.value/)
    expect(kartu).not.toMatch(/hapusConfig/)
  })
  it('entri nav dan palet menuju halaman ini', () => {
    expect(baca('components/cashflow/CashflowNav.vue')).toMatch(/\{ kunci: 'dukungan', to: '\/console\/cashflow\/dukungan' \}/)
    expect(baca('components/cashflow/CashflowPalet.vue')).toMatch(/\{ kunci: 'dukungan', ke: '\/console\/cashflow\/dukungan'/)
  })
  it('repo publik: berkas baru tanpa jalur lokal atau email nyata', () => {
    for (const f of [HAL, KARTU, 'adapters/cashflowDukungan.ts', 'tests/cashflow/dukungan.test.ts']) {
      expect(baca(f), f).not.toMatch(/\/Users\/|@gmail\.|@coreasia\.id/)
    }
  })
})
