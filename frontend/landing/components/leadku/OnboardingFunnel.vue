<script setup lang="ts">
import { funnelRate, type LeadkuFunnel } from '~/adapters/leadkuMobile'

const props = defineProps<{ funnel?: LeadkuFunnel }>()

const integer = new Intl.NumberFormat('id-ID')
const percent = new Intl.NumberFormat('id-ID', { style: 'percent', maximumFractionDigits: 1 })
const verifiedRate = computed(() => props.funnel ? funnelRate(props.funnel.signup_completed, props.funnel.signup_started) : null)

const guideSteps = [
  { key: 'welcome_view', label: 'Melihat sambutan' },
  { key: 'demo_started', label: 'Mulai demo' },
  { key: 'guide_opened', label: 'Membuka panduan mandiri' },
  { key: 'demo_key_action', label: 'Menyelesaikan aksi contoh' },
  { key: 'guide_completed', label: 'Menyelesaikan panduan' },
] as const
</script>

<template>
  <section aria-labelledby="leadku-funnel-heading" class="ca-console-dialog min-w-0 space-y-4 p-5">
    <div>
      <h2 id="leadku-funnel-heading" class="font-display text-lg font-bold">Funnel pengguna baru</h2>
      <p class="text-sm text-[var(--ca-muted)]">ID instalasi unik dengan buka pertama tercatat dalam 30 hari terakhir</p>
    </div>
    <p v-if="!funnel" class="text-sm text-[var(--ca-muted)]">Data funnel belum tersedia.</p>
    <template v-else>
      <div class="grid gap-4 sm:grid-cols-3">
        <CashflowStatTile label="Buka pertama" :nilai="integer.format(funnel.first_open)" icon="lucide:smartphone" warna="sky" />
        <CashflowStatTile label="Mulai daftar" :nilai="integer.format(funnel.signup_started)" icon="lucide:user-plus" warna="amber" />
        <CashflowStatTile label="Email terverifikasi" :nilai="integer.format(funnel.signup_completed)" icon="lucide:check" warna="emerald" />
      </div>
      <div class="grid gap-5 lg:grid-cols-2">
        <div class="min-w-0 space-y-2">
          <h3 class="text-sm font-semibold">Demo dan panduan</h3>
          <dl class="divide-y divide-[var(--ca-border)] text-sm">
            <div v-for="step in guideSteps" :key="step.key" class="flex justify-between gap-3 py-2">
              <dt class="text-[var(--ca-muted)]">{{ step.label }}</dt>
              <dd class="shrink-0 font-semibold tabular-nums">{{ integer.format(funnel[step.key]) }}</dd>
            </div>
          </dl>
        </div>
        <div class="min-w-0 space-y-2">
          <h3 class="text-sm font-semibold">Pendaftaran dan bantuan</h3>
          <dl class="divide-y divide-[var(--ca-border)] text-sm">
            <template v-if="funnel.signup_direct !== undefined && funnel.signup_via_demo !== undefined">
              <div class="flex justify-between gap-3 py-2">
                <dt class="text-[var(--ca-muted)]">Langsung daftar</dt>
                <dd class="shrink-0 font-semibold tabular-nums">{{ integer.format(funnel.signup_direct) }}</dd>
              </div>
              <div class="flex justify-between gap-3 py-2">
                <dt class="text-[var(--ca-muted)]">Daftar setelah demo</dt>
                <dd class="shrink-0 font-semibold tabular-nums">{{ integer.format(funnel.signup_via_demo) }}</dd>
              </div>
            </template>
            <div class="flex justify-between gap-3 py-2">
              <dt class="text-[var(--ca-muted)]">Verifikasi dari pendaftaran yang dimulai</dt>
              <dd class="shrink-0 font-semibold tabular-nums">{{ verifiedRate === null ? '—' : percent.format(verifiedRate) }}</dd>
            </div>
            <div class="flex justify-between gap-3 py-2">
              <dt class="text-[var(--ca-muted)]">Meminta bantuan setup</dt>
              <dd class="shrink-0 font-semibold tabular-nums">{{ integer.format(funnel.setup_help_requested) }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </template>
  </section>
</template>
