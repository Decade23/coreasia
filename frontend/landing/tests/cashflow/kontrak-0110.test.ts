/**
 * Kontrak DTO console ↔ RPC 0110 (admin_versi_aplikasi,
 * admin_ajakan_pembaruan, admin_langkah_usaha).
 *
 * Contoh jawaban di bawah bertipe DTO adapter, dan kuncinya dibandingkan
 * dengan kunci jsonb_build_object di definisi TERAKHIR fungsinya di migrasi
 * (tests/cashflow/migrasi.ts). Kunci yang diganti di salah satu sisi membuat
 * uji ini merah, bukan bagian console yang kosong diam-diam.
 *
 * Penjaga server yang dibaca console: agregat T0 tanpa audit, penjaga
 * is_platform_admin() lebih dulu, 22023 hint hari (dilokalkan galat.hari),
 * dan 0110 tidak mengubah tabel apa pun.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DIR_MIGRASI, adaMigrasiNomor, fungsiTerakhir, pohonContoh, pohonJsonb, urutPohon } from './migrasi'
import type { VersiAplikasiDTO, AjakanPembaruanDTO, LangkahUsahaDTO } from '../../adapters/cashflowVersi'
import { HINT_22023 } from '../../composables/cashflow/useCashflowAdmin'

/* Angka karangan; yang diuji hanya kuncinya. */
const VERSI: VersiAplikasiDTO = {
  hari: 30, aktif: 120, aktif_luar: 108, diketahui: 52, diketahui_luar: 45,
  baris: [{ platform: 'android', varian: 'prod', kode: 26101003, versi: '1.3.1', pengguna: 25, pengguna_luar: 22, terakhir: '2026-10-14T03:59:00+00:00' }],
  tertinggi: [{ platform: 'android', varian: 'prod', kode: 26101003, versi: '1.3.1' }],
  konfig: { versi_android: null, versi_android_uat: null, versi_android_ias: null },
}
const AJAKAN: AjakanPembaruanDTO = {
  hari: 30,
  baris: [{ langkah: 'pembaruan.ajakan_ketuk', ke: 26101450, jalur: 'pasar', tertahan: null, kejadian: 1, orang: 1, orang_luar: 1 }],
  ringkas: [{ langkah: 'pembaruan.ajakan_ketuk', ke: 26101450, kejadian: 1, orang: 1, orang_luar: 1 }],
  sampai: [{ ke: 26101450, orang: 0, orang_luar: 0 }],
}
const LANGKAH: LangkahUsahaDTO = {
  hari: 30,
  baris: [{ langkah: 'ruang.buat_usaha', isi: 'ajakan_beranda', kejadian: 1, orang: 1, orang_luar: 1 }],
  ruang_usaha_baru: [{ minggu: '2026-10-12', jumlah: 9, jumlah_luar: 8 }],
}
const RPC = [
  ['admin_versi_aplikasi', VERSI],
  ['admin_ajakan_pembaruan', AJAKAN],
  ['admin_langkah_usaha', LANGKAH],
] as const

describe.skipIf(!adaMigrasiNomor('0110'))('kontrak 0110', () => {
  for (const [nama, contoh] of RPC) {
    it(`${nama}: kunci contoh = kunci server`, () => {
      const { berkas, badan } = fungsiTerakhir(nama)
      expect(berkas).toMatch(/^0110_/)
      expect(urutPohon(pohonContoh(contoh))).toEqual(urutPohon(pohonJsonb(badan)))
    })
    it(`${nama}: is_platform_admin() lebih dulu, hari 1..90 hint hari, tanpa audit`, () => {
      const { kepala, badan } = fungsiTerakhir(nama)
      expect(kepala).toMatch(/\(p_hari integer default 30\)\s*returns jsonb\s+language plpgsql\s+stable\s+security definer\s+set search_path = public/i)
      const awal = badan.slice(badan.indexOf('begin'))
      expect(awal).toMatch(/^begin\s+if not public\.is_platform_admin\(\) then\s+raise exception 'Bukan admin platform\.' using errcode = '42501';/)
      expect(awal).toMatch(/if v_hari < 1 or v_hari > 90 then\s+raise exception '[^']+' using errcode = '22023', hint = 'hari';/)
      expect(badan).not.toMatch(/admin_audit|konsol_boleh|admin_kasus/)
      expect(badan).toMatch(/not public\.identitas_layanan\(/)
      expect(badan).toMatch(/public\.akun_dalam_inti\(\)/)
    })
  }

  it('hint hari dikenal console (dilokalkan galat.hari)', () => {
    expect(HINT_22023).toContain('hari')
  })

  it('0110 hanya membuat fungsi: tidak mengubah tabel atau data', () => {
    const nama = readdirSync(DIR_MIGRASI).find(n => n.startsWith('0110_'))!
    const sql = readFileSync(join(DIR_MIGRASI, nama), 'utf8').replace(/--[^\n]*/g, '')
    expect(sql).not.toMatch(/\b(alter\s+table|insert\s+into|update\s+public\.|delete\s+from|truncate|drop\s+)/i)
    expect([...sql.matchAll(/create\s+or\s+replace\s+function\s+public\.(\w+)/gi)].map(m => m[1]).sort())
      .toEqual(['admin_ajakan_pembaruan', 'admin_langkah_usaha', 'admin_versi_aplikasi', 'akun_dalam_inti'])
    expect(sql).not.toMatch(/grant[^;]*\banon\b/i)
  })
})
