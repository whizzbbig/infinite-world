float getSunShade(vec3 normal)
{
    // Normalize sun direction to ensure consistent lighting
    vec3 lightDir = normalize(uSunPosition);

    // Calculate diffuse lighting (how much surface faces the sun)
    // Positive dot product = facing sun (lit), negative = facing away (shadow)
    float sunShade = dot(normalize(normal), lightDir);

    // Remap from [-1, 1] to [0, 1] range
    // 0 = fully shadowed, 1 = fully lit
    sunShade = sunShade * 0.5 + 0.5;

    return sunShade;
}