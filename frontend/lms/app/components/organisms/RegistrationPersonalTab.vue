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
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 md:p-10 rounded-[2.5rem] glass-card">
    <div class="space-y-2">
      <label class="text-xs font-black uppercase tracking-widest text-content-muted ml-1">Nama Lengkap</label>
      <input 
        type="text" 
        :value="modelValue.fullName"
        @input="e => updateData('fullName', (e.target as HTMLInputElement).value)"
        placeholder="Sesuai KTP" 
        class="input-field"
      />
    </div>

    <div class="space-y-2">
      <label class="text-xs font-black uppercase tracking-widest text-content-muted ml-1">NIK (Nomor Induk Kependudukan)</label>
      <input 
        type="text" 
        :value="modelValue.nik"
        @input="e => updateData('nik', (e.target as HTMLInputElement).value)"
        placeholder="16 Digit Angka" 
        class="input-field"
      />
    </div>

    <div class="space-y-2">
      <label class="text-xs font-black uppercase tracking-widest text-content-muted ml-1">Tempat Lahir</label>
      <input 
        type="text" 
        :value="modelValue.placeOfBirth"
        @input="e => updateData('placeOfBirth', (e.target as HTMLInputElement).value)"
        placeholder="Kota Kelahiran" 
        class="input-field"
      />
    </div>

    <div class="space-y-2">
      <label class="text-xs font-black uppercase tracking-widest text-content-muted ml-1">Tanggal Lahir</label>
      <input 
        type="date" 
        :value="modelValue.dateOfBirth"
        @input="e => updateData('dateOfBirth', (e.target as HTMLInputElement).value)"
        class="input-field"
      />
    </div>

    <div class="space-y-2">
      <label class="text-xs font-black uppercase tracking-widest text-content-muted ml-1">Email</label>
      <input 
        type="email" 
        :value="modelValue.email"
        @input="e => updateData('email', (e.target as HTMLInputElement).value)"
        placeholder="nama@email.com" 
        class="input-field"
      />
    </div>

    <div class="space-y-2">
      <label class="text-xs font-black uppercase tracking-widest text-content-muted ml-1">Nomor WhatsApp</label>
      <input 
        type="tel" 
        :value="modelValue.phoneNumber"
        @input="e => updateData('phoneNumber', (e.target as HTMLInputElement).value)"
        placeholder="Contoh: 08123456789" 
        class="input-field"
      />
    </div>

    <div class="md:col-span-2 space-y-2">
      <label class="text-xs font-black uppercase tracking-widest text-content-muted ml-1">Alamat Lengkap</label>
      <textarea 
        :value="modelValue.address"
        @input="e => updateData('address', (e.target as HTMLTextAreaElement).value)"
        placeholder="Alamat domisili saat ini" 
        class="input-field h-32 resize-none"
      />
    </div>
  </div>
</template>
