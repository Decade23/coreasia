<script setup lang="ts">
/** Kesehatan — yang dilihat saat ada keluhan. Semua agregat. */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import { angka, keKesehatan, ukuranByte, type KesehatanDTO } from '~/adapters/cashflow'
import type { FotoYatimDTO, OcrDTO, TelemetriDTO } from '~/composables/cashflow/useCashflowAdmin'
const { tcf, bahasa } = useCashflowI18n()
const api = useCashflowAdmin()
const { memuat, pesanGalat, muat, aksi } = useCashflowMuat({ awal: true })
/* DTO mentah disimpan; bentuk tampilnya dari adapter (tabel per nama → larik, byte). */
const kesehatanMentah = shallowRef<KesehatanDTO | null>(null)
const kesehatan = computed(() => (kesehatanMentah.value ? keKesehatan(kesehatanMentah.value) : null))
const byte = (v: number | string | null | undefined) => ukuranByte(v, bahasa.value)
const yatim = ref<FotoYatimDTO[]>([]); const ocr = ref<OcrDTO[]>([]); const telemetri = ref<TelemetriDTO[]>([])
const tersalin = ref(false)
/* admin_foto_yatim tidak memulangkan total (M/0058), jadi diminta BATAS + 1:
   baris ke-201 hanya penanda "masih ada lagi". Dulu ubinnya menampilkan
   paling banyak 200 dan salinannya terpotong diam-diam. */
const BATAS_YATIM = 200
const yatimTerpotong = ref(false)
onMounted(() => muat(async () => {
  const [k, y, o, t] = await Promise.all([api.kesehatan(), api.fotoYatim(BATAS_YATIM + 1), api.ocr(), api.telemetri(30)])
  yatimTerpotong.value = y.length > BATAS_YATIM
  kesehatanMentah.value = k; yatim.value = y.slice(0, BATAS_YATIM); ocr.value = o; telemetri.value = t
}))
const ukuranYatim = computed(() => yatim.value.reduce((s, f) => s + Number(f.ukuran || 0), 0))
// Papan klip bisa ditolak peramban (izin, konteks tidak aman) — dikatakan lewat toast.
const salinJalur = () => aksi(async () => {
  await navigator.clipboard.writeText(yatim.value.map(f => `${f.bucket}/${f.jalur}`).join('\n'))
  tersalin.value = true; setTimeout(() => (tersalin.value = false), 2000)
})
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('kesehatan.judul')" kicker="CashFlow"><template #meta><CashflowNav /></template></ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('kesehatan.ket') }}</p>
    <p v-if="pesanGalat" class="text-sm ca-tone-danger">{{ pesanGalat }}</p>
    <p v-else-if="memuat" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>
    <template v-else-if="kesehatan">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CashflowStatTile icon="lucide:database" warna="sky" :label="tcf('kesehatan.db')" :nilai="byte(kesehatan.ukuranDb)" />
        <CashflowStatTile
          icon="lucide:image-off" warna="rose" :label="tcf('kesehatan.yatim')"
          :nilai="yatimTerpotong ? `${BATAS_YATIM}+` : yatim.length"
          :keterangan="`${yatimTerpotong ? '≥ ' : ''}${byte(ukuranYatim)}`"
        />
        <CashflowStatTile v-for="o in ocr" :key="o.status" icon="lucide:scan-text" warna="netral" :label="`OCR · ${o.status}`" :nilai="angka(o.jumlah)" />
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <section class="ca-console-dialog overflow-x-auto p-5">
          <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('kesehatan.tabel') }}</h2>
          <table class="mt-3 w-full text-sm">
            <thead><tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]"><th class="py-2 pr-3">{{ tcf('kesehatan.tabel') }}</th><th class="py-2 px-3 text-right">{{ tcf('kesehatan.baris') }}</th><th class="py-2 pl-3 text-right">{{ tcf('kesehatan.ukuran') }}</th></tr></thead>
            <tbody><tr v-for="t in kesehatan.tabel" :key="t.tabel" class="border-t border-[color:var(--ca-border)] text-[var(--ca-text)]"><td class="py-1.5 pr-3 font-mono text-xs">{{ t.tabel }}</td><td class="py-1.5 px-3 text-right tabular-nums">{{ angka(t.baris) }}</td><td class="py-1.5 pl-3 text-right tabular-nums">{{ byte(t.ukuran) }}</td></tr></tbody>
          </table>
        </section>

        <section class="ca-console-dialog p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('kesehatan.yatim') }}</h2>
              <p class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('kesehatan.yatimKet') }}</p>
              <p v-if="yatimTerpotong" class="mt-1 text-xs ca-tone-gold">{{ tcf('kesehatan.yatimPotong')(BATAS_YATIM) }}</p>
            </div>
            <button v-if="yatim.length" type="button" class="ca-btn-secondary text-xs" @click="salinJalur">{{ tersalin ? '✓' : tcf('kesehatan.salin') }}</button>
          </div>
          <CashflowKeadaanKosong v-if="!yatim.length" class="mt-3" :pesan="tcf('umum.kosong')" icon="lucide:image" />
          <ul v-else class="mt-3 max-h-64 space-y-1 overflow-auto font-mono text-xs text-[var(--ca-muted)]">
            <li v-for="f in yatim" :key="f.jalur" class="truncate">{{ f.bucket }}/{{ f.jalur }} <span class="text-[var(--ca-subtle)]">· {{ byte(f.ukuran) }} · {{ f.sebab }}</span></li>
          </ul>
        </section>
      </div>

      <section class="ca-console-dialog p-5">
        <h2 class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('kesehatan.telemetri') }}</h2>
        <CashflowKeadaanKosong v-if="!telemetri.length" class="mt-3" :pesan="tcf('kesehatan.telemetriKet')" icon="lucide:radio" />
        <table v-else class="mt-3 w-full text-sm">
          <thead><tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]"><th class="py-2 pr-3">{{ tcf('kesehatan.kolom.jenis') }}</th><th class="py-2 px-3">{{ tcf('kesehatan.kolom.layar') }}</th><th class="py-2 px-3 text-right">{{ tcf('kesehatan.kolom.jumlah') }}</th><th class="py-2 pl-3 text-right">{{ tcf('kesehatan.kolom.pengguna') }}</th></tr></thead>
          <tbody><tr v-for="(t, i) in telemetri" :key="i" class="border-t border-[color:var(--ca-border)] text-[var(--ca-text)]"><td class="py-1.5 pr-3 font-mono text-xs">{{ t.jenis }}</td><td class="py-1.5 px-3">{{ t.layar || '—' }}</td><td class="py-1.5 px-3 text-right tabular-nums">{{ angka(t.jumlah) }}</td><td class="py-1.5 pl-3 text-right tabular-nums">{{ angka(t.pengguna) }}</td></tr></tbody>
        </table>
      </section>
    </template>
  </div>
</template>
