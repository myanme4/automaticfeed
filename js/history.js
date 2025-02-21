import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import {
  getDatabase,
  ref,
  query,
  orderByChild,
  startAt,
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
  measurementId: "G-RKV9EL32X4"
};

// ✅ เริ่มต้น Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const logsRef = ref(db, "logs");

// ✅ โหลดข้อมูลย้อนหลัง 15 วัน
const fifteenDaysAgo = new Date();
fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

// ✅ ฟังก์ชันแปลงวันที่
function formatDateTH(timestamp) {
  const date = new Date(timestamp);
  const options = { day: "2-digit", month: "short" };
  return date.toLocaleDateString("th-TH", options);
}

// ✅ ดึงข้อมูลย้อนหลังจาก Firebase
async function loadHistoryData() {
  const spinner = document.getElementById("loadingSpinner");
  if (spinner) spinner.style.display = "block";

  try {
    const logQuery = query(
      logsRef,
      orderByChild("timestamp"),
      startAt(fifteenDaysAgo.getTime() / 1000)  // ✅ แปลงเป็นวินาที
    );    
    const snapshot = await get(logQuery);

    if (spinner) spinner.style.display = "none";

    if (!snapshot.exists()) {
      console.warn("❌ ไม่มีข้อมูลย้อนหลัง 15 วัน");
      document.getElementById("historyTableBody").innerHTML =
        "<tr><td colspan='3'>ไม่มีข้อมูลย้อนหลัง</td></tr>";
      return;
    }

    let dataRows = snapshot.val();
    processHistoricalData(dataRows);
  } catch (error) {
    console.error("❌ Firebase Error:", error);
    if (spinner) spinner.style.display = "none";
    document.getElementById("historyTableBody").innerHTML =
      "<tr><td colspan='3'>เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>";
  }
}

function processHistoricalData(dataRows) {
  if (!dataRows) {
    console.warn("⚠ ไม่มีข้อมูลย้อนหลังใน Firebase");
    return;
  }

  let dailyData = {};
  let tempDataPoints = [];
  let humidityDataPoints = [];

  Object.values(dataRows).forEach((row) => {
    if (!row.timestamp || isNaN(Number(row.timestamp))) {
      console.warn("⚠️ ข้อมูลผิดพลาด:", row);
      return;
    }

    let timestamp = Number(row.timestamp);
    if (timestamp < 10000000000) timestamp *= 1000; // ✅ แปลงเป็นมิลลิวินาทีถ้าจำเป็น

    // ✅ ใช้ formatted_time ถ้ามี หรือใช้ timestamp แปลงเป็นวันที่ถ้าไม่มี
    let dateKey = row.formatted_time ? row.formatted_time.substring(0, 10) : formatDateTH(timestamp);

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { temperature: row.temperature, humidity: row.humidity, count: 1 };
    } else {
      dailyData[dateKey].temperature += parseFloat(row.temperature);
      dailyData[dateKey].humidity += parseFloat(row.humidity);
      dailyData[dateKey].count++;
    }
  });

  let tableHTML = "";
  Object.keys(dailyData).forEach((date) => {
    let values = dailyData[date];
    let avgTemp = (values.temperature / values.count).toFixed(1);
    let avgHumidity = (values.humidity / values.count).toFixed(0);

    tableHTML += `<tr><td>${date}</td><td>${avgTemp} °C</td><td>${avgHumidity} %</td></tr>`;

    // ✅ เตรียมข้อมูลสำหรับกราฟ
    tempDataPoints.push({ label: date, y: parseFloat(avgTemp) });
    humidityDataPoints.push({ label: date, y: parseFloat(avgHumidity) });
  });

  document.getElementById("historyTableBody").innerHTML = tableHTML;

  // ✅ เรียกใช้ฟังก์ชันสร้างกราฟหลังจากประมวลผลข้อมูลเสร็จ
  renderChart({ temp: tempDataPoints, humidity: humidityDataPoints });
}

// ✅ ฟังก์ชันสร้างกราฟด้วย CanvasJS
function renderChart(dataPoints) {
  var chart = new CanvasJS.Chart("chartContainer", {
    theme: "light2",
    title: { text: "อุณหภูมิและความชื้นย้อนหลัง" },
    axisX: { title: "วันที่" },
    axisY: { title: "อุณหภูมิ (°C)", lineColor: "#FF0000" },
    axisY2: { title: "ความชื้น (%)", lineColor: "#0000FF" },
    data: [
      {
        type: "line",
        name: "อุณหภูมิ",
        showInLegend: true,
        dataPoints: dataPoints.temp,
        axisYType: "primary"
      },
      {
        type: "line",
        name: "ความชื้น",
        showInLegend: true,
        dataPoints: dataPoints.humidity,
        axisYType: "secondary"
      }
    ]
  });
  chart.render();
}