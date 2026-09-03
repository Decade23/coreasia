<script setup lang="ts">
/** Daftar ruang bersama — nama buatan pengguna dan pemilik TERSAMAR. */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import { samarkanEmail, samarkanNamaRuang, tanggalPendek, type RuangDTO } from '~/adapters/cashflow'
const { tcf } = useCashflowI18n()
const api = useCashflowAdmin()
const memuat = ref(true); const galat = ref(''); const rows = ref<RuangDTO[]>([])
onMounted(async () => {
  try { rows.value = await api.daftarRuang(200, 0) }
  catch (e: any) {
    galat.value = e?.jenis === 'bukan-admin' ? tcf('umum.bukanAdmin') : (e?.message ?? tcf('umum.gagal'))
    if (e?.jenis === 'totp' || e?.jenis === 'sesi') navigateTo({ path: '/console/cashflow/masuk', query: { sebab: 'sesi', ke: '/console/cashflow/ruang' } })
  } finally { memuat.value = false }
})
const columns = computed(() => [
  { key: 'nama', label: tcf('ruang.nama'), type: 'text' as const, class: 'text-[var(--ca-text)]' },
  { key: 'pemilik', label: tcf('ruang.pemilik'), type: 'text' as const, class: 'font-mono' },
  { key: 'jumlah_anggota', label: tcf('ruang.anggota'), type: 'text' as const, width: '90px', class: 'tabular-nums text-right' },
  { key: 'jumlah_tx', label: tcf('ruang.tx'), type: 'text' as const, width: '110px', class: 'tabular-nums text-right' },
  { key: 'undangan_aktif', label: tcf('ruang.undangan'), type: 'text' as const, width: '120px', class: 'tabular-nums text-right' },
  { key: 'dibuat', label: tcf('ruang.dibuat'), type: 'text' as const, width: '120px' },
])
const data = computed(() => rows.value.map(r => ({
  ...r, nama: samarkanNamaRuang(r.nama), pemilik: samarkanEmail(r.pemilik_email), dibuat: tanggalPendek(r.created_at),
})))
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('ruang.judul')" kicker="CashFlow"><template #meta><CashflowNav /></template></ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('ruang.ket') }}</p>
    <p v-if="galat" class="text-sm text-rose-600">{{ galat }}</p>
    <div class="ca-console-dialog overflow-hidden">
      <DataTable :columns="columns" :data="data" :loading="memuat" empty-icon="lucide:layers" :empty-text="tcf('umum.kosong')" />
    </div>
  </div>
</template>
