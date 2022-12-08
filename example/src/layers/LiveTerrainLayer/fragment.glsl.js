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

  vec3 col = texture(sampler, vTexCoord).rgb;
  //vec3 col = texture(startTexture, vTexCoord).rgb;

  fragColor = vec4(mix(c,col,0.3),1.0);
  //fragColor = vec4(col,1.0);
  //fragColor = vec4(1.0,1.0,0.0,1.0);
}
`;
