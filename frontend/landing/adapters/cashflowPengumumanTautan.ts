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

export function tombolPengumuman(label: unknown, alamat: unknown): { label: string; url: string; host: string } | null {
  if (typeof label !== 'string') return null;
  const tulisan = label.trim(), url = urlWebPengumuman(alamat);
  if (!tulisan || Array.from(tulisan).length > 40 || !url) return null;
  return { label: tulisan, url, host: new URL(url).hostname };
}
