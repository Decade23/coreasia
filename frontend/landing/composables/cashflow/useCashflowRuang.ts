/**
 * Konteks Ruang 360 yang dibagi induk ruang/[id].vue dan tab-tabnya: id
 * ruang (dari path), kepala T0 (dimuat induk), dan admin_ruang_360 (ranah
 * ruang) yang dipakai lencana tab, Ringkas, dan Anggota — dimuat SEKALI per
 * kasus+lingkup lewat simpanan useCashflowKasus (satu baris audit
 * baca_ruang, bukan tiga).
 *
 * Kasusnya dipulihkan/dibuka OTOMATIS lewat useCashflowKasus dengan subjek
 * bertipe 'workspace' (lihat kepala berkas itu): datang dari Pengguna 360
 * dalam satu kasus = tanpa kasus baru, juga sesudah refresh.
 */
import { keKepalaRuang, keRuang360, AKAR_RUANG, type KepalaRuang, type Ruang360DTO } from '~/adapters/cashflowRuang'
import { samaSubjek } from '~/adapters/cashflowKasus'

export const useCashflowRuang = () => {
  const route = useRoute()
  const api = useCashflowAdmin()
  const kasus = useCashflowKasus()
  /* Dipatok saat komponen dibuat (sama dengan useCashflowPengguna): halaman
     lama yang belum dilepas tidak boleh memuat ruang baru. */
  const idAwal = String(route.params.id ?? '')
  const id = computed(() => idAwal)
  const dasar = computed(() => `${AKAR_RUANG}/${id.value}`)

  /** Kepala T0 ruang aktif; diisi induk. */
  const kepala = useState<KepalaRuang | null>('cf_kepala_ruang', () => null)

  const kunci360 = computed(() => (kasus.kunciKasus.value && kasus.punyaRanah('ruang') ? `${kasus.kunciKasus.value}|r360|${id.value}` : null))
  const mentah360 = computed(() => kasus.data<Ruang360DTO>(kunci360.value))
  const r360 = computed(() => (mentah360.value ? keRuang360(mentah360.value) : null))
  const muat360 = async (): Promise<void> => {
    const k = kunci360.value
    if (!k) return
    const ws = id.value
    await kasus.muatData(k, kk => api.ruang360(kk.id, ws))
  }

  /**
   * Kepala + kasus aktif bersamaan, lalu kasus dibuka/diselaraskan OTOMATIS
   * (tanpa ditunggu). Kepala tanpa hitungan = sesi tanpa pii → tahap 'izin'.
   * Jawaban basi (pindah ruang sebelum kepala tiba) tidak menulis apa pun.
   */
  const muatKepala = async (terbaru: () => boolean): Promise<void> => {
    const ws = id.value
    const [k] = await Promise.all([api.kepalaRuang(ws), kasus.pulihkan(ws, 'workspace')])
    if (!terbaru() || !samaSubjek(k.workspace_id, ws) || kasus.keadaan.value.subjek !== ws) return
    const kep = keKepalaRuang(k)
    kepala.value = kep
    void kasus.aturLingkup(ws, kep.pii ? [ws] : null)
  }

  /** Label orang di baris transaksi/jejak/sampah: email tersamar anggota atau
   *  bekas anggota dari 360, selain itu 8 aksara id. */
  const labelOrang = (uid: string | null): string => {
    if (!uid) return '—'
    const r = r360.value
    const a = r?.anggota.find(x => x.id === uid) ?? r?.bekas.find(x => x.id === uid)
    return a ? a.emailTersamar : uid.slice(0, 8)
  }

  /** Nama ruang untuk baris/laci: nama utuh dari 360 (di dalam kasus),
   *  selain itu bentuk tersamar kepala, selain itu 8 aksara id. */
  const namaRuang = (ws: string): string => {
    if (ws !== id.value) return ws.slice(0, 8)
    return r360.value?.ruang.nama ?? kepala.value?.namaTersamar ?? ws.slice(0, 8)
  }

  return { id, dasar, kepala, kunci360, r360, muat360, muatKepala, labelOrang, namaRuang }
}
