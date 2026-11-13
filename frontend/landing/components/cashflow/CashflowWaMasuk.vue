<script setup lang="ts">
/**
 * Angka cara terbalik di Kesehatan: pesan masuk 24 jam, pemakaian batas
 * harian, jendela gangguan 7 hari, dan ringkasan pengguna (lewat pesan masuk,
 * lewat kode terkirim, lewat saat gangguan, kredit ditahan, nomor ramai).
 *
 * Hanya tampilan, data dari CashflowStatusWa. Bagian yang kuncinya tidak
 * dikirim server disembunyikan. Semua angka agregat, tanpa data orang.
 */
import { angka } from '~/adapters/cashflow'
import { ANGKA_MASUK_WA, ANGKA_PENGGUNA_WA, SEGMEN_BELUM_WA, type CaraVerifikasiWa, type JendelaWa } from '~/adapters/cashflowWa'

const props = defineProps<{ cara: CaraVerifikasiWa }>()
const { tcf, formatWaktu } = useCashflowI18n()

/** Angka yang patut diperhatikan bila bukan nol. */
const PERHATIAN = new Set(['beda', 'tanpa_nomor', 'lid', 'habis', 'tak_dikenal', 'batas'])
const PERHATIAN_PENGGUNA = new Set(['lewat_gangguan_7h', 'kredit_ditahan', 'nomor_ramai_30h'])
const lamaTeks = (j: JendelaWa) => tcf('kesehatan.wa.terbalik.selama')(tcf('kesehatan.wa.terbalik.lama')(j.lama.n, j.lama.satuan))
const rentang = (j: JendelaWa) => (j.selesai
  ? tcf('kesehatan.wa.terbalik.rentang')(formatWaktu(j.mulai), formatWaktu(j.selesai))
  : tcf('kesehatan.wa.terbalik.sejak')(formatWaktu(j.mulai)))
const batasHabis = computed(() => {
  const b = props.cara.batasMasuk
  return !!b && b.harian !== null && b.terpakai >= b.harian
})
</script>

<template>
  <section class="ca-console-dialog p-5">
    <template v-if="cara.angka24j">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('kesehatan.wa.terbalik.angkaJudul') }}</h2>
        <p v-if="cara.batasMasuk" class="text-xs text-[var(--ca-subtle)]">
          {{ tcf('kesehatan.wa.terbalik.batasMasuk') }}:
          <span class="font-semibold tabular-nums" :class="batasHabis ? 'ca-tone-danger' : 'text-[var(--ca-text)]'">{{ angka(cara.batasMasuk.terpakai) }} / {{ cara.batasMasuk.harian === null ? '—' : angka(cara.batasMasuk.harian) }}</span>
        </p>
      </div>
      <dl class="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
        <div v-for="k in ANGKA_MASUK_WA" :key="k" class="min-w-0">
          <dt class="text-xs text-[var(--ca-subtle)]">{{ tcf(`kesehatan.wa.terbalik.angka.${k}`) }}</dt>
          <dd class="font-bold tabular-nums" :class="PERHATIAN.has(k) && cara.angka24j[k] ? 'ca-tone-gold' : k === 'berhasil' && cara.angka24j[k] ? 'ca-tone-emerald' : 'text-[var(--ca-text)]'">{{ angka(cara.angka24j[k]) }}</dd>
        </div>
      </dl>
    </template>

    <template v-if="cara.jendela">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]" :class="cara.angka24j ? 'mt-5' : ''">{{ tcf('kesehatan.wa.terbalik.jendelaJudul') }}</h3>
      <CashflowKeadaanKosong v-if="!cara.jendela.length" class="mt-2" :pesan="tcf('kesehatan.wa.terbalik.jendelaKosong')" icon="lucide:circle-check" />
      <ul v-else class="mt-2 space-y-2">
        <li
          v-for="j in cara.jendela" :key="j.mulai"
          class="rounded-xl px-3 py-2 text-sm"
          :class="j.berlangsung ? 'bg-[var(--ca-danger-bg)]' : 'bg-[var(--ca-panel-bg-strong)]'"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p class="font-semibold tabular-nums text-[var(--ca-text)]">{{ rentang(j) }}</p>
            <p class="text-xs" :class="j.berlangsung ? 'font-semibold ca-tone-danger' : 'text-[var(--ca-muted)]'">
              {{ j.berlangsung ? tcf('kesehatan.wa.terbalik.berlangsung') : lamaTeks(j) }}
            </p>
          </div>
          <div class="mt-1 flex flex-wrap items-center gap-1.5">
            <span v-for="k in j.lapis" :key="k" class="ca-pill-muted text-[0.7rem]">{{ tcf(`kesehatan.wa.terbalik.lapisPendek.${k}`) }}</span>
            <span class="text-xs" :class="j.wajib ? 'ca-tone-gold' : 'text-[var(--ca-subtle)]'">{{ j.wajib ? tcf('kesehatan.wa.terbalik.wajib') : tcf('kesehatan.wa.terbalik.tidakWajib') }}</span>
          </div>
        </li>
      </ul>
    </template>

    <template v-if="cara.pengguna">
      <div class="flex flex-wrap items-baseline justify-between gap-2" :class="cara.angka24j || cara.jendela ? 'mt-5' : ''">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('kesehatan.wa.terbalik.penggunaJudul') }}</h3>
        <NuxtLink :to="{ path: '/console/cashflow/pengguna', query: { seg: SEGMEN_BELUM_WA } }" class="text-xs font-semibold text-[var(--ca-text)] underline">{{ tcf('kesehatan.wa.terbalik.lihatBelum') }}</NuxtLink>
      </div>
      <dl class="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
        <div v-for="k in ANGKA_PENGGUNA_WA" :key="k" class="min-w-0">
          <dt class="text-xs text-[var(--ca-subtle)]">{{ tcf(`kesehatan.wa.terbalik.pengguna.${k}`) }}</dt>
          <dd class="font-bold tabular-nums" :class="PERHATIAN_PENGGUNA.has(k) && cara.pengguna[k] ? 'ca-tone-gold' : 'text-[var(--ca-text)]'">{{ angka(cara.pengguna[k]) }}</dd>
        </div>
      </dl>
      <p class="mt-2 text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.wa.terbalik.penggunaKet') }}</p>
    </template>
  </section>
</template>
