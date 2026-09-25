/**
 * Cabut SEMUA sesi modul CashFlow milik satu admin console, dari server.
 * Dipakai saat admin keluar (/api/admin/logout), saat sesinya diakhiri
 * gateway (logout-all, TOTP diaktifkan/dimatikan, akun sendiri diubah), dan
 * oleh DELETE /api/cashflow/sesi.
 *
 * Klien juga memanggil DELETE /api/cashflow/sesi dengan token Supabase tab-nya,
 * tapi itu hanya jalan bila tab itu kebetulan memegang sesi CashFlow. Dari sini
 * sesi di tab/perangkat lain ikut mati tanpa menunggu umur 12 jamnya habis.
 *
 * IDENTITAS (temuan F3, migrasi 0092). Admin dikenali dari id admin gateway
 * (admin_konsol_sesi.admin_gw_id), bukan dari email: email bisa diganti,
 * jadi pencabutan per email bisa meleset ke sesi admin lain atau melewatkan
 * sesi yang dicetak dengan email lama. Pencabutan HANYA per id:
 * admin_konsol_sesi_cabut_admin + admin_kasus_tutup_admin.
 *
 * Jalur per email (admin_konsol_sesi_cabut_pelaku / admin_kasus_tutup_pelaku)
 * dibuang sesudah transisi paket A (runbook, "Paket A"): landing paket A
 * tayang 26 Sep 2026 02:10 dan sejak itu setiap sesi dicetak ber-id; sesi
 * lama tanpa id habis ≤ 12 jam sesudahnya. RPC per email tetap ada di SQL
 * untuk runbook "Token console bocor", Langkah 1.
 *
 * Tanpa id yang sah tidak ada yang dicabut, dan hasilnya 'gagal' (bukan
 * pura-pura berhasil): pemanggil mencatatnya, dan DELETE /api/cashflow/sesi
 * mencabut sesi tab itu per session_id.
 *
 * Kasus (Fase 1, migrasi 0089) milik admin itu ikut ditutup. Aksesnya sudah
 * mati begitu sesinya dicabut — server menolak kasus yang dibuka sebelum
 * pencabutan sesi pelakunya — jadi kegagalan menutup kasus hanya dicatat dan
 * tidak mengubah hasil.
 *
 * Tidak pernah melempar: kegagalan dicatat, keluar dari console tetap jalan.
 */
import { createClient } from '@supabase/supabase-js'

export type HasilCabut = 'dicabut' | 'tak-terkonfigurasi' | 'gagal'

/** Pemilik sesi console: id admin gateway (uuid). Email hanya label log. */
export interface PemilikSesi {
  id?: string | null
  email?: string | null
}

const POLA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Id admin gateway yang sah (uuid, huruf kecil), atau null. */
export function idAdminGateway(v: unknown): string | null {
  return typeof v === 'string' && POLA_UUID.test(v.trim()) ? v.trim().toLowerCase() : null
}

export async function cabutSesiCashflowAdmin(
  bahan: { url?: string | null; service?: string | null },
  pemilik: PemilikSesi | null | undefined,
): Promise<HasilCabut> {
  if (!bahan.url || !bahan.service) return 'tak-terkonfigurasi'
  const id = idAdminGateway(pemilik?.id)
  if (!id) {
    console.error('[konsol] cabut sesi CashFlow: tanpa id admin gateway, tidak ada yang dicabut')
    return 'gagal'
  }
  try {
    const admin = createClient(bahan.url, bahan.service, { auth: { persistSession: false, autoRefreshToken: false } })
    // Sesi dulu, baru kasus: yang menutup akses adalah pencabutan sesi.
    const { error } = await admin.rpc('admin_konsol_sesi_cabut_admin', { p_admin_gw_id: id })
    if (error) {
      console.error('[konsol] cabut sesi CashFlow gagal (admin_konsol_sesi_cabut_admin):', error.message)
      return 'gagal'
    }
    const { error: eKasus } = await admin.rpc('admin_kasus_tutup_admin', { p_admin_gw_id: id })
    if (eKasus) console.error('[konsol] tutup kasus CashFlow gagal (admin_kasus_tutup_admin):', eKasus.message)
    return 'dicabut'
  } catch (e) {
    console.error('[konsol] cabut sesi CashFlow gagal:', (e as Error)?.message)
    return 'gagal'
  }
}
