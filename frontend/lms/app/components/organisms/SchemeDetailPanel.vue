<script setup lang="ts">
import { X, BookOpen, Users, Calendar, CheckCircle, XCircle } from 'lucide-vue-next'
import CaButton from '~/components/atoms/CaButton.vue'
import BaseBadge from '~/components/atoms/BaseBadge.vue'
import type { SchemeDomain } from '~/types/scheme'

const props = defineProps<{
    open: boolean
    scheme: SchemeDomain | null
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'edit', scheme: SchemeDomain): void
}>()

const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div v-if="open && scheme" class="fixed inset-0 z-[90] flex justify-end">
                <div class="absolute inset-0 bg-[#050814]/60 backdrop-blur-sm" @click="emit('close')" />

                <Transition
                    enter-active-class="transition duration-300 ease-out"
                    enter-from-class="translate-x-full"
                    enter-to-class="translate-x-0"
                    leave-active-class="transition duration-200 ease-in"
                    leave-from-class="translate-x-0"
                    leave-to-class="translate-x-full"
                >
                    <div v-if="open" class="relative w-full max-w-xl bg-[#0B1120] border-l border-white/5 h-full overflow-y-auto z-10">
                        <!-- Header -->
                        <div class="sticky top-0 bg-[#0B1120]/95 backdrop-blur-md z-20 p-6 border-b border-white/5">
                            <div class="flex items-center justify-between">
                                <div>
                                    <span class="text-[10px] font-black text-brand uppercase tracking-widest">{{ scheme.code }}</span>
                                    <h2 class="text-xl font-bold text-white mt-1">{{ scheme.name }}</h2>
                                </div>
                                <button
                                    class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-content-subtle hover:text-white hover:bg-white/10 transition-all"
                                    @click="emit('close')"
                                >
                                    <X class="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div class="p-6 space-y-6">
                            <!-- Status & Meta -->
                            <div class="flex items-center gap-3">
                                <BaseBadge
                                    :text="scheme.isActive ? 'Aktif' : 'Draft'"
                                    :variant="scheme.isActive ? 'success' : 'default'"
                                />
                                <span class="text-xs text-content-subtle">
                                    Berlaku {{ scheme.validityYears }} tahun
                                </span>
                            </div>

                            <!-- Description -->
                            <div>
                                <h3 class="text-xs font-black uppercase tracking-widest text-content-subtle mb-2">Deskripsi</h3>
                                <p class="text-sm text-content-muted leading-relaxed">{{ scheme.description }}</p>
                            </div>

                            <!-- Stats -->
                            <div class="grid grid-cols-2 gap-4">
                                <div class="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div class="flex items-center gap-2 mb-2">
                                        <BookOpen class="w-4 h-4 text-brand" />
                                        <span class="text-xs font-black uppercase tracking-widest text-content-subtle">Unit Kompetensi</span>
                                    </div>
                                    <p class="text-2xl font-black text-white">{{ scheme.unitCount }}</p>
                                </div>
                                <div class="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div class="flex items-center gap-2 mb-2">
                                        <Users class="w-4 h-4 text-brand-secondary" />
                                        <span class="text-xs font-black uppercase tracking-widest text-content-subtle">Total Asesi</span>
                                    </div>
                                    <p class="text-2xl font-black text-white">{{ scheme.assesseeCount }}</p>
                                </div>
                            </div>

                            <!-- Unit Kompetensi List -->
                            <div>
                                <h3 class="text-xs font-black uppercase tracking-widest text-content-subtle mb-3">Unit Kompetensi</h3>
                                <div class="space-y-2">
                                    <div
                                        v-for="unit in scheme.units"
                                        :key="unit.id"
                                        class="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-brand/20 transition-colors"
                                    >
                                        <div class="flex items-start justify-between">
                                            <div class="flex-1 min-w-0">
                                                <span class="text-[10px] font-black text-brand/70 uppercase tracking-wider">{{ unit.code }}</span>
                                                <p class="text-sm font-medium text-white mt-0.5">{{ unit.title }}</p>
                                            </div>
                                            <span class="text-[10px] font-black text-content-subtle uppercase tracking-widest shrink-0 ml-3 mt-1">
                                                {{ unit.elementCount }} elemen
                                            </span>
                                        </div>
                                    </div>
                                    <div v-if="scheme.units.length === 0" class="text-center py-8 text-content-subtle text-sm">
                                        Belum ada unit kompetensi
                                    </div>
                                </div>
                            </div>

                            <!-- Dates -->
                            <div class="flex items-center gap-6 text-xs text-content-subtle pt-4 border-t border-white/5">
                                <div class="flex items-center gap-1.5">
                                    <Calendar class="w-3.5 h-3.5" />
                                    Dibuat {{ formatDate(scheme.createdAt) }}
                                </div>
                                <div class="flex items-center gap-1.5">
                                    <Calendar class="w-3.5 h-3.5" />
                                    Diperbarui {{ formatDate(scheme.updatedAt) }}
                                </div>
                            </div>

                            <!-- Actions -->
                            <div class="flex items-center gap-3">
                                <CaButton variant="primary" class="flex-1 justify-center" @click="emit('edit', scheme)">
                                    Edit Skema
                                </CaButton>
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>
