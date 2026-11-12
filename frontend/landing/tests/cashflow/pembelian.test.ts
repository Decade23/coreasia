/**
 * Halaman Pembelian kredit: adapter (bentuk baris, ringkasan, kursor,
 * gabung halaman), kontrak terkunci lewat contoh jawaban dan Supabase
 * tiruan, galat, kamus, penjaga halaman, dan kontrak terhadap migrasi
 * CashFlow.
 *
 * Kontrak terkunci (bentuk jsonb admin_ai_pembelian_daftar) ditulis sekali di
 * KONTRAK dan dibandingkan dengan contoh jawaban, sehingga DTO dan contoh tidak
 * bisa diam-diam menyimpang darinya. Begitu fungsinya ada di folder migrasi
 * CashFlow (tests/cashflow/migrasi.ts), bentuk yang sama dibandingkan dengan
 * badan fungsinya. Sebelum itu bagian migrasi DILEWATI dan terlihat "skipped".
 *
 * Semua email, nama, id, kode, dan nomor pesanan di sini karangan.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { computed, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BATAS_DAFTAR_PEMBELIAN, JALUR_PEMBELIAN, SARING_JALUR_PEMBELIAN, SARING_STATUS_PEMBELIAN, STATUS_PEMBELIAN,
  barisPembelian, gabungPembelian, halamanPembelian, kePembelian, keRingkasPembelian, kursorSesudah, masukanTidakSah,
  pillStatusPembelian, playBelumDikonsumsi, saringPembelianKeServer,
  type DaftarPembelianDTO, type PembelianDTO, type Pembelian,
} from '../../adapters/cashflowPembelian'
import {
  adaMigrasi, DIR_MIGRASI, fungsiTerakhir, parameterFungsi, pohonContoh, semuaPohonJsonb, urutPohon, type PohonKunci,
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
vi.stubGlobal('useRoute', () => ({ fullPath: '/console/cashflow/pembelian' }))
vi.stubGlobal('useToast', () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }))
vi.stubGlobal('navigateTo', vi.fn())
const { useCashflowAdmin, petakanGalat } = await import('~/composables/cashflow/useCashflowAdmin')
const { useCashflowMuat } = await import('~/composables/cashflow/useCashflowMuat')

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (rel: string) => readFileSync(join(AKAR, rel), 'utf8')

const RPC = 'admin_ai_pembelian_daftar'
const W1 = '2026-11-12T08:15:00+00:00'
const W2 = '2026-11-11T23:40:00+00:00'

/* Kontrak terkunci: kunci jsonb persis seperti yang dijanjikan RPC. Elemen
   larik diwakili satu elemen; null = daun. */
const KONTRAK: PohonKunci = {
  baris: {
    id: null, kode: null, waktu: null, status: null, jalur: null, paket: null, kredit: null, nominal: null, uji: null,
    pembeli: { user_id: null, email: null, nama: null },
    play: { order: null, dikonsumsi: null, batal_pada: null },
  },
  ringkas: { lunas: null, nominal_lunas: null, perkiraan_diterima: null, batal: null },
  lanjut: null,
}

/* Satu baris Play dengan setiap kunci, seperti yang dipulangkan server. */
const BARIS_PLAY: Required<PembelianDTO> = {
  id: '00000000-0000-4000-8000-0000000000a1', kode: '7Q2M9KXA', waktu: W1, status: 'lunas', jalur: 'play',
  paket: 'hemat', kredit: 50, nominal: 40000, uji: false,
  pembeli: { user_id: '00000000-0000-4000-8000-000000000001', email: 'budi@contoh.id', nama: 'Budi Contoh' },
  play: { order: 'GPA.0000-1111-2222-33333', dikonsumsi: true, batal_pada: null },
}
const BARIS_QRIS: PembelianDTO = {
  id: '00000000-0000-4000-8000-0000000000a2', kode: 'B4N1QR1S', waktu: W2, status: 'menunggu', jalur: 'qris',
  paket: 'mini', kredit: '10', nominal: '12000', uji: true,
  pembeli: { user_id: '00000000-0000-4000-8000-000000000002', email: 'sari@contoh.id', nama: null },
  play: null,
}
const DAFTAR: Required<DaftarPembelianDTO> = {
  baris: [BARIS_PLAY, BARIS_QRIS],
  ringkas: { lunas: 3, nominal_lunas: '115000', perkiraan_diterima: 97750, batal: 1 },
  lanjut: W2,
}
const beli = (ubah: Partial<Pembelian> = {}): Pembelian => ({ ...kePembelian(BARIS_PLAY), ...ubah })

beforeEach(() => {
  panggilan.length = 0
  jawaban = { data: null, error: null }
})

// ── Adapter ──────────────────────────────────────────────────────────────
describe('adapter: baris pembelian', () => {
  it('memetakan setiap kunci, angka teks ikut terbaca', () => {
    expect(kePembelian(BARIS_PLAY)).toEqual({
      id: BARIS_PLAY.id, kode: '7Q2M9KXA', waktuIso: W1, status: 'lunas', jalur: 'play', paket: 'hemat', kredit: 50, nominal: 40000,
      uji: false,
      pembeli: { userId: '00000000-0000-4000-8000-000000000001', email: 'budi@contoh.id', nama: 'Budi Contoh' },
      play: { order: 'GPA.0000-1111-2222-33333', dikonsumsi: true, batalIso: null },
    })
    const q = kePembelian(BARIS_QRIS)
    expect([q.kredit, q.nominal, q.uji, q.play, q.pembeli.nama]).toEqual([10, 12000, true, null, null])
  })

  it('nilai asing atau rusak jatuh ke null, tidak dipaksa', () => {
    const p = kePembelian({
      ...BARIS_PLAY, status: 'refund', jalur: 'kartu', kredit: 'banyak', nominal: '12.5', kode: '  ', paket: '', uji: null,
      pembeli: { user_id: null, email: '   ', nama: '' }, play: { order: '', dikonsumsi: null, batal_pada: '' },
    })
    expect(p).toMatchObject({ status: null, jalur: null, kredit: null, nominal: null, kode: '', paket: null, uji: false })
    expect(p.pembeli).toEqual({ userId: null, email: null, nama: null })
    expect(p.play).toEqual({ order: null, dikonsumsi: false, batalIso: null })
    // pembeli dan play yang tidak dikirim sama sekali tidak meledak.
    const kosong = kePembelian({ ...BARIS_PLAY, pembeli: null, play: null })
    expect(kosong.pembeli.email).toBeNull()
    expect(kosong.play).toBeNull()
  })

  it('email dan nama pembeli tetap teks apa adanya (tag tidak ditafsirkan)', () => {
    const p = kePembelian({ ...BARIS_PLAY, pembeli: { user_id: null, email: 'budi@contoh.id', nama: '<b>Budi</b>' } })
    expect(p.pembeli.nama).toBe('<b>Budi</b>')
  })

  it('jawaban daftar: baris tanpa id dibuang, ringkasan dan kursor terbaca', () => {
    const h = halamanPembelian({ ...DAFTAR, baris: [BARIS_PLAY, { ...BARIS_QRIS, id: '' }, null, 'x'] })
    expect(h.baris.map(b => b.id)).toEqual([BARIS_PLAY.id])
    expect(h.ringkas).toEqual({ lunas: 3, nominalLunas: 115000, perkiraanDiterima: 97750, batal: 1 })
    expect(h.lanjut).toBe(W2)
    expect(halamanPembelian(null)).toEqual({ baris: [], ringkas: null, lanjut: null })
    expect(halamanPembelian({ baris: null, ringkas: null, lanjut: null })).toEqual({ baris: [], ringkas: null, lanjut: null })
    expect(barisPembelian([BARIS_PLAY])).toEqual([])
  })

  it('ringkasan: angka rusak jadi 0, bukan NaN', () => {
    expect(keRingkasPembelian({ lunas: 'x', nominal_lunas: null, perkiraan_diterima: '1,5', batal: 2 }))
      .toEqual({ lunas: 0, nominalLunas: 0, perkiraanDiterima: 0, batal: 2 })
    expect(keRingkasPembelian(null)).toBeNull()
  })
})

describe('adapter: halaman berikutnya', () => {
  it('gabung tanpa ganda, urutan server dipertahankan', () => {
    const a = beli({ id: 'a' })
    const b = beli({ id: 'b' })
    const c = beli({ id: 'c' })
    expect(gabungPembelian([a, b], [b, c]).map(p => p.id)).toEqual(['a', 'b', 'c'])
  })

  it('kursor: lanjut dipakai bila ada baris baru dan kursornya bergerak', () => {
    const satu = [beli()]
    expect(kursorSesudah(null, { baris: satu, lanjut: W2 })).toBe(W2)
    expect(kursorSesudah(W1, { baris: satu, lanjut: W2 })).toBe(W2)
    // Habis, kosong, atau tidak bergerak: tombol berhenti (tidak menulis audit berulang).
    expect(kursorSesudah(W1, { baris: satu, lanjut: null })).toBeNull()
    expect(kursorSesudah(W1, { baris: [], lanjut: W2 })).toBeNull()
    expect(kursorSesudah(W2, { baris: satu, lanjut: W2 })).toBeNull()
  })

  it('saringan semua = null ke server; nilai lain diteruskan', () => {
    expect(saringPembelianKeServer('semua')).toBeNull()
    expect(saringPembelianKeServer('lunas')).toBe('lunas')
    expect(SARING_STATUS_PEMBELIAN.filter(s => s !== 'semua').sort()).toEqual([...STATUS_PEMBELIAN].sort())
    expect(SARING_JALUR_PEMBELIAN.filter(s => s !== 'semua')).toEqual([...JALUR_PEMBELIAN])
  })

  it('lencana: lunas hijau, menunggu biru muda, batal merah, sisanya redup', () => {
    expect(STATUS_PEMBELIAN.map(pillStatusPembelian)).toEqual(['ca-pill-info', 'ca-pill-emerald', 'ca-pill-muted', 'ca-pill-danger'])
    expect(pillStatusPembelian(null)).toBe('ca-pill-muted')
  })

  it('Play lunas yang belum dikonsumsi ditandai; yang dibatalkan Google atau QRIS tidak', () => {
    expect(playBelumDikonsumsi(beli())).toBe(false)
    expect(playBelumDikonsumsi(beli({ play: { order: 'GPA.0', dikonsumsi: false, batalIso: null } }))).toBe(true)
    expect(playBelumDikonsumsi(beli({ play: { order: 'GPA.0', dikonsumsi: false, batalIso: W2 } }))).toBe(false)
    expect(playBelumDikonsumsi(beli({ status: 'menunggu', play: { order: 'GPA.0', dikonsumsi: false, batalIso: null } }))).toBe(false)
    expect(playBelumDikonsumsi(kePembelian(BARIS_QRIS))).toBe(false)
  })
})

// ── Kontrak terkunci (tiruan, tanpa migrasi) ─────────────────────────────
describe('kontrak terkunci: contoh jawaban dan Supabase tiruan', () => {
  it('contoh jawaban memuat persis kunci kontrak, tidak lebih dan tidak kurang', () => {
    expect(urutPohon(pohonContoh(DAFTAR))).toEqual(urutPohon(KONTRAK))
  })

  it('halaman pertama: p_batas, p_sebelum null, saringan null = semua', async () => {
    jawaban = { data: DAFTAR, error: null }
    const h = halamanPembelian(await useCashflowAdmin().aiPembelianDaftar(null, null, null))
    expect(h.baris).toHaveLength(2)
    expect(panggilan).toEqual([{
      nama: RPC, a: { p_batas: BATAS_DAFTAR_PEMBELIAN, p_sebelum: null, p_status: null, p_jalur: null },
    }])
  })

  it('muat lebih banyak: p_sebelum = lanjut jawaban sebelumnya, saringan ikut', async () => {
    jawaban = { data: { ...DAFTAR, baris: [], lanjut: null }, error: null }
    await useCashflowAdmin().aiPembelianDaftar('lunas', 'play', W2)
    expect(panggilan.at(-1)).toEqual({ nama: RPC, a: { p_batas: BATAS_DAFTAR_PEMBELIAN, p_sebelum: W2, p_status: 'lunas', p_jalur: 'play' } })
  })

  it('batas halaman di dalam jepit server (1..200)', () => {
    expect(BATAS_DAFTAR_PEMBELIAN).toBeGreaterThanOrEqual(1)
    expect(BATAS_DAFTAR_PEMBELIAN).toBeLessThanOrEqual(200)
  })

  it('22023 masukan_tidak_sah dibaca sebagai saringan ditolak, dengan kalimat awam', async () => {
    jawaban = { data: null, error: { code: '22023', message: 'masukan_tidak_sah', hint: 'status' } }
    const g = await useCashflowAdmin().aiPembelianDaftar('lunas', null, null).catch((e: unknown) => e)
    expect(g).toMatchObject({ jenis: 'argumen', message: 'masukan_tidak_sah', hint: 'status' })
    expect(masukanTidakSah(g as { message: string })).toBe(true)
    expect(useCashflowMuat().pesanUntuk(petakanGalat(g))).toBe('pembelian.galat.masukan')
  })

  it('izin: 42501 izin-kurang = izin (CashflowIzinKurang), tanpa hint = bukan admin', async () => {
    jawaban = { data: null, error: { code: '42501', message: 'Butuh izin cashflow:pii.', hint: 'izin-kurang' } }
    expect(await useCashflowAdmin().aiPembelianDaftar(null, null, null).catch((e: unknown) => e)).toMatchObject({ jenis: 'izin' })
    jawaban = { data: null, error: { code: '42501', message: 'Bukan admin platform.' } }
    expect(await useCashflowAdmin().aiPembelianDaftar(null, null, null).catch((e: unknown) => e)).toMatchObject({ jenis: 'bukan-admin' })
  })

  it('RPC belum ada (PGRST202, atau 42883 yang menyebut RPC itu sendiri) = fitur belum aktif', async () => {
    jawaban = { data: null, error: { code: 'PGRST202', hint: null, message: `Could not find the function public.${RPC}(p_batas, p_jalur, p_sebelum, p_status) in the schema cache` } }
    await expect(useCashflowAdmin().aiPembelianDaftar(null, null, null)).rejects.toMatchObject({ jenis: 'belum-aktif' })
    jawaban = { data: null, error: { code: '42883', hint: null, message: `function public.${RPC}(p_batas => integer) does not exist` } }
    await expect(useCashflowAdmin().aiPembelianDaftar(null, null, null)).rejects.toMatchObject({ jenis: 'belum-aktif' })
    // 42883 fungsi LAIN di dalamnya: RPC-nya ada tapi rusak, kalimatnya dibiarkan terbaca.
    expect(petakanGalat({ code: '42883', message: 'function public.ai_pembelian_ringkas() does not exist' }, RPC).jenis).toBe('lain')
  })
})

// ── Kamus, penjaga halaman, dan kebersihan teks ──────────────────────────
const ambil = (bahasa: 'id' | 'en', jalur: string): unknown =>
  jalur.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), KAMUS_CASHFLOW[bahasa])
/** Semua teks di bawah satu simpul kamus; kalimat berfungsi dipanggil dengan contoh. */
function semuaTeks(v: unknown): string[] {
  if (typeof v === 'string') return [v]
  if (typeof v === 'function') return [String((v as (...a: unknown[]) => unknown)(3, 'x', 'y'))]
  if (v && typeof v === 'object') return Object.values(v).flatMap(semuaTeks)
  return []
}
const HAL = 'pages/console/cashflow/pembelian.vue'
const KOMPONEN = ['components/cashflow/CashflowPembelianTabel.vue', 'components/cashflow/CashflowPembelianRingkas.vue']

describe('kamus Pembelian kredit', () => {
  it('kunci dinamis halaman ada di ID dan EN', () => {
    const jalur = [
      'nav.pembelian',
      ...STATUS_PEMBELIAN.map(s => `pembelian.status.${s}`),
      ...JALUR_PEMBELIAN.map(j => `pembelian.jalur.${j}`),
      ...SARING_STATUS_PEMBELIAN.map(s => `pembelian.statusOpsi.${s}`),
      ...SARING_JALUR_PEMBELIAN.map(j => `pembelian.jalurOpsi.${j}`),
      'pembelian.galat.masukan', 'pembelian.catatanUji', 'pembelian.belumAktif', 'pembelian.cobaLagi', 'pembelian.muatLagi',
    ]
    const hilang = jalur.flatMap(j => (['id', 'en'] as const).filter(b => typeof ambil(b, j) !== 'string').map(b => `${b}:${j}`))
    expect(hilang).toEqual([])
  })

  it('teks tanpa em-dash, titik koma, atau emoji', () => {
    for (const b of ['id', 'en'] as const) {
      const teks = [...semuaTeks(ambil(b, 'pembelian')), String(ambil(b, 'nav.pembelian'))]
      expect(teks.length).toBeGreaterThan(40)
      expect(teks.filter(t => /[—–;]|\p{Extended_Pictographic}/u.test(t)), b).toEqual([])
    }
  })

  it('kalimat berfungsi menyebut angkanya, jamak Inggris benar', () => {
    const f = (b: 'id' | 'en', k: string) => ambil(b, k) as (...a: unknown[]) => string
    expect(f('id', 'pembelian.kredit')(50)).toBe('50 kredit')
    expect(f('en', 'pembelian.kredit')(1)).toBe('1 credit')
    expect(f('en', 'pembelian.kredit')(50)).toBe('50 credits')
    expect(f('id', 'pembelian.ditampilkan')(2)).toBe('2 pembelian ditampilkan')
    expect(f('en', 'pembelian.ditampilkan')(1)).toBe('1 purchase shown')
  })

  it('catatan ringkasan menyebut bahwa pembelian uji tidak dihitung', () => {
    expect(String(ambil('id', 'pembelian.catatanUji'))).toMatch(/uji tidak ikut dihitung/)
    expect(String(ambil('en', 'pembelian.catatanUji'))).toMatch(/Test purchases are not counted/)
  })
})

describe('penjaga halaman Pembelian kredit', () => {
  it('berkas ada; penjaga console + admin CashFlow; tertaut dari navigasi dan palet', () => {
    for (const f of [HAL, ...KOMPONEN, 'adapters/cashflowPembelian.ts']) expect(existsSync(join(AKAR, f)), f).toBe(true)
    expect(baca(HAL)).toMatch(/definePageMeta\(\{ layout: 'console', middleware: \['console', 'cashflow-admin'\] \}\)/)
    expect(baca('components/cashflow/CashflowNav.vue')).toMatch(/\{ kunci: 'pembelian', to: '\/console\/cashflow\/pembelian' \}/)
    expect(baca('components/cashflow/CashflowPalet.vue')).toMatch(/\{ kunci: 'pembelian', ke: '\/console\/cashflow\/pembelian'/)
  })

  it('server hanya dipanggil halaman lewat useCashflowAdmin; komponen tidak mengambil data', () => {
    const hal = baca(HAL)
    expect(hal).toMatch(/useCashflowAdmin\(\)/)
    expect(hal).not.toMatch(/\.rpc\(|\$fetch|useFetch|supabase/i)
    for (const k of KOMPONEN) expect(baca(k), k).not.toMatch(/useCashflowAdmin|\.rpc\(|\$fetch|useFetch/)
  })

  it('tanpa muat berkala: setiap panggilan menulis audit di server', () => {
    expect(baca(HAL)).not.toMatch(/setInterval|setTimeout|useIntervalFn/)
  })

  it('belum aktif, izin, galat dengan Coba lagi, kosong, dan muat lebih banyak memakai lanjut', () => {
    const hal = baca(HAL)
    expect(hal).toMatch(/galat\.value\?\.jenis === 'belum-aktif'/)
    expect(hal).toMatch(/tcf\('pembelian\.belumAktif'\)/)
    expect(hal).toMatch(/<CashflowIzinKurang v-else-if="galat\?\.jenis === 'izin'" baca \/>/)
    expect(hal).toMatch(/role="alert">\{\{ pesanGalat \}\}<\/p>\s*<button[^>]*@click="muatAwal">\{\{ tcf\('pembelian\.cobaLagi'\) \}\}/)
    expect(hal).toMatch(/tcf\('pembelian\.kosong'\)/)
    expect(hal).toMatch(/api\.aiPembelianDaftar\(a\.status, a\.jalur, sebelum\)/)
    expect(hal).toMatch(/lanjut\.value = kursorSesudah\(sebelum, h\)/)
    expect(hal).toMatch(/<CashflowPembelianRingkas v-if="ringkas" :ringkas="ringkas" \/>/)
  })

  it('email, nama, dan nomor pesanan teks polos: tanpa v-html, interpolasi biasa', () => {
    for (const f of [HAL, ...KOMPONEN]) expect(baca(f), f).not.toMatch(/v-html|innerHTML/)
    const tabel = baca(KOMPONEN[0]!)
    expect(tabel).toMatch(/\{\{ p\.pembeli\.email \}\}/)
    expect(tabel).toMatch(/\{\{ p\.pembeli\.nama \}\}/)
    expect(tabel).toMatch(/\{\{ p\.play\.order \}\}/)
  })

  it('tabel memuat cap Uji, kode pendek, dan waktu WIB', () => {
    const tabel = baca(KOMPONEN[0]!)
    expect(tabel).toMatch(/v-if="p\.uji"[^>]*>\{\{ tcf\('pembelian\.uji'\) \}\}/)
    expect(tabel).toMatch(/\{\{ p\.kode \|\| p\.id\.slice\(-8\) \}\}/)
    expect(tabel).toMatch(/formatTanggal\(p\.waktuIso\)/)
    expect(tabel).toMatch(/formatJam\(p\.waktuIso\)/)
  })

  it('terang dan gelap: tanpa warna mentah, hanya token', () => {
    for (const f of [HAL, ...KOMPONEN]) {
      expect(baca(f), f).not.toMatch(/#[0-9a-fA-F]{3,8}\b|bg-white|text-black|bg-black|text-white|(?:bg|text|border)-(?:gray|slate|zinc|red|green|blue|amber|emerald|sky|rose)-\d/)
    }
  })

  it('repo publik: berkas baru tanpa jalur lokal atau email nyata', () => {
    for (const f of [HAL, ...KOMPONEN, 'adapters/cashflowPembelian.ts', 'tests/cashflow/pembelian.test.ts']) {
      const isi = baca(f)
      expect(isi, f).not.toMatch(/\/Users\/|@gmail\.|@coreasia\.id/)
      for (const email of isi.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? []) expect(email, f).toMatch(/@contoh\.id$/)
    }
  })
})

// ── Kontrak terhadap migrasi CashFlow ────────────────────────────────────
const adaPembelian = adaMigrasi && (() => { try { fungsiTerakhir(RPC); return true } catch { return false } })()
/** Badan RPC, ditambah badan pembantu yang ia pulangkan (return public.x(...)). */
const badanJawaban = (): string => {
  const badan = fungsiTerakhir(RPC).badan
  const pembantu = [...badan.matchAll(/return\s+public\.(\w+)\s*\(/g)].map(m => m[1]!)
  return [badan, ...pembantu.map(n => fungsiTerakhir(n).badan)].join('\n')
}
/** Semua objek jsonb_build_object di badan, termasuk yang bersarang. */
const semuaObjek = (p: PohonKunci): PohonKunci[] => [p, ...Object.values(p).flatMap(v => (v ? semuaObjek(v) : []))]
/** Kunci objek PERTAMA yang memuat semua penanda (urut abjad), atau null. */
const kunciObjek = (badan: string, ...penanda: string[]): string[] | null => {
  const o = semuaPohonJsonb(badan).flatMap(semuaObjek).find(t => penanda.every(k => k in t))
  return o ? Object.keys(o).sort() : null
}
const kunci = (p: PohonKunci | null): string[] => Object.keys(p ?? {}).sort()
const sqlSemua = () => readdirSync(DIR_MIGRASI).filter(n => n.endsWith('.sql')).sort()
  .map(n => readFileSync(join(DIR_MIGRASI, n), 'utf8').replace(/--[^\n]*/g, '')).join('\n')

describe.skipIf(!adaPembelian)(`kontrak migrasi pembelian kredit (${DIR_MIGRASI})`, () => {
  it('parameter = yang dikirim useCashflowAdmin, semuanya punya bawaan', () => {
    expect(parameterFungsi(RPC)).toEqual([
      { nama: 'p_batas', bawaan: true }, { nama: 'p_sebelum', bawaan: true },
      { nama: 'p_status', bawaan: true }, { nama: 'p_jalur', bawaan: true },
    ])
    expect(fungsiTerakhir(RPC).kepala).toMatch(/returns\s+jsonb/i)
  })

  it('bentuk jawaban = kontrak terkunci (atas, baris, pembeli, play, ringkas)', () => {
    const badan = badanJawaban()
    expect(kunciObjek(badan, 'baris', 'ringkas', 'lanjut')).toEqual(kunci(KONTRAK))
    expect(kunciObjek(badan, 'kode', 'jalur', 'nominal')).toEqual(kunci(KONTRAK.baris!))
    expect(kunciObjek(badan, 'user_id', 'email')).toEqual(kunci(KONTRAK.baris!.pembeli!))
    expect(kunciObjek(badan, 'order', 'dikonsumsi')).toEqual(kunci(KONTRAK.baris!.play!))
    expect(kunciObjek(badan, 'nominal_lunas', 'perkiraan_diterima')).toEqual(kunci(KONTRAK.ringkas!))
  })

  it('penjaga admin, galat saringan masukan_tidak_sah 22023, jepit batas 200', () => {
    const badan = fungsiTerakhir(RPC).badan
    expect(badan).toMatch(/public\.is_platform_admin\(\)/)
    expect(badan).toMatch(/'masukan_tidak_sah'\s+using\s+errcode\s*=\s*'22023'/)
    expect(badan).toMatch(/\b200\b/)
    for (const s of [...STATUS_PEMBELIAN, ...JALUR_PEMBELIAN]) expect(badan, s).toContain(`'${s}'`)
  })

  it('setiap pembukaan daftar dicatat di audit', () => {
    expect(badanJawaban()).toMatch(/admin_catat_baca|admin_audit/)
  })

  it('bisa dipanggil sesi console (grant execute ke authenticated)', () => {
    const pola = new RegExp(`(grant|revoke)\\s+[a-z ,]+\\s+on\\s+function\\s+public\\.${RPC}\\s*\\([^)]*\\)\\s+(to|from)\\s+([^;]+);`, 'gi')
    let terakhir: string | null = null
    for (const m of sqlSemua().matchAll(pola)) if (/\bauthenticated\b/.test(m[3]!)) terakhir = m[1]!.toLowerCase()
    expect(terakhir).toBe('grant')
  })
})

it.skipIf(adaPembelian || !adaMigrasi)(`migrasi ${RPC} belum ada di folder CashFlow: kontrak migrasi dilewati`, () => {
  expect(existsSync(DIR_MIGRASI)).toBe(true)
})
