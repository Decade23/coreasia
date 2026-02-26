<script setup lang="ts">
import { ChevronRight, Home } from 'lucide-vue-next'

export interface BreadcrumbItem {
    label: string
    to?: string
}

defineProps<{
    items: BreadcrumbItem[]
}>()
</script>

<template>
    <nav class="flex items-center gap-1.5 text-sm">
        <NuxtLink to="/" class="text-content-subtle hover:text-content transition-colors">
            <Home class="w-4 h-4" />
        </NuxtLink>
        <template v-for="(item, index) in items" :key="index">
            <ChevronRight class="w-3.5 h-3.5 text-content-subtle/50" />
            <NuxtLink
                v-if="item.to && index < items.length - 1"
                :to="item.to"
                class="text-content-subtle hover:text-content transition-colors font-medium"
            >
                {{ item.label }}
            </NuxtLink>
            <span v-else class="text-content font-bold">{{ item.label }}</span>
        </template>
    </nav>
</template>
