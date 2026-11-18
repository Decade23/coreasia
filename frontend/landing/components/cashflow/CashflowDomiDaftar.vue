<script setup lang="ts">
/**
 * Daftar percakapan Domi satu pengguna: cari judul, baris padat (judul paling
 * banyak dua baris, jumlah pesan, waktu), percakapan terpilih tersorot.
 * Bergulir sendiri di dalam bingkai tab, jadi daftar sepanjang apa pun tidak
 * memanjangkan halaman.
 *
 * Pencarian hanya menyaring baris yang SUDAH dimuat, di peramban, tanpa
 * panggilan server: RPC daftar tidak punya saringan judul dan setiap
 * panggilannya menulis satu audit. "Muat percakapan lain" tetap tombol.
 *
 * Panah atas/bawah, Home, dan End memindah fokus antar baris (satu titik Tab
 * untuk seluruh daftar). Membuka tetap lewat Enter atau klik: setiap
 * pembukaan menulis satu audit, jadi menekan panah tidak boleh membuka.
 */
import { saringPercakapan, type Percakapan } from '~/adapters/cashflowDomi'

const props = defineProps<{
  baris: Percakapan[]
  total: number | null
  adaLagi: boolean
  aktif: string | null
  memuatLagi?: boolean
  formatWaktu: (v: string | Date | null | undefined) => string
}>()
const emit = defineEmits<{ pilih: [id: string]; lagi: [] }>()
const { tcf } = useCashflowI18n()

const kueri = ref('')
const tampil = computed(() => saringPercakapan(props.baris, kueri.value, tcf('domi.tanpaJudul')))
const menyaring = computed(() => kueri.value.trim().length > 0)

/* Baris yang memegang titik Tab: yang terakhir disorot, lalu yang terpilih, lalu yang pertama. */
const sorot = ref<string | null>(null)
const titikTab = computed(() => {
  const ada = (id: string | null) => !!id && tampil.value.some(p => p.id === id)
  if (ada(sorot.value)) return sorot.value
  if (ada(props.aktif)) return props.aktif
  return tampil.value[0]?.id ?? null
})

const gulir = ref<HTMLElement | null>(null)
const cari = ref<HTMLInputElement | null>(null)
/** Fokus ke satu baris dan gulir DAFTARNYA saja (jendela tidak ikut bergeser). */
function fokuskan(id: string) {
  sorot.value = id
  void nextTick(() => {
    const w = gulir.value
    const el = w?.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`)
    if (!w || !el) return
    el.focus({ preventScroll: true })
    const kw = w.getBoundingClientRect()
    const ke = el.getBoundingClientRect()
    if (ke.top < kw.top) w.scrollTop -= kw.top - ke.top
    else if (ke.bottom > kw.bottom) w.scrollTop += ke.bottom - kw.bottom
  })
}

function tekanDaftar(e: KeyboardEvent) {
  const ids = tampil.value.map(p => p.id)
  if (!ids.length) return
  const kini = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-id]')?.dataset.id ?? null
  const i = kini ? ids.indexOf(kini) : -1
  let ke: number | null = null
  if (e.key === 'ArrowDown') ke = Math.min(ids.length - 1, i + 1)
  else if (e.key === 'ArrowUp') {
    if (i <= 0) { e.preventDefault(); cari.value?.focus(); return }
    ke = i - 1
  } else if (e.key === 'Home') ke = 0
  else if (e.key === 'End') ke = ids.length - 1
  if (ke === null) return
  e.preventDefault()
  fokuskan(ids[ke]!)
}

function tekanCari(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' && titikTab.value) { e.preventDefault(); fokuskan(titikTab.value) }
  else if (e.key === 'Escape' && kueri.value) { e.preventDefault(); e.stopPropagation(); kueri.value = '' }
}

/* Percakapan yang dibuka dari luar daftar (mis. sesudah Segarkan) tetap terlihat di daftar. */
watch(() => props.aktif, (id) => {
  if (!id) return
  void nextTick(() => {
    const w = gulir.value
    const el = w?.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`)
    if (!w || !el) return
    const kw = w.getBoundingClientRect()
    const ke = el.getBoundingClientRect()
    if (ke.top < kw.top || ke.bottom > kw.bottom) w.scrollTop += ke.top - kw.top - kw.height / 3
  })
})
</script>

<template>
  <div class="domi-daftar flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[color:var(--ca-border)]">
    <CashflowKeadaanKosong v-if="!baris.length" icon="lucide:message-circle" :pesan="tcf('domi.kosong')" />
    <template v-else>
      <div class="shrink-0 space-y-1.5 border-b border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)] p-2">
        <label class="relative block">
          <span class="sr-only">{{ tcf('domi.cariJudul') }}</span>
          <Icon name="lucide:search" class="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ca-subtle)]" aria-hidden="true" />
          <input
            ref="cari" v-model="kueri" type="search" data-uji="domi-cari" autocomplete="off" spellcheck="false"
            class="ca-input w-full !py-1.5 !pl-8 text-sm" :placeholder="tcf('domi.cariJudul')" @keydown="tekanCari"
          >
        </label>
        <p class="px-0.5 text-xs text-[var(--ca-muted)] tabular-nums" aria-live="polite">
          {{ menyaring ? tcf('domi.cocok')(tampil.length, baris.length) : tcf('domi.jumlahDimuat')(baris.length, total) }}
        </p>
      </div>
      <div ref="gulir" class="domi-daftar-gulir ca-scrollbar min-h-0 flex-1 overflow-y-auto" data-uji="domi-daftar">
        <ul v-if="tampil.length" class="divide-y divide-[color:var(--ca-border)]" :aria-label="tcf('tab.domi')" @keydown="tekanDaftar">
          <li v-for="p in tampil" :key="p.id">
            <button
              type="button" data-uji="domi-baris" :data-id="p.id" :tabindex="p.id === titikTab ? 0 : -1"
              class="domi-baris" :class="{ 'domi-baris-aktif': p.id === aktif }"
              :aria-current="p.id === aktif ? 'true' : undefined"
              @click="sorot = p.id; emit('pilih', p.id)" @focus="sorot = p.id"
            >
              <span class="domi-baris-judul">{{ p.judul || tcf('domi.tanpaJudul') }}</span>
              <span class="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-[var(--ca-muted)] tabular-nums">
                <span>{{ tcf('domi.pesan')(p.jumlahPesan) }}</span>
                <span aria-hidden="true">·</span>
                <span class="truncate">{{ formatWaktu(p.diperbaruiIso) }}</span>
              </span>
            </button>
          </li>
        </ul>
        <div v-else class="space-y-1 px-3 py-4 text-sm text-[var(--ca-muted)]" data-uji="domi-cari-kosong" role="status">
          <p class="text-[var(--ca-text)]">{{ tcf('domi.cariKosong') }}</p>
          <p v-if="adaLagi" class="text-xs">{{ tcf('domi.cariLebih') }}</p>
        </div>
        <div v-if="adaLagi" class="p-2">
          <button type="button" class="ca-btn-secondary w-full !px-3 !py-2 text-sm" data-uji="domi-muat-lagi" :disabled="memuatLagi" @click="emit('lagi')">
            {{ memuatLagi ? tcf('umum.memuat') : tcf('domi.muatLagi') }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.domi-baris {
  display: block; width: 100%; padding: 8px 12px 8px 14px; text-align: left; position: relative;
  transition: background-color 0.12s ease;
}
.domi-baris:hover { background: var(--ca-panel-bg-strong); }
.domi-baris:focus-visible { outline: 2px solid var(--ca-accent); outline-offset: -2px; }
.domi-baris-judul {
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; overflow: hidden;
  font-size: 13px; line-height: 18px; font-weight: 600; color: var(--ca-text); overflow-wrap: anywhere;
}
/* Terpilih: garis aksen di kiri dan latar aksen tipis, tidak bergantung warna saja. */
.domi-baris-aktif { background: color-mix(in srgb, var(--ca-accent) 12%, transparent); }
.domi-baris-aktif:hover { background: color-mix(in srgb, var(--ca-accent) 16%, transparent); }
.domi-baris-aktif::before {
  content: ''; position: absolute; left: 0; top: 6px; bottom: 6px; width: 3px; border-radius: 0 3px 3px 0; background: var(--ca-accent);
}
.domi-baris-aktif .domi-baris-judul { font-weight: 800; }
</style>
