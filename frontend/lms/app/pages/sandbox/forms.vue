<script setup lang="ts">
import { ref, onMounted } from 'vue'

const textValue = ref('')
const passwordValue = ref('')
const areaValue = ref('')

const selectOptions = [
  { value: 'admin', label: 'Administrator Utama' },
  { value: 'assessor', label: 'Asesor Kompetensi' },
  { value: 'user', label: 'Peserta Ujian (Asesi)' },
  { value: 'manager', label: 'Manajer Sertifikasi' }
]
const selectValue = ref('')

const asyncValue = ref('')
const isAsyncLoading = ref(false)
const asyncOptions = ref<{value: string, label: string}[]>([])
const asyncSearchQuery = ref('')
const asyncHasMore = ref(true)
const asyncLoadingMore = ref(false)
let asyncPage = 1

const handleAsyncSearch = (query: string) => {
  asyncSearchQuery.value = query
  isAsyncLoading.value = true
  asyncPage = 1
  setTimeout(() => {
    if (query.toLowerCase() === 'kosong') {
      asyncOptions.value = []
      asyncHasMore.value = false
    } else {
      asyncOptions.value = Array.from({ length: 15 }, (_, i) => ({
        value: `item-${i}`,
        label: `Data Master: ${query || 'Semua'} ${i + 1}`
      }))
      asyncHasMore.value = true
    }
    isAsyncLoading.value = false
  }, 800)
}

const handleAsyncLoadMore = () => {
  if (asyncLoadingMore.value || !asyncHasMore.value) return
  asyncLoadingMore.value = true
  asyncPage++
  
  setTimeout(() => {
    const newItems = Array.from({ length: 10 }, (_, i) => ({
        value: `item-page${asyncPage}-${i}`,
        label: `Data Lanjutan ${asyncPage}: ${asyncSearchQuery.value} ${i + 1}`
    }))
    asyncOptions.value.push(...newItems)
    
    if (asyncPage >= 4) {
      asyncHasMore.value = false // Stop after 4 pages
    }
    asyncLoadingMore.value = false
  }, 1000)
}

const dateValue = ref('')

const toggleValue = ref(false)
const checkboxValue = ref(false)
const radioValue = ref('A')

onMounted(() => {
    handleAsyncSearch('')
})
</script>

<template>
  <div class="min-h-screen bg-[#050814] p-10 font-sans text-white">
    <div class="max-w-4xl mx-auto space-y-12">
      <header>
        <div class="flex items-center gap-2 mb-4">
            <span class="inline-flex items-center gap-2 rounded-full bg-cyan-500/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#22D3EE]">
                Sandboks Playground
            </span>
        </div>
        <h1 class="text-4xl font-black text-white">Premium Form Components</h1>
        <p class="text-content-subtle mt-2 font-medium">Lingkungan uji interaktif untuk memvalidasi interaksi dan estetika *Borderless Dark Mode* fungsional.</p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Text Inputs -->
        <div class="bg-[#0F1423] shadow-2xl rounded-[2rem] p-8 space-y-6">
          <h2 class="text-xl font-bold border-b border-white/5 pb-4 mb-6">1. Base Inputs</h2>
          
          <BaseInput 
            id="pg-text" 
            label="Input Standar" 
            placeholder="Ketik sesuatu..." 
            v-model="textValue" 
          />
          
          <BaseInput 
            id="pg-error" 
            label="Input Error State" 
            placeholder="Contoh error..." 
            error="Format terdeteksi tidak menuruti spesifikasi." 
            model-value="invalid_entry_101"
          />

          <BaseInput 
            id="pg-pass" 
            type="password"
            label="Input Password" 
            placeholder="Masukkan kata sandi rahasia" 
            v-model="passwordValue" 
          />

          <BaseTextarea 
            id="pg-area" 
            label="Textarea (Resizable)" 
            placeholder="Tuliskan catatan panjang di sini..." 
            v-model="areaValue" 
          />
        </div>

        <!-- Selects & Pickers -->
        <div class="bg-[#0F1423] shadow-2xl rounded-[2rem] p-8 space-y-6">
          <h2 class="text-xl font-bold border-b border-white/5 pb-4 mb-6">2. Selects & Pickers</h2>
          
          <CaSelect
            id="pg-select"
            label="Standard Select"
            placeholder="Pilih Peran Pengguna"
            :options="selectOptions"
            v-model="selectValue"
          />

          <CaAsyncSelect
            id="pg-async"
            label="Advanced Async Select"
            placeholder="Cari Data Master (Ketik 'kosong')..."
            :options="asyncOptions"
            :is-loading="isAsyncLoading"
            :is-loading-more="asyncLoadingMore"
            :has-more="asyncHasMore"
            v-model="asyncValue"
            @search="handleAsyncSearch"
            @load-more="handleAsyncLoadMore"
          />

          <CaDatePicker
            id="pg-date"
            label="Premium Date Picker"
            placeholder="Tentukan jadwal kegiatan"
            v-model="dateValue"
          />
        </div>

        <!-- Selection Controls -->
        <div class="bg-[#0F1423] shadow-2xl rounded-[2rem] p-8 space-y-8 md:col-span-2">
          <h2 class="text-xl font-bold border-b border-white/10 pb-4">3. Selection Controls</h2>
          
          <div class="flex flex-wrap gap-12">
            <!-- Toggle -->
            <div class="space-y-4">
              <h3 class="text-xs font-bold text-content-subtle uppercase tracking-wider">Apple-like Toggle</h3>
              <CaToggle id="pg-toggle" v-model="toggleValue" label="Aktifkan Notifikasi Sistem" />
            </div>

            <!-- Checkbox -->
            <div class="space-y-4">
              <h3 class="text-xs font-bold text-content-subtle uppercase tracking-wider">Bionic Checkbox</h3>
              <CaCheckbox id="pg-checkbox" v-model="checkboxValue" :value="true" label="Saya menyetujui syarat & ketentuan" />
            </div>

            <!-- Radio -->
            <div class="space-y-4">
              <h3 class="text-xs font-bold text-content-subtle uppercase tracking-wider">Custom Radio</h3>
              <div class="space-y-3">
                <CaRadio id="pg-radio1" v-model="radioValue" value="A" label="Opsi Premium A" name="radio-group" />
                <CaRadio id="pg-radio2" v-model="radioValue" value="B" label="Opsi Premium B" name="radio-group" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
