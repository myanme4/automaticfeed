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
async function updateControl(key, value) {
  await set(ref(db, "controls/" + key), value)
    .then(() => console.log(`✅ Updated ${key} to`, value))
    .catch((error) => console.error("❌ Firebase Error:", error));
}

// ✅ โหลดค่าจาก Firebase
function loadSettings() {
  onValue(controlRef, (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.val();

    document.getElementById("toggle-light").checked = !!data.light;
    document.getElementById("toggle-fan").checked = !!data.fan;
    document.getElementById("feed-food").textContent = data.feed_motor ? "STOP" : "FEED";
    document.getElementById("feed-water").textContent = data.water_valve ? "STOP" : "FEED";

    console.log("🔄 Updated UI from Firebase:", data);
  });
}

// ✅ โหลดค่าจาก Firebase เมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener("DOMContentLoaded", function () {
  console.log("🌐 Setting page loaded...");
// ✅ รอให้ ESP32 ปิด feed_motor ก่อนเริ่ม spread_motor
onValue(ref(db, "/device/feed_motor"), (snapshot) => {
  if (snapshot.exists() && snapshot.val() === false) {
    console.log("✅ feed_motor ปิดลง -> เริ่ม spread_motor");
    updateControl("spread_motor", true);
    setTimeout(() => updateControl("spread_motor", false), 9000);
  }
});
  loadSettings();

  document.getElementById("toggle-light").addEventListener("change", function () {
    updateControl("light", this.checked);
  });

  document.getElementById("toggle-fan").addEventListener("change", function () {
    updateControl("fan", this.checked);
  });

  document.getElementById("feed-food").addEventListener("click", async () => {
    const snapshot = await get(ref(db, "/controls/feed_motor"));
    const isFeeding = snapshot.exists() ? snapshot.val() : false;
    await updateControl("feed_motor", !isFeeding);
  });

  document.getElementById("feed-water").addEventListener("click", async () => {
    const snapshot = await get(ref(db, "/controls/water_valve"));
    const isWatering = snapshot.exists() ? snapshot.val() : false;
    await updateControl("water_valve", !isWatering);
  });

  document.getElementById("reset-system").addEventListener("click", async () => {
    if (confirm("⚠️ คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตระบบ?")) {
      await updateControl("light", false);
      await updateControl("fan", false);
      await updateControl("feed_motor", false);
      await updateControl("spread_motor", false);
      await updateControl("water_valve", false);
      alert("✅ ระบบถูกรีเซ็ตเรียบร้อยแล้ว!");
    }
  });
});
