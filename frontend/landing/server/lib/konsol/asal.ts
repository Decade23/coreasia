/**
 * Penjaga asal permintaan untuk semua rute BFF console (/api/admin/*,
 * /api/gw/**, /api/cashflow/sesi).
 *
 * 1. `Sec-Fetch-Site` WAJIB `same-origin`. Header ini dipasang peramban dan
 *    tidak bisa diubah JS (forbidden header). Tidak ada (klien non-peramban,
 *    curl) atau `cross-site`/`same-site`/`none` → 403. `same-site` ikut
 *    ditolak: subdomain lain di coreasia.id bukan console.
 * 2. Metode selain GET/HEAD juga wajib `X-Console: 1`. Header khusus memaksa
 *    preflight CORS untuk permintaan lintas asal, dan formulir HTML tidak bisa
 *    memasangnya: lapis kedua bila Sec-Fetch-Site suatu hari tidak ada.
 *
 * Aturan '/api/**' { cors: true } di nuxt.config memang memasang
 * Access-Control-Allow-Origin: * pada rute ini, tapi TANPA Allow-Credentials:
 * peramban tidak mengirim cookie lintas asal. Jangan pernah menambahkannya.
 */

export const HEADER_KONSOL = 'x-console'

export type SebabTolakAsal = 'lintas-situs' | 'tanpa-header-konsol'

export type HasilAsal = { ok: true } | { ok: false; sebab: SebabTolakAsal }

export function metodeAman(metode: string): boolean {
  const m = metode.toUpperCase()
  return m === 'GET' || m === 'HEAD'
}

export function periksaAsal(p: {
  metode: string
  secFetchSite?: string | null
  headerKonsol?: string | null
}): HasilAsal {
  if ((p.secFetchSite ?? '').trim().toLowerCase() !== 'same-origin') {
    return { ok: false, sebab: 'lintas-situs' }
  }
  if (!metodeAman(p.metode) && (p.headerKonsol ?? '').trim() !== '1') {
    return { ok: false, sebab: 'tanpa-header-konsol' }
  }
  return { ok: true }
}
