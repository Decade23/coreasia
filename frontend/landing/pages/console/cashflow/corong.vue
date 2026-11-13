<script setup lang="ts">
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
const { tcf } = useCashflowI18n()
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('nav.corongWa')" kicker="CashFlow">
      <template #meta><CashflowNav /></template>
    </ConsolePageHeader>
    <CashflowCorongNomorWa />
  </div>
</template>
