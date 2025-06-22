// ✅ นำเข้า Three.js และ GLTFLoader
import * as THREE from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';

// ✅ อ้างอิงองค์ประกอบ HTML
const video = document.getElementById('video');
const infoBox = document.getElementById('info-box');  // กล่องแสดงข้อมูลโมเดล
const scanAgainBtn = document.getElementById('scan-again-btn');
if (scanAgainBtn) {
  scanAgainBtn.addEventListener('click', () => {
    // รีเซ็ตข้อมูล
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

    // Delay 1 วินาทีก่อนเปิดกล้องและเริ่มสแกนใหม่
    setTimeout(() => {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          video.srcObject = stream;
          codeReader.reset();
          codeReader.decodeFromVideoDevice(null, 'video', async (result, err) => {
            if (result) {
              const url = result.getText();
              console.log('QR Detected:', url);
              loadFromQR(url);
            }
          });
        });
    }, 1000);
  });
}

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
    model.position.y = 0.5; // ขยับโมเดลขึ้น 10% ของฉาก (ประมาณ 0.5 หน่วย)
    scene.add(model);
  }, undefined, error => console.error('Error loading model:', error));
    }
    

// ✅ โหลดข้อมูลจาก QR (รองรับทั้ง URL และ JSON)
function loadFromQR(qrUrl) {
  const url = new URL(qrUrl);
  const jsonUrl = url.searchParams.get("src") || qrUrl; // ดึงค่าจาก ?src=... หรือใช้ตรงๆ

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

      // ⬇ โหลดโมเดลตามลิงก์ใน JSON
      loadModel(data.model);

      // เปลี่ยนพื้นหลังเป็นสีขาวล้วน
      renderer.setClearColor(0xffffff, 1);
      document.body.style.background = "#fff";

      // ปิดกล้อง
      if (video && video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
      }
    })
    .catch(err => {
      console.error('โหลด JSON ไม่สำเร็จ:', err);
      if (infoBox) infoBox.innerHTML = 'ไม่สามารถโหลดข้อมูลจาก QR Code นี้ได้';
    });
}

let isDragging = false;
let previousX = 0;
let rotationY = 0;
let autoRotate = true; // เพิ่มตัวแปรสำหรับหมุนอัตโนมัติ

// --- Mouse Events ---
renderer.domElement.addEventListener('mousedown', (e) => {
  isDragging = true;
  autoRotate = false; // หยุดหมุนอัตโนมัติเมื่อเริ่มลาก
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
  autoRotate = true; // กลับมาหมุนอัตโนมัติเมื่อหยุดลาก
});
renderer.domElement.addEventListener('mouseleave', () => {
  isDragging = false;
  autoRotate = true;
});

// --- Touch Events ---
renderer.domElement.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    autoRotate = false; // หยุดหมุนอัตโนมัติเมื่อเริ่มลาก
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
  autoRotate = true; // กลับมาหมุนอัตโนมัติเมื่อหยุดลาก
});

// ✅ วนเรนเดอร์ทุกเฟรม
function animate() {
  requestAnimationFrame(animate);

  if (model) {
    // ถ้ากำลังลากอยู่จะไม่หมุนอัตโนมัติ
    if (!isDragging && autoRotate) {
      rotationY += 0.01; // หมุนอัตโนมัติ
    }
    model.rotation.y = rotationY;
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
