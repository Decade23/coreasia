/**
 * Buka samaran untuk sesi console ber-pii dan tabel Pengguna lengkap
 * (keputusan Master 19 Nov 2026, K1, K3, K7). Adapter murni: daftar Ruang v3,
 * Ruang 360 v2, kepala Pengguna v2, daftar Pengguna v5 (kolom, asal, waktu
 * ber-detik), dan jatuh ke RPC lama di server yang belum memasangnya.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { kePengguna, keRuang, type PenggunaDTO, type RuangDTO } from '../../adapters/cashflow'
import { keKepala, type KepalaPenggunaDTO } from '../../adapters/cashflowBuku'
import { keRuang360, type Ruang360DTO } from '../../adapters/cashflowRuang'
import { waktuDetikWib } from '../../adapters/cashflowWaktu'
import { bacaDaftarV5, butuhV5, keAsal, kolomUntuk, waktuSel, KOLOM_PENGGUNA, URUT_V5 } from '../../adapters/cashflowPenggunaKolom'
import {
  ALASAN_DAFTAR_RUANG, ALASAN_KEPALA_PENGGUNA, URUT_RUANG, arahBawaanRuang, denganCadangan, gantiUrutRuang,
} from '../../adapters/cashflowSamaran'
import { adaMigrasi, parameterFungsi } from './migrasi'
import { KAMUS_CASHFLOW } from '../../composables/cashflow/useCashflowI18n'

const AKAR = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const baca = (f: string) => readFileSync(join(AKAR, f), 'utf8')
const belum = Object.assign(new Error('belum'), { jenis: 'belum-aktif' })
const izin = Object.assign(new Error('izin'), { jenis: 'izin' })

describe('waktuDetikWib (TP-03)', () => {
  it('19 Nov 2026 14.05.09, WIB apa pun zona peramban, akhiran WIB bisa dibuang', () => {
    expect(waktuDetikWib('2026-11-19T07:05:09Z')).toBe('19 Nov 2026 14.05.09 WIB')
    expect(waktuDetikWib('2026-11-19T07:05:09Z', 'id', { zona: false })).toBe('19 Nov 2026 14.05.09')
    expect(waktuDetikWib('2026-11-19T07:05:09Z', 'en', { zona: false })).toBe('19 Nov 2026 14:05:09')
    // Lewat tengah malam UTC tetap hari WIB berikutnya.
    expect(waktuDetikWib('2026-11-18T17:00:00Z', 'id', { zona: false })).toBe('19 Nov 2026 00.00.00')
    expect(waktuDetikWib(null)).toBe('—')
    expect(waktuDetikWib('bukan tanggal')).toBe('—')
  })
  it('sel tabel: ber-detik hanya bila baris terbuka, tanggal saja bila tidak', () => {
    expect(waktuSel('2026-11-19T07:05:09Z', { terbuka: true, bahasa: 'id' })).toBe('19 Nov 2026 14.05.09')
    expect(waktuSel('2026-11-19T07:05:09Z', { terbuka: false, bahasa: 'id' })).toBe('19 Nov 2026')
    expect(waktuSel(null, { terbuka: true, bahasa: 'id' })).toBe('—')
  })
})

describe('daftar Pengguna v5 (TP-01, TP-02, TP-05)', () => {
  it('tujuh urutan baru, dan hanya urutan v5 yang butuh v5', () => {
    expect([...URUT_V5]).toEqual(['masuk', 'status', 'status_wa', 'kredit_beli', 'domi_30', 'nama', 'sumber'])
    expect(butuhV5({ urut: 'masuk' })).toBe(true)
    expect(butuhV5({ urut: 'domi' })).toBe(false)
  })
  it('kolom per server: v3 dua belas, v4 tujuh belas, v5 delapan belas dengan Sumber', () => {
    expect(kolomUntuk(3)).toHaveLength(12)
    expect(kolomUntuk(4)).toHaveLength(17)
    expect(kolomUntuk(5).map(k => k.key)).toEqual(KOLOM_PENGGUNA.map(k => k.key))
    expect(kolomUntuk(5).at(-1)!.key).toBe('sumber')
  })
  it('asal: bentuk kontrak, nilai kosong jadi null, jawaban di luar daftar dibuang', () => {
    expect(keAsal({ sumber: 'ig', medium: 'bio', kampanye: 'nov', jawaban: 'instagram', dicatat: '2026-11-19T07:05:09Z' }))
      .toEqual({ sumber: 'ig', medium: 'bio', kampanye: 'nov', jawaban: 'instagram', dicatatIso: '2026-11-19T07:05:09Z' })
    expect(keAsal({ sumber: ' ', jawaban: 'whatsapp_teman' })).toMatchObject({ sumber: null, jawaban: 'whatsapp_teman' })
    expect(keAsal({ sumber: null, jawaban: 'karangan' })).toBeNull()
    expect(keAsal(null)).toBeNull()
    expect(keAsal(undefined)).toBeNull()
  })
  it('baris: terbuka dan asal dibaca, server lama tanpa kunci asal', () => {
    const d: PenggunaDTO = {
      user_id: 'u1', email: 'sari@contoh.invalid', display_name: 'Sari', created_at: '2026-10-20T03:00:00Z', last_sign_in: null,
      banned_until: null, jumlah_ruang: 1, jumlah_tx: 2, terbuka: true, total_semua: 1, asal: { sumber: 'wa', jawaban: null },
    }
    expect(kePengguna(d)).toMatchObject({ terbuka: true, emailPenuh: 'sari@contoh.invalid', asal: { sumber: 'wa' } })
    const { asal: _a, ...lama } = d
    expect(kePengguna({ ...lama, terbuka: false, email: 'sar***@contoh.invalid' })).toMatchObject({ terbuka: false, asal: null, emailPenuh: null })
  })
  it('v5 dulu, server lama jatuh ke v4/v3, urutan v5 di server lama tidak dikirim', async () => {
    let lama = 0
    const ok = await bacaDaftarV5({ kenalV5: null, butuh: false, v5: async () => 'v5', lama: async () => { lama++; return 'lama' } })
    expect(ok).toEqual({ hasil: 'v5', v5: true })
    expect(await bacaDaftarV5({ kenalV5: null, butuh: false, v5: async () => { throw belum }, lama: async () => 'lama' })).toEqual({ hasil: 'lama', v5: false })
    expect(await bacaDaftarV5({ kenalV5: null, butuh: true, v5: async () => { throw belum }, lama: async () => 'lama' })).toEqual({ hasil: null, v5: false })
    expect(await bacaDaftarV5({ kenalV5: false, butuh: false, v5: async () => { throw new Error('tidak boleh') }, lama: async () => 'lama' })).toEqual({ hasil: 'lama', v5: false })
    await expect(bacaDaftarV5({ kenalV5: null, butuh: false, v5: async () => { throw izin }, lama: async () => 'lama' })).rejects.toBe(izin)
    expect(lama).toBe(0)
  })
  it('kamus: label kolom, status WhatsApp singkat, dan jawaban asal di ID dan EN, tanpa tanda pisah panjang atau titik koma', () => {
    for (const b of ['id', 'en'] as const) {
      const v5 = KAMUS_CASHFLOW[b].pengguna.v5
      for (const s of ['masuk', 'kirim', 'lewat', 'belum', 'lain'] as const) expect(v5.statusWaPendek[s].length).toBeGreaterThan(0)
      for (const j of ['instagram', 'tiktok', 'whatsapp_teman', 'google', 'play_store', 'lainnya', 'lewati'] as const) expect(v5.jawaban[j].length).toBeGreaterThan(0)
      for (const teks of [v5.sumberKet, v5.waktuKet, v5.namaTersamar, v5.sumberKosong, KAMUS_CASHFLOW[b].ruang.ketTerbuka, KAMUS_CASHFLOW[b].ruang.cariKetTerbuka]) {
        expect(teks).not.toMatch(/[—–;]|\p{Extended_Pictographic}/u)
      }
    }
  })
})

describe('daftar Ruang v3 (SM-01, SM-02)', () => {
  it('urut per kolom: kepala sama membalik arah, hitungan butuh izin', () => {
    expect([...URUT_RUANG]).toEqual(['dibuat', 'nama', 'pemilik', 'jenis', 'anggota', 'tx', 'undangan'])
    expect(arahBawaanRuang('nama')).toBe('asc')
    expect(arahBawaanRuang('tx')).toBe('desc')
    expect(gantiUrutRuang({ urut: 'dibuat', arah: 'desc' }, 'nama', { tanpaHitungan: false })).toEqual({ urut: 'nama', arah: 'asc', hal: 1 })
    expect(gantiUrutRuang({ urut: 'nama', arah: 'asc' }, 'nama', { tanpaHitungan: false })).toEqual({ urut: 'nama', arah: 'desc', hal: 1 })
    expect(gantiUrutRuang({ urut: 'dibuat', arah: 'desc' }, 'tx', { tanpaHitungan: true })).toBeNull()
    expect(gantiUrutRuang({ urut: 'dibuat', arah: 'desc' }, 'created_at', { tanpaHitungan: false })).toBeNull()
  })
  it('keRuang terbuka tidak menyamarkan ulang, tertutup tetap sabuk kedua', () => {
    const d: RuangDTO = { workspace_id: 'w', nama: 'Tabungan Rahasia', pemilik_email: 'budi@contoh.invalid', jenis: 'pribadi', jumlah_anggota: 1, jumlah_tx: 0, undangan_aktif: 0, dibuat: '2026-11-01T00:00:00Z', pemilik_id: 'u', pemilik_nama: 'Budi' }
    expect(keRuang(d, { terbuka: true })).toMatchObject({ nama: 'Tabungan Rahasia', pemilik: 'budi@contoh.invalid', pemilikNama: 'Budi', pemilikId: 'u' })
    expect(keRuang(d)).toMatchObject({ nama: 'Ta······', pemilik: 'bu***@contoh.invalid', pemilikNama: null, pemilikId: null })
  })
  it('halaman: v3 dengan alasan tetap, jatuh ke v2, baris dan kartu membuka Ruang 360', () => {
    const hal = baca('pages/console/cashflow/ruang/index.vue')
    expect(ALASAN_DAFTAR_RUANG.length).toBeGreaterThanOrEqual(8)
    expect(hal).toMatch(/const alasan = izinPribadi\.value && !samarkan\.value \? ALASAN_DAFTAR_RUANG : null/)
    expect(hal).toMatch(/else if \(e\.jenis !== 'belum-aktif'\) throw e/)
    expect(hal).toMatch(/serverV3\.value = false\s+\}\s+const rows = await api\.daftarRuang\(MAKS, 0, cari\.value, jenis\)/)
    expect(hal).toMatch(/@row-click="\(row: \{ id: string \}\) => navigateTo\(keRuang360\(row\.id\)\)"/)
    expect(hal).toMatch(/data-uji="ruang-kartu-buka"/)
    expect(hal).toMatch(/useState<string \| null>\('cf_kontak_disamarkan_oleh'/)
  })
  it.skipIf(!adaMigrasi)('argumen v3 di migrasi = yang dikirim console', () => {
    expect(parameterFungsi('admin_daftar_ruang_v3').map(p => p.nama)).toEqual(['p_limit', 'p_offset', 'p_cari', 'p_jenis', 'p_urut', 'p_arah', 'p_alasan'])
  })
})

describe('Ruang 360 v2 dan kepala Pengguna v2 (SM-03, SM-04)', () => {
  const r360 = (utuh: boolean): Ruang360DTO => ({
    kasus: 'k', email_utuh: utuh ? true : undefined,
    ruang: { workspace_id: 'w', nama: 'Warung', jenis: 'usaha', owner_nick: null, aturan_hapus: null, fitur_patungan: false, ada_cara_bayar: false, ada_qris: false, pemilik_id: 'u1', dibuat: '2026-01-01T00:00:00Z', ...(utuh ? { pemilik_email: 'ani@contoh.invalid', pemilik_nama: 'Ani' } : {}) },
    hitung: { anggota: 1, bekas_anggota: 1, undangan_aktif: 1, transaksi: 0, dompet: 0, jejak: 0, sampah: 0 },
    agregat: null,
    anggota: [{ user_id: 'u1', email: utuh ? 'ani@contoh.invalid' : 'ani***@contoh.invalid', peran: 'owner', joined_at: null, pemilik: true, tx_oleh_dia: 0, terakhir_catat_dia: null }],
    bekas: [{ user_id: 'u2', email: utuh ? 'budi@contoh.invalid' : 'bu***@contoh.invalid', tx_oleh_dia: 1 }],
    undangan: [{ id: 'i', peran: 'member', status: 'aktif', ada_label: false, target_email: utuh ? 'calon@contoh.invalid' : 'cal***@contoh.invalid', diundang_oleh: 'u1', diterima_oleh: null, dibuat: '2026-01-01T00:00:00Z', kedaluwarsa: null, diterima_pada: null, dicabut_pada: null, ditolak_pada: null }],
  })
  it('v2: email utuh di anggota, bekas, undangan, dan pemilik. v1: tetap tersamar', () => {
    const v2 = keRuang360(r360(true))
    expect(v2).toMatchObject({ emailUtuh: true, ruang: { pemilikEmail: 'ani@contoh.invalid', pemilikNama: 'Ani' } })
    expect(v2.anggota[0]).toMatchObject({ emailUtuh: 'ani@contoh.invalid', emailTersamar: 'a***@contoh.invalid' })
    expect(v2.bekas[0]!.emailUtuh).toBe('budi@contoh.invalid')
    expect(v2.undangan[0]!.targetUtuh).toBe('calon@contoh.invalid')
    const v1 = keRuang360(r360(false))
    expect(v1).toMatchObject({ emailUtuh: false, ruang: { pemilikEmail: null, pemilikNama: null } })
    expect([v1.anggota[0]!.emailUtuh, v1.bekas[0]!.emailUtuh, v1.undangan[0]!.targetUtuh]).toEqual([null, null, null])
    // Bentuk tersamar tidak pernah lolos sebagai utuh walau tandanya true.
    expect(keRuang360({ ...r360(false), email_utuh: true }).anggota[0]!.emailUtuh).toBeNull()
  })
  it('kepala v2 terbuka: email dan nama utuh. Tanpa terbuka: tersamar seperti v1', () => {
    const k: KepalaPenggunaDTO = {
      user_id: 'u', email: 'sari@contoh.invalid', daftar: '2026-01-01T00:00:00Z', masuk_terakhir: null, banned_until: null,
      jumlah_ruang: 1, jumlah_transaksi: 1, akses_30hari: 1, ruang: [], terbuka: true, display_name: 'Sari',
    }
    expect(keKepala(k)).toMatchObject({ emailUtuh: 'sari@contoh.invalid', nama: 'Sari', terbuka: true, emailTersamar: 'sa***@contoh.invalid' })
    expect(keKepala({ ...k, terbuka: false })).toMatchObject({ emailUtuh: null, nama: null, terbuka: false })
    const { terbuka: _t, display_name: _d, ...v1 } = k
    expect(keKepala(v1)).toMatchObject({ emailUtuh: null, nama: null, terbuka: false })
  })
  it('jatuh ke RPC lama: belum aktif selalu, izin hanya bila diminta, galat lain diteruskan', async () => {
    expect(await denganCadangan({ kenal: null, baru: async () => 'baru', lama: async () => 'lama' })).toEqual({ hasil: 'baru', baru: true })
    expect(await denganCadangan({ kenal: null, baru: async () => { throw belum }, lama: async () => 'lama' })).toEqual({ hasil: 'lama', baru: false })
    expect(await denganCadangan({ kenal: false, baru: async () => { throw new Error('tidak boleh') }, lama: async () => 'lama' })).toEqual({ hasil: 'lama', baru: false })
    expect(await denganCadangan({ kenal: true, jatuhJuga: ['izin'], baru: async () => { throw izin }, lama: async () => 'lama' })).toEqual({ hasil: 'lama', baru: true })
    await expect(denganCadangan({ kenal: null, baru: async () => { throw izin }, lama: async () => 'lama' })).rejects.toBe(izin)
  })
  it('halaman: Ruang 360 memakai v2, kepala Pengguna v2 hanya untuk sesi ber-pii dengan alasan tetap', () => {
    expect(baca('composables/cashflow/useCashflowRuang.ts')).toMatch(/baru: \(\) => api\.ruang360V2\(kk\.id, ws\), lama: \(\) => api\.ruang360\(kk\.id, ws\)/)
    const p = baca('composables/cashflow/useCashflowPengguna.ts')
    expect(p).toMatch(/if \(!sesi\.boleh\('cashflow:pii'\)\) return api\.kepalaPengguna\(subjek\)/)
    expect(p).toMatch(/baru: \(\) => api\.kepalaPenggunaV2\(subjek, ALASAN_KEPALA_PENGGUNA\), lama: \(\) => api\.kepalaPengguna\(subjek\)/)
    expect(ALASAN_KEPALA_PENGGUNA.length).toBeGreaterThanOrEqual(8)
    expect(baca('pages/console/cashflow/ruang/[id]/anggota.vue')).toMatch(/\{\{ a\.emailUtuh \?\? a\.emailTersamar \}\}/)
  })
  it.skipIf(!adaMigrasi)('argumen v2 di migrasi = yang dikirim console', () => {
    expect(parameterFungsi('admin_pengguna_kepala_v2').map(p => p.nama)).toEqual(['p_user', 'p_alasan'])
    expect(parameterFungsi('admin_ruang_360_v2').map(p => p.nama)).toEqual(['p_kasus', 'p_ws'])
  })
})
