// ✅ นำเข้า Three.js และ GLTFLoader
import * as THREE from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';

// ✅ อ้างอิงองค์ประกอบ HTML
const video = document.getElementById('video');
const infoBox = document.getElementById('info-box');  // กล่องแสดงข้อมูลโมเดล

// ✅ เปิดกล้องหลัง
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
  .then(stream => video.srcObject = stream);

// ✅ สร้าง element สำหรับแสดงวงหมุนโหลดและเวลา
const loaderOverlay = document.createElement('div');
loaderOverlay.style.position = 'fixed';
loaderOverlay.style.top = 0;
loaderOverlay.style.left = 0;
loaderOverlay.style.width = '100vw';
loaderOverlay.style.height = '100vh';
loaderOverlay.style.background = 'rgba(0,0,0,0.5)';
loaderOverlay.style.display = 'flex';
loaderOverlay.style.flexDirection = 'column';
loaderOverlay.style.justifyContent = 'center';
loaderOverlay.style.alignItems = 'center';
loaderOverlay.style.zIndex = 9999;
loaderOverlay.style.color = '#fff';
loaderOverlay.style.fontSize = '2em';
loaderOverlay.innerHTML = `
  <div class="spinner" style="border: 8px solid #f3f3f3; border-top: 8px solid #3498db; border-radius: 50%; width: 60px; height: 60px; animation: spin 1s linear infinite;"></div>
  <div id="loading-time" style="margin-top: 20px;">0 วินาที</div>
`;
document.body.appendChild(loaderOverlay);
loaderOverlay.style.display = 'none';

// เพิ่ม CSS สำหรับ spinner
const style = document.createElement('style');
style.innerHTML = `
@keyframes spin {
  0% { transform: rotate(0deg);}
  100% { transform: rotate(360deg);}
}`;
document.head.appendChild(style);

// ✅ ตั้งค่า QR Code Scanner ด้วย ZXing
const codeReader = new ZXing.BrowserMultiFormatReader();
codeReader.decodeFromVideoDevice(null, 'video', async (result, err) => {
  if (result) {
    const url = result.getText();
    console.log('QR Detected:', url);

    // ปิดกล้อง
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }

    // แสดงวงหมุนโหลดและจับเวลา
    loaderOverlay.style.display = 'flex';
    let seconds = 0;
    const timeDiv = document.getElementById('loading-time');
    timeDiv.textContent = '0 วินาที';
    const timer = setInterval(() => {
      seconds++;
      timeDiv.textContent = `${seconds} วินาที`;
    }, 1000);

    // โหลดข้อมูลจาก QR
    await loadFromQR(url);

    // ซ่อนวงหมุนโหลดและหยุดจับเวลา
    clearInterval(timer);
    loaderOverlay.style.display = 'none';

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
    })
    .catch(err => {
      console.error('โหลด JSON ไม่สำเร็จ:', err);
      if (infoBox) infoBox.innerHTML = 'ไม่สามารถโหลดข้อมูลจาก QR Code นี้ได้';
    });
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
    model.rotation.y = rotationY; // หมุนตามค่าที่ควบคุม
    model.rotation.y += 0.01;
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


