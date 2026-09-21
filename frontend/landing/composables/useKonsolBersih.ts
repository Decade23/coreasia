/**
 * Penjaga lapis kedua console bebas GTM (lapis pertama: plugins/konsol-isolasi.client.ts).
 *
 * Dipanggil di setup layout console dan halaman login. Bila GTM/tag iklan
 * ternyata sudah ada di dokumen ini (jalur navigasi yang lolos dari plugin),
 * dokumen dimuat ulang penuh: dokumen baru dimulai di /console sehingga plugin
 * gtag/google-ads tidak memuat apa pun. Penahan loop di bolehMuatUlang
 * (utils/konsol.ts) mencegah muat ulang berulang bila sumbernya bukan kita
 * (mis. ekstensi peramban yang memasang window.dataLayer).
 */
export const useKonsolBersih = () => {
  if (!import.meta.client || !pihakKetigaTermuat(window)) return
  let simpan: Storage | null = null
  try {
    simpan = window.sessionStorage
  } catch { /* penyimpanan diblokir: jangan memuat ulang */ }
  if (bolehMuatUlang(simpan, Date.now())) {
    window.location.reload()
  } else {
    console.warn('[console] skrip pihak ketiga terdeteksi, muat ulang ditahan untuk mencegah loop')
  }
}
