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
  storageBucket: "dht22-14f97.appspot.com",
  messagingSenderId: "131749789651",
  appId: "1:131749789651:web:20c7b9cbd9fca47ee2b926",
  measurementId: "G-RKV9EL32X4",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const controlRef = ref(db, "controls");

// ✅ ฟังก์ชันอัปเดต Firebase
async function updateControlAndDevice(key, value) {
  try {
    await set(ref(db, "controls/" + key), value);
    await set(ref(db, "device/" + key), value);
    console.log(`✅ Updated ${key} in both controls and device to`, value);
  } catch (error) {
    console.error("❌ Firebase Error:", error);
  }
}

// ✅ ฟังก์ชันโหลดค่าจาก Firebase และอัปเดต UI
function loadSettings() {
  const loadingIndicator = document.getElementById("loadingIndicator");
  if (loadingIndicator) loadingIndicator.style.display = "block"; // แสดงข้อความกำลังโหลด

  onValue(controlRef, (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.val();

    // ✅ อัปเดต UI จาก Firebase
    document.getElementById("toggle-light").checked = !!data.light;
    document.getElementById("toggle-fan").checked = !!data.fan;
    document.getElementById("feed-food").textContent = data.feed_motor ? "STOP" : "FEED";
    document.getElementById("feed-water").textContent = data.water_valve ? "STOP" : "FEED";
    document.getElementById("spread-motor").textContent = data.spread_motor ? "STOP" : "SPREAD";

    console.log("🔄 Updated UI from Firebase:", data);
  });

  // ✅ ซ่อน Loading Indicator เมื่อโหลดเสร็จ
  setTimeout(() => {
    if (loadingIndicator) loadingIndicator.style.display = "none";
  }, 1500);
}

// ✅ โหลดค่าจาก Firebase เมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener("DOMContentLoaded", function () {
  console.log("🌐 Setting page loaded...");

  loadSettings(); // โหลดค่าเริ่มต้นจาก Firebase

  document.getElementById("toggle-light").addEventListener("change", function () {
    updateControlAndDevice("light", this.checked);
  });

  document.getElementById("toggle-fan").addEventListener("change", function () {
    updateControlAndDevice("fan", this.checked);
  });

  document.getElementById("feed-food").addEventListener("click", async () => {
    const snapshot = await get(ref(db, "/controls/feed_motor"));
    const isFeeding = snapshot.exists() ? snapshot.val() : false;
    await updateControlAndDevice("feed_motor", !isFeeding);
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
      alert("✅ ระบบถูกรีเซ็ตเรียบร้อยแล้ว!");
    }
  });
});
