precision mediump float;

uniform sampler2D u_image;
uniform bool u_useTexture;

varying vec2 v_texCoord;
varying vec4 v_color;

void main() {
  if (u_useTexture)
    gl_FragColor = gl_FragColor = texture2D(u_image, v_texCoord);
  else
    gl_FragColor = v_color;
}