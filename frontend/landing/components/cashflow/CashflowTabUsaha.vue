<script setup lang="ts">
/**
 * Isi tab Ruang 360 › Usaha, tampilan Produk (admin_usaha_ruang, ranah
 * usaha): ringkas atas SEMUA produk yang lolos saringan arsip (server), lalu
 * daftar produk dengan stok kini. Stok = masuk − keluar + penyesuaian dari
 * server (sama dengan stok_produk 0046; penjualan kasbon ikut) — tidak
 * dihitung ulang di sini. null = produk tanpa lacak stok.
 *
 * Cari nama, kategori (K-F3-13, T2), dan "menipis atau minus saja" disaring
 * di memori atas jawaban yang sudah ada: tanpa RPC dan audit tambahan, dan
 * tidak ditulis ke URL. "Riwayat stok" per produk = ?lihat=stok&produk=
 * (diurus halaman).
 */
import { rupiah } from '~/adapters/cashflow'
import type { UsahaRuang } from '~/adapters/cashflowRanahBuku'
import {
  PILIHAN_ARSIP, SARING_PRODUK_KOSONG, kategoriProduk, kuantitas, saringProduk, type PilihanArsip, type SaringProduk,
} from '~/adapters/cashflowTampilBuku'

const props = defineProps<{
  data: UsahaRuang
  arsip: PilihanArsip
  labelOrang: (uid: string | null) => string
  memuat?: boolean
}>()
const emit = defineEmits<{ arsip: [p: PilihanArsip]; riwayat: [produk: string] }>()
const { tcf, bahasa, formatTanggal } = useCashflowI18n()

const saring = ref<SaringProduk>({ ...SARING_PRODUK_KOSONG })
const opsiArsip = computed(() => PILIHAN_ARSIP.map(p => ({ nilai: p, label: tcf(`jadwal.arsipOpsi.${p}`) as string })))
const kategori = computed(() => kategoriProduk(props.data.produk))
const produk = computed(() => saringProduk(props.data.produk, saring.value))
const RINGKAS = ['aktif', 'berstok', 'menipis', 'minus', 'arsip'] as const
const q = (n: number | null) => kuantitas(n, bahasa.value)
</script>

<template>
  <div class="space-y-4" :class="{ 'opacity-60': memuat }" :aria-busy="memuat || undefined">
    <dl class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--ca-muted)]">
      <div v-for="k in RINGKAS" :key="k" class="flex items-baseline gap-1">
        <dt>{{ tcf(`usaha.ringkas.${k}`) }}</dt>
        <dd
          class="font-semibold tabular-nums"
          :class="(k === 'minus' || k === 'menipis') && data.ringkas[k] ? (k === 'minus' ? 'text-[var(--ca-danger-text)]' : 'text-[var(--ca-gold-text)]') : 'text-[var(--ca-text)]'"
        >{{ data.ringkas[k] }}</dd>
      </div>
    </dl>

    <div class="flex flex-wrap items-center gap-2">
      <CashflowSegmen :opsi="opsiArsip" :nilai="arsip" @pilih="p => emit('arsip', p)" />
      <input v-model="saring.cari" type="search" class="ca-input min-w-0 flex-1 sm:max-w-xs" :placeholder="tcf('usaha.cari')" :aria-label="tcf('usaha.cari')">
      <select v-if="kategori.length" v-model="saring.kategori" class="ca-input" :aria-label="tcf('usaha.semuaKategori')">
        <option value="">{{ tcf('usaha.semuaKategori') }}</option>
        <option v-for="k in kategori" :key="k.nama" :value="k.nama">{{ k.nama }} ({{ k.jumlah }})</option>
      </select>
      <label class="inline-flex items-center gap-2 text-xs text-[var(--ca-muted)]">
        <input v-model="saring.perhatian" type="checkbox">
        {{ tcf('usaha.perhatian') }}
      </label>
    </div>
    <p class="text-xs text-[var(--ca-muted)]">
      {{ tcf('usaha.tampil')(produk.length, data.produk.length) }}<template v-if="data.terpotong"> · <span class="text-[var(--ca-gold-text)]">{{ tcf('usaha.potong') }}</span></template>
    </p>

    <CashflowKeadaanKosong v-if="!produk.length" :pesan="tcf('usaha.kosongSaring')" />
    <ul v-else class="ca-console-dialog divide-y divide-[color:var(--ca-border)] text-sm">
      <li v-for="p in produk" :key="p.id" class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5" :class="{ 'opacity-70': p.arsip }">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-medium text-[var(--ca-text)]">{{ p.nama }}</span>
            <span v-if="p.kategori" class="ca-pill-info text-[0.7rem]">{{ p.kategori }}</span>
            <span v-if="p.arsip" class="ca-pill-muted text-[0.7rem]">{{ tcf('usaha.arsip') }}</span>
            <span v-if="p.minus" class="ca-pill-danger text-[0.7rem]">{{ tcf('usaha.minus') }}</span>
            <span v-else-if="p.menipis" class="ca-pill-gold text-[0.7rem]">{{ tcf('usaha.menipis') }}</span>
            <Icon v-if="p.adaFoto" name="lucide:image" class="h-3.5 w-3.5 text-[var(--ca-subtle)]" :aria-label="tcf('usaha.adaFoto')" />
          </div>
          <p class="mt-0.5 text-xs text-[var(--ca-muted)]">
            {{ tcf('usaha.hargaJual') }} {{ p.hargaJual == null ? '—' : rupiah(p.hargaJual) }}
            · {{ tcf('usaha.hargaModal') }} {{ p.hargaModal == null ? '—' : rupiah(p.hargaModal) }}
            <template v-if="p.terjual"> · {{ tcf('usaha.terjual')(p.terjual) }}<template v-if="p.terakhirTerjual">, {{ tcf('usaha.terakhir') }} {{ formatTanggal(p.terakhirTerjual) }}</template></template>
            · {{ tcf('usaha.pembuat') }} <span class="font-mono">{{ labelOrang(p.pembuat) }}</span>
          </p>
          <p v-if="p.lacakStok" class="mt-0.5 text-xs tabular-nums text-[var(--ca-subtle)]">
            {{ tcf('usaha.masuk') }} {{ q(p.masuk) }} · {{ tcf('usaha.keluar') }} {{ q(p.keluar) }} · {{ tcf('usaha.penyesuaian') }} {{ q(p.penyesuaian) }}<template v-if="p.stokMin != null"> · {{ tcf('usaha.stokMin') }} {{ q(p.stokMin) }}</template>
          </p>
        </div>
        <div class="text-right">
          <div class="text-xs text-[var(--ca-muted)]">{{ tcf('usaha.stok') }}</div>
          <div v-if="p.stok != null" class="font-semibold tabular-nums" :class="p.minus ? 'text-[var(--ca-danger-text)]' : p.menipis ? 'text-[var(--ca-gold-text)]' : 'text-[var(--ca-text)]'">
            {{ q(p.stok) }}<span v-if="p.satuan" class="ml-1 text-xs font-normal text-[var(--ca-muted)]">{{ p.satuan }}</span>
          </div>
          <div v-else class="text-xs text-[var(--ca-subtle)]">{{ tcf('usaha.tanpaLacak') }}</div>
        </div>
        <button type="button" class="ca-btn-secondary !px-3 !py-1 text-xs" @click="emit('riwayat', p.id)">{{ tcf('usaha.riwayat') }}</button>
      </li>
    </ul>
  </div>
</template>
