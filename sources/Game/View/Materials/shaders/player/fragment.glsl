uniform vec3 uSunPosition;
uniform vec3 uColor;

varying vec3 vGameNormal;

#include ../partials/getSunShade.glsl;

// Player-specific toon shading with better coverage for 3D characters
vec3 getPlayerToonColor(vec3 baseColor, float sunShade)
{
    // Higher ambient for character visibility
    float ambientStrength = 0.6;

    // Softer 2-band toon shading for rounded objects
    float shadowThreshold = 0.4;

    // Shadow: slightly darker but preserves color hue (no cool tint)
    vec3 shadowColor = baseColor * ambientStrength;

    // Highlight: full brightness
    vec3 lightColor = baseColor;

    // Smooth step for softer transition on curved surfaces
    float toonFactor = smoothstep(shadowThreshold - 0.1, shadowThreshold + 0.1, sunShade);

    return mix(shadowColor, lightColor, toonFactor);
}

void main()
{
    vec3 color = uColor;

    // Toon shading optimized for player character
    float sunShade = getSunShade(vGameNormal);
    color = getPlayerToonColor(color, sunShade);

    gl_FragColor = vec4(color, 1.0);
}