import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.module.js';
import { GLTFLoader } from './GLTFLoader.js';
const video = document.getElementById('video');

// ตั้งค่ากล้อง
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
  .then(stream => video.srcObject = stream);

// ZXing - สแกน QR แล้วโหลดโมเดล
const codeReader = new BrowserMultiFormatReader();
codeReader.decodeFromVideoDevice(null, 'video', async (result, err) => {
  if (result) {
    const url = result.getText();
    console.log('QR Detected:', url);
    loadModel(url);
    codeReader.reset(); // หยุดสแกนหลังโหลดโมเดล
  }
});

// สร้าง Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// แสง
const light = new THREE.HemisphereLight(0xffffff, 0x444444);
scene.add(light);

let model = null;

function loadModel(url) {
  const loader = new GLTFLoader();
  loader.load(url, gltf => {
    if (model) scene.remove(model);
    model = gltf.scene;
    model.scale.set(0.3, 0.3, 0.3);
    scene.add(model);
  }, undefined, error => console.error('Error loading model:', error));
}

// เรนเดอร์ลูป
function animate() {
  requestAnimationFrame(animate);
  if (model) model.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();
