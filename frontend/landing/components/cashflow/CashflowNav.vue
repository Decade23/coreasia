<script setup lang="ts">
/**
 * Sub-navigasi modul CashFlow. Sidebar console adalah array datar tanpa
 * seksi; satu item "CashFlow" di sana, dan navigasi bagian ada di sini —
 * supaya sidebar tidak jadi 15 item begitu produk kedua masuk.
 */
const { tcf } = useCashflowI18n()
const route = useRoute()
const item = computed(() => [
  { kunci: 'ringkasan', to: '/console/cashflow' },
  { kunci: 'pengguna', to: '/console/cashflow/pengguna' },
  { kunci: 'aktivitas', to: '/console/cashflow/aktivitas' },
  { kunci: 'ruang', to: '/console/cashflow/ruang' },
  { kunci: 'kesehatan', to: '/console/cashflow/kesehatan' },
  { kunci: 'sakelar', to: '/console/cashflow/sakelar' },
  { kunci: 'pengumuman', to: '/console/cashflow/pengumuman' },
  { kunci: 'audit', to: '/console/cashflow/audit' },
])
const aktif = (to: string) => to === '/console/cashflow' ? route.path === to : route.path.startsWith(to)
</script>

<template>
  <nav class="flex flex-wrap gap-1 rounded-full border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-1 text-sm">
    <NuxtLink
      v-for="i in item" :key="i.kunci" :to="i.to"
      class="rounded-full px-3 py-1.5 transition"
      :class="aktif(i.to) ? 'bg-[var(--ca-panel-bg-strong)] font-semibold text-[var(--ca-text)]' : 'text-[var(--ca-muted)] hover:text-[var(--ca-text)]'"
    >{{ tcf(`nav.${i.kunci}`) }}</NuxtLink>
  </nav>
</template>
