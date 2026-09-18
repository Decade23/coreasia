/** Kalimat berfungsi di kamus CashFlow — bentuk tunggal/jamak EN. */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { KAMUS_CASHFLOW } from '~/composables/cashflow/useCashflowI18n'

describe('pengguna.jedaSetelah', () => {
  const en = KAMUS_CASHFLOW.en.pengguna.jedaSetelah
  it('EN: n = 1 tunggal, selainnya jamak', () => {
    expect(en(1, 'jam')).toBe('First recorded 1 hour after signing up')
    expect(en(1, 'menit')).toBe('First recorded 1 minute after signing up')
    expect(en(1, 'hari')).toBe('First recorded 1 day after signing up')
    expect(en(0, 'menit')).toBe('First recorded 0 minutes after signing up')
    expect(en(7, 'jam')).toBe('First recorded 7 hours after signing up')
  })
  it('ID tanpa jamak', () => {
    expect(KAMUS_CASHFLOW.id.pengguna.jedaSetelah(1, 'jam')).toBe('Mencatat pertama kali 1 jam setelah daftar')
  })
})

describe('pengguna.bercatatan menyebut penanda baris (legenda pil Catatan)', () => {
  it('ID dan EN menyebut label pil yang sama dengan yang tampil di tabel', () => {
    for (const b of ['id', 'en'] as const) {
      const k = KAMUS_CASHFLOW[b].pengguna
      expect(k.bercatatan(3)).toContain(k.catatanPil)
    }
  })
  it('EN: tunggal/jamak', () => {
    expect(KAMUS_CASHFLOW.en.pengguna.bercatatan(1)).toBe('1 transaction here has a note (tagged “Note”).')
  })
})

describe('kaki transfer: arah terbaca di kedua bahasa', () => {
  it('label keluar/masuk berbeda dari label netral', () => {
    for (const b of ['id', 'en'] as const) {
      const k = KAMUS_CASHFLOW[b].pengguna
      expect(new Set([k.transfer, k.transferKeluar, k.transferMasuk]).size).toBe(3)
    }
  })
})

/* Label preset gerbang alasan ikut masuk ke teks alasan audit. Membuka daftar
   pengecualian di /sakelar dengan preset bawaan ("Keluhan pengguna", …)
   memaksa admin memilih label yang keliru — lalu label itu tercatat di audit
   buka_config DAN set_config (alasan pembukaan mengisi alasan perubahan). */
describe('gerbang /sakelar memakai preset tindakannya sendiri', () => {
  it('sakelar.bukaPreset: kunci sama di ID/EN, tidak meminjam label alasan.preset', () => {
    const id = KAMUS_CASHFLOW.id.sakelar.bukaPreset
    const en = KAMUS_CASHFLOW.en.sakelar.bukaPreset
    expect(Object.keys(en)).toEqual(Object.keys(id))
    expect(Object.keys(id).length).toBeGreaterThan(0)
    for (const b of ['id', 'en'] as const) {
      const bawaan = new Set<string>(Object.values(KAMUS_CASHFLOW[b].alasan.preset))
      for (const label of Object.values(KAMUS_CASHFLOW[b].sakelar.bukaPreset)) expect(bawaan.has(label)).toBe(false)
    }
  })
  it('setiap CashflowReasonGate di sakelar.vue diberi :preset', () => {
    const src = readFileSync(fileURLToPath(new URL('../../pages/console/cashflow/sakelar.vue', import.meta.url)), 'utf8')
    const gerbang = [...src.matchAll(/<CashflowReasonGate\b[^>]*>/g)].map(m => m[0])
    expect(gerbang.length).toBeGreaterThan(0)
    for (const g of gerbang) expect(g).toMatch(/:preset="tcf\('sakelar\.bukaPreset'\)"/)
  })
})
