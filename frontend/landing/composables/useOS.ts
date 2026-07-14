// Deteksi OS pengunjung (Windows / macOS / lainnya) untuk menawarkan unduhan yang tepat.
// - SSR: baca header User-Agent (tanpa flash saat halaman TIDAK ter-cache CDN).
// - Client: re-deteksi via navigator.userAgent onMounted → benar meski halaman ter-cache.
// useState mentransfer nilai SSR ke client via payload → tak ada hydration mismatch.
export type CaOS = 'windows' | 'mac' | 'other'

function detectOS(ua: string): CaOS {
  const s = (ua || '').toLowerCase()
  if (/windows|win32|win64/.test(s)) return 'windows'
  // macOS desktop (kecualikan iOS yang juga memuat "mac" di sebagian UA)
  if (/macintosh|mac os x/.test(s) && !/iphone|ipad|ipod/.test(s)) return 'mac'
  return 'other'
}

export function useOS() {
  // Default 'mac' identik di SSR & hydration awal → NOL hydration-mismatch, dan aman
  // meski halaman ter-cache CDN. Deteksi asli terjadi di client (navigator) onMounted →
  // tombol menyesuaikan OS pengunjung sebenarnya (Windows users lihat flip singkat).
  const os = useState<CaOS>('ca-os', () => 'mac')

  if (import.meta.client) {
    onMounted(() => {
      os.value = detectOS(navigator.userAgent || '')
    })
  }

  return os
}
