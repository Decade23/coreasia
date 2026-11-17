<script setup lang="ts">
/**
 * Ringkasan pembelian Google Play yang belum menjadi kredit, di atas daftar
 * saringan Sedang diproses dan Ditolak: berapa yang menunggu pembayaran, yang
 * belum bisa diperiksa, yang ditolak, dan sejak kapan yang paling lama
 * menunggu. Angkanya dari kunci `proses` jawaban server: semua catatan proses
 * tanpa akun uji, tidak mengikuti saringan jalur atau halaman yang tampil.
 *
 * Bila yang paling lama sudah lewat AMBANG_GANTUNG_MENIT, kalimatnya naik
 * jadi panel bernada awas yang tenang (bidang emas lembut, bukan merah). Di
 * saringan Ditolak panel itu membawa tombol ke saringan Sedang diproses.
 * Angka yang tidak dikirim server tertulis "Tidak tersedia", bukan 0.
 *
 * Hanya menampilkan; halaman yang memanggil server. `kiniMs` = saat jawaban
 * diterima, supaya lama menunggu dihitung tanpa pengatur waktu.
 */
import { angka } from '~/adapters/cashflow'
import {
  AMBANG_GANTUNG_MENIT, bagianLama, menitSejak, type HitunganProses, type StatusProsesPembelian,
} from '~/adapters/cashflowPembelian'

const props = defineProps<{ hitungan: HitunganProses; kiniMs: number; status: StatusProsesPembelian }>()
const emit = defineEmits<{ pilih: [status: StatusProsesPembelian] }>()
const { tcf, formatWaktu } = useCashflowI18n()

const nilai = (n: number | null) => (n === null ? tcf('pembelian.tidakTersedia') : angka(n))
const menit = computed(() => menitSejak(props.hitungan.tertuaIso, props.kiniMs))
const lama = computed(() => {
  if (menit.value === null) return ''
  const b = bagianLama(menit.value)
  return tcf('pembelian.proses.lama')(b.hari, b.jam, b.menit)
})
const perhatian = computed(() => menit.value !== null && menit.value > AMBANG_GANTUNG_MENIT)
</script>

<template>
  <section class="space-y-3" :aria-label="tcf('pembelian.proses.ringkasJudul')" data-uji="pembelian-proses-ringkas">
    <div class="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      <CashflowStatTile
        icon="lucide:hourglass" warna="sky" :label="tcf('pembelian.proses.ubin.diproses')"
        :nilai="nilai(hitungan.diproses)" :keterangan="tcf('pembelian.proses.ubin.diprosesKet')"
      />
      <CashflowStatTile
        icon="lucide:clock" warna="netral" :label="tcf('pembelian.proses.ubin.tertunda')"
        :nilai="nilai(hitungan.tertunda)" :keterangan="tcf('pembelian.proses.ubin.tertundaKet')"
      />
      <CashflowStatTile
        icon="lucide:refresh-ccw" warna="amber" :label="tcf('pembelian.proses.ubin.gagalSementara')"
        :nilai="nilai(hitungan.gagalSementara)" :keterangan="tcf('pembelian.proses.ubin.gagalSementaraKet')"
      />
      <CashflowStatTile
        icon="lucide:circle-slash" warna="netral" :label="tcf('pembelian.proses.ubin.ditolak')"
        :nilai="nilai(hitungan.ditolak)" :keterangan="tcf('pembelian.proses.ubin.ditolakKet')"
      />
    </div>

    <div
      v-if="perhatian && hitungan.tertuaIso"
      class="flex flex-wrap items-start gap-3 rounded-xl border border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)] px-4 py-3 text-sm"
      role="status" data-uji="pembelian-proses-perhatian"
    >
      <Icon name="lucide:clock-alert" class="mt-0.5 h-4 w-4 shrink-0 ca-tone-gold" aria-hidden="true" />
      <div class="min-w-0 flex-1">
        <p class="font-semibold text-[var(--ca-text)]">{{ tcf('pembelian.proses.perhatianJudul') }}</p>
        <p class="mt-0.5 text-[var(--ca-muted)]">{{ tcf('pembelian.proses.perhatian')(formatWaktu(hitungan.tertuaIso), lama) }}</p>
      </div>
      <button
        v-if="status === 'ditolak'" type="button" class="ca-btn-secondary shrink-0 text-xs"
        data-uji="pembelian-proses-lihat-diproses" @click="emit('pilih', 'diproses')"
      >{{ tcf('pembelian.proses.lihatDiproses') }}</button>
    </div>
    <p v-else-if="hitungan.tertuaIso" class="text-xs text-[var(--ca-muted)]" data-uji="pembelian-proses-tertua">
      {{ tcf('pembelian.proses.tertua')(formatWaktu(hitungan.tertuaIso), lama) }}
    </p>
    <p v-else-if="hitungan.diproses === 0" class="text-xs text-[var(--ca-muted)]">{{ tcf('pembelian.proses.tidakMenunggu') }}</p>

    <p class="flex items-start gap-2 text-xs text-[var(--ca-muted)]" data-uji="pembelian-proses-catatan">
      <Icon name="lucide:info" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ca-subtle)]" aria-hidden="true" />
      <span>{{ tcf('pembelian.proses.catatan') }}</span>
    </p>
  </section>
</template>
