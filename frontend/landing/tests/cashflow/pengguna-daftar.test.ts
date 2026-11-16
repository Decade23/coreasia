/**
 * Daftar pengguna tujuh kolom: pilihan "Urut" dan panel "Saring" harus
 * mengirim parameter yang SAMA dengan kepala kolom dan saringan kolom tabel
 * sebelumnya, dan tautan lama (?urut, ?arah, ?seg, ?hal) tetap terbaca.
 *
 * Acuan "sebelumnya" ditulis ulang di sini apa adanya dari halaman lama, lalu
 * dibandingkan dengan adapter baru untuk semua kombinasi.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  FILTER_KOLOM, SEGMEN_PENGGUNA, URUT_BERKOLOM, URUT_PENGGUNA, URUT_PRIBADI,
  arahBawaan, barisWa, filterServer, gantiUrut, jumlahSaringan, keBawaanRinci, opsiUrut, rupiahRingkas,
  segmenButuhHitungan, tambahanUrut, tanpaTahunIni, urutBoleh, type ArahUrut,
} from '../../adapters/cashflowPenggunaDaftar'
import { kePengguna, type PenggunaDTO } from '../../adapters/cashflow'
import { bacaQuery, tulisQuery, type SkemaQuery } from '../../adapters/cashflowQuery'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (f: string) => readFileSync(join(AKAR, f), 'utf8')
const HAL = baca('pages/console/cashflow/pengguna/index.vue')

// ── Acuan: halaman sebelum perombakan ────────────────────────────────────
const URUT_LAMA = ['email', 'wa', 'versi', 'daftar', 'aktif', 'ruang', 'tx', 'nominal', 'domi', 'domi_terakhir', 'kredit'] as const
const SEGMEN_LAMA = ['semua', 'catat7', 'belum', 'ditangguhkan', 'belum_wa', 'pakai_domi', 'beli_kredit'] as const
const PRIBADI_LAMA = ['ruang', 'tx', 'nominal', 'domi', 'domi_terakhir', 'kredit']
const STATUS_WA = ['masuk', 'kirim', 'lewat', 'belum']
/** urutKolom halaman lama: undefined = klik diabaikan. */
function urutKolomLama(kini: { urut: string; arah: ArahUrut }, key: string, o: { adaDomi: boolean; tanpaHitungan: boolean }) {
  const k = URUT_LAMA.find(u => u === key)
  if (!k || (o.tanpaHitungan && PRIBADI_LAMA.includes(k)) || (['domi', 'domi_terakhir', 'kredit'].includes(k) && !o.adaDomi)) return undefined
  const arah = kini.urut === k ? (kini.arah === 'asc' ? 'desc' : 'asc') : (k === 'email' || k === 'wa' ? 'asc' : 'desc')
  return { urut: k, arah, hal: 1 }
}
/** Susunan p_filter halaman lama. */
function filterLama(isian: Record<string, string>, serverStatusWa: boolean, labelStatus: (s: string) => string) {
  const filter: Record<string, string> = {}
  for (const k of ['email', 'wa', 'versi', 'daftar', 'aktif', 'status']) {
    const v = isian[k]
    if (!v) continue
    if (k === 'status') {
      const nilai = ['aktif', 'ditangguhkan', 'menunggu_hapus'].find(x => x === v || labelStatus(x) === v)
      if (nilai) filter[k] = nilai
    } else filter[k] = v
  }
  const statusWa = isian.status_wa
  if (serverStatusWa && STATUS_WA.includes(statusWa!)) filter.status_wa = statusWa!
  const internal = isian.internal
  if (internal === 'ya' || internal === 'tidak') filter.internal = internal
  return filter
}
const KEADAAN = [
  { adaDomi: true, tanpaHitungan: false }, { adaDomi: true, tanpaHitungan: true },
  { adaDomi: false, tanpaHitungan: false }, { adaDomi: false, tanpaHitungan: true },
]

describe('nilai yang dikenal server dan tautan lama tidak berubah', () => {
  it('urut, segmen, dan kunci saringan sama persis, urutannya juga', () => {
    expect([...URUT_PENGGUNA]).toEqual([...URUT_LAMA])
    expect([...SEGMEN_PENGGUNA]).toEqual([...SEGMEN_LAMA])
    expect([...FILTER_KOLOM]).toEqual(['email', 'wa', 'versi', 'daftar', 'aktif', 'status'])
    expect([...URUT_PRIBADI]).toEqual(PRIBADI_LAMA)
  })
  it('segmen berhitungan: belum, catat7, dan kedua segmen Domi. Belum WhatsApp tidak butuh izin', () => {
    expect(SEGMEN_PENGGUNA.filter(segmenButuhHitungan)).toEqual(['catat7', 'belum', 'pakai_domi', 'beli_kredit'])
  })
  it('halaman memakai skema URL yang sama: ?seg, ?urut, ?arah, ?hal dengan bawaan lama', () => {
    expect(HAL).toMatch(/seg: \{ jenis: 'pilihan', opsi: SEGMEN, bawaan: 'semua' \},\s+urut: \{ jenis: 'pilihan', opsi: URUT, bawaan: 'daftar' \},\s+arah: \{ jenis: 'pilihan', opsi: \['asc', 'desc'\], bawaan: 'desc' \},\s+hal: \{ jenis: 'halaman', bawaan: 1 \},/)
    expect(HAL).toMatch(/const SEGMEN = SEGMEN_PENGGUNA\nconst URUT = URUT_PENGGUNA/)
    expect(HAL).toMatch(/segmen: q\.value\.seg, urut: q\.value\.urut, arah: q\.value\.arah, filter,/)
  })
  it('tautan lama terbaca, termasuk urutan yang kini tanpa kolom', () => {
    const SKEMA = {
      seg: { jenis: 'pilihan', opsi: SEGMEN_PENGGUNA, bawaan: 'semua' },
      urut: { jenis: 'pilihan', opsi: URUT_PENGGUNA, bawaan: 'daftar' },
      arah: { jenis: 'pilihan', opsi: ['asc', 'desc'], bawaan: 'desc' },
      hal: { jenis: 'halaman', bawaan: 1 },
    } as const satisfies SkemaQuery
    for (const urut of URUT_LAMA) {
      for (const seg of SEGMEN_LAMA) {
        expect(bacaQuery(SKEMA, { urut, seg, arah: 'asc', hal: '3' })).toEqual({ urut, seg, arah: 'asc', hal: 3 })
      }
    }
    expect(bacaQuery(SKEMA, {})).toEqual({ seg: 'semua', urut: 'daftar', arah: 'desc', hal: 1 })
    expect(tulisQuery(SKEMA, { urut: 'domi_terakhir', arah: 'asc', seg: 'beli_kredit', hal: 2 })).toEqual({ urut: 'domi_terakhir', arah: 'asc', seg: 'beli_kredit', hal: '2' })
  })
})

describe('pilihan "Urut" memetakan ke parameter yang sama dengan kepala kolom lama', () => {
  it('setiap kunci, dari setiap keadaan urut, untuk server baru, server lama, dan sesi tanpa izin', () => {
    let dibandingkan = 0
    for (const o of KEADAAN) {
      for (const urut of URUT_LAMA) {
        for (const arah of ['asc', 'desc'] as const) {
          for (const kunci of [...URUT_LAMA, 'status', 'status_wa', 'tidak_ada', '']) {
            expect(gantiUrut({ urut, arah }, kunci, o) ?? undefined, `${JSON.stringify(o)} ${urut}/${arah} → ${kunci}`).toEqual(urutKolomLama({ urut, arah }, kunci, o))
            dibandingkan++
          }
        }
      }
    }
    expect(dibandingkan).toBe(4 * 11 * 2 * 15)
  })
  it('arah bawaan: email dan WhatsApp naik, sisanya turun. Kunci yang sama membalik arah', () => {
    expect(URUT_PENGGUNA.filter(k => arahBawaan(k) === 'asc')).toEqual(['email', 'wa'])
    const o = KEADAAN[0]!
    expect(gantiUrut({ urut: 'daftar', arah: 'desc' }, 'domi_terakhir', o)).toEqual({ urut: 'domi_terakhir', arah: 'desc', hal: 1 })
    expect(gantiUrut({ urut: 'domi_terakhir', arah: 'desc' }, 'domi_terakhir', o)).toEqual({ urut: 'domi_terakhir', arah: 'asc', hal: 1 })
    expect(gantiUrut({ urut: 'tx', arah: 'asc' }, 'email', o)).toEqual({ urut: 'email', arah: 'asc', hal: 1 })
  })
  it('semua nilai urut yang dikenal server tetap ditawarkan', () => {
    expect(opsiUrut(KEADAAN[0]!)).toEqual(URUT_LAMA.map(nilai => ({ nilai, mati: false })))
  })
  it('server lama: urutan Domi tidak ditawarkan sama sekali', () => {
    expect(opsiUrut(KEADAAN[2]!).map(o => o.nilai)).toEqual(['email', 'wa', 'versi', 'daftar', 'aktif', 'ruang', 'tx', 'nominal'])
  })
  it('tanpa izin data pribadi: urutan berhitungan terlihat tetapi mati, yang lain hidup', () => {
    expect(opsiUrut(KEADAAN[1]!).filter(o => o.mati).map(o => o.nilai)).toEqual(PRIBADI_LAMA)
    expect(opsiUrut(KEADAAN[1]!).filter(o => !o.mati).map(o => o.nilai)).toEqual(['email', 'wa', 'versi', 'daftar', 'aktif'])
    expect(urutBoleh('domi', KEADAAN[2]!)).toBe(false)
    expect(urutBoleh('daftar', KEADAAN[3]!)).toBe(true)
  })
  it('yang kehilangan kolom tetap bisa diurutkan, dan nilainya ditulis di baris kedua', () => {
    const tanpaKolom = URUT_PENGGUNA.filter(k => !URUT_BERKOLOM.includes(k))
    expect(tanpaKolom).toEqual(['daftar', 'tx', 'nominal', 'domi_terakhir'])
    // Tanggal daftar selalu ada di baris kedua Aktif terakhir. Tiga lainnya muncul saat dipakai mengurutkan.
    expect(tanpaKolom.map(tambahanUrut)).toEqual([null, 'tx', 'nominal', 'domi_terakhir'])
    for (const k of URUT_BERKOLOM) expect(tambahanUrut(k)).toBeNull()
  })
  it('halaman: kepala kolom dan pilihan Urut lewat satu fungsi, dan tautan tanpa izin kembali ke bawaan', () => {
    expect(HAL).toMatch(/const baru = gantiUrut\(q\.value, key, keadaanUrut\.value\)\s+if \(baru\) void setel\(baru\)/)
    expect(HAL).toMatch(/const urutPilihan = computed\(\{ get: \(\) => q\.value\.urut, set: \(k: UrutPengguna\) => \{ if \(k !== q\.value\.urut\) urutKolom\(k\) \} \}\)/)
    expect(HAL).toMatch(/<select v-model="urutPilihan"[^>]*data-uji="urut">\s*<option v-for="o in pilihanUrut" :key="o\.nilai" :value="o\.nilai" :disabled="o\.mati">/)
    expect(HAL).toMatch(/@sort="urutKolom"/)
    expect(HAL).toMatch(/const balikArah = \(\) => \{ void setel\(\{ arah: q\.value\.arah === 'asc' \? 'desc' : 'asc', hal: 1 \}\) \}/)
    expect(HAL).toMatch(/if \(!tanpaHitungan\.value \|\| \(!segmenButuhHitungan\(q\.value\.seg\) && !URUT_PRIBADI\.includes\(q\.value\.urut\)\)\) return false\s+await setel\(\{ seg: 'semua', urut: 'daftar', arah: 'desc', hal: 1 \}\)/)
  })
})

describe('panel "Saring" mengirim p_filter yang sama dengan saringan kolom lama', () => {
  const labelStatus = (s: string) => ({ aktif: 'Aktif', ditangguhkan: 'Ditangguhkan', menunggu_hapus: 'Menunggu dihapus' })[s] ?? s
  const ISIAN: Record<string, string>[] = [
    {}, { email: 'sar' }, { wa: '0811', versi: '1.4' }, { daftar: 'Okt', aktif: 'Nov 2026' },
    { status: 'ditangguhkan' }, { status: 'Menunggu dihapus' }, { status: 'karangan' }, { status: '' },
    { status_wa: 'lewat' }, { status_wa: 'lain' }, { status_wa: 'karangan' },
    { internal: 'ya' }, { internal: 'tidak' }, { internal: 'mungkin' },
    { email: 'a', wa: 'b', versi: 'c', daftar: 'd', aktif: 'e', status: 'aktif', status_wa: 'belum', internal: 'tidak' },
    { nominal: '100', ruang: '2', domi: '3' },
  ]
  it('semua isian, untuk server yang mengenal status WhatsApp dan yang belum', () => {
    for (const serverStatusWa of [true, false]) {
      for (const isian of ISIAN) {
        expect(filterServer(isian, { serverStatusWa, labelStatus }), `${serverStatusWa} ${JSON.stringify(isian)}`).toEqual(filterLama(isian, serverStatusWa, labelStatus))
      }
    }
  })
  it('status WhatsApp hanya untuk server yang mengenalnya, akun tim hanya ya atau tidak', () => {
    expect(filterServer({ status_wa: 'lewat' }, { serverStatusWa: false })).toEqual({})
    expect(filterServer({ status_wa: 'lewat' }, { serverStatusWa: true })).toEqual({ status_wa: 'lewat' })
    expect(filterServer({ internal: 'ya' }, { serverStatusWa: false })).toEqual({ internal: 'ya' })
    expect(filterServer({ internal: 'semua' }, { serverStatusWa: true })).toEqual({})
    // Kolom hitungan tidak pernah jadi saringan teks.
    expect(filterServer({ ruang: '2', tx: '9', nominal: '1', domi: '3', kredit: '4' }, { serverStatusWa: true })).toEqual({})
  })
  it('lencana tombol Saring menghitung isian yang terisi', () => {
    expect(jumlahSaringan({})).toBe(0)
    expect(jumlahSaringan({ email: 'a', wa: '', status: 'aktif', internal: 'ya' })).toBe(3)
  })
  it('halaman: isian panel memakai state, jeda, dan pembersih yang sama dengan saringan kolom lama', () => {
    expect(HAL).toMatch(/const filter = filterServer\(filterDiterapkan\.value, \{ serverStatusWa: serverStatusWa\.value, labelStatus \}\)/)
    expect(HAL).toMatch(/const filterKolom = useState<Record<string, string>>\('cf_saring_kolom_pengguna', \(\) => \(\{\}\)\)/)
    expect(HAL).toMatch(/watch\(filterKolom, \(f\) => \{\s+clearTimeout\(jedaFilter\)\s+jedaFilter = setTimeout\(\(\) => \{\s+filterDiterapkan\.value = Object\.fromEntries\(Object\.entries\(f\)\.filter\(\(\[, v\]\) => v\)\)/)
    expect(HAL).toMatch(/FILTER_KOLOM\.filter\(k => k !== 'status'\)/)
    expect(HAL).toMatch(/\.\.\.\(serverStatusWa\.value \? \[\{ kunci: 'status_wa'/)
    expect(HAL).toMatch(/<label v-if="adaDomi"[^>]*>\s*\{\{ tcf\('pengguna\.domi\.saringTim'\) \}\}\s*<select v-model="saringTim"[^>]*data-uji="saring-tim">/)
    // Tabel tidak lagi punya tombol saring di kepala kolom: semuanya lewat panel.
    expect(HAL.match(/filterable: false/g)!.length).toBeGreaterThanOrEqual(8)
    expect(HAL).not.toMatch(/v-model:filters/)
  })
})

describe('isi baris dua tingkat', () => {
  const dto = (ubah: Partial<PenggunaDTO> & Record<string, unknown> = {}): PenggunaDTO => ({
    user_id: '00000000-0000-0000-0000-000000000001', email: 'sar***@contoh.invalid', display_name: '',
    created_at: '2026-10-20T03:00:00Z', last_sign_in: '2026-11-15T03:00:00Z', aktivitas_terakhir: '2026-11-16T02:40:00Z', banned_until: null,
    jumlah_ruang: 3, jumlah_tx: 120, jumlah_nominal: 12_500_000, terbuka: false, total_semua: 1,
    ...ubah,
  } as PenggunaDTO)
  it('status WhatsApp singkat: terbukti dengan tanggal, lolos, atau belum. Kalimat panjangnya untuk rincian', () => {
    const p = (ubah: Record<string, unknown>) => kePengguna(dto(ubah), 'id')
    expect(barisWa(p({ status_wa: 'masuk', status_wa_pada: '2026-11-14T00:00:00Z' }))).toEqual({ nada: 'baik', kunci: 'waTerbukti', pada: '14 Nov 2026' })
    expect(barisWa(p({ status_wa: 'kirim', status_wa_pada: null }))).toEqual({ nada: 'baik', kunci: 'waTerbukti', pada: null })
    expect(barisWa(p({ status_wa: 'lewat', lewat_sebab: 'gangguan', status_wa_pada: '2026-11-10T00:00:00Z' }))).toEqual({ nada: 'awas', kunci: 'waLolos', pada: null })
    expect(barisWa(p({ status_wa: 'lewat', lewat_sebab: 'tanpa_nomor' }))?.kunci).toBe('waLolosTanpaNomor')
    expect(barisWa(p({ status_wa: 'belum' }))).toEqual({ nada: 'netral', kunci: 'waBelumBukti', pada: null })
    expect(barisWa(p({ status_wa: 'karangan' }))?.kunci).toBe('waBelumBukti')
    // Server lama tidak mengirim kolomnya: baris kedua tidak ditulis.
    expect(barisWa(p({}))).toBeNull()
    for (const b of ['id', 'en'] as const) {
      for (const k of ['waLolos', 'waLolosTanpaNomor', 'waBelumBukti', 'waTanpaNomor'] as const) expect(KAMUS_CASHFLOW[b].pengguna[k].length).toBeGreaterThan(0)
      expect(KAMUS_CASHFLOW[b].pengguna.waTerbukti('14 Nov 2026')).toContain('14 Nov 2026')
    }
  })
  it('tanggal status: tahun berjalan tidak ditulis, tahun lain tetap', () => {
    expect(tanpaTahunIni('14 Nov 2026', '2026')).toBe('14 Nov')
    expect(tanpaTahunIni('14 Nov 2025', 2026)).toBe('14 Nov 2025')
    expect(tanpaTahunIni('—', '2026')).toBe('—')
  })
  it('rupiah ringkas untuk baris kecil', () => {
    expect(rupiahRingkas(950_000)).toBe('Rp 950.000')
    expect(rupiahRingkas(12_500_000)).toBe('Rp 12,5 jt')
    expect(rupiahRingkas(3_000_000)).toBe('Rp 3 jt')
    expect(rupiahRingkas(1_240_000_000)).toBe('Rp 1,2 M')
    expect(rupiahRingkas(2_500_000_000_000)).toBe('Rp 2,5 T')
    expect(rupiahRingkas(12_500_000, 'en')).toBe('Rp 12.5M')
    expect(rupiahRingkas(-3_000_000)).toBe('−Rp 3 jt')
    expect(rupiahRingkas(0)).toBe('Rp 0')
    expect(rupiahRingkas(null)).toBe('—')
    expect(rupiahRingkas(Number.NaN)).toBe('—')
  })
  it('bawaan ke rincian: status WhatsApp dan terakhir pakai Domi, tanpa email, nama, atau nomor', () => {
    const p = kePengguna(dto({
      email: 'sari@contoh.invalid', display_name: 'Sari Wulandari', terbuka: true, nomor_wa: '6281100001000',
      status_wa: 'masuk', status_wa_pada: '2026-11-14T00:00:00Z', domi_tanya: 412, domi_tanya_30: 96, domi_terakhir: '2026-11-15T05:00:00Z', kredit_sisa: 37, kredit_beli: 3,
    }), 'id')
    const b = keBawaanRinci(p)
    expect(Object.keys(b).sort()).toEqual(['domiBelumPernah', 'domiTerakhir', 'id', 'statusWa'])
    expect(b.domiTerakhir).toBe('15 Nov 2026')
    expect(b.statusWa?.status).toBe('masuk')
    expect(JSON.stringify(b)).not.toMatch(/sari|Wulandari|0811|6281|@/)
    // Belum pernah bertanya dibedakan dari "tidak boleh tahu" dan dari server lama.
    expect(keBawaanRinci(kePengguna(dto({ domi_tanya: 0, domi_tanya_30: 0, domi_terakhir: null }), 'id'))).toMatchObject({ domiTerakhir: null, domiBelumPernah: true })
    expect(keBawaanRinci(kePengguna(dto({ domi_tanya: null, domi_terakhir: null }), 'id'))).toMatchObject({ domiTerakhir: null, domiBelumPernah: false })
    expect(keBawaanRinci(kePengguna(dto(), 'id'))).toMatchObject({ statusWa: null, domiTerakhir: null, domiBelumPernah: false })
  })
})

describe('halaman daftar: tujuh kolom, dan empat hal pindah ke rincian', () => {
  it('kolom: Pengguna, WhatsApp, Versi, Aktif terakhir, Tanya Domi, Kredit, Ruang, lalu panah', () => {
    const kunci = [...HAL.matchAll(/\{ key: '(\w+)', label:/g)].map(m => m[1])
    expect(kunci).toEqual(['email', 'wa', 'versi', 'aktif', 'domi', 'kredit', 'ruang', 'buka'])
    // Kolom Pengguna tanpa lebar tetap: ia mengambil sisa, supaya email panjang muat utuh.
    expect(HAL).toMatch(/\{ key: 'email', label: tcf\('nav\.pengguna'\), sortable: urut\('email'\), filterable: false, class:/)
    for (const k of kunci.slice(1)) expect(HAL).toMatch(new RegExp(`key: '${k}',[^\\n]*width: '\\d+px'`))
    expect(HAL).toMatch(/<div class="cf-tabel-wadah cf-tabel-tetap hidden lg:block">/)
  })
  it('daftar tidak lagi menulis ID, masuk terakhir, atau kalimat panjang status WhatsApp', () => {
    const tpl = HAL.slice(HAL.indexOf('<template>'))
    expect(tpl).not.toMatch(/row\.id\.slice\(0, 8\)/)
    expect(tpl).not.toMatch(/masukTerakhir/)
    expect(tpl).not.toMatch(/<CashflowStatusWaAkun/)
    expect(tpl).not.toMatch(/cell-domi_terakhir|cell-status_wa|cell-nominal|cell-tx/)
  })
  it('rincian pengguna menampilkan keempatnya: cara nomor dibuktikan, terakhir pakai Domi, ID, dan masuk terakhir', () => {
    const kepala = baca('components/cashflow/CashflowKepala360.vue')
    expect(kepala).toMatch(/tcf\('pengguna\.rinci\.caraBukti'\)[\s\S]*?<CashflowStatusWaAkun v-if="bawaan\?\.statusWa" :status="bawaan\.statusWa" baris \/>/)
    expect(kepala).toMatch(/tcf\('pengguna\.rinci\.domiTerakhir'\)/)
    expect(kepala).toMatch(/data-uji="rinci-id">\{\{ kepala\.id \}\}/)
    expect(kepala).toMatch(/tcf\('pengguna\.masuk'\)[\s\S]*?formatTanggal\(kepala\.masukTerakhirIso\)/)
    // Terakhir pakai Domi hanya untuk sesi berizin data pribadi.
    expect(kepala).toMatch(/if \(!props\.izinPribadi \|\| !props\.bawaan\) return null/)
    expect(baca('pages/console/cashflow/pengguna/[id].vue')).toMatch(/:bawaan="bawaanRinci"/)
  })
  it('bawaan diisi dari baris yang tampil dan dibuang saat hak baca hilang atau keluar. Tidak ada RPC baru', () => {
    expect(HAL).toMatch(/bawaan\.isi\(semua\.value\)/)
    expect(HAL).toMatch(/if \(tanpaDataPribadi\) \{ jumlahDomi\.value = null; bawaan\.kosongkan\(\) \}/)
    expect(HAL).toMatch(/indeks\.kosongkan\(\)\s+bawaan\.kosongkan\(\)/)
    expect(baca('composables/cashflow/useCashflowSesi.ts')).toMatch(/useCashflowBawaanRinci\(\)\.kosongkan\(\)/)
    const komposabel = baca('composables/cashflow/useCashflowBawaanRinci.ts')
    expect(komposabel).not.toMatch(/useCashflowAdmin|\.rpc\(|\$fetch|fetch\(/)
    expect(baca('components/cashflow/CashflowKepala360.vue')).not.toMatch(/useCashflowAdmin|\.rpc\(/)
  })
  it('sakelar Kontak lengkap dan pencatatan auditnya tidak berubah', () => {
    expect(HAL).toMatch(/const ALASAN_DAFTAR = 'Kontak lengkap \(email dan WhatsApp\) di daftar pengguna Console'/)
    expect(HAL).toMatch(/let alasan = !tanpaHitungan\.value && !samarkanKontak\.value \? ALASAN_DAFTAR : null/)
    expect(HAL).toMatch(/type="button" role="switch" :aria-checked="!!terbuka"[\s\S]{0,400}?:disabled="memuat && !terbuka" @click="gantiKontak"/)
    expect(HAL).toMatch(/mentah\.value = tanpaHitungan\.value \? bersihkanData\(hasil\.baris\) : bolehBuka \? hasil\.baris : tanpaKontakUtuh\(hasil\.baris\)/)
  })
  it('paragraf arti kolom pindah ke satu tautan yang membuka panel', () => {
    const tpl = HAL.slice(HAL.indexOf('<template>'))
    expect(tpl).toMatch(/<template #ket><CashflowArtiKolom :butir="artiKolom" \/><\/template>/)
    for (const k of ['pengguna.aktifTerakhirKet', 'pengguna.versiKet', 'pengguna.statusWa.ket', 'pengguna.domi.ket']) {
      expect(tpl, k).not.toContain(`tcf('${k}')`)
      expect(HAL, k).toContain(`isi: tcf('${k}')`)
    }
    const arti = baca('components/cashflow/CashflowArtiKolom.vue')
    expect(arti).toMatch(/aria-haspopup="dialog"/)
    expect(arti).toMatch(/<CashflowLaci :show="buka"/)
  })
  it('tulisan baru ada di ID dan EN, tanpa tanda pisah panjang, titik koma, atau emoji', () => {
    const periksa = (v: unknown, jalur: string) => {
      const teks = typeof v === 'function' ? String((v as (...a: unknown[]) => unknown)('1', '2')) : v
      if (typeof teks === 'string') {
        expect(teks.length, jalur).toBeGreaterThan(0)
        expect(teks, jalur).not.toMatch(/[—–;]|\p{Extended_Pictographic}/u)
      } else if (teks && typeof teks === 'object') for (const [k, x] of Object.entries(teks)) periksa(x, `${jalur}.${k}`)
    }
    const KUNCI = [
      'urut', 'saringan', 'urutOpsi', 'arahUrut', 'saringJudul', 'saringKet', 'saringSelesai', 'saringTeks', 'tanyaDomi', 'kredit', 'bukaKolom',
      'bukaRinci', 'daftarPada', 'waTanpaNomor', 'waTerbukti', 'waBelumBukti', 'waLolos', 'waLolosTanpaNomor', 'domiBelum', 'domiTerakhirPada',
      'kreditBeli', 'kreditGratis', 'versiLamaPendek', 'txBaris', 'kartuKet', 'artiPengguna', 'artiRuang', 'rinci',
    ] as const
    for (const b of ['id', 'en'] as const) {
      for (const k of KUNCI) periksa(KAMUS_CASHFLOW[b].pengguna[k], `${b}.pengguna.${k}`)
      for (const u of URUT_PENGGUNA) expect(KAMUS_CASHFLOW[b].pengguna.urutOpsi[u].length, `${b}.${u}`).toBeGreaterThan(0)
    }
  })
})
