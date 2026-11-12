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
import { pillStatusPembelian, playBelumDikonsumsi, type Pembelian } from '~/adapters/cashflowPembelian'

defineProps<{ daftar: readonly Pembelian[] }>()
const { tcf, formatTanggal, formatJam, formatWaktu } = useCashflowI18n()

const IKON_JALUR = { play: 'lucide:smartphone', qris: 'lucide:qr-code' } as const
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[60rem] text-sm" data-uji="pembelian-tabel">
      <thead>
        <tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
          <th scope="col" class="px-4 py-2.5 font-semibold">{{ tcf('pembelian.kolom.waktu') }}</th>
          <th scope="col" class="px-3 py-2.5 font-semibold">{{ tcf('pembelian.kolom.pembeli') }}</th>
          <th scope="col" class="px-3 py-2.5 font-semibold">{{ tcf('pembelian.kolom.paket') }}</th>
          <th scope="col" class="px-3 py-2.5 text-right font-semibold">{{ tcf('pembelian.kolom.harga') }}</th>
          <th scope="col" class="px-3 py-2.5 font-semibold">{{ tcf('pembelian.kolom.jalur') }}</th>
          <th scope="col" class="px-3 py-2.5 font-semibold">{{ tcf('pembelian.kolom.status') }}</th>
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
          <td class="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums">
            <template v-if="p.nominal !== null">{{ rupiah(p.nominal) }}</template>
            <span v-else class="text-xs font-normal text-[var(--ca-subtle)]">{{ tcf('pembelian.tidakTerbaca') }}</span>
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
          <td class="whitespace-nowrap px-4 py-2.5 font-mono text-xs" :title="tcf('pembelian.kodeKet')">{{ p.kode || p.id.slice(-8) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
