<script setup lang="ts">
/**
 * Palet Cmd/Ctrl+K — versi KLIEN (Fase 0a).
 *
 * Tiga jenis masukan, semuanya dijawab di peramban tanpa RPC baru:
 * - nama halaman modul → pindah ke sana;
 * - UUID pengguna utuh yang ditempel → /console/cashflow/pengguna/<uuid>
 *   (halaman itu tetap meminta alasan sebelum data tampil);
 * - sebagian email TERSAMAR ('ded***', 'gmail') → dari useCashflowIndeks,
 *   yang hanya memegang bentuk tersamar. Email lengkap dan nama tidak bisa
 *   dicari di sini, dan itu disengaja: pencarian atas data utuh baru datang
 *   bersama admin_cari yang beraudit (Fase 1).
 *
 * Papan ketiknya mengikuti SearchSelect: ↑/↓ berputar, Enter memilih; Esc
 * ditangani ConsoleModal. Ditutup tanpa memilih (Esc, Batal/X, backdrop) →
 * fokus kembali ke elemen yang membukanya; ConsoleModal melepas isinya, jadi
 * tanpa ini fokus jatuh ke <body> dan pengguna papan ketik mulai dari atas.
 *
 * "Pengguna" menuju daftar dengan posisi terakhirnya (daftarTerakhir). Dari
 * detail pengguna, `aksiDaftar` (OPT-IN, diteruskan CashflowNav) dipakai
 * alih-alih navigateTo yang menambah entri; lihat RIWAYAT di pengguna/[id].vue.
 */
import { POLA_UUID } from '~/adapters/cashflow'

const props = defineProps<{ show: boolean; aksiDaftar?: () => void }>()
const emit = defineEmits<{ close: [] }>()
const { tcf } = useCashflowI18n()
const indeks = useCashflowIndeks()

interface Item { kunci: string; label: string; keterangan?: string; ikon: string; ke: string; grup: 'orang' | 'halaman' }

const HALAMAN = [
  { kunci: 'ringkasan', ke: '/console/cashflow', ikon: 'lucide:gauge' },
  { kunci: 'pengguna', ke: '/console/cashflow/pengguna', ikon: 'lucide:users' },
  { kunci: 'aktivitas', ke: '/console/cashflow/aktivitas', ikon: 'lucide:activity' },
  { kunci: 'ruang', ke: '/console/cashflow/ruang', ikon: 'lucide:layers' },
  { kunci: 'kesehatan', ke: '/console/cashflow/kesehatan', ikon: 'lucide:heart-pulse' },
  { kunci: 'sakelar', ke: '/console/cashflow/sakelar', ikon: 'lucide:toggle-right' },
  { kunci: 'pengumuman', ke: '/console/cashflow/pengumuman', ikon: 'lucide:megaphone' },
  { kunci: 'audit', ke: '/console/cashflow/audit', ikon: 'lucide:scroll-text' },
] as const

const q = ref('')
const sorot = ref(0)
const masukan = ref<HTMLInputElement | null>(null)
const memuatIndeks = ref(false)

const item = computed<Item[]>(() => {
  const teks = q.value.trim()
  const k = teks.toLowerCase()
  const hasil: Item[] = []
  if (POLA_UUID.test(teks)) {
    hasil.push({
      kunci: `uuid-${k}`, grup: 'orang', ikon: 'lucide:user-search',
      // Indeks lengkap tanpa UUID ini = hampir pasti bukan pengguna (id ruang,
      // transaksi). Tetap bisa dibuka; halamannya berhenti di "tidak ditemukan".
      label: tcf('palet.bukaPengguna'),
      keterangan: indeks.labelUntuk(k) ?? (indeks.lengkap.value ? `${tcf('palet.tidakDiDaftar')} · ${k.slice(0, 8)}` : k),
      ke: `/console/cashflow/pengguna/${k}`,
    })
  }
  for (const h of HALAMAN) {
    const label = tcf(`nav.${h.kunci}`) as string
    if (!k || label.toLowerCase().includes(k) || h.kunci.includes(k)) {
      const ke = h.kunci === 'pengguna' ? indeks.daftarTerakhir.value : h.ke
      hasil.push({ kunci: `hal-${h.kunci}`, grup: 'halaman', ikon: h.ikon, label, ke })
    }
  }
  if (k.length >= 2 && !POLA_UUID.test(teks)) {
    for (const e of indeks.cari(k)) {
      hasil.push({ kunci: `orang-${e.id}`, grup: 'orang', ikon: 'lucide:user', label: e.emailTersamar, keterangan: e.id.slice(0, 8), ke: `/console/cashflow/pengguna/${e.id}` })
    }
  }
  return hasil
})

let asalFokus: HTMLElement | null = null
let berpindah = false

watch(q, () => { sorot.value = 0 })
/* Daftar bisa lebih tinggi dari max-h-80 (8 halaman + 8 orang): tanpa ini
   ↓ memindahkan sorotan ke baris yang tidak terlihat. */
watch(sorot, async (n) => {
  await nextTick()
  const i = item.value[n]
  if (i) document.getElementById(`cf-palet-${i.kunci}`)?.scrollIntoView({ block: 'nearest' })
})
watch(() => props.show, async (buka) => {
  if (!buka) {
    // Memilih = pindah halaman; pemicunya ikut dilepas, jadi tidak dikembalikan.
    if (!berpindah && asalFokus?.isConnected) asalFokus.focus({ preventScroll: true })
    asalFokus = null
    berpindah = false
    return
  }
  const aktif = document.activeElement
  asalFokus = aktif instanceof HTMLElement && aktif !== document.body ? aktif : null
  q.value = ''
  sorot.value = 0
  await nextTick()
  masukan.value?.focus()
  // Indeks tersamar diisi tanpa alasan dan tanpa audit; gagal = palet tetap
  // bisa dipakai untuk halaman dan UUID.
  memuatIndeks.value = true
  indeks.muatBilaKosong().catch(() => {}).finally(() => { memuatIndeks.value = false })
})

const gerak = (langkah: number) => {
  const n = item.value.length
  if (!n) return
  sorot.value = (sorot.value + langkah + n) % n
}
const pilih = (i: Item | undefined) => {
  if (!i) return
  berpindah = true
  emit('close')
  if (i.kunci === 'hal-pengguna' && props.aksiDaftar) props.aksiDaftar()
  else navigateTo(i.ke)
}
</script>

<template>
  <ConsoleModal :show="show" :title="tcf('palet.judul')" size="lg" @close="emit('close')">
    <input
      ref="masukan"
      v-model="q"
      type="text"
      class="ca-input w-full"
      role="combobox"
      aria-autocomplete="list"
      :aria-expanded="item.length > 0"
      aria-controls="cf-palet-daftar"
      :aria-activedescendant="item[sorot] ? `cf-palet-${item[sorot]!.kunci}` : undefined"
      autocomplete="off"
      autocapitalize="none"
      autocorrect="off"
      spellcheck="false"
      data-1p-ignore="true"
      data-lpignore="true"
      :placeholder="tcf('palet.placeholder')"
      @keydown.down.prevent="gerak(1)"
      @keydown.up.prevent="gerak(-1)"
      @keydown.enter.prevent="pilih(item[sorot])"
    >
    <p class="mt-2 text-xs text-[var(--ca-subtle)]">{{ tcf('palet.ket') }}</p>

    <ul id="cf-palet-daftar" role="listbox" class="mt-3 max-h-80 space-y-0.5 overflow-y-auto">
      <!-- Sorotan wajib terlihat di atas latar dialog: panel-bg-strong sama
           dengan card-from di tema gelap, jadi baris terpilih tak terbedakan
           dan Enter membuka tujuan yang tak terlihat. -->
      <li
        v-for="(i, n) in item" :id="`cf-palet-${i.kunci}`" :key="i.kunci"
        role="option" :aria-selected="n === sorot"
        class="flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition"
        :class="n === sorot
          ? 'border-[color:var(--ca-gold-border)] bg-[var(--ca-gold-bg)] text-[var(--ca-text)]'
          : 'border-transparent text-[var(--ca-muted)]'"
        @mouseenter="sorot = n"
        @click="pilih(i)"
      >
        <Icon :name="i.ikon" class="h-4 w-4 shrink-0" :class="n === sorot ? 'text-[var(--ca-brand)]' : 'text-[var(--ca-subtle)]'" />
        <span class="truncate" :class="i.grup === 'orang' ? 'font-mono' : ''">{{ i.label }}</span>
        <span v-if="i.keterangan" class="ml-auto truncate font-mono text-xs text-[var(--ca-subtle)]">{{ i.keterangan }}</span>
      </li>
    </ul>
    <p v-if="!item.length" class="mt-3 text-sm text-[var(--ca-muted)]">
      {{ memuatIndeks ? tcf('palet.memuat') : tcf('palet.kosong') }}
    </p>
    <p class="mt-4 text-xs text-[var(--ca-subtle)]">{{ tcf('palet.petunjuk') }}</p>
  </ConsoleModal>
</template>
