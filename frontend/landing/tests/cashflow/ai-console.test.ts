/**
 * Asisten AI di console CashFlow: adapter setelan, ringkasan pemakaian, dan
 * katalog model.
 *
 * Kontrak server yang dikunci di sini (lihat migrasi *_ai_chat.sql):
 * - admin_ai_setelan() memulangkan kunci app_config APA ADANYA, berawalan
 *   `ai_`. Membaca kunci tanpa awalan berarti formulir menampilkan nilai
 *   bawaan lalu MENIMPA setelan yang sudah tersimpan dengan nilai itu.
 * - admin_ai_setelan_simpan(p) menolak kunci tanpa awalan (22023), jadi
 *   nilaiSimpanAi() wajib mengirim `ai_*` dan menuntut cashflow:pii.
 * - admin_ai_ringkas() BERLARANG: kredit, pemakaian, pembelian, mcp.
 *   Adapter yang membaca angka datar akan menampilkan nol padahal data ada.
 *
 * Uji kontrak DILEWATI bila folder migrasi CashFlow tidak memuat migrasi AI
 * (env CASHFLOW_MIGRASI bisa menunjuk worktree yang memuatnya).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  BASE_URL_AI_BAWAAN, EFFORT_AI, EFFORT_ANALISA_AI_BAWAAN, EFFORT_CHAT_AI_BAWAAN,
  EFFORT_LAPORAN_AI_BAWAAN, HARGA_AI_BAWAAN, KREDIT_GRATIS_AI_BAWAAN, KALIMAT_UJI,
  MODEL_CHAT_AI_BAWAAN, MODEL_EMBED_AI_BAWAAN, MODEL_MURAH_AI_BAWAAN,
  PENYEDIA_AI_BAWAAN, PROMPT_VERSI_AI_BAWAAN,
  baseUrlAiBersih, baseUrlAiSah, effortUntukModel, hargaAiSah, keHasilUjiAi,
  keKatalogAi, keRingkasAi, keSetelanAi, kreditGratisAiSah, modelAiSah,
  nilaiSimpanAi, normalkanDaftarModel, pesanAmanAi, potongJawabanAi, punyaEffortAi,
  samaSetelanAi, sebabGalatUjiAi, teksDariRespons, type SetelanAi,
} from '~/adapters/cashflowAi'
import { DIR_MIGRASI, adaMigrasi, fungsiTerakhir, pohonJsonb } from './migrasi'

const FILE_AI = adaMigrasi
  ? readdirSync(DIR_MIGRASI).filter(n => /_ai_chat\.sql$/.test(n)).sort().pop() ?? null
  : null
const SQL_AI = FILE_AI ? readFileSync(join(DIR_MIGRASI, FILE_AI), 'utf8') : ''
const adaAi = !!SQL_AI

const setelan = (): SetelanAi => keSetelanAi(null)

describe('model dan URL', () => {
  it('mengenali model penalaran dari awalannya', () => {
    for (const id of ['gpt-5.4-nano', 'gpt-6.1-sol', 'o1-preview', 'o3-mini', 'o4-mini']) {
      expect(punyaEffortAi(id), id).toBe(true)
    }
    expect(punyaEffortAi('text-embedding-3-small')).toBe(false)
    expect(punyaEffortAi('gpt-4o')).toBe(false)
    expect(punyaEffortAi('')).toBe(false)
    expect(punyaEffortAi('  GPT-6.1-SOL  ')).toBe(true)
  })

  it('daftar effort hanya untuk model penalaran', () => {
    expect(effortUntukModel('gpt-6.1-sol')).toEqual([...EFFORT_AI])
    expect(effortUntukModel('text-embedding-3-small')).toEqual([])
  })

  it('base URL harus http(s) tanpa kredensial', () => {
    expect(baseUrlAiSah('https://api.openai.com/v1')).toBe(true)
    expect(baseUrlAiSah('http://127.0.0.1:8787/v1')).toBe(true)
    expect(baseUrlAiSah('ftp://contoh.id')).toBe(false)
    expect(baseUrlAiSah('https://user:sandi@contoh.id')).toBe(false)
    expect(baseUrlAiSah('')).toBe(false)
    expect(baseUrlAiSah(`https://${'a'.repeat(300)}.id`)).toBe(false)
    expect(baseUrlAiBersih('https://api.openai.com/v1///')).toBe('https://api.openai.com/v1')
    expect(baseUrlAiBersih('bukan url')).toBe(BASE_URL_AI_BAWAAN)
    expect(baseUrlAiBersih('')).toBe(BASE_URL_AI_BAWAAN)
  })

  it('id model menerima bentuk fine-tune, menolak spasi', () => {
    expect(modelAiSah('gpt-6.1-sol')).toBe(true)
    expect(modelAiSah('ft:gpt-5.4:org:nama:id')).toBe(true)
    expect(modelAiSah('vendor/model')).toBe(true)
    expect(modelAiSah('model dengan spasi')).toBe(false)
    expect(modelAiSah('')).toBe(false)
    expect(modelAiSah(`a${'b'.repeat(130)}`)).toBe(false)
  })

  it('harga dan kredit gratis dibatasi', () => {
    expect(hargaAiSah(0)).toBe(false)
    expect(hargaAiSah(1)).toBe(true)
    expect(hargaAiSah(100_000_000)).toBe(true)
    expect(hargaAiSah(-1)).toBe(false)
    expect(hargaAiSah(100_000_001)).toBe(false)
    expect(hargaAiSah(1.5)).toBe(false)
    expect(hargaAiSah('10000')).toBe(false)
    expect(kreditGratisAiSah(0)).toBe(true)
    expect(kreditGratisAiSah(1_000)).toBe(true)
    expect(kreditGratisAiSah(1_001)).toBe(false)
    expect(kreditGratisAiSah(2.5)).toBe(false)
  })
})

describe('setelan', () => {
  it('tanpa jawaban server memakai nilai bawaan', () => {
    expect(setelan()).toEqual({
      aktif: false,
      provider: PENYEDIA_AI_BAWAAN,
      baseUrl: BASE_URL_AI_BAWAAN,
      modelChat: MODEL_CHAT_AI_BAWAAN,
      modelMurah: MODEL_MURAH_AI_BAWAAN,
      modelEmbed: MODEL_EMBED_AI_BAWAAN,
      effortChat: EFFORT_CHAT_AI_BAWAAN,
      effortAnalisa: EFFORT_ANALISA_AI_BAWAAN,
      effortLaporan: EFFORT_LAPORAN_AI_BAWAAN,
      kreditGratis: KREDIT_GRATIS_AI_BAWAAN,
      harga: { ...HARGA_AI_BAWAAN },
      promptVersi: PROMPT_VERSI_AI_BAWAAN,
    })
  })

  it('membaca kunci BERAWALAN ai_ dari admin_ai_setelan', () => {
    expect(keSetelanAi({
      ai_aktif: true,
      ai_provider: 'openai',
      ai_base_url: 'https://proksi.contoh.id/v1/',
      ai_model_chat: 'gpt-6.1-sol',
      ai_model_murah: 'gpt-5.4-nano',
      ai_model_embed: 'text-embedding-3-small',
      ai_effort_chat: 'medium',
      ai_effort_analisa: 'high',
      ai_effort_laporan: 'minimal',
      ai_kredit_gratis: '12',
      ai_harga: { 30: '15000', 100: 30000 },
      ai_prompt_versi: '4',
    })).toEqual({
      aktif: true,
      provider: 'openai',
      baseUrl: 'https://proksi.contoh.id/v1',
      modelChat: 'gpt-6.1-sol',
      modelMurah: 'gpt-5.4-nano',
      modelEmbed: 'text-embedding-3-small',
      effortChat: 'medium',
      effortAnalisa: 'high',
      effortLaporan: 'minimal',
      kreditGratis: 12,
      harga: { 30: 15000, 100: 30000, 300: HARGA_AI_BAWAAN[300] },
      promptVersi: 4,
    })
  })

  it('nilai tidak sah kembali ke bawaan, bukan disimpan', () => {
    const s = keSetelanAi({
      ai_aktif: 'ya' as unknown as boolean,
      ai_base_url: 'ftp://contoh.id',
      ai_model_chat: 'ada spasi',
      ai_effort_chat: 'ekstrem',
      ai_kredit_gratis: -5,
      ai_harga: { 30: 0, 100: -1 },
      ai_prompt_versi: 0,
    })
    expect(s.aktif).toBe(false)
    expect(s.baseUrl).toBe(BASE_URL_AI_BAWAAN)
    expect(s.modelChat).toBe(MODEL_CHAT_AI_BAWAAN)
    expect(s.effortChat).toBe(EFFORT_CHAT_AI_BAWAAN)
    expect(s.kreditGratis).toBe(KREDIT_GRATIS_AI_BAWAAN)
    expect(s.harga).toEqual({ ...HARGA_AI_BAWAAN })
    expect(s.promptVersi).toBe(PROMPT_VERSI_AI_BAWAAN)
  })

  it('nilaiSimpanAi mengirim kunci ai_* yang diterima SQL', () => {
    const kirim = nilaiSimpanAi(setelan())
    expect(Object.keys(kirim).sort()).toEqual([
      'ai_aktif', 'ai_base_url', 'ai_effort_analisa', 'ai_effort_chat', 'ai_effort_laporan',
      'ai_harga', 'ai_kredit_gratis', 'ai_model_chat', 'ai_model_embed', 'ai_model_murah',
      'ai_prompt_versi', 'ai_provider',
    ])
    expect(kirim.ai_harga).toEqual({ 30: 10000, 100: 25000, 300: 60000 })
    expect(kirim.ai_aktif).toBe(false)
  })

  it('perjalanan simpan lalu baca memulangkan setelan yang sama', () => {
    const asli: SetelanAi = {
      ...setelan(),
      aktif: true,
      baseUrl: 'https://proksi.contoh.id/v1',
      effortChat: 'high',
      kreditGratis: 3,
      harga: { 30: 11000, 100: 26000, 300: 61000 },
      promptVersi: 7,
    }
    expect(keSetelanAi(nilaiSimpanAi(asli) as never)).toEqual(asli)
  })

  it('samaSetelanAi membandingkan nilai yang benar-benar disimpan', () => {
    const a = setelan()
    const b = { ...a, modelChat: 'gpt-6.1-sol', harga: { ...a.harga } }
    expect(samaSetelanAi(a, b)).toBe(true)
    expect(samaSetelanAi(a, { ...b, aktif: true })).toBe(false)
    expect(samaSetelanAi(a, { ...b, harga: { ...b.harga, 30: 1 } })).toBe(false)
  })
})

describe('ringkasan pemakaian', () => {
  it('membaca bentuk BERSARANG dari admin_ai_ringkas', () => {
    expect(keRingkasAi({
      kredit: { beredar: '9' },
      pemakaian: {
        percakapan: 2, pesan: '7', token_masuk: 120, token_keluar: '30', biaya: '0.45',
      },
    })).toEqual({
      pesan: 7, tokenMasuk: 120, tokenKeluar: 30, token: 150, biaya: 0.45, saldoBeredar: 9,
    })
  })

  it('bentuk kosong menjadi nol, bukan NaN', () => {
    expect(keRingkasAi(null)).toEqual({
      pesan: 0, tokenMasuk: 0, tokenKeluar: 0, token: 0, biaya: 0, saldoBeredar: 0,
    })
    expect(keRingkasAi({ pemakaian: { pesan: 'banyak' } }).pesan).toBe(0)
  })
})

describe('katalog model', () => {
  it('menerima {data}, {models}, dan larik polos', () => {
    expect(normalkanDaftarModel({ data: [{ id: 'b' }, { id: 'a' }] }).map(m => m.id)).toEqual(['a', 'b'])
    expect(normalkanDaftarModel({ models: [{ id: 'a' }] }).map(m => m.id)).toEqual(['a'])
    expect(normalkanDaftarModel(['b', 'a']).map(m => m.id)).toEqual(['a', 'b'])
  })

  it('membuang duplikat, entri rusak, dan menandai effort', () => {
    const d = normalkanDaftarModel({ data: [
      { id: 'gpt-6.1-sol' }, { id: 'gpt-6.1-sol' }, { id: '  ' }, null, { id: 'text-embedding-3-small' },
    ] })
    expect(d.map(m => m.id)).toEqual(['gpt-6.1-sol', 'text-embedding-3-small'])
    expect(d[0]!.alasan).toBe(true)
    expect(d[0]!.effort).toEqual([...EFFORT_AI])
    expect(d[1]!.alasan).toBe(false)
    expect(d[1]!.effort).toEqual([])
  })

  it('katalog kosong atau rusak jatuh ke daftar bawaan', () => {
    const k = keKatalogAi({ daftar: [], sumber: 'penyedia', galat: '  ' })
    expect(k.sumber).toBe('penyedia')
    expect(k.daftar.map(m => m.id)).toEqual([
      MODEL_CHAT_AI_BAWAAN, MODEL_MURAH_AI_BAWAAN, MODEL_EMBED_AI_BAWAAN,
    ])
    expect(k.galat).toBeNull()
    expect(keKatalogAi(null).sumber).toBe('bawaan')
    expect(keKatalogAi({ belum_terkonfigurasi: true }).belumTerkonfigurasi).toBe(true)
  })
})

describe('uji koneksi', () => {
  it('membaca teks dari dua bentuk Responses API', () => {
    expect(teksDariRespons({ output_text: '  Halo  ' })).toBe('Halo')
    expect(teksDariRespons({ output: [
      { content: [{ text: 'Halo' }, { text: 'dunia' }] },
      { content: [{ type: 'image' }] },
    ] })).toBe('Halo dunia')
    expect(teksDariRespons(null)).toBe('')
    expect(teksDariRespons({ output: 'x' })).toBe('')
  })

  it('merapikan dan memotong jawaban tanpa membelah emoji', () => {
    expect(potongJawabanAi('  satu\n\n dua  ')).toEqual({ teks: 'satu dua', dipotong: false })
    const banyak = '😀'.repeat(5)
    expect(potongJawabanAi(banyak, 3)).toEqual({ teks: '😀😀😀', dipotong: true })
    expect(potongJawabanAi('pendek', 200).dipotong).toBe(false)
  })

  it('pesan penyedia tidak membocorkan kunci', () => {
    expect(pesanAmanAi('Authorization: Bearer sk-proj-abcdefghijklmnop')).toBe('Authorization: [kunci disembunyikan]')
    expect(pesanAmanAi('  banyak   spasi  ')).toBe('banyak spasi')
    expect(pesanAmanAi('x'.repeat(300)).length).toBe(240)
  })

  it('hasil uji dibaca dan dipotong', () => {
    expect(keHasilUjiAi({
      waktu_ms: '820', jawaban: KALIMAT_UJI, model: 'gpt-6.1-sol', effort: 'low',
    })).toEqual({
      waktuMs: 820, jawaban: KALIMAT_UJI, dipotong: false, model: 'gpt-6.1-sol', effort: 'low',
    })
    expect(keHasilUjiAi({ jawaban: 'y'.repeat(500) }).dipotong).toBe(true)
    expect(keHasilUjiAi({ jawaban: 'x', effort: 'ekstrem' }).effort).toBeNull()
  })

  it('galat route uji menjadi kode kamus', () => {
    expect(sebabGalatUjiAi({ status: 401 }).kode).toBe('tanpa-izin')
    expect(sebabGalatUjiAi({ status: 429 }).kode).toBe('batas-penyedia')
    expect(sebabGalatUjiAi({ status: 400 }).kode).toBe('masukan')
    expect(sebabGalatUjiAi({ status: 503 }).kode).toBe('penyedia-gagal')
    expect(sebabGalatUjiAi({}).kode).toBe('jaringan')
    expect(sebabGalatUjiAi({ data: { statusMessage: 'kunci-ditolak' } }).kode).toBe('kunci-ditolak')
    const d = sebabGalatUjiAi({ status: 401, data: { statusMessage: 'x', data: { pesan: 'sk-proj-rahasia12345' } } })
    expect(d.detail).not.toContain('rahasia12345')
  })
})

describe.skipIf(!adaAi)('kontrak migrasi AI', () => {
  const kunciSetelan = (): string[] => {
    const f = fungsiTerakhir('admin_ai_setelan')
    const daftar = /array\[([\s\S]*?)\]/i.exec(f.badan)?.[1] ?? ''
    return [...new Set([...daftar.matchAll(/'(ai_[a-z_]+)'/g)].map(m => m[1]!))].sort()
  }

  it('admin_ai_setelan memulangkan dua belas kunci ai_*', () => {
    expect(kunciSetelan()).toEqual([
      'ai_aktif', 'ai_base_url', 'ai_effort_analisa', 'ai_effort_chat', 'ai_effort_laporan',
      'ai_harga', 'ai_kredit_gratis', 'ai_model_chat', 'ai_model_embed', 'ai_model_murah',
      'ai_prompt_versi', 'ai_provider',
    ])
  })

  it('nilaiSimpanAi mengirim persis kunci yang diterima fungsi simpan', () => {
    expect(Object.keys(nilaiSimpanAi(setelan())).sort()).toEqual(kunciSetelan())
    const f = fungsiTerakhir('admin_ai_setelan_simpan')
    expect(f.badan).toContain("konsol_boleh('cashflow:pii')")
    for (const k of kunciSetelan()) expect(f.badan, k).toContain(`'${k}'`)
  })

  it('admin_ai_ringkas memulangkan empat kelompok bersarang', () => {
    const f = fungsiTerakhir('admin_ai_ringkas')
    const pohon = semuaPohon(f.badan)
    expect(pohon).toEqual(['kredit', 'pemakaian', 'pembelian', 'mcp'])
    const pakai = pohonObjek(f.badan, 'pemakaian')
    expect(Object.keys(pakai).sort()).toEqual([
      'biaya', 'percakapan', 'pesan', 'pesan_30hari', 'token_keluar', 'token_masuk',
    ])
    expect(Object.keys(pohonObjek(f.badan, 'kredit'))).toContain('beredar')
  })

  it('nilai bawaan migrasi sama dengan nilai bawaan adapter', () => {
    const nilai = (kunci: string): string => {
      const m = new RegExp(`\\('${kunci}',\\s*'([^']*)'::jsonb`).exec(SQL_AI)
      expect(m, kunci).not.toBeNull()
      return JSON.parse(m![1]!.replace(/''/g, "'"))
    }
    expect(nilai('ai_aktif')).toBe(false)
    expect(nilai('ai_provider')).toBe(PENYEDIA_AI_BAWAAN)
    expect(nilai('ai_base_url')).toBe(BASE_URL_AI_BAWAAN)
    expect(nilai('ai_model_chat')).toBe(MODEL_CHAT_AI_BAWAAN)
    expect(nilai('ai_model_murah')).toBe(MODEL_MURAH_AI_BAWAAN)
    expect(nilai('ai_model_embed')).toBe(MODEL_EMBED_AI_BAWAAN)
    expect(nilai('ai_effort_chat')).toBe(EFFORT_CHAT_AI_BAWAAN)
    expect(nilai('ai_effort_analisa')).toBe(EFFORT_ANALISA_AI_BAWAAN)
    expect(nilai('ai_effort_laporan')).toBe(EFFORT_LAPORAN_AI_BAWAAN)
    expect(nilai('ai_kredit_gratis')).toBe(KREDIT_GRATIS_AI_BAWAAN)
    expect(nilai('ai_harga')).toEqual({ ...HARGA_AI_BAWAAN })
    expect(nilai('ai_prompt_versi')).toBe(PROMPT_VERSI_AI_BAWAAN)
  })
})

/** Nama kelompok jsonb tingkat atas, urut kemunculan. */
function semuaPohon(badan: string): string[] {
  const hasil: string[] = []
  for (const m of badan.matchAll(/'([a-z_]+)',\s*jsonb_build_object\s*\(/g)) hasil.push(m[1]!)
  return hasil
}

/** Kunci satu kelompok `jsonb_build_object` tingkat atas. */
function pohonObjek(badan: string, nama: string): Record<string, unknown> {
  const i = badan.indexOf(`'${nama}', jsonb_build_object(`)
  expect(i, nama).toBeGreaterThan(-1)
  const mulai = badan.indexOf('(', i)
  let dalam = 0
  for (let j = mulai; j < badan.length; j++) {
    if (badan[j] === '(') dalam++
    else if (badan[j] === ')') {
      dalam--
      if (dalam === 0) return pohonJsonb(badan.slice(i, j + 1))
    }
  }
  throw new Error(`Kurung ${nama} tidak tertutup`)
}
