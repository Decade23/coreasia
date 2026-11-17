/**
 * Pembelian kredit, saringan Sedang diproses dan Ditolak: pembelian Google
 * Play yang belum atau tidak jadi menjadi kredit (migrasi CashFlow
 * 20261117140000_play_proses).
 *
 * Yang dijaga:
 * - kontrak terkunci: kunci baris `proses` dan hitungan `proses` di contoh
 *   jawaban, lalu dibandingkan dengan badan admin_ai_pembelian_daftar dan cek
 *   tabel ai_pembelian_play_proses di folder migrasi (dilewati, terlihat
 *   "skipped", bila migrasinya belum ada);
 * - adapter tahan bentuk yang belum lengkap: tanpa kunci proses, kunci yang
 *   hilang, angka rusak, nilai keadaan/rinci/sumber yang belum dikenal;
 * - setiap kemungkinan keadaan dan sebab punya kalimat ID dan EN, dan tabel
 *   serta ringkasannya tidak pernah menulis kode mentah, "undefined", atau
 *   "NaN" (dirender lewat vue/server-renderer, tanpa Nuxt);
 * - server lama yang menolak p_status baru dibaca sebagai keadaan tenang;
 * - penjaga halaman: tanpa muat berkala, komponen tidak memanggil server,
 *   tanpa warna mentah, dan berkas publik tanpa data asli.
 *
 * Semua email, nama, dan id di sini karangan.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { computed, createSSRApp, h, ref, type Component } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AMBANG_GANTUNG_MENIT, KEADAAN_PROSES, RINCI_PROSES, SARING_STATUS_PEMBELIAN, STATUS_PEMBELIAN, STATUS_PROSES_PEMBELIAN, SUMBER_PROSES,
  bagianLama, halamanPembelian, keHitunganProses, kePembelian, keadaanTampil, kunciKeadaanProses, kunciSebabProses, lencanaProses,
  menggantungLama, menitSejak, pillStatusPembelian, prosesBelumDikenalServer, saringProses,
  type DaftarPembelianDTO, type PembelianDTO, type ProsesPembelianDTO,
} from '../../adapters/cashflowPembelian'
import { jamWib, tanggalPendek, waktuPendekWib, type BahasaWaktu } from '../../adapters/cashflowWaktu'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'
import { DIR_MIGRASI, adaMigrasiNomor, fungsiTerakhir, pohonContoh, semuaPohonJsonb, urutPohon, type PohonKunci } from './migrasi'

// ── Global tiruan (tanpa Nuxt, lihat vitest.config.ts) ───────────────────
type Jawab = { data: unknown; error: unknown }
const panggilan: Array<{ nama: string; a: Record<string, unknown> }> = []
let jawaban: Jawab = { data: null, error: null }
const sb = {
  auth: { getSession: async () => ({ data: { session: { access_token: 'x' } } }), signOut: async () => ({}) },
  rpc: async (nama: string, a: Record<string, unknown>) => { panggilan.push({ nama, a }); return jawaban },
}
let bahasa: BahasaWaktu = 'id'
const cari = (b: BahasaWaktu, jalur: string): unknown =>
  jalur.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), KAMUS_CASHFLOW[b])
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('useAdminAuth', () => ({ user: ref({ id: 'a', email: 'staf@contoh.id' }) }))
vi.stubGlobal('useCashflowSesi', () => ({ ambil: async () => sb, sambung: async () => ({ ok: true }), perluSambung: () => false, pelaku: ref('staf@contoh.id') }))
// Kamus sungguhan: kunci yang hilang tampil sebagai jalurnya, persis seperti tcf di Nuxt.
vi.stubGlobal('useCashflowI18n', () => ({
  tcf: (k: string) => cari(bahasa, k) ?? k,
  bahasa: computed(() => bahasa),
  formatTanggal: (v: string | null | undefined) => tanggalPendek(v, bahasa),
  formatJam: (v: string | null | undefined) => jamWib(v, bahasa),
  formatWaktu: (v: string | null | undefined) => waktuPendekWib(v, bahasa),
}))
vi.stubGlobal('useRoute', () => ({ fullPath: '/console/cashflow/pembelian' }))
vi.stubGlobal('useToast', () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }))
vi.stubGlobal('navigateTo', vi.fn())
const { useCashflowAdmin, petakanGalat, GalatAdmin } = await import('~/composables/cashflow/useCashflowAdmin')
const { default: ProsesTabel } = await import('../../components/cashflow/CashflowPembelianProsesTabel.vue')
const { default: ProsesRingkas } = await import('../../components/cashflow/CashflowPembelianProsesRingkas.vue')
const { default: StatTile } = await import('../../components/cashflow/CashflowStatTile.vue')

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (rel: string) => readFileSync(join(AKAR, rel), 'utf8')
const RPC = 'admin_ai_pembelian_daftar'

/* Patokan waktu tetap: jam 17.00 WIB. */
const KINI = Date.parse('2026-11-17T10:00:00Z')
const lalu = (menit: number) => new Date(KINI - menit * 60_000).toISOString()

/* Kontrak terkunci untuk dua saringan proses. */
const KONTRAK_PROSES: PohonKunci = {
  baris: {
    id: null, kode: null, waktu: null, status: null, jalur: null, paket: null, kredit: null, nominal: null, uji: null,
    pembeli: { user_id: null, email: null, nama: null },
    play: null,
    proses: {
      keadaan: null, rinci: null, produk: null, sumber: null, sejak: null, terakhir: null,
      dicoba_pada: null, percobaan: null, bisa_dicoba: null,
    },
  },
  ringkas: {
    lunas: null, nominal_lunas: null, perkiraan_diterima: null, batal: null,
    total_tidak_tersedia: null, diterima_tidak_tersedia: null, diterima_perkiraan: null,
  },
  lanjut: null,
  proses: { diproses: null, tertunda: null, gagal_sementara: null, ditolak: null, tertua: null },
}

const proses = (ubah: Partial<ProsesPembelianDTO> = {}): ProsesPembelianDTO => ({
  keadaan: 'tertunda', rinci: null, produk: 'kredit_40', sumber: 'aplikasi', sejak: lalu(10), terakhir: lalu(2),
  dicoba_pada: null, percobaan: 0, bisa_dicoba: true, ...ubah,
})
const baris = (n: number, ubah: Partial<PembelianDTO> = {}): PembelianDTO => ({
  id: `00000000-0000-4000-8000-0000000003${String(n).padStart(2, '0')}`, kode: null, waktu: lalu(10), status: 'diproses', jalur: 'play',
  paket: 'kredit_40', kredit: 40, nominal: 49000, uji: false,
  pembeli: { user_id: `00000000-0000-4000-8000-00000000010${n}`, email: `pembeli${n}@contoh.id`, nama: `Pembeli ${n}` },
  play: null, proses: proses(), ...ubah,
})
const DAFTAR_PROSES: Required<DaftarPembelianDTO> = {
  baris: [
    baris(1),
    baris(2, { waktu: lalu(190), proses: proses({ keadaan: 'gagal_sementara', sumber: 'sapu', sejak: lalu(190), terakhir: lalu(185), dicoba_pada: lalu(30), percobaan: '4', bisa_dicoba: false }) }),
  ],
  ringkas: { lunas: 0, nominal_lunas: 0, perkiraan_diterima: 0, batal: 0, total_tidak_tersedia: 0, diterima_tidak_tersedia: 0, diterima_perkiraan: 0 },
  lanjut: null,
  proses: { diproses: 2, tertunda: 1, gagal_sementara: 1, ditolak: 3, tertua: lalu(190) },
}

beforeEach(() => {
  panggilan.length = 0
  jawaban = { data: null, error: null }
  bahasa = 'id'
})

// ── Kontrak terkunci (tiruan, tanpa migrasi) ─────────────────────────────
describe('kontrak terkunci saringan proses', () => {
  it('contoh jawaban memuat persis kunci kontrak, tidak lebih dan tidak kurang', () => {
    expect(urutPohon(pohonContoh(DAFTAR_PROSES))).toEqual(urutPohon(KONTRAK_PROSES))
  })

  it('p_status diproses dan ditolak diteruskan apa adanya, saringan lain tidak berubah', async () => {
    jawaban = { data: DAFTAR_PROSES, error: null }
    for (const s of STATUS_PROSES_PEMBELIAN) await useCashflowAdmin().aiPembelianDaftar(s, null, null)
    expect(panggilan.map(p => [p.nama, p.a.p_status, p.a.p_jalur, p.a.p_sebelum])).toEqual([
      [RPC, 'diproses', null, null], [RPC, 'ditolak', null, null],
    ])
    expect(SARING_STATUS_PEMBELIAN).toEqual(['semua', 'lunas', 'menunggu', 'kedaluwarsa', 'batal', 'diproses', 'ditolak'])
    expect(STATUS_PROSES_PEMBELIAN.every(saringProses)).toBe(true)
    expect(['semua', ...STATUS_PEMBELIAN].some(saringProses)).toBe(false)
  })

  it('server lama: 22023 masukan_tidak_sah untuk p_status baru dibaca sebagai keadaan tenang', async () => {
    jawaban = { data: null, error: { code: '22023', message: 'masukan_tidak_sah', hint: 'status' } }
    const g = await useCashflowAdmin().aiPembelianDaftar('diproses', null, null).catch((e: unknown) => e)
    expect(g).toBeInstanceOf(GalatAdmin)
    expect(g).toMatchObject({ jenis: 'argumen', message: 'masukan_tidak_sah', hint: 'status' })
    const galat = g as InstanceType<typeof GalatAdmin>
    expect(prosesBelumDikenalServer(galat, 'diproses')).toBe(true)
    expect(prosesBelumDikenalServer(galat, 'ditolak')).toBe(true)
    expect(prosesBelumDikenalServer({ message: 'masukan_tidak_sah' }, 'ditolak')).toBe(true)
    // Saringan lama, hint jalur, atau galat lain: bukan "server lama".
    expect(prosesBelumDikenalServer(galat, 'lunas')).toBe(false)
    expect(prosesBelumDikenalServer({ message: 'masukan_tidak_sah', hint: 'jalur' }, 'diproses')).toBe(false)
    expect(prosesBelumDikenalServer(petakanGalat({ code: '42501', message: 'x', hint: 'izin-kurang' }), 'diproses')).toBe(false)
    expect(prosesBelumDikenalServer(null, 'diproses')).toBe(false)
  })
})

// ── Adapter ──────────────────────────────────────────────────────────────
describe('adapter: baris dan hitungan proses', () => {
  it('memetakan setiap kunci; angka teks ikut terbaca', () => {
    const h = halamanPembelian(DAFTAR_PROSES)
    expect(h.baris.map(b => b.status)).toEqual(['diproses', 'diproses'])
    expect(h.baris[1]!.proses).toEqual({
      keadaan: 'gagal_sementara', rinci: null, produk: 'kredit_40', sumber: 'sapu',
      sejakIso: lalu(190), terakhirIso: lalu(185), dicobaIso: lalu(30), percobaan: 4, bisaDicoba: false,
    })
    expect(h.proses).toEqual({ diproses: 2, tertunda: 1, gagalSementara: 1, ditolak: 3, tertuaIso: lalu(190) })
    expect(h.baris[0]!.play).toBeNull()
    expect(h.baris[0]!.kode).toBe('')
  })

  it('nilai yang belum dikenal atau rusak jatuh ke null, tidak dipaksa', () => {
    const p = kePembelian(baris(3, {
      status: 'baru_nanti',
      proses: { keadaan: 'baru_nanti', rinci: 'sebab_baru', produk: '  ', sumber: 'pos_merpati', sejak: 'kemarin', terakhir: '', dicoba_pada: null, percobaan: '-3', bisa_dicoba: 'ya' as unknown as boolean },
    })).proses
    expect(p).toEqual({
      keadaan: null, rinci: null, produk: null, sumber: null, sejakIso: null, terakhirIso: null, dicobaIso: null, percobaan: null, bisaDicoba: null,
    })
    expect(kePembelian(baris(3, { status: 'baru_nanti' })).status).toBeNull()
    // Rinci hanya berarti untuk ditolak: rinci di keadaan lain dibuang.
    expect(kePembelian(baris(4, { proses: proses({ keadaan: 'tertunda', rinci: 'akun_lain' }) })).proses?.rinci).toBeNull()
    expect(kePembelian(baris(4, { status: 'ditolak', proses: proses({ keadaan: 'ditolak', rinci: 'akun_lain' }) })).proses?.rinci).toBe('akun_lain')
  })

  it('tanpa kunci proses di baris atau di jawaban: null, bukan objek kosong atau nol', () => {
    const { proses: _p, ...tanpa } = baris(5)
    expect(kePembelian(tanpa as PembelianDTO).proses).toBeNull()
    expect(kePembelian(baris(5, { proses: null })).proses).toBeNull()
    const { proses: _h, ...lama } = DAFTAR_PROSES
    expect(halamanPembelian(lama).proses).toBeNull()
    expect(keHitunganProses(null)).toBeNull()
    expect(keHitunganProses('x')).toBeNull()
    // Hitungan rusak: tidak tersedia, bukan 0 dan bukan NaN.
    expect(keHitunganProses({ diproses: 'banyak', tertunda: -1, gagal_sementara: null, ditolak: '2', tertua: 'rusak' }))
      .toEqual({ diproses: null, tertunda: null, gagalSementara: null, ditolak: 2, tertuaIso: null })
    expect(keHitunganProses({})).toEqual({ diproses: null, tertunda: null, gagalSementara: null, ditolak: null, tertuaIso: null })
  })

  it('keadaan tampil: dari keadaan bila dikenal, dari status saringan bila tidak', () => {
    const k = (status: string | null, keadaan: string | null | undefined) =>
      keadaanTampil(kePembelian(baris(6, { status, proses: keadaan === undefined ? null : proses({ keadaan }) })))
    expect(k('diproses', 'tertunda')).toBe('tertunda')
    expect(k('diproses', 'gagal_sementara')).toBe('gagal_sementara')
    expect(k('ditolak', 'ditolak')).toBe('ditolak')
    expect(k('ditolak', 'baru_nanti')).toBe('ditolak')
    expect(k('ditolak', undefined)).toBe('ditolak')
    expect(k('diproses', 'baru_nanti')).toBe('diproses')
    expect(k('diproses', undefined)).toBe('diproses')
    expect(k(null, null)).toBe('diproses')
  })

  it('lencana: hanya yang belum bisa diperiksa bernada awas; lencana status diproses biru muda', () => {
    const l = (keadaan: string) => lencanaProses(kePembelian(baris(7, { status: keadaan === 'ditolak' ? 'ditolak' : 'diproses', proses: proses({ keadaan }) })))
    expect(l('tertunda')).toBe('cf-lencana')
    expect(l('gagal_sementara')).toBe('cf-lencana cf-lencana-awas')
    expect(l('ditolak')).toBe('cf-lencana cf-lencana-galat')
    expect(pillStatusPembelian('diproses')).toBe('ca-pill-info')
    expect(pillStatusPembelian('ditolak')).toBe('ca-pill-muted')
  })

  it('lama menunggu: menit sejak, ambang 1 jam, yang ditolak tidak pernah menggantung', () => {
    expect(menitSejak(lalu(61), KINI)).toBe(61)
    expect(menitSejak(new Date(KINI + 120_000).toISOString(), KINI)).toBe(0)
    expect(menitSejak('rusak', KINI)).toBeNull()
    expect(menitSejak(null, KINI)).toBeNull()
    const p = (menit: number, keadaan = 'tertunda', status = 'diproses') =>
      kePembelian(baris(8, { status, waktu: lalu(menit), proses: proses({ keadaan, sejak: lalu(menit) }) }))
    expect(AMBANG_GANTUNG_MENIT).toBe(60)
    expect(menggantungLama(p(60), KINI)).toBe(false)
    expect(menggantungLama(p(61), KINI)).toBe(true)
    expect(menggantungLama(p(500, 'gagal_sementara'), KINI)).toBe(true)
    expect(menggantungLama(p(5000, 'ditolak', 'ditolak'), KINI)).toBe(false)
    // Tanpa proses: waktu baris dipakai.
    expect(menggantungLama(kePembelian(baris(8, { waktu: lalu(90), proses: null })), KINI)).toBe(true)
    expect(bagianLama(0)).toEqual({ hari: 0, jam: 0, menit: 0 })
    expect(bagianLama(190)).toEqual({ hari: 0, jam: 3, menit: 10 })
    expect(bagianLama(2 * 1440 + 4 * 60 + 5)).toEqual({ hari: 2, jam: 4, menit: 5 })
  })
})

// ── Kamus ────────────────────────────────────────────────────────────────
/** Semua kemungkinan baris: tiap status, keadaan (termasuk yang belum dikenal), rinci, dan tanpa proses. */
const SEMUA_KEMUNGKINAN = [null, ...STATUS_PROSES_PEMBELIAN].flatMap(status => [
  kePembelian(baris(9, { status, proses: null })),
  ...[...KEADAAN_PROSES, 'baru_nanti', null].flatMap(keadaan => [...RINCI_PROSES, 'sebab_baru', null].map(rinci =>
    kePembelian(baris(9, { status, proses: proses({ keadaan, rinci }) })))),
])

describe('kamus saringan proses', () => {
  it('setiap keadaan dan sebab yang mungkin punya kalimat ID dan EN', () => {
    expect(SEMUA_KEMUNGKINAN.length).toBeGreaterThan(50)
    const kunci = new Set(SEMUA_KEMUNGKINAN.flatMap(p => [kunciKeadaanProses(p), kunciSebabProses(p)]))
    const hilang = [...kunci].flatMap(k => (['id', 'en'] as const).filter(b => typeof cari(b, k) !== 'string').map(b => `${b}:${k}`))
    expect(hilang).toEqual([])
    // Setiap rinci yang dikenal punya kalimatnya sendiri, bukan kalimat umum.
    for (const r of RINCI_PROSES) expect(kunci.has(`pembelian.proses.sebab.${r}`), r).toBe(true)
  })

  it('kunci dinamis halaman dan tabel ada di ID dan EN', () => {
    const jalur = [
      ...STATUS_PROSES_PEMBELIAN.flatMap(s => [
        `pembelian.status.${s}`, `pembelian.statusOpsi.${s}`, `pembelian.statusOpsiKet.${s}`,
        `pembelian.proses.ket.${s}`, `pembelian.proses.kosongJudul.${s}`, `pembelian.proses.kosong.${s}`,
      ]),
      'pembelian.proses.kosong.qris',
      ...SUMBER_PROSES.map(s => `pembelian.proses.dari.${s}`),
    ]
    const hilang = jalur.flatMap(j => (['id', 'en'] as const).filter(b => typeof cari(b, j) !== 'string').map(b => `${b}:${j}`))
    expect(hilang).toEqual([])
  })

  it('lama menunggu ditulis wajar di dua bahasa', () => {
    const f = (b: BahasaWaktu) => cari(b, 'pembelian.proses.lama') as (h: number, j: number, m: number) => string
    expect([[0, 0, 0], [0, 0, 25], [0, 3, 10], [0, 3, 0], [2, 4, 5], [1, 0, 0]].map(([h, j, m]) => f('id')(h!, j!, m!)))
      .toEqual(['kurang dari 1 mnt', '25 mnt', '3 jam 10 mnt', '3 jam', '2 hari 4 jam', '1 hari'])
    expect([[0, 0, 0], [0, 0, 25], [0, 3, 10], [1, 0, 0], [2, 4, 5]].map(([h, j, m]) => f('en')(h!, j!, m!)))
      .toEqual(['under 1 min', '25 min', '3 h 10 min', '1 day', '2 days 4 h'])
    expect((cari('en', 'pembelian.proses.kali') as (n: number) => string)(1)).toBe('1 time')
    expect((cari('id', 'pembelian.proses.kali') as (n: number) => string)(4)).toBe('4 kali')
  })

  it('teks tanpa em-dash, titik koma, tanda seru, emoji, atau kata gratis', () => {
    const semua = (v: unknown): string[] => typeof v === 'string' ? [v]
      : typeof v === 'function' ? [String((v as (...a: unknown[]) => unknown)(3, 'x', 'y'))]
        : v && typeof v === 'object' ? Object.values(v).flatMap(semua) : []
    for (const b of ['id', 'en'] as const) {
      const teks = [...semua(cari(b, 'pembelian.proses')), ...semua(cari(b, 'pembelian.statusOpsiKet'))]
      expect(teks.length).toBeGreaterThan(40)
      expect(teks.filter(t => /[—–;!]|\p{Extended_Pictographic}|gratis|\bfree\b/iu.test(t)), b).toEqual([])
    }
  })
})

// ── Tampilan (vue/server-renderer) ───────────────────────────────────────
const Ikon = { props: ['name'], render(this: { name: string }) { return h('i', { 'data-ikon': this.name }) } }
const render = (komponen: Component, props: Record<string, unknown>) => {
  const app = createSSRApp({ render: () => h(komponen, props) })
  app.component('Icon', Ikon)
  app.component('CashflowStatTile', StatTile)
  return renderToString(app)
}
/** Teks yang terbaca orang: tanpa tag dan atribut. */
const teksSaja = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#39;/g, '\'').replace(/\s+/g, ' ')
/** Kode server dan jalur kamus yang tidak boleh terbaca di layar. */
const MENTAH = /\b(?:gagal_sementara|batal_google|akun_lain|sudah_batal|tidak_dikenal|baru_nanti|sebab_baru|pos_merpati|tertunda|rtdn|sapu|ditolakLain|tanpaRincian)\b|pembelian\.\w|undefined|\bnull\b|NaN/

const BARIS_TAMPIL = [
  baris(1),
  baris(2, { waktu: lalu(190), proses: proses({ keadaan: 'gagal_sementara', sumber: 'sapu', sejak: lalu(190), dicoba_pada: lalu(30), percobaan: 4, bisa_dicoba: false }) }),
  baris(3, { status: 'ditolak', waktu: lalu(2900), uji: true, proses: proses({ keadaan: 'ditolak', rinci: 'sebab_baru', sumber: 'rtdn', sejak: lalu(2900), bisa_dicoba: false }) }),
  baris(4, { proses: null }),
  baris(5, { proses: proses({ keadaan: 'baru_nanti', sumber: 'pos_merpati', percobaan: '-3', bisa_dicoba: 'ya' as unknown as boolean }) }),
  baris(6, { paket: null, kredit: null, nominal: null, waktu: null, pembeli: null, proses: { keadaan: null, rinci: null, produk: null, sumber: null, sejak: null, terakhir: null, dicoba_pada: null, percobaan: null, bisa_dicoba: null } }),
  ...RINCI_PROSES.map((rinci, i) => baris(10 + i, { status: 'ditolak', proses: proses({ keadaan: 'ditolak', rinci, sumber: 'rtdn', bisa_dicoba: false }) })),
].map(kePembelian)

describe('tabel dan kartu proses', () => {
  it('menulis keadaan dan sebab dalam kalimat awam, tanpa kode mentah, di ID dan EN', async () => {
    for (const b of ['id', 'en'] as const) {
      bahasa = b
      const teks = teksSaja(await render(ProsesTabel, { daftar: BARIS_TAMPIL, kiniMs: KINI }))
      expect(teks.match(MENTAH), b).toBeNull()
    }
    bahasa = 'id'
    const teks = teksSaja(await render(ProsesTabel, { daftar: BARIS_TAMPIL, kiniMs: KINI }))
    for (const t of [
      'Menunggu pembayaran', 'Belum bisa diperiksa', 'Ditolak', 'Sedang diproses',
      'Google masih menunggu pembeli menyelesaikan pembayaran', 'Sebab rincinya belum dikenal halaman ini',
      'Server tidak mengirim rincian keadaannya', 'Keadaan rincinya belum dikenal halaman ini',
      'Server mencoba lagi sendiri', 'Server tidak bisa mencoba lagi sendiri',
      'Belum pernah', '4 kali', 'Tidak tersedia', 'Tidak terbaca', 'Email tidak ada', '40 kredit', 'Rp',
      'Kabar terakhir', 'dari pemeriksaan server', 'dari aplikasi pembeli', 'dari kabar Google', 'Uji',
      'Google membatalkan pembayaran ini sebelum lunas', 'milik akun CashFlow lain', 'Google sudah mengembalikan dana pesanan ini',
      'tidak lolos pemeriksaan',
    ]) expect(teks, t).toContain(t)
  })

  it('yang menunggu lebih dari 1 jam diberi tanda jam bernada awas, yang ditolak tidak', async () => {
    const html = await render(ProsesTabel, { daftar: BARIS_TAMPIL, kiniMs: KINI })
    // Baris 2 (190 menit) dan baris 4 (tanpa proses, waktu baris 10 menit) : hanya baris 2.
    expect(html.match(/data-uji="pembelian-proses-lama"/g)).toHaveLength(1)
    expect(html.match(/data-ikon="lucide:clock-alert"/g)).toHaveLength(2)
    expect(teksSaja(html)).toContain('3 jam 10 mnt')
    // Baris ditolak 2 hari lalu tetap menulis lamanya, tanpa nada awas.
    expect(teksSaja(html)).toContain('2 hari')
    expect(html).not.toMatch(/ca-tone-danger|bg-\[var\(--ca-danger-bg\)\]/)
  })

  it('ponsel dan layar lebar memuat baris yang sama, email dan nama teks polos', async () => {
    const html = await render(ProsesTabel, { daftar: [kePembelian(baris(1, { pembeli: { user_id: null, email: 'budi@contoh.id', nama: '<b>Budi</b>' } }))], kiniMs: KINI })
    expect(html).toMatch(/data-uji="pembelian-proses-kartu"[^>]*>[\s\S]*budi@contoh\.id/)
    expect(html).toMatch(/data-uji="pembelian-proses-tabel"[\s\S]*budi@contoh\.id/)
    expect(html).toContain('&lt;b&gt;Budi&lt;/b&gt;')
    expect(html).not.toContain('<b>Budi</b>')
  })
})

describe('ringkasan proses', () => {
  const hit = (ubah: Record<string, unknown> = {}) => keHitunganProses({ ...DAFTAR_PROSES.proses, ...ubah })!

  it('lebih dari 1 jam: panel awas yang tenang (bukan merah), tombol ke Sedang diproses hanya di Ditolak', async () => {
    const diproses = await render(ProsesRingkas, { hitungan: hit(), kiniMs: KINI, status: 'diproses' })
    expect(diproses).toMatch(/data-uji="pembelian-proses-perhatian"/)
    expect(diproses).toMatch(/role="status"/)
    expect(diproses).not.toMatch(/role="alert"|ca-tone-danger|--ca-danger-bg/)
    expect(diproses).toMatch(/bg-\[var\(--ca-gold-bg\)\]/)
    expect(teksSaja(diproses)).toContain('Ada pembelian yang menunggu lebih dari 1 jam')
    expect(teksSaja(diproses)).toContain('sudah 3 jam 10 mnt')
    expect(diproses).not.toMatch(/pembelian-proses-lihat-diproses/)
    const ditolak = await render(ProsesRingkas, { hitungan: hit(), kiniMs: KINI, status: 'ditolak' })
    expect(ditolak).toMatch(/data-uji="pembelian-proses-lihat-diproses"/)
  })

  it('kurang dari 1 jam: kalimat biasa; tidak ada yang menunggu: dikatakan', async () => {
    const muda = teksSaja(await render(ProsesRingkas, { hitungan: hit({ tertua: lalu(20) }), kiniMs: KINI, status: 'diproses' }))
    expect(muda).toContain('Yang paling lama menunggu sejak')
    expect(muda).toContain('sudah 20 mnt')
    expect(muda).not.toContain('lebih dari 1 jam')
    const kosong = teksSaja(await render(ProsesRingkas, { hitungan: hit({ diproses: 0, tertunda: 0, gagal_sementara: 0, tertua: null }), kiniMs: KINI, status: 'diproses' }))
    expect(kosong).toContain('Tidak ada pembelian yang sedang menunggu.')
  })

  it('angka yang tidak dikirim tertulis Tidak tersedia, tanpa kode atau NaN, di ID dan EN', async () => {
    for (const b of ['id', 'en'] as const) {
      bahasa = b
      const teks = teksSaja(await render(ProsesRingkas, { hitungan: keHitunganProses({})!, kiniMs: KINI, status: 'ditolak' }))
      expect(teks.match(MENTAH), b).toBeNull()
      expect(teks.split(b === 'id' ? 'Tidak tersedia' : 'Unavailable').length - 1, b).toBe(4)
    }
  })
})

// ── Penjaga halaman dan kebersihan ───────────────────────────────────────
const HAL = 'pages/console/cashflow/pembelian.vue'
const KOMPONEN = ['components/cashflow/CashflowPembelianProsesTabel.vue', 'components/cashflow/CashflowPembelianProsesRingkas.vue']

describe('penjaga halaman saringan proses', () => {
  it('server lama ditulis tenang (role status) sebelum izin dan galat, dengan jalan kembali', () => {
    const hal = baca(HAL)
    expect(hal).toMatch(/const serverLama = computed\(\(\) => prosesBelumDikenalServer\(galat\.value, q\.value\.status\)\)/)
    const blok = /<div\s+v-else-if="serverLama"[\s\S]*?<\/div>\s*<CashflowIzinKurang/.exec(hal)?.[0] ?? ''
    expect(blok).toMatch(/role="status"/)
    expect(blok).not.toMatch(/role="alert"|ca-tone-danger/)
    expect(blok).toMatch(/@click="setel\(\{ status: 'semua' \}\)"/)
    expect(hal.indexOf('v-else-if="serverLama"')).toBeLessThan(hal.indexOf('v-else-if="pesanGalat"'))
    expect(hal.indexOf('v-if="belumAktif"')).toBeLessThan(hal.indexOf('v-else-if="serverLama"'))
  })

  it('ringkasan nol dibuang di saringan proses, hitungan dan tabel proses dipakai', () => {
    const hal = baca(HAL)
    expect(hal).toMatch(/ringkas\.value = a\.status && saringProses\(a\.status\) \? null : h\.ringkas/)
    expect(hal).toMatch(/hitungan\.value = h\.proses/)
    expect(hal).toMatch(/<CashflowPembelianProsesRingkas\s+v-if="statusProses && hitungan"/)
    expect(hal).toMatch(/<CashflowPembelianProsesTabel v-else-if="statusProses" :daftar="daftar" :kini-ms="kini" \/>/)
    // Lama menunggu dari saat jawaban diterima, tanpa pengatur waktu.
    expect(hal).toMatch(/kini\.value = Date\.now\(\)/)
    expect(hal).not.toMatch(/setInterval|setTimeout|useIntervalFn/)
  })

  it('QRIS mati di saringan proses, dan pindah ke saringan proses mengembalikan jalur QRIS ke semua', () => {
    const hal = baca(HAL)
    expect(hal).toMatch(/statusProses\.value && j === 'qris' \? \{ mati: true, ket: tcf\('pembelian\.proses\.hanyaPlay'\)/)
    expect(hal).toMatch(/saringProses\(v\) && q\.value\.jalur === 'qris' \? \{ status: v, jalur: 'semua'/)
  })

  it('komponen tidak memanggil server, tanpa v-html, tanpa warna mentah', () => {
    for (const k of KOMPONEN) {
      const isi = baca(k)
      expect(isi, k).not.toMatch(/useCashflowAdmin|\.rpc\(|\$fetch|useFetch|setInterval|setTimeout/)
      expect(isi, k).not.toMatch(/v-html|innerHTML/)
      expect(isi, k).not.toMatch(/#[0-9a-fA-F]{3,8}\b|bg-white|text-black|bg-black|text-white|(?:bg|text|border)-(?:gray|slate|zinc|red|green|blue|amber|emerald|sky|rose)-\d/)
    }
  })

  it('repo publik: berkas baru tanpa jalur lokal atau email nyata', () => {
    for (const f of [HAL, ...KOMPONEN, 'adapters/cashflowPembelian.ts', 'tests/cashflow/pembelian-proses.test.ts']) {
      const isi = baca(f)
      expect(isi, f).not.toMatch(/\/Users\/|@gmail\.|@coreasia\.id/)
      for (const email of isi.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? []) expect(email, f).toMatch(/@contoh\.id$/)
    }
  })
})

// ── Kontrak terhadap migrasi CashFlow ────────────────────────────────────
const ADA_PROSES = adaMigrasiNomor('20261117140000')
/** Kunci objek PERTAMA (bersarang ikut) yang memuat semua penanda, urut abjad. */
const semuaObjek = (p: PohonKunci): PohonKunci[] => [p, ...Object.values(p).flatMap(v => (v ? semuaObjek(v) : []))]
const kunciObjek = (badan: string, ...penanda: string[]): string[] | null => {
  const o = semuaPohonJsonb(badan).flatMap(semuaObjek).find(t => penanda.every(k => k in t))
  return o ? Object.keys(o).sort() : null
}
const kunci = (p: PohonKunci | null | undefined): string[] => Object.keys(p ?? {}).sort()
/** Daftar literal di `… in ('a', 'b')` yang cocok pola, urut abjad. */
const daftarLiteral = (sql: string, pola: RegExp): string[] | null => {
  const m = pola.exec(sql)
  return m ? [...m[1]!.matchAll(/'([^']+)'/g)].map(x => x[1]!).sort() : null
}
const sqlMigrasi = () => readdirSync(DIR_MIGRASI).filter(n => n.endsWith('.sql')).sort()
  .map(n => readFileSync(join(DIR_MIGRASI, n), 'utf8').replace(/--[^\n]*/g, '')).join('\n')

describe.skipIf(!ADA_PROSES)(`kontrak migrasi saringan proses (${DIR_MIGRASI})`, () => {
  it('p_status menerima persis saringan halaman, cabang proses persis dua status baru', () => {
    const badan = fungsiTerakhir(RPC).badan
    expect(daftarLiteral(badan, /p_status\s+not\s+in\s*\(([^)]*)\)/i)).toEqual(SARING_STATUS_PEMBELIAN.filter(s => s !== 'semua').sort())
    expect(daftarLiteral(badan, /if\s+p_status\s+in\s*\(([^)]*)\)\s+then/i)).toEqual([...STATUS_PROSES_PEMBELIAN].sort())
  })

  it('bentuk baris proses = kontrak terkunci, tanpa hash token atau token terenkripsi', () => {
    const badan = fungsiTerakhir(RPC).badan
    expect(kunciObjek(badan, 'proses', 'kode', 'jalur')).toEqual(kunci(KONTRAK_PROSES.baris))
    expect(kunciObjek(badan, 'proses', 'kode', 'jalur')).not.toContain('token_sha256')
    expect(kunciObjek(badan, 'keadaan', 'bisa_dicoba')).toEqual(kunci(KONTRAK_PROSES.baris!.proses))
    expect(kunciObjek(badan, 'keadaan', 'bisa_dicoba')).not.toEqual(expect.arrayContaining(['sandi']))
    expect(kunciObjek(badan, 'tertunda', 'tertua')).toEqual(kunci(KONTRAK_PROSES.proses))
    // Baris proses: kode null, jalur play, play null, status = saringannya.
    expect(badan).toMatch(/'kode',\s*null,[\s\S]*'status',\s*p_status,\s*'jalur',\s*'play',[\s\S]*'play',\s*null,\s*'proses',\s*jsonb_build_object/)
    // Kunci proses di atas hanya ditempel bila ada hitungannya.
    expect(badan).toMatch(/\|\|\s*case\s+when\s+v_proses\s+is\s+not\s+null\s+then\s+jsonb_build_object\(\s*'proses',\s*v_proses\s*\)/i)
  })

  it('hitungan tanpa akun uji dan tanpa catatan yang kreditnya sudah masuk', () => {
    const badan = fungsiTerakhir(RPC).badan
    const hitung = badan.slice(badan.indexOf("'gagal_sementara', count(*)"))
    expect(hitung).toMatch(/where\s+not\s+public\.ai_pembelian_uji_inti\(x\.user_id\)/)
    expect(hitung).toMatch(/not\s+exists\s*\(select\s+1\s+from\s+public\.ai_pembelian_play\s+p\s+where\s+p\.token_sha256\s*=\s*x\.token_sha256\)/)
    expect(hitung).toMatch(/'tertua',\s*min\(x\.pertama_dilihat\)\s+filter\s*\(where\s+x\.keadaan\s*<>\s*'ditolak'\)/)
  })

  it('nilai keadaan, rinci, dan sumber = cek tabel ai_pembelian_play_proses', () => {
    const sql = sqlMigrasi()
    expect(daftarLiteral(sql, /ai_pembelian_play_proses_keadaan_check\s+check\s*\(\s*keadaan\s+in\s*\(([^)]*)\)/i)).toEqual([...KEADAAN_PROSES].sort())
    expect(daftarLiteral(sql, /ai_pembelian_play_proses_rinci_check\s+check\s*\(\s*\(\s*keadaan\s*=\s*'ditolak'\s+and\s+rinci\s+in\s*\(([^)]*)\)/i)).toEqual([...RINCI_PROSES].sort())
    expect(daftarLiteral(sql, /ai_pembelian_play_proses_sumber_check\s+check\s*\(\s*sumber\s+in\s*\(([^)]*)\)/i)).toEqual([...SUMBER_PROSES].sort())
  })
})

it.skipIf(ADA_PROSES)('migrasi 20261117140000 belum ada di folder CashFlow: kontrak migrasi proses dilewati', () => {
  expect(ADA_PROSES).toBe(false)
})
