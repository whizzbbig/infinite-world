import * as THREE from 'three'

import Game from '@/Game.js'
import View from '@/View/View.js'
import Debug from '@/Debug/Debug.js'
import State from '@/State/State.js'
import PlayerMaterial from './Materials/PlayerMaterial.js'

export default class Player
{
    constructor()
    {
        this.game = Game.getInstance()
        this.state = State.getInstance()
        this.view = View.getInstance()
        this.debug = Debug.getInstance()

        this.scene = this.view.scene

        this.setGroup()
        this.setHelper()
        this.setDebug()
    }

    setGroup()
    {
        this.group = new THREE.Group()
        this.scene.add(this.group)
    }
    
    setHelper()
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

        this.helper = new THREE.Mesh()
        this.helper.material = new PlayerMaterial()
        this.helper.material.uniforms.uColor.value = new THREE.Color('#fff8d6')
        this.helper.material.uniforms.uSunPosition.value = new THREE.Vector3(- 0.5, - 0.5, - 0.5)
        this.helper.material.uniforms.uThreeToneTexture.value = this.toonTexture

        this.helper.geometry = new THREE.CapsuleGeometry(0.5, 0.8, 3, 16),
        this.helper.geometry.translate(0, 0.9, 0)
        this.group.add(this.helper)

        // const arrow = new THREE.Mesh(
        //     new THREE.ConeGeometry(0.2, 0.2, 4),
        //     new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false })
        // )
        // arrow.rotation.x = - Math.PI * 0.5
        // arrow.position.y = 1.5
        // arrow.position.z = - 0.5
        // this.helper.add(arrow)
        
        // // Axis helper
        // this.axisHelper = new THREE.AxesHelper(3)
        // this.group.add(this.axisHelper)
    }

    setDebug()
    {
        if(!this.debug.active)
            return

        const playerFolder = this.debug.ui.getFolder('view/player')

        playerFolder.addColor(this.helper.material.uniforms.uColor, 'value')

        // Toon shading controls
        playerFolder
            .add(this.toonConfig, 'texture', ['threeTone', 'fourTone', 'fiveTone'])
            .name('Toon Texture')
            .onChange(() => this.updateToonTexture())

        playerFolder
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
        this.helper.material.uniforms.uThreeToneTexture.value = this.toonTexture
    }


    update()
    {
        const playerState = this.state.player
        const sunState = this.state.sun

        this.group.position.set(
            playerState.position.current[0],
            playerState.position.current[1],
            playerState.position.current[2]
        )
        
        // Helper
        this.helper.rotation.y = playerState.rotation
        this.helper.material.uniforms.uSunPosition.value.set(sunState.position.x, sunState.position.y, sunState.position.z)
    }
}
