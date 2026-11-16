/**
 * Halaman "Domi: penyedia cadangan": adapter (bentuk data, aturan simpan,
 * aturan kunci, galat), lapisan RPC dengan Supabase tiruan, komposabel
 * halaman tanpa Nuxt, kamus, dan penjaga halaman.
 *
 * Yang paling dijaga: kunci API tidak pernah tertinggal di state, toast,
 * galat, atau argumen selain p_kunci.
 *
 * Semua kunci, sidik, model, dan waktu di sini karangan.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { computed, isRef, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AWALAN_KUNCI, GALAT_MAKS, KODE_GALAT_CADANGAN, KUNCI_DISAMARKAN, KUNCI_MAKS, KUNCI_MIN,
  alasanTakSimpan, isianDariKeadaan, keAiCadangan, kodeGalatCadangan, periksaKunci, rapikanKunci, samarkanKunci, tanpaKunci,
  type AiCadangan, type AiCadanganDTO,
} from '../../adapters/cashflowAiCadangan'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'

// ── Global tiruan (tanpa Nuxt, lihat vitest.config.ts) ───────────────────
type Jawab = { data: unknown; error: unknown }
const panggilan: Array<{ nama: string; a: Record<string, unknown> }> = []
let antrean: Jawab[] = []
let jawaban: Jawab = { data: null, error: null }
const sb = {
  auth: { getSession: async () => ({ data: { session: { access_token: 'x' } } }), signOut: async () => ({}) },
  rpc: async (nama: string, a: Record<string, unknown>) => { panggilan.push({ nama, a }); return antrean.shift() ?? jawaban },
}
const toast = { success: vi.fn(), error: vi.fn(), info: vi.fn() }
const pindah = vi.fn()
let izin: string[] = ['cashflow:view', 'cashflow:pii']
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('useAdminAuth', () => ({ user: ref({ id: 'a', email: 'staf@contoh.id' }) }))
vi.stubGlobal('useCashflowSesi', () => ({
  ambil: async () => sb, sambung: async () => ({ ok: true }), perluSambung: () => false, pelaku: ref('staf@contoh.id'),
  boleh: (i: string) => izin.includes(i),
}))
vi.stubGlobal('useCashflowI18n', () => ({ tcf: (k: string) => k }))
vi.stubGlobal('useRoute', () => ({ fullPath: '/console/cashflow/domi' }))
vi.stubGlobal('useToast', () => toast)
vi.stubGlobal('navigateTo', pindah)
const { useCashflowAdmin, petakanGalat, galatTulisCadangan, GalatAdmin } = await import('~/composables/cashflow/useCashflowAdmin')
const { useCashflowMuat } = await import('~/composables/cashflow/useCashflowMuat')
vi.stubGlobal('useCashflowAdmin', useCashflowAdmin)
vi.stubGlobal('useCashflowMuat', useCashflowMuat)
const { useCashflowAiCadangan } = await import('~/composables/cashflow/useCashflowAiCadangan')

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (rel: string) => readFileSync(join(AKAR, rel), 'utf8')

const KUNCI = `${AWALAN_KUNCI}karangan-UJI_0123456789abcdef`
const KUNCI_LAIN = `${AWALAN_KUNCI}karangan-LAIN_fedcba9876543210`
const W = '2026-11-16T03:05:00.000Z'
/* Jawaban lengkap persis kontrak: cadangan menyala, kunci ada. */
const AKTIF: AiCadanganDTO = {
  aktif: true, model: 'model-b', model_pilihan: ['model-a', 'model-b'], kunci_ada: true, kunci_sidik: 'ab12cd34ef',
  kunci_diubah_pada: W, terakhir_dipakai_pada: '2026-11-16T02:00:00.000Z', dipakai_24_jam: 7,
  terakhir_galat: 'batas laju terlampaui', terakhir_galat_pada: '2026-11-15T10:00:00.000Z',
  utama_terakhir_galat: 'server 503', utama_terakhir_galat_pada: '2026-11-16T01:59:00.000Z',
}
/* Belum ada kunci: cadangan mati, tanpa riwayat. */
const KOSONG: AiCadanganDTO = {
  aktif: false, model: 'model-a', model_pilihan: ['model-a', 'model-b'], kunci_ada: false, kunci_sidik: null, kunci_diubah_pada: null,
  terakhir_dipakai_pada: null, dipakai_24_jam: 0, terakhir_galat: null, terakhir_galat_pada: null,
  utama_terakhir_galat: null, utama_terakhir_galat_pada: null,
}
const BELUM_ADA = { code: 'PGRST202', message: 'Could not find the function public.admin_ai_cadangan_baca without parameters in the schema cache' }
const keadaan = (dto: unknown): AiCadangan => {
  const k = keAiCadangan(dto)
  if (!k) throw new Error('bentuk tidak dikenal')
  return k
}
/** Semua teks yang bisa dilihat atau disimpan dari sebuah nilai (ref dibuka). */
const serial = (v: unknown): string => JSON.stringify(v, (_k, x) => (isRef(x) ? { value: x.value } : x))

beforeEach(() => {
  panggilan.length = 0
  antrean = []
  jawaban = { data: null, error: null }
  izin = ['cashflow:view', 'cashflow:pii']
  toast.success.mockClear(); toast.error.mockClear(); toast.info.mockClear()
  pindah.mockClear()
})

// ── Adapter: bentuk data ─────────────────────────────────────────────────
describe('adapter: jawaban server menjadi keadaan halaman', () => {
  it('jawaban lengkap dipetakan kolom demi kolom', () => {
    expect(keadaan(AKTIF)).toEqual({
      aktif: true, model: 'model-b', modelPilihan: ['model-a', 'model-b'], kunciAda: true, kunciSidik: 'ab12cd34ef', kunciDiubahPada: W,
      terakhirDipakaiPada: '2026-11-16T02:00:00.000Z', dipakai24Jam: 7,
      galatCadangan: { pesan: 'batas laju terlampaui', pada: '2026-11-15T10:00:00.000Z' },
      galatUtama: { pesan: 'server 503', pada: '2026-11-16T01:59:00.000Z' },
    })
  })

  it('belum ada kunci: mati, tanpa sidik, tanpa riwayat', () => {
    const k = keadaan(KOSONG)
    expect(k).toMatchObject({ aktif: false, kunciAda: false, kunciSidik: null, kunciDiubahPada: null, terakhirDipakaiPada: null, dipakai24Jam: 0 })
    expect(k.galatCadangan).toBeNull()
    expect(k.galatUtama).toBeNull()
  })

  it('bentuk yang bukan jawaban kontrak ditolak (null), bukan dijadikan keadaan karangan', () => {
    for (const v of [null, undefined, '', 'aktif', 7, true, [], [AKTIF], {}, { data: AKTIF }, { galat: 'x' }]) expect(keAiCadangan(v), JSON.stringify(v)).toBeNull()
  })

  it('nilai aneh per kolom jatuh ke nilai aman', () => {
    const k = keadaan({
      aktif: 'true', model: 7, model_pilihan: 'model-a', kunci_ada: 1, kunci_sidik: 'ab12cd34ef', kunci_diubah_pada: W,
      terakhir_dipakai_pada: 'kemarin', dipakai_24_jam: 'banyak', terakhir_galat: 404, terakhir_galat_pada: W,
      utama_terakhir_galat: '   ', utama_terakhir_galat_pada: W,
    })
    expect(k).toEqual({
      aktif: false, model: '', modelPilihan: [], kunciAda: false, kunciSidik: null, kunciDiubahPada: null, terakhirDipakaiPada: null,
      dipakai24Jam: null, galatCadangan: null, galatUtama: null,
    })
  })

  it('hanya true yang berarti menyala atau ada kunci', () => {
    for (const v of [1, 'true', 'ya', {}, [], null, undefined]) {
      expect(keadaan({ ...AKTIF, aktif: v }).aktif).toBe(false)
      expect(keadaan({ ...AKTIF, kunci_ada: v }).kunciAda).toBe(false)
    }
  })

  it('pilihan model: hanya teks, tanpa kosong dan ganda, dan model yang dipakai selalu ikut', () => {
    expect(keadaan({ ...AKTIF, model_pilihan: ['model-a', ' model-a ', '', null, 3, 'model-c'], model: 'model-b' }).modelPilihan).toEqual(['model-a', 'model-c', 'model-b'])
    expect(keadaan({ ...AKTIF, model_pilihan: null, model: 'model-b' }).modelPilihan).toEqual(['model-b'])
    expect(keadaan({ ...AKTIF, model_pilihan: null, model: null }).modelPilihan).toEqual([])
    expect(keadaan({ ...AKTIF, model_pilihan: Array.from({ length: 200 }, (_, i) => `m-${i}`) }).modelPilihan.length).toBeLessThanOrEqual(50)
  })

  it('hitungan 24 jam: angka atau teks angka, tidak negatif, dibulatkan ke bawah', () => {
    expect(keadaan({ ...AKTIF, dipakai_24_jam: '12' }).dipakai24Jam).toBe(12)
    expect(keadaan({ ...AKTIF, dipakai_24_jam: 3.9 }).dipakai24Jam).toBe(3)
    for (const v of [-1, Number.NaN, Infinity, '', null, undefined, {}, true]) expect(keadaan({ ...AKTIF, dipakai_24_jam: v }).dipakai24Jam, String(v)).toBeNull()
  })

  it('sidik yang rupanya kunci, atau memuat karakter aneh, tidak ditampilkan', () => {
    for (const v of [KUNCI, 'sk-ant-pendek', 'SK-abcdef', 'ab 12', '<b>x</b>', 'ab', 'x'.repeat(65), 5]) expect(keadaan({ ...AKTIF, kunci_sidik: v }).kunciSidik, String(v)).toBeNull()
    expect(keadaan({ ...AKTIF, kunci_sidik: ' sha256:ab12cd34ef ' }).kunciSidik).toBe('sha256:ab12cd34ef')
  })

  it('tanpa kunci, sidik dan waktu ganti yang tertinggal diabaikan', () => {
    expect(keadaan({ ...AKTIF, kunci_ada: false })).toMatchObject({ kunciAda: false, kunciSidik: null, kunciDiubahPada: null })
  })

  it('catatan galat: satu baris, dipotong, dan apa pun yang rupanya kunci disamarkan', () => {
    const panjang = keadaan({ ...AKTIF, terakhir_galat: 'x'.repeat(GALAT_MAKS + 50) }).galatCadangan!.pesan
    expect([...panjang].length).toBe(GALAT_MAKS + 1)
    expect(panjang.endsWith('…')).toBe(true)
    expect(keadaan({ ...AKTIF, terakhir_galat: 'baris satu\n\tbaris\u0000dua' }).galatCadangan!.pesan).toBe('baris satu baris dua')
    const bocor = keadaan({ ...AKTIF, terakhir_galat: `401 invalid x-api-key ${KUNCI}`, utama_terakhir_galat: 'Incorrect API key provided: sk-proj-abcdefghijkl' })
    expect(bocor.galatCadangan!.pesan).toBe(`401 invalid x-api-key ${KUNCI_DISAMARKAN}`)
    expect(bocor.galatUtama!.pesan).toBe(`Incorrect API key provided: ${KUNCI_DISAMARKAN}`)
    expect(keadaan({ ...AKTIF, terakhir_galat_pada: 'rusak' }).galatCadangan).toEqual({ pesan: 'batas laju terlampaui', pada: null })
  })
})

// ── Adapter: aturan simpan dan kunci ─────────────────────────────────────
describe('adapter: kapan setelan bisa disimpan', () => {
  it('isian awal mengikuti server; model kosong jatuh ke pilihan pertama', () => {
    expect(isianDariKeadaan(keadaan(AKTIF))).toEqual({ aktif: true, model: 'model-b' })
    expect(isianDariKeadaan(keadaan({ ...KOSONG, model: '' }))).toEqual({ aktif: false, model: 'model-a' })
    expect(isianDariKeadaan(keadaan({ ...KOSONG, model: '', model_pilihan: [] }))).toEqual({ aktif: false, model: '' })
  })

  it('menyalakan tanpa kunci ditolak lebih dulu dari apa pun', () => {
    expect(alasanTakSimpan(keadaan(KOSONG), { aktif: true, model: 'model-b' })).toBe('kunciBelumAda')
    expect(alasanTakSimpan(keadaan({ ...KOSONG, model_pilihan: [], model: '' }), { aktif: true, model: '' })).toBe('kunciBelumAda')
  })

  it('tanpa kunci, model tetap bisa diganti selama cadangan mati', () => {
    expect(alasanTakSimpan(keadaan(KOSONG), { aktif: false, model: 'model-b' })).toBeNull()
  })

  it('model kosong, model di luar daftar, dan tanpa perubahan', () => {
    const k = keadaan(AKTIF)
    expect(alasanTakSimpan(k, { aktif: true, model: '' })).toBe('modelKosong')
    expect(alasanTakSimpan(k, { aktif: true, model: 'model-z' })).toBe('modelAsing')
    expect(alasanTakSimpan(k, { aktif: true, model: 'model-b' })).toBe('tanpaPerubahan')
    expect(alasanTakSimpan(k, { aktif: false, model: 'model-b' })).toBeNull()
    expect(alasanTakSimpan(k, { aktif: true, model: 'model-a' })).toBeNull()
  })

  it('server bilang menyala padahal kunci tidak ada: mematikan tetap bisa', () => {
    const k = keadaan({ ...AKTIF, kunci_ada: false })
    expect(alasanTakSimpan(k, { aktif: true, model: 'model-b' })).toBe('kunciBelumAda')
    expect(alasanTakSimpan(k, { aktif: false, model: 'model-b' })).toBeNull()
  })
})

describe('adapter: periksa kunci di klien', () => {
  it('kunci berawalan sk-ant- dengan panjang wajar lolos, spasi di ujung dibuang', () => {
    expect(periksaKunci(KUNCI)).toBeNull()
    expect(periksaKunci(`  ${KUNCI}\n`)).toBeNull()
    expect(rapikanKunci(`  ${KUNCI}\n`)).toBe(KUNCI)
  })

  it('kosong, awalan salah, spasi di tengah, terlalu pendek, terlalu panjang', () => {
    expect(periksaKunci('')).toBe('kosong')
    expect(periksaKunci('   ')).toBe('kosong')
    expect(periksaKunci('sk-proj-abcdefghijklmnopqrstuvwxyz')).toBe('awalan')
    expect(periksaKunci(`SK-ANT-${'a'.repeat(30)}`)).toBe('awalan')
    expect(periksaKunci(`${AWALAN_KUNCI}abc def-ghijklmnop`)).toBe('spasi')
    expect(periksaKunci(`${AWALAN_KUNCI}abc`)).toBe('pendek')
    expect(periksaKunci(AWALAN_KUNCI + 'a'.repeat(KUNCI_MIN - AWALAN_KUNCI.length))).toBeNull()
    expect(periksaKunci(AWALAN_KUNCI + 'a'.repeat(KUNCI_MAKS))).toBe('panjang')
  })
})

describe('adapter: galat server', () => {
  it('tiap kode kontrak dikenali dari pesan atau hint', () => {
    for (const k of KODE_GALAT_CADANGAN) {
      expect(kodeGalatCadangan({ message: k })).toBe(k)
      expect(kodeGalatCadangan({ message: ` ${k} ` })).toBe(k)
      expect(kodeGalatCadangan({ message: 'ditolak', hint: k })).toBe(k)
    }
    for (const g of [null, undefined, {}, { message: 'paket_tidak_sah' }, { message: 'kunci_tidak_sah_lagi' }, { message: 7 }]) expect(kodeGalatCadangan(g as never)).toBeNull()
  })

  it('pesan ke admin kalimat awam, bukan kode mentah', () => {
    const { pesanUntuk } = useCashflowMuat()
    expect(pesanUntuk(petakanGalat({ code: '22023', message: 'model_tidak_dikenal' }))).toBe('cadangan.galat.modelTidakDikenal')
    expect(pesanUntuk(petakanGalat({ code: 'P0001', message: 'kunci_belum_ada' }))).toBe('cadangan.galat.kunciBelumAda')
    expect(pesanUntuk(petakanGalat({ code: '22023', message: 'kunci_tidak_sah' }))).toBe('cadangan.galat.kunciTidakSah')
    expect(pesanUntuk(petakanGalat(BELUM_ADA, 'admin_ai_cadangan_baca'))).toBe('galat.belumAktif')
  })

  it('kunci dibuang dari teks galat: yang baru dikirim, dan apa pun yang rupanya kunci', () => {
    expect(tanpaKunci(`nilai ${KUNCI} ditolak`, KUNCI)).toBe(`nilai ${KUNCI_DISAMARKAN} ditolak`)
    expect(tanpaKunci(`nilai ${KUNCI} ditolak`, `  ${KUNCI} `)).toBe(`nilai ${KUNCI_DISAMARKAN} ditolak`)
    expect(tanpaKunci(`nilai ${KUNCI_LAIN} ditolak`, null)).toBe(`nilai ${KUNCI_DISAMARKAN} ditolak`)
    expect(tanpaKunci('kunci "rahasia-tanpa-awalan" ditolak', 'rahasia-tanpa-awalan')).toBe(`kunci "${KUNCI_DISAMARKAN}" ditolak`)
    expect(tanpaKunci('kunci_tidak_sah', KUNCI)).toBe('kunci_tidak_sah')
    expect(samarkanKunci('tanpa rahasia')).toBe('tanpa rahasia')
  })
})

// ── Lapisan RPC ──────────────────────────────────────────────────────────
describe('lapisan RPC (Supabase tiruan)', () => {
  const api = useCashflowAdmin()

  it('baca tanpa argumen, simpan dengan p_aktif dan p_model, kunci hanya di p_kunci', async () => {
    jawaban = { data: AKTIF, error: null }
    expect(await api.aiCadanganBaca()).toEqual(AKTIF)
    await api.aiCadanganSimpan(false, 'model-a')
    await api.aiCadanganKunci(KUNCI)
    await api.aiCadanganKunci(null)
    expect(panggilan).toEqual([
      { nama: 'admin_ai_cadangan_baca', a: {} },
      { nama: 'admin_ai_cadangan_simpan', a: { p_aktif: false, p_model: 'model-a' } },
      { nama: 'admin_ai_cadangan_kunci', a: { p_kunci: KUNCI } },
      { nama: 'admin_ai_cadangan_kunci', a: { p_kunci: null } },
    ])
  })

  it('RPC belum ada di server (PGRST202, atau 42883 untuk RPC itu sendiri) jadi belum-aktif di ketiganya', async () => {
    const kerja: Array<[string, () => Promise<unknown>]> = [
      ['admin_ai_cadangan_baca', () => api.aiCadanganBaca()],
      ['admin_ai_cadangan_simpan', () => api.aiCadanganSimpan(true, 'model-a')],
      ['admin_ai_cadangan_kunci', () => api.aiCadanganKunci(KUNCI)],
    ]
    for (const [nama, panggil] of kerja) {
      jawaban = { data: null, error: { ...BELUM_ADA } }
      await expect(panggil(), nama).rejects.toMatchObject({ jenis: 'belum-aktif' })
      jawaban = { data: null, error: { code: '42883', message: `function public.${nama}() does not exist` } }
      await expect(panggil(), nama).rejects.toMatchObject({ jenis: 'belum-aktif' })
    }
    // 42883 untuk fungsi LAIN di dalamnya bukan "belum aktif".
    jawaban = { data: null, error: { code: '42883', message: 'function public.lain() does not exist' } }
    await expect(api.aiCadanganBaca()).rejects.toMatchObject({ jenis: 'lain' })
  })

  it('kode galat kontrak diteruskan apa adanya', async () => {
    for (const k of ['model_tidak_dikenal', 'kunci_belum_ada']) {
      jawaban = { data: null, error: { code: '22023', message: k } }
      await expect(api.aiCadanganSimpan(true, 'model-a')).rejects.toMatchObject({ jenis: 'argumen', message: k })
    }
    jawaban = { data: null, error: { code: '22023', message: 'kunci_tidak_sah' } }
    await expect(api.aiCadanganKunci(KUNCI)).rejects.toMatchObject({ jenis: 'argumen', message: 'kunci_tidak_sah' })
  })

  it('42501 tanpa hint di tulisan (izin pii kurang) jadi izin, bukan "bukan admin"', async () => {
    jawaban = { data: null, error: { code: '42501', message: 'ditolak' } }
    await expect(api.aiCadanganSimpan(true, 'model-a')).rejects.toMatchObject({ jenis: 'izin', hint: 'izin-kurang' })
    await expect(api.aiCadanganKunci(KUNCI)).rejects.toMatchObject({ jenis: 'izin', hint: 'izin-kurang' })
    await expect(api.aiCadanganBaca()).rejects.toMatchObject({ jenis: 'bukan-admin' })
  })

  it('galat server yang mengulang kunci dibersihkan sebelum sampai ke halaman', async () => {
    jawaban = { data: null, error: { code: 'XX000', message: `gagal menyimpan ${KUNCI}`, hint: `nilai: ${KUNCI}` } }
    const g = await api.aiCadanganKunci(KUNCI).catch(e => e)
    expect(g).toBeInstanceOf(GalatAdmin)
    expect(`${g.message} ${g.hint}`).not.toContain(KUNCI)
    expect(g.message).toBe(`gagal menyimpan ${KUNCI_DISAMARKAN}`)
    expect(() => galatTulisCadangan({ code: 'XX000', message: `x ${KUNCI_LAIN}` })).toThrow(`x ${KUNCI_DISAMARKAN}`)
  })
})

// ── Komposabel halaman ───────────────────────────────────────────────────
describe('komposabel: memuat', () => {
  it('berhasil: keadaan dan isian form mengikuti server', async () => {
    jawaban = { data: AKTIF, error: null }
    const c = useCashflowAiCadangan()
    expect(c.memuat.value).toBe(true)
    await c.muatAwal()
    expect(c.memuat.value).toBe(false)
    expect(c.keadaan.value).toMatchObject({ aktif: true, model: 'model-b', kunciAda: true })
    expect([c.isianAktif.value, c.isianModel.value]).toEqual([true, 'model-b'])
    expect(c.alasanSimpan.value).toBe('tanpaPerubahan')
    expect(c.bisaSimpan.value).toBe(false)
    expect(c.belumAktif.value).toBe(false)
  })

  it('RPC belum ada: keadaan "belum tersedia" yang tenang, tanpa toast dan tanpa pindah halaman', async () => {
    jawaban = { data: null, error: { ...BELUM_ADA } }
    const c = useCashflowAiCadangan()
    await c.muatAwal()
    expect(c.belumAktif.value).toBe(true)
    expect(c.keadaan.value).toBeNull()
    expect(c.pesanGalat.value).toBe('galat.belumAktif')
    expect(toast.error).not.toHaveBeenCalled()
    expect(pindah).not.toHaveBeenCalled()
  })

  it('jawaban berbentuk aneh tidak dipasang sebagai keadaan', async () => {
    jawaban = { data: [AKTIF], error: null }
    const c = useCashflowAiCadangan()
    await c.muatAwal()
    expect(c.keadaan.value).toBeNull()
    expect(c.bisaSimpan.value).toBe(false)
  })

  it('galat lain tampil di halaman; sesi hilang pindah ke /masuk', async () => {
    jawaban = { data: null, error: { code: 'XX000', message: 'server sedang sibuk' } }
    const c = useCashflowAiCadangan()
    await c.muatAwal()
    expect(c.belumAktif.value).toBe(false)
    expect(c.pesanGalat.value).toBe('server sedang sibuk')
    jawaban = { data: null, error: { code: '42501', message: 'x', hint: 'izin-kurang' } }
    await c.muatAwal()
    expect(c.galat.value?.jenis).toBe('izin')
  })

  it('halaman ditinggal saat masih memuat: jawaban yang terlambat tidak dipasang', async () => {
    let lepas!: (j: Jawab) => void
    const asli = sb.rpc
    sb.rpc = async (nama, a) => { panggilan.push({ nama, a }); return new Promise<Jawab>((r) => { lepas = r }) }
    try {
      const c = useCashflowAiCadangan()
      const p = c.muatAwal()
      await vi.waitFor(() => expect(panggilan.length).toBe(1))
      c.buang()
      lepas({ data: AKTIF, error: null })
      await p
      expect(c.keadaan.value).toBeNull()
      expect(c.memuat.value).toBe(false)
    } finally { sb.rpc = asli }
  })
})

describe('komposabel: sakelar, model, simpan', () => {
  const siap = async (dto: AiCadanganDTO) => {
    jawaban = { data: dto, error: null }
    const c = useCashflowAiCadangan()
    await c.muatAwal()
    panggilan.length = 0
    return c
  }

  it('belum ada kunci: sakelar tidak bisa dinyalakan dan simpan tidak mengirim apa pun', async () => {
    const c = await siap(KOSONG)
    expect(c.butuhKunci.value).toBe(true)
    c.setelAktif(true)
    expect(c.isianAktif.value).toBe(false)
    c.isianAktif.value = true // dipaksa dari luar: penjaga simpan tetap menahan
    expect(c.alasanSimpan.value).toBe('kunciBelumAda')
    expect(c.bisaSimpan.value).toBe(false)
    await c.simpan()
    expect(panggilan).toEqual([])
  })

  it('belum ada kunci: model tetap bisa diganti', async () => {
    const c = await siap(KOSONG)
    c.isianModel.value = 'model-b'
    expect(c.bisaSimpan.value).toBe(true)
    jawaban = { data: { ...KOSONG, model: 'model-b' }, error: null }
    await c.simpan()
    expect(panggilan).toEqual([{ nama: 'admin_ai_cadangan_simpan', a: { p_aktif: false, p_model: 'model-b' } }])
    expect(c.keadaan.value?.model).toBe('model-b')
    expect(toast.success).toHaveBeenCalledWith('cadangan.hasil.mati')
  })

  it('mematikan dan mengganti model: satu panggilan, keadaan dari jawabannya, tanpa baca ulang', async () => {
    const c = await siap(AKTIF)
    c.setelAktif(false)
    c.isianModel.value = 'model-a'
    jawaban = { data: { ...AKTIF, aktif: false, model: 'model-a' }, error: null }
    await c.simpan()
    expect(panggilan).toEqual([{ nama: 'admin_ai_cadangan_simpan', a: { p_aktif: false, p_model: 'model-a' } }])
    expect(c.keadaan.value).toMatchObject({ aktif: false, model: 'model-a' })
    expect(c.alasanSimpan.value).toBe('tanpaPerubahan')
    expect(c.sibuk.value).toBeNull()
  })

  it('model_tidak_dikenal dan kunci_belum_ada: kalimat awam, lalu keadaan dibaca ulang', async () => {
    for (const [kode, kalimat] of [['model_tidak_dikenal', 'cadangan.galat.modelTidakDikenal'], ['kunci_belum_ada', 'cadangan.galat.kunciBelumAda']] as const) {
      const c = await siap(AKTIF)
      toast.error.mockClear()
      c.isianModel.value = 'model-a'
      antrean = [{ data: null, error: { code: '22023', message: kode } }, { data: KOSONG, error: null }]
      await c.simpan()
      expect(toast.error).toHaveBeenCalledWith(kalimat)
      expect(toast.success).not.toHaveBeenCalled()
      expect(panggilan.map(p => p.nama)).toEqual(['admin_ai_cadangan_simpan', 'admin_ai_cadangan_baca'])
      expect(c.keadaan.value?.kunciAda).toBe(false)
      expect(c.sibuk.value).toBeNull()
    }
  })

  it('izin kurang: tombol tulis mati sesudahnya', async () => {
    const c = await siap(AKTIF)
    c.setelAktif(false)
    jawaban = { data: null, error: { code: '42501', message: 'ditolak' } }
    await c.simpan()
    expect(c.bolehUbah.value).toBe(false)
    expect(c.bisaSimpan.value).toBe(false)
    expect(toast.error).toHaveBeenCalledWith('galat.izinKurang')
  })

  it('sesi tanpa cashflow:pii: tidak ada tulisan yang berangkat', async () => {
    izin = ['cashflow:view']
    const c = await siap(AKTIF)
    c.setelAktif(false)
    expect(c.isianAktif.value).toBe(true)
    c.isiKunci(KUNCI)
    await c.simpan()
    await c.mintaSimpanKunci()
    c.mintaHapusKunci()
    expect(c.konfirmasi.value).toBeNull()
    expect(panggilan).toEqual([])
  })

  it('RPC simpan belum ada di server: halaman pindah ke "belum tersedia"', async () => {
    const c = await siap(AKTIF)
    c.setelAktif(false)
    jawaban = { data: null, error: { ...BELUM_ADA } }
    await c.simpan()
    expect(c.belumAktif.value).toBe(true)
  })

  it('sesi hilang saat menyimpan: pindah ke /masuk tanpa toast', async () => {
    const c = await siap(AKTIF)
    c.setelAktif(false)
    jawaban = { data: null, error: { code: '42501', message: 'x', hint: 'sesi-konsol' } }
    await c.simpan()
    expect(pindah).toHaveBeenCalledWith({ path: '/console/cashflow/masuk', query: { sebab: 'sesi', ke: '/console/cashflow/domi' } })
    expect(toast.error).not.toHaveBeenCalled()
  })
})

describe('komposabel: kunci API', () => {
  const siap = async (dto: AiCadanganDTO) => {
    jawaban = { data: dto, error: null }
    const c = useCashflowAiCadangan()
    await c.muatAwal()
    panggilan.length = 0
    return c
  }
  /** Kunci tidak boleh ada di mana pun selain argumen p_kunci. */
  const tanpaJejak = (c: ReturnType<typeof useCashflowAiCadangan>, kunci: string) => {
    expect(c.kunci.value).toBe('')
    expect(serial(c)).not.toContain(kunci)
    const pesan = [...toast.success.mock.calls, ...toast.error.mock.calls, ...toast.info.mock.calls, ...pindah.mock.calls]
    expect(JSON.stringify(pesan)).not.toContain(kunci)
  }

  it('kunci tidak pernah diisi dari server', async () => {
    const c = await siap({ ...AKTIF, kunci: KUNCI, p_kunci: KUNCI } as AiCadanganDTO)
    expect(c.kunci.value).toBe('')
    expect(serial(c)).not.toContain(KUNCI)
  })

  it('kunci pertama: dikirim tanpa konfirmasi, lalu tidak tersisa di state', async () => {
    const c = await siap(KOSONG)
    c.isiKunci(`  ${KUNCI}  `)
    jawaban = { data: { ...KOSONG, kunci_ada: true, kunci_sidik: 'ab12cd34ef', kunci_diubah_pada: W }, error: null }
    await c.mintaSimpanKunci()
    expect(panggilan).toEqual([{ nama: 'admin_ai_cadangan_kunci', a: { p_kunci: KUNCI } }])
    expect(c.keadaan.value).toMatchObject({ kunciAda: true, kunciSidik: 'ab12cd34ef' })
    expect(c.butuhKunci.value).toBe(false)
    expect(toast.success).toHaveBeenCalledWith('cadangan.hasil.kunciDisimpan')
    tanpaJejak(c, KUNCI)
  })

  it('kunci yang tidak lolos periksa klien tidak dikirim, dan galatnya berupa kode', async () => {
    const c = await siap(KOSONG)
    for (const [isi, kode] of [['', 'kosong'], ['sk-proj-abcdefghijklmnopqrstuvwxyz', 'awalan'], [`${AWALAN_KUNCI}a b cdefghijklmnop`, 'spasi'], [`${AWALAN_KUNCI}abc`, 'pendek']] as const) {
      c.isiKunci(isi)
      await c.mintaSimpanKunci()
      expect(c.galatKunci.value).toBe(kode)
    }
    expect(panggilan).toEqual([])
    expect(c.konfirmasi.value).toBeNull()
    c.isiKunci('x')
    expect(c.galatKunci.value).toBeNull()
  })

  it('mengganti kunci yang sudah ada: konfirmasi dulu, batal tidak mengirim', async () => {
    const c = await siap(AKTIF)
    c.isiKunci(KUNCI_LAIN)
    await c.mintaSimpanKunci()
    expect(c.konfirmasi.value).toBe('ganti')
    expect(panggilan).toEqual([])
    c.tutupKonfirmasi()
    expect(c.konfirmasi.value).toBeNull()
    expect(panggilan).toEqual([])
    expect(c.kunci.value).toBe(KUNCI_LAIN) // batal: isian tetap supaya bisa dilanjutkan
  })

  it('mengganti kunci sesudah setuju: terkirim sekali, dialog tertutup, kunci tidak tersisa', async () => {
    const c = await siap(AKTIF)
    c.isiKunci(KUNCI_LAIN)
    await c.mintaSimpanKunci()
    jawaban = { data: { ...AKTIF, kunci_sidik: 'ff00ff00ff' }, error: null }
    await c.setuju()
    expect(panggilan).toEqual([{ nama: 'admin_ai_cadangan_kunci', a: { p_kunci: KUNCI_LAIN } }])
    expect(c.konfirmasi.value).toBeNull()
    expect(c.keadaan.value?.kunciSidik).toBe('ff00ff00ff')
    expect(toast.success).toHaveBeenCalledWith('cadangan.hasil.kunciDiganti')
    tanpaJejak(c, KUNCI_LAIN)
  })

  it('menghapus kunci: konfirmasi dulu, lalu p_kunci null dan cadangan mati', async () => {
    const c = await siap(AKTIF)
    c.isiKunci(KUNCI_LAIN)
    c.mintaHapusKunci()
    expect(c.konfirmasi.value).toBe('hapus')
    expect(panggilan).toEqual([])
    jawaban = { data: KOSONG, error: null }
    await c.setuju()
    expect(panggilan).toEqual([{ nama: 'admin_ai_cadangan_kunci', a: { p_kunci: null } }])
    expect(c.keadaan.value).toMatchObject({ aktif: false, kunciAda: false })
    expect(c.konfirmasi.value).toBeNull()
    expect(toast.success).toHaveBeenCalledWith('cadangan.hasil.kunciDihapus')
    tanpaJejak(c, KUNCI_LAIN)
  })

  it('tanpa kunci tersimpan tidak ada yang bisa dihapus', async () => {
    const c = await siap(KOSONG)
    c.mintaHapusKunci()
    expect(c.konfirmasi.value).toBeNull()
  })

  it('kunci_tidak_sah: galat di kolomnya dengan kalimat awam, tanpa toast, dialog tertutup', async () => {
    const c = await siap(AKTIF)
    c.isiKunci(KUNCI_LAIN)
    await c.mintaSimpanKunci()
    jawaban = { data: null, error: { code: '22023', message: 'kunci_tidak_sah' } }
    await c.setuju()
    expect(c.galatKunci.value).toBe('server')
    expect(c.konfirmasi.value).toBeNull()
    expect(toast.error).not.toHaveBeenCalled()
    expect(c.keadaan.value?.kunciSidik).toBe('ab12cd34ef') // kunci lama tetap
    expect(c.sibuk.value).toBeNull()
  })

  it('galat server yang mengulang kunci: toast dan state galat tidak memuatnya', async () => {
    const c = await siap(KOSONG)
    c.isiKunci(KUNCI)
    jawaban = { data: null, error: { code: 'XX000', message: `tidak bisa menyimpan ${KUNCI}`, hint: KUNCI } }
    await c.mintaSimpanKunci()
    expect(toast.error).toHaveBeenCalledWith(`tidak bisa menyimpan ${KUNCI_DISAMARKAN}`)
    expect(JSON.stringify(toast.error.mock.calls)).not.toContain(KUNCI)
    expect(serial({ ...c, kunci: null })).not.toContain(KUNCI)
    c.buang()
    tanpaJejak(c, KUNCI)
  })

  it('meninggalkan halaman mengosongkan kunci yang sedang diketik dan menutup dialog', async () => {
    const c = await siap(AKTIF)
    c.isiKunci(KUNCI_LAIN)
    await c.mintaSimpanKunci()
    expect(c.konfirmasi.value).toBe('ganti')
    c.buang()
    expect(c.kunci.value).toBe('')
    expect(c.galatKunci.value).toBeNull()
    expect(c.konfirmasi.value).toBeNull()
    expect(serial(c)).not.toContain(KUNCI_LAIN)
  })

  it('jawaban tulisan berbentuk aneh: keadaan dibaca ulang, kunci tetap dikosongkan', async () => {
    const c = await siap(KOSONG)
    c.isiKunci(KUNCI)
    antrean = [{ data: 'ok', error: null }, { data: { ...KOSONG, kunci_ada: true, kunci_sidik: 'ab12cd34ef' }, error: null }]
    await c.mintaSimpanKunci()
    expect(panggilan.map(p => p.nama)).toEqual(['admin_ai_cadangan_kunci', 'admin_ai_cadangan_baca'])
    expect(c.keadaan.value?.kunciAda).toBe(true)
    tanpaJejak(c, KUNCI)
  })

  it('satu tulisan pada satu waktu: klik kedua saat sibuk diabaikan', async () => {
    const c = await siap(KOSONG)
    c.isiKunci(KUNCI)
    jawaban = { data: { ...KOSONG, kunci_ada: true }, error: null }
    const a = c.mintaSimpanKunci()
    const b = c.mintaSimpanKunci()
    await Promise.all([a, b])
    expect(panggilan.length).toBe(1)
  })
})

// ── Kamus dan halaman ────────────────────────────────────────────────────
const ambil = (bahasa: 'id' | 'en', jalur: string): unknown =>
  jalur.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), KAMUS_CASHFLOW[bahasa])
function semuaTeks(v: unknown): string[] {
  if (typeof v === 'string') return [v]
  if (typeof v === 'function') return [String((v as (...a: unknown[]) => unknown)(3, 'x', 'y'))]
  if (v && typeof v === 'object') return Object.values(v).flatMap(semuaTeks)
  return []
}
const HAL = 'pages/console/cashflow/domi.vue'
const KOMPONEN = ['CashflowCadanganStatus', 'CashflowCadanganSetelan', 'CashflowCadanganKunci', 'CashflowCadanganKonfirmasi']

describe('kamus dan halaman', () => {
  it('kunci dinamis punya teks ID dan EN', () => {
    const jalur = [
      'nav.domi', 'cadangan.judul', 'cadangan.belumAktifJudul', 'cadangan.belumAktif',
      ...['kosong', 'awalan', 'spasi', 'pendek', 'panjang', 'server'].map(k => `cadangan.kunci.galat.${k}`),
      ...['ganti', 'hapus'].flatMap(k => [`cadangan.konfirmasi.${k}Judul`, `cadangan.konfirmasi.${k}Ket`]),
      ...['nyala', 'mati', 'kunciDisimpan', 'kunciDiganti', 'kunciDihapus'].map(k => `cadangan.hasil.${k}`),
      ...['modelTidakDikenal', 'kunciBelumAda', 'kunciTidakSah'].map(k => `cadangan.galat.${k}`),
    ]
    const hilang = jalur.flatMap(j => (['id', 'en'] as const).filter(b => typeof ambil(b, j) !== 'string').map(b => `${b}:${j}`))
    expect(hilang).toEqual([])
  })

  it('teks tanpa em-dash, titik koma, atau emoji', () => {
    for (const b of ['id', 'en'] as const) {
      const teks = [...semuaTeks(ambil(b, 'cadangan')), String(ambil(b, 'nav.domi'))]
      expect(teks.length).toBeGreaterThan(50)
      expect(teks.filter(t => /[—–;]|\p{Extended_Pictographic}/u.test(t)), b).toEqual([])
    }
  })

  it('judul halaman dan kalimat status mengikuti permintaan', () => {
    expect(ambil('id', 'cadangan.judul')).toBe('Domi: penyedia cadangan')
    const f = (b: 'id' | 'en', k: string) => ambil(b, k) as (...a: unknown[]) => string
    expect(`${f('id', 'cadangan.status.kunciSidik')('ab12cd34ef')}, ${f('id', 'cadangan.status.kunciDiganti')('16 Nov 2026 10.05')}`)
      .toBe('Kunci tersimpan, sidik ab12cd34ef, diganti 16 Nov 2026 10.05')
    expect(f('id', 'cadangan.status.kali')(7)).toBe('7 kali')
    expect(f('id', 'cadangan.status.kali')(0)).toBe('Tidak dipakai')
    expect(f('en', 'cadangan.status.kali')(1)).toBe('1 time')
    expect(f('en', 'cadangan.status.kali')(7)).toBe('7 times')
  })

  it('halaman memakai penjaga console + admin CashFlow, dan tertaut dari navigasi dan palet di samping Paket kredit', () => {
    expect(baca(HAL)).toMatch(/definePageMeta\(\{ layout: 'console', middleware: \['console', 'cashflow-admin'\] \}\)/)
    expect(baca('components/cashflow/CashflowNav.vue')).toMatch(/\{ kunci: 'domi', to: '\/console\/cashflow\/domi' \},\n\s*\{ kunci: 'paket',/)
    expect(baca('components/cashflow/CashflowPalet.vue')).toMatch(/\{ kunci: 'domi', ke: '\/console\/cashflow\/domi'[^\n]*\n\s*\{ kunci: 'paket',/)
  })

  it('server hanya dipanggil lewat useCashflowAdmin di komposabel; halaman dan komponen tidak mengambil data', () => {
    expect(baca('composables/cashflow/useCashflowAiCadangan.ts')).toMatch(/useCashflowAdmin\(\)/)
    for (const f of [HAL, ...KOMPONEN.map(k => `components/cashflow/${k}.vue`)]) {
      expect(baca(f), f).not.toMatch(/useCashflowAdmin|\.rpc\(|\$fetch|useFetch|supabase/i)
    }
  })

  it('kolom kunci: password, autocomplete off, tanpa name, dan tidak diisi dari keadaan server', () => {
    const sumber = baca('components/cashflow/CashflowCadanganKunci.vue')
    const masukan = /<input[\s\S]*?>/.exec(sumber)?.[0] ?? ''
    expect(masukan).toMatch(/type="password"/)
    expect(masukan).toMatch(/autocomplete="off"/)
    expect(masukan).toMatch(/:value="nilai"/)
    expect(masukan).not.toMatch(/\sname=/)
    expect(sumber).not.toMatch(/keadaan|kunciSidik/)
    expect(baca(HAL)).toMatch(/onBeforeUnmount\(\(\) => \{ c\.buang\(\) \}\)/)
  })

  it('kunci tidak masuk log, URL, storage, atau state yang dipersistenkan', () => {
    const berkas = ['composables/cashflow/useCashflowAiCadangan.ts', 'adapters/cashflowAiCadangan.ts', HAL, ...KOMPONEN.map(k => `components/cashflow/${k}.vue`)]
    for (const f of berkas) {
      const kode = baca(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/^\s*\/\/.*$/gm, '')
      expect(kode, f).not.toMatch(/console\.|localStorage|sessionStorage|useState\(|useCookie|useRoute\(|router\.|navigateTo|query|document\.cookie|indexedDB|telemetri|gtag|dataLayer/)
    }
  })

  it('terang dan gelap: tanpa warna mentah, semua lewat token tema', () => {
    for (const f of [HAL, ...KOMPONEN.map(k => `components/cashflow/${k}.vue`)]) {
      expect(baca(f), f).not.toMatch(/#[0-9a-fA-F]{3,8}\b|bg-white|text-black|bg-black|text-white|rgba?\(/)
    }
  })
})
