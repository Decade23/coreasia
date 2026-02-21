<script setup lang="ts">
import { themeColors } from '~/utils/theme'

const containerRef = ref<HTMLElement | null>(null)
const isLoaded = ref(false)
let networkScene: any = null
let observer: IntersectionObserver | null = null

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
        <div class="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-transparent to-core-950" />
        
        <!-- Canvas Container (Fade In) -->
        <!-- The canvas is appended here by JS, we style it via deep selector or global styles, 
             but we can control its visibility by toggling a class on the container or using a wrapper. 
             Since NeuralNetworkScene appends directly to containerRef, we rely on :class on the container 
             to style children or we manually style the canvas in onMounted. 
             Easier: Let's style the canvas via deep selector using a bound class on the container. -->
        
        <!-- Static Fallback (Visible until loaded) -->
        <div 
            class="absolute inset-0 z-0 transition-opacity duration-1000"
            :class="{ 'opacity-0': isLoaded, 'opacity-100': !isLoaded }"
        >
             <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
             <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] bg-amber-500/10 blur-[100px] rounded-full mix-blend-screen"></div>
             
             <!-- Optional: Dark radial background base -->
             <div class="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-core-900/50 via-core-950 to-core-950" />
        </div>
    </div>
</template>

<style scoped>
/* Target the canvas created by Three.js */
:deep(canvas) {
    display: block;
    outline: none;
    opacity: 0;
    transition: opacity 1.5s ease-in-out;
}

/* When the component signals loaded (we can add a class to container) */
.loaded :deep(canvas) {
    opacity: 1;
}
</style>