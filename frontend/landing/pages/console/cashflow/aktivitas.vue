<script setup lang="ts">
/** Denyut produk lintas ruang — tanpa PII, jadi tanpa alasan. */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import type { AktivitasDTO } from '~/adapters/cashflow'
const { tcf, formatTanggal, formatJam } = useCashflowI18n()
const api = useCashflowAdmin()
const { memuat, pesanGalat, muat } = useCashflowMuat({ awal: true })
const rows = ref<AktivitasDTO[]>([])
onMounted(() => muat(async () => { rows.value = await api.aktivitasTerbaru(150) }))
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('aktivitas.judul')" kicker="CashFlow"><template #meta><CashflowNav /></template></ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('aktivitas.ket') }}</p>
    <p v-if="pesanGalat" class="text-sm ca-tone-danger">{{ pesanGalat }}</p>
    <p v-else-if="memuat" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>
    <div v-else class="ca-console-dialog overflow-x-auto">
      <CashflowKeadaanKosong v-if="!rows.length" class="m-5" :pesan="tcf('umum.kosong')" icon="lucide:activity" />
      <table v-else class="w-full text-sm">
        <thead><tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
          <th class="px-4 py-2">{{ tcf('aktivitas.tanggal') }}</th><th class="px-4 py-2">{{ tcf('aktivitas.waktu') }} (WIB)</th>
          <th class="px-4 py-2">{{ tcf('aktivitas.jenis') }}</th><th class="px-4 py-2">{{ tcf('aktivitas.nominal') }}</th><th class="px-4 py-2">{{ tcf('aktivitas.ruang') }}</th>
        </tr></thead>
        <tbody>
          <tr v-for="(r, i) in rows" :key="i" class="border-t border-[color:var(--ca-border)] text-[var(--ca-text)]">
            <td class="px-4 py-1.5 whitespace-nowrap">{{ formatTanggal(r.tanggal) }}</td>
            <td class="px-4 py-1.5 tabular-nums text-[var(--ca-subtle)]">{{ formatJam(r.pada) }}</td>
            <td class="px-4 py-1.5"><span class="rounded-full bg-[var(--ca-panel-bg-strong)] px-2 text-xs">{{ r.jenis }}</span></td>
            <td class="px-4 py-1.5 tabular-nums">{{ r.rentang_nominal }}</td>
            <td class="px-4 py-1.5 font-mono text-xs text-[var(--ca-subtle)]">{{ r.ruang_pendek }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
