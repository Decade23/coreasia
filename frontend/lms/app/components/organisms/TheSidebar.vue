<script setup lang="ts">
import {
    LayoutDashboard,
    Settings,
    LogOut,
    X,
    Box,
    BookOpen,
    Layers,
    CheckCircle,
    Calendar,
    UserCheck,
    Award,
    BarChart3,
    ClipboardList,
    FileBarChart,
    ShieldCheck,
} from 'lucide-vue-next'
import { computed } from 'vue'
import { useAuth } from '~/composables/useAuth'

interface MenuItem {
    labelKey: string
    icon: any
    to: string
}

interface MenuSection {
    titleKey?: string
    items: MenuItem[]
}

defineProps({
    isOpen: {
        type: Boolean,
        required: true,
    },
})

const emit = defineEmits<{
    (e: 'close'): void
}>()

const { user, logout } = useAuth()
const { t } = useI18n()

const menuSections = computed<MenuSection[]>(() => {
    const role = user.value?.role

    if (role === 'admin' || role === 'super_admin') {
        return [
            {
                items: [{ labelKey: 'nav.dashboard', icon: LayoutDashboard, to: '/admin' }],
            },
            {
                titleKey: 'navGroups.certification',
                items: [
                    { labelKey: 'nav.schemes', icon: Layers, to: '/admin/schemes' },
                    { labelKey: 'nav.questions', icon: BookOpen, to: '/admin/questions' },
                    { labelKey: 'nav.schedules', icon: Calendar, to: '/admin/schedules' },
                    { labelKey: 'nav.verifications', icon: CheckCircle, to: '/admin/verifications' },
                ],
            },
            {
                titleKey: 'navGroups.management',
                items: [
                    { labelKey: 'nav.assessors', icon: UserCheck, to: '/admin/assessors' },
                    { labelKey: 'nav.templates', icon: Award, to: '/admin/templates' },
                    { labelKey: 'nav.quality', icon: BarChart3, to: '/admin/quality' },
                ],
            },
            {
                titleKey: 'navGroups.reporting',
                items: [
                    { labelKey: 'nav.reports', icon: FileBarChart, to: '/admin/reports' },
                    { labelKey: 'nav.auditTrail', icon: ClipboardList, to: '/admin/quality/audit-trail' },
                    { labelKey: 'nav.settings', icon: Settings, to: '/admin/settings' },
                ],
            },
        ]
    }

    if (role === 'quality_manager') {
        return [
            {
                items: [{ labelKey: 'nav.qualityDashboard', icon: BarChart3, to: '/admin/quality' }],
            },
            {
                titleKey: 'navGroups.qualityControl',
                items: [
                    { labelKey: 'nav.reviews', icon: UserCheck, to: '/admin/quality/reviews' },
                    { labelKey: 'nav.verifications', icon: CheckCircle, to: '/admin/verifications' },
                    { labelKey: 'nav.auditTrail', icon: ClipboardList, to: '/admin/quality/audit-trail' },
                ],
            },
        ]
    }

    if (role === 'assessor') {
        return [
            {
                items: [
                    { labelKey: 'nav.assessmentQueue', icon: LayoutDashboard, to: '/assessor' },
                    { labelKey: 'nav.mySchedules', icon: Calendar, to: '/assessor/schedules' },
                ],
            },
        ]
    }

    if (role === 'assessee') {
        return [
            {
                items: [
                    { labelKey: 'nav.portal', icon: LayoutDashboard, to: '/assessee' },
                    { labelKey: 'nav.registration', icon: Box, to: '/registration' },
                    { labelKey: 'nav.certificates', icon: ShieldCheck, to: '/assessee/certificates' },
                    { labelKey: 'nav.accountSettings', icon: Settings, to: '/assessee/settings' },
                ],
            },
        ]
    }

    return [{ items: [{ labelKey: 'nav.home', icon: LayoutDashboard, to: '/' }] }]
})

const userDisplayName = computed(() => user.value?.fullName || user.value?.email || 'CoreAsia User')

const userDisplayRole = computed(() => {
    switch (user.value?.role) {
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
            return t('role.user')
    }
})
</script>

<template>
    <aside
        aria-label="Sidebar"
        class="fixed inset-y-0 left-0 z-50 flex h-screen w-[272px] shrink-0 transform flex-col transition-transform duration-500 ease-out lg:relative lg:translate-x-0"
        :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
    >
        <div class="absolute inset-0 border-r border-divider bg-core-800/95 backdrop-blur-2xl lg:bg-core-800/40 lg:backdrop-blur-none" />

        <div class="relative z-10 flex h-full flex-col">
            <div class="flex h-16 shrink-0 items-center justify-between px-6 lg:h-[72px]">
                <NuxtLink to="/" class="group flex items-center gap-3">
                    <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-brand-400 to-brand-600 text-lg font-black text-slate-950 shadow-glow-cyan-card transition-transform duration-300 group-hover:scale-105">
                        C
                    </div>
                    <div>
                        <span class="block leading-none font-bold tracking-tight text-content text-lg">CoreAsia</span>
                        <span class="text-[9px] font-bold uppercase tracking-[0.2em] text-content-faint">LMS Platform</span>
                    </div>
                </NuxtLink>

                <button
                    class="rounded-xl p-2 text-content-subtle transition-all hover:bg-tint hover:text-content lg:hidden"
                    :aria-label="t('common.close')"
                    @click="emit('close')"
                >
                    <X class="h-5 w-5" />
                </button>
            </div>

            <nav aria-label="Menu utama" class="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-4">
                <template v-for="(section, sectionIndex) in menuSections" :key="sectionIndex">
                    <div v-if="section.titleKey" class="px-3 pb-2 pt-5 first:pt-0">
                        <div class="mb-3 border-t border-divider" />
                        <span class="text-[10px] font-black uppercase tracking-[0.15em] text-content-faint">
                            {{ t(section.titleKey) }}
                        </span>
                    </div>

                    <NuxtLink
                        v-for="item in section.items"
                        :key="item.to"
                        :to="item.to"
                        class="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-content-subtle transition-all duration-200 hover:bg-tint-subtle hover:text-content"
                        active-class="bg-brand/10 text-brand font-bold"
                        @click="emit('close')"
                    >
                        <div class="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand opacity-0 transition-all duration-200 shadow-glow-cyan-strong group-[.router-link-active]:opacity-100" />

                        <component
                            :is="item.icon"
                            class="h-[18px] w-[18px] shrink-0 transition-colors duration-200 group-hover:text-content-muted group-[.router-link-active]:text-brand"
                        />

                        <span class="truncate">{{ t(item.labelKey) }}</span>
                    </NuxtLink>
                </template>
            </nav>

            <div class="shrink-0 p-4">
                <div class="rounded-2xl border border-divider bg-core-900/70 p-4">
                    <p class="truncate text-sm font-bold text-content">{{ userDisplayName }}</p>
                    <p class="truncate text-xs text-content-subtle">{{ user.value?.email || userDisplayRole }}</p>
                    <p class="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-content-faint">{{ userDisplayRole }}</p>
                </div>

                <div class="border-t border-divider pt-4 mt-4">
                    <button
                        class="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-content-subtle transition-all hover:bg-red-500/10 hover:text-red-400"
                        @click="logout"
                    >
                        <LogOut class="h-[18px] w-[18px] text-content-faint transition-colors group-hover:text-red-400" />
                        <span>{{ t('auth.logout') }}</span>
                    </button>
                </div>

                <p class="mt-3 text-center text-[9px] text-content-faint">v1.0.0 &copy; 2026 CoreAsia</p>
            </div>
        </div>
    </aside>
</template>
