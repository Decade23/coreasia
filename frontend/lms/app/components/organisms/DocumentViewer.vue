<script setup lang="ts">
import { FileText, Image, Download, ExternalLink } from 'lucide-vue-next'
import type { VerificationDocumentDomain } from '~/types/verification'

defineProps<{
    documents: VerificationDocumentDomain[]
}>()

const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const isImage = (type: string) => type.startsWith('image/')
const isPdf = (type: string) => type === 'application/pdf'

const getIcon = (type: string) => {
    if (isImage(type)) return Image
    return FileText
}

const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
    <div class="space-y-3">
        <div
            v-for="doc in documents"
            :key="doc.id"
            class="flex items-center gap-4 p-4 rounded-xl bg-tint-subtle border border-divider hover:border-brand/20 transition-colors group"
        >
            <!-- File Icon -->
            <div class="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center"
                :class="isPdf(doc.type) ? 'bg-red-500/10 text-red-400' : isImage(doc.type) ? 'bg-blue-500/10 text-blue-400' : 'bg-tint text-content-subtle'">
                <component :is="getIcon(doc.type)" class="w-5 h-5" />
            </div>

            <!-- File Info -->
            <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-content truncate group-hover:text-brand transition-colors">{{ doc.name }}</p>
                <div class="flex items-center gap-3 mt-1 text-xs text-content-subtle">
                    <span>{{ formatFileSize(doc.fileSize) }}</span>
                    <span class="w-1 h-1 rounded-full bg-tint-strong" />
                    <span>{{ formatDate(doc.uploadedAt) }}</span>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    class="w-9 h-9 rounded-lg flex items-center justify-center text-content-subtle hover:text-brand hover:bg-brand/10 transition-all"
                    title="Preview"
                >
                    <ExternalLink class="w-4 h-4" />
                </button>
                <button
                    class="w-9 h-9 rounded-lg flex items-center justify-center text-content-subtle hover:text-brand hover:bg-brand/10 transition-all"
                    title="Download"
                >
                    <Download class="w-4 h-4" />
                </button>
            </div>
        </div>

        <div v-if="documents.length === 0" class="text-center py-8 text-content-subtle text-sm">
            Belum ada dokumen yang diunggah.
        </div>
    </div>
</template>
