<script setup lang="ts">
/**
 * Tab Pengguna 360 berbasis SEGMEN PATH (bukan ?tab=): tiap tab chunk sendiri,
 * Back bekerja per tab, remah bisa bersarang. Klik = push (NuxtLink).
 *
 * Lencana = hitungan dari server (hitung{} admin_pengguna_360, akses_30hari
 * kepala). Tab yang hitungannya DIKETAHUI nol dipindah ke "Lainnya (0)" —
 * kecuali tab yang sedang dibuka. Hitungan yang belum diketahui (null) tidak
 * pernah memindahkan tab. Di layar < 640 px baris ini menjadi pil yang
 * digulir ke samping dan menempel di atas.
 */
/** `judul` = arti lencana bila bukan "banyaknya isi tab" (mis. Sampah Ruang 360: masih terhapus). */
interface ItemTab { kunci: string; label: string; to: string; jumlah: number | null; aktif: boolean; judul?: string }

const props = defineProps<{ items: ItemTab[] }>()
const { tcf } = useCashflowI18n()

const utama = computed(() => props.items.filter(i => i.aktif || i.jumlah !== 0 || i.kunci === ''))
const kosong = computed(() => props.items.filter(i => !utama.value.includes(i)))
const lainnyaBuka = ref(false)
const route = useRoute()
/* Di layar sempit baris ini digulir ke samping: tab aktif digeser ke dalam
   pandangan (hanya gulir horizontal baris ini, bukan halaman). */
const baris = ref<HTMLElement | null>(null)
const tampakkanAktif = async () => {
  await nextTick()
  const nav = baris.value
  const aktif = nav?.querySelector<HTMLElement>('[aria-current="page"]')
  if (!nav || !aktif || nav.scrollWidth <= nav.clientWidth) return
  const kiri = aktif.offsetLeft // nav sticky = offsetParent tautannya
  if (kiri < nav.scrollLeft || kiri + aktif.offsetWidth > nav.scrollLeft + nav.clientWidth) {
    nav.scrollTo({ left: Math.max(0, kiri - 16) })
  }
}
onMounted(tampakkanAktif)
watch(() => route.path, () => { lainnyaBuka.value = false; tampakkanAktif() })

const kelas = (i: ItemTab) => ['inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition', i.aktif
  ? 'bg-[var(--ca-panel-bg-strong)] font-semibold text-[var(--ca-text)]'
  : 'text-[var(--ca-muted)] hover:text-[var(--ca-text)]']
</script>

<template>
  <nav
    ref="baris"
    class="cf-gulir sticky top-[4.5rem] z-20 -mx-4 flex items-center gap-1 overflow-x-auto border-y border-[color:var(--ca-border)] bg-[var(--ca-bg)] px-4 py-1.5 sm:static sm:mx-0 sm:flex-wrap sm:overflow-visible sm:rounded-full sm:border sm:bg-[var(--ca-panel-bg)] sm:p-1"
    :aria-label="tcf('tab.label')"
  >
    <NuxtLink v-for="i in utama" :key="i.kunci || 'ringkas'" :to="i.to" :class="kelas(i)" :aria-current="i.aktif ? 'page' : undefined">
      {{ i.label }}
      <span v-if="i.jumlah !== null" class="rounded-full bg-[var(--ca-chip-bg)] px-1.5 text-[0.7rem] tabular-nums text-[var(--ca-muted)]" :title="i.judul" :aria-label="i.judul ? `${i.jumlah} ${i.judul}` : undefined">{{ i.jumlah }}</span>
    </NuxtLink>
    <!-- < 640 px: baris ini digulir ke samping (overflow), jadi menu tarik-turun
         akan terpotong — tab kosong tampil sebaris, redup, di belakang pemisah. -->
    <template v-if="kosong.length">
      <span class="mx-1 h-4 w-px shrink-0 bg-[var(--ca-border)] sm:hidden" aria-hidden="true" />
      <NuxtLink v-for="i in kosong" :key="`m-${i.kunci}`" :to="i.to" class="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm text-[var(--ca-subtle)] sm:hidden">
        {{ i.label }} <span class="tabular-nums">0</span>
      </NuxtLink>
    </template>
    <div v-if="kosong.length" class="relative hidden shrink-0 sm:block">
      <button
        type="button" class="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-[var(--ca-subtle)] hover:text-[var(--ca-text)]"
        :aria-expanded="lainnyaBuka" @click="lainnyaBuka = !lainnyaBuka"
      >
        {{ tcf('tab.lainnya') }}<Icon name="lucide:chevron-down" class="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <div v-if="lainnyaBuka" class="absolute left-0 top-full z-30 mt-1 min-w-40 rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-dropdown-bg)] p-1 shadow-lg">
        <NuxtLink v-for="i in kosong" :key="i.kunci" :to="i.to" class="block rounded-lg px-3 py-1.5 text-sm text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)] hover:text-[var(--ca-text)]">
          {{ i.label }} <span class="tabular-nums text-[var(--ca-subtle)]">0</span>
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* Pil tab di layar sempit digulir ke samping; bilah gulirnya tidak perlu tampil. */
.cf-gulir { scrollbar-width: none; }
.cf-gulir::-webkit-scrollbar { display: none; }
</style>
