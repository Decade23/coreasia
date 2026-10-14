<script setup lang="ts">
/**
 * Kesehatan: ajakan pembaruan 1.3.2 per versi tujuan (admin_ajakan_pembaruan,
 * 0110). Rentang dari halaman (sama dengan Versi aplikasi).
 *
 * Angka utama setiap sel = ORANG dari ringkas[] (per langkah dan versi
 * tujuan, satu orang sekali walau memakai dua jalur), kejadian lebih kecil di
 * sampingnya. Jalur Perbarui menjumlah kejadian ketuk di ajakan dan layar
 * wajib dari baris[]. Memuat sendiri; galatnya hanya di bagian ini.
 */
import { angka } from '~/adapters/cashflow'
import { keAjakanPembaruan, type AjakanPembaruan, type LangkahPembaruan } from '~/adapters/cashflowVersi'

const props = defineProps<{ hari: number }>()
const { tcf } = useCashflowI18n()
const api = useCashflowAdmin()
const { memuat, pesanGalat, muat } = useCashflowMuat({ awal: true })

const data = shallowRef<AjakanPembaruan | null>(null)
const muatData = () => muat(async (terbaru) => {
  const d = keAjakanPembaruan(await api.ajakanPembaruan(props.hari))
  if (terbaru()) data.value = d
})
onMounted(muatData)
watch(() => props.hari, muatData)

const KOLOM: ReadonlyArray<{ langkah: LangkahPembaruan; label: string }> = [
  { langkah: 'pembaruan.ajakan_lihat', label: 'lihat' },
  { langkah: 'pembaruan.ajakan_ketuk', label: 'ketuk' },
  { langkah: 'pembaruan.ajakan_tutup', label: 'tutup' },
  { langkah: 'pembaruan.wajib_lihat', label: 'wajibLihat' },
  { langkah: 'pembaruan.wajib_ketuk', label: 'wajibKetuk' },
]
</script>

<template>
  <section class="ca-console-dialog p-5" aria-labelledby="cf-ajakan-judul" data-uji="ajakan-pembaruan">
    <h2 id="cf-ajakan-judul" class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('kesehatan.ajakan.judul')(hari) }}</h2>
    <p class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.ajakan.ket') }}</p>

    <p v-if="pesanGalat" class="mt-3 text-sm ca-tone-danger" role="alert">{{ pesanGalat }}</p>
    <p v-else-if="memuat && !data" class="mt-3 text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>
    <template v-else-if="data">
      <CashflowKeadaanKosong v-if="!data.baris.length" class="mt-3" :pesan="tcf('kesehatan.ajakan.kosong')" icon="lucide:megaphone" />
      <template v-else>
        <div class="mt-3 overflow-x-auto" :class="memuat ? 'opacity-60' : ''">
          <table class="w-full min-w-[40rem] text-sm">
            <thead><tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
              <th class="py-2 pr-3">{{ tcf('kesehatan.ajakan.kolom.ke') }}</th>
              <th v-for="k in KOLOM" :key="k.langkah" class="py-2 px-3 text-right">{{ tcf(`kesehatan.ajakan.kolom.${k.label}`) }}</th>
              <th class="py-2 pl-3 text-right">{{ tcf('kesehatan.ajakan.kolom.sampai') }}</th>
            </tr></thead>
            <tbody>
              <tr v-for="b in data.baris" :key="b.ke" class="border-t border-[color:var(--ca-border)] text-[var(--ca-text)]">
                <td class="py-1.5 pr-3 whitespace-nowrap">
                  <span class="font-mono text-xs">{{ b.ke }}</span>
                  <span v-if="b.nama" class="ml-1 text-xs text-[var(--ca-subtle)]">{{ b.nama }}</span>
                </td>
                <td v-for="k in KOLOM" :key="k.langkah" class="py-1.5 px-3 text-right whitespace-nowrap">
                  <span class="font-semibold tabular-nums">{{ angka(b.sel[k.langkah].orang) }}</span>
                  <span v-if="b.sel[k.langkah].kejadian" class="text-xs text-[var(--ca-subtle)] tabular-nums"> ({{ tcf('kesehatan.ajakan.kejadian')(b.sel[k.langkah].kejadian) }})</span>
                </td>
                <td class="py-1.5 pl-3 text-right font-semibold tabular-nums">{{ angka(b.sampai) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-3 text-xs text-[var(--ca-muted)]" data-uji="ajakan-jalur">
          {{ tcf('kesehatan.ajakan.jalur')(data.jalur.dalam, data.jalur.pasar, data.jalur.web, data.jalur.gagal) }}
        </p>
      </template>
    </template>
  </section>
</template>
