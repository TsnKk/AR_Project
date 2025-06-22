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
    model.position.y = 0.5; // ขยับโมเดลขึ้นเล็กน้อย
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
      if (infoMessage) {
        infoMessage.innerHTML = `
          <h3>${data.name || ''}</h3>
          <p>${data.description || ''}</p>

          <strong>ข้อมูลสินค้า</strong><br>
          <p><strong>ชนิดผลไม้:</strong> ${data.fruit_type ? data.fruit_type.replace(/^ชนิดผลไม้\s*:\s*/,'') : ''}</p>
          <p><strong>ขนาด:</strong> ${data.size ? data.size.replace(/^ขนาด\s*:\s*/,'') : ''}</p>
          <p><strong>น้ำหนัก:</strong> ${data.weight ? data.weight.replace(/^น้ำหนัก\s*:\s*/,'') : ''}</p>
          <p><strong>วันที่เก็บ:</strong> ${data.harvest_date ? data.harvest_date.replace(/^วันที่เก็บ\s*:\s*/,'') : ''}</p>

          <strong>ข้อมูลสวน</strong><br>
          <p><strong>ชื่อสวน:</strong> ${data.farm_name ? data.farm_name.replace(/^ชื่อสวน\s*:\s*/,'') : ''}</p>
          <p><strong>เจ้าของสวน:</strong> ${data.owner ? data.owner.replace(/^เจ้าของสวน\s*:\s*/,'') : ''}</p>
          <p><strong>ตำแหน่งสวน:</strong> ${data.origin ? data.origin.replace(/^ตำแหน่งสวน\s*:\s*/,'') : ''}</p>
          <p><strong>ฤดูกาลเก็บเกี่ยว:</strong> ${data.season ? data.season.replace(/^ฤดูกาลเก็บเกี่ยว\s*:\s*/,'') : ''}</p>
          <p><strong>ปุ๋ยที่ใช้:</strong> ${data.fertilizer ? data.fertilizer.replace(/^ปุ๋ยที่ใช้\s*:\s*/,'') : ''}</p>

          <strong>การเก็บรักษา</strong><br>
          <p><strong>อายุการเก็บรักษา:</strong> ${data.shelf_life ? data.shelf_life.replace(/^อายุการเก็บรักษา\s*:\s*/,'') : ''}</p>
          <p><strong>วิธีเก็บรักษา:</strong> ${data.storage_conditions ? data.storage_conditions.replace(/^วิธีเก็บรักษา\s*:\s*/,'') : ''}</p>

          <strong>คุณค่าทางโภชนาการ</strong><br>
          <p>${data.nutritional_value ? data.nutritional_value.replace(/^คุณค่าทางโภชนาการ\s*:\s*/,'') : ''}</p>

          <strong>ราคา</strong><br>
          <p><strong>ราคาต่อกิโลกรัม:</strong> ${data.price_per_kg ? data.price_per_kg.replace(/^ราคาต่อกิโล\s*:\s*/,'') : ''}</p>
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
      if (video && video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
      }

      isScanning = false;
      codeReader.reset();
    })
    .catch(err => {
      // กรณีโหลด JSON ไม่สำเร็จ
      console.error('โหลด JSON ไม่สำเร็จ:', err);
      if (infoMessage) infoMessage.innerHTML = 'ไม่สามารถโหลดข้อมูลจาก QR Code นี้ได้';
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
      rotationY += 0.05; // ปรับความเร็วการหมุนที่นี่
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
codeReader.decodeFromVideoDevice(null, 'video', async (result, err) => {
  if (result && !isScanning) {
    isScanning = true;
    const url = result.getText();
    console.log('QR Detected:', url);
    loadFromQR(url);
  }
});

// ✅ เปิดกล้องหลังเมื่อเข้าเว็บ
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
  .then(stream => video.srcObject = stream);

// ✅ ปุ่ม "สแกนใหม่" สำหรับรีเซ็ตและเริ่มสแกน QR ใหม่
if (scanAgainBtn) {
  scanAgainBtn.addEventListener('click', () => {
    // รีเซ็ตข้อมูลและสถานะ
    const infoContent = document.getElementById('info-content');
    if (infoContent) {
      infoContent.innerHTML = 'สแกน QR Code เพื่อดูรายละเอียดโมเดล';
      infoBox.classList.remove('has-data');
    }
    // รีเซ็ต scene
    if (model) {
      scene.remove(model);
      model = null;
    }
    rotationY = 0;
    autoRotate = true;
    isDragging = false;
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);

    // ซ่อนปุ่ม
    scanAgainBtn.style.display = "none";

    // รีเซ็ต codeReader และ flag ก่อนเปิดกล้องใหม่
    codeReader.reset();
    isScanning = false;

    setTimeout(() => {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          video.srcObject = stream;
          isScanning = false;
          codeReader.decodeFromVideoDevice(null, 'video', async (result, err) => {
            if (result && !isScanning) {
              isScanning = true;
              const url = result.getText();
              loadFromQR(url);
              codeReader.reset(); // หยุดสแกนทันทีหลังเจอ QR
            }
          });
        });
    }, 1000);
  });
}

// ในจุดที่รีเซ็ต (ก่อนสแกนใหม่หรือหน้าแรก) ให้ซ่อนปุ่ม
if (scanAgainBtn) scanAgainBtn.style.display = "none";