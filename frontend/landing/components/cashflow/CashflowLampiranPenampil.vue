<script setup lang="ts">
/**
 * Penampil foto lampiran (0122). Dipasang SEKALI di induk Pengguna 360 dan
 * Ruang 360; isinya foto yang dibuka CashflowLampiranTombol (useCashflowKasus
 * .foto), berupa blob URL milik tab ini.
 *
 * - Tanpa tombol unduh. Tanda air email admin dan jam WIB pembukaan menempel
 *   di atas setiap foto, supaya tangkapan layar tetap menyebut siapa dan kapan.
 * - Ditutup (tombol, Esc, latar), halaman berganti, atau penampil dilepas →
 *   tutupFoto(): blob dicabut. Kasus anak foto habis, subjek berganti, atau
 *   logout membuang fotonya dari useCashflowKasus, jadi penampil ikut tertutup.
 * - Dialog modal sungguhan (aria-modal): pintasan halaman dan Esc laci di
 *   bawahnya diam selama penampil terbuka; fokus kembali ke pemicunya.
 */
import type { BerkasFoto } from '~/composables/cashflow/useCashflowKasus'

const { tcf, formatJam } = useCashflowI18n()
const kasus = useCashflowKasus()
const { user } = useAdminAuth()
const sesi = useCashflowSesi()
const route = useRoute()

const foto = computed(() => kasus.foto.value)
const judulId = useId()
const tombolTutup = ref<HTMLButtonElement | null>(null)
let asalFokus: HTMLElement | null = null

/** Siapa dan kapan, dicap saat foto terbuka (bukan jam yang terus berjalan). */
const tandaAir = ref('')
const menit = computed(() => Math.max(1, Math.round((foto.value?.berlakuDetik ?? 300) / 60)))
const labelBerkas = (b: BerkasFoto): string =>
  b.jenis === 'struk' ? tcf('lampiran.jenisStruk') : b.jenis === 'bukti' ? tcf('lampiran.jenisBukti') : tcf('lampiran.jenisLain')

const tutup = () => kasus.tutupFoto()
const tombol = (e: KeyboardEvent) => {
  if (e.key !== 'Escape' || !foto.value) return
  // Esc milik penampil; laci di bawahnya tidak ikut tertutup.
  e.preventDefault()
  e.stopImmediatePropagation()
  tutup()
}

watch(() => !!foto.value, async (buka) => {
  if (!import.meta.client) return
  if (buka) {
    tandaAir.value = tcf('lampiran.tandaAir')(sesi.pelaku.value || user.value?.email || 'console', formatJam(new Date()))
    const aktif = document.activeElement
    asalFokus = aktif instanceof HTMLElement && aktif !== document.body ? aktif : null
    document.addEventListener('keydown', tombol, true)
    await nextTick()
    tombolTutup.value?.focus({ preventScroll: true })
  } else {
    document.removeEventListener('keydown', tombol, true)
    if (asalFokus?.isConnected) asalFokus.focus({ preventScroll: true })
    asalFokus = null
  }
}, { immediate: true })

// Halaman berganti (tab, Back, laci ditutup lewat URL): foto tidak ikut pindah.
watch(() => route.fullPath, () => { if (foto.value) tutup() })
onBeforeUnmount(() => {
  if (import.meta.client) document.removeEventListener('keydown', tombol, true)
  tutup()
})
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" leave-active-class="transition duration-100 ease-in" leave-to-class="opacity-0">
      <div v-if="foto" class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-2 sm:p-6" @click.self="tutup">
        <section
          role="dialog" aria-modal="true" :aria-labelledby="judulId"
          class="ca-console-dialog flex max-h-full w-full max-w-3xl flex-col overflow-hidden p-0"
        >
          <header class="flex items-start justify-between gap-3 border-b border-[color:var(--ca-border)] px-4 py-3 sm:px-5">
            <div class="min-w-0">
              <h3 :id="judulId" class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('lampiran.judul') }}</h3>
              <p class="mt-0.5 text-xs text-[var(--ca-muted)]">{{ tcf('lampiran.ket')(menit) }}</p>
            </div>
            <button ref="tombolTutup" type="button" class="ca-btn-ghost h-9 w-9 shrink-0 p-0" :aria-label="tcf('umum.tutup')" @click="tutup">
              <Icon name="lucide:x" class="h-4 w-4" />
            </button>
          </header>

          <div class="ca-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
            <p v-if="!foto.berkas.length" class="text-sm text-[var(--ca-muted)]">{{ tcf('lampiran.kosong') }}</p>
            <figure v-for="(b, i) in foto.berkas" :key="i" class="space-y-1.5">
              <figcaption class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">
                {{ labelBerkas(b) }}<template v-if="foto.berkas.length > 1"> · {{ i + 1 }}/{{ foto.berkas.length }}</template>
              </figcaption>
              <div v-if="b.src" class="relative overflow-hidden rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)]">
                <img :src="b.src" :alt="labelBerkas(b)" draggable="false" class="mx-auto block max-h-[70vh] w-auto max-w-full object-contain">
                <span class="pointer-events-none absolute bottom-2 right-2 select-none rounded-md bg-slate-950/55 px-2 py-0.5 font-mono text-[0.65rem] text-slate-50" aria-hidden="true">{{ tandaAir }}</span>
              </div>
              <div v-else class="flex items-center gap-2 rounded-xl border border-dashed border-[color:var(--ca-border)] px-4 py-6 text-sm text-[var(--ca-muted)]">
                <Icon :name="b.keadaan === 'gagal' ? 'lucide:image-off' : 'lucide:cloud-upload'" class="h-4 w-4 shrink-0" aria-hidden="true" />
                {{ b.keadaan === 'gagal' ? tcf('lampiran.gagalMuat') : tcf('lampiran.belumTerunggah') }}
              </div>
            </figure>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
