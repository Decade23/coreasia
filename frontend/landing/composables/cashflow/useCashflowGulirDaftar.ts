/**
 * Pindah halaman daftar = kembali ke kepala daftar.
 *
 * Paginasi di klien tidak membuat ulang elemen apa pun: wadah tabel DataTable
 * (.ca-console-table-wrap, max-height 60vh) menyimpan scrollTop-nya, dan
 * jendela tetap di posisi pager di bawah. Halaman berikutnya lalu tampil dari
 * tengah — terbaca seolah barisnya terlompati. Nuxt tidak menggulir karena
 * yang berubah hanya query.
 *
 * Pasang `wadah` (ref) pada pembungkus daftar; beri pembungkusnya scroll-mt-*
 * setinggi bilah atas console yang sticky.
 */
export const useCashflowGulirDaftar = () => {
  const wadah = ref<HTMLElement | null>(null)

  const keKepala = async () => {
    await nextTick()
    const el = wadah.value
    if (!el) return
    el.querySelector<HTMLElement>('.ca-console-table-wrap')?.scrollTo({ top: 0 })
    el.scrollIntoView({ block: 'start' })
  }

  return { wadah, keKepala }
}
