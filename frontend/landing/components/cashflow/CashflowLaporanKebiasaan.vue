<script setup lang="ts">
/**
 * Kebiasaan pengguna aktif di halaman Laporan: tabel jumlah orang per butir,
 * lalu daftar orangnya saat satu baris diketuk.
 *
 * Komponen ini memanggil dua RPC-nya sendiri. Butir yang terbuka dan
 * halamannya milik pemanggil (di URL), supaya Back dari rincian pengguna
 * kembali ke daftar yang sama. Rentang hari mengikuti pemilih halaman Laporan.
 *
 * Identitas diperlakukan seperti laporan saldo: daftar orang butuh izin pii,
 * memakai alasan tetap dari adapter, dan setiap muatannya menulis satu baris
 * audit. Karena itu daftar hanya dimuat saat satu baris diketuk. Sesi tanpa
 * izin pii tidak memanggil daftar sama sekali dan ditawari verifikasi. Jumlah
 * per butir cukup izin view.
 */
import { angka } from '~/adapters/cashflow'
import { jumlahHalaman } from '~/adapters/cashflowDaftar'
import { tanggalPendek, waktuPendekWib } from '~/adapters/cashflowWaktu'
import {
  keDaftarKebiasaan, keKebiasaan, kunciBerlabel, kunciSah,
  type ButirKebiasaan, type DaftarKebiasaan, type Kebiasaan, type OrangKebiasaan,
} from '~/adapters/cashflowLaporanKebiasaan'

const props = defineProps<{ hari: number; butir: string; hal: number }>()
const emit = defineEmits<{ pilih: [kunci: string]; halaman: [hal: number] }>()

const { tcf, bahasa } = useCashflowI18n()
const api = useCashflowAdmin()
const sesi = useCashflowSesi()
const ringkasMuat = useCashflowMuat({ awal: true })
const daftarMuat = useCashflowMuat()

const kebiasaan = shallowRef<Kebiasaan | null>(null)
const daftar = shallowRef<DaftarKebiasaan | null>(null)
/** Kunci muatan daftar yang sedang tampil (penanda uji dan pemeriksa basi). */
const kunciTampil = ref('')

const muatRingkas = () => ringkasMuat.muat(async (terbaru) => {
  const d = await api.laporanKebiasaan(props.hari)
  if (!terbaru()) return
  kebiasaan.value = keKebiasaan(d)
})

const izinDaftar = computed(() => sesi.boleh('cashflow:pii'))
const butirTerbuka = computed(() => (kunciSah(props.butir) ? props.butir : ''))
const kunciDaftar = computed(() => (butirTerbuka.value && izinDaftar.value ? `${butirTerbuka.value}|${props.hari}|${props.hal}` : ''))
const muatDaftar = () => {
  const kunci = kunciDaftar.value
  if (!kunci) { daftarMuat.pakaiSimpanan(); daftar.value = null; kunciTampil.value = ''; return Promise.resolve(false) }
  /* Butir atau rentang lain: isi lama bukan milik daftar ini. Ganti halaman
     membiarkan isi lama tampil sampai yang baru tiba. */
  if (daftar.value && (daftar.value.kunci !== butirTerbuka.value || daftar.value.hari !== props.hari)) daftar.value = null
  return daftarMuat.muat(async (terbaru) => {
    const d = keDaftarKebiasaan(await api.laporanKebiasaanDaftar(butirTerbuka.value, props.hari, props.hal))
    if (!terbaru()) return
    const maks = jumlahHalaman(d.total, d.perHal)
    if (d.total > 0 && props.hal > maks) { emit('halaman', maks); return }
    daftar.value = { ...d, kunci: butirTerbuka.value, hari: props.hari }
    kunciTampil.value = kunci
  })
}

watch(() => props.hari, () => { void muatRingkas() })
watch(kunciDaftar, () => { void muatDaftar() })
onMounted(() => { void muatRingkas(); void muatDaftar() })
onBeforeUnmount(() => { ringkasMuat.batal(); daftarMuat.batal() })

// ── tabel butir ──────────────────────────────────────────────────────────
const labelKunci = (k: string): string => {
  const dikenal = kunciBerlabel(k)
  return dikenal ? tcf(`laporan.kebiasaan.butir.${dikenal}`) as string : k
}
const persenTeks = (b: ButirKebiasaan): string => {
  if (b.persen === null || !b.pembanding) return ''
  const p = b.persen === 0 && b.orang > 0 ? tcf('laporan.kebiasaan.persenKecil') as string : tcf('laporan.kebiasaan.persen')(String(b.persen)) as string
  return `${p} ${tcf(`laporan.kebiasaan.dari.${b.pembanding}`)}`
}
const baris = computed(() => (kebiasaan.value?.butir ?? []).map(b => ({
  ...b, label: labelKunci(b.kunci), persenTeks: persenTeks(b), terbuka: b.kunci === butirTerbuka.value,
})))

const panel = ref<HTMLElement | null>(null)
let pindahFokus = false
const pilih = (kunci: string) => {
  const tutup = kunci === butirTerbuka.value
  pindahFokus = !tutup
  emit('pilih', tutup ? '' : kunci)
}
const tutup = () => {
  const dari = butirTerbuka.value
  emit('pilih', '')
  void nextTick(() => document.querySelector<HTMLElement>(`[data-butir="${dari}"] button`)?.focus())
}
/* Daftar dibuka dari ketukan: fokus pindah ke kepalanya supaya papan ketik
   dan pembaca layar langsung berada di sana. Muatan awal dari URL tidak
   memindahkan fokus. */
watch(butirTerbuka, async (k) => {
  if (!k || !pindahFokus) return
  pindahFokus = false
  await nextTick()
  panel.value?.focus({ preventScroll: true })
  panel.value?.scrollIntoView({ block: 'nearest' })
})

// ── daftar orang ─────────────────────────────────────────────────────────
const izinDitolak = computed(() => daftarMuat.galat.value?.jenis === 'izin')
const jumlahHal = computed(() => jumlahHalaman(daftar.value?.total ?? 0, daftar.value?.perHal ?? 1))
const kePengguna = (id: string) => `/console/cashflow/pengguna/${id}`
const siapa = (o: OrangKebiasaan) => o.email || o.nama || (tcf('laporan.kebiasaan.orangTanpaNama') as string)
const keduanya = (o: OrangKebiasaan) => (o.email && o.nama ? o.nama : '')
const tglDaftar = (o: OrangKebiasaan) => tanggalPendek(o.daftar, bahasa.value)
const terakhir = (o: OrangKebiasaan) => (o.terakhir ? waktuPendekWib(o.terakhir, bahasa.value) : tcf('laporan.kebiasaan.belum') as string)
const KOLOM_ANGKA = ['catatan', 'ruang', 'ruangBersama', 'hp', 'pesanDomi', 'beliKredit'] as const
</script>

<template>
  <div class="min-w-0 space-y-5" data-uji="kebiasaan">
    <div v-if="ringkasMuat.galat.value?.jenis === 'belum-aktif'" class="flex items-start gap-3 rounded-xl border border-dashed border-[color:var(--ca-border)] px-4 py-5 text-sm text-[var(--ca-muted)]" role="status" data-uji="laporan-belum-aktif">
      <Icon name="lucide:hourglass" class="mt-0.5 h-5 w-5 shrink-0 text-[var(--ca-subtle)]" aria-hidden="true" />
      <span>{{ tcf('laporan.belumAktif') }}</span>
    </div>
    <CashflowIzinKurang v-else-if="ringkasMuat.galat.value?.jenis === 'izin'" baca />
    <CashflowKeadaan
      v-else-if="ringkasMuat.pesanGalat.value" jenis="galat" :judul="tcf('umum.galatJudul')" :pesan="ringkasMuat.pesanGalat.value"
      :label-ulang="tcf('umum.cobaLagi')" :sibuk="ringkasMuat.memuat.value" @ulang="muatRingkas()"
    />
    <CashflowKeadaan v-else-if="!kebiasaan" jenis="memuat" :pesan="tcf('umum.memuat')" :baris="6" :kolom="3" />

    <template v-else>
      <section class="min-w-0 space-y-3">
        <div class="min-w-0">
          <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('laporan.kebiasaan.judul') }}</h2>
          <p class="mt-1 text-sm font-semibold tabular-nums text-[var(--ca-text)]" data-uji="kebiasaan-pembuka">
            {{ tcf('laporan.kebiasaan.pembuka')(angka(kebiasaan.akun), angka(kebiasaan.aktif), angka(kebiasaan.hari || hari)) }}
          </p>
          <p class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('laporan.kebiasaan.ket') }} {{ tcf('laporan.tanpaTim') }}</p>
        </div>
        <CashflowTabel :sibuk="ringkasMuat.memuat.value" data-uji="kebiasaan-tabel">
          <caption class="sr-only">{{ tcf('laporan.kebiasaan.tabelLabel') }}</caption>
          <thead>
            <tr>
              <th scope="col">{{ tcf('laporan.kebiasaan.kolom.kebiasaan') }}</th>
              <th scope="col" class="cf-ka">{{ tcf('laporan.kebiasaan.kolom.orang') }}</th>
              <th scope="col" class="cf-ka hidden sm:table-cell">{{ tcf('laporan.kebiasaan.kolom.bagian') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="b in baris" :key="b.kunci" class="cf-kebiasaan-baris" :class="{ 'cf-kebiasaan-terbuka': b.terbuka }"
              :data-butir="b.kunci" @click="pilih(b.kunci)"
            >
              <td>
                <button
                  type="button" class="cf-kebiasaan-tombol" :aria-expanded="b.terbuka" aria-controls="cf-kebiasaan-daftar"
                  :aria-label="tcf('laporan.kebiasaan.lihat')(b.label, angka(b.orang))" @click.stop="pilih(b.kunci)"
                >
                  <Icon :name="b.terbuka ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="h-4 w-4 shrink-0 text-[var(--ca-subtle)]" aria-hidden="true" />
                  <span class="min-w-0 break-words">{{ b.label }}</span>
                </button>
                <span v-if="b.persenTeks" class="cf-dua pl-6 sm:!hidden" data-uji="kebiasaan-persen-sempit">{{ b.persenTeks }}</span>
              </td>
              <td class="cf-ka cf-kuat">{{ angka(b.orang) }}</td>
              <td class="cf-ka hidden whitespace-nowrap sm:table-cell">{{ b.persenTeks || '—' }}</td>
            </tr>
          </tbody>
        </CashflowTabel>
        <p class="text-xs text-[var(--ca-subtle)]" data-uji="kebiasaan-ket-semua">{{ tcf('laporan.kebiasaan.ketSemuaAkun') }}</p>
      </section>

      <!-- Daftar orang di balik butir yang diketuk. -->
      <section
        v-if="butirTerbuka" id="cf-kebiasaan-daftar" ref="panel" tabindex="-1" class="min-w-0 space-y-3 scroll-mt-24 outline-none"
        :aria-label="tcf('laporan.kebiasaan.daftarLabel')" data-uji="kebiasaan-daftar" :data-kunci="kunciTampil" :data-butir-terbuka="butirTerbuka"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="break-words font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('laporan.kebiasaan.daftarJudul')(labelKunci(butirTerbuka)) }}</h3>
            <p v-if="daftar" class="mt-0.5 text-xs tabular-nums text-[var(--ca-subtle)]" data-uji="kebiasaan-daftar-jumlah">{{ tcf('laporan.kebiasaan.daftarJumlah')(angka(daftar.total)) }}</p>
          </div>
          <button type="button" class="ca-btn-secondary !px-3 !py-1.5 text-xs" data-uji="kebiasaan-tutup" @click="tutup">{{ tcf('laporan.kebiasaan.tutup') }}</button>
        </div>

        <CashflowIzinKurang v-if="!izinDaftar || izinDitolak" baca :pesan="tcf('laporan.kebiasaan.butuhTotp')" />
        <CashflowKeadaan
          v-else-if="daftarMuat.pesanGalat.value" jenis="galat" :judul="tcf('umum.galatJudul')" :pesan="daftarMuat.pesanGalat.value"
          :label-ulang="tcf('umum.cobaLagi')" :sibuk="daftarMuat.memuat.value" @ulang="muatDaftar()"
        />
        <CashflowKeadaan v-else-if="!daftar" jenis="memuat" :pesan="tcf('umum.memuat')" :baris="5" :kolom="5" />
        <CashflowKeadaan v-else-if="!daftar.baris.length" jenis="kosong" icon="lucide:users" :judul="tcf('umum.kosongJudul')" :pesan="tcf('laporan.kebiasaan.daftarKosong')" />
        <template v-else>
          <p class="text-xs text-[var(--ca-subtle)]" data-uji="kebiasaan-audit">
            {{ tcf('laporan.kebiasaan.audit') }} <template v-if="!daftar.terbuka">{{ tcf('laporan.kebiasaan.tersamar') }}</template>
          </p>
          <!-- Layar lebar: tabel. Layar sempit: satu kartu per orang. -->
          <div class="hidden lg:block">
            <CashflowTabel lebar-min="60rem" :sibuk="daftarMuat.memuat.value" data-uji="kebiasaan-orang-tabel">
              <thead>
                <tr>
                  <th scope="col">{{ tcf('laporan.kebiasaan.kolomOrang.pengguna') }}</th>
                  <th scope="col">{{ tcf('laporan.kebiasaan.kolomOrang.daftar') }}</th>
                  <th scope="col">{{ tcf('laporan.kebiasaan.kolomOrang.terakhir') }}</th>
                  <th v-for="k in KOLOM_ANGKA" :key="k" scope="col" class="cf-ka">{{ tcf(`laporan.kebiasaan.kolomOrang.${k}`) }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="o in daftar.baris" :key="o.id" class="cursor-pointer" @click="navigateTo(kePengguna(o.id))">
                  <td class="max-w-[20rem]">
                    <NuxtLink
                      :to="kePengguna(o.id)" class="cf-kuat block min-w-0 truncate underline-offset-2 hover:underline" :title="siapa(o)"
                      :aria-label="tcf('laporan.kebiasaan.buka')(siapa(o))" @click.stop
                    >{{ siapa(o) }}</NuxtLink>
                    <span v-if="keduanya(o)" class="cf-dua block truncate">{{ keduanya(o) }}</span>
                  </td>
                  <td class="whitespace-nowrap">{{ tglDaftar(o) }}</td>
                  <td class="whitespace-nowrap"><span :class="o.terakhir ? '' : 'cf-redup'">{{ terakhir(o) }}</span></td>
                  <td v-for="k in KOLOM_ANGKA" :key="k" class="cf-ka">{{ angka(o[k]) }}</td>
                </tr>
              </tbody>
            </CashflowTabel>
          </div>
          <ul class="min-w-0 space-y-3 lg:hidden" :aria-busy="daftarMuat.memuat.value" data-uji="kebiasaan-orang-kartu">
            <li v-for="o in daftar.baris" :key="o.id" class="ca-console-dialog relative min-w-0 p-4">
              <NuxtLink :to="kePengguna(o.id)" class="cf-kuat block min-w-0 break-all text-[0.9375rem] after:absolute after:inset-0 after:rounded-[inherit]">{{ siapa(o) }}</NuxtLink>
              <p v-if="keduanya(o)" class="mt-1 min-w-0 break-words text-xs text-[var(--ca-muted)]">{{ keduanya(o) }}</p>
              <dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[color:var(--ca-border)] pt-3">
                <div class="min-w-0"><dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('laporan.kebiasaan.kolomOrang.daftar') }}</dt><dd class="mt-0.5 text-sm tabular-nums text-[var(--ca-text)]">{{ tglDaftar(o) }}</dd></div>
                <div class="min-w-0"><dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('laporan.kebiasaan.kolomOrang.terakhir') }}</dt><dd class="mt-0.5 text-sm tabular-nums text-[var(--ca-text)]">{{ terakhir(o) }}</dd></div>
                <div v-for="k in KOLOM_ANGKA" :key="k" class="min-w-0"><dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf(`laporan.kebiasaan.kolomOrang.${k}`) }}</dt><dd class="mt-0.5 text-sm tabular-nums text-[var(--ca-text)]">{{ angka(o[k]) }}</dd></div>
              </dl>
            </li>
          </ul>
          <CashflowHalaman :hal="hal" :jumlah-halaman="jumlahHal" :total="daftar.total" :per="daftar.perHal" :memuat="daftarMuat.memuat.value" @ganti="(h: number) => emit('halaman', h)" />
        </template>
      </section>
    </template>
  </div>
</template>

<style scoped>
.cf-kebiasaan-baris {
  cursor: pointer;
}
.cf-kebiasaan-terbuka {
  background: var(--ca-panel-bg-strong);
  box-shadow: inset 3px 0 0 var(--ca-accent);
}
.cf-kebiasaan-tombol {
  display: flex;
  width: 100%;
  min-height: 1.75rem;
  align-items: flex-start;
  gap: 0.5rem;
  border-radius: 0.375rem;
  text-align: left;
  font-weight: 600;
  color: var(--ca-text);
}
.cf-kebiasaan-tombol > :first-child {
  margin-top: 0.15rem;
}
.cf-kebiasaan-tombol:focus-visible {
  outline: 2px solid var(--ca-accent);
  outline-offset: 2px;
}
</style>
