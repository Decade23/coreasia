<template>
    <figure
        ref="root"
        class="story-lottie"
        :style="{
            '--sl-desktop': `${desktop.width}/${desktop.height}`,
            '--sl-mobile': `${(mobile || desktop).width}/${(mobile || desktop).height}`,
            '--sl-bg': background,
        }"
        :data-player="failed ? 'poster-fallback' : showPlayer ? 'lottie' : 'poster'"
        :data-variant="variant"
        :data-playing="playing"
    >
        <div class="story-lottie__stage" role="img" :aria-label="label">
            <picture>
                <source
                    v-if="mobile"
                    :media="`(max-width: ${MOBILE_MAX}px)`"
                    :srcset="mobile.poster"
                    :width="mobile.width"
                    :height="mobile.height"
                >
                <img
                    :src="desktop.poster"
                    :width="desktop.width"
                    :height="desktop.height"
                    alt=""
                    aria-hidden="true"
                    decoding="async"
                    :loading="priority ? 'eager' : 'lazy'"
                    :fetchpriority="priority ? 'high' : 'auto'"
                    class="story-lottie__poster"
                    :class="{ 'is-hidden': showPlayer }"
                >
            </picture>
            <div ref="container" class="story-lottie__player" :class="{ 'is-visible': showPlayer }" aria-hidden="true" />
        </div>
    </figure>
</template>

<script setup lang="ts">
/**
 * Pemutar ilustrasi Lottie bercerita. Poster tampil lebih dulu (ikut SSR), pemutar dan data
 * animasi baru diunduh saat ilustrasi terlihat dan peramban senggang. Animasi berhenti saat
 * keluar layar atau tab disembunyikan. Pengunjung yang memilih kurangi gerakan atau hemat
 * data cukup melihat poster. Kegagalan apa pun tetap menyisakan poster.
 */
import { loadLottie, type LottieAnimation } from '~/utils/lottiePlayer'

export interface StoryArtwork {
    json: string
    poster: string
    width: number
    height: number
    frames: number
    fps: number
}

/** Sama dengan breakpoint lg Tailwind. Di bawahnya dipakai komposisi tegak. */
const MOBILE_MAX = 1023

const props = withDefaults(
    defineProps<{
        desktop: StoryArtwork
        mobile?: StoryArtwork
        label: string
        background?: string
        priority?: boolean
    }>(),
    { mobile: undefined, background: '#f7f9fc', priority: false },
)

/** Nama marker Lottie yang sedang diputar, atau null saat animasi tidak berjalan. */
const emit = defineEmits<{ marker: [name: string | null] }>()

const root = ref<HTMLElement>()
const container = ref<HTMLElement>()
const ready = ref(false)
const failed = ref(false)
const inView = ref(false)
const visible = ref(true)
const reduced = ref(false)
const saveData = ref(false)
const variant = ref<'desktop' | 'mobile'>('desktop')

const artwork = computed(() => (variant.value === 'mobile' && props.mobile ? props.mobile : props.desktop))
const showPlayer = computed(() => ready.value && !failed.value && !reduced.value && !saveData.value)
const playing = computed(() => showPlayer.value && inView.value && visible.value)

type DataConnection = EventTarget & { saveData?: boolean }
let animation: LottieAnimation | undefined
let observer: IntersectionObserver | undefined
let connection: DataConnection | undefined
let motionQuery: MediaQueryList | undefined
let sizeQuery: MediaQueryList | undefined
let idle: number | undefined
let delay: ReturnType<typeof setTimeout> | undefined
let loading = false
let disposed = false
let generation = 0
let markers: { tm: number; dr: number; cm: string }[] = []
let currentMarker: string | null = null

function announce(name: string | null) {
    if (name === currentMarker) return
    currentMarker = name
    emit('marker', name)
}

function cancelScheduled() {
    if (idle !== undefined) window.cancelIdleCallback?.(idle)
    clearTimeout(delay)
    idle = undefined
    delay = undefined
}

function teardown() {
    cancelScheduled()
    generation++
    animation?.destroy()
    animation = undefined
    ready.value = false
    announce(null)
}

async function initialize() {
    if (loading || animation || failed.value || disposed || reduced.value || saveData.value || !inView.value || !visible.value) return
    loading = true
    const run = ++generation
    const art = artwork.value
    try {
        const [lottie, response] = await Promise.all([loadLottie(), fetch(art.json)])
        if (!response.ok) throw new Error('Animasi tidak tersedia')
        const data = await response.json()
        // Preferensi, ukuran layar, atau visibilitas bisa berubah selama berkas diunduh.
        if (disposed || run !== generation || !container.value || reduced.value || saveData.value) return
        if (data.w !== art.width || data.h !== art.height || data.fr !== art.fps || data.op !== art.frames || !Array.isArray(data.layers)) {
            throw new Error('Data animasi tidak cocok')
        }
        const instance = lottie.loadAnimation({
            container: container.value,
            renderer: 'canvas',
            loop: true,
            autoplay: false,
            animationData: data,
            rendererSettings: {
                preserveAspectRatio: 'xMidYMid meet',
                clearCanvas: true,
                progressiveLoad: true,
                dpr: Math.min(window.devicePixelRatio || 1, variant.value === 'mobile' ? 1.5 : 2),
            },
        })
        animation = instance
        markers = Array.isArray(data.markers) ? data.markers : []
        instance.addEventListener('enterFrame', (event) => {
            const frame = event?.currentTime ?? 0
            announce(markers.find((m) => frame >= m.tm && frame < m.tm + m.dr)?.cm ?? null)
        })
        // Gambarnya dibuat 30 fps, jadi tidak perlu dilukis ulang di setiap refresh layar 120 Hz.
        instance.setSubframe(false)
        const loaded = () => {
            if (disposed || animation !== instance) return
            ready.value = true
            synchronize()
        }
        const fail = () => {
            failed.value = true
            teardown()
        }
        instance.addEventListener('DOMLoaded', loaded)
        instance.addEventListener('data_failed', fail)
        instance.addEventListener('error', fail)
        if (instance.isLoaded) loaded()
    } catch {
        if (!disposed && run === generation) failed.value = true
    } finally {
        loading = false
        // Kalau ukuran layar berubah selama unduhan, muat ulang varian yang benar.
        if (!disposed && !animation && run !== generation) synchronize()
    }
}

function synchronize() {
    if (disposed) return
    visible.value = document.visibilityState === 'visible'
    saveData.value = connection?.saveData === true
    const posterOnly = reduced.value || saveData.value
    if (posterOnly || !visible.value || !inView.value) cancelScheduled()
    if (posterOnly) animation?.goToAndStop(0, true)
    else if (playing.value) animation?.play()
    else animation?.pause()
    if (!playing.value) announce(null)
    if (!animation && !loading && !failed.value && !posterOnly && inView.value && visible.value && idle === undefined && delay === undefined) {
        const begin = () => {
            idle = undefined
            delay = undefined
            void initialize()
        }
        if ('requestIdleCallback' in window) idle = window.requestIdleCallback(begin, { timeout: 2500 })
        else delay = setTimeout(begin, 600)
    }
}

function onMotionChange() {
    reduced.value = motionQuery?.matches === true
    synchronize()
}

function onSizeChange() {
    const next = sizeQuery?.matches && props.mobile ? 'mobile' : 'desktop'
    if (next === variant.value) return
    teardown()
    failed.value = false
    variant.value = next
    synchronize()
}

watch(inView, synchronize)

onMounted(() => {
    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    sizeQuery = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`)
    reduced.value = motionQuery.matches
    variant.value = sizeQuery.matches && props.mobile ? 'mobile' : 'desktop'
    connection = (navigator as Navigator & { connection?: DataConnection }).connection
    observer = new IntersectionObserver(
        (entries) => {
            const entry = entries[entries.length - 1]
            inView.value = entry.isIntersecting && entry.intersectionRatio >= 0.1
        },
        { threshold: [0, 0.1] },
    )
    if (root.value) observer.observe(root.value)
    motionQuery.addEventListener('change', onMotionChange)
    sizeQuery.addEventListener('change', onSizeChange)
    document.addEventListener('visibilitychange', synchronize)
    connection?.addEventListener('change', synchronize)
    synchronize()
})

onBeforeUnmount(() => {
    disposed = true
    teardown()
    observer?.disconnect()
    motionQuery?.removeEventListener('change', onMotionChange)
    sizeQuery?.removeEventListener('change', onSizeChange)
    document.removeEventListener('visibilitychange', synchronize)
    connection?.removeEventListener('change', synchronize)
})
</script>

<style scoped>
.story-lottie {
    margin: 0;
    width: 100%;
}
.story-lottie__stage {
    position: relative;
    aspect-ratio: var(--sl-desktop);
    border-radius: 28px;
    overflow: hidden;
    /* Warna latar ilustrasi itu sendiri, bukan warna tema. Ilustrasinya memang terang di kedua tema. */
    background: var(--sl-bg);
    border: 1px solid var(--ca-border);
    box-shadow: var(--ca-card-shadow);
    isolation: isolate;
    contain: layout paint;
}
@media (max-width: 1023px) {
    .story-lottie {
        max-width: 380px;
        margin-inline: auto;
    }
    .story-lottie__stage {
        aspect-ratio: var(--sl-mobile);
        border-radius: 24px;
    }
}
.story-lottie__poster,
.story-lottie__player {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
}
.story-lottie__poster {
    transition: opacity 0.25s ease;
}
.story-lottie__poster.is-hidden {
    opacity: 0;
}
.story-lottie__player {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
}
.story-lottie__player.is-visible {
    opacity: 1;
}
.story-lottie__player :deep(canvas) {
    display: block;
    width: 100% !important;
    height: 100% !important;
}
@media (prefers-reduced-motion: reduce) {
    .story-lottie__poster,
    .story-lottie__player {
        transition: none;
    }
}
</style>
