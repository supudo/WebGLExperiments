attribute highp vec3 a_vertexNormal;
attribute vec3 a_vertexPosition;
attribute vec2 a_textureCoord;

uniform vec3 u_ambientColor;
uniform vec3 u_lightingDirection;
uniform vec3 u_directionalColor;

uniform highp mat3 u_NormalMatrix;
uniform mat4 u_MVMatrix;
uniform mat4 u_PMatrix;

varying highp vec2 v_textureCoord;
varying highp vec3 v_lighting;

void main(void) {
  gl_Position = u_PMatrix * u_MVMatrix * vec4(a_vertexPosition, 1.0);
  v_textureCoord = a_textureCoord;

  vec3 transformedNormal = u_NormalMatrix * a_vertexNormal;
  float directionalLightWeighting = max(dot(transformedNormal, u_lightingDirection), 0.0);
  v_lighting = u_ambientColor + u_directionalColor * directionalLightWeighting;

  //highp vec3 ambientLight = vec3(0.6, 0.6, 0.6);
  //highp vec3 directionalLightColor = vec3(0.5, 0.5, 0.75);
  //highp vec3 directionalVector = vec3(0.85, 0.8, 0.75);
  //highp vec4 transformedNormal = u_NormalMatrix * vec4(a_vertexNormal, 1.0);
  //highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
  //v_lighting = ambientLight + (directionalLightColor * directional);
}