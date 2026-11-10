<script setup lang="ts">
/**
 * Tab Domi AI: daftar percakapan dan panel chat (T3, kasus anak {teks, foto}).
 * Aktivasi pengguna (klik tab, Enter, angka pintasan) membuka otomatis, satu
 * klik tanpa dialog. Dibuka lewat URL, refresh, atau Back: tombol "Buka"
 * dulu (spek aktivasi Fase 3, sama dengan tab Perangkat dan Kabar). Tidak ada
 * tombol tulis, simpan, atau hapus di sini.
 */
const props = defineProps<{ user: string }>()
const { tcf, formatWaktu } = useCashflowI18n()
const kasus = useCashflowKasus()
const domi = useCashflowDomi()
const route = useRoute()
const aktivasiTab = useCashflowAktivasiTab()
const { galat, pesanGalat, memuat, muat, aksi } = useCashflowMuat()
const memuatPesan = ref(false)
const pilihan = ref<string | null>(null)

domi.pasangSubjek(props.user)
onBeforeUnmount(() => domi.buangSekarang())
const aktifOlehPengguna = aktivasiTab.ambil(route.path)
const bisaBuka = computed(() => !!kasus.kasus.value && !domi.sudahDibuka.value)

const buka = () => muat(() => domi.buka(props.user))
/* Aktivasi tab oleh pengguna: tunggu kasus induk siap, lalu buka sekali. */
let sudahOtomatis = false
watch(bisaBuka, (boleh) => {
  if (boleh && aktifOlehPengguna && !sudahOtomatis) { sudahOtomatis = true; void buka() }
}, { immediate: true })

const pilihPercakapan = async (id: string) => {
  pilihan.value = id
  memuatPesan.value = true
  try {
    await aksi(() => domi.bukaPercakapan(id))
  } finally {
    memuatPesan.value = false
  }
}
const lebihLama = async () => {
  memuatPesan.value = true
  try {
    await aksi(() => domi.muatLebihLama())
  } finally {
    memuatPesan.value = false
  }
}
const muatDaftarLagi = () => aksi(() => domi.muatDaftarLagi(props.user))
const tutupPanel = () => { domi.tutupPanel(); pilihan.value = null }
const adaDaftar = computed(() => domi.daftar.value.length > 0)
watch(() => domi.panel.value, (p) => { if (!p) pilihan.value = null })
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('domi.ket') }}</p>
    <CashflowPanelTab ranah="akun" :memuat="memuat" :galat="galat" :pesan-galat="pesanGalat" :ada-data="domi.sudahDibuka.value">
      <div v-if="!domi.sudahDibuka.value" class="flex flex-col items-start gap-3 rounded-xl border border-dashed border-[color:var(--ca-border)] px-4 py-5 text-sm text-[var(--ca-muted)] sm:flex-row sm:items-center">
        <Icon name="lucide:message-circle" class="h-5 w-5 shrink-0 text-[var(--ca-subtle)]" aria-hidden="true" />
        <div class="flex-1 space-y-1">
          <p class="text-[var(--ca-text)]">{{ domi.dibuang.value ? tcf('domi.panelTutup') : tcf('domi.ketBuka') }}</p>
        </div>
        <button type="button" class="ca-btn-secondary !px-4 !py-2 text-sm" :disabled="memuat" @click="buka">
          {{ memuat ? tcf('domi.membuka') : tcf('domi.buka') }}
        </button>
      </div>

      <div v-else class="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <CashflowDomiDaftar
          :class="{ 'hidden lg:block': pilihan }"
          :baris="domi.daftar.value" :total="domi.totalDaftar.value" :ada-lagi="!!domi.kursorBerikut.value"
          :aktif="pilihan" :format-waktu="formatWaktu" @pilih="pilihPercakapan" @lagi="muatDaftarLagi"
        />
        <div :class="{ 'hidden lg:block': !pilihan }">
          <CashflowDomiChat
            :panel="domi.panel.value" :foto="domi.foto.value" :memuat="memuatPesan"
            :kosong-daftar="!adaDaftar" @lebih-lama="lebihLama" @foto="domi.bukaFoto" @kembali="tutupPanel"
          />
        </div>
      </div>
    </CashflowPanelTab>
  </div>
</template>
