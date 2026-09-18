<script setup lang="ts">
/**
 * Sub-navigasi modul CashFlow. Sidebar console adalah array datar tanpa
 * seksi; satu item "CashFlow" di sana, dan navigasi bagian ada di sini —
 * supaya sidebar tidak jadi 15 item begitu produk kedua masuk.
 *
 * Palet (Cmd/Ctrl+K) ikut dipasang di sini karena komponen ini ada di setiap
 * halaman modul: layout console dipakai modul lain dan tidak disentuh.
 *
 * Tab Pengguna menuju daftarTerakhir, jadi ?seg/urut/arah/hal ikut kembali
 * seperti panah dan remah. `aksiDaftar` (OPT-IN, dari detail pengguna)
 * menggantikan NuxtLink untuk tab itu dan item Pengguna di palet: NuxtLink
 * selalu MENAMBAH entri, dan [daftar, detail, daftar] membuat Back membuka
 * detail beraudit itu lagi. Halaman lain tidak memberi prop ini.
 */
const props = defineProps<{ aksiDaftar?: () => void }>()
const { tcf } = useCashflowI18n()
const route = useRoute()
const router = useRouter()
const indeks = useCashflowIndeks()
/* `jalur` untuk menandai tab aktif (tanpa query); `to` tujuan klik. */
const item = computed(() => [
  { kunci: 'ringkasan', to: '/console/cashflow' },
  { kunci: 'pengguna', to: indeks.daftarTerakhir.value, jalur: '/console/cashflow/pengguna' },
  { kunci: 'aktivitas', to: '/console/cashflow/aktivitas' },
  { kunci: 'ruang', to: '/console/cashflow/ruang' },
  { kunci: 'kesehatan', to: '/console/cashflow/kesehatan' },
  { kunci: 'sakelar', to: '/console/cashflow/sakelar' },
  { kunci: 'pengumuman', to: '/console/cashflow/pengumuman' },
  { kunci: 'audit', to: '/console/cashflow/audit' },
])
const aktif = (jalur: string) => jalur === '/console/cashflow' ? route.path === jalur : route.path.startsWith(jalur)
const kelas = (jalur: string) => ['rounded-full px-3 py-1.5 transition', aktif(jalur)
  ? 'bg-[var(--ca-panel-bg-strong)] font-semibold text-[var(--ca-text)]'
  : 'text-[var(--ca-muted)] hover:text-[var(--ca-text)]']
const klikDaftar = (e: MouseEvent) => {
  if (!props.aksiDaftar || !klikBiasa(e)) return
  e.preventDefault()
  props.aksiDaftar()
}

const paletBuka = ref(false)
useCashflowPintasan([{ kunci: 'k', meta: true, aksi: () => { paletBuka.value = true } }])
/* Label tombol mengikuti mesin: ⌘ di Apple, Ctrl di lainnya. Dibaca setelah
   terpasang supaya tidak ada selisih antara render awal dan hidrasi. */
const tombolMeta = ref('Ctrl')
onMounted(() => { if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) tombolMeta.value = '⌘' })
</script>

<template>
  <nav class="flex flex-wrap gap-1 rounded-full border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-1 text-sm">
    <template v-for="i in item" :key="i.kunci">
      <!-- href tetap ada: klik tengah / Cmd+klik membuka tab baru seperti biasa. -->
      <a
        v-if="i.kunci === 'pengguna' && aksiDaftar"
        :href="router.resolve(i.to).href" :class="kelas(i.jalur ?? i.to)"
        @click="klikDaftar"
      >{{ tcf(`nav.${i.kunci}`) }}</a>
      <NuxtLink v-else :to="i.to" :class="kelas(i.jalur ?? i.to)">{{ tcf(`nav.${i.kunci}`) }}</NuxtLink>
    </template>
    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[var(--ca-muted)] transition hover:text-[var(--ca-text)]"
      :aria-label="tcf('palet.judul')"
      @click="paletBuka = true"
    >
      <Icon name="lucide:search" class="h-3.5 w-3.5" />
      <span>{{ tcf('palet.tombol') }}</span>
      <kbd class="rounded border border-[color:var(--ca-border)] px-1 font-mono text-[0.65rem] text-[var(--ca-subtle)]">{{ tombolMeta }} K</kbd>
    </button>
  </nav>
  <CashflowPalet :show="paletBuka" :aksi-daftar="aksiDaftar" @close="paletBuka = false" />
</template>
