<script setup lang="ts">
/**
 * Kepala Ruang 360 — T0 (admin_ruang_kepala): ruang mana ini tanpa membuka
 * isinya. Nama utuh berasal dari Ringkas yang sudah diaudit. Identitas
 * pemilik tetap berasal dari kepala tersamar.
 * Setiap kunjungan tercatat (lihat_kepala), jadi "dilihat n×" jujur.
 */
import type { KepalaRuang } from '~/adapters/cashflowRuang'
import { angka } from '~/adapters/cashflow'

const props = defineProps<{ kepala: KepalaRuang | null; namaLengkap?: string; izinPribadi: boolean; aksesKe: string }>()
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
  <section class="ca-console-dialog cf-kepala-rinci">
    <div v-if="!kepala" class="space-y-2 p-4 sm:p-5">
      <div class="h-6 w-56 max-w-full animate-pulse rounded bg-[var(--ca-panel-bg-strong)]" />
      <div class="h-4 w-72 max-w-full animate-pulse rounded bg-[var(--ca-panel-bg-strong)]" />
    </div>
    <template v-else>
      <!-- Ruang mana, jenisnya, lalu aksi di kanan. -->
      <div class="flex flex-wrap items-start justify-between gap-x-5 gap-y-3 p-4 sm:p-5">
        <div class="min-w-0 flex-1 basis-64">
          <h2 class="cf-kepala-nama" data-uji="rinci-nama">{{ namaLengkap ?? kepala.namaTersamar }}</h2>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <span v-if="kepala.jenis" class="cf-lencana">{{ tcf(`ruang.jenisOpsi.${kepala.jenis}`) }}</span>
            <NuxtLink :to="aksesKe" class="text-xs font-semibold text-[var(--ca-subtle)] underline-offset-2 hover:text-[var(--ca-text)] hover:underline">{{ tcf('p360.dilihat')(kepala.akses30) }}</NuxtLink>
          </div>
        </div>
        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <CashflowSalinId :id="kepala.id" />
        </div>
      </div>
      <dl class="cf-kepala-fakta">
        <div><dt>{{ tcf('ruang.pemilik') }}</dt><dd class="break-all">{{ kepala.pemilikTersamar }}</dd></div>
        <div><dt>{{ tcf('ruang.dibuat') }}</dt><dd>{{ formatTanggal(kepala.dibuatIso) }}</dd></div>
        <div v-for="h in hitungan" :key="h.label">
          <dt>{{ h.label }}</dt>
          <dd v-if="izinPribadi && h.n !== null">{{ angka(h.n) }}</dd>
          <dd v-else :title="tcf('umum.butuhTotp')">— <span class="text-xs font-medium text-[var(--ca-subtle)]">({{ tcf('umum.butuhTotp') }})</span></dd>
        </div>
      </dl>
    </template>
  </section>
</template>
