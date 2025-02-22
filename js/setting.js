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
const deviceRef = ref(db, "device");

// ✅ อัปเดต `/controls/` (ESP32 จะอ่านแล้วอัปเดต `/device/`)
async function updateControlState(key, value) {
  try {
    await set(ref(db, `controls/${key}`), value);
    console.log(`✅ Updated /controls/${key} →`, value);
  } catch (error) {
    console.error("❌ Firebase Error:", error);
  }
}

// ✅ โหลดสถานะจาก `/device/` ไปแสดงใน UI
function loadDeviceStatus() {
  onValue(deviceRef, (snapshot) => {
    if (!snapshot.exists()) {
      console.warn("⚠️ No data found in Firebase for device!");
      return;
    }
    const data = snapshot.val();
    console.log("🔄 Updated UI from /device/:", data);
    updateStatusUI(data);
  });
}

// ✅ อัปเดต UI ตามสถานะใน `/device/`
function updateStatusUI(data) {
  const statusMap = {
    light: "light",
    fan: "fan",
    feed_motor: "feed",
    water_valve: "water",
    spread_motor: "spread",  // ✅ เพิ่ม spread_motor
  };

  Object.keys(statusMap).forEach((key) => {
    const statusElement = document.getElementById(`status-${statusMap[key]}`);
    if (statusElement) {
        statusElement.textContent = data[key] ? `ON ✅` : `OFF ❌`;
        statusElement.className = data[key] ? "status-on" : "status-off";
    }
  });
}

// ✅ โหลดค่าจาก Firebase เมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener("DOMContentLoaded", function () {
  console.log("🌐 Setting page loaded...");
  loadDeviceStatus(); // ✅ โหลดค่าจาก /device/

  // ✅ ปุ่ม Toggle (เปิด/ปิด อุปกรณ์)
  const addToggleListener = (id, key) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("change", function () {
        updateControlState(key, this.checked);
      });
    }
  };

  addToggleListener("toggle-light", "light");
  addToggleListener("toggle-fan", "fan");
  addToggleListener("toggle-feed-motor", "feed_motor");
  addToggleListener("toggle-water-valve", "water_valve");

  // ✅ ปุ่ม Feed อาหาร (อ่านจาก /device/feed_motor แทน /controls/)
const feedButton = document.getElementById("feed-food");
if (feedButton) {
  feedButton.addEventListener("click", async () => {
    try {
      // ✅ อ่านค่าปัจจุบันจาก /device/feed_motor
      const snapshot = await get(ref(db, "device/feed_motor"));
      const currentState = snapshot.exists() ? snapshot.val() : false;

      // ✅ สลับสถานะ (เปิด -> ปิด, ปิด -> เปิด)
      const newState = !currentState;

      // ✅ อัปเดตค่าไปที่ /controls/feed_motor เพื่อให้ ESP32 จัดการ
      await updateControlState("feed_motor", newState);

      console.log(`🍽 อัปเดต feed_motor ใน Firebase → ${newState ? "ON ✅" : "OFF ❌"}`);
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการสั่ง Feed Food:", error);
    }
  });
}

// ✅ ปุ่ม Feed น้ำ (อ่านจาก /device/water_valve แทน /controls/)
const feedWater = document.getElementById("feed-water");
if (feedWater) {
  feedWater.addEventListener("click", async () => {
    try {
      // ✅ อ่านค่าปัจจุบันจาก /device/water_valve
      const snapshot = await get(ref(db, "device/water_valve"));
      const currentState = snapshot.exists() ? snapshot.val() : false;

      // ✅ สลับสถานะ (เปิด -> ปิด, ปิด -> เปิด)
      const newState = !currentState;

      // ✅ อัปเดตค่าไปที่ /controls/water_valve เพื่อให้ ESP32 จัดการ
      await updateControlState("water_valve", newState);

      console.log(`💧 อัปเดต water_valve ใน Firebase → ${newState ? "ON ✅" : "OFF ❌"}`);
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการสั่ง Feed Water:", error);
    }
  });
}

  // ✅ ปุ่มรีเซ็ตระบบ
const resetSystem = document.getElementById("reset-system");
if (resetSystem) {
  resetSystem.addEventListener("click", async () => {
    if (confirm("⚠️ คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตระบบ?")) {
      // ✅ ตั้งค่าทุกอย่างเป็น false ที่ /controls/
      await updateControlState("light", false);
      await updateControlState("fan", false);
      await updateControlState("feed_motor", false);
      await updateControlState("spread_motor", false);
      await updateControlState("water_valve", false);

      alert("✅ ระบบถูกรีเซ็ตเรียบร้อยแล้ว!");

      // ✅ หลังจากรีเซ็ต ดึงค่าล่าสุดจาก /device/ เพื่ออัปเดต UI
      refreshToggleState();
    }
  });
}

// ✅ ฟังก์ชันอัปเดตปุ่ม Toggle ตามค่าใน /device/
async function refreshToggleState() {
  try {
    const snapshot = await get(ref(db, "device"));
    if (!snapshot.exists()) {
      console.warn("⚠️ ไม่พบข้อมูลจาก /device/");
      return;
    }
    const data = snapshot.val();

    // ✅ อัปเดตสถานะปุ่ม Toggle ตามค่าใน /device/
    document.getElementById("toggle-light").checked = data.light;
    document.getElementById("toggle-fan").checked = data.fan;
    document.getElementById("toggle-feed-motor").checked = data.feed_motor;
    document.getElementById("toggle-spread-motor").checked = data.spread_motor;
    document.getElementById("toggle-water-valve").checked = data.water_valve;

    console.log("🔄 ปรับสถานะปุ่ม Toggle ตามค่าจริงใน /device/");
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการดึงค่าจาก /device/:", error);
  }
}
});
