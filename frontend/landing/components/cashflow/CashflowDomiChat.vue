<script setup lang="ts">
/**
 * Panel chat Domi: latar abu, gelembung pengguna navy di kanan, jawaban di
 * kolom sebelah avatar kecil, jam di bawah jawaban. Baca saja. Pesan terlama
 * di atas, "Muat pesan lebih lama" menambah halaman di atas.
 *
 * Panel setinggi bingkai tab: kepala (judul, jumlah pesan, keterangan audit)
 * tetap di atas, hanya bidang pesan yang bergulir. Percakapan dibuka di
 * pesan terbaru. Memuat pesan lebih lama menjaga pesan yang sedang dibaca di
 * tempatnya (penjangkaran gulir peramban dimatikan, posisinya dihitung di
 * sini). Pesan baru yang dimuat Segarkan ikut tampil bila pembaca sudah di
 * bawah. Tombol ke awal dan ke pesan terbaru muncul bila isinya lebih
 * panjang dari layar.
 *
 * Token warna hidup di sini: gelap memakai nilai malam navy aplikasi,
 * terang nilai putih aplikasi. Komponen di dalamnya hanya memakai var(--d-*).
 */
import type { PanelDomi } from '~/composables/cashflow/useCashflowDomi'
import type { FotoDomi } from '~/composables/cashflow/useCashflowDomi'

const props = withDefaults(defineProps<{
  panel: PanelDomi | null
  foto: ReadonlyMap<string, FotoDomi>
  memuat: boolean
  kosongDaftar: boolean
  /** Percakapan yang dipilih di daftar (bisa belum tiba isinya). */
  pilihan?: string | null
  /** Tampilkan baris info admin (kredit, rupiah, token, model). */
  info?: boolean
  /** Daftar menyebut percakapan ini sudah bertambah sejak isinya dimuat. */
  pesanBaru?: boolean
  menyegarkan?: boolean
}>(), { pilihan: null, info: true, pesanBaru: false, menyegarkan: false })
const emit = defineEmits<{ lebihLama: []; foto: [jalur: readonly string[], klik: string]; kembali: []; segarkan: [] }>()
const { tcf } = useCashflowI18n()
const judul = computed(() => props.panel?.percakapan.judul || tcf('domi.tanpaJudul'))
/* Klik percakapan lain: isi lama tetap tampil redup sampai isi baru tiba. */
const menunggu = computed(() => props.memuat && !!props.pilihan && props.panel?.percakapan.id !== props.pilihan)

const bidang = ref<HTMLElement | null>(null)
const posisi = reactive({ atas: 0, bawah: 0, panjang: false })
const AMBANG = 160
function ukur() {
  const el = bidang.value
  if (!el) return
  posisi.atas = el.scrollTop
  posisi.bawah = el.scrollHeight - el.clientHeight - el.scrollTop
  posisi.panjang = el.scrollHeight > el.clientHeight + AMBANG
}
/* Pembaca di pesan terbaru tetap di sana saat bidang menyempit (mis. tawaran
   pesan baru muncul di atasnya) dan saat pesan baru masuk. Hanya gulir oleh
   pembaca yang mengubahnya. */
let lekatBawah = true
const saatGulir = () => { ukur(); lekatBawah = posisi.bawah < 24 }
const keAwal = () => { bidang.value?.scrollTo({ top: 0 }); saatGulir() }
const keAkhir = () => { const el = bidang.value; if (el) { el.scrollTo({ top: el.scrollHeight }); saatGulir() } }

/* Pengamat jalan sebelum DOM berubah: ukuran lama dibaca di sini, posisi baru dipasang sesudah nextTick. */
watch(() => props.panel, (baru, lama) => {
  const el = bidang.value
  const dulu = el ? { tinggi: el.scrollHeight, atas: el.scrollTop, diBawah: lekatBawah } : null
  const ganti = !baru || !lama || baru.percakapan.id !== lama.percakapan.id
  const diAtas = !ganti && baru.pesan.length > lama.pesan.length && baru.pesan[0]?.id !== lama.pesan[0]?.id
  const diBawah = !ganti && baru.pesan.at(-1)?.id !== lama.pesan.at(-1)?.id
  void nextTick(() => {
    const e = bidang.value
    if (!e || !baru) return
    if (ganti) e.scrollTop = e.scrollHeight
    else if (diAtas && dulu) e.scrollTop = e.scrollHeight - (dulu.tinggi - dulu.atas)
    else if (diBawah && dulu?.diBawah) e.scrollTop = e.scrollHeight
    saatGulir()
  })
})
let amati: ResizeObserver | null = null
onMounted(() => {
  if (typeof ResizeObserver === 'undefined') return
  amati = new ResizeObserver(() => {
    const el = bidang.value
    if (el && lekatBawah) el.scrollTop = el.scrollHeight
    ukur()
  })
  watch(bidang, (el, lama) => { if (lama) amati?.unobserve(lama); if (el) amati?.observe(el) }, { immediate: true })
})
onBeforeUnmount(() => { amati?.disconnect(); amati = null })
</script>

<template>
  <div class="domi-chat flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[color:var(--ca-border)]">
    <div v-if="!panel" class="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-center text-sm text-[var(--ca-muted)]" :aria-busy="memuat || undefined">
      <button v-if="pilihan" type="button" class="ca-btn-ghost !h-11 self-start !px-2 lg:hidden" data-uji="domi-kembali" @click="emit('kembali')">
        <Icon name="lucide:arrow-left" class="h-5 w-5" aria-hidden="true" /><span class="ml-1">{{ tcf('domi.kembali') }}</span>
      </button>
      <span>{{ memuat ? tcf('umum.memuat') : kosongDaftar ? tcf('domi.kosong') : tcf('domi.pilih') }}</span>
    </div>
    <template v-else>
      <header class="flex shrink-0 items-center gap-2 border-b border-[color:var(--ca-border)] bg-[var(--ca-panel-bg-strong)] px-2 py-2 sm:px-3" data-uji="domi-kepala">
        <button type="button" class="ca-btn-ghost !h-11 !w-11 shrink-0 p-0 lg:hidden" data-uji="domi-kembali" :aria-label="tcf('domi.kembali')" @click="emit('kembali')">
          <Icon name="lucide:arrow-left" class="h-5 w-5" />
        </button>
        <span class="domi-avatar domi-avatar-besar shrink-0" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="h-5 w-5"><path d="M11 5l1.9 5.1L18 12l-5.1 1.9L11 19l-1.9-5.1L4 12l5.1-1.9z" fill="#FFBE3D" /><path d="M18.5 3v4M16.5 5h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" /></svg>
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-bold text-[var(--ca-text)]" :title="judul">{{ judul }}</p>
          <p class="line-clamp-2 text-xs text-[var(--ca-muted)]">
            <span class="tabular-nums">{{ tcf('domi.pesan')(panel.percakapan.jumlahPesan) }}</span>
            <template v-if="panel.adaLagi"> ({{ tcf('domi.dimuatSebagian')(panel.pesan.length) }})</template>
            · {{ tcf('domi.anakSesi') }}
          </p>
        </div>
      </header>
      <div v-if="pesanBaru" class="domi-baru flex shrink-0 items-center gap-2 border-b border-[color:var(--ca-border)] px-3 py-1.5 text-xs" role="status" data-uji="domi-pesan-baru">
        <Icon name="lucide:bell-dot" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span class="min-w-0 flex-1">{{ tcf('domi.pesanBaru') }}</span>
        <button type="button" class="ca-btn-secondary !px-2.5 !py-1 text-xs" :disabled="menyegarkan" @click="emit('segarkan')">{{ tcf('domi.tampilkanBaru') }}</button>
      </div>
      <div class="relative min-h-0 flex-1">
        <div ref="bidang" class="domi-bidang ca-scrollbar" :class="{ 'opacity-60': menunggu }" data-uji="domi-isi" :aria-busy="memuat || undefined" @scroll.passive="saatGulir">
          <div v-if="panel.adaLagi" class="flex justify-center pb-1">
            <button type="button" class="domi-lebih" :disabled="memuat" @click="emit('lebihLama')">
              {{ memuat ? tcf('umum.memuat') : tcf('domi.lebihLama') }}
            </button>
          </div>
          <template v-for="p in panel.pesan" :key="p.id">
            <div v-if="p.peran === 'user'" class="flex flex-col items-end gap-1.5" :data-pesan="p.id">
            <div v-if="p.jalur.length" class="flex flex-wrap justify-end gap-1.5" :class="p.jalur.length > 1 ? 'max-w-[92%]' : ''">
              <CashflowDomiFoto
                v-for="j in p.jalur" :key="j" :jalur="j" :foto="foto.get(j)"
                :lebar="p.jalur.length === 1 ? 148 : 72" :tinggi="p.jalur.length === 1 ? 148 : 88" :radius="p.jalur.length === 1 ? 10 : 12"
                @buka="emit('foto', p.jalur, j)"
              />
            </div>
            <span v-else-if="p.gambar" class="domi-chip-gambar">
              <Icon name="lucide:image" class="h-3.5 w-3.5" aria-hidden="true" />{{ tcf('domi.gambarLabel') }}
            </span>
            <div v-if="p.teks" class="domi-pengguna">{{ p.teks }}</div>
          </div>
          <CashflowDomiJawaban v-else :pesan="p" :foto="foto" :info="info" :data-pesan="p.id" @foto="(j, k) => emit('foto', j, k)" />
          </template>
        </div>
        <div v-if="posisi.panjang" class="domi-lompat">
          <button v-if="posisi.atas > AMBANG" type="button" class="domi-lompat-tombol" data-uji="domi-ke-awal" :aria-label="tcf('domi.keAwalKet')" :title="tcf('domi.keAwalKet')" @click="keAwal">
            <Icon name="lucide:arrow-up-to-line" class="h-4 w-4 shrink-0" aria-hidden="true" /><span class="hidden sm:inline">{{ tcf('domi.keAwal') }}</span>
          </button>
          <button v-if="posisi.bawah > AMBANG" type="button" class="domi-lompat-tombol" data-uji="domi-ke-akhir" :aria-label="tcf('domi.keAkhirKet')" :title="tcf('domi.keAkhirKet')" @click="keAkhir">
            <Icon name="lucide:arrow-down-to-line" class="h-4 w-4 shrink-0" aria-hidden="true" /><span class="hidden sm:inline">{{ tcf('domi.keAkhir') }}</span>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.domi-chat {
  --d-latar: #0a0f1f; --d-gelembung: #19233f; --d-kertas: #3d3318; --d-garis: rgba(255, 240, 210, 0.3); --d-label: #ffbe3d;
  --d-avatar: #1f2a4a; --d-user-bg: #e9eef8; --d-user-tx: #1a2445; --d-txt: #eef2fa; --d-txt2: #b3bdd2; --d-txt3: #8c97ae;
  --d-mint: #1bc49e; --d-rose: #ff8fa6; --d-amber: #ffbe3d; --d-sky: #4cc4f5; --d-iris: #9b93f2;
  --d-line: rgba(160, 178, 220, 0.14); --d-line2: rgba(160, 178, 220, 0.08); --d-bayang: rgba(0, 0, 0, 0.35);
  background: var(--d-latar);
  color: var(--d-txt);
}
html[data-theme='light'] .domi-chat {
  --d-latar: #eef1f6; --d-gelembung: #ffffff; --d-kertas: #fff8e8; --d-garis: rgba(14, 23, 48, 0.3); --d-label: #7a5500;
  --d-avatar: #1a2445; --d-user-bg: #1a2445; --d-user-tx: #ffffff; --d-txt: #0e1730; --d-txt2: #45506a; --d-txt3: #646e85;
  --d-mint: #0a7a5c; --d-rose: #c62348; --d-amber: #7a5500; --d-sky: #0a6f9e; --d-iris: #4a41c8;
  --d-line: rgba(14, 23, 48, 0.1); --d-line2: rgba(14, 23, 48, 0.06); --d-bayang: rgba(14, 23, 48, 0.14);
}
/* Penjangkaran gulir peramban dimatikan: posisi sesudah muat lebih lama dihitung di skrip, jangan dua kali. */
.domi-bidang {
  position: absolute; inset: 0; display: flex; flex-direction: column; gap: 10px; padding: 14px 12px 56px;
  overflow-y: auto; overflow-x: hidden; overflow-anchor: none; overscroll-behavior-y: contain;
}
/* Kolom selebar layar ponsel: kertas, grafik, dan tabel berproporsi seperti di aplikasi. */
.domi-bidang > * { width: 100%; max-width: 480px; margin-inline: auto; }
.domi-pengguna {
  max-width: 86%; padding: 9px 14px; font-size: 14px; font-weight: 600; line-height: 19px;
  border-radius: 20px 20px 6px 20px; background: var(--d-user-bg); color: var(--d-user-tx);
  white-space: pre-wrap; overflow-wrap: anywhere;
}
.domi-chip-gambar {
  display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 11px; border-radius: 999px;
  background: var(--d-gelembung); border: 1px solid var(--d-line); font-size: 12px; font-weight: 700; color: var(--d-txt2);
}
.domi-lebih {
  height: 44px; padding: 0 14px; border-radius: 12px; font-size: 13px; font-weight: 700;
  background: var(--d-gelembung); color: var(--d-txt2); border: 1px solid var(--d-line);
}
.domi-lebih:disabled { opacity: 0.6; }
.domi-lompat { position: absolute; right: 12px; bottom: 12px; display: flex; flex-direction: column; gap: 6px; align-items: flex-end; }
.domi-lompat-tombol {
  display: inline-flex; align-items: center; gap: 6px; min-height: 36px; min-width: 36px; justify-content: center; padding: 0 12px;
  border-radius: 999px; font-size: 12.5px; font-weight: 700; background: var(--d-gelembung); color: var(--d-txt);
  border: 1px solid var(--d-line); box-shadow: 0 4px 14px var(--d-bayang);
}
.domi-lompat-tombol:focus-visible { outline: 2px solid var(--d-sky); outline-offset: 2px; }
.domi-baru { background: color-mix(in srgb, var(--d-sky) 14%, var(--d-latar)); color: var(--d-txt); }
.domi-avatar { display: inline-flex; align-items: center; justify-content: center; color: #fff; background: var(--d-avatar); }
.domi-avatar-besar { width: 40px; height: 40px; border-radius: 20px; }
</style>
