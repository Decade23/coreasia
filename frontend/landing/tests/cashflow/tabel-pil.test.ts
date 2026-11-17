/**
 * Komponen tampilan bersama console CashFlow: deret pil segmen, bingkai tabel,
 * dan empat keadaan daftar. Dirender ke teks lewat vue/server-renderer, tanpa
 * Nuxt: ketiganya hanya menerima props dan slot.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSSRApp, h, type Component } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import CashflowSegmen from '../../components/cashflow/CashflowSegmen.vue'
import CashflowTabel from '../../components/cashflow/CashflowTabel.vue'
import CashflowKeadaan from '../../components/cashflow/CashflowKeadaan.vue'
import { bisaDipilih, teksJumlahSegmen } from '../../utils/cashflow/segmen'
import { keadaanDaftar, lebarKerangka } from '../../utils/cashflow/keadaan'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (f: string) => readFileSync(join(AKAR, f), 'utf8')
const Ikon = { props: ['name'], render(this: { name: string }) { return h('i', { 'data-ikon': this.name }) } }
const render = (komponen: Component, props: Record<string, unknown>, slot: Record<string, () => unknown> = {}) => {
  const app = createSSRApp({ render: () => h(komponen, props, slot) })
  app.component('Icon', Ikon)
  return renderToString(app)
}
/** Atribut disabled, bukan kelas `disabled:...`. */
const MATI = /\sdisabled(?:=""|[\s>])/
const tombol = (html: string) => [...html.matchAll(/<button[^>]*>[\s\S]*?<\/button>/g)].map(m => m[0])

describe('deret pil segmen', () => {
  const OPSI = [
    { nilai: 'semua', label: 'Semua', jumlah: 1248 },
    { nilai: 'catat7', label: 'Mencatat 7 hari' },
    { nilai: 'belum', label: 'Belum pernah mencatat', jumlah: 0 },
    { nilai: 'pakai_domi', label: 'Pakai Domi', mati: true, ket: 'akses terbatas', jumlah: null },
  ]
  it('satu tombol per pilihan, yang aktif bertanda aria-pressed, kelompoknya bernama', async () => {
    const html = await render(CashflowSegmen, { opsi: OPSI, nilai: 'catat7', label: 'Segmen' })
    expect(html).toMatch(/role="group" aria-label="Segmen"/)
    const t = tombol(html)
    expect(t).toHaveLength(4)
    expect(t.map(x => /aria-pressed="true"/.test(x))).toEqual([false, true, false, false])
    expect(t.map(x => x.match(/data-seg="([^"]*)"/)?.[1])).toEqual(['semua', 'catat7', 'belum', 'pakai_domi'])
    // Kelas ini yang diberi warna pilihan aktif oleh tema: jangan sampai hilang.
    for (const x of t) expect(x).toMatch(/class="[^"]*rounded-full/)
  })
  it('hitungan hanya ditulis bila angkanya ada. Nol ditulis, kosong tidak', async () => {
    const t = tombol(await render(CashflowSegmen, { opsi: OPSI, nilai: 'semua' }))
    expect(t[0]).toMatch(/Semua<span[^>]*aria-hidden="true"[^>]*>1\.248<\/span>/)
    expect(t[1]).not.toMatch(/<span/)
    expect(t[2]).toMatch(/>0<\/span>/)
    expect(t[3]).not.toMatch(/<span/)
  })
  it('pilihan mati tidak bisa ditekan dan membawa keterangannya', async () => {
    const t = tombol(await render(CashflowSegmen, { opsi: OPSI, nilai: 'semua' }))
    expect(t[3]).toMatch(MATI)
    expect(t[3]).toMatch(/title="akses terbatas"/)
    expect(t[0]).not.toMatch(MATI)
    // `mati` di komponen mematikan seluruh deret (misalnya selagi menyimpan).
    for (const x of tombol(await render(CashflowSegmen, { opsi: OPSI, nilai: 'semua', mati: true }))) expect(x).toMatch(MATI)
  })
  it('gulir: satu baris yang bisa digeser di ponsel. Tanpa itu deretnya turun baris', async () => {
    expect(await render(CashflowSegmen, { opsi: OPSI, nilai: 'semua', gulir: true })).toMatch(/cf-seg-gulir[^"]*flex-nowrap[^"]*overflow-x-auto/)
    const biasa = await render(CashflowSegmen, { opsi: OPSI, nilai: 'semua' })
    expect(biasa).toMatch(/flex-wrap/)
    expect(biasa).not.toMatch(/cf-seg-gulir/)
  })
  it('pil bernada membawa kelas nadanya, yang lain tidak', async () => {
    const t = tombol(await render(CashflowSegmen, { opsi: [{ nilai: 'wajib', label: 'Wajib', nada: 'baik' }, { nilai: 'longgar', label: 'Longgar', nada: 'awas' }], nilai: 'wajib' }))
    expect(t[0]).toMatch(/cf-seg-baik/)
    expect(t[1]).toMatch(/cf-seg-awas/)
    expect((await render(CashflowSegmen, { opsi: OPSI, nilai: 'semua' }))).not.toMatch(/cf-seg-(baik|awas)/)
  })
  it('aturan hitungan dan pilihan', () => {
    expect(teksJumlahSegmen(1248)).toBe('1.248')
    expect(teksJumlahSegmen(0)).toBe('0')
    for (const v of [null, undefined, Number.NaN, -1, Number.POSITIVE_INFINITY]) expect(teksJumlahSegmen(v as number)).toBeNull()
    expect(bisaDipilih({ nilai: 'a', label: 'A' })).toBe(true)
    expect(bisaDipilih({ nilai: 'a', label: 'A', mati: true })).toBe(false)
    expect(bisaDipilih({ nilai: 'a', label: 'A' }, true)).toBe(false)
  })
  it('tidak ada lagi deret pil yang ditulis tangan di modul CashFlow', () => {
    const berkas: string[] = []
    const jelajah = (d: string) => {
      for (const n of readdirSync(d)) {
        const j = join(d, n)
        if (statSync(j).isDirectory()) jelajah(j)
        else if (n.endsWith('.vue')) berkas.push(j)
      }
    }
    jelajah(join(AKAR, 'components/cashflow'))
    jelajah(join(AKAR, 'pages/console/cashflow'))
    const tulisTangan = berkas
      .filter(f => !f.endsWith('CashflowSegmen.vue'))
      .filter(f => /rounded-full border border-\[color:var\(--ca-border\)\] p-1 text-sm/.test(readFileSync(f, 'utf8')))
      .map(f => f.slice(AKAR.length + 1))
    expect(tulisTangan).toEqual([])
    // Ketujuh tempat yang dulu menulisnya sendiri sekarang memakai komponennya.
    for (const f of [
      'pages/console/cashflow/pengguna/index.vue', 'pages/console/cashflow/ruang/index.vue', 'pages/console/cashflow/kasus.vue',
      'pages/console/cashflow/hapus-akun.vue', 'pages/console/cashflow/sakelar.vue', 'components/cashflow/CashflowTabTransaksi.vue',
    ]) expect(baca(f), f).toMatch(/<CashflowSegmen /)
  })
})

describe('bingkai tabel', () => {
  const isi = { default: () => [h('thead', [h('tr', [h('th', 'Pengguna')])]), h('tbody', [h('tr', [h('td', 'sari')])])] }
  it('kartu, bidang gulir, dan satu tabel berkelas cf-tabel', async () => {
    const html = await render(CashflowTabel, {}, isi)
    expect(html).toMatch(/^<div class="cf-tabel-wadah"/)
    expect(html).toMatch(/<div class="cf-tabel-gulir[^"]*"[^>]*><table class="cf-tabel"[^>]*>/)
    expect(html).toContain('<th>Pengguna</th>')
    expect(html).not.toMatch(/cf-tabel-kaki/)
  })
  it('lebar terkecil, tanpa bingkai, tanda sibuk, dan kaki bila diisi', async () => {
    const html = await render(CashflowTabel, { lebarMin: '62rem', polos: true, sibuk: true }, { ...isi, kaki: () => 'Berikutnya' })
    expect(html).toMatch(/class="cf-tabel-wadah cf-tabel-polos"/)
    expect(html).toMatch(/aria-busy="true"/)
    expect(html).toMatch(/<table class="cf-tabel" style="min-width:62rem;?"[^>]*>/)
    expect(html).toMatch(/<div class="cf-tabel-kaki">(?:<!--[^>]*-->)*Berikutnya/)
  })
  it('rupa kepala kolom diatur sekali di tema: bukan huruf besar semua, satu baris, angka rata kanan', () => {
    const css = baca('assets/css/cashflow-tema.css')
    const kepala = css.match(/:is\(\.cf-tabel, \.ca-console-table\) thead th \{[^}]+\}/)?.[0] ?? ''
    expect(kepala).toMatch(/text-transform: none/)
    expect(kepala).toMatch(/white-space: nowrap/)
    expect(kepala).toMatch(/letter-spacing: 0/)
    expect(css).toMatch(/:is\(\.cf-tabel, \.ca-console-table\) :is\(th, td\)\.cf-ka \{\s*text-align: right/)
    expect(css).toMatch(/:is\(\.cf-tabel, \.ca-console-table\) \{[^}]*font-variant-numeric: tabular-nums/)
    expect(css).toMatch(/:is\(\.cf-tabel, \.ca-console-table\) tbody tr:hover \{\s*background: var\(--cf-awan\)/)
  })
  it('tabel di halaman daftar memakai bingkai atau kelas bersama, tanpa kepala huruf besar semua', () => {
    for (const f of [
      'pages/console/cashflow/audit.vue', 'pages/console/cashflow/aktivitas.vue', 'pages/console/cashflow/dukungan.vue',
      'components/cashflow/CashflowPembelianTabel.vue', 'components/cashflow/CashflowPaketTabel.vue', 'components/cashflow/CashflowCohortGrid.vue',
    ]) {
      const s = baca(f)
      expect(s, f).toMatch(/<CashflowTabel|class="cf-tabel/)
      expect(s, f).not.toMatch(/<tr class="[^"]*uppercase/)
    }
    // DataTable console dipakai Pengguna dan Ruang: di area CashFlow rupanya ikut tema yang sama.
    for (const f of ['pages/console/cashflow/pengguna/index.vue', 'pages/console/cashflow/ruang/index.vue']) {
      expect(baca(f), f).toMatch(/<div[^>]*class="cf-tabel-wadah[^"]*">\s*<DataTable/)
    }
  })
  it('DataTable console: slot memuat dan kosong hanya pilihan, bawaannya tidak berubah', () => {
    const s = baca('components/ui/DataTable.vue')
    expect(s).toMatch(/<slot name="loading">\s*<div class="ca-card p-10 text-center" aria-busy="true">/)
    expect(s).toMatch(/<slot name="empty">\s*<div class="ca-card p-10 text-center">/)
  })
})

describe('keadaan daftar', () => {
  it('memuat: kerangka baris sebanyak yang diminta, dengan keterangan untuk pembaca layar', async () => {
    const html = await render(CashflowKeadaan, { jenis: 'memuat', pesan: 'Memuat…', baris: 3, kolom: 4 })
    expect(html).toMatch(/role="status" aria-busy="true" data-keadaan="memuat"/)
    expect(html).toMatch(/<span[^>]*class="sr-only"[^>]*>Memuat…<\/span>/)
    expect(html.match(/border-t border-\[color:var\(--ca-border\)\]/g)).toHaveLength(3)
  })
  it('galat: pesannya role alert, tombol coba lagi hanya bila labelnya diisi', async () => {
    const html = await render(CashflowKeadaan, { jenis: 'galat', judul: 'Daftar ini belum bisa diambil', pesan: 'Server terlalu lama menjawab.', rincian: 'jaringan', labelUlang: 'Coba lagi' })
    expect(html).toMatch(/data-keadaan="galat"/)
    expect(html).toMatch(/role="alert"/)
    expect(html).toContain('Daftar ini belum bisa diambil')
    expect(html).toContain('Server terlalu lama menjawab.')
    expect(html).toContain('jaringan')
    expect(tombol(html)).toHaveLength(1)
    expect(tombol(await render(CashflowKeadaan, { jenis: 'galat', pesan: 'Gagal memuat.' }))).toHaveLength(0)
    expect(tombol(await render(CashflowKeadaan, { jenis: 'galat', pesan: 'x', labelUlang: 'Coba lagi', sibuk: true }))[0]).toMatch(MATI)
  })
  it('akses terbatas: keterangan dan jalan keluarnya, bukan galat', async () => {
    const html = await render(CashflowKeadaan, { jenis: 'terbatas', judul: 'Sebagian isinya masih terkunci', pesan: 'Verifikasi akses dulu.' }, { default: () => h('button', 'Sambung ulang') })
    expect(html).toMatch(/role="status" data-keadaan="terbatas"/)
    expect(html).not.toMatch(/role="alert"/)
    expect(html).toContain('Sambung ulang')
  })
  it('kosong: Domi atau ikon, satu kalimat sebab, dan jalan keluar di slot', async () => {
    const html = await render(CashflowKeadaan, { jenis: 'kosong', icon: 'lucide:users', judul: 'Belum ada yang cocok', pesan: 'Tidak ada yang cocok dengan saringan.' }, { default: () => h('button', 'Lepas saringan') })
    expect(html).toMatch(/data-keadaan="kosong"/)
    // Bawaannya Domi diam (lihat domi-maskot.test.ts). Ikon hanya bila maskot dimatikan.
    expect(html).not.toMatch(/data-ikon=/)
    expect(await render(CashflowKeadaan, { jenis: 'kosong', maskot: false, icon: 'lucide:users', pesan: 'Kosong' })).toMatch(/data-ikon="lucide:users"/)
    expect(html).toContain('Belum ada yang cocok')
    expect(html).toContain('Lepas saringan')
    expect(await render(CashflowKeadaan, { jenis: 'kosong', polos: true, pesan: 'Kosong' })).toMatch(/cf-tabel-polos/)
  })
  it('belum aktif di server: tenang, bukan galat dan bukan daftar kosong', async () => {
    const html = await render(CashflowKeadaan, { jenis: 'belum-aktif', judul: 'Fitur ini belum diaktifkan di server', pesan: 'Tidak ada yang rusak.', labelUlang: 'Periksa lagi' })
    expect(html).toMatch(/role="status" data-keadaan="belum-aktif"/)
    expect(html).not.toMatch(/role="alert"|ca-danger|data-keadaan="(galat|kosong)"/)
    expect(html).toMatch(/data-ikon="lucide:hourglass"/)
    expect(html).toContain('Fitur ini belum diaktifkan di server')
    expect(html).toContain('Tidak ada yang rusak.')
    expect(tombol(html)).toHaveLength(1)
    expect(tombol(html)[0]).toContain('Periksa lagi')
    expect(tombol(await render(CashflowKeadaan, { jenis: 'belum-aktif', pesan: 'x', labelUlang: 'Periksa lagi', sibuk: true }))[0]).toMatch(MATI)
    expect(tombol(await render(CashflowKeadaan, { jenis: 'belum-aktif', pesan: 'x' }))).toHaveLength(0)
    // Belum aktif menang atas galat dan kosong; izin tetap paling atas.
    expect(keadaanDaftar({ memuat: false, galat: true, belumAktif: true, jumlah: 0 })).toBe('belum-aktif')
    expect(keadaanDaftar({ memuat: true, galat: false, belumAktif: true, jumlah: 0 })).toBe('belum-aktif')
    expect(keadaanDaftar({ memuat: false, galat: true, izin: true, belumAktif: true, jumlah: 0 })).toBe('terbatas')
  })
  it('akses terbatas: teks punya lebar dasar, jadi tombol panjang turun ke bawah di layar sempit', async () => {
    const html = await render(CashflowKeadaan, { jenis: 'terbatas', judul: 'Judul', pesan: 'Pesan' }, { default: () => h('button', 'Pasang verifikasi dua langkah') })
    expect(html).toMatch(/class="min-w-0 flex-1 basis-56"/)
  })
  it('kartu ponsel: Aktivitas, Dukungan, Paket, dan Pengumuman punya daftar di bawah 640 px dan tabelnya disembunyikan di sana', () => {
    const PASANGAN: Record<string, [RegExp, RegExp]> = {
      'pages/console/cashflow/aktivitas.vue': [/<ul v-if="rows\.length" class="[^"]*sm:hidden" data-uji="aktivitas-kartu">/, /<CashflowTabel v-if="rows\.length" class="hidden sm:block">/],
      'pages/console/cashflow/dukungan.vue': [/<ul v-if="daftar\.length" class="[^"]*sm:hidden" data-uji="dukungan-kartu">/, /class="cf-tabel-gulir ca-scrollbar hidden sm:block">\s*<table class="cf-tabel" data-uji="dukungan-tabel">/],
      'components/cashflow/CashflowPaketTabel.vue': [/<ul class="[^"]*sm:hidden" data-uji="paket-kartu">/, /<CashflowTabel lebar-min="62rem" class="hidden sm:block">/],
      'pages/console/cashflow/pengumuman.vue': [/<div class="[^"]*sm:hidden" data-uji="pengumuman-kartu">/, /<div class="ca-console-dialog hidden overflow-hidden sm:block/],
    }
    for (const [f, [kartu, tabel]] of Object.entries(PASANGAN)) {
      const s = readFileSync(join(AKAR, f), 'utf8')
      expect(s, f).toMatch(kartu)
      expect(s, f).toMatch(tabel)
    }
    // Aksi paket di kartu sama lengkapnya dengan di tabel.
    const paket = readFileSync(join(AKAR, 'components/cashflow/CashflowPaketTabel.vue'), 'utf8')
    for (const aksi of ['ubah', 'aktifkan', 'nonaktifkan', 'bawaan', 'naik', 'turun', 'hapus']) {
      expect(paket.match(new RegExp(`emit\\('${aksi}', p\\)`, 'g')), aksi).toHaveLength(2)
    }
    const pengumuman = readFileSync(join(AKAR, 'pages/console/cashflow/pengumuman.vue'), 'utf8')
    expect(pengumuman.match(/sunting\(row\)/g)).toHaveLength(2)
    expect(pengumuman.match(/mintaHentikan\(row\)/g)).toHaveLength(2)
  })
  it('Aktivitas tanpa izin data pribadi: Selidiki mati dan jalan keluarnya ditulis', () => {
    const s = readFileSync(join(AKAR, 'pages/console/cashflow/aktivitas.vue'), 'utf8')
    expect(s).toMatch(/const bolehSelidiki = computed\(\(\) => sesi\.boleh\('cashflow:pii'\)\)/)
    expect(s).toMatch(/<CashflowIzinKurang v-if="rows\.length && !bolehSelidiki" :pesan="tcf\('aktivitas\.izinSelidiki'\)" \/>/)
    expect(s.match(/:disabled="sibuk !== null \|\| !bolehSelidiki"/g)).toHaveLength(2)
  })
  it('lencana ditangguhkan ditulis sebagai satu teks, supaya spasi sebelum tanggalnya tidak hilang', () => {
    const s = readFileSync(join(AKAR, 'components/cashflow/CashflowKepala360.vue'), 'utf8')
    expect(s).toMatch(/data-uji="rinci-ditangguhkan">\{\{ labelDitangguhkan \}\}<\/span>/)
    expect(s).toMatch(/`\$\{tcf\('pengguna\.ditangguhkan'\)\} \$\{tcf\('pengguna\.sampaiTanggal'\)\(formatTanggal\(sampai\)\)\}`/)
  })
  it('setelan kabar per ruang: daftar, bukan tabel sebelas kolom', () => {
    const s = readFileSync(join(AKAR, 'components/cashflow/CashflowTabKabar.vue'), 'utf8')
    expect(s).not.toMatch(/<table\b/)
    expect(s).toMatch(/<ul v-else class="[^"]*" data-uji="kabar-setelan">/)
    expect(s).toMatch(/sakelarMenurut\(s, true\)/)
    expect(s).toMatch(/sakelarMenurut\(s, false\)/)
  })
  it('urutan keadaan: izin menang, baris lama bertahan, galat tidak pernah terbaca kosong', () => {
    expect(keadaanDaftar({ memuat: true, galat: false, jumlah: 0 })).toBe('memuat')
    expect(keadaanDaftar({ memuat: false, galat: false, jumlah: 0 })).toBe('kosong')
    expect(keadaanDaftar({ memuat: false, galat: true, jumlah: 0 })).toBe('galat')
    // Muat ulang yang gagal: galat, bukan kerangka, dan bukan "Belum ada data".
    expect(keadaanDaftar({ memuat: true, galat: true, jumlah: 0 })).toBe('galat')
    // Baris yang sudah tampil tidak diruntuhkan oleh muat ulang atau galat berikutnya.
    expect(keadaanDaftar({ memuat: true, galat: false, jumlah: 25 })).toBeNull()
    expect(keadaanDaftar({ memuat: false, galat: true, jumlah: 25 })).toBeNull()
    // Izin dicabut: baris lama tidak boleh tetap terbaca.
    expect(keadaanDaftar({ memuat: false, galat: true, izin: true, jumlah: 25 })).toBe('terbatas')
    for (let i = -3; i < 12; i++) { expect(lebarKerangka(i)).toBeGreaterThan(30); expect(lebarKerangka(i)).toBeLessThanOrEqual(80) }
  })
  it('halaman daftar memakai komponen keadaan, bukan paragraf "Memuat…" atau galat polos', () => {
    for (const f of ['pengguna/index', 'ruang/index', 'audit', 'aktivitas', 'kasus', 'hapus-akun', 'paket', 'pembelian', 'dukungan', 'index']) {
      const s = baca(`pages/console/cashflow/${f}.vue`)
      expect(s, f).toMatch(/<CashflowKeadaan/)
      expect(s, f).not.toMatch(/<p v-(?:else-)?if="memuat[^"]*" class="[^"]*">\{\{ tcf\('umum\.memuat'\) \}\}<\/p>/)
    }
  })
  it('tulisan keadaan ada di ID dan EN, tanpa tanda pisah panjang, titik koma, atau emoji', () => {
    for (const b of ['id', 'en'] as const) {
      for (const k of ['artiKolom', 'cobaLagi', 'lepasSaringan', 'galatJudul', 'kosongJudul', 'kosongSaringJudul', 'terbatasJudul'] as const) {
        const v = KAMUS_CASHFLOW[b].umum[k]
        expect(v.length, `${b}.${k}`).toBeGreaterThan(0)
        expect(v, `${b}.${k}`).not.toMatch(/[—–;]|\p{Extended_Pictographic}/u)
      }
    }
  })
})
