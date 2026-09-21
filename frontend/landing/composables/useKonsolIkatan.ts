/**
 * Token ikatan dokumen console di sisi klien (server/lib/konsol/ikatan.ts).
 *
 * Server menitipkan token di <meta name="ca-konsol-ikat"> HANYA pada HTML
 * navigasi dokumen /console (termasuk /console/login). Serah terima login
 * (/api/admin/sesi) mengganti cookie `ikat`; halaman login lalu memuat dokumen
 * console baru yang membawa token barunya. Token dibaca sekali (plugins/konsol-isolasi),
 * elemennya dibuang, lalu hidup di memori modul ini saja: bukan
 * sessionStorage/localStorage, karena halaman publik di tab yang sama bisa
 * membaca keduanya. Setiap panggilan BFF membawanya di X-Konsol-Ikat.
 *
 * BFF menjawab 403 'ikatan' bila token tidak ada atau basi (mis. login di tab
 * lain mengganti cookie `ikat`). Obatnya satu: muat ulang dokumen, karena
 * hanya navigasi yang diberi token. Penahan loop sama dengan penjaga GTM.
 * Muat ulang otomatis hanya untuk baca; simpan yang ditolak menunggu admin
 * menekan "Muat ulang" (useAdminApi). Draf form dititipkan dulu (useDrafKonsol).
 */
let token: string | null = null
let sudahDibaca = false

/** Token dokumen ini, atau null (dokumen publik, atau server tidak memberi). */
export function ikatanKonsol(): string | null {
  if (!import.meta.client) return null
  if (!sudahDibaca) {
    sudahDibaca = true
    token = bacaIkatanMeta(document)
  }
  return token
}

export function headerIkatan(): Record<string, string> {
  const t = ikatanKonsol()
  return t ? { [HEADER_IKATAN]: t } : {}
}

/**
 * Galat 403 'ikatan' → muat ulang dokumen penuh (dijaga penahan loop).
 * true bila memuat ulang; false bila bukan galat ikatan atau muat ulang
 * ditahan (pemanggil menampilkan pesan).
 */
export function pulihkanIkatan(galat: unknown): boolean {
  if (!import.meta.client || !galatIkatan(galat)) return false
  let simpan: Storage | null = null
  try {
    simpan = window.sessionStorage
  } catch { /* penyimpanan diblokir: jangan memuat ulang */ }
  if (!bolehMuatUlang(simpan, Date.now())) return false
  muatUlangKonsol()
  return true
}

/** Muat ulang dokumen console atas perintah console sendiri (tanpa penahan
 *  loop: dipakai tombol yang ditekan admin). */
export function muatUlangKonsol() {
  pindahDisengaja()
  window.location.reload()
}
