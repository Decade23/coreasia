<script setup lang="ts">
import { BookOpen, MoreVertical } from 'lucide-vue-next'
import BaseBadge from '~/components/atoms/BaseBadge.vue'

defineProps({
  scheme: {
    type: Object,
    required: true
  }
})

defineEmits(['manage'])
</script>

<template>
  <div class="bg-[#0F1423] p-6 rounded-[2rem] relative flex flex-col h-full shadow-glow-base transition-all duration-500 hover:-translate-y-1 hover:shadow-glow-base-strong group">
    
    <!-- Subtle Glow effect on card hover -->
    <div class="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -mr-16 -mt-16" />

    <!-- Top/Header Card -->
    <div class="flex items-center justify-between mb-6 relative z-10">
      <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors duration-300">
        <BookOpen class="w-5 h-5 text-content-muted group-hover:text-cyan-400 transition-colors" />
      </div>
      
      <div class="flex items-center gap-2">
         <BaseBadge 
          :text="scheme.active ? 'Aktif' : 'Draft'" 
          :variant="scheme.active ? 'success' : 'default'" 
         />
         <button class="text-slate-500 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5">
           <MoreVertical class="w-4 h-4" />
         </button>
      </div>
    </div>

    <!-- Body -->
    <div class="mb-8 flex-1 relative z-10">
      <div class="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">{{ scheme.code }}</div>
      <h3 class="text-xl font-bold text-white leading-tight pr-8 line-clamp-2 group-hover:text-cyan-400 transition-colors">{{ scheme.name }}</h3>
    </div>

    <!-- Footer/Aksi -->
    <div class="flex items-center justify-between mt-auto relative z-10">
      <div class="text-[10px] font-black uppercase tracking-widest text-[#64748B]">
        <span class="text-white font-bold text-sm">{{ scheme.unitCount }}</span> Unit
      </div>
      <button @click="$emit('manage', scheme)" class="text-xs font-black uppercase tracking-widest text-cyan-400 group-hover:translate-x-1 group-hover:text-cyan-300 transition-all flex items-center gap-1">
        Kelola <span class="text-lg leading-none">&rarr;</span>
      </button>
    </div>
  </div>
</template>
