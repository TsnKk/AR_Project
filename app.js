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
  model = gltf.scene; // <<== ต้องเพิ่มบรรทัดนี้
  scene.add(model);
}, undefined, error => console.error('Error loading model:', error));
    }
    
// ✅ เพิ่มโมเดลใหม่เข้า Scene
  model = gltf.scene;
  model.scale.set(0.2, 0.2, 0.2); // ปรับขนาดเล็กลง

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

// ✅ วนเรนเดอร์ทุกเฟรม
function animate() {
  requestAnimationFrame(animate);

  if (model) {
    model.rotation.y += 0.01; // หมุนโมเดล
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


