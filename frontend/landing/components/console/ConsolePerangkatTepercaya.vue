<script setup lang="ts">
interface Perangkat { id: string; name: string; created_at: string; last_used_at: string; expires_at: string; current: boolean }
const { tc } = useConsoleI18n()
const { formatDateTime } = useConsoleDateTime()
const { user, fetchMe, logout } = useAdminAuth()
const api = useAdminApi()
const daftar = ref<Perangkat[]>([])
const memuat = ref(true)
const sibuk = ref(false)
const pesan = ref('')
const perluKode = ref(false)
const sasaran = ref<Perangkat | null>(null)
const muat = async () => {
  memuat.value = true
  pesan.value = ''
  try { daftar.value = (await api.get<Perangkat[]>('/admin/auth/devices')).data }
  catch (err) { pesan.value = galatDari(err).pesan || tc('perangkat.gagal') }
  finally { memuat.value = false }
}
const percaya = async () => {
  if (sibuk.value) return
  pesan.value = ''
  sibuk.value = true
  try {
    await $fetch('/api/admin/perangkat', { method: 'POST', headers: { 'X-Console': '1', ...headerIkatan() }, retry: 0 })
    perluKode.value = false
    await fetchMe()
    await muat()
  } catch (err) {
    pulihkanIkatan(err)
    const g = galatDari(err)
    if (g.kode === 'MFA_STEP_UP_REQUIRED') perluKode.value = true
    else pesan.value = g.pesan || tc('perangkat.gagal')
  } finally { sibuk.value = false }
}
const cabut = async () => {
  if (!sasaran.value || sibuk.value) return
  const target = sasaran.value
  sibuk.value = true
  pesan.value = ''
  try {
    // Keluar mencabut perangkat saat ini serta membersihkan sesi CashFlow.
    if (target.current) {
      if (!(await logout())) pesan.value = tc('perangkat.gagal')
    } else {
      await api.del(`/admin/auth/devices/${target.id}`)
      await muat()
    }
    sasaran.value = null
  } catch (err) { pesan.value = galatDari(err).pesan || tc('perangkat.gagal') }
  finally { sibuk.value = false }
}
onMounted(muat)
</script>

<template>
  <section class="ca-card-soft mt-6 p-5 sm:p-6" aria-labelledby="perangkat-title">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="max-w-2xl">
        <h2 id="perangkat-title" class="text-base font-semibold text-[var(--ca-text)]">{{ tc('perangkat.title') }}</h2>
        <p class="mt-2 text-sm leading-relaxed text-[var(--ca-muted)]">{{ tc('perangkat.description') }}</p>
      </div>
      <button v-if="user?.totp_enabled && !user?.trusted_device_id && !perluKode" type="button" class="ca-btn-primary" :disabled="sibuk || memuat" @click="percaya">{{ tc('perangkat.percaya') }}</button>
      <span v-else-if="user?.trusted_device_id" class="ca-pill-emerald rounded-full px-3 py-1.5 text-xs">{{ tc('perangkat.dipercaya') }}</span>
    </div>
    <p v-if="!user?.totp_enabled" class="mt-3 text-sm text-[var(--ca-muted)]">{{ tc('perangkat.perluTotp') }}</p>
    <ConsoleTotpSesi v-if="perluKode" @verified="percaya" />
    <p v-if="pesan" role="alert" class="mt-4 text-sm text-[var(--ca-danger-text)]">{{ pesan }}</p>
    <p v-if="memuat" class="mt-5 text-sm text-[var(--ca-muted)]">{{ tc('common.loading') }}</p>
    <button v-else-if="pesan && !daftar.length" type="button" class="ca-btn-secondary mt-4" @click="muat">{{ tc('perangkat.cobaLagi') }}</button>
    <p v-else-if="!daftar.length" class="mt-5 text-sm text-[var(--ca-muted)]">{{ tc('perangkat.kosong') }}</p>
    <ul v-else class="mt-5 divide-y divide-[color:var(--ca-border)]">
      <li v-for="p in daftar" :key="p.id" class="flex flex-wrap items-start justify-between gap-4 py-4">
        <div class="min-w-0">
          <p class="flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--ca-text)]"><Icon name="lucide:monitor-smartphone" class="h-4 w-4" />{{ p.name }}<span v-if="p.current" class="ca-pill-emerald rounded-full px-2 py-0.5 text-xs">{{ tc('perangkat.ini') }}</span></p>
          <p class="mt-2 text-xs text-[var(--ca-muted)]">{{ tc('perangkat.terakhir', { waktu: formatDateTime(p.last_used_at) }) }}</p>
          <p class="mt-1 text-xs text-[var(--ca-muted)]">{{ tc('perangkat.sampai', { waktu: formatDateTime(p.expires_at) }) }}</p>
        </div>
        <button type="button" class="ca-btn-secondary !px-3 !py-2 text-xs" :disabled="sibuk" :aria-label="`${tc('perangkat.cabut')} ${p.name}`" @click="sasaran = p">{{ tc('perangkat.cabut') }}</button>
      </li>
    </ul>
    <ConsoleModal :show="!!sasaran" :title="tc('perangkat.cabutTitle')" size="sm" @close="sasaran = null">
      <p class="text-sm text-[var(--ca-muted)]">{{ tc('perangkat.cabutDesc', { nama: sasaran?.name || '' }) }}</p>
      <div class="mt-6 flex justify-end gap-3">
        <button type="button" class="ca-btn-secondary" :disabled="sibuk" @click="sasaran = null">{{ tc('common.cancel') }}</button>
        <button type="button" class="ca-btn-danger" :disabled="sibuk" @click="cabut">{{ sibuk ? tc('common.processing') : tc('perangkat.cabut') }}</button>
      </div>
    </ConsoleModal>
  </section>
</template>
