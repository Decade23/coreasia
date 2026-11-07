<script setup lang="ts">
import type { LeadkuSetupRequest, LeadkuSummary } from '~/adapters/leadkuMobile'

const props = defineProps<{ channel: LeadkuSummary['channel'] }>()
const api = useAdminApi()
const toast = useToast()
const requests = ref<LeadkuSetupRequest[] | null>(null)
const loading = ref(false)
const failure = ref(false)
const date = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' })
const topicLabels: Record<LeadkuSetupRequest['topic'], string> = { contacts: 'Kontak', pipeline: 'Pipeline', tasks: 'Tugas', setup: 'Setup' }
const channelLabels: Record<LeadkuSetupRequest['channel'], string> = { email: 'Email', whatsapp: 'WhatsApp' }

async function load() {
  if (loading.value) return
  loading.value = true
  failure.value = false
  requests.value = null
  try {
    const result = await api.get<LeadkuSetupRequest[]>('/admin/leadku/setup-requests', { channel: props.channel })
    requests.value = result.data
  } catch {
    failure.value = true
  } finally {
    loading.value = false
  }
}

async function copyContact(contact: string) {
  try {
    await navigator.clipboard.writeText(contact)
    toast.success('Kontak disalin.')
  } catch {
    toast.error('Kontak belum dapat disalin.')
  }
}
</script>

<template>
  <section aria-labelledby="leadku-setup-heading" class="ca-console-dialog min-w-0 space-y-4 p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 id="leadku-setup-heading" class="font-display text-lg font-bold">Permintaan bantuan setup</h2>
      <button type="button" class="ca-btn-secondary" :disabled="loading" @click="load">
        {{ requests === null ? 'Lihat permintaan' : 'Muat ulang permintaan' }}
      </button>
    </div>
    <p v-if="loading" role="status" class="text-sm text-[var(--ca-muted)]">Memuat permintaan bantuan…</p>
    <p v-else-if="failure" role="alert" class="text-sm ca-tone-danger">Permintaan bantuan belum dapat dimuat.</p>
    <template v-else-if="requests">
      <ul v-if="requests.length" class="grid gap-3 lg:grid-cols-2">
        <li v-for="request in requests" :key="request.id" class="flex min-w-0 flex-wrap items-start justify-between gap-3 rounded-xl border border-[var(--ca-border)] p-3">
          <div class="min-w-0 flex-1 basis-40">
            <p class="text-xs font-semibold text-[var(--ca-muted)]">{{ topicLabels[request.topic] }} · {{ channelLabels[request.channel] }}</p>
            <p class="mt-1 font-medium [overflow-wrap:anywhere]">{{ request.contact }}</p>
            <p class="mt-1 text-xs text-[var(--ca-muted)]"><time :datetime="request.created_at">{{ date.format(new Date(request.created_at)) }} WIB</time></p>
          </div>
          <button type="button" class="ca-btn-secondary shrink-0" @click="copyContact(request.contact)">Salin kontak</button>
        </li>
      </ul>
      <p v-else class="text-sm text-[var(--ca-muted)]">Belum ada permintaan bantuan setup.</p>
    </template>
  </section>
</template>
