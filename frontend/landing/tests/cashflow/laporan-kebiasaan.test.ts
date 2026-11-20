/**
 * Bagian "Kebiasaan pengguna aktif" di halaman Laporan
 * (adapters/cashflowLaporanKebiasaan.ts, CashflowLaporanKebiasaan.vue).
 *
 * - Adapter murni: urutan butir, kunci asing tetap tampil, angka rusak jadi
 *   nol, pembanding persen tiap butir, daftar orang dan halamannya.
 * - Kamus: setiap kunci berlabel ada di ID dan EN, kalimat sesuai permintaan.
 * - Komponen memanggil dua RPC yang benar dan menautkan ke rincian pengguna.
 * - Kontrak dibanding migrasi CashFlow (folder CASHFLOW_MIGRASI). Selama
 *   fungsinya belum ada di folder itu, uji kontraknya terlihat "skipped".
 * - Data sintetis uji tampilan berbentuk sama dengan DTO contoh di sini.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { adaMigrasi, fungsiTerakhir, parameterFungsi, pohonContoh, pohonDengan, urutPohon } from './migrasi'
import {
  ALASAN_LAPORAN_KEBIASAAN, DARI_SEMUA_AKUN, KUNCI_AKTIF, KUNCI_BERLABEL, KUNCI_KEBIASAAN, MAKS_KUNCI_KEBIASAAN, PEMBANDING_KEBIASAAN, PER_DAFTAR_KEBIASAAN,
  POLA_KUNCI_KEBIASAAN, keDaftarKebiasaan, keKebiasaan, kunciBerlabel, kunciSah, persenKebiasaan,
  type DaftarKebiasaanDTO, type KebiasaanDTO,
} from '../../adapters/cashflowLaporanKebiasaan'
import { BAGIAN_LAPORAN, RENTANG_LAPORAN } from '../../adapters/cashflowLaporan'
import { bacaQuery } from '../../adapters/cashflowQuery'
import { HINT_22023, HINT_42501, petakanGalat } from '../../composables/cashflow/useCashflowAdmin'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'
import { buatServer } from '../../scripts/data-sintetis-console.mjs'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (jalur: string): string => readFileSync(join(AKAR, jalur), 'utf8')
const adaFungsi = (nama: string): boolean => { try { fungsiTerakhir(nama); return true } catch { return false } }
const ADA_KEBIASAAN = adaMigrasi && adaFungsi('admin_laporan_kebiasaan')
const ADA_DAFTAR = adaMigrasi && adaFungsi('admin_laporan_kebiasaan_daftar')

// ── Contoh jawaban server (karangan) ─────────────────────────────────────
const KEBIASAAN: KebiasaanDTO = {
  hari: 30, akun: 200, aktif: 80,
  butir: [
    { kunci: 'satu_ruang', orang: 50 }, { kunci: 'banyak_ruang', orang: 30 }, { kunci: 'catat_banyak_ruang', orang: '12' },
    { kunci: 'berbagi_ruang', orang: 9 }, { kunci: 'banyak_hp', orang: 4 }, { kunci: 'catat_usaha', orang: 16 },
    { kunci: 'pakai_domi', orang: 40 }, { kunci: 'beli_kredit', orang: 5 }, { kunci: 'aktif_7', orang: 60 },
    { kunci: 'baru', orang: 20 }, { kunci: 'baru_bertahan', orang: 7 },
  ],
}
const ORANG = {
  user_id: '00000000-0000-4000-8000-000000000001', nama: 'Sari', email: 'sari@contoh.invalid', daftar: '2026-10-01T03:00:00Z',
  terakhir_catat: '2026-11-17T15:15:00Z', catatan: 412, ruang: 3, ruang_bersama: 1, hp: 2, pesan_domi: 96, beli_kredit: 3,
}
const DAFTAR: DaftarKebiasaanDTO = { kunci: 'banyak_ruang', hari: 30, total: 30, hal: 1, per_hal: 50, terbuka: true, baris: [ORANG] }

const galatDi = (badan: string): string[] =>
  [...new Set([...badan.matchAll(/errcode\s*=\s*'(\w+)'(?:,\s*hint\s*=\s*'([\w-]+)')?/g)].map(m => `${m[1]}:${m[2] ?? ''}`))].sort()

describe.skipIf(!ADA_KEBIASAAN)('kontrak admin_laporan_kebiasaan = migrasi CashFlow', () => {
  it('parameter p_hari saja, punya bawaan', () => {
    expect(parameterFungsi('admin_laporan_kebiasaan')).toEqual([{ nama: 'p_hari', bawaan: true }])
  })

  it('bentuk jawaban = DTO contoh, dan sebelas kunci butir berurutan sama dengan adapter', () => {
    const { badan } = fungsiTerakhir('admin_laporan_kebiasaan')
    expect(urutPohon(pohonDengan(badan, 'akun', 'aktif', 'butir'))).toEqual(urutPohon(pohonContoh(KEBIASAAN)))
    const deret = /unnest\(array\[([^\]]+)\]\)/.exec(badan)?.[1] ?? ''
    expect([...deret.matchAll(/'([a-z0-9_]+)'/g)].map(m => m[1])).toEqual([...KUNCI_KEBIASAAN])
  })

  it('izin view tanpa audit, rentang halaman diterima server, galat memakai hint yang dikenal', () => {
    const { badan } = fungsiTerakhir('admin_laporan_kebiasaan')
    expect(badan).toMatch(/konsol_boleh\('cashflow:view'\)/)
    expect(badan).not.toMatch(/cashflow:pii|admin_catat_baca/)
    const batas = /v_hari\s*<\s*(\d+)\s+or\s+v_hari\s*>\s*(\d+)/.exec(badan)
    expect(batas, 'batas rentang hari').toBeTruthy()
    expect(RENTANG_LAPORAN.map(Number).every(h => h >= Number(batas![1]) && h <= Number(batas![2]))).toBe(true)
    expect(galatDi(badan)).toEqual(['22023:hari', '42501:', '42501:izin-kurang'])
    expect(HINT_22023 as readonly string[]).toContain('hari')
    expect(HINT_42501['izin-kurang']).toBe('izin')
  })
})

describe.skipIf(!ADA_DAFTAR)('kontrak admin_laporan_kebiasaan_daftar = migrasi CashFlow', () => {
  it('parameter p_kunci, p_hari, p_hal, p_alasan, hanya p_kunci yang wajib', () => {
    const param = parameterFungsi('admin_laporan_kebiasaan_daftar')
    expect(param.map(p => p.nama)).toEqual(['p_kunci', 'p_hari', 'p_hal', 'p_alasan'])
    expect(param.filter(p => !p.bawaan).map(p => p.nama)).toEqual(['p_kunci'])
  })

  it('bentuk jawaban dan baris = DTO contoh', () => {
    const { badan } = fungsiTerakhir('admin_laporan_kebiasaan_daftar')
    expect(Object.keys(pohonDengan(badan, 'baris', 'per_hal')).sort()).toEqual(Object.keys(DAFTAR).sort())
    expect(urutPohon(pohonDengan(badan, 'user_id', 'terakhir_catat'))).toEqual(urutPohon(pohonContoh(ORANG)))
  })

  it('menerima setiap kunci butir dan aktif, kunci asing 22023 hint kunci, 50 baris per halaman', () => {
    const { badan } = fungsiTerakhir('admin_laporan_kebiasaan_daftar')
    const sah = /p_kunci not in \(([^)]*)\)/.exec(badan)?.[1] ?? ''
    expect([...sah.matchAll(/'([a-z0-9_]+)'/g)].map(m => m[1])).toEqual([...KUNCI_BERLABEL])
    expect(badan).toMatch(new RegExp(`c_per_hal constant integer := ${PER_DAFTAR_KEBIASAAN};`))
    expect(galatDi(badan)).toEqual(['22023:alasan-pendek', '22023:hari', '22023:kunci', '42501:', '42501:izin-kurang'])
    for (const h of ['alasan-pendek', 'hari', 'kunci']) expect(HINT_22023 as readonly string[]).toContain(h)
  })

  it('izin pii, alasan tetap membuka identitas, setiap panggilan menulis audit laporan_kebiasaan', () => {
    const { badan } = fungsiTerakhir('admin_laporan_kebiasaan_daftar')
    expect(badan).toMatch(/konsol_boleh\('cashflow:pii'\)/)
    expect(badan).toMatch(/v_buka\s+boolean := p_alasan is not null/)
    expect(badan).toMatch(/'email', case when v_buka then h\.email::text else public\.samar_email\(h\.email\) end/)
    expect(badan).toMatch(/admin_catat_baca\(v_k, 'laporan_kebiasaan', 'daftar', null/)
    expect(ALASAN_LAPORAN_KEBIASAAN.trim().length).toBeGreaterThanOrEqual(8)
    expect(baca('composables/cashflow/useCashflowAdmin.ts')).toMatch(/'admin_laporan_kebiasaan_daftar', \{[\s\S]*?p_alasan: ALASAN_LAPORAN_KEBIASAAN,/)
  })
})

describe('adapter Kebiasaan', () => {
  it('baris pertama semua yang aktif, lalu butir menurut urutan server, angka string terbaca', () => {
    const k = keKebiasaan(KEBIASAAN)
    expect(k.hari).toBe(30)
    expect(k.akun).toBe(200)
    expect(k.aktif).toBe(80)
    expect(k.butir.map(b => b.kunci)).toEqual([KUNCI_AKTIF, ...KUNCI_KEBIASAAN])
    expect(k.butir.every(b => b.dikenal === b.kunci)).toBe(true)
    expect(k.butir.find(b => b.kunci === 'catat_banyak_ruang')!.orang).toBe(12)
  })

  it('persen memakai pembanding yang tepat: aktif, semua akun, atau pendaftar baru', () => {
    const k = keKebiasaan(KEBIASAAN)
    const p = (kunci: string) => { const b = k.butir.find(x => x.kunci === kunci)!; return [b.pembanding, b.persen] }
    expect(p('aktif')).toEqual(['akun', 40])
    expect(p('satu_ruang')).toEqual(['aktif', 63])
    expect(p('pakai_domi')).toEqual(['aktif', 50])
    expect(p('aktif_7')).toEqual(['aktif', 75])
    expect(p('beli_kredit')).toEqual(['akun', 3])
    expect(p('baru')).toEqual(['akun', 10])
    expect(p('baru_bertahan')).toEqual(['baru', 35])
    expect(DARI_SEMUA_AKUN.every(x => PEMBANDING_KEBIASAAN[x] !== 'aktif')).toBe(true)
    expect(KUNCI_KEBIASAAN.filter(x => PEMBANDING_KEBIASAAN[x] !== 'aktif')).toEqual([...DARI_SEMUA_AKUN])
    expect(persenKebiasaan(5, 0)).toBeNull()
    expect(persenKebiasaan(9, 3)).toBe(100)
    expect(keKebiasaan({ ...KEBIASAAN, aktif: 0 }).butir.find(b => b.kunci === 'satu_ruang')!.persen).toBeNull()
  })

  it('kunci asing tetap tampil dengan kuncinya, tanpa persen', () => {
    const k = keKebiasaan({ ...KEBIASAAN, butir: [...KEBIASAAN.butir, { kunci: 'pakai_widget', orang: 4 }] })
    const asing = k.butir.at(-1)!
    expect(asing).toEqual({ kunci: 'pakai_widget', dikenal: null, orang: 4, pembanding: null, persen: null })
    expect(kunciBerlabel('pakai_widget')).toBeNull()
    expect(kunciBerlabel('aktif')).toBe('aktif')
  })

  it('data rusak: angka jadi nol, butir tanpa kunci sah atau ganda dibuang, jawaban kosong aman', () => {
    const rusak = {
      hari: 'x', akun: null, aktif: -4,
      butir: [
        { kunci: 'satu_ruang', orang: 'banyak' }, { kunci: 'satu_ruang', orang: 9 }, { kunci: 7, orang: 2 }, null,
        { kunci: 'Punya <b>', orang: 1 }, { kunci: 'aktif', orang: 99 }, { kunci: 'banyak_hp', orang: Number.NaN }, { kunci: 'baru', orang: 2.6 },
      ],
    } as unknown as KebiasaanDTO
    const k = keKebiasaan(rusak)
    expect([k.hari, k.akun, k.aktif]).toEqual([0, 0, 0])
    expect(k.butir.map(b => [b.kunci, b.orang])).toEqual([['aktif', 0], ['satu_ruang', 0], ['banyak_hp', 0], ['baru', 3]])
    expect(k.butir.every(b => b.persen === null)).toBe(true)
    for (const kosong of [null, undefined, {} as KebiasaanDTO, { butir: 'x' } as unknown as KebiasaanDTO]) {
      expect(keKebiasaan(kosong).butir.map(b => b.kunci)).toEqual(['aktif'])
    }
  })

  it('daftar orang: kolom terbaca, tanggal rusak jadi null, baris tanpa id dibuang', () => {
    const d = keDaftarKebiasaan({
      ...DAFTAR,
      total: '3',
      baris: [
        ORANG,
        { ...ORANG, user_id: '00000000-0000-4000-8000-000000000002', nama: null, email: null, terakhir_catat: null, daftar: 'kemarin', catatan: '7', hp: null },
        { ...ORANG, user_id: '' },
        null as unknown as typeof ORANG,
      ],
    })
    expect(d.kunci).toBe('banyak_ruang')
    expect(d.total).toBe(3)
    expect(d.hal).toBe(1)
    expect(d.perHal).toBe(50)
    expect(d.baris).toHaveLength(2)
    expect(d.baris[0]).toEqual({
      id: ORANG.user_id, nama: 'Sari', email: 'sari@contoh.invalid', daftar: ORANG.daftar, terakhir: ORANG.terakhir_catat,
      catatan: 412, ruang: 3, ruangBersama: 1, hp: 2, pesanDomi: 96, beliKredit: 3,
    })
    expect(d.baris[1]).toMatchObject({ nama: '', email: '', daftar: null, terakhir: null, catatan: 7, hp: 0 })
    expect(d.terbuka).toBe(true)
  })

  it('daftar orang: tersamar dikenali, halaman dan jumlah per halaman punya bawaan', () => {
    const d = keDaftarKebiasaan({ ...DAFTAR, hal: 0, per_hal: null, total: 0, terbuka: false, baris: [{ ...ORANG, nama: null, email: 'sar***@contoh.invalid' }] })
    expect(d.terbuka).toBe(false)
    expect(d.baris[0]).toMatchObject({ nama: '', email: 'sar***@contoh.invalid' })
    expect(keDaftarKebiasaan({ ...DAFTAR, terbuka: 'ya' as unknown as boolean }).terbuka).toBe(false)
    expect(d.hal).toBe(1)
    expect(d.perHal).toBe(PER_DAFTAR_KEBIASAAN)
    expect(d.total).toBe(1)
    const kosong = keDaftarKebiasaan(null)
    expect(kosong).toMatchObject({ kunci: '', total: 0, hal: 1, perHal: PER_DAFTAR_KEBIASAAN, baris: [], terbuka: false })
  })

  it('kunci di URL: hanya huruf kecil, angka, dan garis bawah', () => {
    expect(KUNCI_BERLABEL.every(kunciSah)).toBe(true)
    for (const buruk of ['', 'Aktif', 'a b', '../x', 'a'.repeat(MAKS_KUNCI_KEBIASAAN + 1), 9, null]) expect(kunciSah(buruk)).toBe(false)
    const skema = { butir: { jenis: 'teks', pola: POLA_KUNCI_KEBIASAAN, maks: MAKS_KUNCI_KEBIASAAN, bawaan: '' } } as const
    expect(bacaQuery(skema, { butir: 'banyak_hp' }).butir).toBe('banyak_hp')
    expect(bacaQuery(skema, { butir: '<script>' }).butir).toBe('')
  })
})

describe('kamus Kebiasaan', () => {
  const ambil = (b: 'id' | 'en', jalur: string): unknown =>
    jalur.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), KAMUS_CASHFLOW[b])

  it('setiap kunci berlabel, pembanding, dan kolom ada di ID dan EN', () => {
    const jalur = [
      'laporan.bagian.kebiasaan', 'galat.kunci',
      ...KUNCI_BERLABEL.map(k => `laporan.kebiasaan.butir.${k}`),
      ...['aktif', 'akun', 'baru'].map(p => `laporan.kebiasaan.dari.${p}`),
      ...['pengguna', 'daftar', 'terakhir', 'catatan', 'ruang', 'ruangBersama', 'hp', 'pesanDomi', 'beliKredit'].map(k => `laporan.kebiasaan.kolomOrang.${k}`),
    ]
    const hilang = jalur.flatMap(k => (['id', 'en'] as const).filter(b => ambil(b, k) === undefined).map(b => `${b}:${k}`))
    expect(hilang).toEqual([])
    expect(BAGIAN_LAPORAN).toContain('kebiasaan')
    expect(BAGIAN_LAPORAN.at(-1)).toBe('saldo')
  })

  it('label Indonesia sesuai permintaan', () => {
    expect(ambil('id', 'laporan.kebiasaan.butir')).toEqual({
      aktif: 'Semua yang mencatat dalam rentang ini',
      satu_ruang: 'Punya 1 ruang saja',
      banyak_ruang: 'Punya 2 ruang atau lebih',
      catat_banyak_ruang: 'Mencatat di 2 ruang atau lebih',
      berbagi_ruang: 'Berbagi ruang dengan orang lain',
      banyak_hp: 'Memakai 2 HP atau lebih',
      catat_usaha: 'Mencatat di ruang usaha',
      pakai_domi: 'Memakai Domi',
      beli_kredit: 'Pernah membeli kredit Domi',
      aktif_7: 'Mencatat dalam 7 hari terakhir',
      baru: 'Mendaftar dalam rentang ini',
      baru_bertahan: 'Pendaftar baru yang masih mencatat sesudah minggu pertama',
    })
    const pembuka = ambil('id', 'laporan.kebiasaan.pembuka') as (a: string, b: string, c: string) => string
    expect(pembuka('1.204', '312', '30')).toBe('Dari 1.204 akun pengguna luar, 312 mencatat dalam 30 hari terakhir.')
    expect(ambil('id', 'laporan.kebiasaan.ketSemuaAkun')).toMatch(/semua akun luar, bukan hanya yang aktif/)
  })

  it('label Inggris berbeda dari Indonesia untuk setiap kunci', () => {
    const id = ambil('id', 'laporan.kebiasaan.butir') as Record<string, string>
    const en = ambil('en', 'laporan.kebiasaan.butir') as Record<string, string>
    expect(Object.keys(en).sort()).toEqual(Object.keys(id).sort())
    for (const k of KUNCI_BERLABEL) expect(en[k], k).not.toBe(id[k])
  })
})

describe('komponen dan halaman', () => {
  const komponen = baca('components/cashflow/CashflowLaporanKebiasaan.vue')
  const admin = baca('composables/cashflow/useCashflowAdmin.ts')
  const halaman = baca('pages/console/cashflow/laporan.vue')

  it('dua pemanggil memakai RPC dan nama argumen kontrak', () => {
    expect(admin).toMatch(/laporanKebiasaan: \(hari: number\) => rpc<KebiasaanDTO>\('admin_laporan_kebiasaan', \{ p_hari: hari \}\)/)
    expect(admin).toMatch(/rpc<DaftarKebiasaanDTO>\('admin_laporan_kebiasaan_daftar', \{\s+p_kunci: kunci, p_hari: hari, p_hal: Math\.max\(1, hal\), p_alasan: ALASAN_LAPORAN_KEBIASAAN,\s+\}\)/)
  })

  it('komponen memanggil keduanya dengan rentang halaman, butir terbuka, dan halaman dari pemanggil', () => {
    expect(komponen).toMatch(/api\.laporanKebiasaan\(props\.hari\)/)
    expect(komponen).toMatch(/api\.laporanKebiasaanDaftar\(butirTerbuka\.value, props\.hari, props\.hal\)/)
    expect(komponen).toMatch(/keKebiasaan\(/)
    expect(komponen).toMatch(/keDaftarKebiasaan\(/)
    // Tanpa butir terbuka atau tanpa izin pii daftar tidak dipanggil (setiap panggilan menulis audit).
    expect(komponen).toMatch(/const izinDaftar = computed\(\(\) => sesi\.boleh\('cashflow:pii'\)\)/)
    expect(komponen).toMatch(/const kunciDaftar = computed\(\(\) => \(butirTerbuka\.value && izinDaftar\.value \? /)
    expect(komponen).toMatch(/if \(!kunci\) \{[^}]*return Promise\.resolve\(false\) \}/)
  })

  it('baris butir tombol sungguhan, orang menautkan ke rincian pengguna', () => {
    expect(komponen).toMatch(/<button\s+type="button" class="cf-kebiasaan-tombol" :aria-expanded="b\.terbuka"/)
    expect(komponen).toMatch(/const kePengguna = \(id: string\) => `\/console\/cashflow\/pengguna\/\$\{id\}`/)
    expect(komponen.match(/<NuxtLink\s+:to="kePengguna\(o\.id\)"/g)).toHaveLength(2)
    expect(komponen).toMatch(/<CashflowHalaman /)
    expect(komponen).toMatch(/<CashflowIzinKurang v-if="!izinDaftar \|\| izinDitolak"/)
  })

  it('warna hanya dari token tema', () => {
    expect(komponen).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(|(?:bg|text|border)-(?:emerald|green|red|slate|gray|blue|amber)-\d/)
    expect(komponen).toMatch(/var\(--ca-/)
  })

  it('halaman memasang komponen dengan rentang, butir, dan halaman dari URL', () => {
    expect(halaman).toMatch(/<CashflowLaporanKebiasaan v-if="q\.bagian === 'kebiasaan'" :hari="hari" :butir="q\.butir" :hal="q\.hal"/)
    expect(halaman).toMatch(/butir: \{ jenis: 'teks', pola: POLA_KUNCI_KEBIASAAN, maks: MAKS_KUNCI_KEBIASAAN, bawaan: '' \}/)
  })

  it('galat kunci asing dilokalkan, bukan kalimat server', () => {
    expect(HINT_22023 as readonly string[]).toContain('kunci')
    const g = petakanGalat({ code: '22023', hint: 'kunci', message: 'Kunci tidak dikenal.' })
    expect([g.jenis, g.hint]).toEqual(['argumen', 'kunci'])
    expect(baca('composables/cashflow/useCashflowMuat.ts')).toMatch(/g\.hint === 'kunci'\) return tcf\('galat\.kunci'\)/)
  })
})

describe('data sintetis uji tampilan = DTO contoh', () => {
  const server = buatServer()
  const izin = { izin: true }
  const argumen = { p_kunci: 'banyak_ruang', p_hari: 30, p_hal: 1, p_alasan: `[admin] ${ALASAN_LAPORAN_KEBIASAAN}` }

  it('jumlah butir dan daftar berbentuk DTO, terbaca adapter', () => {
    const k = server.jawab('admin_laporan_kebiasaan', { p_hari: 30 }, izin).json as KebiasaanDTO
    expect(urutPohon(pohonContoh(k))).toEqual(urutPohon(pohonContoh(KEBIASAAN)))
    expect(k.butir.map(b => b.kunci)).toEqual([...KUNCI_KEBIASAAN])
    const d = server.jawab('admin_laporan_kebiasaan_daftar', argumen, izin).json as DaftarKebiasaanDTO
    expect(urutPohon(pohonContoh(d))).toEqual(urutPohon(pohonContoh(DAFTAR)))
    const domain = keDaftarKebiasaan(d)
    expect(domain.terbuka).toBe(true)
    expect(domain.total).toBe(keKebiasaan(k).butir.find(b => b.kunci === 'banyak_ruang')!.orang)
    expect(domain.baris).toHaveLength(50)
    expect(domain.baris.every(b => /@contoh\.invalid$/.test(b.email) && /^00000000-0000-4000-8000-\d{12}$/.test(b.id))).toBe(true)
  })

  it('tanpa alasan email tersamar, sesi tanpa izin pii ditolak, kunci asing 22023 kunci', () => {
    const d = keDaftarKebiasaan(server.jawab('admin_laporan_kebiasaan_daftar', { ...argumen, p_alasan: null }, izin).json as DaftarKebiasaanDTO)
    expect(d.terbuka).toBe(false)
    expect(d.baris.every(b => b.nama === '' && b.email.includes('***'))).toBe(true)
    expect(server.jawab('admin_laporan_kebiasaan_daftar', argumen, { izin: false }).json).toMatchObject({ code: '42501', hint: 'izin-kurang' })
    expect(server.jawab('admin_laporan_kebiasaan', { p_hari: 30 }, { izin: false }).json).toMatchObject({ hari: 30 })
    expect(server.jawab('admin_laporan_kebiasaan_daftar', { ...argumen, p_kunci: 'entah' }, izin).json).toMatchObject({ code: '22023', hint: 'kunci' })
  })
})
