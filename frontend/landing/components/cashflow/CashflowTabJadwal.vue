<script setup lang="ts">
/**
 * Isi tab Ruang 360 › Jadwal (admin_jadwal_ruang, ranah jadwal): ringkas atas
 * SEMUA jadwal yang lolos saringan arsip (server), lalu daftar. Keadaan,
 * terlambat, dan jatuh tempo = angka server (tempo_sekarang, bukan next_due
 * yang bisa basi); di sini hanya ditampilkan. Klik baris = laci rincian
 * (?jadwal=, diurus halaman).
 */
import { rupiah } from '~/adapters/cashflow'
import { kunciKode, type JadwalRuang } from '~/adapters/cashflowRanahBuku'
import { PILIHAN_ARSIP, nadaKeadaan, progresJadwal, type PilihanArsip } from '~/adapters/cashflowTampilBuku'

const props = defineProps<{
  data: JadwalRuang
  arsip: PilihanArsip
  labelOrang: (uid: string | null) => string
  memuat?: boolean
}>()
const emit = defineEmits<{ arsip: [p: PilihanArsip]; buka: [id: string] }>()
const { tcf, formatTanggal } = useCashflowI18n()

const opsiArsip = computed(() => PILIHAN_ARSIP.map(p => ({ nilai: p, label: tcf(`jadwal.arsipOpsi.${p}`) as string })))
const RINGKAS = ['aktif', 'terlambat', 'selesai', 'arsip', 'cicilan', 'berulang'] as const
const baris = computed(() => props.data.baris.map(j => ({ j, p: progresJadwal(j) })))
const kelasNada: Record<string, string> = { bahaya: 'ca-pill-danger', emas: 'ca-pill-gold', hijau: 'ca-pill-emerald', netral: 'ca-pill-muted' }
</script>

<template>
  <div class="space-y-4" :class="{ 'opacity-60': memuat }" :aria-busy="memuat || undefined">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <CashflowSegmen :opsi="opsiArsip" :nilai="arsip" @pilih="p => emit('arsip', p)" />
      <dl class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--ca-muted)]">
        <div v-for="k in RINGKAS" :key="k" class="flex items-baseline gap-1">
          <dt>{{ tcf(`jadwal.ringkas.${k}`) }}</dt>
          <dd class="font-semibold tabular-nums" :class="k === 'terlambat' && data.ringkas.terlambat ? 'text-[var(--ca-danger-text)]' : 'text-[var(--ca-text)]'">{{ data.ringkas[k] }}</dd>
        </div>
      </dl>
    </div>
    <p class="text-xs text-[var(--ca-subtle)]">{{ tcf('jadwal.wib') }}</p>
    <p v-if="data.terpotong" class="text-xs text-[var(--ca-gold-text)]">{{ tcf('jadwal.potong') }}</p>

    <CashflowKeadaanKosong v-if="!baris.length" :pesan="tcf('jadwal.kosongSaring')" />
    <ul v-else class="ca-console-dialog divide-y divide-[color:var(--ca-border)] text-sm">
      <li v-for="{ j, p } in baris" :key="j.id">
        <button type="button" class="flex w-full flex-wrap items-start gap-x-4 gap-y-1 px-4 py-3 text-left hover:bg-[var(--ca-panel-bg-strong)]" @click="emit('buka', j.id)">
          <div class="min-w-0 flex-1 space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-medium text-[var(--ca-text)]">{{ j.judul }}</span>
              <span v-if="j.keadaan" class="text-[0.7rem]" :class="kelasNada[nadaKeadaan(j.keadaan)]">{{ tcf(`kode.keadaan.${kunciKode(j.keadaan)}`) }}</span>
              <span v-if="j.irama" class="ca-pill-muted text-[0.7rem]">{{ tcf(`kode.irama.${j.irama}`) }}</span>
              <span v-if="j.kodeTakDikenal" class="ca-pill-gold text-[0.7rem]">{{ tcf('kode.takDikenal') }}</span>
              <span v-if="j.adaCatatan" class="text-[var(--ca-subtle)]" :title="tcf('jadwal.adaCatatan')"><Icon name="lucide:sticky-note" class="h-3.5 w-3.5" aria-hidden="true" /><span class="sr-only">{{ tcf('jadwal.adaCatatan') }}</span></span>
            </div>
            <div v-if="p.jenis === 'cicilan'" class="flex items-center gap-2">
              <div class="h-1.5 w-40 max-w-full overflow-hidden rounded-full bg-[var(--ca-panel-bg-strong)]" role="meter" :aria-valuenow="p.persen ?? 0" aria-valuemin="0" aria-valuemax="100" :aria-label="j.judul">
                <div class="h-full rounded-full bg-[var(--ca-emerald-text)]" :style="{ width: `${p.persen}%` }" />
              </div>
              <span class="text-xs tabular-nums text-[var(--ca-text)]">{{ tcf('jadwal.dariTotal')(p.dibayar, p.total) }}</span>
            </div>
            <p class="text-xs text-[var(--ca-muted)]">
              <template v-if="p.jenis === 'berulang'">{{ tcf('jadwal.kaliBayar')(p.dibayar) }} · </template>
              <template v-if="p.dilewati">{{ tcf('jadwal.dilewati')(p.dilewati) }} · </template>
              <template v-if="j.penyesuaian">{{ tcf('jadwal.penyesuaian')(j.penyesuaian) }} · </template>
              {{ tcf('jadwal.dompet') }} {{ j.dompet }}<template v-if="j.kategori"> · {{ tcf('jadwal.kategori') }} {{ j.kategori }}</template>
              · {{ tcf('jadwal.pembuat') }} <span class="font-mono">{{ labelOrang(j.pembuat) }}</span>
            </p>
            <p v-if="j.pembayaranDiSampah" class="text-xs text-[var(--ca-gold-text)]">{{ tcf('jadwal.diSampah')(j.pembayaranDiSampah) }}</p>
            <p v-if="j.nextDueBasi && j.nextDue" class="text-xs text-[var(--ca-subtle)]">{{ tcf('jadwal.nextDueBasi')(formatTanggal(j.nextDue)) }}</p>
          </div>
          <div class="text-right">
            <CashflowNominal :nilai="j.nominal" :arah="j.arah" />
            <div class="mt-0.5 text-xs text-[var(--ca-muted)]">
              {{ tcf('jadwal.tempo') }}
              <span class="tabular-nums" :class="j.terlambat ? 'font-semibold text-[var(--ca-danger-text)]' : 'text-[var(--ca-text)]'">{{ formatTanggal(j.tempoSekarang) }}</span>
            </div>
          </div>
        </button>
      </li>
    </ul>
  </div>
</template>
