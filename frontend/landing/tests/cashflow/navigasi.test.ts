/**
 * Peta navigasi console CashFlow (utils/cashflow/navigasi.ts).
 *
 * - Setiap halaman tingkat atas di pages/console/cashflow/ terdaftar TEPAT
 *   sekali di lima pintu (atau sengaja di luar menu), jadi halaman baru tidak
 *   bisa lahir tanpa tempat di navigasi.
 * - Pintu aktif benar untuk setiap rute yang sungguh ada, termasuk rute
 *   bersarang pengguna/<id>/… dan ruang/<id>/….
 * - Izin: saat ini tidak ada tautan yang disembunyikan menurut izin, dan itu
 *   dikunci di sini supaya perubahan izin menu tidak terjadi diam-diam.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  AKAR_CASHFLOW, HALAMAN_CASHFLOW, JALUR_TANPA_MENU, PINTU_CASHFLOW,
  diDalam, halamanUntuk, pintuTerlihat, pintuUntuk, tepatDi,
} from '../../utils/cashflow/navigasi'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const HALAMAN = join(AKAR, 'pages/console/cashflow')
const baca = (f: string) => readFileSync(join(AKAR, f), 'utf8')

/** Semua rute di bawah pages/console/cashflow, `[id]` diisi contoh. */
function rute(dir: string, awal: string, hasil: string[] = []): string[] {
  for (const nama of readdirSync(dir)) {
    const jalur = join(dir, nama)
    if (statSync(jalur).isDirectory()) { rute(jalur, `${awal}/${nama.replace('[id]', 'contoh-id')}`, hasil); continue }
    if (!nama.endsWith('.vue')) continue
    const dasar = nama.slice(0, -4)
    // Induk rute bersarang (pengguna/[id].vue) tidak punya alamat sendiri di luar anaknya.
    if (existsSync(join(dir, dasar)) && statSync(join(dir, dasar)).isDirectory()) continue
    hasil.push(dasar === 'index' ? awal : `${awal}/${dasar.replace('[id]', 'contoh-id')}`)
  }
  return hasil
}
const SEMUA_RUTE = rute(HALAMAN, AKAR_CASHFLOW)
const TINGKAT_ATAS = readdirSync(HALAMAN)
  .map(n => n.replace(/\.vue$/, ''))
  .filter((n, i, a) => a.indexOf(n) === i)
  .map(n => (n === 'index' ? AKAR_CASHFLOW : `${AKAR_CASHFLOW}/${n}`))

describe('peta navigasi CashFlow', () => {
  it('lima pintu dengan urutan dan isi yang disepakati', () => {
    expect(PINTU_CASHFLOW.map(p => [p.kunci, p.halaman.map(h => h.kunci)])).toEqual([
      ['ringkasan', ['ringkasan', 'laporan', 'whatsapp']],
      ['orang', ['pengguna', 'ruang', 'aktivitas', 'corongWa']],
      ['domi', ['domi', 'paket', 'pembelian']],
      ['kabar', ['pengumuman', 'dukungan', 'kasus']],
      ['operasional', ['kesehatan', 'sakelar', 'hapusAkun', 'audit']],
    ])
  })

  it('setiap halaman tingkat atas terdaftar tepat sekali, atau sengaja di luar menu', () => {
    expect(TINGKAT_ATAS.length).toBeGreaterThanOrEqual(16)
    for (const jalur of TINGKAT_ATAS) {
      const n = HALAMAN_CASHFLOW.filter(h => h.jalur === jalur).length + JALUR_TANPA_MENU.filter(j => j === jalur).length
      expect(n, jalur).toBe(1)
    }
  })

  it('tidak ada entri menu yang menunjuk halaman yang tidak ada, dan tidak ada kunci atau jalur kembar', () => {
    for (const h of [...HALAMAN_CASHFLOW.map(x => x.jalur), ...JALUR_TANPA_MENU]) expect(TINGKAT_ATAS, h).toContain(h)
    expect(new Set(HALAMAN_CASHFLOW.map(h => h.kunci)).size).toBe(HALAMAN_CASHFLOW.length)
    expect(new Set(HALAMAN_CASHFLOW.map(h => h.jalur)).size).toBe(HALAMAN_CASHFLOW.length)
  })

  it('jalur menu tidak berubah dari sebelum pengelompokan', () => {
    expect(Object.fromEntries(HALAMAN_CASHFLOW.map(h => [h.kunci, h.jalur]))).toEqual({
      ringkasan: '/console/cashflow', laporan: '/console/cashflow/laporan', whatsapp: '/console/cashflow/whatsapp', pengguna: '/console/cashflow/pengguna', corongWa: '/console/cashflow/corong',
      aktivitas: '/console/cashflow/aktivitas', ruang: '/console/cashflow/ruang', kesehatan: '/console/cashflow/kesehatan',
      sakelar: '/console/cashflow/sakelar', pengumuman: '/console/cashflow/pengumuman', kasus: '/console/cashflow/kasus',
      hapusAkun: '/console/cashflow/hapus-akun', audit: '/console/cashflow/audit', dukungan: '/console/cashflow/dukungan',
      domi: '/console/cashflow/domi', paket: '/console/cashflow/paket', pembelian: '/console/cashflow/pembelian',
    })
  })

  it('setiap rute yang ada jatuh ke tepat satu halaman menu dan pintunya, termasuk rute bersarang', () => {
    expect(SEMUA_RUTE).toContain('/console/cashflow/pengguna/contoh-id/dompet')
    expect(SEMUA_RUTE).toContain('/console/cashflow/ruang/contoh-id/anggota')
    for (const r of SEMUA_RUTE) {
      const cocok = HALAMAN_CASHFLOW.filter(h => diDalam(r, h.jalur))
      if (JALUR_TANPA_MENU.includes(r)) { expect(cocok, r).toEqual([]); expect(pintuUntuk(r), r).toBeNull(); continue }
      expect(cocok.length, r).toBe(1)
      expect(pintuUntuk(r), r).toBe(cocok[0]!.pintu)
      const atas = r.split('/').slice(0, 4).join('/')
      expect(halamanUntuk(r)!.jalur, r).toBe(atas)
    }
  })

  it('pintu aktif untuk tiap rute', () => {
    const harap: Record<string, string> = {
      '/console/cashflow': 'ringkasan',
      '/console/cashflow/laporan': 'ringkasan',
      '/console/cashflow/whatsapp': 'ringkasan',
      '/console/cashflow/pengguna': 'orang',
      '/console/cashflow/pengguna/contoh-id': 'orang',
      '/console/cashflow/pengguna/contoh-id/domi': 'orang',
      '/console/cashflow/pengguna/contoh-id/transaksi': 'orang',
      '/console/cashflow/ruang': 'orang',
      '/console/cashflow/ruang/contoh-id': 'orang',
      '/console/cashflow/ruang/contoh-id/katalog': 'orang',
      '/console/cashflow/aktivitas': 'orang',
      '/console/cashflow/corong': 'orang',
      '/console/cashflow/domi': 'domi',
      '/console/cashflow/paket': 'domi',
      '/console/cashflow/pembelian': 'domi',
      '/console/cashflow/pengumuman': 'kabar',
      '/console/cashflow/dukungan': 'kabar',
      '/console/cashflow/kasus': 'kabar',
      '/console/cashflow/kesehatan': 'operasional',
      '/console/cashflow/sakelar': 'operasional',
      '/console/cashflow/hapus-akun': 'operasional',
      '/console/cashflow/audit': 'operasional',
    }
    for (const [r, p] of Object.entries(harap)) expect(pintuUntuk(r), r).toBe(p)
    // Halaman Domi di rincian pengguna milik pintu Orang, bukan pintu Domi.
    expect(halamanUntuk('/console/cashflow/pengguna/contoh-id/domi')!.kunci).toBe('pengguna')
  })

  it('awalan yang mirip tidak ikut aktif; query, hash, dan garis miring akhir diabaikan', () => {
    expect(pintuUntuk('/console/cashflow/domisili')).toBeNull()
    expect(pintuUntuk('/console/cashflow/paket-lama')).toBeNull()
    expect(pintuUntuk('/console/cashflow/masuk')).toBeNull()
    expect(pintuUntuk('/console/leadku')).toBeNull()
    expect(pintuUntuk('/console/cashflow/')).toBe('ringkasan')
    expect(pintuUntuk('/console/cashflow/pengguna?seg=pakai_domi&hal=2')).toBe('orang')
    expect(pintuUntuk('/console/cashflow/kasus#atas')).toBe('kabar')
    // Ringkasan hanya aktif di alamatnya sendiri, bukan di semua halaman modul.
    expect(diDalam('/console/cashflow/pengguna', AKAR_CASHFLOW)).toBe(false)
    expect(tepatDi('/console/cashflow/pengguna/contoh-id', '/console/cashflow/pengguna')).toBe(false)
    expect(tepatDi('/console/cashflow/pengguna?hal=3', '/console/cashflow/pengguna')).toBe(true)
  })

  it('izin: belum ada tautan yang disembunyikan, jadi pemegang cashflow:view saja melihat semuanya', () => {
    expect(HALAMAN_CASHFLOW.filter(h => h.izin)).toEqual([])
    expect(pintuTerlihat(() => false)).toEqual(PINTU_CASHFLOW.map(p => ({ kunci: p.kunci, halaman: [...p.halaman] })))
  })

  it('izin: halaman berizin hilang tanpa izinnya, dan pintu yang kosong ikut hilang', () => {
    // Saringannya diuji lewat peta tiruan berbentuk sama.
    const tiruan = [
      { kunci: 'ringkasan', halaman: [{ kunci: 'a', jalur: '/a', ikon: 'x' }] },
      { kunci: 'orang', halaman: [{ kunci: 'b', jalur: '/b', ikon: 'x', izin: 'cashflow:pii' }, { kunci: 'c', jalur: '/c', ikon: 'x' }] },
      { kunci: 'domi', halaman: [{ kunci: 'd', jalur: '/d', ikon: 'x', izin: 'cashflow:tindak' }] },
    ]
    const saring = (boleh: (i: string) => boolean) => tiruan
      .map(p => ({ kunci: p.kunci, halaman: p.halaman.filter(h => !('izin' in h) || !h.izin || boleh(h.izin)) }))
      .filter(p => p.halaman.length > 0)
    expect(saring(() => false).map(p => [p.kunci, p.halaman.map(h => h.kunci)])).toEqual([['ringkasan', ['a']], ['orang', ['c']]])
    expect(saring(i => i === 'cashflow:tindak').map(p => p.kunci)).toEqual(['ringkasan', 'orang', 'domi'])
    // pintuTerlihat memakai aturan yang sama (lihat sumbernya).
    expect(baca('utils/cashflow/navigasi.ts')).toMatch(/p\.halaman\.filter\(h => !h\.izin \|\| boleh\(h\.izin\)\)/)
  })

  it('label pintu dan halaman ada di ID dan EN, tanpa em-dash, titik koma, atau emoji', () => {
    for (const b of ['id', 'en'] as const) {
      const k = KAMUS_CASHFLOW[b] as unknown as { pintu: Record<string, string>; nav: Record<string, string> }
      const label = [...PINTU_CASHFLOW.map(p => k.pintu[p.kunci]), ...HALAMAN_CASHFLOW.map(h => k.nav[h.kunci]), k.nav.menu]
      for (const l of label) {
        expect(typeof l, b).toBe('string')
        expect(l, b).not.toMatch(/[—–;]|\p{Extended_Pictographic}/u)
      }
    }
  })

  it('komponen membaca peta, dan URL tujuan tidak ditulis ulang di komponen', () => {
    const nav = baca('components/cashflow/CashflowNav.vue')
    expect(nav).toMatch(/pintuTerlihat\(/)
    expect(nav).toMatch(/:aria-current="kini\(h\)"/)
    expect(nav).toMatch(/:aria-current="kiniPintu\(p\)"/)
    expect(nav).toMatch(/:aria-label="tcf\('nav\.menu'\)"/)
    expect(nav).toMatch(/\{ kunci: 'k', meta: true, aksi: \(\) => \{ paletBuka\.value = true \} \}/)
    // Satu-satunya jalur yang boleh tertulis di komponen: tujuan pintasan g r, g a, g k.
    const jalur = [...nav.matchAll(/'\/console\/cashflow\/([a-z-]+)'/g)].map(m => m[1])
    expect(jalur.sort()).toEqual(['audit', 'kasus', 'ruang'])
    expect(baca('components/cashflow/CashflowPalet.vue')).not.toMatch(/'\/console\/cashflow\/(?!pengguna\/)[a-z-]+'/)
  })
})
