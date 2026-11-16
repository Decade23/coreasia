<script setup lang="ts">
/**
 * Sub-navigasi modul CashFlow. Sidebar console adalah array datar tanpa
 * seksi; satu item "CashFlow" di sana, dan navigasi bagian ada di sini —
 * supaya sidebar tidak jadi 15 item begitu produk kedua masuk.
 *
 * Bentuknya tab berkelompok: baris atas lima pintu (utils/cashflow/navigasi),
 * baris bawah halaman di dalam pintu yang sedang aktif. Pintu berisi satu
 * halaman (Ringkasan) tidak punya baris bawah. Di layar sempit kedua baris
 * bergulir ke samping, tidak melipat. Keduanya tautan biasa di dalam <nav>,
 * bukan role=tab: Tab berpindah seperti tautan lain, dan panah kiri/kanan,
 * Home, End memindahkan fokus di dalam satu baris.
 *
 * Palet (Cmd/Ctrl+K) dan pintasan pindah halaman (g p, g r, g a, g k) ikut
 * dipasang di sini karena komponen ini ada di setiap halaman modul: layout
 * console dipakai modul lain dan tidak disentuh.
 *
 * Tab Pengguna menuju daftarTerakhir, jadi ?seg/urut/arah/hal ikut kembali
 * seperti panah dan remah. `aksiDaftar` (OPT-IN, dari detail pengguna)
 * menggantikan NuxtLink untuk tab itu dan item Pengguna di palet: NuxtLink
 * selalu MENAMBAH entri, dan [daftar, detail, daftar] membuat Back membuka
 * detail beraudit itu lagi. Halaman lain tidak memberi prop ini.
 */
import { useResizeObserver } from '@vueuse/core'
import { diDalam, pintuUntuk, tepatDi, pintuTerlihat, type HalamanNav, type PintuNav } from '~/utils/cashflow/navigasi'

const props = defineProps<{ aksiDaftar?: () => void }>()
const { tcf } = useCashflowI18n()
const route = useRoute()
const router = useRouter()
const indeks = useCashflowIndeks()
const sesi = useCashflowSesi()
useCashflowTema()

/* `jalur` menandai yang aktif (tanpa query); tujuan klik Pengguna = daftarTerakhir. */
const tujuan = (h: HalamanNav) => (h.kunci === 'pengguna' ? indeks.daftarTerakhir.value : h.jalur)
const pintu = computed(() => pintuTerlihat(i => sesi.boleh(i as Parameters<typeof sesi.boleh>[0])))
const pintuAktif = computed(() => pintuUntuk(route.path))
const halamanBaris = computed(() => {
  const p = pintu.value.find(x => x.kunci === pintuAktif.value)
  return p && p.halaman.length > 1 ? p.halaman : []
})
/* Halaman persisnya = 'page'; rute bersarang di bawahnya (pengguna/<id>/dompet) = 'true'. */
const kini = (h: HalamanNav) => (tepatDi(route.path, h.jalur) ? 'page' : diDalam(route.path, h.jalur) ? 'true' : undefined)
const kiniPintu = (p: PintuNav) =>
  p.kunci !== pintuAktif.value ? undefined : p.halaman.length === 1 ? kini(p.halaman[0]!) : 'true'
const klikDaftar = (e: MouseEvent) => {
  if (!props.aksiDaftar || !klikBiasa(e)) return
  e.preventDefault()
  props.aksiDaftar()
}
/* Panah kiri/kanan, Home, End: fokus pindah di antara tautan satu baris. */
const panah = (e: KeyboardEvent) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || e.altKey || e.ctrlKey || e.metaKey) return
  const tautan = [...(e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('a')]
  const n = tautan.indexOf(document.activeElement as HTMLElement)
  if (n < 0) return
  e.preventDefault()
  const ke = e.key === 'Home' ? 0 : e.key === 'End' ? tautan.length - 1
    : (n + (e.key === 'ArrowRight' ? 1 : -1) + tautan.length) % tautan.length
  tautan[ke]?.focus()
}
/* Tautan aktif tetap terlihat di baris yang bergulir (layar sempit). */
const akar = ref<HTMLElement | null>(null)
const tampilkanAktif = () => {
  for (const el of akar.value?.querySelectorAll<HTMLElement>('[aria-current]') ?? []) {
    const wadah = el.closest('ul')
    if (!wadah || wadah.scrollWidth <= wadah.clientWidth) continue
    const k = el.getBoundingClientRect()
    const w = wadah.getBoundingClientRect()
    if (k.left < w.left + 8) wadah.scrollLeft -= w.left + 16 - k.left
    else if (k.right > w.right - 8) wadah.scrollLeft += k.right - w.right + 16
  }
}
/* Lebar deret baru pasti sesudah gaya dan hurufnya termuat, dan berubah saat
   layar diputar: diulang tiap ukuran navigasi berubah. */
useResizeObserver(akar, tampilkanAktif)
onMounted(() => { document.fonts?.ready.then(tampilkanAktif).catch(() => {}) })
watch(() => route.path, () => nextTick(tampilkanAktif))

const paletBuka = ref(false)
/* Daftar lewat aksiDaftar bila ada (lihat RIWAYAT di pengguna/[id].vue). */
const keDaftar = () => (props.aksiDaftar ? props.aksiDaftar() : navigateTo(indeks.daftarTerakhir.value))
useCashflowPintasan([
  { kunci: 'k', meta: true, aksi: () => { paletBuka.value = true } },
  // g p / g r / g a / g k — Pengguna, Ruang, Audit, Kasus.
  { kunci: 'p', awalan: 'g', aksi: () => { keDaftar() } },
  { kunci: 'r', awalan: 'g', aksi: () => { navigateTo('/console/cashflow/ruang') } },
  { kunci: 'a', awalan: 'g', aksi: () => { navigateTo('/console/cashflow/audit') } },
  { kunci: 'k', awalan: 'g', aksi: () => { navigateTo('/console/cashflow/kasus') } },
])
/* Label tombol mengikuti mesin: ⌘ di Apple, Ctrl di lainnya. Dibaca setelah
   terpasang supaya tidak ada selisih antara render awal dan hidrasi. */
const tombolMeta = ref('Ctrl')
onMounted(() => { if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) tombolMeta.value = '⌘' })
</script>

<template>
  <nav ref="akar" class="cf-nav" :aria-label="tcf('nav.menu')" data-uji="cf-nav">
    <div class="cf-nav-atas">
      <span class="cf-nav-merek">
        <svg viewBox="0 0 30 30" width="30" height="30" aria-hidden="true" focusable="false">
          <rect width="30" height="30" rx="8" fill="#10182F" />
          <g fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 21V9M7.5 12.5 11 9l3.5 3.5" stroke="#FFBE3D" />
            <path d="M19 9v12M15.5 17.5 19 21l3.5-3.5" stroke="#1BC49E" />
          </g>
        </svg>
        CashFlow
      </span>
      <ul class="cf-nav-pintu" data-uji="cf-nav-pintu" @keydown="panah">
        <li v-for="p in pintu" :key="p.kunci">
          <!-- href tetap ada: klik tengah / Cmd+klik membuka tab baru seperti biasa. -->
          <a
            v-if="p.halaman[0]!.kunci === 'pengguna' && aksiDaftar"
            :href="router.resolve(tujuan(p.halaman[0]!)).href" :aria-current="kiniPintu(p)" :data-pintu="p.kunci"
            @click="klikDaftar"
          >{{ tcf(`pintu.${p.kunci}`) }}</a>
          <NuxtLink v-else :to="tujuan(p.halaman[0]!)" :aria-current="kiniPintu(p)" :data-pintu="p.kunci">{{ tcf(`pintu.${p.kunci}`) }}</NuxtLink>
        </li>
      </ul>
      <button type="button" class="cf-nav-cari" :aria-label="tcf('palet.judul')" data-uji="cf-nav-cari" @click="paletBuka = true">
        <Icon name="lucide:search" class="h-4 w-4" aria-hidden="true" />
        <span class="cf-nav-cari-teks">{{ tcf('palet.tombol') }}</span>
        <kbd>{{ tombolMeta }} K</kbd>
      </button>
    </div>
    <ul v-if="halamanBaris.length" class="cf-nav-bawah" data-uji="cf-nav-halaman" @keydown="panah">
      <li v-for="h in halamanBaris" :key="h.kunci">
        <a
          v-if="h.kunci === 'pengguna' && aksiDaftar"
          :href="router.resolve(tujuan(h)).href" :aria-current="kini(h)" :data-halaman="h.kunci"
          @click="klikDaftar"
        >{{ tcf(`nav.${h.kunci}`) }}</a>
        <NuxtLink v-else :to="tujuan(h)" :aria-current="kini(h)" :data-halaman="h.kunci">{{ tcf(`nav.${h.kunci}`) }}</NuxtLink>
      </li>
    </ul>
  </nav>
  <CashflowPalet :show="paletBuka" :aksi-daftar="aksiDaftar" @close="paletBuka = false" />
</template>

<!-- Tidak scoped: NuxtLink dirender komponen lain. Semua aturan berawalan .cf-nav,
     dan warnanya token --cf-* dari assets/css/cashflow-tema.css. -->
<style>
.cf-nav {
  width: 100%;
  border: 1px solid var(--cf-garis);
  border-radius: var(--cf-r-kartu);
  background: var(--cf-kartu);
  box-shadow: var(--cf-bayang);
  font-size: 0.84375rem;
}
.cf-nav ul { margin: 0; list-style: none; }
.cf-nav-atas { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 8px 10px; }
.cf-nav-merek {
  display: inline-flex; align-items: center; gap: 10px; padding: 0 10px 0 6px;
  font-size: 0.9375rem; font-weight: 800; color: var(--cf-tinta); white-space: nowrap;
}
.cf-nav-merek svg { flex: none; border-radius: 8px; }
.cf-nav-pintu { display: flex; flex: 1 1 0; align-items: center; gap: 6px; min-width: 0; padding: 3px; overflow-x: auto; scrollbar-width: none; }
.cf-nav-pintu a {
  display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 14px;
  border-radius: 999px; font-weight: 700; color: var(--cf-tinta2); white-space: nowrap;
  transition: background-color 0.15s, color 0.15s;
}
.cf-nav-pintu a:hover { background: var(--cf-awan); color: var(--cf-tinta); }
.cf-nav-pintu a[aria-current] { background: var(--cf-inti); color: var(--cf-on-inti); }
.cf-nav-cari {
  display: inline-flex; align-items: center; gap: 8px; height: 40px; margin-left: auto; padding: 0 12px;
  border: 0; border-radius: 999px; background: var(--cf-awan); color: var(--cf-tinta2);
  font-weight: 600; white-space: nowrap; transition: color 0.15s;
}
.cf-nav-cari:hover { color: var(--cf-tinta); }
.cf-nav kbd {
  padding: 2px 6px; border: 1px solid var(--cf-garis); border-radius: 6px; background: var(--cf-kartu);
  color: var(--cf-tinta2); font: 600 0.6875rem ui-monospace, Menlo, monospace;
}
.cf-nav-bawah { display: flex; gap: 4px; padding: 0 14px; border-top: 1px solid var(--cf-garis); overflow-x: auto; scrollbar-width: none; }
.cf-nav-bawah::-webkit-scrollbar, .cf-nav-pintu::-webkit-scrollbar { display: none; }
.cf-nav-bawah a {
  display: inline-flex; align-items: center; min-height: 40px; padding: 2px 10px 0;
  border-bottom: 2px solid transparent; font-weight: 600; color: var(--cf-tinta2); white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;
}
.cf-nav-bawah a:hover { color: var(--cf-tinta); }
/* Tebal tetap 700 lewat bayangan teks, supaya lebar tab tidak berubah saat aktif. */
.cf-nav-bawah a[aria-current] { color: var(--cf-tinta); border-bottom-color: var(--cf-aksen); text-shadow: 0.02em 0 0 currentColor, -0.02em 0 0 currentColor; }
.cf-nav a:focus-visible, .cf-nav button:focus-visible {
  outline: 2px solid var(--cf-fokus); outline-offset: 1px;
}
.cf-nav-bawah a:focus-visible { outline-offset: -2px; border-radius: 8px; }

/* Layar sempit: merek dan cari di baris pertama, pintu jadi deret yang bergulir. */
@media (max-width: 767px) {
  .cf-nav-atas { padding: 8px; }
  .cf-nav-pintu { order: 3; flex: 0 0 100%; }
  .cf-nav-pintu a { background: var(--cf-awan); }
  .cf-nav-pintu a[aria-current] { background: var(--cf-inti); }
  .cf-nav-cari-teks, .cf-nav-cari kbd { display: none; }
  .cf-nav-cari { width: 40px; justify-content: center; padding: 0; }
  .cf-nav-bawah { padding: 0 8px; }
}
</style>
