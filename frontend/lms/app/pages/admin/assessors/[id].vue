<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import AssessorFormModal from '~/components/organisms/AssessorFormModal.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import { ArrowLeft, Shield, Mail, Phone, Calendar, Award, BookOpen, Edit } from 'lucide-vue-next'
import { useAssessors } from '~/composables/useAssessors'
import type { AssessorFormData } from '~/types/assessor-profile'

const route = useRoute()
const id = route.params.id as string

const {
    currentAssessor: assessor, loading, saving, error,
    fetchAssessor, updateAssessor,
    getLicenseStatusColor, getLicenseStatusLabel,
} = useAssessors()

const showFormModal = ref(false)

onMounted(() => fetchAssessor(id))

const handleEdit = () => {
    showFormModal.value = true
}

const handleSubmitForm = async (data: AssessorFormData) => {
    const success = await updateAssessor(id, data)
    if (success) {
        showFormModal.value = false
        await fetchAssessor(id)
    }
}
</script>

<template>
    <DashboardLayout>
        <template #header>
            <div class="flex items-center gap-4 w-full">
                <NuxtLink to="/admin/assessors" class="w-10 h-10 rounded-xl bg-tint flex items-center justify-center text-content-subtle hover:text-content hover:bg-tint-hover transition-all shrink-0">
                    <ArrowLeft class="w-5 h-5" />
                </NuxtLink>
                <div class="flex-1 min-w-0">
                    <h1 class="text-xl md:text-3xl font-black tracking-tight text-content truncate">
                        {{ assessor?.fullName || 'Detail Asesor' }}
                    </h1>
                    <p class="text-sm text-content-subtle hidden md:block mt-1">Profil lengkap, lisensi, dan riwayat asesmen.</p>
                </div>
                <CaButton v-if="assessor" variant="outline" @click="handleEdit" class="shrink-0">
                    <Edit class="w-4 h-4 mr-1.5" />
                    Edit
                </CaButton>
            </div>
        </template>

        <div class="py-6 space-y-6">
            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" label="Memuat detail asesor..." />
            </div>

            <template v-else-if="assessor">
                <!-- Profile & License Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Profile Card -->
                    <div class="lg:col-span-2 ca-card p-0 overflow-hidden">
                        <div class="p-6 border-b border-divider">
                            <h2 class="text-sm font-bold text-content-subtle uppercase tracking-widest">Informasi Profil</h2>
                        </div>
                        <div class="p-6 space-y-5">
                            <div class="flex items-center gap-4">
                                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand/20 to-brand-secondary/20 flex items-center justify-center text-brand font-black text-2xl shrink-0">
                                    {{ assessor.fullName.charAt(0) }}
                                </div>
                                <div>
                                    <h3 class="text-xl font-bold text-content">{{ assessor.fullName }}</h3>
                                    <p class="text-sm text-content-muted">{{ assessor.specialization }}</p>
                                    <div class="flex items-center gap-2 mt-1">
                                        <span
                                            class="w-2 h-2 rounded-full"
                                            :class="assessor.isActive ? 'bg-emerald-500' : 'bg-red-500/50'"
                                        />
                                        <span class="text-xs text-content-subtle">{{ assessor.isActive ? 'Aktif' : 'Nonaktif' }}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div class="flex items-center gap-3 p-3 rounded-xl bg-tint">
                                    <Mail class="w-4 h-4 text-content-subtle shrink-0" />
                                    <div>
                                        <p class="text-xs text-content-subtle">Email</p>
                                        <p class="text-sm text-content font-medium">{{ assessor.email }}</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3 p-3 rounded-xl bg-tint">
                                    <Phone class="w-4 h-4 text-content-subtle shrink-0" />
                                    <div>
                                        <p class="text-xs text-content-subtle">Telepon</p>
                                        <p class="text-sm text-content font-medium">{{ assessor.phoneNumber }}</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3 p-3 rounded-xl bg-tint">
                                    <Calendar class="w-4 h-4 text-content-subtle shrink-0" />
                                    <div>
                                        <p class="text-xs text-content-subtle">Bergabung</p>
                                        <p class="text-sm text-content font-medium">{{ assessor.createdAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3 p-3 rounded-xl bg-tint">
                                    <Award class="w-4 h-4 text-content-subtle shrink-0" />
                                    <div>
                                        <p class="text-xs text-content-subtle">Asesmen Selesai</p>
                                        <p class="text-sm text-content font-medium">{{ assessor.completedAssessments }} / {{ assessor.totalAssessments }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- License Card -->
                    <div class="ca-card p-0 overflow-hidden">
                        <div class="p-6 border-b border-divider">
                            <h2 class="text-sm font-bold text-content-subtle uppercase tracking-widest">Lisensi BNSP</h2>
                        </div>
                        <div class="p-6">
                            <template v-if="assessor.license">
                                <div class="space-y-4">
                                    <div class="flex items-center justify-between">
                                        <Shield class="w-8 h-8 text-brand" />
                                        <span
                                            class="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border"
                                            :class="getLicenseStatusColor(assessor.license.status)"
                                        >
                                            {{ getLicenseStatusLabel(assessor.license.status) }}
                                        </span>
                                    </div>
                                    <div>
                                        <p class="text-xs text-content-subtle">No. Lisensi</p>
                                        <p class="text-lg font-bold text-content font-mono">{{ assessor.license.licenseNumber }}</p>
                                    </div>
                                    <div>
                                        <p class="text-xs text-content-subtle">Diterbitkan Oleh</p>
                                        <p class="text-sm font-medium text-content">{{ assessor.license.issuedBy }}</p>
                                    </div>
                                    <div class="grid grid-cols-2 gap-3">
                                        <div>
                                            <p class="text-xs text-content-subtle">Terbit</p>
                                            <p class="text-sm text-content">{{ assessor.license.issuedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}</p>
                                        </div>
                                        <div>
                                            <p class="text-xs text-content-subtle">Berakhir</p>
                                            <p class="text-sm text-content">{{ assessor.license.expiryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}</p>
                                        </div>
                                    </div>
                                </div>
                            </template>
                            <template v-else>
                                <div class="text-center py-6">
                                    <Shield class="w-10 h-10 text-content-subtle mx-auto mb-3 opacity-30" />
                                    <p class="text-sm text-content-subtle">Belum ada data lisensi</p>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>

                <!-- Assigned Schemes -->
                <div class="ca-card p-0 overflow-hidden">
                    <div class="p-6 border-b border-divider">
                        <h2 class="text-sm font-bold text-content-subtle uppercase tracking-widest">Skema yang Ditugaskan ({{ assessor.assignedSchemes.length }})</h2>
                    </div>
                    <div v-if="assessor.assignedSchemes.length > 0" class="divide-y divide-divider">
                        <div
                            v-for="scheme in assessor.assignedSchemes"
                            :key="scheme.schemeId"
                            class="flex items-center justify-between p-5 hover:bg-core-800 transition-colors"
                        >
                            <div class="flex items-center gap-3">
                                <BookOpen class="w-5 h-5 text-brand shrink-0" />
                                <div>
                                    <p class="text-sm font-bold text-content">{{ scheme.schemeName }}</p>
                                    <p class="text-xs text-content-subtle font-mono">{{ scheme.schemeCode }}</p>
                                </div>
                            </div>
                            <span class="text-xs text-content-subtle">
                                Ditugaskan: {{ scheme.assignedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
                            </span>
                        </div>
                    </div>
                    <div v-else class="p-8 text-center text-content-subtle text-sm">
                        Belum ada skema yang ditugaskan.
                    </div>
                </div>
            </template>
        </div>

        <AssessorFormModal
            :open="showFormModal"
            :assessor="assessor"
            :saving="saving"
            @close="showFormModal = false"
            @submit="handleSubmitForm"
        />
    </DashboardLayout>
</template>
