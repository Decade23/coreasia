<script setup lang="ts">
/**
 * Pengumuman ke semua pengguna aplikasi. Buat/hentikan beraudit di server.
 *
 * Jam mulai/sampai DIBACA sebagai WIB, apa pun zona laptop yang mengisinya:
 * <input type="datetime-local"> tidak membawa zona, dan new Date(nilai)
 * menafsirkannya dengan zona mesin — staf di luar WIB dulu menjadwalkan
 * pengumuman yang meleset beberapa jam. Nilai bawaannya pun dulu jam UTC.
 *
 * Jawaban server berkolom Inggris (title, starts_at, …) dan level-nya
 * info/warning/critical — dibaca lewat kePengumuman, tidak langsung.
 */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import {
  keDatetimeLokalWib, dariDatetimeLokalWib, kePengumuman, pengumumanBelumBerakhir, LEVEL_PENGUMUMAN,
  type Pengumuman, type LevelPengumuman,
} from '~/adapters/cashflow'
const { tcf, formatTanggal, formatJam } = useCashflowI18n()
const api = useCashflowAdmin()
const toast = useToast()
const { memuat, pesanGalat, muat, aksi } = useCashflowMuat({ awal: true })
const rows = ref<Pengumuman[]>([])
const bukaForm = ref(false)
const f = reactive<{ judul: string; isi: string; level: LevelPengumuman; mulai: string; sampai: string; alasan: string }>(
  { judul: '', isi: '', level: 'info', mulai: keDatetimeLokalWib(new Date()), sampai: '', alasan: '' })

const muatDaftar = () => muat(async () => { rows.value = (await api.daftarPengumuman()).map(kePengumuman) })
onMounted(muatDaftar)

const bukaBaru = () => {
  Object.assign(f, { judul: '', isi: '', level: 'info', mulai: keDatetimeLokalWib(new Date()), sampai: '', alasan: '' })
  bukaForm.value = true
}

const buat = async () => {
  if (!f.judul.trim() || !f.isi.trim()) { toast.error(tcf('pengumuman.wajibIsi')); return }
  if (f.alasan.trim().length < 8) { toast.error(tcf('alasan.pendek')); return }
  const mulai = dariDatetimeLokalWib(f.mulai)
  const sampai = f.sampai ? dariDatetimeLokalWib(f.sampai) : null
  if (!mulai || (f.sampai && !sampai)) { toast.error(tcf('pengumuman.tanggalRusak')); return }
  // Server menolaknya juga (22023), tapi kalimatnya lebih jelas tanpa perjalanan jaringan.
  if (sampai && new Date(sampai).getTime() <= new Date(mulai).getTime()) { toast.error(tcf('pengumuman.sampaiSebelumMulai')); return }
  const ok = await aksi(async () => {
    await api.buatPengumuman(f.judul.trim(), f.isi.trim(), f.level, mulai, sampai, f.alasan.trim())
  }, { sukses: tcf('pengumuman.dibuat') })
  if (ok) { bukaForm.value = false; await muatDaftar() }
}

/* Menghentikan meminta alasan lewat modal, bukan window.prompt: prompt tidak
   ikut tema, tidak bisa menjelaskan akibatnya, dan diblokir di sebagian peramban. */
const dihentikan = ref<Pengumuman | null>(null)
const alasanHenti = ref('')
const mintaHentikan = (p: Pengumuman) => { dihentikan.value = p; alasanHenti.value = '' }
const hentikan = async () => {
  const p = dihentikan.value
  if (!p) return
  if (alasanHenti.value.trim().length < 8) { toast.error(tcf('alasan.pendek')); return }
  const ok = await aksi(() => api.hentikanPengumuman(p.id, alasanHenti.value.trim()), { sukses: tcf('pengumuman.dihentikan') })
  if (ok) { dihentikan.value = null; await muatDaftar() }
}
const waktu = (iso: string | null) => (iso ? `${formatTanggal(iso)} ${formatJam(iso)}` : '—')
const labelLevel = (level: string) => (tcf('pengumuman.levelOpsi') as Record<string, string>)[level] ?? level
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('pengumuman.judul')" kicker="CashFlow">
      <template #meta><CashflowNav /></template>
      <template #actions><button type="button" class="ca-btn-primary" @click="bukaBaru">{{ tcf('pengumuman.buat') }}</button></template>
    </ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('pengumuman.ket') }}</p>
    <p v-if="pesanGalat" class="text-sm ca-tone-danger">{{ pesanGalat }}</p>

    <ConsoleModal :show="bukaForm" :title="tcf('pengumuman.buat')" @close="bukaForm = false">
      <form class="space-y-3" @submit.prevent="buat">
        <input v-model="f.judul" class="ca-input w-full" :placeholder="tcf('pengumuman.judulKolom')" required />
        <textarea v-model="f.isi" rows="4" class="ca-input w-full" :placeholder="tcf('pengumuman.isi')" required />
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="block">
            <span class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('pengumuman.level') }}</span>
            <select v-model="f.level" class="ca-input mt-1 w-full"><option v-for="l in LEVEL_PENGUMUMAN" :key="l" :value="l">{{ labelLevel(l) }}</option></select>
          </label>
          <label class="block">
            <span class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('pengumuman.mulaiWib') }}</span>
            <input v-model="f.mulai" type="datetime-local" class="ca-input mt-1 w-full" required />
          </label>
          <label class="block">
            <span class="text-xs font-semibold uppercase tracking-wide text-[var(--ca-muted)]">{{ tcf('pengumuman.sampaiWib') }}</span>
            <input v-model="f.sampai" type="datetime-local" class="ca-input mt-1 w-full" />
          </label>
        </div>
        <input v-model="f.alasan" class="ca-input w-full" :placeholder="tcf('sakelar.alasanUbah')" required />
        <div class="flex justify-end gap-2"><button type="button" class="ca-btn-secondary" @click="bukaForm = false">{{ tcf('umum.batal') }}</button><button type="submit" class="ca-btn-primary">{{ tcf('umum.simpan') }}</button></div>
      </form>
    </ConsoleModal>

    <ConsoleModal :show="!!dihentikan" :title="tcf('pengumuman.hentikanJudul')" size="sm" @close="dihentikan = null">
      <form class="space-y-3" @submit.prevent="hentikan">
        <p class="text-sm text-[var(--ca-muted)]">{{ tcf('pengumuman.hentikanKet')(dihentikan?.judul ?? '') }}</p>
        <textarea v-model="alasanHenti" rows="3" class="ca-input w-full" :placeholder="tcf('pengumuman.alasanHentikan')" />
        <div class="flex justify-end gap-2">
          <button type="button" class="ca-btn-secondary" @click="dihentikan = null">{{ tcf('umum.batal') }}</button>
          <button type="submit" class="ca-btn-primary" :disabled="alasanHenti.trim().length < 8">{{ tcf('pengumuman.hentikan') }}</button>
        </div>
      </form>
    </ConsoleModal>

    <p v-if="memuat" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>
    <div v-else-if="!pesanGalat" class="ca-console-dialog overflow-x-auto">
      <CashflowKeadaanKosong v-if="!rows.length" class="m-5" :pesan="tcf('umum.kosong')" icon="lucide:megaphone" />
      <table v-else class="w-full text-sm">
        <thead><tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
          <th class="px-4 py-2">{{ tcf('pengumuman.judulKolom') }}</th><th class="px-4 py-2">{{ tcf('pengumuman.level') }}</th><th class="px-4 py-2">{{ tcf('pengumuman.mulaiWib') }}</th><th class="px-4 py-2">{{ tcf('pengumuman.sampai') }}</th><th class="px-4 py-2"></th>
        </tr></thead>
        <tbody>
          <tr v-for="p in rows" :key="p.id" class="border-t border-[color:var(--ca-border)] text-[var(--ca-text)]">
            <td class="px-4 py-1.5"><div class="font-semibold">{{ p.judul }}</div><div class="text-xs text-[var(--ca-muted)]">{{ p.isi }}</div></td>
            <td class="px-4 py-1.5">{{ labelLevel(p.level) }}</td><td class="px-4 py-1.5 whitespace-nowrap tabular-nums">{{ waktu(p.mulai) }}</td><td class="px-4 py-1.5 whitespace-nowrap tabular-nums">{{ waktu(p.sampai) }}</td>
            <td class="px-4 py-1.5 text-right"><button v-if="pengumumanBelumBerakhir(p)" type="button" class="ca-btn-secondary text-xs" @click="mintaHentikan(p)">{{ tcf('pengumuman.hentikan') }}</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
