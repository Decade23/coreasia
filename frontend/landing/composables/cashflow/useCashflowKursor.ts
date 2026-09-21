/**
 * Pager keyset untuk tab berhalaman ?kursor= (Transaksi, Jejak, Akses).
 *
 * Kursor = objek dari server (kursor_berikut), dibawa di URL sebagai
 * base64url dan ditulis dengan PUSH — riwayat peramban menjadi tumpukan
 * halaman, jadi Back = halaman sebelumnya. Keyset tidak bisa mundur sendiri:
 * "Sebelumnya" mundur di riwayat HANYA bila entri sebelumnya memang halaman
 * sebelumnya di tab yang sama (path sama, tanpa laci ?tx=); selain itu
 * (tautan yang dibuka langsung di halaman 3) kembali ke halaman pertama.
 * Setiap pindah halaman menggulir ke kepala daftar (useCashflowGulirDaftar).
 */
import { kursorKeUrl } from '~/adapters/cashflowBuku'

export const useCashflowKursor = (o: {
  /** Teks ?kursor= saat ini ('' = halaman pertama). */
  kini: () => string
  /** kursor_berikut dari jawaban terakhir; null = halaman terakhir. */
  berikut: () => object | null | undefined
  /** Tulis ?kursor= (PUSH) — halaman membuang kunci lain yang perlu (mis. ?tx). */
  ke: (kursor: string) => Promise<unknown>
}) => {
  const route = useRoute()
  const router = useRouter()
  const { wadah, keKepala } = useCashflowGulirDaftar()

  const berikutnya = async () => {
    const k = o.berikut()
    if (!k) return
    await o.ke(kursorKeUrl(k))
    await keKepala()
  }
  const pertama = async () => {
    await o.ke('')
    await keKepala()
  }
  const sebelumnya = () => {
    if (!o.kini()) return
    const b: unknown = import.meta.client ? window.history.state?.back : null
    const [jalur, query = ''] = typeof b === 'string' ? b.split('?') : ['', '']
    if (jalur === route.path && !new URLSearchParams(query).get('tx')) router.back()
    else pertama()
  }

  useCashflowPintasan([
    { kunci: ']', aksi: () => { berikutnya() } },
    { kunci: '[', aksi: sebelumnya },
  ])

  return { wadah, berikutnya, sebelumnya, pertama }
}
