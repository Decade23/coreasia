<script setup lang="ts">
import { Globe } from 'lucide-vue-next'

const { locale, locales, setLocale } = useI18n()

const showDropdown = ref(false)

const availableLocales = computed(() =>
    (locales.value as Array<{ code: string; name: string }>).filter(l => l.code !== locale.value)
)

const currentLocaleName = computed(() =>
    (locales.value as Array<{ code: string; name: string }>).find(l => l.code === locale.value)?.name || locale.value
)

const handleSwitch = (code: string) => {
    setLocale(code as 'id' | 'en')
    showDropdown.value = false
}
</script>

<template>
    <div class="relative">
        <button
            class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-content-subtle hover:text-white hover:bg-white/5 transition-all font-medium"
            @click="showDropdown = !showDropdown"
        >
            <Globe class="w-4 h-4" />
            <span class="hidden sm:inline">{{ currentLocaleName }}</span>
        </button>

        <Transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
        >
            <div
                v-if="showDropdown"
                class="absolute right-0 top-full mt-2 w-44 rounded-xl bg-[#0F1423] border border-white/10 shadow-xl overflow-hidden z-50"
            >
                <button
                    v-for="loc in availableLocales"
                    :key="loc.code"
                    class="w-full text-left px-4 py-3 text-sm text-content-muted hover:text-white hover:bg-white/5 transition-all font-medium"
                    @click="handleSwitch(loc.code)"
                >
                    {{ loc.name }}
                </button>
            </div>
        </Transition>

        <!-- Backdrop -->
        <div v-if="showDropdown" class="fixed inset-0 z-40" @click="showDropdown = false" />
    </div>
</template>
