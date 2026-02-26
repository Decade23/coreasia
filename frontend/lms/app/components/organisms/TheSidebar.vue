<script setup lang="ts">
import {
    LayoutDashboard, Settings, LogOut, X, Box, BookOpen, Layers,
    CheckCircle, Calendar, UserCheck, Award, BarChart3, ClipboardList,
    FileBarChart, ShieldCheck
} from 'lucide-vue-next'
import { computed } from 'vue'
import { useAuth } from '~/composables/useAuth'

interface MenuItem {
    label: string
    icon: any
    to: string
}

interface MenuSection {
    title?: string
    items: MenuItem[]
}

defineProps({
    isOpen: {
        type: Boolean,
        required: true
    }
})

const emit = defineEmits<{
    (e: 'close'): void
}>()

const { user, logout } = useAuth()

const menuSections = computed<MenuSection[]>(() => {
    const role = user.value?.role

    if (role === 'admin' || role === 'super_admin') {
        return [
            {
                items: [
                    { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
                ]
            },
            {
                title: 'Sertifikasi',
                items: [
                    { label: 'Manajemen Skema', icon: Layers, to: '/admin/schemes' },
                    { label: 'Bank Soal', icon: BookOpen, to: '/admin/questions' },
                    { label: 'Penjadwalan', icon: Calendar, to: '/admin/schedules' },
                    { label: 'Verifikasi Berkas', icon: CheckCircle, to: '/admin/verifications' },
                ]
            },
            {
                title: 'Manajemen',
                items: [
                    { label: 'Asesor', icon: UserCheck, to: '/admin/assessors' },
                    { label: 'Template Sertifikat', icon: Award, to: '/admin/templates' },
                    { label: 'Manajemen Mutu', icon: BarChart3, to: '/admin/quality' },
                ]
            },
            {
                title: 'Pelaporan',
                items: [
                    { label: 'Laporan & Export', icon: FileBarChart, to: '/admin/reports' },
                    { label: 'Log Aktivitas', icon: ClipboardList, to: '/admin/quality/audit-trail' },
                    { label: 'Pengaturan', icon: Settings, to: '/admin/settings' },
                ]
            },
        ]
    }

    if (role === 'quality_manager') {
        return [
            {
                items: [
                    { label: 'Dashboard Mutu', icon: BarChart3, to: '/admin/quality' },
                ]
            },
            {
                title: 'Quality Control',
                items: [
                    { label: 'Review Asesor', icon: UserCheck, to: '/admin/quality/reviews' },
                    { label: 'Verifikasi Berkas', icon: CheckCircle, to: '/admin/verifications' },
                    { label: 'Audit Trail', icon: ClipboardList, to: '/admin/quality/audit-trail' },
                ]
            },
        ]
    }

    if (role === 'assessor') {
        return [
            {
                items: [
                    { label: 'Antrean Penilaian', icon: LayoutDashboard, to: '/assessor' },
                    { label: 'Jadwal Saya', icon: Calendar, to: '/assessor/schedules' },
                ]
            },
        ]
    }

    if (role === 'assessee') {
        return [
            {
                items: [
                    { label: 'Portal Asesi', icon: LayoutDashboard, to: '/assessee' },
                    { label: 'Pendaftaran Ujian', icon: Box, to: '/registration' },
                    { label: 'Sertifikat Saya', icon: ShieldCheck, to: '/assessee/certificates' },
                    { label: 'Pengaturan Akun', icon: Settings, to: '/assessee/settings' },
                ]
            },
        ]
    }

    return [{ items: [{ label: 'Beranda', icon: LayoutDashboard, to: '/' }] }]
})
</script>

<template>
    <aside
        class="fixed inset-y-0 left-0 z-50 w-[272px] shrink-0 transform transition-transform duration-500 ease-out lg:translate-x-0 lg:relative h-screen flex flex-col"
        :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
    >
        <!-- Glass background (mobile) + solid (desktop) -->
        <div class="absolute inset-0 bg-core-800/95 backdrop-blur-2xl lg:bg-core-800/40 lg:backdrop-blur-none border-r border-divider" />

        <!-- Content -->
        <div class="relative z-10 flex flex-col h-full">
            <!-- Logo Area -->
            <div class="h-16 lg:h-[72px] flex items-center justify-between px-6 shrink-0">
                <NuxtLink to="/" class="flex items-center gap-3 group">
                    <div class="w-9 h-9 rounded-xl bg-linear-to-br from-brand-400 to-brand-600 flex items-center justify-center font-black text-slate-950 text-lg shadow-glow-cyan-card group-hover:scale-105 transition-transform duration-300">
                        C
                    </div>
                    <div>
                        <span class="font-bold text-lg tracking-tight text-content block leading-none">CoreAsia</span>
                        <span class="text-[9px] text-content-faint font-bold uppercase tracking-[0.2em]">LMS Platform</span>
                    </div>
                </NuxtLink>

                <button
                    @click="emit('close')"
                    class="lg:hidden p-2 rounded-xl text-content-subtle hover:bg-tint hover:text-content transition-all"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- Navigation -->
            <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                <template v-for="(section, sIdx) in menuSections" :key="sIdx">
                    <!-- Section divider + title -->
                    <div v-if="section.title" class="pt-5 pb-2 px-3 first:pt-0">
                        <div class="border-t border-divider mb-3" />
                        <span class="text-[10px] font-black uppercase tracking-[0.15em] text-content-faint">{{ section.title }}</span>
                    </div>

                    <!-- Menu items -->
                    <NuxtLink
                        v-for="item in section.items"
                        :key="item.to"
                        :to="item.to"
                        @click="emit('close')"
                        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-content-subtle font-semibold hover:text-content hover:bg-tint-subtle transition-all duration-200 group relative"
                        active-class="!bg-brand/10 !text-brand-400 font-bold"
                    >
                        <!-- Active indicator -->
                        <div class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-brand opacity-0 transition-all duration-200 shadow-glow-cyan-strong group-[.router-link-active]:opacity-100" />

                        <component
                            :is="item.icon"
                            class="w-[18px] h-[18px] transition-colors duration-200 shrink-0 group-hover:text-content-muted group-[.router-link-active]:text-brand-400"
                        />
                        <span class="truncate">{{ item.label }}</span>
                    </NuxtLink>
                </template>
            </nav>

            <!-- Footer -->
            <div class="p-4 shrink-0">
                <div class="border-t border-divider pt-4">
                    <button
                        @click="logout"
                        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-content-subtle font-semibold hover:bg-red-500/10 hover:text-red-400 transition-all group"
                    >
                        <LogOut class="w-[18px] h-[18px] text-content-faint group-hover:text-red-400 transition-colors" />
                        <span>Keluar</span>
                    </button>
                </div>

                <p class="text-[9px] text-content-faint text-center mt-3">v1.0.0 &copy; 2026 CoreAsia</p>
            </div>
        </div>
    </aside>
</template>
