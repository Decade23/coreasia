<script setup lang="ts">
/**
 * Tab Domi AI: daftar percakapan dan panel chat (T3, kasus anak {teks, foto}).
 * Aktivasi pengguna (klik tab, Enter, angka pintasan) membuka otomatis, satu
 * klik tanpa dialog. Dibuka lewat URL, refresh, atau Back: tombol "Buka"
 * dulu (spek aktivasi Fase 3, sama dengan tab Perangkat dan Kabar). Tidak ada
 * tombol tulis, simpan, atau hapus di sini.
 *
 * TATA LETAK. Sesudah dibuka, daftar dan isi hidup di satu bingkai setinggi
 * layar di bawah bilah atas console. Masing-masing bergulir sendiri, jadi
 * riwayat sepanjang apa pun tidak memanjangkan halaman. Bingkai digulir masuk
 * layar sekali saat dibuka dan saat percakapan dipilih (ponsel: isi
 * menggantikan daftar, tombol kembali di kepala isi).
 *
 * SEGARKAN. Tombol di bilah bingkai memuat ulang daftar dan isi yang dibuka.
 * Jendela kembali dilihat (fokus atau tab terlihat) hanya memuat daftar,
 * paling sering sekali per 30 detik. Aturan audit dan anak yang habis ada di
 * useCashflowDomi.
 */
const props = defineProps<{ user: string }>()
const { tcf, formatWaktu, formatJam } = useCashflowI18n()
const kasus = useCashflowKasus()
const domi = useCashflowDomi()
const route = useRoute()
const aktivasiTab = useCashflowAktivasiTab()
const { galat, pesanGalat, memuat, muat, aksi } = useCashflowMuat()
const memuatPesan = ref(false)
const memuatDaftar = ref(false)
const pilihan = ref<string | null>(null)
/* Info admin di bawah jawaban: pilihan bertahan selama sesi console, lintas percakapan dan tab. */
const infoTampil = useState<boolean>('cf_domi_info', () => true)
const bingkai = ref<HTMLElement | null>(null)
const adaDaftar = computed(() => domi.daftar.value.length > 0)

domi.pasangSubjek(props.user)
onBeforeUnmount(() => domi.buangSekarang())
const aktifOlehPengguna = aktivasiTab.ambil(route.path)
const bisaBuka = computed(() => !!kasus.kasus.value && !domi.sudahDibuka.value)

/** Bingkai utuh di layar, 1rem di bawah bilah atas (jendela digulir seperlunya).
 *  Dihitung sendiri, bukan scrollIntoView: html memasang scroll-padding-top
 *  untuk header situs publik, dan itu menggeser hasil scrollIntoView. */
const SELA = 16
const masukLayar = async () => {
  await nextTick()
  const el = bingkai.value
  if (!el || !adaDaftar.value) return
  const k = el.getBoundingClientRect()
  const atas = (document.querySelector('.ca-console-topbar')?.getBoundingClientRect().bottom ?? 72) + SELA
  const bawah = window.innerHeight - SELA
  const geser = k.top < atas ? k.top - atas : k.bottom > bawah ? Math.min(k.top - atas, k.bottom - bawah) : 0
  if (geser) window.scrollBy({ top: geser })
}
const buka = async () => {
  await muat(() => domi.buka(props.user))
  if (domi.sudahDibuka.value) await masukLayar()
}
/* Aktivasi tab oleh pengguna: tunggu kasus induk siap, lalu buka sekali. */
let sudahOtomatis = false
watch(bisaBuka, (boleh) => {
  if (boleh && aktifOlehPengguna && !sudahOtomatis) { sudahOtomatis = true; void buka() }
}, { immediate: true })

const pilihPercakapan = async (id: string) => {
  pilihan.value = id
  void masukLayar()
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
const muatDaftarLagi = async () => {
  memuatDaftar.value = true
  try {
    await aksi(() => domi.muatDaftarLagi(props.user))
  } finally {
    memuatDaftar.value = false
  }
}
const segarkan = (hanyaIsi = false) => aksi(async () => { await domi.segarkan(props.user, { hanyaIsi }) })
const tutupPanel = () => { domi.tutupPanel(); pilihan.value = null }
watch(() => domi.panel.value, (p) => { if (!p) pilihan.value = null })
const labelDimuat = computed(() => (domi.terakhirMuat.value ? tcf('domi.dimuatPada')(formatJam(new Date(domi.terakhirMuat.value))) : ''))

/* Jendela kembali dilihat: daftar saja, paling sering sekali per 30 detik. */
const kembaliDilihat = () => {
  if (document.visibilityState !== 'visible' || !domi.segarOtomatisJatuhTempo()) return
  void domi.segarkan(props.user, { otomatis: true })
}
onMounted(() => {
  window.addEventListener('focus', kembaliDilihat)
  document.addEventListener('visibilitychange', kembaliDilihat)
})
onBeforeUnmount(() => {
  window.removeEventListener('focus', kembaliDilihat)
  document.removeEventListener('visibilitychange', kembaliDilihat)
})
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('domi.ket') }}</p>
    <CashflowPanelTab ranah="akun" :memuat="memuat" :galat="galat" :pesan-galat="pesanGalat" :ada-data="domi.sudahDibuka.value">
      <div v-if="!domi.sudahDibuka.value" class="flex flex-col items-start gap-3 rounded-xl border border-dashed border-[color:var(--ca-border)] px-4 py-5 text-sm text-[var(--ca-muted)] sm:flex-row sm:items-center" :data-uji="domi.dibuang.value ? 'domi-habis' : 'domi-belum'">
        <Icon :name="domi.dibuang.value ? 'lucide:timer-off' : 'lucide:message-circle'" class="h-5 w-5 shrink-0 text-[var(--ca-subtle)]" aria-hidden="true" />
        <div class="flex-1 space-y-1">
          <p class="text-[var(--ca-text)]" :role="domi.dibuang.value ? 'status' : undefined">{{ domi.dibuang.value ? tcf('domi.panelTutup') : tcf('domi.ketBuka') }}</p>
        </div>
        <button type="button" class="ca-btn-secondary !px-4 !py-2 text-sm" :disabled="memuat" @click="buka">
          {{ memuat ? tcf('domi.membuka') : domi.dibuang.value ? tcf('domi.bukaLagi') : tcf('domi.buka') }}
        </button>
      </div>

      <!-- Tanpa percakapan sama sekali: keadaan kosong biasa, bukan bingkai setinggi layar. -->
      <div v-else ref="bingkai" class="flex flex-col gap-2" :class="{ 'domi-bingkai': adaDaftar }" data-uji="domi-bingkai">
        <div class="flex shrink-0 flex-wrap items-center justify-end gap-x-2 gap-y-1">
          <span v-if="domi.galatSegar.value" class="mr-auto text-xs text-[var(--ca-danger-text)]" role="status">{{ tcf('domi.segarGagal') }}</span>
          <span class="text-xs text-[var(--ca-subtle)] tabular-nums" data-uji="domi-dimuat">{{ labelDimuat }}</span>
          <button
            v-if="adaDaftar"
            type="button" class="ca-btn-ghost inline-flex !h-9 items-center gap-1.5 !px-2.5 text-xs" data-uji="domi-info-lipat"
            :aria-pressed="infoTampil" :title="tcf('domi.infoAdmin')" @click="infoTampil = !infoTampil"
          >
            <Icon :name="infoTampil ? 'lucide:eye' : 'lucide:eye-off'" class="h-4 w-4" aria-hidden="true" />{{ tcf('domi.infoTombol') }}
          </button>
          <button
            type="button" class="ca-btn-secondary inline-flex !h-9 items-center gap-1.5 !px-3 !py-0 text-xs" data-uji="domi-segarkan"
            :disabled="domi.menyegarkan.value" :title="tcf('domi.segarKet')" @click="segarkan()"
          >
            <Icon name="lucide:refresh-cw" class="h-4 w-4" :class="domi.menyegarkan.value ? 'animate-spin' : ''" aria-hidden="true" />
            {{ domi.menyegarkan.value ? tcf('domi.menyegarkan') : tcf('domi.segarkan') }}
          </button>
        </div>
        <CashflowKeadaanKosong v-if="!adaDaftar" icon="lucide:message-circle" :pesan="tcf('domi.kosong')" />
        <div v-else class="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)] gap-3 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-4">
          <div class="min-h-0" :class="pilihan ? 'hidden lg:block' : ''">
            <CashflowDomiDaftar
              :baris="domi.daftar.value" :total="domi.totalDaftar.value" :ada-lagi="!!domi.kursorBerikut.value" :memuat-lagi="memuatDaftar"
              :aktif="pilihan" :format-waktu="formatWaktu" @pilih="pilihPercakapan" @lagi="muatDaftarLagi"
            />
          </div>
          <div class="min-h-0 min-w-0" :class="pilihan ? '' : 'hidden lg:block'">
            <CashflowDomiChat
              :panel="domi.panel.value" :foto="domi.foto.value" :memuat="memuatPesan" :pilihan="pilihan"
              :info="infoTampil" :pesan-baru="domi.pesanBaru.value" :menyegarkan="domi.menyegarkan.value"
              :kosong-daftar="!adaDaftar" @lebih-lama="lebihLama" @foto="domi.bukaFoto" @kembali="tutupPanel" @segarkan="segarkan(true)"
            />
          </div>
        </div>
      </div>
    </CashflowPanelTab>
  </div>
</template>

<style scoped>
/* Setinggi layar di bawah bilah atas console (4.5rem) dengan sela 1rem di atas
   dan bawah. Halaman tidak bertambah panjang oleh isi daftar atau percakapan. */
.domi-bingkai {
  height: calc(100vh - 6.5rem);
  height: calc(100dvh - 6.5rem);
  min-height: 24rem;
}
</style>
