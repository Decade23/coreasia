/**
 * Nomor WhatsApp di console CashFlow: daftar pengguna dan kepala Pengguna 360.
 *
 * Kontraknya (server): kolom nomor_wa tersamar ('0812 •••• 7890') kecuali daftar
 * dibuka dengan alasan, saat itu utuh berbentuk '628…'. Server yang belum
 * memasang migrasinya tidak mengirim kolom itu sama sekali. Yang dikunci di sini:
 * - adapter: utuh → gaya lokal '0812 3456 7890' hanya bila `terbuka`; tersamar
 *   apa adanya; null dan kolom yang tidak ada → tidak ada nomor;
 * - mematikan sakelar Kontak lengkap membuang email utuh DAN nomor utuh;
 * - indeks palet tidak pernah memegang nomor;
 * - pencarian lokal mencocokkan nomor hanya selagi terbuka.
 *
 * Semua nomor di sini rekaan.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { readonly, ref, type Ref } from 'vue'
import {
  formatNomorWa, kePengguna, nomorWaCocok, samarkanNomorWa, tanpaKontakUtuh, type PenggunaDTO,
} from '~/adapters/cashflow'
import { keKepala, type KepalaPenggunaDTO } from '~/adapters/cashflowBuku'
import { KAMUS_CASHFLOW } from '~/composables/cashflow/useCashflowI18n'
import { adaMigrasiNomor, fungsiTerakhir, kolomKembalian, nomorUtuhHanyaPii } from './migrasi'

const UTUH = '6281234567890'
const LOKAL = '0812 3456 7890'
const SAMAR = '0812 •••• 7890'

const dto = (lain: Partial<PenggunaDTO> = {}): PenggunaDTO => ({
  user_id: 'u01', email: 'ora***@contoh.id', display_name: '', created_at: '2026-09-01T00:00:00+00:00',
  last_sign_in: null, aktivitas_terakhir: null, terbuka: false, banned_until: null,
  jumlah_ruang: 1, jumlah_tx: 3, total_semua: 1, ...lain,
})
/** Bentuk jawaban server sebelum migrasi nomor WA: kuncinya tidak ada sama sekali. */
const tanpaKolom = (): PenggunaDTO => {
  const d = dto()
  delete d.nomor_wa
  return d
}

describe.skipIf(!adaMigrasiNomor('0121'))('kontrak 0121: admin_daftar_pengguna_v2 dan admin_pengguna_kepala', () => {
  it('contoh DTO = kolom kembalian server; nomor_wa di akhir (0121), lalu versi_aplikasi dan platform (0123)', () => {
    const kolom = kolomKembalian('admin_daftar_pengguna_v2')
    const ada0123 = adaMigrasiNomor('0123')
    const ekor = ada0123 ? ['nomor_wa', 'versi_aplikasi', 'platform'] : ['nomor_wa']
    expect(kolom.slice(-ekor.length)).toEqual(ekor)
    const contoh = { ...dto({ nomor_wa: SAMAR }), ...(ada0123 ? { versi_aplikasi: '1.3.6', platform: 'android' } : {}) }
    expect(Object.keys(contoh).sort()).toEqual([...kolom].sort())
  })
  it('nomor utuh hanya di cabang beralasan; cabang tersamar lewat nomor_wa_samar', () => {
    const { badan } = fungsiTerakhir('admin_daftar_pengguna_v2')
    const pecah = badan.lastIndexOf('return query')
    expect(badan.slice(0, pecah)).toMatch(/true,\s*\(select n\.nomor from public\.nomor_wa n where n\.user_id = u\.id\)/)
    expect(badan.slice(pecah)).toMatch(/false,\s*\(select public\.nomor_wa_samar\(n\.nomor\) from public\.nomor_wa n where n\.user_id = u\.id\)/)
    // Pencarian tersamar tetap hanya pada email tersamar (anti-enumerasi nomor).
    expect(badan.slice(pecah)).not.toMatch(/nomor\s+ilike/)
  })
  it('samaran peramban = public.nomor_wa_samar (0117) untuk setiap panjang nomor yang sah', () => {
    const { badan } = fungsiTerakhir('nomor_wa_samar')
    expect(badan).toMatch(/when p ~ '\^628\[0-9\]\{8,11\}\$' then '0' \|\| substr\(p, 3, 3\) \|\| ' •••• ' \|\| right\(p, 4\)/)
    const server = (p: string) => (/^628[0-9]{8,11}$/.test(p) ? `0${p.slice(2, 5)} •••• ${p.slice(-4)}` : null)
    for (let panjang = 8; panjang <= 11; panjang++) {
      const p = `628${'1234567890123'.slice(0, panjang)}`
      expect(samarkanNomorWa(p), p).toBe(server(p))
    }
  })
  it('kepala: tersamar saja (0121), atau utuh HANYA di cabang pii (0123)', () => {
    const { badan } = fungsiTerakhir('admin_pengguna_kepala')
    if (adaMigrasiNomor('0123')) {
      expect(nomorUtuhHanyaPii(badan)).toEqual({ terjaga: true, lepas: [] })
    } else {
      expect(badan).toMatch(/'nomor_wa',\s*\(select public\.nomor_wa_samar\(n\.nomor\)/)
      expect(badan).not.toMatch(/'nomor_wa',\s*\(select n\.nomor\b/)
    }
  })
})

describe('formatNomorWa', () => {
  it('628… → 0 + digit, kelompok 4-4-sisa', () => {
    expect(formatNomorWa(UTUH)).toBe(LOKAL)
    expect(formatNomorWa('628123456789')).toBe('0812 3456 789')
    expect(formatNomorWa('62812345678901')).toBe('0812 3456 78901')
  })
  it('pemisah dan awalan + diterima; bentuk lokal tetap lokal', () => {
    expect(formatNomorWa('+62 812-3456-7890')).toBe(LOKAL)
    expect(formatNomorWa('081234567890')).toBe(LOKAL)
    expect(formatNomorWa('81234567890')).toBe(LOKAL)
  })
  it('tersamar, teks lain, kosong → null (bukan dipaksa tampil sebagai nomor utuh)', () => {
    expect(formatNomorWa(SAMAR)).toBeNull()
    expect(formatNomorWa('0812****7890')).toBeNull()
    expect(formatNomorWa('nomor rahasia')).toBeNull()
    expect(formatNomorWa('12345')).toBeNull()
    expect(formatNomorWa('')).toBeNull()
    expect(formatNomorWa(null)).toBeNull()
    expect(formatNomorWa(undefined)).toBeNull()
  })
})

describe('samarkanNomorWa', () => {
  it('nomor utuh → 4 depan, •••• , 4 belakang', () => {
    expect(samarkanNomorWa(UTUH)).toBe(SAMAR)
    expect(samarkanNomorWa(LOKAL)).toBe(SAMAR)
  })
  it('idempoten atas bentuk server', () => {
    expect(samarkanNomorWa(SAMAR)).toBe(SAMAR)
    expect(samarkanNomorWa(samarkanNomorWa(UTUH))).toBe(SAMAR)
    expect(samarkanNomorWa('0812****7890')).toBe('0812****7890')
  })
  it('semua panjang nomor yang sah: 4 depan dan 4 belakang, seperti nomor_wa_samar', () => {
    expect(samarkanNomorWa('62812345678')).toBe('0812 •••• 5678')
    expect(samarkanNomorWa('628123456789')).toBe('0812 •••• 6789')
    expect(samarkanNomorWa('62812345678901')).toBe('0812 •••• 8901')
  })
  it('teks tak dikenal → ••••, kosong → null', () => {
    expect(samarkanNomorWa('nomor rahasia')).toBe('••••')
    expect(samarkanNomorWa('12345')).toBe('••••')
    expect(samarkanNomorWa('  ')).toBeNull()
    expect(samarkanNomorWa(null)).toBeNull()
    expect(samarkanNomorWa(undefined)).toBeNull()
  })
})

describe('kePengguna: nomor', () => {
  it('terbuka + utuh → nomorPenuh lokal, nomorTersamar tetap ada', () => {
    const p = kePengguna(dto({ email: 'orang@contoh.id', terbuka: true, nomor_wa: UTUH }))
    expect(p).toMatchObject({ nomorPenuh: LOKAL, nomorTersamar: SAMAR, emailPenuh: 'orang@contoh.id' })
  })
  it('tersamar dari server → ditampilkan apa adanya, tanpa nomorPenuh', () => {
    expect(kePengguna(dto({ nomor_wa: SAMAR }))).toMatchObject({ nomorPenuh: null, nomorTersamar: SAMAR })
  })
  it('null → tidak ada nomor', () => {
    expect(kePengguna(dto({ nomor_wa: null }))).toMatchObject({ nomorPenuh: null, nomorTersamar: null })
    expect(kePengguna(dto({ terbuka: true, email: 'orang@contoh.id', nomor_wa: null }))).toMatchObject({ nomorPenuh: null, nomorTersamar: null })
  })
  it('server tanpa kolom nomor_wa (sebelum migrasi) → tidak ada nomor, email tetap jalan', () => {
    const p = kePengguna(tanpaKolom())
    expect(p).toMatchObject({ nomorPenuh: null, nomorTersamar: null, emailTersamar: 'ora***@contoh.id' })
  })
  it('sabuk kedua: nomor utuh tanpa `terbuka` tetap disamarkan', () => {
    expect(kePengguna(dto({ terbuka: false, nomor_wa: UTUH }))).toMatchObject({ nomorPenuh: null, nomorTersamar: SAMAR })
  })
  it('terbuka tapi nomornya tersamar (jawaban ganjil) → jatuh ke bentuk tersamar', () => {
    expect(kePengguna(dto({ terbuka: true, email: 'orang@contoh.id', nomor_wa: SAMAR }))).toMatchObject({ nomorPenuh: null, nomorTersamar: SAMAR })
  })
})

describe('tanpaKontakUtuh (sakelar Kontak lengkap dimatikan)', () => {
  const terbuka = [
    dto({ user_id: 'u01', email: 'orang.satu@contoh.id', terbuka: true, nomor_wa: UTUH }),
    dto({ user_id: 'u02', email: 'dua@contoh.id', terbuka: true, nomor_wa: null }),
    { ...tanpaKolom(), user_id: 'u03', email: 'tiga@contoh.id', terbuka: true },
  ]
  const bersih = tanpaKontakUtuh(terbuka)

  it('email dan nomor utuh hilang dari memori, terbuka=false', () => {
    const teks = JSON.stringify(bersih)
    for (const rahasia of ['orang.satu@', 'dua@', 'tiga@', UTUH, '34567', LOKAL]) expect(teks).not.toContain(rahasia)
    expect(bersih.map(d => d.terbuka)).toEqual([false, false, false])
    expect(bersih[0]).toMatchObject({ email: 'ora***@contoh.id', nomor_wa: SAMAR })
  })
  it('null tetap null, kolom yang tidak dikirim tetap tidak ada', () => {
    expect(bersih[1]!.nomor_wa).toBeNull()
    expect('nomor_wa' in bersih[2]!).toBe(false)
  })
  it('hasilnya lewat adapter: tidak ada kontak utuh', () => {
    for (const p of bersih.map(d => kePengguna(d))) {
      expect(p.emailPenuh).toBeNull()
      expect(p.nomorPenuh).toBeNull()
    }
    expect(kePengguna(bersih[0]!).nomorTersamar).toBe(SAMAR)
  })
  it('idempoten dan tidak mengubah larik asal', () => {
    expect(tanpaKontakUtuh(bersih)).toEqual(bersih)
    expect(terbuka[0]!.nomor_wa).toBe(UTUH)
  })
})

describe('nomorWaCocok (pencarian lokal, hanya saat terbuka)', () => {
  it('bentuk lokal, internasional, dengan atau tanpa spasi', () => {
    for (const k of ['08123456', '0812 3456', '62812345', '+62 812', '7890', '3456-7890']) expect(nomorWaCocok(LOKAL, k), k).toBe(true)
  })
  it('kueri bukan nomor atau terlalu pendek → tidak mencocokkan', () => {
    for (const k of ['orang2@contoh.id', 'ora', '12', '', '0812 x']) expect(nomorWaCocok(LOKAL, k), k).toBe(false)
  })
  it('tanpa nomor utuh (tersamar/null) → tidak pernah cocok', () => {
    expect(nomorWaCocok(null, '0812')).toBe(false)
    expect(nomorWaCocok(SAMAR, '0812')).toBe(false)
    expect(nomorWaCocok(SAMAR, '7890')).toBe(false)
  })
})

describe('penjaga uji: nomor utuh hanya di cabang pii', () => {
  const BACA = `select n.nomor into v_nomor from public.nomor_wa n where n.user_id = p_user;`
  const PENANDA = `|| case when v_pii and v_nomor is not null then jsonb_build_object('nomor_utuh', true) else '{}'::jsonb end`
  const KELUAR = `'nomor_wa', case when v_pii then v_nomor else public.nomor_wa_samar(v_nomor) end)`
  it('menerima keluaran case v_pii (variabel maupun langsung)', () => {
    expect(nomorUtuhHanyaPii(`${BACA} ${PENANDA} ${KELUAR}`)).toEqual({ terjaga: true, lepas: [] })
    expect(nomorUtuhHanyaPii(`'nomor_wa', case when v_pii then n.nomor else public.nomor_wa_samar(n.nomor) end`)).toEqual({ terjaga: true, lepas: [] })
  })
  it('menolak keluaran tanpa penjaga, dan variabel nomor yang ikut ke detail audit', () => {
    expect(nomorUtuhHanyaPii(`'nomor_wa', v_nomor`).terjaga).toBe(false)
    expect(nomorUtuhHanyaPii(`'nomor_wa', (select n.nomor from public.nomor_wa n where n.user_id = u.id)`).terjaga).toBe(false)
    const bocor = nomorUtuhHanyaPii(`${BACA} jsonb_build_object('nomor', v_nomor) ${KELUAR}`)
    expect(bocor.terjaga).toBe(true)
    expect(bocor.lepas).toHaveLength(1)
  })
})

describe('keKepala: utuh untuk sesi ber-pii (0123), tersamar bila tidak, tanpa baris bila null', () => {
  const RUANG = [{ workspace_id: 'w1', nama: 'Bi······', jenis: 'usaha', peran: 'owner', pemilik: true, bekas_anggota: false, jumlah_anggota: 1, tx_oleh_dia: 3 }]
  /** `ruang` hanya dikirim server kepada pemegang cashflow:pii. */
  const kepala = (lain: Partial<KepalaPenggunaDTO> = {}): KepalaPenggunaDTO => ({
    user_id: 'u01', email: 'ora***@contoh.id', daftar: '2026-09-01T00:00:00+00:00', masuk_terakhir: null,
    banned_until: null, jumlah_ruang: 1, jumlah_transaksi: 3, akses_30hari: 0, ruang: RUANG, ...lain,
  })
  it('utuh dari server untuk sesi ber-pii → gaya lokal, tidak disamarkan (Master 3 Nov)', () => {
    expect(keKepala(kepala({ nomor_wa: UTUH })).nomorWa).toBe(LOKAL)
  })
  it('tersamar dari server (sesi tanpa pii, atau server 0121) → apa adanya', () => {
    expect(keKepala(kepala({ nomor_wa: SAMAR })).nomorWa).toBe(SAMAR)
    expect(keKepala(kepala({ nomor_wa: SAMAR, ruang: null })).nomorWa).toBe(SAMAR)
  })
  it('null atau kunci tidak dikirim → null (baris WhatsApp disembunyikan)', () => {
    expect(keKepala(kepala({ nomor_wa: null })).nomorWa).toBeNull()
    expect(keKepala(kepala()).nomorWa).toBeNull()
  })
  it('sabuk kedua: nomor utuh kepada kepala tanpa ruang (sesi tanpa pii) tetap disamarkan', () => {
    expect(keKepala(kepala({ nomor_wa: UTUH, ruang: null })).nomorWa).toBe(SAMAR)
  })
})

describe('kepala Pengguna 360: tampilan dan jejak nomor utuh', () => {
  const baca = (f: string) => readFileSync(fileURLToPath(new URL(`../../${f}`, import.meta.url)), 'utf8')
  it('baris WhatsApp hanya bila ada nomor, menampilkan nomorWa apa adanya', () => {
    const f = baca('components/cashflow/CashflowKepala360.vue')
    expect(f).toMatch(/<div v-if="kepala\.nomorWa">/)
    expect(f).toMatch(/\{\{ kepala\.nomorWa \}\}/)
    expect(f).not.toMatch(/nomorTersamar|nomorDikirim/)
  })
  it('kepala tidak pernah masuk indeks palet atau remah: label subjek tetap email tersamar', () => {
    const induk = baca('pages/console/cashflow/pengguna/[id].vue')
    expect(induk).not.toMatch(/indeks\.isi\(/)
    expect(induk).toMatch(/const labelSubjek = computed\(\(\) => kepala\.value\?\.emailTersamar \?\?/)
    expect(induk).not.toMatch(/kepala\.value\?\.nomorWa/)
    expect(baca('composables/cashflow/useCashflowPengguna.ts')).not.toMatch(/indeks|nomorWa/)
  })
  it('kepala (dengan nomornya) dibuang saat subjek berganti, saat keluar dari Pengguna 360, dan saat logout', () => {
    const induk = baca('pages/console/cashflow/pengguna/[id].vue')
    expect(induk).toMatch(/^kepala\.value = null$/m)
    expect(induk).toMatch(/onBeforeUnmount\(\(\) => \{[\s\S]*?if \(kepala\.value\?\.id === id\.value\) kepala\.value = null[\s\S]*?\}\)/)
    expect(baca('composables/cashflow/useCashflowSesi.ts')).toMatch(/useState<unknown>\('cf_kepala', \(\) => null\)\.value = null/)
  })
})

describe('indeks palet tidak memegang nomor', () => {
  const keadaan = new Map<string, Ref<unknown>>()
  beforeAll(() => {
    vi.stubGlobal('readonly', readonly)
    vi.stubGlobal('useCashflowAdmin', () => ({ daftarPengguna: vi.fn() }))
    vi.stubGlobal('useState', (k: string, awal: () => unknown) => {
      if (!keadaan.has(k)) keadaan.set(k, ref(awal()))
      return keadaan.get(k)
    })
  })
  afterAll(() => vi.unstubAllGlobals())

  it('isi() dari daftar yang sedang terbuka hanya menyimpan id dan email tersamar', async () => {
    const { useCashflowIndeks } = await import('~/composables/cashflow/useCashflowIndeks')
    const indeks = useCashflowIndeks()
    const p = kePengguna(dto({ email: 'orang@contoh.id', terbuka: true, nomor_wa: UTUH }))
    indeks.isi([p], 1)
    expect(indeks.entri.value).toEqual([{ id: 'u01', emailTersamar: 'ora***@contoh.id' }])
    expect(JSON.stringify(indeks.entri.value)).not.toMatch(/0812|•/)
  })
})

describe('halaman daftar pengguna memakai satu jalur pembersih', () => {
  const SRC = readFileSync(fileURLToPath(new URL('../../pages/console/cashflow/pengguna/index.vue', import.meta.url)), 'utf8')
  it('muat tanpa alasan dan sakelar mati sama-sama lewat tanpaKontakUtuh', () => {
    expect(SRC).toMatch(/mentah\.value = alasan \? hasil\.baris : tanpaKontakUtuh\(hasil\.baris\)/)
    expect(SRC).toMatch(/mentah\.value = tanpaKontakUtuh\(mentah\.value\)/)
    // Pembersih lama yang hanya menyamarkan email tidak boleh kembali.
    expect(SRC).not.toMatch(/tanpaEmailUtuh/)
  })
  it('pencarian nomor dikirim ke server bersama keadaan kontak', () => {
    expect(SRC).toMatch(/cari: cariDiterapkan\.value\.trim\(\)/)
    expect(SRC).toMatch(/alasan: alasan\?\.alasan \?\? null/)
  })
  it('alasan audit sakelar cukup panjang untuk server (≥ 8 aksara) dan menyebut kontak', () => {
    const alasan = SRC.match(/const ALASAN_SAKELAR = '([^']+)'/)?.[1] ?? ''
    expect(alasan.trim().length).toBeGreaterThanOrEqual(8)
    expect(alasan).toMatch(/Kontak lengkap/)
  })
  it('label sakelar dan kolom tersedia ID dan EN', () => {
    expect(KAMUS_CASHFLOW.id.pengguna.kontakPenuh).toBe('Kontak lengkap')
    expect(KAMUS_CASHFLOW.en.pengguna.kontakPenuh).toBe('Full contact')
    for (const b of ['id', 'en'] as const) {
      expect(KAMUS_CASHFLOW[b].pengguna.wa).toBe('WhatsApp')
      expect(KAMUS_CASHFLOW[b].pengguna.ket).toMatch(/WhatsApp/)
    }
  })
})
