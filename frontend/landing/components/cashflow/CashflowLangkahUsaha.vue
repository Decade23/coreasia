<script setup lang="ts">
/**
 * Aktivitas: langkah usaha (admin_langkah_usaha, 0110):
 * pintu ruang baru, kartu Beranda, tonggak usaha, dan meja usaha 1.3.2,
 * ditambah ruang usaha baru per minggu WIB. Rentang 7, 30, 90 hari milik
 * bagian ini sendiri. Bisa dilipat, terbuka bawaan.
 *
 * Setiap kode langkah tampil sebagai kata (kamus aktivitas.usaha). Langkah
 * atau isi yang belum dikenal kamus tampil apa adanya dengan pil "kode baru",
 * supaya langkah 1.3.3 tidak hilang diam-diam. Memuat sendiri; galatnya
 * hanya di bagian ini, tabel peristiwa di bawahnya tetap tampil.
 */
import { angka } from '~/adapters/cashflow'
import { RENTANG_HARI, HARI_BAWAAN, keLangkahUsaha, type BarisLangkah, type LangkahUsaha } from '~/adapters/cashflowVersi'

const { tcf, formatTanggal } = useCashflowI18n()
const api = useCashflowAdmin()
const { memuat, pesanGalat, muat } = useCashflowMuat({ awal: true })

const hari = ref<number>(HARI_BAWAAN)
const terbuka = ref(true)
const data = shallowRef<LangkahUsaha | null>(null)
const muatData = () => muat(async (terbaru) => {
  const d = keLangkahUsaha(await api.langkahUsaha(hari.value))
  if (terbaru()) data.value = d
})
onMounted(muatData)
watch(hari, muatData)

const opsi = computed(() => RENTANG_HARI.map(h => ({ nilai: String(h), label: tcf('umum.hari')(h) as string })))
const labelBaris = (b: BarisLangkah): string => {
  const dasar = b.kunciLangkah ? (tcf(`aktivitas.usaha.langkah.${b.kunciLangkah}`) as string) : b.langkah
  if (!b.isi) return dasar
  const isi = b.jenisIsi && b.kenalIsi ? (tcf(`aktivitas.usaha.isi.${b.jenisIsi}.${b.isi}`) as string) : b.isi
  return `${dasar}, ${isi}`
}
const kodeBaru = (b: BarisLangkah) => !b.kunciLangkah || !b.kenalIsi
</script>

<template>
  <section class="ca-console-dialog p-5" aria-labelledby="cf-usaha-judul" data-uji="langkah-usaha">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="max-w-2xl">
        <h2 id="cf-usaha-judul" class="font-display text-base font-bold text-[var(--ca-text)]">
          <button type="button" class="inline-flex items-center gap-2 text-left" :aria-expanded="terbuka" aria-controls="cf-usaha-isi" @click="terbuka = !terbuka">
            <Icon :name="terbuka ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="h-4 w-4 text-[var(--ca-muted)]" />
            {{ tcf('aktivitas.usaha.judul') }}
            <span class="sr-only">{{ terbuka ? tcf('aktivitas.usaha.lipat') : tcf('aktivitas.usaha.buka') }}</span>
          </button>
        </h2>
        <p class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('aktivitas.usaha.ket') }}</p>
      </div>
      <CashflowSegmen v-if="terbuka" :opsi="opsi" :nilai="String(hari)" :label="tcf('umum.rentangHari')" @pilih="v => (hari = Number(v))" />
    </div>

    <div v-show="terbuka" id="cf-usaha-isi">
      <p v-if="pesanGalat" class="mt-3 text-sm ca-tone-danger" role="alert">{{ pesanGalat }}</p>
      <p v-else-if="memuat && !data" class="mt-3 text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>
      <template v-else-if="data">
        <CashflowKeadaanKosong v-if="data.kosong" class="mt-3" :pesan="tcf('aktivitas.usaha.kosong')" icon="lucide:store" />
        <template v-else>
          <div v-if="data.kelompok.length" class="mt-3 overflow-x-auto" :class="memuat ? 'opacity-60' : ''">
            <table class="w-full min-w-[30rem] text-sm">
              <thead><tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
                <th class="py-2 pr-3">{{ tcf('aktivitas.usaha.kolom.langkah') }}</th>
                <th class="py-2 px-3 text-right">{{ tcf('aktivitas.usaha.kolom.orang') }}</th>
                <th class="py-2 px-3 text-right">{{ tcf('aktivitas.usaha.kolom.kejadian') }}</th>
                <th class="py-2 pl-3 text-right">{{ tcf('aktivitas.usaha.kolom.luar') }}</th>
              </tr></thead>
              <tbody v-for="g in data.kelompok" :key="g.kelompok">
                <tr class="border-t border-[color:var(--ca-border)]">
                  <th scope="rowgroup" colspan="4" class="pt-3 pb-1 text-left text-xs font-semibold text-[var(--ca-muted)]">{{ tcf(`aktivitas.usaha.kelompok.${g.kelompok}`) }}</th>
                </tr>
                <tr v-for="b in g.baris" :key="`${b.langkah}/${b.isi}`" class="text-[var(--ca-text)]">
                  <td class="py-1 pr-3 pl-3">
                    {{ labelBaris(b) }}
                    <span v-if="kodeBaru(b)" class="ca-pill-gold ml-1 text-[10px]">{{ tcf('aktivitas.usaha.kodeBaru') }}</span>
                  </td>
                  <td class="py-1 px-3 text-right tabular-nums">{{ angka(b.orang) }}</td>
                  <td class="py-1 px-3 text-right tabular-nums text-[var(--ca-muted)]">{{ angka(b.kejadian) }}</td>
                  <td class="py-1 pl-3 text-right tabular-nums">{{ angka(b.orangLuar) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 class="mt-5 text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('aktivitas.usaha.mingguan') }}</h3>
          <p v-if="!data.mingguan.length" class="mt-2 text-xs text-[var(--ca-subtle)]">{{ tcf('aktivitas.usaha.mingguKosong') }}</p>
          <div v-else class="mt-2 overflow-x-auto">
            <table class="w-full max-w-md text-sm" data-uji="usaha-mingguan">
              <thead><tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
                <th class="py-1.5 pr-3">{{ tcf('aktivitas.usaha.kolom.minggu') }}</th>
                <th class="py-1.5 px-3 text-right">{{ tcf('aktivitas.usaha.kolom.ruang') }}</th>
                <th class="py-1.5 pl-3 text-right">{{ tcf('aktivitas.usaha.kolom.luar') }}</th>
              </tr></thead>
              <tbody>
                <tr v-for="m in data.mingguan" :key="m.minggu" class="border-t border-[color:var(--ca-border)] text-[var(--ca-text)]">
                  <td class="py-1 pr-3 whitespace-nowrap">{{ formatTanggal(m.minggu) }}</td>
                  <td class="py-1 px-3 text-right tabular-nums">{{ angka(m.jumlah) }}</td>
                  <td class="py-1 pl-3 text-right tabular-nums">{{ angka(m.jumlahLuar) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </template>
    </div>
  </section>
</template>
