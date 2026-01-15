import * as THREE from 'three'

import vertexShader from './shaders/edgeComposite/vertex.glsl'
import fragmentShader from './shaders/edgeComposite/fragment.glsl'

export default function EdgeCompositeMaterial()
{
    const material = new THREE.ShaderMaterial({
        uniforms:
        {
            uSceneTexture: { value: null },
            uDepthTexture: { value: null },
            uNormalsTexture: { value: null },
            uResolution: { value: new THREE.Vector2() },
            uCameraNear: { value: 0.1 },
            uCameraFar: { value: 5000.0 },
            uOutlineColor: { value: new THREE.Color(0x000000) },
            uOutlineThickness: { value: 1.0 },
            uTerrainThickness: { value: 0.5 },
            uPlayerThickness: { value: 1.0 },
            uGrassThickness: { value: 1.0 },
            uDepthThreshold: { value: 0.001 },
            uNormalThreshold: { value: 0.5 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        depthTest: false,
        depthWrite: false
    })

    return material
}
