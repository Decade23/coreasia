<script setup lang="ts">
/**
 * Kartu keadaan penyedia cadangan Domi. Hanya membaca: nyala/mati, model,
 * kunci (sidik saja, kuncinya tidak pernah dikirim server), pemakaian, dan
 * galat terakhir cadangan dan penyedia utama. Waktu selalu WIB.
 */
import type { AiCadangan, CatatanGalat } from '~/adapters/cashflowAiCadangan'

const props = defineProps<{ keadaan: AiCadangan }>()
const { tcf, formatTanggal, formatJam } = useCashflowI18n()

/** '16 Nov 2026 10.05' (WIB). */
const waktu = (v: string | null) => (v ? `${formatTanggal(v)} ${formatJam(v)}` : '')
/* Dua bagian supaya waktu ganti tidak terpotong di tengah saat baris melipat. */
const kunci = computed(() => {
  const k = props.keadaan
  if (!k.kunciAda) return { utama: tcf('cadangan.status.kunciKosong') as string, diganti: '' }
  const utama: string = k.kunciSidik ? tcf('cadangan.status.kunciSidik')(k.kunciSidik) : tcf('cadangan.status.kunciAda')
  const diganti: string = k.kunciDiubahPada ? tcf('cadangan.status.kunciDiganti')(waktu(k.kunciDiubahPada)) : ''
  return { utama: diganti ? `${utama},` : utama, diganti }
})
const sehari = computed(() => (props.keadaan.dipakai24Jam === null
  ? tcf('cadangan.status.takTerbaca') as string
  : tcf('cadangan.status.kali')(props.keadaan.dipakai24Jam)))
const galat = computed<Array<{ kunci: string; label: string; catatan: CatatanGalat | null }>>(() => [
  { kunci: 'cadangan', label: tcf('cadangan.status.galatCadangan'), catatan: props.keadaan.galatCadangan },
  { kunci: 'utama', label: tcf('cadangan.status.galatUtama'), catatan: props.keadaan.galatUtama },
])
</script>

<template>
  <section class="ca-console-dialog min-w-0 p-5 sm:p-6" aria-labelledby="cf-cadangan-status" data-uji="cadangan-status">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 id="cf-cadangan-status" class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('cadangan.status.judul') }}</h2>
      <span
        class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
        :class="keadaan.aktif
          ? 'border-[color:var(--ca-emerald-border)] bg-[var(--ca-emerald-bg)] text-[var(--ca-emerald-text)]'
          : 'border-[color:var(--ca-border)] text-[var(--ca-muted)]'"
        data-uji="cadangan-lencana"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
        {{ tcf('cadangan.status.cadangan') }}: {{ keadaan.aktif ? tcf('cadangan.status.nyala') : tcf('cadangan.status.mati') }}
      </span>
    </div>

    <dl class="mt-4 divide-y divide-[color:var(--ca-border)] text-sm">
      <div class="grid gap-1 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
        <dt class="text-[var(--ca-muted)]">{{ tcf('cadangan.status.model') }}</dt>
        <dd class="min-w-0 break-words text-[var(--ca-text)]" :class="keadaan.model ? 'font-mono text-[0.8125rem]' : ''">{{ keadaan.model || tcf('cadangan.status.modelKosong') }}</dd>
      </div>
      <div class="grid gap-1 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
        <dt class="text-[var(--ca-muted)]">{{ tcf('cadangan.status.kunci') }}</dt>
        <dd class="min-w-0 break-words" :class="keadaan.kunciAda ? 'text-[var(--ca-text)]' : 'ca-tone-gold'" data-uji="cadangan-kunci-status">
          <span>{{ kunci.utama }}</span> <span v-if="kunci.diganti" class="whitespace-nowrap">{{ kunci.diganti }}</span>
        </dd>
      </div>
      <div class="grid gap-1 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
        <dt class="text-[var(--ca-muted)]">{{ tcf('cadangan.status.dipakai') }}</dt>
        <dd class="text-[var(--ca-text)] tabular-nums">{{ keadaan.terakhirDipakaiPada ? waktu(keadaan.terakhirDipakaiPada) : tcf('cadangan.status.belumDipakai') }}</dd>
      </div>
      <div class="grid gap-1 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
        <dt class="text-[var(--ca-muted)]">{{ tcf('cadangan.status.sehari') }}</dt>
        <dd class="text-[var(--ca-text)] tabular-nums">{{ sehari }}</dd>
      </div>
      <div v-for="g in galat" :key="g.kunci" class="grid gap-1 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
        <dt class="text-[var(--ca-muted)]">{{ g.label }}</dt>
        <dd v-if="g.catatan" class="min-w-0">
          <p class="break-words text-[var(--ca-text)]">{{ g.catatan.pesan }}</p>
          <p v-if="g.catatan.pada" class="mt-0.5 text-xs text-[var(--ca-subtle)] tabular-nums">{{ waktu(g.catatan.pada) }}</p>
        </dd>
        <dd v-else class="text-[var(--ca-muted)]">{{ tcf('cadangan.status.tanpaGalat') }}</dd>
      </div>
    </dl>
  </section>
</template>
