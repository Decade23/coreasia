<script setup lang="ts">
import { FileText, Type, Calendar, Image, QrCode } from 'lucide-vue-next'
import type { CertificateTemplateDomain, CertificateFieldDomain } from '~/types/certificate'

defineProps<{
    template: CertificateTemplateDomain
}>()

const getFieldIcon = (type: string) => {
    switch (type) {
        case 'text': return Type
        case 'date': return Calendar
        case 'image': return Image
        case 'qr_code': return QrCode
        default: return FileText
    }
}

const getFieldTypeLabel = (type: string) => {
    switch (type) {
        case 'text': return 'Teks'
        case 'date': return 'Tanggal'
        case 'image': return 'Gambar'
        case 'qr_code': return 'QR Code'
        default: return type
    }
}
</script>

<template>
    <div class="space-y-6">
        <!-- Preview Canvas -->
        <div class="relative aspect-[1.414/1] bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <!-- Certificate Mock Background -->
            <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center space-y-3 px-8">
                    <div class="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto">
                        <FileText class="w-8 h-8 text-brand" />
                    </div>
                    <h3 class="text-lg font-bold text-white">{{ template.name }}</h3>
                    <p class="text-sm text-content-subtle">{{ template.schemeName }}</p>
                </div>
            </div>

            <!-- Field Markers -->
            <div
                v-for="field in template.fields"
                :key="field.key"
                class="absolute flex items-center gap-1.5 px-2 py-1 rounded-lg bg-brand/20 border border-brand/30 text-xs text-brand cursor-default hover:bg-brand/30 transition-colors group"
                :style="{
                    left: `${field.position.x}%`,
                    top: `${field.position.y}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${Math.max(10, Math.min(field.fontSize * 0.6, 14))}px`,
                }"
            >
                <component :is="getFieldIcon(field.type)" class="w-3 h-3" />
                <span class="whitespace-nowrap">{{ field.label }}</span>
            </div>

            <!-- Default Badge -->
            <div v-if="template.isDefault" class="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-brand/20 text-brand text-[10px] font-black uppercase tracking-widest border border-brand/30">
                Default
            </div>
        </div>

        <!-- Field List -->
        <div>
            <h4 class="text-sm font-bold text-content-subtle uppercase tracking-widest mb-3">
                Field Template ({{ template.fields.length }})
            </h4>
            <div class="space-y-2">
                <div
                    v-for="field in template.fields"
                    :key="field.key"
                    class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                >
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                            <component :is="getFieldIcon(field.type)" class="w-4 h-4 text-content-subtle" />
                        </div>
                        <div>
                            <p class="text-sm font-bold text-white">{{ field.label }}</p>
                            <p class="text-xs text-content-subtle font-mono">{{ field.key }}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-white/5 text-content-muted border border-white/5">
                            {{ getFieldTypeLabel(field.type) }}
                        </span>
                        <p v-if="field.fontSize > 0" class="text-[10px] text-content-subtle mt-1">{{ field.fontSize }}px</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
