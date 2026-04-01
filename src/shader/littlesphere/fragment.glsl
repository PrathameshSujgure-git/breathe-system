uniform samplerCube tCube;
varying vec3 vPosition;

varying vec3 vReflect;
varying vec3 vRefract[3];
varying float vReflectionFactor;

uniform vec3 uColor;
uniform vec3 uColorReflection;
uniform vec3 uColorRefraction;

void main(){
  vec4 reflectedColor = textureCube( tCube, vec3(-vReflect.x, vReflect.yz));
  vec4 refractedColor = vec4(1.0);

  refractedColor.r = textureCube( tCube, vec3(-vRefract[0].x, vRefract[0].yz)).r;
  refractedColor.g = textureCube( tCube, vec3(-vRefract[1].x, vRefract[1].yz)).g;
  refractedColor.b = textureCube( tCube, vec3(-vRefract[2].x, vRefract[2].yz)).b;

  vec4 finalColor = mix(refractedColor, reflectedColor, clamp(vReflectionFactor, 0.0, 1.0));

  gl_FragColor = finalColor;
}
