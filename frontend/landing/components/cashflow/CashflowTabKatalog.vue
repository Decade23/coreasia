<script setup lang="ts">
/**
 * Isi tab Ruang 360 › Katalog (admin_katalog_ruang, ranah katalog): anggaran
 * bulan terpilih (sudah diselesaikan server dengan aturan resolveFrom),
 * kategori per jenis, dan baris anggaran mentah. Halaman yang memuat data
 * dan memegang CashflowPanelTab; komponen ini hanya menampilkan.
 *
 * `rasio` null = tanpa target (bukan "0% terpakai"). Warna kategori dipakai
 * sebagai gaya hanya bila lolos penyaring adapter (null → netral), ikon
 * ditulis sebagai teks — tidak pernah v-html.
 */
import { rupiah, angka } from '~/adapters/cashflow'
import type { Katalog } from '~/adapters/cashflowRanahBuku'
import {
  bulanWibKini, geserBulan, kelompokkanKategori, labelBulan, lebarBilah, nadaAnggaran, susunAnggaran,
} from '~/adapters/cashflowTampilBuku'

const props = defineProps<{
  katalog: Katalog
  /** Akar rute ruang, untuk tautan tab Transaksi ?kategori=. */
  dasar: string
  labelOrang: (uid: string | null) => string
  memuat?: boolean
}>()
const emit = defineEmits<{ bulan: [bulan: string | null] }>()
const { tcf, bahasa, formatTanggal, formatWaktu } = useCashflowI18n()

const anggaran = computed(() => susunAnggaran(props.katalog, tcf('katalog.keseluruhan')))
const kelompok = computed(() => kelompokkanKategori(props.katalog.kategori))
const namaKategori = computed(() => new Map(props.katalog.kategori.map(c => [c.id, c.nama])))
const kini = computed(() => bulanWibKini())
/** Bulan kini dikirim sebagai null (bawaan server), supaya simpanan tidak berlipat. */
const geser = (n: number) => {
  const b = geserBulan(props.katalog.bulan, n)
  emit('bulan', b === kini.value ? null : b)
}
const warnaBilah: Record<string, string> = {
  'aman': 'bg-[var(--ca-emerald-text)]',
  'dekat': 'bg-[var(--ca-gold-text)]',
  'lewat': 'bg-[var(--ca-danger-text)]',
  'tanpa-target': 'bg-[var(--ca-subtle)]',
}
const persen = (r: number | null) => (r == null ? '' : `${Math.round(r * 100)}%`)
</script>

<template>
  <div class="space-y-6" :class="{ 'opacity-60': memuat }" :aria-busy="memuat || undefined">
    <section class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h3 class="text-sm font-semibold text-[var(--ca-text)]">{{ tcf('katalog.anggaran') }} · {{ labelBulan(katalog.bulan, bahasa) }}</h3>
        <div class="flex items-center gap-2">
          <button type="button" class="ca-btn-secondary !px-3 !py-1.5 text-xs" :disabled="memuat" :aria-label="tcf('katalog.bulanSebelum')" @click="geser(-1)">
            <Icon name="lucide:chevron-left" class="h-4 w-4" aria-hidden="true" />
          </button>
          <button v-if="katalog.bulan !== kini" type="button" class="ca-btn-secondary !px-3 !py-1.5 text-xs" :disabled="memuat" @click="emit('bulan', null)">{{ tcf('katalog.bulanKini') }}</button>
          <button type="button" class="ca-btn-secondary !px-3 !py-1.5 text-xs" :disabled="memuat" :aria-label="tcf('katalog.bulanBerikut')" @click="geser(1)">
            <Icon name="lucide:chevron-right" class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <CashflowKeadaanKosong v-if="!anggaran.length" :pesan="tcf('katalog.anggaranKosong')" />
      <ul v-else class="ca-console-dialog divide-y divide-[color:var(--ca-border)] text-sm">
        <li v-for="a in anggaran" :key="a.kategoriId ?? 'keseluruhan'" class="space-y-1.5 px-4 py-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-medium text-[var(--ca-text)]" :class="{ 'font-semibold': a.keseluruhan }">{{ a.nama }}</span>
            <span v-if="a.berulang" class="ca-pill-muted text-[0.7rem]">{{ tcf('katalog.berulang') }}</span>
            <span v-else-if="a.target > 0" class="ca-pill-muted text-[0.7rem]">{{ tcf('katalog.bulanItu') }}</span>
            <span v-if="a.kategoriArsip" class="ca-pill-muted text-[0.7rem]">{{ tcf('katalog.arsip') }}</span>
            <span v-if="a.tampilDiAplikasi === false" class="ca-pill-gold text-[0.7rem]" :title="tcf('katalog.tidakTampilKet')">{{ tcf('katalog.tidakTampil') }}</span>
            <span class="ml-auto text-xs tabular-nums text-[var(--ca-muted)]">
              {{ tcf('katalog.terpakai') }} <span class="font-semibold text-[var(--ca-text)]">{{ rupiah(a.terpakai) }}</span>
              <template v-if="a.rasio != null"> / {{ rupiah(a.target) }} · <span :class="a.rasio > 1 ? 'text-[var(--ca-danger-text)]' : ''">{{ persen(a.rasio) }}</span></template>
              <template v-else> · {{ tcf('katalog.tanpaTarget') }}</template>
            </span>
          </div>
          <div
            class="h-1.5 overflow-hidden rounded-full bg-[var(--ca-panel-bg-strong)]"
            role="meter" :aria-valuenow="lebarBilah(a.rasio)" aria-valuemin="0" aria-valuemax="100" :aria-label="a.nama"
          >
            <div class="h-full rounded-full" :class="warnaBilah[nadaAnggaran(a.rasio)]" :style="{ width: `${lebarBilah(a.rasio)}%` }" />
          </div>
          <p v-if="a.tampilDiAplikasi === false" class="text-xs text-[var(--ca-subtle)]">{{ tcf('katalog.tidakTampilKet') }}</p>
        </li>
      </ul>
    </section>

    <section class="space-y-3">
      <h3 class="text-sm font-semibold text-[var(--ca-text)]">{{ tcf('katalog.kategori') }}</h3>
      <p v-if="katalog.terpotong.kategori" class="text-xs text-[var(--ca-gold-text)]">{{ tcf('katalog.potongKategori') }}</p>
      <CashflowKeadaanKosong v-if="!kelompok.length" :pesan="tcf('katalog.kategoriKosong')" />
      <div v-for="g in kelompok" :key="g.arah" class="space-y-2">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf(`katalog.kelompok.${g.arah}`) }} · {{ g.kategori.length }}</h4>
        <ul class="ca-console-dialog divide-y divide-[color:var(--ca-border)] text-sm">
          <li v-for="c in g.kategori" :key="c.id" class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5" :class="{ 'opacity-70': c.arsip }">
            <span
              class="inline-block h-3 w-3 shrink-0 rounded-full border border-[color:var(--ca-border)]"
              :class="c.warna ? '' : 'bg-[var(--ca-panel-bg-strong)]'" :style="c.warna ? { backgroundColor: c.warna } : undefined" aria-hidden="true"
            />
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-medium text-[var(--ca-text)]">{{ c.nama }}</span>
                <span v-if="c.ikon" class="font-mono text-[0.7rem] text-[var(--ca-subtle)]">{{ c.ikon }}</span>
                <span v-if="c.arsip" class="ca-pill-muted text-[0.7rem]">{{ tcf('katalog.arsip') }}</span>
                <span v-if="c.kodeTakDikenal" class="ca-pill-gold text-[0.7rem]">{{ tcf('kode.takDikenal') }}</span>
                <span v-if="c.tampilanTakSah" class="ca-pill-muted text-[0.7rem]" :title="tcf('katalog.tampilanTakSah')">?</span>
              </div>
              <p class="mt-0.5 text-xs text-[var(--ca-muted)]">
                {{ tcf('katalog.transaksi')(c.transaksi) }}<template v-if="c.terakhirDipakai"> · {{ tcf('katalog.terakhir') }} {{ formatTanggal(c.terakhirDipakai) }}</template><template v-else-if="!c.transaksi"> · {{ tcf('katalog.belumDipakai') }}</template>
                · {{ tcf('katalog.kolom.oleh') }} <span class="font-mono">{{ labelOrang(c.pembuat) }}</span>
              </p>
            </div>
            <NuxtLink v-if="c.transaksi" :to="`${dasar}/transaksi?kategori=${c.id}`" class="ca-btn-secondary !px-3 !py-1 text-xs">{{ tcf('katalog.lihatTransaksi') }}</NuxtLink>
          </li>
        </ul>
      </div>
    </section>

    <details class="ca-console-dialog p-4 text-sm">
      <summary class="cursor-pointer font-semibold text-[var(--ca-text)]">{{ tcf('katalog.baris') }} · {{ angka(katalog.barisAnggaran.length) }}</summary>
      <p class="mt-2 text-xs text-[var(--ca-subtle)]">{{ tcf('katalog.barisKet') }}</p>
      <p v-if="katalog.terpotong.barisAnggaran" class="mt-1 text-xs text-[var(--ca-gold-text)]">{{ tcf('katalog.potongBaris') }}</p>
      <div class="mt-3 overflow-x-auto">
        <table class="w-full min-w-[32rem] text-left text-xs">
          <thead class="text-[var(--ca-muted)]">
            <tr>
              <th class="py-1 pr-3 font-medium">{{ tcf('katalog.kolom.bulan') }}</th>
              <th class="py-1 pr-3 font-medium">{{ tcf('katalog.kolom.lingkup') }}</th>
              <th class="py-1 pr-3 text-right font-medium">{{ tcf('katalog.kolom.nominal') }}</th>
              <th class="py-1 pr-3 font-medium">{{ tcf('katalog.kolom.dibuat') }}</th>
              <th class="py-1 font-medium">{{ tcf('katalog.kolom.oleh') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[color:var(--ca-border)] text-[var(--ca-text)]">
            <tr v-for="b in katalog.barisAnggaran" :key="b.id">
              <td class="py-1.5 pr-3">{{ b.berulang ? tcf('katalog.barisBerulang')(labelBulan(b.bulan, bahasa)) : labelBulan(b.bulan, bahasa) }}</td>
              <td class="py-1.5 pr-3">{{ b.kategoriId ? (namaKategori.get(b.kategoriId) ?? b.kategoriId.slice(0, 8)) : tcf('katalog.keseluruhan') }}</td>
              <td class="py-1.5 pr-3 text-right tabular-nums" :class="{ 'text-[var(--ca-subtle)]': b.nominal === 0 }">{{ rupiah(b.nominal) }}</td>
              <td class="py-1.5 pr-3 text-[var(--ca-muted)]">{{ formatWaktu(b.dibuatIso) }}</td>
              <td class="py-1.5 font-mono text-[var(--ca-muted)]">{{ labelOrang(b.pembuat) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  </div>
</template>
