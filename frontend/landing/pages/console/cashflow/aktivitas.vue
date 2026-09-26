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
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import { alasanSelidiki, tujuanSelidiki, type AktivitasV2DTO } from '~/adapters/cashflowRuang'
import { adalahBatasAkses } from '~/adapters/cashflowKasus'

const { tcf, formatTanggal } = useCashflowI18n()
const api = useCashflowAdmin()
const toast = useToast()
const { memuat, pesanGalat, muat, aksi } = useCashflowMuat({ awal: true })
const rows = ref<AktivitasV2DTO[]>([])
onMounted(() => muat(async () => { rows.value = await api.aktivitasTerbaru(150) }))

/** Satu Selidiki berjalan pada satu waktu: klik ganda tidak membuka dua kasus. */
const sibuk = ref<number | null>(null)
const selidiki = async (id: number) => {
  if (sibuk.value !== null) return
  sibuk.value = id
  try {
    await aksi(async () => {
      const d = await api.kasusBukaDariPeristiwa(id, alasanSelidiki(new Date()))
      if (adalahBatasAkses(d)) {
        toast.error(tcf('kasus.batas')(d.batas.jam, d.batas.hari))
        return
      }
      const ke = tujuanSelidiki(d)
      if (ke) await navigateTo(ke)
      else toast.error(tcf('selidiki.gagal'))
    })
  } finally {
    sibuk.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('aktivitas.judul')" kicker="CashFlow"><template #meta><CashflowNav /></template></ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('aktivitas.ket') }} {{ tcf('selidiki.ket') }}</p>
    <p v-if="pesanGalat" class="text-sm ca-tone-danger">{{ pesanGalat }}</p>
    <p v-else-if="memuat" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>
    <div v-else class="ca-console-dialog overflow-x-auto">
      <CashflowKeadaanKosong v-if="!rows.length" class="m-5" :pesan="tcf('umum.kosong')" icon="lucide:activity" />
      <table v-else class="w-full text-sm">
        <thead><tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
          <th class="px-4 py-2">{{ tcf('aktivitas.tanggal') }}</th>
          <th class="px-4 py-2">{{ tcf('aktivitas.jenis') }}</th><th class="px-4 py-2">{{ tcf('aktivitas.nominal') }}</th>
          <th class="px-4 py-2"><span class="sr-only">{{ tcf('selidiki.tombol') }}</span></th>
        </tr></thead>
        <tbody>
          <tr v-for="r in rows" :key="r.id" class="border-t border-[color:var(--ca-border)] text-[var(--ca-text)]">
            <td class="px-4 py-1.5 whitespace-nowrap">{{ formatTanggal(r.tanggal) }}</td>
            <td class="px-4 py-1.5"><span class="rounded-full bg-[var(--ca-panel-bg-strong)] px-2 text-xs">{{ r.jenis }}</span></td>
            <td class="px-4 py-1.5 tabular-nums">{{ r.rentang_nominal }}</td>
            <td class="px-4 py-1.5 text-right">
              <button
                type="button" class="ca-btn-secondary !px-3 !py-1 text-xs" :disabled="sibuk !== null"
                :aria-busy="sibuk === r.id" @click="selidiki(r.id)"
              >{{ sibuk === r.id ? tcf('selidiki.membuka') : tcf('selidiki.tombol') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
