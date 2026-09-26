/**
 * Kontrak adapter Fase 2 (Ruang 360) terhadap migrasi 0094.
 *
 * Contoh jawaban ditulis sebagai TEKS JSON persis seperti yang dikirim
 * PostgREST; kuncinya dibandingkan dengan jsonb_build_object / `returns table`
 * di definisi TERAKHIR fungsinya. Contoh yang menyimpang dari server membuat
 * uji merah. Bila migrasi 0094 belum ada di folder, bagian kontrak dilewati
 * (terlihat "skipped"); konversi domain tetap diuji.
 */
import { describe, expect, it } from 'vitest'
import {
  adaMigrasiNomor, fungsiTerakhir, kolomKembalian, parameterFungsi, pohonContoh, pohonDengan, pohonJsonb, semuaPohonJsonb, urutPohon,
} from './migrasi'
import {
  keKepalaRuang, keRuang360, keDompet, keRingkasDompet, kelompokkanDompet, keMutasiBaris, kePemeriksaan, keSampahRuang, kursorSampahDariUrl,
  tujuanSelidiki, alasanOtomatisRuang, alasanSelidiki,
  RANAH_RUANG, RANAH_BUKAN_RUANG, RANAH_TAB_RUANG, TAB_RUANG, SKENARIO_RUANG, SKENARIO_SELIDIKI, STATUS_UNDANGAN,
  type KepalaRuangDTO, type Ruang360DTO, type DompetRuangDTO, type MutasiDompetDTO, type PeriksaRuangDTO, type SampahRuangDTO,
} from '../../adapters/cashflowRuang'
import { keHasilCari, CEK_TRANSAKSI, type CariDTO } from '../../adapters/cashflowBuku'
import { keKasus, keBarisKasus, kurangDariKasus, POLA_SKENARIO, MIN_ALASAN, RANAH_FASE1, type KasusDTO, type DaftarKasusDTO } from '../../adapters/cashflowKasus'
import { petakanGalat } from '../../composables/cashflow/useCashflowAdmin'

const ADA = adaMigrasiNomor('0094')
const urut = (xs: readonly string[]) => [...xs].sort()
const kunciAtas = (o: object) => urut(Object.keys(o))
const sama = (contoh: unknown, server: ReturnType<typeof pohonJsonb>) =>
  expect(urutPohon(pohonContoh(contoh))).toEqual(urutPohon(server))
const W = '5a60c1e2-2d3a-4b5c-8d7e-9f0a1b2c3d4e'
const U = '3f0c2a4e-8b1d-4c6a-9e2f-1a2b3c4d5e6f'
const U2 = '7c8d9e0f-1a2b-4c3d-9e4f-5a6b7c8d9e0f'
const K = 'd1e6aa00-1111-4111-8111-111111111111'

// ── Kepala ruang (T0) ────────────────────────────────────────────────────
const KEPALA = `{"workspace_id": "${W}", "nama": "Wa······", "jenis": "usaha", "pemilik_email": "ded***@gmail.com",
  "dibuat": "2026-01-02T03:04:05+00:00", "jumlah_anggota": 2, "jumlah_transaksi": 120, "jumlah_dompet": 3, "akses_30hari": 4}`

describe('kontrak KepalaRuangDTO ↔ admin_ruang_kepala', () => {
  it.skipIf(!ADA)('contoh = kunci server; tanpa pemilik_id', () => {
    const { badan } = fungsiTerakhir('admin_ruang_kepala')
    const p = pohonDengan(badan, 'akses_30hari')
    sama(JSON.parse(KEPALA), p)
    expect(Object.keys(p)).not.toContain('pemilik_id')
  })
  it('keKepalaRuang: hitungan null = sesi tanpa pii (bukan 0)', () => {
    const d = JSON.parse(KEPALA) as KepalaRuangDTO
    expect(keKepalaRuang(d)).toMatchObject({ id: W, namaTersamar: 'Wa······', anggota: 2, transaksi: 120, dompet: 3, akses30: 4, pii: true })
    const v = keKepalaRuang({ ...d, jumlah_anggota: null, jumlah_transaksi: null, jumlah_dompet: null })
    expect(v).toMatchObject({ anggota: null, transaksi: null, dompet: null, pii: false })
  })
})

// ── Ruang 360 ────────────────────────────────────────────────────────────
const R360 = `{"kasus": "${K}",
  "ruang": {"workspace_id": "${W}", "nama": "Warung Bu Sri", "jenis": "usaha", "owner_nick": "Sri", "aturan_hapus": "pemilik",
    "fitur_patungan": false, "ada_cara_bayar": true, "ada_qris": false, "pemilik_id": "${U}", "dibuat": "2026-01-02T03:04:05+00:00"},
  "hitung": {"anggota": 2, "bekas_anggota": 1, "undangan_aktif": 1, "transaksi": 120, "dompet": 3, "jejak": 400, "sampah": 5},
  "agregat": {"transaksi": 120, "masuk_bersih": "1500000.00", "keluar_bersih": 250000, "terakhir_catat": "2026-09-20T01:00:00+00:00"},
  "anggota": [{"user_id": "${U}", "email": "sri***@gmail.com", "peran": "owner", "joined_at": "2026-01-02T03:04:05+00:00",
    "pemilik": true, "tx_oleh_dia": 100, "terakhir_catat_dia": "2026-09-20T01:00:00+00:00"}],
  "bekas": [{"user_id": "${U2}", "email": null, "tx_oleh_dia": 0}],
  "undangan": [{"id": "aa000000-0000-4000-8000-000000000001", "peran": "anggota", "status": "aktif", "ada_label": true,
    "target_email": "bud***@gmail.com", "diundang_oleh": "${U}", "diterima_oleh": null, "dibuat": "2026-09-01T00:00:00+00:00",
    "kedaluwarsa": "2026-09-30T00:00:00+00:00", "diterima_pada": null, "dicabut_pada": null, "ditolak_pada": null}]}`

describe('kontrak Ruang360DTO ↔ admin_ruang_360', () => {
  it.skipIf(!ADA)('jawaban, ruang, hitung, agregat, anggota, bekas, undangan = kunci server; tanpa code/label/cara_bayar/qris_path', () => {
    const { badan } = fungsiTerakhir('admin_ruang_360')
    const d = JSON.parse(R360) as Ruang360DTO
    const atas = pohonDengan(badan, 'undangan', 'hitung')
    expect(kunciAtas(d)).toEqual(urut(Object.keys(atas)))
    sama(d.ruang, atas.ruang!)
    sama(d.hitung, pohonDengan(badan, 'bekas_anggota', 'undangan_aktif'))
    sama(d.agregat, pohonDengan(badan, 'masuk_bersih', 'terakhir_catat'))
    sama(d.anggota[0], pohonDengan(badan, 'terakhir_catat_dia'))
    const bekas = semuaPohonJsonb(badan).find(p => 'user_id' in p && 'tx_oleh_dia' in p && !('peran' in p))
    expect(bekas).toBeDefined()
    sama(d.bekas[0], bekas!)
    sama(d.undangan[0], pohonDengan(badan, 'ada_label'))
    for (const k of ["'code'", "'label'", "'cara_bayar'", "'qris_path'"]) expect(badan).not.toContain(k)
  })
  it.skipIf(!ADA)('status undangan = himpunan server; ≤ 100 undangan', () => {
    const { badan } = fungsiTerakhir('admin_ruang_360')
    const potong = badan.slice(badan.indexOf("'status'"), badan.indexOf("'ada_label'"))
    const status = new Set([...potong.matchAll(/then\s+'([a-z]+)'|else\s+'([a-z]+)'/g)].map(m => (m[1] ?? m[2])!))
    expect([...status].sort()).toEqual([...STATUS_UNDANGAN].sort())
    expect(badan).toMatch(/limit\s+100\b/)
  })
  it('keRuang360: numeric berteks terbaca; bekas tanpa email = akun hilang; agregat null tanpa ranah transaksi', () => {
    const d = JSON.parse(R360) as Ruang360DTO
    const r = keRuang360(d)
    expect(r.agregat).toMatchObject({ masukBersih: 1500000, keluarBersih: 250000, transaksi: 120 })
    expect(r.ruang).toMatchObject({ nama: 'Warung Bu Sri', adaCaraBayar: true, adaQris: false, pemilikId: U })
    expect(r.anggota[0]).toMatchObject({ id: U, pemilik: true, tx: 100 })
    expect(r.bekas[0]).toMatchObject({ id: U2, akunAda: false, tx: 0 })
    expect(r.undangan[0]).toMatchObject({ status: 'aktif', adaLabel: true, selesaiIso: null })
    expect(keRuang360({ ...d, agregat: null }).agregat).toBeNull()
    expect(keRuang360({ ...d, undangan: [{ ...d.undangan[0]!, status: 'aneh' }] }).undangan[0]!.status).toBeNull()
  })
})

// ── Dompet ───────────────────────────────────────────────────────────────
const DOMPET = `{"kasus": "${K}", "baris": [{"id": "bb000000-0000-4000-8000-000000000001", "workspace_id": "${W}", "nama": "Kas",
  "tipe": "tunai", "warna": "#123456", "opening_balance": "100000.00", "credit_limit": null, "archived": false,
  "dibuat": "2026-01-02T03:04:05+00:00", "pembuat": "${U}", "mutasi": -25000, "saldo": "75000.00", "jumlah_transaksi": 12,
  "terakhir_tanggal": "2026-09-28", "masa_depan": 1}],
  "ringkas": [{"workspace_id": "${W}", "jumlah_dompet": 3, "aset": "75000.00", "piutang": 0, "arsip": 1}]}`

describe('kontrak DompetRuangDTO ↔ admin_dompet_ruang / admin_dompet_bangun', () => {
  it.skipIf(!ADA)('baris = admin_dompet_bangun; ringkas & jawaban = admin_dompet_ruang', () => {
    const d = JSON.parse(DOMPET) as DompetRuangDTO
    sama(d.baris[0], pohonDengan(fungsiTerakhir('admin_dompet_bangun').badan, 'saldo', 'masa_depan'))
    const { badan } = fungsiTerakhir('admin_dompet_ruang')
    sama(d.ringkas[0], pohonDengan(badan, 'jumlah_dompet', 'aset'))
    expect(kunciAtas(d)).toEqual(urut(Object.keys(pohonJsonb(badan.slice(badan.lastIndexOf('return jsonb_build_object'))))))
  })
  it.skipIf(!ADA)('saldo = saldo awal + mutasi (acuan yang sama dengan uji SQL kesetaraan saldo)', () => {
    expect(fungsiTerakhir('admin_dompet_bangun').badan).toMatch(/'saldo',\s+w\.opening_balance \+ m\.mutasi/)
  })
  it('keDompet / keRingkasDompet: numeric berteks terbaca', () => {
    const d = JSON.parse(DOMPET) as DompetRuangDTO
    expect(keDompet(d.baris[0]!)).toMatchObject({ saldoAwal: 100000, mutasi: -25000, saldo: 75000, transaksi: 12, masaDepan: 1, piutang: false, arsip: false, batasKredit: null })
    expect(keDompet({ ...d.baris[0]!, tipe: 'piutang' }).piutang).toBe(true)
    expect(keRingkasDompet(d.ringkas[0]!)).toEqual({ ruangId: W, jumlah: 3, aset: 75000, piutang: 0, arsip: 1 })
  })
})

describe('kelompokkanDompet: keterangan Terarsip', () => {
  const d = JSON.parse(DOMPET) as DompetRuangDTO
  const W9 = 'cc000000-0000-4000-8000-000000000009'
  const kas = keDompet(d.baris[0]!)
  it('dompet terarsip yang saldonya saling meniadakan (Σ 0) tetap ditandai adaArsip', () => {
    const arsip = [{ ...kas, id: 'a1', arsip: true, saldo: 5000 }, { ...kas, id: 'a2', arsip: true, saldo: -5000 }]
    const g = kelompokkanDompet([{ ruangId: W, jumlah: 3, aset: 75000, piutang: 0, arsip: 0 }], [kas, ...arsip])
    expect(g[0]).toMatchObject({ adaArsip: true, r: { arsip: 0 } })
    expect(g[0]!.dompet.map(x => x.id)).toEqual([kas.id, 'a1', 'a2'])
  })
  it('tanpa dompet terarsip → tidak ada keterangan, walau ringkas.arsip bukan 0; dompet dikelompokkan per ruang', () => {
    const lain = { ...kas, id: 'x9', ruangId: W9, arsip: true }
    const g = kelompokkanDompet([{ ruangId: W, jumlah: 1, aset: 75000, piutang: 0, arsip: 1250000 }, { ruangId: W9, jumlah: 1, aset: 0, piutang: 0, arsip: 0 }], [kas, lain])
    expect(g.map(x => [x.r.ruangId, x.adaArsip, x.dompet.length])).toEqual([[W, false, 1], [W9, true, 1]])
  })
})

const MUTASI_TOP = `{"kasus": "${K}", "dompet": {"id": "bb000000-0000-4000-8000-000000000001", "workspace_id": "${W}", "nama": "Kas", "tipe": "tunai",
  "opening_balance": 100000, "credit_limit": null, "archived": false, "saldo": 75000}, "baris": [], "kursor_berikut": null, "total": 0, "halaman_pertama": true}`

describe('kontrak MutasiDompetDTO ↔ admin_mutasi_dompet', () => {
  it.skipIf(!ADA)('jawaban & dompet = kunci server; baris = transaksi_bangun + saldo_setelah', () => {
    const { badan } = fungsiTerakhir('admin_mutasi_dompet')
    const d = JSON.parse(MUTASI_TOP) as MutasiDompetDTO
    const atas = pohonDengan(badan, 'dompet', 'halaman_pertama')
    expect(kunciAtas(d)).toEqual(urut(Object.keys(atas)))
    sama(d.dompet, atas.dompet!)
    expect(badan).toContain("jsonb_build_object('saldo_setelah'")
  })
  it('keMutasiBaris membawa saldo setelah baris', () => {
    const b = keMutasiBaris({
      id: 'cc000000-0000-4000-8000-000000000001', workspace_id: W, kind: 'expense', amount: 25000, occurred_at: '2026-09-20',
      occurred_time: null, created_at: '2026-09-20T01:00:00+00:00', wallet_id: null, dompet: 'Kas', category_id: null, kategori: null,
      transfer_group: null, group_id: null, schedule_id: null, cicilan_ke: null, user_id: U, ada_catatan: false, ada_lampiran: false,
      masa_depan: false, saldo_setelah: '75000.00',
    } as unknown as Parameters<typeof keMutasiBaris>[0])
    expect(b.saldoSetelah).toBe(75000)
  })
})

// ── Pemeriksaan ──────────────────────────────────────────────────────────
describe('kontrak PeriksaRuangDTO ↔ admin_periksa_ruang', () => {
  const P = `{"kasus": "${K}", "workspace_id": "${W}", "cek": [{"cek": "transfer_pincang", "jumlah": 2}, {"cek": "masa_depan", "jumlah": 0},
    {"cek": "calon_ganda", "jumlah": 0}, {"cek": "dompet_arsip", "jumlah": 1}], "jumlah_bermasalah": 3, "diperiksa_pada": "2026-09-26T05:00:00+00:00"}`
  it.skipIf(!ADA)('jawaban = kunci server; jenis cek = CEK_TRANSAKSI (tautan ?cek= dikenal tab Transaksi)', () => {
    const { badan } = fungsiTerakhir('admin_periksa_ruang')
    const d = JSON.parse(P) as PeriksaRuangDTO
    expect(kunciAtas(d)).toEqual(urut(Object.keys(pohonDengan(badan, 'jumlah_bermasalah'))))
    sama(d.cek[0], pohonDengan(badan, 'cek', 'jumlah'))
    const cek = /foreach\s+c\s+in\s+array\s+array\[([^\]]+)\]/.exec(badan)?.[1] ?? ''
    expect(urut([...cek.matchAll(/'([a-z_]+)'/g)].map(m => m[1]!))).toEqual(urut(CEK_TRANSAKSI))
  })
  it('kePemeriksaan: cek tak dikenal dibuang', () => {
    const d = JSON.parse(P) as PeriksaRuangDTO
    const p = kePemeriksaan({ ...d, cek: [...d.cek, { cek: 'baru', jumlah: 9 }] })
    expect(p.baris.map(b => b.cek)).toEqual(['transfer_pincang', 'masa_depan', 'calon_ganda', 'dompet_arsip'])
    expect(p.bermasalah).toBe(3)
  })
})

// ── Sampah ruang ─────────────────────────────────────────────────────────
const SAMPAH = `{"kasus": "${K}", "baris": [{"id": "dd000000-0000-4000-8000-000000000001", "tx_id": "cc000000-0000-4000-8000-000000000001",
  "workspace_id": "${W}", "kind": "expense", "amount": "25000.00", "occurred_at": "2026-09-20", "dompet_id": null, "dompet_nama": "Kas",
  "kategori_id": null, "kategori": null, "transfer_group": null, "group_id": null, "schedule_id": null, "ada_foto": false,
  "ada_catatan": true, "ada_judul": false, "pencatat": "${U}", "dihapus_oleh": "${U2}", "dihapus_pada": "2026-09-21T01:00:00+00:00",
  "dipulihkan_oleh": null, "dipulihkan_pada": null, "status": "dihapus"}],
  "kursor_berikut": {"d": "2026-09-21T01:00:00+00:00", "i": "dd000000-0000-4000-8000-000000000001"}, "total": 5, "halaman_pertama": true}`

describe('kontrak SampahRuangDTO ↔ admin_sampah_ruang', () => {
  it.skipIf(!ADA)('baris, kursor, jawaban = kunci server; tanpa isi/note/judul', () => {
    const { badan } = fungsiTerakhir('admin_sampah_ruang')
    const d = JSON.parse(SAMPAH) as SampahRuangDTO
    const baris = pohonDengan(badan, 'dihapus_pada', 'status')
    sama(d.baris[0], baris)
    for (const k of ['isi', 'note', 'judul']) expect(Object.keys(baris)).not.toContain(k)
    sama(d.kursor_berikut, pohonDengan(badan, 'd', 'i'))
    expect(kunciAtas(d)).toEqual(urut(Object.keys(pohonJsonb(badan.slice(badan.lastIndexOf('return jsonb_build_object'))))))
  })
  it('keSampahRuang & kursor sampah dari URL', () => {
    const d = JSON.parse(SAMPAH) as SampahRuangDTO
    expect(keSampahRuang(d.baris[0]!)).toMatchObject({ jenis: 'keluar', nominal: 25000, adaCatatan: true, dipulihkan: false, dihapusOleh: U2 })
    expect(keSampahRuang({ ...d.baris[0]!, status: 'dipulihkan' }).dipulihkan).toBe(true)
    const teks = Buffer.from(JSON.stringify(d.kursor_berikut)).toString('base64url')
    expect(kursorSampahDariUrl(teks)).toEqual(d.kursor_berikut)
    expect(kursorSampahDariUrl(Buffer.from('{}').toString('base64url'))).toBeNull()
    expect(kursorSampahDariUrl(Buffer.from('{"d":"x","i":"y"}').toString('base64url'))).toBeNull()
    expect(kursorSampahDariUrl('')).toBeNull()
  })
})

// ── Aktivitas v2 + Selidiki ──────────────────────────────────────────────
describe('kontrak aktivitas v2 & admin_kasus_buka_dari_peristiwa', () => {
  it.skipIf(!ADA)('aktivitas v2 hanya id, jenis, rentang, tanggal (tanpa ruang, aktor, pada)', () => {
    expect(kolomKembalian('admin_aktivitas_terbaru_v2')).toEqual(['id', 'jenis', 'rentang_nominal', 'tanggal'])
  })
  it.skipIf(!ADA)('Selidiki: parameter & bawaan server; peristiwa_id hanya bila kasus terbuka', () => {
    expect(parameterFungsi('admin_kasus_buka_dari_peristiwa').map(p => p.nama)).toEqual(['p_peristiwa', 'p_preset', 'p_ranah', 'p_alasan', 'p_skenario'])
    const { badan, kepala } = fungsiTerakhir('admin_kasus_buka_dari_peristiwa')
    expect(kepala).toContain(`default '${SKENARIO_SELIDIKI}'`)
    const bawaan = /coalesce\(p_ranah,\s*array\[([^\]]+)\]\)/.exec(badan)?.[1] ?? ''
    expect(urut([...bawaan.matchAll(/'([a-z]+)'/g)].map(m => m[1]!))).toEqual(urut(RANAH_RUANG))
    expect(badan).toMatch(/if v \? 'id' then\s+v := v \|\| jsonb_build_object\('peristiwa_id'/)
  })
  it('tujuan Selidiki = tab Jejak ruang subjek kasus', () => {
    expect(tujuanSelidiki({ subjek_tipe: 'workspace', subjek_id: W })).toBe(`/console/cashflow/ruang/${W}/jejak`)
    expect(tujuanSelidiki({ subjek_tipe: 'user', subjek_id: U })).toBeNull()
  })
})

// ── Kasus ruang ──────────────────────────────────────────────────────────
describe('kasus bersubjek ruang (0094)', () => {
  it.skipIf(!ADA)('ranah yang ditolak untuk ruang = RANAH_BUKAN_RUANG; hint ranah-ruang', () => {
    const { badan } = fungsiTerakhir('admin_kasus_buka_inti')
    expect(badan).toContain("hint = 'ranah-ruang'")
    const m = /array\[('akun'[^\]]*)\]/.exec(badan)?.[1] ?? ''
    expect(urut([...m.matchAll(/'([a-z]+)'/g)].map(x => x[1]!))).toEqual(urut(RANAH_BUKAN_RUANG))
    for (const r of RANAH_RUANG) expect(RANAH_BUKAN_RUANG as readonly string[]).not.toContain(r)
  })
  it.skipIf(!ADA)('pemilihan kasus aktif ruang memakai ranah tab yang sama dengan RANAH_RUANG', () => {
    const { badan } = fungsiTerakhir('admin_kasus_aktif_ruang')
    const m = /select unnest\(array\[([^\]]+)\]\)/.exec(badan)?.[1] ?? ''
    expect(urut([...m.matchAll(/'([a-z]+)'/g)].map(x => x[1]!))).toEqual(urut(RANAH_RUANG))
  })
  it('isian otomatis kasus ruang sah untuk server', () => {
    expect(POLA_SKENARIO.test(SKENARIO_RUANG)).toBe(true)
    expect(POLA_SKENARIO.test(SKENARIO_SELIDIKI)).toBe(true)
    const t = new Date('2026-09-26T05:00:00Z')
    expect(alasanOtomatisRuang(t).length).toBeGreaterThanOrEqual(MIN_ALASAN)
    expect(alasanSelidiki(t).length).toBeGreaterThanOrEqual(MIN_ALASAN)
    expect(alasanOtomatisRuang(t)).toContain('12.00.00')
  })
  it('tab → ranah: tiap tab data dibaca lewat ranah kasus ruang; Akses T0', () => {
    for (const t of TAB_RUANG) {
      const r = RANAH_TAB_RUANG[t]
      if (t === 'akses') expect(r).toBeNull()
      else expect(RANAH_RUANG as readonly string[]).toContain(r)
    }
  })
  it('keKasus membaca subjek_tipe; kurangDariKasus memakai ranah wajib halaman', () => {
    const dto = {
      id: K, induk: null, subjek_tipe: 'workspace', subjek_id: W, ruang: [W], jumlah_ruang: 1, skenario: SKENARIO_RUANG, preset: 'keluhan',
      alasan: 'x'.repeat(10), ranah: ['ruang', 'transaksi'], tingkat: 'T2', lanjutan_dari: null, dibuka: '2026-09-26T05:00:00+00:00',
      akar_dibuka: '2026-09-26T05:00:00+00:00', berlaku_sampai: '2026-09-26T05:30:00+00:00', batas_perpanjang: '2026-09-26T07:00:00+00:00',
      ditutup: null, status: 'aktif', jumlah_terdampak: 2,
    } as KasusDTO
    const k = keKasus(dto)
    expect(k.subjekTipe).toBe('workspace')
    expect(keKasus({ ...dto, subjek_tipe: 'user' }).subjekTipe).toBe('user')
    expect(kurangDariKasus(k, [W], RANAH_RUANG).ranah).toEqual(['dompet', 'jejak'])
    expect(kurangDariKasus(k, [W]).ranah).toEqual(RANAH_FASE1.filter(r => !['ruang', 'transaksi'].includes(r)))
  })
  it('hint 22023 ranah-ruang terbawa ke galat (dilokalkan useCashflowMuat)', () => {
    expect(petakanGalat({ code: '22023', hint: 'ranah-ruang', message: 'x' })).toMatchObject({ jenis: 'argumen', hint: 'ranah-ruang' })
  })
})

// ── Cari v2 ──────────────────────────────────────────────────────────────
describe('kontrak CariDTO ↔ admin_cari_v2 (hasil ruang)', () => {
  const CARI = `{"jenis_kueri": "uuid", "jumlah": 1, "hasil": [{"jenis": "ruang", "id": "${W}", "nama": "Wa······", "jenis_ruang": "usaha", "pemilik": "sri***@gmail.com"}]}`
  it.skipIf(!ADA)('hasil ruang = kunci server', () => {
    const { badan } = fungsiTerakhir('admin_cari_v2')
    const d = JSON.parse(CARI) as CariDTO
    sama(d.hasil[0], pohonDengan(badan, 'jenis_ruang'))
    expect(kunciAtas(d)).toEqual(urut(Object.keys(pohonDengan(badan, 'jenis_kueri', 'hasil'))))
  })
  it('keHasilCari: ruang → kepala Ruang 360, label tersamar', () => {
    const h = keHasilCari((JSON.parse(CARI) as CariDTO).hasil[0]!)
    expect(h).toMatchObject({ jenis: 'ruang', ke: `/console/cashflow/ruang/${W}`, label: 'Wa······ · sri***@gmail.com' })
  })
})

// ── Daftar kasus: subjek ruang ───────────────────────────────────────────
describe('admin_daftar_kasus: kasus bersubjek ruang', () => {
  const baris = (x: Partial<DaftarKasusDTO>): DaftarKasusDTO => ({
    id: K, induk: null, pelaku: 'admin@coreasia.id', subjek_tipe: 'workspace', subjek_id: W, subjek_label: 'Wa······', ruang: null,
    jumlah_ruang: 1, skenario: SKENARIO_RUANG, preset: 'keluhan', alasan: 'Dibuka dar…', alasan_utuh: false, ranah: ['ruang'], tingkat: 'T2',
    jumlah_terdampak: null, lanjutan_dari: null, dibuka: '2026-09-26T05:00:00+00:00', berlaku_sampai: '2026-09-26T05:30:00+00:00',
    ditutup: null, status: 'aktif', milik_saya: true, total_semua: 1, ...x,
  })
  it('subjek ruang bertaut ke Ruang 360; subjek pengguna ke Pengguna 360', () => {
    expect(keBarisKasus(baris({})).subjekKe).toBe(`/console/cashflow/ruang/${W}`)
    expect(keBarisKasus(baris({ subjek_tipe: 'user', subjek_id: U })).subjekKe).toBe(`/console/cashflow/pengguna/${U}`)
  })
  it('sesi tanpa pii: subjek_id & label null → tanpa tautan (id ruang tidak pernah dirakit)', () => {
    const k = keBarisKasus(baris({ subjek_id: null, subjek_label: null }))
    expect(k).toMatchObject({ subjekTipe: 'workspace', subjekId: null, subjekKe: null })
  })
  it.skipIf(!ADA)('server menyembunyikan subjek ruang tanpa pii', () => {
    const { badan } = fungsiTerakhir('admin_daftar_kasus')
    expect(badan).toMatch(/subjek_tipe\s*=\s*'workspace'/)
  })
})
