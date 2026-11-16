<script setup lang="ts">
/**
 * Tabel pembelian kredit, urutan dari server (terbaru dulu). Setiap baris:
 * waktu WIB, email dan nama pembeli, paket dan jumlah kreditnya, harga,
 * jalur (Google Play atau QRIS), status, cap Uji, dan kode pendek.
 *
 * Email, nama, dan nomor pesanan ditulis lewat interpolasi biasa, tidak
 * pernah sebagai HTML. Pembelian uji tampil lebih redup dan bercap Uji,
 * karena ringkasan di atas tidak menghitungnya.
 *
 * Hanya menampilkan; halaman yang memanggil server.
 */
import { rupiah } from '~/adapters/cashflow'
import { jedaKreditPlay, pillStatusPembelian, playBelumDikonsumsi, uangPlay, type Pembelian } from '~/adapters/cashflowPembelian'
import { waktuDetikWib } from '~/adapters/cashflowWaktu'

defineProps<{ daftar: readonly Pembelian[] }>()
const { tcf, bahasa, formatTanggal, formatJam, formatWaktu } = useCashflowI18n()

const IKON_JALUR = { play: 'lucide:smartphone', qris: 'lucide:qr-code' } as const
const WAKTU_PLAY = ['googleLunas', 'rtdn', 'aplikasiLapor', 'kreditMasuk'] as const

function nilaiPlay(uang: NonNullable<NonNullable<Pembelian['play']>['uang']>, nilai: number) {
  return uangPlay(nilai, uang.mataUang, bahasa.value === 'en' ? 'en-GB' : 'id-ID')
}

function labelHargaPlay(uang: NonNullable<NonNullable<Pembelian['play']>['uang']>) {
  switch (uang.sumber) {
    case 'play_orders': return tcf('pembelian.uang.hargaPlay')
    case 'perkiraan_aplikasi': return tcf('pembelian.uang.hargaSaatBeli')
    default: return tcf('pembelian.uang.hargaPaket')
  }
}

function lamaKredit(waktu: NonNullable<NonNullable<Pembelian['play']>['waktu']>) {
  const detik = jedaKreditPlay(waktu)
  return detik === null ? tcf('pembelian.tidakTersedia') : tcf('pembelian.jeda.durasi')(detik)
}
</script>

<template>
  <!-- Ponsel: satu kartu per pembelian. Rincian uang dan waktu Google Play tetap di tabel layar lebar. -->
  <ul class="min-w-0 divide-y divide-[color:var(--ca-border)] sm:hidden" data-uji="pembelian-kartu">
    <li v-for="p in daftar" :key="p.id" class="min-w-0 p-4" :class="p.uji ? 'text-[var(--ca-muted)]' : 'text-[var(--ca-text)]'">
      <div class="flex min-w-0 items-start justify-between gap-2">
        <p class="min-w-0">
          <span v-if="p.pembeli.email" class="cf-kuat block break-all text-[0.9375rem]">{{ p.pembeli.email }}</span>
          <span v-else class="block text-sm text-[var(--ca-subtle)]">{{ tcf('pembelian.tanpaEmail') }}</span>
          <span v-if="p.pembeli.nama" class="cf-dua break-words">{{ p.pembeli.nama }}</span>
        </p>
        <span class="flex shrink-0 flex-col items-end gap-1">
          <span :class="pillStatusPembelian(p.status)" class="whitespace-nowrap text-xs">{{ p.status ? tcf(`pembelian.status.${p.status}`) : tcf('pembelian.tidakDikenal') }}</span>
          <span v-if="p.uji" class="ca-pill-blue whitespace-nowrap text-xs" :title="tcf('pembelian.ujiKet')">{{ tcf('pembelian.uji') }}</span>
        </span>
      </div>
      <p v-if="playBelumDikonsumsi(p)" class="mt-1 text-xs ca-tone-gold">{{ tcf('pembelian.belumDikonsumsi') }}</p>
      <p v-if="p.play?.batalIso" class="mt-1 text-xs text-[var(--ca-muted)]">{{ tcf('pembelian.dibatalkanGoogle')(formatWaktu(p.play.batalIso)) }}</p>
      <dl class="mt-3 grid grid-cols-3 gap-x-3 border-t border-[color:var(--ca-border)] pt-3">
        <div class="min-w-0">
          <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('pembelian.kolom.paket') }}</dt>
          <dd class="cf-kuat mt-0.5 text-sm tabular-nums">
            <template v-if="p.kredit !== null">{{ tcf('pembelian.kredit')(p.kredit) }}</template>
            <template v-else>{{ tcf('pembelian.tidakTerbaca') }}</template>
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('pembelian.kolom.harga') }}</dt>
          <dd class="cf-kuat mt-0.5 break-words text-sm tabular-nums">
            <template v-if="p.jalur === 'play' && p.play?.uang && p.play.uang.total !== null">{{ nilaiPlay(p.play.uang, p.play.uang.total) }}</template>
            <template v-else-if="p.nominal !== null">{{ rupiah(p.nominal) }}</template>
            <template v-else>{{ tcf('pembelian.tidakTersedia') }}</template>
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('pembelian.kolom.jalur') }}</dt>
          <dd class="cf-kuat mt-0.5 text-sm">{{ p.jalur ? tcf(`pembelian.jalur.${p.jalur}`) : tcf('pembelian.tidakDikenal') }}</dd>
        </div>
      </dl>
      <p class="mt-2 flex flex-wrap justify-between gap-x-3 text-xs tabular-nums text-[var(--ca-subtle)]">
        <span>{{ p.waktuIso ? formatWaktu(p.waktuIso) : tcf('pembelian.tidakTerbaca') }}</span>
        <span class="font-mono" :title="tcf('pembelian.kodeKet')">{{ p.kode || p.id.slice(-8) }}</span>
      </p>
    </li>
  </ul>
  <div class="cf-tabel-gulir ca-scrollbar hidden sm:block">
    <table class="cf-tabel cf-tabel-rapat min-w-[56rem]" data-uji="pembelian-tabel">
      <thead>
        <tr>
          <th scope="col">{{ tcf('pembelian.kolom.waktu') }}</th>
          <th scope="col">{{ tcf('pembelian.kolom.pembeli') }}</th>
          <th scope="col">{{ tcf('pembelian.kolom.paket') }}</th>
          <th scope="col" class="cf-ka">{{ tcf('pembelian.kolom.harga') }}</th>
          <th scope="col">{{ tcf('pembelian.kolom.jalur') }}</th>
          <th scope="col">{{ tcf('pembelian.kolom.status') }}</th>
          <th scope="col" :title="tcf('pembelian.jeda.judul')">{{ tcf('pembelian.jeda.judulPendek') }}</th>
          <th scope="col" :title="tcf('pembelian.kodeKet')">{{ tcf('pembelian.kolom.kode') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="p in daftar" :key="p.id"
          :class="p.uji ? 'text-[var(--ca-muted)]' : 'text-[var(--ca-text)]'"
        >
          <td class="whitespace-nowrap">
            <template v-if="p.waktuIso">
              <span class="block">{{ formatTanggal(p.waktuIso) }}</span>
              <span class="cf-dua">{{ formatJam(p.waktuIso) }}</span>
            </template>
            <span v-else class="text-xs text-[var(--ca-subtle)]">{{ tcf('pembelian.tidakTerbaca') }}</span>
          </td>
          <td class="min-w-[12.5rem] max-w-[18rem]">
            <span v-if="p.pembeli.email" class="cf-kuat block break-all">{{ p.pembeli.email }}</span>
            <span v-else class="block text-xs text-[var(--ca-subtle)]">{{ tcf('pembelian.tanpaEmail') }}</span>
            <span v-if="p.pembeli.nama" class="cf-dua break-words">{{ p.pembeli.nama }}</span>
          </td>
          <td>
            <strong v-if="p.kredit !== null" class="block whitespace-nowrap font-semibold">{{ tcf('pembelian.kredit')(p.kredit) }}</strong>
            <span class="block font-mono text-xs text-[var(--ca-muted)]">{{ p.paket ?? tcf('pembelian.tidakTerbaca') }}</span>
          </td>
          <td class="cf-ka whitespace-nowrap">
            <template v-if="p.jalur === 'play'">
              <strong v-if="p.play?.uang && p.play.uang.total !== null" data-uji="pembelian-total-play">
                {{ nilaiPlay(p.play.uang, p.play.uang.total) }}
              </strong>
              <span v-else class="text-xs text-[var(--ca-subtle)]">{{ tcf('pembelian.tidakTersedia') }}</span>
              <dl class="mt-1 space-y-0.5 text-xs text-[var(--ca-muted)]">
                <div v-if="p.play?.uang && p.play.uang.harga !== null" class="flex justify-between gap-3">
                  <dt>{{ labelHargaPlay(p.play.uang) }}</dt>
                  <dd>{{ nilaiPlay(p.play.uang, p.play.uang.harga) }}</dd>
                </div>
                <div v-else-if="p.nominal !== null" class="flex justify-between gap-3">
                  <dt>{{ tcf('pembelian.uang.hargaPaket') }}</dt>
                  <dd>{{ rupiah(p.nominal) }}</dd>
                </div>
                <div v-if="p.play?.uang && p.play.uang.pajak !== null" class="flex justify-between gap-3">
                  <dt>{{ tcf('pembelian.uang.pajak') }}</dt>
                  <dd>{{ nilaiPlay(p.play.uang, p.play.uang.pajak) }}</dd>
                </div>
                <div v-if="p.play?.uang && p.play.uang.diterima !== null" class="flex justify-between gap-3">
                  <dt>{{ tcf('pembelian.uang.diterimaPlay') }}</dt>
                  <dd>{{ nilaiPlay(p.play.uang, p.play.uang.diterima) }}</dd>
                </div>
              </dl>
            </template>
            <strong v-else-if="p.nominal !== null">{{ rupiah(p.nominal) }}</strong>
            <span v-else class="text-xs text-[var(--ca-subtle)]">{{ tcf('pembelian.tidakTerbaca') }}</span>
          </td>
          <td>
            <span class="inline-flex items-center gap-1.5 whitespace-nowrap">
              <Icon v-if="p.jalur" :name="IKON_JALUR[p.jalur]" class="h-3.5 w-3.5 text-[var(--ca-subtle)]" aria-hidden="true" />
              {{ p.jalur ? tcf(`pembelian.jalur.${p.jalur}`) : tcf('pembelian.tidakDikenal') }}
            </span>
            <span
              v-if="p.play?.order" class="block max-w-[8.5rem] truncate font-mono text-xs text-[var(--ca-subtle)]"
              :title="`${tcf('pembelian.pesananPlay')}: ${p.play.order}`"
            >{{ p.play.order }}</span>
          </td>
          <td>
            <div class="flex flex-wrap items-center gap-1">
              <span :class="pillStatusPembelian(p.status)" class="whitespace-nowrap text-xs">
                {{ p.status ? tcf(`pembelian.status.${p.status}`) : tcf('pembelian.tidakDikenal') }}
              </span>
              <span v-if="p.uji" class="ca-pill-blue whitespace-nowrap text-xs" :title="tcf('pembelian.ujiKet')" data-uji="pembelian-uji">{{ tcf('pembelian.uji') }}</span>
            </div>
            <span v-if="playBelumDikonsumsi(p)" class="mt-1 block whitespace-nowrap text-xs ca-tone-gold" :title="tcf('pembelian.belumDikonsumsiKet')">
              {{ tcf('pembelian.belumDikonsumsi') }}
            </span>
            <span v-if="p.play?.batalIso" class="mt-1 block max-w-[9rem] text-xs text-[var(--ca-muted)]">
              {{ tcf('pembelian.dibatalkanGoogle')(formatWaktu(p.play.batalIso)) }}
            </span>
          </td>
          <td class="!text-xs">
            <details v-if="p.play?.waktu">
              <summary class="cursor-pointer whitespace-nowrap" data-uji="pembelian-jeda-play">{{ lamaKredit(p.play.waktu) }}</summary>
              <dl class="mt-2 space-y-1.5 whitespace-nowrap text-[var(--ca-muted)]">
                <div v-for="kunci in WAKTU_PLAY" :key="kunci">
                  <dt>{{ tcf(`pembelian.jeda.${kunci}`) }}</dt>
                  <dd>{{ p.play.waktu[kunci] ? waktuDetikWib(p.play.waktu[kunci], bahasa) : tcf('pembelian.tidakTersedia') }}</dd>
                </div>
              </dl>
            </details>
            <span v-else-if="p.jalur === 'play'" class="text-[var(--ca-subtle)]">{{ tcf('pembelian.tidakTersedia') }}</span>
            <span v-else aria-hidden="true">·</span>
          </td>
          <td class="whitespace-nowrap font-mono !text-xs" :title="tcf('pembelian.kodeKet')">{{ p.kode || p.id.slice(-8) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
