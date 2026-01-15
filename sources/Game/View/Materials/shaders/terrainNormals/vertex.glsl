uniform sampler2D uTexture;

varying vec3 vViewNormal;

void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;

    // Read normal from terrain texture (stored in RGB)
    vec4 terrainData = texture2D(uTexture, uv);
    vec3 normal = terrainData.rgb;

    // Transform normal to view space
    vViewNormal = normalize(normalMatrix * normal);
}
