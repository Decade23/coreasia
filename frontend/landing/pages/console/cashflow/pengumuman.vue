<script setup lang="ts">
/** Pengumuman ke semua pengguna aplikasi. Buat/hentikan beraudit di server. */
definePageMeta({ layout: 'console', middleware: ['console', 'cashflow-admin'] })
import type { PengumumanDTO } from '~/composables/cashflow/useCashflowAdmin'
import { tanggalPendek } from '~/adapters/cashflow'
const { tcf } = useCashflowI18n()
const api = useCashflowAdmin()
const memuat = ref(true); const galat = ref(''); const rows = ref<PengumumanDTO[]>([])
const bukaForm = ref(false)
const f = reactive({ judul: '', isi: '', level: 'info', mulai: new Date().toISOString().slice(0, 16), sampai: '', alasan: '' })

const muat = async () => {
  memuat.value = true; galat.value = ''
  try { rows.value = await api.daftarPengumuman() }
  catch (e: any) {
    galat.value = e?.jenis === 'bukan-admin' ? tcf('umum.bukanAdmin') : (e?.message ?? tcf('umum.gagal'))
    if (e?.jenis === 'totp') navigateTo({ path: '/console/cashflow/masuk', query: { sebab: 'totp', ke: '/console/cashflow/pengumuman' } })
  } finally { memuat.value = false }
}
onMounted(muat)

const buat = async () => {
  galat.value = ''
  if (!f.judul.trim() || !f.isi.trim() || f.alasan.trim().length < 5) { galat.value = tcf('alasan.pendek'); return }
  try {
    await api.buatPengumuman(f.judul.trim(), f.isi.trim(), f.level, new Date(f.mulai).toISOString(), f.sampai ? new Date(f.sampai).toISOString() : null, f.alasan.trim())
    bukaForm.value = false; Object.assign(f, { judul: '', isi: '', alasan: '' }); await muat()
  } catch (e: any) { galat.value = e?.message ?? tcf('umum.gagal') }
}
const hentikan = async (id: string) => {
  const a = window.prompt(tcf('sakelar.alasanUbah'))
  if (!a || a.trim().length < 5) return
  try { await api.hentikanPengumuman(id, a.trim()); await muat() } catch (e: any) { galat.value = e?.message ?? tcf('umum.gagal') }
}
const aktif = (p: PengumumanDTO) => !p.sampai || new Date(p.sampai).getTime() > Date.now()
</script>

<template>
  <div class="space-y-6">
    <ConsolePageHeader :title="tcf('pengumuman.judul')" kicker="CashFlow">
      <template #meta><CashflowNav /></template>
      <template #actions><button type="button" class="ca-btn-primary" @click="bukaForm = true">{{ tcf('pengumuman.buat') }}</button></template>
    </ConsolePageHeader>
    <p class="text-sm text-[var(--ca-muted)]">{{ tcf('pengumuman.ket') }}</p>
    <p v-if="galat" class="text-sm text-rose-600">{{ galat }}</p>

    <ConsoleModal :show="bukaForm" :title="tcf('pengumuman.buat')" @close="bukaForm = false">
      <form class="space-y-3" @submit.prevent="buat">
        <input v-model="f.judul" class="ca-input w-full" :placeholder="tcf('pengumuman.judulKolom')" required />
        <textarea v-model="f.isi" rows="4" class="ca-input w-full" :placeholder="tcf('pengumuman.isi')" required />
        <div class="grid gap-3 sm:grid-cols-3">
          <select v-model="f.level" class="ca-input"><option value="info">info</option><option value="peringatan">peringatan</option><option value="penting">penting</option></select>
          <input v-model="f.mulai" type="datetime-local" class="ca-input" />
          <input v-model="f.sampai" type="datetime-local" class="ca-input" />
        </div>
        <input v-model="f.alasan" class="ca-input w-full" :placeholder="tcf('sakelar.alasanUbah')" required />
        <div class="flex justify-end gap-2"><button type="button" class="ca-btn-secondary" @click="bukaForm = false">{{ tcf('umum.batal') }}</button><button type="submit" class="ca-btn-primary">{{ tcf('umum.simpan') }}</button></div>
      </form>
    </ConsoleModal>

    <p v-if="memuat" class="text-sm text-[var(--ca-muted)]">{{ tcf('umum.memuat') }}</p>
    <div v-else class="ca-console-dialog overflow-x-auto">
      <CashflowKeadaanKosong v-if="!rows.length" class="m-5" :pesan="tcf('umum.kosong')" icon="lucide:megaphone" />
      <table v-else class="w-full text-sm">
        <thead><tr class="text-left text-xs uppercase tracking-wide text-[var(--ca-muted)]">
          <th class="px-4 py-2">{{ tcf('pengumuman.judulKolom') }}</th><th class="px-4 py-2">{{ tcf('pengumuman.level') }}</th><th class="px-4 py-2">{{ tcf('pengumuman.mulai') }}</th><th class="px-4 py-2">{{ tcf('pengumuman.sampai') }}</th><th class="px-4 py-2"></th>
        </tr></thead>
        <tbody>
          <tr v-for="p in rows" :key="p.id" class="border-t border-[color:var(--ca-border)] text-[var(--ca-text)]">
            <td class="px-4 py-1.5"><div class="font-semibold">{{ p.judul }}</div><div class="text-xs text-[var(--ca-muted)]">{{ p.isi }}</div></td>
            <td class="px-4 py-1.5">{{ p.level }}</td><td class="px-4 py-1.5 whitespace-nowrap">{{ tanggalPendek(p.mulai) }}</td><td class="px-4 py-1.5 whitespace-nowrap">{{ tanggalPendek(p.sampai) }}</td>
            <td class="px-4 py-1.5 text-right"><button v-if="aktif(p)" type="button" class="ca-btn-secondary text-xs" @click="hentikan(p.id)">{{ tcf('pengumuman.hentikan') }}</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
