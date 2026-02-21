import { computed, type Ref } from 'vue'
import { useMouse, useElementBounding } from '@vueuse/core'

export function useMagnetic(elementRef: Ref<HTMLElement | null>, strength: number = 0.5) {
    const { x, y } = useMouse()
    const { width, height, top, left } = useElementBounding(elementRef)

    // Compute distance once, reuse in both magnetX and magnetY
    const magnet = computed(() => {
        if (!process.client) return { dx: 0, dy: 0, active: false }

        const centerX = left.value + width.value / 2
        const centerY = top.value + height.value / 2
        const dx = x.value - centerX
        const dy = y.value - centerY
        const distance = Math.sqrt(dx * dx + dy * dy)
        const triggerDistance = Math.max(width.value, height.value) * 0.8
        const active = distance <= triggerDistance

        return { dx, dy, active }
    })

    const magnetX = computed(() => magnet.value.active ? magnet.value.dx * strength : 0)
    const magnetY = computed(() => magnet.value.active ? magnet.value.dy * strength : 0)

    return {
        style: computed(() => ({
            transform: `translate(${magnetX.value}px, ${magnetY.value}px)`,
            transition: magnetX.value === 0 && magnetY.value === 0
                ? 'transform 0.5s ease-out'
                : 'transform 0.1s ease-out',
        }))
    }
}
