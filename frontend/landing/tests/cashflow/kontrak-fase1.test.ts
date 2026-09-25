/**
 * Kontrak adapter Fase 1 terhadap migrasi 0089 (kasus) dan 0090 (Pengguna 360).
 *
 * Setiap contoh jawaban di bawah ditulis sebagai TEKS JSON persis seperti yang
 * dikirim PostgREST (timestamptz +00:00, date 'YYYY-MM-DD', numeric/bigint jadi
 * angka, uuid jadi teks). Kuncinya DIBANDINGKAN dengan jsonb_build_object /
 * `returns table (…)` / kunci SQL dinamis di definisi TERAKHIR fungsinya di
 * folder migrasi — contoh yang menyimpang dari server membuat uji merah.
 *
 * Yang dikunci juga di sini: nilai yang dikenal server (preset tanpa
 * `berkala`, ranah → tingkat, status, jenis peristiwa, pemeriksaan, jenis
 * teks), hint galat 42501 yang semuanya terpetakan (tidak jatuh ke
 * "bukan admin"), batas (alasan 8, teks 100, cari 20), dan bahwa teks bebas
 * (note, judul, selisih, isi sampah) TIDAK PERNAH ada di bentuk T2.
 */
import { describe, expect, it } from 'vitest'
import {
  adaMigrasi, adaMigrasiNomor, fungsiTerakhir, kolomKembalian, kolomTabel, pohonContoh, pohonDengan, pohonJsonb, semuaPohonJsonb, urutPohon, kunciDinamis,
  type PohonKunci,
} from './migrasi'
import {
  keKasus, adalahBatasAkses, sisaDetik, kasusBerlaku, bisaPerpanjang, lingkupSemua, kurangDariKasus, capWaktuWib,
  alasanOtomatis, alasanT3Otomatis, alasanCukup, tingkatRanah, keBarisKasus, keBarisAkses, keBarisAudit,
  PRESET_KASUS, PRESET_INVESTIGASI, RANAH_T1, RANAH_T2, RANAH_T3, RANAH_FASE1, STATUS_KASUS, SKENARIO_OTOMATIS,
  PRESET_OTOMATIS, PRESET_T3_OTOMATIS, POLA_SKENARIO, MIN_ALASAN,
  type KasusDTO, type KasusAktifDTO, type BatasAksesDTO, type DaftarKasusDTO, type RiwayatAksesDTO, type AuditV3DTO,
  type RuangCalon,
} from '../../adapters/cashflowKasus'
import {
  keKepala, ke360, keTransaksiBaris, keSampahBaris, adaSampahLebih, keRinci, keTeks, keHasilCari, bisaCariServer, kursorKeUrl,
  kursorTransaksiDariUrl, tanggalJam, terbatas, jenisUang,
  CEK_TRANSAKSI, JENIS_TEKS, RANAH_TEKS, BATAS_TEKS, BATAS_CARI,
  type KepalaPenggunaDTO, type Pengguna360DTO, type TransaksiCariDTO, type TransaksiRinciDTO, type TeksDTO, type CariDTO,
} from '../../adapters/cashflowBuku'
import { keJejakBaris, jedaTiba, jenisSasaran, kursorJejakDariUrl, kursorAksesDariUrl, JENIS_PERISTIWA, type JejakDTO } from '../../adapters/cashflowJejak'
import { jedaDaftarKeCatatan } from '../../adapters/cashflow'
import { HINT_42501, petakanGalat } from '../../composables/cashflow/useCashflowAdmin'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'

const urut = (xs: readonly string[]) => [...xs].sort()
const pohon = (teks: string): PohonKunci | null => urutPohon(pohonContoh(JSON.parse(teks)))
const sama = (contoh: string, server: PohonKunci) => expect(pohon(contoh)).toEqual(urutPohon(server))
const kunciAtas = (teks: string) => urut(Object.keys(JSON.parse(teks) as object))
const kunciBaris = (teks: string) => urut(Object.keys((JSON.parse(teks) as unknown[])[0] as object))
const kutip = (teks: string) => [...teks.matchAll(/'([^']+)'/g)].map(m => m[1]!)
const SUBJEK = '3f0c2a4e-8b1d-4c6a-9e2f-1a2b3c4d5e6f'
const RUANG = '0b6f5c1e-2d3a-4b5c-8d7e-9f0a1b2c3d4e'

// ── Kasus (0089) ─────────────────────────────────────────────────────────
const KASUS = `{"id": "9a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d", "induk": null, "subjek_tipe": "user", "subjek_id": "${SUBJEK}",
  "ruang": ["${RUANG}"], "jumlah_ruang": 1, "skenario": "transaksi_hilang", "preset": "keluhan", "alasan": "Tiket #4242 saldo",
  "ranah": ["akun", "jejak", "transaksi"], "tingkat": "T2", "lanjutan_dari": null,
  "dibuka": "2026-09-21T03:00:00.123456+00:00", "akar_dibuka": "2026-09-21T03:00:00.123456+00:00",
  "berlaku_sampai": "2026-09-21T03:30:00.123456+00:00", "batas_perpanjang": "2026-09-21T05:00:00.123456+00:00",
  "ditutup": null, "status": "aktif", "jumlah_terdampak": 2}`
const kasus = () => JSON.parse(KASUS) as KasusDTO

describe('kontrak KasusDTO ↔ admin_kasus_json_inti', () => {
  it.skipIf(!adaMigrasi)('contoh memuat persis kunci jsonb server', () => {
    sama(KASUS, pohonJsonb(fungsiTerakhir('admin_kasus_json_inti').badan))
  })
  it.skipIf(!adaMigrasi)('admin_kasus_aktif memulangkan {kasus, investigasi}', () => {
    const d: KasusAktifDTO = { kasus: kasus(), investigasi: [] }
    expect(urut(Object.keys(d))).toEqual(urut(Object.keys(pohonJsonb(fungsiTerakhir('admin_kasus_aktif').badan))))
  })
  it('keKasus: domain bertipe, anak dari induk, status dikenal', () => {
    const k = keKasus(kasus())
    expect(k).toMatchObject({ anak: false, tingkat: 'T2', status: 'aktif', ruang: [RUANG], lingkupTerlihat: true, jumlahRuang: 1, terdampak: 2, skenario: 'transaksi_hilang' })
    // Sesi tanpa pii (admin_kasus_aktif): server menahan lingkup (keanggotaan)
    // dan jumlah terdampak; jumlah ruangnya tetap. null tetap null, bukan 0.
    expect(keKasus({ ...kasus(), ruang: null, jumlah_terdampak: null }))
      .toMatchObject({ ruang: [], lingkupTerlihat: false, jumlahRuang: 1, terdampak: null })
    expect(keKasus({ ...kasus(), induk: 'x', tingkat: 'T3', status: 'aneh' })).toMatchObject({ anak: true, tingkat: 'T3', status: null })
  })
  it('sisa, berlaku, dan perpanjang menurut jam klien', () => {
    const k = keKasus(kasus())
    const t0 = Date.parse('2026-09-21T03:00:00Z')
    expect(sisaDetik(k, t0)).toBe(30 * 60)
    expect(kasusBerlaku(k, t0)).toBe(true)
    expect(kasusBerlaku(k, Date.parse('2026-09-21T03:31:00Z'))).toBe(false)
    expect(kasusBerlaku({ ...k, ditutupIso: '2026-09-21T03:10:00Z' }, t0)).toBe(false)
    expect(bisaPerpanjang(k)).toBe(true)
    expect(bisaPerpanjang({ ...k, sampaiIso: k.batasPerpanjangIso })).toBe(false)
    expect(bisaPerpanjang({ ...k, anak: true })).toBe(false)
  })
})

const BATAS = `{"ditolak": true, "hint": "batas-akses", "pesan": "Batas akses terlampaui.",
  "batas": {"jam": 5, "hari": 15}, "terpakai": {"jam": 5, "hari": 7}}`
describe('kontrak batas-akses ↔ admin_kasus_buka_inti (jsonb 200, bukan galat)', () => {
  it.skipIf(!adaMigrasi)('contoh = objek penolakan server', () => {
    const { badan } = fungsiTerakhir('admin_kasus_buka_inti')
    sama(BATAS, pohonDengan(badan, 'ditolak'))
    expect(badan).toContain("'hint', 'batas-akses'")
    // Ambang (keputusan Master 21 Sep 2026: 20/jam, 60/hari) = angka yang
    // dikirim di `batas` — kalimat UI memakai angka server, bukan tebakan.
    const m = /v_jam\s*>=\s*(\d+)\s+or\s+v_hari\s*>=\s*(\d+)/.exec(badan)
    expect(m).not.toBeNull()
    expect(badan).toContain(`'batas', jsonb_build_object('jam', ${m![1]}, 'hari', ${m![2]})`)
  })
  it('adalahBatasAkses membedakan penolakan dari kasus', () => {
    expect(adalahBatasAkses(JSON.parse(BATAS) as BatasAksesDTO)).toBe(true)
    expect(adalahBatasAkses(kasus())).toBe(false)
    expect(adalahBatasAkses(null)).toBe(false)
  })
})

describe('nilai yang dikenal server', () => {
  it.skipIf(!adaMigrasi)('PRESET_KASUS = CHECK admin_kasus_preset = penjaga buka; tanpa berkala (K12)', () => {
    const { definisi } = kolomTabel('admin_kasus')
    expect(definisi.preset).toBeDefined()
    const berkas = fungsiTerakhir('admin_kasus_buka_inti').badan
    const m = /p_preset\s+not\s+in\s*\(([^)]*)\)/.exec(berkas)
    expect(urut(kutip(m?.[1] ?? ''))).toEqual(urut([...PRESET_KASUS]))
    expect(PRESET_KASUS).not.toContain('berkala' as never)
  })
  it.skipIf(!adaMigrasi)('PRESET_INVESTIGASI = penjaga admin_kasus_investigasi', () => {
    const m = /p_preset\s+not\s+in\s*\(([^)]*)\)/.exec(fungsiTerakhir('admin_kasus_investigasi').badan)
    expect(urut(kutip(m?.[1] ?? ''))).toEqual(urut([...PRESET_INVESTIGASI]))
  })
  it.skipIf(!adaMigrasi)('ranah → tingkat sama dengan kasus_ranah_tingkat', () => {
    const bagian = fungsiTerakhir('kasus_ranah_tingkat').badan.split(/\bwhen\b/).slice(1)
    const baris = (t: string) => urut(kutip(bagian.find(b => new RegExp(`then\\s+'${t}'`).test(b))?.split(/\bthen\b/)[0] ?? ''))
    expect(baris('T1')).toEqual(urut([...RANAH_T1]))
    expect(baris('T2')).toEqual(urut([...RANAH_T2]))
    expect(baris('T3')).toEqual(urut([...RANAH_T3]))
    for (const r of RANAH_FASE1) expect(['T1', 'T2']).toContain(tingkatRanah(r))
    expect(tingkatRanah('entah')).toBeNull()
  })
  it.skipIf(!adaMigrasi)('STATUS_KASUS = nilai admin_kasus_status_inti', () => {
    const { badan } = fungsiTerakhir('admin_kasus_status_inti')
    const status = new Set([...badan.matchAll(/return\s+'([a-z]+)'/g)].map(m => m[1]!))
    expect(urut([...status])).toEqual(urut([...STATUS_KASUS]))
  })
  it.skipIf(!adaMigrasi)('isian kasus OTOMATIS diterima penjaga server (skenario, preset, ranah T1/T2, preset T3)', () => {
    expect(kolomTabel('admin_kasus').definisi.skenario).toBeDefined()
    expect(fungsiTerakhir('admin_kasus_buka_inti').badan).toContain(`'${POLA_SKENARIO.source}'`)
    expect(SKENARIO_OTOMATIS).toMatch(POLA_SKENARIO)
    expect(PRESET_KASUS).toContain(PRESET_OTOMATIS)
    for (const r of RANAH_FASE1) expect(['T1', 'T2']).toContain(tingkatRanah(r))
    const m = /p_preset\s+not\s+in\s*\(([^)]*)\)/.exec(fungsiTerakhir('admin_kasus_investigasi').badan)
    expect(kutip(m?.[1] ?? '')).toContain(PRESET_T3_OTOMATIS)
  })
  it.skipIf(!adaMigrasi)(`MIN_ALASAN (${MIN_ALASAN}) = syarat server`, () => {
    expect(fungsiTerakhir('admin_kasus_buka_inti').badan).toMatch(new RegExp(`length\\(v_alasan\\)\\s*<\\s*${MIN_ALASAN}\\b`))
    expect(fungsiTerakhir('admin_kasus_investigasi').badan).toMatch(new RegExp(`length\\(v_alasan\\)\\s*<\\s*${MIN_ALASAN}\\b`))
  })
  it.skipIf(!adaMigrasi)('JENIS_PERISTIWA = CHECK peristiwa.jenis', () => {
    const def = kolomTabel('peristiwa').definisi.jenis ?? ''
    expect(urut(kutip(def))).toEqual(urut([...JENIS_PERISTIWA]))
  })
  it.skipIf(!adaMigrasi)('CEK_TRANSAKSI = p_cek admin_transaksi_bangun', () => {
    const { badan } = fungsiTerakhir('admin_transaksi_bangun')
    const cek = [...badan.matchAll(/when\s+'([a-z_]+)'\s+then/g)].map(m => m[1]!).filter(c => !['masuk', 'keluar', 'transfer'].includes(c))
    expect(urut(cek)).toEqual(urut([...CEK_TRANSAKSI]))
  })
})

describe('hint galat Fase 1 → jenis (tidak ada yang jatuh ke "bukan admin")', () => {
  it.skipIf(!adaMigrasi)('setiap hint 42501 di 0089/0090 terpetakan', () => {
    const fungsi = [
      'admin_kasus_sah_inti', 'admin_kasus_pakai', 'admin_catat_baca', 'admin_kasus_buka_inti', 'admin_kasus_investigasi',
      'admin_kasus_tambah', 'admin_kasus_perpanjang', 'admin_kasus_tutup', 'admin_kasus_aktif', 'admin_daftar_kasus',
      'admin_riwayat_akses', 'admin_daftar_audit_v3', 'admin_pengguna_kepala', 'admin_pengguna_360', 'admin_transaksi_cari',
      'admin_transaksi_rinci', 'admin_jejak', 'admin_teks', 'admin_cari', 'admin_daftar_pengguna_v2', 'admin_config_buka',
    ]
    const hint = new Set<string>()
    for (const f of fungsi) {
      for (const m of fungsiTerakhir(f).badan.matchAll(/errcode\s*=\s*'42501'\s*,\s*hint\s*=\s*'([a-z0-9-]+)'/g)) hint.add(m[1]!)
    }
    expect(hint.size).toBeGreaterThan(5)
    for (const h of hint) expect(HINT_42501[h], h).toBeDefined()
  })
  it('pemetaan inti', () => {
    expect(petakanGalat({ code: '42501', hint: 'kasus-kedaluwarsa' }).jenis).toBe('kasus')
    expect(petakanGalat({ code: '42501', hint: 'kasus-tidak-dikenal' }).jenis).toBe('kasus')
    expect(petakanGalat({ code: '42501', hint: 'kasus-ranah' }).jenis).toBe('ranah')
    expect(petakanGalat({ code: '42501', hint: 'kasus-lingkup' }).jenis).toBe('lingkup')
    expect(petakanGalat({ code: '42501', hint: 'izin-kurang' }).jenis).toBe('izin')
    expect(petakanGalat({ code: '42501', hint: 'batas-investigasi' }).jenis).toBe('batas')
    expect(petakanGalat({ code: '22023', hint: 'kursor' })).toMatchObject({ jenis: 'argumen', hint: 'kursor' })
  })
})

// ── Daftar kasus, riwayat akses, audit v3 ────────────────────────────────
const DAFTAR_KASUS = `[{"id": "9a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d", "induk": null, "pelaku": "admin@coreasia.id", "subjek_tipe": "user",
  "subjek_id": "${SUBJEK}", "subjek_label": "ded***@gmail.com", "ruang": null, "jumlah_ruang": 1, "skenario": "akun", "preset": "keluhan",
  "alasan": "Tiket #424…", "alasan_utuh": false, "ranah": ["akun"], "tingkat": "T1", "jumlah_terdampak": null,
  "lanjutan_dari": null, "dibuka": "2026-09-21T03:00:00+00:00", "berlaku_sampai": "2026-09-21T03:30:00+00:00",
  "ditutup": null, "status": "aktif", "milik_saya": true, "total_semua": 1}]`
const RIWAYAT = `{"baris": [{"id": 812, "pada": "2026-09-21T03:01:00+00:00", "pelaku": "admin@coreasia.id", "aksi": "baca_transaksi",
  "target_type": "user", "langsung": true, "kasus": "9a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d", "ranah": ["transaksi"],
  "rpc": "transaksi_cari", "jumlah": 100, "alasan": "Tiket #424…", "alasan_utuh": false, "milik_saya": false}],
  "kursor_berikut": {"t": "2026-09-21T03:01:00+00:00", "i": 812}, "total": 3, "tersembunyi": null, "halaman_pertama": true}`
const AUDIT3 = `[{"id": 812, "admin_id": "11111111-1111-4111-8111-111111111111", "pelaku": "admin@coreasia.id", "action": "baca_akun",
  "target_type": "user", "target_id": "${SUBJEK}", "target_email": "ded***@gmail.com", "detail": {"rpc": "pengguna_360", "ranah": "akun"},
  "reason": "Tiket #424…", "alasan_utuh": false, "ranah": ["akun"], "kasus": "9a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d",
  "terdampak": null, "jumlah_terdampak": null, "created_at": "2026-09-21T03:01:00+00:00", "total_semua": 1}]`

describe('kontrak daftar kasus / riwayat akses / audit v3', () => {
  it.skipIf(!adaMigrasi)('DaftarKasusDTO = returns table admin_daftar_kasus', () => {
    expect(kunciBaris(DAFTAR_KASUS)).toEqual(urut(kolomKembalian('admin_daftar_kasus')))
  })
  it.skipIf(!adaMigrasi)('RiwayatAksesDTO = jsonb admin_riwayat_akses (baris, kursor {t,i}, total)', () => {
    const { badan } = fungsiTerakhir('admin_riwayat_akses')
    const baris = pohonDengan(badan, 'aksi', 'alasan_utuh')
    expect(urut(Object.keys((JSON.parse(RIWAYAT) as RiwayatAksesDTO).baris[0]!))).toEqual(urut(Object.keys(baris)))
    expect(kunciAtas(RIWAYAT)).toEqual(urut(Object.keys(pohonDengan(badan, 'baris', 'kursor_berikut'))))
    expect(urut(Object.keys(pohonDengan(badan, 't', 'i')))).toEqual(['i', 't'])
  })
  it.skipIf(!adaMigrasi)('AuditV3DTO = returns table admin_daftar_audit_v3; target selalu samar_email', () => {
    expect(kunciBaris(AUDIT3)).toEqual(urut(kolomKembalian('admin_daftar_audit_v3')))
    expect(fungsiTerakhir('admin_daftar_audit_v3').badan).toMatch(/public\.samar_email\(ut\.email\)\s*,/)
    expect(fungsiTerakhir('admin_daftar_kasus').badan).toMatch(/public\.samar_email\(u\.email\)\s*,/)
  })
  it('konversi domain', () => {
    // Contoh = sesi TANPA pii: ruang dan jumlah_terdampak ditahan server (null, bukan 0).
    const [k] = (JSON.parse(DAFTAR_KASUS) as DaftarKasusDTO[]).map(keBarisKasus)
    expect(k).toMatchObject({ subjekLabel: 'ded***@gmail.com', alasanUtuh: false, milikSaya: true, ruang: 1, status: 'aktif', terdampak: null })
    expect(keBarisKasus({ ...(JSON.parse(DAFTAR_KASUS) as DaftarKasusDTO[])[0]!, jumlah_terdampak: 4 }).terdampak).toBe(4)
    const [a] = (JSON.parse(RIWAYAT) as RiwayatAksesDTO).baris.map(keBarisAkses)
    expect(a).toMatchObject({ langsung: true, ranah: ['transaksi'], jumlah: 100, alasanUtuh: false })
    const [u] = (JSON.parse(AUDIT3) as AuditV3DTO[]).map(keBarisAudit)
    expect(u).toMatchObject({ targetLabel: 'ded***@gmail.com', terdampak: null, kasus: '9a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d' })
    // Pemegang pii: terdampak utuh dan jumlahnya.
    const pii: AuditV3DTO = { ...(JSON.parse(AUDIT3) as AuditV3DTO[])[0]!, terdampak: [SUBJEK, RUANG], jumlah_terdampak: 2 }
    expect(keBarisAudit(pii).terdampak).toBe(2)
    expect(keBarisAudit({ ...pii, jumlah_terdampak: null }).terdampak).toBe(2)
  })
})

// ── Kepala & Pengguna 360 (0090) ─────────────────────────────────────────
const KEPALA = `{"user_id": "${SUBJEK}", "email": "ded***@gmail.com", "daftar": "2026-09-01T16:30:00+00:00",
  "masuk_terakhir": "2026-09-17T18:45:10.5+00:00", "banned_until": null, "jumlah_ruang": 2, "jumlah_transaksi": 42,
  "akses_30hari": 3, "ruang": [{"workspace_id": "${RUANG}", "nama": "Bi······", "jenis": "usaha", "peran": "owner",
  "pemilik": true, "bekas_anggota": false, "jumlah_anggota": 1, "tx_oleh_dia": 40}]}`

describe('kontrak KepalaPenggunaDTO ↔ admin_pengguna_kepala', () => {
  it.skipIf(!adaMigrasi)('contoh = kunci server; ruang[] hanya untuk pii', () => {
    const { badan } = fungsiTerakhir('admin_pengguna_kepala')
    const d = JSON.parse(KEPALA) as KepalaPenggunaDTO
    expect(urut(Object.keys(d))).toEqual(urut(Object.keys(pohonDengan(badan, 'akses_30hari'))))
    expect(urut(Object.keys(d.ruang![0]!))).toEqual(urut(Object.keys(pohonDengan(badan, 'bekas_anggota', 'tx_oleh_dia'))))
    // ruang[] (bahan lingkup kasus) hanya di cabang pemegang pii.
    expect(badan).toMatch(/v_pii\s*:=\s*public\.konsol_boleh\('cashflow:pii'\)/)
    expect(badan).toMatch(/if\s+v_pii\s+then[\s\S]*?into v_ruang[\s\S]*?end if;/)
    expect(badan).toMatch(/'email',\s*public\.samar_email\(u\.email\)/)
  })
  it('keKepala: ruang calon lingkup; null = tanpa pii', () => {
    const k = keKepala(JSON.parse(KEPALA) as KepalaPenggunaDTO)
    expect(k).toMatchObject({ emailTersamar: 'ded***@gmail.com', akses30: 3, jumlahRuang: 2 })
    expect(k.ruang).toEqual([{ id: RUANG, nama: 'Bi······', jenis: 'usaha', peran: 'owner', pemilik: true, bekas: false, anggota: 1, tx: 40 }])
    expect(keKepala({ ...(JSON.parse(KEPALA) as KepalaPenggunaDTO), ruang: null }).ruang).toBeNull()
  })
})

const P360 = `{"kasus": "9a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d",
  "akun": {"user_id": "${SUBJEK}", "email": "dedi@contoh.id", "display_name": "", "nama_meta": "Dedi F",
    "email_confirmed_at": "2026-09-01T16:31:00+00:00", "provider": "email", "providers": ["email", "google"],
    "daftar": "2026-09-01T16:30:00+00:00", "masuk_terakhir": null, "banned_until": null,
    "sesi": {"jumlah": 2, "terakhir": "2026-09-20T01:00:00+00:00"}, "mfa": false},
  "hitung": {"ruang": 2, "ruang_dalam_lingkup": 1, "transaksi": 40, "jejak": 12, "sampah": 1},
  "pertama_catat": "2026-09-01T17:00:00+00:00",
  "total": {"transaksi": 40, "masuk_bersih": 1500000.00, "keluar_bersih": "275000.50"},
  "ruang": [
    {"workspace_id": "${RUANG}", "dalam_lingkup": true, "nama": "Bisnis", "jenis": "usaha", "peran": "owner", "pemilik": true,
     "bekas_anggota": false, "joined_at": "2026-09-01T16:30:00+00:00", "jumlah_anggota": 1, "tx_oleh_dia": 40,
     "masuk_bersih_dia": 1500000, "keluar_bersih_dia": 275000.5, "terakhir_catat_dia": "2026-09-20T01:00:00+00:00",
     "agregat": {"transaksi": 40, "masuk_bersih": 1500000, "keluar_bersih": 275000.5, "terakhir_catat": "2026-09-20T01:00:00+00:00", "dompet": 3}},
    {"workspace_id": "7c8d9e0f-1a2b-4c3d-9e4f-5a6b7c8d9e0f", "dalam_lingkup": false, "nama": "Mi······", "jenis": "pribadi",
     "peran": "owner", "pemilik": true, "bekas_anggota": false, "jumlah_anggota": 1, "tx_oleh_dia": 2}
  ]}`

describe('kontrak Pengguna360DTO ↔ admin_pengguna_360', () => {
  it.skipIf(!adaMigrasi)('akun, hitung, total, ruang dalam/luar lingkup, agregat = kunci server', () => {
    const { badan } = fungsiTerakhir('admin_pengguna_360')
    const d = JSON.parse(P360) as Pengguna360DTO
    const atas = pohonDengan(badan, 'hitung', 'pertama_catat')
    expect(urut(Object.keys(d))).toEqual(urut(Object.keys(atas)))
    expect(urutPohon(pohonContoh(d.hitung))).toEqual(urutPohon(atas.hitung!))
    expect(urutPohon(pohonContoh(d.total))).toEqual(urutPohon(atas.total!))
    expect(urutPohon(pohonContoh(d.akun))).toEqual(urutPohon(pohonDengan(badan, 'email_confirmed_at')))
    const [dalam, luar] = d.ruang
    const pDalam = pohonDengan(badan, 'dalam_lingkup', 'agregat')
    expect(urut(Object.keys(dalam!))).toEqual(urut(Object.keys(pDalam)))
    expect(urutPohon(pohonContoh((dalam as { agregat: unknown }).agregat))).toEqual(urutPohon(pohonDengan(badan, 'masuk_bersih', 'dompet')))
    const pLuar = semuaPohonJsonb(badan).find(p => 'dalam_lingkup' in p && !('agregat' in p))
    expect(pLuar).toBeDefined()
    expect(urut(Object.keys(luar!))).toEqual(urut(Object.keys(pLuar!)))
  })
  it.skipIf(!adaMigrasi)('bersih = uang berpindah (tanpa transfer, piutang/kasbon, dompet arsip); ruang luar lingkup tanpa agregat', () => {
    const { badan } = fungsiTerakhir('admin_pengguna_360')
    // Himpunan yang sama dengan Beranda / rekap_ruang (0068): label UI "bersih" bergantung pada ini.
    const uang = [...badan.matchAll(/select\s+(t2?)\.transfer_group is null and not (d2?)\.archived and \2\.type <> 'piutang' as uang/g)]
    expect(uang.length).toBe(2)
    expect(badan).toMatch(/filter \(where t2?\.kind = 'income'\s+and u2?\.uang\)/)
    expect(badan).toMatch(/where x\.dalam and t2\.workspace_id = x\.ws/)
  })
  it('ke360: angka numeric berteks terbaca; ruang luar tanpa angka (null, bukan 0)', () => {
    const p = ke360(JSON.parse(P360) as Pengguna360DTO)
    expect(p.total).toEqual({ transaksi: 40, masukBersih: 1500000, keluarBersih: 275000.5 })
    expect(p.akun).toMatchObject({ namaTampil: '—', namaMeta: 'Dedi F', provider: ['email', 'google'], sesi: 2, mfa: false })
    expect(p.ruang[0]).toMatchObject({ dalamLingkup: true, nama: 'Bisnis', agregat: { dompet: 3, keluarBersih: 275000.5 } })
    expect(p.ruang[1]).toMatchObject({ dalamLingkup: false, masukBersihDia: null, agregat: null })
  })
  it('jeda daftar → catatan pertama dari pertama_catat server', () => {
    const p = ke360(JSON.parse(P360) as Pengguna360DTO)
    expect(jedaDaftarKeCatatan(p.akun.daftarIso, p.pertamaCatatIso)).toEqual({ satuan: 'menit', n: 30 })
    expect(jedaDaftarKeCatatan('2026-09-01T00:00:00Z', '2026-09-01T07:00:00Z')).toEqual({ satuan: 'jam', n: 7 })
    expect(jedaDaftarKeCatatan('2026-09-01T00:00:00Z', '2026-09-04T00:00:00Z')).toEqual({ satuan: 'hari', n: 3 })
    expect(jedaDaftarKeCatatan('2026-09-01T00:00:00Z', null)).toBeNull()
  })
})

// ── Transaksi (0090 §4–6) ────────────────────────────────────────────────
const TX_BARIS = `{"id": "11111111-1111-4111-8111-111111111111", "workspace_id": "${RUANG}", "pencatat": "${SUBJEK}",
  "dompet_id": "22222222-2222-4222-8222-222222222222", "dompet": "Kas", "kategori_id": null, "kategori": null,
  "kind": "expense", "amount": "275000.50", "occurred_at": "2026-09-16", "occurred_time": "14:05:00",
  "created_at": "2026-09-16T07:05:12.345678+00:00", "updated_at": null, "dicatat_pada": "2026-09-16T07:05:00+00:00",
  "transfer_group": "99999999-9999-4999-8999-999999999999", "pasangan_id": "33333333-3333-4333-8333-333333333333",
  "group_id": null, "schedule_id": null, "installment_no": 2, "schedule_periods": null, "product_id": null, "qty": 1.5,
  "unit_price": null, "cost_at_sale": null, "ada_catatan": true, "ada_lampiran": false, "masa_depan": false}`
const SAMPAH_BARIS = `{"id": "44444444-4444-4444-8444-444444444444", "tx_id": "55555555-5555-4555-8555-555555555555",
  "workspace_id": "${RUANG}", "kind": "income", "amount": 150000, "occurred_at": "2026-09-10", "dompet_id": null,
  "dompet_nama": "Bank", "kategori_id": null, "transfer_group": null, "group_id": null, "schedule_id": null,
  "ada_foto": false, "ada_catatan": true, "pencatat": "${SUBJEK}", "dihapus_oleh": "${SUBJEK}",
  "dihapus_pada": "2026-09-11T01:00:00+00:00", "dipulihkan_oleh": null, "dipulihkan_pada": null}`
const CARI_TX = `{"baris": [${TX_BARIS}], "kursor_berikut": {"o": "2026-09-16", "c": "2026-09-16T07:05:12.345678+00:00",
  "i": "11111111-1111-4111-8111-111111111111"}, "total": 40, "sampah": [${SAMPAH_BARIS}], "sampah_lebih": true, "halaman_pertama": true, "mode": "pengguna"}`
/** 0092 menambah `sampah_lebih` (kontrak 3). Sebelum 0092 ada di folder migrasi, kunci itu belum dikirim server. */
const ADA_0092 = adaMigrasiNomor('0092')

describe('kontrak TransaksiCariDTO ↔ admin_transaksi_bangun / _sampah_bangun / _cari', () => {
  it.skipIf(!adaMigrasi)('baris = kunci SQL dinamis admin_transaksi_bangun; TANPA note', () => {
    const { badan } = fungsiTerakhir('admin_transaksi_bangun')
    const kunci = kunciDinamis(badan, "'select coalesce(jsonb_agg(jsonb_build_object('", "order by t.occurred_at desc")
    expect(kunciAtas(TX_BARIS)).toEqual(urut(kunci))
    expect(kunci).not.toContain('note')
    expect(badan).not.toMatch(/''note''/)
    const kembali = badan.slice(badan.lastIndexOf('return jsonb_build_object'))
    expect(urut(Object.keys(pohonJsonb(kembali)))).toEqual(['baris', 'kursor_berikut', 'total'])
    expect(urut(Object.keys(pohonDengan(badan.slice(badan.indexOf('v_akhir := jsonb_build_object')), 'o', 'c', 'i')))).toEqual(['c', 'i', 'o'])
  })
  it.skipIf(!adaMigrasi)('sampah = kunci admin_sampah_bangun; tanpa isi/note/judul', () => {
    const { badan } = fungsiTerakhir('admin_sampah_bangun')
    const p = pohonJsonb(badan)
    expect(kunciAtas(SAMPAH_BARIS)).toEqual(urut(Object.keys(p)))
    for (const k of ['isi', 'note', 'judul']) expect(Object.keys(p)).not.toContain(k)
  })
  it.skipIf(!adaMigrasi)('jawaban cari = bangun + {sampah, sampah_lebih (0092), halaman_pertama, mode}', () => {
    const { badan } = fungsiTerakhir('admin_transaksi_cari')
    const tambahan = Object.keys(pohonJsonb(badan.slice(badan.lastIndexOf('return v ||'))))
    const contoh = ADA_0092 ? kunciAtas(CARI_TX) : kunciAtas(CARI_TX).filter(k => k !== 'sampah_lebih')
    expect(contoh).toEqual(urut(['baris', 'kursor_berikut', 'total', ...tambahan]))
    if (ADA_0092) expect(tambahan).toContain('sampah_lebih')
  })
  it('adaSampahLebih: hanya true persis; kunci hilang (server sebelum 0092) = tidak terpotong', () => {
    const d = JSON.parse(CARI_TX) as TransaksiCariDTO
    expect(adaSampahLebih(d)).toBe(true)
    expect(adaSampahLebih({ ...d, sampah_lebih: false })).toBe(false)
    const { sampah_lebih: _buang, ...tanpaKunci } = d
    const lama: TransaksiCariDTO = tanpaKunci
    expect(adaSampahLebih(lama)).toBe(false)
    expect(adaSampahLebih({ sampah_lebih: null })).toBe(false)
    expect(adaSampahLebih({ sampah_lebih: 'true' as unknown as boolean })).toBe(false)
    expect(adaSampahLebih(null)).toBe(false)
  })
  it('keTransaksiBaris: kaki transfer, jam, numeric berteks', () => {
    const t = keTransaksiBaris(JSON.parse(TX_BARIS) as TransaksiCariDTO['baris'][number])
    expect(t).toMatchObject({ jenis: 'transfer', arah: 'keluar', nominal: 275000.5, jam: '14:05', kategori: '', cicilanKe: 2, qty: 1.5, adaCatatan: true })
    expect(tanggalJam(t.tanggal, t.jam, 'id')).toBe('16 Sep 2026 · 14.05')
    expect(tanggalJam(t.tanggal, t.jam, 'en')).toBe('16 Sep 2026 · 14:05')
    const s = keSampahBaris(JSON.parse(SAMPAH_BARIS) as NonNullable<TransaksiCariDTO['sampah']>[number])
    expect(s).toMatchObject({ id: '44444444-4444-4444-8444-444444444444', txId: '55555555-5555-4555-8555-555555555555', jenis: 'masuk', adaCatatan: true })
    expect(jenisUang('income', null)).toBe('masuk')
    expect(jenisUang('expense', 'x')).toBe('transfer')
  })
  it('kursor pulang-pergi lewat URL; rusak → halaman pertama', () => {
    const k = (JSON.parse(CARI_TX) as TransaksiCariDTO).kursor_berikut!
    const url = kursorKeUrl(k)
    expect(url).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(kursorTransaksiDariUrl(url)).toEqual(k)
    expect(kursorTransaksiDariUrl('')).toBeNull()
    expect(kursorTransaksiDariUrl('bukan kursor')).toBeNull()
    expect(kursorTransaksiDariUrl(kursorKeUrl({ o: '2026-09-16', c: 'x', i: k.i }))).toBeNull()
    expect(kursorTransaksiDariUrl(kursorKeUrl({ o: '2026-09-16', c: k.c, i: "1'; drop" }))).toBeNull()
  })
})

// ── Laci (0090 §7) ───────────────────────────────────────────────────────
const RINCI = `{"sumber": "transaksi", "transaksi": ${TX_BARIS.slice(0, -1)}, "jejak_jadwal": null},
  "pasangan": [{"id": "33333333-3333-4333-8333-333333333333", "workspace_id": "${RUANG}", "dompet_id": null, "dompet": "Bank",
    "kind": "income", "amount": 275000.5, "pencatat": "${SUBJEK}"}],
  "grup": null, "jadwal": {"id": "66666666-6666-4666-8666-666666666666", "nama": "Cicilan motor", "terbatas": true}, "produk": null,
  "lampiran": {"ada_bukti": false, "jumlah": 0},
  "riwayat": [{"id": 9001, "jenis": "tx.ubah", "aktor": "${SUBJEK}", "pada": "2026-09-16T07:06:00+00:00",
    "pada_perangkat": "2026-09-16T07:00:00+00:00", "jeda_tiba_detik": 360, "kunci": ["amount"], "ada_judul": true,
    "nominal": 275000.5, "arah": "expense", "tanggal": "2026-09-16"}]}`
const RINCI_SAMPAH = `{"id": "55555555-5555-4555-8555-555555555555", "sampah_id": "44444444-4444-4444-8444-444444444444",
  "workspace_id": "${RUANG}", "pencatat": "${SUBJEK}", "dompet_id": null, "dompet_nama": "Bank", "kategori_id": null,
  "kind": "income", "amount": 150000, "occurred_at": "2026-09-10", "transfer_group": null, "group_id": null, "schedule_id": null,
  "schedule_periods": null, "ada_foto": false, "ada_catatan": true, "dihapus_oleh": "${SUBJEK}",
  "dihapus_pada": "2026-09-11T01:00:00+00:00", "dipulihkan_oleh": null, "dipulihkan_pada": null}`

describe('kontrak TransaksiRinciDTO ↔ admin_transaksi_rinci', () => {
  it.skipIf(!adaMigrasi)('atas, pasangan, riwayat, sampah, konteks = kunci server', () => {
    const { badan } = fungsiTerakhir('admin_transaksi_rinci')
    const d = JSON.parse(RINCI) as TransaksiRinciDTO
    expect(urut(Object.keys(d))).toEqual(urut(Object.keys(pohonDengan(badan, 'sumber', 'riwayat'))))
    expect(urut(Object.keys(d.pasangan[0]!))).toEqual(urut(Object.keys(pohonDengan(badan, 'dompet', 'pencatat', 'kind'))))
    expect(urut(Object.keys(d.riwayat[0]!))).toEqual(urut(Object.keys(pohonDengan(badan, 'jeda_tiba_detik', 'kunci'))))
    expect(kunciAtas(RINCI_SAMPAH)).toEqual(urut(Object.keys(pohonDengan(badan, 'sampah_id'))))
    expect(urut(Object.keys(d.lampiran!))).toEqual(urut(Object.keys(pohonDengan(badan, 'ada_bukti'))))
    expect(urut(Object.keys(d.jadwal!))).toEqual(urut(Object.keys(pohonDengan(badan, 'nama', 'terbatas'))))
    // Transaksi hidup = baris bangun + jejak_jadwal; tanpa note di mana pun.
    expect(badan).toContain("jsonb_build_object('jejak_jadwal', public.jejak_jadwal_aman(t.jejak_jadwal))")
    expect(badan).not.toMatch(/'note'\s*,/)
  })
  it.skipIf(!adaMigrasi)('kasus diperiksa SEBELUM baris dicari (bukan orakel keberadaan id)', () => {
    const { badan } = fungsiTerakhir('admin_transaksi_rinci')
    expect(badan.indexOf("admin_kasus_pakai(p_kasus, 'transaksi', null, null)")).toBeLessThan(badan.indexOf('from public.transactions where id = p_tx'))
  })
  it('keRinci: transaksi hidup dan sampah', () => {
    const r = keRinci(JSON.parse(RINCI) as TransaksiRinciDTO)
    expect(r).toMatchObject({ sumber: 'transaksi', sampahId: null, jenis: 'transfer', adaCatatan: true, cicilanKe: 2 })
    expect(r.pasangan[0]).toMatchObject({ dompet: 'Bank', arah: 'masuk' })
    expect(terbatas(r.jadwal)).toBe(true)
    expect(r.riwayat[0]).toMatchObject({ jedaTiba: 360, adaJudul: true, kunci: ['amount'] })
    const s = keRinci({ ...(JSON.parse(RINCI) as TransaksiRinciDTO), sumber: 'sampah', transaksi: JSON.parse(RINCI_SAMPAH) })
    expect(s).toMatchObject({ sumber: 'sampah', id: '55555555-5555-4555-8555-555555555555', sampahId: '44444444-4444-4444-8444-444444444444', dompet: 'Bank' })
  })
})

// ── Jejak (0090 §8) ──────────────────────────────────────────────────────
const JEJAK = `{"baris": [{"id": 9001, "workspace_id": "${RUANG}", "aktor": "${SUBJEK}", "jenis": "tx.ubah",
  "sasaran_id": "11111111-1111-4111-8111-111111111111", "nominal": "275000.50", "arah": "expense", "tanggal": "2026-09-16",
  "pada": "2026-09-16T07:06:00.5+00:00", "pada_perangkat": "2026-09-16T07:00:00+00:00", "jeda_tiba_detik": 360,
  "kunci": ["amount", "note"], "ada_judul": false}],
  "kursor_berikut": {"p": "2026-09-16T07:06:00.5+00:00", "i": 9001}, "total": 12, "halaman_pertama": true}`

describe('kontrak JejakDTO ↔ admin_jejak', () => {
  it.skipIf(!adaMigrasi)('baris = kunci SQL dinamis; tanpa judul/selisih (hanya kunci + ada_judul)', () => {
    const { badan } = fungsiTerakhir('admin_jejak')
    const kunci = kunciDinamis(badan, "'select coalesce(jsonb_agg(jsonb_build_object('", 'order by p.pada desc')
    expect(urut(Object.keys((JSON.parse(JEJAK) as JejakDTO).baris[0]!))).toEqual(urut(kunci))
    expect(kunci).not.toContain('judul')
    expect(kunci).not.toContain('selisih')
    const kembali = badan.slice(badan.lastIndexOf('return jsonb_build_object'))
    expect(kunciAtas(JEJAK)).toEqual(urut(Object.keys(pohonJsonb(kembali))))
    expect(urut(Object.keys(pohonDengan(badan.slice(badan.indexOf('v_akhir := jsonb_build_object')), 'p', 'i')))).toEqual(['i', 'p'])
  })
  it('keJejakBaris, jeda tiba, sasaran, kursor', () => {
    const d = JSON.parse(JEJAK) as JejakDTO
    const b = keJejakBaris(d.baris[0]!)
    expect(b).toMatchObject({ sasaran: 'transaksi', nominal: 275000.5, arah: 'keluar', jedaTiba: 360, kunci: ['amount', 'note'] })
    expect(jedaTiba(30)).toBeNull()
    expect(jedaTiba(360)).toEqual({ satuan: 'menit', n: 6 })
    expect(jedaTiba(7200)).toEqual({ satuan: 'jam', n: 2 })
    expect(jedaTiba(86400 * 3)).toEqual({ satuan: 'hari', n: 3 })
    expect(jenisSasaran('anggota.gabung')).toBe('pengguna')
    expect(jenisSasaran('dompet.arsip')).toBe('lain')
    expect(kursorJejakDariUrl(kursorKeUrl(d.kursor_berikut))).toEqual(d.kursor_berikut)
    expect(kursorJejakDariUrl(kursorKeUrl({ p: 'x', i: 1 }))).toBeNull()
    const ka = (JSON.parse(RIWAYAT) as RiwayatAksesDTO).kursor_berikut
    expect(kursorAksesDariUrl(kursorKeUrl(ka))).toEqual(ka)
  })
})

// ── Teks bebas (0090 §9) ─────────────────────────────────────────────────
describe('kontrak TeksDTO ↔ admin_teks', () => {
  it.skipIf(!adaMigrasi)('jenis, ranah induk yang dibutuhkan, dan batas id = server', () => {
    const { badan } = fungsiTerakhir('admin_teks')
    // Bentuk VALUES: (jenis, tabel, 'jsonb_build_object(''kolom'', x.kolom …)', 'array[…]', array['ranah', …])
    const jenis = [...badan.matchAll(/^\s*\('([a-z]+)',\s*'[a-z_]+',/gm)].map(m => m[1]!)
    expect(urut(jenis)).toEqual(urut([...JENIS_TEKS]))
    for (const j of JENIS_TEKS) {
      const m = new RegExp(`\\('${j}',[^\\n]*array\\[([^\\]]*)\\]\\)`).exec(badan)
      expect(urut(kutip(m?.[1] ?? '')), j).toEqual(urut([...RANAH_TEKS[j]]))
    }
    expect(badan).toMatch(new RegExp(`cardinality\\(v_ids\\)\\s*>\\s*${BATAS_TEKS}\\b`))
    expect(urut(Object.keys(pohonJsonb(badan.slice(badan.lastIndexOf('return jsonb_build_object')))))).toEqual(['baris', 'jenis'])
  })
  it.skipIf(!adaMigrasi)('setiap kolom teks yang dikirim server punya label ID/EN', () => {
    const { badan } = fungsiTerakhir('admin_teks')
    const kolom = new Set([...badan.matchAll(/''([a-z_]+)'',\s*x\./g)].map(m => m[1]!).filter(k => k !== 'id'))
    expect(kolom.size).toBeGreaterThan(3)
    for (const k of kolom) {
      expect(KAMUS_CASHFLOW.id.teks.kolom, k).toHaveProperty(k)
      expect(KAMUS_CASHFLOW.en.teks.kolom, k).toHaveProperty(k)
    }
  })
  it('keTeks: kolom kosong dilewati; selisih dipecah per kolom', () => {
    const d: TeksDTO = {
      jenis: 'jejak',
      baris: [
        { id: 9001, judul: 'Warung Bu Sri', selisih: { amount: [100000, 275000.5], note: ['a', null] } },
        { id: 9002, judul: null, selisih: null },
      ],
    }
    const t = keTeks(d)
    expect(t.get('9001')).toEqual([
      { kolom: 'judul', isi: 'Warung Bu Sri' },
      { kolom: 'selisih.amount', isi: '100000 → 275000.5' },
      { kolom: 'selisih.note', isi: 'a → ' },
    ])
    expect(t.get('9002')).toEqual([])
  })
})

// ── Cari (0090 §10) ──────────────────────────────────────────────────────
const CARI = `{"jenis_kueri": "awalan", "jumlah": 3, "hasil": [
  {"jenis": "pengguna", "id": "${SUBJEK}", "email": "ded***@gmail.com"},
  {"jenis": "transaksi", "id": "11111111-1111-4111-8111-111111111111", "pencatat": "${SUBJEK}"},
  {"jenis": "sampah", "id": "55555555-5555-4555-8555-555555555555", "sampah_id": "44444444-4444-4444-8444-444444444444", "pencatat": null}]}`

describe('kontrak CariDTO ↔ admin_cari', () => {
  it.skipIf(!adaMigrasi)('hasil per jenis dan jawaban = kunci server; ≤ 20; butuh pii', () => {
    const { badan } = fungsiTerakhir('admin_cari')
    const d = JSON.parse(CARI) as CariDTO
    expect(urut(Object.keys(d))).toEqual(urut(Object.keys(pohonDengan(badan, 'jenis_kueri', 'hasil'))))
    const [p, t, s] = d.hasil
    expect(urut(Object.keys(p!))).toEqual(urut(Object.keys(pohonDengan(badan, 'jenis', 'email'))))
    expect(urut(Object.keys(t!))).toEqual(urut(Object.keys(pohonDengan(badan.slice(badan.indexOf('), t as (')), 'jenis', 'pencatat'))))
    expect(urut(Object.keys(s!))).toEqual(urut(Object.keys(pohonDengan(badan, 'sampah_id'))))
    expect(badan).toMatch(new RegExp(`limit\\s+${BATAS_CARI}\\b`))
    expect(badan).toMatch(/konsol_boleh\('cashflow:pii'\)/)
  })
  it('bisaCariServer = masukan yang dilayani server', () => {
    expect(bisaCariServer('dedi@contoh.id')).toBe(true)
    expect(bisaCariServer('dedi@')).toBe(false)
    expect(bisaCariServer(SUBJEK)).toBe(true)
    expect(bisaCariServer('3f0c2a4e')).toBe(true)
    expect(bisaCariServer('3f0c2a4')).toBe(false)
    expect(bisaCariServer('ded***')).toBe(false)
    expect(bisaCariServer('Budi')).toBe(false)
  })
  it('keHasilCari: pengguna → kepala; transaksi/sampah → laci di tab Transaksi pencatatnya', () => {
    const [p, t, s] = (JSON.parse(CARI) as CariDTO).hasil.map(keHasilCari)
    expect(p).toMatchObject({ ke: `/console/cashflow/pengguna/${SUBJEK}`, label: 'ded***@gmail.com' })
    expect(t!.ke).toBe(`/console/cashflow/pengguna/${SUBJEK}/transaksi?tx=11111111-1111-4111-8111-111111111111`)
    expect(s!.ke).toBeNull()
  })
})

// ── Pembukaan otomatis (keputusan Master 21 Sep 2026) ────────────────────
describe('isian kasus otomatis', () => {
  const r = (x: Partial<RuangCalon>): RuangCalon => ({ id: RUANG, nama: 'Bisnis', jenis: 'usaha', peran: 'owner', pemilik: true, bekas: false, anggota: 1, tx: 3, ...x })
  it('lingkup = SEMUA ruang subjek, termasuk ruang bersama dan bekas anggota; unik & terurut', () => {
    expect(lingkupSemua([r({ id: 'b', anggota: 3 }), r({ id: 'a', bekas: true, peran: null }), r({ id: 'b' })])).toEqual(['a', 'b'])
    expect(lingkupSemua([])).toEqual([])
  })
  it('kasus dipulihkan yang kurang ranah/ruang dilengkapi; tanpa pii ruang tidak dinilai', () => {
    const k = keKasus(kasus())
    expect(kurangDariKasus(k, [RUANG])).toEqual({ ranah: [], ruang: [] })
    expect(kurangDariKasus({ ...k, ranah: ['akun'] }, [RUANG, 'lain'])).toEqual({ ranah: ['transaksi', 'jejak'], ruang: ['lain'] })
    expect(kurangDariKasus({ ...k, lingkupTerlihat: false, ruang: [] }, [RUANG])).toEqual({ ranah: [], ruang: [] })
  })
  it('alasan otomatis: ≥ 8 aksara, cap waktu WIB sampai detik, induk ≠ anak', () => {
    const t = new Date('2026-09-21T15:05:09Z')
    expect(capWaktuWib(t)).toBe('2026-09-21 22.05.09 WIB')
    const induk = alasanOtomatis(t)
    const anak = alasanT3Otomatis(t)
    expect(induk).toBe('Dibuka dari console CashFlow — Pengguna 360 · 2026-09-21 22.05.09 WIB')
    expect(anak).toBe('Catatan dibuka dari console CashFlow · 2026-09-21 22.05.09 WIB')
    expect(alasanCukup(induk) && alasanCukup(anak)).toBe(true)
    // Pembanding "alasan sama" versi 0089 lama (huruf kecil, tanpa spasi/tanda
    // baca). Server terbaru tidak lagi menuntut alasan berbeda; cap waktu
    // menjaga console tetap lolos bila syarat itu kembali.
    const kunci = (a: string) => a.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
    expect(kunci(induk)).not.toBe(kunci(anak))
    // Anggaran 2 jam BARU menolak alasan yang sama dalam 24 jam: cap waktu membuatnya berbeda.
    expect(kunci(alasanOtomatis(new Date(t.getTime() + 2 * 3600e3)))).not.toBe(kunci(induk))
    expect(kunci(alasanT3Otomatis(new Date(t.getTime() + 1000)))).not.toBe(kunci(anak))
  })
  it('alasan: minimal 8 aksara', () => {
    expect(alasanCukup('  tiket 12 ')).toBe(true)
    expect(alasanCukup('tiket1  ')).toBe(false)
  })
})
