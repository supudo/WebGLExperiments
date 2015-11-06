attribute vec4 a_position;
uniform mat4 u_matrix;

attribute vec4 a_color;
attribute vec2 a_texCoord;

varying vec4 v_color;
varying vec2 v_texCoord;

void main() {
  gl_Position = u_matrix * a_position;
  v_color = a_color;
  v_texCoord = a_texCoord;
}