<script setup lang="ts">
/**
 * Kepala Pengguna 360 — T0 (admin_pengguna_kepala): siapa orang ini tanpa
 * membuka isinya. Email utuh berasal dari data akun yang sudah dibaca
 * melalui kasus aktif. Nomor WhatsApp berasal dari kepala dan mengikuti
 * izin pribadi sesi. Setiap kunjungan kepala tercatat
 * (lihat_kepala), jadi "dilihat n× dalam 30 hari" jujur. Akun yang
 * ditangguhkan menulis sampai kapan, bila server mengirim tanggal yang wajar.
 */
import type { KepalaPengguna } from '~/adapters/cashflowBuku'
import { angka, formatNomorWa, samarkanNomorWa } from '~/adapters/cashflow'
import type { BawaanRinci } from '~/adapters/cashflowPenggunaDaftar'

/* `bawaan`: cara nomor dibuktikan dan terakhir pakai Domi, dibawa dari baris
   daftar pengguna (useCashflowBawaanRinci). null = halaman dibuka langsung. */
const props = defineProps<{ kepala: KepalaPengguna | null; memuat?: boolean; aksesKe: string; emailUtuh: string | null; izinPribadi: boolean; bawaan?: BawaanRinci | null }>()
const { tcf, formatTanggal } = useCashflowI18n()
const nomorUtuh = computed(() => props.izinPribadi ? formatNomorWa(props.kepala?.nomorWa) : null)
const nomorTampil = computed(() => nomorUtuh.value ?? samarkanNomorWa(props.kepala?.nomorWa))
const domiTerakhir = computed(() => {
  if (!props.izinPribadi || !props.bawaan) return null
  return props.bawaan.domiTerakhir ?? (props.bawaan.domiBelumPernah ? tcf('pengguna.domiBelum') : null)
})
/* Email dipotong di depan @ supaya di layar sempit pecahnya di sana, bukan di tengah kata. */
const emailPotong = computed(() => {
  const e = props.emailUtuh ?? props.kepala?.emailTersamar ?? ''
  const i = e.lastIndexOf('@')
  return i > 0 ? [e.slice(0, i), e.slice(i)] : [e, '']
})
const hitungan = computed(() => props.kepala
  ? [
      { label: tcf('pengguna.ruang'), n: props.izinPribadi ? props.kepala.jumlahRuang : null },
      { label: tcf('pengguna.tx'), n: props.izinPribadi ? props.kepala.jumlahTransaksi : null },
    ]
  : [])
</script>

<template>
  <section class="ca-console-dialog cf-kepala-rinci" :aria-busy="memuat">
    <div v-if="!kepala" class="space-y-2 p-4 sm:p-5">
      <div class="h-6 w-56 max-w-full animate-pulse rounded bg-[var(--ca-panel-bg-strong)]" />
      <div class="h-4 w-72 max-w-full animate-pulse rounded bg-[var(--ca-panel-bg-strong)]" />
    </div>
    <template v-else>
      <!-- Siapa, status, lalu aksi di kanan. -->
      <div class="flex flex-wrap items-start justify-between gap-x-5 gap-y-3 p-4 sm:p-5">
        <div class="min-w-0 flex-1 basis-64">
          <h2 class="cf-kepala-nama" data-uji="rinci-nama">{{ emailPotong[0] }}<wbr>{{ emailPotong[1] }}</h2>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <span v-if="kepala.ditangguhkan" class="cf-lencana cf-lencana-galat" data-uji="rinci-ditangguhkan">
              {{ tcf('pengguna.ditangguhkan') }}<template v-if="kepala.ditangguhkanSampaiIso"> {{ tcf('pengguna.sampaiTanggal')(formatTanggal(kepala.ditangguhkanSampaiIso)) }}</template>
            </span>
            <span v-else class="cf-lencana cf-lencana-baik">{{ tcf('pengguna.aktif') }}</span>
            <NuxtLink :to="aksesKe" class="text-xs font-semibold text-[var(--ca-subtle)] underline-offset-2 hover:text-[var(--ca-text)] hover:underline">{{ tcf('p360.dilihat')(kepala.akses30) }}</NuxtLink>
          </div>
        </div>
        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <CashflowSalinKontak v-if="emailUtuh" jenis="email" :nilai="emailUtuh" />
          <CashflowSalinId :id="kepala.id" />
        </div>
      </div>
      <dl class="cf-kepala-fakta">
        <div><dt>{{ tcf('pengguna.daftar') }}</dt><dd>{{ formatTanggal(kepala.daftarIso) }}</dd></div>
        <div><dt>{{ tcf('pengguna.masuk') }}</dt><dd>{{ formatTanggal(kepala.masukTerakhirIso) }}</dd></div>
        <!-- Nomor WhatsApp: utuh untuk sesi ber-pii, tersamar bila tidak (keKepala).
             Tanpa nomor barisnya tidak ada. -->
        <div v-if="nomorTampil">
          <dt>{{ tcf('pengguna.wa') }}</dt>
          <dd class="inline-flex items-center gap-1 whitespace-nowrap">
            {{ nomorTampil }}<CashflowSalinKontak v-if="nomorUtuh" jenis="wa" :nilai="nomorUtuh" class="!size-6" />
          </dd>
        </div>
        <!-- Hitungan per orang hanya untuk sesi ber-pii (M/0089 §15 (d)). Tanpa itu garis (butuh TOTP), bukan "0". -->
        <div v-for="h in hitungan" :key="h.label">
          <dt>{{ h.label }}</dt>
          <dd v-if="h.n !== null">{{ angka(h.n) }}</dd>
          <dd v-else :title="tcf('umum.butuhTotp')">— <span class="text-xs font-medium text-[var(--ca-subtle)]">({{ tcf('umum.butuhTotp') }})</span></dd>
        </div>
      </dl>
      <!-- Yang dulu kolom di daftar pengguna: cara nomor dibuktikan, terakhir pakai Domi, dan ID. -->
      <dl class="grid gap-x-6 gap-y-1.5 border-t border-[color:var(--ca-border)] px-4 py-3 text-sm sm:grid-cols-[auto_minmax(0,1fr)] sm:px-5" data-uji="rinci-dari-daftar">
        <dt class="text-[var(--ca-muted)]">{{ tcf('pengguna.rinci.caraBukti') }}</dt>
        <dd class="text-[var(--ca-text)]" data-uji="rinci-cara-bukti">
          <!-- Kalimat panjangnya (lewat pesan masuk, lewat kode terkirim, lewat saat gangguan) beserta tanggal dan tandanya. -->
          <CashflowStatusWaAkun v-if="bawaan?.statusWa" :status="bawaan.statusWa" baris />
          <span v-else class="text-[var(--ca-subtle)]">— <span class="text-xs">{{ tcf('pengguna.rinci.dariDaftar') }}</span></span>
        </dd>
        <dt class="text-[var(--ca-muted)]">{{ tcf('pengguna.rinci.domiTerakhir') }}</dt>
        <dd class="text-[var(--ca-text)]" data-uji="rinci-domi-terakhir">
          <template v-if="domiTerakhir">{{ domiTerakhir }}</template>
          <span v-else-if="!izinPribadi" class="text-[var(--ca-subtle)]" :title="tcf('umum.butuhTotp')">— <span class="text-xs">({{ tcf('umum.butuhTotp') }})</span></span>
          <span v-else class="text-[var(--ca-subtle)]">— <span class="text-xs">{{ tcf('pengguna.rinci.dariDaftar') }}</span></span>
        </dd>
        <dt class="text-[var(--ca-muted)]">{{ tcf('pengguna.rinci.id') }}</dt>
        <dd class="break-all font-mono text-xs leading-5 text-[var(--ca-text)]" data-uji="rinci-id">{{ kepala.id }}</dd>
      </dl>
    </template>
  </section>
</template>
