vec3 getFogColor(vec3 baseColor, float depth, vec2 screenUv)
{
    float uFogIntensity = 0.0025;

    // Clamp UV to valid range to prevent sampling outside texture
    vec2 clampedUv = clamp(screenUv, 0.001, 0.999);
    vec3 fogColor = texture2D(uFogTexture, clampedUv).rgb;

    // Ensure fog color has minimum brightness to prevent black silhouettes
    // This handles cases where fog texture might have dark or uninitialized areas
    float minBrightness = 0.2;
    float fogLuminance = dot(fogColor, vec3(0.299, 0.587, 0.114));

    // Blend toward a neutral sky color if fog color is too dark
    vec3 fallbackColor = vec3(0.4, 0.5, 0.6);
    float darkFix = smoothstep(0.0, minBrightness, fogLuminance);
    fogColor = mix(fallbackColor, fogColor, darkFix);

    // Calculate fog intensity based on depth
    float fogIntensity = 1.0 - exp(-uFogIntensity * uFogIntensity * depth * depth);

    // Limit maximum fog intensity to preserve terrain color at distance
    // This prevents complete washout and keeps toon shading visible
    fogIntensity = min(fogIntensity, 0.85);

    return mix(baseColor, fogColor, fogIntensity);
}