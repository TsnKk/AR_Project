import * as THREE from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';

const video = document.getElementById('video');
const infoBox = document.getElementById('info-box');  // สมมติเพิ่ม div นี้ใน HTML เพื่อแสดงข้อมูล

// ตั้งค่ากล้อง
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
  .then(stream => video.srcObject = stream);

// ZXing - สแกน QR แล้วโหลดโมเดล + ข้อมูล
const codeReader = new ZXing.BrowserMultiFormatReader();
codeReader.decodeFromVideoDevice(null, 'video', async (result, err) => {
  if (result) {
    const url = result.getText();
    console.log('QR Detected:', url);
    loadFromQR(url);
    //codeReader.reset(); // หยุดสแกนถ้าต้องการ
  }
});

// สร้าง Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// แสง
const light = new THREE.HemisphereLight(0xffffff, 0x444444);
scene.add(light);

let model = null;

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
    model.scale.set(0.07, 0.07, 0.07); // โมเดลเล็กลงครึ่งหนึ่ง
    scene.add(model);
  }, undefined, error => console.error('Error loading model:', error));
}

// ฟังก์ชันโหลด JSON จาก URL ที่ได้จาก QR Code แล้วแสดงข้อมูล + โหลดโมเดล
function loadFromQR(jsonUrl) {
  fetch(jsonUrl)
    .then(res => res.json())
    .then(data => {
      // แสดงข้อมูลใน infoBox
      if(infoBox){
        infoBox.innerHTML = `
          <h3>${data.name}</h3>
          <p>${data.description}</p>
          <p><strong>ราคา:</strong> ${data.price}</p>
          <p><strong>แหล่งที่มา:</strong> ${data.origin}</p>
        `;
      }

      // โหลดโมเดลจาก URL ที่ได้ใน JSON
      loadModel(data.model);
    })
    .catch(err => {
      console.error('โหลด JSON ไม่สำเร็จ:', err);
      if(infoBox) infoBox.innerHTML = 'ไม่สามารถโหลดข้อมูลจาก QR Code นี้ได้';
    });
}

// เรนเดอร์ลูป
function animate() {
  requestAnimationFrame(animate);
  if (model) model.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// รองรับ responsive
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

