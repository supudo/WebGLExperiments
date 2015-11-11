precision mediump float;

uniform sampler2D u_sampler;

varying highp vec2 v_textureCoord;
varying highp vec3 v_lighting;

void main(void) {
  highp vec4 texelColor = texture2D(u_sampler, v_textureCoord.st);
  gl_FragColor = vec4(texelColor.rgb * v_lighting, texelColor.a);

  //gl_FragColor = texture2D(u_sampler, v_textureCoord.st);
}