/**
 * Daftar pengguna: pilihan "Urut" dan panel "Saring" harus mengirim parameter
 * yang SAMA dengan kepala kolom dan saringan kolom tabel sebelumnya, dan tautan
 * lama (?urut, ?arah, ?seg, ?hal) tetap terbaca. Sejak v5 (19 Nov 2026, K3)
 * semua kunci baris punya kolom dan tujuh nilai urut baru hanya ditawarkan bila
 * server memasang v5, jadi keadaan lama (tanpa adaV5) tetap persis seperti dulu.
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
  arahBawaan, barisWa, filterServer, gantiUrut, jumlahSaringan, keBawaanRinci, opsiUrut, rinciKepala, rupiahRingkas,
  segmenButuhHitungan, tambahanUrut, tanpaTahunIni, urutBoleh, type ArahUrut,
} from '../../adapters/cashflowPenggunaDaftar'
import { KOLOM_PENGGUNA, URUT_V5 } from '../../adapters/cashflowPenggunaKolom'
import { kePengguna, tanggalPendek, type PenggunaDTO } from '../../adapters/cashflow'
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
    // Nilai lama tetap di tempatnya, tujuh nilai v5 menyusul di belakang.
    expect([...URUT_PENGGUNA]).toEqual([...URUT_LAMA, ...URUT_V5])
    expect([...URUT_V5]).toEqual(['masuk', 'status', 'status_wa', 'kredit_beli', 'domi_30', 'nama', 'sumber'])
    expect([...SEGMEN_PENGGUNA]).toEqual([...SEGMEN_LAMA])
    expect([...FILTER_KOLOM]).toEqual(['email', 'wa', 'versi', 'daftar', 'aktif', 'status'])
    expect([...URUT_PRIBADI]).toEqual([...PRIBADI_LAMA, 'kredit_beli', 'domi_30', 'sumber'])
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
    // Lama: email dan WhatsApp naik. v5: teks dan status juga naik (A dulu, Aktif dulu, Pesan masuk dulu).
    expect(URUT_LAMA.filter(k => arahBawaan(k) === 'asc')).toEqual(['email', 'wa'])
    expect(URUT_V5.filter(k => arahBawaan(k) === 'asc')).toEqual(['status', 'status_wa', 'nama', 'sumber'])
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
  it('v5: setiap nilai urut punya kolom, setiap kolom punya nilai urut (TP-02)', () => {
    expect(URUT_PENGGUNA.filter(k => !URUT_BERKOLOM.includes(k))).toEqual([])
    expect(KOLOM_PENGGUNA.map(k => k.urut).sort()).toEqual([...URUT_PENGGUNA].sort())
    // Baris kedua kartu ponsel tetap memakai tambahanUrut untuk tiga urutan yang kolomnya tidak ada di kartu.
    expect(['daftar', 'tx', 'nominal', 'domi_terakhir'].map(k => tambahanUrut(k))).toEqual([null, 'tx', 'nominal', 'domi_terakhir'])
  })
  it('v5: tujuh urutan baru hanya untuk server v5, berhitungan butuh izin, nama butuh kontak dibuka', () => {
    const v5 = { adaDomi: true, tanpaHitungan: false, adaV5: true, terbuka: true }
    expect(opsiUrut(v5).map(o => o.nilai)).toEqual([...URUT_PENGGUNA])
    expect(opsiUrut(v5).filter(o => o.mati)).toEqual([])
    expect(opsiUrut({ ...v5, terbuka: false }).filter(o => o.mati).map(o => o.nilai)).toEqual(['nama'])
    expect(opsiUrut({ ...v5, tanpaHitungan: true, terbuka: false }).filter(o => o.mati).map(o => o.nilai))
      .toEqual([...PRIBADI_LAMA, 'kredit_beli', 'domi_30', 'nama', 'sumber'])
    for (const k of URUT_V5) expect(urutBoleh(k, KEADAAN[0]!), k).toBe(false)
    expect(gantiUrut({ urut: 'daftar', arah: 'desc' }, 'status_wa', v5)).toEqual({ urut: 'status_wa', arah: 'asc', hal: 1 })
    expect(gantiUrut({ urut: 'masuk', arah: 'desc' }, 'masuk', v5)).toEqual({ urut: 'masuk', arah: 'asc', hal: 1 })
    expect(gantiUrut({ urut: 'daftar', arah: 'desc' }, 'nama', { ...v5, terbuka: false })).toBeNull()
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
    // Sejak v5 kolom dibangun dari KOLOM_PENGGUNA: satu filterable: false berlaku untuk semuanya.
    expect(HAL).toMatch(/return kolomUntuk\(tingkatServer\.value\)\.map\(k => \(\{\s+key: k\.key, label: tcf\(LABEL_KOLOM\[k\.key\]\), sortable: urut\(k\.urut\), filterable: false,/)
    expect(HAL).not.toMatch(/v-model:filters/)
  })
})

/** Satu baris daftar sintetis. */
const dto = (ubah: Partial<PenggunaDTO> & Record<string, unknown> = {}): PenggunaDTO => ({
  user_id: '00000000-0000-0000-0000-000000000001', email: 'sar***@contoh.invalid', display_name: '',
  created_at: '2026-10-20T03:00:00Z', last_sign_in: '2026-11-15T03:00:00Z', aktivitas_terakhir: '2026-11-16T02:40:00Z', banned_until: null,
  jumlah_ruang: 3, jumlah_tx: 120, jumlah_nominal: 12_500_000, terbuka: false, total_semua: 1,
  ...ubah,
} as PenggunaDTO)

describe('isi baris dua tingkat', () => {
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

describe('rincian di kepala: kepala didahulukan, daftar jadi cadangan server lama', () => {
  const tanggal = (iso: string | null) => tanggalPendek(iso, 'id')
  const bawaan = keBawaanRinci(kePengguna(dto({
    status_wa: 'lewat', status_wa_pada: '2026-11-10T17:00:00Z', lewat_sebab: 'tanpa_nomor', nomor_ramai: true, kredit_ditahan: true,
    domi_tanya: 5, domi_tanya_30: 2, domi_terakhir: '2026-11-11T17:00:00Z',
  }), 'id'))
  const LAMA = { statusWa: null, domi: null }
  it('server lama dibuka dari daftar: persis yang dibawa dari daftar, tanpa baris jumlah pertanyaan', () => {
    const r = rinciKepala(LAMA, bawaan, { izinPribadi: true, tanggal })
    expect(r.statusWa).toBe(bawaan.statusWa)
    expect(r).toMatchObject({ domiTerakhir: '12 Nov 2026', domiBelumPernah: false, domiTanya: null, domiDariServer: false })
  })
  it('server lama dibuka langsung: keduanya kosong, tanpa nilai karangan', () => {
    for (const b of [null, undefined]) {
      const r = rinciKepala(LAMA, b, { izinPribadi: true, tanggal })
      expect(r).toEqual({ statusWa: null, domiTerakhir: null, domiBelumPernah: false, domiTanya: null, domiDariServer: false })
    }
    expect(rinciKepala(null, null, { izinPribadi: true, tanggal }).domiDariServer).toBe(false)
  })
  it('server lama tanpa izin data pribadi: Domi tidak ditulis walau dibawa dari daftar', () => {
    expect(rinciKepala(LAMA, bawaan, { izinPribadi: false, tanggal })).toMatchObject({ domiTerakhir: null, domiBelumPernah: false, domiTanya: null })
  })
  it('server baru dibuka langsung: status, tanggal, terakhir, dan jumlah dari kepala', () => {
    const r = rinciKepala({ statusWa: { status: 'masuk', padaIso: '2026-11-13T17:00:00Z' }, domi: { tanya: 12, terakhirIso: '2026-11-15T17:00:00Z' } }, null, { izinPribadi: true, tanggal })
    expect(r.statusWa).toEqual({ status: 'masuk', pada: '14 Nov 2026', padaIso: '2026-11-13T17:00:00Z', sebabLewat: null, nomorRamai: false, kreditDitahan: false })
    expect(r).toMatchObject({ domiTerakhir: '16 Nov 2026', domiBelumPernah: false, domiTanya: 12, domiDariServer: true })
  })
  it('server baru menang atas daftar. Tanda tambahan dipinjam dari daftar hanya bila statusnya sama', () => {
    const sama = rinciKepala({ statusWa: { status: 'lewat', padaIso: '2026-11-09T17:00:00Z' }, domi: { tanya: 9, terakhirIso: '2026-11-14T17:00:00Z' } }, bawaan, { izinPribadi: true, tanggal })
    expect(sama.statusWa).toEqual({ status: 'lewat', pada: '10 Nov 2026', padaIso: '2026-11-09T17:00:00Z', sebabLewat: 'tanpa_nomor', nomorRamai: true, kreditDitahan: true })
    expect(sama).toMatchObject({ domiTerakhir: '15 Nov 2026', domiTanya: 9 })
    const beda = rinciKepala({ statusWa: { status: 'masuk', padaIso: '2026-11-16T17:00:00Z' }, domi: { tanya: 9, terakhirIso: null } }, bawaan, { izinPribadi: true, tanggal })
    expect(beda.statusWa).toEqual({ status: 'masuk', pada: '17 Nov 2026', padaIso: '2026-11-16T17:00:00Z', sebabLewat: null, nomorRamai: false, kreditDitahan: false })
    // Ada pertanyaan tetapi tanpa tanggal: garis, bukan tanggal dari daftar.
    expect(beda).toMatchObject({ domiTerakhir: null, domiBelumPernah: false, domiTanya: 9 })
  })
  it('server baru: belum pernah bertanya dibedakan dari tidak boleh tahu', () => {
    const belum = rinciKepala({ statusWa: { status: 'belum', padaIso: null }, domi: { tanya: 0, terakhirIso: null } }, bawaan, { izinPribadi: true, tanggal })
    expect(belum).toMatchObject({ domiTerakhir: null, domiBelumPernah: true, domiTanya: 0, domiDariServer: true })
    expect(belum.statusWa).toMatchObject({ status: 'belum', pada: '—', padaIso: null })
    const tanpaPii = rinciKepala({ statusWa: { status: 'kirim', padaIso: null }, domi: { tanya: null, terakhirIso: null } }, null, { izinPribadi: true, tanggal })
    expect(tanpaPii).toMatchObject({ domiTerakhir: null, domiBelumPernah: false, domiTanya: null, domiDariServer: true })
    // Izin hilang di tengah sesi: hitungan yang masih di memori tidak ditulis.
    const hilang = rinciKepala({ statusWa: { status: 'kirim', padaIso: null }, domi: { tanya: 12, terakhirIso: '2026-11-15T17:00:00Z' } }, bawaan, { izinPribadi: false, tanggal })
    expect(hilang).toMatchObject({ domiTerakhir: null, domiBelumPernah: false, domiTanya: null, domiDariServer: true })
    expect(hilang.statusWa?.status).toBe('kirim')
  })
  it('kamus punya label jumlah pertanyaan di dua bahasa', () => {
    expect(KAMUS_CASHFLOW.id.pengguna.rinci.kali(12, '12')).toBe('12 kali')
    expect(KAMUS_CASHFLOW.en.pengguna.rinci.kali(1, '1')).toBe('1 time')
    expect(KAMUS_CASHFLOW.en.pengguna.rinci.kali(12, '12')).toBe('12 times')
  })
})

describe('halaman daftar: semua kunci jadi kolom, kolom pertama lengket (v5, 19 Nov 2026)', () => {
  it('kolom: semua kunci v5 berurutan, Domi dan kredit untuk v4, Sumber untuk v5 (TP-01, TP-05)', () => {
    expect(KOLOM_PENGGUNA.map(k => k.key)).toEqual([
      'email', 'nama', 'wa', 'status_wa', 'versi', 'status', 'daftar', 'masuk', 'aktif',
      'ruang', 'tx', 'nominal', 'domi', 'domi_30', 'domi_terakhir', 'kredit', 'kredit_beli', 'sumber',
    ])
    expect(KOLOM_PENGGUNA.filter(k => k.server === 5).map(k => k.key)).toEqual(['sumber'])
    // Setiap kolom punya sel sendiri di tabel desktop.
    const sel = new Set([...HAL.matchAll(/#cell-([a-z_0-9]+)=/g)].map(m => m[1]))
    for (const m of HAL.matchAll(/<template v-for="k in \(\[([^\]]*)\] as const\)" :key="k" #\[`cell-\$\{k\}`\]/g)) {
      for (const x of m[1]!.matchAll(/'(\w+)'/g)) sel.add(x[1])
    }
    for (const k of KOLOM_PENGGUNA) expect(sel.has(k.key), k.key).toBe(true)
    // Kolom Pengguna lengket, tabel selebar isinya dan bergulir di dalam bingkainya.
    expect(HAL).toMatch(/<div data-uji="tabel-pengguna" class="cf-tabel-wadah cf-tabel-lebar hidden lg:block">/)
    expect(HAL).toMatch(/\.ca-daftar-pengguna :deep\(\.ca-console-table :is\(th, td\):first-child\) \{\s+position: sticky;\s+left: 0;/)
    expect(HAL).toMatch(/\.ca-daftar-pengguna :deep\(\.ca-console-table\) \{\s+width: max-content;/)
  })
  it('waktu daftar, masuk, aktif, status WhatsApp, dan Domi lewat waktuSel: ber-detik hanya bila baris terbuka (TP-03)', () => {
    const tpl = HAL.slice(HAL.indexOf('<template>'))
    for (const iso of ['row.p.daftarIso', 'row.p.masukTerakhirIso', 'row.p.aktivitasTerakhirIso', 'row.p.statusWa.padaIso', 'row.p.domi.terakhirIso']) {
      expect(tpl, iso).toContain(`waktu(row.p, ${iso})`)
    }
    expect(HAL).toMatch(/const waktu = \(p: Pengguna, iso: string \| null \| undefined\) => waktuSel\(iso, \{ terbuka: p\.terbuka, bahasa: bahasa\.value \}\)/)
  })
  it('rincian pengguna menampilkan keempatnya: cara nomor dibuktikan, terakhir pakai Domi, ID, dan masuk terakhir', () => {
    const kepala = baca('components/cashflow/CashflowKepala360.vue')
    expect(kepala).toMatch(/tcf\('pengguna\.rinci\.caraBukti'\)[\s\S]*?<CashflowStatusWaAkun v-if="rinci\.statusWa" :status="rinci\.statusWa" baris \/>/)
    expect(kepala).toMatch(/tcf\('pengguna\.rinci\.domiTerakhir'\)/)
    expect(kepala).toMatch(/data-uji="rinci-id">\{\{ kepala\.id \}\}/)
    // Kepala v2 terbuka menulis jam sampai detik, selain itu tanggal (waktuKepala).
    expect(kepala).toMatch(/tcf\('pengguna\.masuk'\)[\s\S]*?waktuKepala\(kepala\.masukTerakhirIso\)/)
    expect(kepala).toMatch(/const waktuKepala = \(iso: string \| null \| undefined\): string => \(props\.kepala\?\.terbuka \? waktuDetikWib\(iso, bahasa\.value\) : formatTanggal\(iso \?\? null\)\)/)
    // Terakhir pakai Domi hanya untuk sesi berizin data pribadi: aturannya di rinciKepala.
    expect(kepala).toMatch(/rinciKepala\(props\.kepala, props\.bawaan, \{ izinPribadi: props\.izinPribadi, tanggal: waktuKepala \}\)/)
    // Baris jumlah pertanyaan hanya ditulis bila kepala sendiri yang mengirimnya.
    expect(kepala).toMatch(/<template v-if="rinci\.domiDariServer">[\s\S]*?data-uji="rinci-domi-tanya"/)
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
