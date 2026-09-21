/**
 * Draf form console yang belum tersimpan (Fase 0c, putaran 2).
 *
 * Sesi habis atau ikatan dokumen basi bisa membuat dokumen console dimuat
 * ulang atau pindah ke /console/login (useAdminApi, useKonsolIkatan). Isian
 * form dititipkan di sessionStorage tab ini dan dipulihkan saat halaman yang
 * sama dibuka lagi oleh admin yang sama:
 *   - ditulis 400 ms sesudah form berbeda dari keadaan awalnya, dan seketika
 *     saat dokumen akan ditinggalkan (beforeunload);
 *   - dihapus saat tersimpan ke server (tandaiTersimpan), saat form kembali
 *     seperti semula, atau lewat "Buang"; kedaluwarsa 24 jam; terikat id admin;
 *   - dihapus setiap kali dokumen publik dimuat (plugins/konsol-isolasi):
 *     GTM di dokumen publik tab yang sama bisa membaca sessionStorage. Isinya
 *     draf artikel, bukan kredensial.
 * beforeunload bertanya "tinggalkan halaman?" bila form berubah, kecuali
 * perpindahannya dimulai console sendiri (pindahDisengaja) DAN draf berhasil
 * dititipkan.
 */
import type { AdminUser } from './useAdminAuth'

let disengaja = false

/** Dipanggil tepat sebelum console sendiri memuat ulang atau pindah dokumen. */
export function pindahDisengaja() {
  disengaja = true
}

const simpanan = (): Storage | null => {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function useDrafKonsol<T extends object>(kunci: string, ambil: () => T, pasang: (isi: T) => void) {
  const user = useState<AdminUser | null>('admin_user')
  const toast = useToast()

  let pemilik = ''
  /** JSON keadaan bersih (dari server / form kosong); null = belum dimulai. */
  let dasar: string | null = null
  let tunda: ReturnType<typeof setTimeout> | null = null

  const berubah = () => dasar !== null && JSON.stringify(ambil()) !== dasar

  /** true bila keadaan kini aman: tidak berubah, atau berhasil dititipkan. */
  const tulis = (): boolean => {
    if (tunda) {
      clearTimeout(tunda)
      tunda = null
    }
    if (dasar === null) return true
    const s = simpanan()
    if (!berubah()) {
      if (s) hapusDraf(s, kunci)
      return true
    }
    return !!s && simpanDraf(s, kunci, pemilik, ambil(), Date.now())
  }

  const jaga = (e: BeforeUnloadEvent) => {
    const aman = tulis()
    if (!berubah() || (disengaja && aman)) return
    e.preventDefault()
    e.returnValue = ''
  }

  const buang = () => {
    if (dasar !== null) pasang(JSON.parse(dasar) as T)
    const s = simpanan()
    if (s) hapusDraf(s, kunci)
  }

  /**
   * Panggil sesudah form terisi keadaan awalnya (data server, atau langsung
   * untuk form baru). Draf yang tertinggal milik admin ini dipulihkan.
   */
  const mulai = () => {
    pemilik = user.value?.id ?? ''
    dasar = JSON.stringify(ambil())
    const s = simpanan()
    const draf = s && pemilik ? bacaDraf<T>(s, kunci, pemilik, Date.now()) : null
    if (!draf) return
    pasang(draf)
    toast.info('', 12_000, { kunci: 'draf.dipulihkan', aksi: { kunci: 'draf.buang', jalankan: buang } })
  }

  /** Isian sudah diterima server: keadaan kini jadi dasar, draf dihapus. */
  const tandaiTersimpan = () => {
    if (dasar === null) return
    dasar = JSON.stringify(ambil())
    tulis()
  }

  watch(ambil, () => {
    if (dasar === null) return
    if (tunda) clearTimeout(tunda)
    tunda = setTimeout(tulis, 400)
  }, { deep: true })

  onMounted(() => window.addEventListener('beforeunload', jaga))
  onBeforeUnmount(() => {
    tulis()
    window.removeEventListener('beforeunload', jaga)
  })

  return { mulai, tandaiTersimpan, buang, berubah }
}
