uniform vec3 uPlayerPosition;
uniform vec3 uSunPosition;
uniform float uGrassDistance;
uniform sampler2D uTexture;
uniform sampler2D uFogTexture;

varying vec3 vColor;
varying float vSunShade;
varying float vDepth;
varying vec2 vScreenUv;

#include ../partials/inverseLerp.glsl
#include ../partials/remap.glsl
#include ../partials/getGrassAttenuation.glsl;
#include ../partials/getSunShade.glsl;

void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    float depth = - viewPosition.z;
    gl_Position = projectionMatrix * viewPosition;

    // Terrain data
    vec4 terrainData = texture2D(uTexture, uv);
    vec3 normal = terrainData.rgb;

    // Slope (0 = flat, 1 = vertical)
    float slope = 1.0 - abs(dot(vec3(0.0, 1.0, 0.0), normal));

    // Color
    vec3 uGrassDefaultColor = vec3(0.52, 0.65, 0.26);
    vec3 uGrassShadedColor = vec3(0.52 / 1.3, 0.65 / 1.3, 0.26 / 1.3);

    // Grass distance attenuation
    // Terrain must match the bottom of the grass which is darker
    float grassDistanceAttenuation = getGrassAttenuation(modelPosition.xz);
    float grassSlopeAttenuation = smoothstep(remap(slope, 0.4, 0.5, 1.0, 0.0), 0.0, 1.0);
    float grassAttenuation = grassDistanceAttenuation * grassSlopeAttenuation;
    vec3 grassColor = mix(uGrassShadedColor, uGrassDefaultColor, 1.0 - grassAttenuation);

    vec3 color = grassColor;

    // Sun shade for toon shading - passed to fragment
    float sunShade = getSunShade(normal);

    // Varyings
    vColor = color;
    vSunShade = sunShade;
    vDepth = depth;
    vScreenUv = (gl_Position.xy / gl_Position.w * 0.5) + 0.5;
}
