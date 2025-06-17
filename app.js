import * as THREE from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';

const video = document.getElementById('video');
const infoBox = document.getElementById('info-box');
const canvas = document.getElementById('canvas');

// ตั้งค่ากล้อง
navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } } })
  .then(stream => video.srcObject = stream)
  .catch(err => console.error('ไม่สามารถเข้าถึงกล้อง:', err));

// ZXing - อ่าน QR
const codeReader = new BrowserMultiFormatReader();
codeReader.decodeFromVideoDevice(null, 'video', async (result, err) => {
  if (result) {
    const url = result.getText();
    console.log('QR Detected:', url);
    loadFromQR(url);
    // codeReader.reset(); // ถ้าต้องการหยุดสแกนเมื่อพบแล้ว
  }
});

// สร้าง Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.z = 2; // กล้องห่างจากวัตถุ

const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// แสง
const light = new THREE.HemisphereLight(0xffffff, 0x444444);
scene.add(light);

let model = null;

// โหลดโมเดล GLB
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
    }
    model = gltf.scene;
    model.scale.set(0.1, 0.1, 0.1); // ย่อขนาดโมเดล
    scene.add(model);
  }, undefined, error => console.error('Error loading model:', error));
}

// โหลดจาก QR
function loadFromQR(url) {
  const u = new URL(url, location.href);
  const src = u.searchParams.get('src');
  const finalUrl = src || url;

  if (finalUrl.endsWith('.json')) {
    fetch(finalUrl)
      .then(res => res.json())
      .then(data => {
        if (infoBox) {
          infoBox.innerHTML = `
            <h3>${data.name}</h3>
            <p>${data.description}</p>
            <p><strong>ราคา:</strong> ${data.price}</p>
            <p><strong>แหล่งที่มา:</strong> ${data.origin}</p>
          `;
        }
        loadModel(data.model);
      })
      .catch(err => {
        console.error('โหลด JSON ไม่สำเร็จ:', err);
        if (infoBox) infoBox.innerHTML = 'ไม่สามารถโหลดข้อมูลจาก QR Code นี้ได้';
      });
  } else if (finalUrl.endsWith('.glb')) {
    if (infoBox) infoBox.innerHTML = '<p>กำลังโหลดโมเดล...</p>';
    loadModel(finalUrl);
  } else {
    if (infoBox) infoBox.innerHTML = 'QR นี้ไม่รองรับ';
  }
}

// เรนเดอร์ลูป
function animate() {
  requestAnimationFrame(animate);
  if (model) model.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();

// ทำให้ canvas เต็มจอเมื่อเปลี่ยนขนาด
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
