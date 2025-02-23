console.log("🚀 setting.js is running...");

// ✅ นำเข้า Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

// ✅ ตั้งค่า Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDwOyp3Vdjo5VlE9XT2BCXJQ411kLsJDQ",
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

// ✅ อัปเดต `/controls/`
async function updateControlState(key, value) {
  try {
    await set(ref(db, `controls/${key}`), value);
    console.log(`✅ Updated /controls/${key} →`, value);
  } catch (error) {
    console.error("❌ Firebase Error:", error);
  }
}

// ✅ โหลดสถานะจาก `/device/` และอัปเดต UI
function loadDeviceStatus() {
  onValue(ref(db, "device"), (snapshot) => {
    if (!snapshot.exists()) return;
    const device = snapshot.val();

    // ✅ ซิงค์ค่ากับ Toggle Switch
    document.getElementById("toggle-light").checked = device.light;
    document.getElementById("toggle-fan").checked = device.fan;

    // ✅ อัปเดต UI สำหรับสถานะอุปกรณ์
    document.getElementById("status-light").innerText = device.light ? "✅ เปิด" : "❌ ปิด";
    document.getElementById("status-fan").innerText = device.fan ? "✅ เปิด" : "❌ ปิด";
    document.getElementById("status-feed").innerText = device.feed_motor ? "✅ ทำงาน" : "❌ ปิด";
    document.getElementById("status-water").innerText = device.water_valve ? "✅ ทำงาน" : "❌ ปิด";

    console.log("🔄 อัปเดต UI จาก Firebase /device/:", device);
  });
}

// ✅ ฟังก์ชัน Countdown Timer (อัปเดตเฉพาะ `<span>`)
function startCountdown(buttonId, timerId, duration, key) {
  let button = document.getElementById(buttonId);
  let timerSpan = document.getElementById(timerId);
  let originalText = button.innerHTML;
  button.disabled = true; // ป้องกันการกดซ้ำ
  let timeLeft = duration;

  // ✅ เริ่มนับถอยหลัง
  let countdownInterval = setInterval(() => {
    timerSpan.innerText = `(${timeLeft}s)`;
    timeLeft--;

    if (timeLeft < 0) {
      clearInterval(countdownInterval);
      timerSpan.innerText = "";
      button.disabled = false; // เปิดให้กดใหม่
      updateControlState(key, false); // อัปเดตให้ Firebase ปิดมอเตอร์
    }
  }, 1000);
}

// ✅ โหลดค่าจาก Firebase เมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener("DOMContentLoaded", function () {
  console.log("🌐 Setting page loaded...");
  loadDeviceStatus();

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

  // ✅ ปุ่ม Feed อาหาร (Countdown 7 วินาที)
  document.getElementById("feed-food")?.addEventListener("click", async () => {
    try {
      console.log("🍽 Feeding food...");
      await updateControlState("feed_motor", true);
      startCountdown("feed-food", "feed-food-timer", 7, "feed_motor"); // เริ่มนับถอยหลัง
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการสั่ง Feed Food:", error);
    }
  });

  // ✅ ปุ่ม Feed น้ำ (Countdown 5 วินาที)
  document.getElementById("feed-water")?.addEventListener("click", async () => {
    try {
      console.log("💧 Feeding water...");
      await updateControlState("water_valve", true);
      startCountdown("feed-water", "feed-water-timer", 5, "water_valve"); // เริ่มนับถอยหลัง
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการสั่ง Feed Water:", error);
    }
  });

  // ✅ ปุ่มรีเซ็ตระบบ
  document.getElementById("reset-system")?.addEventListener("click", async () => {
    if (confirm("⚠️ คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตระบบ?")) {
      await updateControlState("light", false);
      await updateControlState("fan", false);
      await updateControlState("feed_motor", false);
      await updateControlState("spread_motor", false);
      await updateControlState("water_valve", false);
      alert("✅ ระบบถูกรีเซ็ตเรียบร้อยแล้ว!");
    }
  });
});
