/**
 * Kesehatan: pembelian Google Play yang menggantung, dari kunci `play_proses`
 * admin_kesehatan (migrasi CashFlow 20261117170000_kesehatan_play_proses).
 *
 * Yang dijaga:
 * - kontrak terkunci: kunci `play_proses` di contoh jawaban dibandingkan
 *   dengan badan admin_kesehatan, dan barisnya sama dengan hitungan proses di
 *   admin_ai_pembelian_daftar (tanpa akun uji, tanpa yang kreditnya sudah
 *   masuk), tanpa audit (dilewati, terlihat "skipped", bila migrasinya belum
 *   ada di folder);
 * - adapter tahan server lama dan angka rusak, tidak pernah mengarang 0;
 * - ambang 1 jam sama dengan halaman Pembelian, dan nada emas hanya lewat
 *   ambang itu, tanpa merah;
 * - kalimat ID dan EN untuk satu, banyak, dan tanpa umur, tanpa kode mentah;
 * - penjaga halaman: Kesehatan dan Ringkasan tidak memanggil daftar
 *   pembelian (yang mencatat audit), komponen tidak memanggil server, tanpa
 *   warna mentah, dan berkas publik tanpa data asli.
 *
 * Semua angka di sini karangan.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { computed, createSSRApp, defineComponent, h, ref, type Component } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it, vi } from 'vitest'
import {
  AMBANG_GANTUNG_MENIT, TAUTAN_PEMBELIAN_DIPROSES, keadaanGantung, kePlayProsesKesehatan,
  type PlayProsesKesehatan, type PlayProsesKesehatanDTO,
} from '../../adapters/cashflowPembelian'
import { keKesehatan, type KesehatanDTO } from '../../adapters/cashflow'
import { jamWib, tanggalPendek, waktuPendekWib, type BahasaWaktu } from '../../adapters/cashflowWaktu'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'
import { DIR_MIGRASI, adaMigrasiNomor, fungsiTerakhir, pohonJsonb } from './migrasi'

let bahasa: BahasaWaktu = 'id'
const cari = (b: BahasaWaktu, jalur: string): unknown =>
  jalur.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), KAMUS_CASHFLOW[b])
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('useCashflowI18n', () => ({
  tcf: (k: string) => cari(bahasa, k) ?? k,
  bahasa: computed(() => bahasa),
  formatTanggal: (v: string | null | undefined) => tanggalPendek(v, bahasa),
  formatJam: (v: string | null | undefined) => jamWib(v, bahasa),
  formatWaktu: (v: string | null | undefined) => waktuPendekWib(v, bahasa),
}))
const { default: PlayGantung } = await import('../../components/cashflow/CashflowKesehatanPlayGantung.vue')

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (rel: string) => readFileSync(join(AKAR, rel), 'utf8')
const HAL = 'pages/console/cashflow/kesehatan.vue'
const RINGKASAN = 'pages/console/cashflow/index.vue'
const KOMPONEN = 'components/cashflow/CashflowKesehatanPlayGantung.vue'

/* Jawaban admin_kesehatan dengan kunci baru (bigint count pulang sebagai angka JSON). */
const CONTOH: PlayProsesKesehatanDTO = { diproses: 3, tertunda: 2, gagal_sementara: 1, ditolak: 4, tertua_menit: 75 }
const KUNCI_KONTRAK = ['diproses', 'ditolak', 'gagal_sementara', 'tertua_menit', 'tertunda']

describe('kePlayProsesKesehatan', () => {
  it('jawaban lengkap terbaca, nama kunci jadi camelCase', () => {
    expect(kePlayProsesKesehatan(CONTOH)).toEqual({ diproses: 3, tertunda: 2, gagalSementara: 1, ditolak: 4, tertuaMenit: 75 })
    expect(Object.keys(CONTOH).sort()).toEqual(KUNCI_KONTRAK)
  })

  it('server lama atau bentuk asing: null, halaman tidak menampilkan apa pun', () => {
    for (const v of [undefined, null, 'x', 3, [], [CONTOH], {}, { tertunda: 1 }]) expect(kePlayProsesKesehatan(v), JSON.stringify(v)).toBeNull()
    const dto: KesehatanDTO = { ukuran_db: 1, tabel: {} }
    expect(kePlayProsesKesehatan(dto.play_proses)).toBeNull()
  })

  it('diproses rusak atau negatif: null, bukan 0 karangan', () => {
    for (const d of ['', 'dua', -1, 1.5, '1.5', Number.NaN, true]) {
      expect(kePlayProsesKesehatan({ ...CONTOH, diproses: d as never }), String(d)).toBeNull()
    }
  })

  it('teks angka terbaca, hitungan lain yang rusak jadi null tanpa menjatuhkan baris', () => {
    expect(kePlayProsesKesehatan({ diproses: '2', tertunda: 'x', gagal_sementara: -3, ditolak: null, tertua_menit: '61' }))
      .toEqual({ diproses: 2, tertunda: null, gagalSementara: null, ditolak: null, tertuaMenit: 61 })
  })

  it('umur negatif atau tanpa yang menunggu: null', () => {
    expect(kePlayProsesKesehatan({ ...CONTOH, tertua_menit: -5 })?.tertuaMenit).toBeNull()
    expect(kePlayProsesKesehatan({ ...CONTOH, diproses: 0, tertua_menit: 90 })?.tertuaMenit).toBeNull()
    expect(kePlayProsesKesehatan({ ...CONTOH, tertua_menit: null })?.tertuaMenit).toBeNull()
  })

  it('keKesehatan tetap membaca dua kunci lama dan mengabaikan kunci baru', () => {
    const k = keKesehatan({ ukuran_db: 8192, tabel: { wallets: { baris: 3, ukuran: 8192 } }, play_proses: CONTOH })
    expect(k).toEqual({ ukuranDb: 8192, tabel: [{ tabel: 'wallets', baris: 3, ukuran: 8192 }] })
  })
})

describe('keadaanGantung', () => {
  const p = (diproses: number, tertuaMenit: number | null): PlayProsesKesehatan =>
    ({ diproses, tertunda: null, gagalSementara: null, ditolak: null, tertuaMenit })
  it('ambang sama dengan halaman Pembelian: lebih dari 60 menit', () => {
    expect(AMBANG_GANTUNG_MENIT).toBe(60)
    expect(keadaanGantung(p(1, 60))).toBe('menunggu')
    expect(keadaanGantung(p(1, 61))).toBe('lama')
    expect(keadaanGantung(p(5, 0))).toBe('menunggu')
  })
  it('nol, tanpa umur, dan server lama', () => {
    expect(keadaanGantung(p(0, null))).toBe('kosong')
    expect(keadaanGantung(p(2, null))).toBe('menunggu')
    expect(keadaanGantung(null)).toBeNull()
  })
  it('tautan ke saringan Sedang diproses', () => {
    expect(TAUTAN_PEMBELIAN_DIPROSES).toBe('/console/cashflow/pembelian?status=diproses')
  })
})

// ── Tampilan (vue/server-renderer) ───────────────────────────────────────
const Ikon = { props: ['name'], render(this: { name: string }) { return h('i', { 'data-ikon': this.name }) } }
const Tautan = defineComponent({
  props: { to: { type: String, required: true } },
  setup(props, { slots }) { return () => h('a', { href: props.to }, slots.default?.()) },
})
const render = (komponen: Component, props: Record<string, unknown>) => {
  const app = createSSRApp({ render: () => h(komponen, props) })
  app.component('Icon', Ikon)
  app.component('NuxtLink', Tautan)
  return renderToString(app)
}
const teksSaja = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#39;/g, '\'').replace(/\s+/g, ' ').trim()
const MENTAH = /kesehatan\.\w|pembelian\.\w|undefined|\bnull\b|NaN|gagal_sementara|tertua_menit/
const ringkas = (diproses: number, tertuaMenit: number | null): PlayProsesKesehatan =>
  ({ diproses, tertunda: diproses, gagalSementara: 0, ditolak: 0, tertuaMenit })

describe('CashflowKesehatanPlayGantung', () => {
  it.each([
    ['id', ringkas(1, 12), 'menunggu', '1 pembelian Google Play sedang diproses, sudah 12 mnt.'],
    ['id', ringkas(3, 59), 'menunggu', '3 pembelian Google Play sedang diproses, yang paling lama 59 mnt.'],
    ['id', ringkas(2, 185), 'lama', '2 pembelian Google Play sedang diproses, yang paling lama 3 jam 5 mnt.'],
    ['id', ringkas(1, 3000), 'lama', '1 pembelian Google Play sedang diproses, sudah 2 hari 2 jam.'],
    ['id', ringkas(4, null), 'menunggu', '4 pembelian Google Play sedang diproses.'],
    ['en', ringkas(1, 12), 'menunggu', '1 Google Play purchase is being processed, 12 min so far.'],
    ['en', ringkas(3, 185), 'lama', '3 Google Play purchases are being processed, the oldest for 3 h 5 min.'],
    ['en', ringkas(2, null), 'menunggu', '2 Google Play purchases are being processed.'],
  ] as const)('%s %j: %s', async (b, r, keadaan, kalimat) => {
    bahasa = b
    const html = await render(PlayGantung, { ringkas: r })
    expect(html).toContain(`data-uji="kesehatan-play-${keadaan}"`)
    expect(teksSaja(html)).toContain(kalimat)
    expect(html).toContain(`href="${TAUTAN_PEMBELIAN_DIPROSES}"`)
    expect(teksSaja(html)).toContain(b === 'id' ? 'Lihat di Pembelian' : 'View in Purchases')
    expect(html).toMatch(/role="status"/)
    expect(teksSaja(html)).not.toMatch(MENTAH)
    // Emas hanya lewat ambang, merah tidak pernah.
    expect(html.includes('--ca-gold-bg')).toBe(keadaan === 'lama')
    expect(html).not.toMatch(/danger|galat|ca-tone-danger/)
    bahasa = 'id'
  })

  it.each(['id', 'en'] as const)('nol ditulis kecil dan tenang tanpa tautan (%s)', async (b) => {
    bahasa = b
    const html = await render(PlayGantung, { ringkas: ringkas(0, null) })
    expect(html).toContain('data-uji="kesehatan-play-kosong"')
    expect(teksSaja(html)).toBe(b === 'id' ? 'Tidak ada pembelian Google Play yang menggantung.' : 'No Google Play purchase is stuck.')
    expect(html).not.toContain('href=')
    expect(html).not.toMatch(/gold|danger/)
    bahasa = 'id'
  })

  it('kalimat ID dan EN tanpa tanda yang dilarang gaya tulis', () => {
    for (const b of ['id', 'en'] as const) {
      const play = cari(b, 'kesehatan.play') as Record<string, unknown>
      const teks = [play.label, play.kosong, play.lihat, ...[1, 2].flatMap(n => [12, null].map(m =>
        (play.menunggu as (n: number, l: string | null) => string)(n, m === null ? null : `${m} mnt`)))] as string[]
      expect(teks.filter(t => /[—–;!]|\p{Extended_Pictographic}/u.test(t)), b).toEqual([])
      expect(Object.keys(play).sort()).toEqual(['kosong', 'label', 'lihat', 'menunggu'])
    }
  })
})

describe('penjaga halaman Kesehatan', () => {
  it('Kesehatan membaca kunci dari admin_kesehatan dan memasang barisnya hanya bila kuncinya ada', () => {
    const hal = baca(HAL)
    expect(hal).toMatch(/const playProses = computed\(\(\) => kePlayProsesKesehatan\(kesehatanMentah\.value\?\.play_proses\)\)/)
    expect(hal).toMatch(/<CashflowKesehatanPlayGantung v-if="kesehatan && playProses" :ringkas="playProses" \/>/)
    // Paling atas, sebelum status WhatsApp yang panjang, supaya terlihat tanpa menggulir.
    expect(hal.indexOf("tcf('kesehatan.ket')")).toBeLessThan(hal.indexOf('<CashflowKesehatanPlayGantung'))
    expect(hal.indexOf('<CashflowKesehatanPlayGantung')).toBeLessThan(hal.indexOf('<CashflowStatusWa />'))
  })

  it('Kesehatan dan Ringkasan tidak memanggil daftar pembelian yang mencatat audit', () => {
    for (const f of [HAL, RINGKASAN]) expect(baca(f), f).not.toMatch(/aiPembelianDaftar|admin_ai_pembelian_daftar/)
  })

  it('komponen tidak memanggil server, tanpa v-html, tanpa warna mentah', () => {
    const isi = baca(KOMPONEN)
    expect(isi).not.toMatch(/useCashflowAdmin|\.rpc\(|\$fetch|useFetch|setInterval|setTimeout/)
    expect(isi).not.toMatch(/v-html|innerHTML/)
    expect(isi).not.toMatch(/#[0-9a-fA-F]{3,8}\b|bg-white|text-black|bg-black|text-white|(?:bg|text|border)-(?:gray|slate|zinc|red|green|blue|amber|emerald|sky|rose)-\d/)
  })

  it('repo publik: berkas baru tanpa jalur lokal atau email nyata', () => {
    for (const f of [HAL, KOMPONEN, 'adapters/cashflowPembelian.ts', 'tests/cashflow/kesehatan-play.test.ts']) {
      const isi = baca(f)
      expect(isi, f).not.toMatch(/\/Users\/|@gmail\.|@coreasia\.id/)
      for (const email of isi.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? []) expect(email, f).toMatch(/@contoh\.id$/)
    }
  })
})

// ── Kontrak terhadap migrasi CashFlow ────────────────────────────────────
const ADA_PLAY = adaMigrasiNomor('20261117170000')
const rapat = (s: string) => s.replace(/\s+/g, ' ').trim()

describe.skipIf(!ADA_PLAY)(`kontrak migrasi Kesehatan play_proses (${DIR_MIGRASI})`, () => {
  it('kunci play_proses di server = kunci yang dibaca adapter', () => {
    const { badan } = fungsiTerakhir('admin_kesehatan')
    const pohon = pohonJsonb(badan)
    expect(Object.keys(pohon).sort()).toEqual(['play_proses', 'tabel', 'ukuran_db'])
    expect(Object.keys(pohon.play_proses ?? {}).sort()).toEqual(KUNCI_KONTRAK)
  })

  it('baris yang dihitung sama dengan hitungan proses halaman Pembelian', () => {
    const kes = rapat(fungsiTerakhir('admin_kesehatan').badan)
    const daftar = rapat(fungsiTerakhir('admin_ai_pembelian_daftar').badan)
    const saring = 'from public.ai_pembelian_play_proses x where not public.ai_pembelian_uji_inti(x.user_id) '
      + 'and not exists (select 1 from public.ai_pembelian_play p where p.token_sha256 = x.token_sha256)'
    expect(kes).toContain(saring)
    expect(daftar).toContain(saring)
    for (const hitung of [
      "count(*) filter (where x.keadaan <> 'ditolak')", "count(*) filter (where x.keadaan = 'tertunda')",
      "count(*) filter (where x.keadaan = 'gagal_sementara')", "count(*) filter (where x.keadaan = 'ditolak')",
      "min(x.pertama_dilihat) filter (where x.keadaan <> 'ditolak')",
    ]) {
      expect(kes, hitung).toContain(hitung)
      expect(daftar, hitung).toContain(hitung)
    }
  })

  it('umur dalam menit penuh, tidak pernah negatif, null bila kosong', () => {
    const kes = rapat(fungsiTerakhir('admin_kesehatan').badan)
    expect(kes).toContain("'tertua_menit', case when q.tertua is not null then greatest(floor(extract(epoch from now() - q.tertua) / 60), 0)::integer end")
  })

  it('tetap agregat T0: gerbang admin saja, tanpa audit, tanpa izin data pribadi', () => {
    const { badan } = fungsiTerakhir('admin_kesehatan')
    expect(badan).toMatch(/if not public\.is_platform_admin\(\) then/)
    expect(badan).not.toMatch(/admin_catat_baca|cashflow:pii|insert\s+into|email/i)
  })
})
