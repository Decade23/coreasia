/**
 * Halaman CashFlow > WhatsApp (laporan catat lewat WhatsApp):
 * adapters/cashflowWaLaporan.ts, pages/console/cashflow/whatsapp.vue,
 * CashflowWaLaporanIsi.vue, CashflowWaHarian.vue, CashflowWaPengguna.vue.
 *
 * - Kontrak dibanding migrasi CashFlow (folder CASHFLOW_MIGRASI): nama dan
 *   bawaan argumen, kunci jawaban, kode jenis dan hasil pesan. Selama
 *   admin_wa_catat_laporan belum ada di folder itu, uji kontraknya "skipped".
 * - Adapter murni: jawaban lengkap, kunci hilang dibaca kosong (bukan galat),
 *   angka dari string atau rusak, kode baru, kuota, durasi, tautan
 *   Perjalanan 360, corong.
 * - Galat fungsi tidak ada (PGRST202) menjadi "belum aktif".
 * - Tampilan dirender ke teks (vue/server-renderer), Indonesia dan Inggris,
 *   lengkap, kosong, tanpa pii, terbuka, tanpa kode mentah atau tanda baca
 *   terlarang.
 * - Data sintetis uji tampilan berbentuk sama dengan DTO contoh di sini.
 *
 * Semua data di sini karangan: email contoh.invalid, angka dibuat-buat.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { computed, createSSRApp, h, onBeforeUnmount, onMounted, ref, shallowRef, watch, type Component } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it, vi } from 'vitest'
import { DIR_MIGRASI, adaMigrasi, fungsiTerakhir, parameterFungsi, pohonContoh, urutPohon } from './migrasi'
import {
  ALASAN_LAPORAN_WA, HASIL_PESAN_WA, JENIS_PESAN_WA, LANGKAH_CORONG_WA, MAKS_KATA_WA, PERIODE_WA, STATUS_CATAT_WA, TIM_WA,
  durasiWa, keadaanKuotaWa, keLaporanWa, langkahCorongWa, persenDari, tanggalWibDari, tautanPerjalananWa, type LaporanWaDTO,
} from '../../adapters/cashflowWaLaporan'
import { GalatAdmin, petakanGalat } from '../../composables/cashflow/useCashflowAdmin'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'
import { HALAMAN_CASHFLOW } from '../../utils/cashflow/navigasi'
import { buatServer } from '../../scripts/data-sintetis-console.mjs'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (jalur: string): string => readFileSync(join(AKAR, jalur), 'utf8')
const adaFungsi = (nama: string): boolean => { try { fungsiTerakhir(nama); return true } catch { return false } }
const ADA_WA = adaMigrasi && adaFungsi('admin_wa_catat_laporan')

// ── Contoh jawaban server (karangan) ─────────────────────────────────────
const LAPORAN: LaporanWaDTO = {
  hari: 7, kecuali_internal: true, terbuka: false, sekarang: '2026-11-20T05:00:00Z',
  cakupan: { sejak: '2026-11-13T05:00:00Z', jejak_sejak: '2026-11-18T05:00:00Z', jejak_jam: 48, jejak_utuh: false, telemetri_hari: 120 },
  ringkas: {
    menyala: 212, pengirim: 9, pesan: 37, pesan_dicatat: 26, catatan: 31, catatan_ada: '29', tanpa_kategori: 11, persen_tanpa_kategori: 38,
    batal: 2, domi: 6, domi_jawaban: 5, domi_biaya: '1460.250000', kuota: 1, stop: 0, gagal: 0,
    proses_median_dtk: 2.4, proses_p90_dtk: '4.70', simpan_median_dtk: 1.8, simpan_p90_dtk: null,
  },
  corong: { pengumuman: 1, tampil: null, tampil_terukur: false, ketuk: 14, tutup: 9, pesan_pertama: 12, catatan_pertama: 9, kembali: 5 },
  harian: [
    { tanggal: '2026-11-20', pesan: 11, pengirim: 3, dicatat: 9, catatan: 9 },
    { tanggal: '2026-11-19', pesan: 8, pengirim: 2, dicatat: 5, catatan: 5 },
    { tanggal: '2026-11-18', pesan: 0, pengirim: 0, dicatat: 0, catatan: null },
  ],
  golongan: [
    { jenis: 'domi', hasil: 'dijawab', jumlah: 6, orang: 3 },
    { jenis: 'catat', hasil: 'dicatat', jumlah: 26, orang: 9 },
    { jenis: 'kategori', hasil: 'diubah', jumlah: 2, orang: 1 },
  ],
  kata_tanpa_kategori: [
    { kata: 'galon', jumlah: 4, orang: 3 }, { kata: 'parkir', jumlah: 3, orang: 3 }, { kata: '20rb', jumlah: 3, orang: 3 },
  ],
  kesehatan: { pesan: 37, selesai: 35, gagal: 0, proses: 1, macet: 1, balas: 31, diam: 2, inbox: 0, terakhir_masuk: '2026-11-20T04:58:00Z', terakhir_simpan: '2026-11-20T04:58:02Z' },
  per_pengguna: [
    {
      user_id: '00000000-0000-4000-8000-000000000001', nama: null, email: 'sar***@contoh.invalid', internal: false, pesan: 11, dicatat: 9,
      catatan: 9, terakhir: '2026-11-19T17:00:00Z', status: 'menyala', kuota: { pro: false, sakelar: true, sisa: 133, batas: 150 },
      versi: { versi: '1.7.0', kode: '26112602', platform: 'android' },
    },
    {
      user_id: '00000000-0000-4000-8000-000000000002', nama: null, email: 'agu***@contoh.invalid', internal: true, pesan: '8', dicatat: 5,
      catatan: 5, terakhir: null, status: 'baru_sekali', kuota: { pro: true, sakelar: true, sisa: 0, batas: 0 }, versi: null,
    },
  ],
  per_pengguna_total: 2,
}

// ── Kontrak ──────────────────────────────────────────────────────────────
describe.skipIf(!ADA_WA)(`kontrak admin_wa_catat_laporan (${DIR_MIGRASI})`, () => {
  it('argumen p_hari wajib, p_kecuali_internal dan p_alasan berbawaan', () => {
    expect(parameterFungsi('admin_wa_catat_laporan')).toEqual([
      { nama: 'p_hari', bawaan: false }, { nama: 'p_kecuali_internal', bawaan: true }, { nama: 'p_alasan', bawaan: true },
    ])
  })

  it('setiap kunci yang dibaca adapter ditulis badan fungsi', () => {
    const { badan } = fungsiTerakhir('admin_wa_catat_laporan')
    const kunci = new Set<string>()
    const kumpul = (v: unknown) => {
      if (Array.isArray(v)) { v.forEach(kumpul); return }
      if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { kunci.add(k); kumpul(x) }
    }
    kumpul(LAPORAN)
    for (const k of kunci) expect(badan, k).toContain(`'${k}'`)
  })

  it('audit tanpa email dan nama, per pengguna hanya untuk pii, email tersamar tanpa alasan', () => {
    const { badan } = fungsiTerakhir('admin_wa_catat_laporan')
    expect(badan).toMatch(/v_pii\s*:=\s*public\.konsol_boleh\('cashflow:pii'\)/)
    expect(badan).toMatch(/'email',\s*case when v_buka then h\.email::text else public\.samar_email\(h\.email::text\) end/)
    expect(badan).toMatch(/'nama',\s*case when v_buka then/)
    const audit = badan.slice(badan.indexOf('admin_catat_baca'))
    expect(audit).not.toMatch(/email|display_name|nama/)
  })

  it('kode jenis pesan sama dengan batasan wa_catat_pesan, kode hasil sama dengan katalog wa_catat.pesan', () => {
    const wa = readFileSync(join(DIR_MIGRASI, '20261124160000_wa_catat.sql'), 'utf8')
    const jenis = /constraint wa_catat_pesan_jenis\s+check \(jenis in \(([^)]*)\)\)/.exec(wa)?.[1] ?? ''
    expect([...jenis.matchAll(/'([a-z_]+)'/g)].map(m => m[1])).toEqual([...JENIS_PESAN_WA])
    const katalog = readFileSync(join(DIR_MIGRASI, '20261124230000_perjalanan_katalog_170.sql'), 'utf8')
    const baris = /\('wa_catat\.pesan', 'aplikasi', '(\{.*\})'\)/.exec(katalog)?.[1] ?? '{}'
    expect(JSON.parse(baris).hasil).toEqual([...HASIL_PESAN_WA])
  })
})

// ── Adapter ──────────────────────────────────────────────────────────────
describe('keLaporanWa', () => {
  it('jawaban lengkap: angka dari string, urut tanggal, golongan terbanyak dulu, kata berangka dibuang', () => {
    const l = keLaporanWa(LAPORAN)
    expect(l.hari).toBe(7)
    expect(l.kecualiInternal).toBe(true)
    expect(l.cakupan).toEqual({ sejak: '2026-11-13T05:00:00Z', jejakSejak: '2026-11-18T05:00:00Z', jejakJam: 48, jejakUtuh: false, telemetriHari: 120 })
    expect(l.ringkas.catatanAda).toBe(29)
    expect(l.ringkas.domiBiaya).toBe(1460.25)
    expect(l.ringkas.prosesP90).toBe(4.7)
    expect(l.ringkas.simpanP90).toBeNull()
    expect(l.harian.map(h => h.tanggal)).toEqual(['2026-11-18', '2026-11-19', '2026-11-20'])
    expect(l.harian[0]!.catatan).toBeNull()
    expect(l.golongan.map(g => `${g.jenis}:${g.hasil}`)).toEqual(['catat:dicatat', 'domi:dijawab', 'kategori:diubah'])
    expect(l.golongan[2]).toMatchObject({ jenisDikenal: null, hasilDikenal: null })
    expect(l.kata.map(k => k.kata)).toEqual(['galon', 'parkir'])
    expect(l.pengguna).toHaveLength(2)
    expect(l.pengguna![1]).toMatchObject({ pesan: 8, internal: true, status: 'lain', terakhir: null, versi: null })
    expect(l.penggunaTotal).toBe(2)
    expect(l.kosong).toBe(false)
  })

  it('kunci yang tidak ada dibaca kosong, bukan galat', () => {
    const l = keLaporanWa({} as LaporanWaDTO)
    expect(l.ringkas.pesan).toBe(0)
    expect(l.ringkas.persenTanpaKategori).toBeNull()
    expect(l.harian).toEqual([])
    expect(l.golongan).toEqual([])
    expect(l.kata).toEqual([])
    expect(l.pengguna).toBeNull()
    expect(l.penggunaTotal).toBeNull()
    expect(l.kataTerkunci).toBe(false)
    expect(l.cakupan.jejakJam).toBe(48)
    expect(l.corong.tampil).toBeNull()
    expect(l.kosong).toBe(true)
    expect(keLaporanWa(null).kosong).toBe(true)
    // Bagian yang bukan objek atau larik juga tidak menjatuhkan halaman.
    const rusak = keLaporanWa({ ringkas: 'x', harian: 5, golongan: null, per_pengguna: [null, 3] } as unknown as LaporanWaDTO)
    expect(rusak.ringkas.pesan).toBe(0)
    expect(rusak.pengguna).toEqual([])
  })

  it('angka rusak dan negatif dibaca nol, tampil hanya bila terukur', () => {
    const l = keLaporanWa({ ...LAPORAN, ringkas: { ...LAPORAN.ringkas, pesan: 'abc', gagal: -3, proses_median_dtk: -1 }, corong: { ...LAPORAN.corong, tampil: 40 } })
    expect(l.ringkas.pesan).toBe(0)
    expect(l.ringkas.gagal).toBe(0)
    expect(l.ringkas.prosesMedian).toBeNull()
    expect(l.corong.tampil).toBeNull()
    expect(keLaporanWa({ ...LAPORAN, corong: { ...LAPORAN.corong, tampil: 40, tampil_terukur: true } }).corong.tampil).toBe(40)
  })

  it('kata hanya huruf latin kecil 3..40 (tanpa angka lebar penuh atau Arab, tanpa bagian email), kode aneh dibaca lain', () => {
    const l = keLaporanWa({
      ...LAPORAN,
      kata_tanpa_kategori: [
        { kata: 'galon', jumlah: 4, orang: 3 }, { kata: '\uff10\uff18\uff11\uff12', jumlah: 3, orang: 3 }, { kata: '\u0660\u0668\u0661', jumlah: 3, orang: 3 },
        { kata: 'ke', jumlah: 3, orang: 3 }, { kata: 'Ujinama', jumlah: 3, orang: 3 }, { kata: 'nama.uji@contoh.invalid', jumlah: 3, orang: 3 },
        { kata: 'é', jumlah: 3, orang: 3 }, { kata: 'x'.repeat(41), jumlah: 3, orang: 3 },
      ],
      golongan: [{ jenis: '<img src=x onerror=alert(1)>', hasil: 'Dicatat!', jumlah: 5, orang: 1 }, { jenis: 'catat', hasil: 'dicatat', jumlah: 2, orang: 1 }],
    })
    expect(l.kata.map(k => k.kata)).toEqual(['galon'])
    expect(l.golongan[0]).toMatchObject({ jenis: 'lain', hasil: 'lain', jenisDikenal: 'lain', hasilDikenal: null, jumlah: 5 })
  })

  it('jumlah kata paling banyak 20', () => {
    const kata = Array.from({ length: 30 }, (_, i) => ({ kata: `kata${String.fromCharCode(97 + (i % 26))}x`, jumlah: 30 - i, orang: 1 }))
    expect(keLaporanWa({ ...LAPORAN, kata_tanpa_kategori: kata }).kata).toHaveLength(MAKS_KATA_WA)
  })
})

describe('pembantu tampilan', () => {
  it('corong: persen dari pesan pertama, ketuk tanpa persen', () => {
    const c = keLaporanWa(LAPORAN).corong
    expect(langkahCorongWa(c)).toEqual([
      { kunci: 'ketuk', orang: 14, persen: null }, { kunci: 'pesan_pertama', orang: 12, persen: null },
      { kunci: 'catatan_pertama', orang: 9, persen: 75 }, { kunci: 'kembali', orang: 5, persen: 42 },
    ])
    expect(langkahCorongWa(c).map(x => x.kunci)).toEqual([...LANGKAH_CORONG_WA])
    expect(persenDari(1, 0)).toBeNull()
  })

  it('kuota: Pro, tanpa batas, sisa, habis, tidak diketahui', () => {
    expect(keadaanKuotaWa({ pro: true, sakelar: true, sisa: 0, batas: 0 })).toEqual({ jenis: 'pro' })
    expect(keadaanKuotaWa({ pro: false, sakelar: false, sisa: 10, batas: 150 })).toEqual({ jenis: 'bebas' })
    expect(keadaanKuotaWa({ pro: false, sakelar: true, sisa: 12, batas: 150 })).toEqual({ jenis: 'sisa', sisa: 12, batas: 150, habis: false })
    expect(keadaanKuotaWa({ pro: false, sakelar: true, sisa: 0, batas: 150 })).toMatchObject({ habis: true })
    expect(keadaanKuotaWa(null)).toEqual({ jenis: 'kosong' })
    expect(keadaanKuotaWa({ pro: false, sakelar: true, sisa: null, batas: 150 })).toEqual({ jenis: 'kosong' })
  })

  it('durasi ringkas dua bahasa', () => {
    expect(durasiWa(1.48)).toBe('1,5 dtk')
    expect(durasiWa(1.48, 'en')).toBe('1.5 s')
    expect(durasiWa(42)).toBe('42 dtk')
    expect(durasiWa(150)).toBe('2,5 mnt')
    expect(durasiWa(null)).toBeNull()
    expect(durasiWa(-1)).toBeNull()
  })

  it('tautan Perjalanan 360 dari awal periode, tanggal WIB', () => {
    expect(tanggalWibDari('2026-11-13T18:00:00Z')).toBe('2026-11-14')
    expect(tautanPerjalananWa('00000000-0000-4000-8000-000000000001', '2026-11-13T18:00:00Z')).toEqual({
      path: '/console/cashflow/pengguna/00000000-0000-4000-8000-000000000001/perjalanan', query: { dari: '2026-11-14' },
    })
    expect(tautanPerjalananWa('x', null).query).toEqual({})
    // Rute dan nama query sama dengan halaman Perjalanan.
    expect(baca('pages/console/cashflow/pengguna/[id]/perjalanan.vue')).toContain('CashflowTabPerjalanan')
    expect(baca('components/cashflow/CashflowTabPerjalanan.vue')).toMatch(/\bdari: \{ jenis: 'teks', pola: POLA_TGL/)
  })

  it('periode, akun tim, status, alasan tetap', () => {
    expect([...PERIODE_WA]).toEqual(['1', '7', '30'])
    expect([...TIM_WA]).toEqual(['tanpa', 'ikut'])
    expect([...STATUS_CATAT_WA]).toEqual(['menyala', 'mati', 'tanpa_setelan'])
    expect(ALASAN_LAPORAN_WA.length).toBeGreaterThanOrEqual(8)
  })
})

describe('galat, menu, dan pemanggilan', () => {
  it('batas waktu server (57014) tidak tampil mentah: kalimat manusia', () => {
    const g = petakanGalat({ code: '57014', message: 'canceling statement due to statement timeout', details: null, hint: null }, 'admin_wa_catat_laporan')
    expect(g.hint).toBe('batas-waktu')
    const tanpaKode = petakanGalat({ message: 'canceling statement due to statement timeout' }, 'admin_wa_catat_laporan')
    expect(tanpaKode.hint).toBe('batas-waktu')
    const muat = baca('composables/cashflow/useCashflowMuat.ts')
    expect(muat).toMatch(/g\.hint === 'batas-waktu'\) return tcf\('galat\.batasWaktu'\)/)
    for (const b of ['id', 'en'] as const) {
      const k = cari(b, 'galat.batasWaktu')
      expect(typeof k, b).toBe('string')
      expect(k as string).not.toMatch(/statement|timeout|canceling/i)
    }
  })

  it('fungsi belum ada di server (PGRST202) menjadi belum-aktif', () => {
    const g = petakanGalat({ code: 'PGRST202', message: 'Could not find the function public.admin_wa_catat_laporan', details: null, hint: null }, 'admin_wa_catat_laporan')
    expect(g).toBeInstanceOf(GalatAdmin)
    expect(g.jenis).toBe('belum-aktif')
  })

  it('halaman terdaftar di menu Ringkasan dan palet, memanggil RPC lewat useCashflowAdmin', () => {
    expect(HALAMAN_CASHFLOW.find(x => x.kunci === 'whatsapp')).toMatchObject({ jalur: '/console/cashflow/whatsapp', pintu: 'ringkasan' })
    const admin = baca('composables/cashflow/useCashflowAdmin.ts')
    expect(admin).toMatch(/waCatatLaporan: \(hari: number, kecualiInternal: boolean, alasan: string \| null\) =>\s+rpc<LaporanWaDTO>\('admin_wa_catat_laporan', \{ p_hari: hari, p_kecuali_internal: kecualiInternal, p_alasan: alasan \}\)/)
    const halaman = baca('pages/console/cashflow/whatsapp.vue')
    expect(halaman).toContain("useState<string | null>('cf_kontak_disamarkan_oleh'")
    expect(halaman).toContain('ALASAN_LAPORAN_WA')
    expect(halaman).not.toMatch(/supabase|fetch\(|\$fetch/)
  })

  it('label setiap kode dan langkah ada di kedua bahasa dan berbeda', () => {
    const ambil = (b: 'id' | 'en', jalur: string) => cari(b, jalur)
    for (const j of JENIS_PESAN_WA) for (const b of ['id', 'en'] as const) expect(typeof ambil(b, `waCatat.jenis.${j}`), `${b} ${j}`).toBe('string')
    for (const x of HASIL_PESAN_WA) for (const b of ['id', 'en'] as const) expect(typeof ambil(b, `waCatat.hasil.${x}`), `${b} ${x}`).toBe('string')
    for (const x of LANGKAH_CORONG_WA) expect(ambil('en', `waCatat.corong.langkah.${x}`)).not.toBe(ambil('id', `waCatat.corong.langkah.${x}`))
    for (const x of [...STATUS_CATAT_WA, 'lain']) for (const b of ['id', 'en'] as const) expect(typeof ambil(b, `waCatat.pengguna.status.${x}`)).toBe('string')
    for (const x of PERIODE_WA) expect(typeof ambil('id', `waCatat.periode.${x}`)).toBe('string')
    for (const x of TIM_WA) expect(typeof ambil('en', `waCatat.tim.${x}`)).toBe('string')
    expect(ambil('id', 'nav.whatsapp')).toBe('WhatsApp')
  })
})

// ── Tampilan (vue/server-renderer) ───────────────────────────────────────
let bahasa: 'id' | 'en' = 'id'
const cari = (b: 'id' | 'en', jalur: string): unknown =>
  jalur.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), KAMUS_CASHFLOW[b])
vi.stubGlobal('ref', ref)
vi.stubGlobal('shallowRef', shallowRef)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('onBeforeUnmount', onBeforeUnmount)
vi.stubGlobal('useCashflowI18n', () => ({ tcf: (k: string) => cari(bahasa, k) ?? k, bahasa: computed(() => bahasa) }))
const { default: Isi } = await import('../../components/cashflow/CashflowWaLaporanIsi.vue')
const { default: Harian } = await import('../../components/cashflow/CashflowWaHarian.vue')
const { default: Pengguna } = await import('../../components/cashflow/CashflowWaPengguna.vue')
const { default: BarRows } = await import('../../components/cashflow/CashflowBarRows.vue')
const { default: KeadaanKosong } = await import('../../components/cashflow/CashflowKeadaanKosong.vue')
const { default: Tabel } = await import('../../components/cashflow/CashflowTabel.vue')

const Ikon = { props: ['name'], render(this: { name: string }) { return h('i', { 'data-ikon': this.name }) } }
const Ubin = {
  props: ['label', 'nilai', 'keterangan'],
  render(this: { label: string; nilai: string; keterangan: string }) { return h('div', { 'data-ubin-uji': '' }, `${this.label} ${this.nilai} ${this.keterangan}`) },
}
const StatusWa = { render: () => h('div', { 'data-status-wa': '' }) }
const IzinKurang = { render: () => h('div', { 'data-izin-kurang': '' }) }
const Tautan = { props: ['to'], render(this: { to: { path: string; query: Record<string, string> } }) { return h('a', { href: `${this.to.path}?dari=${this.to.query.dari ?? ''}` }, 'Perjalanan') } }
const render = (komponen: Component, props: Record<string, unknown>) => {
  const app = createSSRApp({ render: () => h(komponen, props) })
  app.component('Icon', Ikon)
  app.component('NuxtLink', Tautan)
  app.component('CashflowBarRows', BarRows)
  app.component('CashflowKeadaanKosong', KeadaanKosong)
  app.component('CashflowTabel', Tabel)
  app.component('CashflowStatTile', Ubin)
  app.component('CashflowStatusWa', StatusWa)
  app.component('CashflowIzinKurang', IzinKurang)
  app.component('CashflowWaHarian', Harian)
  app.component('CashflowWaPengguna', Pengguna)
  return renderToString(app)
}
/* Tanda pisah sebagai isi sel atau angka kosong boleh, di dalam kalimat tidak. */
const teksSaja = (html: string) => html.replace(/>—</g, '> <').replace(/<[^>]+>/g, ' ').replace(/&#39;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
const MENTAH = /waCatat\.\w|laporan\.\w|undefined|\bnull\b|NaN|\[object |pesan_pertama|catatan_pertama|tanpa_setelan|basa_basi|dompet_bawaan/
const TERLARANG = /[–;]|[^\s—]\s?—\s?[^\s—]|\p{Extended_Pictographic}/u

describe('CashflowWaLaporanIsi', () => {
  it('lengkap (ID): semua bagian, angka, corong, kata, golongan berkode baru, tabel tersamar', async () => {
    bahasa = 'id'
    const html = await render(Isi, { laporan: keLaporanWa(LAPORAN) })
    const teks = teksSaja(html)
    for (const uji of ['wa-cakupan', 'wa-ubin', 'wa-kecil', 'wa-corong', 'wa-harian', 'wa-golongan-tabel', 'wa-kata-daftar', 'wa-sehat-proses', 'wa-pengguna-tabel']) {
      expect(html, uji).toContain(`data-uji="${uji}"`)
    }
    expect(html).toContain('data-status-wa')
    expect(teks).toContain('Catatan, kata tanpa kategori, dan waktu proses hanya dari 48 jam terakhir.')
    expect(teks).toContain('Pengirim 9 dari 212 akun yang menyalakan catat WA')
    expect(teks).toContain('Tanpa kategori 38% 11 dari 29 catatan')
    expect(teks).toMatch(/Mengetuk tombol WhatsApp 14 Mengirim pesan pertama 12 Catatan pertama lewat WA 9 \(75%\) Kembali di hari lain 5 \(42%\)/)
    expect(teks).toContain('1 pengumuman bertautan WhatsApp. Belum terukur.')
    expect(teks).toContain('Waktu proses 2,4 dtk 9 dari 10 selesai dalam 4,7 dtk')
    expect(teks).toContain('Tanya Domi lewat WA 6 5 jawaban, biaya Rp')
    expect(teks).toMatch(/Catat Tercatat 26 9/)
    expect(teks).toMatch(/kategori diubah kode baru 2 1/)
    expect(teks).toMatch(/galon 4 parkir 3/)
    expect(teks).toContain('1 pesan perlu dilihat.')
    expect(teks).toContain('sar***@contoh.invalid')
    expect(teks).toContain('133 dari 150')
    expect(teks).toContain('Pro')
    expect(teks).toContain('1.7.0 (26112602)')
    expect(teks).toContain('Tim')
    expect(teks).toContain('Email tersamar.')
    expect(html).toContain('href="/console/cashflow/pengguna/00000000-0000-4000-8000-000000000001/perjalanan?dari=2026-11-13"')
    expect(teks).not.toMatch(MENTAH)
    expect(teks).not.toMatch(TERLARANG)
  })

  it('lengkap (EN): label Inggris, tanpa kode mentah', async () => {
    bahasa = 'en'
    const teks = teksSaja(await render(Isi, { laporan: keLaporanWa(LAPORAN) }))
    expect(teks).toContain('Senders 9 out of 212 accounts with WhatsApp logging on')
    expect(teks).toContain('Uncategorized words')
    expect(teks).toContain('Came back on another day')
    expect(teks).toContain('133 of 150')
    expect(teks).not.toMatch(MENTAH)
    expect(teks).not.toMatch(TERLARANG)
    bahasa = 'id'
  })

  it('kosong: pesan kosong, kesehatan dan per pengguna tetap tampil', async () => {
    bahasa = 'id'
    const kosong = keLaporanWa({ ...LAPORAN, ringkas: { ...LAPORAN.ringkas, pesan: 0, catatan: 0 }, corong: { ...LAPORAN.corong, ketuk: 0, tutup: 0 }, kesehatan: { ...LAPORAN.kesehatan, pesan: 0 }, per_pengguna: [] })
    const html = await render(Isi, { laporan: kosong })
    expect(html).toContain('data-uji="wa-kosong"')
    expect(html).not.toContain('data-uji="wa-ubin"')
    expect(html).toContain('data-uji="wa-sehat-proses"')
    expect(teksSaja(html)).toContain('Belum ada yang mengirim pesan WA di periode ini.')
  })

  it('sesi tanpa pii: tanpa tabel, ajakan verifikasi. Periode di dalam 48 jam: tanpa catatan cakupan', async () => {
    bahasa = 'id'
    const l = keLaporanWa({ ...LAPORAN, per_pengguna: null, kata_tanpa_kategori: null, cakupan: { ...LAPORAN.cakupan, jejak_utuh: true } })
    expect(l.kataTerkunci).toBe(true)
    const html = await render(Isi, { laporan: l })
    expect(html.match(/data-izin-kurang/g)).toHaveLength(2)
    expect(html).not.toContain('data-uji="wa-kata-daftar"')
    expect(html).not.toContain('data-uji="wa-pengguna-tabel"')
    expect(html).not.toContain('data-uji="wa-cakupan"')
  })

  it('terbuka: nama di baris utama, email di baris kedua, waktu persis', async () => {
    bahasa = 'id'
    const terbuka = keLaporanWa({
      ...LAPORAN, terbuka: true,
      per_pengguna: [{ ...LAPORAN.per_pengguna![0]!, nama: 'Sari Wulandari', email: 'sari@contoh.invalid', terakhir: '2026-11-20T04:30:00Z' }],
    })
    const teks = teksSaja(await render(Pengguna, { pengguna: terbuka.pengguna, total: 1, terbuka: true, sejak: terbuka.cakupan.sejak }))
    expect(teks).toMatch(/Sari Wulandari sari@contoh\.invalid/)
    expect(teks).toContain('Kontak lengkap terbuka.')
    expect(teks).toMatch(/20 Nov,? 11[.:]30/)
  })

  it('harian: satu batang per hari, label tanggal pendek, tabel lewat 48 jam', async () => {
    bahasa = 'id'
    const l = keLaporanWa(LAPORAN)
    const html = await render(Harian, { harian: l.harian })
    expect(html.match(/class="wa-harian-kolom"/g)).toHaveLength(3)
    const teks = teksSaja(html)
    expect(teks).toContain('20 Nov')
    expect(teks).toContain('lewat 48 jam')
    expect(html).toContain('aria-label="20 Nov 2026: 11 pesan, 9 tercatat"')
  })
})

describe('data sintetis uji tampilan = DTO contoh', () => {
  const server = buatServer()
  it('bentuk sama dengan contoh, terbaca adapter, harian satu baris per hari', () => {
    const d = server.jawab('admin_wa_catat_laporan', { p_hari: 7, p_kecuali_internal: true, p_alasan: null }, { izin: true }).json as LaporanWaDTO
    expect(urutPohon(pohonContoh(d))).toEqual(urutPohon(pohonContoh(LAPORAN)))
    const l = keLaporanWa(d)
    expect(l.harian).toHaveLength(8)
    expect(l.pengguna!.length).toBeGreaterThan(5)
    expect(l.pengguna!.every(p => p.email?.includes('***@'))).toBe(true)
    expect(keLaporanWa(server.jawab('admin_wa_catat_laporan', { p_hari: 30 }, { izin: true }).json as LaporanWaDTO).harian).toHaveLength(31)
  })

  it('tanpa pii per_pengguna null, kosong, server lama PGRST202', () => {
    const tanpaPii = keLaporanWa(server.jawab('admin_wa_catat_laporan', { p_hari: 7 }, { izin: false }).json as LaporanWaDTO)
    expect(tanpaPii.pengguna).toBeNull()
    expect(tanpaPii.kataTerkunci).toBe(true)
    expect(keLaporanWa(server.jawab('admin_wa_catat_laporan', { p_hari: 7 }, { izin: true, kosong: true }).json as LaporanWaDTO).kosong).toBe(true)
    expect(server.jawab('admin_wa_catat_laporan', { p_hari: 7 }, { izin: true, belumAda: ['admin_wa_catat_laporan'] }).json).toMatchObject({ code: 'PGRST202' })
    const buka = server.jawab('admin_wa_catat_laporan', { p_hari: 1, p_alasan: ALASAN_LAPORAN_WA }, { izin: true }).json as LaporanWaDTO
    expect(buka.terbuka).toBe(true)
    expect(JSON.stringify(buka)).not.toMatch(/\*\*\*@/)
  })
})
