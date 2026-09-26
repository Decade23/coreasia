<script setup lang="ts">
/**
 * Isi tab Pengguna 360 › Kabar (admin_kabar_pengguna, ranah kabar): ringkas
 * dan setelan per ruang (halaman pertama, dipegang halaman), saringan, lalu
 * kotak masuk satu halaman.
 *
 * Yang tidak datang dari server: nama tampilan pengirim (hanya
 * `ada_nama_aktor`, K-F3-3), judul di luar kategori (tx.*) dan peran
 * (peran.ubah), kunci isi di luar cacah/masuk/keluar/pencatat. Jenis dan
 * peran diterjemahkan lewat i18n; kode asing = "Kode tidak dikenal".
 * Saringan di memori (halaman), tidak ke URL.
 */
import { rupiah, angka } from '~/adapters/cashflow'
import { JENIS_KABAR, type Kabar, type RingkasKabar, type SaringKabar, type SetelanKabar } from '~/adapters/cashflowPerangkat'
import { kunciKode } from '~/adapters/cashflowRanahBuku'
import { PILIHAN_BACA_KABAR, belumDariPilihan, pilihanDariBelum } from '~/adapters/cashflowTampilBuku'

const props = defineProps<{
  baris: Kabar[]
  ringkas: RingkasKabar | null
  setelan: SetelanKabar[] | null
  saring: SaringKabar
  /** Ruang lingkup kasus untuk saringan. */
  ruang: readonly string[]
  namaRuang: (ws: string) => string
  /** Akar rute subjek (tautan laci transaksi). */
  dasar: string
  memuat?: boolean
}>()
const emit = defineEmits<{ saring: [s: SaringKabar] }>()
const { tcf, formatWaktu, formatTanggal } = useCashflowI18n()

const ubah = (u: Partial<SaringKabar>) => emit('saring', { ...props.saring, ...u })
const adaSaring = computed(() => props.saring.ruang !== null || props.saring.jenis !== null || props.saring.belum !== null)
const opsiBaca = computed(() => PILIHAN_BACA_KABAR.map(p => ({ nilai: p, label: tcf(`kabar.saring.baca.${p}`) as string })))
const pilihRuang = (e: Event) => {
  const v = (e.target as HTMLSelectElement).value
  ubah({ ruang: props.ruang.includes(v) ? v : null })
}
const pilihJenis = (e: Event) => {
  const v = (e.target as HTMLSelectElement).value
  ubah({ jenis: (JENIS_KABAR as readonly string[]).includes(v) ? (v as SaringKabar['jenis']) : null })
}
const labelJenis = (j: Kabar['jenis']) => tcf(`kode.jenisKabar.${kunciKode(j)}`)
const ikonJenis = (j: Kabar['jenis']) => ({
  'tx.hapus': 'lucide:trash-2', 'tx.besar': 'lucide:trending-up', 'anggota.masuk': 'lucide:user-plus', 'peran.ubah': 'lucide:shield', rangkuman: 'lucide:calendar-days',
} as Record<string, string>)[j] ?? 'lucide:bell'
const keTx = (tx: string) => `${props.dasar}/transaksi?tx=${tx}`
const ISI = ['cacah', 'masuk', 'keluar', 'pencatat'] as const
const nilaiIsi = (k: typeof ISI[number], n: number) => (k === 'masuk' || k === 'keluar' ? rupiah(n) : angka(n))
const SETELAN = ['hapus', 'masuk', 'peran'] as const
const JENIS_RINGKAS = [...JENIS_KABAR, 'lain'] as const
const isiAda = (k: Kabar) => (k.isi ? ISI.filter(x => k.isi![x] != null).map(x => ({ kunci: x, nilai: nilaiIsi(x, k.isi![x]!) })) : [])
</script>

<template>
  <div class="space-y-5" :class="{ 'opacity-60': memuat }" :aria-busy="memuat || undefined">
    <dl v-if="ringkas" class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--ca-muted)]">
      <div class="flex items-baseline gap-1"><dt>{{ tcf('kabar.ringkas.total') }}</dt><dd class="font-semibold tabular-nums text-[var(--ca-text)]">{{ angka(ringkas.total) }}</dd></div>
      <div class="flex items-baseline gap-1">
        <dt>{{ tcf('kabar.ringkas.belum') }}</dt>
        <dd class="font-semibold tabular-nums" :class="ringkas.belumDibaca ? 'text-[var(--ca-gold-text)]' : 'text-[var(--ca-text)]'">{{ angka(ringkas.belumDibaca) }}</dd>
      </div>
      <template v-for="j in JENIS_RINGKAS" :key="j">
        <div v-if="j !== 'lain' || ringkas.perJenis.lain" class="flex items-baseline gap-1">
          <dt>{{ labelJenis(j) }}</dt><dd class="tabular-nums text-[var(--ca-text)]">{{ angka(ringkas.perJenis[j]) }}</dd>
        </div>
      </template>
    </dl>

    <section v-if="setelan" class="space-y-2">
      <div>
        <h3 class="text-sm font-semibold text-[var(--ca-text)]">{{ tcf('kabar.setelan') }}</h3>
        <p class="text-xs text-[var(--ca-subtle)]">{{ tcf('kabar.setelanKet') }}</p>
      </div>
      <CashflowKeadaanKosong v-if="!setelan.length" icon="lucide:settings" :pesan="tcf('kabar.setelanKosong')" />
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="text-[var(--ca-muted)]">
            <tr>
              <th class="py-1 pr-3 font-medium">{{ tcf('kabar.kolom.ruang') }}</th>
              <th v-for="k in SETELAN" :key="k" class="py-1 pr-3 font-medium">{{ tcf(`kabar.kolom.${k}`) }}</th>
              <th class="py-1 pr-3 font-medium">{{ tcf('kabar.kolom.ambang') }}</th>
              <th class="py-1 font-medium">{{ tcf('kabar.kolom.rangkuman') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[color:var(--ca-border)] text-[var(--ca-text)]">
            <tr v-for="s in setelan" :key="s.ruangId">
              <td class="py-1.5 pr-3">
                {{ namaRuang(s.ruangId) }}
                <span v-if="!s.tersimpan" class="ca-pill-muted ml-1 text-[0.65rem]">{{ tcf('kabar.bawaan') }}</span>
              </td>
              <td v-for="k in SETELAN" :key="k" class="py-1.5 pr-3" :class="s[k] ? '' : 'text-[var(--ca-muted)]'">{{ s[k] ? tcf('kabar.nyala') : tcf('kabar.mati') }}</td>
              <td class="py-1.5 pr-3 tabular-nums">{{ s.ambang == null ? tcf('kabar.tanpaAmbang') : rupiah(s.ambang) }}</td>
              <td class="py-1.5 tabular-nums">{{ s.rangkumanJam == null ? '—' : tcf('kabar.jam')(s.rangkumanJam, s.zona ?? 'WIB') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div class="flex flex-wrap items-center gap-2">
      <CashflowSegmen :opsi="opsiBaca" :nilai="pilihanDariBelum(saring.belum)" @pilih="p => ubah({ belum: belumDariPilihan(p) })" />
      <select class="ca-input" :value="saring.jenis ?? ''" :aria-label="tcf('kabar.saring.jenis')" @change="pilihJenis">
        <option value="">{{ tcf('kabar.saring.jenis') }}</option>
        <option v-for="j in JENIS_KABAR" :key="j" :value="j">{{ labelJenis(j) }}</option>
      </select>
      <select v-if="ruang.length > 1" class="ca-input" :value="saring.ruang ?? ''" :aria-label="tcf('kabar.saring.ruang')" @change="pilihRuang">
        <option value="">{{ tcf('kabar.saring.ruang') }}</option>
        <option v-for="w in ruang" :key="w" :value="w">{{ namaRuang(w) }}</option>
      </select>
    </div>

    <CashflowKeadaanKosong v-if="!baris.length" icon="lucide:bell-off" :pesan="adaSaring ? tcf('kabar.kosongSaring') : tcf('kabar.kosong')" />
    <ul v-else class="ca-console-dialog divide-y divide-[color:var(--ca-border)] text-sm">
      <li v-for="k in baris" :key="k.id" class="flex flex-wrap items-start gap-x-3 gap-y-1 px-4 py-2.5">
        <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" :class="k.dibaca ? 'bg-transparent' : 'bg-[var(--ca-gold-text)]'" :title="k.dibaca ? tcf('kabar.dibaca') : tcf('kabar.belum')" />
        <Icon :name="ikonJenis(k.jenis)" class="mt-0.5 h-4 w-4 shrink-0 text-[var(--ca-subtle)]" aria-hidden="true" />
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-medium text-[var(--ca-text)]">{{ labelJenis(k.jenis) }}</span>
            <span v-if="k.kategori" class="text-[var(--ca-muted)]">{{ k.kategori }}</span>
            <span v-if="k.peranBaru" class="ca-pill-info text-[0.7rem]">{{ tcf('kabar.peranBaru') }}: {{ tcf(`kode.peran.${k.peranBaru}`) }}</span>
            <span v-if="k.kodeTakDikenal" class="ca-pill-muted text-[0.7rem]">{{ tcf('kode.takDikenal') }}</span>
            <span class="text-xs text-[var(--ca-subtle)]">{{ namaRuang(k.ruangId) }}</span>
          </div>
          <p v-if="k.isi" class="mt-0.5 text-xs tabular-nums text-[var(--ca-muted)]">
            <template v-if="k.tanggal">{{ formatTanggal(k.tanggal) }} · </template>
            <template v-for="(x, i) in isiAda(k)" :key="x.kunci"><template v-if="i"> · </template>{{ tcf(`kabar.isi.${x.kunci}`) }} {{ x.nilai }}</template>
          </p>
          <p class="mt-0.5 text-xs text-[var(--ca-muted)]">
            {{ formatWaktu(k.padaIso) }}
            <template v-if="k.dibacaIso"> · {{ tcf('kabar.dibaca') }} {{ formatWaktu(k.dibacaIso) }}</template>
            <template v-if="k.aktor">
              · {{ tcf('kabar.aktor') }} <span class="font-mono">{{ k.aktor.slice(0, 8) }}</span>
              <span v-if="k.akunAda === false" class="text-[var(--ca-gold-text)]"> ({{ tcf('kabar.akunHilang') }})</span>
            </template>
            <template v-if="k.adaNamaAktor"> · {{ tcf('kabar.adaNama') }}</template>
          </p>
        </div>
        <span v-if="k.nominal != null" class="font-semibold tabular-nums text-[var(--ca-text)]">{{ rupiah(k.nominal) }}</span>
        <NuxtLink v-if="k.sasaranId && (k.jenis === 'tx.hapus' || k.jenis === 'tx.besar')" :to="keTx(k.sasaranId)" class="ca-btn-secondary !px-3 !py-1 text-xs">{{ tcf('kabar.bukaTx') }}</NuxtLink>
      </li>
    </ul>
  </div>
</template>
