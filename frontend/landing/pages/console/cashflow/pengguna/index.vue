<script setup lang="ts">
/**
 * Daftar pengguna — TERSAMAR secara bawaan (adapter yang menyamarkan).
 * Membuka satu baris = alasan → detail. Segmen "Tidak pernah mencatat" adalah
 * daftar yang perlu ditelepon: hari ini 10 orang.
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import { kePengguna, type Pengguna } from '~/adapters/cashflow'
const { tcf } = useCashflowI18n()
const api = useCashflowAdmin()

const memuat = ref(true)
const galat = ref('')
const semua = ref<Pengguna[]>([])
const cari = ref('')
const segmen = ref<'semua' | 'catat7' | 'belum' | 'ditangguhkan'>('semua')

const muat = async () => {
  memuat.value = true; galat.value = ''
  try {
    const rows = await api.daftarPengguna(200, 0, cari.value)
    semua.value = rows.map(kePengguna)
  } catch (e: any) {
    galat.value = e?.jenis === 'bukan-admin' ? tcf('umum.bukanAdmin') : (e?.message ?? tcf('umum.gagal'))
    if (e?.jenis === 'totp') navigateTo({ path: '/console/cashflow/masuk', query: { sebab: 'totp', ke: '/console/cashflow/pengguna' } })
  } finally { memuat.value = false }
}
onMounted(muat)
let t: ReturnType<typeof setTimeout> | undefined
watch(cari, () => { clearTimeout(t); t = setTimeout(muat, 350) })

const data = computed(() => semua.value.filter(p => {
  if (segmen.value === 'belum') return p.tx === 0
  if (segmen.value === 'ditangguhkan') return p.status === 'ditangguhkan'
  if (segmen.value === 'catat7') return p.tx > 0 && p.hariAktif <= 7 // pendekatan: aktif ≤ 7 hari & pernah mencatat
  return true
}))

const columns = computed(() => [
  { key: 'emailTersamar', label: tcf('pengguna.email'), type: 'text' as const, class: 'font-mono text-[var(--ca-text)]' },
  { key: 'daftar', label: tcf('pengguna.daftar'), type: 'text' as const, width: '120px' },
  { key: 'masukTerakhir', label: tcf('pengguna.masuk'), type: 'text' as const, width: '120px' },
  { key: 'ruang', label: tcf('pengguna.ruang'), type: 'text' as const, width: '70px', class: 'tabular-nums text-right' },
  { key: 'tx', label: tcf('pengguna.tx'), type: 'text' as const, width: '90px', class: 'tabular-nums text-right' },
  { key: 'statusLabel', label: tcf('pengguna.status'), type: 'status' as const, width: '110px' },
])
const tableData = computed(() => data.value.map(p => ({ ...p, statusLabel: p.status === 'aktif' ? tcf('pengguna.aktif') : tcf('pengguna.ditangguhkan') })))
const segmenOpsi = computed(() => [
  { kunci: 'semua', label: tcf('umum.semua') },
  { kunci: 'catat7', label: tcf('pengguna.catat7') },
  { kunci: 'belum', label: tcf('pengguna.belumCatat') },
  { kunci: 'ditangguhkan', label: tcf('pengguna.ditangguhkan') },
])
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('pengguna.judul')" kicker="CashFlow">
      <template #meta><CashflowNav /></template>
    </ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('pengguna.ket') }}</p>

    <div class="flex flex-wrap items-center gap-3">
      <input v-model="cari" type="search" class="ca-input w-64" :placeholder="tcf('umum.cari')" />
      <div class="flex flex-wrap gap-1 rounded-full border border-[color:var(--ca-border)] p-1 text-sm">
        <button
          v-for="s in segmenOpsi" :key="s.kunci" type="button"
          class="rounded-full px-3 py-1 transition"
          :class="segmen === s.kunci ? 'bg-[var(--ca-panel-bg-strong)] font-semibold text-[var(--ca-text)]' : 'text-[var(--ca-muted)]'"
          @click="segmen = s.kunci as any"
        >{{ s.label }}</button>
      </div>
      <span class="text-xs text-[var(--ca-subtle)] tabular-nums">{{ data.length }} / {{ semua.length }}</span>
    </div>

    <p v-if="galat" class="text-sm text-rose-600">{{ galat }}</p>

    <div class="ca-console-dialog overflow-hidden">
      <DataTable :columns="columns" :data="tableData" :loading="memuat" empty-icon="lucide:users" :empty-text="tcf('umum.kosong')">
        <template #cell-emailTersamar="{ row }">
          <NuxtLink :to="`/console/cashflow/pengguna/${row.id}`" class="font-mono text-[var(--ca-text)] underline-offset-2 hover:underline">{{ row.emailTersamar }}</NuxtLink>
        </template>
      </DataTable>
    </div>
  </div>
</template>
