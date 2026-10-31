<script setup lang="ts">
/**
 * Dukungan — dukungan sukarela dari halaman /dukung (QRIS lewat Xendit),
 * kelak juga Google Play. Migrasi 0118.
 *
 * - Ringkasan rentang (admin_dukungan_ringkas): uang masuk, rata-rata, QR
 *   yang ditinggal, dan perkiraan biaya penyedia. Biaya dihitung per QR yang
 *   DIBUAT, bukan per QR yang dibayar, jadi QR yang ditinggal ikut terlihat.
 *   Dukungan uji (kunci mode uji) tidak dihitung; jumlahnya disebut kecil.
 * - Daftar (admin_dukungan_daftar): terbaru dulu, saringan sumber, status,
 *   dan rentang di URL (?sumber, ?status, ?hari; replace). "Muat lagi"
 *   memakai p_sebelum = `dibuat` baris terakhir.
 * - Nama dan pesan ditulis pengunjung: interpolasi biasa, tidak pernah dirender
 *   sebagai HTML. Tag di dalamnya tampil sebagai teks.
 * - RPC belum ada (console tayang lebih dulu dari 0118): PGRST202, atau
 *   42883 yang menyebut RPC itu sendiri, ditulis "fitur belum aktif".
 *
 * Izin view (middleware cashflow-admin), tanpa audit: tidak ada data akun
 * pengguna aplikasi di sini. Dukungan web tidak terhubung ke akun mana pun.
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import { rupiah } from '~/adapters/cashflow'
import { hariIniWib } from '~/adapters/cashflowWaktu'
import {
  RENTANG_DUKUNGAN, SARING_STATUS, SARING_SUMBER, STATUS_DUKUNGAN,
  barisDukungan, gabungDukungan, keDukungan, keRingkasDukungan, kursorDukungan, pillStatus, rentangDukungan, saringKeServer,
  type Dukungan, type RingkasDukungan,
} from '~/adapters/cashflowDukungan'
import type { SkemaQuery } from '~/adapters/cashflowQuery'

const { tcf, formatWaktu } = useCashflowI18n()
const { tc } = useConsoleI18n()
const api = useCashflowAdmin()
const { memuat, galat, pesanGalat, muat, aksi, batal } = useCashflowMuat({ awal: true })

const SKEMA = {
  sumber: { jenis: 'pilihan', opsi: SARING_SUMBER, bawaan: 'semua' },
  status: { jenis: 'pilihan', opsi: SARING_STATUS, bawaan: 'semua' },
  hari: { jenis: 'pilihan', opsi: RENTANG_DUKUNGAN, bawaan: '30' },
} as const satisfies SkemaQuery
const { nilai: q, setel } = useCashflowQuery(SKEMA)

const ringkas = shallowRef<RingkasDukungan | null>(null)
const daftar = shallowRef<Dukungan[]>([])
const adaLagi = ref(false)
const memuatLagi = ref(false)
const belumAktif = computed(() => galat.value?.jenis === 'belum-aktif')
const tersaring = computed(() => q.value.sumber !== 'semua' || q.value.status !== 'semua')

/** Kunci saringan saat ini; jawaban "muat lagi" untuk saringan lama dibuang. */
const kunciSaring = () => `${q.value.sumber}|${q.value.status}|${q.value.hari}`
const argumenDaftar = () => {
  const { dari, sampai } = rentangDukungan(q.value.hari, hariIniWib())
  return { sumber: saringKeServer(q.value.sumber), status: saringKeServer(q.value.status), dari, sampai }
}

const muatSemua = () => muat(async (terbaru) => {
  const a = argumenDaftar()
  const [r, d] = await Promise.all([
    api.dukunganRingkas(a.dari, a.sampai),
    api.dukunganDaftar(a.sumber, a.status, a.dari, a.sampai, null),
  ])
  if (!terbaru()) return
  ringkas.value = keRingkasDukungan(r)
  daftar.value = barisDukungan(d).map(keDukungan)
  adaLagi.value = d?.ada_lagi === true
})
watch(kunciSaring, () => {
  daftar.value = []
  adaLagi.value = false
  muatSemua()
})
onMounted(muatSemua)
onBeforeUnmount(batal)

const muatLagi = async () => {
  if (memuatLagi.value || !adaLagi.value) return
  memuatLagi.value = true
  const kunci = kunciSaring()
  try {
    await aksi(async () => {
      const a = argumenDaftar()
      const d = await api.dukunganDaftar(a.sumber, a.status, a.dari, a.sampai, kursorDukungan(daftar.value))
      if (kunci !== kunciSaring()) return
      daftar.value = gabungDukungan(daftar.value, barisDukungan(d).map(keDukungan))
      adaLagi.value = d?.ada_lagi === true
    })
  } finally {
    memuatLagi.value = false
  }
}

const opsiSumber = computed(() => SARING_SUMBER.map(s => ({ nilai: s, label: tcf(`dukungan.sumberOpsi.${s}`) as string })))
const opsiHari = computed(() => RENTANG_DUKUNGAN.map(h => ({ nilai: h, label: tcf('dukungan.hari')(Number(h)) })))
const pilihStatus = (e: Event) => {
  const v = (e.target as HTMLSelectElement).value
  const s = SARING_STATUS.find(x => x === v)
  if (s) setel({ status: s })
}

/** Keterangan ubin QR: yang paling perlu perhatian dulu. */
const ketQr = computed(() => {
  const r = ringkas.value
  if (!r) return ''
  const bagian: string[] = []
  if (r.perluTinjau) bagian.push(tcf('dukungan.ubin.qrTinjau')(r.perluTinjau))
  if (r.menunggu) bagian.push(tcf('dukungan.ubin.qrMenunggu')(r.menunggu))
  if (r.gagalDibuat) bagian.push(tcf('dukungan.ubin.qrGagal')(r.gagalDibuat))
  return bagian.length ? bagian.join(' · ') : tcf('dukungan.ubin.qrKet')
})
const labelNominal = (n: string) => (n === 'lain' ? tcf('dukungan.nominalLain') : rupiah(Number(n)))

useConsoleRemah().pasang(() => [
  { label: tc('layout.cashflow'), to: '/console/cashflow' },
  { label: tcf('nav.dukungan') },
])
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('dukungan.judul')" kicker="CashFlow"><template #meta><CashflowNav /></template></ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('dukungan.ket') }}</p>

    <div v-if="belumAktif" class="flex items-start gap-3 rounded-xl border border-dashed border-[color:var(--ca-border)] px-4 py-5 text-sm text-[var(--ca-muted)]" role="status" data-uji="dukungan-belum-aktif">
      <Icon name="lucide:hourglass" class="mt-0.5 h-5 w-5 shrink-0 text-[var(--ca-subtle)]" />
      <span>{{ tcf('dukungan.belumAktif') }}</span>
    </div>
    <p v-else-if="pesanGalat" class="text-sm ca-tone-danger" role="alert">{{ pesanGalat }}</p>
    <p v-else-if="memuat && !ringkas" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>

    <template v-if="ringkas && !belumAktif && !pesanGalat">
      <p v-if="!ringkas.buka" class="rounded-xl border border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)] px-4 py-2 text-xs text-[var(--ca-text)]" data-uji="dukungan-tutup">
        {{ tcf('dukungan.tutup') }} <NuxtLink to="/console/cashflow/sakelar" class="font-semibold underline">{{ tcf('nav.sakelar') }}</NuxtLink>.
      </p>

      <div class="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <CashflowStatTile
          icon="lucide:heart-handshake" warna="emerald" :label="tcf('dukungan.ubin.masuk')(Number(q.hari))"
          :nilai="rupiah(ringkas.masuk)" :keterangan="tcf('dukungan.ubin.masukKet')(ringkas.lunas)"
        />
        <CashflowStatTile
          icon="lucide:trending-up" warna="sky" :label="tcf('dukungan.ubin.rata')"
          :nilai="ringkas.lunas ? rupiah(ringkas.rata) : '—'" :keterangan="tcf('dukungan.ubin.rataKet')"
        />
        <CashflowStatTile
          icon="lucide:clock" warna="rose" :label="tcf('dukungan.ubin.qr')"
          :nilai="tcf('dukungan.ubin.qrNilai')(ringkas.qrTidakDibayar, ringkas.qrDibuat)" :keterangan="ketQr"
        />
        <CashflowStatTile
          icon="lucide:receipt" warna="amber" :label="tcf('dukungan.ubin.biaya')"
          :nilai="rupiah(ringkas.biayaPerkiraan)" :keterangan="tcf('dukungan.ubin.biayaKet')(rupiah(ringkas.bersihPerkiraan))"
        />
      </div>

      <div class="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section class="ca-console-dialog min-w-0 overflow-hidden" aria-labelledby="cf-dukungan-daftar">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--ca-border)] p-4">
            <h2 id="cf-dukungan-daftar" class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('dukungan.daftar') }}</h2>
            <div class="flex flex-wrap items-center gap-2">
              <CashflowSegmen :opsi="opsiSumber" :nilai="q.sumber" :label="tcf('dukungan.saringSumber')" @pilih="(v) => setel({ sumber: v })" />
              <select
                class="ca-input !w-auto !rounded-full !py-1 text-sm" :value="q.status" :aria-label="tcf('dukungan.saringStatus')"
                data-uji="dukungan-status" @change="pilihStatus"
              >
                <option value="semua">{{ tcf('dukungan.semuaStatus') }}</option>
                <option v-for="s in STATUS_DUKUNGAN" :key="s" :value="s">{{ tcf(`dukungan.status.${s}`) }}</option>
              </select>
              <CashflowSegmen :opsi="opsiHari" :nilai="q.hari" :label="tcf('dukungan.saringRentang')" @pilih="(v) => setel({ hari: v })" />
            </div>
          </div>

          <div v-if="!daftar.length" class="p-4">
            <CashflowKeadaanKosong :pesan="memuat ? tcf('umum.memuat') : tersaring ? tcf('umum.kosongSaring') : tcf('dukungan.kosong')" icon="lucide:heart-handshake" />
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm" data-uji="dukungan-tabel">
              <thead>
                <tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
                  <th class="px-4 py-2.5 font-semibold">{{ tcf('dukungan.kolom.waktu') }}</th>
                  <th class="px-3 py-2.5 font-semibold">{{ tcf('dukungan.kolom.kode') }}</th>
                  <th class="px-3 py-2.5 font-semibold">{{ tcf('dukungan.kolom.sumber') }}</th>
                  <th class="px-3 py-2.5 text-right font-semibold">{{ tcf('dukungan.kolom.nominal') }}</th>
                  <th class="px-3 py-2.5 font-semibold">{{ tcf('dukungan.kolom.status') }}</th>
                  <th class="px-3 py-2.5 font-semibold">{{ tcf('dukungan.kolom.nama') }}</th>
                  <th class="px-4 py-2.5 font-semibold">{{ tcf('dukungan.kolom.pesan') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in daftar" :key="d.kode" class="border-t border-[color:var(--ca-border)] align-top text-[var(--ca-text)]" :class="d.uji ? 'opacity-70' : ''">
                  <td class="whitespace-nowrap px-4 py-2.5 tabular-nums text-[var(--ca-muted)]">{{ formatWaktu(d.dibuatIso) }}</td>
                  <td class="whitespace-nowrap px-3 py-2.5">
                    <span class="font-mono text-xs">{{ d.kode }}</span>
                    <span v-if="d.uji" class="ca-pill-muted ml-1.5 !px-2 !py-0.5" :title="tcf('dukungan.ujiKet')">{{ tcf('dukungan.uji') }}</span>
                  </td>
                  <td class="whitespace-nowrap px-3 py-2.5">
                    {{ d.sumber ? tcf(`dukungan.sumber.${d.sumber}`) : '—' }}
                    <span v-if="d.penerbit" class="block text-xs text-[var(--ca-subtle)]">{{ d.penerbit }}</span>
                  </td>
                  <td class="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums">
                    {{ rupiah(d.jumlah) }}
                    <span v-if="d.jumlahDibayarBeda != null" class="block text-xs font-normal ca-tone-gold">{{ tcf('dukungan.dibayar')(rupiah(d.jumlahDibayarBeda)) }}</span>
                  </td>
                  <td class="whitespace-nowrap px-3 py-2.5">
                    <span :class="pillStatus(d.status)">{{ d.status ? tcf(`dukungan.status.${d.status}`) : '—' }}</span>
                  </td>
                  <td class="max-w-[10rem] break-words px-3 py-2.5">{{ d.nama ?? '—' }}</td>
                  <td class="min-w-[14rem] max-w-[28rem] whitespace-pre-wrap break-words px-4 py-2.5 text-[var(--ca-muted)]">{{ d.pesan ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="adaLagi" class="border-t border-[color:var(--ca-border)] p-3 text-center">
            <button type="button" class="ca-btn-secondary text-sm" :disabled="memuatLagi" @click="muatLagi">
              {{ memuatLagi ? tcf('dukungan.memuatLagi') : tcf('dukungan.muatLagi') }}
            </button>
          </div>
        </section>

        <aside class="ca-console-dialog space-y-4 p-5" aria-labelledby="cf-dukungan-nominal">
          <h2 id="cf-dukungan-nominal" class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('dukungan.perNominal') }}</h2>
          <ul class="grid gap-x-8 gap-y-3 sm:grid-cols-2 2xl:grid-cols-1" data-uji="dukungan-nominal">
            <li v-for="n in ringkas.perNominal" :key="n.nominal">
              <div class="flex items-baseline justify-between gap-2 text-sm">
                <span class="text-[var(--ca-text)]">{{ labelNominal(n.nominal) }}</span>
                <span class="text-xs font-semibold tabular-nums text-[var(--ca-muted)]">{{ tcf('dukungan.dibayarDari')(n.dibayar, n.qr) }}</span>
              </div>
              <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--ca-panel-bg-strong)]">
                <div
                  class="h-full rounded-full"
                  :class="n.porsi != null && n.porsi < 0.5 ? 'bg-[var(--ca-gold-text)]' : 'bg-[var(--ca-emerald-text)]'"
                  :style="{ width: `${Math.round((n.porsi ?? 0) * 100)}%` }"
                />
              </div>
            </li>
          </ul>
          <p class="border-t border-[color:var(--ca-border)] pt-3 text-xs leading-relaxed text-[var(--ca-subtle)]">{{ tcf('dukungan.biayaCatatan') }}</p>
          <p class="border-t border-[color:var(--ca-border)] pt-3 text-xs leading-relaxed text-[var(--ca-subtle)]">
            {{ ringkas.play.lunas ? tcf('dukungan.play')(ringkas.play.lunas, rupiah(ringkas.play.masuk)) : tcf('dukungan.playKosong') }}
          </p>
          <p v-if="ringkas.ujiDisembunyikan" class="text-xs text-[var(--ca-subtle)]" data-uji="dukungan-uji">{{ tcf('dukungan.ujiDisembunyikan')(ringkas.ujiDisembunyikan) }}</p>
        </aside>
      </div>
    </template>
  </div>
</template>
