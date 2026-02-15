<script setup lang="ts">
import { themeColors } from '~/utils/theme'

const containerRef = ref<HTMLElement | null>(null)
let networkScene: any = null

// Adaptive particle count based on device
const getParticleCount = () => {
    if (process.client) {
        const width = window.innerWidth
        if (width < 768) return 60  // Mobile
        if (width < 1024) return 100 // Tablet
        return 150 // Desktop
    }
    return 150 // Default fallback
}

// Event Handlers
const handleResize = () => {
    networkScene?.updateSize()
    // Optional: Recreate scene with new particle count on significant resize
}

const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.value) return
    const rect = containerRef.value.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    networkScene?.updateMouse(x, y)
}

const handleMouseLeave = () => networkScene?.resetMouse()


onMounted(async () => {
    // Dynamic import to avoid SSR issues with Three.js
    const { NeuralNetworkScene } = await import('~/utils/NeuralNetworkScene')

    // Initialize Logic
    if (containerRef.value) {
        networkScene = new NeuralNetworkScene(containerRef.value, {
            particleCount: getParticleCount(),
            colors: {
                particle: themeColors.brand.DEFAULT,
                line: themeColors.brand.secondary
            }
        })
        networkScene.start()

        // Optimization: Pause when not visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    networkScene?.start()
                } else {
                    networkScene?.stop()
                }
            })
        }, { threshold: 0 })
        observer.observe(containerRef.value)

        // Attach event listeners to container instead of window
        containerRef.value.addEventListener('mousemove', handleMouseMove)
        containerRef.value.addEventListener('mouseleave', handleMouseLeave)
    }

    window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    if (containerRef.value) {
        containerRef.value.removeEventListener('mousemove', handleMouseMove)
        containerRef.value.removeEventListener('mouseleave', handleMouseLeave)
    }
    networkScene?.dispose()
})
</script>

<template>
    <div 
        ref="containerRef"
        class="absolute inset-0 z-0 h-full w-full overflow-hidden"
    >
        <!-- Overlay Content -->
        <div class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-transparent to-core-950" />
        
        <!-- Fallback / Background -->
         <div class="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-core-900/50 via-core-950 to-core-950" />
    </div>
</template>

<style scoped>
:deep(canvas) {
    display: block;
    outline: none;
}
</style>