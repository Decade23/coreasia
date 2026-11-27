<script setup lang="ts">
/**
 * Isi halaman CashFlow > WhatsApp (laporan catat lewat WhatsApp): ubin
 * ringkas, angka kecil, corong orang, tren harian, golongan pesan, kata tanpa
 * kategori, kesehatan (sambungan WA dari admin_wa_status lewat
 * CashflowStatusWa, pemrosesan dari laporan), lalu tabel per pengguna.
 *
 * Hanya tampilan: menerima bentuk domain dari adapters/cashflowWaLaporan,
 * tidak memanggil server (kecuali CashflowStatusWa yang memuat dirinya
 * sendiri). Bagian yang datanya hanya 48 jam diberi tanda bila periode lebih
 * panjang dari itu.
 */
import { angka, rupiah } from '~/adapters/cashflow'
import { waktuPendekWib } from '~/adapters/cashflowWaktu'
import { durasiWa, langkahCorongWa, type GolonganWa, type LaporanWa } from '~/adapters/cashflowWaLaporan'

const props = defineProps<{ laporan: LaporanWa; perluVerifikasi?: boolean }>()
const { tcf, bahasa } = useCashflowI18n()

const l = computed(() => props.laporan)
const r = computed(() => props.laporan.ringkas)
const rentang = computed(() => {
  const { sejak } = l.value.cakupan
  const sampai = l.value.sekarang
  return sejak && sampai ? tcf('waCatat.rentang')(waktuPendekWib(sejak, bahasa.value), waktuPendekWib(sampai, bahasa.value)) as string : ''
})
/* Rentang dan catatan akun tim disambung di sini: spasi di antara dua interpolasi templat dirapatkan kompilator. */
const rentangTeks = computed(() => [rentang.value, l.value.kecualiInternal ? tcf('laporan.tanpaTim') as string : ''].filter(Boolean).join(' '))
const dtk = (v: number | null) => durasiWa(v, bahasa.value)

const ubin = computed(() => [
  {
    kunci: 'pengirim', icon: 'lucide:users', warna: 'emerald' as const, label: tcf('waCatat.ubin.pengirim') as string,
    nilai: angka(r.value.pengirim), ket: tcf('waCatat.ubin.pengirimKet')(angka(r.value.menyala)) as string,
  },
  {
    kunci: 'pesan', icon: 'lucide:message-circle', warna: 'sky' as const, label: tcf('waCatat.ubin.pesan') as string,
    nilai: angka(r.value.pesan), ket: tcf('waCatat.ubin.pesanKet')(angka(r.value.pesanDicatat)) as string,
  },
  {
    kunci: 'catatan', icon: 'lucide:notebook-pen', warna: 'amber' as const, label: tcf('waCatat.ubin.catatan') as string,
    nilai: angka(r.value.catatan), ket: tcf('waCatat.ubin.catatanKet')(angka(r.value.catatanAda)) as string,
  },
  {
    kunci: 'tanpa', icon: 'lucide:tag', warna: (r.value.persenTanpaKategori ?? 0) >= 40 ? 'rose' as const : 'netral' as const,
    label: tcf('waCatat.ubin.tanpaKategori') as string,
    nilai: r.value.persenTanpaKategori === null ? tcf('waCatat.kecil.belum') as string : `${r.value.persenTanpaKategori}%`,
    ket: r.value.catatanAda
      ? tcf('waCatat.ubin.tanpaKategoriKet')(angka(r.value.tanpaKategori), angka(r.value.catatanAda)) as string
      : tcf('waCatat.ubin.belumAda') as string,
  },
])

const kecil = computed(() => [
  { kunci: 'menyala', label: tcf('waCatat.kecil.menyala'), nilai: angka(r.value.menyala), ket: tcf('waCatat.kecil.menyalaKet') },
  { kunci: 'domi', label: tcf('waCatat.kecil.domi'), nilai: angka(r.value.domi), ket: tcf('waCatat.kecil.domiKet')(angka(r.value.domiJawaban), rupiah(r.value.domiBiaya > 0 ? Math.max(1, Math.round(r.value.domiBiaya)) : 0).replace(/\s/g, '\u00a0')) },
  { kunci: 'batal', label: tcf('waCatat.kecil.batal'), nilai: angka(r.value.batal), ket: '' },
  { kunci: 'stop', label: tcf('waCatat.kecil.stop'), nilai: angka(r.value.stop), ket: '', awas: r.value.stop > 0 },
  { kunci: 'kuota', label: tcf('waCatat.kecil.kuota'), nilai: angka(r.value.kuota), ket: '', awas: r.value.kuota > 0 },
  { kunci: 'gagal', label: tcf('waCatat.kecil.gagal'), nilai: angka(r.value.gagal), ket: '', bahaya: r.value.gagal > 0 },
  {
    kunci: 'proses', label: tcf('waCatat.kecil.proses'), nilai: dtk(r.value.prosesMedian) ?? tcf('waCatat.kecil.belum'),
    ket: dtk(r.value.prosesP90) ? tcf('waCatat.kecil.prosesKet')(dtk(r.value.prosesP90)!) : '', jejak: true,
  },
  {
    kunci: 'simpan', label: tcf('waCatat.kecil.simpan'), nilai: dtk(r.value.simpanMedian) ?? tcf('waCatat.kecil.belum'),
    ket: dtk(r.value.simpanP90) ? tcf('waCatat.kecil.simpanKet')(dtk(r.value.simpanP90)!) : '', jejak: true,
  },
])

const corong = computed(() => {
  const langkah = langkahCorongWa(l.value.corong)
  return langkah.map(x => ({ label: tcf(`waCatat.corong.langkah.${x.kunci}`) as string, nilai: x.orang, persen: x.persen }))
})
const dasarCorong = computed(() => Math.max(1, ...corong.value.map(c => c.nilai)))

const labelJenis = (g: GolonganWa) => (g.jenisDikenal ? tcf(`waCatat.jenis.${g.jenisDikenal}`) as string : g.jenis)
const labelHasil = (g: GolonganWa) => (g.hasilDikenal ? tcf(`waCatat.hasil.${g.hasilDikenal}`) as string : g.hasil)
const baru = (g: GolonganWa) => !g.jenisDikenal || !g.hasilDikenal
const nadaHasil = (g: GolonganWa) => {
  if (g.hasil === 'dicatat' || g.hasil === 'dijawab' || g.hasil === 'dibatalkan') return 'ca-tone-emerald'
  if (g.hasil === 'gagal' || g.hasil === 'proses') return 'ca-tone-danger'
  if (g.hasil === 'kuota' || g.hasil === 'dimatikan' || g.hasil === 'kredit_habis' || g.hasil.startsWith('dompet')) return 'ca-tone-gold'
  return 'text-[var(--ca-muted)]'
}
const puncakKata = computed(() => Math.max(1, ...l.value.kata.map(k => k.jumlah)))

const s = computed(() => l.value.kesehatan)
const masalah = computed(() => s.value.gagal + s.value.macet)
const waktuSehat = (v: string | null) => (v ? waktuPendekWib(v, bahasa.value) : tcf('waCatat.sehat.belum') as string)
</script>

<template>
  <div class="min-w-0 space-y-6" data-uji="wa-isi">
    <div class="min-w-0 space-y-2">
      <p class="text-xs text-[var(--ca-subtle)]" data-uji="wa-rentang">
        {{ rentangTeks }}
      </p>
      <p
        v-if="!l.cakupan.jejakUtuh" class="flex items-start gap-2 rounded-xl bg-[var(--ca-info-bg)] px-4 py-3 text-sm text-[var(--ca-text)]"
        data-uji="wa-cakupan"
      >
        <Icon name="lucide:clock-3" class="mt-0.5 h-4 w-4 shrink-0 ca-tone-info" aria-hidden="true" />
        <span>{{ tcf('waCatat.cakupan')(l.cakupan.jejakJam) }}</span>
      </p>
    </div>

    <CashflowKeadaanKosong v-if="l.kosong" :pesan="tcf('waCatat.kosong')" icon="lucide:message-circle-dashed" data-uji="wa-kosong" />

    <template v-else>
      <div class="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" data-uji="wa-ubin">
        <CashflowStatTile
          v-for="u in ubin" :key="u.kunci" :icon="u.icon" :warna="u.warna" :label="u.label" :nilai="u.nilai"
          :keterangan="u.ket" :data-ubin="u.kunci"
        />
      </div>

      <section class="ca-console-dialog min-w-0 p-5" data-uji="wa-kecil">
        <dl class="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          <div v-for="k in kecil" :key="k.kunci" class="min-w-0" :data-kecil="k.kunci">
            <dt class="flex items-center gap-1.5 text-xs font-semibold text-[var(--ca-subtle)]">
              <span class="min-w-0 break-words">{{ k.label }}</span>
              <Icon
                v-if="k.jejak && !l.cakupan.jejakUtuh" name="lucide:clock-3" class="h-3.5 w-3.5 shrink-0 ca-tone-info"
                :aria-label="tcf('waCatat.sehat.prosesKet')(l.cakupan.jejakJam)"
              />
            </dt>
            <dd
              class="mt-1 text-xl font-bold tabular-nums"
              :class="k.bahaya ? 'ca-tone-danger' : k.awas ? 'ca-tone-gold' : 'text-[var(--ca-text)]'"
            >{{ k.nilai }}</dd>
            <dd v-if="k.ket" class="mt-0.5 text-xs text-[var(--ca-subtle)]">{{ k.ket }}</dd>
          </div>
        </dl>
      </section>

      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <section class="ca-console-dialog min-w-0 p-5" data-uji="wa-corong">
          <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('waCatat.corong.judul') }}</h2>
          <p class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('waCatat.corong.ket') }}</p>
          <div class="mt-4 flex items-start justify-between gap-3 rounded-xl bg-[var(--ca-panel-bg)] px-4 py-3" data-uji="wa-corong-tampil">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-[var(--ca-text)]">{{ tcf('waCatat.corong.tampil') }}</p>
              <p class="mt-0.5 text-xs text-[var(--ca-subtle)]">
                {{ tcf('waCatat.corong.pengumuman')(l.corong.pengumuman) }}<template v-if="!l.corong.tampilTerukur">{{ ' ' }}{{ tcf('waCatat.corong.tampilTakTerukur') }}</template>
              </p>
            </div>
            <p class="shrink-0 text-lg font-bold tabular-nums text-[var(--ca-text)]">
              <template v-if="l.corong.tampil !== null">{{ angka(l.corong.tampil) }}</template>
              <span v-else class="wa-kosong"><span class="sr-only">{{ tcf('waCatat.pengguna.kosongSel') }}</span></span>
            </p>
          </div>
          <div class="mt-4">
            <CashflowBarRows :baris="corong" :dasar="dasarCorong" />
          </div>
          <p class="mt-3 text-xs text-[var(--ca-subtle)]">{{ tcf('waCatat.corong.persenKet') }}</p>
          <p v-if="l.corong.tutup" class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('waCatat.corong.tutup')(angka(l.corong.tutup)) }}</p>
        </section>

        <section class="ca-console-dialog min-w-0 p-5" data-uji="wa-harian">
          <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('waCatat.harian.judul') }}</h2>
          <p class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('waCatat.harian.ket') }}</p>
          <div class="mt-4">
            <CashflowWaHarian :harian="l.harian" />
          </div>
        </section>
      </div>

      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <section class="min-w-0 space-y-3" data-uji="wa-golongan">
          <div class="min-w-0">
            <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('waCatat.golongan.judul') }}</h2>
            <p class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('waCatat.golongan.ket') }}</p>
          </div>
          <CashflowKeadaanKosong v-if="!l.golongan.length" :pesan="tcf('umum.kosong')" icon="lucide:list" />
          <CashflowTabel v-else lebar-min="19rem" data-uji="wa-golongan-tabel">
            <caption class="sr-only">{{ tcf('waCatat.golongan.judul') }}</caption>
            <thead>
              <tr>
                <th scope="col">{{ tcf('waCatat.golongan.jenis') }}</th>
                <th scope="col">{{ tcf('waCatat.golongan.hasil') }}</th>
                <th scope="col" class="cf-ka">{{ tcf('waCatat.golongan.jumlah') }}</th>
                <th scope="col" class="cf-ka">{{ tcf('waCatat.golongan.orang') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="g in l.golongan" :key="`${g.jenis}|${g.hasil}`">
                <td class="cf-kuat">{{ labelJenis(g) }}</td>
                <td>
                  <span class="font-semibold" :class="nadaHasil(g)">{{ labelHasil(g) }}</span>
                  <span v-if="baru(g)" class="ca-pill-muted ml-1.5 !rounded-lg !px-1.5 !py-0 text-[0.65rem]">{{ tcf('waCatat.kodeBaru') }}</span>
                </td>
                <td class="cf-ka cf-kuat">{{ angka(g.jumlah) }}</td>
                <td class="cf-ka">{{ angka(g.orang) }}</td>
              </tr>
            </tbody>
          </CashflowTabel>
        </section>

        <section class="ca-console-dialog min-w-0 p-5" data-uji="wa-kata">
          <h2 class="flex items-center gap-2 font-display text-base font-bold text-[var(--ca-text)]">
            {{ tcf('waCatat.kata.judul') }}
            <Icon
              v-if="!l.cakupan.jejakUtuh" name="lucide:clock-3" class="h-4 w-4 shrink-0 ca-tone-info"
              :aria-label="tcf('waCatat.sehat.prosesKet')(l.cakupan.jejakJam)"
            />
          </h2>
          <p class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('waCatat.kata.ket') }}</p>
          <div v-if="l.kataTerkunci" class="mt-4"><CashflowIzinKurang baca :pesan="tcf('waCatat.kata.butuhPii')" /></div>
          <CashflowKeadaanKosong v-else-if="!l.kata.length" class="mt-4" :pesan="tcf('waCatat.kata.kosong')" icon="lucide:tag" />
          <ul v-else class="mt-4 flex flex-wrap gap-2" data-uji="wa-kata-daftar">
            <li
              v-for="k in l.kata" :key="k.kata"
              class="wa-kata inline-flex max-w-full items-baseline gap-2 rounded-full px-3 py-1.5 text-sm"
              :style="{ '--wa-kuat': String(Math.round(18 + (k.jumlah / puncakKata) * 40)) + '%' }"
              :title="`${tcf('waCatat.kata.jumlah')(angka(k.jumlah))}, ${tcf('waCatat.kata.orang')(angka(k.orang))}`"
            >
              <span class="min-w-0 break-all font-semibold text-[var(--ca-text)]">{{ k.kata }}</span>
              <span class="shrink-0 text-xs tabular-nums text-[var(--ca-muted)]">{{ angka(k.jumlah) }}</span>
            </li>
          </ul>
        </section>
      </div>
    </template>

    <section class="min-w-0 space-y-3" data-uji="wa-sehat">
      <div class="min-w-0">
        <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('waCatat.sehat.judul') }}</h2>
        <p class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('waCatat.sehat.ket') }}</p>
      </div>
      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <CashflowStatusWa ringkas />
        <section class="ca-console-dialog min-w-0 p-5" data-uji="wa-sehat-proses">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex min-w-0 items-start gap-3">
              <Icon
                :name="masalah ? 'lucide:triangle-alert' : 'lucide:circle-check'" class="mt-0.5 h-5 w-5 shrink-0"
                :class="masalah ? 'ca-tone-danger' : 'ca-tone-emerald'" aria-hidden="true"
              />
              <div class="min-w-0">
                <h3 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('waCatat.sehat.proses') }}</h3>
                <p class="mt-1 text-sm" :class="masalah ? 'ca-tone-danger font-semibold' : 'text-[var(--ca-muted)]'">
                  {{ masalah ? tcf('waCatat.sehat.masalah')(angka(masalah)) : tcf('waCatat.sehat.aman') }}
                </p>
              </div>
            </div>
            <span class="shrink-0 text-xs text-[var(--ca-subtle)]">{{ tcf('waCatat.sehat.prosesKet')(l.cakupan.jejakJam) }}</span>
          </div>
          <dl class="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
            <div class="min-w-0"><dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('waCatat.sehat.pesan') }}</dt><dd class="font-bold tabular-nums text-[var(--ca-text)]">{{ angka(s.pesan) }}</dd></div>
            <div class="min-w-0"><dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('waCatat.sehat.selesai') }}</dt><dd class="font-bold tabular-nums text-[var(--ca-text)]">{{ angka(s.selesai) }}</dd></div>
            <div class="min-w-0"><dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('waCatat.sehat.gagal') }}</dt><dd class="font-bold tabular-nums" :class="s.gagal ? 'ca-tone-danger' : 'text-[var(--ca-text)]'">{{ angka(s.gagal) }}</dd></div>
            <div class="min-w-0"><dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('waCatat.sehat.macet') }}</dt><dd class="font-bold tabular-nums" :class="s.macet ? 'ca-tone-danger' : 'text-[var(--ca-text)]'">{{ angka(s.macet) }}</dd></div>
            <div class="min-w-0"><dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('waCatat.sehat.balas') }}</dt><dd class="font-bold tabular-nums text-[var(--ca-text)]">{{ angka(s.balas) }}</dd></div>
            <div class="min-w-0"><dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('waCatat.sehat.diam') }}</dt><dd class="font-bold tabular-nums text-[var(--ca-text)]">{{ angka(s.diam) }}</dd></div>
            <div class="min-w-0"><dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('waCatat.sehat.inbox') }}</dt><dd class="font-bold tabular-nums text-[var(--ca-text)]">{{ angka(s.inbox) }}</dd></div>
            <div class="min-w-0"><dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('waCatat.sehat.masihProses') }}</dt><dd class="font-bold tabular-nums text-[var(--ca-text)]">{{ angka(s.proses) }}</dd></div>
          </dl>
          <dl class="mt-4 grid grid-cols-1 gap-3 border-t border-[color:var(--ca-border)] pt-4 text-sm sm:grid-cols-2">
            <div class="min-w-0"><dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('waCatat.sehat.terakhirMasuk') }}</dt><dd class="font-semibold tabular-nums text-[var(--ca-text)]">{{ waktuSehat(s.terakhirMasuk) }}</dd></div>
            <div class="min-w-0"><dt class="text-xs text-[var(--ca-subtle)]">{{ tcf('waCatat.sehat.terakhirSimpan') }}</dt><dd class="font-semibold tabular-nums text-[var(--ca-text)]">{{ waktuSehat(s.terakhirSimpan) }}</dd></div>
          </dl>
        </section>
      </div>
    </section>

    <CashflowWaPengguna
      :pengguna="l.pengguna" :total="l.penggunaTotal" :terbuka="l.terbuka" :sejak="l.cakupan.sejak" :perlu-verifikasi="perluVerifikasi"
    />
  </div>
</template>

<style scoped>
.wa-kosong::before { content: '\2014'; color: var(--ca-subtle); }
.wa-kata { background: color-mix(in srgb, var(--ca-accent) var(--wa-kuat, 18%), var(--ca-panel-bg)); }
</style>
