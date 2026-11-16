<script setup lang="ts">
/** Pencarian, saringan, urutan, dan paginasi berlaku atas seluruh akun.
 * Server mengaudit setiap halaman yang diminta dengan kontak lengkap. */
import {
  angka, kePengguna, rupiah, tanpaKontakUtuh, versiTertinggal,
  type InfoPlatform, type Pengguna, type PenggunaDTO, type StatusPengguna,
} from '~/adapters/cashflow'
import { halamanAman, jumlahHalaman } from '~/adapters/cashflowDaftar'
import { SEGMEN_BELUM_WA, STATUS_WA_AKUN, type StatusWaAkunKode } from '~/adapters/cashflowWa'
import {
  FILTER_INTERNAL, NILAI_INTERNAL, SEGMEN_BELI_KREDIT, SEGMEN_PAKAI_DOMI, URUT_DOMI,
  bacaDaftarBerjenjang, butuhV4, jumlahPakaiDomi, nilaiInternal, segmenDomi, tanpaHitunganDomi, urutDomi,
} from '~/adapters/cashflowPenggunaDomi'
import type { SkemaQuery } from '~/adapters/cashflowQuery'
import { GalatAdmin } from '~/composables/cashflow/useCashflowAdmin'
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })

const { tcf, bahasa } = useCashflowI18n()
const { tc } = useConsoleI18n()
const api = useCashflowAdmin()
const route = useRoute()
const indeks = useCashflowIndeks()
const { memuat, galat, pesanGalat, muat, batal } = useCashflowMuat({ awal: true })
const sesi = useCashflowSesi()
const { user } = useAdminAuth()

const PER = 25
const SEGMEN = ['semua', 'catat7', 'belum', 'ditangguhkan', SEGMEN_BELUM_WA, SEGMEN_PAKAI_DOMI, SEGMEN_BELI_KREDIT] as const
const URUT = ['email', 'wa', 'versi', 'daftar', 'aktif', 'ruang', 'tx', 'nominal', ...URUT_DOMI] as const
type KolomUrut = typeof URUT[number]
const URUT_PRIBADI: readonly KolomUrut[] = ['ruang', 'tx', 'nominal', ...URUT_DOMI]
const FILTER = ['email', 'wa', 'versi', 'daftar', 'aktif', 'status'] as const
const segmenButuhHitungan = (k: string) => k === 'belum' || k === 'catat7' || segmenDomi(k)
const SKEMA = {
  seg: { jenis: 'pilihan', opsi: SEGMEN, bawaan: 'semua' },
  urut: { jenis: 'pilihan', opsi: URUT, bawaan: 'daftar' },
  arah: { jenis: 'pilihan', opsi: ['asc', 'desc'], bawaan: 'desc' },
  hal: { jenis: 'halaman', bawaan: 1 },
} as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)

/* DTO disimpan mentah dan dipetakan ulang saat bahasa berganti: tanggal
   tampilan ('3 Agu 2026' / '3 Aug 2026') dibentuk adapter. */
const mentah = shallowRef<PenggunaDTO[]>([])
const semua = computed<Pengguna[]>(() => mentah.value.map(d => kePengguna(d, bahasa.value)))
const total = ref(0)
const halamanHasil = ref(q.value.hal)
const cari = useState('cf_cari_pengguna', () => '')
const kolomCari = ref<HTMLInputElement | null>(null)
const filterKolom = useState<Record<string, string>>('cf_saring_kolom_pengguna', () => ({}))
const cariDiterapkan = useState('cf_cari_diterapkan_pengguna', () => cari.value)
const filterDiterapkan = shallowRef<Record<string, string>>({ ...filterKolom.value })
const versiTerbaru = shallowRef<Map<string, string>>(new Map())
const hapusTersedia = ref(true)
const paletBuka = ref(false)
const ALASAN_DAFTAR = 'Kontak lengkap (email dan WhatsApp) di daftar pengguna Console'
const terbuka = ref(false)
const kontakDisamarkanOleh = useState<string | null>('cf_kontak_disamarkan_oleh', () => null)
const samarkanKontak = computed(() => !!user.value?.id && kontakDisamarkanOleh.value === user.value.id)
const ditolak = ref(false)
const perluVerifikasi = ref(false)
/* Server sudah memasang status WhatsApp (cara terbalik). Lengket selama sesi:
   hasil saringan yang kosong tidak boleh menyembunyikan saringan yang sedang
   dipakai. Server lama menolak segmen dan saringannya (22023 saringan). */
const serverStatusWa = useState('cf_server_status_wa', () => false)
const pakaiStatusWa = (v: string | undefined): v is typeof STATUS_WA_AKUN[number] => (STATUS_WA_AKUN as readonly unknown[]).includes(v)
/* Server sudah memasang daftar v4 (pemakaian Domi, kredit, akun tim). null =
   belum tahu, false = server lama: daftar dibaca lewat v3, dan kolom, urutan,
   segmen, serta saringan Domi tidak ditawarkan. Lengket selama sesi supaya
   server lama tidak ditanyai v4 di setiap muatan. */
const serverDomi = useState<boolean | null>('cf_server_domi', () => null)
const adaDomi = computed(() => serverDomi.value === true)
/** Jumlah akun yang pernah bertanya ke Domi (kepala hasil v4). null = tidak dikirim. */
const jumlahDomi = ref<number | null>(null)
const izinPribadi = computed(() => sesi.boleh('cashflow:pii'))
const tanpaHitungan = computed(() => !izinPribadi.value || ditolak.value)

const bersihkanData = (rows: readonly PenggunaDTO[]) => tanpaKontakUtuh(rows)
  .map(row => tanpaHitunganDomi({ ...row, jumlah_ruang: null, jumlah_tx: null, jumlah_nominal: null }))
const samarkanBaris = (tanpaDataPribadi = false) => {
  terbuka.value = false
  if (tanpaDataPribadi) jumlahDomi.value = null
  mentah.value = tanpaDataPribadi ? bersihkanData(mentah.value) : tanpaKontakUtuh(mentah.value)
}

const urutAman = async (): Promise<boolean> => {
  if (!tanpaHitungan.value || (!segmenButuhHitungan(q.value.seg) && !URUT_PRIBADI.includes(q.value.urut))) return false
  await setel({ seg: 'semua', urut: 'daftar', arah: 'desc', hal: 1 })
  return true
}

/* Jawaban basi tidak boleh menimpa halaman atau membuka kontak kembali. */
const muatDaftar = () => muat(async (terbaru) => {
  // Baris yang sudah tampil bertahan sampai jawaban terbaru siap. Spinner
  // tidak boleh meruntuhkan tabel, paginasi, fokus, atau posisi gulir.
  const filter: Record<string, string> = {}
  for (const k of FILTER) {
    const v = filterDiterapkan.value[k]
    if (!v) continue
    if (k === 'status') {
      const nilai = (['aktif', 'ditangguhkan', 'menunggu_hapus'] as const).find(x => x === v || labelStatus(x) === v)
      if (nilai) filter[k] = nilai
    } else filter[k] = v
  }
  // Saringan status WhatsApp hanya dikirim ke server yang mengenalnya.
  const statusWa = filterDiterapkan.value.status_wa
  if (serverStatusWa.value && pakaiStatusWa(statusWa)) filter.status_wa = statusWa
  // Saringan akun tim hanya dikenal v4. Di server lama ia dilepas, tidak dikirim ke v3.
  const internal = filterDiterapkan.value[FILTER_INTERNAL]
  if (nilaiInternal(internal)) filter[FILTER_INTERNAL] = internal
  const opsi = (alasan: string | null) => ({
    limit: PER, offset: (q.value.hal - 1) * PER, cari: cariDiterapkan.value.trim(),
    segmen: q.value.seg, urut: q.value.urut, arah: q.value.arah, filter,
    bahasa: bahasa.value, alasan,
  })
  // v4 dulu, v3 untuk server lama. null = pilihan Domi tidak bisa dijawab server ini.
  const baca = async (alasan: string | null) => {
    const jawab = await bacaDaftarBerjenjang({
      kenalV4: serverDomi.value, butuh: butuhV4(q.value, filter),
      v4: () => api.daftarPenggunaHalamanV4(opsi(alasan)),
      v3: () => api.daftarPenggunaHalaman(opsi(alasan)),
    })
    serverDomi.value = jawab.v4
    return jawab.hasil
  }
  let alasan = !tanpaHitungan.value && !samarkanKontak.value ? ALASAN_DAFTAR : null
  let hasil
  try {
    hasil = await baca(alasan)
  } catch (e) {
    if (!terbaru()) return
    if (e instanceof GalatAdmin && e.hint === 'saringan' && (q.value.seg === SEGMEN_BELUM_WA || 'status_wa' in filter)) {
      // Server belum (atau tidak lagi) mengenal status WhatsApp: lepas
      // saringannya. Pengamat query dan saringan memuat ulang daftar.
      serverStatusWa.value = false
      lepasSaringWa()
      return
    }
    if (e instanceof GalatAdmin && e.hint === 'saringan' && butuhV4(q.value, filter)) {
      // v4 ada tetapi menolak pilihan Domi: lepas pilihannya, bukan galat.
      lepasDomi()
      return
    }
    if (!(e instanceof GalatAdmin && e.jenis === 'izin') || (!alasan && !URUT_PRIBADI.includes(q.value.urut) && !segmenButuhHitungan(q.value.seg))) throw e
    // Sesi bisa diturunkan oleh server sementara tab masih terbuka. Ambil
    // kembali daftar tersamar hanya setelah server memeriksa hak baca dasar.
    ditolak.value = true
    perluVerifikasi.value = true
    samarkanBaris(true)
    if (await urutAman() || !terbaru()) return
    alasan = null
    hasil = await baca(null)
  }
  if (!terbaru()) return
  // Server lama dan daftar sedang memakai pilihan Domi: lepas, pengamat memuat ulang.
  if (!hasil) { lepasDomi(); return }
  if (hasil.baris.some(d => d.status_wa !== undefined) || q.value.seg === SEGMEN_BELUM_WA || 'status_wa' in filter) serverStatusWa.value = true
  const aman = halamanAman(q.value.hal, Number(hasil.total), PER)
  if (aman !== q.value.hal) { await setel({ hal: aman }); return }
  const bolehBuka = !!alasan && !tanpaHitungan.value && !samarkanKontak.value
  mentah.value = tanpaHitungan.value ? bersihkanData(hasil.baris) : bolehBuka ? hasil.baris : tanpaKontakUtuh(hasil.baris)
  total.value = Number(hasil.total)
  halamanHasil.value = q.value.hal
  versiTerbaru.value = new Map(Object.entries(hasil.versi_terbaru ?? {}))
  hapusTersedia.value = hasil.hapus_tersedia
  jumlahDomi.value = tanpaHitungan.value ? null : jumlahPakaiDomi(hasil)
  // Pencarian palet tidak boleh menganggap hasil tersaring daftar lengkap.
  const lengkap = q.value.seg === 'semua' && !cariDiterapkan.value.trim() && !Object.keys(filter).length && q.value.hal === 1
  indeks.isi(semua.value, lengkap ? total.value : Number.MAX_SAFE_INTEGER)
  terbuka.value = bolehBuka
})
// Mempertahankan hasil saat jaringan lambat tidak berlaku bila hak baca hilang.
watch(galat, (g) => {
  if (!g || !['izin', 'sesi', 'totp', 'bukan-admin'].includes(g.jenis)) return
  mentah.value = []
  total.value = 0
  terbuka.value = false
  indeks.kosongkan()
})
function lepasSaringWa() {
  if (filterKolom.value.status_wa || filterDiterapkan.value.status_wa) {
    const { status_wa: _kolom, ...sisaKolom } = filterKolom.value
    const { status_wa: _terap, ...sisaTerap } = filterDiterapkan.value
    filterKolom.value = sisaKolom
    filterDiterapkan.value = sisaTerap
  }
  if (q.value.seg === SEGMEN_BELUM_WA) void setel({ seg: 'semua', hal: 1 })
}
/** Urut, segmen, dan saringan akun tim kembali ke bawaan. Pengamat query dan saringan memuat ulang. */
function lepasDomi() {
  if (filterKolom.value[FILTER_INTERNAL] || filterDiterapkan.value[FILTER_INTERNAL]) {
    const { [FILTER_INTERNAL]: _kolom, ...sisaKolom } = filterKolom.value
    const { [FILTER_INTERNAL]: _terap, ...sisaTerap } = filterDiterapkan.value
    filterKolom.value = sisaKolom
    filterDiterapkan.value = sisaTerap
  }
  const kembali = {
    ...(segmenDomi(q.value.seg) ? { seg: 'semua' as const } : {}),
    ...(urutDomi(q.value.urut) ? { urut: 'daftar' as const, arah: 'desc' as const } : {}),
  }
  if (Object.keys(kembali).length) void setel({ ...kembali, hal: 1 })
}
let aktif = false
let dilepas = false
onMounted(async () => {
  await urutAman()
  if (dilepas) return
  aktif = true
  void muatDaftar()
})

const gantiKontak = () => {
  const pelaku = user.value?.id
  if (!pelaku || tanpaHitungan.value) {
    perluVerifikasi.value = true
    return
  }
  batal()
  kontakDisamarkanOleh.value = samarkanKontak.value ? null : pelaku
  if (samarkanKontak.value) samarkanBaris()
  void muatDaftar()
}
let jedaFilter: ReturnType<typeof setTimeout> | undefined
let jedaMuat: ReturnType<typeof setTimeout> | undefined
watch(izinPribadi, async (izin) => {
  if (!aktif) return
  batal()
  ditolak.value = false
  if (izin) perluVerifikasi.value = false
  else samarkanBaris(true)
  if (!(await urutAman()) && !dilepas) void muatDaftar()
})
onBeforeUnmount(() => { dilepas = true; aktif = false; batal(); clearTimeout(jedaFilter); clearTimeout(jedaMuat) })

// Saringan kolom menunggu selesai mengetik; teks sensitif tetap hanya di memori.
watch(filterKolom, (f) => {
  clearTimeout(jedaFilter)
  jedaFilter = setTimeout(() => {
    filterDiterapkan.value = Object.fromEntries(Object.entries(f).filter(([, v]) => v))
    if (q.value.hal !== 1) void setel({ hal: 1 })
  }, 600)
}, { deep: true })
const jalankanCari = async () => {
  if (q.value.hal !== 1) await setel({ hal: 1 })
  cariDiterapkan.value = cari.value
}
// Satu permintaan untuk perubahan yang terjadi dalam satu rangkaian tindakan.
watch([() => q.value.seg, () => q.value.urut, () => q.value.arah, () => q.value.hal, cariDiterapkan, filterDiterapkan, bahasa], () => {
  if (!aktif) return
  clearTimeout(jedaMuat)
  batal()
  galat.value = null
  memuat.value = true
  jedaMuat = setTimeout(() => { void muatDaftar() }, 80)
})

/* Pindah halaman: wadah tabel DataTable elemen yang sama antarhalaman dan
   menyimpan scrollTop-nya, jadi halaman 2 tampil dari baris ±40 — terbaca
   seolah urutannya terlompati. */
const { wadah: wadahDaftar, keKepala } = useCashflowGulirDaftar()
const gantiHalaman = async (h: number) => {
  await setel({ hal: h })
  await keKepala()
}

// Tombol kembali di halaman detail membawa query terakhir daftar ini.
watch(() => route.fullPath, p => indeks.ingatDaftar(p), { immediate: true })

const labelStatus = (s: StatusPengguna): string =>
  s === 'menunggu_hapus' ? tcf('pengguna.menungguHapus') : s === 'ditangguhkan' ? tcf('pengguna.ditangguhkan') : tcf('pengguna.aktif')
const labelStatusWa = (s: StatusWaAkunKode): string => tcf(`pengguna.statusWa.${s}`)

/* Hitungan dan nominal null berarti hak baca tidak tersedia. */
interface Baris {
  id: string; email: string; wa: string | null; status_wa: string | null; versi: string | null; daftar: string; aktif: string
  domi: number | null; domi_terakhir: string; kredit: number | null
  ruang: number | null; tx: number | null; nominal: number | null; status: string; p: Pengguna
}
const keBaris = (p: Pengguna): Baris => ({
  id: p.id,
  email: p.emailPenuh ?? p.emailTersamar,
  wa: p.nomorPenuh ?? p.nomorTersamar,
  status_wa: p.statusWa?.status ?? null,
  versi: p.labelVersi,
  daftar: p.daftar,
  aktif: p.aktivitasTerakhir,
  domi: p.domi?.tanya ?? null,
  domi_terakhir: p.domi?.terakhir ?? '—',
  kredit: p.domi?.kreditSisa ?? null,
  ruang: p.ruang,
  tx: p.tx,
  nominal: p.nominal,
  status: labelStatus(p.status),
  p,
})

const kolom = computed(() => [
  { key: 'email', label: tcf('pengguna.email'), type: 'text' as const, class: 'font-mono text-[var(--ca-text)]', sortable: true },
  { key: 'wa', label: tcf('pengguna.wa'), type: 'text' as const, sortable: true, class: 'whitespace-nowrap tabular-nums text-[var(--ca-text)]' },
  // Tanpa kolom status_wa dari server, sel kosong dan saringannya tidak ditawarkan.
  {
    key: 'status_wa', label: tcf('pengguna.statusWa.judul'), type: 'status' as const, filterable: serverStatusWa.value,
    options: STATUS_WA_AKUN.map(s => ({ label: labelStatusWa(s), value: s })),
    // Lebar tetap hanya bila ada isinya: kolom kosong (server lama) tidak boleh menyempitkan email.
    class: serverStatusWa.value ? 'w-[7.5rem] min-w-[7rem] whitespace-normal' : 'whitespace-normal',
  },
  { key: 'versi', label: tcf('pengguna.versi'), type: 'text' as const, sortable: true, class: 'whitespace-nowrap tabular-nums' },
  { key: 'daftar', label: tcf('pengguna.daftar'), type: 'text' as const, sortable: true, class: 'whitespace-nowrap text-[var(--ca-muted)]' },
  // Dengan kolom Domi tabel lebih lebar: baris "Masuk terakhir" boleh turun ke baris kedua.
  { key: 'aktif', label: tcf('pengguna.aktifTerakhir'), type: 'text' as const, sortable: true, class: adaDomi.value ? 'text-[var(--ca-muted)]' : 'whitespace-nowrap text-[var(--ca-muted)]' },
  // Pemakaian Domi dan kredit: hanya bila server memasang v4. Di server lama kolomnya tidak ada sama sekali.
  ...(adaDomi.value ? [
    { key: 'domi', label: tcf('pengguna.domi.judul'), type: 'text' as const, sortable: !tanpaHitungan.value, filterable: false, class: 'tabular-nums text-right' },
    { key: 'domi_terakhir', label: tcf('pengguna.domi.terakhir'), type: 'text' as const, sortable: !tanpaHitungan.value, filterable: false, class: 'whitespace-nowrap text-[var(--ca-muted)]' },
    { key: 'kredit', label: tcf('pengguna.domi.kredit'), type: 'text' as const, sortable: !tanpaHitungan.value, filterable: false, class: 'whitespace-nowrap tabular-nums text-right' },
  ] : []),
  { key: 'ruang', label: tcf('pengguna.ruang'), type: 'text' as const, sortable: !tanpaHitungan.value, filterable: false, class: 'tabular-nums text-right' },
  // 'Tx' seperti tabel ruang Pengguna 360: label panjang membuat tabel tidak muat di 1280 px.
  { key: 'tx', label: tcf('pengguna.kolom.tx'), type: 'text' as const, sortable: !tanpaHitungan.value, filterable: false, class: 'tabular-nums text-right' },
  { key: 'nominal', label: tcf('pengguna.nominal'), type: 'text' as const, sortable: !tanpaHitungan.value, filterable: false, class: 'whitespace-nowrap tabular-nums text-right' },
  {
    key: 'status', label: tcf('pengguna.status'), type: 'status' as const,
    options: (['aktif', 'ditangguhkan', 'menunggu_hapus'] as const).map(s => ({ label: labelStatus(s), value: s })),
    class: 'text-[var(--ca-muted)]',
  },
])

const hal = computed(() => halamanHasil.value)
const jumlahHal = computed(() => jumlahHalaman(total.value, PER))
const barisHalaman = computed(() => semua.value.map(keBaris))
const pilihSegmen = (s: typeof SEGMEN[number]) => setel({ seg: s, hal: 1 })
const arahBawaan = (k: KolomUrut) => k === 'email' || k === 'wa' ? 'asc' : 'desc'
const urutKolom = (key: string) => {
  const k = URUT.find(u => u === key)
  if (!k || (tanpaHitungan.value && URUT_PRIBADI.includes(k)) || (urutDomi(k) && !adaDomi.value)) return
  const arah = q.value.urut === k ? (q.value.arah === 'asc' ? 'desc' : 'asc') : arahBawaan(k)
  void setel({ urut: k, arah, hal: 1 })
}
const urutPonsel = computed({ get: () => q.value.urut, set: (k: KolomUrut) => urutKolom(k) })
const arahPonsel = computed({ get: () => q.value.arah, set: (arah: 'asc' | 'desc') => { void setel({ arah, hal: 1 }) } })
const opsiUrut = computed(() => kolom.value.filter(k => k.sortable))
const kolomSaring = computed(() => kolom.value.filter(k => k.filterable !== false))
const adaSaringan = computed(() => Object.values(filterKolom.value).some(Boolean))
const tanpaBaris = computed(() => cariDiterapkan.value || Object.keys(filterDiterapkan.value).length || q.value.seg !== 'semua'
  ? tcf('umum.kosongSaring') : tcf('umum.kosong'))
const kolomKartu = computed(() => kolom.value.filter(k => !['email', 'wa', 'status_wa', 'status'].includes(k.key)))
const nilaiKartu = (row: Baris, k: string) => {
  if (k === 'versi') return row.versi ?? '—'
  if (k === 'daftar' || k === 'aktif') return row[k]
  if (k === 'nominal') return row.nominal === null ? '—' : rupiah(row.nominal)
  if (k === 'domi') return row.domi === null ? '—' : `${angka(row.domi)}${row.p.domi?.kira ? '+' : ''}`
  if (k === 'ruang' || k === 'tx' || k === 'kredit') return row[k] === null ? '—' : angka(row[k])
  if (k === 'domi_terakhir') return row.domi_terakhir
  return '—'
}

const segmenOpsi = computed(() => [
  { kunci: 'semua' as const, label: tcf('umum.semua') },
  { kunci: 'catat7' as const, label: tcf('pengguna.catat7') },
  { kunci: 'belum' as const, label: tcf('pengguna.belumCatat') },
  { kunci: 'ditangguhkan' as const, label: tcf('pengguna.ditangguhkan') },
  // Segmen Belum WhatsApp hanya untuk server yang mengenalnya.
  ...(serverStatusWa.value ? [{ kunci: SEGMEN_BELUM_WA, label: tcf('pengguna.statusWa.segmen') }] : []),
  // Segmen Domi hanya untuk server yang memasang v4.
  ...(adaDomi.value ? [
    { kunci: SEGMEN_PAKAI_DOMI, label: tcf('pengguna.domi.segmenPakai') },
    { kunci: SEGMEN_BELI_KREDIT, label: tcf('pengguna.domi.segmenBeli') },
  ] : []),
])
/** Saringan akun tim: semua, tanpa tim, hanya tim. Nilainya ikut saringan kolom (jeda, hapus semua). */
const opsiTim = computed(() => NILAI_INTERNAL.map(v => ({ value: v, label: tcf(v === 'ya' ? 'pengguna.domi.timHanya' : 'pengguna.domi.timTanpa') })))
const saringTim = computed({
  get: () => filterKolom.value[FILTER_INTERNAL] ?? '',
  set: (v: string) => {
    const { [FILTER_INTERNAL]: _lama, ...sisa } = filterKolom.value
    filterKolom.value = v ? { ...sisa, [FILTER_INTERNAL]: v } : sisa
  },
})
/** 30 hari terakhir hanya ditulis bila berbeda dari totalnya. */
const tigaPuluh = (p: Pengguna): number | null =>
  p.domi && p.domi.tanya !== null && p.domi.tanya30 !== null && p.domi.tanya30 !== p.domi.tanya ? p.domi.tanya30 : null
/** Sel kosong: "akses terbatas" hanya bila memang izinnya yang kurang. */
const ketKosong = computed(() => (tanpaHitungan.value ? tcf('umum.butuhTotp') : undefined))
/** Server sudah memasang migrasi nomor WA (kolomnya ada di jawaban). */
const serverKirimWa = computed(() => mentah.value.some(d => d.nomor_wa !== undefined))
const serverKirimVersi = computed(() => mentah.value.some(d => d.versi_aplikasi !== undefined))
/** Ikon platform di sel versi. Lucide tidak punya logo merek (ikon `apple`-nya
 *  buah), jadi Android/Apple dari Bootstrap Icons yang sudah terpasang. */
const IKON_PLATFORM: Readonly<Record<'android' | 'ios' | 'web', string>> = { android: 'bi:android2', ios: 'bi:apple', web: 'lucide:globe' }
const ikonPlatform = (p: InfoPlatform): string | null => (p.dasar ? IKON_PLATFORM[p.dasar] : null)
useCashflowPintasan([{ kunci: '/', aksi: () => kolomCari.value?.focus() }])
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('pengguna.judul')" kicker="CashFlow">
      <template #meta><CashflowNav /></template>
    </ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('pengguna.ket') }}</p>

    <div class="flex flex-wrap items-center gap-3">
      <form class="flex w-full gap-2 sm:w-auto" @submit.prevent="jalankanCari">
        <input ref="kolomCari" v-model="cari" type="search" maxlength="200" class="ca-input min-w-0 flex-1 sm:w-64" :aria-label="tcf('pengguna.cariLabel')" :placeholder="tcf('pengguna.cariLabel')">
        <button type="submit" class="rounded-xl border border-[color:var(--ca-border)] px-4 py-2 text-sm font-semibold text-[var(--ca-text)] hover:bg-[var(--ca-panel-bg-strong)]">{{ tcf('pengguna.cariTombol') }}</button>
      </form>
      <button type="button" class="rounded-xl border border-[color:var(--ca-border)] px-4 py-2 text-sm font-semibold text-[var(--ca-text)] hover:bg-[var(--ca-panel-bg-strong)]" @click="paletBuka = true">
        {{ tcf('cari.server') }}
      </button>
      <div class="flex flex-wrap gap-1 rounded-full border border-[color:var(--ca-border)] p-1 text-sm">
        <button
          v-for="s in segmenOpsi" :key="s.kunci" type="button"
          class="rounded-full px-3 py-1 transition"
          :class="q.seg === s.kunci ? 'bg-[var(--ca-panel-bg-strong)] font-semibold text-[var(--ca-text)]' : 'text-[var(--ca-muted)]'"
          :aria-pressed="q.seg === s.kunci"
          :disabled="tanpaHitungan && segmenButuhHitungan(s.kunci)"
          :title="tanpaHitungan && segmenButuhHitungan(s.kunci) ? tcf('umum.butuhTotp') : undefined"
          @click="pilihSegmen(s.kunci)"
        >{{ s.label }}</button>
      </div>
      <!-- Akun tim: hanya bila server memasang v4. Di ponsel ada di Saringan kolom. -->
      <label v-if="adaDomi" class="hidden items-center gap-2 text-xs font-semibold text-[var(--ca-muted)] lg:inline-flex">
        {{ tcf('pengguna.domi.saringTim') }}
        <select v-model="saringTim" class="ca-input !w-auto !py-1.5 text-sm font-normal" data-uji="saring-tim">
          <option value="">{{ tcf('pengguna.domi.timSemua') }}</option>
          <option v-for="o in opsiTim" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </label>
      <span v-if="!pesanGalat" class="text-xs text-[var(--ca-subtle)] tabular-nums">{{ memuat ? tcf('umum.memuat') : tcf('pengguna.jumlahHasil')(total) }}</span>

      <!-- Kontak lengkap: satu ketukan dan tercatat di audit. -->
      <button
        type="button" role="switch" :aria-checked="!!terbuka"
        class="ml-auto inline-flex items-center gap-3 rounded-full border border-[color:var(--ca-border)] py-1.5 pl-4 pr-1.5 text-sm font-semibold text-[var(--ca-text)] transition hover:bg-[var(--ca-panel-bg-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="memuat && !terbuka" @click="gantiKontak"
      >
        <Icon :name="terbuka ? 'lucide:eye' : 'lucide:eye-off'" class="h-4 w-4 text-[var(--ca-muted)]" />
        {{ tcf('pengguna.kontakPenuh') }}
        <span
          class="relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors duration-200"
          :class="terbuka ? 'border-[color:var(--ca-brand-deep)] bg-[var(--ca-brand)]' : 'border-[color:var(--ca-border)] bg-[var(--ca-toggle-track)]'"
          aria-hidden="true"
        >
          <span
            class="absolute top-0.5 h-[1.125rem] w-[1.125rem] rounded-full transition-transform duration-200"
            :style="{ background: 'var(--ca-toggle-thumb)', boxShadow: 'var(--ca-toggle-thumb-shadow)' }"
            :class="terbuka ? 'translate-x-[1.35rem]' : 'translate-x-0.5'"
          />
        </span>
      </button>
    </div>
    <p v-if="!memuat && !terbuka" class="text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.cariKet') }}</p>

    <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)] gap-2 lg:hidden">
      <label class="grid min-w-0 gap-1 text-xs font-semibold text-[var(--ca-muted)]">
        {{ tcf('pengguna.urut') }}
        <select v-model="urutPonsel" class="ca-input min-w-0 w-full">
          <option v-for="k in opsiUrut" :key="k.key" :value="k.key">{{ k.label }}</option>
        </select>
      </label>
      <label class="grid min-w-0 gap-1 text-xs font-semibold text-[var(--ca-muted)]">
        <span class="sr-only">{{ tcf('pengguna.urut') }}</span>
        <select v-model="arahPonsel" class="ca-input min-w-0 w-full self-end">
          <option value="desc">{{ tcf('pengguna.turun') }}</option>
          <option value="asc">{{ tcf('pengguna.naik') }}</option>
        </select>
      </label>
      <details class="ca-console-dialog col-span-2 min-w-0 px-3 py-2">
        <summary class="cursor-pointer rounded text-sm font-semibold text-[var(--ca-text)]">
          {{ tcf('pengguna.saringan') }}
          <span v-if="adaSaringan" class="ca-pill-muted ml-1 text-xs">{{ Object.values(filterKolom).filter(Boolean).length }}</span>
        </summary>
        <div class="mt-3 grid grid-cols-2 gap-2">
          <label v-for="k in kolomSaring" :key="k.key" class="grid min-w-0 gap-1 text-xs text-[var(--ca-muted)]">
            {{ k.label }}
            <select v-if="k.type === 'status'" v-model="filterKolom[k.key]" class="ca-input min-w-0 w-full">
              <option value="">{{ tc('common.all') }}</option>
              <option v-for="opt in k.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <input v-else v-model="filterKolom[k.key]" type="search" maxlength="200" class="ca-input min-w-0 w-full">
          </label>
          <label v-if="adaDomi" class="grid min-w-0 gap-1 text-xs text-[var(--ca-muted)]">
            {{ tcf('pengguna.domi.saringTim') }}
            <select v-model="saringTim" class="ca-input min-w-0 w-full">
              <option value="">{{ tcf('pengguna.domi.timSemua') }}</option>
              <option v-for="o in opsiTim" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </label>
        </div>
        <button v-if="adaSaringan" type="button" class="ca-btn-secondary mt-3 !px-3 !py-1.5 text-xs" @click="filterKolom = {}">
          {{ tc('common.clearAll') }}
        </button>
      </details>
    </div>

    <CashflowIzinKurang v-if="perluVerifikasi || galat?.jenis === 'izin'" baca :pesan="tcf('pengguna.kontakButuhTotp')" />
    <div v-else-if="pesanGalat" class="flex flex-wrap items-center gap-3 text-sm ca-tone-danger" role="alert">
      <span>{{ pesanGalat }}</span>
      <span v-if="semua.length">{{ tcf('pengguna.hasilSebelumnya') }}</span>
      <button type="button" class="ca-btn-secondary !px-3 !py-1.5 text-xs" @click="muatDaftar()">{{ tcf('masuk.cobaLagi') }}</button>
    </div>

    <!-- Muat gagal tanpa baris = galat saja; "Belum ada data." di bawahnya terbaca
         seolah produk tidak punya pengguna. -->
    <div v-if="!pesanGalat || semua.length" ref="wadahDaftar" class="ca-daftar-pengguna min-w-0 scroll-mt-24" :class="{ 'ca-daftar-rapat': adaDomi }">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div><h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('pengguna.daftarJudul') }}</h2><p class="mt-1 text-xs text-[var(--ca-muted)]">{{ tcf('pengguna.daftarKet') }}</p>
          <p v-if="adaDomi && jumlahDomi !== null" class="mt-1 text-xs text-[var(--ca-muted)] tabular-nums" data-uji="jumlah-pakai-domi">{{ tcf('pengguna.domi.jumlahPakai')(angka(jumlahDomi)) }}</p>
        </div>
        <span class="ca-pill-muted text-xs">{{ terbuka ? tcf('pengguna.kontakPenuh') : tcf('pengguna.emailSamar') }}</span>
      </div>
      <DataTable
        class="hidden lg:block"
        v-model:filters="filterKolom"
        :columns="kolom" :data="barisHalaman" :loading="memuat"
        :sort="{ key: q.urut, arah: q.arah }" :show-count="false"
        empty-icon="lucide:users" :empty-text="tanpaBaris"
        @sort="urutKolom"
        @row-click="(row: Baris) => navigateTo(`/console/cashflow/pengguna/${row.id}`)"
      >
        <template #cell-email="{ row }">
          <!-- Dengan kolom Domi tabel bergulir ke samping: email diberi lebar terkecil supaya tidak terjepit,
               dan lencana Tim turun ke bawahnya bila tidak muat. -->
          <div class="flex min-w-0 flex-wrap items-center gap-1">
            <div class="flex min-w-0 items-center gap-1">
              <NuxtLink :to="`/console/cashflow/pengguna/${row.id}`" class="min-w-0 max-w-[12rem] whitespace-normal break-all font-mono text-[var(--ca-text)] underline-offset-2 hover:underline" :title="row.email" :class="adaDomi ? '!min-w-[8.5rem]' : ''" @click.stop>{{ row.email }}</NuxtLink>
              <CashflowSalinKontak v-if="row.p.emailPenuh" jenis="email" :nilai="row.p.emailPenuh" />
            </div>
            <span v-if="row.p.tim" class="ca-pill-muted shrink-0 !px-1.5 !py-0 text-[0.65rem]" :title="tcf('pengguna.domi.timKet')">{{ tcf('pengguna.domi.tim') }}</span>
          </div>
          <span v-if="row.p.nama" class="block max-w-[12rem] truncate text-xs text-[var(--ca-muted)]" :title="row.p.nama">{{ row.p.nama }}</span>
          <span class="mt-0.5 block font-mono text-xs text-[var(--ca-subtle)]">ID {{ row.id.slice(0, 8) }}</span>
        </template>
        <!-- null = tidak ada nomor; title hanya bila server memang mengirim kolomnya
             (sebelum migrasinya terpasang, "belum ada nomor" belum tentu benar). -->
        <template #cell-wa="{ row, value }">
          <span v-if="value === null" class="text-[var(--ca-subtle)]" :title="serverKirimWa ? tcf('pengguna.waBelum') : undefined">—<span v-if="serverKirimWa" class="sr-only"> ({{ tcf('pengguna.waBelum') }})</span></span>
          <span v-else class="inline-flex items-center gap-1">
            {{ value }}<CashflowSalinKontak v-if="row.p.nomorPenuh" jenis="wa" :nilai="row.p.nomorPenuh" />
          </span>
        </template>
        <!-- Status WhatsApp: cara nomor dibuktikan atau tanggal lewat, lalu tanda C4
             dan K2. Kosong bila server belum mengirim kolomnya. -->
        <template #cell-status_wa="{ row }">
          <span v-if="!row.p.statusWa" class="text-[var(--ca-subtle)]">—<span class="sr-only"> ({{ tcf('pengguna.statusWa.kosong') }})</span></span>
          <CashflowStatusWaAkun v-else :status="row.p.statusWa" />
        </template>
        <!-- Versi ramping: ikon platform kecil (titik = varian uji seperti UAT) lalu
             nomor versinya. Di bawah versi tertinggi platform yang sama: redup. -->
        <template #cell-versi="{ row }">
          <span v-if="row.versi === null" class="text-[var(--ca-subtle)]">—</span>
          <span
            v-else class="inline-flex items-center gap-1.5"
            :class="versiTertinggal(row.p, versiTerbaru) ? 'text-[var(--ca-subtle)]' : 'text-[var(--ca-text)]'"
            :title="versiTertinggal(row.p, versiTerbaru) ? `${row.versi} · ${tcf('pengguna.versiLama')}` : row.versi"
          >
            <span v-if="row.p.platform" class="relative inline-flex shrink-0" role="img" :aria-label="row.p.platform.label" :title="row.p.platform.label">
              <Icon v-if="ikonPlatform(row.p.platform)" :name="ikonPlatform(row.p.platform)!" class="h-3.5 w-3.5" aria-hidden="true" />
              <span v-else class="text-[0.65rem] font-semibold" aria-hidden="true">{{ row.p.platform.label.slice(0, 1) }}</span>
              <span v-if="row.p.platform.varian" class="absolute -right-1 -top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--ca-gold-text)]" aria-hidden="true" />
            </span>
            {{ row.p.versiAplikasi ?? '—' }}<span v-if="versiTertinggal(row.p, versiTerbaru)" class="sr-only"> ({{ tcf('pengguna.versiLama') }})</span>
          </span>
        </template>
        <template #cell-status="{ row }">
          <span v-if="row.p.status === 'menunggu_hapus'" class="ca-pill-danger whitespace-nowrap text-[0.7rem]">{{ row.status }}</span>
          <template v-else>{{ row.status }}</template>
        </template>
        <template #cell-aktif="{ row, value }">
          <span class="whitespace-nowrap">{{ value }}</span>
          <div class="mt-0.5 text-xs text-[var(--ca-subtle)]"><span class="whitespace-nowrap">{{ tcf('pengguna.masuk') }} ·</span> <span class="whitespace-nowrap">{{ row.p.masukTerakhir }}</span></div>
        </template>
        <!-- Domi: jumlah pertanyaan seumur akun, dan 30 hari terakhir bila berbeda. -->
        <template #cell-domi="{ row }">
          <span v-if="row.domi === null" :title="ketKosong">—<span v-if="ketKosong" class="sr-only"> ({{ ketKosong }})</span></span>
          <template v-else>
            <span :class="row.domi ? 'font-semibold text-[var(--ca-text)]' : 'text-[var(--ca-subtle)]'" :title="row.p.domi?.kira ? tcf('pengguna.domi.kira') : undefined">{{ angka(row.domi) }}<template v-if="row.p.domi?.kira"><span class="font-normal text-[var(--ca-muted)]" aria-hidden="true">+</span><span class="sr-only"> ({{ tcf('pengguna.domi.kira') }})</span></template></span>
            <span v-if="tigaPuluh(row.p) !== null" class="mt-0.5 block whitespace-nowrap text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.domi.tigaPuluh')(angka(tigaPuluh(row.p))) }}</span>
          </template>
        </template>
        <!-- Kredit: sisa, dengan tanda kecil bila orang itu pernah membeli. -->
        <template #cell-kredit="{ row }">
          <span v-if="row.kredit === null" :title="ketKosong">—<span v-if="ketKosong" class="sr-only"> ({{ ketKosong }})</span></span>
          <span v-else class="inline-flex items-center justify-end gap-1.5">
            <span v-if="row.p.domi?.kreditBeli" class="inline-flex shrink-0 text-[var(--ca-gold-text)]" role="img" :aria-label="tcf('pengguna.domi.beli')(row.p.domi.kreditBeli)" :title="tcf('pengguna.domi.beli')(row.p.domi.kreditBeli)">
              <Icon name="lucide:shopping-bag" class="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            {{ angka(row.kredit) }}
          </span>
        </template>
        <template v-for="k in (['ruang', 'tx'] as const)" :key="k" #[`cell-${k}`]="{ value }">
          <span v-if="value === null" :title="tcf('umum.butuhTotp')">—<span class="sr-only"> ({{ tcf('umum.butuhTotp') }})</span></span>
          <template v-else>{{ angka(value) }}</template>
        </template>
        <template #cell-nominal="{ value }">
          <span v-if="value === null" :title="tcf('umum.butuhTotp')">—<span class="sr-only"> ({{ tcf('umum.butuhTotp') }})</span></span>
          <template v-else>{{ rupiah(value) }}</template>
        </template>
      </DataTable>
      <div class="min-w-0 space-y-3 lg:hidden" :aria-busy="memuat">
        <div v-if="memuat && !barisHalaman.length" class="ca-console-dialog p-6 text-center" role="status">
          <Icon name="lucide:loader-2" class="mx-auto h-6 w-6 animate-spin text-[var(--ca-subtle)]" aria-hidden="true" />
          <span class="sr-only">{{ tcf('umum.memuat') }}</span>
        </div>
        <p v-else-if="!barisHalaman.length" class="ca-console-dialog p-6 text-center text-sm text-[var(--ca-muted)]">{{ tanpaBaris }}</p>
        <ul v-else class="space-y-3" :inert="memuat">
          <li v-for="row in barisHalaman" :key="row.id" class="ca-console-dialog min-w-0 p-4">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="min-w-0 grow">
                <div class="flex items-center gap-1">
                  <NuxtLink :to="`/console/cashflow/pengguna/${row.id}`" class="min-w-0 break-all font-mono text-sm font-semibold text-[var(--ca-text)] underline-offset-2 hover:underline">{{ row.email }}</NuxtLink>
                  <CashflowSalinKontak v-if="row.p.emailPenuh" jenis="email" :nilai="row.p.emailPenuh" />
                  <span v-if="row.p.tim" class="ca-pill-muted shrink-0 !px-1.5 !py-0 text-[0.65rem]" :title="tcf('pengguna.domi.timKet')">{{ tcf('pengguna.domi.tim') }}</span>
                </div>
                <span v-if="row.p.nama" class="block break-words text-xs text-[var(--ca-muted)]">{{ row.p.nama }}</span>
                <span class="block font-mono text-xs text-[var(--ca-subtle)]">ID {{ row.id.slice(0, 8) }}</span>
              </div>
              <span class="text-xs" :class="row.p.status === 'aktif' ? 'ca-pill-muted' : 'ca-pill-danger'">{{ row.status }}</span>
            </div>
            <dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 text-sm">
              <div class="col-span-2 min-w-0">
                <dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.wa') }}</dt>
                <dd class="flex items-center gap-1 break-all font-mono tabular-nums text-[var(--ca-text)]">
                  {{ row.wa ?? '—' }}
                  <CashflowSalinKontak v-if="row.p.nomorPenuh" jenis="wa" :nilai="row.p.nomorPenuh" />
                </dd>
              </div>
              <div v-if="row.p.statusWa" class="col-span-2 min-w-0">
                <dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.statusWa.judul') }}</dt>
                <dd><CashflowStatusWaAkun :status="row.p.statusWa" baris /></dd>
              </div>
              <div v-for="k in kolomKartu" :key="k.key" class="min-w-0">
                <dt class="text-xs text-[var(--ca-subtle)]">{{ k.key === 'tx' ? tcf('pengguna.tx') : k.label }}</dt>
                <dd class="break-words tabular-nums text-[var(--ca-text)]" :class="k.key === 'versi' && versiTertinggal(row.p, versiTerbaru) ? 'opacity-70' : ''">
                  {{ nilaiKartu(row, k.key) }}
                  <span v-if="k.key === 'aktif'" class="block text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.masuk') }} · {{ row.p.masukTerakhir }}</span>
                  <span v-if="k.key === 'domi' && row.p.domi?.kira" class="block text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.domi.kira') }}</span>
                  <span v-if="k.key === 'domi' && tigaPuluh(row.p) !== null" class="block text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.domi.tigaPuluh')(angka(tigaPuluh(row.p))) }}</span>
                  <span v-if="k.key === 'kredit' && row.kredit !== null && row.p.domi?.kreditBeli" class="block text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.domi.beli')(row.p.domi.kreditBeli) }}</span>
                </dd>
              </div>
            </dl>
            <NuxtLink :to="`/console/cashflow/pengguna/${row.id}`" class="ca-btn-secondary mt-3 flex min-h-10 w-full items-center justify-between !px-3 !py-1.5 text-xs">
              {{ tcf('pengguna.detail') }}<Icon name="lucide:chevron-right" class="h-4 w-4" aria-hidden="true" />
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>

    <CashflowHalaman
      v-if="total"
      :hal="hal" :jumlah-halaman="jumlahHal" :total="total" :per="PER" :memuat="memuat || !!galat" lompat
      @ganti="gantiHalaman"
    />

    <p v-if="!hapusTersedia" class="text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.hapusBelumTersedia') }}</p>
    <p v-if="tanpaHitungan" class="text-xs text-[var(--ca-subtle)]">{{ tcf('umum.hitunganButuhTotp') }}</p>
    <p class="text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.aktifTerakhirKet') }}</p>
    <p v-if="serverKirimVersi" class="text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.versiKet') }}</p>
    <p v-if="serverStatusWa" class="text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.statusWa.ket') }}</p>
    <p v-if="adaDomi" class="text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.domi.ket') }}</p>
    <CashflowPalet :show="paletBuka" @close="paletBuka = false" />
  </div>
</template>

<style scoped>
/* Jarak sel tabel di halaman ini sedikit lebih rapat daripada bawaan DataTable
   (1rem). Dengan kolom Status WhatsApp, sepuluh kolom muat tanpa gulir samping
   mulai jendela 1440 px. Di 1280 px tabel bergulir sedikit di dalam bingkainya. */
.ca-daftar-pengguna :deep(.ca-console-table th),
.ca-daftar-pengguna :deep(.ca-console-table td) {
  padding-inline: 0.625rem;
}
/* Dengan tiga kolom Domi (server v4) jaraknya dirapatkan sedikit lagi. Di 1440 px
   tabel tetap bergulir di dalam bingkainya untuk kolom paling kanan. */
.ca-daftar-rapat :deep(.ca-console-table th),
.ca-daftar-rapat :deep(.ca-console-table td) {
  padding-inline: 0.5rem;
}
</style>
