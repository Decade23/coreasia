<script setup lang="ts">
import { adalahBatasAkses, MIN_ALASAN, type BatasAksesDTO } from '~/adapters/cashflowKasus'
import {
  kunciKelompokCorong, type CorongAlurDTO, type LangkahCorongWaDTO, type SaringCorongWa,
  type KelompokCorongWaDTO,
} from '~/adapters/cashflowCorongAlur'
import { terjemahPeristiwa } from '~/adapters/cashflowKamusPeristiwa'
import { dariDatetimeLokalWib, geserHari, hariIniWib } from '~/adapters/cashflowWaktu'
import type { SkemaQuery } from '~/adapters/cashflowQuery'

const { tcf, bahasa } = useCashflowI18n()
const api = useCashflowAdmin()
const sesi = useCashflowSesi()
const { memuat, galat, pesanGalat, muat, batal } = useCashflowMuat({ awal: true })
const { aksi } = useCashflowMuat()

const hariIni = hariIniWib()
const POLA_TGL = /^\d{4}-\d{2}-\d{2}$/
const SKEMA = {
  dari: { jenis: 'teks', pola: POLA_TGL, maks: 10, bawaan: geserHari(hariIni, -29) },
  sampai: { jenis: 'teks', pola: POLA_TGL, maks: 10, bawaan: hariIni },
  jam: { jenis: 'teks', pola: /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/, maks: 5, bawaan: '' },
} as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)
const data = shallowRef<CorongAlurDTO | null>(null)
const kelompokAktif = ref('')
const kelompok = computed(() => {
  const d = data.value
  return d?.pecahan.find(k => kunciKelompokCorong(k) === kelompokAktif.value) ?? d?.total ?? null
})
const saring = computed<SaringCorongWa>(() => ({
  dari: q.value.dari,
  sampai: q.value.sampai,
  batasAkhir: q.value.jam ? dariDatetimeLokalWib(`${q.value.sampai}T${q.value.jam}`) : null,
}))
const rentangSah = computed(() => {
  const { dari, sampai, batasAkhir } = saring.value
  return sampai >= dari && dari >= geserHari(sampai, -119) && (!q.value.jam || (!!batasAkhir && (q.value.jam !== '00:00' || dari < sampai)))
})
const formatAngka = computed(() => new Intl.NumberFormat(bahasa.value === 'en' ? 'en' : 'id', { maximumFractionDigits: 1 }))

type PilihanKasus = SaringCorongWa & { langkah: LangkahCorongWaDTO; kelompok: KelompokCorongWaDTO }
const pilihan = shallowRef<PilihanKasus | null>(null)
const alasan = ref('')
const posisi = ref(1)
const membuka = ref(false)
const batas = shallowRef<BatasAksesDTO | null>(null)
const galatKasus = ref('')
const izin = computed(() => sesi.boleh('cashflow:pii'))

function muatCorong(s: SaringCorongWa) {
  pilihan.value = null
  data.value = null
  kelompokAktif.value = ''
  if (!rentangSah.value) { batal(); return }
  void muat(async terbaru => {
    const hasil = await api.corongAlur(s)
    if (terbaru()) data.value = hasil
  })
}
onMounted(() => watch(saring, muatCorong, { immediate: true }))
onBeforeUnmount(() => {
  pilihan.value = null
  batal()
})

function pilihKasus(langkah: LangkahCorongWaDTO) {
  if (!data.value || !kelompok.value || membuka.value || !langkah.berhenti || !izin.value) return
  pilihan.value = { langkah, kelompok: kelompok.value, dari: data.value.dari, sampai: data.value.sampai, batasAkhir: data.value.batas_akhir }
  alasan.value = ''
  posisi.value = 1
  batas.value = null
  galatKasus.value = ''
}

async function bukaKasus() {
  const p = pilihan.value
  if (!p || !izin.value || membuka.value || alasan.value.trim().length < MIN_ALASAN ||
    !Number.isInteger(posisi.value) || posisi.value < 1 || posisi.value > p.langkah.berhenti) return
  membuka.value = true
  batas.value = null
  galatKasus.value = ''
  try {
    await aksi(async () => {
      const hasil = await api.corongBukaKasus({
        dari: p.dari, sampai: p.sampai, batasAkhir: p.batasAkhir, cara: p.kelompok.cara, versi: p.kelompok.versi,
        langkah: p.langkah.kunci, posisi: posisi.value, alasan: alasan.value.trim(),
      })
      if (pilihan.value !== p) return
      if (adalahBatasAkses(hasil)) { batas.value = hasil; return }
      await navigateTo({
        path: `/console/cashflow/pengguna/${hasil.subjek_id}/perjalanan`,
        query: { dari: p.dari, sampai: p.sampai },
      })
    }, { gagal: g => {
      if (pilihan.value === p && g.jenis === 'tidak-ada') galatKasus.value = tcf('corongWa.posisiKosong')
    } })
  } finally {
    membuka.value = false
  }
}

const hitunganMentah = computed(() => Object.entries(data.value?.telemetri ?? {})
  .filter(([, jumlah]) => jumlah > 0)
  .map(([langkah, jumlah]) => ({
    langkah, jumlah,
    judul: terjemahPeristiwa({
      jenis: 'onboarding.langkah', langkah, layar: null, rincian_aman: {},
    }, bahasa.value).judul,
  })))
</script>

<template>
  <div class="space-y-4">
    <section class="ca-console-dialog space-y-4 p-4 sm:p-5">
      <div class="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
        <label class="flex min-w-0 flex-col gap-1 text-xs text-[var(--ca-muted)]">
          {{ tcf('perjalanan.dari') }}
          <input type="date" :value="q.dari" :max="hariIni" class="ca-input min-w-0 w-full" @change="setel({ dari: ($event.target as HTMLInputElement).value })">
        </label>
        <label class="flex min-w-0 flex-col gap-1 text-xs text-[var(--ca-muted)]">
          {{ tcf('perjalanan.sampai') }}
          <input type="date" :value="q.sampai" :max="hariIni" class="ca-input min-w-0 w-full" @change="setel({ sampai: ($event.target as HTMLInputElement).value })">
        </label>
        <label class="flex min-w-0 flex-col gap-1 text-xs text-[var(--ca-muted)]">
          {{ tcf('corongWa.jamAkhir') }}
          <input type="time" :value="q.jam" class="ca-input min-w-0 w-full" @change="setel({ jam: ($event.target as HTMLInputElement).value })">
        </label>
        <label class="col-span-2 flex min-w-0 flex-col gap-1 text-xs text-[var(--ca-muted)]">
          {{ tcf('corongWa.pecahan') }}
          <select v-model="kelompokAktif" :disabled="!data?.pecahan.length" class="ca-input min-w-0 w-full">
            <option value="">{{ tcf('corongWa.semuaKelompok') }}</option>
            <option v-for="k in data?.pecahan ?? []" :key="kunciKelompokCorong(k)" :value="kunciKelompokCorong(k)">
              {{ tcf(`corongWa.cara.${k.cara ?? 'belum_diketahui'}`) }} · {{ k.versi || tcf('perjalanan.versiAsing') }}
            </option>
          </select>
        </label>
      </div>
      <p v-if="!rentangSah" class="text-sm ca-tone-danger" role="alert">{{ tcf('corongWa.rentangSalah') }}</p>
      <CashflowPanelTab v-else :memuat="memuat" :galat="galat" :pesan-galat="pesanGalat" :ada-data="!!data">
        <template v-if="kelompok">
          <p class="mb-3 text-xs text-[var(--ca-muted)]">{{ tcf('corongWa.cakupan') }}</p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-xs text-[var(--ca-muted)]">
                  <th scope="col" class="py-2 text-left">{{ tcf('corongWa.tahap') }}</th>
                  <th scope="col" class="px-2 py-2 text-right">{{ tcf('corongWa.orang') }}</th>
                  <th scope="col" class="px-2 py-2 text-right">{{ tcf('corongWa.lanjut') }}</th>
                  <th scope="col" class="py-2 pl-2 text-right">{{ tcf('corongWa.berhenti') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[color:var(--ca-border)]">
                <tr v-for="l in kelompok.langkah" :key="l.kunci" class="text-[var(--ca-text)]">
                  <th scope="row" class="py-2 text-left font-medium">{{ tcf(`corongWa.langkah.${l.kunci}`) }}</th>
                  <td class="px-2 py-2 text-right tabular-nums">{{ formatAngka.format(l.orang) }}</td>
                  <td class="px-2 py-2 text-right tabular-nums">{{ l.lanjut == null ? '—' : `${formatAngka.format(l.lanjut)}%` }}</td>
                  <td class="py-2 pl-2 text-right tabular-nums">
                    <button
                      v-if="izin && l.berhenti" type="button" class="font-semibold underline decoration-dotted underline-offset-4"
                      :aria-label="tcf('corongWa.bukaTahap')(l.berhenti, tcf(`corongWa.langkah.${l.kunci}`))"
                      @click="pilihKasus(l)"
                    >{{ formatAngka.format(l.berhenti) }}</button>
                    <span v-else>{{ formatAngka.format(l.berhenti) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </CashflowPanelTab>
    </section>

    <details v-if="hitunganMentah.length" class="ca-console-dialog px-4 py-3 sm:px-5">
      <summary class="cursor-pointer text-sm font-medium text-[var(--ca-text)]">{{ tcf('corongWa.peristiwaTercatat') }}</summary>
      <dl class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div v-for="t in hitunganMentah" :key="t.langkah" class="flex justify-between gap-2 text-sm text-[var(--ca-muted)]">
          <dt>{{ t.judul }}</dt><dd class="tabular-nums">{{ formatAngka.format(t.jumlah) }}</dd>
        </div>
      </dl>
    </details>

    <CashflowLaci :show="!!pilihan && izin" :judul="tcf('corongWa.bukaKasus')" @close="pilihan = null">
      <form v-if="pilihan" class="space-y-4" @submit.prevent="bukaKasus">
        <p class="text-sm text-[var(--ca-text)]">
          {{ tcf('corongWa.berhentiDi')(tcf(`corongWa.langkah.${pilihan.langkah.kunci}`), pilihan.langkah.berhenti) }}
        </p>
        <label class="flex flex-col gap-1 text-sm text-[var(--ca-muted)]">
          {{ tcf('corongWa.posisi')(pilihan.langkah.berhenti) }}
          <input v-model.number="posisi" type="number" min="1" :max="pilihan.langkah.berhenti" step="1" required :disabled="membuka" class="ca-input">
        </label>
        <label class="flex flex-col gap-1 text-sm text-[var(--ca-muted)]">
          {{ tcf('corongWa.alasan') }}
          <textarea v-model="alasan" :minlength="MIN_ALASAN" maxlength="500" rows="3" required :disabled="membuka" class="ca-input" />
        </label>
        <p v-if="batas" role="alert" class="text-sm ca-tone-danger">{{ tcf('kasus.batas')(batas.batas.jam, batas.batas.hari) }}</p>
        <p v-if="galatKasus" role="alert" class="text-sm ca-tone-danger">{{ galatKasus }}</p>
        <button type="submit" class="ca-btn-primary" :disabled="membuka || alasan.trim().length < MIN_ALASAN">
          {{ membuka ? tcf('umum.memuat') : tcf('corongWa.bukaKasus') }}
        </button>
      </form>
    </CashflowLaci>
  </div>
</template>
