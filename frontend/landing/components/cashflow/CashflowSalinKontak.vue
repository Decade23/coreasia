<script setup lang="ts">
const props = defineProps<{ nilai: string; jenis: 'email' | 'wa' }>()
const { tcf } = useCashflowI18n()
const toast = useToast()
const label = computed(() => tcf(props.jenis === 'email' ? 'pengguna.salinEmail' : 'pengguna.salinWa'))

const salin = async () => {
  try {
    const nilai = props.jenis === 'wa' ? props.nilai.replace(/\s+/g, '') : props.nilai
    await navigator.clipboard.writeText(nilai)
    toast.success(tcf('pengguna.kontakDisalin'))
  } catch {
    toast.error(tcf('umum.gagalSalin'))
  }
}
</script>

<template>
  <button
    type="button"
    class="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-[var(--ca-subtle)] transition hover:bg-[var(--ca-panel-bg-strong)] hover:text-[var(--ca-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ca-gold-text)] lg:size-8"
    :title="label"
    :aria-label="label"
    @click.stop="salin"
  >
    <Icon name="lucide:copy" class="h-3.5 w-3.5" aria-hidden="true" />
  </button>
</template>
