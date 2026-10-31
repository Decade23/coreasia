<script setup lang="ts">
/**
 * Kartu "Dukung lewat web" di Sakelar (0118): menyalakan atau mematikan
 * halaman /dukung lewat kunci app_config dukung_web.
 *
 * Kuncinya TIDAK publik (hanya fungsi server yang membaca). Yang diubah di
 * sini hanya `aktif`; batas QR dan nama penerima dipertahankan apa adanya
 * (nilaiSakelarDukung). Menulis lewat admin_set_config yang sudah ada:
 * beraudit, alasan otomatis yang menamai tindakannya, bisa diganti.
 *
 * PENJAGA TIMPA. updated_at baris dicatat saat kartu dimuat. Sebelum
 * menulis, daftar config dibaca ulang; bila barisnya berubah, tidak ada yang
 * ditulis dan kartu memakai nilai terbaru.
 *
 * Kunci yang belum ada (0118 belum terpasang): kartu hanya memberi tahu,
 * tanpa tombol. Membuat kuncinya dari sini bisa menyalakan halaman sebelum
 * fungsi servernya siap.
 */
import type { Config } from '~/adapters/cashflow'
import { CATATAN_SAKELAR_DUKUNG, KUNCI_SAKELAR_DUKUNG, bacaSakelarDukung, nilaiSakelarDukung } from '~/adapters/cashflowDukungan'

const props = defineProps<{
  config: readonly Config[]
  /** Baca ulang daftar config halaman (tanpa keadaan memuat) dan pulangkan barisnya. */
  segarkan: () => Promise<readonly Config[]>
}>()
const { tcf } = useCashflowI18n()
const api = useCashflowAdmin()
const { aksi } = useCashflowMuat()
const toast = useToast()

const baris = computed(() => props.config.find(c => c.kunci === KUNCI_SAKELAR_DUKUNG) ?? null)
const sakelar = computed(() => bacaSakelarDukung(baris.value))
/** updated_at saat kartu terakhir menyelaraskan diri dengan server. */
const versiDimuat = ref<string | null>(null)
const alasan = ref('')
const sibuk = ref(false)

const selaraskan = () => {
  versiDimuat.value = baris.value?.diperbaruiIso ?? null
  alasan.value = sakelar.value.aktif ? tcf('sakelar.dukung.alasanMati') : tcf('sakelar.dukung.alasanNyala')
}
onMounted(selaraskan)
watch(() => `${baris.value?.diperbaruiIso ?? ''}|${sakelar.value.aktif}`, () => { if (!sibuk.value) selaraskan() })

const bolehUbah = computed(() => sakelar.value.ada && !sibuk.value && alasan.value.trim().length >= 8)

const ubah = async () => {
  if (!bolehUbah.value) return
  sibuk.value = true
  try {
    let sama: boolean | null = null
    const terbaca = await aksi(async () => {
      const daftar = await props.segarkan()
      sama = (daftar.find(c => c.kunci === KUNCI_SAKELAR_DUKUNG)?.diperbaruiIso ?? null) === versiDimuat.value
    })
    if (!terbaca || sama === null) return
    if (!sama) {
      toast.error(tcf('sakelar.dukung.berubahDiServer'))
      selaraskan()
      return
    }
    const b = baris.value
    if (!b) return
    const target = !sakelar.value.aktif
    const ok = await aksi(
      () => api.setConfig(KUNCI_SAKELAR_DUKUNG, nilaiSakelarDukung(b.nilai, target), false, b.catatan || CATATAN_SAKELAR_DUKUNG, alasan.value.trim()),
      { sukses: target ? tcf('sakelar.dukung.tersimpanHidup') : tcf('sakelar.dukung.tersimpanMati') },
    )
    if (ok) await aksi(async () => { await props.segarkan() })
  } finally {
    sibuk.value = false
    selaraskan()
  }
}
</script>

<template>
  <section class="ca-console-dialog p-5" aria-labelledby="cf-dukung-judul" data-uji="sakelar-dukung">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="max-w-xl">
        <h2 id="cf-dukung-judul" class="font-display text-base font-bold text-[var(--ca-text)]">{{ tcf('sakelar.dukung.judul') }}</h2>
        <p class="mt-1 text-sm text-[var(--ca-muted)]">{{ tcf('sakelar.dukung.ket') }}</p>
        <p v-if="!sakelar.ada" class="mt-2 text-sm text-[var(--ca-muted)]">{{ tcf('sakelar.dukung.tiada') }}</p>
        <template v-else>
          <p class="mt-2 text-sm font-semibold" :class="sakelar.aktif ? 'ca-tone-emerald' : 'text-[var(--ca-muted)]'">
            {{ sakelar.aktif ? tcf('sakelar.dukung.hidup') : tcf('sakelar.dukung.mati') }}
          </p>
          <p v-if="sakelar.batasHarian != null && sakelar.batasIp10 != null && sakelar.batasIpHarian != null" class="mt-1 text-xs text-[var(--ca-subtle)]">
            {{ tcf('sakelar.dukung.batas')(sakelar.batasHarian, sakelar.batasIp10, sakelar.batasIpHarian) }}
          </p>
          <p v-if="sakelar.penerima" class="mt-1 text-xs text-[var(--ca-subtle)]">{{ tcf('sakelar.dukung.penerima')(sakelar.penerima) }}</p>
          <p v-if="!sakelar.objek" class="mt-2 text-xs ca-tone-gold">{{ tcf('sakelar.dukung.bukanObjek') }}</p>
        </template>
      </div>
      <button
        v-if="sakelar.ada" type="button"
        :class="sakelar.aktif ? 'ca-btn-secondary' : 'ca-btn-primary'" class="inline-flex items-center gap-2 text-sm"
        :disabled="!bolehUbah" data-uji="sakelar-dukung-tombol" @click="ubah"
      >
        <Icon v-if="sibuk" name="lucide:loader-2" class="h-4 w-4 animate-spin" />
        <Icon v-else :name="sakelar.aktif ? 'lucide:power-off' : 'lucide:power'" class="h-4 w-4" />
        {{ sakelar.aktif ? tcf('sakelar.dukung.matikan') : tcf('sakelar.dukung.nyalakan') }}
      </button>
    </div>
    <label v-if="sakelar.ada" class="mt-4 block max-w-xl">
      <span class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('sakelar.alasanUbah') }}</span>
      <input v-model="alasan" type="text" class="ca-input mt-1 w-full" :disabled="sibuk" :placeholder="tcf('alasan.lengkapi')" >
    </label>
  </section>
</template>
