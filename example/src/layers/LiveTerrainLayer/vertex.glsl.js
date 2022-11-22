export default `#version 300 es
#define SHADER_NAME live-terrain-layer-vertex
// Scale the model
uniform float sizeScale;
uniform bool composeModelMatrix;
// Primitive attributes
in vec3 positions;
in vec3 colors;
in vec2 texCoords;
// Instance attributes
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec4 instanceColors;
in vec3 instancePickingColors;
in mat3 instanceModelMatrix;
in vec3 instanceTranslation;
// Outputs to fragment shader
out vec2 vTexCoord;
out vec4 position_commonspace;
out vec4 vColor;

uniform sampler2D startTexture;
uniform sampler2D endTexture;
uniform float alpha;
uniform float scale;

uniform sampler2D albedo;

float height;
varying vec3 c;

float getHeightOf(sampler2D tex, vec2 uv){
  vec4 col = texture(tex, uv);
  return (-10000.0 + ((round(col.r*256.0) * 65536.0 + round(col.g*256.0) * 256.0 + round(col.b*256.0)) * 0.1)) * 0.00001;
}

void main() {
  geometry.worldPosition = instancePositions;
  geometry.uv = texCoords * 2.0;
  geometry.pickingColor = instancePickingColors;
  vTexCoord = texCoords;
  vColor = vec4(colors * instanceColors.rgb, instanceColors.a);
  vec3 pos = (instanceModelMatrix * positions) * sizeScale + instanceTranslation;

  if (composeModelMatrix) {
    DECKGL_FILTER_SIZE(pos, geometry);
    gl_Position = project_position_to_clipspace(pos + instancePositions, instancePositions64Low, vec3(0.0), position_commonspace);
    geometry.position = position_commonspace;
  }else {
    pos = project_size(pos);
    DECKGL_FILTER_SIZE(pos, geometry);
    gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, pos, position_commonspace);
    geometry.position = position_commonspace;
  }

  vec4 color = texture2D(startTexture, texCoords);

  vec3 off = vec3(0.0015, 0.0015, 0.0);
  vec2 P = vTexCoord;

  float hL = getHeightOf(startTexture, P.xy - off.xz)*100.0;
  float hR = getHeightOf(startTexture, P.xy + off.xz)*100.0;
  float hD = getHeightOf(startTexture, P.xy - off.zy)*100.0;
  float hU = getHeightOf(startTexture, P.xy + off.zy)*100.0;

  vec3 N;
  N.x = hL - hR;
  N.y = hD - hU;
  N.z = 0.02;
  N = normalize(N);

  float s = dot(N,normalize(vec3(0.8,1.0,0.8)));
  c = vec3(s,s,s);

  height = mix(getHeightOf(startTexture, vTexCoord),getHeightOf(startTexture, vTexCoord),alpha);
  gl_Position += project_common_position_to_clipspace(vec4(0.0,0.0,height*1.0,1.0));
}
`;
