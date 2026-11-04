import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

export const TOPIK_PENGUMUMAN = 'cashflow:pengumuman';
export const JEDA_CADANGAN_PENGUMUMAN = 60_000;
interface Jadwal {
  berikutnya: string | null;
  koreksi: number;
  daftar: ReadonlyArray<{ starts_at: string; ends_at: string | null }>;
}
interface Opsi {
  klien: Pick<SupabaseClient, 'channel' | 'removeChannel' | 'realtime'>;
  segarkan: () => Promise<void>;
  baca: () => Jadwal;
  dengar: (ubah: () => void) => () => void;
  ketuk: () => void;
  status?: (nilai: 'menyambung' | 'tersambung' | 'terputus') => void;
}
// Lepas channel lama sebelum memakai topik yang sama setelah akun berganti.
const pelepasan = new WeakMap<object, Promise<unknown>>();

/** Satu langganan selama aplikasi di depan. Payload hanya meminta baca ulang,
 * tidak pernah dipakai sebagai isi pengumuman atau sebagai bukti hak baca. */
export function ikutiPengumuman(opsi: Opsi): () => void {
  let hidup = true;
  let channel: RealtimeChannel | null = null;
  let jeda: ReturnType<typeof setTimeout> | undefined;
  let batas: ReturnType<typeof setTimeout> | undefined;
  const ambil = () => { if (hidup) void opsi.segarkan().catch(() => {}); };
  const minta = () => { clearTimeout(jeda); jeda = setTimeout(ambil, 120); };
  const jadwalkan = () => {
    clearTimeout(batas);
    if (!hidup) return;
    const data = opsi.baca(), kini = Date.now() + data.koreksi;
    const waktu = [data.berikutnya, ...data.daftar.flatMap(p => [p.starts_at, p.ends_at])]
      .map(v => v ? Date.parse(v) : NaN).filter(v => Number.isFinite(v) && v > kini);
    if (waktu.length) batas = setTimeout(() => {
      // Tanggal berakhir tetap dihormati walau permintaan jaringan gagal.
      if (!hidup) return;
      opsi.ketuk(); ambil(); jadwalkan();
    }, Math.min(86_400_000, Math.max(20, Math.min(...waktu) - kini + 20)));
  };
  const lepasJadwal = opsi.dengar(jadwalkan);
  const cadangan = setInterval(() => { if (hidup) { opsi.ketuk(); ambil(); } }, JEDA_CADANGAN_PENGUMUMAN);
  jadwalkan(); ambil(); opsi.status?.('menyambung');
  void (async () => {
    try {
      await pelepasan.get(opsi.klien);
      if (!hidup) return;
      await opsi.klien.realtime.setAuth();
      if (!hidup) return;
      channel = opsi.klien.channel(TOPIK_PENGUMUMAN, { config: { private: true } });
      channel.on('broadcast', { event: 'berubah' }, minta).subscribe((status) => {
        if (!hidup) return;
        opsi.status?.(status === 'SUBSCRIBED' ? 'tersambung' : 'terputus');
        // Baca sesudah bergabung menutup celah fetch sebelum subscribe/reconnect.
        if (status === 'SUBSCRIBED') ambil();
      });
    } catch { if (hidup) opsi.status?.('terputus'); }
  })();
  return () => {
    if (!hidup) return;
    hidup = false;
    clearTimeout(jeda); clearTimeout(batas); clearInterval(cadangan); lepasJadwal();
    if (channel) pelepasan.set(opsi.klien, opsi.klien.removeChannel(channel).catch(() => {}));
  };
}
