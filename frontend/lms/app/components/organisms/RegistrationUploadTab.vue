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
    const item = documentTypes.value.find(d => d.id === id)
    if (item) {
      item.uploadedFile = file
    }
  }
}

const removeFile = (id: string) => {
  const item = documentTypes.value.find(d => d.id === id)
  if (item) {
    item.uploadedFile = null
  }
}
</script>

<template>
  <div class="space-y-4 p-6 md:p-10 ca-card shadow-brand-glow">
    <div 
      v-for="doc in documentTypes" 
      :key="doc.id"
      class="p-5 md:p-6 rounded-2xl border transition-all duration-300 group"
      :class="doc.uploadedFile 
        ? 'border-brand/30 bg-brand/5 shadow-glow-brand-soft' 
        : 'border-white/5 bg-core-800/50 hover:border-brand/30 hover:bg-white/5'"
    >
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-5">
          <div 
            class="w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-lg"
            :class="doc.uploadedFile ? 'bg-gradient-to-br from-brand to-brand-400 text-slate-950' : 'bg-core-900 border border-white/5 text-content-muted group-hover:text-white group-hover:border-brand/30'"
          >
            <FileCheck v-if="doc.uploadedFile" class="w-6 h-6" />
            <File v-else class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-bold text-white text-sm md:text-base group-hover:text-brand transition-colors">{{ doc.label }}</h3>
            <p class="text-[10px] md:text-xs text-content-subtle mt-0.5">{{ doc.description }}</p>
          </div>
        </div>

        <div v-if="doc.uploadedFile" class="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end">
          <div class="flex-1 sm:flex-none flex flex-col items-start sm:items-end">
            <span class="text-sm font-bold text-brand max-w-[150px] truncate">{{ doc.uploadedFile.name }}</span>
            <span class="text-[10px] text-content-subtle uppercase font-bold">{{ (doc.uploadedFile.size / 1024 / 1024).toFixed(2) }} MB</span>
          </div>
          <button @click="removeFile(doc.id)" class="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm">
            <X class="w-4 h-4" />
          </button>
        </div>

        <label v-else class="relative cursor-pointer group/btn w-full sm:w-auto mt-2 sm:mt-0">
          <input 
            type="file" 
            class="absolute inset-0 opacity-0 cursor-pointer" 
            @change="e => handleFileUpload(doc.id, e)"
          />
          <div class="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-core-900 border border-white/5 text-content font-bold text-sm group-hover/btn:bg-brand group-hover/btn:border-transparent group-hover/btn:text-slate-950 transition-all w-full sm:w-auto hover:shadow-lg hover:shadow-brand/20">
            <Upload class="w-4 h-4" />
            Pilih File
          </div>
        </label>
      </div>
    </div>
  </div>
</template>
