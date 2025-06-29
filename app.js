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

// ✅ ฟังก์ชันโหลดและแสดงโมเดล 3D (.glb) พร้อมแสดง progress
function loadModel(url, onLoaded) {
  const loader = new GLTFLoader();
  if (window.showModelLoading) window.showModelLoading();

  loader.load(
    url,
    gltf => {
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
      model.position.y = 0;
      scene.add(model);

      // ซ่อน loading screen
      if (window.hideModelLoading) window.hideModelLoading();

      // เรียก callback ถ้ามี
      if (typeof onLoaded === 'function') onLoaded();
    },
    // onProgress
    xhr => {
      if (window.setModelLoadingProgress && xhr.lengthComputable) {
        const percent = (xhr.loaded / xhr.total) * 100;
        window.setModelLoadingProgress(percent);
      }
    },
    // onError
    error => {
      if (window.hideModelLoading) window.hideModelLoading();
      console.error('Error loading model:', error);
    }
  );
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
        // แสดงข้อความกำลังโหลดโมเดล
        infoContent.innerHTML = `<div style="text-align:center;padding:32px 0;">⏳ กำลังโหลดโมเดล...</div>`;
      }

      // โหลดโมเดล 3D
      loadModel(data.model);

      // เมื่อโหลดโมเดลเสร็จ ให้แสดงเนื้อหาจริง
      // ต้องแก้ฟังก์ชัน loadModel ให้รับ callback
      loadModel(data.model, () => {
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
              // 1. ลบโมเดลออกจาก scene
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
              // 2. รีเซ็ตข้อความ info-content
              const infoContent = document.getElementById('info-content');
              if (infoContent) {
                infoContent.innerHTML = 'สแกน QR Code เพื่อดูรายละเอียดโมเดล';
              }
              // 3. รีเซ็ตพื้นหลัง
              renderer.setClearColor(0x000000, 0); // โปร่งใส
              document.body.style.background = "none";
              // 4. รีเซ็ตตัวแปรควบคุมโมเดล
              rotationY = 0;
              rotationX = 0;
              // 5. กล้องกลับไปตำแหน่งเริ่มต้น
              camera.position.set(0, 0, 5);
              camera.lookAt(0, 0, 0);
              // 6. แสดง info-message (ถ้ามีการซ่อน)
              const infoMessageBox = document.getElementById('info-message');
              if (infoMessageBox) infoMessageBox.style.display = 'block';
              // 7. เปิดกล้องใหม่
              isScanning = false;
              codeReader.reset();
              codeReader.decodeFromVideoDevice(null, 'video', async (result, err) => {
                if (result && !isScanning) {
                  isScanning = true;
                  const url = result.getText();
                  console.log('QR Detected:', url);
                  // ใส่ background ใหม่ตอนสแกนเสร็จ (ตอนโหลดโมเดล)
                  document.body.style.background = "#fff";
                  loadFromQR(url);
                }
              });
            });
          }
        }
      });

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
            // 1. ลบโมเดลออกจาก scene
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
            // 2. รีเซ็ตข้อความ info-content
            const infoContent = document.getElementById('info-content');
            if (infoContent) {
              infoContent.innerHTML = 'สแกน QR Code เพื่อดูรายละเอียดโมเดล';
            }
            // 3. รีเซ็ตพื้นหลัง
            renderer.setClearColor(0x000000, 0); // โปร่งใส
            document.body.style.background = "none";
            // 4. รีเซ็ตตัวแปรควบคุมโมเดล
            rotationY = 0;
            rotationX = 0;
            // 5. กล้องกลับไปตำแหน่งเริ่มต้น
            camera.position.set(0, 0, 5);
            camera.lookAt(0, 0, 0);
            // 6. แสดง info-message (ถ้ามีการซ่อน)
            const infoMessageBox = document.getElementById('info-message');
            if (infoMessageBox) infoMessageBox.style.display = 'block';
            // 7. เปิดกล้องใหม่
            isScanning = false;
            codeReader.reset();
            codeReader.decodeFromVideoDevice(null, 'video', async (result, err) => {
              if (result && !isScanning) {
                isScanning = true;
                const url = result.getText();
                console.log('QR Detected:', url);
                // ใส่ background ใหม่ตอนสแกนเสร็จ (ตอนโหลดโมเดล)
                document.body.style.background = "#fff";
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

// เพิ่มปุ่ม toggle ปิด/เปิด info-message
const infoMessageBox = document.getElementById('info-message');
const toggleBtn = document.getElementById('info-toggle-btn');
if (infoMessageBox && toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    if (infoMessageBox.classList.contains('closed')) {
      infoMessageBox.classList.remove('closed');
      floatingToggleBtn.innerHTML = '▼';
      floatingToggleBtn.title = 'ซ่อนแถบข้อมูล';
    } else {
      infoMessageBox.classList.add('closed');
      floatingToggleBtn.innerHTML = '▲';
      floatingToggleBtn.title = 'แสดงแถบข้อมูล';
    }
  });
}

// เพิ่มปุ่ม toggle ลอยใหม่สำหรับซ่อน/แสดงแถบข้อมูล (แสดงเฉพาะตอนมีข้อมูลโมเดล)
let floatingToggleBtn = document.getElementById('info-floating-toggle-btn');
if (!floatingToggleBtn) {
  floatingToggleBtn = document.createElement('button');
  floatingToggleBtn.id = 'info-floating-toggle-btn';
  floatingToggleBtn.innerHTML = '▼';
  floatingToggleBtn.title = 'ซ่อนแถบข้อมูล';
  // สไตล์ปุ่มลอย
  floatingToggleBtn.style.position = 'fixed';
  floatingToggleBtn.style.right = '24px';
  floatingToggleBtn.style.zIndex = '30';
  floatingToggleBtn.style.background = 'rgba(30,32,36,0.95)';
  floatingToggleBtn.style.color = '#fff';
  floatingToggleBtn.style.border = 'none';
  floatingToggleBtn.style.borderRadius = '50%';
  floatingToggleBtn.style.width = '48px';
  floatingToggleBtn.style.height = '48px';
  floatingToggleBtn.style.fontSize = '2rem';
  floatingToggleBtn.style.opacity = '0.92';
  floatingToggleBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
  floatingToggleBtn.style.cursor = 'pointer';
  floatingToggleBtn.style.display = 'none'; // ซ่อนเริ่มต้น
  floatingToggleBtn.style.transition = 'bottom 0.3s cubic-bezier(.4,0,.2,1)';
  document.body.appendChild(floatingToggleBtn);
}

if (infoMessageBox && floatingToggleBtn) {
  floatingToggleBtn.addEventListener('click', () => {
    if (infoMessageBox.classList.contains('closed')) {
      infoMessageBox.classList.remove('closed');
      infoMessageBox.style.maxHeight = '25vh';
      floatingToggleBtn.innerHTML = '▼';
      floatingToggleBtn.title = 'ซ่อนแถบข้อมูล';
    } else {
      infoMessageBox.classList.add('closed');
      infoMessageBox.style.maxHeight = '48px';
      floatingToggleBtn.innerHTML = '▲';
      floatingToggleBtn.title = 'แสดงแถบข้อมูล';
    }
    // อัปเดตตำแหน่งปุ่มทุกครั้งที่ toggle
    updateFloatingToggleBtn();
  });
}

// ฟังก์ชันสำหรับแสดง/ซ่อนปุ่ม toggle ลอย ตามสถานะ info-content
function updateFloatingToggleBtn() {
  const infoContent = document.getElementById('info-content');
  if (!floatingToggleBtn || !infoContent || !infoMessageBox) return;

  if (
    infoContent.querySelector('h3') ||
    infoContent.querySelector('p') ||
    infoContent.querySelector('#restart-scan-btn')
  ) {
    floatingToggleBtn.style.display = 'block';

    // คำนวณตำแหน่งปุ่มให้ลอยสูงกว่ากล่อง info-message เสมอ
    const rect = infoMessageBox.getBoundingClientRect();
    const gap = 12; // px ระยะห่างจากกล่อง
    // คำนวณจากขอบล่างหน้าจอถึงขอบบนกล่อง + gap
    const windowHeight = window.innerHeight;
    const bottom = windowHeight - rect.top + gap;
    floatingToggleBtn.style.bottom = `${bottom}px`;
  } else {
    floatingToggleBtn.style.display = 'none';
  }
}

// เรียกใช้ทุกครั้งที่ info-content เปลี่ยน
const infoContent = document.getElementById('info-content');
if (infoContent) {
  const observer = new MutationObserver(updateFloatingToggleBtn);
  observer.observe(infoContent, { childList: true, subtree: true });
  // เรียกครั้งแรก
  updateFloatingToggleBtn();
}

// เรียก updateFloatingToggleBtn ทุกครั้งที่ resize ด้วย
window.addEventListener('resize', updateFloatingToggleBtn);

// #info-floating-toggle-btn {
//   position: fixed;
//   right: 24px;
//   z-index: 30;
//   /* ไม่ต้องกำหนด bottom ตายตัวใน CSS */
// }