attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
uniform bool u_dorotate;

varying vec2 v_texCoord;
uniform mat3 u_matrix;

void main() {
  vec2 position;
  if (u_dorotate)
    position = (u_matrix * vec3(a_position, 1)).xy;
  else {
    vec2 rotatedPosition = vec2(
      a_position.x * u_rotation.y + a_position.y * u_rotation.x,
      a_position.y * u_rotation.y - a_position.x * u_rotation.x
    );
    position = rotatedPosition + u_translation;
  }

  //vec2 zeroToOne = position / u_resolution;
  vec2 zeroToOne = a_position / u_resolution;
  vec2 zeroToTwo = zeroToOne * 2.0;
  vec2 clipSpace = zeroToTwo - 1.0;
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

  v_texCoord = a_texCoord;
}