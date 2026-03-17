import { themeColors } from './theme'

interface NeuralNetworkOptions {
    particleCount?: number
    connectionDistance?: number
    particleSpeed?: number
    maxConnectionsPerParticle?: number
    particleOpacity?: number
    lineOpacity?: number
    colors?: {
        particle?: string
        line?: string
    }
}

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    size: number
}

export class NeuralNetworkScene {
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    private container: HTMLElement
    private particles: Particle[] = []
    private animationId: number | null = null
    private rotation = 0

    private mouse = { x: -1000, y: -1000 }
    private targetMouse = { x: -1000, y: -1000 }

    private options: Required<NeuralNetworkOptions>
    private particleOpacity: number
    private lineOpacity: number
    private width = 0
    private height = 0
    private dpr = 1

    constructor(container: HTMLElement, options: NeuralNetworkOptions = {}) {
        this.container = container

        const isMobile = window.innerWidth < 768

        this.particleOpacity = options.particleOpacity ?? 0.6
        this.lineOpacity = options.lineOpacity ?? 0.2

        this.options = {
            particleCount: options.particleCount ?? (isMobile ? 60 : 150),
            connectionDistance: options.connectionDistance ?? 150,
            particleSpeed: options.particleSpeed ?? 0.3,
            maxConnectionsPerParticle: options.maxConnectionsPerParticle ?? 6,
            particleOpacity: this.particleOpacity,
            lineOpacity: this.lineOpacity,
            colors: {
                particle: options.colors?.particle ?? themeColors.brand.DEFAULT,
                line: options.colors?.line ?? themeColors.brand.secondary,
            },
        }

        this.canvas = document.createElement('canvas')
        this.canvas.style.display = 'block'
        this.canvas.style.outline = 'none'
        this.canvas.style.position = 'absolute'
        this.canvas.style.inset = '0'

        this.ctx = this.canvas.getContext('2d')!
        this.container.appendChild(this.canvas)

        this.dpr = Math.min(window.devicePixelRatio, 2)
        this.updateSize()
        this.createParticles()

        this.animate = this.animate.bind(this)
    }

    private createParticles() {
        const { particleCount, particleSpeed } = this.options
        this.particles = []

        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: (Math.random() - 0.5) * this.width,
                y: (Math.random() - 0.5) * this.height,
                vx: (Math.random() - 0.5) * particleSpeed,
                vy: (Math.random() - 0.5) * particleSpeed,
                size: 1.5 + Math.random() * 1.5,
            })
        }
    }

    public updateSize() {
        if (!this.container) return
        const { clientWidth, clientHeight } = this.container
        this.width = clientWidth
        this.height = clientHeight
        this.canvas.width = clientWidth * this.dpr
        this.canvas.height = clientHeight * this.dpr
        this.canvas.style.width = `${clientWidth}px`
        this.canvas.style.height = `${clientHeight}px`
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    }

    public updateMouse(x: number, y: number) {
        this.targetMouse.x = x
        this.targetMouse.y = y
    }

    public resetMouse() {
        this.targetMouse.x = -1000
        this.targetMouse.y = -1000
    }

    public start() {
        if (!this.animationId) this.animate()
    }

    public stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId)
            this.animationId = null
        }
    }

    private animate() {
        this.animationId = requestAnimationFrame(this.animate)

        // Mouse interpolation
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.1
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.1

        // Slow rotation
        this.rotation += 0.0005

        this.updatePhysics()
        this.draw()
    }

    private updatePhysics() {
        const halfW = this.width / 2
        const halfH = this.height / 2

        for (const p of this.particles) {
            p.x += p.vx
            p.y += p.vy

            // Boundary bounce
            if (Math.abs(p.x) > halfW) p.vx *= -1
            if (Math.abs(p.y) > halfH) p.vy *= -1

            // Mouse repulsion (convert mouse from container coords to centered coords)
            const mx = this.mouse.x - halfW
            const my = this.mouse.y - halfH
            const dx = mx - p.x
            const dy = my - p.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < 200) {
                p.x -= dx * 0.02
                p.y -= dy * 0.02
            }
        }
    }

    private draw() {
        const ctx = this.ctx
        const halfW = this.width / 2
        const halfH = this.height / 2
        const { connectionDistance, maxConnectionsPerParticle, colors } = this.options
        const distSqThreshold = connectionDistance * connectionDistance

        ctx.clearRect(0, 0, this.width, this.height)
        ctx.save()
        ctx.translate(halfW, halfH)
        ctx.rotate(this.rotation)

        // Draw connections
        const connectionCounts = new Uint8Array(this.particles.length)

        ctx.lineWidth = 0.5
        ctx.beginPath()

        for (let i = 0; i < this.particles.length; i++) {
            if (connectionCounts[i]! >= maxConnectionsPerParticle) continue
            const a = this.particles[i]!

            for (let j = i + 1; j < this.particles.length; j++) {
                if (connectionCounts[j]! >= maxConnectionsPerParticle) continue
                const b = this.particles[j]!

                const dx = a.x - b.x
                const dy = a.y - b.y
                const distSq = dx * dx + dy * dy

                if (distSq < distSqThreshold) {
                    const alpha = 1 - Math.sqrt(distSq) / connectionDistance
                    ctx.strokeStyle = this.hexToRgba(colors.line!, alpha * this.lineOpacity)
                    ctx.moveTo(a.x, a.y)
                    ctx.lineTo(b.x, b.y)
                    ctx.stroke()
                    ctx.beginPath()

                    connectionCounts[i]!++
                    connectionCounts[j]!++
                }
            }
        }

        // Draw particles
        for (const p of this.particles) {
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fillStyle = this.hexToRgba(colors.particle!, this.particleOpacity)
            ctx.fill()
        }

        ctx.restore()
    }

    private hexToRgba(hex: string, alpha: number): string {
        const h = hex.replace('#', '')
        const r = parseInt(h.substring(0, 2), 16)
        const g = parseInt(h.substring(2, 4), 16)
        const b = parseInt(h.substring(4, 6), 16)
        return `rgba(${r},${g},${b},${alpha})`
    }

    public dispose() {
        this.stop()
        if (this.canvas.parentNode === this.container) {
            this.container.removeChild(this.canvas)
        }
    }
}
