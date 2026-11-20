/**
 * Halaman Laporan (adapters/cashflowLaporan.ts) terhadap migrasi CashFlow
 * 20261119110000 (grafik) dan 20261119111000 (saldo), plus admin_laporan_asal
 * dari migrasi aplikasi 1.4.4 bila sudah tergabung.
 *
 * - Bentuk jawaban setiap RPC = DTO contoh di sini (pohon kunci dari
 *   jsonb_build_object terakhir di migrasi), jadi contoh dan adapter tidak
 *   bisa sama-sama salah.
 * - Nilai pilihan halaman (rentang, jenis, mode, urut) = yang diterima server.
 * - Galat server memakai hint yang dikenal console (dilokalkan useCashflowMuat).
 * - Adapter murni: peta 7 x 24, urutan, angka dari string, kunci asal tetap.
 * - Kamus: semua kunci dinamis halaman ada di ID dan EN, tanpa em-dash, titik
 *   koma, atau emoji.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { adaMigrasi, fungsiTerakhir, pohonContoh, pohonDengan, semuaPohonJsonb, urutPohon } from './migrasi'
import {
  ALASAN_LAPORAN_SALDO, ASAL_DUKUNG, BAGIAN_LAPORAN, JAWABAN_ASAL, JENIS_LAPORAN, METRIK_HARIAN, MODE_SALDO, RENTANG_LAPORAN,
  URUT_SALDO, URUT_SALDO_PENGGUNA, URUT_SALDO_RUANG, jenisKeServer, keAsal, keDukung, keHarian, kePetaJam, keSaldo,
  kunciAsalDukung, rupiahRingkasLaporan, seriHarian, tingkatSel, titikIsi, urutSah,
  type AsalDTO, type DukungDTO, type HarianDTO, type JamRamaiDTO, type SaldoDTO,
} from '../../adapters/cashflowLaporan'
import { HINT_22023, HINT_42501 } from '../../composables/cashflow/useCashflowAdmin'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const adaFungsi = (nama: string): boolean => { try { fungsiTerakhir(nama); return true } catch { return false } }

// ── Contoh jawaban server (karangan) ─────────────────────────────────────
const JAM: JamRamaiDTO = {
  hari: 30, dari: '2026-10-19', sampai: '2026-11-17', jenis: null, zona: 'Asia/Jakarta',
  sel: [{ dow: 1, jam: 10, transaksi: 3, orang: 2 }, { dow: 7, jam: 23, transaksi: '5', orang: '1' }],
  total: { transaksi: 8, orang: 3 },
}
const BARIS_HARI = {
  tanggal: '2026-11-17', pendaftar: 2, aktif: 3, pencatat: 2, transaksi: 6, tanya_domi: 5, penanya_domi: 2,
  beli_kredit: 1, beli_rupiah: 29000, dukung_lunas: 2, dukung_rupiah: 75000,
}
const { tanggal: _t, ...RINGKAS_HARI } = BARIS_HARI
const HARIAN: HarianDTO = {
  hari: 7, dari: '2026-11-11', sampai: '2026-11-17',
  baris: [BARIS_HARI, { ...BARIS_HARI, tanggal: '2026-11-11', transaksi: '4', beli_rupiah: '0' }],
  ringkas: RINGKAS_HARI,
}
const DUKUNG: DukungDTO = {
  hari: 30, dari: '2026-10-19', sampai: '2026-11-17', ketuk_pertama: '2026-11-15',
  harian: [{ tanggal: '2026-11-17', ketuk: 3, orang_ketuk: 2, qr: 2, lunas: 2, rupiah: 75000 }],
  asal: [{ kunci: 'setelan', ketuk: 2, orang: 1 }, { kunci: 'beranda', ketuk: 1, orang: 1 }],
  ringkas: { ketuk: 3, orang_ketuk: 2, qr: 2, lunas: 2, rupiah: 75000 },
}
const ASAL: AsalDTO = {
  hari: 30,
  sumber: [{ kunci: 'instagram', orang: 12 }, { kunci: '(tanpa_utm)', orang: 3 }, { kunci: '(lain)', orang: 1 }],
  jawaban: JAWABAN_ASAL.map((kunci, i) => ({ kunci, orang: i })),
  tanpa_data: 41,
}
const ISI = { ruang: 1, dompet: 4, uang_nyata: -160000, piutang: 40000, arsip: 4000, dompet_minus: 1, dompet_minus_total: -300000 }
const RINGKAS_SALDO = {
  jumlah: 5, ruang: 5, dompet: 9, uang_nyata: 602344, piutang: 40000, arsip: 4000, dompet_minus: 1, dompet_minus_total: -300000,
  internal: 1, pribadi: { ruang: 4, uang_nyata: -146656, piutang: 40000 }, usaha: { ruang: 1, uang_nyata: 749000, piutang: 0 },
}
const SALDO_RUANG: SaldoDTO = {
  mode: 'ruang', jenis: null, total: 5, limit: 25, offset: 0, dihitung_pada: '2026-11-18T05:00:00Z',
  baris: [{
    workspace_id: '00000000-0000-4000-8000-000000000101', nama: 'Warung contoh', jenis: 'usaha',
    pemilik_id: '00000000-0000-4000-8000-000000000001', pemilik_email: 'sari@contoh.invalid', pemilik_nama: 'Sari',
    internal: false, jumlah_anggota: 2, jumlah_dompet: 2, uang_nyata: '749000.00', piutang: 0, arsip: 0,
    dompet_minus: 0, dompet_minus_total: 0, terakhir_catat: '2026-11-17T15:15:00Z',
  }],
  ringkas: RINGKAS_SALDO,
}
const SALDO_PENGGUNA: SaldoDTO = {
  mode: 'pengguna', jenis: null, total: 4, limit: 25, offset: 0, dihitung_pada: '2026-11-18T05:00:00Z',
  baris: [{
    user_id: '00000000-0000-4000-8000-000000000001', email: 'sari@contoh.invalid', nama: 'Sari', internal: false,
    pribadi: ISI, usaha: { ...ISI, dompet: 2, uang_nyata: 749000, piutang: 0, arsip: 0, dompet_minus: 0, dompet_minus_total: 0 },
    total: { ...ISI, ruang: 2, dompet: 6, uang_nyata: 589000 }, ruang_lain: 0, terakhir_catat: null,
  }],
  ringkas: RINGKAS_SALDO,
}

/** Pasangan errcode:hint di badan fungsi, urut, tanpa ganda. */
const galatDi = (badan: string): string[] =>
  [...new Set([...badan.matchAll(/errcode\s*=\s*'(\w+)'(?:,\s*hint\s*=\s*'([\w-]+)')?/g)].map(m => `${m[1]}:${m[2] ?? ''}`))].sort()

describe.skipIf(!adaMigrasi)('kontrak RPC Laporan = migrasi CashFlow', () => {
  it('tiga RPC grafik di 20261119110000 (harian diganti 20261119150000), saldo di 20261119111000, semuanya definer dengan search_path', () => {
    /* admin_laporan_harian diganti 20261119150000 (hitungan Domi tanpa giliran
       lokal). Bentuk jawabannya tetap, diperiksa uji di bawah. */
    const berkas: Record<string, RegExp> = {
      admin_laporan_jam_ramai: /^20261119110000_/,
      admin_laporan_harian: /^20261119150000_/,
      admin_laporan_dukung: /^20261119110000_/,
    }
    for (const [n, pola] of Object.entries(berkas)) {
      expect(fungsiTerakhir(n).berkas, n).toMatch(pola)
      expect(fungsiTerakhir(n).kepala, n).toMatch(/returns jsonb\s+language plpgsql\s+stable\s+security definer\s+set search_path = public/i)
    }
    expect(fungsiTerakhir('admin_laporan_saldo').berkas).toMatch(/^20261119111000_/)
    expect(fungsiTerakhir('admin_laporan_saldo').kepala).toMatch(/returns jsonb language plpgsql volatile security definer set search_path = public/i)
  })

  it('bentuk jawaban jam ramai, harian, dukung = DTO contoh', () => {
    expect(urutPohon(pohonDengan(fungsiTerakhir('admin_laporan_jam_ramai').badan, 'sel', 'total'))).toEqual(urutPohon(pohonContoh(JAM)))
    expect(urutPohon(pohonDengan(fungsiTerakhir('admin_laporan_harian').badan, 'baris', 'ringkas'))).toEqual(urutPohon(pohonContoh(HARIAN)))
    expect(urutPohon(pohonDengan(fungsiTerakhir('admin_laporan_dukung').badan, 'harian', 'asal'))).toEqual(urutPohon(pohonContoh(DUKUNG)))
  })

  it('bentuk jawaban saldo mode ruang dan mode pengguna = DTO contoh', () => {
    const pohon = semuaPohonJsonb(fungsiTerakhir('admin_laporan_saldo').badan).filter(p => 'mode' in p && 'baris' in p)
    expect(pohon).toHaveLength(2)
    expect(urutPohon(pohon[0]!)).toEqual(urutPohon(pohonContoh(SALDO_RUANG)))
    expect(urutPohon(pohon[1]!)).toEqual(urutPohon(pohonContoh(SALDO_PENGGUNA)))
  })

  it.skipIf(!adaFungsi('admin_laporan_asal'))('bentuk jawaban asal pengguna = DTO contoh (migrasi aplikasi 1.4.4)', () => {
    expect(urutPohon(pohonDengan(fungsiTerakhir('admin_laporan_asal').badan, 'sumber', 'jawaban'))).toEqual(urutPohon(pohonContoh(ASAL)))
    const { badan } = fungsiTerakhir('admin_laporan_asal')
    const kunci = /unnest\(array\[([^\]]+)\]\)/.exec(badan)?.[1] ?? ''
    expect([...kunci.matchAll(/'([a-z_]+)'/g)].map(m => m[1])).toEqual([...JAWABAN_ASAL])
  })

  it('rentang 7..90 dan jenis pribadi|usaha sama dengan server', () => {
    for (const n of ['admin_laporan_jam_ramai', 'admin_laporan_harian', 'admin_laporan_dukung']) {
      expect(fungsiTerakhir(n).badan, n).toMatch(/if v_hari < 7 or v_hari > 90 then/)
    }
    expect(RENTANG_LAPORAN.map(Number).every(h => h >= 7 && h <= 90)).toBe(true)
    expect(fungsiTerakhir('admin_laporan_jam_ramai').badan).toMatch(/p_jenis not in \('pribadi', 'usaha'\)/)
    expect(JENIS_LAPORAN.map(jenisKeServer)).toEqual([null, 'pribadi', 'usaha'])
  })

  it('mode dan urut saldo = daftar server, anggota hanya mode ruang, ruang_lain hanya mode pengguna', () => {
    const { badan } = fungsiTerakhir('admin_laporan_saldo')
    const urut = /coalesce\(p_urut, ''\) not in \(([^)]*)\)/.exec(badan)?.[1] ?? ''
    expect([...urut.matchAll(/'([a-z_]+)'/g)].map(m => m[1])).toEqual([...URUT_SALDO])
    const mode = /coalesce\(p_mode, ''\) not in \(([^)]*)\)/.exec(badan)?.[1] ?? ''
    expect([...mode.matchAll(/'([a-z_]+)'/g)].map(m => m[1])).toEqual([...MODE_SALDO])
    expect(badan).toMatch(/p_urut = 'anggota' and p_mode <> 'ruang'/)
    expect(badan).toMatch(/p_urut = 'ruang_lain' and p_mode <> 'pengguna'/)
    expect(URUT_SALDO_RUANG).not.toContain('ruang_lain')
    expect(URUT_SALDO_PENGGUNA).not.toContain('anggota')
  })

  it('izin: grafik cukup view, saldo menuntut pii dan menulis audit laporan_saldo', () => {
    for (const n of ['admin_laporan_jam_ramai', 'admin_laporan_harian', 'admin_laporan_dukung']) {
      const { badan } = fungsiTerakhir(n)
      expect(badan, n).toMatch(/konsol_boleh\('cashflow:view'\)/)
      expect(badan, n).not.toMatch(/cashflow:pii|admin_audit|admin_catat_baca/)
      expect(badan, n).toMatch(/laporan_akun_dalam_inti\(\)/)
    }
    const { badan } = fungsiTerakhir('admin_laporan_saldo')
    expect(badan).toMatch(/konsol_boleh\('cashflow:pii'\)/)
    expect(badan).toMatch(/admin_catat_baca\(v_k, 'laporan_saldo', 'daftar', null/)
    expect(ALASAN_LAPORAN_SALDO.trim().length).toBeGreaterThanOrEqual(8)
  })

  it('setiap galat memakai hint yang dikenal console', () => {
    expect(galatDi(fungsiTerakhir('admin_laporan_jam_ramai').badan)).toEqual(['22023:hari', '22023:saringan', '42501:', '42501:izin-kurang'])
    expect(galatDi(fungsiTerakhir('admin_laporan_harian').badan)).toEqual(['22023:hari', '42501:', '42501:izin-kurang'])
    expect(galatDi(fungsiTerakhir('admin_laporan_dukung').badan)).toEqual(['22023:hari', '42501:', '42501:izin-kurang'])
    expect(galatDi(fungsiTerakhir('admin_laporan_saldo').badan)).toEqual(['22023:alasan-pendek', '22023:saringan', '42501:', '42501:izin-kurang'])
    for (const h of ['hari', 'saringan', 'alasan-pendek']) expect(HINT_22023).toContain(h)
    expect(HINT_42501['izin-kurang']).toBe('izin')
  })
})

describe('adapter Laporan', () => {
  it('peta jam: selalu 7 x 24, sel kosong nol, angka string terbaca, sel di luar rentang dibuang', () => {
    const p = kePetaJam({ ...JAM, sel: [...JAM.sel, { dow: 8, jam: 1, transaksi: 9, orang: 1 }, { dow: 2, jam: 24, transaksi: 9, orang: 1 }] })
    expect(p.sel).toHaveLength(7)
    expect(p.sel.every(b => b.length === 24)).toBe(true)
    expect(p.sel[0]![10]).toEqual({ dow: 1, jam: 10, transaksi: 3, orang: 2 })
    expect(p.sel[6]![23]).toEqual({ dow: 7, jam: 23, transaksi: 5, orang: 1 })
    expect(p.maks).toBe(5)
    expect(p.puncak).toEqual({ dow: 7, jam: 23, transaksi: 5, orang: 1 })
    expect(p.perHari).toEqual([3, 0, 0, 0, 0, 0, 5])
    expect(p.perJam[10]).toBe(3)
    expect(p.total).toEqual({ transaksi: 8, orang: 3 })
    const kosong = kePetaJam(null)
    expect(kosong.puncak).toBeNull()
    expect(kosong.maks).toBe(0)
  })

  it('tingkat warna seperempat dari sel tersibuk', () => {
    expect([0, 1, 25, 26, 50, 51, 75, 76, 100].map(v => tingkatSel(v, 100))).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4])
    expect(tingkatSel(3, 0)).toBe(0)
  })

  it('harian: urut tanggal naik, angka string terbaca, seri per metrik', () => {
    const h = keHarian(HARIAN)
    expect(h.baris.map(b => b.tanggal)).toEqual(['2026-11-11', '2026-11-17'])
    expect(h.baris[0]!.transaksi).toBe(4)
    expect(seriHarian(h, 'transaksi')).toEqual([4, 6])
    expect(METRIK_HARIAN.every(m => seriHarian(h, m).length === 2)).toBe(true)
    expect(h.ringkas.dukungRupiah).toBe(75000)
    expect(titikIsi([0, 2, 0, 1])).toBe(2)
  })

  it('dukung: tanggal pertama, asal, ringkas', () => {
    const d = keDukung(DUKUNG)
    expect(d.ketukPertama).toBe('2026-11-15')
    expect(d.asal).toEqual([{ kunci: 'setelan', ketuk: 2, orang: 1 }, { kunci: 'beranda', ketuk: 1, orang: 1 }])
    expect(d.ringkas).toEqual({ ketuk: 3, orangKetuk: 2, qr: 2, lunas: 2, rupiah: 75000 })
    expect(keDukung({ ...DUKUNG, ketuk_pertama: null }).ketukPertama).toBeNull()
    expect(kunciAsalDukung('setelan')).toBe('setelan')
    expect(kunciAsalDukung('beranda')).toBeNull()
  })

  it('asal: tujuh jawaban dengan urutan tetap walau server mengirim sebagian, kunci khusus dikenali', () => {
    const a = keAsal({ ...ASAL, jawaban: [{ kunci: 'tiktok', orang: '4' }] })
    expect(a.jawaban.map(j => j.kunci)).toEqual([...JAWABAN_ASAL])
    expect(a.jawaban.find(j => j.kunci === 'tiktok')!.orang).toBe(4)
    expect(a.jawaban.find(j => j.kunci === 'instagram')!.orang).toBe(0)
    const b = keAsal(ASAL)
    expect(b.sumber.map(s => s.khusus)).toEqual([null, 'tanpa_utm', 'lain'])
    expect(b.adaReferrer).toBe(16)
    expect(b.menjawab).toBe(0 + 1 + 2 + 3 + 4 + 5)
    expect(b.tanpaData).toBe(41)
  })

  it('saldo: mode ruang dan pengguna, numeric string terbaca, ringkas pribadi dan usaha', () => {
    const r = keSaldo(SALDO_RUANG)
    expect(r.mode).toBe('ruang')
    expect(r.pengguna).toEqual([])
    expect(r.ruang[0]!.isi.uangNyata).toBe(749000)
    expect(r.ruang[0]!.jenis).toBe('usaha')
    expect(r.ringkas.isi.uangNyata).toBe(602344)
    expect(r.ringkas.usaha).toEqual({ ruang: 1, uangNyata: 749000, piutang: 0 })
    const p = keSaldo(SALDO_PENGGUNA)
    expect(p.ruang).toEqual([])
    expect(p.pengguna[0]!.total.uangNyata).toBe(589000)
    expect(p.pengguna[0]!.pribadi.dompetMinusTotal).toBe(-300000)
    expect(p.pengguna[0]!.terakhir).toBeNull()
    expect(urutSah('ruang', 'anggota')).toBe(true)
    expect(urutSah('pengguna', 'anggota')).toBe(false)
    expect(urutSah('pengguna', 'ruang_lain')).toBe(true)
  })

  it('rupiah ringkas: satuan Indonesia dan Inggris, minus dipertahankan', () => {
    expect(rupiahRingkasLaporan(1_250_000)).toBe('Rp 1,3 jt')
    expect(rupiahRingkasLaporan(-300_000)).toBe('−Rp 300 rb')
    expect(rupiahRingkasLaporan(7_412_905_500, 'en')).toBe('Rp 7.4 B')
    expect(rupiahRingkasLaporan(950)).toBe('Rp 950')
  })
})

describe('kamus dan halaman Laporan', () => {
  const ambil = (b: 'id' | 'en', jalur: string): unknown =>
    jalur.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), KAMUS_CASHFLOW[b])

  it('kunci dinamis halaman ada di ID dan EN', () => {
    const jalur = [
      'nav.laporan',
      ...BAGIAN_LAPORAN.map(b => `laporan.bagian.${b}`),
      ...JENIS_LAPORAN.map(j => `laporan.jam.jenis.${j}`),
      ...MODE_SALDO.map(m => `laporan.saldo.mode.${m}`),
      ...URUT_SALDO.map(u => `laporan.saldo.urutOpsi.${u}`),
      ...['pribadi', 'usaha'].map(j => `laporan.saldo.jenis.${j}`),
      ...METRIK_HARIAN.map(m => `laporan.harian.metrik.${m}`),
      ...ASAL_DUKUNG.map(a => `laporan.dukung.asal.${a}`),
      ...JAWABAN_ASAL.map(j => `laporan.asal.jawaban.${j}`),
      ...['tanpa_utm', 'lain'].map(k => `laporan.asal.sumberKhusus.${k}`),
    ]
    const hilang = jalur.flatMap(k => (['id', 'en'] as const).filter(b => ambil(b, k) === undefined).map(b => `${b}:${k}`))
    expect(hilang).toEqual([])
    for (const b of ['id', 'en'] as const) {
      expect((ambil(b, 'laporan.jam.hariPendek') as string[]).length).toBe(7)
      expect((ambil(b, 'laporan.jam.hariPanjang') as string[]).length).toBe(7)
    }
  })

  it('teks Laporan tanpa em-dash, titik koma, atau emoji, ID dan EN berkunci sama', () => {
    const teks: string[] = []
    const kumpul = (v: unknown): void => {
      if (typeof v === 'string') teks.push(v)
      else if (typeof v === 'function') teks.push(String((v as (...a: unknown[]) => unknown)('1', '2', '3', '4')))
      else if (Array.isArray(v)) v.forEach(kumpul)
      else if (v && typeof v === 'object') Object.values(v).forEach(kumpul)
    }
    const kunci = (v: unknown, awal = ''): string[] => (v && typeof v === 'object' && !Array.isArray(v)
      ? Object.entries(v).flatMap(([k, x]) => kunci(x, `${awal}${k}.`)) : [awal])
    kumpul(ambil('id', 'laporan'))
    kumpul(ambil('en', 'laporan'))
    expect(teks.length).toBeGreaterThan(150)
    for (const t of teks) expect(t, t).not.toMatch(/[—–;]|\p{Extended_Pictographic}/u)
    expect(kunci(ambil('id', 'laporan')).sort()).toEqual(kunci(ambil('en', 'laporan')).sort())
  })

  it('URL halaman tidak membawa teks cari, dan saldo memakai alasan tetap dari adapter', () => {
    const halaman = readFileSync(join(AKAR, 'pages/console/cashflow/laporan.vue'), 'utf8')
    const skema = /const SKEMA = \{([\s\S]*?)\} as const satisfies SkemaQuery/.exec(halaman)?.[1] ?? ''
    expect([...skema.matchAll(/^\s*(\w+):/gm)].map(m => m[1])).toEqual(['bagian', 'hari', 'jenis', 'mode', 'urut', 'arah', 'butir', 'hal'])
    const admin = readFileSync(join(AKAR, 'composables/cashflow/useCashflowAdmin.ts'), 'utf8')
    expect(admin).toMatch(/'admin_laporan_saldo', \{[\s\S]*?p_alasan: ALASAN_LAPORAN_SALDO,/)
  })

  it('peta jam memakai token tema, tanpa warna mentah', () => {
    const peta = readFileSync(join(AKAR, 'components/cashflow/CashflowPetaJam.vue'), 'utf8')
    expect(peta).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(|bg-(?:emerald|green|red|slate)-\d/)
    expect(peta).toMatch(/var\(--ca-emerald-text\)/)
  })
})
