import * as THREE from "three";
import bigsphereVertexShader from "./shader/bigsphere/vertex.glsl";
import bigsphereFragmentShader from "./shader/bigsphere/fragment.glsl";
import littlesphereVertexShader from "./shader/littlesphere/vertex.glsl";
import littlesphereFragmentShader from "./shader/littlesphere/fragment.glsl";
import { DotScreenShader } from "./CustomShader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

export function initBlob(canvas) {
  const scene = new THREE.Scene();

  // Cube camera for reflections
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
    format: THREE.RGBAFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipMapLinearFilter,
  });
  const cubeCamera = new THREE.CubeCamera(0.1, 10, cubeRenderTarget);

  // Colors — warm cream / sage / stone palette
  const colors = {
    first: "#F5F2ED",    // warm cream
    second: "#C8C3B8",   // warm stone
    accent: "#8A9A8F",   // sage green
  };

  // Big sphere (background pattern)
  const bigSphereMaterial = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      time: { value: 0 },
      effectSpeed: { value: 0.15 },
      uStripes: { value: 0.08 },
      uBasePattern: { value: 0.55 },
      uPatternValue: { value: 0.12 },
      uFirstColor: { value: new THREE.Color(colors.first) },
      uSecondColor: { value: new THREE.Color(colors.second) },
      uAccentColor: { value: new THREE.Color(colors.accent) },
      resolution: { value: new THREE.Vector4() },
    },
    vertexShader: bigsphereVertexShader,
    fragmentShader: bigsphereFragmentShader,
  });

  const bigSphereGeometry = new THREE.SphereGeometry(1.5, 32, 32);
  const bigSphereMesh = new THREE.Mesh(bigSphereGeometry, bigSphereMaterial);
  scene.add(bigSphereMesh);

  // Little sphere (Fresnel refraction blob)
  const littleSphereGeometry = new THREE.SphereGeometry(0.4, 32, 32);
  const littleSphereMaterial = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      time: { value: 0 },
      tCube: { value: 0 },
      resolution: { value: new THREE.Vector4() },
      mRefractionRatio: { value: 1.02 },
      mFresnelBias: { value: 0.1 },
      mFresnelScale: { value: 2 },
      mFresnelPower: { value: 1 },
    },
    vertexShader: littlesphereVertexShader,
    fragmentShader: littlesphereFragmentShader,
  });

  const littleSphereMesh = new THREE.Mesh(littleSphereGeometry, littleSphereMaterial);
  scene.add(littleSphereMesh);

  // Sizes
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  // Camera
  const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
  camera.position.z = 1.1;
  scene.add(camera);

  // Scene background matches page
  scene.background = new THREE.Color("#F5F2ED");

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Post-processing
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const grainPass = new ShaderPass(DotScreenShader);
  grainPass.uniforms["scale"].value = 4;
  composer.addPass(grainPass);

  // Resize
  window.addEventListener("resize", () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    composer.setSize(sizes.width, sizes.height);
  });

  // Animation
  const clock = new THREE.Clock();

  function tick() {
    const elapsedTime = clock.getElapsedTime();

    // Slow auto-rotation
    bigSphereMesh.rotation.y = elapsedTime * 0.04;
    bigSphereMesh.rotation.x = Math.sin(elapsedTime * 0.02) * 0.1;
    littleSphereMesh.rotation.y = elapsedTime * 0.06;

    // Update shader uniforms
    littleSphereMesh.visible = false;
    bigSphereMaterial.uniforms.time.value = elapsedTime;
    littleSphereMaterial.uniforms.time.value = elapsedTime;
    cubeCamera.update(renderer, scene);
    littleSphereMesh.visible = true;
    littleSphereMaterial.uniforms.tCube.value = cubeRenderTarget.texture;

    composer.render();
    window.requestAnimationFrame(tick);
  }

  tick();

  // Return API to change colors for dark mode
  return {
    setColors(first, second, accent, bg) {
      bigSphereMaterial.uniforms.uFirstColor.value.set(first);
      bigSphereMaterial.uniforms.uSecondColor.value.set(second);
      bigSphereMaterial.uniforms.uAccentColor.value.set(accent);
      if (bg) scene.background = new THREE.Color(bg);
    },
    setSpeed(speed) {
      bigSphereMaterial.uniforms.effectSpeed.value = speed;
    },
  };
}
