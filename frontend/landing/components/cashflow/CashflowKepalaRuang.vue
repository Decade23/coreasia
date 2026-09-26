<script setup lang="ts">
/**
 * Kepala Ruang 360 — T0 (admin_ruang_kepala): ruang mana ini tanpa membuka
 * isinya. Nama dan pemilik SELALU tersamar di sini, juga sesudah kasus
 * terbuka (kepala ikut tangkapan layar); nama utuh ada di tab Ringkas, di
 * balik kasus. Hitungan hanya untuk sesi ber-pii ("—", butuh TOTP, bukan 0).
 * Setiap kunjungan tercatat (lihat_kepala), jadi "dilihat n×" jujur.
 */
import type { KepalaRuang } from '~/adapters/cashflowRuang'
import { angka } from '~/adapters/cashflow'

const props = defineProps<{ kepala: KepalaRuang | null; aksesKe: string }>()
const { tcf, formatTanggal } = useCashflowI18n()
const hitungan = computed(() => props.kepala
  ? [
      { label: tcf('r360.anggota'), n: props.kepala.anggota },
      { label: tcf('pengguna.tx'), n: props.kepala.transaksi },
      { label: tcf('r360.dompet'), n: props.kepala.dompet },
    ]
  : [])
</script>

<template>
  <section class="ca-console-dialog p-4 sm:p-5">
    <div v-if="!kepala" class="space-y-2">
      <div class="h-6 w-56 max-w-full animate-pulse rounded bg-[var(--ca-panel-bg-strong)]" />
      <div class="h-4 w-72 max-w-full animate-pulse rounded bg-[var(--ca-panel-bg-strong)]" />
    </div>
    <template v-else>
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="break-all font-mono text-lg font-bold text-[var(--ca-text)] sm:text-xl">{{ kepala.namaTersamar }}</h2>
        <CashflowSalinId :id="kepala.id" />
        <span v-if="kepala.jenis" class="ca-pill-muted text-[0.7rem]">{{ tcf(`ruang.jenisOpsi.${kepala.jenis}`) }}</span>
      </div>
      <dl class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--ca-muted)]">
        <div><dt class="inline">{{ tcf('ruang.pemilik') }}</dt> <dd class="inline font-mono text-[var(--ca-text)]">{{ kepala.pemilikTersamar }}</dd></div>
        <div><dt class="inline">{{ tcf('ruang.dibuat') }}</dt> <dd class="inline text-[var(--ca-text)]">{{ formatTanggal(kepala.dibuatIso) }}</dd></div>
        <div v-for="h in hitungan" :key="h.label">
          <dt class="inline">{{ h.label }}</dt>
          <dd v-if="h.n !== null" class="inline tabular-nums text-[var(--ca-text)]">{{ angka(h.n) }}</dd>
          <dd v-else class="inline text-[var(--ca-text)]" :title="tcf('umum.butuhTotp')">— <span class="text-xs text-[var(--ca-subtle)]">({{ tcf('umum.butuhTotp') }})</span></dd>
        </div>
        <div>
          <NuxtLink :to="aksesKe" class="underline-offset-2 hover:underline">{{ tcf('p360.dilihat')(kepala.akses30) }}</NuxtLink>
        </div>
      </dl>
    </template>
  </section>
</template>
