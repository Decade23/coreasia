/**
 * State daftar di URL (bertipe, daftar putih kunci) — /pengguna, /audit.
 *
 * Tafsir dan tulisnya fungsi murni di adapters/cashflowQuery.ts (teruji);
 * di sini hanya ikatan ke router. Selalu `replace`, tidak pernah `push`:
 * mengganti segmen atau halaman daftar bukan langkah yang ingin diulang
 * dengan Back — Back seharusnya keluar dari daftar, dan refresh/Back dari
 * halaman detail kembali ke posisi yang sama karena posisi itu ada di URL.
 */
import { bacaQuery, tulisQuery, type NilaiQuery, type SkemaQuery } from '~/adapters/cashflowQuery'

export const useCashflowQuery = <S extends SkemaQuery>(skema: S) => {
  const route = useRoute()
  const router = useRouter()
  /* Dipatok ke path halaman pemanggil: saat pindah halaman, route berubah
     SEBELUM halaman lama dilepas, dan query halaman lain tidak boleh terbaca
     sebagai saringan di sini. */
  const path = route.path
  let terakhir = bacaQuery(skema, route.query)

  const nilai = computed<NilaiQuery<S>>(() => {
    if (route.path === path) terakhir = bacaQuery(skema, route.query)
    return terakhir
  })

  /** Ubah sebagian kunci; kunci lain di skema dipertahankan, kunci di luar skema dibuang. */
  const setel = (ubah: Partial<NilaiQuery<S>>) => {
    if (route.path !== path) return Promise.resolve()
    return router.replace({ path, query: tulisQuery(skema, { ...nilai.value, ...ubah }) })
  }

  return { nilai, setel }
}
