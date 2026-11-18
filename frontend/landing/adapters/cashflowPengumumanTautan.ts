/** Tautan pada pengumuman adalah web HTTPS, termasuk saat dibaca dari cache. */
export function urlWebPengumuman(nilai: unknown): string | null {
  if (typeof nilai !== 'string') return null;
  const teks = nilai.trim();
  if (!teks || teks.length > 2048 || /\s/.test(teks) || [...teks].some(c => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)) return null;
  try {
    const u = new URL(teks);
    const host = u.hostname;
    if (u.protocol !== 'https:' || u.username || u.password || u.port === '0' || host.length > 253 ||
      !/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(host) ||
      /\.(local|localhost|internal)$/i.test(host)) return null;
    return u.href.length <= 2048 ? u.href : null;
  } catch { return null; }
}

/**
 * Tautan dalam aplikasi 1.4.4 (CashFlow 20261119131000, tiket T4): DAFTAR
 * TERKUNCI, persis dua untai ini, tanpa jalur, kueri, atau huruf besar. Sama
 * dengan pengumuman_tautan_sah di server dan TUJUAN_DALAM di aplikasi.
 * Aplikasi sebelum 1.4.4 tidak menggambar tombolnya.
 */
export const TAUTAN_DALAM = ['cashflow://ai', 'cashflow://dukung'] as const
export type TautanDalam = typeof TAUTAN_DALAM[number]
export const tautanDalam = (nilai: unknown): TautanDalam | null =>
  (typeof nilai === 'string' && (TAUTAN_DALAM as readonly string[]).includes(nilai.trim()) ? (nilai.trim() as TautanDalam) : null)
/** Nama tujuan tautan dalam untuk ditampilkan di console (bukan teks aplikasi). */
export const NAMA_TAUTAN_DALAM: Readonly<Record<TautanDalam, string>> = { 'cashflow://ai': 'Domi', 'cashflow://dukung': 'Dukung CashFlow' }

/** Alamat tombol yang sah: web HTTPS (dinormalisasi) atau salah satu tautan dalam aplikasi. */
export function urlTombolPengumuman(nilai: unknown): string | null {
  return tautanDalam(nilai) ?? urlWebPengumuman(nilai)
}

/** `host` = domain untuk web, nama layar untuk tautan dalam. `dalam` = bukan tautan yang bisa dibuka peramban. */
export function tombolPengumuman(label: unknown, alamat: unknown): { label: string; url: string; host: string; dalam: boolean } | null {
  if (typeof label !== 'string') return null;
  const tulisan = label.trim();
  if (!tulisan || Array.from(tulisan).length > 40) return null;
  const dalam = tautanDalam(alamat);
  if (dalam) return { label: tulisan, url: dalam, host: NAMA_TAUTAN_DALAM[dalam], dalam: true };
  const url = urlWebPengumuman(alamat);
  if (!url) return null;
  return { label: tulisan, url, host: new URL(url).hostname, dalam: false };
}
