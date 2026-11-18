<script setup lang="ts">
/**
 * Sakelar "Kontak lengkap": satu ketukan membuka atau menyamarkan lagi data
 * pribadi di sebuah daftar. Rupanya sama dengan sakelar di daftar Pengguna.
 * Membuka berarti halaman mengirim alasan tetap dan server mencatatnya di
 * audit. Komponen ini hanya tampilan: pemanggil yang memuat ulang daftar.
 */
defineProps<{ terbuka: boolean; mati?: boolean; label: string }>()
const emit = defineEmits<{ ganti: [] }>()
</script>

<template>
  <button
    type="button" role="switch" :aria-checked="terbuka" data-uji="sakelar-kontak"
    class="inline-flex items-center gap-3 rounded-full border border-[color:var(--ca-border)] bg-[var(--ca-surface)] py-1.5 pl-4 pr-1.5 text-sm font-semibold text-[var(--ca-text)] transition hover:bg-[var(--ca-panel-bg-strong)] disabled:cursor-not-allowed disabled:opacity-60"
    :disabled="mati" @click="emit('ganti')"
  >
    <Icon :name="terbuka ? 'lucide:eye' : 'lucide:eye-off'" class="h-4 w-4 text-[var(--ca-muted)]" />
    {{ label }}
    <span
      class="relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors duration-200"
      :class="terbuka ? 'border-[color:var(--ca-brand-deep)] bg-[var(--ca-brand)]' : 'border-[color:var(--ca-border)] bg-[var(--ca-toggle-track)]'"
      aria-hidden="true"
    >
      <span
        class="absolute top-0.5 h-[1.125rem] w-[1.125rem] rounded-full transition-transform duration-200"
        :style="{ background: 'var(--ca-toggle-thumb)', boxShadow: 'var(--ca-toggle-thumb-shadow)' }"
        :class="terbuka ? 'translate-x-[1.35rem]' : 'translate-x-0.5'"
      />
    </span>
  </button>
</template>
