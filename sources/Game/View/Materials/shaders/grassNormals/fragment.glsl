varying vec3 vViewNormal;

void main()
{
    // Pack view-space normal into RGB (0-1 range)
    vec3 normal = normalize(vViewNormal);
    vec3 packedNormal = normal * 0.5 + 0.5;

    // Object type 1.0 = grass (higher outline thickness)
    gl_FragColor = vec4(packedNormal, 1.0);
}
