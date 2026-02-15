import * as THREE from 'three'
import { themeColors } from './theme'

interface ParticleVelocity {
    x: number
    y: number
    z: number
}

interface NeuralNetworkOptions {
    particleCount?: number
    connectionDistance?: number
    particleSpeed?: number
    colors?: {
        particle?: number | string
        line?: number | string
    }
}

// Helper to convert color string to number for Three.js
const colorToNumber = (color: number | string): number => {
    if (typeof color === 'number') return color
    // Convert hex string to number
    if (typeof color === 'string') {
        const hex = color.replace('#', '')
        return parseInt(hex, 16)
    }
    return themeColors.brand.DEFAULT as unknown as number
}

export class NeuralNetworkScene {
    private scene: THREE.Scene
    private camera: THREE.PerspectiveCamera
    private renderer: THREE.WebGLRenderer
    private particles: THREE.BufferGeometry | null = null
    private particleSystem: THREE.Points | null = null
    private linesMesh: THREE.LineSegments | null = null
    private animationId: number | null = null
    private container: HTMLElement

    private mouse = { x: -1000, y: -1000 }
    private targetMouse = { x: -1000, y: -1000 }

    private options: Required<NeuralNetworkOptions>

    constructor(container: HTMLElement, options: NeuralNetworkOptions = {}) {
        this.container = container
        this.options = {
            particleCount: options.particleCount ?? 150,
            connectionDistance: options.connectionDistance ?? 150,
            particleSpeed: options.particleSpeed ?? 0.3,
            colors: {
                particle: options.colors?.particle ?? themeColors.brand.DEFAULT,
                line: options.colors?.line ?? themeColors.brand.secondary
            }
        }

        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(75, 1, 1, 1000) // Aspect ratio updated in resize
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        })

        this.init()
    }

    private init() {
        this.camera.position.z = 400

        // Renderer Setup
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.updateSize()
        this.container.appendChild(this.renderer.domElement)

        // Objects
        this.createParticles()

        // Bindings
        this.animate = this.animate.bind(this)
    }

    private createParticles() {
        const { particleCount, particleSpeed, colors } = this.options

        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(particleCount * 3)
        const velocities = []

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 800
            positions[i * 3 + 1] = (Math.random() - 0.5) * 600
            positions[i * 3 + 2] = (Math.random() - 0.5) * 400

            velocities.push({
                x: (Math.random() - 0.5) * particleSpeed,
                y: (Math.random() - 0.5) * particleSpeed,
                z: (Math.random() - 0.5) * particleSpeed
            })
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.userData = { velocities }
        this.particles = geometry

        // Particle System
        const material = new THREE.PointsMaterial({
            color: colorToNumber(colors.particle ?? themeColors.brand.DEFAULT),
            size: 3,
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true
        })

        this.particleSystem = new THREE.Points(this.particles, material)
        this.scene.add(this.particleSystem)

        // Lines
        const lineGeometry = new THREE.BufferGeometry()
        // Max connections logic preserved
        const maxConnections = particleCount * particleCount // simplified upper bound
        const linePositions = new Float32Array(maxConnections * 3)
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))

        const lineMaterial = new THREE.LineBasicMaterial({
            color: colorToNumber(colors.line ?? themeColors.brand.secondary),
            transparent: true,
            opacity: 0.15
        })

        this.linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial)
        this.scene.add(this.linesMesh)
    }

    public updateSize() {
        if (!this.container) return
        const { clientWidth, clientHeight } = this.container
        this.camera.aspect = clientWidth / clientHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(clientWidth, clientHeight)
    }

    public updateMouse(x: number, y: number) {
        const rect = this.container.getBoundingClientRect()
        this.targetMouse.x = x - rect.left
        this.targetMouse.y = y - rect.top
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

        // Mouse Interpolation
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.1
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.1

        if (this.particles && this.linesMesh && this.particleSystem) {
            this.updatePhysics()

            // Rotation
            this.particleSystem.rotation.y += 0.0005
            this.linesMesh.rotation.y += 0.0005

            this.renderer.render(this.scene, this.camera)
        }
    }



    // ... (inside class)
    private updatePhysics() {
        if (!this.particles || !this.linesMesh) return

        const positions = this.particles.attributes.position.array as Float32Array
        const velocities = this.particles.userData.velocities as ParticleVelocity[]
        const count = this.options.particleCount

        for (let i = 0; i < count; i++) {
            const v = velocities[i]
            if (!v) continue

            const i3 = i * 3

            // TypeScript strict check: Float32Array access might be undefined
            const px = positions[i3]!
            const py = positions[i3 + 1]!
            const pz = positions[i3 + 2]!

            positions[i3] = px + v.x
            positions[i3 + 1] = py + v.y
            positions[i3 + 2] = pz + v.z

            // Boundary
            if (Math.abs(positions[i3]!) > 400) v.x *= -1
            if (Math.abs(positions[i3 + 1]!) > 300) v.y *= -1
            if (Math.abs(positions[i3 + 2]!) > 200) v.z *= -1

            // Mouse Interaction
            const dx = this.mouse.x - positions[i3]!
            const dy = this.mouse.y - positions[i3 + 1]!
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < 200) {
                positions[i3]! -= dx * 0.02
                positions[i3 + 1]! -= dy * 0.02
            }
        }

        this.particles.attributes.position.needsUpdate = true
        this.updateConnections(positions)
    }

    private updateConnections(positions: Float32Array) {
        if (!this.linesMesh) return

        const lineGeometry = this.linesMesh.geometry
        const linePositions = lineGeometry.attributes.position.array as Float32Array

        let vertexIndex = 0
        let numConnected = 0
        const distSqThreshold = this.options.connectionDistance ** 2
        const count = this.options.particleCount

        for (let i = 0; i < count; i++) {
            const x1 = positions[i * 3]!
            const y1 = positions[i * 3 + 1]!
            const z1 = positions[i * 3 + 2]!

            for (let j = i + 1; j < count; j++) {
                const x2 = positions[j * 3]!
                const y2 = positions[j * 3 + 1]!
                const z2 = positions[j * 3 + 2]!

                const dx = x1 - x2
                const dy = y1 - y2
                const dz = z1 - z2
                const distSq = dx * dx + dy * dy + dz * dz

                if (distSq < distSqThreshold) {
                    linePositions[vertexIndex++] = x1
                    linePositions[vertexIndex++] = y1
                    linePositions[vertexIndex++] = z1

                    linePositions[vertexIndex++] = x2
                    linePositions[vertexIndex++] = y2
                    linePositions[vertexIndex++] = z2

                    numConnected++
                }
            }
        }

        lineGeometry.setDrawRange(0, numConnected * 2)
        lineGeometry.attributes.position.needsUpdate = true
    }

    public dispose() {
        this.stop()
        if (this.container && this.renderer.domElement.parentNode === this.container) {
            this.container.removeChild(this.renderer.domElement)
        }

        if (this.particles) this.particles.dispose()
        if (this.particleSystem) (this.particleSystem.material as THREE.Material).dispose()
        if (this.linesMesh) {
            this.linesMesh.geometry.dispose();
            (this.linesMesh.material as THREE.Material).dispose()
        }
        this.renderer.dispose()
    }
}
