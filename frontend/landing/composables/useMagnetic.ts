import { ref, computed, type Ref } from 'vue'
import { useMouse, useElementBounding } from '@vueuse/core'

export function useMagnetic(elementRef: Ref<HTMLElement | null>, strength: number = 0.5) {
    const { x, y } = useMouse()
    const { width, height, top, left } = useElementBounding(elementRef)

    const magnetX = computed(() => {
        if (!process.client) return 0
        const centerX = left.value + width.value / 2
        const centerY = top.value + height.value / 2

        // Calculate distance from center
        const dx = x.value - centerX
        const dy = y.value - centerY

        // Only activate if close enough (e.g., within 100px padding)
        const distance = Math.sqrt(dx * dx + dy * dy)
        const triggerDistance = Math.max(width.value, height.value) * 0.8

        if (distance > triggerDistance) return 0

        return dx * strength
    })

    const magnetY = computed(() => {
        if (!process.client) return 0
        const centerX = left.value + width.value / 2
        const centerY = top.value + height.value / 2

        const dx = x.value - centerX
        const dy = y.value - centerY

        const distance = Math.sqrt(dx * dx + dy * dy)
        const triggerDistance = Math.max(width.value, height.value) * 0.8

        if (distance > triggerDistance) return 0

        return dy * strength
    })

    return {
        style: computed(() => ({
            transform: `translate(${magnetX.value}px, ${magnetY.value}px)`,
            transition: 'transform 0.1s ease-out'
        }))
    }
}
