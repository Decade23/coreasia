/**
 * Kolom Versi di daftar pengguna (0123): versi_aplikasi + platform per orang.
 *
 * - urutan versi SEMANTIK, bukan teks: 1.3.10 > 1.3.9, pra-rilis sebelum
 *   rilisnya, bentuk asing di bawah;
 * - label ringkas '1.3.6 · Android' / '1.3.6 · iPhone', varian ditulis;
 * - penanda "tertinggal" dihitung per platform atas SELURUH daftar;
 * - server sebelum 0123 (tanpa kolom) tetap jalan: semuanya null.
 * Semua data rekaan.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  bacaPlatform, kePengguna, kunciVersi, labelVersi, tanpaKontakUtuh, versiTerbaruPer, versiTertinggal, type PenggunaDTO,
} from '~/adapters/cashflow'
import { urutkan, type AturanUrut } from '~/adapters/cashflowDaftar'
import { KAMUS_CASHFLOW } from '~/composables/cashflow/useCashflowI18n'

const dto = (i: number, versi?: string | null, platform?: string | null): PenggunaDTO => ({
  user_id: `u${String(i).padStart(2, '0')}`, email: `ora***@contoh.id`, display_name: '', created_at: '2026-09-01T00:00:00+00:00',
  last_sign_in: null, aktivitas_terakhir: null, terbuka: false, banned_until: null, jumlah_ruang: 1, jumlah_tx: 1, total_semua: 9,
  ...(versi !== undefined ? { versi_aplikasi: versi } : {}),
  ...(platform !== undefined ? { platform } : {}),
})

describe('kunciVersi: urutan versi semantik', () => {
  /** a lebih baru dari b menurut kunci urut. */
  const lebihBaru = (a: string, b: string) => kunciVersi(a)! > kunciVersi(b)!
  it('1.3.10 > 1.3.9 (bukan urutan teks), dan minor/major menang atas patch', () => {
    expect(lebihBaru('1.3.10', '1.3.9')).toBe(true)
    expect(lebihBaru('1.4.0', '1.3.99')).toBe(true)
    expect(lebihBaru('2.0.0', '1.99.99')).toBe(true)
    expect(kunciVersi('1.3')).toBe(kunciVersi('1.3.0'))
    expect(kunciVersi('v1.3.6')).toBe(kunciVersi('1.3.6'))
  })
  it('pra-rilis sebelum rilisnya, sesudah rilis sebelumnya; rc.10 > rc.2', () => {
    const urut = ['1.3.6', '1.3.6-rc.10', '1.3.6-rc.2', '1.3.5', '1.3.6-rc.1'].sort((a, b) => (lebihBaru(a, b) ? -1 : 1))
    expect(urut).toEqual(['1.3.6', '1.3.6-rc.10', '1.3.6-rc.2', '1.3.6-rc.1', '1.3.5'])
    expect(lebihBaru('1.4.0-rc.1', '1.3.10')).toBe(true)
    expect(kunciVersi('1.3.6+26110303')).toBe(kunciVersi('1.3.6'))
    // Empat bagian (pola server 0123): 1.3.6.2 > 1.3.6 dan < 1.3.7.
    expect(lebihBaru('1.3.6.2', '1.3.6')).toBe(true)
    expect(lebihBaru('1.3.7', '1.3.6.2')).toBe(true)
    // Tanpa batas presisi: bagian terbesar dan pra-rilis tetap terbedakan.
    expect(lebihBaru('9999.9999.9999.9999', '9999.9999.9999.9998')).toBe(true)
    expect(lebihBaru('9999.9999.9999.9999-rc.2', '9999.9999.9999.9999-rc.1')).toBe(true)
  })
  it('bentuk asing atau kosong → null', () => {
    for (const v of ['', '  ', 'abc', '1', '1.x.3', null, undefined]) expect(kunciVersi(v), String(v)).toBeNull()
  })
  it('urutkan (jenis teks) atas kunciVersi: terbaru dulu, tak terbaca selalu di bawah', () => {
    const baris = ['1.3.9', '1.3.10', 'aneh', '1.2.0', null, '1.3.10-rc.3'].map((v, i) => kePengguna(dto(i, v, 'android')))
    const aturan: AturanUrut<typeof baris[number]> = { jenis: 'teks', nilai: p => p.kunciVersi }
    expect(urutkan(baris, aturan, 'desc', p => p.id).map(p => p.labelVersi)).toEqual([
      '1.3.10 · Android', '1.3.10-rc.3 · Android', '1.3.9 · Android', '1.2.0 · Android', 'aneh · Android', 'Android',
    ])
    expect(urutkan(baris, aturan, 'asc', p => p.id).map(p => p.labelVersi).slice(0, 2)).toEqual(['1.2.0 · Android', '1.3.9 · Android'])
  })
})

describe('label versi dan platform', () => {
  it("'1.3.6 · Android' / '1.3.6 · iPhone'; varian non-prod ditulis", () => {
    expect(labelVersi('1.3.6', 'android')).toBe('1.3.6 · Android')
    expect(labelVersi('1.3.6', 'ios')).toBe('1.3.6 · iPhone')
    expect(labelVersi('1.3.6', 'android_uat')).toBe('1.3.6 · Android UAT')
    expect(labelVersi('1.3.6', 'android-ias')).toBe('1.3.6 · Android IAS')
    // Bentuk 0123: varian di kolom platform, dipisah tanda hubung.
    expect(labelVersi('1.3.6-rc.1', 'android-uat')).toBe('1.3.6-rc.1 · Android UAT')
    expect(labelVersi('1.3.6', 'android-lain')).toBe('1.3.6 · Android lain')
    expect(labelVersi('1.3.6', 'web')).toBe('1.3.6 · Web')
    expect(labelVersi('1.3.6', 'ios-uat')).toBe('1.3.6 · iPhone UAT')
    expect(labelVersi('1.3.6', 'android:prod')).toBe('1.3.6 · Android')
    expect(labelVersi('1.3.6', 'harmony')).toBe('1.3.6 · harmony')
  })
  it('salah satu kosong → yang ada saja; keduanya kosong → null', () => {
    expect(labelVersi('1.3.6', null)).toBe('1.3.6')
    expect(labelVersi(null, 'ios')).toBe('iPhone')
    expect(labelVersi(null, null)).toBeNull()
    expect(labelVersi('', '  ')).toBeNull()
  })
  it('kelompok platform: varian terpisah dari prod, prod sama dengan tanpa varian', () => {
    expect(bacaPlatform('android').kunci).toBe('android')
    expect(bacaPlatform('Android_prod').kunci).toBe('android')
    expect(bacaPlatform('android_uat').kunci).toBe('android:uat')
    expect(bacaPlatform(null).kunci).toBe('')
  })
})

describe('kePengguna: kolom versi', () => {
  it('server sebelum 0123 (tanpa kolom) → semuanya kosong, tanpa galat', () => {
    expect(kePengguna(dto(1))).toMatchObject({ labelVersi: null, kunciVersi: null, kelompokVersi: '' })
  })
  it('null dari server → kosong ("—")', () => {
    expect(kePengguna(dto(1, null, null))).toMatchObject({ labelVersi: null, kunciVersi: null })
  })
  it('isi → label, kunci urut, kelompok platform', () => {
    expect(kePengguna(dto(1, '1.3.6', 'ios'))).toMatchObject({ labelVersi: '1.3.6 · iPhone', kunciVersi: kunciVersi('1.3.6'), kelompokVersi: 'ios' })
  })
  it('mematikan sakelar Kontak lengkap tidak membuang versi', () => {
    const [d] = tanpaKontakUtuh([dto(1, '1.3.6', 'android')])
    expect(kePengguna(d!).labelVersi).toBe('1.3.6 · Android')
  })
})

describe('penanda versi tertinggal: per platform, atas seluruh daftar', () => {
  const daftar = [
    kePengguna(dto(1, '1.3.6', 'android')),
    kePengguna(dto(2, '1.3.5', 'android')),
    kePengguna(dto(3, '1.3.4', 'ios')),
    kePengguna(dto(4, '1.3.6-rc.2', 'android_uat')),
    kePengguna(dto(5, '1.3.6-rc.1', 'android_uat')),
    kePengguna(dto(6, 'aneh', 'android')),
    kePengguna(dto(7, null, null)),
    kePengguna(dto(8)),
  ]
  const terbaru = versiTerbaruPer(daftar)
  it('versi tertinggi per kelompok', () => {
    expect([...terbaru.keys()].sort()).toEqual(['android', 'android:uat', 'ios'])
    expect(terbaru.get('android')).toBe(kunciVersi('1.3.6'))
  })
  it('di bawah tertinggi platformnya = tertinggal; iPhone tidak dibandingkan dengan Android', () => {
    expect(daftar.map(p => versiTertinggal(p, terbaru))).toEqual([false, true, false, false, true, false, false, false])
  })
})

describe('halaman daftar pengguna: kolom Versi', () => {
  const SRC = readFileSync(fileURLToPath(new URL('../../pages/console/cashflow/pengguna/index.vue', import.meta.url)), 'utf8')
  it('kolom sesudah WhatsApp, kecil di HP seperti kolom lain, urut atas kunci versi', () => {
    expect(SRC.indexOf("key: 'versi'")).toBeGreaterThan(SRC.indexOf("key: 'wa'"))
    expect(SRC.indexOf("key: 'versi'")).toBeLessThan(SRC.indexOf("key: 'daftar'"))
    expect(SRC).toMatch(/key: 'versi'[^\n]*class: 'hidden[^']*sm:table-cell', headerClass: 'hidden sm:table-cell'/)
    expect(SRC).toMatch(/versi: \{ jenis: 'teks', nilai: b => b\.p\.kunciVersi \}/)
    expect(SRC).toMatch(/const URUT = \[[^\]]*'versi'/)
  })
  it('versi terbaru dihitung atas SEMUA baris, bukan halaman yang tampil', () => {
    expect(SRC).toMatch(/const versiTerbaru = computed\(\(\) => versiTerbaruPer\(semua\.value\)\)/)
  })
  it('label dan keterangan ada di ID dan EN', () => {
    for (const b of ['id', 'en'] as const) {
      for (const k of ['versi', 'versiLama', 'versiKet'] as const) expect(KAMUS_CASHFLOW[b].pengguna[k].length, `${b}.${k}`).toBeGreaterThan(0)
    }
  })
})
