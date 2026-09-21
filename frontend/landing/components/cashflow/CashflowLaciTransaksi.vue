<script setup lang="ts">
/**
 * Isi laci ?tx=<uuid>: admin_transaksi_rinci (ranah transaksi) — satu
 * transaksi TANPA note, pasangan transfer, konteks struk/jadwal/produk (penuh
 * hanya bila ranahnya ada di kasus; selain itu "terbatas"), lampiran, dan
 * riwayat perubahan dari jejak (kunci kolom tanpa nilai). Bila id itu sudah
 * tidak hidup, server jatuh ke baris sampah (`sumber: 'sampah'`).
 *
 * Catatan (T3) lewat CashflowTeksTerkunci: jenis 'transaksi' untuk transaksi
 * hidup, 'sampah' (id baris sampah) untuk yang dihapus. Judul riwayat lewat
 * jenis 'jejak'. Pencatat & aktor bertaut ke Pengguna 360 orangnya — kasus
 * atas orang itu dibuka otomatis di sana (tercatat, ikut batas laju).
 */
import { keRinci, terbatas, tanggalJam, type TransaksiRinciDTO } from '~/adapters/cashflowBuku'
import { angka } from '~/adapters/cashflow'
import { jedaTiba } from '~/adapters/cashflowJejak'

const props = defineProps<{ tx: string; subjek: string; namaRuang: (id: string) => string }>()
const emit = defineEmits<{ pindah: [tx: string] }>()

const { tcf, bahasa, formatWaktu } = useCashflowI18n()
const api = useCashflowAdmin()
const kasus = useCashflowKasus()
const { memuat, galat, pesanGalat, muat } = useCashflowMuat()

const kunci = computed(() => (kasus.kunciKasus.value && kasus.punyaRanah('transaksi') ? `${kasus.kunciKasus.value}|rinci|${props.tx}` : null))
const mentah = computed(() => kasus.data<TransaksiRinciDTO>(kunci.value))
const r = computed(() => (mentah.value ? keRinci(mentah.value) : null))

watch(kunci, (k) => {
  if (!k || mentah.value) return
  const tx = props.tx
  muat(async () => { await kasus.muatData(k, kk => api.transaksiRinci(kk.id, tx)) })
}, { immediate: true })

const keOrang = (id: string) => `/console/cashflow/pengguna/${id}`
const labelOrang = (id: string | null) => (!id ? '—' : id === props.subjek ? tcf('laci.subjekIni') : id.slice(0, 8))
const teksJeda = (d: number | null) => {
  const j = jedaTiba(d)
  return j ? tcf('jejak.jedaTiba')(j.n, j.satuan) : ''
}
</script>

<template>
  <CashflowPanelTab ranah="transaksi" :memuat="memuat" :galat="galat" :pesan-galat="pesanGalat" :ada-data="!!r">
    <div v-if="r" class="space-y-5 text-sm">
      <!-- Ringkas -->
      <section>
        <div class="flex flex-wrap items-center gap-2">
          <CashflowNominal class="text-xl font-bold" :nilai="r.nominal" :jenis="r.jenis" :arah="r.arah" />
          <span v-if="r.sumber === 'sampah'" class="ca-pill-danger">{{ tcf('laci.diSampah') }}</span>
          <span v-if="r.jenis === 'transfer'" class="ca-pill-info">{{ tcf('transaksi.transfer') }}</span>
          <span v-if="r.masaDepan" class="ca-pill-gold">{{ tcf('transaksi.masaDepan') }}</span>
        </div>
        <dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          <dt class="text-[var(--ca-muted)]">{{ tcf('transaksi.tanggal') }}</dt><dd class="text-[var(--ca-text)]">{{ tanggalJam(r.tanggal, r.jam, bahasa) }}</dd>
          <dt class="text-[var(--ca-muted)]">{{ tcf('transaksi.ruang') }}</dt><dd class="flex items-center gap-1 text-[var(--ca-text)]">{{ namaRuang(r.ruangId) }} <CashflowSalinId :id="r.ruangId" ikon /></dd>
          <dt class="text-[var(--ca-muted)]">{{ tcf('transaksi.dompet') }}</dt><dd class="text-[var(--ca-text)]">{{ r.dompet }}</dd>
          <template v-if="r.kategori"><dt class="text-[var(--ca-muted)]">{{ tcf('transaksi.kategori') }}</dt><dd class="text-[var(--ca-text)]">{{ r.kategori }}</dd></template>
          <dt class="text-[var(--ca-muted)]">{{ tcf('laci.pencatat') }}</dt>
          <dd class="text-[var(--ca-text)]">
            <NuxtLink v-if="r.pencatat && r.pencatat !== subjek" :to="keOrang(r.pencatat)" class="font-mono underline-offset-2 hover:underline">{{ labelOrang(r.pencatat) }}</NuxtLink>
            <span v-else>{{ labelOrang(r.pencatat) }}</span>
          </dd>
          <template v-if="r.cicilanKe != null"><dt class="text-[var(--ca-muted)]">{{ tcf('laci.cicilan') }}</dt><dd class="tabular-nums text-[var(--ca-text)]">{{ r.cicilanKe }}</dd></template>
          <template v-if="r.qty != null"><dt class="text-[var(--ca-muted)]">{{ tcf('laci.qty') }}</dt><dd class="tabular-nums text-[var(--ca-text)]">{{ angka(r.qty) }}</dd></template>
          <template v-if="r.dibuatIso"><dt class="text-[var(--ca-muted)]">{{ tcf('laci.dibuat') }}</dt><dd class="text-[var(--ca-text)]">{{ formatWaktu(r.dibuatIso) }} WIB</dd></template>
          <template v-if="r.dicatatPerangkatIso"><dt class="text-[var(--ca-muted)]">{{ tcf('laci.diPerangkat') }}</dt><dd class="text-[var(--ca-text)]">{{ formatWaktu(r.dicatatPerangkatIso) }} WIB</dd></template>
          <template v-if="r.diubahIso"><dt class="text-[var(--ca-muted)]">{{ tcf('laci.diubah') }}</dt><dd class="text-[var(--ca-text)]">{{ formatWaktu(r.diubahIso) }} WIB</dd></template>
          <template v-if="r.dihapusIso">
            <dt class="text-[var(--ca-muted)]">{{ tcf('laci.dihapus') }}</dt>
            <dd class="text-[var(--ca-text)]">{{ formatWaktu(r.dihapusIso) }} WIB · {{ labelOrang(r.dihapusOleh) }}</dd>
          </template>
          <template v-if="r.dipulihkanIso"><dt class="text-[var(--ca-muted)]">{{ tcf('laci.dipulihkan') }}</dt><dd class="text-[var(--ca-text)]">{{ formatWaktu(r.dipulihkanIso) }} WIB</dd></template>
          <dt class="text-[var(--ca-muted)]">{{ tcf('laci.id') }}</dt><dd><CashflowSalinId :id="r.id" /></dd>
        </dl>
      </section>

      <!-- Catatan (T3) -->
      <section v-if="r.adaCatatan">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('teks.label.transaksi') }}</h4>
        <div class="mt-1">
          <CashflowTeksTerkunci v-if="r.sumber === 'sampah' && r.sampahId" jenis="sampah" :id="r.sampahId" />
          <CashflowTeksTerkunci v-else jenis="transaksi" :id="r.id" />
        </div>
      </section>

      <!-- Pasangan transfer -->
      <section v-if="r.pasangan.length">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('laci.pasangan') }}</h4>
        <ul class="mt-1 space-y-1">
          <li v-for="p in r.pasangan" :key="p.id">
            <button type="button" class="flex w-full items-center justify-between gap-3 rounded-lg border border-[color:var(--ca-border)] px-3 py-2 text-left hover:bg-[var(--ca-panel-bg-strong)]" @click="emit('pindah', p.id)">
              <span class="text-[var(--ca-text)]">{{ p.dompet }}</span>
              <CashflowNominal :nilai="p.nominal" jenis="transfer" :arah="p.arah" />
            </button>
          </li>
        </ul>
      </section>

      <!-- Konteks ranah lain -->
      <section v-if="r.grup || r.jadwal || r.produk || r.lampiran.adaBukti || r.lampiran.jumlah">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('laci.konteks') }}</h4>
        <ul class="mt-1 space-y-1 text-[var(--ca-text)]">
          <li v-if="r.grup">
            {{ tcf('laci.struk') }}
            <span v-if="terbatas(r.grup)" class="text-xs text-[var(--ca-subtle)]">· {{ tcf('laci.terbatas')(tcf('ranah.struk')) }}</span>
            <span v-else class="text-xs text-[var(--ca-muted)]">· {{ r.grup.ocr_status || '—' }} · {{ tcf('laci.baris')(r.grup.jumlah_baris) }}</span>
          </li>
          <li v-if="r.jadwal">
            {{ tcf('laci.jadwal') }}: {{ r.jadwal.nama || '—' }}
            <span v-if="terbatas(r.jadwal)" class="text-xs text-[var(--ca-subtle)]">· {{ tcf('laci.terbatas')(tcf('ranah.jadwal')) }}</span>
            <span v-else class="text-xs tabular-nums text-[var(--ca-muted)]">· {{ r.jadwal.paid_count ?? 0 }}/{{ r.jadwal.total_count ?? '∞' }}</span>
          </li>
          <li v-if="r.produk">
            {{ tcf('laci.produk') }}: {{ r.produk.nama || '—' }}
            <span v-if="terbatas(r.produk)" class="text-xs text-[var(--ca-subtle)]">· {{ tcf('laci.terbatas')(tcf('ranah.usaha')) }}</span>
          </li>
          <li v-if="r.lampiran.adaBukti || r.lampiran.jumlah">{{ tcf('laci.lampiran')(r.lampiran.jumlah ?? (r.lampiran.adaBukti ? 1 : 0)) }}</li>
        </ul>
      </section>

      <!-- Riwayat perubahan -->
      <section>
        <h4 class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('laci.riwayat') }}</h4>
        <p v-if="!r.riwayat.length" class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('laci.riwayatKosong') }}</p>
        <ol v-else class="mt-1 space-y-2 border-l border-[color:var(--ca-border)] pl-3">
          <li v-for="h in r.riwayat" :key="h.id" class="text-xs">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span class="tabular-nums text-[var(--ca-subtle)]">{{ formatWaktu(h.padaIso) }}</span>
              <span class="rounded-full bg-[var(--ca-panel-bg-strong)] px-2 font-mono text-[var(--ca-muted)]">{{ tcf(`jejak.jenisOpsi.${h.jenis}`) }}</span>
              <NuxtLink v-if="h.aktor && h.aktor !== subjek" :to="keOrang(h.aktor)" class="font-mono text-[var(--ca-muted)] underline-offset-2 hover:underline">{{ labelOrang(h.aktor) }}</NuxtLink>
              <span v-else class="text-[var(--ca-muted)]">{{ labelOrang(h.aktor) }}</span>
              <span v-if="teksJeda(h.jedaTiba)" class="ca-pill-gold">{{ teksJeda(h.jedaTiba) }}</span>
            </div>
            <div v-if="h.kunci.length" class="mt-0.5 flex flex-wrap gap-1">
              <span v-for="k in h.kunci" :key="k" class="rounded bg-[var(--ca-chip-bg)] px-1.5 font-mono text-[0.7rem] text-[var(--ca-muted)]">{{ k }}</span>
            </div>
            <div v-if="h.adaJudul" class="mt-1"><CashflowTeksTerkunci jenis="jejak" :id="h.id" /></div>
          </li>
        </ol>
      </section>
    </div>
  </CashflowPanelTab>
</template>
