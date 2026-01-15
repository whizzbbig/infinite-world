uniform vec3 uSunPosition;
uniform vec3 uColor;
uniform sampler2D uThreeToneTexture;

varying vec3 vGameNormal;

#include ../partials/getSunShade.glsl;

void main()
{
    vec3 color = uColor;

    // Get sun shade for toon shading
    float sunShade = getSunShade(vGameNormal);

    // Sample threeTone texture for toon shading
    float toonShade = texture2D(uThreeToneTexture, vec2(sunShade, 0.5)).r;

    // Apply toon shading to color
    color = color * toonShade;

    gl_FragColor = vec4(color, 1.0);
}
