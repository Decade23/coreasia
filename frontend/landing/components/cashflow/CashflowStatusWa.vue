<script setup lang="ts">
/**
 * Status WhatsApp OTP: menjawab "ada masalah atau tidak". `ringkas` untuk
 * Ringkasan (keadaan dan sebab saja), tanpa `ringkas` untuk Kesehatan.
 *
 * Dimuat sendiri, bukan lewat Promise.all halaman: kalau RPC ini gagal, ubin
 * lain tetap tampil. Menyegarkan tiap 60 detik, dilewati saat tab tersembunyi.
 */
import { keStatusWa, type StatusWa } from '~/adapters/cashflowWa'

defineProps<{ ringkas?: boolean }>()
const { tcf, formatWaktu } = useCashflowI18n()
const api = useCashflowAdmin()

const status = ref<StatusWa | null>(null)
const gagal = ref(false)
const SEGAR_MS = 60_000
let pengatur: ReturnType<typeof setInterval> | null = null

async function muat() {
  try {
    status.value = keStatusWa(await api.waStatus())
    gagal.value = false
  } catch {
    gagal.value = true
  }
}
onMounted(() => {
  void muat()
  pengatur = setInterval(() => { if (!document.hidden) void muat() }, SEGAR_MS)
})
onBeforeUnmount(() => { if (pengatur) clearInterval(pengatur) })

const WARNA = { sehat: 'emerald', gangguan: 'danger', nonaktif: 'gold' } as const
const IKON = { sehat: 'lucide:circle-check', gangguan: 'lucide:triangle-alert', nonaktif: 'lucide:circle-pause' } as const
const nada = computed(() => (status.value ? `ca-tone-${WARNA[status.value.tingkat]}` : ''))
const teksSebab = (k: string) => {
  const v = tcf(`kesehatan.wa.sebab.${k}`) as unknown
  if (typeof v !== 'function') return String(v)
  const s = status.value
  return k === 'sesi'
    ? (v as (x: string) => string)(tcf(`kesehatan.wa.status.${s?.statusSesi ?? 'kosong'}`) as string)
    : (v as (a: number, b: number) => string)(s?.batas.terpakai ?? 0, s?.batas.harian ?? 0)
}
const waktu = (v: string | null) => (v ? formatWaktu(v) : tcf('kesehatan.wa.belumAda'))
const adaSesi = computed(() => status.value?.sebab.includes('sesi') ?? false)
</script>

<template>
  <section class="ca-console-dialog p-5" aria-live="polite">
    <p v-if="gagal && !status" class="text-sm ca-tone-danger">{{ tcf('kesehatan.wa.gagalMuat') }}</p>
    <p v-else-if="!status" class="text-sm text-[var(--ca-muted)]">{{ tcf('kesehatan.wa.memuat') }}</p>
    <template v-else>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex min-w-0 items-start gap-3">
          <Icon :name="IKON[status.tingkat]" class="mt-0.5 h-5 w-5 shrink-0" :class="nada" aria-hidden="true" />
          <div class="min-w-0">
            <h2 class="font-display text-base font-bold text-[var(--ca-text)]">
              {{ tcf('kesehatan.wa.judul') }}:
              <span :class="nada">{{ tcf(`kesehatan.wa.tingkat.${status.tingkat}`) }}</span>
            </h2>
            <p v-if="status.tingkat === 'sehat'" class="mt-1 text-sm text-[var(--ca-muted)]">{{ tcf('kesehatan.wa.ketSehat') }}</p>
            <p v-else-if="status.tingkat === 'nonaktif'" class="mt-1 text-sm text-[var(--ca-muted)]">{{ tcf('kesehatan.wa.ketNonaktif') }}</p>
            <p v-else-if="status.lewatOtp" class="mt-1 text-sm font-semibold ca-tone-danger">{{ tcf('kesehatan.wa.ketLewat') }}</p>
          </div>
        </div>
        <div class="flex shrink-0 flex-wrap items-center gap-3 text-xs text-[var(--ca-subtle)]">
          <span v-if="status.dicekPada">{{ tcf('kesehatan.wa.dicek')(formatWaktu(status.dicekPada)) }}</span>
          <NuxtLink v-if="ringkas" to="/console/cashflow/kesehatan" class="font-semibold underline">{{ tcf('kesehatan.wa.rincian') }}</NuxtLink>
        </div>
      </div>

      <ul v-if="status.sebab.length" class="mt-3 space-y-2">
        <li v-for="k in status.sebab" :key="k" class="rounded-xl bg-[var(--ca-danger-bg)] px-3 py-2 text-sm">
          <p class="font-semibold text-[var(--ca-text)]">{{ teksSebab(k) }}</p>
          <p class="text-[var(--ca-muted)]">{{ tcf(`kesehatan.wa.langkah.${k}`) }}</p>
        </li>
      </ul>
      <a
        v-if="adaSesi" href="https://sapa.coreasia.id" target="_blank" rel="noopener noreferrer"
        class="ca-btn-secondary mt-3 inline-block text-xs"
      >{{ tcf('kesehatan.wa.bukaSapa') }}</a>

      <template v-if="!ringkas">
        <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <div><dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.wa.labelSesi') }}</dt><dd class="font-semibold text-[var(--ca-text)]">{{ tcf(`kesehatan.wa.status.${status.statusSesi}`) }}</dd></div>
          <div><dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.wa.labelSejak') }}</dt><dd class="font-semibold text-[var(--ca-text)]">{{ waktu(status.sejak) }}</dd></div>
          <div><dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.wa.labelOtp') }}</dt><dd class="font-semibold text-[var(--ca-text)]">{{ tcf(status.otp === 'wajib' ? 'kesehatan.wa.otpWajib' : status.otp === 'mati' ? 'kesehatan.wa.otpMati' : 'kesehatan.wa.otpTidakWajib') }}</dd></div>
          <div><dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.wa.labelBatas') }}</dt><dd class="font-semibold tabular-nums text-[var(--ca-text)]">{{ status.batas.terpakai }} / {{ status.batas.harian }}</dd></div>
          <div><dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.wa.labelTerkirim') }}</dt><dd class="font-semibold text-[var(--ca-text)]">{{ waktu(status.terkirimTerakhir) }}</dd></div>
        </dl>
        <h3 class="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('kesehatan.wa.kiriman') }}</h3>
        <dl class="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
          <div><dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.wa.diminta') }}</dt><dd class="font-bold tabular-nums text-[var(--ca-text)]">{{ status.kiriman.diminta }}</dd></div>
          <div><dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.wa.terkirim') }}</dt><dd class="font-bold tabular-nums text-[var(--ca-text)]">{{ status.kiriman.terkirim }}</dd></div>
          <div><dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.wa.gagal') }}</dt><dd class="font-bold tabular-nums" :class="status.kiriman.gagal ? 'ca-tone-danger' : 'text-[var(--ca-text)]'">{{ status.kiriman.gagal }}</dd></div>
          <div><dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.wa.tanpaWa') }}</dt><dd class="font-bold tabular-nums text-[var(--ca-text)]">{{ status.kiriman.tanpa_wa }}</dd></div>
          <div><dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.wa.diketik') }}</dt><dd class="font-bold tabular-nums text-[var(--ca-text)]">{{ status.kiriman.diketik }}</dd></div>
        </dl>
        <template v-if="status.sebabGagal.length">
          <h3 class="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('kesehatan.wa.sebabGagal') }}</h3>
          <ul class="mt-2 space-y-1 text-sm text-[var(--ca-text)]">
            <li v-for="s in status.sebabGagal" :key="s.sebab" class="flex justify-between gap-3"><span class="font-mono text-xs">{{ s.sebab }}</span><span class="tabular-nums">{{ s.jumlah }}</span></li>
          </ul>
        </template>
      </template>
    </template>
  </section>
</template>
