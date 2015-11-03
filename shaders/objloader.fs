precision mediump float;

varying vec2 vTextureCoord;
varying vec3 vTransformedNormal;
varying vec4 vPosition;

uniform vec3 uAmbientColor;

uniform vec4 uColor;
uniform vec3 uLightLocation;
uniform vec3 uSpotDirection;
uniform vec3 uLightSpecularColor;
uniform vec3 uLightDiffuseColor;
uniform bool uHasTexure;
uniform bool uHasFlashlight;

uniform sampler2D uSampler;

uniform float uMaterialShininess;

const float spotExponent = 40.0;
const float flashSpotExponent = 50.0;
const float spotCosCutoff = 0.9;   // corresponds to 14 degrees
const float flashSpotCosCutoff = 0.9;   // corresponds to 14 degrees

vec3 lightWeighting = vec3( 0.0, 0.0, 0.0 );
vec3 flashlightWeighting = vec3( 0.0, 0.0, 0.0 );
vec4 fragmentColor;
float spotEffect, rdotv, specularLightWeighting, diffuseLightWeighting;

void main(void) {
  const float LOG2 = 1.442695;
  float z = gl_FragCoord.z / gl_FragCoord.w;
  float fogFactor = exp2(-0.5 * 0.2 * z * z * LOG2);
  fogFactor = clamp(fogFactor, 0.0, 1.0);

  vec3 vectorToLightSource = normalize(uLightLocation - vPosition.xyz / vPosition.w);

  diffuseLightWeighting = max(dot(vTransformedNormal, vectorToLightSource), 0.0);

  if (diffuseLightWeighting > 0.0) {
    spotEffect = dot(normalize(uSpotDirection), normalize(-vectorToLightSource));

    if (spotEffect > spotCosCutoff) {
      spotEffect = pow(spotEffect, spotExponent);

      vec3 reflectionVector = normalize(reflect(-vectorToLightSource, vTransformedNormal));

      vec3 viewVectorEye = -normalize(vPosition.xyz / vPosition.w);
      rdotv = max(dot(reflectionVector, viewVectorEye), 0.0);
      specularLightWeighting = pow(rdotv, uMaterialShininess);

      lightWeighting =
        spotEffect * uLightDiffuseColor * diffuseLightWeighting +
        spotEffect * uLightSpecularColor * specularLightWeighting;
    }
  }

  if (uHasFlashlight) {
    vec3 flashlightLocation = vec3(0,0,0);
    vec3 flashlightVector = vec3(0,0,-1);

    vectorToLightSource = normalize(flashlightLocation - vPosition.xyz / vPosition.w);
    diffuseLightWeighting = max(dot(vTransformedNormal, vectorToLightSource), 0.0);

    if (diffuseLightWeighting > 0.0) {
      spotEffect = dot(normalize(flashlightVector), normalize(-vectorToLightSource));

      if (spotEffect > flashSpotCosCutoff) {
        spotEffect = pow(spotEffect, flashSpotExponent);

        vec3 reflectionVector = normalize(reflect(-vectorToLightSource, vTransformedNormal));

        vec3 viewVectorEye = -normalize(vPosition.xyz / vPosition.w);
        rdotv = max(dot(reflectionVector, viewVectorEye), 0.0);
        specularLightWeighting = pow(rdotv, uMaterialShininess);

        flashlightWeighting =
          spotEffect * (uLightDiffuseColor + vec3( 2.0,2.0,2.0 ) )* diffuseLightWeighting +
          spotEffect * uLightSpecularColor * specularLightWeighting;
      }
    }
  }

  lightWeighting += uAmbientColor;
  lightWeighting += flashlightWeighting;
  if (uHasTexure) {
    vec4 fragmentColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
    gl_FragColor = vec4(fragmentColor.rgb * lightWeighting, fragmentColor.a);
    gl_FragColor = mix(vec4(0.0,0.0,0.0,1.0), gl_FragColor, fogFactor);
  }
  else {
    gl_FragColor = vec4(uColor.rgb * lightWeighting, uColor.a);
    gl_FragColor = mix(vec4(0.0,0.0,0.0,1.0), gl_FragColor, fogFactor);
  }
}