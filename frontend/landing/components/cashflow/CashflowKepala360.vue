<script setup lang="ts">
/**
 * Kepala Pengguna 360 — T0 (admin_pengguna_kepala): siapa orang ini tanpa
 * membuka isinya. Email utuh berasal dari data akun yang sudah dibaca
 * melalui kasus aktif. Nomor WhatsApp berasal dari kepala dan mengikuti
 * izin pribadi sesi. Setiap kunjungan kepala tercatat
 * (lihat_kepala), jadi "dilihat n× dalam 30 hari" jujur.
 */
import type { KepalaPengguna } from '~/adapters/cashflowBuku'
import { angka, formatNomorWa, samarkanNomorWa } from '~/adapters/cashflow'

const props = defineProps<{ kepala: KepalaPengguna | null; memuat?: boolean; aksesKe: string; emailUtuh: string | null; izinPribadi: boolean }>()
const { tcf, formatTanggal } = useCashflowI18n()
const nomorUtuh = computed(() => props.izinPribadi ? formatNomorWa(props.kepala?.nomorWa) : null)
const nomorTampil = computed(() => nomorUtuh.value ?? samarkanNomorWa(props.kepala?.nomorWa))
const hitungan = computed(() => props.kepala
  ? [
      { label: tcf('pengguna.ruang'), n: props.izinPribadi ? props.kepala.jumlahRuang : null },
      { label: tcf('pengguna.tx'), n: props.izinPribadi ? props.kepala.jumlahTransaksi : null },
    ]
  : [])
</script>

<template>
  <section class="ca-console-dialog p-4 sm:p-5" :aria-busy="memuat">
    <div v-if="!kepala" class="space-y-2">
      <div class="h-6 w-56 max-w-full animate-pulse rounded bg-[var(--ca-panel-bg-strong)]" />
      <div class="h-4 w-72 max-w-full animate-pulse rounded bg-[var(--ca-panel-bg-strong)]" />
    </div>
    <template v-else>
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="break-all font-mono text-lg font-bold text-[var(--ca-text)] sm:text-xl">{{ emailUtuh ?? kepala.emailTersamar }}</h2>
        <CashflowSalinKontak v-if="emailUtuh" jenis="email" :nilai="emailUtuh" />
        <CashflowSalinId :id="kepala.id" />
        <span v-if="kepala.ditangguhkan" class="ca-pill-danger">{{ tcf('pengguna.ditangguhkan') }}</span>
      </div>
      <dl class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--ca-muted)]">
        <div><dt class="inline">{{ tcf('pengguna.daftar') }}</dt> <dd class="ml-1 inline text-[var(--ca-text)]">{{ formatTanggal(kepala.daftarIso) }}</dd></div>
        <div><dt class="inline">{{ tcf('pengguna.masuk') }}</dt> <dd class="ml-1 inline text-[var(--ca-text)]">{{ formatTanggal(kepala.masukTerakhirIso) }}</dd></div>
        <!-- Nomor WhatsApp: utuh untuk sesi ber-pii, tersamar bila tidak (keKepala);
             tanpa nomor barisnya tidak ada. -->
        <div v-if="nomorTampil">
          <dt class="inline">{{ tcf('pengguna.wa') }}</dt>
          <dd class="ml-1 inline-flex items-center gap-1 font-mono tabular-nums text-[var(--ca-text)]">
            {{ nomorTampil }}<CashflowSalinKontak v-if="nomorUtuh" jenis="wa" :nilai="nomorUtuh" />
          </dd>
        </div>
        <!-- Hitungan per orang hanya untuk sesi ber-pii (M/0089 §15 (d)); tanpa itu "—" (butuh TOTP), bukan "0". -->
        <div v-for="h in hitungan" :key="h.label">
          <dt class="inline">{{ h.label }}</dt>
          <dd v-if="h.n !== null" class="ml-1 inline tabular-nums text-[var(--ca-text)]">{{ angka(h.n) }}</dd>
          <dd v-else class="ml-1 inline text-[var(--ca-text)]" :title="tcf('umum.butuhTotp')">— <span class="text-xs text-[var(--ca-subtle)]">({{ tcf('umum.butuhTotp') }})</span></dd>
        </div>
        <div>
          <NuxtLink :to="aksesKe" class="underline-offset-2 hover:underline">{{ tcf('p360.dilihat')(kepala.akses30) }}</NuxtLink>
        </div>
      </dl>
    </template>
  </section>
</template>
