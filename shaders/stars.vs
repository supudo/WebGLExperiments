attribute vec3 aVertexPosition;
uniform mat4 uPMatrix;

void main(void) {
  gl_PointSize = 2.0;
  gl_Position = uPMatrix * vec4(aVertexPosition, 1.0);
}