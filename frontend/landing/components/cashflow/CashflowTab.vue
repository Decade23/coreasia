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
 *
 * Setiap klik/ketuk/Enter pada tautan tab MENANDAI aktivasi pengguna
 * (useCashflowAktivasiTab) — satu-satunya pemicu penambahan ranah tab Fase 3.
 * Prefetch/hover NuxtLink tidak memicu click, jadi tidak menandai apa pun.
 */
/** `judul` = arti lencana bila bukan "banyaknya isi tab" (mis. Sampah Ruang 360: masih terhapus). */
interface ItemTab { kunci: string; label: string; to: string; jumlah: number | null; aktif: boolean; judul?: string }

const props = defineProps<{ items: ItemTab[]; semuaTerlihat?: boolean }>()
import { angka } from '~/adapters/cashflow'

const { tcf } = useCashflowI18n()
const aktivasi = useCashflowAktivasiTab()
const tandai = (to: string, e: MouseEvent) => { aktivasi.catat(to, e) }

const utama = computed(() => props.items.filter(i => props.semuaTerlihat || i.aktif || i.jumlah !== 0 || i.kunci === ''))
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
  const batas = nav.getBoundingClientRect()
  const tab = aktif.getBoundingClientRect()
  const tepi = 12
  if (tab.left < batas.left + tepi) {
    nav.scrollLeft += tab.left - batas.left - tepi
  } else if (tab.right > batas.right - tepi) {
    nav.scrollLeft += tab.right - batas.right + tepi
  }
}
onMounted(tampakkanAktif)
watch(() => [route.path, props.items.find(i => i.aktif)?.label], () => {
  lainnyaBuka.value = false
  tampakkanAktif()
}, { flush: 'post' })

</script>

<template>
  <!-- Rupa sama dengan baris kedua navigasi CashFlow: garis bawah untuk tab aktif.
       Di layar sempit baris ini menempel di atas dan digulir ke samping. -->
  <nav ref="baris" class="cf-tab" :aria-label="tcf('tab.label')">
    <NuxtLink v-for="i in utama" :key="i.kunci || 'ringkas'" :to="i.to" class="cf-tab-butir" :aria-current="i.aktif ? 'page' : undefined" @click="tandai(i.to, $event)">
      {{ i.label }}
      <span v-if="i.jumlah !== null" class="cf-tab-jumlah" :title="i.judul" :aria-label="i.judul ? `${i.jumlah} ${i.judul}` : undefined">{{ angka(i.jumlah) }}</span>
    </NuxtLink>
    <!-- < 640 px: baris ini digulir ke samping (overflow), jadi menu tarik-turun
         akan terpotong. Tab kosong tampil sebaris, redup, di belakang pemisah. -->
    <template v-if="kosong.length">
      <span class="mx-1 h-4 w-px shrink-0 self-center bg-[var(--ca-border)] sm:hidden" aria-hidden="true" />
      <NuxtLink v-for="i in kosong" :key="`m-${i.kunci}`" :to="i.to" class="cf-tab-butir cf-tab-redup sm:!hidden" @click="tandai(i.to, $event)">
        {{ i.label }} <span class="tabular-nums">0</span>
      </NuxtLink>
    </template>
    <div v-if="kosong.length" class="relative hidden shrink-0 sm:block">
      <button type="button" class="cf-tab-butir cf-tab-redup" :aria-expanded="lainnyaBuka" @click="lainnyaBuka = !lainnyaBuka">
        {{ tcf('tab.lainnya') }}<Icon name="lucide:chevron-down" class="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <div v-if="lainnyaBuka" class="absolute left-0 top-full z-30 mt-1 min-w-40 rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-dropdown-bg)] p-1 shadow-lg">
        <NuxtLink v-for="i in kosong" :key="i.kunci" :to="i.to" class="block rounded-lg px-3 py-1.5 text-sm text-[var(--ca-muted)] hover:bg-[var(--ca-panel-bg-strong)] hover:text-[var(--ca-text)]" @click="tandai(i.to, $event)">
          {{ i.label }} <span class="tabular-nums text-[var(--ca-subtle)]">0</span>
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<!-- Tidak scoped: NuxtLink dirender komponen lain. Semua aturan berawalan .cf-tab,
     warnanya token console yang di area CashFlow dibaca dari --cf-*. -->
<style>
.cf-tab {
  position: sticky; top: 4.5rem; z-index: 20;
  display: flex; align-items: stretch; gap: 2px;
  margin: 0 -1rem; padding: 0 0.75rem;
  overflow-x: auto; scrollbar-width: none;
  border-bottom: 1px solid var(--ca-border);
  background: var(--ca-bg);
  font-size: 0.84375rem;
}
.cf-tab::-webkit-scrollbar { display: none; }
.cf-tab-butir {
  display: inline-flex; flex: none; align-items: center; gap: 6px;
  min-height: 40px; padding: 2px 10px 0;
  border: 0; border-bottom: 2px solid transparent; margin-bottom: -1px;
  background: none; font-weight: 600; color: var(--ca-muted); white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;
}
.cf-tab-butir:hover { color: var(--ca-text); }
/* Tebal lewat bayangan teks, supaya lebar tab tidak berubah saat aktif. */
.cf-tab-butir[aria-current] {
  color: var(--ca-text); border-bottom-color: var(--cf-aksen, var(--ca-brand));
  text-shadow: 0.02em 0 0 currentColor, -0.02em 0 0 currentColor;
}
.cf-tab-butir:focus-visible { outline-offset: -2px; border-radius: 8px; }
.cf-tab-redup { color: var(--ca-subtle); }
.cf-tab-jumlah {
  padding: 1px 6px; border-radius: 999px; background: var(--ca-chip-bg);
  font-size: 0.6875rem; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--ca-muted); text-shadow: none;
}
@media (min-width: 640px) {
  .cf-tab { position: static; flex-wrap: wrap; margin: 0; padding: 0 4px; overflow: visible; background: none; }
}
</style>
