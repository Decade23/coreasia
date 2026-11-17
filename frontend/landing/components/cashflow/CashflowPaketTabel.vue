<script setup lang="ts">
/**
 * Tabel paket kredit, urut seperti yang dilihat pengguna (urutan, lalu kode).
 * Setiap baris: kredit dengan labelnya (seperti di kartu aplikasi), harga
 * normal, promo dengan statusnya, keadaan (bawaan, aktif, khusus uji), id
 * produk Google Play (atau "belum di Play"), jumlah terjual, dan aksi.
 *
 * Di ponsel (di bawah 640 px) tiap paket jadi satu kartu dengan isi dan aksi
 * yang sama, karena tabel delapan kolomnya terpotong di tepi.
 *
 * Hanya menampilkan dan memancarkan aksi; halaman yang memanggil server.
 * `bolehUbah` false (sesi tanpa cashflow:pii) mematikan semua aksi tulis.
 * `sibuk` = kode paket yang sedang diproses; `terkunci` = ada aksi berjalan.
 */
import { angka, rupiah } from '~/adapters/cashflow'
import { bolehJadiBawaan, statusPromo, hematPersen, type PaketKredit, type StatusPromo } from '~/adapters/cashflowPaket'

const props = defineProps<{ daftar: readonly PaketKredit[]; kini: number; bolehUbah: boolean; sibuk: string | null; terkunci: boolean }>()
const emit = defineEmits<{
  ubah: [p: PaketKredit]; aktifkan: [p: PaketKredit]; nonaktifkan: [p: PaketKredit]; bawaan: [p: PaketKredit]
  naik: [p: PaketKredit]; turun: [p: PaketKredit]; hapus: [p: PaketKredit]
}>()
const { tcf, formatTanggal, formatJam, formatWaktu } = useCashflowI18n()

const PIL: Record<StatusPromo, string> = { berlaku: 'ca-pill-emerald', terjadwal: 'ca-pill-blue', berakhir: 'ca-pill-muted', tanpa: '' }
const status = (p: PaketKredit) => statusPromo(p, props.kini)
const waktu = (iso: string) => `${formatTanggal(iso)} ${formatJam(iso)}`
const jendela = (p: PaketKredit) => tcf('paket.mulaiSampai')(
  p.promoMulai ? waktu(p.promoMulai) : tcf('paket.sejakDisimpan'),
  p.promoSampai ? waktu(p.promoSampai) : tcf('paket.tanpaBatas'),
)
const mati = computed(() => !props.bolehUbah || props.terkunci)
</script>

<template>
  <ul class="cf-tabel-wadah min-w-0 divide-y divide-[color:var(--ca-border)] sm:hidden" data-uji="paket-kartu">
    <li
      v-for="(p, i) in daftar" :key="p.kode" class="min-w-0 p-4"
      :class="p.aktif ? 'text-[var(--ca-text)]' : 'text-[var(--ca-muted)]'" :aria-busy="sibuk === p.kode ? 'true' : undefined"
    >
      <div class="flex min-w-0 items-start justify-between gap-3">
        <p class="min-w-0">
          <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <strong class="text-[0.9375rem]">{{ tcf('paket.kredit')(p.kredit) }}</strong>
            <span v-if="p.label" class="ca-pill-gold text-xs">{{ p.label }}</span>
          </span>
          <span class="cf-dua break-all font-mono">{{ p.kode }}</span>
        </p>
        <span class="flex shrink-0 items-center gap-1">
          <span class="tabular-nums text-xs text-[var(--ca-subtle)]">{{ p.urutan }}</span>
          <button
            type="button" class="ca-btn-ghost !min-h-9 !px-2 !py-1" :disabled="mati || i === 0"
            :aria-label="tcf('paket.naik')(p.kode)" @click="emit('naik', p)"
          ><Icon name="lucide:arrow-up" class="h-4 w-4" aria-hidden="true" /></button>
          <button
            type="button" class="ca-btn-ghost !min-h-9 !px-2 !py-1" :disabled="mati || i === daftar.length - 1"
            :aria-label="tcf('paket.turun')(p.kode)" @click="emit('turun', p)"
          ><Icon name="lucide:arrow-down" class="h-4 w-4" aria-hidden="true" /></button>
        </span>
      </div>
      <div class="mt-2 flex flex-wrap gap-1">
        <span v-if="p.bawaan" class="ca-pill-gold whitespace-nowrap text-xs">{{ tcf('paket.tanda.bawaan') }}</span>
        <span :class="p.aktif ? 'ca-pill-emerald' : 'ca-pill-danger'" class="whitespace-nowrap text-xs">{{ p.aktif ? tcf('paket.tanda.aktif') : tcf('paket.tanda.nonaktif') }}</span>
        <span v-if="p.khususUji" class="ca-pill-blue whitespace-nowrap text-xs">{{ tcf('paket.tanda.khususUji') }}</span>
      </div>
      <dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-[color:var(--ca-border)] pt-3">
        <div class="min-w-0">
          <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('paket.kolom.harga') }}</dt>
          <dd class="cf-kuat mt-0.5 text-sm tabular-nums">{{ rupiah(p.harga) }}</dd>
        </div>
        <div class="min-w-0">
          <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('paket.kolom.terjual') }}</dt>
          <dd class="cf-kuat mt-0.5 text-sm tabular-nums">
            <template v-if="p.terjual !== null">{{ angka(p.terjual) }}</template>
            <span v-else class="text-xs font-normal text-[var(--ca-subtle)]">{{ tcf('paket.terjualKosong') }}</span>
          </dd>
        </div>
        <div class="col-span-2 min-w-0">
          <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('paket.kolom.promo') }}</dt>
          <dd class="mt-0.5 text-sm">
            <template v-if="status(p) !== 'tanpa' && p.hargaPromo !== null">
              <span class="tabular-nums font-semibold">{{ rupiah(p.hargaPromo) }}</span>
              <span class="ml-1 text-xs text-[var(--ca-muted)]">{{ tcf('paket.pratinjau.hemat')(hematPersen(p.harga, p.hargaPromo)) }}</span>
              <span class="ml-1 inline-block whitespace-nowrap text-xs" :class="PIL[status(p)]">{{ tcf(`paket.status.${status(p)}`) }}</span>
              <span class="mt-1 block text-xs text-[var(--ca-muted)]">{{ jendela(p) }}</span>
            </template>
            <span v-else class="text-xs text-[var(--ca-subtle)]">{{ tcf('paket.status.tanpa') }}</span>
          </dd>
        </div>
        <div class="col-span-2 min-w-0">
          <dt class="text-xs font-semibold text-[var(--ca-subtle)]">{{ tcf('paket.kolom.play') }}</dt>
          <dd class="mt-0.5">
            <span v-if="p.playProdukId" class="break-all font-mono text-xs">{{ p.playProdukId }}</span>
            <span v-else class="text-xs text-[var(--ca-subtle)]">{{ tcf('paket.belumPlay') }}</span>
          </dd>
        </div>
      </dl>
      <p v-if="p.diubah" class="mt-2 text-xs text-[var(--ca-subtle)]">{{ tcf('paket.diubah')(formatWaktu(p.diubah)) }}</p>
      <div class="mt-3 flex flex-wrap items-center gap-1.5" role="group" :aria-label="tcf('paket.aksiUntuk')(p.kode)">
        <button type="button" class="ca-btn-secondary !min-h-9 !px-3 !py-1.5 text-xs" :disabled="mati" @click="emit('ubah', p)">{{ tcf('paket.ubah') }}</button>
        <button v-if="p.aktif" type="button" class="ca-btn-ghost !min-h-9 !px-3 !py-1.5 text-xs" :disabled="mati" @click="emit('nonaktifkan', p)">{{ tcf('paket.nonaktifkan') }}</button>
        <button v-else type="button" class="ca-btn-ghost !min-h-9 !px-3 !py-1.5 text-xs" :disabled="mati" @click="emit('aktifkan', p)">{{ tcf('paket.aktifkan') }}</button>
        <button v-if="bolehJadiBawaan(p)" type="button" class="ca-btn-ghost !min-h-9 !px-3 !py-1.5 text-xs" :disabled="mati" @click="emit('bawaan', p)">{{ tcf('paket.jadikanBawaan') }}</button>
        <button type="button" class="ca-btn-ghost !min-h-9 !px-3 !py-1.5 text-xs ca-tone-danger" :disabled="mati" @click="emit('hapus', p)">{{ tcf('paket.hapus') }}</button>
        <Icon v-if="sibuk === p.kode" name="lucide:loader-2" class="h-4 w-4 animate-spin text-[var(--ca-muted)]" :aria-label="tcf('paket.menyimpan')" />
      </div>
    </li>
  </ul>
  <CashflowTabel lebar-min="62rem" class="hidden sm:block">
      <thead>
        <tr>
          <th scope="col">{{ tcf('paket.kolom.urutan') }}</th>
          <th scope="col">{{ tcf('paket.kolom.paket') }}</th>
          <th scope="col" class="cf-ka">{{ tcf('paket.kolom.harga') }}</th>
          <th scope="col">{{ tcf('paket.kolom.promo') }}</th>
          <th scope="col">{{ tcf('paket.kolom.tanda') }}</th>
          <th scope="col">{{ tcf('paket.kolom.play') }}</th>
          <th scope="col" class="cf-ka">{{ tcf('paket.kolom.terjual') }}</th>
          <th scope="col" class="cf-ka min-w-[13rem]">{{ tcf('paket.kolom.aksi') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(p, i) in daftar" :key="p.kode"
          :class="p.aktif ? 'text-[var(--ca-text)]' : 'text-[var(--ca-muted)]'"
          :aria-busy="sibuk === p.kode ? 'true' : undefined"
        >
          <td>
            <div class="flex items-center gap-1">
              <span class="w-8 tabular-nums text-xs text-[var(--ca-subtle)]">{{ p.urutan }}</span>
              <button
                type="button" class="ca-btn-ghost !min-h-9 !px-2 !py-1" :disabled="mati || i === 0"
                :aria-label="tcf('paket.naik')(p.kode)" :title="tcf('paket.naik')(p.kode)" @click="emit('naik', p)"
              ><Icon name="lucide:arrow-up" class="h-4 w-4" aria-hidden="true" /></button>
              <button
                type="button" class="ca-btn-ghost !min-h-9 !px-2 !py-1" :disabled="mati || i === daftar.length - 1"
                :aria-label="tcf('paket.turun')(p.kode)" :title="tcf('paket.turun')(p.kode)" @click="emit('turun', p)"
              ><Icon name="lucide:arrow-down" class="h-4 w-4" aria-hidden="true" /></button>
            </div>
          </td>
          <td>
            <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <strong class="whitespace-nowrap">{{ tcf('paket.kredit')(p.kredit) }}</strong>
              <span v-if="p.label" class="ca-pill-gold whitespace-nowrap text-xs" :title="tcf('paket.kolom.label')">{{ p.label }}</span>
            </span>
            <span class="cf-dua font-mono">{{ p.kode }}</span>
            <span v-if="p.diubah" class="block whitespace-nowrap text-xs text-[var(--ca-subtle)]">{{ tcf('paket.diubah')(formatWaktu(p.diubah)) }}</span>
          </td>
          <td class="cf-ka whitespace-nowrap">{{ rupiah(p.harga) }}</td>
          <td>
            <template v-if="status(p) !== 'tanpa' && p.hargaPromo !== null">
              <span class="whitespace-nowrap tabular-nums font-semibold">{{ rupiah(p.hargaPromo) }}</span>
              <span class="ml-1 whitespace-nowrap text-xs text-[var(--ca-muted)]">{{ tcf('paket.pratinjau.hemat')(hematPersen(p.harga, p.hargaPromo)) }}</span>
              <span class="mt-1 block text-xs text-[var(--ca-muted)]">{{ jendela(p) }}</span>
              <span class="mt-1 inline-block whitespace-nowrap text-xs" :class="PIL[status(p)]">{{ tcf(`paket.status.${status(p)}`) }}</span>
            </template>
            <span v-else class="text-xs text-[var(--ca-subtle)]">{{ tcf('paket.status.tanpa') }}</span>
          </td>
          <td>
            <div class="flex flex-wrap gap-1">
              <span v-if="p.bawaan" class="ca-pill-gold whitespace-nowrap text-xs">{{ tcf('paket.tanda.bawaan') }}</span>
              <span :class="p.aktif ? 'ca-pill-emerald' : 'ca-pill-danger'" class="whitespace-nowrap text-xs">{{ p.aktif ? tcf('paket.tanda.aktif') : tcf('paket.tanda.nonaktif') }}</span>
              <span v-if="p.khususUji" class="ca-pill-blue whitespace-nowrap text-xs">{{ tcf('paket.tanda.khususUji') }}</span>
            </div>
          </td>
          <td class="max-w-[12rem]">
            <span v-if="p.playProdukId" class="break-all font-mono text-xs" :title="tcf('paket.kolom.play')">{{ p.playProdukId }}</span>
            <span v-else class="whitespace-nowrap text-xs text-[var(--ca-subtle)]">{{ tcf('paket.belumPlay') }}</span>
          </td>
          <td class="cf-ka">
            <template v-if="p.terjual !== null">{{ angka(p.terjual) }}</template>
            <span v-else class="text-xs text-[var(--ca-subtle)]">{{ tcf('paket.terjualKosong') }}</span>
          </td>
          <td>
            <div class="flex flex-wrap items-center justify-end gap-1.5" role="group" :aria-label="tcf('paket.aksiUntuk')(p.kode)">
              <Icon v-if="sibuk === p.kode" name="lucide:loader-2" class="h-4 w-4 animate-spin text-[var(--ca-muted)]" :aria-label="tcf('paket.menyimpan')" />
              <button type="button" class="ca-btn-secondary !min-h-9 !px-3 !py-1.5 text-xs" :disabled="mati" @click="emit('ubah', p)">{{ tcf('paket.ubah') }}</button>
              <button v-if="p.aktif" type="button" class="ca-btn-ghost !min-h-9 !px-3 !py-1.5 text-xs" :disabled="mati" @click="emit('nonaktifkan', p)">{{ tcf('paket.nonaktifkan') }}</button>
              <button v-else type="button" class="ca-btn-ghost !min-h-9 !px-3 !py-1.5 text-xs" :disabled="mati" @click="emit('aktifkan', p)">{{ tcf('paket.aktifkan') }}</button>
              <button v-if="bolehJadiBawaan(p)" type="button" class="ca-btn-ghost !min-h-9 !px-3 !py-1.5 text-xs" :disabled="mati" @click="emit('bawaan', p)">{{ tcf('paket.jadikanBawaan') }}</button>
              <button type="button" class="ca-btn-ghost !min-h-9 !px-3 !py-1.5 text-xs ca-tone-danger" :disabled="mati" @click="emit('hapus', p)">{{ tcf('paket.hapus') }}</button>
            </div>
          </td>
        </tr>
      </tbody>
  </CashflowTabel>
</template>
