<script setup lang="ts">
/**
 * Keterangan kasus Pengguna 360 — kecil, tanpa aksi wajib (keputusan Master
 * 21 Sep 2026: data dibuka satu klik; kasusnya dibuka, diperpanjang, dan
 * dibuka ulang otomatis oleh useCashflowKasus). Yang tersisa hanya kejujuran
 * bahwa pembukaan ini tercatat: "Dibuka · tercatat di audit". Masa berlaku
 * ada di tooltip. Dipasang induk pengguna/[id].vue, jadi bertahan antar-tab.
 */
const { tcf, formatJam } = useCashflowI18n()
const kasus = useCashflowKasus()

const k = computed(() => kasus.kasus.value)
const membuka = computed(() => !k.value && (kasus.keadaan.value.tahap === 'membuka' || kasus.keadaan.value.pulih === 'memuat'))
const judul = computed(() => (k.value ? tcf('kasus.bilah.sampai')(formatJam(k.value.sampaiIso)) : ''))
</script>

<template>
  <p
    v-if="k || membuka"
    class="flex items-center gap-1.5 text-xs text-[var(--ca-muted)]"
    :title="judul || undefined" role="status" :aria-label="tcf('kasus.bilah.label')"
  >
    <Icon
      :name="k ? 'lucide:shield-check' : 'lucide:loader-2'"
      class="h-3.5 w-3.5 shrink-0" :class="k ? 'text-[var(--ca-emerald-text)]' : 'animate-spin text-[var(--ca-subtle)]'"
      aria-hidden="true"
    />
    <span>{{ k ? tcf('kasus.bilah.dibuka') : tcf('kasus.bilah.membuka') }}</span>
    <span v-if="kasus.anakAktif.value" class="text-[var(--ca-subtle)]">· {{ tcf('kasus.bilah.catatanTerbuka') }}</span>
  </p>
</template>
