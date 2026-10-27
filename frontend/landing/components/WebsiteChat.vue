<script setup lang="ts">
import { websiteChatOrigin } from '~/utils/website-chat'
import { openWebsiteChat } from '~/services/website-chat'
const config = useRuntimeConfig()
const { locale } = useCoreI18n()
const loading = ref(false)
const failed = ref(false)
const configured = computed(
    () =>
        !!config.public.chatwootWebsiteToken &&
        !!websiteChatOrigin(config.public.chatwootBaseUrl, config.public.chatwootAllowLocal),
)
const open = async () => {
    if (loading.value) return
    loading.value = true
    failed.value = false
    try {
        await openWebsiteChat(
            config.public.chatwootBaseUrl,
            config.public.chatwootWebsiteToken,
            locale.value,
            config.public.chatwootAllowLocal,
        )
    } catch {
        failed.value = true
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div v-if="configured" class="fixed bottom-6 right-24 z-40 sm:bottom-8 sm:right-28">
        <p
            v-if="failed"
            role="status"
            class="mb-3 max-w-60 rounded-xl border border-[var(--ca-border)] bg-[var(--ca-panel-bg-strong)] p-3 text-xs text-[var(--ca-text)] shadow-lg"
        >
            {{
                locale === 'en'
                    ? 'Chat is unavailable. You can use the WhatsApp button.'
                    : 'Chat belum tersedia. Kamu bisa memakai tombol WhatsApp.'
            }}
        </p>
        <button
            type="button"
            class="ca-btn-primary min-h-14 shadow-lg"
            :disabled="loading"
            :aria-busy="loading"
            @click="open"
        >
            <Icon
                :name="loading ? 'lucide:loader-2' : 'lucide:messages-square'"
                class="h-5 w-5"
                :class="{ 'animate-spin': loading }"
            />
            {{ locale === 'en' ? 'Website chat' : 'Chat website' }}
        </button>
    </div>
</template>
