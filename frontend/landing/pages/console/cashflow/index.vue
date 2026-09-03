<script setup lang="ts">
/**
 * Ringkasan — menjawab "produk ini hidup atau tidak" dalam lima detik.
 * Satu angka terbesar: ukuran keberhasilan yang disepakati. Semua agregat,
 * tanpa PII, jadi tanpa alasan audit.
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import { keCorong, keKohort, keSeri30Hari, angka } from '~/adapters/cashflow'
import type { StatsDTO, KeberhasilanDTO, RetensiDTO, CorongDTO } from '~/adapters/cashflow'
const { tcf } = useCashflowI18n()
const api = useCashflowAdmin()

const memuat = ref(true)
const galat = ref<{ jenis: string; pesan: string } | null>(null)
const stats = ref<StatsDTO | null>(null)
const keberhasilan = ref<KeberhasilanDTO | null>(null)
const corong = ref<CorongDTO[]>([])
const retensi = ref<RetensiDTO[]>([])

onMounted(async () => {
  try {
    const [s, k, c, r] = await Promise.all([api.stats(), api.ukuranKeberhasilan(), api.corong(90), api.retensi(6)])
    stats.value = s; keberhasilan.value = k; corong.value = c; retensi.value = r
  } catch (e: any) {
    galat.value = { jenis: e?.jenis ?? 'lain', pesan: e?.message ?? '' }
    if (e?.jenis === 'totp' || e?.jenis === 'sesi') navigateTo({ path: '/console/cashflow/masuk', query: { sebab: 'sesi', ke: '/console/cashflow' } })
  } finally { memuat.value = false }
})

const seri = computed(() => stats.value ? keSeri30Hari(stats.value.transaksi_per_hari) : [])
const titikIsi = computed(() => seri.value.filter(v => v > 0).length)
const langkahCorong = computed(() => keCorong(corong.value).map(l => ({
  label: tcf(`ringkasan.langkah.${l.kunci}`), nilai: l.jumlah, persen: l.persenDariSebelumnya,
})))
const kohort = computed(() => keKohort(retensi.value))
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('ringkasan.judul')" kicker="CashFlow">
      <template #meta><CashflowNav /></template>
    </ConsolePageHeader>

    <p v-if="memuat" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>

    <div v-else-if="galat" class="ca-console-dialog p-6 text-sm">
      <p class="font-semibold text-rose-600">{{ galat.jenis === 'bukan-admin' ? tcf('umum.bukanAdmin') : galat.jenis === 'konfigurasi' ? tcf('umum.belumKonfigurasi') : tcf('umum.gagal') }}</p>
      <p class="mt-1 text-[var(--ca-subtle)]">{{ galat.pesan }}</p>
    </div>

    <template v-else-if="stats && keberhasilan">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CashflowStatTile
          utama icon="lucide:target" warna="emerald"
          :label="tcf('ringkasan.keberhasilan')"
          :nilai="keberhasilan.jumlah" :nilai-mentah="keberhasilan.jumlah" :pembanding="keberhasilan.pembanding"
          :keterangan="tcf('ringkasan.keberhasilanKet')"
        />
        <CashflowStatTile icon="lucide:users" warna="amber" :label="tcf('ringkasan.pengguna')" :nilai="angka(stats.total_pengguna)" />
        <CashflowStatTile icon="lucide:layers" warna="sky" :label="tcf('ringkasan.ruang')" :nilai="angka(stats.total_ruang)" />
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <section class="ca-console-dialog p-5">
          <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('ringkasan.perHari') }}</h2>
          <div class="mt-4">
            <CashflowSparkline v-if="titikIsi >= 3" :data="seri" :label="tcf('ringkasan.perHari')" />
            <CashflowKeadaanKosong v-else :pesan="tcf('ringkasan.sedikit')(titikIsi, 3)" icon="lucide:activity" />
          </div>
        </section>

        <section class="ca-console-dialog p-5">
          <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('ringkasan.corong') }}</h2>
          <p class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('ringkasan.corongKet') }}</p>
          <div class="mt-4">
            <CashflowBarRows v-if="langkahCorong.length" :baris="langkahCorong" />
            <CashflowKeadaanKosong v-else :pesan="tcf('umum.kosong')" />
          </div>
        </section>
      </div>

      <section class="ca-console-dialog p-5">
        <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('ringkasan.kohort') }}</h2>
        <div class="mt-4">
          <CashflowCohortGrid v-if="kohort.some(k => k.mendaftar > 0)" :baris="kohort" />
          <CashflowKeadaanKosong v-else :pesan="tcf('umum.kosong')" icon="lucide:grid-2x2" />
        </div>
      </section>
    </template>
  </div>
</template>
