export default `#version 300 es
#define SHADER_NAME live-terrain-layer-fragment
precision highp float;
uniform bool hasTexture;
uniform sampler2D sampler;
uniform float opacity;
in vec2 vTexCoord;
in vec3 normals_commonspace;
in vec4 position_commonspace;
in vec4 vColor;
out vec4 fragColor;

varying vec3 c;

void main() {
  geometry.uv = vTexCoord;

  fragColor = vec4(c,1.0);
}
`;
