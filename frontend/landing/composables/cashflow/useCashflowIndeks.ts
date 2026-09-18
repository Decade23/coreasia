/**
 * Indeks pengguna TERSAMAR di memori tab — untuk palet (Cmd/Ctrl+K), label
 * remah halaman detail, dan tombol kembali yang membawa posisi daftar.
 *
 * HANYA bentuk tersamar yang pernah masuk ke sini, sekalipun daftar sedang
 * dibuka dengan alasan: `isi()` mengambil {id, emailTersamar} saja. Palet
 * hidup di setiap halaman modul; kalau indeksnya memegang email utuh, email
 * semua orang ikut tinggal di memori sepanjang sesi tanpa alasan apa pun.
 *
 * Bila kosong (palet dibuka sebelum daftar pernah dimuat), indeks mengisi
 * dirinya lewat admin_daftar_pengguna_v2 TANPA alasan: server memulangkan
 * bentuk tersamar dan tidak menulis baris audit (0082).
 */
import { kePengguna, samarkanEmail } from '~/adapters/cashflow'

export interface EntriIndeks { id: string; emailTersamar: string }

const DAFTAR = '/console/cashflow/pengguna'
let pengisian: Promise<void> | null = null

export const useCashflowIndeks = () => {
  const api = useCashflowAdmin()
  const entri = useState<EntriIndeks[]>('cf_indeks_pengguna', () => [])
  const daftarTerakhir = useState<string>('cf_daftar_terakhir', () => DAFTAR)
  /* true bila server tidak memotong daftarnya (semua pengguna ada di `entri`).
     Hanya dengan itu palet boleh berkata sebuah UUID "tidak ada di daftar";
     di atas 500 orang, UUID yang tidak ada di sini masih bisa pengguna sah. */
  const lengkap = useState<boolean>('cf_indeks_lengkap', () => false)

  /** `total` = total_semua dari server, untuk tahu apakah daftarnya terpotong. */
  const isi = (baris: ReadonlyArray<{ id: string; emailTersamar: string }>, total: number) => {
    // samarkanEmail idempoten: jaring terakhir kalau pemanggil keliru memberi email utuh.
    entri.value = baris.map(b => ({ id: b.id, emailTersamar: samarkanEmail(b.emailTersamar) }))
    lengkap.value = baris.length >= total
  }

  const cari = (q: string, maks = 8): EntriIndeks[] => {
    const k = q.trim().toLowerCase()
    if (!k) return []
    return entri.value.filter(e => e.emailTersamar.toLowerCase().includes(k) || e.id.startsWith(k)).slice(0, maks)
  }

  const labelUntuk = (id: string): string | null => entri.value.find(e => e.id === id)?.emailTersamar ?? null

  /** Dipanggil halaman daftar setiap query-nya berubah — hanya path daftar yang diingat. */
  const ingatDaftar = (fullPath: string) => {
    if (fullPath === DAFTAR || fullPath.startsWith(`${DAFTAR}?`)) daftarTerakhir.value = fullPath
  }

  const muatBilaKosong = async (): Promise<void> => {
    if (entri.value.length) return
    if (!pengisian) {
      pengisian = api.daftarPengguna(500, 0, '', null)
        .then((rows) => { isi(rows.map(kePengguna), rows.length ? Number(rows[0]?.total_semua ?? rows.length) : 0) })
        .finally(() => { pengisian = null })
    }
    return pengisian
  }

  /** Logout: admin berikutnya di tab yang sama mulai dari nol. Nilai awal
   *  diisi ulang, bukan clearNuxtState — itu membuat ref jadi undefined
   *  selagi halaman lama masih dirender menjelang pindah ke /console/login. */
  const kosongkan = () => {
    entri.value = []
    lengkap.value = false
    daftarTerakhir.value = DAFTAR
  }

  return { entri: readonly(entri), lengkap: readonly(lengkap), isi, cari, labelUntuk, daftarTerakhir: readonly(daftarTerakhir), ingatDaftar, muatBilaKosong, kosongkan }
}
