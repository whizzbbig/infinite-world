uniform sampler2D uThreeToneTexture;

varying vec3 vColor;
varying float vSunShade;

void main()
{
    // Sample threeTone texture for toon shading
    // Use sunShade as x coordinate (0 = shadow, 1 = lit)
    float toonShade = texture2D(uThreeToneTexture, vec2(vSunShade, 0.5)).r;

    // Apply toon shading to color
    vec3 color = vColor * toonShade;

    gl_FragColor = vec4(color, 1.0);
}
