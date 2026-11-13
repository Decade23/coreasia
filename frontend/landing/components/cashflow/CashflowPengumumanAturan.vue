<script setup lang="ts">
/**
 * Editor penerima "Otomatis dengan aturan" (P1, P3, P5): dasar (semua
 * pengguna atau segmen tersimpan), saringan P2 bila dasarnya semua pengguna,
 * lalu pengecualian (akun internal bawaan nyala, pengguna, kelompok).
 *
 * Keluarannya satu: `update:aturan` berisi p_aturan siap kirim, atau null
 * selama isiannya belum sah (Simpan pengumuman tertahan). Isian awal dibaca
 * sekali dari `awal` saat dipasang: halaman memasang ulang editor (key) untuk
 * pengumuman lain.
 *
 * "Simpan saringan sebagai segmen" menyimpan saringan yang sedang diisi
 * lewat admin_simpan_segmen_pengumuman (beraudit, beralasan). Bila "Pakai
 * segmen ini" dicentang, dasar pindah ke segmen itu, jadi pengumuman
 * merujuk segmennya (hidup, bukan salinan).
 */
import {
  ISIAN_SARING_KOSONG, BATAS_KECUALI_PENGGUNA, NAMA_SEGMEN_MAKS,
  isianDariSaring, periksaIsianSaring, aturanKeDto, periksaAturan, keDaftarSegmen, kalimatSaring, periksaNamaSegmen, saringKeDto,
  type Aturan, type AturanDTO, type IsianSaring, type Segmen, type KamusRingkas,
} from '~/adapters/cashflowPengumumanAturan'

const props = defineProps<{ awal: Aturan | null; disabled?: boolean }>()
const emit = defineEmits<{ 'update:aturan': [AturanDTO | null]; sibuk: [boolean] }>()
const { tcf, kamus, bahasa } = useCashflowI18n()
const api = useCashflowAdmin()
const toast = useToast()
const daftar = useCashflowMuat()
const { aksi } = useCashflowMuat()

const segmen = shallowRef<Segmen[]>([])
const segmenTermuat = ref(false)
const muatSegmen = () => daftar.muat(async terbaru => {
  const hasil = keDaftarSegmen(await api.daftarSegmenPengumuman())
  if (terbaru()) { segmen.value = hasil; segmenTermuat.value = true }
})
onMounted(() => { void muatSegmen() })

const dasar = ref<string>(props.awal?.segmenId ?? 'semua')
const isian = ref<IsianSaring>(props.awal?.saring ? isianDariSaring(props.awal.saring) : { ...ISIAN_SARING_KOSONG })
const kecualiInternal = ref(props.awal?.kecualiInternal ?? true)
const kecualiPengguna = ref<string[]>([...(props.awal?.kecualiPengguna ?? [])])
const kecualiKelompok = ref<string[]>([...(props.awal?.kecualiKelompok ?? [])])
const asing = computed(() => (props.awal?.asing ?? []).length > 0)
const bukaPengguna = ref(kecualiPengguna.value.length > 0)
const bukaKelompok = ref(kecualiKelompok.value.length > 0)

const periksa = computed(() => periksaIsianSaring(isian.value))
const segmenDipilih = computed(() => (dasar.value === 'semua' ? null : segmen.value.find(s => s.id === dasar.value) ?? null))
const segmenHilang = computed(() => dasar.value !== 'semua' && segmenTermuat.value && !segmenDipilih.value)
const ringkas = computed(() => kamus.value.pengumuman.ringkas as unknown as KamusRingkas)

const dto = computed<AturanDTO | null>(() => {
  if (dasar.value === 'semua' && !periksa.value.saring) return null
  if (segmenHilang.value) return null
  const d = aturanKeDto({
    segmenId: dasar.value === 'semua' ? null : dasar.value,
    saring: periksa.value.saring,
    kecualiInternal: kecualiInternal.value,
    kecualiPengguna: kecualiPengguna.value,
    kecualiKelompok: kecualiKelompok.value,
  })
  return periksaAturan(d).length ? null : d
})
watch(dto, d => emit('update:aturan', d), { immediate: true })

// ── Simpan saringan sebagai segmen ──────────────────────────────────────
const formSegmen = ref(false)
const namaSegmen = ref('')
const alasanSegmen = ref('')
const pakaiSegmen = ref(true)
const menyimpanSegmen = ref(false)
const kelompokSibuk = ref(false)
watch([menyimpanSegmen, kelompokSibuk], () => emit('sibuk', menyimpanSegmen.value || kelompokSibuk.value), { immediate: true })
onBeforeUnmount(() => { daftar.batal(); emit('sibuk', false) })

const galatNama = computed(() => (namaSegmen.value ? periksaNamaSegmen(namaSegmen.value, segmen.value) : null))
const bukaFormSegmen = () => {
  namaSegmen.value = ''
  alasanSegmen.value = tcf('pengumuman.aturan.alasanSegmenAwal')
  pakaiSegmen.value = true
  formSegmen.value = true
}
const simpanSegmen = async () => {
  const saring = periksa.value.saring
  if (menyimpanSegmen.value || !saring) return
  const galat = periksaNamaSegmen(namaSegmen.value, segmen.value)
  if (galat) { toast.error(tcf(`pengumuman.segmen.namaGalat.${galat}`)); return }
  if (alasanSegmen.value.trim().length < 8) { toast.error(tcf('alasan.pendek')); return }
  menyimpanSegmen.value = true
  try {
    const id = crypto.randomUUID()
    const ok = await aksi(async () => {
      await api.simpanSegmenPengumuman(id, null, namaSegmen.value.trim(), saringKeDto(saring), alasanSegmen.value.trim())
    }, { sukses: tcf('pengumuman.aturan.segmenTersimpan') })
    if (!ok) return
    formSegmen.value = false
    await muatSegmen()
    if (pakaiSegmen.value) dasar.value = id
  } finally { menyimpanSegmen.value = false }
}
</script>

<template>
  <div class="min-w-0 space-y-4" data-uji="aturan-penerima">
    <p class="text-xs text-[var(--ca-muted)]">{{ tcf('pengumuman.aturan.ket') }}</p>
    <p v-if="asing" class="rounded-xl border border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)] px-3 py-2 text-xs text-[var(--ca-text)]" role="status">{{ tcf('pengumuman.aturan.asing') }}</p>

    <label for="cf-aturan-dasar" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.aturan.dasar') }}
      <select id="cf-aturan-dasar" v-model="dasar" class="ca-input mt-2 w-full" :disabled="disabled">
        <option value="semua">{{ tcf('pengumuman.aturan.dasarSemua') }}</option>
        <option v-for="s in segmen" :key="s.id" :value="s.id">{{ tcf('pengumuman.aturan.dasarSegmen')(s.nama) }}</option>
        <option v-if="dasar !== 'semua' && !segmenDipilih" :value="dasar">{{ segmenTermuat ? tcf('pengumuman.ringkas.segmenHilang') : tcf('pengumuman.aturan.segmenMemuat') }}</option>
      </select>
    </label>
    <p v-if="daftar.pesanGalat.value" class="text-xs ca-tone-danger" role="alert">{{ daftar.pesanGalat.value }}</p>

    <fieldset v-if="dasar === 'semua'" class="min-w-0 space-y-3 rounded-xl border border-[color:var(--ca-border)] p-3">
      <legend class="px-1 text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.aturan.saringJudul') }}</legend>
      <CashflowPengumumanSaringan v-model="isian" :galat="periksa.galat" :disabled="disabled" />
      <button v-if="!formSegmen" type="button" class="ca-btn-secondary w-full text-xs" :disabled="disabled || !periksa.saring" @click="bukaFormSegmen">{{ tcf('pengumuman.aturan.simpanSegmen') }}</button>
      <div v-else class="space-y-3 border-t border-[color:var(--ca-border)] pt-3" role="group" :aria-label="tcf('pengumuman.aturan.simpanSegmen')">
        <fieldset :disabled="menyimpanSegmen" class="space-y-3">
          <label for="cf-aturan-nama-segmen" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.aturan.namaSegmen') }}
            <input id="cf-aturan-nama-segmen" v-model="namaSegmen" :maxlength="NAMA_SEGMEN_MAKS" class="ca-input mt-2 w-full" :aria-invalid="galatNama ? 'true' : undefined">
          </label>
          <p v-if="galatNama" class="text-xs ca-tone-danger" role="alert">{{ tcf(`pengumuman.segmen.namaGalat.${galatNama}`) }}</p>
          <label for="cf-aturan-alasan-segmen" class="block text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.aturan.alasanSegmen') }}
            <input id="cf-aturan-alasan-segmen" v-model="alasanSegmen" class="ca-input mt-2 w-full" minlength="8">
          </label>
          <label class="flex items-center gap-2 text-xs text-[var(--ca-text)]"><input v-model="pakaiSegmen" type="checkbox" class="accent-[var(--ca-accent)]">{{ tcf('pengumuman.aturan.pakaiSegmen') }}</label>
          <div class="flex justify-end gap-2">
            <button type="button" class="ca-btn-secondary text-xs" @click="formSegmen = false">{{ tcf('umum.batal') }}</button>
            <button type="button" class="ca-btn-primary text-xs" :disabled="!!galatNama || !namaSegmen.trim() || alasanSegmen.trim().length < 8" @click="simpanSegmen">{{ menyimpanSegmen ? tcf('pengumuman.menyimpan') : tcf('pengumuman.aturan.simpanSegmenTombol') }}</button>
          </div>
        </fieldset>
      </div>
    </fieldset>
    <div v-else class="rounded-xl border border-[color:var(--ca-border)] p-3 text-xs">
      <p v-if="segmenHilang" class="ca-tone-danger" role="alert">{{ tcf('pengumuman.aturan.segmenHilang') }}</p>
      <template v-else-if="segmenDipilih">
        <p class="text-[var(--ca-text)]">{{ kalimatSaring(segmenDipilih.saring, ringkas, bahasa) }}</p>
        <p class="mt-1 text-[var(--ca-muted)]">{{ tcf('pengumuman.aturan.segmenKet') }}</p>
      </template>
      <p v-else class="text-[var(--ca-muted)]">{{ tcf('pengumuman.aturan.segmenMemuat') }}</p>
    </div>

    <fieldset class="min-w-0 space-y-3 rounded-xl border border-[color:var(--ca-border)] p-3">
      <legend class="px-1 text-xs font-semibold text-[var(--ca-muted)]">{{ tcf('pengumuman.aturan.kecualiJudul') }}</legend>
      <label class="flex items-start gap-2 text-xs text-[var(--ca-text)]">
        <input v-model="kecualiInternal" type="checkbox" class="mt-0.5 accent-[var(--ca-accent)]" :disabled="disabled" data-uji="kecuali-internal">
        <span>{{ tcf('pengumuman.aturan.kecualiInternal') }}<span class="block text-[var(--ca-muted)]">{{ tcf('pengumuman.aturan.kecualiInternalKet') }}</span></span>
      </label>
      <div class="space-y-2">
        <button type="button" class="ca-btn-ghost !min-h-11 w-full justify-between !px-2 text-xs" :aria-expanded="bukaPengguna" @click="bukaPengguna = !bukaPengguna">
          <span>{{ tcf('pengumuman.aturan.kecualiPengguna') }} · {{ kecualiPengguna.length }}</span><Icon :name="bukaPengguna ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="h-4 w-4" />
        </button>
        <CashflowPengumumanPengguna v-if="bukaPengguna" v-model="kecualiPengguna" :batas="BATAS_KECUALI_PENGGUNA" :label-cari="tcf('pengumuman.aturan.kecualiPengguna')" :disabled="disabled" />
      </div>
      <div class="space-y-2">
        <button type="button" class="ca-btn-ghost !min-h-11 w-full justify-between !px-2 text-xs" :aria-expanded="bukaKelompok" @click="bukaKelompok = !bukaKelompok">
          <span>{{ tcf('pengumuman.aturan.kecualiKelompok') }} · {{ kecualiKelompok.length }}</span><Icon :name="bukaKelompok ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="h-4 w-4" />
        </button>
        <CashflowPengumumanKelompok v-if="bukaKelompok" v-model="kecualiKelompok" :label-cari="tcf('pengumuman.aturan.kecualiKelompok')" :disabled="disabled" @sibuk="kelompokSibuk = $event" />
      </div>
    </fieldset>
  </div>
</template>
