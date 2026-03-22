<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import Breadcrumb from '~/components/molecules/Breadcrumb.vue'
import PageHeader from '~/components/molecules/PageHeader.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import BaseInput from '~/components/atoms/BaseInput.vue'
import BaseTextarea from '~/components/atoms/BaseTextarea.vue'
import CaInputSearch from '~/components/molecules/CaInputSearch.vue'
import CaSelect from '~/components/molecules/CaSelect.vue'
import CaToggle from '~/components/atoms/CaToggle.vue'
import Modal from '~/components/organisms/Modal.vue'
import ConfirmDialog from '~/components/molecules/ConfirmDialog.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { Building2, Palette, Users, Save, Check, Plus, Pencil, Trash2 } from 'lucide-vue-next'
import { useTenantSettings, type TenantGeneral, type TenantBranding } from '~/composables/useTenantSettings'
import { useUsers, type CreateUserPayload, type UpdateUserPayload } from '~/composables/useUsers'
import type { UserDomain } from '~/adapters/UserAdapter'

const defaultGeneral: TenantGeneral = {
    name: '',
    license_number: '',
    address: '',
    phone: '',
    email: '',
    website: '',
}

const defaultBranding: TenantBranding = {
    logo_url: '',
    primary_color: '#06B6D4',
    secondary_color: '#10B981',
    custom_domain: '',
}

const brandPalettes = [
    { primary: '#06B6D4', secondary: '#10B981' },
    { primary: '#2563EB', secondary: '#14B8A6' },
    { primary: '#F97316', secondary: '#0F766E' },
    { primary: '#DC2626', secondary: '#7C3AED' },
]

const {
    settings,
    loading,
    saving,
    error,
    fetchSettings,
    updateGeneral,
    updateBranding,
    getRoleColor,
} = useTenantSettings()

const {
    users,
    loading: usersLoading,
    saving: usersSaving,
    error: usersError,
    totalItems,
    currentPage,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
} = useUsers()

const { t, locale } = useI18n()

const activeTab = ref<'general' | 'branding' | 'users'>('general')
const savedGeneral = ref(false)
const savedBranding = ref(false)
const showUserModal = ref(false)
const editingUser = ref<UserDomain | null>(null)
const userSearch = ref('')
const deleteTarget = ref<UserDomain | null>(null)

const generalForm = reactive<TenantGeneral>({ ...defaultGeneral })
const brandingForm = reactive<TenantBranding>({ ...defaultBranding })
const userForm = reactive({
    full_name: '',
    email: '',
    password: '',
    phone_number: '',
    role: 'assessee',
    is_active: true,
})

const tabs = computed(() => [
    { key: 'general' as const, label: t('admin.settings.general'), icon: Building2 },
    { key: 'branding' as const, label: t('admin.settings.branding'), icon: Palette },
    { key: 'users' as const, label: t('admin.settings.users'), icon: Users },
])

const roleOptions = computed(() => [
    { value: 'admin', label: t('role.admin') },
    { value: 'quality_manager', label: t('role.qualityManager') },
    { value: 'assessor', label: t('role.assessor') },
    { value: 'assessee', label: t('role.assessee') },
])

const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / 10)))

const roleLabel = (role: string) => {
    switch (role) {
        case 'super_admin':
            return t('role.superAdmin')
        case 'admin':
            return t('role.admin')
        case 'quality_manager':
            return t('role.qualityManager')
        case 'assessor':
            return t('role.assessor')
        case 'assessee':
            return t('role.assessee')
        default:
            return role
    }
}

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
        if (success) {
            closeUserModal()
        }
        return
    }

    const payload: CreateUserPayload = {
        email: userForm.email,
        password: userForm.password,
        full_name: userForm.full_name,
        phone_number: userForm.phone_number || undefined,
        role: userForm.role,
    }

    const success = await createUser(payload)
    if (success) {
        closeUserModal()
    }
}

const confirmDeleteUser = async () => {
    if (!deleteTarget.value) {
        return
    }

    const success = await deleteUser(deleteTarget.value.id)
    if (success) {
        deleteTarget.value = null
    }
}

const handleSearchUsers = () => {
    fetchUsers(1, userSearch.value.trim())
}

const handleSaveGeneral = async () => {
    const success = await updateGeneral({ ...generalForm })
    if (success) {
        savedGeneral.value = true
        setTimeout(() => {
            savedGeneral.value = false
        }, 2000)
    }
}

const handleSaveBranding = async () => {
    const success = await updateBranding({ ...brandingForm })
    if (success) {
        savedBranding.value = true
        setTimeout(() => {
            savedBranding.value = false
        }, 2000)
    }
}

const applyPalette = (primary: string, secondary: string) => {
    brandingForm.primary_color = primary
    brandingForm.secondary_color = secondary
}

const formatDate = (date: Date | null) => {
    if (!date) {
        return t('admin.settings.lastLoginEmpty')
    }

    return date.toLocaleDateString(locale.value === 'en' ? 'en-US' : 'id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

let searchTimer: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
    await fetchSettings()
})

watch(activeTab, (tab) => {
    if (tab === 'users' && users.value.length === 0) {
        fetchUsers(1, userSearch.value.trim())
    }
})

watch(userSearch, () => {
    if (activeTab.value !== 'users') {
        return
    }

    if (searchTimer) {
        clearTimeout(searchTimer)
    }

    searchTimer = setTimeout(() => {
        handleSearchUsers()
    }, 300)
})

watch(
    settings,
    (value) => {
        if (!value) {
            return
        }

        Object.assign(generalForm, defaultGeneral, value.general || {})
        Object.assign(brandingForm, defaultBranding, value.branding || {})
    },
    { immediate: true },
)

onBeforeUnmount(() => {
    if (searchTimer) {
        clearTimeout(searchTimer)
    }
})
</script>

<template>
    <DashboardLayout>
        <template #header>
            <h1 class="hidden text-lg font-bold text-content lg:block">{{ t('nav.settings') }}</h1>
        </template>

        <div class="space-y-6 py-6">
            <div class="space-y-4">
                <Breadcrumb :items="[{ label: 'Admin', to: '/admin' }, { label: t('nav.settings') }]" />
                <PageHeader
                    :eyebrow="t('nav.settings')"
                    :title="t('admin.settings.title')"
                    :subtitle="t('admin.settings.subtitle')"
                />
            </div>

            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />
            <ErrorAlert v-if="usersError" :message="usersError" @dismiss="usersError = null" />

            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" :label="t('admin.settings.loading')" />
            </div>

            <template v-else>
                <div class="w-fit rounded-2xl border border-divider bg-core-800 p-1">
                    <div class="flex flex-wrap gap-1">
                        <button
                            v-for="tab in tabs"
                            :key="tab.key"
                            class="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-200"
                            :class="activeTab === tab.key ? 'bg-brand/10 text-brand shadow-md' : 'text-content-subtle hover:bg-tint hover:text-content'"
                            @click="activeTab = tab.key"
                        >
                            <component :is="tab.icon" class="h-4 w-4" />
                            <span class="hidden sm:inline">{{ tab.label }}</span>
                        </button>
                    </div>
                </div>

                <div v-if="activeTab === 'general'" class="ca-card overflow-hidden p-0">
                    <div class="border-b border-divider p-6">
                        <h2 class="text-lg font-bold text-content">{{ t('admin.settings.generalSectionTitle') }}</h2>
                        <p class="mt-1 text-sm text-content-subtle">{{ t('admin.settings.generalSectionSubtitle') }}</p>
                    </div>

                    <div class="space-y-5 p-6">
                        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <BaseInput
                                id="tenant-name"
                                :label="t('admin.settings.fields.name')"
                                v-model="generalForm.name"
                                :placeholder="t('admin.settings.placeholders.name')"
                                required
                            />

                            <BaseInput
                                id="tenant-license"
                                :label="t('admin.settings.fields.license')"
                                v-model="generalForm.license_number"
                                :placeholder="t('admin.settings.placeholders.license')"
                            />
                        </div>

                        <BaseTextarea
                            id="tenant-address"
                            :label="t('admin.settings.fields.address')"
                            v-model="generalForm.address"
                            :placeholder="t('admin.settings.placeholders.address')"
                            :rows="4"
                        />

                        <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
                            <BaseInput
                                id="tenant-phone"
                                :label="t('admin.settings.fields.phone')"
                                v-model="generalForm.phone"
                                :placeholder="t('admin.settings.placeholders.phone')"
                            />

                            <BaseInput
                                id="tenant-email"
                                :label="t('admin.settings.fields.email')"
                                type="email"
                                v-model="generalForm.email"
                                :placeholder="t('admin.settings.placeholders.email')"
                            />

                            <BaseInput
                                id="tenant-website"
                                :label="t('admin.settings.fields.website')"
                                v-model="generalForm.website"
                                :placeholder="t('admin.settings.placeholders.website')"
                            />
                        </div>
                    </div>

                    <div class="flex justify-end border-t border-divider p-6">
                        <CaButton variant="primary" :loading="saving" @click="handleSaveGeneral">
                            <component :is="savedGeneral ? Check : Save" class="mr-1.5 h-4 w-4" />
                            {{ savedGeneral ? t('admin.settings.generalSaved') : t('admin.settings.saveChanges') }}
                        </CaButton>
                    </div>
                </div>

                <div v-if="activeTab === 'branding'" class="ca-card overflow-hidden p-0">
                    <div class="border-b border-divider p-6">
                        <h2 class="text-lg font-bold text-content">{{ t('admin.settings.brandingSectionTitle') }}</h2>
                        <p class="mt-1 text-sm text-content-subtle">{{ t('admin.settings.brandingSectionSubtitle') }}</p>
                    </div>

                    <div class="space-y-6 p-6">
                        <div class="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                            <div class="space-y-5">
                                <BaseInput
                                    id="tenant-logo"
                                    :label="t('admin.settings.logoLabel')"
                                    v-model="brandingForm.logo_url"
                                    :placeholder="t('admin.settings.placeholders.logo')"
                                />

                                <BaseInput
                                    id="tenant-domain"
                                    :label="t('admin.settings.fields.customDomain')"
                                    v-model="brandingForm.custom_domain"
                                    :placeholder="t('admin.settings.placeholders.customDomain')"
                                />

                                <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <BaseInput
                                        id="color-primary"
                                        :label="t('admin.settings.fields.primaryColor')"
                                        v-model="brandingForm.primary_color"
                                        placeholder="#06B6D4"
                                    />

                                    <BaseInput
                                        id="color-secondary"
                                        :label="t('admin.settings.fields.secondaryColor')"
                                        v-model="brandingForm.secondary_color"
                                        placeholder="#10B981"
                                    />
                                </div>
                            </div>

                            <div class="rounded-2xl border border-divider bg-tint-subtle p-5">
                                <p class="text-xs font-black uppercase tracking-[0.18em] text-content-faint">
                                    {{ t('admin.settings.previewTitle') }}
                                </p>

                                <div class="mt-4 space-y-3">
                                    <div class="rounded-2xl border border-divider bg-core-900/60 p-4">
                                        <div class="flex items-center gap-3">
                                            <div
                                                class="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black text-white"
                                                :style="{ backgroundColor: brandingForm.primary_color }"
                                            >
                                                C
                                            </div>
                                            <div>
                                                <p class="font-bold text-content">CoreAsia LMS</p>
                                                <p class="text-xs text-content-subtle">{{ t('admin.settings.logoHelper') }}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="grid grid-cols-2 gap-3">
                                        <div
                                            class="flex h-16 items-center justify-center rounded-2xl text-sm font-black text-white"
                                            :style="{ backgroundColor: brandingForm.primary_color }"
                                        >
                                            {{ t('admin.settings.previewPrimary') }}
                                        </div>

                                        <div
                                            class="flex h-16 items-center justify-center rounded-2xl text-sm font-black text-white"
                                            :style="{ backgroundColor: brandingForm.secondary_color }"
                                        >
                                            {{ t('admin.settings.previewSecondary') }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <p class="text-xs font-black uppercase tracking-[0.18em] text-content-faint">
                                {{ t('admin.settings.colorPresets') }}
                            </p>

                            <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
                                <button
                                    v-for="palette in brandPalettes"
                                    :key="`${palette.primary}-${palette.secondary}`"
                                    type="button"
                                    class="rounded-2xl border border-divider p-3 transition-all hover:border-brand/30 hover:bg-tint"
                                    @click="applyPalette(palette.primary, palette.secondary)"
                                >
                                    <div class="flex gap-2">
                                        <span class="h-10 flex-1 rounded-xl" :style="{ backgroundColor: palette.primary }" />
                                        <span class="h-10 flex-1 rounded-xl" :style="{ backgroundColor: palette.secondary }" />
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end border-t border-divider p-6">
                        <CaButton variant="primary" :loading="saving" @click="handleSaveBranding">
                            <component :is="savedBranding ? Check : Save" class="mr-1.5 h-4 w-4" />
                            {{ savedBranding ? t('admin.settings.brandingSaved') : t('admin.settings.saveBranding') }}
                        </CaButton>
                    </div>
                </div>

                <div v-if="activeTab === 'users'" class="ca-card overflow-hidden p-0">
                    <div class="flex flex-col gap-4 border-b border-divider p-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 class="text-lg font-bold text-content">{{ t('admin.settings.usersSectionTitle') }}</h2>
                            <p class="mt-1 text-sm text-content-subtle">{{ t('admin.settings.usersSectionSubtitle') }}</p>
                        </div>

                        <CaButton variant="primary" size="sm" @click="openCreateModal">
                            <Plus class="mr-1.5 h-4 w-4" />
                            {{ t('admin.settings.addUser') }}
                        </CaButton>
                    </div>

                    <div class="border-b border-divider px-6 py-4">
                        <div class="max-w-sm">
                            <CaInputSearch
                                v-model="userSearch"
                                :placeholder="t('admin.settings.searchUsers')"
                            />
                        </div>
                    </div>

                    <div v-if="usersLoading" class="flex justify-center py-12">
                        <LoadingSpinner size="md" :label="t('admin.settings.usersLoading')" />
                    </div>

                    <template v-else>
                        <div class="overflow-x-auto">
                            <table class="ca-table min-w-220">
                                <thead>
                                    <tr>
                                        <th class="pl-6">{{ t('admin.settings.table.name') }}</th>
                                        <th>{{ t('admin.settings.table.email') }}</th>
                                        <th>{{ t('admin.settings.table.role') }}</th>
                                        <th>{{ t('admin.settings.table.status') }}</th>
                                        <th>{{ t('admin.settings.table.lastLogin') }}</th>
                                        <th class="pr-6 text-right">{{ t('admin.settings.table.actions') }}</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr v-if="users.length === 0">
                                        <td colspan="6" class="p-8 text-center text-sm text-content-subtle">
                                            {{ t('admin.settings.table.empty') }}
                                        </td>
                                    </tr>

                                    <tr v-for="user in users" :key="user.id">
                                        <td class="p-4 pl-6">
                                            <div class="flex items-center gap-3">
                                                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-sm font-bold text-brand">
                                                    {{ user.fullName.charAt(0) }}
                                                </div>
                                                <span class="text-sm font-bold text-content">{{ user.fullName }}</span>
                                            </div>
                                        </td>

                                        <td class="p-4 text-sm text-content-muted">{{ user.email }}</td>

                                        <td class="p-4">
                                            <span
                                                class="rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest"
                                                :class="getRoleColor(user.role)"
                                            >
                                                {{ roleLabel(user.role) }}
                                            </span>
                                        </td>

                                        <td class="p-4">
                                            <span class="flex items-center gap-1.5 text-sm">
                                                <span class="h-2 w-2 rounded-full" :class="user.isActive ? 'bg-emerald-500' : 'bg-rose-500/60'" />
                                                <span :class="user.isActive ? 'text-emerald-400' : 'text-rose-400'">
                                                    {{ user.isActive ? t('common.active') : t('common.inactive') }}
                                                </span>
                                            </span>
                                        </td>

                                        <td class="whitespace-nowrap p-4 text-sm text-content-muted">{{ formatDate(user.lastLoginAt) }}</td>

                                        <td class="p-4 pr-6">
                                            <div class="flex items-center justify-end gap-2">
                                                <button
                                                    class="rounded-lg p-2 text-content-subtle transition-all hover:bg-cyan-500/10 hover:text-cyan-400"
                                                    :title="t('common.edit')"
                                                    @click="openEditModal(user)"
                                                >
                                                    <Pencil class="h-4 w-4" />
                                                </button>

                                                <button
                                                    class="rounded-lg p-2 text-content-subtle transition-all hover:bg-rose-500/10 hover:text-rose-400"
                                                    :title="t('common.delete')"
                                                    @click="deleteTarget = user"
                                                >
                                                    <Trash2 class="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div v-if="totalItems > 10" class="flex items-center justify-between border-t border-divider p-4">
                            <p class="text-xs text-content-subtle">
                                {{ t('admin.settings.pagination', { page: currentPage, totalPages, totalItems }) }}
                            </p>

                            <div class="flex gap-2">
                                <CaButton
                                    variant="outline"
                                    size="sm"
                                    :disabled="currentPage <= 1"
                                    @click="fetchUsers(currentPage - 1, userSearch.trim())"
                                >
                                    {{ t('common.previous') }}
                                </CaButton>

                                <CaButton
                                    variant="outline"
                                    size="sm"
                                    :disabled="currentPage >= totalPages"
                                    @click="fetchUsers(currentPage + 1, userSearch.trim())"
                                >
                                    {{ t('common.next') }}
                                </CaButton>
                            </div>
                        </div>
                    </template>
                </div>
            </template>
        </div>

        <Modal :open="showUserModal" max-width="xl" @close="closeUserModal">
            <template #header>
                <div>
                    <h2 class="text-xl font-bold text-content">
                        {{ editingUser ? t('admin.settings.editModalTitle') : t('admin.settings.createModalTitle') }}
                    </h2>
                    <p class="mt-1 text-sm text-content-subtle">
                        {{ editingUser ? t('admin.settings.editModalSubtitle') : t('admin.settings.createModalSubtitle') }}
                    </p>
                </div>
            </template>

            <div class="space-y-5">
                <ErrorAlert v-if="usersError" :message="usersError" @dismiss="usersError = null" />

                <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <BaseInput
                        id="user-fullname"
                        :label="t('admin.settings.fields.fullName')"
                        v-model="userForm.full_name"
                        :placeholder="t('admin.settings.placeholders.fullName')"
                        required
                    />

                    <BaseInput
                        id="user-email"
                        :label="t('admin.settings.fields.email')"
                        type="email"
                        v-model="userForm.email"
                        :placeholder="t('admin.settings.placeholders.userEmail')"
                        required
                    />
                </div>

                <BaseInput
                    v-if="!editingUser"
                    id="user-password"
                    :label="t('admin.settings.fields.password')"
                    type="password"
                    v-model="userForm.password"
                    :placeholder="t('admin.settings.placeholders.password')"
                    required
                />

                <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <BaseInput
                        id="user-phone"
                        :label="t('admin.settings.fields.phoneNumber')"
                        v-model="userForm.phone_number"
                        :placeholder="t('admin.settings.placeholders.phoneNumber')"
                    />

                    <CaSelect
                        id="user-role"
                        :label="t('admin.settings.fields.role')"
                        :options="roleOptions"
                        :model-value="userForm.role"
                        @update:model-value="(value) => { userForm.role = String(value || 'assessee') }"
                    />
                </div>

                <div v-if="editingUser" class="rounded-2xl border border-divider bg-tint-subtle p-4">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p class="text-sm font-bold text-content">{{ t('admin.settings.activeStatusTitle') }}</p>
                            <p class="mt-1 text-xs text-content-subtle">{{ t('admin.settings.activeStatusHelp') }}</p>
                        </div>

                        <CaToggle id="user-active" v-model="userForm.is_active" :label="t('common.active')" />
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex items-center justify-end gap-3">
                    <CaButton variant="outline" size="sm" @click="closeUserModal">
                        {{ t('common.cancel') }}
                    </CaButton>
                    <CaButton variant="primary" size="sm" :loading="usersSaving" @click="handleSaveUser">
                        <Save class="mr-1.5 h-4 w-4" />
                        {{ editingUser ? t('admin.settings.saveUserEdit') : t('admin.settings.saveUser') }}
                    </CaButton>
                </div>
            </template>
        </Modal>

        <ConfirmDialog
            :open="!!deleteTarget"
            variant="danger"
            :title="t('admin.settings.deleteTitle')"
            :message="t('admin.settings.deleteMessage', { name: deleteTarget?.fullName || deleteTarget?.email || '' })"
            :confirm-label="t('admin.settings.confirmDelete')"
            :cancel-label="t('common.cancel')"
            :loading="usersSaving"
            @confirm="confirmDeleteUser"
            @cancel="deleteTarget = null"
        />
    </DashboardLayout>
</template>
