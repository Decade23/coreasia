<script setup lang="ts">
/** Kotak foto di percakapan Domi: gambar bila siap, keadaan bila belum. Klik buka penampil. */
import type { FotoDomi } from '~/composables/cashflow/useCashflowDomi'

const props = withDefaults(defineProps<{ jalur: string; foto: FotoDomi | undefined; lebar: number; tinggi?: number; radius?: number }>(), {
  tinggi: undefined, radius: 10,
})
const emit = defineEmits<{ buka: [] }>()
const { tcf } = useCashflowI18n()
const bisa = computed(() => props.foto?.keadaan === 'siap' && !!props.foto.src)
</script>

<template>
  <button
    type="button" class="domi-foto" :disabled="!bisa" :aria-label="tcf('domi.bukaFoto')" :title="tcf('domi.bukaFoto')"
    :style="{ width: `${lebar}px`, height: `${tinggi ?? lebar}px`, borderRadius: `${radius}px` }" @click="bisa && emit('buka')"
  >
    <img v-if="bisa" :src="foto!.src!" alt="" class="h-full w-full object-cover" draggable="false">
    <Icon v-else-if="foto?.keadaan === 'memuat' || !foto" name="lucide:loader-2" class="h-4 w-4 animate-spin" aria-hidden="true" />
    <span v-else class="flex flex-col items-center gap-1 px-1 text-center text-[0.65rem] leading-tight">
      <Icon :name="foto.keadaan === 'gagal' ? 'lucide:image-off' : 'lucide:cloud-upload'" class="h-4 w-4" aria-hidden="true" />
      <span v-if="lebar > 80">{{ foto.keadaan === 'gagal' ? tcf('domi.fotoGagal') : tcf('domi.fotoBelum') }}</span>
    </span>
  </button>
</template>

<style scoped>
.domi-foto {
  display: inline-flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;
  background: var(--d-gelembung); border: 1px solid var(--d-line); color: var(--d-txt3);
}
.domi-foto:not(:disabled) { cursor: zoom-in; }
</style>
