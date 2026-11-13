/**
 * OTP WhatsApp terbalik di console: Kesehatan (admin_wa_status kunci baru)
 * dan Status WhatsApp di daftar pengguna (admin_daftar_pengguna_v3 kolom baru).
 *
 * - kontrak: contoh jawaban dan daftar kode adapter dibandingkan dengan badan
 *   fungsi di migrasi CashFlow (dilewati, terlihat "skipped", sebelum
 *   migrasinya ada di folder), dan dengan uji SQL server di toko/;
 * - adapter: bentuk lengkap, bentuk lama tanpa kunci baru, nilai asing;
 * - kamus ID dan EN untuk setiap kode, kalimat awam;
 * - penjaga komponen dan halaman (tanpa ambil data di komponen, hanya token
 *   warna, saringan baru hanya untuk server yang mengenalnya).
 *
 * Semua angka, nomor, dan waktu di sini karangan.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  ANGKA_MASUK_WA, ANGKA_PENGGUNA_WA, CARA_WA, KELOMPOK_LAPIS_WA, KODE_GANGGUAN_WA, LAPIS_WA, MODE_WA, SEBAB_LEWAT_WA,
  SEGMEN_BELUM_WA, STATUS_WA_AKUN, angkaSebabWa, caraDalamMode, keStatusWa, keStatusWaAkun, lamaDari,
  type WaStatusDTO,
} from '../../adapters/cashflowWa'
import { kePengguna, tanpaKontakUtuh, type PenggunaDTO } from '../../adapters/cashflow'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'
import {
  adaMigrasiNomor, DIR_TOKO, fungsiTerakhir, parameterFungsi, pohonContoh, pohonJsonb, urutPohon,
} from './migrasi'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (rel: string) => readFileSync(join(AKAR, rel), 'utf8')
const MIGRASI = '20261113150000'
const adaTerbalik = adaMigrasiNomor(MIGRASI)
const UJI_TOKO = join(DIR_TOKO, 'uji-nomor-wa-terbalik.sql')
const adaUjiToko = existsSync(UJI_TOKO)

// ── Contoh jawaban ───────────────────────────────────────────────────────
const lama = (ubah: Partial<WaStatusDTO> = {}): WaStatusDTO => ({
  sekarang: '2026-11-13T05:00:00Z',
  sesi: { status: 'connected', sejak: '2026-11-13T01:00:00Z', dicek_pada: '2026-11-13T04:58:00Z', galat: null },
  gangguan: [],
  kirim_gangguan_sampai: null,
  otp: { aktif: true, wajib: true, darurat: false },
  batas: { terpakai_hari_ini: 4, harian: 50 },
  kiriman_24j: { diminta: 6, terkirim: 5, gagal: 1, tanpa_wa: 0, diketik: 4 },
  sebab_gagal_24j: [{ sebab: 'sesi-putus', jumlah: 1 }],
  terkirim_terakhir: '2026-11-13T04:30:00Z',
  ...ubah,
})
/** Bentuk lengkap sesudah migrasi cara terbalik: mode keduanya, semua sehat. */
const lengkap = (ubah: Partial<WaStatusDTO> = {}): WaStatusDTO => lama({
  mode: { mode: 'keduanya', uji_mode: null, tujuan_tersamar: '0811 •••• 0000', balas: false, ambang_tak_masuk: 8, batas_harian_masuk: 500, tahan_kredit: false },
  lapis: { bersama: [], kirim: [], masuk: [] },
  cara_sehat: ['terbalik', 'kirim'],
  masuk_sapa: { ada: true, aktif: true, tertahan: 0, tertua_detik: 0, terakhir_ok: '2026-11-13T04:59:00Z', dicek_pada: '2026-11-13T04:58:00Z' },
  masuk_24j: { dibuat: 12, pesan: 11, berhasil: 9, beda: 1, habis: 0, tanpa_nomor: 1, kedaluwarsa: 0, tak_dikenal: 0, batas: 0, lid: 1 },
  masuk_batas: { terpakai_hari_ini: 7, harian: 500 },
  jendela_7h: [
    { mulai: '2026-11-13T04:00:00Z', selesai: null, lapis: ['sesi'], wajib: true },
    { mulai: '2026-11-10T02:00:00Z', selesai: '2026-11-10T03:30:00Z', lapis: ['kirim', 'tak_diketik'], wajib: true },
  ],
  pengguna: { terverifikasi_masuk: 9, terverifikasi_kirim: 40, lewat_gangguan_7h: 3, kredit_ditahan: 2, nomor_ramai_30h: 1 },
  ...ubah,
})

// ── Kontrak terhadap migrasi CashFlow ────────────────────────────────────
describe.skipIf(!adaTerbalik)(`kontrak ${MIGRASI}: admin_wa_status`, () => {
  it('pohon kunci contoh = pohon kunci server (lapis dibangun pembantunya)', () => {
    const { badan } = fungsiTerakhir('admin_wa_status')
    const contoh = { ...lengkap(), lapis: null }
    expect(urutPohon(pohonContoh(contoh))).toEqual(urutPohon(pohonJsonb(badan)))
    expect(badan).toMatch(/'lapis',\s*v_lapis/)
    expect(badan).toMatch(/v_lapis\s*:=\s*public\.nomor_wa_lapis_inti\(s\)/)
    expect(badan).toMatch(/'tahan_kredit',\s*s -> 'tahan_kredit'/)
    expect(badan).toMatch(/'cara_sehat',\s*to_jsonb\(public\.nomor_wa_cara_inti\(s ->> 'mode', v_lapis, array\['kirim', 'terbalik'\]\)\)/)
  })
  it('lapis: tiga kelompok dengan kode yang sama dengan adapter', () => {
    const lapis = fungsiTerakhir('nomor_wa_lapis_inti').badan
    expect(Object.keys(pohonJsonb(lapis)).sort()).toEqual([...KELOMPOK_LAPIS_WA].sort())
    expect(lapis).toMatch(new RegExp(`x in \\(${LAPIS_WA.bersama.map(k => `'${k}'`).join(', ')}\\)`))
    expect(lapis).toMatch(new RegExp(`x in \\(${LAPIS_WA.kirim.map(k => `'${k}'`).join(', ')}\\)`))
    const masuk = fungsiTerakhir('nomor_wa_lapis_masuk_inti').badan
    const kode = [...masuk.matchAll(/then '([a-z_]+)' end/g)].map(m => m[1])
    expect(kode).toEqual([...LAPIS_WA.masuk])
  })
  it('sakelar tahan_kredit selalu boolean, bawaan false', () => {
    const sakelar = fungsiTerakhir('nomor_wa_sakelar_lengkap_inti').badan
    expect(sakelar).toMatch(/'tahan_kredit',\s*coalesce\(v -> 'tahan_kredit' = 'true'::jsonb, false\)/)
  })
  it('mode, urutan cara, dan mode_mati di riwayat sama dengan adapter', () => {
    const sakelar = fungsiTerakhir('nomor_wa_sakelar_lengkap_inti').badan
    expect(sakelar).toContain(`in (${MODE_WA.map(m => `'${m}'`).join(', ')})`)
    const cara = fungsiTerakhir('nomor_wa_cara_inti').badan
    expect(cara).toMatch(new RegExp(`when 'keduanya' then array\\[${CARA_WA.map(c => `'${c}'`).join(', ')}\\]`))
    for (const m of MODE_WA) expect(caraDalamMode(m).length, m).toBeLessThanOrEqual(2)
    expect(fungsiTerakhir('nomor_wa_sehat_tulis_v2').badan).toContain("array['mode_mati']")
  })
  it('angka 24 jam dan hitungan pengguna: kunci server = daftar adapter', () => {
    const p = pohonJsonb(fungsiTerakhir('admin_wa_status').badan)
    expect(Object.keys(p.masuk_24j ?? {}).sort()).toEqual([...ANGKA_MASUK_WA].sort())
    expect(Object.keys(p.pengguna ?? {}).sort()).toEqual([...ANGKA_PENGGUNA_WA].sort())
  })
  it('tanpa data orang di jawaban', () => {
    const { badan } = fungsiTerakhir('admin_wa_status')
    expect(badan).toMatch(/'tujuan_tersamar',\s*public\.nomor_wa_samar\(/)
    expect(badan).not.toMatch(/'nomor'\s*,|'user_id'|'email'/)
  })
})

describe.skipIf(!adaTerbalik)(`kontrak ${MIGRASI}: admin_daftar_pengguna_v3`, () => {
  const { badan } = adaTerbalik ? fungsiTerakhir('admin_daftar_pengguna_v3') : { badan: '' }
  it('kolom baru ikut ke setiap baris (to_jsonb dari CTE dasar)', () => {
    for (const k of ['status_wa', 'status_wa_pada', 'lewat_sebab', 'nomor_ramai', 'kredit_ditahan']) {
      expect(badan, k).toMatch(new RegExp(`\\bas ${k}\\b`))
    }
    expect(badan).toMatch(/to_jsonb\(h\) - 'posisi' - 'kunci_versi' - 'status'\)/)
  })
  it('nilai status_wa dan saringannya = STATUS_WA_AKUN', () => {
    const kasus = /case when n\.cara = 'wa_masuk' then '(\w+)' when n\.cara is not null then '(\w+)'\s+when lw\.pada is not null then '(\w+)' else '(\w+)' end as status_wa/.exec(badan)
    expect(kasus?.slice(1)).toEqual([...STATUS_WA_AKUN])
    expect(badan).toContain(`v_filter->>'status_wa' not in (${STATUS_WA_AKUN.map(s => `'${s}'`).join(',')})`)
  })
  it('segmen console dikenal server, termasuk belum_wa (tanpa izin pii)', () => {
    const segmen = /coalesce\(p_segmen, ''\) not in \(([^)]+)\)/.exec(badan)?.[1]?.match(/'(\w+)'/g)?.map(x => x.slice(1, -1)) ?? []
    const hal = baca('pages/console/cashflow/pengguna/index.vue')
    const konsol = /const SEGMEN = \[([^\]]+)\]/.exec(hal)![1]!
    for (const s of konsol.match(/'(\w+)'/g)!.map(x => x.slice(1, -1))) expect(segmen, s).toContain(s)
    expect(konsol).toContain('SEGMEN_BELUM_WA')
    expect(segmen).toContain(SEGMEN_BELUM_WA)
    expect(badan).toMatch(/p_segmen = 'belum_wa' and d\.status_wa in \('lewat','belum'\)/)
    expect(badan).toMatch(/not v_pii and \(p_segmen in \('catat7','belum'\)/)
  })
  it('sebab lewat = SEBAB_LEWAT_WA; tanggal dibulatkan ke hari WIB tanpa alasan', () => {
    const lewat = fungsiTerakhir('nomor_wa_lewat_inti').badan
    expect(lewat).toContain(`then '${SEBAB_LEWAT_WA[0]}' else '${SEBAB_LEWAT_WA[1]}' end`)
    expect(badan).toMatch(/case when v_buka then coalesce\(n\.terverifikasi_pada, lw\.pada\) else\s+\(\(coalesce\(n\.terverifikasi_pada, lw\.pada\) at time zone 'Asia\/Jakarta'\)::date\)/)
  })
  it('argumen RPC tidak berubah: console tetap memanggil dengan nama yang sama', () => {
    expect(parameterFungsi('admin_daftar_pengguna_v3').map(p => p.nama))
      .toEqual(['p_limit', 'p_offset', 'p_cari', 'p_segmen', 'p_urut', 'p_arah', 'p_filter', 'p_bahasa', 'p_alasan'])
  })
})

describe.skipIf(!adaUjiToko)('kontrak uji SQL server (toko/uji-nomor-wa-terbalik.sql blok 15)', () => {
  const sql = adaUjiToko ? readFileSync(UJI_TOKO, 'utf8') : ''
  it('kunci admin_wa_status yang dikunci server = kunci contoh', () => {
    const m = /admin_wa_status: kunci lama dan baru',\s*\(select array_agg[^=]+=\s*array\[([^\]]+)\]/.exec(sql)
    const server = m![1]!.match(/'(\w+)'/g)!.map(x => x.slice(1, -1)).sort()
    expect(Object.keys(lengkap()).sort()).toEqual(server)
  })
  it('bentuk mode, lapis, cara_sehat, masuk_24j yang diuji server terbaca adapter', () => {
    expect(sql).toMatch(/"mode": "keduanya", "uji_mode": null, "tujuan_tersamar": "[^"]+", "balas": false,\s*"ambang_tak_masuk": 8, "batas_harian_masuk": 500, "tahan_kredit": (?:true|false)\}/)
    expect(sql).toMatch(/v -> 'lapis' = '\{"bersama": \[\], "kirim": \[\], "masuk": \[\]\}' and v -> 'cara_sehat' = '\["terbalik", "kirim"\]'/)
    const angka = /v -> 'masuk_24j' = '(\{[^']+\})'/.exec(sql)![1]!
    expect(Object.keys(JSON.parse(angka.replace(/\s+/g, ' '))).sort()).toEqual([...ANGKA_MASUK_WA].sort())
    for (const s of STATUS_WA_AKUN) expect(sql).toContain(`:${s}'`)
  })
})

// ── Adapter: admin_wa_status ─────────────────────────────────────────────
describe('keStatusWa bentuk lengkap', () => {
  it('mode keduanya, semua sehat: sehat dan setiap bagian terisi', () => {
    const s = keStatusWa(lengkap())
    expect(s.tingkat).toBe('sehat')
    expect(s.lewatOtp).toBe(false)
    expect(s.sebab).toEqual([])
    expect(s.cara?.mode).toEqual({ mode: 'keduanya', ujiMode: null, tujuanTersamar: '0811 •••• 0000', balas: false, tahanKredit: false })
    expect(s.cara?.cara).toEqual([{ cara: 'terbalik', keadaan: 'sehat' }, { cara: 'kirim', keadaan: 'sehat' }])
    expect(s.cara?.lapis?.map(l => [l.kelompok, l.kode, l.berpengaruh])).toEqual([['bersama', [], true], ['kirim', [], true], ['masuk', [], true]])
    expect(s.cara?.sapa).toMatchObject({ ada: true, aktif: true, tertahan: 0, terakhirOk: '2026-11-13T04:59:00Z' })
    expect(s.cara?.angka24j).toMatchObject({ dibuat: 12, pesan: 11, berhasil: 9, lid: 1 })
    expect(s.cara?.batasMasuk).toEqual({ terpakai: 7, harian: 500 })
    expect(s.cara?.pengguna).toEqual({ terverifikasi_masuk: 9, terverifikasi_kirim: 40, lewat_gangguan_7h: 3, kredit_ditahan: 2, nomor_ramai_30h: 1 })
    expect(s.ambangTakMasuk).toBe(8)
  })
  it('jendela: yang masih berlangsung diukur sampai jam server, yang selesai sampai selesainya', () => {
    const j = keStatusWa(lengkap()).cara!.jendela!
    expect(j[0]).toMatchObject({ berlangsung: true, selesai: null, lama: { n: 1, satuan: 'jam' }, lapis: ['sesi'], wajib: true })
    expect(j[1]).toMatchObject({ berlangsung: false, lama: { n: 2, satuan: 'jam' }, lapis: ['kirim', 'tak_diketik'] })
  })
  it('satu cara sakit di mode keduanya: sebagian, hanya cara itu yang bermasalah, pengguna tidak lewat', () => {
    const s = keStatusWa(lengkap({ lapis: { bersama: [], kirim: ['kirim'], masuk: [] }, cara_sehat: ['terbalik'], gangguan: ['kirim'] }))
    expect(s.tingkat).toBe('sebagian')
    expect(s.lewatOtp).toBe(false)
    expect(s.sebab).toEqual(['kirim'])
    expect(s.cara?.cara).toEqual([{ cara: 'terbalik', keadaan: 'sehat' }, { cara: 'kirim', keadaan: 'sakit' }])
  })
  it('mode terbalik tanpa pesan masuk: gangguan, pengguna lewat; lapis kirim tidak ikut jadi sebab', () => {
    const s = keStatusWa(lengkap({
      mode: { ...lengkap().mode!, mode: 'terbalik' },
      lapis: { bersama: [], kirim: ['tak_diketik'], masuk: ['tak_masuk'] }, cara_sehat: [], gangguan: ['tak_diketik'],
    }))
    expect(s.tingkat).toBe('gangguan')
    expect(s.lewatOtp).toBe(true)
    expect(s.sebab).toEqual(['tak_masuk'])
    expect(s.cara?.lapis?.find(l => l.kelompok === 'kirim')).toEqual({ kelompok: 'kirim', kode: ['tak_diketik'], berpengaruh: false })
    expect(s.cara?.cara).toEqual([{ cara: 'terbalik', keadaan: 'sakit' }, { cara: 'kirim', keadaan: 'diluarMode' }])
  })
  it('mode kirim: lapis cara terbalik (tujuan kosong, Sapa belum melapor) tidak mengganggu', () => {
    const s = keStatusWa(lengkap({
      mode: { ...lengkap().mode!, mode: 'kirim', tujuan_tersamar: null },
      lapis: { bersama: [], kirim: [], masuk: ['tanpa_tujuan', 'masuk_belum_ada'] }, cara_sehat: ['kirim'],
      masuk_sapa: { ada: false, aktif: null, tertahan: null, tertua_detik: null, terakhir_ok: null, dicek_pada: null },
    }))
    expect(s.tingkat).toBe('sehat')
    expect(s.sebab).toEqual([])
    expect(s.cara?.mode?.tujuanTersamar).toBeNull()
    expect(s.cara?.lapis?.find(l => l.kelompok === 'masuk')?.berpengaruh).toBe(false)
    expect(s.cara?.sapa).toEqual({ ada: false, aktif: null, tertahan: 0, tertua: null, tertuaDetik: null, terakhirOk: null, dicekPada: null })
  })
  it('mode mati: gangguan dengan sebab mode_mati, kedua cara tidak dipakai', () => {
    const s = keStatusWa(lengkap({ mode: { ...lengkap().mode!, mode: 'mati' }, cara_sehat: [], lapis: { bersama: ['sesi'], kirim: [], masuk: [] } }))
    expect(s.tingkat).toBe('gangguan')
    expect(s.sebab).toEqual(['mode_mati', 'sesi'])
    expect(s.cara?.cara?.map(c => c.keadaan)).toEqual(['diluarMode', 'diluarMode'])
  })
  it('sakelar tahan kredit: nyala, mati, atau tidak dikirim (baris disembunyikan)', () => {
    expect(keStatusWa(lengkap({ mode: { ...lengkap().mode!, tahan_kredit: true } })).cara?.mode?.tahanKredit).toBe(true)
    expect(keStatusWa(lengkap()).cara?.mode?.tahanKredit).toBe(false)
    const { tahan_kredit: _, ...tanpa } = lengkap().mode!
    expect(keStatusWa(lengkap({ mode: tanpa })).cara?.mode?.tahanKredit).toBeNull()
    expect(keStatusWa(lengkap({ mode: { ...lengkap().mode!, tahan_kredit: 'ya' as unknown as boolean } })).cara?.mode?.tahanKredit).toBeNull()
    // Hitungan pengguna "Kredit gratis ditahan" tidak bergantung pada sakelar.
    expect(keStatusWa(lengkap({ mode: tanpa })).cara?.pengguna?.kredit_ditahan).toBe(2)
  })
  it('OTP dimatikan tetap mengalahkan segalanya', () => {
    const s = keStatusWa(lengkap({ otp: { aktif: false, wajib: false, darurat: false }, cara_sehat: [] }))
    expect(s.tingkat).toBe('nonaktif')
    expect(s.lewatOtp).toBe(false)
  })
  it('lapis bersama di mode terbalik: gangguan, sebabnya lapis bersama', () => {
    const s = keStatusWa(lengkap({ mode: { ...lengkap().mode!, mode: 'terbalik' }, lapis: { bersama: ['darurat'], kirim: [], masuk: [] }, cara_sehat: [] }))
    expect(s.tingkat).toBe('gangguan')
    expect(s.sebab).toEqual(['darurat'])
  })
})

describe('keStatusWa bentuk lama (server tanpa kunci baru)', () => {
  it('bagian cara terbalik null, keadaan dari gangguan seperti dulu', () => {
    const s = keStatusWa(lama({ gangguan: ['sesi', 'tak_diketik'] }))
    expect(s.cara).toBeNull()
    expect(s.tingkat).toBe('gangguan')
    expect(s.lewatOtp).toBe(true)
    expect(s.sebab).toEqual(['sesi', 'tak_diketik'])
    expect(s.ambangTakMasuk).toBe(8)
    expect(keStatusWa(lama()).tingkat).toBe('sehat')
  })
  it('kunci lama tidak berubah arti di bentuk baru', () => {
    const a = keStatusWa(lama())
    const b = keStatusWa(lengkap())
    for (const k of ['statusSesi', 'sejak', 'dicekPada', 'otp', 'batas', 'kiriman', 'sebabGagal', 'terkirimTerakhir'] as const) expect(b[k], k).toEqual(a[k])
  })
})

describe('keStatusWa nilai asing dan bagian yang hilang', () => {
  it('mode, uji_mode, dan kode lapis yang tidak dikenal tidak hilang', () => {
    const s = keStatusWa(lengkap({
      mode: { ...lengkap().mode!, mode: 'baru_nih', uji_mode: 'aneh' },
      lapis: { bersama: [], kirim: [], masuk: ['lapis_baru', 'tak_masuk', 'tak_masuk'] }, cara_sehat: ['terbalik'],
      jendela_7h: [{ mulai: '2026-11-12T00:00:00Z', selesai: '2026-11-12T00:00:40Z', lapis: ['x', 'y', 'mode_mati'], wajib: null }],
    }))
    expect(s.cara?.mode).toMatchObject({ mode: 'lain', ujiMode: 'lain' })
    // Mode tak dikenal dianggap memakai semua cara: lapisnya tetap jadi sebab.
    expect(s.cara?.lapis?.every(l => l.berpengaruh)).toBe(true)
    expect(s.sebab).toEqual(['lain', 'tak_masuk'])
    expect(s.tingkat).toBe('sebagian')
    expect(s.cara?.jendela?.[0]).toMatchObject({ lapis: ['lain', 'mode_mati'], wajib: false, lama: { n: 40, satuan: 'detik' } })
  })
  it('angka berupa teks atau null dibaca aman; batas harian kosong jadi null', () => {
    const s = keStatusWa(lengkap({
      masuk_24j: { dibuat: '3' as unknown as number, pesan: null, berhasil: 1, beda: 0, habis: 0, tanpa_nomor: 0, kedaluwarsa: 0, tak_dikenal: 0, batas: 0, lid: 0 },
      masuk_batas: { terpakai_hari_ini: null, harian: null },
      pengguna: { terverifikasi_masuk: null, terverifikasi_kirim: 2, lewat_gangguan_7h: 0, kredit_ditahan: 0, nomor_ramai_30h: 0 },
    }))
    expect(s.cara?.angka24j?.dibuat).toBe(3)
    expect(s.cara?.angka24j?.pesan).toBe(0)
    expect(s.cara?.batasMasuk).toEqual({ terpakai: 0, harian: null })
    expect(s.cara?.pengguna?.terverifikasi_masuk).toBe(0)
  })
  it('sebagian kunci saja: bagian lain null, keadaan jatuh ke cara lama bila lapis tidak ada', () => {
    const d = lama({ gangguan: ['sesi'] })
    d.masuk_24j = lengkap().masuk_24j
    const s = keStatusWa(d)
    expect(s.cara).toMatchObject({ mode: null, cara: null, lapis: null, sapa: null, batasMasuk: null, jendela: null, pengguna: null })
    expect(s.cara?.angka24j?.dibuat).toBe(12)
    expect(s.tingkat).toBe('gangguan')
    expect(s.sebab).toEqual(['sesi'])
  })
  it('lapis bukan larik dan jendela kosong', () => {
    const s = keStatusWa(lengkap({ lapis: { bersama: null, kirim: null, masuk: null }, jendela_7h: [] }))
    expect(s.cara?.lapis?.map(l => l.kode)).toEqual([[], [], []])
    expect(s.cara?.jendela).toEqual([])
    expect(s.tingkat).toBe('sehat')
  })
})

describe('angka kalimat sebab dan lama', () => {
  it('batas, batas pesan masuk, tak_masuk, dan pesan tertahan menyebut angkanya', () => {
    const s = keStatusWa(lengkap({
      mode: { ...lengkap().mode!, ambang_tak_masuk: 12 },
      masuk_sapa: { ada: true, aktif: true, tertahan: 3, tertua_detik: 185, terakhir_ok: null, dicek_pada: null },
      masuk_batas: { terpakai_hari_ini: 500, harian: 500 },
    }))
    expect(angkaSebabWa('batas', s)).toEqual([4, 50])
    expect(angkaSebabWa('batas_masuk', s)).toEqual([500, 500])
    expect(angkaSebabWa('tak_masuk', s)).toEqual([12])
    expect(angkaSebabWa('masuk_tertahan', s)).toEqual([3, 3])
    expect(angkaSebabWa('darurat', s)).toEqual([])
    expect(angkaSebabWa('masuk_tertahan', keStatusWa(lama()))).toEqual([0, 0])
  })
  it('lamaDari memilih satuan terbesar yang masuk akal', () => {
    expect(lamaDari(0)).toEqual({ n: 0, satuan: 'detik' })
    expect(lamaDari(59)).toEqual({ n: 59, satuan: 'detik' })
    expect(lamaDari(150)).toEqual({ n: 3, satuan: 'menit' })
    expect(lamaDari(3600 * 5)).toEqual({ n: 5, satuan: 'jam' })
    expect(lamaDari(86400 * 3)).toEqual({ n: 3, satuan: 'hari' })
    expect(lamaDari(-5)).toEqual({ n: 0, satuan: 'detik' })
  })
})

// ── Adapter: status WhatsApp per akun ────────────────────────────────────
const akun = (lain: Partial<PenggunaDTO> = {}): PenggunaDTO => ({
  user_id: 'u01', email: 'ora***@contoh.id', display_name: '', created_at: '2026-11-01T00:00:00Z',
  last_sign_in: null, aktivitas_terakhir: null, terbuka: false, banned_until: null,
  jumlah_ruang: 1, jumlah_tx: 3, total_semua: 1, ...lain,
})

describe('keStatusWaAkun', () => {
  it('server tanpa kolom status: null (kolom tampil kosong)', () => {
    expect(keStatusWaAkun({})).toBeNull()
    expect(kePengguna(akun()).statusWa).toBeNull()
  })
  it('terverifikasi lewat pesan masuk dan lewat kode terkirim, dengan tanggal WIB', () => {
    expect(keStatusWaAkun({ status_wa: 'masuk', status_wa_pada: '2026-11-12T17:00:00Z', lewat_sebab: null, nomor_ramai: false, kredit_ditahan: false }))
      .toEqual({ status: 'masuk', pada: '13 Nov 2026', padaIso: '2026-11-12T17:00:00Z', sebabLewat: null, nomorRamai: false, kreditDitahan: false })
    expect(keStatusWaAkun({ status_wa: 'kirim', status_wa_pada: '2026-11-10T00:00:00Z', nomor_ramai: true, kredit_ditahan: false }, 'en'))
      .toMatchObject({ status: 'kirim', pada: '10 Nov 2026', nomorRamai: true })
  })
  it('lewat saat gangguan dan lewat karena nomor tidak terbaca, kredit ditahan', () => {
    expect(keStatusWaAkun({ status_wa: 'lewat', status_wa_pada: '2026-11-11T00:00:00Z', lewat_sebab: 'gangguan', nomor_ramai: null, kredit_ditahan: true }))
      .toMatchObject({ status: 'lewat', sebabLewat: 'gangguan', pada: '11 Nov 2026', nomorRamai: false, kreditDitahan: true })
    expect(keStatusWaAkun({ status_wa: 'lewat', status_wa_pada: '2026-11-11T00:00:00Z', lewat_sebab: 'tanpa_nomor', kredit_ditahan: false })?.sebabLewat).toBe('tanpa_nomor')
  })
  it('belum: tanpa tanggal meski server mengirimnya', () => {
    expect(keStatusWaAkun({ status_wa: 'belum', status_wa_pada: '2026-11-11T00:00:00Z', lewat_sebab: null, nomor_ramai: null, kredit_ditahan: false }))
      .toEqual({ status: 'belum', pada: '—', padaIso: null, sebabLewat: null, nomorRamai: false, kreditDitahan: false })
  })
  it('nilai asing: status lain, sebab lewat tak dikenal null, sebab di luar lewat dibuang', () => {
    expect(keStatusWaAkun({ status_wa: 'aneh', status_wa_pada: null })?.status).toBe('lain')
    expect(keStatusWaAkun({ status_wa: null })?.status).toBe('lain')
    expect(keStatusWaAkun({ status_wa: 'lewat', lewat_sebab: 'entah' })?.sebabLewat).toBeNull()
    expect(keStatusWaAkun({ status_wa: 'masuk', lewat_sebab: 'gangguan' })?.sebabLewat).toBeNull()
  })
  it('kePengguna membawa status; tanpaKontakUtuh tidak membuang kolom status', () => {
    const d = akun({ status_wa: 'lewat', status_wa_pada: '2026-11-11T00:00:00Z', lewat_sebab: 'gangguan', nomor_ramai: null, kredit_ditahan: true })
    expect(kePengguna(d).statusWa?.status).toBe('lewat')
    expect(kePengguna(tanpaKontakUtuh([d])[0]!).statusWa).toEqual(kePengguna(d).statusWa)
  })
})

// ── Kamus ────────────────────────────────────────────────────────────────
const ambil = (b: 'id' | 'en', jalur: string): unknown =>
  jalur.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), KAMUS_CASHFLOW[b])
const semuaTeks = (v: unknown): string[] => {
  if (typeof v === 'string') return [v]
  if (typeof v === 'function') return [String(v(1, 1)), String(v(2, 'menit'))]
  if (v && typeof v === 'object') return Object.values(v).flatMap(semuaTeks)
  return []
}

describe('kamus cara terbalik', () => {
  it('setiap kunci dinamis ada di ID dan EN', () => {
    const T = 'kesehatan.wa.terbalik'
    const jalur = [
      ...[...KODE_GANGGUAN_WA, 'lain'].flatMap(k => [`kesehatan.wa.sebab.${k}`, `kesehatan.wa.langkah.${k}`, `${T}.lapisPendek.${k}`]),
      ...['sehat', 'sebagian', 'gangguan', 'nonaktif'].map(t => `kesehatan.wa.tingkat.${t}`),
      ...[...MODE_WA, 'lain'].flatMap(m => [`${T}.mode.${m}`, `${T}.modeKet.${m}`]),
      ...CARA_WA.flatMap(c => [`${T}.cara.${c}`, `${T}.caraKet.${c}`]),
      ...['sehat', 'sakit', 'diluarMode'].map(k => `${T}.keadaan.${k}`),
      ...KELOMPOK_LAPIS_WA.map(k => `${T}.kelompok.${k}`),
      `${T}.labelTahanKredit`, `${T}.nyala`, `${T}.mati`,
      ...ANGKA_MASUK_WA.map(k => `${T}.angka.${k}`),
      ...ANGKA_PENGGUNA_WA.map(k => `${T}.pengguna.${k}`),
      ...[...STATUS_WA_AKUN, 'lain', 'lewatTanpaNomor', 'judul', 'segmen', 'ramai', 'kredit'].map(k => `pengguna.statusWa.${k}`),
    ]
    const hilang = jalur.flatMap(j => (['id', 'en'] as const).filter(b => ambil(b, j) === undefined).map(b => `${b}:${j}`))
    expect(hilang).toEqual([])
  })
  it('kalimat awam: tak_masuk menyebut ambangnya, tanpa nama lapis mentah', () => {
    const id = KAMUS_CASHFLOW.id.kesehatan.wa
    expect(id.sebab.tak_masuk(8)).toBe('8 kode dibuat dalam sejam tanpa satu pun pesan masuk.')
    expect(id.sebab.masuk_tertahan(2, 3)).toBe('2 pesan berkode tertahan di Sapa, yang tertua sudah 3 menit.')
    expect(id.sebab.batas_masuk(500, 500)).toBe('Batas kode pesan masuk hari ini habis, 500 dari 500.')
    for (const b of ['id', 'en'] as const) {
      const teks = [...LAPIS_WA.masuk, 'mode_mati'].flatMap(k => [
        ...semuaTeks(ambil(b, `kesehatan.wa.sebab.${k}`)), ...semuaTeks(ambil(b, `kesehatan.wa.terbalik.lapisPendek.${k}`)),
      ])
      for (const t of teks) expect(t, `${b}: ${t}`).not.toMatch(/tanpa_tujuan|masuk_belum_ada|masuk_tertahan|tak_masuk|batas_masuk|mode_mati/)
    }
  })
  it('EN tunggal dan jamak', () => {
    const en = KAMUS_CASHFLOW.en.kesehatan.wa
    expect(en.sebab.masuk_tertahan(1, 1)).toBe('1 coded message is held in Sapa, the oldest for 1 minute.')
    expect(en.sebab.tak_masuk(8)).toBe('8 codes were created within an hour without a single incoming message.')
    expect(en.terbalik.lama(1, 'jam')).toBe('1 hour')
    expect(en.terbalik.lama(3, 'hari')).toBe('3 days')
    expect(en.terbalik.pesan(1)).toBe('1 message')
    expect(KAMUS_CASHFLOW.id.kesehatan.wa.terbalik.lama(3, 'hari')).toBe('3 hari')
  })
  it('teks baru tanpa em-dash, titik koma, atau emoji', () => {
    for (const b of ['id', 'en'] as const) {
      const teks = [
        ...semuaTeks(ambil(b, 'kesehatan.wa.terbalik')), ...semuaTeks(ambil(b, 'pengguna.statusWa')),
        ...[...LAPIS_WA.masuk, 'mode_mati'].flatMap(k => [...semuaTeks(ambil(b, `kesehatan.wa.sebab.${k}`)), ...semuaTeks(ambil(b, `kesehatan.wa.langkah.${k}`))]),
        String(ambil(b, 'kesehatan.wa.ketSebagian')), String(ambil(b, 'kesehatan.wa.ketSehatCara')),
      ]
      expect(teks.length).toBeGreaterThan(80)
      expect(teks.filter(t => /[—–;]|\p{Extended_Pictographic}/u.test(t)), b).toEqual([])
    }
  })
})

// ── Penjaga komponen dan halaman ─────────────────────────────────────────
const KOMPONEN = ['components/cashflow/CashflowWaCara.vue', 'components/cashflow/CashflowWaMasuk.vue', 'components/cashflow/CashflowStatusWaAkun.vue']
const HAL_PENGGUNA = 'pages/console/cashflow/pengguna/index.vue'

describe('penjaga komponen cara terbalik', () => {
  it('komponen baru hanya tampilan: tidak mengambil data sendiri', () => {
    for (const f of KOMPONEN) expect(baca(f), f).not.toMatch(/useCashflowAdmin|\.rpc\(|\$fetch|useFetch|setInterval/)
  })
  it('Kesehatan memasangnya hanya tanpa ringkas dan hanya bila server mengirim kunci barunya', () => {
    const s = baca('components/cashflow/CashflowStatusWa.vue')
    expect(s).toMatch(/<template v-if="!ringkas && status\?\.cara">/)
    expect(s).toMatch(/<CashflowWaCara v-if="status\.cara\.mode \|\| status\.cara\.cara \|\| status\.cara\.lapis \|\| status\.cara\.sapa"/)
    expect(s).toMatch(/<CashflowWaMasuk v-if="status\.cara\.angka24j \|\| status\.cara\.jendela \|\| status\.cara\.pengguna"/)
    // Satu panggilan admin_wa_status untuk semua bagian.
    expect(s.match(/api\.waStatus\(\)/g)).toHaveLength(1)
  })
  it('bagian yang kuncinya tidak ada disembunyikan', () => {
    const cara = baca(KOMPONEN[0]!)
    for (const k of ['cara.mode', 'cara.cara', 'cara.lapis', 'cara.sapa']) expect(cara).toContain(`v-if="${k}"`)
    expect(cara).toMatch(/<div v-if="cara\.mode\.tahanKredit !== null" class="min-w-0">/)
    expect(cara).toMatch(/tcf\('kesehatan\.wa\.terbalik\.labelTahanKredit'\)/)
    const masuk = baca(KOMPONEN[1]!)
    for (const k of ['cara.angka24j', 'cara.jendela', 'cara.pengguna']) expect(masuk).toContain(`v-if="${k}"`)
  })
  it('terang dan gelap: tanpa warna mentah, tanpa v-html', () => {
    for (const f of [...KOMPONEN, 'components/cashflow/CashflowStatusWa.vue']) {
      const isi = baca(f)
      expect(isi, f).not.toMatch(/#[0-9a-fA-F]{3,8}\b|bg-white|text-black|bg-black|text-white|(?:bg|text|border)-(?:gray|slate|zinc|red|green|blue|amber|emerald|sky|rose)-\d/)
      expect(isi, f).not.toMatch(/v-html|innerHTML/)
    }
  })
  it('tautan ringkasan pengguna menuju segmen Belum WhatsApp', () => {
    expect(baca(KOMPONEN[1]!)).toMatch(/query: \{ seg: SEGMEN_BELUM_WA \}/)
  })
})

describe('penjaga daftar pengguna: Status WhatsApp', () => {
  const hal = baca(HAL_PENGGUNA)
  it('kolom ada di tabel desktop dan kartu ponsel; kosong bila server belum mengirimnya', () => {
    expect(hal.indexOf("key: 'status_wa'")).toBeGreaterThan(hal.indexOf("key: 'wa'"))
    expect(hal.indexOf("key: 'status_wa'")).toBeLessThan(hal.indexOf("key: 'versi'"))
    expect(hal).toMatch(/<template #cell-status_wa="\{ row \}">\s*<span v-if="!row\.p\.statusWa"/)
    expect(hal).toMatch(/<CashflowStatusWaAkun v-else :status="row\.p\.statusWa" \/>/)
    expect(hal).toMatch(/<div v-if="row\.p\.statusWa" class="col-span-2 min-w-0">/)
    expect(hal).toMatch(/\['email', 'wa', 'status_wa', 'status'\]\.includes\(k\.key\)/)
  })
  it('saringan baru hanya untuk server yang mengenalnya', () => {
    expect(hal).toMatch(/key: 'status_wa', label: tcf\('pengguna\.statusWa\.judul'\), type: 'status' as const, filterable: serverStatusWa\.value/)
    expect(hal).toMatch(/\.\.\.\(serverStatusWa\.value \? \[\{ kunci: SEGMEN_BELUM_WA/)
    expect(hal).toMatch(/if \(serverStatusWa\.value && pakaiStatusWa\(statusWa\)\) filter\.status_wa = statusWa/)
    // Daftar saringan dasar tetap; status_wa ditambahkan terpisah.
    expect(hal).toMatch(/const FILTER = \['email', 'wa', 'versi', 'daftar', 'aktif', 'status'\]/)
  })
  it('server lama menolak saringan (22023 saringan): saringan dilepas, bukan galat', () => {
    expect(hal).toMatch(/e instanceof GalatAdmin && e\.hint === 'saringan' && \(q\.value\.seg === SEGMEN_BELUM_WA \|\| 'status_wa' in filter\)/)
    expect(hal).toMatch(/serverStatusWa\.value = false\s+lepasSaringWa\(\)\s+return/)
    expect(hal).toMatch(/if \(q\.value\.seg === SEGMEN_BELUM_WA\) void setel\(\{ seg: 'semua', hal: 1 \}\)/)
  })
  it('pengenalan server lengket: baris berkolom status, atau segmen/saringan baru yang dijawab', () => {
    expect(hal).toMatch(/const serverStatusWa = useState\('cf_server_status_wa', \(\) => false\)/)
    expect(hal).toMatch(/if \(hasil\.baris\.some\(d => d\.status_wa !== undefined\) \|\| q\.value\.seg === SEGMEN_BELUM_WA \|\| 'status_wa' in filter\) serverStatusWa\.value = true/)
  })
  it('segmen Belum WhatsApp tidak butuh izin pii', () => {
    expect(hal).toMatch(/const segmenButuhHitungan = \(k: string\) => k === 'belum' \|\| k === 'catat7'/)
  })
})

describe('repo publik: berkas baru tanpa data nyata', () => {
  it('tanpa jalur lokal, email nyata, atau nomor WhatsApp utuh', () => {
    for (const f of [...KOMPONEN, 'adapters/cashflowWa.ts', 'tests/cashflow/otp-terbalik.test.ts']) {
      const isi = baca(f)
      expect(isi, f).not.toMatch(/\/Users\/|@gmail\.|@coreasia\.id/)
      expect(isi, f).not.toMatch(/\b628\d{8,11}\b/)
      for (const email of isi.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? []) expect(email, f).toMatch(/@contoh\.id$/)
    }
  })
})
