<script setup lang="ts">
const emit = defineEmits<{ verified: [] }>()
const { tc } = useConsoleI18n()
const { fetchMe } = useAdminAuth()
const kode = ref('')
const sibuk = ref(false)
const pesan = ref('')
const id = useId()
const verifikasi = async () => {
  if (sibuk.value || kode.value.length !== 6) return
  sibuk.value = true
  pesan.value = ''
  try {
    await $fetch('/api/admin/totp-sesi', { method: 'POST', body: { code: kode.value }, headers: { 'X-Console': '1', ...headerIkatan() }, retry: 0 })
    kode.value = ''
    if (await fetchMe()) emit('verified')
    else pesan.value = tc('perangkat.gagal')
  } catch (err) {
    pulihkanIkatan(err)
    const g = galatDari(err)
    pesan.value = g.kode === 'TOTP_INVALID' ? tc('keamanan.kodeSalah') : (g.pesan || tc('perangkat.gagal'))
    kode.value = ''
  } finally { sibuk.value = false }
}
</script>

<template>
  <form class="mt-4 max-w-md space-y-3 rounded-xl border border-[color:var(--ca-border)] bg-[var(--ca-panel-bg)] p-4" @submit.prevent="verifikasi">
    <p class="text-sm text-[var(--ca-muted)]">{{ tc('perangkat.verifikasiDesc') }}</p>
    <label :for="id" class="ca-field-label">{{ tc('keamanan.kodeLabel') }}</label>
    <input
:id="id" :value="kode" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}"
      class="ca-field-control max-w-xs text-center font-mono text-lg tracking-[0.4em]" :disabled="sibuk" required
      :aria-invalid="!!pesan" :aria-describedby="pesan ? `${id}-galat` : undefined"
      @input="kode = ($event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6); ($event.target as HTMLInputElement).value = kode">
    <p v-if="pesan" :id="`${id}-galat`" role="alert" class="text-sm text-[var(--ca-danger-text)]">{{ pesan }}</p>
    <button type="submit" class="ca-btn-primary" :disabled="sibuk || kode.length !== 6">{{ sibuk ? tc('common.processing') : tc('perangkat.verifikasi') }}</button>
  </form>
</template>
