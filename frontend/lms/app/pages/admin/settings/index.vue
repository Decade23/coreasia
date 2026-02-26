<script setup lang="ts">
import { reactive, watch } from 'vue'
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import Breadcrumb from '~/components/molecules/Breadcrumb.vue'
import PageHeader from '~/components/molecules/PageHeader.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { Building2, Palette, Users, Save, Check, Plus, Pencil, Trash2, X, Search } from 'lucide-vue-next'
import { useTenantSettings, type TenantGeneral, type TenantBranding } from '~/composables/useTenantSettings'
import { useUsers, type CreateUserPayload, type UpdateUserPayload } from '~/composables/useUsers'
import type { UserDomain } from '~/adapters/UserAdapter'

const {
    settings, loading, saving, error,
    fetchSettings, updateGeneral, updateBranding,
    getRoleLabel, getRoleColor,
} = useTenantSettings()

const {
    users, loading: usersLoading, saving: usersSaving,
    error: usersError, totalItems, currentPage,
    fetchUsers, createUser, updateUser, deleteUser,
} = useUsers()

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

// ----- User Modal State -----
const showUserModal = ref(false)
const editingUser = ref<UserDomain | null>(null)
const userSearch = ref('')
const deleteConfirmId = ref<string | null>(null)

const roleOptions = [
    { value: 'admin', label: 'Administrator' },
    { value: 'quality_manager', label: 'Manajer Mutu' },
    { value: 'assessor', label: 'Asesor' },
    { value: 'assessee', label: 'Asesi' },
]

const userForm = reactive({
    full_name: '',
    email: '',
    password: '',
    phone_number: '',
    role: 'assessee',
    is_active: true,
})

const resetUserForm = () => {
    userForm.full_name = ''
    userForm.email = ''
    userForm.password = ''
    userForm.phone_number = ''
    userForm.role = 'assessee'
    userForm.is_active = true
}

const openCreateModal = () => {
    editingUser.value = null
    resetUserForm()
    showUserModal.value = true
}

const openEditModal = (user: UserDomain) => {
    editingUser.value = user
    userForm.full_name = user.fullName
    userForm.email = user.email
    userForm.password = ''
    userForm.phone_number = user.phoneNumber || ''
    userForm.role = user.role
    userForm.is_active = user.isActive
    showUserModal.value = true
}

const closeUserModal = () => {
    showUserModal.value = false
    editingUser.value = null
    resetUserForm()
}

const handleSaveUser = async () => {
    if (editingUser.value) {
        const payload: UpdateUserPayload = {
            email: userForm.email,
            full_name: userForm.full_name,
            phone_number: userForm.phone_number || undefined,
            role: userForm.role,
            is_active: userForm.is_active,
        }
        const success = await updateUser(editingUser.value.id, payload)
        if (success) closeUserModal()
    } else {
        const payload: CreateUserPayload = {
            email: userForm.email,
            password: userForm.password,
            full_name: userForm.full_name,
            phone_number: userForm.phone_number || undefined,
            role: userForm.role,
        }
        const success = await createUser(payload)
        if (success) closeUserModal()
    }
}

const handleDeleteUser = async (id: string) => {
    const success = await deleteUser(id)
    if (success) deleteConfirmId.value = null
}

const handleSearchUsers = () => {
    fetchUsers(1, userSearch.value)
}

const totalPages = computed(() => Math.ceil(totalItems.value / 10))

// ----- Lifecycle -----
onMounted(async () => {
    await fetchSettings()
})

watch(activeTab, (tab) => {
    if (tab === 'users' && users.value.length === 0) {
        fetchUsers(1, '')
    }
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

const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
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
            <ErrorAlert v-if="usersError" :message="usersError" @dismiss="usersError = null" />

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
                    <div class="p-6 border-b border-divider flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 class="text-lg font-bold text-content">Pengguna Admin</h2>
                            <p class="text-sm text-content-subtle mt-1">Kelola pengguna dengan akses ke platform.</p>
                        </div>
                        <CaButton variant="primary" size="sm" @click="openCreateModal">
                            <Plus class="w-4 h-4 mr-1.5" />
                            Tambah Pengguna
                        </CaButton>
                    </div>

                    <!-- Search Bar -->
                    <div class="px-6 py-4 border-b border-divider">
                        <div class="relative max-w-sm">
                            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-subtle pointer-events-none" />
                            <input
                                v-model="userSearch"
                                type="text"
                                placeholder="Cari nama atau email..."
                                class="w-full bg-input rounded-xl pl-10 pr-4 py-2.5 text-sm text-content font-medium placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:shadow-glow-cyan transition-all"
                                @keyup.enter="handleSearchUsers"
                            />
                        </div>
                    </div>

                    <div v-if="usersLoading" class="flex justify-center py-12">
                        <LoadingSpinner size="md" label="Memuat pengguna..." />
                    </div>

                    <template v-else>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse min-w-175">
                                <thead>
                                    <tr class="bg-core-900/80 border-b border-divider">
                                        <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest pl-6">Nama</th>
                                        <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest">Email</th>
                                        <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest">Role</th>
                                        <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest">Status</th>
                                        <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest">Login Terakhir</th>
                                        <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest pr-6 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-divider">
                                    <tr v-if="users.length === 0">
                                        <td colspan="6" class="p-8 text-center text-sm text-content-subtle">
                                            Belum ada pengguna terdaftar.
                                        </td>
                                    </tr>
                                    <tr v-for="u in users" :key="u.id" class="hover:bg-core-800 transition-colors">
                                        <td class="p-4 pl-6">
                                            <div class="flex items-center gap-3">
                                                <div class="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand font-bold text-sm shrink-0">
                                                    {{ u.fullName.charAt(0) }}
                                                </div>
                                                <span class="font-bold text-content text-sm">{{ u.fullName }}</span>
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
                                                    :class="u.isActive ? 'bg-emerald-500' : 'bg-red-500/50'"
                                                />
                                                <span :class="u.isActive ? 'text-emerald-400' : 'text-red-400'">
                                                    {{ u.isActive ? 'Aktif' : 'Nonaktif' }}
                                                </span>
                                            </span>
                                        </td>
                                        <td class="p-4 text-sm text-content-muted whitespace-nowrap">
                                            {{ formatDate(u.lastLoginAt) }}
                                        </td>
                                        <td class="p-4 pr-6">
                                            <div class="flex items-center justify-end gap-2">
                                                <button
                                                    class="p-2 rounded-lg text-content-subtle hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                                                    title="Edit pengguna"
                                                    @click="openEditModal(u)"
                                                >
                                                    <Pencil class="w-4 h-4" />
                                                </button>
                                                <button
                                                    v-if="deleteConfirmId !== u.id"
                                                    class="p-2 rounded-lg text-content-subtle hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                                    title="Hapus pengguna"
                                                    @click="deleteConfirmId = u.id"
                                                >
                                                    <Trash2 class="w-4 h-4" />
                                                </button>
                                                <div v-else class="flex items-center gap-1">
                                                    <button
                                                        class="px-2 py-1 rounded-lg text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-all"
                                                        :disabled="usersSaving"
                                                        @click="handleDeleteUser(u.id)"
                                                    >
                                                        Hapus
                                                    </button>
                                                    <button
                                                        class="px-2 py-1 rounded-lg text-xs font-bold text-content-subtle hover:text-content hover:bg-tint transition-all"
                                                        @click="deleteConfirmId = null"
                                                    >
                                                        Batal
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Pagination -->
                        <div v-if="totalPages > 1" class="p-4 border-t border-divider flex items-center justify-between">
                            <p class="text-xs text-content-subtle">
                                Halaman {{ currentPage }} dari {{ totalPages }} ({{ totalItems }} pengguna)
                            </p>
                            <div class="flex gap-2">
                                <CaButton
                                    variant="outline"
                                    size="sm"
                                    :disabled="currentPage <= 1"
                                    @click="fetchUsers(currentPage - 1, userSearch)"
                                >
                                    Sebelumnya
                                </CaButton>
                                <CaButton
                                    variant="outline"
                                    size="sm"
                                    :disabled="currentPage >= totalPages"
                                    @click="fetchUsers(currentPage + 1, userSearch)"
                                >
                                    Berikutnya
                                </CaButton>
                            </div>
                        </div>
                    </template>
                </div>
            </template>
        </div>

        <!-- User Create/Edit Modal -->
        <Teleport to="body">
            <Transition name="modal">
                <div
                    v-if="showUserModal"
                    class="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                    <!-- Backdrop -->
                    <div
                        class="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        @click="closeUserModal"
                    />

                    <!-- Modal Content -->
                    <div class="relative w-full max-w-lg rounded-2xl border border-divider bg-core-900/95 backdrop-blur-xl shadow-2xl shadow-black/40">
                        <!-- Header -->
                        <div class="flex items-center justify-between p-6 border-b border-divider">
                            <div>
                                <h3 class="text-lg font-bold text-content">
                                    {{ editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru' }}
                                </h3>
                                <p class="text-sm text-content-subtle mt-0.5">
                                    {{ editingUser ? 'Perbarui informasi pengguna.' : 'Buat akun pengguna baru di platform.' }}
                                </p>
                            </div>
                            <button
                                class="p-2 rounded-xl text-content-subtle hover:text-content hover:bg-tint transition-all"
                                @click="closeUserModal"
                            >
                                <X class="w-5 h-5" />
                            </button>
                        </div>

                        <!-- Body -->
                        <div class="p-6 space-y-5">
                            <ErrorAlert v-if="usersError" :message="usersError" @dismiss="usersError = null" />

                            <BaseInput
                                id="user-fullname"
                                label="Nama Lengkap"
                                v-model="userForm.full_name"
                                placeholder="Nama lengkap pengguna"
                                required
                            />

                            <BaseInput
                                id="user-email"
                                label="Email"
                                type="email"
                                v-model="userForm.email"
                                placeholder="user@example.com"
                                required
                            />

                            <BaseInput
                                v-if="!editingUser"
                                id="user-password"
                                label="Password"
                                type="password"
                                v-model="userForm.password"
                                placeholder="Minimal 6 karakter"
                                required
                            />

                            <BaseInput
                                id="user-phone"
                                label="Nomor Telepon"
                                v-model="userForm.phone_number"
                                placeholder="08xxxxxxxxxx"
                            />

                            <!-- Role Select -->
                            <div class="w-full">
                                <label for="user-role" class="block text-xs font-bold uppercase tracking-wider text-content-subtle mb-2">
                                    Role <span class="text-rose-500 ml-1">*</span>
                                </label>
                                <select
                                    id="user-role"
                                    v-model="userForm.role"
                                    class="w-full bg-input rounded-xl px-4 py-3.5 h-[52px] text-content font-bold transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:shadow-glow-cyan focus:bg-input hover:bg-input-hover shadow-inset-light appearance-none cursor-pointer"
                                >
                                    <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
                                        {{ opt.label }}
                                    </option>
                                </select>
                            </div>

                            <!-- Active Toggle (edit only) -->
                            <div v-if="editingUser" class="flex items-center justify-between">
                                <div>
                                    <label class="block text-xs font-bold uppercase tracking-wider text-content-subtle">Status Aktif</label>
                                    <p class="text-xs text-content-subtle mt-0.5">Nonaktifkan untuk menangguhkan akses pengguna.</p>
                                </div>
                                <button
                                    type="button"
                                    class="relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                    :class="userForm.is_active ? 'bg-cyan-500' : 'bg-core-600'"
                                    @click="userForm.is_active = !userForm.is_active"
                                >
                                    <span
                                        class="pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out"
                                        :class="userForm.is_active ? 'translate-x-5' : 'translate-x-0'"
                                    />
                                </button>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="p-6 border-t border-divider flex items-center justify-end gap-3">
                            <CaButton variant="ghost" size="sm" @click="closeUserModal">
                                Batal
                            </CaButton>
                            <CaButton variant="primary" size="sm" :loading="usersSaving" @click="handleSaveUser">
                                <Save class="w-4 h-4 mr-1.5" />
                                {{ editingUser ? 'Simpan Perubahan' : 'Buat Pengguna' }}
                            </CaButton>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </DashboardLayout>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.2s ease;
}
.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
    transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}
.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
    transform: scale(0.95);
    opacity: 0;
}
</style>
