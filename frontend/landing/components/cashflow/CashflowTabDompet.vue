<script setup lang="ts">
/**
 * Tab Dompet bersama Pengguna 360 dan Ruang 360 — ranah `dompet` (T2).
 *   mode 'pengguna'  admin_dompet_ruang(p_ws null) = dompet di SEMUA ruang
 *                    lingkup kasus, dikelompokkan per ruang;
 *   mode 'ruang'     dompet ruang itu + Pemeriksaan (admin_periksa_ruang):
 *                    hitungan anomali yang bertaut ke tab Transaksi ?cek=
 *                    (server menghitung ulang id-nya, tidak ada daftar id di
 *                    URL).
 * Saldo = saldo awal + semua mutasi (server; sama dengan saldo_dompet
 * aplikasi). Mutasi satu dompet di laci ?dompet=<uuid> (push; Back menutup),
 * halaman keyset ?kursor= (push), baris bertaut ke laci transaksi ?tx=.
 *
 * SATU KLIK: kasus Pengguna 360 dibuka tanpa ranah dompet; membuka tab ini =
 * ranah dompet ditambahkan otomatis (sekali per kasus, alasan diwarisi,
 * tercatat di audit). Tidak ada tombol perantara.
 *
 * Jawaban disimpan per kasus+lingkup di useCashflowKasus (pindah tab tidak
 * memanggil ulang; dibuang saat kasus habis).
 */
import { POLA_UUID, rupiah, angka } from '~/adapters/cashflow'
import { POLA_KURSOR_URL, kursorTransaksiDariUrl, tanggalJam } from '~/adapters/cashflowBuku'
import {
  keDompet, keRingkasDompet, keMutasiBaris, kePemeriksaan,
  type DompetRuangDTO, type MutasiDompetDTO, type PeriksaRuangDTO, type Dompet,
} from '~/adapters/cashflowRuang'
import { tulisQuery, type SkemaQuery } from '~/adapters/cashflowQuery'

const props = defineProps<{
  mode: 'pengguna' | 'ruang'
  /** Ruang (mode ruang); null = semua ruang lingkup kasus (mode pengguna). */
  ws: string | null
  /** Akar rute subjek, untuk tautan ?tx= dan ?cek=. */
  dasar: string
  namaRuang: (ws: string) => string
  labelOrang?: (uid: string | null) => string
}>()

const { tcf, bahasa, formatTanggal, formatWaktu } = useCashflowI18n()
const api = useCashflowAdmin()
const route = useRoute()
const router = useRouter()
const kasus = useCashflowKasus()
const { memuat, galat, pesanGalat, muat, aksi } = useCashflowMuat()
const periksaMuat = useCashflowMuat()
const mutasiMuat = useCashflowMuat()

const SKEMA = {
  dompet: { jenis: 'teks', pola: POLA_UUID, maks: 36, bawaan: '' },
  kursor: { jenis: 'teks', pola: POLA_KURSOR_URL, maks: 600, bawaan: '' },
} as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)

// ── Ranah dompet otomatis (satu klik) ──────────────────────────────────
const ditambahUntuk = ref<string | null>(null)
watch(() => [kasus.kasus.value?.id ?? null, kasus.kasus.value ? kasus.punyaRanah('dompet') : true] as const, ([id, punya]) => {
  if (!id || punya || ditambahUntuk.value === id || kasus.kasus.value?.anak) return
  ditambahUntuk.value = id
  void aksi(() => kasus.tambah(['dompet']))
}, { immediate: true })

// ── Dompet + ringkas ───────────────────────────────────────────────────
const kunci = computed(() => (kasus.kunciKasus.value && kasus.punyaRanah('dompet') ? `${kasus.kunciKasus.value}|dompet:${props.ws ?? '*'}` : null))
const mentah = computed(() => kasus.data<DompetRuangDTO>(kunci.value))
watch(kunci, (k) => {
  if (!k || mentah.value) return
  const ws = props.ws
  muat(async () => { await kasus.muatData(k, kk => api.dompetRuang(kk.id, ws)) })
}, { immediate: true })

const dompet = computed(() => mentah.value?.baris.map(keDompet) ?? [])
const ringkas = computed(() => mentah.value?.ringkas.map(keRingkasDompet) ?? [])
/** Per ruang (urut ringkas server); ruang tanpa dompet tetap tampil ringkasnya. */
const kelompok = computed(() => ringkas.value.map(r => ({
  r, nama: props.namaRuang(r.ruangId), dompet: dompet.value.filter(d => d.ruangId === r.ruangId),
})))

// ── Pemeriksaan (mode ruang) ───────────────────────────────────────────
const kunciPeriksa = computed(() => (props.mode === 'ruang' && props.ws && kunci.value ? `${kasus.kunciKasus.value}|periksa:${props.ws}` : null))
const mentahPeriksa = computed(() => kasus.data<PeriksaRuangDTO>(kunciPeriksa.value))
watch(kunciPeriksa, (k) => {
  if (!k || mentahPeriksa.value || !props.ws) return
  const ws = props.ws
  periksaMuat.muat(async () => { await kasus.muatData(k, kk => api.periksaRuang(kk.id, ws)) })
}, { immediate: true })
const periksa = computed(() => (mentahPeriksa.value ? kePemeriksaan(mentahPeriksa.value) : null))
const keCek = (cek: string) => `${props.dasar}/transaksi?cek=${cek}`

// ── Mutasi (?dompet=, ?kursor=) ────────────────────────────────────────
const kursor = computed(() => kursorTransaksiDariUrl(q.value.kursor))
const awalanMutasi = computed(() => (kunci.value && q.value.dompet ? `${kasus.kunciKasus.value}|mutasi:${q.value.dompet}|` : null))
const kunciMutasi = computed(() => (awalanMutasi.value ? `${awalanMutasi.value}${kursor.value ? q.value.kursor : ''}` : null))
const mentahMutasi = computed(() => kasus.data<MutasiDompetDTO>(kunciMutasi.value))
watch(kunciMutasi, (k) => {
  if (!k || mentahMutasi.value) return
  const w = q.value.dompet
  const ks = kursor.value
  mutasiMuat.muat(async () => { await kasus.muatData(k, kk => api.mutasiDompet(kk.id, w, ks, 100)) })
}, { immediate: true })
const mutasi = computed(() => mentahMutasi.value?.baris.map(keMutasiBaris) ?? [])
const totalMutasi = computed(() => mentahMutasi.value?.total ?? kasus.data<MutasiDompetDTO>(awalanMutasi.value)?.total ?? null)
const dompetTerbuka = computed<Dompet | null>(() => dompet.value.find(d => d.id === q.value.dompet) ?? null)
const judulLaci = computed(() => tcf('dompet.mutasiJudul')(dompetTerbuka.value?.nama ?? mentahMutasi.value?.dompet.nama ?? ''))

const { berikutnya, sebelumnya, pertama } = useCashflowKursor({
  kini: () => q.value.kursor,
  berikut: () => mentahMutasi.value?.kursor_berikut,
  ke: k => setel({ kursor: k }, { dorong: true }),
})
const bukaMutasi = (id: string) => setel({ dompet: id, kursor: '' }, { dorong: true })
const tutupMutasi = () => {
  const tanpa = router.resolve({ path: route.path, query: tulisQuery(SKEMA, { dompet: '', kursor: '' }) }).fullPath
  const b: unknown = import.meta.client ? window.history.state?.back : null
  if (b === tanpa) router.back()
  else setel({ dompet: '', kursor: '' })
}
const keTx = (id: string) => `${props.dasar}/transaksi?tx=${id}`
const labelPembuat = (uid: string | null) => (props.labelOrang ? props.labelOrang(uid) : (uid?.slice(0, 8) ?? '—'))
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('dompet.ket') }}</p>

    <CashflowPanelTab
      ranah="dompet" :memuat="memuat" :galat="galat" :pesan-galat="pesanGalat" :ada-data="!!mentah"
      :kosong="!!mentah && !dompet.length && !ringkas.length" :pesan-kosong="tcf('dompet.kosong')"
    >
      <div v-if="mentah" class="space-y-5" :class="{ 'opacity-60': memuat }">
        <section v-for="g in kelompok" :key="g.r.ruangId" class="space-y-2">
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 class="text-sm font-semibold text-[var(--ca-text)]">
              <NuxtLink v-if="mode === 'pengguna'" :to="`/console/cashflow/ruang/${g.r.ruangId}`" class="underline-offset-2 hover:underline">{{ g.nama }}</NuxtLink>
              <template v-else>{{ g.nama }}</template>
            </h3>
            <span class="text-xs text-[var(--ca-muted)]">
              {{ tcf('dompet.jumlahDompet')(g.r.jumlah) }} · {{ tcf('dompet.aset') }} {{ rupiah(g.r.aset) }} · {{ tcf('dompet.piutang') }} {{ rupiah(g.r.piutang) }}<template v-if="g.r.arsip"> · {{ tcf('dompet.arsip') }} {{ angka(g.r.arsip) }}</template>
            </span>
          </div>
          <ul v-if="g.dompet.length" class="ca-console-dialog divide-y divide-[color:var(--ca-border)] text-sm">
            <li v-for="d in g.dompet" :key="d.id" class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-medium text-[var(--ca-text)]">{{ d.nama }}</span>
                  <span v-if="d.tipe" class="ca-pill-muted text-[0.7rem]">{{ d.tipe }}</span>
                  <span v-if="d.arsip" class="ca-pill-muted text-[0.7rem]">{{ tcf('dompet.arsip') }}</span>
                  <span v-if="d.masaDepan" class="ca-pill-gold text-[0.7rem]">{{ tcf('dompet.masaDepan')(d.masaDepan) }}</span>
                  <CashflowSalinId :id="d.id" ikon />
                </div>
                <p class="mt-0.5 text-xs text-[var(--ca-muted)]">
                  {{ tcf('dompet.saldoAwal') }} {{ rupiah(d.saldoAwal) }} · {{ tcf('dompet.transaksi') }} {{ angka(d.transaksi) }}
                  <template v-if="d.terakhirTanggal"> · {{ tcf('dompet.terakhir') }} {{ formatTanggal(d.terakhirTanggal) }}</template>
                  <template v-if="d.batasKredit != null"> · {{ tcf('dompet.batasKredit') }} {{ rupiah(d.batasKredit) }}</template>
                  · {{ tcf('dompet.pembuat') }} <span class="font-mono">{{ labelPembuat(d.pembuat) }}</span>
                </p>
              </div>
              <div class="text-right">
                <div class="text-xs text-[var(--ca-muted)]">{{ tcf('dompet.saldo') }}</div>
                <div class="font-semibold tabular-nums" :class="d.saldo < 0 ? 'text-[var(--ca-danger-text)]' : 'text-[var(--ca-text)]'">{{ rupiah(d.saldo) }}</div>
              </div>
              <button type="button" class="ca-btn-secondary !px-3 !py-1 text-xs" @click="bukaMutasi(d.id)">{{ tcf('dompet.lihatMutasi') }}</button>
            </li>
          </ul>
        </section>
      </div>
    </CashflowPanelTab>

    <section v-if="mode === 'ruang' && kunci" class="ca-console-dialog p-4">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('periksa.judul') }}</h3>
      <p class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('periksa.ket') }}</p>
      <p v-if="periksaMuat.pesanGalat.value" class="mt-2 text-sm text-[var(--ca-danger-text)]" role="alert">{{ periksaMuat.pesanGalat.value }}</p>
      <p v-else-if="!periksa" class="mt-2 text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>
      <template v-else>
        <p v-if="!periksa.bermasalah" class="mt-2 text-sm text-[var(--ca-emerald-text)]">{{ tcf('periksa.bersih') }}</p>
        <ul class="mt-2 flex flex-wrap gap-2 text-sm">
          <li v-for="c in periksa.baris" :key="c.cek">
            <NuxtLink v-if="c.jumlah" :to="keCek(c.cek)" class="ca-pill-gold inline-flex items-center gap-1 underline-offset-2 hover:underline">
              {{ tcf(`saring.cekOpsi.${c.cek}`) }} · {{ tcf('periksa.jumlah')(c.jumlah) }}
            </NuxtLink>
            <span v-else class="ca-pill-muted">{{ tcf(`saring.cekOpsi.${c.cek}`) }} · 0</span>
          </li>
        </ul>
        <p class="mt-2 text-xs text-[var(--ca-subtle)]">{{ tcf('periksa.pada')(formatWaktu(periksa.padaIso)) }}</p>
      </template>
    </section>

    <CashflowLaci :show="!!q.dompet" :judul="judulLaci" @close="tutupMutasi">
      <div v-if="q.dompet" class="space-y-3">
        <p v-if="mutasiMuat.pesanGalat.value" class="text-sm text-[var(--ca-danger-text)]" role="alert">{{ mutasiMuat.pesanGalat.value }}</p>
        <p v-else-if="!mentahMutasi" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>
        <template v-else>
          <p class="text-sm text-[var(--ca-muted)]">{{ tcf('dompet.saldo') }} <span class="font-semibold tabular-nums text-[var(--ca-text)]">{{ rupiah(mentahMutasi.dompet.saldo) }}</span></p>
          <CashflowKeadaanKosong v-if="!mutasi.length" :pesan="tcf('umum.memangKosong')" />
          <ol v-else class="divide-y divide-[color:var(--ca-border)] text-sm" :class="{ 'opacity-60': mutasiMuat.memuat.value }">
            <li v-for="m in mutasi" :key="m.id">
              <NuxtLink :to="keTx(m.id)" class="flex items-center gap-3 py-2 hover:bg-[var(--ca-panel-bg-strong)]">
                <span class="w-28 shrink-0 text-xs tabular-nums text-[var(--ca-subtle)]">{{ tanggalJam(m.tanggal, m.jam, bahasa) }}</span>
                <span class="min-w-0 flex-1 truncate text-[var(--ca-text)]">{{ m.kategori || '—' }}<span v-if="m.masaDepan" class="ca-pill-gold ml-1 text-[0.7rem]">{{ tcf('transaksi.masaDepan') }}</span></span>
                <CashflowNominal :nilai="m.nominal" :jenis="m.jenis" :arah="m.arah" />
                <span class="w-28 shrink-0 text-right text-xs tabular-nums text-[var(--ca-muted)]" :title="tcf('dompet.saldoSetelah')">{{ rupiah(m.saldoSetelah) }}</span>
              </NuxtLink>
            </li>
          </ol>
          <CashflowPagerKursor
            v-if="mutasi.length" :halaman-pertama="!q.kursor" :ada-berikut="!!mentahMutasi.kursor_berikut"
            :jumlah="mutasi.length" :total="totalMutasi" :memuat="mutasiMuat.memuat.value"
            @berikutnya="berikutnya" @sebelumnya="sebelumnya" @pertama="pertama"
          />
        </template>
      </div>
    </CashflowLaci>
  </div>
</template>
