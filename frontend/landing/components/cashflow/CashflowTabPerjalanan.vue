<script setup lang="ts">
import { POLA_KURSOR_URL } from '~/adapters/cashflowBuku'
import { KATEGORI_PERJALANAN, namaKategoriPerjalanan } from '~/adapters/cashflowKamusPeristiwa'
import {
  kelompokPerjalanan, kursorPerjalananDariUrl, salinPerjalanan,
  type KelompokPerjalanan, type PerjalananDTO,
} from '~/adapters/cashflowPerjalanan'
import { tanggalWib } from '~/adapters/cashflowWaktu'
import type { SkemaQuery } from '~/adapters/cashflowQuery'

const props = defineProps<{ subjek: string; dasar: string }>()
const { tcf, bahasa, formatTanggal } = useCashflowI18n()
const api = useCashflowAdmin()
const kasus = useCashflowKasus()
const toast = useToast()
const { memuat, galat, pesanGalat, muat, pakaiSimpanan } = useCashflowMuat()

const POLA_TGL = /^\d{4}-\d{2}-\d{2}$/
const SKEMA = {
  kategori: { jenis: 'pilihan', opsi: ['', ...KATEGORI_PERJALANAN], bawaan: '' },
  dari: { jenis: 'teks', pola: POLA_TGL, maks: 10, bawaan: '' },
  sampai: { jenis: 'teks', pola: POLA_TGL, maks: 10, bawaan: '' },
  galat: { jenis: 'pilihan', opsi: ['', '1'], bawaan: '' },
  kursor: { jenis: 'teks', pola: POLA_KURSOR_URL, maks: 600, bawaan: '' },
} as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)
const saring = computed(() => ({
  kategori: q.value.kategori ? [q.value.kategori] : null,
  dari: q.value.dari || null,
  sampai: q.value.sampai || null,
  hanyaGalat: q.value.galat === '1',
}))
const kursor = computed(() => kursorPerjalananDariUrl(q.value.kursor))
const kunci = computed(() => {
  const k = kasus.kunciKasus.value
  if (!k || kasus.kasus.value?.subjekId !== props.subjek || !kasus.punyaRanah('jejak')) return null
  return `${k}|perjalanan:${JSON.stringify([saring.value, kursor.value])}`
})
const mentah = computed(() => kasus.data<PerjalananDTO>(kunci.value))
const terbuka = ref(new Set<string>())

watch(kunci, (k) => {
  terbuka.value = new Set()
  if (!k || mentah.value) { pakaiSimpanan(); return }
  const { subjek } = props
  const s = saring.value
  const ks = kursor.value
  void muat(async () => { await kasus.muatData(k, kk => api.perjalanan(kk.id, subjek, s, ks)) })
}, { immediate: true })

type Ubah = Parameters<typeof setel>[0]
const saringUlang = (ubah: Ubah) => setel({ ...ubah, kursor: '' })
const { wadah, berikutnya, sebelumnya, pertama } = useCashflowKursor({
  kini: () => kursor.value ? q.value.kursor : '',
  berikut: () => mentah.value?.kursor_berikut,
  ke: k => setel({ kursor: k }, { dorong: true }),
})
const kelompok = computed(() => kelompokPerjalanan(mentah.value?.baris ?? [], bahasa.value))
const labelKelompok = (k: KelompokPerjalanan): string => k.mulai
  ? tcf('perjalanan.peluncuran')(k.mulai, k.versi ?? tcf('perjalanan.versiAsing'))
  : tcf('perjalanan.diLuarPeluncuran')
const labelSumber = (s: 'server' | 'aplikasi') => tcf(`perjalanan.sumber.${s}`)
const labelAsing = computed(() => tcf('perjalanan.belumDikenal'))

function ubahBuka(id: string, event: Event) {
  if ((event.currentTarget as HTMLDetailsElement).open) terbuka.value.add(id)
  else terbuka.value.delete(id)
}

async function salin() {
  try {
    await navigator.clipboard.writeText(salinPerjalanan(kelompok.value, terbuka.value, labelKelompok, labelSumber, labelAsing.value, k => namaKategoriPerjalanan(k, bahasa.value)))
    toast.success(tcf('perjalanan.tersalin'))
  } catch {
    toast.error(tcf('umum.gagalSalin'))
  }
}

const retensi = computed(() => {
  const sejak = mentah.value?.telemetri_sejak
  return sejak && (!q.value.dari || q.value.dari <= tanggalWib(sejak))
    ? tcf('perjalanan.retensi')(formatTanggal(sejak)) : ''
})
const tautan = (tujuan: 'pembelian' | 'transaksi' | 'jejak' | 'domi') =>
  tujuan === 'pembelian' ? '/console/cashflow/pembelian' : `${props.dasar}/${tujuan}`
</script>

<template>
  <div ref="wadah" class="scroll-mt-40 space-y-4">
    <div class="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end">
      <label class="col-span-2 flex flex-col gap-1 text-xs text-[var(--ca-muted)]">
        {{ tcf('perjalanan.kategori') }}
        <select :value="q.kategori" class="ca-input" @change="saringUlang({ kategori: ($event.target as HTMLSelectElement).value as typeof q.kategori })">
          <option value="">{{ tcf('umum.semua') }}</option>
          <option v-for="k in KATEGORI_PERJALANAN" :key="k" :value="k">{{ namaKategoriPerjalanan(k, bahasa) }}</option>
        </select>
      </label>
      <label class="flex min-w-0 flex-col gap-1 text-xs text-[var(--ca-muted)]">
        {{ tcf('perjalanan.dari') }}
        <input type="date" :value="q.dari" class="ca-input min-w-0 w-full" @change="saringUlang({ dari: ($event.target as HTMLInputElement).value })">
      </label>
      <label class="flex min-w-0 flex-col gap-1 text-xs text-[var(--ca-muted)]">
        {{ tcf('perjalanan.sampai') }}
        <input type="date" :value="q.sampai" class="ca-input min-w-0 w-full" @change="saringUlang({ sampai: ($event.target as HTMLInputElement).value })">
      </label>
      <label class="col-span-2 flex min-h-10 items-center gap-2 px-2 text-sm text-[var(--ca-text)]">
        <input type="checkbox" :checked="q.galat === '1'" @change="saringUlang({ galat: ($event.target as HTMLInputElement).checked ? '1' : '' })">
        {{ tcf('perjalanan.hanyaGalat') }}
      </label>
      <button v-if="kelompok.length && !memuat" type="button" class="ca-btn-secondary col-span-2 sm:ml-auto" @click="salin">
        <Icon name="lucide:copy" class="h-4 w-4" aria-hidden="true" />
        {{ tcf('perjalanan.salin') }}
      </button>
    </div>

    <CashflowPanelTab ranah="jejak" :memuat="memuat" :galat="galat" :pesan-galat="pesanGalat" :ada-data="!!mentah">
      <template v-if="mentah">
        <div v-if="retensi || mentah.akun_internal" class="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[var(--ca-muted)]">
          <span v-if="mentah.akun_internal" class="ca-pill-gold">{{ tcf('perjalanan.internal') }}</span>
          <span v-if="retensi">{{ retensi }}</span>
        </div>
        <CashflowKeadaanKosong v-if="!kelompok.length" :pesan="tcf('perjalanan.kosong')" icon="lucide:activity" />
        <div v-else class="space-y-3">
          <section v-for="k in kelompok" :key="k.id" class="ca-console-dialog overflow-hidden">
            <h2 class="border-b border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)] px-4 py-3 text-sm font-semibold text-[var(--ca-text)]">
              {{ labelKelompok(k) }}
            </h2>
            <ol class="divide-y divide-[color:var(--ca-border)]">
              <li v-for="b in k.baris" :key="b.id">
                <details @toggle="ubahBuka(b.id, $event)">
                  <summary class="cursor-pointer px-4 py-3 text-sm text-[var(--ca-text)] hover:bg-[var(--ca-panel-bg-strong)]">
                    <span class="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 align-middle">
                      <time :datetime="b.waktuIso" class="text-xs tabular-nums text-[var(--ca-subtle)]">{{ b.waktu }}</time>
                      <span class="inline-flex items-center gap-1" :class="b.gaya.kelas">
                        <Icon :name="b.gaya.ikon" class="h-3.5 w-3.5" aria-hidden="true" />
                        {{ namaKategoriPerjalanan(b.kategori, bahasa) }}
                      </span>
                      <span class="font-medium">{{ b.judul }}</span>
                      <span v-if="b.layar" class="text-xs text-[var(--ca-muted)]">{{ b.layar }}</span>
                      <span class="text-xs text-[var(--ca-subtle)]">{{ labelSumber(b.sumber) }}</span>
                    </span>
                  </summary>
                  <div class="space-y-2 px-4 pb-4 pl-8 text-sm text-[var(--ca-muted)]">
                    <p v-if="b.arti">{{ b.arti }}</p>
                    <dl v-if="b.rincian.length" class="space-y-1">
                      <div v-for="r in b.rincian" :key="r.kunci" class="flex flex-wrap items-baseline gap-x-2">
                        <dt class="font-medium">{{ r.label }}</dt>
                        <dd class="flex flex-wrap items-center gap-x-2 text-[var(--ca-text)]">
                          {{ r.nilai }}
                          <span v-if="r.belumDikenal && r.nilai !== labelAsing" class="ca-pill-muted text-xs">{{ labelAsing }}</span>
                        </dd>
                      </div>
                    </dl>
                    <NuxtLink v-if="b.tujuan" :to="tautan(b.tujuan)" class="inline-block underline underline-offset-2 text-[var(--ca-text)]">
                      {{ tcf(`perjalanan.tautan.${b.tujuan}`) }}
                    </NuxtLink>
                  </div>
                </details>
              </li>
            </ol>
          </section>
        </div>
        <CashflowPagerKursor
          :halaman-pertama="mentah.halaman_pertama" :ada-berikut="!!mentah.kursor_berikut"
          :jumlah="mentah.baris.length" :total="null" :memuat="memuat"
          @berikutnya="berikutnya" @sebelumnya="sebelumnya" @pertama="pertama"
        />
      </template>
    </CashflowPanelTab>
  </div>
</template>
