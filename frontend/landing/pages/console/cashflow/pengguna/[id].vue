<script setup lang="ts">
/**
 * Pengguna 360 — INDUK. Kepala T0 + keterangan kasus + baris tab, lalu
 * <NuxtPage/> untuk tab anak (pengguna/[id]/{index,ruang,transaksi,jejak,akses}.vue).
 * Induk tetap terpasang saat tab berganti, jadi kepala dan kasusnya tidak
 * dimuat ulang per tab.
 *
 * SATU KLIK (keputusan Master 21 Sep 2026). Datang ke halaman ini = data
 * tampil: kepala (admin_pengguna_kepala, audit lihat_kepala) dan kasus aktif
 * (admin_kasus_aktif) dimuat bersamaan, lalu useCashflowKasus.aturLingkup
 * memakai kasus aktif itu atau MEMBUKA kasus baru otomatis — semua ranah
 * Fase 1, semua ruang subjek, alasan otomatis. Tidak ada dialog alasan,
 * skenario, atau lingkup. Kasus tetap tercatat server dan setiap pembacaan
 * tetap diaudit; keterangannya kecil di bawah kepala ("Dibuka · tercatat di
 * audit"). Syarat satu-satunya sesi console ber-TOTP (cashflow:pii): tanpa
 * itu kepala datang tanpa `ruang` dan tab data menampilkan CashflowIzinKurang
 * ("Masuk ulang dengan TOTP"). Selama halaman ini aktif kasusnya diperpanjang
 * otomatis; lewat batas 2 jam dibuka kasus baru otomatis (pasangHalaman).
 *
 * KASUS DIPULIHKAN DARI SERVER, id-nya tidak pernah di URL/storage: refresh
 * dan tab baru melanjutkan kasus yang sama (terikat pelaku).
 *
 * RIWAYAT. Jalan keluar ke DAFTAR (panah, remah, tab Pengguna, palet) mundur
 * bila tujuannya memang entri sebelumnya, selain itu mengganti entri — supaya
 * [daftar, detail, daftar] tidak membuat Back membuka kepala (dan menulis
 * lihat_kepala) lagi. history.state.back = fullPath entri sebelumnya
 * (vue-router); /masuk tidak dihitung asal.
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import { TAB_PENGGUNA, type TabPengguna } from '~/adapters/cashflowKasus'
import type { GalatAdmin } from '~/composables/cashflow/useCashflowAdmin'

const { tcf } = useCashflowI18n()
const { tc } = useConsoleI18n()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const indeks = useCashflowIndeks()
const kasus = useCashflowKasus()
const { id, dasar, kepala, kunci360, p360, muat360, muatKepala } = useCashflowPengguna()
const { galat, pesanGalat, muat, batal, keMasukBilaSesi } = useCashflowMuat({ awal: true })
const muat360Diam = useCashflowMuat()

/* Kepala + kasus aktif bersamaan, lalu kasus dibuka/diselaraskan OTOMATIS
   (tanpa ditunggu: keadaannya dibaca tab dari kasus.keadaan.tahap). P0002 =
   orangnya tidak ada (UUID palet, target audit yang akunnya sudah dihapus):
   kepala tidak menulis audit dan tidak ada kasus yang dibuka.
   Jawaban basi (pindah orang sebelum kepala tiba) tidak menulis kepala
   maupun lingkup kasus: lihat muatKepala, dan batal() saat dilepas. */
kepala.value = null
muat(muatKepala)
/* Sesi console/CashFlow mati selagi kasus dibuka OTOMATIS (tab ditinggal
   semalam, lalu dilihat lagi): ke /masuk dengan `ke` = URL ini, sama dengan
   jalur muat lainnya — bukan kode mentah + "Coba lagi" yang gagal terus
   (temuan fe p2 #4). Pemantau galat (objek baru tiap kegagalan), bukan
   tahap: "Coba lagi" yang gagal lagi dengan sebab yang sama tetap pindah. */
watch(() => kasus.keadaan.value.galat, (g) => {
  if (g && kasus.keadaan.value.tahap === 'sesi') keMasukBilaSesi(g as GalatAdmin)
})
/* "Halaman aktif" untuk perpanjangan & pembukaan ulang otomatis. */
let lepasHalaman: (() => void) | null = null
onMounted(() => { lepasHalaman = kasus.pasangHalaman() })
onBeforeUnmount(() => { batal(); lepasHalaman?.() })

/* 360 dimuat sekali per kasus+lingkup: lencana tab + Ringkas + Ruang. */
watch(kunci360, (k) => { if (k && !p360.value) muat360Diam.muat(muat360) }, { immediate: true })

// ── Tab ────────────────────────────────────────────────────────────────
const tabAktif = computed<TabPengguna>(() => {
  const sisa = route.path.slice(dasar.value.length).replace(/^\/+/, '').split('/')[0] ?? ''
  return (TAB_PENGGUNA as readonly string[]).includes(sisa) ? (sisa as TabPengguna) : ''
})
const keTab = (t: TabPengguna) => (t ? `${dasar.value}/${t}` : dasar.value)
const jumlahTab = (t: TabPengguna): number | null => {
  const h = p360.value?.hitung
  if (t === 'akses') return kepala.value?.akses30 ?? null
  if (!h) return null
  if (t === 'ruang') return h.ruang
  if (t === 'transaksi') return h.transaksi + h.sampah
  if (t === 'jejak') return h.jejak
  return null
}
/* Pindah tab: isi tab baru mulai tepat di bawah baris tab (bukan di posisi
   gulir tab lama, bukan di kepala halaman). */
const barisTab = ref<HTMLElement | null>(null)
watch(tabAktif, async () => {
  await nextTick()
  const el = barisTab.value
  if (!el || !import.meta.client) return
  const atas = el.getBoundingClientRect().top
  if (atas < 0) window.scrollBy({ top: atas - 80 })
})
const tab = computed(() => TAB_PENGGUNA.map(t => ({
  kunci: t, label: tcf(`tab.${t || 'ringkas'}`), to: keTab(t), jumlah: jumlahTab(t), aktif: tabAktif.value === t,
})))

// ── Riwayat & remah ────────────────────────────────────────────────────
const kembali = computed(() => indeks.daftarTerakhir.value)
const asal = (): string | null => {
  if (!import.meta.client) return null
  const b: unknown = window.history.state?.back
  return typeof b === 'string' && !b.startsWith('/console/cashflow/masuk') ? b : null
}
/** Panah kembali & remah "Pengguna": ke DAFTAR, apa pun asalnya. */
const keDaftar = () => (asal() === kembali.value ? router.back() : navigateTo(kembali.value, { replace: true }))

/* Label subjek selalu TERSAMAR (juga sesudah kasus terbuka): bilah atas
   terlihat dari seberang ruangan dan ikut tangkapan layar. */
const labelSubjek = computed(() => kepala.value?.emailTersamar ?? indeks.labelUntuk(id.value) ?? id.value.slice(0, 8))
useConsoleRemah().pasang(() => [
  { label: tc('layout.cashflow'), to: '/console/cashflow' },
  { label: tcf('nav.pengguna'), to: kembali.value, aksi: keDaftar },
  ...(tabAktif.value
    ? [{ label: labelSubjek.value, to: dasar.value }, { label: tcf(`tab.${tabAktif.value}`) }]
    : [{ label: labelSubjek.value }]),
], { awalan: true })

// ── Pintasan: 1–9 tab, c salin id ──────────────────────────────────────
/** Id yang disalin `c`: baris yang sedang disorot tab anak, atau subjek. */
const idSorot = useState<string | null>('cf_salin_sorot', () => null)
const salin = async () => {
  try {
    await navigator.clipboard.writeText(idSorot.value || id.value)
    toast.success(tcf('umum.tersalin'))
  } catch {
    toast.error(tcf('umum.gagalSalin'))
  }
}
useCashflowPintasan([
  ...TAB_PENGGUNA.map((t, i) => ({ kunci: String(i + 1), aksi: () => { navigateTo(keTab(t)) } })),
  { kunci: 'c', aksi: () => { void salin() } },
])
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <ConsolePageHeader
      :title="tcf('p360.judul')" kicker="CashFlow"
      :back-to="kembali" :back-action="keDaftar" :back-label="tcf('pengguna.kembaliKeDaftar')"
    >
      <template #meta><CashflowNav :aksi-daftar="keDaftar" /></template>
    </ConsolePageHeader>

    <!-- Kepala gagal = tidak ada kasus yang dibuka: yang tampil hanya sebabnya. -->
    <p v-if="galat?.jenis === 'tidak-ada'" class="rounded-xl border border-dashed border-[color:var(--ca-border)] px-4 py-5 text-sm text-[var(--ca-muted)]">
      {{ tcf('p360.tidakAda') }}
    </p>
    <CashflowIzinKurang v-else-if="galat?.jenis === 'izin'" />
    <p v-else-if="pesanGalat" class="text-sm text-[var(--ca-danger-text)]" role="alert">{{ pesanGalat }}</p>

    <template v-else>
      <CashflowKepala360 :kepala="kepala" :akses-ke="keTab('akses')" />

      <CashflowKasusBilah />

      <div ref="barisTab" class="scroll-mt-24"><CashflowTab :items="tab" /></div>

      <NuxtPage />
    </template>
  </div>
</template>
