/** Memperpanjang sesi ketika Console dipakai, termasuk halaman CashFlow yang
 *  datanya dibaca dari Supabase dan tidak selalu memanggil gateway. */
export const useKonsolPerangkatAktif = () => {
  const { user } = useAdminAuth()
  let aktivitas = Date.now()
  let diperpanjang = Date.now()
  let berjalan = false
  let timer: ReturnType<typeof setInterval> | undefined
  const sentuh = () => { aktivitas = Date.now() }
  const perpanjang = async () => {
    const now = Date.now()
    if (berjalan || !user.value?.trusted_device_id || document.hidden || now - aktivitas > 5 * 60_000 || now - diperpanjang < 30 * 60_000) return
    berjalan = true
    try {
      await $fetch('/api/admin/refresh', { method: 'POST', headers: { 'X-Console': '1', ...headerIkatan() }, retry: 0, timeout: 15_000 })
      diperpanjang = Date.now()
    } catch (err) {
      // Gangguan jaringan bukan alasan menghapus login. Pencabutan/expiry
      // diputuskan gateway; permintaan berikutnya mengikuti alur sesi habis.
      pulihkanIkatan(err)
    } finally { berjalan = false }
  }
  const kembali = () => { if (!document.hidden) { sentuh(); void perpanjang() } }
  const aktivitasEvents = ['pointerdown', 'keydown', 'scroll', 'wheel', 'touchstart'] as const
  onMounted(() => {
    for (const event of aktivitasEvents) window.addEventListener(event, sentuh, { passive: true, capture: true })
    document.addEventListener('visibilitychange', kembali)
    window.addEventListener('focus', kembali)
    timer = setInterval(() => { void perpanjang() }, 60_000)
  })
  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
    for (const event of aktivitasEvents) window.removeEventListener(event, sentuh, true)
    document.removeEventListener('visibilitychange', kembali)
    window.removeEventListener('focus', kembali)
  })
}
