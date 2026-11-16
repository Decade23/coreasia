<script setup lang="ts">
/**
 * Denyut produk lintas ruang (T0, admin_aktivitas_terbaru_v2, 0094): jenis,
 * rentang nominal, dan tanggal — TANPA ruang, aktor, maupun jam (jam presisi
 * adalah kunci penggabung ke orang, 0089 §20).
 *
 * "Selidiki" = SATU KLIK (keputusan Master 21 Sep 2026): mengirim id
 * peristiwa saja; SERVER menentukan ruangnya dan membuka kasus ruang
 * (admin_kasus_buka_dari_peristiwa: butuh pii, batas laju, tercatat di
 * audit), lalu halaman pindah ke tab Jejak ruang itu. Id ruang tidak pernah
 * sampai ke peramban sebelum kasus terbuka. Tiap klik membuka kasus baru
 * (kasus lama atas ruang itu ditutup, tercatat di lanjutan_dari).
 *
 * Langkah usaha (0110) di atas tabel: agregat T0 dengan rentangnya sendiri.
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import { alasanSelidiki, tujuanSelidiki, type AktivitasV2DTO } from '~/adapters/cashflowRuang'
import { adalahBatasAkses } from '~/adapters/cashflowKasus'

const { tcf, formatTanggal } = useCashflowI18n()
const api = useCashflowAdmin()
const toast = useToast()
const { memuat, pesanGalat, muat, aksi } = useCashflowMuat({ awal: true })
const rows = ref<AktivitasV2DTO[]>([])
const muatAktivitas = () => muat(async () => { rows.value = await api.aktivitasTerbaru(150) })
onMounted(muatAktivitas)

/** Satu Selidiki berjalan pada satu waktu: klik ganda tidak membuka dua kasus. */
const { sibuk, jalankan: selidiki } = useCashflowSekaliJalan((id: number) => aksi(async () => {
  const d = await api.kasusBukaDariPeristiwa(id, alasanSelidiki(new Date()))
  if (adalahBatasAkses(d)) {
    toast.error(tcf('kasus.batas')(d.batas.jam, d.batas.hari))
    return
  }
  const ke = tujuanSelidiki(d)
  if (ke) await navigateTo(ke)
  else toast.error(tcf('selidiki.gagal'))
}))
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('aktivitas.judul')" kicker="CashFlow" ringkas><template #meta><CashflowNav /></template></ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('aktivitas.ket') }} {{ tcf('selidiki.ket') }}</p>
    <!-- Langkah usaha (0110): memuat sendiri, galatnya tidak menutup tabel peristiwa. -->
    <CashflowLangkahUsaha />
    <CashflowKeadaan
      v-if="pesanGalat && !rows.length" jenis="galat" :judul="tcf('umum.galatJudul')" :pesan="pesanGalat"
      :label-ulang="tcf('umum.cobaLagi')" @ulang="muatAktivitas()"
    />
    <CashflowKeadaan v-else-if="memuat && !rows.length" jenis="memuat" :pesan="tcf('umum.memuat')" :baris="6" :kolom="4" />
    <template v-else>
      <p v-if="pesanGalat" class="rounded-xl bg-[var(--ca-danger-bg)] px-4 py-3 text-sm font-semibold text-[var(--ca-danger-text)]" role="alert">{{ pesanGalat }}</p>
      <CashflowKeadaan v-if="!rows.length" jenis="kosong" icon="lucide:activity" :judul="tcf('umum.kosongJudul')" :pesan="tcf('umum.kosong')" />
      <CashflowTabel v-else>
        <thead><tr>
          <th scope="col">{{ tcf('aktivitas.tanggal') }}</th>
          <th scope="col">{{ tcf('aktivitas.jenis') }}</th><th scope="col" class="cf-ka">{{ tcf('aktivitas.nominal') }}</th>
          <th scope="col"><span class="sr-only">{{ tcf('selidiki.tombol') }}</span></th>
        </tr></thead>
        <tbody>
          <tr v-for="r in rows" :key="r.id">
            <td class="whitespace-nowrap">{{ formatTanggal(r.tanggal) }}</td>
            <td><span class="rounded-full bg-[var(--ca-panel-bg-strong)] px-2 py-0.5 text-xs font-semibold">{{ r.jenis }}</span></td>
            <td class="cf-ka whitespace-nowrap">{{ r.rentang_nominal }}</td>
            <td class="cf-ka">
              <button
                type="button" class="ca-btn-secondary !px-3 !py-1 text-xs" :disabled="sibuk !== null"
                :aria-busy="sibuk === r.id" @click="selidiki(r.id)"
              >{{ sibuk === r.id ? tcf('selidiki.membuka') : tcf('selidiki.tombol') }}</button>
            </td>
          </tr>
        </tbody>
      </CashflowTabel>
    </template>
  </div>
</template>
