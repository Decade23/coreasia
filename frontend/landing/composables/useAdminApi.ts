/**
 * Klien API console — lewat BFF Nitro `/api/gw/**` (Fase 0c).
 *
 * Peramban tidak lagi memegang token gateway: cookie HttpOnly sesi console
 * dibaca server Nitro, diubah menjadi Authorization: Bearer, dan di-refresh
 * di server bila gateway menjawab 401 (server/api/gw/[...path].ts). Jalur
 * yang dipakai modul tetap sama ('/admin/...'), jadi semua composable console
 * (artikel, bots, keywords, AI, API keys, CAD, users, audit) ikut pindah
 * tanpa perubahan.
 *
 * Metode selain GET membawa `X-Console: 1` — proxy menolaknya tanpa header
 * itu (lapis anti-CSRF di samping Sec-Fetch-Site). SEMUA metode membawa token
 * ikatan dokumen console (X-Konsol-Ikat, useKonsolIkatan); tanpanya proxy
 * menjawab 403 'ikatan'.
 *
 * 401 dari proxy berarti sesi benar-benar habis (refresh sudah dicoba di
 * server). Tindakannya (utils/konsol.ts tindakanGalatSesi):
 *   - baca: 403 'ikatan' → dokumen dimuat ulang; 401 → pindah ke /console/login;
 *   - tulis (simpan, hapus, unggah, generate): tidak ada yang otomatis. Isi
 *     form tetap, admin mendapat toast bertombol "Muat ulang"/"Masuk lagi".
 * Draf form (useDrafKonsol) dititipkan sebelum dokumen ditinggalkan.
 */

import type { NitroFetchOptions } from 'nitropack'

interface ApiResponse<T> {
  data: T
  meta?: { total: number; page: number; per_page: number }
  errors?: { code: string; message: string; details?: Array<{ field: string; message: string }> }
}

export const KONSOL_API_BASE = '/api/gw'
const HEADER_TULIS = { 'X-Console': '1' } as const

/** Ke /console/login, kembali ke halaman ini sesudah masuk (draf dipulihkan). */
function keLogin() {
  useState('admin_user').value = null
  // Bukan useRoute(): dipanggil juga dari middleware console dan tombol toast.
  const kini = useRouter().currentRoute.value
  if (kini.path === '/console/login') return
  pindahDisengaja()
  navigateTo({ path: '/console/login', query: { ke: kini.fullPath } })
}

function mintaMuatUlang(kunci: 'sesi.ikatanBaca' | 'sesi.ikatanTulis') {
  useToast().warning('', 0, { id: 'konsol-ikatan', kunci, aksi: { kunci: 'sesi.muatUlang', jalankan: muatUlangKonsol } })
}

export const useAdminApi = () => {
  const baseURL = KONSOL_API_BASE

  const sesiHabis = (err: unknown, metode: string | undefined) => {
    if (!import.meta.client) return
    switch (tindakanGalatSesi(metode, err)) {
      case 'muat-ulang':
        if (!pulihkanIkatan(err)) mintaMuatUlang('sesi.ikatanBaca')
        return
      case 'minta-muat-ulang':
        mintaMuatUlang('sesi.ikatanTulis')
        return
      case 'ke-login':
        keLogin()
        return
      case 'minta-masuk':
        useToast().warning('', 0, { id: 'konsol-sesi-habis', kunci: 'sesi.habisTulis', aksi: { kunci: 'sesi.masukLagi', jalankan: keLogin } })
    }
  }

  const panggil = async <T>(path: string, opsi: NitroFetchOptions<string>): Promise<T> => {
    try {
      const hasil: unknown = await $fetch(`${baseURL}${path}`, {
        ...opsi,
        headers: { ...headerIkatan(), ...(opsi.headers as Record<string, string> | undefined) },
      })
      return hasil as T
    } catch (err) {
      sesiHabis(err, opsi.method as string | undefined)
      throw err
    }
  }

  const get = <T>(path: string, params?: Record<string, any>) =>
    panggil<ApiResponse<T>>(path, { method: 'GET', params })

  const post = <T>(path: string, body?: any) =>
    panggil<ApiResponse<T>>(path, { method: 'POST', headers: HEADER_TULIS, body })

  const put = <T>(path: string, body?: any) =>
    panggil<ApiResponse<T>>(path, { method: 'PUT', headers: HEADER_TULIS, body })

  const del = async <T>(path: string): Promise<void> => {
    await panggil<T>(path, { method: 'DELETE', headers: HEADER_TULIS })
  }

  const upload = (path: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return panggil<ApiResponse<{ url: string }>>(path, { method: 'POST', headers: HEADER_TULIS, body: formData })
  }

  return { get, post, put, del, upload, baseURL }
}
