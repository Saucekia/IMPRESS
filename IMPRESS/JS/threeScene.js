import * as THREE from "three";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.159.0/examples/jsm/controls/OrbitControls.js";
import { DIVS_X, DIVS_Z, SIZE_X, SIZE_Z } from './config.js';

export function initThree(els){
  let renderer, scene, camera, orbit, geom, mesh;

  function getMountSize() {
    const r = els.mount.getBoundingClientRect();
    let w = Math.max(1, Math.floor(r.width));
    let h = Math.max(1, Math.floor(r.height));
    if (h < 50) h = Math.max(300, window.innerHeight - 56 - 240);
    return { w, h };
  }

  const { w, h } = getMountSize();
  renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(w, h);
  els.mount.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe8e5ff);

  camera = new THREE.PerspectiveCamera(40, w / h, 0.01, 100);
  camera.position.set(5,4,6);

  orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff,0.5));
  const key = new THREE.DirectionalLight(0xffffff,0.9);
  key.position.set(3,5,4);
  scene.add(key);

  geom = new THREE.PlaneGeometry(SIZE_X, SIZE_Z, DIVS_X, DIVS_Z);
  geom.rotateX(-Math.PI/2);

  const mat = new THREE.MeshStandardMaterial({
    color:0x7c6cf2, metalness:0.15, roughness:0.8, side:THREE.DoubleSide
  });

  mesh = new THREE.Mesh(geom, mat);
  scene.add(mesh);

  const ro = new ResizeObserver(() => {
    const { w, h } = getMountSize();
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  ro.observe(els.mount);

  window.addEventListener('resize', () => {
    const { w, h } = getMountSize();
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });

  return { THREE, renderer, scene, camera, orbit, geom, mesh };
}
