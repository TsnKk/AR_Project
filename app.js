// ✅ นำเข้า Three.js และ GLTFLoader
import * as THREE from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';

// ✅ อ้างอิงองค์ประกอบ HTML
const video = document.getElementById('video');
const infoMessage = document.getElementById('info-message');

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

// ✅ เพิ่มแสงสว่างให้กับซีน
const light = new THREE.HemisphereLight(0xffffff, 0x444444);
scene.add(light);

let model = null; // ตัวแปรเก็บโมเดล 3D ปัจจุบัน

// ✅ ฟังก์ชันโหลดและแสดงโมเดล 3D (.glb)
function loadModel(url) {
  const loader = new GLTFLoader();
  loader.load(url, gltf => {
    // ถ้ามีโมเดลเดิมอยู่ ให้ลบและเคลียร์หน่วยความจำ
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
    // เพิ่มโมเดลใหม่เข้า scene
    model = gltf.scene;
    model.scale.set(1.0, 1.0, 1.0);
    model.position.y = 0.3; // ขยับโมเดลขึ้นเล็กน้อย
    scene.add(model);
  }, undefined, error => console.error('Error loading model:', error));
}

// ✅ ฟังก์ชันโหลดข้อมูลจาก QR (รองรับทั้ง URL และ JSON)
function loadFromQR(qrUrl) {
  const url = new URL(qrUrl);
  const jsonUrl = url.searchParams.get("src") || qrUrl;

  fetch(jsonUrl)
    .then(res => res.json())
    .then(data => {
      const infoContent = document.getElementById('info-content');
      if (infoContent) {
        infoContent.innerHTML = `
          <h3>${data.name || ''}</h3>
          <p>${data.description || ''}</p>
          <p>${data.weight || ''}</p>
          <p>${data.size || ''}</p>
          <p>${data.nutritional_value || ''}</p>
          <p>${data.shelf_life || ''}</p>
          <p>${data.storage_conditions || ''}</p>
          <p>${data.season || ''}</p>
          <p>${data.origin || ''}</p>
          <p>${data.fruit_type || ''}</p>
          <p>${data.price_per_kg || ''}</p>
          <p>${data.harvest_date || ''}</p>
          <p>${data.fertilizer || ''}</p>
          <p>${data.farm_name || ''}</p>
          <p>${data.owner || ''}</p>
        `;
      }

      // ลบโมเดลเดิมก่อนโหลดใหม่ (ป้องกันซ้อน)
      if (model) {
        scene.remove(model);
        model = null;
      }
      loadModel(data.model);

      // ตั้งค่าสีพื้นหลัง
      renderer.setClearColor(0xffffff, 1);
      document.body.style.background = "#fff";

      // ปิดกล้องหลังสแกนเสร็จ
      stopCamera();

      isScanning = false;
      codeReader.reset();
    })
    .catch(err => {
      // กรณีโหลด JSON ไม่สำเร็จ
      console.error('โหลด JSON ไม่สำเร็จ:', err);
      if (infoMessage) infoMessage.innerHTML = 'ไม่สามารถโหลดข้อมูลจาก QR Code นี้ได้';
      stopCamera();
      isScanning = false;
      codeReader.reset();
    });
}

// ✅ ตัวแปรควบคุมการหมุนและลากโมเดล
let isDragging = false;
let previousX = 0;
let rotationY = 0;
let autoRotate = true;

// ✅ Mouse Events สำหรับควบคุมการหมุนโมเดลด้วยเมาส์
renderer.domElement.addEventListener('mousedown', (e) => {
  isDragging = true;
  autoRotate = false;
  previousX = e.clientX;
});
renderer.domElement.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const deltaX = e.clientX - previousX;
  previousX = e.clientX;
  rotationY += deltaX * 0.01;
});
renderer.domElement.addEventListener('mouseup', () => {
  isDragging = false;
  autoRotate = true;
});
renderer.domElement.addEventListener('mouseleave', () => {
  isDragging = false;
  autoRotate = true;
});

// ✅ Touch Events สำหรับควบคุมการหมุนโมเดลบนมือถือ
renderer.domElement.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    autoRotate = false;
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
  autoRotate = true;
});

// ✅ ฟังก์ชันวนเรนเดอร์ทุกเฟรม
function animate() {
  requestAnimationFrame(animate);

  if (model) {
    // หมุนอัตโนมัติถ้าไม่ได้ลาก
    if (!isDragging && autoRotate) {
      rotationY += 0.02; // ปรับความเร็วการหมุนที่นี่
    }
    model.rotation.y = rotationY;
  }

  renderer.render(scene, camera);
}
animate();

// ✅ รองรับการปรับขนาดหน้าจอ (Responsive)
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ✅ ตั้งค่า QR Code Scanner ด้วย ZXing
const codeReader = new ZXing.BrowserMultiFormatReader();
let isScanning = false;

// ฟังก์ชันเปิดกล้อง (แสดง video)
function startCamera() {
  const video = document.getElementById('video');
  if (video) {
    video.style.display = 'block';
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        video.srcObject = stream;
        codeReader.decodeFromVideoDevice(null, 'video', (result, err) => {
          if (result && !isScanning) {
            isScanning = true;
            const url = result.getText();
            loadFromQR(url);
          }
        });
      })
      .catch(err => {
        console.error('ไม่สามารถเปิดกล้องได้:', err);
      });
  }
}

// ฟังก์ชันปิดกล้อง (ซ่อน video)
function stopCamera() {
  const video = document.getElementById('video');
  if (video && video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
    video.style.display = 'none';
  }
}

// เรียก startCamera เมื่อเริ่มต้นหรือเมื่อกดปุ่มสแกนใหม่
// ตัวอย่าง: เรียก startCamera() เมื่อผู้ใช้ต้องการสแกน QR
// startCamera();

// ใน loadFromQR ให้ปิดกล้องหลังโหลดโมเดลสำเร็จ
function loadFromQR(qrUrl) {
  const url = new URL(qrUrl);
  const jsonUrl = url.searchParams.get("src") || qrUrl;

  fetch(jsonUrl)
    .then(res => res.json())
    .then(data => {
      const infoContent = document.getElementById('info-content');
      if (infoContent) {
        infoContent.innerHTML = `
          <h3>${data.name || ''}</h3>
          <p>${data.description || ''}</p>
          <p>${data.weight || ''}</p>
          <p>${data.size || ''}</p>
          <p>${data.nutritional_value || ''}</p>
          <p>${data.shelf_life || ''}</p>
          <p>${data.storage_conditions || ''}</p>
          <p>${data.season || ''}</p>
          <p>${data.origin || ''}</p>
          <p>${data.fruit_type || ''}</p>
          <p>${data.price_per_kg || ''}</p>
          <p>${data.harvest_date || ''}</p>
          <p>${data.fertilizer || ''}</p>
          <p>${data.farm_name || ''}</p>
          <p>${data.owner || ''}</p>
        `;
      }

      // ลบโมเดลเดิมก่อนโหลดใหม่ (ป้องกันซ้อน)
      if (model) {
        scene.remove(model);
        model = null;
      }
      loadModel(data.model);

      // ตั้งค่าสีพื้นหลัง
      renderer.setClearColor(0xffffff, 1);
      document.body.style.background = "#fff";

      // ปิดกล้องหลังสแกนเสร็จ
      stopCamera();

      isScanning = false;
      codeReader.reset();
    })
    .catch(err => {
      // กรณีโหลด JSON ไม่สำเร็จ
      console.error('โหลด JSON ไม่สำเร็จ:', err);
      if (infoMessage) infoMessage.innerHTML = 'ไม่สามารถโหลดข้อมูลจาก QR Code นี้ได้';
      stopCamera();
      isScanning = false;
      codeReader.reset();
    });
}

// HTML Structure
document.body.innerHTML = `
  <video id="video" style="display:none;"></video>
  <canvas id="canvas"></canvas>
  <div id="info-message">
    <div id="info-content">
      สแกน QR Code เพื่อดูรายละเอียดโมเดล
    </div>
    <div id="scroll-arrow">▼</div>
  </div>
`;

// CSS Styles
const style = document.createElement('style');
style.textContent = `
  body {
    margin: 0;
    overflow: hidden;
  }

  #video {
    display: none;
  }

  #canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
  }

  #info-message {
    position: fixed;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%);
    z-index: 20;
    background: rgba(30,32,36,0.95);
    color: #fff;
    padding: 18px 32px 18px 32px;
    border-radius: 12px 12px 0 0;
    font-size: 1.1rem;
    max-width: 500px;
    width: calc(100vw - 32px);
    box-shadow: 0 -2px 8px rgba(0,0,0,0.2);
    max-height: 35vh;
    overflow-y: auto;
    text-align: left;
    font-family: 'Sarabun', Arial, sans-serif;
    box-sizing: border-box;
    margin: 0;
    position: fixed;
    /* เพิ่ม relative เพื่อให้ลูกศร absolute ได้ */
    position: fixed;
  }

  #scroll-arrow {
    position: absolute;
    right: 18px;      /* ขยับจากขอบขวา */
    bottom: 12px;     /* ขยับจากขอบล่าง */
    font-size: 2rem;
    color: #fff;
    opacity: 0.7;
    pointer-events: none;
    z-index: 30;
    display: none;
    transition: opacity 0.2s;
  }
`;
document.head.appendChild(style);
