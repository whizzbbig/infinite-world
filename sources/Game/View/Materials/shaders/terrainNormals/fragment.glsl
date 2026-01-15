varying vec3 vViewNormal;

void main()
{
    // Pack view-space normal into RGB (0-1 range)
    vec3 normal = normalize(vViewNormal);
    vec3 packedNormal = normal * 0.5 + 0.5;

    // Object type 0.0 = terrain (lower outline thickness)
    gl_FragColor = vec4(packedNormal, 0.0);
}
