/** Geometri lightbox dalam piksel CSS. Zoom 1 berarti foto pas di bidang. */
export interface UkuranFoto { lebar: number; tinggi: number }
export interface PosisiFoto { x: number; y: number }
export const ZOOM_MAKS_FOTO = 5
export const batasiZoomFoto = (zoom: number): number => Math.min(ZOOM_MAKS_FOTO, Math.max(1, Number.isFinite(zoom) ? zoom : 1))

export function ukuranPasFoto(asli: UkuranFoto, bidang: UkuranFoto, putaran: number): UkuranFoto {
  if (asli.lebar <= 0 || asli.tinggi <= 0 || bidang.lebar <= 0 || bidang.tinggi <= 0) return { lebar: 0, tinggi: 0 }
  const miring = Math.abs(putaran % 180) === 90
  const lebar = miring ? asli.tinggi : asli.lebar
  const tinggi = miring ? asli.lebar : asli.tinggi
  const rasio = Math.min(1, bidang.lebar / lebar, bidang.tinggi / tinggi)
  return { lebar: asli.lebar * rasio, tinggi: asli.tinggi * rasio }
}

export function batasiGeserFoto(posisi: PosisiFoto, pas: UkuranFoto, bidang: UkuranFoto, zoom: number, putaran: number): PosisiFoto {
  const miring = Math.abs(putaran % 180) === 90
  const x = Math.max(0, ((miring ? pas.tinggi : pas.lebar) * zoom - bidang.lebar) / 2)
  const y = Math.max(0, ((miring ? pas.lebar : pas.tinggi) * zoom - bidang.tinggi) / 2)
  return { x: x ? Math.min(x, Math.max(-x, posisi.x)) : 0, y: y ? Math.min(y, Math.max(-y, posisi.y)) : 0 }
}

/** Menjaga titik di bawah kursor/jari saat memperbesar atau mencubit. */
export function geserSaatZoom(posisi: PosisiFoto, zoomLama: number, zoomBaru: number, jangkar: PosisiFoto, tujuan = jangkar): PosisiFoto {
  const rasio = zoomBaru / zoomLama
  return { x: tujuan.x - (jangkar.x - posisi.x) * rasio, y: tujuan.y - (jangkar.y - posisi.y) * rasio }
}
