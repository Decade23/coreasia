<script setup lang="ts">
import type { AuditLogDomain } from '~/types/quality'

defineProps<{
    logs: AuditLogDomain[]
    getActionIcon: (action: string) => string
}>()

const getActionColor = (action: string) => {
    switch (action) {
        case 'approve': return 'text-emerald-400'
        case 'reject': return 'text-red-400'
        case 'create': return 'text-brand'
        case 'update': return 'text-amber-400'
        case 'delete': return 'text-red-400'
        case 'submit': return 'text-blue-400'
        case 'login': return 'text-purple-400'
        default: return 'text-content-muted'
    }
}

const getActionLabel = (action: string) => {
    switch (action) {
        case 'login': return 'Login'
        case 'create': return 'Buat'
        case 'update': return 'Ubah'
        case 'delete': return 'Hapus'
        case 'approve': return 'Setujui'
        case 'reject': return 'Tolak'
        case 'submit': return 'Kirim'
        case 'review': return 'Review'
        default: return action
    }
}

const getRoleBadge = (role: string) => {
    switch (role) {
        case 'admin': return 'bg-brand/10 text-brand border-brand/20'
        case 'assessor': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        case 'assessee': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        case 'quality_manager': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        default: return 'bg-core-700/50 text-content-muted border-core-600'
    }
}
</script>

<template>
    <div class="ca-card overflow-hidden !rounded-[2rem] p-0">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-core-900/80 border-b border-divider">
                        <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest pl-6">Waktu</th>
                        <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest">Pengguna</th>
                        <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest">Aksi</th>
                        <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest hidden lg:table-cell">Deskripsi</th>
                        <th class="p-4 text-xs font-black text-content-subtle uppercase tracking-widest hidden xl:table-cell pr-6">IP Address</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-divider">
                    <tr v-for="log in logs" :key="log.id" class="hover:bg-core-800 transition-colors">
                        <td class="p-4 pl-6 whitespace-nowrap">
                            <div class="text-sm text-content font-medium">
                                {{ log.timestamp.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) }}
                            </div>
                            <div class="text-xs text-content-subtle">
                                {{ log.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }}
                            </div>
                        </td>
                        <td class="p-4">
                            <div class="text-sm font-bold text-content">{{ log.userName }}</div>
                            <span
                                class="mt-1 inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border"
                                :class="getRoleBadge(log.userRole)"
                            >
                                {{ log.userRole.replace('_', ' ') }}
                            </span>
                        </td>
                        <td class="p-4">
                            <div class="flex items-center gap-2">
                                <span class="text-base">{{ getActionIcon(log.action) }}</span>
                                <span class="text-sm font-bold" :class="getActionColor(log.action)">
                                    {{ getActionLabel(log.action) }}
                                </span>
                            </div>
                            <div v-if="log.resourceId" class="text-xs text-content-subtle mt-0.5 font-mono">
                                {{ log.resource }}/{{ log.resourceId }}
                            </div>
                        </td>
                        <td class="p-4 hidden lg:table-cell">
                            <p class="text-sm text-content-muted max-w-xs truncate">{{ log.description }}</p>
                        </td>
                        <td class="p-4 hidden xl:table-cell pr-6">
                            <span class="text-xs font-mono text-content-subtle">{{ log.ipAddress }}</span>
                        </td>
                    </tr>
                    <tr v-if="logs.length === 0">
                        <td colspan="5" class="p-8 text-center text-content-subtle text-sm">
                            Tidak ada log aktivitas.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
