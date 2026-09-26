<script setup lang="ts">
/**
 * Isi laci ?jadwal=<uuid> di Ruang 360 › Jadwal: admin_jadwal_rinci (ranah
 * jadwal). Jadwal (bentuk baris daftar), periode yang dilewati (kode alasan,
 * K-F3-2), penyesuaian, pembayaran cicilan, dan pembayaran di sampah.
 *
 * Isi ranah lain mengikuti server (spek §2.8, K-F3-12):
 *   rinci.pembayaran false  kasus tanpa ranah transaksi → hanya nomor
 *                           cicilan, tanggal, nominal; rinciannya di tab
 *                           Transaksi (tidak ada tautan per baris karena id
 *                           transaksinya memang tidak dikirim);
 *   rinci.diSampah false    kasus tanpa ranah jejak → hanya hitungan
 *                           jadwal.pembayaranDiSampah, bertaut ke tab Sampah.
 * Catatan jadwal/transaksi tidak pernah dikirim (hanya penanda ada_catatan).
 */
import { rupiah } from '~/adapters/cashflow'
import { kunciKode } from '~/adapters/cashflowRanahBuku'
import { progresJadwal } from '~/adapters/cashflowTampilBuku'

const props = defineProps<{
  jadwal: string
  /** Akar rute ruang, untuk tautan tab Transaksi/Sampah. */
  dasar: string
  labelOrang: (uid: string | null) => string
}>()
const emit = defineEmits<{ judul: [judul: string] }>()
const { tcf, formatTanggal, formatWaktu } = useCashflowI18n()
const r = useCashflowRanahBuku().jadwalRinci(() => props.jadwal)
const d = computed(() => r.data.value)
const p = computed(() => (d.value ? progresJadwal(d.value.jadwal) : null))
watch(() => d.value?.jadwal.judul, (j) => { if (j) emit('judul', j) }, { immediate: true })

const jangkar = computed(() => {
  const j = d.value?.jadwal
  if (!j) return ''
  return [j.bulanJangkar != null ? tcf('jadwal.bulan')(j.bulanJangkar) : '', j.hariJangkar != null ? tcf('jadwal.hari')(j.hariJangkar) : ''].filter(Boolean).join(' · ') || '—'
})
const keTx = (id: string) => `${props.dasar}/transaksi?tx=${id}`
</script>

<template>
  <div class="space-y-5 text-sm">
    <p v-if="r.pesanGalat.value" class="text-sm text-[var(--ca-danger-text)]" role="alert">{{ r.pesanGalat.value }}</p>
    <p v-else-if="!d" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>
    <template v-else>
      <section class="space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <CashflowNominal :nilai="d.jadwal.nominal" :arah="d.jadwal.arah" />
          <span v-if="d.jadwal.keadaan" class="ca-pill-muted text-[0.7rem]">{{ tcf(`kode.keadaan.${kunciKode(d.jadwal.keadaan)}`) }}</span>
          <span v-if="d.jadwal.adaCatatan" class="ca-pill-muted text-[0.7rem]">{{ tcf('jadwal.adaCatatan') }}</span>
          <CashflowSalinId :id="d.jadwal.id" ikon />
        </div>
        <div v-if="p?.jenis === 'cicilan'" class="space-y-1">
          <div class="h-2 overflow-hidden rounded-full bg-[var(--ca-panel-bg-strong)]" role="meter" :aria-valuenow="p.persen ?? 0" aria-valuemin="0" aria-valuemax="100" :aria-label="d.jadwal.judul">
            <div class="h-full rounded-full bg-[var(--ca-emerald-text)]" :style="{ width: `${p.persen}%` }" />
          </div>
          <p class="text-xs tabular-nums text-[var(--ca-text)]">
            {{ tcf('jadwal.dariTotal')(p.dibayar, p.total) }}<template v-if="p.dilewati"> · {{ tcf('jadwal.dilewati')(p.dilewati) }}</template>
          </p>
        </div>
        <p v-else-if="p" class="text-xs text-[var(--ca-text)]">{{ tcf('jadwal.kaliBayar')(p.dibayar) }}<template v-if="p.dilewati"> · {{ tcf('jadwal.dilewati')(p.dilewati) }}</template></p>
        <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt class="text-[var(--ca-muted)]">{{ tcf('jadwal.tempo') }}</dt>
          <dd class="tabular-nums" :class="d.jadwal.terlambat ? 'font-semibold text-[var(--ca-danger-text)]' : 'text-[var(--ca-text)]'">{{ formatTanggal(d.jadwal.tempoSekarang) }}</dd>
          <dt class="text-[var(--ca-muted)]">{{ tcf('jadwal.rinci.irama') }}</dt>
          <dd class="text-[var(--ca-text)]">{{ d.jadwal.irama ? tcf(`kode.irama.${d.jadwal.irama}`) : '—' }} · {{ tcf('jadwal.rinci.jangkar') }} {{ jangkar }}</dd>
          <dt class="text-[var(--ca-muted)]">{{ tcf('jadwal.rinci.mulai') }}</dt>
          <dd class="text-[var(--ca-text)]">{{ formatTanggal(d.jadwal.mulai) }}</dd>
          <dt class="text-[var(--ca-muted)]">{{ tcf('jadwal.dompet') }}</dt>
          <dd class="text-[var(--ca-text)]">{{ d.jadwal.dompet }}<template v-if="d.jadwal.kategori"> · {{ d.jadwal.kategori }}</template></dd>
          <template v-if="d.jadwal.sebagian">
            <dt class="text-[var(--ca-muted)]">{{ tcf('jadwal.rinci.sebagian') }}</dt>
            <dd class="tabular-nums text-[var(--ca-text)]">{{ rupiah(d.jadwal.sebagian) }}</dd>
          </template>
          <dt class="text-[var(--ca-muted)]">{{ tcf('jadwal.rinci.dibayarTercatat') }}</dt>
          <dd class="tabular-nums text-[var(--ca-text)]">{{ rupiah(d.jadwal.dibayarTercatat) }}<template v-if="d.jadwal.dibayarAwal"> · {{ tcf('jadwal.rinci.dibayarAwal') }} {{ rupiah(d.jadwal.dibayarAwal) }}</template></dd>
          <template v-if="d.jadwal.progressResetIso">
            <dt class="text-[var(--ca-muted)]">{{ tcf('jadwal.rinci.reset') }}</dt>
            <dd class="text-[var(--ca-text)]">{{ formatWaktu(d.jadwal.progressResetIso) }}</dd>
          </template>
          <dt class="text-[var(--ca-muted)]">{{ tcf('jadwal.rinci.dibuat') }}</dt>
          <dd class="text-[var(--ca-text)]">{{ formatWaktu(d.jadwal.dibuatIso) }} · <span class="font-mono">{{ labelOrang(d.jadwal.pembuat) }}</span></dd>
        </dl>
        <p v-if="d.jadwal.nextDueBasi && d.jadwal.nextDue" class="text-xs text-[var(--ca-subtle)]">{{ tcf('jadwal.nextDueBasi')(formatTanggal(d.jadwal.nextDue)) }}</p>
      </section>

      <section class="space-y-2">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('jadwal.rinci.pembayaran') }} · {{ d.jadwal.pembayaran }}</h3>
        <p v-if="!d.rinci.pembayaran" class="text-xs text-[var(--ca-subtle)]">{{ tcf('jadwal.rinci.pembayaranRingkasKet') }}</p>
        <CashflowKeadaanKosong v-if="!d.pembayaran.length" :pesan="tcf('jadwal.rinci.pembayaranKosong')" />
        <ol v-else class="divide-y divide-[color:var(--ca-border)]">
          <li v-for="(b, i) in d.pembayaran" :key="b.id ?? `${b.tanggal}-${i}`">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2">
              <span class="w-24 shrink-0 text-xs tabular-nums text-[var(--ca-subtle)]">{{ formatTanggal(b.tanggal) }}</span>
              <span class="min-w-0 flex-1 text-[var(--ca-text)]">
                {{ b.cicilanKe != null ? tcf('jadwal.rinci.cicilanKe')(b.cicilanKe) : tcf('jadwal.rinci.tanpaNo') }}
                <span v-if="b.periode && b.periode > 1" class="text-xs text-[var(--ca-muted)]"> · {{ tcf('jadwal.rinci.menutup')(b.periode) }}</span>
                <span v-if="b.rinci" class="text-xs text-[var(--ca-muted)]"> · <span class="font-mono">{{ labelOrang(b.pencatat) }}</span></span>
                <Icon v-if="b.adaCatatan" name="lucide:sticky-note" class="ml-1 inline h-3.5 w-3.5 text-[var(--ca-subtle)]" :aria-label="tcf('jadwal.adaCatatan')" />
              </span>
              <CashflowNominal :nilai="b.nominal" :jenis="b.jenis" :arah="b.jenis ? null : d.jadwal.arah" />
              <NuxtLink v-if="b.id" :to="keTx(b.id)" class="text-xs text-[var(--ca-muted)] underline-offset-2 hover:underline">{{ tcf('jadwal.rinci.bukaTx') }}</NuxtLink>
            </div>
          </li>
        </ol>
        <p v-if="d.pembayaranLebih" class="text-xs text-[var(--ca-subtle)]">{{ tcf('jadwal.rinci.lebih')(200) }}</p>
      </section>

      <section class="space-y-2">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('jadwal.rinci.lewati') }} · {{ d.lewati.length }}</h3>
        <p v-if="!d.lewati.length" class="text-xs text-[var(--ca-muted)]">{{ tcf('jadwal.rinci.lewatiKosong') }}</p>
        <ul v-else class="divide-y divide-[color:var(--ca-border)]">
          <li v-for="x in d.lewati" :key="x.id" class="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2">
            <span class="w-24 shrink-0 text-xs tabular-nums text-[var(--ca-subtle)]">{{ formatTanggal(x.jatuhTempo) }}</span>
            <span class="min-w-0 flex-1 text-[var(--ca-text)]">
              {{ tcf('jadwal.rinci.periodeKe')(x.periode) }} ·
              {{ x.kodeTakDikenal ? tcf('kode.takDikenal') : x.alasan ? tcf(`kode.alasanLewati.${x.alasan}`) : '—' }}
            </span>
            <span class="text-xs text-[var(--ca-muted)]">{{ formatWaktu(x.dibuatIso) }} · <span class="font-mono">{{ labelOrang(x.oleh) }}</span></span>
          </li>
        </ul>
        <p v-if="d.lewatiLebih" class="text-xs text-[var(--ca-subtle)]">{{ tcf('jadwal.rinci.lebih')(600) }}</p>
      </section>

      <section class="space-y-2">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('jadwal.rinci.penyesuaian') }} · {{ d.jadwal.penyesuaian }}</h3>
        <p v-if="!d.penyesuaian.length" class="text-xs text-[var(--ca-muted)]">{{ tcf('jadwal.rinci.penyesuaianKosong') }}</p>
        <ul v-else class="divide-y divide-[color:var(--ca-border)]">
          <li v-for="x in d.penyesuaian" :key="x.id" class="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2">
            <span class="w-24 shrink-0 text-xs tabular-nums text-[var(--ca-subtle)]">{{ formatWaktu(x.dibuatIso) }}</span>
            <span class="min-w-0 flex-1 text-[var(--ca-text)]">
              {{ x.arah ? tcf(`kode.arah.${x.arah}`) : '—' }} ·
              {{ x.kodeTakDikenal && x.sebab === 'lain' ? tcf('kode.takDikenal') : x.sebab ? tcf(`kode.sebabPenyesuaian.${x.sebab}`) : '—' }}
              <template v-if="x.periodeKe != null"> · {{ tcf('jadwal.rinci.periodeKe')(x.periodeKe) }}</template>
              · <span class="font-mono text-xs text-[var(--ca-muted)]">{{ labelOrang(x.oleh) }}</span>
            </span>
            <span class="tabular-nums" :class="x.arah === 'kurang' ? 'text-[var(--ca-emerald-text)]' : 'text-[var(--ca-text)]'">{{ x.arah === 'kurang' ? '−' : x.arah === 'tambah' ? '+' : '' }}{{ rupiah(x.nominal) }}</span>
            <NuxtLink v-if="x.txId && d.rinci.pembayaran" :to="keTx(x.txId)" class="text-xs text-[var(--ca-muted)] underline-offset-2 hover:underline">{{ tcf('jadwal.rinci.bukaTx') }}</NuxtLink>
          </li>
        </ul>
        <p v-if="d.penyesuaianLebih" class="text-xs text-[var(--ca-subtle)]">{{ tcf('jadwal.rinci.lebih')(200) }}</p>
      </section>

      <section v-if="d.rinci.diSampah || d.jadwal.pembayaranDiSampah" class="space-y-2">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('jadwal.rinci.sampah') }}</h3>
        <template v-if="d.rinci.diSampah">
          <p v-if="!d.diSampah.length" class="text-xs text-[var(--ca-muted)]">{{ tcf('jadwal.rinci.sampahKosong') }}</p>
          <ul v-else class="divide-y divide-[color:var(--ca-border)]">
            <li v-for="s in d.diSampah" :key="s.id" class="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2">
              <span class="w-24 shrink-0 text-xs tabular-nums text-[var(--ca-subtle)]">{{ formatTanggal(s.tanggal) }}</span>
              <span class="min-w-0 flex-1 text-[var(--ca-text)]">
                <span :class="s.dipulihkan ? 'ca-pill-emerald' : 'ca-pill-danger'" class="text-[0.7rem]">{{ s.dipulihkan ? tcf('jadwal.rinci.dipulihkan') : tcf('jadwal.rinci.dihapus') }}</span>
                <span class="ml-1 text-xs text-[var(--ca-muted)]">{{ formatWaktu(s.dihapusIso) }} {{ tcf('jadwal.rinci.oleh') }} <span class="font-mono">{{ labelOrang(s.dihapusOleh) }}</span></span>
              </span>
              <span class="tabular-nums text-[var(--ca-text)]">{{ rupiah(s.nominal) }}</span>
            </li>
          </ul>
          <p v-if="d.diSampahLebih" class="text-xs text-[var(--ca-subtle)]">{{ tcf('jadwal.rinci.lebih')(50) }}</p>
        </template>
        <NuxtLink v-else :to="`${dasar}/sampah`" class="block text-xs text-[var(--ca-gold-text)] underline-offset-2 hover:underline">{{ tcf('jadwal.rinci.sampahRingkas')(d.jadwal.pembayaranDiSampah) }}</NuxtLink>
      </section>
    </template>
  </div>
</template>
