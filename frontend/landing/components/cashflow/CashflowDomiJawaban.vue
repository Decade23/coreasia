<script setup lang="ts">
/**
 * Satu jawaban Domi: avatar kecil, kolom isi, lalu jam dan pilihan saran.
 * Baris pemakaian paling bawah adalah info admin kecil, tidak ada di
 * aplikasi.
 */
import type { PesanAsisten } from '~/adapters/cashflowDomi'
import { ringkasInfo } from '~/adapters/cashflowDomi'
import type { FotoDomi } from '~/composables/cashflow/useCashflowDomi'

const props = defineProps<{ pesan: PesanAsisten; foto: ReadonlyMap<string, FotoDomi> }>()
const emit = defineEmits<{ foto: [jalur: readonly string[], klik: string] }>()
const { tcf, formatJam } = useCashflowI18n()
const info = computed(() => ringkasInfo(props.pesan.info, {
  kredit: n => tcf('domi.kredit')(n),
  token: n => tcf('domi.token')(n),
}))
</script>

<template>
  <div class="flex items-start gap-[7px]">
    <span class="domi-avatar" aria-hidden="true">
      <svg viewBox="0 0 24 24" class="h-3.5 w-3.5"><path d="M12 4l2.1 5.9L20 12l-5.9 2.1L12 20l-2.1-5.9L4 12l5.9-2.1z" fill="#FFBE3D" /></svg>
    </span>
    <div class="flex min-w-0 flex-1 flex-col gap-1.5">
      <CashflowDomiBagian v-for="s in pesan.susunan" :key="s.kunci" :s="s" :foto="foto" @foto="(j, k) => emit('foto', j, k)" />
      <div v-if="pesan.saran.length" class="flex flex-wrap gap-1.5 pt-0.5">
        <span v-for="x in pesan.saran" :key="x" class="domi-saran">{{ x }}</span>
      </div>
      <div class="flex flex-wrap items-center gap-x-2 pl-1.5 text-xs font-semibold text-[var(--d-txt2)]">
        <span class="tabular-nums">{{ formatJam(pesan.dibuatIso) }}</span>
        <span v-if="info" class="domi-info" :title="tcf('domi.infoAdmin')">{{ info }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.domi-avatar {
  width: 26px; height: 26px; border-radius: 13px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;
  background: var(--d-avatar);
}
.domi-saran {
  padding: 6px 12px; border-radius: 14px; font-size: 12.5px; font-weight: 700;
  background: var(--d-gelembung); color: var(--d-txt2); border: 1px solid var(--d-line);
}
.domi-info { font-size: 11px; font-weight: 500; color: var(--d-txt3); }
</style>
