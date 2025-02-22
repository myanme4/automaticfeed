console.log("🚀 setting.js is running...");

// ✅ นำเข้า Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
  get,
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

// ✅ ตั้งค่า Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDwOyp3Vdjo5VlE9XT2BCXjKQ411kLsJDQ",
  authDomain: "dht22-14f97.firebaseapp.com",
  databaseURL: "https://dht22-14f97-default-rtdb.firebaseio.com",
  projectId: "dht22-14f97",
  storageBucket: "dht22-14f97.firebasestorage.app",
  messagingSenderId: "131749789651",
  appId: "1:131749789651:web:20c7b9cbd9fca47ee2b926",
  measurementId: "G-RKV9EL32X4"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const controlRef = ref(db, "controls");

// ✅ ฟังก์ชันอัปเดต Firebase และ UI
async function updateControlAndDevice(key, value) {
  try {
    await set(ref(db, "controls/" + key), value);
    await set(ref(db, "device/" + key), value);
    updateStatusUI({ [key]: value }); // ✅ อัปเดต UI ทันที
    console.log(`✅ Updated ${key} in both controls and device to`, value);
  } catch (error) {
    console.error("❌ Firebase Error:", error);
  }
}

// ✅ ฟังก์ชันอัปเดต UI แสดงสถานะอุปกรณ์
function updateStatusUI(data) {
  document.getElementById("status-light").textContent = data.light ? "ON ✅" : "OFF ❌";
  document.getElementById("status-fan").textContent = data.fan ? "ON ✅" : "OFF ❌";
  document.getElementById("status-feed").textContent = data.feed_motor ? "ON ✅" : "OFF ❌";
  document.getElementById("status-water").textContent = data.water_valve ? "ON ✅" : "OFF ❌";
  document.getElementById("status-spread").textContent = data.spread_motor ? "ON ✅" : "OFF ❌";

  // เปลี่ยนสีของสถานะให้ชัดเจนขึ้น
  document.getElementById("status-light").className = data.light ? "status-on" : "status-off";
  document.getElementById("status-fan").className = data.fan ? "status-on" : "status-off";
  document.getElementById("status-feed").className = data.feed_motor ? "status-on" : "status-off";
  document.getElementById("status-water").className = data.water_valve ? "status-on" : "status-off";
  document.getElementById("status-spread").className = data.spread_motor ? "status-on" : "status-off";
}

// ✅ ฟังก์ชันโหลดค่าจาก Firebase และอัปเดต UI
function loadSettings() {
  const loadingIndicator = document.getElementById("loadingIndicator");
  if (loadingIndicator) loadingIndicator.style.display = "block"; // แสดงข้อความกำลังโหลด

  onValue(controlRef, (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.val();

    // ✅ อัปเดต UI ของปุ่มควบคุม
    document.getElementById("toggle-light").checked = !!data.light;
    document.getElementById("toggle-fan").checked = !!data.fan;
    document.getElementById("feed-food").textContent = data.feed_motor ? "STOP" : "FEED";
    document.getElementById("feed-water").textContent = data.water_valve ? "STOP" : "FEED";
    document.getElementById("spread-motor").textContent = data.spread_motor ? "STOP" : "SPREAD";

    // ✅ อัปเดตสถานะอุปกรณ์ที่แสดงใน UI
    updateStatusUI(data);

    console.log("🔄 Updated UI from Firebase:", data);
  });

  setTimeout(() => {
    if (loadingIndicator) loadingIndicator.style.display = "none";
  }, 1500);
}

// ✅ โหลดค่าจาก Firebase เมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener("DOMContentLoaded", function () {
  console.log("🌐 Setting page loaded...");
  loadSettings(); // โหลดค่าเริ่มต้นจาก Firebase

  // ✅ จับ Event ปุ่มควบคุม
  document.getElementById("toggle-light").addEventListener("change", function () {
    updateControlAndDevice("light", this.checked);
  });

  document.getElementById("toggle-fan").addEventListener("change", function () {
    updateControlAndDevice("fan", this.checked);
  });

  document.getElementById("feed-food").addEventListener("click", async () => {
    const feedButton = document.getElementById("feed-food");
    let countdown = 7; // ตั้งค่าคูลดาวน์ 7 วินาที

    // ❌ ปิดปุ่มห้ามกด
    feedButton.disabled = true;
    
    // ✅ อัปเดต Firebase ว่า feed_motor = true
    await updateControlAndDevice("feed_motor", true);

    // ✅ เริ่มนับถอยหลัง
    const countdownInterval = setInterval(() => {
        if (countdown > 0) {
            feedButton.textContent = `กำลังให้อาหาร... ${countdown} วิ`; // อัปเดตตัวเลขในปุ่ม
            countdown--;
        } else {
            clearInterval(countdownInterval); // หยุดนับถอยหลังเมื่อครบเวลา
            
            // ✅ อัปเดต Firebase ว่า feed_motor = false
            updateControlAndDevice("feed_motor", false);

            // ✅ คืนค่าปุ่มเป็นปกติ
            feedButton.disabled = false;
            feedButton.textContent = "FEED";
            
            // ✅ แสดงข้อความว่าให้อาหารเสร็จแล้ว
            alert("✅ ให้อาหารเสร็จสิ้น!");
        }
    }, 1000); // นับถอยหลังทุก 1 วินาที
});

  document.getElementById("feed-water").addEventListener("click", async () => {
    const snapshot = await get(ref(db, "/controls/water_valve"));
    const isWatering = snapshot.exists() ? snapshot.val() : false;
    await updateControlAndDevice("water_valve", !isWatering);
  });

  // ✅ ปุ่มรีเซ็ตระบบ
  document.getElementById("reset-system").addEventListener("click", async () => {
    if (confirm("⚠️ คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตระบบ?")) {
      await updateControlAndDevice("light", false);
      await updateControlAndDevice("fan", false);
      await updateControlAndDevice("feed_motor", false);
      await updateControlAndDevice("spread_motor", false);
      await updateControlAndDevice("water_valve", false);

      // ✅ รีเซ็ต UI
      updateStatusUI({
        light: false,
        fan: false,
        feed_motor: false,
        spread_motor: false,
        water_valve: false,
      });

      alert("✅ ระบบถูกรีเซ็ตเรียบร้อยแล้ว!");
    }
  });
});
