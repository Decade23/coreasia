<script setup lang="ts">
/**
 * Kolom kunci API cadangan Domi.
 *
 * Kolomnya bertipe password, tanpa `name` (tidak ikut terkirim bila form
 * dikirim peramban), tanpa isi ulang otomatis, dan tidak pernah diisi dari
 * server. Nilainya milik halaman (useCashflowAiCadangan) dan hanya lewat
 * sini sebagai prop. Komponen ini tidak menyimpannya dan tidak memanggil
 * server. Galatnya berupa kode, jadi kunci tidak pernah ikut di kalimat.
 */
import type { GalatKunci } from '~/adapters/cashflowAiCadangan'
import { KUNCI_MAKS } from '~/adapters/cashflowAiCadangan'

defineProps<{ nilai: string; kunciAda: boolean; galat: GalatKunci | null; bolehUbah: boolean; menyimpan: boolean; menghapus: boolean; terkunci: boolean }>()
const emit = defineEmits<{ isi: [nilai: string]; simpan: []; hapus: [] }>()
const { tcf } = useCashflowI18n()
</script>

<template>
  <section class="ca-console-dialog min-w-0 p-5 sm:p-6" aria-labelledby="cf-cadangan-kunci" data-uji="cadangan-kunci">
    <h2 id="cf-cadangan-kunci" class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('cadangan.kunci.judul') }}</h2>
    <p class="mt-2 text-sm text-[var(--ca-muted)]">{{ tcf('cadangan.kunci.ket') }}</p>
    <form class="mt-4 space-y-3" method="post" autocomplete="off" @submit.prevent="emit('simpan')">
      <div>
        <label for="cf-cadangan-kunci-isi" class="text-sm text-[var(--ca-muted)]">{{ kunciAda ? tcf('cadangan.kunci.labelGanti') : tcf('cadangan.kunci.label') }}</label>
        <input
          id="cf-cadangan-kunci-isi" type="password" class="ca-input mt-2 w-full font-mono" :value="nilai"
          autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" data-1p-ignore data-lpignore="true"
          :maxlength="KUNCI_MAKS + 64" :placeholder="tcf('cadangan.kunci.contoh')" :disabled="!bolehUbah || terkunci"
          :aria-invalid="galat ? 'true' : undefined" :aria-describedby="galat ? 'cf-cadangan-kunci-galat' : undefined"
          data-uji="cadangan-kunci-isi" @input="emit('isi', ($event.target as HTMLInputElement).value)"
        >
        <p v-if="galat" id="cf-cadangan-kunci-galat" class="mt-2 text-xs ca-tone-danger" role="alert" data-uji="cadangan-kunci-galat">{{ tcf(`cadangan.kunci.galat.${galat}`) }}</p>
      </div>
      <div class="flex flex-wrap justify-end gap-2">
        <button
          v-if="kunciAda" type="button" class="ca-btn-secondary inline-flex items-center gap-2" :disabled="!bolehUbah || terkunci"
          data-uji="cadangan-kunci-hapus" @click="emit('hapus')"
        >
          <Icon :name="menghapus ? 'lucide:loader-2' : 'lucide:trash-2'" class="h-4 w-4" :class="menghapus ? 'animate-spin' : ''" aria-hidden="true" />
          {{ menghapus ? tcf('cadangan.kunci.menghapus') : tcf('cadangan.kunci.hapus') }}
        </button>
        <button type="submit" class="ca-btn-primary inline-flex items-center gap-2" :disabled="!bolehUbah || terkunci || !nilai" data-uji="cadangan-kunci-simpan">
          <Icon v-if="menyimpan" name="lucide:loader-2" class="h-4 w-4 animate-spin" aria-hidden="true" />
          {{ menyimpan ? tcf('cadangan.setelan.menyimpan') : kunciAda ? tcf('cadangan.kunci.ganti') : tcf('cadangan.kunci.simpan') }}
        </button>
      </div>
    </form>
  </section>
</template>
