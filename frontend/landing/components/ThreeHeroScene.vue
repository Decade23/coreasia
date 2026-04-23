<script setup lang="ts">
import { themeColors } from '~/utils/theme'

const containerRef = ref<HTMLElement | null>(null)
const isLoaded = ref(false)
let networkScene: any = null
let observer: IntersectionObserver | null = null

// Theme-aware colors
const getThemeColors = () => {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light'
    return {
        particle: isDark ? themeColors.brand.DEFAULT : '#9d6500',
        line: isDark ? themeColors.brand.secondary : '#0d7b67',
        particleOpacity: isDark ? 0.6 : 0.35,
        lineOpacity: isDark ? 0.2 : 0.12,
    }
}

const getViewportWidth = () => {
    if (!process.client) return 1024
    return window.innerWidth
}

const isMobileViewport = () => getViewportWidth() < 768

// Adaptive particle count based on device
const getParticleCount = () => {
    if (process.client) {
        const width = getViewportWidth()
        if (width < 768) return 60  // Mobile
        if (width < 1024) return 100 // Tablet
        return 150 // Desktop
    }
    return 150 // Default fallback
}

const getSceneOptions = () => {
    if (isMobileViewport()) {
        return {
            particleCount: 44,
            connectionDistance: 110,
            particleSpeed: 0.22,
            maxConnectionsPerParticle: 4,
        }
    }

    const width = getViewportWidth()
    if (width < 1024) {
        return {
            particleCount: 90,
            connectionDistance: 135,
            particleSpeed: 0.26,
            maxConnectionsPerParticle: 5,
        }
    }

    return {
        particleCount: getParticleCount(),
        connectionDistance: 150,
        particleSpeed: 0.3,
        maxConnectionsPerParticle: 6,
    }
}

// Debounced resize handler
let resizeTimeout: ReturnType<typeof setTimeout> | null = null
const handleResize = () => {
    if (resizeTimeout) clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
        networkScene?.updateSize()
    }, 150)
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
    const { NeuralNetworkScene } = await import('~/utils/NeuralNetworkScene')

    if (containerRef.value) {
        const tc = getThemeColors()
        const sceneOptions = getSceneOptions()
        networkScene = new NeuralNetworkScene(containerRef.value, {
            ...sceneOptions,
            particleOpacity: tc.particleOpacity,
            lineOpacity: tc.lineOpacity,
            colors: {
                particle: tc.particle,
                line: tc.line,
            }
        })
        networkScene.start()

        // Slight delay to ensure first frame rendered
        setTimeout(() => {
            isLoaded.value = true
        }, 200)

        // Optimization: Pause when not visible
        observer = new IntersectionObserver((entries) => {
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
    observer?.disconnect()
})
</script>

<template>
    <div
        ref="containerRef"
        class="absolute inset-0 z-0 h-full w-full overflow-hidden"
        :class="{ 'loaded': isLoaded }"
    >
        <!-- Overlay Content -->
        <div class="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center">
            <div class="ca-scene-base absolute inset-x-0 bottom-0 h-1/2 opacity-80" />
        </div>

        <!-- Static Fallback (Visible until loaded) -->
        <div
            class="absolute inset-0 z-0 transition-opacity duration-1000"
            :class="{ 'opacity-0': isLoaded, 'opacity-100': !isLoaded }"
        >
             <div class="ca-scene-grid absolute inset-0"></div>
             <div class="ca-scene-glow ca-light-soft-blend absolute left-1/2 top-1/2 h-125 w-200 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"></div>

             <!-- Optional: Dark radial background base -->
             <div class="ca-scene-base absolute inset-0 -z-10" />
        </div>
    </div>
</template>

<style scoped>
/* Target the canvas created by NeuralNetworkScene */
:deep(canvas) {
    display: block;
    outline: none;
    opacity: 0;
    z-index: 10;
    transition: opacity 1.5s ease-in-out;
}

/* When the component signals loaded */
.loaded :deep(canvas) {
    opacity: 1;
}
</style>
