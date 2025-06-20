// ✅ นำเข้า Three.js และ GLTFLoader
import * as THREE from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';

// ✅ อ้างอิงองค์ประกอบ HTML
const video = document.getElementById('video');
const infoBox = document.getElementById('info-box');  // กล่องแสดงข้อมูลโมเดล

// ✅ เปิดกล้องหลัง
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
  .then(stream => video.srcObject = stream);

// ✅ ตั้งค่า QR Code Scanner ด้วย ZXing
const codeReader = new ZXing.BrowserMultiFormatReader();
codeReader.decodeFromVideoDevice(null, 'video', async (result, err) => {
  if (result) {
    const url = result.getText();
    console.log('QR Detected:', url);
    loadFromQR(url); // โหลดข้อมูลจากลิงก์ที่ได้
    //codeReader.reset(); // เปิดใช้งานหากต้องการหยุดสแกนหลังพบ QR
  }
});

// ✅ สร้าง Scene, Camera และ Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('canvas'),
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// ✅ แสงพื้นฐาน
const light = new THREE.HemisphereLight(0xffffff, 0x444444); // แสงนุ่มๆ ทั้งบนล่าง
scene.add(light);

let model = null; // เก็บโมเดลปัจจุบัน
// ✅ โหลดและแสดงโมเดล 3D (.glb)
function loadModel(url) {
  const loader = new GLTFLoader();
loader.load(url, gltf => {
  if (model) {
    scene.remove(model);
    model.traverse(child => {
      if (child.isMesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });
    model = null;
  }
  // ✅ เพิ่มโมเดลใหม่เข้า Scene
  model = gltf.scene;
  model.scale.set(1.0, 1.0, 1.0); // ปรับขนาดเล็กลง
  model = gltf.scene; // <<== ต้องเพิ่มบรรทัดนี้
  scene.add(model);
}, undefined, error => console.error('Error loading model:', error));
    }
    

// ✅ โหลดข้อมูลจาก QR (รองรับทั้ง URL และ JSON)
function loadModel(qrurl) {
  const loader = new GLTFLoader();
  loader.load(url, gltf => {
    if (model) {
      scene.remove(model);
      model.traverse(child => {
        if (child.isMesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
      model = null;
    }

    // โหลดโมเดลใหม่ json
    model = gltf.scene;
    model.scale.set(1.0, 1.0, 1.0);
    scene.add(model);
  }, undefined, error => console.error('Error loading model:', error));
}

// --- เพิ่มตัวแปรควบคุมการหมุน ---
let isDragging = false;
let previousX = 0;
let rotationY = 0;
let rotationZ = 0;

// --- Mouse Events ---
renderer.domElement.addEventListener('mousedown', (e) => {
  isDragging = true;
  previousX = e.clientX;
});
renderer.domElement.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const deltaX = e.clientX - previousX;
  previousX = e.clientX;
  rotationY += deltaX * 0.01; // ปรับความไวได้
});
renderer.domElement.addEventListener('mouseup', () => {
  isDragging = false;
});
renderer.domElement.addEventListener('mouseleave', () => {
  isDragging = false;
});

// --- Touch Events ---
renderer.domElement.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    previousX = e.touches[0].clientX;
  }
});
renderer.domElement.addEventListener('touchmove', (e) => {
  if (!isDragging || e.touches.length !== 1) return;
  const deltaX = e.touches[0].clientX - previousX;
  previousX = e.touches[0].clientX;
  rotationY += deltaX * 0.01;
});
renderer.domElement.addEventListener('touchend', () => {
  isDragging = false;
});

// ✅ วนเรนเดอร์ทุกเฟรม
function animate() {
  requestAnimationFrame(animate);

  if (model) {
    if (isDragging) {
      model.rotation.y = rotationY;
    } else {
      model.rotation.y += 0.01;
    }
  }

  renderer.render(scene, camera);
}
animate();
// เตรียม raycaster และตัวแปรสัมผัส
const raycaster = new THREE.Raycaster();
const touch = new THREE.Vector2();

// ✅ รองรับการปรับขนาดหน้าจอ (Responsive)
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


