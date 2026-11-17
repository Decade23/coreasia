<script setup lang="ts">
/**
 * Daftar pembelian Google Play yang belum atau tidak jadi menjadi kredit
 * (saringan Sedang diproses dan Ditolak), urutan dari server (terbaru dulu).
 * Setiap baris: sejak kapan dan sudah berapa lama, pembeli, paket, harga
 * paket, keadaan dan sebabnya dalam kalimat awam, lalu berapa kali dan kapan
 * terakhir server mencobanya lagi.
 *
 * Kode `keadaan`, `rinci`, dan `sumber` dari server tidak pernah tampil
 * mentah: kalimatnya dipilih adapter (kunciKeadaanProses, kunciSebabProses),
 * dan nilai yang belum dikenal jatuh ke kalimat umum. Baris tanpa kunci
 * `proses` tetap tampil dengan status saringannya. Yang menunggu lebih dari
 * 1 jam diberi tanda jam bernada awas yang tenang.
 *
 * Email dan nama ditulis lewat interpolasi biasa, tidak pernah sebagai HTML.
 * Pembelian uji tampil lebih redup dan bercap Uji. Hanya menampilkan; halaman
 * yang memanggil server.
 */
import { rupiah } from '~/adapters/cashflow'
import {
  bagianLama, kunciKeadaanProses, kunciSebabProses, lencanaProses, menggantungLama, menitSejak, keadaanTampil,
  type Pembelian,
} from '~/adapters/cashflowPembelian'

defineProps<{ daftar: readonly Pembelian[]; kiniMs: number }>()
const { tcf, formatTanggal, formatJam, formatWaktu } = useCashflowI18n()

const sejak = (p: Pembelian) => p.proses?.sejakIso ?? p.waktuIso
function lama(p: Pembelian, kiniMs: number): string {
  const m = menitSejak(sejak(p), kiniMs)
  if (m === null) return ''
  const b = bagianLama(m)
  return tcf('pembelian.proses.lama')(b.hari, b.jam, b.menit)
}
/** Paket dari tabel paket; bila paketnya sudah tidak ada, id produk Play. */
const namaPaket = (p: Pembelian) => p.paket ?? p.proses?.produk ?? null
const kabar = (p: Pembelian) => {
  if (!p.proses?.terakhirIso) return ''
  const w = tcf('pembelian.proses.kabarTerakhir')(formatWaktu(p.proses.terakhirIso))
  return p.proses.sumber ? `${w}, ${tcf(`pembelian.proses.dari.${p.proses.sumber}`)}` : w
}
/** Kalimat coba ulang hanya untuk yang belum selesai, dan hanya bila server mengirim tandanya. */
function teksCoba(p: Pembelian): string {
  if (keadaanTampil(p) === 'ditolak' || p.proses?.bisaDicoba == null) return ''
  return tcf(p.proses.bisaDicoba ? 'pembelian.proses.coba.bisa' : 'pembelian.proses.coba.tidak')
}
/** Berapa kali server mencoba lagi. 0 = belum pernah, tidak dikirim = tidak tersedia. */
function dicoba(p: Pembelian): string {
  const n = p.proses?.percobaan
  if (n == null) return tcf('pembelian.tidakTersedia')
  return n === 0 ? tcf('pembelian.proses.belumDicoba') : tcf('pembelian.proses.kali')(n)
}
</script>

<template>
  <!-- Ponsel: satu kartu per pembelian, isi sama dengan tabel. -->
  <ul class="min-w-0 divide-y divide-[color:var(--ca-border)] sm:hidden" data-uji="pembelian-proses-kartu">
    <li v-for="p in daftar" :key="p.id" class="min-w-0 p-4" :class="p.uji ? 'text-[var(--ca-muted)]' : 'text-[var(--ca-text)]'">
      <div class="flex min-w-0 items-start justify-between gap-2">
        <p class="min-w-0">
          <span v-if="p.pembeli.email" class="cf-kuat block break-all text-[0.9375rem]">{{ p.pembeli.email }}</span>
          <span v-else class="block text-sm text-[var(--ca-subtle)]">{{ tcf('pembelian.tanpaEmail') }}</span>
          <span v-if="p.pembeli.nama" class="cf-dua break-words">{{ p.pembeli.nama }}</span>
        </p>
        <span class="flex shrink-0 flex-col items-end gap-1">
          <span :class="lencanaProses(p)">{{ tcf(kunciKeadaanProses(p)) }}</span>
          <span v-if="p.uji" class="ca-pill-blue whitespace-nowrap text-xs" :title="tcf('pembelian.ujiKet')">{{ tcf('pembelian.uji') }}</span>
        </span>
      </div>
      <p class="mt-2 text-sm text-[var(--ca-muted)]">{{ tcf(kunciSebabProses(p)) }}</p>
      <p v-if="teksCoba(p)" class="mt-1 text-xs text-[var(--ca-subtle)]">{{ teksCoba(p) }}</p>
      <dl class="mt-3 grid grid-cols-3 gap-x-3 border-t border-[color:var(--ca-border)] pt-3">
        <div class="min-w-0">
          <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('pembelian.proses.kolom.paket') }}</dt>
          <dd class="cf-kuat mt-0.5 text-sm tabular-nums">
            <template v-if="p.kredit !== null">{{ tcf('pembelian.kredit')(p.kredit) }}</template>
            <template v-else>{{ namaPaket(p) ?? tcf('pembelian.tidakTerbaca') }}</template>
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('pembelian.proses.kolom.harga') }}</dt>
          <dd class="cf-kuat mt-0.5 break-words text-sm tabular-nums">{{ p.nominal !== null ? rupiah(p.nominal) : tcf('pembelian.tidakTersedia') }}</dd>
        </div>
        <div class="min-w-0">
          <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('pembelian.proses.kolom.dicoba') }}</dt>
          <dd class="cf-kuat mt-0.5 text-sm tabular-nums">{{ dicoba(p) }}</dd>
        </div>
      </dl>
      <div class="mt-2 space-y-0.5 text-xs tabular-nums text-[var(--ca-subtle)]">
        <p class="flex flex-wrap items-center justify-between gap-x-3">
          <span>{{ sejak(p) ? formatWaktu(sejak(p)) : tcf('pembelian.tidakTerbaca') }}</span>
          <span v-if="menggantungLama(p, kiniMs)" class="inline-flex items-center gap-1 ca-tone-gold" :title="tcf('pembelian.proses.lebihSejam')">
            <Icon name="lucide:clock-alert" class="h-3.5 w-3.5" aria-hidden="true" />{{ lama(p, kiniMs) }}
          </span>
          <span v-else-if="lama(p, kiniMs)">{{ lama(p, kiniMs) }}</span>
        </p>
        <p v-if="p.proses?.dicobaIso">{{ tcf('pembelian.proses.terakhirDicoba')(formatWaktu(p.proses.dicobaIso)) }}</p>
        <p v-if="kabar(p)">{{ kabar(p) }}</p>
      </div>
    </li>
  </ul>
  <div class="cf-tabel-gulir ca-scrollbar hidden sm:block">
    <table class="cf-tabel cf-tabel-rapat min-w-[52rem]" data-uji="pembelian-proses-tabel">
      <thead>
        <tr>
          <th scope="col">{{ tcf('pembelian.proses.kolom.sejak') }}</th>
          <th scope="col">{{ tcf('pembelian.proses.kolom.pembeli') }}</th>
          <th scope="col">{{ tcf('pembelian.proses.kolom.paket') }}</th>
          <th scope="col" class="cf-ka">{{ tcf('pembelian.proses.kolom.harga') }}</th>
          <th scope="col">{{ tcf('pembelian.proses.kolom.keadaan') }}</th>
          <th scope="col">{{ tcf('pembelian.proses.kolom.dicoba') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in daftar" :key="p.id" :class="p.uji ? 'text-[var(--ca-muted)]' : 'text-[var(--ca-text)]'">
          <td class="whitespace-nowrap">
            <template v-if="sejak(p)">
              <span class="block">{{ formatTanggal(sejak(p)) }}</span>
              <span class="cf-dua">{{ formatJam(sejak(p)) }}</span>
              <span
                v-if="menggantungLama(p, kiniMs)" class="mt-1 inline-flex items-center gap-1 text-xs font-semibold ca-tone-gold"
                :title="tcf('pembelian.proses.lebihSejam')" data-uji="pembelian-proses-lama"
              >
                <Icon name="lucide:clock-alert" class="h-3.5 w-3.5" aria-hidden="true" />{{ lama(p, kiniMs) }}
              </span>
              <span v-else-if="lama(p, kiniMs)" class="mt-1 block text-xs text-[var(--ca-subtle)]">{{ lama(p, kiniMs) }}</span>
            </template>
            <span v-else class="text-xs text-[var(--ca-subtle)]">{{ tcf('pembelian.tidakTerbaca') }}</span>
          </td>
          <td class="min-w-[12.5rem] max-w-[17rem]">
            <span v-if="p.pembeli.email" class="cf-kuat block break-all">{{ p.pembeli.email }}</span>
            <span v-else class="block text-xs text-[var(--ca-subtle)]">{{ tcf('pembelian.tanpaEmail') }}</span>
            <span v-if="p.pembeli.nama" class="cf-dua break-words">{{ p.pembeli.nama }}</span>
            <span v-if="p.uji" class="ca-pill-blue mt-1 inline-block whitespace-nowrap text-xs" :title="tcf('pembelian.ujiKet')">{{ tcf('pembelian.uji') }}</span>
          </td>
          <td>
            <strong v-if="p.kredit !== null" class="block whitespace-nowrap font-semibold">{{ tcf('pembelian.kredit')(p.kredit) }}</strong>
            <span class="block font-mono text-xs text-[var(--ca-muted)]">{{ namaPaket(p) ?? tcf('pembelian.tidakTerbaca') }}</span>
          </td>
          <td class="cf-ka whitespace-nowrap">
            <strong v-if="p.nominal !== null">{{ rupiah(p.nominal) }}</strong>
            <span v-else class="text-xs text-[var(--ca-subtle)]">{{ tcf('pembelian.tidakTersedia') }}</span>
          </td>
          <td class="min-w-[15rem] max-w-[22rem]">
            <span :class="lencanaProses(p)" data-uji="pembelian-proses-keadaan">{{ tcf(kunciKeadaanProses(p)) }}</span>
            <span class="mt-1 block text-xs text-[var(--ca-muted)]">{{ tcf(kunciSebabProses(p)) }}</span>
            <span v-if="teksCoba(p)" class="mt-1 block text-xs text-[var(--ca-subtle)]">{{ teksCoba(p) }}</span>
          </td>
          <td class="!text-xs">
            <span class="block whitespace-nowrap font-semibold tabular-nums" data-uji="pembelian-proses-dicoba">{{ dicoba(p) }}</span>
            <span v-if="p.proses?.dicobaIso" class="block whitespace-nowrap text-[var(--ca-muted)]">
              {{ tcf('pembelian.proses.terakhirDicoba')(formatWaktu(p.proses.dicobaIso)) }}
            </span>
            <span v-if="kabar(p)" class="mt-1 block max-w-[12rem] text-[var(--ca-subtle)]">{{ kabar(p) }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
