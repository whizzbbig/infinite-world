import * as THREE from 'three'

import vertexShader from './shaders/terrainNormals/vertex.glsl'
import fragmentShader from './shaders/terrainNormals/fragment.glsl'

export default function TerrainNormalsMaterial()
{
    const material = new THREE.ShaderMaterial({
        uniforms:
        {
            uTexture: { value: null }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    })

    return material
}
