<script setup lang="ts">
/**
 * Setelan cadangan Domi: sakelar nyala/mati, pilihan model, tombol Simpan.
 * Menyalakan tanpa kunci tidak bisa: sakelarnya mati dan keterangannya bilang
 * kenapa. Komponen ini tidak memanggil server, halaman yang menyimpan.
 */
import type { AiCadangan, AlasanTakSimpan } from '~/adapters/cashflowAiCadangan'

const props = defineProps<{
  keadaan: AiCadangan; aktif: boolean; model: string
  bolehUbah: boolean; butuhKunci: boolean; alasan: AlasanTakSimpan | null; bisaSimpan: boolean; menyimpan: boolean; terkunci: boolean
}>()
const emit = defineEmits<{ aktif: [nilai: boolean]; model: [nilai: string]; simpan: [] }>()
const { tcf } = useCashflowI18n()

/** Mematikan selalu boleh, menyalakan butuh kunci. */
const sakelarMati = computed(() => !props.bolehUbah || props.terkunci || (props.butuhKunci && !props.aktif))
const keterangan = computed(() => {
  if (props.butuhKunci) return tcf('cadangan.setelan.butuhKunci') as string
  if (props.alasan === 'modelKosong') return tcf('cadangan.setelan.modelKosong') as string
  if (props.alasan === 'modelAsing') return tcf('cadangan.setelan.modelAsing') as string
  if (props.alasan === 'tanpaPerubahan') return tcf('cadangan.setelan.tanpaPerubahan') as string
  return ''
})
</script>

<template>
  <section class="ca-console-dialog min-w-0 p-5 sm:p-6" aria-labelledby="cf-cadangan-setelan" data-uji="cadangan-setelan">
    <h2 id="cf-cadangan-setelan" class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('cadangan.setelan.judul') }}</h2>
    <form class="mt-4 space-y-5" method="post" @submit.prevent="emit('simpan')">
      <div class="flex items-center justify-between gap-4">
        <span id="cf-cadangan-sakelar-label" class="min-w-0 text-sm text-[var(--ca-text)]">{{ tcf('cadangan.setelan.sakelar') }}</span>
        <button
          type="button" role="switch" :aria-checked="aktif" aria-labelledby="cf-cadangan-sakelar-label"
          :aria-describedby="keterangan ? 'cf-cadangan-setelan-ket' : undefined"
          class="relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
          :class="aktif ? 'border-[color:var(--ca-brand-deep)] bg-[var(--ca-brand)]' : 'border-[color:var(--ca-border)] bg-[var(--ca-toggle-track)]'"
          :disabled="sakelarMati" data-uji="cadangan-sakelar" @click="emit('aktif', !aktif)"
        >
          <span
            class="absolute top-0.5 h-[1.125rem] w-[1.125rem] rounded-full transition-transform duration-200"
            :style="{ background: 'var(--ca-toggle-thumb)', boxShadow: 'var(--ca-toggle-thumb-shadow)' }"
            :class="aktif ? 'translate-x-[1.35rem]' : 'translate-x-0.5'" aria-hidden="true"
          />
        </button>
      </div>

      <div>
        <label for="cf-cadangan-model" class="text-sm text-[var(--ca-muted)]">{{ tcf('cadangan.setelan.model') }}</label>
        <select
          id="cf-cadangan-model" class="ca-input mt-2 w-full font-mono" :value="model"
          :disabled="!bolehUbah || terkunci || !keadaan.modelPilihan.length" data-uji="cadangan-model"
          @change="emit('model', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="m in keadaan.modelPilihan" :key="m" :value="m">{{ m }}</option>
        </select>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <p id="cf-cadangan-setelan-ket" class="min-w-0 flex-1 text-xs" :class="butuhKunci ? 'ca-tone-gold' : 'text-[var(--ca-muted)]'" data-uji="cadangan-setelan-ket">{{ keterangan }}</p>
        <button type="submit" class="ca-btn-primary inline-flex items-center gap-2" :disabled="!bisaSimpan" data-uji="cadangan-simpan">
          <Icon v-if="menyimpan" name="lucide:loader-2" class="h-4 w-4 animate-spin" aria-hidden="true" />
          {{ menyimpan ? tcf('cadangan.setelan.menyimpan') : tcf('cadangan.setelan.simpan') }}
        </button>
      </div>
    </form>
  </section>
</template>
