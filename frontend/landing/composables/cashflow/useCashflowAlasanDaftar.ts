/**
 * Alasan pembukaan email lengkap di daftar pengguna — diingat 30 menit di
 * MEMORI tab, bukan storage.
 *
 * Tujuannya satu: kembali dari detail ke daftar tidak memaksa mengetik alasan
 * yang sama lagi. Setiap muat ulang daftar dengan alasan ini tetap menulis
 * satu baris audit di server; yang dihemat hanya ketikan, bukan jejaknya.
 * Tidak di sessionStorage/localStorage: alasan (yang bisa memuat nomor tiket
 * atau nama pelapor) tidak perlu bertahan melewati tab ini, dan refresh
 * penuh memang seharusnya kembali ke tampilan tersamar.
 *
 * TERIKAT PELAKU. Logout dan login console sama-sama navigasi SPA, jadi
 * variabel modul ini hidup melewati pergantian admin di tab yang sama. Tanpa
 * pengikat, admin kedua langsung melihat email utuh semua orang tanpa
 * mengetik apa pun — dan membaca alasan admin pertama di spanduk. Maka:
 * alasan disimpan bersama id admin console yang mengetiknya, ambil() menolak
 * bila admin yang aktif berbeda (atau belum diketahui), dan logout melupakannya
 * (useCashflowSesi.keluar).
 */
const UMUR_MS = 30 * 60 * 1000

export interface AlasanDaftar { alasan: string; sampai: number }

let simpanan: (AlasanDaftar & { pelaku: string }) | null = null

/** Lupakan tanpa perlu konteks komponen — dipanggil juga dari jalur logout. */
export const lupakanAlasanDaftar = () => { simpanan = null }

export const useCashflowAlasanDaftar = () => {
  const { user } = useAdminAuth()
  const pelakuKini = () => user.value?.id ?? ''

  /** Alasan yang masih berlaku milik admin yang sedang masuk, atau null. */
  const ambil = (): AlasanDaftar | null => {
    const siapa = pelakuKini()
    if (simpanan && siapa && simpanan.pelaku === siapa && simpanan.sampai > Date.now()) {
      return { alasan: simpanan.alasan, sampai: simpanan.sampai }
    }
    // Milik admin lain atau kedaluwarsa: buang, jangan sekadar disembunyikan.
    simpanan = null
    return null
  }

  /** Ingat alasan dan pulangkan salinannya — pemanggil memakai salinan ini
   *  untuk muat berikutnya, bukan ambil(), supaya batas 30 menit yang dipakai
   *  menyamarkan sama dengan yang dipakai membuka. */
  const ingat = (alasan: string): AlasanDaftar => {
    const entri = { alasan, sampai: Date.now() + UMUR_MS }
    const siapa = pelakuKini()
    // Admin belum diketahui: tetap dipakai untuk muat ini, tapi tidak diingat.
    simpanan = siapa ? { ...entri, pelaku: siapa } : null
    return entri
  }

  return { ambil, ingat, lupakan: lupakanAlasanDaftar }
}
