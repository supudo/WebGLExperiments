precision mediump float;

uniform sampler2D u_sampler;

varying highp vec2 v_textureCoord;

void main(void) {
  gl_FragColor = texture2D(u_sampler, v_textureCoord.st);
}