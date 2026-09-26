<script setup lang="ts">
/**
 * Ruang 360 — INDUK. Kepala T0 (admin_ruang_kepala) + keterangan kasus +
 * baris tab, lalu <NuxtPage/> untuk tab anak
 * (ruang/[id]/{index,anggota,transaksi,dompet,jejak,sampah,akses}.vue).
 *
 * SATU KLIK (keputusan Master 21 Sep 2026). Datang ke halaman ini = data
 * tampil: kepala dan kasus aktif (admin_kasus_aktif_ruang) dimuat bersamaan,
 * lalu useCashflowKasus memakai kasus itu — termasuk kasus PENGGUNA yang
 * lingkupnya memuat ruang ini (pindah dari Pengguna 360 tanpa kasus baru,
 * juga sesudah refresh) — menambah ranah tab ruang yang kurang, atau MEMBUKA
 * kasus ruang baru otomatis bila tidak ada. Tidak ada dialog. Kasus tetap
 * tercatat server dan setiap pembacaan tetap diaudit. Syarat satu-satunya
 * sesi console ber-TOTP (cashflow:pii); tanpa itu kepala datang tanpa
 * hitungan dan tab data menampilkan CashflowIzinKurang.
 *
 * Id kasus tidak pernah di URL/storage: kasus dipulihkan dari server.
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import { TAB_RUANG, PINTASAN_TAB_RUANG, AKAR_RUANG, lencanaTabRuang, type TabRuang } from '~/adapters/cashflowRuang'
import type { GalatAdmin } from '~/composables/cashflow/useCashflowAdmin'

const { tcf } = useCashflowI18n()
const { tc } = useConsoleI18n()
const route = useRoute()
const toast = useToast()
const kasus = useCashflowKasus()
const { id, dasar, kepala, kunci360, r360, muat360, muatKepala } = useCashflowRuang()
const { galat, pesanGalat, muat, batal, keMasukBilaSesi } = useCashflowMuat({ awal: true })
const muat360Diam = useCashflowMuat()

kepala.value = null
muat(muatKepala)
watch(() => kasus.keadaan.value.galat, (g) => {
  if (g && kasus.keadaan.value.tahap === 'sesi') keMasukBilaSesi(g as GalatAdmin)
})
let lepasHalaman: (() => void) | null = null
onMounted(() => { lepasHalaman = kasus.pasangHalaman() })
onBeforeUnmount(() => { batal(); lepasHalaman?.() })

/* 360 dimuat sekali per kasus+lingkup: lencana tab + Ringkas + Anggota. */
watch(kunci360, (k) => { if (k && !r360.value) muat360Diam.muat(muat360) }, { immediate: true })

// ── Tab ────────────────────────────────────────────────────────────────
const tabAktif = computed<TabRuang>(() => {
  const sisa = route.path.slice(dasar.value.length).replace(/^\/+/, '').split('/')[0] ?? ''
  return (TAB_RUANG as readonly string[]).includes(sisa) ? (sisa as TabRuang) : ''
})
const keTab = (t: TabRuang) => (t ? `${dasar.value}/${t}` : dasar.value)
const barisTab = ref<HTMLElement | null>(null)
watch(tabAktif, async () => {
  await nextTick()
  const el = barisTab.value
  if (!el || !import.meta.client) return
  const atas = el.getBoundingClientRect().top
  if (atas < 0) window.scrollBy({ top: atas - 80 })
})
const tab = computed(() => TAB_RUANG.map(t => ({
  kunci: t, label: tcf(`tabRuang.${t || 'ringkas'}`), to: keTab(t),
  jumlah: lencanaTabRuang(t, r360.value?.hitung ?? null, kepala.value?.akses30 ?? null),
  judul: t === 'sampah' ? tcf('tabRuang.sampahLencana') : t === 'jadwal' ? tcf('tabRuang.jadwalLencana') : undefined,
  aktif: tabAktif.value === t,
})))

// ── Remah ──────────────────────────────────────────────────────────────
/* Label ruang selalu TERSAMAR di remah (terlihat dari seberang ruangan). */
const labelSubjek = computed(() => kepala.value?.namaTersamar ?? id.value.slice(0, 8))
useConsoleRemah().pasang(() => [
  { label: tc('layout.cashflow'), to: '/console/cashflow' },
  { label: tcf('nav.ruang'), to: AKAR_RUANG },
  ...(tabAktif.value
    ? [{ label: labelSubjek.value, to: dasar.value }, { label: tcf(`tabRuang.${tabAktif.value}`) }]
    : [{ label: labelSubjek.value }]),
], { awalan: true })

// ── Pintasan: 1–9 tab, c salin id ──────────────────────────────────────
const idSorot = useState<string | null>('cf_salin_sorot', () => null)
const aktivasiTab = useCashflowAktivasiTab()
const salin = async () => {
  try {
    await navigator.clipboard.writeText(idSorot.value || id.value)
    toast.success(tcf('umum.tersalin'))
  } catch {
    toast.error(tcf('umum.gagalSalin'))
  }
}
useCashflowPintasan([
  // Angka = aktivasi tab oleh keyboard (isTrusted): ditandai seperti klik tab.
  // Urutan angka Fase 2 tetap (PINTASAN_TAB_RUANG), bukan urutan tampilan tab.
  ...PINTASAN_TAB_RUANG.slice(0, 9).map((t, i) => ({ kunci: String(i + 1), aksi: (e: KeyboardEvent) => { aktivasiTab.catat(keTab(t), e); navigateTo(keTab(t)) } })),
  { kunci: 'c', aksi: () => { void salin() } },
])
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <ConsolePageHeader
      :title="tcf('r360.judul')" kicker="CashFlow"
      :back-to="AKAR_RUANG" :back-label="tcf('r360.kembaliKeDaftar')"
    >
      <template #meta><CashflowNav /></template>
    </ConsolePageHeader>

    <p v-if="galat?.jenis === 'tidak-ada'" class="rounded-xl border border-dashed border-[color:var(--ca-border)] px-4 py-5 text-sm text-[var(--ca-muted)]">
      {{ tcf('r360.tidakAda') }}
    </p>
    <CashflowIzinKurang v-else-if="galat?.jenis === 'izin'" />
    <p v-else-if="pesanGalat" class="text-sm text-[var(--ca-danger-text)]" role="alert">{{ pesanGalat }}</p>

    <template v-else>
      <CashflowKepalaRuang :kepala="kepala" :akses-ke="keTab('akses')" />

      <CashflowKasusBilah />

      <div ref="barisTab" class="scroll-mt-24"><CashflowTab :items="tab" /></div>

      <NuxtPage />
    </template>
  </div>
</template>
