import * as THREE from 'three'

import Game from '@/Game.js'
import View from '@/View/View.js'
import Debug from '@/Debug/Debug.js'
import State from '@/State/State.js'
import Terrain from './Terrain.js'
import TerrainGradient from './TerrainGradient.js'
import TerrainMaterial from './Materials/TerrainMaterial.js'

export default class Terrains
{
    constructor()
    {
        this.game = Game.getInstance()
        this.state = State.getInstance()
        this.view = View.getInstance()
        this.debug = Debug.getInstance()

        this.viewport = this.state.viewport
        this.sky =  this.view.sky

        this.setGradient()
        this.setMaterial()
        this.setDebug()

        this.state.terrains.events.on('create', (engineTerrain) =>
        {
            const terrain = new Terrain(this, engineTerrain)

            engineTerrain.events.on('destroy', () =>
            {
                terrain.destroy()
            })
        })
    }

    setGradient()
    {
        this.gradient = new TerrainGradient()
    }

    setMaterial()
    {
        // Texture loader for toon textures
        this.textureLoader = new THREE.TextureLoader()

        // Toon shading configuration
        this.toonConfig = {
            texture: 'threeTone',
            filter: 'Nearest'
        }

        // Load initial threeTone texture
        this.toonTexture = this.textureLoader.load('/textures/threeTone.jpg')
        this.toonTexture.minFilter = THREE.NearestFilter
        this.toonTexture.magFilter = THREE.NearestFilter

        this.material = new TerrainMaterial()
        this.material.uniforms.uPlayerPosition.value = new THREE.Vector3()
        this.material.uniforms.uSunPosition.value = new THREE.Vector3(- 0.5, - 0.5, - 0.5)
        this.material.uniforms.uFogTexture.value = this.sky.customRender.texture
        this.material.uniforms.uGrassDistance.value = this.state.chunks.minSize * 1.5
        this.material.uniforms.uThreeToneTexture.value = this.toonTexture

        this.material.onBeforeRender = (renderer, scene, camera, geometry, mesh) =>
        {
            this.material.uniforms.uTexture.value = mesh.userData.texture
            this.material.uniformsNeedUpdate = true
        }

        // this.material.wireframe = true

        // const dummy = new THREE.Mesh(
        //     new THREE.SphereGeometry(30, 64, 32),
        //     this.material
        // )
        // dummy.position.y = 50
        // this.scene.add(dummy)
    }

    setDebug()
    {
        if(!this.debug.active)
            return

        const folder = this.debug.ui.getFolder('view/terrains')

        folder
            .add(this.material, 'wireframe')

        // Toon shading controls
        folder
            .add(this.toonConfig, 'texture', ['threeTone', 'fourTone', 'fiveTone'])
            .name('Toon Texture')
            .onChange(() => this.updateToonTexture())

        folder
            .add(this.toonConfig, 'filter', ['Nearest', 'Linear'])
            .name('Toon Filter')
            .onChange(() => this.updateToonTexture())
    }

    updateToonTexture()
    {
        // Dispose old texture
        if(this.toonTexture)
            this.toonTexture.dispose()

        // Load new texture
        this.toonTexture = this.textureLoader.load(`/textures/${this.toonConfig.texture}.jpg`)

        // Set filter
        const filter = this.toonConfig.filter === 'Nearest' ? THREE.NearestFilter : THREE.LinearFilter
        this.toonTexture.minFilter = filter
        this.toonTexture.magFilter = filter

        // Update material
        this.material.uniforms.uThreeToneTexture.value = this.toonTexture
    }

    update()
    {
        const playerState = this.state.player
        const playerPosition = playerState.position.current
        const sunState = this.state.sun

        this.material.uniforms.uPlayerPosition.value.set(playerPosition[0], playerPosition[1], playerPosition[2])
        this.material.uniforms.uSunPosition.value.set(sunState.position.x, sunState.position.y, sunState.position.z)
    }

    resize()
    {
    }
}