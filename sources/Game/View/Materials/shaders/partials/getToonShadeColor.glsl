vec3 getToonShadeColor(vec3 baseColor, float sunShade)
{
    // sunShade: 0 = fully shadowed, 1 = fully lit
    // Use sunShade directly as light intensity (no inversion needed)
    float lightIntensity = sunShade;

    // 3-tone thresholds for cel shading
    // Lower threshold = transition from shadow to mid tone
    // Higher threshold = transition from mid tone to highlight
    float shadowThreshold = 0.3;
    float midThreshold = 0.65;

    // Ambient light factor - ensures minimum visibility even in shadow
    float ambientStrength = 0.45;

    // Define toon color bands with cel-shading style
    // Shadow: darker but not black, with slight cool tint for depth
    vec3 shadowColor = baseColor * vec3(ambientStrength * 0.8, ambientStrength * 0.9, ambientStrength * 1.0);

    // Mid tone: slightly desaturated, medium brightness
    vec3 midColor = baseColor * vec3(0.75, 0.8, 0.85);

    // Highlight: full color brightness
    vec3 lightColor = baseColor;

    // Step function for hard cel-shading bands
    vec3 result = shadowColor;
    result = mix(result, midColor, step(shadowThreshold, lightIntensity));
    result = mix(result, lightColor, step(midThreshold, lightIntensity));

    return result;
}
