/**
 * Remah (breadcrumb) yang dipasang HALAMAN, untuk layout console.
 *
 * Layout menebak remah dari path: menu yang cocok, lalu "Buat baru" untuk
 * /create dan "Edit" untuk path berakhiran UUID. Tebakan itu benar untuk
 * artikel dan pengguna console, tapi salah untuk halaman yang hanya MEMBACA —
 * detail pengguna CashFlow tertulis "Edit". Halaman yang tahu remahnya
 * memasangnya lewat `pasang()`; halaman lain tidak berubah apa pun.
 *
 * Remah terikat ke path halaman yang memasangnya. Saat pindah halaman, route
 * sudah berubah sebelum halaman lama dilepas; tanpa ikatan ini remah halaman
 * lama sempat tampil di halaman baru.
 *
 * `{ awalan: true }` (OPT-IN) untuk halaman INDUK rute bersarang (mis.
 * pengguna/[id].vue dengan tab anak): remahnya berlaku di path-nya sendiri
 * DAN di setiap path anaknya (`path/…`), karena induk tetap terpasang saat
 * tab berganti.
 */
import type { MaybeRefOrGetter } from 'vue'

export interface Remah {
  label: string
  to?: string
  /** OPT-IN: dipanggil alih-alih NuxtLink (yang selalu MENAMBAH entri riwayat);
   *  `to` tetap jadi href untuk klik tengah / tab baru. Fungsi di useState
   *  aman karena /console ssr:false — tidak ada payload yang diserialkan. */
  aksi?: () => void
}

/** Klik kiri tanpa pengubah — hanya itu yang boleh dicegat. Cmd/Ctrl/Shift/
 *  klik tengah dibiarkan ke peramban (buka di tab/jendela baru). */
export const klikBiasa = (e: MouseEvent) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.defaultPrevented

export const useConsoleRemah = () => {
  const route = useRoute()
  const simpanan = useState<{ path: string; awalan?: boolean; items: Remah[] } | null>('console_remah', () => null)

  /** Untuk halaman. Label boleh reaktif (mis. email tersamar yang baru dimuat). */
  const pasang = (items: MaybeRefOrGetter<Remah[]>, opsi: { awalan?: boolean } = {}) => {
    const path = route.path
    watchEffect(() => { simpanan.value = { path, awalan: opsi.awalan, items: toValue(items) } })
    onBeforeUnmount(() => {
      if (simpanan.value?.path === path) simpanan.value = null
    })
  }

  const cocok = (s: { path: string; awalan?: boolean }, kini: string) =>
    s.path === kini || (!!s.awalan && kini.startsWith(`${s.path}/`))

  /** Untuk layout: remah milik halaman aktif, atau null (pakai tebakan lama). */
  const aktif = computed<Remah[] | null>(() =>
    simpanan.value && cocok(simpanan.value, route.path) ? simpanan.value.items : null)

  return { pasang, aktif }
}
