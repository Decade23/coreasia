<script setup lang="ts">
/** Pintasan ke setiap bagian tanpa memuat isi sebelum dipilih. */
interface Bagian { kunci: string; label: string; to: string; ikon: string; jumlah: number | null }
defineProps<{ judul: string; keterangan: string; bagian: Bagian[] }>()
const aktivasi = useCashflowAktivasiTab()
</script>

<template>
  <section class="ca-console-dialog p-4 sm:p-5">
    <h3 class="text-base font-bold text-[var(--ca-text)]">{{ judul }}</h3>
    <p class="mt-1 text-sm text-[var(--ca-muted)]">{{ keterangan }}</p>
    <div class="mt-4 grid gap-2 sm:grid-cols-2">
      <NuxtLink
        v-for="i in bagian" :key="i.kunci" :to="i.to"
        class="flex min-h-14 items-center gap-3 rounded-xl border border-[color:var(--ca-border)] px-3 py-2 text-sm text-[var(--ca-text)] transition hover:bg-[var(--ca-panel-bg-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ca-brand)]"
        @click="aktivasi.catat(i.to, $event)"
      >
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--ca-chip-bg)] text-[var(--ca-brand-deep)]"><Icon :name="i.ikon" class="h-4 w-4" aria-hidden="true" /></span>
        <span class="min-w-0 flex-1 font-semibold">{{ i.label }}</span>
        <span v-if="i.jumlah !== null" class="tabular-nums text-[var(--ca-muted)]">{{ i.jumlah }}</span>
        <Icon name="lucide:chevron-right" class="h-4 w-4 shrink-0 text-[var(--ca-subtle)]" aria-hidden="true" />
      </NuxtLink>
    </div>
  </section>
</template>
