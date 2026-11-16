<script setup lang="ts" generic="T extends string">
/**
 * Deret pil segmen: satu klik mengganti nilai, tanpa dialog. Satu-satunya
 * tempat pil segmen ditulis di modul CashFlow.
 *
 * aria-pressed menandai pilihan aktif (warnanya diatur cashflow-tema.css).
 * Hitungan di samping label hanya tampil bila `jumlah` diisi angka. Pilihan
 * `mati` tetap terlihat tetapi tidak bisa ditekan. `gulir`: di ponsel deretnya
 * satu baris yang bisa digeser, tidak turun jadi beberapa baris.
 */
import { bisaDipilih, teksJumlahSegmen, type OpsiSegmen } from '~/utils/cashflow/segmen'

const props = defineProps<{ opsi: ReadonlyArray<OpsiSegmen<T>>; nilai: T; label?: string; gulir?: boolean; mati?: boolean }>()
const emit = defineEmits<{ pilih: [nilai: T] }>()
const pilih = (o: OpsiSegmen<T>) => { if (bisaDipilih(o, props.mati)) emit('pilih', o.nilai) }
</script>

<template>
  <div
    class="inline-flex max-w-full gap-0.5 rounded-full border border-[color:var(--ca-border)] bg-[var(--ca-surface)] p-1 text-[0.8125rem]"
    :class="gulir ? 'cf-seg-gulir flex-nowrap overflow-x-auto sm:flex-wrap sm:overflow-visible' : 'flex-wrap'"
    role="group" :aria-label="label"
  >
    <button
      v-for="o in opsi" :key="o.nilai || '_'" type="button" :data-seg="o.nilai"
      class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 transition disabled:cursor-not-allowed disabled:opacity-50"
      :class="[
        nilai === o.nilai ? 'bg-[var(--ca-panel-bg-strong)] font-bold text-[var(--ca-text)]' : 'font-semibold text-[var(--ca-muted)] hover:text-[var(--ca-text)]',
        o.nada ? `cf-seg-${o.nada}` : '',
      ]"
      :aria-pressed="nilai === o.nilai" :disabled="mati || o.mati" :title="o.ket"
      @click="pilih(o)"
    >{{ o.label }}<span v-if="teksJumlahSegmen(o.jumlah) !== null" class="font-bold tabular-nums opacity-70" aria-hidden="true">{{ teksJumlahSegmen(o.jumlah) }}</span></button>
  </div>
</template>
