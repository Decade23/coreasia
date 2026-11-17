<script setup lang="ts">
/**
 * Satu baris di Kesehatan: berapa pembelian Google Play yang sedang
 * diproses dan berapa lama yang paling lama, dengan tautan ke halaman
 * Pembelian saringan Sedang diproses. Angkanya dari kunci `play_proses`
 * admin_kesehatan (agregat tanpa data orang, tanpa audit), jadi halaman tidak
 * perlu memanggil daftar pembelian yang mencatat audit.
 *
 * Nada: tenang bila menunggu, bidang emas lembut bila yang paling lama lewat
 * AMBANG_GANTUNG_MENIT. Tidak ada merah, karena pembayaran tertunda di Google
 * memang bisa makan waktu. Nol ditulis kecil supaya admin tahu sudah
 * diperiksa. Server lama (kunci tidak ada): halaman tidak memasang komponen
 * ini sama sekali.
 *
 * Hanya menampilkan, tidak memanggil server.
 */
import { bagianLama, keadaanGantung, TAUTAN_PEMBELIAN_DIPROSES, type PlayProsesKesehatan } from '~/adapters/cashflowPembelian'

const props = defineProps<{ ringkas: PlayProsesKesehatan }>()
const { tcf } = useCashflowI18n()

const keadaan = computed(() => keadaanGantung(props.ringkas))
const kalimat = computed(() => {
  const m = props.ringkas.tertuaMenit
  const lama = m === null ? null : (() => { const b = bagianLama(m); return tcf('pembelian.proses.lama')(b.hari, b.jam, b.menit) })()
  return tcf('kesehatan.play.menunggu')(props.ringkas.diproses, lama)
})
</script>

<template>
  <p
    v-if="keadaan === 'kosong'" class="flex items-center gap-2 text-xs text-[var(--ca-muted)]"
    role="status" data-uji="kesehatan-play-kosong"
  >
    <Icon name="lucide:circle-check" class="h-3.5 w-3.5 shrink-0 text-[var(--ca-subtle)]" aria-hidden="true" />
    <span>{{ tcf('kesehatan.play.kosong') }}</span>
  </p>
  <section
    v-else-if="keadaan"
    class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border px-4 py-3 text-sm"
    :class="keadaan === 'lama'
      ? 'border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)]'
      : 'border-[color:var(--ca-border)] bg-[var(--ca-surface)]'"
    role="status" :aria-label="tcf('kesehatan.play.label')" :data-uji="`kesehatan-play-${keadaan}`"
  >
    <Icon
      :name="keadaan === 'lama' ? 'lucide:clock-alert' : 'lucide:hourglass'" class="h-4 w-4 shrink-0"
      :class="keadaan === 'lama' ? 'ca-tone-gold' : 'text-[var(--ca-subtle)]'" aria-hidden="true"
    />
    <span class="min-w-[12rem] flex-1 text-[var(--ca-text)]" data-uji="kesehatan-play-kalimat">{{ kalimat }}</span>
    <NuxtLink
      :to="TAUTAN_PEMBELIAN_DIPROSES" class="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--ca-text)] underline"
      data-uji="kesehatan-play-tautan"
    >
      {{ tcf('kesehatan.play.lihat') }}<Icon name="lucide:chevron-right" class="h-3.5 w-3.5" aria-hidden="true" />
    </NuxtLink>
  </section>
</template>
