<script setup lang="ts">
/**
 * Tren harian catat lewat WhatsApp: satu batang per hari WIB. Tinggi batang =
 * pesan masuk, bagian bawah yang lebih pekat = pesan yang menghasilkan
 * catatan. Label tanggal ditipiskan supaya tetap terbaca di HP (paling
 * banyak sekitar tujuh label). Angka lengkapnya ada di tabel yang bisa dibuka,
 * dan pembaca layar mendapat ringkasan per hari lewat aria-label.
 *
 * Hanya tampilan: menerima bentuk domain dari adapters/cashflowWaLaporan.
 */
import { angka } from '~/adapters/cashflow'
import { BULAN, BULAN_EN, tanggalPendek } from '~/adapters/cashflowWaktu'
import { skalaHarianWa, type HariWa } from '~/adapters/cashflowWaLaporan'

const props = defineProps<{ harian: HariWa[] }>()
const { tcf, bahasa } = useCashflowI18n()

const puncak = computed(() => skalaHarianWa(props.harian))
const tiap = computed(() => Math.max(1, Math.ceil(props.harian.length / 7)))
const pendek = (ymd: string) => {
  const b = Number(ymd.slice(5, 7)) - 1
  return `${Number(ymd.slice(8, 10))} ${(bahasa.value === 'en' ? BULAN_EN : BULAN)[b] ?? ''}`
}
const batang = computed(() => props.harian.map((h, i) => ({
  ...h,
  tinggi: h.pesan ? Math.max(4, Math.round((h.pesan / puncak.value) * 100)) : 0,
  isi: h.pesan ? Math.round((Math.min(h.dicatat, h.pesan) / h.pesan) * 100) : 0,
  label: i === props.harian.length - 1 || (props.harian.length - 1 - i) % tiap.value === 0 ? pendek(h.tanggal) : '',
  aria: tcf('waCatat.harian.ringkas')(tanggalPendek(h.tanggal, bahasa.value), angka(h.pesan), angka(h.dicatat)) as string,
})))
const turun = computed(() => [...props.harian].reverse())
</script>

<template>
  <div class="min-w-0" data-uji="wa-harian-grafik">
    <ol class="wa-harian" :style="{ '--wa-kolom': String(Math.max(1, harian.length)) }">
      <li v-for="b in batang" :key="b.tanggal" class="wa-harian-kolom" :aria-label="b.aria" :title="b.aria">
        <span class="wa-harian-wadah">
          <span v-if="b.tinggi" class="wa-harian-batang" :style="{ height: `${b.tinggi}%` }">
            <span class="wa-harian-isi" :style="{ height: `${b.isi}%` }" />
          </span>
          <span v-else class="wa-harian-nol" />
        </span>
        <span class="wa-harian-label" aria-hidden="true">{{ b.label }}</span>
      </li>
    </ol>
    <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--ca-subtle)]" aria-hidden="true">
      <span class="inline-flex items-center gap-1.5"><span class="wa-titik wa-titik-pesan" />{{ tcf('waCatat.harian.pesan') }}</span>
      <span class="inline-flex items-center gap-1.5"><span class="wa-titik wa-titik-isi" />{{ tcf('waCatat.harian.dicatat') }}</span>
    </div>
    <details class="mt-3 text-sm" data-uji="wa-harian-tabel">
      <summary class="cursor-pointer select-none font-semibold text-[var(--ca-muted)] hover:text-[var(--ca-text)]">{{ tcf('waCatat.harian.tabel') }}</summary>
      <div class="mt-3">
        <CashflowTabel lebar-min="26rem" rapat>
          <thead>
            <tr>
              <th scope="col">{{ tcf('waCatat.harian.tanggal') }}</th>
              <th scope="col" class="cf-ka">{{ tcf('waCatat.harian.pesan') }}</th>
              <th scope="col" class="cf-ka">{{ tcf('waCatat.harian.pengirim') }}</th>
              <th scope="col" class="cf-ka">{{ tcf('waCatat.harian.dicatat') }}</th>
              <th scope="col" class="cf-ka">{{ tcf('waCatat.harian.catatan') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in turun" :key="h.tanggal">
              <td class="whitespace-nowrap">{{ tanggalPendek(h.tanggal, bahasa) }}</td>
              <td class="cf-ka cf-kuat">{{ angka(h.pesan) }}</td>
              <td class="cf-ka">{{ angka(h.pengirim) }}</td>
              <td class="cf-ka">{{ angka(h.dicatat) }}</td>
              <td class="cf-ka">
                <template v-if="h.catatan !== null">{{ angka(h.catatan) }}</template>
                <span v-else class="text-xs text-[var(--ca-subtle)]">{{ tcf('waCatat.harian.lewat') }}</span>
              </td>
            </tr>
          </tbody>
        </CashflowTabel>
      </div>
    </details>
  </div>
</template>

<style scoped>
.wa-harian {
  display: grid;
  grid-template-columns: repeat(var(--wa-kolom), minmax(0, 1fr));
  gap: clamp(2px, 1vw, 8px);
  height: 11rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.wa-harian-kolom { display: flex; min-width: 0; flex-direction: column; align-items: stretch; gap: 6px; }
.wa-harian-wadah { position: relative; display: flex; flex: 1 1 auto; align-items: flex-end; justify-content: center; }
.wa-harian-batang {
  position: relative; display: flex; width: 100%; max-width: 2.5rem; flex-direction: column; justify-content: flex-end;
  overflow: hidden; border-radius: 6px 6px 3px 3px;
  background: color-mix(in srgb, var(--ca-accent) 28%, transparent);
}
.wa-harian-isi { display: block; width: 100%; background: var(--ca-accent); }
.wa-harian-nol { width: 100%; max-width: 2.5rem; height: 2px; border-radius: 2px; background: var(--ca-panel-bg-strong); }
.wa-harian-label {
  height: 1rem; overflow: visible; text-align: center; white-space: nowrap;
  font-size: 0.6875rem; line-height: 1rem; color: var(--ca-subtle); font-variant-numeric: tabular-nums;
}
.wa-titik { display: inline-block; width: 10px; height: 10px; border-radius: 3px; }
.wa-titik-pesan { background: color-mix(in srgb, var(--ca-accent) 28%, transparent); }
.wa-titik-isi { background: var(--ca-accent); }
</style>
