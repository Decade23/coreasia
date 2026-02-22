<script setup lang="ts">
import { Upload, FileCheck, X, File } from 'lucide-vue-next'

interface FileItem {
  id: string
  label: string
  description: string
  uploadedFile?: File | null
}

const documentTypes = ref<FileItem[]>([
  { id: 'ktp', label: 'Kartu Tanda Penduduk (KTP)', description: 'Ekstensi: .jpg, .png, .pdf (Maks. 2MB)' },
  { id: 'ijazah', label: 'Ijazah Terakhir', description: 'Ekstensi: .pdf (Maks. 5MB)' },
  { id: 'cv', label: 'Curriculum Vitae (CV)', description: 'Ekstensi: .pdf (Maks. 5MB)' },
  { id: 'foto', label: 'Pas Foto 3x4 (Background Merah)', description: 'Ekstensi: .jpg, .png (Maks. 2MB)' },
])

const handleFileUpload = (id: string, event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    const index = documentTypes.value.findIndex(d => d.id === id)
    if (index !== -1) {
      documentTypes.value[index].uploadedFile = file
    }
  }
}

const removeFile = (id: string) => {
  const index = documentTypes.value.findIndex(d => d.id === id)
  if (index !== -1) {
    documentTypes.value[index].uploadedFile = null
  }
}
</script>

<template>
  <div class="space-y-4 p-8 rounded-3xl bg-core-900 border border-core-800 shadow-2xl">
    <div 
      v-for="doc in documentTypes" 
      :key="doc.id"
      class="p-6 rounded-2xl border-2 transition-all"
      :class="doc.uploadedFile ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-core-800 bg-core-900/50'"
    >
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div 
            class="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
            :class="doc.uploadedFile ? 'bg-emerald-500 text-slate-950' : 'bg-core-800 text-content-muted'"
          >
            <FileCheck v-if="doc.uploadedFile" class="w-6 h-6" />
            <File v-else class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-bold text-white">{{ doc.label }}</h3>
            <p class="text-xs text-content-subtle">{{ doc.description }}</p>
          </div>
        </div>

        <div v-if="doc.uploadedFile" class="flex items-center gap-4 w-full sm:w-auto">
          <div class="flex-1 sm:flex-none flex flex-col items-end">
            <span class="text-sm font-bold text-emerald-400 max-w-[150px] truncate">{{ doc.uploadedFile.name }}</span>
            <span class="text-[10px] text-content-subtle uppercase font-bold">{{ (doc.uploadedFile.size / 1024 / 1024).toFixed(2) }} MB</span>
          </div>
          <button @click="removeFile(doc.id)" class="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
            <X class="w-4 h-4" />
          </button>
        </div>

        <label v-else class="relative cursor-pointer group w-full sm:w-auto">
          <input 
            type="file" 
            class="absolute inset-0 opacity-0 cursor-pointer" 
            @change="e => handleFileUpload(doc.id, e)"
          />
          <div class="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-core-700 text-white font-bold text-sm group-hover:bg-brand group-hover:text-slate-950 transition-all">
            <Upload class="w-4 h-4" />
            Pilih File
          </div>
        </label>
      </div>
    </div>
  </div>
</template>
