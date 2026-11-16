/**
 * Menandai dokumen sedang berada di area CashFlow: kelas `cf-area` di <body>.
 *
 * Tema CashFlow (assets/css/cashflow-tema.css) hanya berlaku di bawah kelas
 * ini, dan hanya untuk isi halaman serta lapisan yang dipindah ke <body>
 * (modal, laci, palet). Sidebar dan bilah atas console tidak ikut, dan modul
 * console lain tidak pernah memasang kelas ini. Kelasnya lepas sendiri begitu
 * komponen pemanggil dilepas (pindah ke modul lain).
 *
 * Dipanggil CashflowNav, yang ada di setiap halaman modul, dan halaman masuk.
 */
export const KELAS_AREA_CASHFLOW = 'cf-area'

export function useCashflowTema() {
  useHead({ bodyAttrs: { class: KELAS_AREA_CASHFLOW } })
}
