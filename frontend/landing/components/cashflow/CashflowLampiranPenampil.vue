<script setup lang="ts">
/** Lightbox untuk blob yang sudah diambil dan diaudit useCashflowKasus.
 * Navigasi, zoom, dan putar tidak membuat permintaan foto baru. */
import type { BerkasFoto } from '~/composables/cashflow/useCashflowKasus'
import { batasiGeserFoto, batasiZoomFoto, geserSaatZoom, ukuranPasFoto, ZOOM_MAKS_FOTO, type PosisiFoto } from '~/adapters/cashflowLightbox'

const { tcf, formatJam } = useCashflowI18n()
const kasus = useCashflowKasus()
const { user } = useAdminAuth()
const sesi = useCashflowSesi()
const route = useRoute()
const foto = computed(() => kasus.foto.value)
const indeks = ref(0)
const berkas = computed(() => foto.value?.berkas[indeks.value])
const judulId = useId()
const petunjukId = useId()
const lapis = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const bidang = ref<HTMLElement | null>(null)
const gambar = ref<HTMLImageElement | null>(null)
const tombolTutup = ref<HTMLButtonElement | null>(null)
const asli = ref({ lebar: 0, tinggi: 0 })
const ukuran = ref({ lebar: 0, tinggi: 0 })
const zoom = ref(1)
const putaran = ref(0)
const geser = ref<PosisiFoto>({ x: 0, y: 0 })
const rusak = ref(false)
const gagalPratinjau = ref(new Set<number>())
const bergerak = ref(false)
const pas = computed(() => ukuranPasFoto(asli.value, ukuran.value, putaran.value))
const siap = computed(() => !!berkas.value?.src && asli.value.lebar > 0 && !rusak.value)
const gayaFoto = computed(() => ({
  width: `${pas.value.lebar}px`, height: `${pas.value.tinggi}px`,
  transform: `translate(-50%, -50%) translate(${geser.value.x}px, ${geser.value.y}px) scale(${zoom.value}) rotate(${putaran.value}deg)`,
}))
const tandaAir = ref('')
const menit = computed(() => Math.max(1, Math.round((foto.value?.berlakuDetik ?? 300) / 60)))
const labelBerkas = (b: BerkasFoto): string =>
  b.jenis === 'struk' ? tcf('lampiran.jenisStruk') : b.jenis === 'bukti' ? tcf('lampiran.jenisBukti') : tcf('lampiran.jenisLain')
const tutup = () => kasus.tutupFoto()
const batasi = (p: PosisiFoto, z = zoom.value) => batasiGeserFoto(p, pas.value, ukuran.value, z, putaran.value)
const sesuaikan = () => { zoom.value = 1; geser.value = { x: 0, y: 0 } }
const ubahZoom = (nilai: number, jangkar: PosisiFoto = { x: 0, y: 0 }) => {
  if (!siap.value) return
  const baru = batasiZoomFoto(nilai)
  geser.value = batasi(geserSaatZoom(geser.value, zoom.value, baru, jangkar), baru)
  zoom.value = baru
}
const putar = () => { putaran.value = (putaran.value + 90) % 360; sesuaikan() }
const pilih = (i: number) => {
  const n = foto.value?.berkas.length ?? 0
  if (n) indeks.value = (i + n) % n
}
const pindah = (arah: number) => pilih(indeks.value + arah)
const titikLokal = (x: number, y: number): PosisiFoto => {
  const r = bidang.value!.getBoundingClientRect()
  return { x: x - r.left - r.width / 2, y: y - r.top - r.height / 2 }
}
const roda = (e: WheelEvent) => { if (siap.value) ubahZoom(zoom.value * (e.deltaY < 0 ? 1.15 : 1 / 1.15), titikLokal(e.clientX, e.clientY)) }
const klikGanda = (e: MouseEvent) => {
  if (zoom.value > 1) sesuaikan()
  else ubahZoom(2.5, titikLokal(e.clientX, e.clientY))
}

// Pointer events menyatukan mouse, cubit dua jari, dan usap pada ponsel.
const titik = new Map<number, PosisiFoto>()
let awal: { titik: PosisiFoto; geser: PosisiFoto; zoom: number; jarak: number } | null = null
let dicubit = false
const mulaiGerak = () => {
  const p = [...titik.values()]
  if (!p.length) { awal = null; bergerak.value = false; return }
  const tengah = p.length > 1 ? { x: (p[0]!.x + p[1]!.x) / 2, y: (p[0]!.y + p[1]!.y) / 2 } : p[0]!
  awal = { titik: tengah, geser: { ...geser.value }, zoom: zoom.value, jarak: p.length > 1 ? Math.hypot(p[0]!.x - p[1]!.x, p[0]!.y - p[1]!.y) : 0 }
  bergerak.value = true
}
const mulai = (e: PointerEvent) => {
  if (!siap.value || (e.pointerType === 'mouse' && e.button !== 0) || titik.size >= 2) return
  e.preventDefault()
  bidang.value?.focus({ preventScroll: true })
  bidang.value?.setPointerCapture(e.pointerId)
  titik.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (titik.size > 1) dicubit = true
  mulaiGerak()
}
const gerak = (e: PointerEvent) => {
  if (!titik.has(e.pointerId) || !awal) return
  titik.set(e.pointerId, { x: e.clientX, y: e.clientY })
  const p = [...titik.values()]
  if (p.length > 1 && awal.jarak > 0) {
    const tengah = { x: (p[0]!.x + p[1]!.x) / 2, y: (p[0]!.y + p[1]!.y) / 2 }
    const baru = batasiZoomFoto(awal.zoom * Math.hypot(p[0]!.x - p[1]!.x, p[0]!.y - p[1]!.y) / awal.jarak)
    geser.value = batasi(geserSaatZoom(awal.geser, awal.zoom, baru, titikLokal(awal.titik.x, awal.titik.y), titikLokal(tengah.x, tengah.y)), baru)
    zoom.value = baru
  } else if (zoom.value > 1) {
    geser.value = batasi({ x: awal.geser.x + e.clientX - awal.titik.x, y: awal.geser.y + e.clientY - awal.titik.y })
  }
}
const selesai = (e: PointerEvent) => {
  if (!titik.has(e.pointerId)) return
  if (e.type === 'pointerup' && !dicubit && awal && zoom.value === 1 && e.pointerType === 'touch') {
    const dx = e.clientX - awal.titik.x
    const dy = e.clientY - awal.titik.y
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) pindah(dx < 0 ? 1 : -1)
  }
  titik.delete(e.pointerId)
  mulaiGerak()
  if (!titik.size) dicubit = false
}

const ukur = () => {
  const r = bidang.value?.getBoundingClientRect()
  if (r) ukuran.value = { lebar: r.width, tinggi: r.height }
}
const gambarSiap = (e: Event) => {
  if (e.target !== gambar.value || !gambar.value) return
  asli.value = { lebar: gambar.value.naturalWidth, tinggi: gambar.value.naturalHeight }
}
watch([indeks, () => berkas.value?.src], () => {
  sesuaikan(); putaran.value = 0; asli.value = { lebar: 0, tinggi: 0 }; rusak.value = false
  titik.clear(); mulaiGerak(); dicubit = false
})
watch([pas, ukuran], () => { geser.value = batasi(geser.value) })
let pengamat: ResizeObserver | null = null
watch(bidang, (el) => {
  pengamat?.disconnect()
  if (el && import.meta.client) { pengamat = new ResizeObserver(ukur); pengamat.observe(el); ukur() }
})

// Isolasi modal, kunci scroll, dan pulihkan fokus pemicu ketika ditutup.
let asalFokus: HTMLElement | null = null
let gayaBadan: { overflow: string; paddingRight: string } | null = null
const latar = new Map<HTMLElement, boolean>()
const pulihkan = () => {
  document.removeEventListener('keydown', tombol, true)
  document.removeEventListener('focusin', jagaFokus, true)
  for (const [el, inert] of latar) el.inert = inert
  latar.clear()
  if (gayaBadan) { document.body.style.overflow = gayaBadan.overflow; document.body.style.paddingRight = gayaBadan.paddingRight; gayaBadan = null }
  if (asalFokus?.isConnected) asalFokus.focus({ preventScroll: true })
  asalFokus = null
}
const jagaFokus = (e: FocusEvent) => {
  if (foto.value && panel.value && !panel.value.contains(e.target as Node)) tombolTutup.value?.focus({ preventScroll: true })
}
const tombol = (e: KeyboardEvent) => {
  if (!foto.value || e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); tutup(); return }
  if (e.key === 'Tab') {
    const semua = [...(panel.value?.querySelectorAll<HTMLElement>('button:not(:disabled), [href], [tabindex="0"]') ?? [])].filter(el => el.getClientRects().length)
    const pertama = semua[0], terakhir = semua.at(-1)
    if (e.shiftKey && document.activeElement === pertama) { e.preventDefault(); terakhir?.focus() }
    else if (!e.shiftKey && document.activeElement === terakhir) { e.preventDefault(); pertama?.focus() }
    return
  }
  const panah = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
  if (panah) {
    e.preventDefault(); e.stopImmediatePropagation()
    if (zoom.value > 1) geser.value = batasi({ x: geser.value.x + (e.key === 'ArrowLeft' ? 80 : e.key === 'ArrowRight' ? -80 : 0), y: geser.value.y + (e.key === 'ArrowUp' ? 80 : e.key === 'ArrowDown' ? -80 : 0) })
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') pindah(e.key === 'ArrowLeft' ? -1 : 1)
  } else if (['+', '=', '-', '0'].includes(e.key)) {
    e.preventDefault(); e.stopImmediatePropagation()
    if (e.key === '0') sesuaikan()
    else ubahZoom(zoom.value + (e.key === '-' ? -0.5 : 0.5))
  }
}
watch(foto, async (f, sebelumnya) => {
  if (!import.meta.client) return
  if (!f) { pulihkan(); return }
  gagalPratinjau.value.clear()
  indeks.value = Math.min(Math.max(0, f.mulai ?? 0), Math.max(0, f.berkas.length - 1)); sesuaikan(); putaran.value = 0
  tandaAir.value = tcf('lampiran.tandaAir')(sesi.pelaku.value || user.value?.email || 'console', formatJam(new Date()))
  if (!sebelumnya) {
    const aktif = document.activeElement
    asalFokus = aktif instanceof HTMLElement && aktif !== document.body ? aktif : null
    gayaBadan = { overflow: document.body.style.overflow, paddingRight: document.body.style.paddingRight }
    const sela = window.innerWidth - document.documentElement.clientWidth
    if (sela > 0) document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight || '0') + sela}px`
    document.body.style.overflow = 'hidden'
  }
  await nextTick()
  if (!foto.value) return
  if (!sebelumnya) {
    for (const el of document.body.children) if (el instanceof HTMLElement && el !== lapis.value && !el.contains(lapis.value)) { latar.set(el, el.inert); el.inert = true }
    document.addEventListener('keydown', tombol, true)
    document.addEventListener('focusin', jagaFokus, true)
    tombolTutup.value?.focus({ preventScroll: true })
  }
  ukur()
}, { immediate: true })
watch(() => route.fullPath, () => { if (foto.value) tutup() })
onBeforeUnmount(() => {
  if (import.meta.client) { pulihkan(); pengamat?.disconnect() }
  tutup()
})
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" leave-active-class="transition duration-100 ease-in" leave-to-class="opacity-0">
      <div v-if="foto" ref="lapis" class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 sm:p-4" @click.self="tutup">
        <section
          ref="panel" role="dialog" aria-modal="true" :aria-labelledby="judulId" :aria-describedby="petunjukId"
          class="ca-console-dialog flex h-[100dvh] w-full max-w-7xl flex-col overflow-hidden !rounded-none p-0 sm:h-[92dvh] sm:!rounded-2xl">
          <header class="flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--ca-border)] px-3 py-2 sm:px-5">
            <div class="min-w-0">
              <h3 :id="judulId" class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('lampiran.judul') }}</h3>
              <p class="mt-0.5 text-xs text-[var(--ca-muted)]" aria-live="polite" aria-atomic="true">{{ berkas ? labelBerkas(berkas) : tcf('lampiran.jenisLain') }}<template v-if="foto.berkas.length"> · {{ indeks + 1 }} / {{ foto.berkas.length }}</template></p>
            </div>
            <button ref="tombolTutup" type="button" class="ca-btn-ghost !h-11 !w-11 shrink-0 p-0" :aria-label="tcf('umum.tutup')" @click="tutup"><Icon name="lucide:x" class="h-5 w-5" /></button>
          </header>
          <div class="flex shrink-0 items-center justify-center gap-1 border-b border-[color:var(--ca-border)] px-2 py-1.5 sm:gap-2" role="group" :aria-label="tcf('lampiran.aturFoto')">
            <button type="button" class="ca-btn-ghost !h-11 !w-11 p-0" :disabled="!siap || zoom <= 1" :aria-label="tcf('lampiran.perkecil')" :title="tcf('lampiran.perkecil')" @click="ubahZoom(zoom - 0.5)"><Icon name="lucide:zoom-out" class="h-5 w-5" /></button>
            <output class="w-14 text-center font-mono text-xs text-[var(--ca-text)]" aria-live="off" :aria-label="tcf('lampiran.zoom')">{{ Math.round(zoom * 100) }}%</output>
            <button type="button" class="ca-btn-ghost !h-11 !w-11 p-0" :disabled="!siap || zoom >= ZOOM_MAKS_FOTO" :aria-label="tcf('lampiran.perbesar')" :title="tcf('lampiran.perbesar')" @click="ubahZoom(zoom + 0.5)"><Icon name="lucide:zoom-in" class="h-5 w-5" /></button>
            <span class="mx-1 h-5 w-px bg-[var(--ca-border)]" aria-hidden="true" />
            <button type="button" class="ca-btn-ghost !h-11 !w-11 p-0" :disabled="!siap" :aria-label="tcf('lampiran.putar')" :title="tcf('lampiran.putar')" @click="putar"><Icon name="lucide:rotate-cw" class="h-5 w-5" /></button>
            <button type="button" class="ca-btn-secondary !min-h-11 !px-3 !py-2 text-xs" :disabled="!siap" :title="tcf('lampiran.pasKet')" @click="sesuaikan">{{ tcf('lampiran.pas') }}</button>
          </div>
          <div
            ref="bidang" tabindex="0" class="foto-bidang relative min-h-0 flex-1 overflow-hidden bg-[var(--ca-panel-bg-strong)] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ca-gold-text)]"
            :class="siap ? (bergerak ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : 'cursor-zoom-in') : ''"
            :aria-label="tcf('lampiran.bidang')" :aria-busy="!!berkas?.src && !asli.lebar && !rusak" :aria-describedby="petunjukId"
            @wheel.prevent="roda" @dblclick="klikGanda" @pointerdown="mulai" @pointermove="gerak" @pointerup="selesai" @pointercancel="selesai" @lostpointercapture="selesai">
            <div v-if="berkas?.src && !rusak" class="foto-kanvas absolute left-1/2 top-1/2 origin-center" :class="{ 'foto-kanvas-gerak': bergerak }" :style="gayaFoto">
              <img :key="`${indeks}:${berkas.src}`" ref="gambar" :src="berkas.src" :alt="labelBerkas(berkas)" draggable="false" class="pointer-events-none block h-full w-full max-w-none select-none" @load="gambarSiap" @error="(e: Event) => { if (e.target === gambar) rusak = true }">
            </div>
            <div v-if="!berkas?.src || rusak || !asli.lebar" class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-sm text-[var(--ca-muted)]">
              <Icon :name="!berkas ? 'lucide:image' : rusak || berkas.keadaan === 'gagal' ? 'lucide:image-off' : berkas.src ? 'lucide:loader-circle' : 'lucide:cloud-upload'" class="h-7 w-7" :class="{ 'animate-spin': berkas?.src && !rusak }" aria-hidden="true" />
              <span>{{ !berkas ? tcf('lampiran.kosong') : rusak || berkas.keadaan === 'gagal' ? tcf('lampiran.gagalMuat') : berkas.src ? tcf('umum.memuat') : tcf('lampiran.belumTerunggah') }}</span>
            </div>
            <span v-if="siap" class="pointer-events-none absolute bottom-3 right-3 max-w-[calc(100%-1.5rem)] select-none break-all rounded-md bg-slate-950/65 px-2 py-1 font-mono text-[0.65rem] text-slate-50" aria-hidden="true">{{ tandaAir }}</span>
          </div>
          <footer class="shrink-0 border-t border-[color:var(--ca-border)] px-3 py-2 sm:px-5">
            <div v-if="foto.berkas.length > 1" class="mb-2 flex items-center gap-2">
              <button type="button" class="ca-btn-secondary !h-11 !w-11 shrink-0 p-0" :aria-label="tcf('lampiran.sebelumnya')" @click="pindah(-1)"><Icon name="lucide:chevron-left" class="h-5 w-5" /></button>
              <nav class="ca-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto py-1" :aria-label="tcf('lampiran.daftarFoto')">
                <button
                  v-for="(b, i) in foto.berkas" :key="i" type="button" class="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-[var(--ca-panel-bg-strong)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ca-gold-text)]" :class="i === indeks ? 'border-[color:var(--ca-gold-text)]' : 'border-[color:var(--ca-border)] opacity-65 hover:opacity-100'"
                  :aria-label="tcf('lampiran.pilihFoto')(i + 1, labelBerkas(b))" :aria-pressed="i === indeks" @click="pilih(i)">
                  <img v-if="b.src && !gagalPratinjau.has(i)" :src="b.src" alt="" loading="lazy" draggable="false" class="h-full w-full object-cover" @error="gagalPratinjau.add(i)">
                  <Icon v-else name="lucide:image-off" class="m-auto h-5 w-5 text-[var(--ca-muted)]" />
                </button>
              </nav>
              <button type="button" class="ca-btn-secondary !h-11 !w-11 shrink-0 p-0" :aria-label="tcf('lampiran.berikutnya')" @click="pindah(1)"><Icon name="lucide:chevron-right" class="h-5 w-5" /></button>
            </div>
            <p class="text-center text-xs text-[var(--ca-muted)]">{{ zoom > 1 ? tcf('lampiran.petunjukGeser') : tcf('lampiran.petunjukZoom') }}</p>
            <p class="mt-1 hidden text-center text-[0.65rem] text-[var(--ca-subtle)] sm:block">{{ tcf('lampiran.ket')(menit) }}</p>
            <p :id="petunjukId" class="sr-only">{{ tcf('lampiran.pintasan') }}</p>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.foto-bidang { touch-action: none; }
.foto-kanvas { transition: transform 140ms ease; will-change: transform; }
.foto-kanvas-gerak { transition: none; }
@media (prefers-reduced-motion: reduce) { .foto-kanvas { transition: none; } }
</style>
