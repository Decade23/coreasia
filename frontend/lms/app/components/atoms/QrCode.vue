<script setup lang="ts">
import QRCode from 'qrcode'

const props = withDefaults(defineProps<{
    value: string
    size?: number
    darkColor?: string
    lightColor?: string
}>(), {
    size: 200,
    darkColor: '#ffffff',
    lightColor: '#00000000',
})

const dataUrl = ref('')

const generate = async () => {
    if (!props.value) return
    try {
        dataUrl.value = await QRCode.toDataURL(props.value, {
            width: props.size,
            margin: 1,
            color: {
                dark: props.darkColor,
                light: props.lightColor,
            },
        })
    } catch (err) {
        console.error('[QrCode] Failed to generate:', err)
    }
}

watch(() => props.value, generate, { immediate: true })
</script>

<template>
    <img
        v-if="dataUrl"
        :src="dataUrl"
        :width="size"
        :height="size"
        alt="QR Code"
        class="rounded-lg"
    />
</template>
