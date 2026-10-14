<script setup lang="ts">
/**
 * Kesehatan: sebaran versi aplikasi pengguna aktif (admin_versi_aplikasi,
 * 0110). Memuat sendiri: galatnya hanya tampil di sini,
 * ubin dan tabel lain di halaman tetap tampil (KK-14).
 *
 * Rentang (7, 30, 90 hari) dipegang halaman lewat v-model:hari, supaya
 * bagian Ajakan pembaruan di bawahnya memakai rentang yang sama.
 * Baris tanpa kode ikut "Tidak diketahui": angkanya dihitung server per orang
 * (aktif dikurangi diketahui), jadi tidak ada orang yang terhitung dua kali.
 */
import { angka } from '~/adapters/cashflow'
import { RENTANG_HARI, keSebaranVersi, type SebaranVersi } from '~/adapters/cashflowVersi'

const props = defineProps<{ hari: number }>()
const emit = defineEmits<{ 'update:hari': [hari: number] }>()
const { tcf, formatTanggal } = useCashflowI18n()
const api = useCashflowAdmin()
const { memuat, pesanGalat, muat } = useCashflowMuat({ awal: true })

const data = shallowRef<SebaranVersi | null>(null)
const muatData = () => muat(async (terbaru) => {
  const d = keSebaranVersi(await api.versiAplikasi(props.hari))
  if (terbaru()) data.value = d
})
onMounted(muatData)
watch(() => props.hari, muatData)

const opsi = computed(() => RENTANG_HARI.map(h => ({ nilai: String(h), label: tcf('umum.hari')(h) as string })))
const pilih = (v: string) => emit('update:hari', Number(v))
const tanggal = (iso: string) => (iso ? formatTanggal(iso) : '-')
</script>

<template>
  <section class="ca-console-dialog p-5" aria-labelledby="cf-sebaran-judul" data-uji="sebaran-versi">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="max-w-2xl">
        <h2 id="cf-sebaran-judul" class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('kesehatan.versi.judul') }}</h2>
        <p class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.versi.ket') }}</p>
      </div>
      <CashflowSegmen :opsi="opsi" :nilai="String(hari)" :label="tcf('umum.rentangHari')" @pilih="pilih" />
    </div>

    <p v-if="pesanGalat" class="mt-3 text-sm ca-tone-danger" role="alert">{{ pesanGalat }}</p>
    <p v-else-if="memuat && !data" class="mt-3 text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>
    <template v-else-if="data">
      <div class="mt-4 grid gap-4 sm:grid-cols-3" :class="memuat ? 'opacity-60' : ''">
        <CashflowStatTile icon="lucide:smartphone" warna="sky" :label="tcf('kesehatan.versi.aktif')(data.hari)" :nilai="angka(data.aktif)" />
        <CashflowStatTile
          icon="lucide:badge-check" warna="emerald" :label="tcf('kesehatan.versi.diketahui')" :nilai="angka(data.diketahui)"
          :keterangan="data.persen == null ? '' : tcf('kesehatan.versi.persen')(data.persen)"
        />
        <CashflowStatTile
          v-if="data.terbaruPlay != null && data.diBawahTerbaru != null"
          icon="lucide:arrow-down-circle" warna="amber" :label="tcf('kesehatan.versi.diBawah')" :nilai="angka(data.diBawahTerbaru)"
          :keterangan="tcf('kesehatan.versi.diBawahKet')(data.terbaruPlay)"
        />
      </div>

      <CashflowKeadaanKosong v-if="!data.aktif" class="mt-4" :pesan="tcf('kesehatan.versi.kosong')" icon="lucide:smartphone" />
      <div v-else class="mt-4 overflow-x-auto">
        <table class="w-full min-w-[34rem] text-sm">
          <thead><tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
            <th class="py-2 pr-3">{{ tcf('kesehatan.versi.kolom.versi') }}</th>
            <th class="py-2 px-3">{{ tcf('kesehatan.versi.kolom.kode') }}</th>
            <th class="py-2 px-3">{{ tcf('kesehatan.versi.kolom.build') }}</th>
            <th class="py-2 px-3 text-right">{{ tcf('kesehatan.versi.kolom.pengguna') }}</th>
            <th class="py-2 px-3 text-right">{{ tcf('kesehatan.versi.kolom.luar') }}</th>
            <th class="py-2 pl-3">{{ tcf('kesehatan.versi.kolom.terakhir') }}</th>
          </tr></thead>
          <tbody>
            <tr v-for="b in data.baris" :key="b.kunci" class="border-t border-[color:var(--ca-border)] text-[var(--ca-text)]">
              <td class="py-1.5 pr-3 tabular-nums">{{ b.versi || '-' }}</td>
              <td class="py-1.5 px-3 font-mono text-xs">{{ b.kode }}</td>
              <td class="py-1.5 px-3">{{ tcf(`kesehatan.versi.build.${b.build}`) }}</td>
              <td class="py-1.5 px-3 text-right tabular-nums">{{ angka(b.pengguna) }}</td>
              <td class="py-1.5 px-3 text-right tabular-nums">{{ angka(b.penggunaLuar) }}</td>
              <td class="py-1.5 pl-3 whitespace-nowrap text-xs text-[var(--ca-subtle)]">{{ tanggal(b.terakhirIso) }}</td>
            </tr>
            <tr v-if="data.takTahu.pengguna > 0" class="border-t border-[color:var(--ca-border)] text-[var(--ca-muted)]" data-uji="versi-tak-tahu">
              <td class="py-1.5 pr-3" colspan="3">{{ tcf('kesehatan.versi.takTahu') }}</td>
              <td class="py-1.5 px-3 text-right tabular-nums">{{ angka(data.takTahu.pengguna) }}</td>
              <td class="py-1.5 px-3 text-right tabular-nums">{{ angka(data.takTahu.penggunaLuar) }}</td>
              <td class="py-1.5 pl-3 text-xs">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
