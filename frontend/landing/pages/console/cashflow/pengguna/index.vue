<script setup lang="ts">
/** Pencarian, saringan, urutan, dan paginasi berlaku atas seluruh akun.
 * Server mengaudit setiap halaman yang diminta dengan kontak lengkap.
 *
 * v5 (spek console laporan 19 Nov 2026, K3 dan K7): setiap kunci baris punya
 * kolom, setiap kepala kolom mengurutkan di server, waktu ber-detik WIB saat
 * kontak dibuka, kolom pertama lengket dan tabel boleh bergulir ke samping,
 * kolom Sumber dari asal pengguna. Server lama jatuh ke v4 lalu v3. */
import {
  angka, kePengguna, pembandingVersi, rupiah, tanpaKontakUtuh, versiTertinggal,
  type Pengguna, type PenggunaDTO, type StatusPengguna,
} from '~/adapters/cashflow'
import { halamanAman, jumlahHalaman } from '~/adapters/cashflowDaftar'
import { RILIS_PLAY_TERAKHIR } from '~/adapters/cashflowVersi'
import { SEGMEN_BELUM_WA, STATUS_WA_AKUN, type StatusWaAkunKode } from '~/adapters/cashflowWa'
import {
  FILTER_INTERNAL, NILAI_INTERNAL, SEGMEN_BELI_KREDIT, SEGMEN_PAKAI_DOMI,
  bacaDaftarBerjenjang, butuhV4, jumlahPakaiDomi, segmenDomi, tanpaHitunganDomi, urutDomi,
} from '~/adapters/cashflowPenggunaDomi'
import {
  FILTER_KOLOM, SEGMEN_PENGGUNA, STATUS_AKUN, URUT_BERKOLOM, URUT_PENGGUNA, URUT_PRIBADI,
  barisWa, filterServer, gantiUrut, jumlahSaringan, opsiUrut, rupiahRingkas, segmenButuhHitungan, tambahanUrut, tanpaTahunIni,
  urutBoleh, type UrutPengguna,
} from '~/adapters/cashflowPenggunaDaftar'
import { hariIniWib } from '~/adapters/cashflowWaktu'
import { KOLOM_ANGKA, bacaDaftarV5, butuhV5, kolomUntuk, urutV5, waktuSel, type KunciKolom } from '~/adapters/cashflowPenggunaKolom'
import { keadaanDaftar } from '~/utils/cashflow/keadaan'
import type { OpsiSegmen } from '~/utils/cashflow/segmen'
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
/* Nilai segmen, urut, dan saringan ada di adapters/cashflowPenggunaDaftar:
   sama dengan yang dikenal server dan tautan lama (?seg, ?urut, ?arah, ?hal). */
const SEGMEN = SEGMEN_PENGGUNA
const URUT = URUT_PENGGUNA
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
/* Versi tertinggi menurut server, lalu disaring jadi pembanding yang sah (tanpa
   pra-rilis dan tanpa build akun tim): lihat pembandingVersi. */
const versiServer = shallowRef<Map<string, string>>(new Map())
const versiTerbaru = computed(() => pembandingVersi(versiServer.value, semua.value, RILIS_PLAY_TERAKHIR.versi))
const hapusTersedia = ref(true)
const paletBuka = ref(false)
const saringBuka = ref(false)
const bawaan = useCashflowBawaanRinci()
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
/* Server sudah memasang daftar v4 (pemakaian Domi, kredit, akun tim). null =
   belum tahu, false = server lama: daftar dibaca lewat v3, dan kolom, urutan,
   segmen, serta saringan Domi tidak ditawarkan. Lengket selama sesi supaya
   server lama tidak ditanyai v4 di setiap muatan. */
const serverDomi = useState<boolean | null>('cf_server_domi', () => null)
const adaDomi = computed(() => serverDomi.value === true)
/* Server sudah memasang daftar v5 (urutan setiap kolom, asal pengguna). Sama: null belum tahu, false server lama. */
const serverV5 = useState<boolean | null>('cf_server_v5', () => null)
const adaV5 = computed(() => serverV5.value === true)
/** Jumlah akun yang pernah bertanya ke Domi (kepala hasil v4). null = tidak dikirim. */
const jumlahDomi = ref<number | null>(null)
const izinPribadi = computed(() => sesi.boleh('cashflow:pii'))
const tanpaHitungan = computed(() => !izinPribadi.value || ditolak.value)

const bersihkanData = (rows: readonly PenggunaDTO[]) => tanpaKontakUtuh(rows)
  .map(row => tanpaHitunganDomi({ ...row, jumlah_ruang: null, jumlah_tx: null, jumlah_nominal: null, ...(row.asal !== undefined ? { asal: null } : {}) }))
/** Kontak akan dibuka pada muatan berikutnya: sesi ber-pii dan sakelar menyala. */
const bolehKontak = computed(() => !tanpaHitungan.value && !samarkanKontak.value)
const samarkanBaris = (tanpaDataPribadi = false) => {
  terbuka.value = false
  if (tanpaDataPribadi) { jumlahDomi.value = null; bawaan.kosongkan() }
  mentah.value = tanpaDataPribadi ? bersihkanData(mentah.value) : tanpaKontakUtuh(mentah.value)
}

const urutAman = async (): Promise<boolean> => {
  // Urut nama hanya bila kontak dibuka (server menolaknya tanpa alasan).
  if (q.value.urut === 'nama' && !bolehKontak.value) {
    await setel({ urut: 'daftar', arah: 'desc', hal: 1 })
    return true
  }
  if (!tanpaHitungan.value || (!segmenButuhHitungan(q.value.seg) && !URUT_PRIBADI.includes(q.value.urut))) return false
  await setel({ seg: 'semua', urut: 'daftar', arah: 'desc', hal: 1 })
  return true
}

/* Jawaban basi tidak boleh menimpa halaman atau membuka kontak kembali. */
const muatDaftar = () => muat(async (terbaru) => {
  // Baris yang sudah tampil bertahan sampai jawaban terbaru siap. Spinner
  // tidak boleh meruntuhkan tabel, paginasi, fokus, atau posisi gulir.
  // Saringan status WhatsApp hanya dikirim ke server yang mengenalnya. Saringan
  // akun tim hanya dikenal v4: di server lama ia dilepas, tidak dikirim ke v3.
  const filter = filterServer(filterDiterapkan.value, { serverStatusWa: serverStatusWa.value, labelStatus })
  const opsi = (alasan: string | null) => ({
    limit: PER, offset: (q.value.hal - 1) * PER, cari: cariDiterapkan.value.trim(),
    segmen: q.value.seg, urut: q.value.urut, arah: q.value.arah, filter,
    bahasa: bahasa.value, alasan,
  })
  // v5 dulu, lalu v4, lalu v3 untuk server lama. null = pilihan v5 atau Domi tidak bisa dijawab server ini.
  const baca = async (alasan: string | null) => {
    const lama = async () => {
      const jawab = await bacaDaftarBerjenjang({
        kenalV4: serverDomi.value, butuh: butuhV4(q.value, filter),
        v4: () => api.daftarPenggunaHalamanV4(opsi(alasan)),
        v3: () => api.daftarPenggunaHalaman(opsi(alasan)),
      })
      serverDomi.value = jawab.v4
      return jawab.hasil
    }
    const j = await bacaDaftarV5({ kenalV5: serverV5.value, butuh: butuhV5(q.value), v5: () => api.daftarPenggunaHalamanV5(opsi(alasan)), lama })
    serverV5.value = j.v5
    if (j.v5) serverDomi.value = true
    return j.hasil
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
  versiServer.value = new Map(Object.entries(hasil.versi_terbaru ?? {}))
  hapusTersedia.value = hasil.hapus_tersedia
  jumlahDomi.value = tanpaHitungan.value ? null : jumlahPakaiDomi(hasil)
  // Pencarian palet tidak boleh menganggap hasil tersaring daftar lengkap.
  const lengkap = q.value.seg === 'semua' && !cariDiterapkan.value.trim() && !Object.keys(filter).length && q.value.hal === 1
  indeks.isi(semua.value, lengkap ? total.value : Number.MAX_SAFE_INTEGER)
  // Cara nomor dibuktikan dan terakhir pakai Domi tampil di rincian, dibawa dari baris ini.
  bawaan.isi(semua.value)
  terbuka.value = bolehBuka
})
// Mempertahankan hasil saat jaringan lambat tidak berlaku bila hak baca hilang.
watch(galat, (g) => {
  if (!g || !['izin', 'sesi', 'totp', 'bukan-admin'].includes(g.jenis)) return
  mentah.value = []
  total.value = 0
  terbuka.value = false
  indeks.kosongkan()
  bawaan.kosongkan()
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
    ...(urutDomi(q.value.urut) || (urutV5(q.value.urut) && !adaV5.value) ? { urut: 'daftar' as const, arah: 'desc' as const } : {}),
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
  // Urut nama tidak berlaku lagi saat kontak disamarkan: pengamat query yang memuat ulang.
  void urutAman().then((ganti) => { if (!ganti) void muatDaftar() })
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
  id: string; email: string; wa: string | null; versi: string | null; aktif: string
  domi: number | null; kredit: number | null; ruang: number | null; status: string; p: Pengguna
}
const keBaris = (p: Pengguna): Baris => ({
  id: p.id,
  email: p.emailPenuh ?? p.emailTersamar,
  wa: p.nomorPenuh ?? p.nomorTersamar,
  versi: p.labelVersi,
  aktif: p.aktivitasTerakhir,
  domi: p.domi?.tanya ?? null,
  kredit: p.domi?.kreditSisa ?? null,
  ruang: p.ruang,
  status: labelStatus(p.status),
  p,
})

const keadaanUrut = computed(() => ({ adaDomi: adaDomi.value, tanpaHitungan: tanpaHitungan.value, adaV5: adaV5.value, terbuka: bolehKontak.value }))
/* Semua kunci baris punya kolom (adapters/cashflowPenggunaKolom), urutan kolomnya
   tetap. Kolom Domi dan kredit hanya bila server memasang v4, Sumber hanya v5.
   Setiap kepala kolom mengurutkan di server bila server mengenal urutannya dan
   sesi ini boleh memakainya. Kolom pertama lengket, tabel boleh bergulir ke
   samping (keputusan Master 19 Nov 2026, K3). Saringan tetap di panel Saring. */
const LABEL_KOLOM: Record<KunciKolom, string> = {
  email: 'nav.pengguna', nama: 'pengguna.v5.nama', wa: 'pengguna.wa', status_wa: 'pengguna.statusWa.judul', versi: 'pengguna.versi',
  status: 'pengguna.status', daftar: 'pengguna.daftar', masuk: 'pengguna.masuk', aktif: 'pengguna.aktifTerakhir',
  ruang: 'pengguna.ruang', tx: 'pengguna.tx', nominal: 'pengguna.nominal', domi: 'pengguna.tanyaDomi', domi_30: 'pengguna.v5.domi30',
  domi_terakhir: 'pengguna.v5.domiTerakhir', kredit: 'pengguna.v5.kreditSisa', kredit_beli: 'pengguna.v5.kreditBeli', sumber: 'pengguna.v5.sumber',
}
const LEBAR_KOLOM: Partial<Record<KunciKolom, string>> = {
  nama: '170px', wa: '170px', status_wa: '190px', versi: '130px', status: '140px', daftar: '170px', masuk: '170px', aktif: '170px',
  ruang: '80px', tx: '100px', nominal: '140px', domi: '110px', domi_30: '120px', domi_terakhir: '170px', kredit: '110px', kredit_beli: '120px', sumber: '210px',
}
const tingkatServer = computed<3 | 4 | 5>(() => (adaV5.value ? 5 : adaDomi.value ? 4 : 3))
const kolom = computed(() => {
  const urut = (k: string) => URUT_BERKOLOM.includes(k as UrutPengguna) && urutBoleh(k as UrutPengguna, keadaanUrut.value)
  return kolomUntuk(tingkatServer.value).map(k => ({
    key: k.key, label: tcf(LABEL_KOLOM[k.key]), sortable: urut(k.urut), filterable: false,
    ...(LEBAR_KOLOM[k.key] ? { width: LEBAR_KOLOM[k.key] } : {}),
    class: KOLOM_ANGKA.includes(k.key) ? 'cf-ka text-[var(--ca-text)]' : 'text-[var(--ca-text)]',
    ...(KOLOM_ANGKA.includes(k.key) ? { headerClass: 'cf-ka' } : {}),
  }))
})
/** Angka sel hitungan. null = tidak boleh tahu, atau server belum mengirim kolomnya. */
const angkaSel = (p: Pengguna, k: 'ruang' | 'tx' | 'kredit_beli' | 'domi_30'): number | null =>
  k === 'ruang' ? p.ruang : k === 'tx' ? p.tx : k === 'kredit_beli' ? (p.domi?.kreditBeli ?? null) : (p.domi?.tanya30 ?? null)
/** Waktu satu sel: ber-detik bila baris ini terbuka, tanggal saja bila tidak. */
const waktu = (p: Pengguna, iso: string | null | undefined) => waktuSel(iso, { terbuka: p.terbuka, bahasa: bahasa.value })
const LABEL_SUMBER: Record<string, string> = { ig: 'Instagram', instagram: 'Instagram', wa: 'WhatsApp', whatsapp: 'WhatsApp', tt: 'TikTok', tiktok: 'TikTok', web: 'Web', google: 'Google', 'google-play': 'Play Store', play: 'Play Store' }
const labelSumber = (s: string) => LABEL_SUMBER[s.toLowerCase()] ?? s
/** Sumber: utm_source bila ada, selain itu jawaban pertanyaan. Baris kedua: jawaban (bila keduanya ada), medium, kampanye. */
const sumber = (p: Pengguna): { utama: string; dua: string | null } | null => {
  const a = p.asal
  if (!a) return null
  const jawab = a.jawaban ? tcf(`pengguna.v5.jawaban.${a.jawaban}`) : null
  const utama = a.sumber ? labelSumber(a.sumber) : jawab ?? '—'
  const dua = [a.sumber && jawab ? `${tcf('pengguna.v5.jawabanPendek')} ${jawab}` : null, a.medium, a.kampanye].filter(Boolean).join(' · ')
  return { utama, dua: dua || null }
}

const hal = computed(() => halamanHasil.value)
const jumlahHal = computed(() => jumlahHalaman(total.value, PER))
const barisHalaman = computed(() => semua.value.map(keBaris))
const pilihSegmen = (s: typeof SEGMEN[number]) => setel({ seg: s, hal: 1 })
/** Kepala kolom dan pilihan "Urut" memakai aturan yang sama: kunci yang sama membalik arah. */
const urutKolom = (key: string) => {
  const baru = gantiUrut(q.value, key, keadaanUrut.value)
  if (baru) void setel(baru)
}
/** Kunci kolom = nilai p_urut, jadi kepala kolom dan pilihan Urut memakai aturan yang sama. */
const urutPilihan = computed({ get: () => q.value.urut, set: (k: UrutPengguna) => { if (k !== q.value.urut) urutKolom(k) } })
const balikArah = () => { void setel({ arah: q.value.arah === 'asc' ? 'desc' : 'asc', hal: 1 }) }
const pilihanUrut = computed(() => opsiUrut(keadaanUrut.value).map(o => ({ ...o, label: tcf(`pengguna.urutOpsi.${o.nilai}`) })))
/** Kolom tanpa tempat di tabel yang sedang jadi urutan: nilainya ditulis di baris kedua. */
const tambahan = computed(() => tambahanUrut(q.value.urut))

const banyakSaringan = computed(() => jumlahSaringan(filterKolom.value))
const adaPenyaring = computed(() => !!cariDiterapkan.value || Object.keys(filterDiterapkan.value).length > 0 || q.value.seg !== 'semua')
const tanpaBaris = computed(() => (adaPenyaring.value ? tcf('umum.kosongSaring') : tcf('umum.kosong')))
/** Kembali ke daftar utuh: segmen, kata cari, dan saringan dilepas sekaligus. */
const lepasPenyaring = async () => {
  cari.value = ''
  cariDiterapkan.value = ''
  filterKolom.value = {}
  filterDiterapkan.value = {}
  await setel({ seg: 'semua', hal: 1 })
}
/** Isian panel Saring: teks bebas, lalu pilihan status. Kuncinya sama dengan saringan kolom lama. */
const isianSaring = computed(() => [
  ...FILTER_KOLOM.filter(k => k !== 'status').map(k => ({ kunci: k as string, label: tcf(`pengguna.urutOpsi.${k}`), opsi: null })),
  { kunci: 'status', label: tcf('pengguna.status'), opsi: STATUS_AKUN.map(s => ({ value: s as string, label: labelStatus(s) })) },
  // Tanpa kolom status_wa dari server saringannya tidak ditawarkan.
  ...(serverStatusWa.value ? [{ kunci: 'status_wa', label: tcf('pengguna.statusWa.judul'), opsi: STATUS_WA_AKUN.map(s => ({ value: s as string, label: labelStatusWa(s) })) }] : []),
])

/** Hitungan di pil: hanya angka yang memang sudah ada, yaitu hasil daftar yang sedang tampil tanpa kata cari dan saringan. */
const jumlahSegmenAktif = computed(() => (memuat.value || pesanGalat.value || cariDiterapkan.value.trim() || Object.keys(filterDiterapkan.value).length ? null : total.value))
const segmenOpsi = computed<OpsiSegmen<typeof SEGMEN[number]>[]>(() => [
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
].map((s) => {
  const mati = tanpaHitungan.value && segmenButuhHitungan(s.kunci)
  return { nilai: s.kunci, label: s.label, mati, ket: mati ? tcf('umum.butuhTotp') : undefined, jumlah: q.value.seg === s.kunci ? jumlahSegmenAktif.value : null }
}))
/** Saringan akun tim: semua, tanpa tim, hanya tim. Nilainya ikut saringan kolom (jeda, hapus semua). */
const opsiTim = computed(() => NILAI_INTERNAL.map(v => ({ value: v, label: tcf(v === 'ya' ? 'pengguna.domi.timHanya' : 'pengguna.domi.timTanpa') })))
const saringTim = computed({
  get: () => filterKolom.value[FILTER_INTERNAL] ?? '',
  set: (v: string) => {
    const { [FILTER_INTERNAL]: _lama, ...sisa } = filterKolom.value
    filterKolom.value = v ? { ...sisa, [FILTER_INTERNAL]: v } : sisa
  },
})
const setelSaring = (kunci: string, v: string) => {
  const { [kunci]: _lama, ...sisa } = filterKolom.value
  filterKolom.value = v ? { ...sisa, [kunci]: v } : sisa
}
/** Sel kosong: "akses terbatas" hanya bila memang izinnya yang kurang. */
const ketKosong = computed(() => (tanpaHitungan.value ? tcf('umum.butuhTotp') : undefined))
/** Server sudah memasang migrasi nomor WA (kolomnya ada di jawaban). */
const serverKirimWa = computed(() => mentah.value.some(d => d.nomor_wa !== undefined))
const serverKirimVersi = computed(() => mentah.value.some(d => d.versi_aplikasi !== undefined))
/** Baris kedua kolom WhatsApp: status singkat. Kalimat panjangnya ada di rincian. */
const teksWa = (p: Pengguna): string | null => {
  const b = barisWa(p)
  if (!b) return null
  // Tahun berjalan tidak ditulis supaya status muat satu baris. Tanggal lengkapnya ada di rincian.
  return b.kunci === 'waTerbukti' ? (b.pada ? tcf('pengguna.waTerbukti')(tanpaTahunIni(b.pada, hariIniWib().slice(0, 4))) : labelStatusWa(p.statusWa!.status)) : tcf(`pengguna.${b.kunci}`)
}
const titikWa = (p: Pengguna): string => {
  const nada = barisWa(p)?.nada
  return nada === 'baik' ? 'cf-titik-baik' : nada === 'awas' ? 'cf-titik-awas' : ''
}
/** Baris kedua Tanya Domi: 30 hari terakhir, atau tanggal terakhir saat itu yang jadi urutan. */
const duaDomi = (p: Pengguna): string | null => {
  if (!p.domi || p.domi.tanya === null) return null
  if (tambahan.value === 'domi_terakhir') return p.domi.terakhirIso ? tcf('pengguna.domiTerakhirPada')(p.domi.terakhir) : tcf('pengguna.domiBelum')
  if (p.domi.tanya === 0) return tcf('pengguna.domiBelum')
  return p.domi.tanya30 === null ? null : tcf('pengguna.domi.tigaPuluh')(angka(p.domi.tanya30))
}
const artiKolom = computed(() => [
  { judul: tcf('nav.pengguna'), isi: tcf('pengguna.artiPengguna') },
  ...(serverStatusWa.value ? [{ judul: tcf('pengguna.wa'), isi: tcf('pengguna.statusWa.ket') }] : []),
  ...(serverKirimVersi.value ? [{ judul: tcf('pengguna.versi'), isi: tcf('pengguna.versiKet') }] : []),
  { judul: tcf('pengguna.aktifTerakhir'), isi: tcf('pengguna.aktifTerakhirKet') },
  ...(adaDomi.value ? [{ judul: `${tcf('pengguna.tanyaDomi')}, ${tcf('pengguna.kredit')}`, isi: tcf('pengguna.domi.ket') }] : []),
  { judul: tcf('pengguna.ruang'), isi: tcf('pengguna.artiRuang') },
  { judul: tcf('pengguna.v5.waktuJudul'), isi: tcf('pengguna.v5.waktuKet') },
  ...(adaV5.value ? [{ judul: tcf('pengguna.v5.sumber'), isi: tcf('pengguna.v5.sumberKet') }] : []),
])
/** Kerangka, galat, atau kosong menggantikan tabel. null = barisnya tampil. */
const keadaan = computed(() => keadaanDaftar({ memuat: memuat.value, galat: !!pesanGalat.value, izin: galat.value?.jenis === 'izin', jumlah: semua.value.length }))
useCashflowPintasan([{ kunci: '/', aksi: () => kolomCari.value?.focus() }])
</script>

<template>
  <div class="space-y-5">
    <ConsolePageHeader :title="tcf('pengguna.judul')" kicker="CashFlow" ringkas :description="pesanGalat ? undefined : memuat ? tcf('umum.memuat') : tcf('pengguna.jumlahHasil')(total)">
      <template #meta><CashflowNav /></template>
      <template #actions>
        <!-- Kontak lengkap: satu ketukan dan tercatat di audit. -->
        <button
          type="button" role="switch" :aria-checked="!!terbuka"
          class="inline-flex items-center gap-3 rounded-full border border-[color:var(--ca-border)] bg-[var(--ca-surface)] py-1.5 pl-4 pr-1.5 text-sm font-semibold text-[var(--ca-text)] transition hover:bg-[var(--ca-panel-bg-strong)] disabled:cursor-not-allowed disabled:opacity-60"
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
      </template>
    </ConsolePageHeader>

    <!-- Cari, Saring, dan Urut: satu baris alat untuk layar lebar maupun ponsel. -->
    <div class="flex flex-wrap items-center gap-2.5">
      <form class="flex min-w-0 flex-[1_1_20rem] gap-2" @submit.prevent="jalankanCari">
        <input ref="kolomCari" v-model="cari" type="search" maxlength="200" class="ca-input min-w-0 flex-1" :aria-label="tcf('pengguna.cariLabel')" :placeholder="tcf('pengguna.cariLabel')">
        <button type="submit" class="ca-btn-secondary !px-4 !py-2 text-sm">{{ tcf('pengguna.cariTombol') }}</button>
      </form>
      <button type="button" class="ca-btn-secondary !px-4 !py-2 text-sm" @click="paletBuka = true">{{ tcf('cari.server') }}</button>
      <button type="button" class="ca-btn-secondary inline-flex items-center gap-2 !px-4 !py-2 text-sm" aria-haspopup="dialog" data-uji="saring-buka" @click="saringBuka = true">
        <Icon name="lucide:sliders-horizontal" class="h-4 w-4" aria-hidden="true" />{{ tcf('pengguna.saringan') }}
        <span v-if="banyakSaringan" class="rounded-full bg-[var(--ca-panel-bg-strong)] px-1.5 text-xs font-bold tabular-nums" data-uji="saring-jumlah">{{ banyakSaringan }}</span>
      </button>
      <div class="flex min-w-0 items-center gap-1.5">
        <label class="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--ca-muted)]">
          {{ tcf('pengguna.urut') }}
          <select v-model="urutPilihan" class="ca-input min-w-0 !w-auto !py-2 text-sm font-semibold" data-uji="urut">
            <option v-for="o in pilihanUrut" :key="o.nilai" :value="o.nilai" :disabled="o.mati">{{ o.label }}</option>
          </select>
        </label>
        <button
          type="button" class="ca-btn-secondary !px-2.5 !py-2" data-uji="urut-arah" :data-arah="q.arah"
          :aria-label="`${tcf('pengguna.urut')}: ${q.arah === 'desc' ? tcf('pengguna.turun') : tcf('pengguna.naik')}`"
          :title="tcf('pengguna.arahUrut')(q.arah === 'desc')" @click="balikArah"
        ><Icon :name="q.arah === 'desc' ? 'lucide:arrow-down' : 'lucide:arrow-up'" class="h-4 w-4" aria-hidden="true" /></button>
      </div>
    </div>
    <p v-if="!memuat && !terbuka" class="!mt-2 text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.cariKet') }}</p>

    <CashflowSegmen :opsi="segmenOpsi" :nilai="q.seg" :label="tcf('pengguna.daftarJudul')" gulir @pilih="pilihSegmen" />
    <p v-if="adaDomi && jumlahDomi !== null" class="!mt-2 text-xs text-[var(--ca-muted)] tabular-nums" data-uji="jumlah-pakai-domi">{{ tcf('pengguna.domi.jumlahPakai')(angka(jumlahDomi)) }}</p>

    <CashflowIzinKurang v-if="perluVerifikasi || galat?.jenis === 'izin'" baca :pesan="tcf('pengguna.kontakButuhTotp')" />
    <!-- Muatan berikutnya gagal padahal baris lama masih di layar: galatnya ringkas di atas daftar. -->
    <div v-else-if="pesanGalat && semua.length" class="flex flex-wrap items-center gap-3 rounded-xl bg-[var(--ca-danger-bg)] px-4 py-3 text-sm font-semibold text-[var(--ca-danger-text)]" role="alert">
      <span>{{ pesanGalat }}</span>
      <span class="font-medium">{{ tcf('pengguna.hasilSebelumnya') }}</span>
      <button type="button" class="ca-btn-secondary ml-auto !px-3 !py-1.5 text-xs" @click="muatDaftar()">{{ tcf('umum.cobaLagi') }}</button>
    </div>

    <!-- Muat gagal tanpa baris = galat saja. "Belum ada data" di bawahnya terbaca seolah produk tidak punya pengguna. -->
    <CashflowKeadaan
      v-if="keadaan === 'galat'" jenis="galat" :judul="tcf('umum.galatJudul')" :pesan="pesanGalat ?? ''"
      :label-ulang="tcf('umum.cobaLagi')" :sibuk="memuat" @ulang="muatDaftar()"
    />
    <!-- Akses ditolak: keterangannya sudah di atas, daftar tidak ditampilkan. -->
    <div v-else-if="keadaan !== 'terbatas'" ref="wadahDaftar" class="ca-daftar-pengguna min-w-0 scroll-mt-24" data-uji="daftar-pengguna">
      <CashflowKeadaan v-if="keadaan === 'memuat'" jenis="memuat" :pesan="tcf('umum.memuat')" :baris="6" :kolom="adaDomi ? 7 : 5" />
      <CashflowKeadaan v-else-if="keadaan === 'kosong'" jenis="kosong" icon="lucide:users" :judul="adaPenyaring ? tcf('umum.kosongSaringJudul') : tcf('umum.kosongJudul')" :pesan="tanpaBaris">
        <button v-if="adaPenyaring" type="button" class="ca-btn-secondary !px-4 !py-2 text-sm" data-uji="lepas-saringan" @click="lepasPenyaring">{{ tcf('umum.lepasSaringan') }}</button>
      </CashflowKeadaan>
      <template v-else>
        <div data-uji="tabel-pengguna" class="cf-tabel-wadah cf-tabel-lebar hidden lg:block">
          <DataTable
            :columns="kolom" :data="barisHalaman" :loading="memuat"
            :sort="{ key: q.urut, arah: q.arah }" :show-count="false"
            @sort="urutKolom"
            @row-click="(row: Baris) => navigateTo(`/console/cashflow/pengguna/${row.id}`)"
          >
            <!-- Pengguna (lengket): email utuh satu baris, lalu lencana Tim. -->
            <template #cell-email="{ row }">
              <span class="cf-sel-salin">
                <NuxtLink :to="`/console/cashflow/pengguna/${row.id}`" class="cf-kuat block min-w-0 truncate underline-offset-2 hover:underline" :title="row.email" data-uji="sel-email" :aria-label="tcf('pengguna.bukaRinci')(row.email)" @click.stop>{{ row.email }}</NuxtLink>
                <span v-if="row.p.emailPenuh" class="cf-salin"><CashflowSalinKontak jenis="email" :nilai="row.p.emailPenuh" /></span>
              </span>
              <span v-if="row.p.tim" class="ca-pill-info mt-1 inline-flex !px-1.5 !py-0 text-[0.7rem]" :title="tcf('pengguna.domi.timKet')">{{ tcf('pengguna.domi.tim') }}</span>
            </template>
            <template #cell-nama="{ row }">
              <span v-if="row.p.nama" class="block max-w-[14rem] truncate" :title="row.p.nama" data-uji="sel-nama">{{ row.p.nama }}</span>
              <span v-else class="cf-redup" :title="row.p.terbuka ? undefined : tcf('pengguna.v5.namaTersamar')">—</span>
            </template>
            <!-- WhatsApp: nomor dan tandanya. null = tidak ada nomor. -->
            <template #cell-wa="{ row, value }">
              <span v-if="value === null" class="cf-redup whitespace-nowrap">
                <template v-if="serverKirimWa">{{ tcf('pengguna.waTanpaNomor') }}</template>
                <template v-else>—</template>
              </span>
              <span v-else class="cf-sel-salin">
                <span class="whitespace-nowrap">{{ value }}</span>
                <span v-if="row.p.nomorPenuh" class="cf-salin"><CashflowSalinKontak jenis="wa" :nilai="row.p.nomorPenuh" /></span>
              </span>
              <span v-if="row.p.statusWa?.nomorRamai || row.p.statusWa?.kreditDitahan" class="mt-1 flex flex-wrap gap-1">
                <span v-if="row.p.statusWa.nomorRamai" class="ca-pill-gold !rounded-lg !px-2 !py-0.5 text-[0.65rem] leading-tight" :title="tcf('pengguna.statusWa.ramaiKet')">{{ tcf('pengguna.statusWa.ramai') }}</span>
                <span v-if="row.p.statusWa.kreditDitahan" class="ca-pill-info !rounded-lg !px-2 !py-0.5 text-[0.65rem] leading-tight" :title="tcf('pengguna.statusWa.kreditKet')">{{ tcf('pengguna.statusWa.kredit') }}</span>
              </span>
            </template>
            <!-- Status WhatsApp: cara nomor dibuktikan, lalu kapan (ber-detik bila kontak dibuka). -->
            <template #cell-status_wa="{ row }">
              <template v-if="row.p.statusWa">
                <span class="whitespace-nowrap"><span class="cf-titik" :class="titikWa(row.p)" aria-hidden="true" />{{ tcf(`pengguna.v5.statusWaPendek.${row.p.statusWa.status}`) }}</span>
                <span v-if="row.p.statusWa.padaIso" class="cf-dua whitespace-nowrap" data-uji="sel-wa-pada">{{ waktu(row.p, row.p.statusWa.padaIso) }}</span>
                <span v-if="row.p.statusWa.status === 'lewat' && row.p.statusWa.sebabLewat === 'tanpa_nomor'" class="cf-dua">{{ tcf('pengguna.waLolosTanpaNomor') }}</span>
              </template>
              <span v-else class="cf-redup">—</span>
            </template>
            <!-- Versi: nomor versinya, tanda "belum diperbarui" bila di bawah versi publik terbaru platform yang sama, lalu platformnya. -->
            <template #cell-versi="{ row }">
              <span v-if="row.versi === null" class="cf-redup">—</span>
              <template v-else>
                <span class="whitespace-nowrap" :title="versiTertinggal(row.p, versiTerbaru) ? `${row.versi} · ${tcf('pengguna.versiLama')}` : row.versi">
                  {{ row.p.versiAplikasi ?? '—' }}
                  <span v-if="versiTertinggal(row.p, versiTerbaru)" class="block whitespace-normal text-[0.7rem] font-bold leading-tight text-[var(--ca-gold-text)]" data-uji="versi-tertinggal">{{ tcf('pengguna.versiLamaPendek') }}</span>
                </span>
                <span v-if="row.p.platform" class="cf-dua">{{ row.p.platform.label }}</span>
              </template>
            </template>
            <template #cell-status="{ row }">
              <span v-if="row.p.status === 'aktif'" class="cf-lencana cf-lencana-baik">{{ row.status }}</span>
              <span v-else class="ca-pill-danger whitespace-nowrap !px-2 !py-0.5 text-[0.7rem]">{{ row.status }}</span>
            </template>
            <template #cell-daftar="{ row }"><span class="whitespace-nowrap tabular-nums" data-uji="sel-daftar">{{ waktu(row.p, row.p.daftarIso) }}</span></template>
            <template #cell-masuk="{ row }"><span class="whitespace-nowrap tabular-nums" data-uji="sel-masuk">{{ waktu(row.p, row.p.masukTerakhirIso) }}</span></template>
            <template #cell-aktif="{ row }"><span class="whitespace-nowrap tabular-nums" data-uji="sel-aktif">{{ waktu(row.p, row.p.aktivitasTerakhirIso) }}</span></template>
            <!-- Hitungan, nominal, Domi, dan kredit: null = tidak boleh tahu (garis, bukan 0). -->
            <template v-for="k in (['ruang', 'tx', 'kredit_beli', 'domi_30'] as const)" :key="k" #[`cell-${k}`]="{ row }">
              <span v-if="angkaSel(row.p, k) === null" class="cf-redup" :title="ketKosong">—<span v-if="ketKosong" class="sr-only"> ({{ ketKosong }})</span></span>
              <span v-else :class="angkaSel(row.p, k) ? 'cf-kuat' : 'cf-redup'">{{ angka(angkaSel(row.p, k)) }}</span>
            </template>
            <template #cell-nominal="{ row }">
              <span v-if="row.p.nominal === null" class="cf-redup" :title="ketKosong">—<span v-if="ketKosong" class="sr-only"> ({{ ketKosong }})</span></span>
              <span v-else class="whitespace-nowrap" :title="rupiah(row.p.nominal)">{{ rupiahRingkas(row.p.nominal, bahasa) }}</span>
            </template>
            <!-- Tanya Domi: jumlah pertanyaan seumur akun. + = paling sedikit segitu. -->
            <template #cell-domi="{ row }">
              <span v-if="row.domi === null" class="cf-redup" :title="ketKosong">—<span v-if="ketKosong" class="sr-only"> ({{ ketKosong }})</span></span>
              <span v-else :class="row.domi ? 'cf-kuat' : 'cf-redup'" :title="row.p.domi?.kira ? tcf('pengguna.domi.kira') : undefined">{{ angka(row.domi) }}<template v-if="row.p.domi?.kira"><span class="font-medium text-[var(--ca-muted)]" aria-hidden="true">+</span><span class="sr-only"> ({{ tcf('pengguna.domi.kira') }})</span></template></span>
            </template>
            <template #cell-domi_terakhir="{ row }">
              <span v-if="!row.p.domi || row.p.domi.tanya === null" class="cf-redup" :title="ketKosong">—</span>
              <span v-else-if="!row.p.domi.terakhirIso" class="cf-redup whitespace-nowrap">{{ tcf('pengguna.domiBelum') }}</span>
              <span v-else class="whitespace-nowrap tabular-nums">{{ waktu(row.p, row.p.domi.terakhirIso) }}</span>
            </template>
            <template #cell-kredit="{ row }">
              <span v-if="row.kredit === null" class="cf-redup" :title="ketKosong">—<span v-if="ketKosong" class="sr-only"> ({{ ketKosong }})</span></span>
              <span v-else class="cf-kuat">{{ angka(row.kredit) }}</span>
            </template>
            <!-- Sumber: dari mana orang itu tahu CashFlow (asal pengguna, v5). -->
            <template #cell-sumber="{ row }">
              <template v-if="sumber(row.p)">
                <span class="whitespace-nowrap" data-uji="sel-sumber">{{ sumber(row.p)!.utama }}</span>
                <span v-if="sumber(row.p)!.dua" class="cf-dua">{{ sumber(row.p)!.dua }}</span>
              </template>
              <span v-else class="cf-redup" :title="tanpaHitungan ? ketKosong : tcf('pengguna.v5.sumberKosong')">—</span>
            </template>
          </DataTable>
        </div>

        <!-- Ponsel: satu kartu per orang, seluruh kartunya tautan ke rincian. -->
        <ul class="min-w-0 space-y-3 lg:hidden" :aria-busy="memuat" :inert="memuat">
          <li v-for="row in barisHalaman" :key="row.id" class="ca-console-dialog relative min-w-0 p-4">
            <div class="flex min-w-0 items-start justify-between gap-2">
              <NuxtLink :to="`/console/cashflow/pengguna/${row.id}`" class="cf-kuat min-w-0 break-all text-[0.9375rem] after:absolute after:inset-0 after:rounded-[inherit]">{{ row.email }}</NuxtLink>
              <span v-if="row.p.emailPenuh" class="relative z-10 -my-2.5 -mr-2.5 shrink-0"><CashflowSalinKontak jenis="email" :nilai="row.p.emailPenuh" /></span>
            </div>
            <p v-if="row.p.tim || row.p.status !== 'aktif' || row.p.nama" class="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-[var(--ca-muted)]">
              <span v-if="row.p.tim" class="ca-pill-info !px-2 !py-0.5 text-[0.7rem]" :title="tcf('pengguna.domi.timKet')">{{ tcf('pengguna.domi.tim') }}</span>
              <span v-if="row.p.status !== 'aktif'" class="ca-pill-danger !px-2 !py-0.5 text-[0.7rem]">{{ row.status }}</span>
              <span v-if="row.p.nama" class="min-w-0 break-words">{{ row.p.nama }}</span>
            </p>
            <div class="mt-1 flex min-w-0 items-center justify-between gap-2">
              <p class="flex min-w-0 flex-wrap items-center text-[0.8125rem] text-[var(--ca-muted)]">
                <span class="cf-titik" :class="titikWa(row.p)" aria-hidden="true" />
                <span class="tabular-nums">{{ row.wa ?? (serverKirimWa ? tcf('pengguna.waBelum') : '—') }}</span>
                <template v-if="teksWa(row.p) && (row.wa !== null || row.p.statusWa?.status === 'lewat')"><span class="mx-1.5" aria-hidden="true">·</span>{{ teksWa(row.p) }}</template>
              </p>
              <span v-if="row.p.nomorPenuh" class="relative z-10 -my-2.5 -mr-2.5 shrink-0"><CashflowSalinKontak jenis="wa" :nilai="row.p.nomorPenuh" /></span>
            </div>
            <div v-if="row.p.statusWa?.nomorRamai || row.p.statusWa?.kreditDitahan" class="mt-1.5 flex flex-wrap items-center gap-1">
              <span v-if="row.p.statusWa?.nomorRamai" class="ca-pill-gold !rounded-lg !px-2 !py-0.5 text-[0.65rem] leading-tight">{{ tcf('pengguna.statusWa.ramai') }}</span>
              <span v-if="row.p.statusWa?.kreditDitahan" class="ca-pill-info !rounded-lg !px-2 !py-0.5 text-[0.65rem] leading-tight">{{ tcf('pengguna.statusWa.kredit') }}</span>
            </div>
            <dl class="mt-3 grid grid-cols-3 gap-x-3 border-t border-[color:var(--ca-border)] pt-3">
              <div class="min-w-0">
                <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('pengguna.aktifTerakhir') }}</dt>
                <dd class="cf-kuat mt-0.5 break-words text-sm tabular-nums">{{ row.aktif }}</dd>
              </div>
              <template v-if="adaDomi">
                <div class="min-w-0">
                  <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('pengguna.tanyaDomi') }}</dt>
                  <dd class="cf-kuat mt-0.5 text-sm tabular-nums">
                    <template v-if="row.domi === null">—</template>
                    <template v-else>{{ angka(row.domi) }}{{ row.p.domi?.kira ? '+' : '' }}</template>
                    <span v-if="duaDomi(row.p)" class="cf-dua">{{ duaDomi(row.p) }}</span>
                  </dd>
                </div>
                <div class="min-w-0">
                  <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('pengguna.kredit') }}</dt>
                  <dd class="cf-kuat mt-0.5 text-sm tabular-nums">
                    {{ row.kredit === null ? '—' : angka(row.kredit) }}
                    <span v-if="row.kredit !== null" class="cf-dua">{{ row.p.domi?.kreditBeli ? tcf('pengguna.kreditBeli') : tcf('pengguna.kreditGratis') }}</span>
                  </dd>
                </div>
              </template>
              <!-- Server lama tanpa kolom Domi: kartu memuat versi dan ruang. -->
              <template v-else>
                <div class="min-w-0">
                  <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('pengguna.versi') }}</dt>
                  <dd class="cf-kuat mt-0.5 break-words text-sm tabular-nums">{{ row.p.versiAplikasi ?? '—' }}<span v-if="row.p.platform" class="cf-dua">{{ row.p.platform.label }}</span></dd>
                </div>
                <div class="min-w-0">
                  <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('pengguna.ruang') }}</dt>
                  <dd class="cf-kuat mt-0.5 text-sm tabular-nums">{{ row.ruang === null ? '—' : angka(row.ruang) }}</dd>
                </div>
              </template>
            </dl>
          </li>
        </ul>
        <p v-if="adaDomi" class="text-center text-xs text-[var(--ca-subtle)] lg:hidden">{{ tcf('pengguna.kartuKet') }}</p>
      </template>
    </div>

    <CashflowHalaman
      v-if="total"
      :hal="hal" :jumlah-halaman="jumlahHal" :total="total" :per="PER" :memuat="memuat || !!galat" lompat
      @ganti="gantiHalaman"
    >
      <template #ket><CashflowArtiKolom :butir="artiKolom" /></template>
    </CashflowHalaman>

    <p v-if="!hapusTersedia" class="text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.hapusBelumTersedia') }}</p>
    <p v-if="tanpaHitungan" class="text-xs text-[var(--ca-subtle)]">{{ tcf('umum.hitunganButuhTotp') }}</p>

    <!-- Saring: saringan kolom yang dulu ada di kepala tabel, sekarang satu panel. -->
    <CashflowLaci :show="saringBuka" :judul="tcf('pengguna.saringJudul')" @close="saringBuka = false">
      <p class="text-sm text-[var(--ca-muted)]">{{ tcf('pengguna.saringKet') }}</p>
      <div class="mt-4 grid gap-3 sm:grid-cols-2" data-uji="saring-panel">
        <label v-for="k in isianSaring" :key="k.kunci" class="grid min-w-0 gap-1 text-xs font-semibold text-[var(--ca-muted)]">
          {{ k.label }}
          <select v-if="k.opsi" :value="filterKolom[k.kunci] ?? ''" class="ca-input min-w-0 w-full text-sm font-normal" :data-uji="`saring-${k.kunci}`" @change="setelSaring(k.kunci, ($event.target as HTMLSelectElement).value)">
            <option value="">{{ tc('common.all') }}</option>
            <option v-for="opt in k.opsi" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <input v-else :value="filterKolom[k.kunci] ?? ''" type="search" maxlength="200" class="ca-input min-w-0 w-full text-sm font-normal" :placeholder="tcf('pengguna.saringTeks')" :data-uji="`saring-${k.kunci}`" @input="setelSaring(k.kunci, ($event.target as HTMLInputElement).value)">
        </label>
        <!-- Akun tim: hanya bila server memasang v4. -->
        <label v-if="adaDomi" class="grid min-w-0 gap-1 text-xs font-semibold text-[var(--ca-muted)]">
          {{ tcf('pengguna.domi.saringTim') }}
          <select v-model="saringTim" class="ca-input min-w-0 w-full text-sm font-normal" data-uji="saring-tim">
            <option value="">{{ tcf('pengguna.domi.timSemua') }}</option>
            <option v-for="o in opsiTim" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </label>
      </div>
      <div class="mt-5 flex flex-wrap items-center justify-between gap-2">
        <button type="button" class="ca-btn-secondary !px-4 !py-2 text-sm" :disabled="!banyakSaringan" data-uji="saring-hapus" @click="filterKolom = {}">{{ tc('common.clearAll') }}</button>
        <button type="button" class="ca-btn-primary !px-5 !py-2 text-sm" data-uji="saring-selesai" @click="saringBuka = false">{{ tcf('pengguna.saringSelesai') }}</button>
      </div>
    </CashflowLaci>
    <CashflowPalet :show="paletBuka" @close="paletBuka = false" />
  </div>
</template>

<style scoped>
/* Daftar ini berhalaman 25 baris, jadi tabelnya tampil utuh dan halaman yang bergulir. */
.ca-daftar-pengguna :deep(.ca-console-table-wrap) {
  max-height: none;
}
/* Semua kolom (K3, 19 Nov 2026): tabel selebar isinya dan bergulir ke samping di
   dalam bingkainya, halaman tidak. Kolom pertama (Pengguna) lengket di kiri
   supaya baris tetap terbaca saat digulir. */
.ca-daftar-pengguna :deep(.ca-console-table) {
  width: max-content;
  min-width: 100%;
}
.ca-daftar-pengguna :deep(.ca-console-table :is(th, td):first-child) {
  position: sticky;
  left: 0;
  z-index: 2;
  min-width: 17rem;
  max-width: 22rem;
  background: var(--cf-kartu);
  box-shadow: inset -1px 0 0 var(--cf-garis);
}
.ca-daftar-pengguna :deep(.ca-console-table thead th:first-child) {
  z-index: 3;
  background: var(--cf-awan);
}
.ca-daftar-pengguna :deep(.ca-console-table tbody tr:hover td:first-child) {
  background: var(--cf-awan);
}
/* Tombol salin muncul saat baris disorot atau difokus, di atas ujung selnya,
   supaya email 38 huruf tetap utuh satu baris. */
.cf-sel-salin {
  position: relative;
  display: block;
  min-width: 0;
}
.cf-salin {
  position: absolute;
  top: 50%;
  right: -0.25rem;
  transform: translateY(-50%);
  border-radius: 0.5rem;
  background: var(--ca-surface-soft);
  opacity: 0;
  transition: opacity 120ms ease;
}
.ca-daftar-pengguna :deep(tbody tr:hover) .cf-salin,
.cf-salin:focus-within {
  opacity: 1;
}
</style>
