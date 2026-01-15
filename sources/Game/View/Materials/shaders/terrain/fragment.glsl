uniform sampler2D uThreeToneTexture;
uniform sampler2D uFogTexture;

varying vec3 vColor;
varying float vSunShade;
varying float vDepth;
varying vec2 vScreenUv;

#include ../partials/getFogColor.glsl;

void main()
{
    vec3 color = vColor;

    // Sample threeTone texture for toon shading
    float toonShade = texture2D(uThreeToneTexture, vec2(vSunShade, 0.5)).r;

    // Apply toon shading to color
    color = color * toonShade;

    // Fog
    color = getFogColor(color, vDepth, vScreenUv);

    gl_FragColor = vec4(color, 1.0);
}
