<script setup lang="ts">
/**
 * Pilih akun penerima (atau akun yang dikecualikan) pengumuman.
 *
 * PENCARIAN v2 (spek console 19 Nov 2026, K8, PF-02). Sesi ber-izin
 * cashflow:pii mencari lewat admin_pengumuman_pengguna_v2 dengan alasan tetap
 * dari halaman (pola daftar Pengguna v4): email dan nama tampil utuh, dan
 * pencarian ikut mencocokkan email, nama, serta nomor WhatsApp asli. Setiap
 * pembukaan dicatat server (cari_penerima_terbuka). Sesi tanpa pii, atau Kontak
 * lengkap yang sedang dimatikan di daftar Pengguna, tetap tersamar seperti
 * dulu. Server yang menolak alasan (izin dicabut) dibaca ulang tanpa alasan.
 * Server lama tanpa v2 (PGRST202) memakai v1, tanpa galat.
 */
import { keAkunPenerimaV2, type AkunPenerimaV2 } from '~/adapters/cashflowPengumuman'
import { petakanGalat } from '~/composables/cashflow/useCashflowAdmin'

const props = defineProps<{ modelValue: string[]; tunggal?: boolean; disabled?: boolean; labelCari?: string; batas?: number }>()
const emit = defineEmits<{ 'update:modelValue': [string[]] }>()
const { tcf } = useCashflowI18n()
const api = useCashflowAdmin()
const sesi = useCashflowSesi()
const { user } = useAdminAuth()
const batas = computed(() => props.batas ?? 1000)
const { muat, pesanGalat, memuat, batal } = useCashflowMuat()
const cari = ref(''), kueri = ref(''), halaman = ref(0), total = ref(0)
const rows = ref<AkunPenerimaV2[]>([])
const label = reactive<Record<string, string>>({})
const terbuka = ref(false)

/** Alasan tetap (pola v4): pembukaan tetap tercatat dengan alasan yang terbaca di audit. */
const ALASAN_CARI = 'Cari penerima pengumuman di console CashFlow'
/* null = belum tahu, false = server lama tanpa v2. Lengket selama sesi tab. */
const adaV2 = useState<boolean | null>('cf_pengumuman_cari_v2', () => null)
const kontakDisamarkanOleh = useState<string | null>('cf_kontak_disamarkan_oleh', () => null)
const bolehBuka = computed(() => sesi.boleh('cashflow:pii') && !(user.value?.id && kontakDisamarkanOleh.value === user.value.id))

type Hasil = { total: number; baris: AkunPenerimaV2[]; terbuka: boolean }
async function ambil(q: string, offset: number, ids: string[] | null): Promise<Hasil> {
  if (adaV2.value !== false) {
    const coba = async (alasan: string | null) => {
      const h = await api.penggunaPengumumanV2(q, offset, ids, alasan)
      return { total: Number(h.total), baris: (h.baris ?? []).map(keAkunPenerimaV2), terbuka: h.terbuka === true }
    }
    try {
      const h = await coba(bolehBuka.value ? ALASAN_CARI : null)
      adaV2.value = true
      return h
    } catch (e) {
      const g = petakanGalat(e, 'admin_pengumuman_pengguna_v2')
      if (g.jenis === 'izin' && bolehBuka.value) { adaV2.value = true; return coba(null) }
      if (g.jenis !== 'belum-aktif') throw e
      adaV2.value = false
    }
  }
  const h = await api.penggunaPengumuman(q, offset, ids)
  return {
    total: Number(h.total), terbuka: false,
    baris: h.baris.map(b => ({ id: b.id, email: b.email, nama: null, versi: null, internal: false, jenisInternal: null })),
  }
}
const tandai = (p: AkunPenerimaV2) => { label[p.id] = p.nama ? `${p.nama} (${p.email})` : p.email }
const baca = () => muat(async terbaru => {
  const hasil = await ambil(kueri.value, halaman.value * 25, null)
  if (!terbaru()) return
  rows.value = hasil.baris; total.value = hasil.total; terbuka.value = hasil.terbuka
  for (const p of hasil.baris) tandai(p)
})
const cariAkun = () => { kueri.value = cari.value.trim(); halaman.value = 0; void baca() }
const pindah = (n: number) => { halaman.value = n; void baca() }
const pilih = (id: string) => {
  if (props.disabled) return
  const ids = props.modelValue.includes(id) ? props.modelValue.filter(x => x !== id) : props.tunggal ? [id] : [...props.modelValue, id]
  if (ids.length <= batas.value) emit('update:modelValue', ids)
}
const labelMuat = useCashflowMuat()
watch(() => props.modelValue, ids => {
  const hilang = ids.filter(id => !label[id])
  if (hilang.length) void labelMuat.muat(async terbaru => {
    const hasil = await ambil('', 0, hilang)
    if (terbaru()) for (const p of hasil.baris) tandai(p)
  })
}, { immediate: true })
onMounted(() => { void baca() })
onBeforeUnmount(() => { batal(); labelMuat.batal() })
</script>
<template>
  <div class="min-w-0 space-y-3" data-uji="cari-penerima">
    <div class="flex gap-2"><input v-model="cari" :aria-label="labelCari || tcf('pengumuman.akun.cari')" class="ca-input min-w-0 flex-1" :placeholder="terbuka ? tcf('pengumuman.akun.cariKetTerbuka') : tcf('pengumuman.akun.cariKet')" :disabled="disabled" @keydown.enter.prevent="cariAkun"><button type="button" class="ca-btn-secondary" :disabled="disabled || memuat" @click="cariAkun">{{ tcf('pengumuman.akun.cariTombol') }}</button></div>
    <p class="text-xs text-[var(--ca-subtle)]" data-uji="cari-penerima-mode">{{ terbuka ? tcf('pengumuman.akun.terbuka') : tcf('pengumuman.akun.tersamar') }}</p>
    <p v-if="pesanGalat || labelMuat.pesanGalat.value" class="text-xs ca-tone-danger" role="alert">{{ pesanGalat || labelMuat.pesanGalat.value }}</p>
    <p class="text-xs text-[var(--ca-muted)]">{{ tcf('pengumuman.akun.dipilih')(modelValue.length) }}</p>
    <div v-if="modelValue.length" class="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
      <button v-for="id in modelValue" :key="id" type="button" class="ca-pill-muted max-w-full break-all !min-h-11 text-xs" :disabled="disabled" :aria-label="tcf('pengumuman.akun.hapus')(label[id] || id)" @click="pilih(id)">{{ label[id] || id }} · {{ id.slice(0, 8) }} <span aria-hidden="true">×</span></button>
    </div>
    <div class="max-h-64 overflow-y-auto rounded-xl border border-[color:var(--ca-border)]" :aria-busy="memuat">
      <label v-for="p in rows" :key="p.id" class="flex min-h-12 cursor-pointer items-center gap-3 border-b border-[color:var(--ca-border)] px-3 py-2 last:border-b-0">
        <input :type="tunggal ? 'radio' : 'checkbox'" :name="tunggal ? 'cf-penerima-akun' : undefined" :checked="modelValue.includes(p.id)" :disabled="disabled || (!tunggal && modelValue.length >= batas && !modelValue.includes(p.id))" class="accent-[var(--ca-accent)]" @change="pilih(p.id)">
        <span class="min-w-0 flex-1 text-xs">
          <span v-if="p.nama" class="block break-words font-semibold text-[var(--ca-text)]">{{ p.nama }}</span>
          <span class="block break-all text-[var(--ca-text)]">{{ p.email || tcf('pengumuman.akun.tanpaEmail') }}</span>
          <span class="text-[var(--ca-muted)]" :title="p.id">{{ p.id.slice(0, 8) }}<template v-if="p.versi"> · {{ tcf('pengumuman.akun.versi')(p.versi) }}</template></span>
        </span>
        <span v-if="p.internal" class="ca-pill-muted shrink-0 text-[11px]" data-uji="akun-internal">{{ tcf('pengumuman.akun.internal')(p.jenisInternal ? tcf(`sakelar.internal.jenisOpsi.${p.jenisInternal}`) : '') }}</span>
      </label>
      <p v-if="!rows.length" class="p-3 text-xs text-[var(--ca-muted)]">{{ memuat ? tcf('pengumuman.akun.memuat') : tcf('pengumuman.akun.kosong') }}</p>
    </div>
    <div class="flex items-center justify-between gap-2 text-xs text-[var(--ca-muted)]"><button type="button" class="ca-btn-secondary !min-h-11 !px-3" :disabled="disabled || memuat || halaman === 0" @click="pindah(halaman - 1)">{{ tcf('pengumuman.akun.sebelumnya') }}</button><span>{{ halaman + 1 }} / {{ Math.max(1, Math.ceil(total / 25)) }} · {{ tcf('pengumuman.akun.total')(total) }}</span><button type="button" class="ca-btn-secondary !min-h-11 !px-3" :disabled="disabled || memuat || (halaman + 1) * 25 >= total" @click="pindah(halaman + 1)">{{ tcf('pengumuman.akun.berikutnya') }}</button></div>
  </div>
</template>
