attribute vec3 a_vertexPosition;
attribute vec2 a_textureCoord;

uniform mat4 u_MVMatrix;
uniform mat4 u_PMatrix;

varying highp vec2 v_textureCoord;

void main(void) {
  gl_Position = u_PMatrix * u_MVMatrix * vec4(a_vertexPosition, 1.0);
  v_textureCoord = a_textureCoord;
}