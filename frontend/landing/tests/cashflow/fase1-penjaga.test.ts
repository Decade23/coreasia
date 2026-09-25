/**
 * Penjaga aturan Fase 1 yang tidak tertangkap tipe (rencana, "Peta navigasi",
 * "State di URL", "Kasus"):
 * - tidak ada tautan ke /console/cashflow/ruang/<id> — rute itu baru ada di
 *   Fase 2; baris ruang di Pengguna 360 berupa teks + salin id;
 * - id kasus tidak pernah masuk URL (kunci query) maupun storage;
 * - skema URL tab Transaksi hanya membawa kunci struktur — nominal
 *   (min/maks) dan pencatat TIDAK di URL;
 * - rute tab Pengguna 360 yang ditaut CashflowTab/TAB_PENGGUNA ada berkasnya,
 *   dan induknya punya <NuxtPage/> (tanpa itu tab anak dirender kosong);
 * - keputusan Master 21 Sep 2026: membuka data = SATU KLIK — tidak ada lagi
 *   dialog alasan/gerbang kasus di Pengguna 360 (dan komponennya sudah tidak
 *   ada), kasus dibuka otomatis dengan isian otomatis;
 * - teks bebas (T3) dibuka per baris yang diklik, bukan semua yang terlihat
 *   (temuan fe p2 #3).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { TAB_PENGGUNA } from '../../adapters/cashflowKasus'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (rel: string) => readFileSync(join(AKAR, rel), 'utf8')
function jelajah(dir: string, hasil: string[] = []): string[] {
  if (!existsSync(dir)) return hasil
  for (const nama of readdirSync(dir)) {
    const jalur = join(dir, nama)
    if (statSync(jalur).isDirectory()) jelajah(jalur, hasil)
    else if (/\.(ts|vue)$/.test(nama)) hasil.push(jalur)
  }
  return hasil
}
const sumber = ['components', 'pages', 'composables', 'adapters', 'utils', 'layouts']
  .flatMap(d => jelajah(join(AKAR, d)))
  .map(f => ({ f, isi: readFileSync(f, 'utf8') }))

describe('Fase 1: tautan hanya ke rute yang sudah ada', () => {
  it('tidak ada tautan ke /console/cashflow/ruang/<id> (Fase 2)', () => {
    const temuan = sumber.filter(x => /\/console\/cashflow\/ruang\/(?:\$\{|[0-9a-f:[])/.test(x.isi)).map(x => x.f)
    expect(temuan).toEqual([])
  })
  it('setiap tab Pengguna 360 punya berkas; induk memasang <NuxtPage/>', () => {
    for (const t of TAB_PENGGUNA) {
      const f = `pages/console/cashflow/pengguna/[id]/${t || 'index'}.vue`
      expect(existsSync(join(AKAR, f)), f).toBe(true)
    }
    expect(baca('pages/console/cashflow/pengguna/[id].vue')).toMatch(/<NuxtPage\s*\/>/)
    expect(existsSync(join(AKAR, 'pages/console/cashflow/kasus.vue'))).toBe(true)
  })
})

describe('Fase 1: id kasus tidak di URL maupun storage', () => {
  it('tidak ada kunci query "kasus" di skema URL halaman CashFlow', () => {
    const halaman = jelajah(join(AKAR, 'pages/console/cashflow')).map(f => readFileSync(f, 'utf8'))
    for (const isi of halaman) {
      const skema = /const SKEMA = \{([\s\S]*?)\} as const satisfies SkemaQuery/.exec(isi)?.[1] ?? ''
      expect(skema).not.toMatch(/\bkasus\s*:/)
    }
  })
  it('kasus tidak disimpan di sessionStorage/localStorage', () => {
    const f = baca('composables/cashflow/useCashflowKasus.ts')
    expect(f).not.toMatch(/sessionStorage|localStorage/)
  })
  // useState console (cf_audit_kasus, cf_tx_nominal_*, cf_cari_pengguna,
  // cf_kepala, admin_user) hidup di payload.state. Bawaan Nuxt
  // (emitRouteChunkError 'automatic') menyalinnya ke sessionStorage
  // 'nuxt:reload:state' setiap build baru/chunk gagal — temuan fe p1 #2.
  it("payload.state tidak disalin Nuxt ke storage: emitRouteChunkError 'manual' + plugin pengganti", () => {
    const cfg = baca('nuxt.config.ts')
    expect(cfg).toMatch(/emitRouteChunkError:\s*'manual'/)
    expect(cfg).not.toMatch(/emitRouteChunkError:\s*(?:'automatic|'reload'|true)/)
    expect(cfg).not.toMatch(/restoreState:\s*true/)
    expect(existsSync(join(AKAR, 'plugins/muat-ulang-bersih.client.ts'))).toBe(true)
    expect(baca('plugins/muat-ulang-bersih.client.ts')).toMatch(/reloadNuxtApp\(\{[^}]*persistState:\s*false/)
    const semua = [...sumber, ...jelajah(join(AKAR, 'plugins')).map(f => ({ f, isi: readFileSync(f, 'utf8') }))]
    // Kode saja (komentar yang menjelaskan bawaan Nuxt boleh menyebutnya).
    const kode = (isi: string) => isi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    expect(semua.filter(x => /persistState:\s*true/.test(kode(x.isi))).map(x => x.f)).toEqual([])
  })
})

describe('Fase 1: URL tab Transaksi hanya kunci struktur', () => {
  it('skema = saringan struktur + kursor + tx; nominal dan pencatat tidak ada', () => {
    const isi = baca('pages/console/cashflow/pengguna/[id]/transaksi.vue')
    const skema = /const SKEMA = \{([\s\S]*?)\} as const satisfies SkemaQuery/.exec(isi)?.[1] ?? ''
    const kunci = [...skema.matchAll(/^\s*(\w+):\s*\{/gm)].map(m => m[1]!).sort()
    expect(kunci).toEqual(['cek', 'dari', 'dompet', 'jenis', 'kategori', 'kursor', 'ruang', 'sampah', 'sampai', 'tx'])
    // Nominal di useState (bukan URL), lewat useCashflowNominal yang kembali ke
    // halaman pertama saat nilainya berubah (temuan F9; perilakunya diuji di
    // tests/cashflow/nominal.test.ts). Tidak ada debounce buatan sendiri lagi.
    expect(isi).toMatch(/useState<NominalSaring>\(`cf_tx_nominal_/)
    // Kapan kembali ke awal diputuskan composable dari q (diuji di nominal.test.ts);
    // halaman hanya menyerahkan nilai URL dan setel-nya sendiri.
    expect(isi).toMatch(/useCashflowNominal\(\{ nominal, q, setel \}\)/)
    expect(isi).toMatch(/const \{ nilai: q, setel \} = useCashflowQuery\(SKEMA\)/)
    // Selama URL-nya diganti, kursor lama tidak dipakai bersama nominal baru.
    expect(isi).toMatch(/const kursor = computed\(\(\) => \(nominalKeAwal\.value \? null : kursorTransaksiDariUrl\(q\.value\.kursor\)\)\)/)
    expect(isi).not.toMatch(/setTimeout/)
  })

  it('sampah terpotong (0092): judul "50+" dan kalimat penanda muncul hanya bila sampah_lebih', () => {
    const isi = baca('pages/console/cashflow/pengguna/[id]/transaksi.vue')
    // Bentuk label dan pembacaan sampah_lebih diuji di kontrak-fase1.test.ts;
    // di sini: halaman benar-benar memakainya.
    expect(isi).toMatch(/const sampahLebih = computed\(\(\) => adaSampahLebih\(mentah\.value\)\)/)
    expect(isi).toMatch(/tcf\('transaksi\.diSampah'\)\(labelJumlahSampah\(sampah\.length, sampahLebih\)\)/)
    expect(isi).toMatch(/<p v-if="sampahLebih"[^>]*>\{\{ tcf\('transaksi\.sampahLebih'\) \}\}<\/p>/)
  })
})

describe('Fase 1: membuka data satu klik, tanpa dialog (keputusan Master 21 Sep 2026)', () => {
  it('komponen gerbang alasan/kasus/investigasi sudah tidak ada dan tidak dipakai', () => {
    for (const k of ['CashflowKasusGerbang', 'CashflowKasusInvestigasi', 'CashflowReasonGate']) {
      expect(existsSync(join(AKAR, `components/cashflow/${k}.vue`)), k).toBe(false)
      expect(sumber.filter(x => new RegExp(`<${k}\\b`).test(x.isi)).map(x => x.f), k).toEqual([])
    }
  })
  it('Pengguna 360 dan komponennya tanpa modal maupun kolom alasan', () => {
    const berkas = [
      ...jelajah(join(AKAR, 'pages/console/cashflow/pengguna')),
      ...['CashflowPanelTab', 'CashflowKasusBilah', 'CashflowTeksTerkunci', 'CashflowLaciTransaksi', 'CashflowIzinKurang', 'CashflowKepala360']
        .map(k => join(AKAR, `components/cashflow/${k}.vue`)),
    ]
    for (const f of berkas) expect(readFileSync(f, 'utf8'), f).not.toMatch(/<ConsoleModal\b|<textarea\b/)
  })
  it('kasus dibuka otomatis: preset, ranah Fase 1, dan alasan otomatis — bukan masukan orang', () => {
    const f = baca('composables/cashflow/useCashflowKasus.ts')
    expect(f).toMatch(/api\.kasusBuka\(subjek, SKENARIO_OTOMATIS, PRESET_OTOMATIS, RANAH_FASE1, lingkup, alasanOtomatis\(new Date\(\)\)\)/)
    expect(f).toMatch(/api\.kasusInvestigasi\(k\.id, PRESET_T3_OTOMATIS, alasanT3Otomatis\(new Date\(\)\)\)/)
    // Lingkup = semua ruang subjek dari kepala.
    expect(baca('composables/cashflow/useCashflowPengguna.ts')).toMatch(/kasus\.aturLingkup\(subjek, kep\.ruang \? lingkupSemua\(kep\.ruang\) : null\)/)
  })
})

describe('T3: tombol per baris membuka baris itu saja (temuan fe p2 #3)', () => {
  it('CashflowTeksTerkunci tanpa prop ids dan meminta [props.id] saja', () => {
    const f = baca('components/cashflow/CashflowTeksTerkunci.vue')
    expect(f).toMatch(/kasus\.mintaTeks\(props\.jenis, \[props\.id\]\)/)
    expect(f).not.toMatch(/\bids\??\s*:/)
  })
  it('tidak ada pemanggil yang meneruskan daftar id (:ids) ke CashflowTeksTerkunci', () => {
    const temuan = sumber.filter(x => /<CashflowTeksTerkunci\b[^>]*\s:ids=/.test(x.isi)).map(x => x.f)
    expect(temuan).toEqual([])
  })
  it('mintaTeks hanya dipanggil dari CashflowTeksTerkunci (tidak ada jalur buka-sekaligus lain)', () => {
    const pemanggil = sumber.filter(x => /\.mintaTeks\(/.test(x.isi)).map(x => x.f.slice(AKAR.length + 1))
    expect(pemanggil).toEqual(['components/cashflow/CashflowTeksTerkunci.vue'])
  })
})

describe('sesi mati saat kasus dibuka otomatis → /masuk (temuan fe p2 #4)', () => {
  it('induk Pengguna 360 memantau galat kasus dan memanggil keMasukBilaSesi untuk tahap sesi', () => {
    const f = baca('pages/console/cashflow/pengguna/[id].vue')
    expect(f).toMatch(/watch\(\(\) => kasus\.keadaan\.value\.galat,[\s\S]{0,120}tahap === 'sesi'\) keMasukBilaSesi\(/)
  })
  it('CashflowPanelTab punya cabang tahap sesi (tanpa "Coba lagi")', () => {
    const f = baca('components/cashflow/CashflowPanelTab.vue')
    expect(f).toMatch(/v-else-if="tahap === 'sesi'"/)
  })
})

describe('jawaban basi subjek sebelumnya (temuan fe p3 #1)', () => {
  it('induk memuat kepala lewat muatKepala dan membatalkannya saat dilepas', () => {
    const f = baca('pages/console/cashflow/pengguna/[id].vue')
    expect(f).toMatch(/\bmuat\(muatKepala\)/)
    expect(f).toMatch(/onBeforeUnmount\(\(\) => \{ batal\(\);/)
  })
  it('muatKepala menolak kepala/kasus yang bukan milik subjek halaman', () => {
    const f = baca('composables/cashflow/useCashflowPengguna.ts')
    expect(f).toMatch(/if \(!terbaru\(\) \|\| !samaSubjek\(k\.user_id, subjek\) \|\| kasus\.keadaan\.value\.subjek !== subjek\) return/)
  })
})

describe('Enter milik tombol/tautan yang difokus (temuan fe p3 #2)', () => {
  it("pintasan 'enter' di Transaksi & Jejak mengembalikan false bila tidak ada yang dibuka", () => {
    for (const f of ['transaksi', 'jejak']) {
      const isi = baca(`pages/console/cashflow/pengguna/[id]/${f}.vue`)
      const baris = isi.split('\n').find(b => b.includes("kunci: 'enter'"))
      expect(baris, f).toBeTruthy()
      expect(baris, f).toMatch(/return false/)
    }
  })
  it('kartu transaksi 375 px hanya menjawab Enter yang ditujukan ke kartu itu sendiri', () => {
    const f = baca('components/cashflow/CashflowBarisTransaksi.vue')
    expect(f).toMatch(/@keydown\.enter\.self\.prevent=/)
    expect(f).not.toMatch(/@keydown\.enter\.prevent=/)
  })
})
