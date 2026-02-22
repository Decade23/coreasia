<script setup lang="ts">
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import CaButton from '~/components/atoms/CaButton.vue'
import { UserAdapter, type UserDTO } from '~/adapters/UserAdapter'

const { t } = useI18n()

// Mock API Data
const rawUser: UserDTO = {
  id: '1',
  full_name: 'Super Administrator',
  email_address: 'admin@coreasia.id',
  user_role: 'admin',
  is_active_status: true
}

// Transform using Adapter
const user = computed(() => UserAdapter.toDomain(rawUser))
</script>

<template>
  <DashboardLayout>
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h1 class="text-xl font-bold">{{ t('common.welcome') }}</h1>
        <div class="flex items-center gap-4">
          <div class="flex flex-col items-end">
            <span class="text-sm font-bold text-white">{{ user.name }}</span>
            <span class="text-[10px] text-brand uppercase font-black tracking-widest">{{ t(`roles.${user.role}`) }}</span>
          </div>
          <div class="w-10 h-10 rounded-full bg-core-800 border border-brand/30 flex items-center justify-center text-brand font-bold">
            SA
          </div>
        </div>
      </div>
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="p-8 rounded-3xl bg-core-900 border border-core-800 hover:border-brand/30 transition-all group relative overflow-hidden">
        <div class="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <div class="w-20 h-20 bg-brand rounded-full -mr-10 -mt-10" />
        </div>
        
        <h3 class="font-bold text-lg mb-2 text-white">Stat Card {{ i }}</h3>
        <p class="text-content-muted text-sm mb-6 leading-relaxed">Sample data transformed by Adapter pattern to ensure UI consistency.</p>
        <CaButton variant="primary" size="sm">Detail Data</CaButton>
      </div>
    </div>
  </DashboardLayout>
</template>
