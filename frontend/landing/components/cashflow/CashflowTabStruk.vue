<script setup lang="ts">
/**
 * Isi tab Ruang 360 › Struk (admin_struk_ruang, ranah struk): ringkas atas
 * SEMUA struk yang lolos saringan (server, halaman pertama), saringan, lalu
 * daftar struk satu halaman. Metadata saja — merchant, catatan, foto, dan
 * identitas pelanggan tidak pernah datang dari server.
 *
 * Pelanggan (K-F3-5): hanya `ada_kontak` dan `kontak_sidik` (HMAC per kasus).
 * Sidik dipakai untuk MENYOROT struk pelanggan yang sama di halaman ini —
 * tidak disimpan, tidak masuk URL/ekspor, dan kasbon/nominal TIDAK
 * dijumlahkan per sidik (spek §3 R6, §6). Yang dihitung hanya banyak struk.
 *
 * Saringan dipegang halaman (memori/useState, bukan URL — `pencatat` tidak
 * boleh ke URL); komponen ini hanya memancarkan saringan baru.
 */
import { angka, rupiah } from '~/adapters/cashflow'
import { OCR_STRUK, SARING_STRUK_KOSONG, type RingkasStruk, type SaringStruk, type Struk } from '~/adapters/cashflowRanahBuku'

const props = defineProps<{
  baris: Struk[]
  ringkas: RingkasStruk | null
  saring: SaringStruk
  /** Pilihan pencatat: anggota + bekas anggota ruang (label tersamar). */
  orang: ReadonlyArray<{ id: string; label: string }>
  labelOrang: (uid: string | null) => string
  memuat?: boolean
}>()
const emit = defineEmits<{ saring: [s: SaringStruk]; buka: [id: string] }>()
const { tcf, formatTanggal, formatWaktu } = useCashflowI18n()

const ubah = (u: Partial<SaringStruk>) => emit('saring', { ...props.saring, ...u })
const adaSaring = computed(() => (Object.keys(SARING_STRUK_KOSONG) as Array<keyof SaringStruk>).some(k => props.saring[k] !== null))

const opsiJenis = computed(() => [
  { nilai: '' as const, label: tcf('struk.saring.semua') as string },
  { nilai: 'masuk' as const, label: tcf('struk.saring.masuk') as string },
  { nilai: 'keluar' as const, label: tcf('struk.saring.keluar') as string },
])
const opsiKasbon = computed(() => (['semua', 'ya', 'tidak'] as const).map(k => ({ nilai: k, label: tcf(`struk.saring.kasbonOpsi.${k}`) as string })))
const nilaiKasbon = computed(() => (props.saring.kasbon === true ? 'ya' : props.saring.kasbon === false ? 'tidak' : 'semua'))
const pilihKasbon = (k: 'semua' | 'ya' | 'tidak') => ubah({ kasbon: k === 'ya' ? true : k === 'tidak' ? false : null })
const pilihOcr = (e: Event) => {
  const v = (e.target as HTMLSelectElement).value
  ubah({ ocr: (OCR_STRUK as readonly string[]).includes(v) ? (v as SaringStruk['ocr']) : null })
}
const pilihTanggal = (k: 'dari' | 'sampai', e: Event) => {
  const v = (e.target as HTMLInputElement).value
  ubah({ [k]: /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null })
}
const pilihPencatat = (e: Event) => {
  const v = (e.target as HTMLSelectElement).value
  ubah({ pencatat: props.orang.some(o => o.id === v) ? v : null })
}

// ── Sorot pelanggan (halaman ini saja, memori) ──────────────────────────
const sorot = ref<string | null>(null)
watch(() => props.baris, () => { if (sorot.value && !props.baris.some(s => s.kontakSidik === sorot.value)) sorot.value = null })
const jumlahSorot = computed(() => (sorot.value ? props.baris.filter(s => s.kontakSidik === sorot.value).length : 0))
const tandaSidik = (s: string) => s.slice(0, 6)

const RINGKAS = ['total', 'masuk', 'keluar', 'kasbon', 'denganFoto'] as const
const labelOcr = (o: Struk['ocr']) => (o ? tcf(`kode.ocr.${o}`) : '')
const nadaOcr = (o: Struk['ocr']) => (o === 'failed' ? 'ca-pill-danger' : o === 'pending' ? 'ca-pill-gold' : 'ca-pill-muted')
</script>

<template>
  <div class="space-y-4" :class="{ 'opacity-60': memuat }" :aria-busy="memuat || undefined">
    <dl v-if="ringkas" class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--ca-muted)]">
      <div v-for="k in RINGKAS" :key="k" class="flex items-baseline gap-1">
        <dt>{{ tcf(`struk.ringkas.${k}`) }}</dt>
        <dd class="font-semibold tabular-nums text-[var(--ca-text)]">{{ angka(ringkas[k]) }}</dd>
      </div>
      <div class="flex items-baseline gap-1">
        <dt>{{ tcf('struk.ringkasOcr') }}</dt>
        <dd class="tabular-nums text-[var(--ca-text)]">
          <template v-for="(o, i) in OCR_STRUK" :key="o"><template v-if="i">, </template>{{ tcf(`kode.ocr.${o}`) }} {{ angka(ringkas.ocr[o]) }}</template>
        </dd>
      </div>
    </dl>

    <div class="flex flex-wrap items-center gap-2">
      <CashflowSegmen :opsi="opsiJenis" :nilai="saring.jenis ?? ''" :label="tcf('struk.saring.jenis')" @pilih="j => ubah({ jenis: j || null })" />
      <CashflowSegmen :opsi="opsiKasbon" :nilai="nilaiKasbon" :label="tcf('struk.saring.kasbon')" @pilih="pilihKasbon" />
      <select class="ca-input" :value="saring.ocr ?? ''" :aria-label="tcf('struk.saring.ocr')" @change="pilihOcr">
        <option value="">{{ tcf('struk.saring.ocrSemua') }}</option>
        <option v-for="o in OCR_STRUK" :key="o" :value="o">{{ tcf(`kode.ocr.${o}`) }}</option>
      </select>
      <select v-if="orang.length" class="ca-input" :value="saring.pencatat ?? ''" :aria-label="tcf('struk.saring.pencatat')" @change="pilihPencatat">
        <option value="">{{ tcf('struk.saring.pencatatSemua') }}</option>
        <option v-for="o in orang" :key="o.id" :value="o.id">{{ o.label }}</option>
      </select>
    </div>
    <div class="flex flex-wrap items-end gap-2 text-xs text-[var(--ca-muted)]">
      <label class="flex flex-col gap-1">{{ tcf('struk.saring.dari') }}
        <input type="date" class="ca-input" :value="saring.dari ?? ''" :max="saring.sampai ?? undefined" @change="e => pilihTanggal('dari', e)">
      </label>
      <label class="flex flex-col gap-1">{{ tcf('struk.saring.sampai') }}
        <input type="date" class="ca-input" :value="saring.sampai ?? ''" :min="saring.dari ?? undefined" @change="e => pilihTanggal('sampai', e)">
      </label>
      <span class="pb-2">{{ tcf('struk.saring.tanggalKet') }}</span>
      <button v-if="adaSaring" type="button" class="ca-btn-secondary !px-3 !py-1.5 text-xs" @click="emit('saring', { ...SARING_STRUK_KOSONG })">{{ tcf('struk.saring.atur') }}</button>
    </div>

    <div v-if="sorot" class="flex flex-wrap items-center gap-2 text-sm" role="status">
      <span class="ca-pill-gold">{{ tcf('struk.kontak') }} ·{{ tandaSidik(sorot) }} · {{ tcf('struk.kontakSorot')(jumlahSorot) }}</span>
      <button type="button" class="ca-btn-secondary !px-3 !py-1 text-xs" @click="sorot = null">{{ tcf('struk.lepasSorot') }}</button>
    </div>

    <CashflowKeadaanKosong v-if="!baris.length" :pesan="adaSaring ? tcf('struk.kosongSaring') : tcf('struk.kosong')" />
    <ul v-else class="ca-console-dialog divide-y divide-[color:var(--ca-border)] text-sm">
      <li
        v-for="s in baris" :key="s.id"
        class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5"
        :class="sorot && s.kontakSidik === sorot ? 'bg-[var(--ca-gold-bg)]' : ''"
      >
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-medium text-[var(--ca-text)]">{{ s.tanggal ? formatTanggal(s.tanggal) : '—' }}</span>
            <span v-if="s.arah" :class="s.arah === 'masuk' ? 'ca-pill-emerald' : 'ca-pill-info'" class="text-[0.7rem]">{{ tcf(`struk.saring.${s.arah}`) }}</span>
            <span v-if="s.kasbon" class="ca-pill-gold text-[0.7rem]">{{ tcf('struk.saring.kasbon') }}</span>
            <span v-if="s.ocr" :class="nadaOcr(s.ocr)" class="text-[0.7rem]">{{ labelOcr(s.ocr) }}</span>
            <span v-if="s.kodeTakDikenal" class="ca-pill-muted text-[0.7rem]">{{ tcf('kode.takDikenal') }}</span>
            <span v-if="s.adaFoto" class="inline-flex items-center gap-1 text-xs text-[var(--ca-subtle)]">
              <Icon name="lucide:image" class="h-3.5 w-3.5" aria-hidden="true" />{{ tcf('struk.foto')(s.foto || 1) }}
            </span>
            <button
              v-if="s.kontakSidik" type="button" class="ca-pill-muted inline-flex items-center gap-1 text-[0.7rem]"
              :title="tcf('struk.kontakKet')" :aria-pressed="sorot === s.kontakSidik"
              @click="sorot = sorot === s.kontakSidik ? null : s.kontakSidik"
            >
              <Icon name="lucide:user-round" class="h-3 w-3" aria-hidden="true" />{{ tcf('struk.kontak') }} ·<span class="font-mono">{{ tandaSidik(s.kontakSidik) }}</span>
            </button>
            <CashflowSalinId :id="s.id" ikon />
          </div>
          <p class="mt-0.5 text-xs text-[var(--ca-muted)]">
            {{ tcf('struk.baris')(s.baris) }}<template v-if="s.produk"> · {{ tcf('struk.produk')(s.produk) }}</template>
            <template v-if="s.dompetIds.length > 1"> · {{ tcf('struk.dompet')(s.dompetIds.length) }}</template>
            <template v-if="s.uangDiterima != null"> · {{ tcf('struk.uangDiterima') }} {{ rupiah(s.uangDiterima) }}<template v-if="s.kembalian != null">, {{ tcf('struk.kembalian') }} {{ rupiah(s.kembalian) }}</template></template>
            · {{ tcf('struk.dicatat') }} {{ formatWaktu(s.dibuatIso) }} {{ tcf('struk.oleh') }} <span class="font-mono">{{ labelOrang(s.pencatat) }}</span>
          </p>
          <p v-if="s.adaMerchant || s.adaCatatan || s.barisDiSampah" class="mt-0.5 flex flex-wrap gap-x-3 text-xs text-[var(--ca-subtle)]">
            <span v-if="s.adaMerchant">{{ tcf('struk.adaMerchant') }}</span>
            <span v-if="s.adaCatatan">{{ tcf('struk.adaCatatan') }}</span>
            <span v-if="s.barisDiSampah" class="text-[var(--ca-gold-text)]">{{ tcf('struk.diSampah')(s.barisDiSampah) }}</span>
          </p>
        </div>
        <CashflowNominal class="font-semibold" :nilai="s.nominal" :arah="s.arah" />
        <button type="button" class="ca-btn-secondary !px-3 !py-1 text-xs" :disabled="!s.baris" @click="emit('buka', s.id)">{{ tcf('struk.lihatBaris') }}</button>
      </li>
    </ul>
  </div>
</template>
