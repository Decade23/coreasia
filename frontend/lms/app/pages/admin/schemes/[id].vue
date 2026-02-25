<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import BaseBadge from '~/components/atoms/BaseBadge.vue'
import LoadingSpinner from '~/components/atoms/LoadingSpinner.vue'
import ErrorAlert from '~/components/atoms/ErrorAlert.vue'
import SchemeFormModal from '~/components/organisms/SchemeFormModal.vue'
import { ArrowLeft, BookOpen, Users, Layers, Edit3 } from 'lucide-vue-next'
import { useSchemes } from '~/composables/useSchemes'
import type { SchemeFormData } from '~/types/scheme'

const route = useRoute()
const schemeId = route.params.id as string

const { currentScheme, loading, saving, error, fetchScheme, updateScheme } = useSchemes()

const showEditModal = ref(false)

onMounted(() => fetchScheme(schemeId))

const handleUpdate = async (data: SchemeFormData) => {
    const success = await updateScheme(schemeId, data)
    if (success) {
        showEditModal.value = false
        await fetchScheme(schemeId)
    }
}

const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
    <DashboardLayout>
        <template #header>
            <div class="flex items-center gap-4 w-full">
                <NuxtLink to="/admin/schemes" class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-content-subtle hover:text-white hover:bg-white/10 transition-all shrink-0">
                    <ArrowLeft class="w-5 h-5" />
                </NuxtLink>
                <div class="flex-1 min-w-0">
                    <h1 class="text-xl md:text-2xl font-bold text-white truncate">
                        {{ currentScheme?.name || 'Detail Skema' }}
                    </h1>
                    <p v-if="currentScheme" class="text-xs text-brand font-black uppercase tracking-widest mt-0.5">{{ currentScheme.code }}</p>
                </div>
                <CaButton v-if="currentScheme" variant="outline" @click="showEditModal = true">
                    <Edit3 class="w-4 h-4 mr-2" />
                    Edit
                </CaButton>
            </div>
        </template>

        <div class="py-6 space-y-8">
            <!-- Error -->
            <ErrorAlert v-if="error" :message="error" @dismiss="error = null" />

            <!-- Loading -->
            <div v-if="loading" class="flex justify-center py-20">
                <LoadingSpinner size="lg" label="Memuat detail skema..." />
            </div>

            <template v-else-if="currentScheme">
                <!-- Meta Cards -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="ca-card p-5">
                        <div class="flex items-center gap-2 mb-2">
                            <BookOpen class="w-4 h-4 text-brand" />
                            <span class="text-[10px] font-black uppercase tracking-widest text-content-subtle">Unit</span>
                        </div>
                        <p class="text-3xl font-black text-white">{{ currentScheme.unitCount }}</p>
                    </div>
                    <div class="ca-card p-5">
                        <div class="flex items-center gap-2 mb-2">
                            <Users class="w-4 h-4 text-brand-secondary" />
                            <span class="text-[10px] font-black uppercase tracking-widest text-content-subtle">Asesi</span>
                        </div>
                        <p class="text-3xl font-black text-white">{{ currentScheme.assesseeCount }}</p>
                    </div>
                    <div class="ca-card p-5">
                        <div class="flex items-center gap-2 mb-2">
                            <Layers class="w-4 h-4 text-purple-400" />
                            <span class="text-[10px] font-black uppercase tracking-widest text-content-subtle">Validitas</span>
                        </div>
                        <p class="text-3xl font-black text-white">{{ currentScheme.validityYears }}<span class="text-sm text-content-subtle ml-1">tahun</span></p>
                    </div>
                    <div class="ca-card p-5">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-[10px] font-black uppercase tracking-widest text-content-subtle">Status</span>
                        </div>
                        <BaseBadge
                            :text="currentScheme.isActive ? 'Aktif' : 'Draft'"
                            :variant="currentScheme.isActive ? 'success' : 'default'"
                        />
                    </div>
                </div>

                <!-- Description -->
                <div class="ca-card p-6">
                    <h3 class="text-xs font-black uppercase tracking-widest text-content-subtle mb-3">Deskripsi</h3>
                    <p class="text-sm text-content-muted leading-relaxed">{{ currentScheme.description }}</p>
                </div>

                <!-- Unit Kompetensi Tree -->
                <div class="ca-card p-6">
                    <h3 class="text-xs font-black uppercase tracking-widest text-content-subtle mb-4">Unit Kompetensi</h3>
                    <div class="space-y-3">
                        <div
                            v-for="(unit, idx) in currentScheme.units"
                            :key="unit.id"
                            class="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-brand/20 transition-colors group"
                        >
                            <div class="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 text-brand font-black text-sm group-hover:bg-brand/20 transition-colors">
                                {{ idx + 1 }}
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-[10px] font-black text-brand/70 uppercase tracking-wider">{{ unit.code }}</p>
                                <p class="text-sm font-bold text-white mt-0.5">{{ unit.title }}</p>
                                <p class="text-xs text-content-subtle mt-1">{{ unit.elementCount }} elemen kompetensi</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Meta Info -->
                <div class="flex items-center gap-6 text-xs text-content-subtle">
                    <span>Dibuat {{ formatDate(currentScheme.createdAt) }}</span>
                    <span>Terakhir diperbarui {{ formatDate(currentScheme.updatedAt) }}</span>
                </div>
            </template>
        </div>

        <!-- Edit Modal -->
        <SchemeFormModal
            :open="showEditModal"
            :scheme="currentScheme"
            :saving="saving"
            @close="showEditModal = false"
            @submit="handleUpdate"
        />
    </DashboardLayout>
</template>
