<script setup lang="ts">
/**
 * Audit CashFlow — dibaca LANGSUNG dari Supabase admin_audit dengan sesi
 * CashFlow. Tidak disalin ke gateway_audit_logs: target_id dan reason bisa
 * memuat nama; menyalinnya ke basis data kedua = PII di dua tempat.
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import type { AuditDTO } from '~/composables/cashflow/useCashflowAdmin'
import { samarkanEmail } from '~/adapters/cashflow'
const { tcf } = useCashflowI18n()
const api = useCashflowAdmin()
const memuat = ref(true); const galat = ref('')
const rows = ref<AuditDTO[]>([]); const aksi = ref<Array<{ action: string; jumlah: number }>>([]); const filter = ref('')
const muat = async () => {
  memuat.value = true; galat.value = ''
  try {
    const [r, a] = await Promise.all([api.daftarAudit(100, 0, filter.value || null), api.aksiAudit()])
    rows.value = r; aksi.value = a
  } catch (e: any) {
    galat.value = e?.jenis === 'bukan-admin' ? tcf('umum.bukanAdmin') : (e?.message ?? tcf('umum.gagal'))
    if (e?.jenis === 'totp' || e?.jenis === 'sesi') navigateTo({ path: '/console/cashflow/masuk', query: { sebab: 'sesi', ke: '/console/cashflow/audit' } })
  } finally { memuat.value = false }
}
onMounted(muat); watch(filter, muat)
const waktu = (iso: string) => new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('audit.judul')" kicker="CashFlow"><template #meta><CashflowNav /></template></ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('audit.ket') }}</p>
    <div class="flex flex-wrap items-center gap-2">
      <select v-model="filter" class="ca-input">
        <option value="">{{ tcf('umum.semua') }}</option>
        <option v-for="a in aksi" :key="a.action" :value="a.action">{{ a.action }} ({{ a.jumlah }})</option>
      </select>
    </div>
    <p v-if="galat" class="text-sm text-rose-600">{{ galat }}</p>
    <p v-else-if="memuat" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>
    <div v-else class="ca-console-dialog overflow-x-auto">
      <CashflowKeadaanKosong v-if="!rows.length" class="m-5" :pesan="tcf('umum.kosong')" icon="lucide:scroll-text" />
      <table v-else class="w-full text-sm">
        <thead><tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
          <th class="px-4 py-2">{{ tcf('audit.waktu') }}</th><th class="px-4 py-2">{{ tcf('audit.aksi') }}</th><th class="px-4 py-2">{{ tcf('audit.admin') }}</th><th class="px-4 py-2">{{ tcf('audit.target') }}</th><th class="px-4 py-2">{{ tcf('audit.alasan') }}</th>
        </tr></thead>
        <tbody>
          <tr v-for="r in rows" :key="r.id" class="border-t border-[color:var(--ca-border)] text-[var(--ca-text)]">
            <td class="px-4 py-1.5 whitespace-nowrap text-xs text-[var(--ca-subtle)]">{{ waktu(r.created_at) }}</td>
            <td class="px-4 py-1.5"><span class="rounded-full bg-[var(--ca-panel-bg-strong)] px-2 font-mono text-xs">{{ r.action }}</span></td>
            <td class="px-4 py-1.5 font-mono text-xs">
              <!-- pelaku = email admin console yang memegang sesi, diisi server (0078);
                   admin_email = identitas Supabase yang menjalankan RPC. -->
              <span v-if="r.pelaku" :title="r.admin_email">{{ r.pelaku }}</span>
              <span v-else>{{ r.admin_email }}</span>
            </td>
            <td class="px-4 py-1.5 font-mono text-xs">{{ r.target_email ? samarkanEmail(r.target_email) : (r.target_id?.slice(0, 8) || '—') }}</td>
            <td class="px-4 py-1.5 text-xs text-[var(--ca-muted)]">{{ r.reason || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
