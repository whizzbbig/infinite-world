import * as THREE from 'three'

import vertexShader from './shaders/normals/vertex.glsl'
import fragmentShader from './shaders/normals/fragment.glsl'

// Object type IDs for different outline thicknesses
// 0.0 = terrain (thickness 0.5)
// 0.5 = player (thickness 1.0)
// 1.0 = grass (thickness 1.0)
export default function NormalsMaterial(objectType = 0.5)
{
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uObjectType: { value: objectType }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    })

    return material
}
