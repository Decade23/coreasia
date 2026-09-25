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
 * sesi yang dicetak dengan email lama. Kedua jalur tetap dipanggil:
 *   1. per id: admin_konsol_sesi_cabut_admin + admin_kasus_tutup_admin
 *      (sesi yang dicetak landing ini, yang menulis admin_gw_id);
 *   2. per email: admin_konsol_sesi_cabut_pelaku + admin_kasus_tutup_pelaku
 *      (sesi yang dicetak SEBELUM rilis ini, tanpa admin_gw_id; umurnya
 *      ≤ 12 jam, jadi jalur ini boleh dibuang sesudah jendela itu lewat).
 * Salah satunya boleh kosong; keduanya kosong = tidak ada yang dicabut.
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

/** Pemilik sesi console: id admin gateway (uuid) dan/atau email-nya. */
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
  const id = idAdminGateway(pemilik?.id)
  const email = (pemilik?.email ?? '').trim()
  if (!bahan.url || !bahan.service || (!id && !email)) return 'tak-terkonfigurasi'
  try {
    const admin = createClient(bahan.url, bahan.service, { auth: { persistSession: false, autoRefreshToken: false } })
    let gagal = false
    // Sesi dulu, baru kasus: yang menutup akses adalah pencabutan sesi.
    const sesi: Array<[string, Record<string, string>]> = []
    if (id) sesi.push(['admin_konsol_sesi_cabut_admin', { p_admin_gw_id: id }])
    if (email) sesi.push(['admin_konsol_sesi_cabut_pelaku', { p_email: email }])
    for (const [nama, arg] of sesi) {
      const { error } = await admin.rpc(nama, arg)
      if (error) {
        console.error(`[konsol] cabut sesi CashFlow gagal (${nama}):`, error.message)
        gagal = true
      }
    }
    const kasus: Array<[string, Record<string, string>]> = []
    if (id) kasus.push(['admin_kasus_tutup_admin', { p_admin_gw_id: id }])
    if (email) kasus.push(['admin_kasus_tutup_pelaku', { p_pelaku: email }])
    for (const [nama, arg] of kasus) {
      const { error } = await admin.rpc(nama, arg)
      if (error) console.error(`[konsol] tutup kasus CashFlow gagal (${nama}):`, error.message)
    }
    return gagal ? 'gagal' : 'dicabut'
  } catch (e) {
    console.error('[konsol] cabut sesi CashFlow gagal:', (e as Error)?.message)
    return 'gagal'
  }
}
