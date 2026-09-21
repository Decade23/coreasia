<script setup lang="ts">
/**
 * Tombol salin id (+ toast). Id ditampilkan pendek (8 aksara) atau tidak sama
 * sekali (`ikon`); yang disalin selalu id utuh. Dipakai di setiap tempat yang
 * menampilkan id tanpa tautan — mis. baris ruang di Pengguna 360 Fase 1, yang
 * sengaja bukan tautan karena /ruang/[id] baru ada di Fase 2.
 */
const props = withDefaults(defineProps<{ id: string; ikon?: boolean; label?: string }>(), { ikon: false, label: '' })
const { tcf } = useCashflowI18n()
const toast = useToast()

const salin = async () => {
  try {
    await navigator.clipboard.writeText(props.id)
    toast.success(tcf('umum.tersalin'))
  } catch {
    toast.error(tcf('umum.gagalSalin'))
  }
}
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-1 rounded-md px-1 font-mono text-xs text-[var(--ca-subtle)] transition hover:bg-[var(--ca-panel-bg-strong)] hover:text-[var(--ca-text)]"
    :title="`${tcf('umum.salin')}: ${id}`" :aria-label="`${tcf('umum.salin')} ${label || id}`"
    @click.stop="salin"
  >
    <span v-if="!ikon">{{ label || id.slice(0, 8) }}</span>
    <Icon name="lucide:copy" class="h-3 w-3" aria-hidden="true" />
  </button>
</template>
