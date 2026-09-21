/**
 * Cabut SEMUA sesi modul CashFlow milik satu admin console (per email
 * pelaku), dari server. Dipakai saat admin keluar (/api/admin/logout) dan saat
 * sesinya diakhiri gateway (logout-all, TOTP diaktifkan/dimatikan).
 *
 * Klien juga memanggil DELETE /api/cashflow/sesi dengan token Supabase tab-nya,
 * tapi itu hanya jalan bila tab itu kebetulan memegang sesi CashFlow. Dari sini
 * sesi di tab/perangkat lain ikut mati tanpa menunggu umur 12 jamnya habis.
 *
 * Tidak pernah melempar: kegagalan dicatat, keluar dari console tetap jalan.
 */
import { createClient } from '@supabase/supabase-js'

export type HasilCabut = 'dicabut' | 'tak-terkonfigurasi' | 'gagal'

export async function cabutSesiCashflowPelaku(
  bahan: { url?: string | null; service?: string | null },
  email: string | null | undefined,
): Promise<HasilCabut> {
  const pelaku = (email ?? '').trim()
  if (!bahan.url || !bahan.service || !pelaku) return 'tak-terkonfigurasi'
  try {
    const admin = createClient(bahan.url, bahan.service, { auth: { persistSession: false, autoRefreshToken: false } })
    const { error } = await admin.rpc('admin_konsol_sesi_cabut_pelaku', { p_email: pelaku })
    if (error) {
      console.error('[konsol] cabut sesi CashFlow gagal:', error.message)
      return 'gagal'
    }
    return 'dicabut'
  } catch (e) {
    console.error('[konsol] cabut sesi CashFlow gagal:', (e as Error)?.message)
    return 'gagal'
  }
}
