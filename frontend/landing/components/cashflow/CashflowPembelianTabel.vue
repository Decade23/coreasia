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
  <div class="overflow-x-auto">
    <table class="w-full min-w-[68rem] text-sm" data-uji="pembelian-tabel">
      <thead>
        <tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
          <th scope="col" class="px-4 py-2.5 font-semibold">{{ tcf('pembelian.kolom.waktu') }}</th>
          <th scope="col" class="px-3 py-2.5 font-semibold">{{ tcf('pembelian.kolom.pembeli') }}</th>
          <th scope="col" class="px-3 py-2.5 font-semibold">{{ tcf('pembelian.kolom.paket') }}</th>
          <th scope="col" class="px-3 py-2.5 text-right font-semibold">{{ tcf('pembelian.kolom.harga') }}</th>
          <th scope="col" class="px-3 py-2.5 font-semibold">{{ tcf('pembelian.kolom.jalur') }}</th>
          <th scope="col" class="px-3 py-2.5 font-semibold">{{ tcf('pembelian.kolom.status') }}</th>
          <th scope="col" class="max-w-[10rem] px-3 py-2.5 font-semibold">{{ tcf('pembelian.jeda.judul') }}</th>
          <th scope="col" class="px-4 py-2.5 font-semibold" :title="tcf('pembelian.kodeKet')">{{ tcf('pembelian.kolom.kode') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="p in daftar" :key="p.id"
          class="border-t border-[color:var(--ca-border)] align-top"
          :class="p.uji ? 'text-[var(--ca-muted)]' : 'text-[var(--ca-text)]'"
        >
          <td class="whitespace-nowrap px-4 py-2.5 tabular-nums">
            <template v-if="p.waktuIso">
              <span class="block">{{ formatTanggal(p.waktuIso) }}</span>
              <span class="block text-xs text-[var(--ca-muted)]">{{ formatJam(p.waktuIso) }}</span>
            </template>
            <span v-else class="text-xs text-[var(--ca-subtle)]">{{ tcf('pembelian.tidakTerbaca') }}</span>
          </td>
          <td class="max-w-[18rem] px-3 py-2.5">
            <span v-if="p.pembeli.email" class="block break-all">{{ p.pembeli.email }}</span>
            <span v-else class="block text-xs text-[var(--ca-subtle)]">{{ tcf('pembelian.tanpaEmail') }}</span>
            <span v-if="p.pembeli.nama" class="block break-words text-xs text-[var(--ca-muted)]">{{ p.pembeli.nama }}</span>
          </td>
          <td class="px-3 py-2.5">
            <strong v-if="p.kredit !== null" class="block whitespace-nowrap font-semibold">{{ tcf('pembelian.kredit')(p.kredit) }}</strong>
            <span class="block font-mono text-xs text-[var(--ca-muted)]">{{ p.paket ?? tcf('pembelian.tidakTerbaca') }}</span>
          </td>
          <td class="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">
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
          <td class="px-3 py-2.5">
            <span class="inline-flex items-center gap-1.5 whitespace-nowrap">
              <Icon v-if="p.jalur" :name="IKON_JALUR[p.jalur]" class="h-3.5 w-3.5 text-[var(--ca-subtle)]" aria-hidden="true" />
              {{ p.jalur ? tcf(`pembelian.jalur.${p.jalur}`) : tcf('pembelian.tidakDikenal') }}
            </span>
            <span
              v-if="p.play?.order" class="block max-w-[12rem] truncate font-mono text-xs text-[var(--ca-subtle)]"
              :title="`${tcf('pembelian.pesananPlay')}: ${p.play.order}`"
            >{{ p.play.order }}</span>
          </td>
          <td class="px-3 py-2.5">
            <div class="flex flex-wrap items-center gap-1">
              <span :class="pillStatusPembelian(p.status)" class="whitespace-nowrap text-xs">
                {{ p.status ? tcf(`pembelian.status.${p.status}`) : tcf('pembelian.tidakDikenal') }}
              </span>
              <span v-if="p.uji" class="ca-pill-blue whitespace-nowrap text-xs" :title="tcf('pembelian.ujiKet')" data-uji="pembelian-uji">{{ tcf('pembelian.uji') }}</span>
            </div>
            <span v-if="playBelumDikonsumsi(p)" class="mt-1 block whitespace-nowrap text-xs ca-tone-gold" :title="tcf('pembelian.belumDikonsumsiKet')">
              {{ tcf('pembelian.belumDikonsumsi') }}
            </span>
            <span v-if="p.play?.batalIso" class="mt-1 block whitespace-nowrap text-xs text-[var(--ca-muted)]">
              {{ tcf('pembelian.dibatalkanGoogle')(formatWaktu(p.play.batalIso)) }}
            </span>
          </td>
          <td class="px-3 py-2.5 text-xs tabular-nums">
            <details v-if="p.play?.waktu" class="min-w-[7rem]">
              <summary class="cursor-pointer whitespace-nowrap" data-uji="pembelian-jeda-play">{{ lamaKredit(p.play.waktu) }}</summary>
              <dl class="mt-2 space-y-1.5 whitespace-nowrap text-[var(--ca-muted)]">
                <div v-for="kunci in WAKTU_PLAY" :key="kunci">
                  <dt>{{ tcf(`pembelian.jeda.${kunci}`) }}</dt>
                  <dd>{{ p.play.waktu[kunci] ? formatWaktu(p.play.waktu[kunci]) : tcf('pembelian.tidakTersedia') }}</dd>
                </div>
              </dl>
            </details>
            <span v-else-if="p.jalur === 'play'" class="text-[var(--ca-subtle)]">{{ tcf('pembelian.tidakTersedia') }}</span>
            <span v-else aria-hidden="true">·</span>
          </td>
          <td class="whitespace-nowrap px-4 py-2.5 font-mono text-xs" :title="tcf('pembelian.kodeKet')">{{ p.kode || p.id.slice(-8) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
