/**
 * Pemuat pemutar Lottie (lottie-web 5.13.0, build light canvas, MIT).
 *
 * Berkasnya disajikan dari domain sendiri di /lib/lottie supaya tidak menambah dependensi
 * npm dan lockfile, serta lolos CSP script-src 'self'. Dimuat sekali, hanya saat animasi
 * pertama benar-benar akan diputar.
 */
export const LOTTIE_PLAYER_SRC = '/lib/lottie/lottie_light_canvas-5.13.0.min.js'

export interface LottieAnimation {
    play(): void
    pause(): void
    destroy(): void
    goToAndStop(value: number, isFrame?: boolean): void
    goToAndPlay(value: number, isFrame?: boolean): void
    setSubframe(useSubFrames: boolean): void
    addEventListener(name: string, callback: (event?: { currentTime: number }) => void): void
    isLoaded: boolean
    currentFrame: number
}

export interface LottieApi {
    loadAnimation(options: Record<string, unknown>): LottieAnimation
}

let pending: Promise<LottieApi> | null = null

export function loadLottie(src: string = LOTTIE_PLAYER_SRC): Promise<LottieApi> {
    if (pending) return pending
    pending = new Promise<LottieApi>((resolve, reject) => {
        const scope = globalThis as typeof globalThis & { lottie?: LottieApi }
        if (scope.lottie) return resolve(scope.lottie)
        const script = document.createElement('script')
        script.src = src
        script.async = true
        script.onload = () => (scope.lottie ? resolve(scope.lottie) : reject(new Error('Pemutar animasi tidak tersedia')))
        script.onerror = () => {
            pending = null
            script.remove()
            reject(new Error('Pemutar animasi gagal dimuat'))
        }
        document.head.appendChild(script)
    })
    return pending
}
