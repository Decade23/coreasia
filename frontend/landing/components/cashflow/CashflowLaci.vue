<script setup lang="ts">
/**
 * Laci generik: panel kanan di layar lebar, lembar layar penuh di < 640 px.
 * Dialog modal sungguhan (aria-modal): pintasan halaman mati selama laci
 * terbuka, Esc menutup, fokus pindah ke laci dan kembali ke pemicunya.
 * Pemanggil yang mengurus URL (?tx= push, Back menutup).
 */
const props = defineProps<{ show: boolean; judul: string }>()
const emit = defineEmits<{ close: [] }>()
const { tcf } = useCashflowI18n()
const panel = ref<HTMLElement | null>(null)
const judulId = useId()
let asalFokus: HTMLElement | null = null

const tombol = (e: KeyboardEvent) => {
  if (e.key !== 'Escape' || !props.show) return
  // Modal lain di atas laci memegang Esc-nya sendiri.
  if (document.querySelectorAll('[aria-modal="true"]').length > 1) return
  e.preventDefault()
  emit('close')
}
watch(() => props.show, async (s) => {
  if (!import.meta.client) return
  if (s) {
    const aktif = document.activeElement
    asalFokus = aktif instanceof HTMLElement && aktif !== document.body ? aktif : null
    document.addEventListener('keydown', tombol)
    await nextTick()
    panel.value?.focus({ preventScroll: true })
  } else {
    document.removeEventListener('keydown', tombol)
    if (asalFokus?.isConnected) asalFokus.focus({ preventScroll: true })
    asalFokus = null
  }
}, { immediate: true })
onBeforeUnmount(() => { if (import.meta.client) document.removeEventListener('keydown', tombol) })
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" leave-active-class="transition duration-100 ease-in" leave-to-class="opacity-0">
      <div v-if="show" class="fixed inset-0 z-40 bg-slate-950/40" @click.self="emit('close')">
        <aside
          ref="panel" tabindex="-1" role="dialog" aria-modal="true" :aria-labelledby="judulId"
          class="ca-console-dialog absolute inset-0 flex flex-col overflow-hidden rounded-none p-0 outline-none sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[32rem] sm:max-w-[90vw] sm:rounded-l-2xl"
        >
          <header class="flex items-center justify-between gap-3 border-b border-[color:var(--ca-border)] px-4 py-3 sm:px-5">
            <h3 :id="judulId" class="font-display text-base font-bold text-[var(--ca-text)]">{{ judul }}</h3>
            <button type="button" class="ca-btn-ghost h-9 w-9 shrink-0 p-0" :aria-label="tcf('umum.tutup')" @click="emit('close')">
              <Icon name="lucide:x" class="h-4 w-4" />
            </button>
          </header>
          <div class="ca-scrollbar flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <slot />
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>
