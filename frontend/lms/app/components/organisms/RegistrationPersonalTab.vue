<script setup lang="ts">
import type { PersonalData } from '../../types/registration'

const props = defineProps<{
  modelValue: PersonalData
}>()

const emit = defineEmits(['update:modelValue'])

const updateData = (key: keyof PersonalData, value: string) => {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 rounded-3xl bg-core-900 border border-core-800 shadow-2xl">
    <div class="space-y-2">
      <label class="text-xs font-black uppercase tracking-widest text-content-muted">Nama Lengkap</label>
      <input 
        type="text" 
        :value="modelValue.fullName"
        @input="e => updateData('fullName', (e.target as HTMLInputElement).value)"
        placeholder="Sesuai KTP" 
        class="w-full bg-core-800 border border-core-700 rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all placeholder:text-content-subtle"
      />
    </div>

    <div class="space-y-2">
      <label class="text-xs font-black uppercase tracking-widest text-content-muted">NIK (Nomor Induk Kependudukan)</label>
      <input 
        type="text" 
        :value="modelValue.nik"
        @input="e => updateData('nik', (e.target as HTMLInputElement).value)"
        placeholder="16 Digit Angka" 
        class="w-full bg-core-800 border border-core-700 rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all placeholder:text-content-subtle"
      />
    </div>

    <div class="space-y-2">
      <label class="text-xs font-black uppercase tracking-widest text-content-muted">Tempat Lahir</label>
      <input 
        type="text" 
        :value="modelValue.placeOfBirth"
        @input="e => updateData('placeOfBirth', (e.target as HTMLInputElement).value)"
        placeholder="Kota Kelahiran" 
        class="w-full bg-core-800 border border-core-700 rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all placeholder:text-content-subtle"
      />
    </div>

    <div class="space-y-2">
      <label class="text-xs font-black uppercase tracking-widest text-content-muted">Tanggal Lahir</label>
      <input 
        type="date" 
        :value="modelValue.dateOfBirth"
        @input="e => updateData('dateOfBirth', (e.target as HTMLInputElement).value)"
        class="w-full bg-core-800 border border-core-700 rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all"
      />
    </div>

    <div class="space-y-2">
      <label class="text-xs font-black uppercase tracking-widest text-content-muted">Email</label>
      <input 
        type="email" 
        :value="modelValue.email"
        @input="e => updateData('email', (e.target as HTMLInputElement).value)"
        placeholder="nama@email.com" 
        class="w-full bg-core-800 border border-core-700 rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all placeholder:text-content-subtle"
      />
    </div>

    <div class="space-y-2">
      <label class="text-xs font-black uppercase tracking-widest text-content-muted">Nomor WhatsApp</label>
      <input 
        type="tel" 
        :value="modelValue.phoneNumber"
        @input="e => updateData('phoneNumber', (e.target as HTMLInputElement).value)"
        placeholder="Contoh: 08123456789" 
        class="w-full bg-core-800 border border-core-700 rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all placeholder:text-content-subtle"
      />
    </div>

    <div class="md:col-span-2 space-y-2">
      <label class="text-xs font-black uppercase tracking-widest text-content-muted">Alamat Lengkap</label>
      <textarea 
        :value="modelValue.address"
        @input="e => updateData('address', (e.target as HTMLTextAreaElement).value)"
        placeholder="Alamat domisili saat ini" 
        class="w-full h-32 bg-core-800 border border-core-700 rounded-xl px-4 py-3 text-white focus:border-brand outline-none transition-all placeholder:text-content-subtle resize-none"
      />
    </div>
  </div>
</template>
