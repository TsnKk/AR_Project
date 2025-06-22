// ✅ นำเข้า Three.js และ GLTFLoader
import * as THREE from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';

// ✅ อ้างอิงองค์ประกอบ HTML
const video = document.getElementById('video');
const infoBox = document.getElementById('info-box');
const scanAgainBtn = document.getElementById('scan-again-btn');

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
const light = new THREE.HemisphereLight(0xffffff, 0x444444);
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
    model = gltf.scene;
    model.scale.set(1.0, 1.0, 1.0);
    model.position.y = 0.5; // ขยับโมเดลขึ้น 10%
    scene.add(model);
  }, undefined, error => console.error('Error loading model:', error));
}

// ✅ วนเรนเดอร์ทุกเฟรม
function animate() {
  requestAnimationFrame(animate);

  // ป้องกันการ render โมเดลซ้ำ
  if (model && scene.children.includes(model)) {
    if (!isDragging && autoRotate) {
      rotationY += 0.01;
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
codeReader.decodeFromVideoDevice(null, 'video', async (result, err) => {
  if (result) {
    const url = result.getText();
    console.log('QR Detected:', url);
    loadFromQR(url);
    // codeReader.reset(); // เปิดใช้งานหากต้องการหยุดสแกนหลังพบ QR
  }
});

// ✅ เปิดกล้องหลังเมื่อเข้าเว็บ
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
  .then(stream => video.srcObject = stream);

// ✅ ปุ่ม "สแกนใหม่" สำหรับรีเซ็ตและเริ่มสแกน QR ใหม่
let isScanning = false;

if (scanAgainBtn) {
  scanAgainBtn.addEventListener('click', () => {
    // รีเซ็ตข้อมูลและสถานะ
    if (infoBox) infoBox.innerHTML = 'สแกน QR Code เพื่อดูรายละเอียดโมเดล';
    renderer.setClearColor(0x000000, 0);
    document.body.style.background = "#181c20";
    if (model) {
      scene.remove(model);
      model = null;
    }
    rotationY = 0;
    autoRotate = true;
    isDragging = false;
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);

    // รีเซ็ต codeReader และ flag
    codeReader.reset();
    isScanning = false;

    // Delay 1 วินาทีก่อนเปิดกล้องและเริ่มสแกนใหม่
    setTimeout(() => {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          video.srcObject = stream;
          isScanning = false; // รีเซ็ต flag ก่อนเริ่ม decode
          codeReader.decodeFromVideoDevice(null, 'video', async (result, err) => {
            if (result && !isScanning) {
              isScanning = true;
              const url = result.getText();
              loadFromQR(url);
              codeReader.reset();
              // รีเซ็ต flag ทันทีหลังโหลดข้อมูล
              setTimeout(() => { isScanning = false; }, 500);
            }
          });
        });
    }, 1000);
  });
}

// ✅ โหลดข้อมูลจาก QR (รองรับทั้ง URL และ JSON)
function loadFromQR(qrUrl) {
  const url = new URL(qrUrl);
  const jsonUrl = url.searchParams.get("src") || qrUrl;

  fetch(jsonUrl)
    .then(res => res.json())
    .then(data => {
      // 📄 แสดงข้อมูลสินค้า
      if (infoBox) {
        infoBox.innerHTML = `
          <h3>${data.name}</h3>
          <p>${data.description}</p>
          <p><strong>ราคา:</strong> ${data.price}</p>
          <p><strong>แหล่งที่มา:</strong> ${data.origin}</p>
        `;
      }
      // ลบโมเดลเดิมก่อนโหลดใหม่ (ป้องกันซ้อน)
      if (model) {
        scene.remove(model);
        model = null;
      }
      loadModel(data.model);

      renderer.setClearColor(0xffffff, 1);
      document.body.style.background = "#fff";

      // ปิดกล้องหลังสแกนเสร็จ
      if (video && video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
      }

      // รีเซ็ต flag ทันทีหลังโหลดข้อมูล
      isScanning = false;
    })
    .catch(err => {
      console.error('โหลด JSON ไม่สำเร็จ:', err);
      if (infoBox) infoBox.innerHTML = 'ไม่สามารถโหลดข้อมูลจาก QR Code นี้ได้';
      isScanning = false;
    });
}
