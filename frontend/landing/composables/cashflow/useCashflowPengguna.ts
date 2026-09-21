/**
 * Konteks Pengguna 360 yang dibagi induk pengguna/[id].vue dan tab-tabnya:
 * id subjek (dari path), kepala T0 (dimuat induk), dan admin_pengguna_360
 * (ranah akun) yang dipakai tiga tempat sekaligus — lencana tab (hitung{}),
 * tab Ringkas, dan tab Ruang — tetapi dimuat SEKALI per kasus+lingkup lewat
 * simpanan useCashflowKasus (satu baris audit baca_akun, bukan tiga).
 *
 * Nama ruang untuk baris transaksi/jejak: nama utuh bila ruang itu di dalam
 * lingkup (dari 360), bentuk tersamar dari kepala bila tidak, atau 8 aksara
 * id sebagai jalan terakhir.
 */
import { ke360, keKepala, type KepalaPengguna, type Pengguna360DTO } from '~/adapters/cashflowBuku'
import { lingkupSemua, samaSubjek } from '~/adapters/cashflowKasus'

export const AKAR_PENGGUNA = '/console/cashflow/pengguna'

export const useCashflowPengguna = () => {
  const route = useRoute()
  const api = useCashflowAdmin()
  const kasus = useCashflowKasus()
  /* Dipatok saat komponen dibuat. Halaman dirender ulang per subjek (kunci
     NuxtPage = path berisi id), dan selagi pindah ke subjek lain route sudah
     berganti sebelum halaman lama dilepas — halaman lama tidak boleh memuat
     subjek baru. */
  const idAwal = String(route.params.id ?? '')
  const id = computed(() => idAwal)
  const dasar = computed(() => `${AKAR_PENGGUNA}/${id.value}`)

  /** Kepala T0 subjek aktif; diisi induk. */
  const kepala = useState<KepalaPengguna | null>('cf_kepala', () => null)

  const kunci360 = computed(() => (kasus.kunciKasus.value && kasus.punyaRanah('akun') ? `${kasus.kunciKasus.value}|360` : null))
  const mentah360 = computed(() => kasus.data<Pengguna360DTO>(kunci360.value))
  const p360 = computed(() => (mentah360.value ? ke360(mentah360.value) : null))
  const muat360 = async (): Promise<void> => {
    const k = kunci360.value
    if (!k) return
    const subjek = id.value
    await kasus.muatData(k, kk => api.pengguna360(kk.id, subjek))
  }

  /**
   * Kepala + kasus aktif bersamaan, lalu lingkup kasus dibuka/diselaraskan
   * OTOMATIS (tanpa ditunggu). Dijalankan induk lewat useCashflowMuat.muat.
   *
   * JAWABAN BASI (temuan fe p3 #1). Pindah A → B sebelum kepala A tiba:
   * halaman A sudah dilepas, tetapi `kepala` (useState global) dan lingkup
   * kasus dibagi dengan halaman B. Jawaban A tidak berhak menulis keduanya:
   * induk memanggil batal() saat dilepas (terbaru() = false), dan kepala yang
   * bukan milik subjek halaman ini — atau kasus yang subjeknya sudah
   * berganti — diabaikan. aturLingkup sendiri juga menolak subjek lain.
   */
  const muatKepala = async (terbaru: () => boolean): Promise<void> => {
    const subjek = id.value
    const [k] = await Promise.all([api.kepalaPengguna(subjek), kasus.pulihkan(subjek)])
    if (!terbaru() || !samaSubjek(k.user_id, subjek) || kasus.keadaan.value.subjek !== subjek) return
    const kep = keKepala(k)
    kepala.value = kep
    void kasus.aturLingkup(subjek, kep.ruang ? lingkupSemua(kep.ruang) : null)
  }

  const namaRuang = (ws: string): string => {
    const dalam = p360.value?.ruang.find(r => r.id === ws)
    if (dalam) return dalam.nama
    const kep = kepala.value?.ruang?.find(r => r.id === ws)
    return kep ? kep.nama : ws.slice(0, 8)
  }

  return { id, dasar, kepala, kunci360, p360, muat360, muatKepala, namaRuang }
}
