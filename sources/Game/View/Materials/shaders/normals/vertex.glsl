varying vec3 vViewNormal;

void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;

    // Transform normal to view space
    vViewNormal = normalize(normalMatrix * normal);
}
