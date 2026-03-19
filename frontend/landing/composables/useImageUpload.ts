/**
 * Image upload composable — uploads to Cloudflare R2 via gateway.
 */

export const useImageUpload = () => {
  const api = useAdminApi()
  const uploading = ref(false)
  const imageUrl = ref('')
  const error = ref('')

  const uploadImage = async (file: File): Promise<string | null> => {
    uploading.value = true
    error.value = ''
    try {
      const res = await api.upload('/admin/upload', file)
      if (res.errors) {
        error.value = res.errors.message
        return null
      }
      imageUrl.value = res.data.url
      return res.data.url
    } catch (err: any) {
      error.value = err?.data?.errors?.message || 'Gagal upload gambar'
      return null
    } finally {
      uploading.value = false
    }
  }

  return { uploading, imageUrl, error, uploadImage }
}
