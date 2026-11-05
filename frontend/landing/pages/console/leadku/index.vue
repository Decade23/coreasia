<script setup lang="ts">
import { playTotals, screenLabels, updateImpact } from '~/adapters/leadkuMobile'
import type { LeadkuSummary, LeadkuPolicy } from '~/adapters/leadkuMobile'
definePageMeta({ layout: 'console', middleware: ['console','leadku-admin'] })
const api = useAdminApi(); const { can } = usePermissions(); const toast = useToast()
const channel = ref<'production'|'uat'>('production')
const data = ref<LeadkuSummary|null>(null); const loading = ref(true); const saving = ref(false); const failure = ref('')
const draft = ref<LeadkuPolicy|null>(null); const report = ref<HTMLInputElement|null>(null)
const integer = (n: number) => new Intl.NumberFormat('id-ID').format(n)
const date = (s: string) => new Intl.DateTimeFormat('id-ID',{dateStyle:'medium'}).format(new Date(s))
function errorMessage(error: unknown, fallback: string): string {
 const response = error as { data?: { errors?: { message?: unknown } } } | null
 const message = response?.data?.errors?.message
 return typeof message === 'string' ? message : fallback
}
let generation = 0
async function load() {
 const current = ++generation; loading.value=true; failure.value=''
 try { const result = await api.get<LeadkuSummary>('/admin/leadku/analytics',{channel:channel.value}); if(current!==generation)return;data.value=result.data;draft.value={...result.data.policy} }
 catch {if(current===generation)failure.value='Data LeadKu belum dapat dimuat.'} finally {if(current===generation)loading.value=false}
}
watch(channel,() => { data.value=null;draft.value=null;void load() });onMounted(load)
const play = computed(() => data.value ? playTotals(data.value) : null)
const impact = computed(() => data.value && draft.value ? updateImpact(data.value,draft.value.minimum_code) : 0)
const screens = computed(() => (data.value?.usage??[]).filter(row=>row.kind==='screen_view'))
const updateActions = computed(() => (data.value?.usage??[]).filter(row=>row.kind.startsWith('update_')))
const actionLabels:Record<string,string>={update_shown:'Ditampilkan',update_clicked:'Buka Play Store',update_dismissed:'Pilih nanti'}
async function save() {
 if(!draft.value||saving.value)return
 saving.value=true
 try {const res=await api.put<LeadkuPolicy>('/admin/leadku/mobile-policy',{...draft.value,expected_updated_at:draft.value.updated_at});draft.value={...res.data};if(data.value)data.value.policy=res.data;toast.success('Pengaturan versi tersimpan.')}
 catch(error:unknown){toast.error(errorMessage(error,'Pengaturan belum tersimpan.'))}
 finally {saving.value=false}
}
async function syncPlay() { saving.value=true;try{await api.post('/admin/leadku/play-sync');await load();toast.success('Laporan Google Play diperbarui.')}catch(error:unknown){toast.error(errorMessage(error,'Sinkronisasi belum berhasil.'))}finally{saving.value=false} }
async function importReport(event:Event) {
 const input=event.target as HTMLInputElement;const file=input.files?.[0];if(!file)return
 saving.value=true
 try {const form=new FormData();form.append('report',file);await api.post('/admin/leadku/play-report',form);toast.success('Laporan Google Play tersimpan.');await load()}
 catch(error:unknown){toast.error(errorMessage(error,'Laporan belum dapat diimpor.'))}
 finally{saving.value=false;input.value=''}
}
</script>
<template>
 <div class="space-y-6">
  <ConsolePageHeader title="LeadKu" kicker="Aplikasi Android">
   <template #actions><button class="ca-btn-secondary" :disabled="loading || saving" @click="load">Muat ulang</button></template>
  </ConsolePageHeader>
  <div class="flex gap-2" role="tablist" aria-label="Kanal aplikasi"><button v-for="option in ([['production','Google Play'],['uat','UAT']] as const)" :key="option[0]" role="tab" :aria-selected="channel===option[0]" :disabled="saving" :class="channel===option[0]?'ca-btn-primary':'ca-btn-secondary'" @click="channel=option[0]">{{option[1]}}</button></div>
  <p v-if="failure" role="alert" class="ca-tone-danger">{{failure}}</p>
  <div v-if="loading && !data" aria-label="Memuat analitik LeadKu" aria-busy="true" class="grid gap-4 md:grid-cols-4"><div v-for="n in 4" :key="n" class="h-28 animate-pulse rounded-2xl bg-[var(--ca-surface)]" /></div>
  <template v-if="data">
   <section v-if="channel==='production'" class="ca-console-dialog p-5 space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3"><h2 class="font-display text-lg font-bold">Google Play</h2><button v-if="can('leadku:settings') && data.play_sync.configured" class="ca-btn-secondary" :disabled="saving" @click="syncPlay">Sinkronkan</button><button v-if="can('leadku:settings')" class="ca-btn-secondary" :disabled="saving" @click="report?.click()">Impor laporan</button><input ref="report" hidden type="file" accept=".csv" @change="importReport"></div>
    <template v-if="play"><p class="text-sm text-[var(--ca-muted)]">{{date(play.first.day)}} – {{date(play.latest.day)}}</p><div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><CashflowStatTile label="Instalasi dari laporan" :nilai="integer(play.installs)" icon="lucide:download" warna="emerald"/><CashflowStatTile label="Uninstall dari laporan" :nilai="integer(play.uninstalls)" icon="lucide:trash-2" warna="netral"/><CashflowStatTile label="Masih terpasang" :nilai="play.latest.current_installs===null?'—':integer(play.latest.current_installs)" icon="lucide:check" warna="emerald"/><CashflowStatTile label="Perangkat aktif" :nilai="play.latest.active_installs===null?'—':integer(play.latest.active_installs)" icon="lucide:smartphone" warna="sky"/></div><p class="text-xs text-[var(--ca-subtle)]">{{play.latest.source}} · {{date(play.latest.imported_at)}}</p></template>
    <p v-else class="text-sm text-[var(--ca-muted)]">Belum ada laporan instalasi Google Play.</p><p v-if="data.play_sync.error" role="status" class="text-sm ca-tone-gold">{{data.play_sync.error}}</p>
   </section>
   <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><CashflowStatTile label="Instalasi tercatat" :nilai="integer(data.counts.installations)" icon="lucide:smartphone" warna="emerald"/><CashflowStatTile label="Aktif 24 jam" :nilai="integer(data.counts.active_24h)" icon="lucide:activity" warna="sky"/><CashflowStatTile label="Aktif 7 hari" :nilai="integer(data.counts.active_7d)" icon="lucide:users" warna="sky"/><CashflowStatTile label="Aktif 30 hari" :nilai="integer(data.counts.active_30d)" icon="lucide:calendar" warna="netral"/><CashflowStatTile label="Baru 7 hari" :nilai="integer(data.counts.new_7d)" icon="lucide:plus" warna="amber"/></div>
   <div class="grid gap-6 lg:grid-cols-2">
    <section class="ca-console-dialog p-5 overflow-x-auto"><h2 class="font-display text-base font-bold">Versi aplikasi</h2><table class="w-full mt-4 text-sm"><thead><tr class="text-left text-[var(--ca-muted)]"><th class="py-2">Versi</th><th>Kode</th><th>Instalasi</th><th>Aktif 7 hari</th></tr></thead><tbody><tr v-for="v in data.versions" :key="v.code+v.version" class="border-t border-[var(--ca-border)]"><td class="py-3">{{v.version}}</td><td>{{v.code}}</td><td>{{integer(v.installations)}}</td><td>{{integer(v.active_7d)}}</td></tr></tbody></table><p v-if="!data.versions.length" class="mt-3 text-sm text-[var(--ca-muted)]">Belum ada data versi.</p></section>
    <section class="ca-console-dialog p-5 overflow-x-auto"><h2 class="font-display text-base font-bold">Layar · 30 hari</h2><table class="w-full mt-4 text-sm"><thead><tr class="text-left text-[var(--ca-muted)]"><th class="py-2">Layar</th><th>Dibuka</th><th>Instalasi</th></tr></thead><tbody><tr v-for="row in screens" :key="row.screen" class="border-t border-[var(--ca-border)]"><td class="py-3">{{screenLabels[row.screen]??row.screen}}</td><td>{{integer(row.events)}}</td><td>{{integer(row.installations)}}</td></tr></tbody></table><p v-if="!screens.length" class="mt-3 text-sm text-[var(--ca-muted)]">Belum ada data penggunaan.</p></section>
   </div>
   <section class="ca-console-dialog p-5 space-y-4"><h2 class="font-display text-base font-bold">Instalasi baru tercatat · 30 hari</h2><CashflowSparkline v-if="data.daily.length>2" :data="data.daily.map(row=>row.new_installations)" label="Instalasi baru tercatat"/><p v-if="data.daily.length" class="text-xs text-[var(--ca-muted)]">{{date(data.daily[0]!.day)}} – {{date(data.daily[data.daily.length-1]!.day)}}</p><p v-if="!data.daily.length" class="text-sm text-[var(--ca-muted)]">Belum ada instalasi tercatat.</p></section>
   <section v-if="can('leadku:settings') && draft" class="ca-console-dialog p-5 space-y-4"><h2 class="font-display text-base font-bold">Pembaruan versi · {{channel==='production'?'Google Play':'UAT'}}</h2>
    <form class="space-y-4" @submit.prevent="save"><div class="grid gap-4 md:grid-cols-3"><label class="text-sm">Versi terbaru<input v-model="draft.latest_version" class="ca-input mt-2 w-full" placeholder="1.6.3" maxlength="40" :disabled="saving"></label><label class="text-sm">Kode terbaru<input v-model.number="draft.latest_code" class="ca-input mt-2 w-full" type="number" min="0" max="2100000000" :disabled="saving" required></label><label class="text-sm">Kode minimum wajib<input v-model.number="draft.minimum_code" class="ca-input mt-2 w-full" type="number" min="0" :max="draft.latest_code" :disabled="saving" required></label></div>
    <label class="flex items-center gap-3 text-sm"><input v-model="draft.available" type="checkbox" :disabled="saving">{{channel==='production'?'Rilis sudah tersedia di Google Play':'Build UAT sudah tersedia'}}</label>
    <p class="text-sm text-[var(--ca-muted)]">{{draft.minimum_code?'Wajib untuk versi di bawah kode '+draft.minimum_code:'Update opsional'}} · {{integer(impact)}} instalasi aktif terdampak</p>
    <label class="block text-sm">Catatan rilis<textarea v-model="draft.notes" class="ca-input mt-2 w-full" maxlength="600" rows="3" :disabled="saving"/></label><button class="ca-btn-primary" :disabled="saving">{{saving?'Menyimpan…':'Simpan pengaturan'}}</button></form>
   </section>
   <section class="ca-console-dialog p-5 space-y-3"><h2 class="font-display text-base font-bold">Ajakan update · 30 hari</h2><p v-for="row in updateActions" :key="row.kind" class="text-sm">{{actionLabels[row.kind]??row.kind}} · {{integer(row.events)}}</p><p v-if="!updateActions.length" class="text-sm text-[var(--ca-muted)]">Belum ada ajakan update tercatat.</p></section>
  </template>
 </div>
</template>
