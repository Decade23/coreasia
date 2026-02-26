<script setup lang="ts">
import { reactive, watch } from 'vue'
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import Breadcrumb from '~/components/molecules/Breadcrumb.vue'
import PageHeader from '~/components/molecules/PageHeader.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { Settings, Building2, Palette, Users, Save, Check } from 'lucide-vue-next'
import { useTenantSettings, type TenantGeneral, type TenantBranding } from '~/composables/useTenantSettings'

const {
    settings, loading, saving, error,
    fetchSettings, updateGeneral, updateBranding,
    getRoleLabel, getRoleColor,
} = useTenantSettings()

const activeTab = ref<'general' | 'branding' | 'users'>('general')

const tabs = [
    { key: 'general' as const, label: 'Umum', icon: Building2 },
    { key: 'branding' as const, label: 'Branding', icon: Palette },
    { key: 'users' as const, label: 'Pengguna', icon: Users },
]

const generalForm = reactive<TenantGeneral>({
    name: '',
    license_number: '',
    address: '',
    phone: '',
    email: '',
    website: '',
})

const brandingForm = reactive<TenantBranding>({
    logo_url: '',
    primary_color: '#06B6D4',
    secondary_color: '#10B981',
    custom_domain: '',
})

const savedGeneral = ref(false)
const savedBranding = ref(false)

onMounted(async () => {
    await fetchSettings()
})

watch(settings, (val) => {
    if (val) {
        Object.assign(generalForm, val.general)
        Object.assign(brandingForm, val.branding)
    }
}, { immediate: true })

const handleSaveGeneral = async () => {
    const success = await updateGeneral({ ...generalForm })
    if (success) {
        savedGeneral.value = true
        setTimeout(() => { savedGeneral.value = false }, 2000)
    }
}

const handleSaveBranding = async () => {
    const success = await updateBranding({ ...brandingForm })
    if (success) {
        savedBranding.value = true
        setTimeout(() => { savedBranding.value = false }, 2000)
    }
}
</script>

<template>
    <DashboardLayout>
        <template #header>
            <h1 class="text-lg font-bold text-content hidden lg:block">Pengaturan</h1>
        </template>

        <div class="py-6 space-y-6">
            <div class="space-y-4">
                <Breadcrumb :items="[{ label: 'Admin', to: '/admin' }, { label: 'Pengaturan' }]" />
                <PageHeader title="Pengaturan Tenant" subtitle="Kelola informasi LSP, branding, dan pengguna admin." />
            </div>
            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" label="Memuat pengaturan..." />
            </div>

            <template v-else-if="settings">
                <!-- Tab Navigation -->
                <div class="flex gap-1 p-1 rounded-2xl bg-core-800 border border-divider w-fit">
                    <button
                        v-for="tab in tabs"
                        :key="tab.key"
                        class="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200"
                        :class="activeTab === tab.key
                            ? 'bg-brand/10 text-brand shadow-md'
                            : 'text-content-subtle hover:text-content hover:bg-tint'"
                        @click="activeTab = tab.key"
                    >
                        <component :is="tab.icon" class="w-4 h-4" />
                        <span class="hidden sm:inline">{{ tab.label }}</span>
                    </button>
                </div>

                <!-- Tab: General -->
                <div v-if="activeTab === 'general'" class="ca-card p-0 overflow-hidden">
                    <div class="p-6 border-b border-divider">
                        <h2 class="text-lg font-bold text-content">Informasi Umum LSP</h2>
                        <p class="text-sm text-content-subtle mt-1">Data dasar lembaga sertifikasi profesi Anda.</p>
                    </div>
                    <div class="p-6 space-y-5">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <BaseInput
                                id="tenant-name"
                                label="Nama LSP"
                                v-model="generalForm.name"
                                placeholder="Nama Lembaga"
                                required
                            />
                            <BaseInput
                                id="tenant-license"
                                label="Nomor Lisensi BNSP"
                                v-model="generalForm.license_number"
                                placeholder="KEP.xxxx/BNSP/xxxx"
                            />
                        </div>

                        <BaseInput
                            id="tenant-address"
                            label="Alamat"
                            v-model="generalForm.address"
                            placeholder="Alamat lengkap kantor"
                        />

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <BaseInput
                                id="tenant-phone"
                                label="Telepon"
                                v-model="generalForm.phone"
                                placeholder="021-xxxxxxx"
                            />
                            <BaseInput
                                id="tenant-email"
                                label="Email"
                                type="email"
                                v-model="generalForm.email"
                                placeholder="info@lsp.id"
                            />
                            <BaseInput
                                id="tenant-website"
                                label="Website"
                                v-model="generalForm.website"
                                placeholder="https://lms.lsp.id"
                            />
                        </div>
                    </div>
                    <div class="p-6 border-t border-divider flex justify-end">
                        <CaButton variant="primary" :loading="saving" @click="handleSaveGeneral">
                            <component :is="savedGeneral ? Check : Save" class="w-4 h-4 mr-1.5" />
                            {{ savedGeneral ? 'Tersimpan!' : 'Simpan Perubahan' }}
                        </CaButton>
                    </div>
                </div>

                <!-- Tab: Branding -->
                <div v-if="activeTab === 'branding'" class="ca-card p-0 overflow-hidden">
                    <div class="p-6 border-b border-divider">
                        <h2 class="text-lg font-bold text-content">Branding & Tampilan</h2>
                        <p class="text-sm text-content-subtle mt-1">Kustomisasi tampilan platform sesuai identitas LSP.</p>
                    </div>
                    <div class="p-6 space-y-5">
                        <!-- Logo Preview -->
                        <div>
                            <label class="block text-sm font-bold text-content-muted mb-2">Logo LSP</label>
                            <div class="flex items-center gap-4">
                                <div class="w-20 h-20 rounded-2xl bg-tint border border-dashed border-divider-strong flex items-center justify-center overflow-hidden">
                                    <img v-if="brandingForm.logo_url" :src="brandingForm.logo_url" alt="Logo" class="w-full h-full object-contain p-2" />
                                    <Palette v-else class="w-8 h-8 text-content-subtle" />
                                </div>
                                <div>
                                    <CaButton variant="outline" size="sm">Upload Logo</CaButton>
                                    <p class="text-xs text-content-subtle mt-1">PNG, SVG. Maks 1MB.</p>
                                </div>
                            </div>
                        </div>

                        <!-- Colors -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label class="block text-sm font-bold text-content-muted mb-2">Warna Primer</label>
                                <div class="flex items-center gap-3">
                                    <input
                                        type="color"
                                        v-model="brandingForm.primary_color"
                                        class="w-12 h-12 rounded-xl border-2 border-divider-strong bg-transparent cursor-pointer"
                                    />
                                    <BaseInput
                                        id="color-primary"
                                        v-model="brandingForm.primary_color"
                                        placeholder="#06B6D4"
                                        class="flex-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-content-muted mb-2">Warna Sekunder</label>
                                <div class="flex items-center gap-3">
                                    <input
                                        type="color"
                                        v-model="brandingForm.secondary_color"
                                        class="w-12 h-12 rounded-xl border-2 border-divider-strong bg-transparent cursor-pointer"
                                    />
                                    <BaseInput
                                        id="color-secondary"
                                        v-model="brandingForm.secondary_color"
                                        placeholder="#10B981"
                                        class="flex-1"
                                    />
                                </div>
                            </div>
                        </div>

                        <BaseInput
                            id="tenant-domain"
                            label="Domain Kustom"
                            v-model="brandingForm.custom_domain"
                            placeholder="lms.namalsp.id"
                        />

                        <!-- Preview -->
                        <div class="p-4 rounded-xl bg-tint border border-divider">
                            <p class="text-xs font-bold text-content-subtle uppercase tracking-widest mb-3">Preview Warna</p>
                            <div class="flex gap-3">
                                <div
                                    class="flex-1 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                                    :style="{ backgroundColor: brandingForm.primary_color }"
                                >
                                    Primer
                                </div>
                                <div
                                    class="flex-1 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                                    :style="{ backgroundColor: brandingForm.secondary_color }"
                                >
                                    Sekunder
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="p-6 border-t border-divider flex justify-end">
                        <CaButton variant="primary" :loading="saving" @click="handleSaveBranding">
                            <component :is="savedBranding ? Check : Save" class="w-4 h-4 mr-1.5" />
                            {{ savedBranding ? 'Tersimpan!' : 'Simpan Branding' }}
                        </CaButton>
                    </div>
                </div>

                <!-- Tab: Users -->
                <div v-if="activeTab === 'users'" class="ca-card p-0 overflow-hidden">
                    <div class="p-6 border-b border-divider flex items-center justify-between">
                        <div>
                            <h2 class="text-lg font-bold text-content">Pengguna Admin</h2>
                            <p class="text-sm text-content-subtle mt-1">Daftar pengguna dengan akses administrasi.</p>
                        </div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-core-900/80 border-b border-divider">
                                    <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest pl-6">Nama</th>
                                    <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest">Email</th>
                                    <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest">Role</th>
                                    <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest">Status</th>
                                    <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest pr-6">Login Terakhir</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-divider">
                                <tr v-for="u in settings.users" :key="u.id" class="hover:bg-core-800 transition-colors">
                                    <td class="p-4 pl-6">
                                        <div class="flex items-center gap-3">
                                            <div class="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand font-bold text-sm shrink-0">
                                                {{ u.name.charAt(0) }}
                                            </div>
                                            <span class="font-bold text-content text-sm">{{ u.name }}</span>
                                        </div>
                                    </td>
                                    <td class="p-4 text-sm text-content-muted">{{ u.email }}</td>
                                    <td class="p-4">
                                        <span
                                            class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border"
                                            :class="getRoleColor(u.role)"
                                        >
                                            {{ getRoleLabel(u.role) }}
                                        </span>
                                    </td>
                                    <td class="p-4">
                                        <span class="flex items-center gap-1.5 text-sm">
                                            <span
                                                class="w-2 h-2 rounded-full"
                                                :class="u.is_active ? 'bg-emerald-500' : 'bg-red-500/50'"
                                            />
                                            <span :class="u.is_active ? 'text-emerald-400' : 'text-red-400'">
                                                {{ u.is_active ? 'Aktif' : 'Nonaktif' }}
                                            </span>
                                        </span>
                                    </td>
                                    <td class="p-4 pr-6 text-sm text-content-muted whitespace-nowrap">
                                        {{ new Date(u.last_login).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </template>
        </div>
    </DashboardLayout>
</template>
