import * as THREE from 'three'

import Game from '@/Game.js'
import View from '@/View/View.js'
import State from '@/State/State.js'
import Debug from '@/Debug/Debug.js'
import NormalsMaterial from './Materials/NormalsMaterial.js'
import TerrainNormalsMaterial from './Materials/TerrainNormalsMaterial.js'
import GrassNormalsMaterial from './Materials/GrassNormalsMaterial.js'
import EdgeCompositeMaterial from './Materials/EdgeCompositeMaterial.js'

export default class PostProcessing {
    constructor() {
        this.game = Game.getInstance()
        this.view = View.getInstance()
        this.state = State.getInstance()
        this.debug = Debug.getInstance()

        this.viewport = this.state.viewport
        this.renderer = this.view.renderer
        this.scene = this.view.scene
        this.camera = this.view.camera

        // Enable/disable post-processing (for debugging)
        this.enabled = true

        // Objects to exclude from outline detection
        this.excludeFromOutlines = new Set()

        // Store original materials for restoration
        this.originalMaterials = new Map()

        this.setRenderTargets()
        this.setNormalsPass()
        this.setCompositePass()
        this.setDebug()
    }

    setRenderTargets() {
        const width = this.viewport.width * this.viewport.clampedPixelRatio
        const height = this.viewport.height * this.viewport.clampedPixelRatio

        // Main scene render target (color + depth)
        this.sceneTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType,
            depthBuffer: true,
            stencilBuffer: false
        })

        // Depth texture attachment for edge detection
        this.sceneTarget.depthTexture = new THREE.DepthTexture(width, height)
        this.sceneTarget.depthTexture.format = THREE.DepthFormat
        this.sceneTarget.depthTexture.type = THREE.UnsignedIntType

        // Normals render target
        this.normalsTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType,
            depthBuffer: true,
            stencilBuffer: false
        })
    }

    setNormalsPass() {
        // Normals material for player (object type 0.5 = thickness 1.0)
        this.playerNormalsMaterial = new NormalsMaterial(0.5)

        // Special normals material for grass (uses same vertex positioning as grass shader)
        // Object type 1.0 = grass (thickness 1.0)
        this.grassNormalsMaterial = new GrassNormalsMaterial()

        // Standard normals material for other meshes (default type 0.5)
        this.normalsMaterial = new NormalsMaterial(0.5)

        // Special normals material for terrain (reads normals from texture)
        // Object type 0.0 = terrain (thickness 0.5)
        this.terrainNormalsMaterial = new TerrainNormalsMaterial()

        // Set onBeforeRender to handle per-mesh texture (like original terrain material)
        this.terrainNormalsMaterial.onBeforeRender = (renderer, scene, camera, geometry, mesh) => {
            this.terrainNormalsMaterial.uniforms.uTexture.value = mesh.userData.texture
            this.terrainNormalsMaterial.uniformsNeedUpdate = true
        }

        // Set onBeforeRender to copy uniforms from original grass material
        this.grassNormalsMaterial.onBeforeRender = () => {
            const grassMaterial = this.view.grass.material
            this.grassNormalsMaterial.uniforms.uTime.value = grassMaterial.uniforms.uTime.value
            this.grassNormalsMaterial.uniforms.uGrassDistance.value = grassMaterial.uniforms.uGrassDistance.value
            this.grassNormalsMaterial.uniforms.uPlayerPosition.value = grassMaterial.uniforms.uPlayerPosition.value
            this.grassNormalsMaterial.uniforms.uTerrainSize.value = grassMaterial.uniforms.uTerrainSize.value
            this.grassNormalsMaterial.uniforms.uTerrainTextureSize.value = grassMaterial.uniforms.uTerrainTextureSize.value
            this.grassNormalsMaterial.uniforms.uTerrainATexture.value = grassMaterial.uniforms.uTerrainATexture.value
            this.grassNormalsMaterial.uniforms.uTerrainAOffset.value = grassMaterial.uniforms.uTerrainAOffset.value
            this.grassNormalsMaterial.uniforms.uTerrainBTexture.value = grassMaterial.uniforms.uTerrainBTexture.value
            this.grassNormalsMaterial.uniforms.uTerrainBOffset.value = grassMaterial.uniforms.uTerrainBOffset.value
            this.grassNormalsMaterial.uniforms.uTerrainCTexture.value = grassMaterial.uniforms.uTerrainCTexture.value
            this.grassNormalsMaterial.uniforms.uTerrainCOffset.value = grassMaterial.uniforms.uTerrainCOffset.value
            this.grassNormalsMaterial.uniforms.uTerrainDTexture.value = grassMaterial.uniforms.uTerrainDTexture.value
            this.grassNormalsMaterial.uniforms.uTerrainDOffset.value = grassMaterial.uniforms.uTerrainDOffset.value
            this.grassNormalsMaterial.uniforms.uNoiseTexture.value = grassMaterial.uniforms.uNoiseTexture.value
            this.grassNormalsMaterial.uniformsNeedUpdate = true
        }
    }

    setCompositePass() {
        // Full-screen quad for final composite
        this.compositeGeometry = new THREE.PlaneGeometry(2, 2)
        this.compositeMaterial = new EdgeCompositeMaterial()

        this.compositeMaterial.uniforms.uSceneTexture.value = this.sceneTarget.texture
        this.compositeMaterial.uniforms.uDepthTexture.value = this.sceneTarget.depthTexture
        this.compositeMaterial.uniforms.uNormalsTexture.value = this.normalsTarget.texture
        this.compositeMaterial.uniforms.uResolution.value = new THREE.Vector2(
            this.viewport.width * this.viewport.clampedPixelRatio,
            this.viewport.height * this.viewport.clampedPixelRatio
        )
        this.compositeMaterial.uniforms.uCameraNear.value = this.camera.instance.near
        this.compositeMaterial.uniforms.uCameraFar.value = this.camera.instance.far
        this.compositeMaterial.uniforms.uOutlineColor.value = new THREE.Color(0x000000)
        this.compositeMaterial.uniforms.uOutlineThickness.value = 1.0
        this.compositeMaterial.uniforms.uTerrainThickness.value = 0.4
        this.compositeMaterial.uniforms.uPlayerThickness.value = 0.4
        this.compositeMaterial.uniforms.uGrassThickness.value = 1.0
        this.compositeMaterial.uniforms.uDepthThreshold.value = 1.0
        this.compositeMaterial.uniforms.uNormalThreshold.value = 0.4

        this.compositeMesh = new THREE.Mesh(this.compositeGeometry, this.compositeMaterial)
        this.compositeMesh.frustumCulled = false

        // Separate scene for composite pass
        this.compositeScene = new THREE.Scene()
        this.compositeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
        this.compositeScene.add(this.compositeMesh)
    }

    excludeFromOutlinePass(mesh) {
        this.excludeFromOutlines.add(mesh)
    }

    renderNormalsPass() {
        const terrainMaterial = this.view.terrains.material
        const playerMaterial = this.view.player.helper.material
        const grassMaterial = this.view.grass.material

        // Store original visibilities and materials
        this.scene.traverse((object) => {
            if (object.isMesh) {
                // Skip excluded objects (sky background, etc.)
                if (this.excludeFromOutlines.has(object)) {
                    object.userData.wasVisible = object.visible
                    object.visible = false
                    return
                }

                // Skip objects without depth (sky background)
                if (object.material && object.material.depthTest === false) {
                    object.userData.wasVisible = object.visible
                    object.visible = false
                    return
                }

                // Store original material
                this.originalMaterials.set(object, object.material)

                // Use terrain normals material for terrain meshes (type 0.0 = thickness 0.5)
                if (object.material === terrainMaterial) {
                    // Texture is set via onBeforeRender callback
                    object.material = this.terrainNormalsMaterial
                }
                // Use player normals material for player (type 0.5 = thickness 1.0)
                else if (object.material === playerMaterial) {
                    object.material = this.playerNormalsMaterial
                }
                // Use grass normals material for grass (type 1.0 = thickness 1.0)
                else if (object.material === grassMaterial) {
                    object.material = this.grassNormalsMaterial
                }
                else {
                    object.material = this.normalsMaterial
                }
            }

            // Hide points (stars)
            if (object.isPoints) {
                object.userData.wasVisible = object.visible
                object.visible = false
            }
        })

        // Render normals
        this.renderer.instance.setRenderTarget(this.normalsTarget)
        this.renderer.instance.setClearColor(0x8080ff, 1) // Neutral normal (pointing up)
        this.renderer.instance.clear()
        this.renderer.instance.render(this.scene, this.camera.instance)

        // Restore original materials and visibilities
        this.originalMaterials.forEach((material, object) => {
            object.material = material
        })
        this.originalMaterials.clear()

        this.scene.traverse((object) => {
            if (object.userData.wasVisible !== undefined) {
                object.visible = object.userData.wasVisible
                delete object.userData.wasVisible
            }
        })

        // Reset clear color
        this.renderer.instance.setClearColor(this.renderer.clearColor, 1)
    }

    render() {
        // Debug stats
        if (this.debug.stats)
            this.debug.stats.beforeRender()

        // Bypass post-processing if disabled
        if (!this.enabled) {
            this.renderer.instance.setRenderTarget(null)
            this.renderer.instance.render(this.scene, this.camera.instance)

            if (this.debug.stats)
                this.debug.stats.afterRender()
            return
        }

        // 1. Render normals pass (for edge detection)
        this.renderNormalsPass()

        // 2. Render main scene to texture
        this.renderer.instance.setRenderTarget(this.sceneTarget)
        this.renderer.instance.render(this.scene, this.camera.instance)

        // 3. Composite with edge detection
        this.renderer.instance.setRenderTarget(null)
        this.renderer.instance.render(this.compositeScene, this.compositeCamera)

        // Debug stats
        if (this.debug.stats)
            this.debug.stats.afterRender()
    }

    resize() {
        const width = this.viewport.width * this.viewport.clampedPixelRatio
        const height = this.viewport.height * this.viewport.clampedPixelRatio

        this.sceneTarget.setSize(width, height)
        this.normalsTarget.setSize(width, height)

        this.compositeMaterial.uniforms.uResolution.value.set(width, height)
        this.compositeMaterial.uniforms.uCameraNear.value = this.camera.instance.near
        this.compositeMaterial.uniforms.uCameraFar.value = this.camera.instance.far
    }

    setDebug() {
        if (!this.debug.active)
            return

        const folder = this.debug.ui.getFolder('view/postProcessing')

        folder.add(this, 'enabled').name('enabled (outlines)')

        folder.add(this.compositeMaterial.uniforms.uOutlineThickness, 'value')
            .min(0.1).max(3.0).step(0.1).name('outlineThickness (fallback)')

        folder.add(this.compositeMaterial.uniforms.uTerrainThickness, 'value')
            .min(0.1).max(3.0).step(0.1).name('terrainThickness')

        folder.add(this.compositeMaterial.uniforms.uPlayerThickness, 'value')
            .min(0.1).max(3.0).step(0.1).name('playerThickness')

        folder.add(this.compositeMaterial.uniforms.uGrassThickness, 'value')
            .min(0.1).max(3.0).step(0.1).name('grassThickness')

        folder.add(this.compositeMaterial.uniforms.uDepthThreshold, 'value')
            .min(0.0001).max(0.1).step(0.0001).name('depthThreshold')

        folder.add(this.compositeMaterial.uniforms.uNormalThreshold, 'value')
            .min(0.1).max(1.0).step(0.05).name('normalThreshold')

        folder.addColor(this.compositeMaterial.uniforms.uOutlineColor, 'value')
            .name('outlineColor')
    }

    destroy() {
        this.sceneTarget.dispose()
        this.normalsTarget.dispose()
        this.compositeGeometry.dispose()
        this.compositeMaterial.dispose()
        this.normalsMaterial.dispose()
        this.playerNormalsMaterial.dispose()
        this.grassNormalsMaterial.dispose()
        this.terrainNormalsMaterial.dispose()
    }
}
