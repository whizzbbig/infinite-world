uniform sampler2D uSceneTexture;
uniform sampler2D uDepthTexture;
uniform sampler2D uNormalsTexture;
uniform vec2 uResolution;
uniform float uCameraNear;
uniform float uCameraFar;
uniform vec3 uOutlineColor;
uniform float uOutlineThickness;
uniform float uTerrainThickness;
uniform float uPlayerThickness;
uniform float uGrassThickness;
uniform float uDepthThreshold;
uniform float uNormalThreshold;

varying vec2 vUv;

// Convert depth buffer value to linear depth
float linearizeDepth(float depth)
{
    float z = depth * 2.0 - 1.0; // Back to NDC
    return (2.0 * uCameraNear * uCameraFar) / (uCameraFar + uCameraNear - z * (uCameraFar - uCameraNear));
}

// Get outline thickness based on object type
// Object types: 0.0 = terrain, 0.5 = player, 1.0 = grass
float getThicknessForObjectType(float objectType)
{
    if (objectType < 0.25) {
        return uTerrainThickness;
    } else if (objectType < 0.75) {
        return uPlayerThickness;
    } else {
        return uGrassThickness;
    }
}

// Sobel edge detection on depth with per-object thickness
float sobelDepth(vec2 uv, float thickness)
{
    vec2 texelSize = thickness / uResolution;

    float topLeft = linearizeDepth(texture2D(uDepthTexture, uv + vec2(-1.0, 1.0) * texelSize).r);
    float top = linearizeDepth(texture2D(uDepthTexture, uv + vec2(0.0, 1.0) * texelSize).r);
    float topRight = linearizeDepth(texture2D(uDepthTexture, uv + vec2(1.0, 1.0) * texelSize).r);
    float left = linearizeDepth(texture2D(uDepthTexture, uv + vec2(-1.0, 0.0) * texelSize).r);
    float right = linearizeDepth(texture2D(uDepthTexture, uv + vec2(1.0, 0.0) * texelSize).r);
    float bottomLeft = linearizeDepth(texture2D(uDepthTexture, uv + vec2(-1.0, -1.0) * texelSize).r);
    float bottom = linearizeDepth(texture2D(uDepthTexture, uv + vec2(0.0, -1.0) * texelSize).r);
    float bottomRight = linearizeDepth(texture2D(uDepthTexture, uv + vec2(1.0, -1.0) * texelSize).r);

    // Sobel operators
    float gx = topLeft + 2.0 * left + bottomLeft - topRight - 2.0 * right - bottomRight;
    float gy = topLeft + 2.0 * top + topRight - bottomLeft - 2.0 * bottom - bottomRight;

    return sqrt(gx * gx + gy * gy);
}

// Sobel edge detection on normals with per-object thickness
float sobelNormal(vec2 uv, float thickness)
{
    vec2 texelSize = thickness / uResolution;

    vec3 topLeft = texture2D(uNormalsTexture, uv + vec2(-1.0, 1.0) * texelSize).rgb;
    vec3 top = texture2D(uNormalsTexture, uv + vec2(0.0, 1.0) * texelSize).rgb;
    vec3 topRight = texture2D(uNormalsTexture, uv + vec2(1.0, 1.0) * texelSize).rgb;
    vec3 left = texture2D(uNormalsTexture, uv + vec2(-1.0, 0.0) * texelSize).rgb;
    vec3 right = texture2D(uNormalsTexture, uv + vec2(1.0, 0.0) * texelSize).rgb;
    vec3 bottomLeft = texture2D(uNormalsTexture, uv + vec2(-1.0, -1.0) * texelSize).rgb;
    vec3 bottom = texture2D(uNormalsTexture, uv + vec2(0.0, -1.0) * texelSize).rgb;
    vec3 bottomRight = texture2D(uNormalsTexture, uv + vec2(1.0, -1.0) * texelSize).rgb;

    // Sobel operators for each channel
    vec3 gx = topLeft + 2.0 * left + bottomLeft - topRight - 2.0 * right - bottomRight;
    vec3 gy = topLeft + 2.0 * top + topRight - bottomLeft - 2.0 * bottom - bottomRight;

    return length(gx) + length(gy);
}

void main()
{
    // Sample original scene
    vec4 sceneColor = texture2D(uSceneTexture, vUv);

    // Get object type from normals texture alpha channel
    float objectType = texture2D(uNormalsTexture, vUv).a;
    float thickness = getThicknessForObjectType(objectType);

    // Edge detection with per-object thickness
    float depthEdge = sobelDepth(vUv, thickness);
    float normalEdge = sobelNormal(vUv, thickness);

    // Threshold and combine edges
    float depthOutline = step(uDepthThreshold, depthEdge);
    float normalOutline = step(uNormalThreshold, normalEdge);
    float outline = max(depthOutline, normalOutline);

    // Blend outline with scene
    vec3 finalColor = mix(sceneColor.rgb, uOutlineColor, outline);

    gl_FragColor = vec4(finalColor, 1.0);
}
