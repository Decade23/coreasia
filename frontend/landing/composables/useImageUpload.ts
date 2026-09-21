/**
 * Image upload composable — uploads to Cloudflare R2 via gateway.
 *
 * Sejak 0c unggahan lewat fungsi Vercel (proxy /api/gw), yang menolak badan
 * di atas ±4,5 MB dengan 413 sebelum sampai ke gateway (batas gateway 5 MB).
 * Jadi batasnya dicek di sini dulu, dengan pesan yang menyebut angkanya.
 */

export const useImageUpload = () => {
  const api = useAdminApi()
  const { tc } = useConsoleI18n()
  const uploading = ref(false)
  const imageUrl = ref('')
  const error = ref('')

  const pesanTerlaluBesar = () => tc('feedback.uploadTooLarge', { mb: UKURAN_MAKS_GAMBAR / (1024 * 1024) })

  const uploadImage = async (file: File): Promise<string | null> => {
    error.value = ''
    if (gambarTerlaluBesar(file.size)) {
      error.value = pesanTerlaluBesar()
      return null
    }
    uploading.value = true
    try {
      const res = await api.upload('/admin/upload', file)
      if (res.errors) {
        error.value = res.errors.message
        return null
      }
      imageUrl.value = res.data.url
      return res.data.url
    } catch (err: any) {
      // 413 dari Vercel berbadan teks, bukan {errors}: petakan ke pesan ukuran.
      error.value = galatDari(err).status === 413
        ? pesanTerlaluBesar()
        : err?.data?.errors?.message || tc('feedback.uploadFailed')
      return null
    } finally {
      uploading.value = false
    }
  }

  return { uploading, imageUrl, error, uploadImage }
}
