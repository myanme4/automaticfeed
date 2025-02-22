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

  // ✅ ปุ่ม Feed อาหาร
  const feedButton = document.getElementById("feed-food");
  if (feedButton) {
    feedButton.addEventListener("click", async () => {
      let countdown = 7;  // ✅ เปลี่ยนเป็น 7 วินาทีให้ตรงกับ Arduino
      feedButton.disabled = true;
      await updateControlState("feed_motor", true);

      const countdownInterval = setInterval(() => {
        if (countdown > 0) {
          feedButton.textContent = `กำลังให้อาหาร... ${countdown} วิ`;
          countdown--;
        } else {
          clearInterval(countdownInterval);
          updateControlState("feed_motor", false);
          feedButton.disabled = false;
          feedButton.textContent = "FEED";
          alert("✅ ให้อาหารเสร็จสิ้น!");
        }
      }, 1000);
    });
  }

  // ✅ ปุ่ม Feed น้ำ
  const feedWater = document.getElementById("feed-water");
if (feedWater) {
  feedWater.addEventListener("click", async () => {
    feedWater.disabled = true;  // ✅ ป้องกันการกดซ้ำ
    await updateControlState("water_valve", true);
    
    let countdown = 10;
    const countdownInterval = setInterval(() => {
      if (countdown > 0) {
        feedWater.textContent = `ให้น้ำ... ${countdown} วิ`;
        countdown--;
      } else {
        clearInterval(countdownInterval);
        updateControlState("water_valve", false);
        feedWater.disabled = false;
        feedWater.textContent = "FEED WATER";
        alert("✅ ให้น้ำเสร็จสิ้น!");
      }
    }, 1000);
  });
}

  // ✅ ปุ่มรีเซ็ตระบบ
  const resetSystem = document.getElementById("reset-system");
  if (resetSystem) {
    resetSystem.addEventListener("click", async () => {
      if (confirm("⚠️ คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตระบบ?")) {
        await updateControlState("light", false);
        await updateControlState("fan", false);
        await updateControlState("feed_motor", false);
        await updateControlState("spread_motor", false);
        await updateControlState("water_valve", false);

        alert("✅ ระบบถูกรีเซ็ตเรียบร้อยแล้ว!");
      }
    });
  }
});
