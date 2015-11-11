precision mediump float;

uniform sampler2D u_sampler;
uniform float u_alpha;
uniform vec4 u_color;

varying highp vec2 v_textureCoord;
varying highp vec3 v_lighting;

void main(void) {
  highp vec4 texelColor = texture2D(u_sampler, v_textureCoord.st) * u_color;
  gl_FragColor = vec4(texelColor.rgb * v_lighting, texelColor.a * u_alpha);

  //gl_FragColor = texture2D(u_sampler, v_textureCoord.st);
}