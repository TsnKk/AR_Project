// ✅ นำเข้า Three.js และ GLTFLoader
import * as THREE from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';

// ✅ อ้างอิงองค์ประกอบ HTML
const video = document.getElementById('video');
const infoMessage = document.getElementById('info-message');

// ✅ สร้าง Scene, Camera และ Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.z = 5;  // ตั้งกล้องให้ห่างจากโมเดล 5 หน่วย

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
    model.position.y = 1; // ขยับโมเดลขึ้นเล็กน้อย
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
      // ✅ เซ็ตเฉพาะ info-content ไม่ทับ scroll-arrow
      const infoContent = document.getElementById('info-content');
      if (infoContent) {
        infoContent.innerHTML = `
          <button id="restart-scan-btn" style="
            display:block;
            width:100%;
            margin-bottom:16px;
            background:#23262b;
            color:#fff;
            border:none;
            border-radius:8px;
            padding:12px 0;
            font-size:1.05rem;
            font-weight:bold;
            font-family:'Sarabun',Arial,sans-serif;
            cursor:pointer;
            transition:background 0.2s;
          ">🔄 เริ่มสแกนใหม่</button>
          <h3>${data.name || ''}</h3>
          <p>${data.description || ''}</p>
          <strong>ข้อมูลสินค้า</strong><br>
          <p><strong>ชนิดผลไม้:</strong> ${data.fruit_type ? data.fruit_type.replace(/^ชนิดผลไม้\s*:\s*/, '') : ''}</p>
          <p><strong>ขนาด:</strong> ${data.size ? data.size.replace(/^ขนาด\s*:\s*/, '') : ''}</p>
          <p><strong>น้ำหนัก:</strong> ${data.weight ? data.weight.replace(/^น้ำหนัก\s*:\s*/, '') : ''}</p>
          <p><strong>ราคาต่อกิโลกรัม:</strong> ${data.price_per_kg ? data.price_per_kg.replace(/^ราคาต่อกิโล\s*:\s*/, '') : ''}</p>
          <p><strong>วันที่เก็บ:</strong> ${data.harvest_date ? data.harvest_date.replace(/^วันที่เก็บ\s*:\s*/, '') : ''}</p>
          <strong>ข้อมูลสวน</strong><br>
          <p><strong>ชื่อสวน:</strong> ${data.farm_name ? data.farm_name.replace(/^ชื่อสวน\s*:\s*/, '') : ''}</p>
          <p><strong>เจ้าของสวน:</strong> ${data.owner ? data.owner.replace(/^เจ้าของสวน\s*:\s*/, '') : ''}</p>
          <p><strong>ตำแหน่งสวน:</strong> ${data.origin ? data.origin.replace(/^ตำแหน่งสวน\s*:\s*/, '') : ''}</p>
          <p><strong>ฤดูกาลเก็บเกี่ยว:</strong> ${data.season ? data.season.replace(/^ฤดูกาลเก็บเกี่ยว\s*:\s*/, '') : ''}</p>
          <p><strong>ปุ๋ยที่ใช้:</strong> ${data.fertilizer ? data.fertilizer.replace(/^ปุ๋ยที่ใช้\s*:\s*/, '') : ''}</p>
          <strong>การเก็บรักษา</strong><br>
          <p><strong>อายุการเก็บรักษา:</strong> ${data.shelf_life ? data.shelf_life.replace(/^อายุการเก็บรักษา\s*:\s*/, '') : ''}</p>
          <p><strong>วิธีเก็บรักษา:</strong> ${data.storage_conditions ? data.storage_conditions.replace(/^วิธีเก็บรักษา\s*:\s*/, '') : ''}</p>
          <strong>คุณค่าทางโภชนาการ</strong><br>
          <p>${data.nutritional_value ? data.nutritional_value.replace(/^คุณค่าทางโภชนาการ\s*:\s*/, '') : ''}</p>
        `;
        // เพิ่ม event ให้ปุ่ม "เริ่มสแกนใหม่"
        const restartBtn = document.getElementById('restart-scan-btn');
        if (restartBtn) {
          restartBtn.addEventListener('click', () => {
            infoContent.innerHTML = 'สแกน QR Code เพื่อดูรายละเอียดโมเดล';
            isScanning = false;
            codeReader.reset();
            codeReader.decodeFromVideoDevice(null, 'video', async (result, err) => {
              if (result && !isScanning) {
                isScanning = true;
                const url = result.getText();
                console.log('QR Detected:', url);
                loadFromQR(url);
              }
            });
          });
        }
      }

      // ✅ ไม่ต้อง remove model ที่นี่ เพราะ loadModel จะจัดการเอง
      loadModel(data.model);

      // ตั้งค่าสีพื้นหลัง
      renderer.setClearColor(0xffffff, 1);
      document.body.style.background = "#fff";

      isScanning = false;
      codeReader.reset();
    })
    .catch(err => {
      // กรณีโหลด JSON ไม่สำเร็จ
      console.error('โหลด JSON ไม่สำเร็จ:', err);
      const infoContent = document.getElementById('info-content');
      if (infoContent) {
        infoContent.innerHTML = `
          <button id="restart-scan-btn" style="
            display:block;
            width:100%;
            margin-bottom:16px;
            background:#23262b;
            color:#fff;
            border:none;
            border-radius:8px;
            padding:12px 0;
            font-size:1.05rem;
            font-weight:bold;
            font-family:'Sarabun',Arial,sans-serif;
            cursor:pointer;
            transition:background 0.2s;
          ">🔄 เริ่มสแกนใหม่</button>
          ไม่สามารถโหลดข้อมูลจาก QR Code นี้ได้
        `;
        // เพิ่ม event ให้ปุ่ม "เริ่มสแกนใหม่"
        const restartBtn = document.getElementById('restart-scan-btn');
        if (restartBtn) {
          restartBtn.addEventListener('click', () => {
            infoContent.innerHTML = 'สแกน QR Code เพื่อดูรายละเอียดโมเดล';
            isScanning = false;
            codeReader.reset();
            codeReader.decodeFromVideoDevice(null, 'video', async (result, err) => {
              if (result && !isScanning) {
                isScanning = true;
                const url = result.getText();
                console.log('QR Detected:', url);
                loadFromQR(url);
              }
            });
          });
        }
      }
      isScanning = false;
      codeReader.reset();
    });
}

// ✅ ตัวแปรควบคุมการหมุนและลากโมเดล
let isDragging = false;
let previousX = 0;
let previousY = 0;
let rotationY = 0;
let rotationX = 0; // เพิ่มตัวแปรสำหรับหมุนแกน X
let autoRotate = true;

// Mouse Events
renderer.domElement.addEventListener('mousedown', (e) => {
  isDragging = true;
  autoRotate = false;
  previousX = e.clientX;
  previousY = e.clientY;
});
renderer.domElement.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const deltaX = e.clientX - previousX;
  const deltaY = e.clientY - previousY;
  previousX = e.clientX;
  previousY = e.clientY;
  rotationY += deltaX * 0.01; // หมุนซ้าย-ขวา
  rotationX += deltaY * 0.01; // หมุนก้ม-เงย
  // จำกัดมุมก้ม-เงย ไม่ให้หมุนเกิน 90 องศา
  if (rotationX < -Math.PI / 2) rotationX = -Math.PI / 2;
  if (rotationX > Math.PI / 2) rotationX = Math.PI / 2;
});
renderer.domElement.addEventListener('mouseup', () => {
  isDragging = false;
  autoRotate = true;
});
renderer.domElement.addEventListener('mouseleave', () => {
  isDragging = false;
  autoRotate = true;
});

// Touch Events
renderer.domElement.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    autoRotate = false;
    previousX = e.touches[0].clientX;
    previousY = e.touches[0].clientY;
  }
});
renderer.domElement.addEventListener('touchmove', (e) => {
  if (!isDragging || e.touches.length !== 1) return;
  const deltaX = e.touches[0].clientX - previousX;
  const deltaY = e.touches[0].clientY - previousY;
  previousX = e.touches[0].clientX;
  previousY = e.touches[0].clientY;
  rotationY += deltaX * 0.01;
  rotationX += deltaY * 0.01;
  if (rotationX < -Math.PI / 2) rotationX = -Math.PI / 2;
  if (rotationX > Math.PI / 2) rotationX = Math.PI / 2;
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
      rotationY += 0.02;
    }
    model.rotation.y = rotationY;
    model.rotation.x = rotationX; // หมุนก้ม-เงย
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

// แสดง/ซ่อนลูกศรเมื่อมีข้อมูลเกินกล่อง info-message
const infoMessageEl = document.getElementById('info-message');
const scrollArrow = document.getElementById('scroll-arrow');

function updateScrollArrow() {
  if (!infoMessageEl || !scrollArrow) return;
  // ถ้ามี scroll bar แสดงลูกศร
  if (infoMessageEl.scrollHeight > infoMessageEl.clientHeight + 5) {
    // ถ้าเลื่อนถึงล่างสุดแล้ว ซ่อนลูกศร
    if (infoMessageEl.scrollTop + infoMessageEl.clientHeight >= infoMessageEl.scrollHeight - 5) {
      scrollArrow.style.display = "none";
    } else {
      scrollArrow.style.display = "block";
    }
  } else {
    scrollArrow.style.display = "none";
  }
}
if (infoMessageEl && scrollArrow) {
  infoMessageEl.addEventListener('scroll', updateScrollArrow);
  // อัปเดตเมื่อข้อมูลเปลี่ยน
  const observer = new MutationObserver(updateScrollArrow);
  observer.observe(infoMessageEl, { childList: true, subtree: true });
  window.addEventListener('resize', updateScrollArrow);
  setTimeout(updateScrollArrow, 500);
}

// เพิ่ม CSS ด้วย JavaScript (ถูกต้อง)
const style = document.createElement('style');
style.textContent = `
  #my-new-btn {
    margin-bottom: 12px;
    width: 100%;
    background: #00c896;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 12px 0;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    transition: background 0.2s;
    font-family: 'Sarabun', Arial, sans-serif;
    display: none;
    z-index: 10000;
  }
  #my-new-btn:hover {
    background: #009e74;
  }
  #info-message {
    z-index: 9999 !important;
  }
`;
document.head.append(style);

// สร้างปุ่มใหม่
const myNewButton = document.createElement('button');
myNewButton.id = 'my-new-btn';
myNewButton.textContent = 'ปุ่มใหม่';

// ใส่ปุ่มไว้บนสุดใน info-message
const infoMessageBox = document.getElementById('info-message');
if (infoMessageBox) {
  infoMessageBox.style.zIndex = "9999";
  infoMessageBox.insertBefore(myNewButton, infoMessageBox.firstChild);
}
myNewButton.style.zIndex = "10000";

// ให้ปุ่มใหม่แสดง/ซ่อนพร้อมปุ่ม AR
const arBtn = document.getElementById('ar-btn');
const showMyNewBtn = (show) => {
  myNewButton.style.display = show ? 'block' : 'none';
};
const observerAR = new MutationObserver(() => {
  showMyNewBtn(arBtn.style.display !== 'none');
});
observerAR.observe(arBtn, { attributes: true, attributeFilter: ['style'] });
// กรณีมีการเปลี่ยน display ด้วย class
const arBtnDisplayCheck = () => showMyNewBtn(window.getComputedStyle(arBtn).display !== 'none');
arBtnDisplayCheck();
window.addEventListener('resize', arBtnDisplayCheck);

// เพิ่มฟังก์ชันการทำงานให้ปุ่มใหม่ (ตัวอย่างเช่น แสดงข้อความ)
myNewButton.addEventListener('click', () => {
  alert('คุณคลิกปุ่มใหม่!');
});
