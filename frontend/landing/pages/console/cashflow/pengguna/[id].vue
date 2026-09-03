<script setup lang="ts">
/**
 * Detail satu orang — HANYA sesudah alasan. Alasan tersimpan 15 menit per
 * pengguna di memori halaman (bukan storage): membuka tab Transaksi orang yang
 * sama tidak bertanya lagi; orang lain bertanya. Catatan bebas transaksi
 * disembunyikan sampai alasan tingkat investigasi — itu aksi audit terpisah.
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import { tanggalPendek, rupiah, angka, jedaDaftarKeCatatan } from '~/adapters/cashflow'
import type { DetailPenggunaDTO, AktivitasDTO } from '~/adapters/cashflow'
const { tcf } = useCashflowI18n()
const api = useCashflowAdmin()
const route = useRoute()
const id = computed(() => String(route.params.id))

const gerbang = ref(true)
const gerbangInvestigasi = ref(false)
const alasan = ref('')
const alasanPada = ref('')
const detail = ref<DetailPenggunaDTO | null>(null)
const aktivitas = ref<AktivitasDTO[]>([])
const transaksi = ref<any[]>([])
const tampilkanCatatan = ref(false)
const memuat = ref(false)
const galat = ref('')

const buka = async (a: string) => {
  gerbang.value = false; alasan.value = a; alasanPada.value = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  memuat.value = true; galat.value = ''
  try {
    const [d, ak, tx] = await Promise.all([
      api.detailPengguna(id.value, a),
      api.aktivitasPengguna(id.value, a, 100),
      api.transaksiPengguna(id.value, a, 100),
    ])
    detail.value = d; aktivitas.value = ak; transaksi.value = tx
  } catch (e: any) {
    galat.value = e?.jenis === 'bukan-admin' ? tcf('umum.bukanAdmin') : e?.jenis === 'alasan' ? tcf('alasan.pendek') : (e?.message ?? tcf('umum.gagal'))
    if (e?.jenis === 'totp') navigateTo({ path: '/console/cashflow/masuk', query: { sebab: 'totp', ke: route.fullPath } })
  } finally { memuat.value = false }
}

/** Catatan bebas: alasan kedua, dicatat server sebagai baca_transaksi ulang
 *  dengan alasan bertingkat "INVESTIGASI — …" supaya terlihat jelas di audit. */
const bukaCatatan = async (a: string) => {
  gerbangInvestigasi.value = false
  try {
    transaksi.value = await api.transaksiPengguna(id.value, `INVESTIGASI — ${a}`, 100)
    tampilkanCatatan.value = true
  } catch (e: any) { galat.value = e?.message ?? tcf('umum.gagal') }
}

const totalMasuk = computed(() => (detail.value?.ruang ?? []).reduce((s, r) => s + Number(r.pemasukan || 0), 0))
const totalKeluar = computed(() => (detail.value?.ruang ?? []).reduce((s, r) => s + Number(r.pengeluaran || 0), 0))
const totalTx = computed(() => (detail.value?.ruang ?? []).reduce((s, r) => s + Number(r.transaksi || 0), 0))
const catatanPertama = computed(() => {
  const t = [...transaksi.value].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))[0]
  return t?.created_at ?? null
})
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('pengguna.detail')" kicker="CashFlow">
      <template #meta><CashflowNav /></template>
    </ConsolePageHeader>

    <CashflowReasonGate :show="gerbang" @close="navigateTo('/console/cashflow/pengguna')" @konfirmasi="buka" />
    <CashflowReasonGate :show="gerbangInvestigasi" investigasi @close="gerbangInvestigasi = false" @konfirmasi="bukaCatatan" />

    <p v-if="galat" class="text-sm text-rose-600">{{ galat }}</p>
    <p v-else-if="memuat" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>

    <template v-else-if="detail">
      <p class="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-[var(--ca-text)]">
        {{ tcf('pengguna.dibukaDengan') }}: <strong>{{ alasan }}</strong> · {{ tcf('pengguna.pada') }} {{ alasanPada }}
      </p>

      <section class="ca-console-dialog p-5">
        <h2 class="font-display text-xl font-bold text-[var(--ca-text)]">{{ detail.email }}</h2>
        <p class="text-sm text-[var(--ca-muted)]">{{ detail.display_name || '—' }} · {{ tcf('pengguna.daftar') }} {{ tanggalPendek(detail.created_at) }} · {{ tcf('pengguna.masuk') }} {{ tanggalPendek(detail.last_sign_in) }}</p>
        <p class="mt-2 text-sm text-[var(--ca-text)]">{{ jedaDaftarKeCatatan(detail.created_at, catatanPertama) }}</p>
      </section>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CashflowStatTile icon="lucide:layers" warna="sky" :label="tcf('pengguna.ruangnya')" :nilai="detail.ruang.length" />
        <CashflowStatTile icon="lucide:list" warna="amber" :label="tcf('pengguna.transaksi')" :nilai="angka(totalTx)" />
        <CashflowStatTile icon="lucide:arrow-down-left" warna="emerald" :label="tcf('pengguna.kolom.masuk')" :nilai="rupiah(totalMasuk)" />
        <CashflowStatTile icon="lucide:arrow-up-right" warna="rose" :label="tcf('pengguna.kolom.keluar')" :nilai="rupiah(totalKeluar)" />
      </div>

      <section class="ca-console-dialog overflow-x-auto p-5">
        <h3 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('pengguna.ruangnya') }}</h3>
        <table class="mt-3 w-full text-sm">
          <thead><tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
            <th class="py-2 pr-3">{{ tcf('pengguna.kolom.nama') }}</th><th class="py-2 px-3">{{ tcf('pengguna.kolom.peran') }}</th>
            <th class="py-2 px-3 text-right">{{ tcf('pengguna.kolom.anggota') }}</th><th class="py-2 px-3 text-right">{{ tcf('pengguna.kolom.tx') }}</th>
            <th class="py-2 px-3 text-right">{{ tcf('pengguna.kolom.masuk') }}</th><th class="py-2 px-3 text-right">{{ tcf('pengguna.kolom.keluar') }}</th>
            <th class="py-2 px-3 text-right">{{ tcf('pengguna.kolom.dompet') }}</th><th class="py-2 pl-3 text-right">{{ tcf('pengguna.kolom.jadwal') }}</th>
          </tr></thead>
          <tbody>
            <tr v-for="r in detail.ruang" :key="r.workspace_id" class="border-t border-[color:var(--ca-border)] text-[var(--ca-text)]">
              <td class="py-2 pr-3">{{ r.nama }}</td><td class="py-2 px-3">{{ r.peran }}{{ r.pemilik ? ' · pemilik' : '' }}</td>
              <td class="py-2 px-3 text-right tabular-nums">{{ r.anggota }}</td><td class="py-2 px-3 text-right tabular-nums">{{ r.transaksi }}</td>
              <td class="py-2 px-3 text-right tabular-nums">{{ rupiah(r.pemasukan) }}</td><td class="py-2 px-3 text-right tabular-nums">{{ rupiah(r.pengeluaran) }}</td>
              <td class="py-2 px-3 text-right tabular-nums">{{ r.dompet }}</td><td class="py-2 pl-3 text-right tabular-nums">{{ r.jadwal }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="ca-console-dialog p-5">
        <h3 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('pengguna.aktivitas') }}</h3>
        <CashflowKeadaanKosong v-if="!aktivitas.length" class="mt-3" :pesan="tcf('umum.kosong')" icon="lucide:activity" />
        <ol v-else class="mt-3 space-y-1.5 text-sm">
          <li v-for="(a, i) in aktivitas" :key="i" class="flex flex-wrap items-baseline gap-x-3 border-t border-[color:var(--ca-border)] pt-1.5 first:border-0">
            <span class="w-24 shrink-0 text-xs text-[var(--ca-subtle)] tabular-nums">{{ tanggalPendek(a.tanggal) }}</span>
            <span class="rounded-full bg-[var(--ca-panel-bg-strong)] px-2 text-xs text-[var(--ca-muted)]">{{ a.jenis }}</span>
            <span class="text-[var(--ca-text)]">{{ a.judul || '—' }}</span>
            <span v-if="a.nominal != null" class="ml-auto tabular-nums" :class="a.arah === 'masuk' ? 'text-emerald-600' : 'text-rose-600'">{{ rupiah(a.nominal) }}</span>
          </li>
        </ol>
      </section>

      <section class="ca-console-dialog overflow-x-auto p-5">
        <div class="flex items-center justify-between gap-3">
          <h3 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('pengguna.transaksi') }}</h3>
          <button v-if="!tampilkanCatatan" type="button" class="ca-btn-secondary text-xs" @click="gerbangInvestigasi = true">{{ tcf('pengguna.tampilkanCatatan') }}</button>
        </div>
        <p v-if="!tampilkanCatatan" class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('pengguna.catatanTersembunyi') }}</p>
        <table class="mt-3 w-full text-sm">
          <thead><tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
            <th class="py-2 pr-3">{{ tcf('aktivitas.tanggal') }}</th><th class="py-2 px-3">{{ tcf('pengguna.ruangnya') }}</th>
            <th class="py-2 px-3">{{ tcf('pengguna.kolom.dompet') }}</th><th class="py-2 px-3">Kategori</th>
            <th v-if="tampilkanCatatan" class="py-2 px-3">Catatan</th><th class="py-2 pl-3 text-right">{{ tcf('aktivitas.nominal') }}</th>
          </tr></thead>
          <tbody>
            <tr v-for="t in transaksi" :key="t.id" class="border-t border-[color:var(--ca-border)] text-[var(--ca-text)]">
              <td class="py-1.5 pr-3 whitespace-nowrap">{{ tanggalPendek(t.occurred_at) }}</td>
              <td class="py-1.5 px-3">{{ t.workspace }}</td><td class="py-1.5 px-3">{{ t.wallet }}</td><td class="py-1.5 px-3">{{ t.category || '—' }}</td>
              <td v-if="tampilkanCatatan" class="py-1.5 px-3 text-[var(--ca-muted)]">{{ t.note || '—' }}</td>
              <td class="py-1.5 pl-3 text-right tabular-nums" :class="t.kind === 'income' ? 'text-emerald-600' : 'text-rose-600'">{{ rupiah(t.amount) }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>
