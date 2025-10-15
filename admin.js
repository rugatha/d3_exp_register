// 無後端版管理：使用 localStorage。可初始化、匯入/匯出、查看狀態與預約。
const DATES = ["A", "B"];
const HOURS = [13, 14, 15, 16, 17];
const DEFAULT_CAPACITY = 3;

const initBtn = document.getElementById("initSlots");
const resetBtn = document.getElementById("resetAll");
const refreshBtn = document.getElementById("refresh");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const slotStatus = document.getElementById("slotStatus");
const reservationList = document.getElementById("reservationList");

function fmtHour(h) { return `${h.toString().padStart(2, "0")}:00`; }
function lsGet() { try { return JSON.parse(localStorage.getItem("bookingData")); } catch { return null; } }
function lsSet(data) { localStorage.setItem("bookingData", JSON.stringify(data)); }

function ensureInitialized() {
  let data = lsGet();
  if (!data) data = { slots: {}, reservations: [] };
  if (!data.slots) data.slots = {};
  for (const d of DATES) {
    if (!data.slots[d]) data.slots[d] = {};
    for (const h of HOURS) {
      const key = fmtHour(h);
      if (!data.slots[d][key]) data.slots[d][key] = { capacity: DEFAULT_CAPACITY, count: 0 };
    }
  }
  if (!Array.isArray(data.reservations)) data.reservations = [];
  lsSet(data);
}

function renderStatus() {
  slotStatus.innerHTML = "";
  const data = lsGet();
  for (const d of DATES) {
    const title = document.createElement("h3");
    title.textContent = `日期 ${d}`;
    slotStatus.appendChild(title);

    for (const h of HOURS) {
      const s = data.slots[d][fmtHour(h)];
      const left = Math.max(0, (s.capacity ?? DEFAULT_CAPACITY) - (s.count ?? 0));
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `
        <div>${fmtHour(h)}</div>
        <div class="badge ${left>0? 'ok':'full'}">${s.count}/${s.capacity}（剩 ${left}）</div>
      `;
      slotStatus.appendChild(row);
    }
  }
}

function renderReservations() {
  reservationList.innerHTML = "";
  const data = lsGet();
  if (!data.reservations.length) {
    reservationList.innerHTML = "<div class='row'>尚無預約</div>";
    return;
  }
  for (const r of data.reservations) {
    const row = document.createElement("div");
    row.className = "row";
    const when = new Date(r.createdAt).toLocaleString();
    row.innerHTML = `
      <div>${r.date} 日 ${r.slot}</div>
      <div>${r.name} ${r.email ? `&lt;${r.email}&gt;` : ""}</div>
      <div class="badge">${when}</div>
    `;
    reservationList.appendChild(row);
  }
}

function loadAll() { ensureInitialized(); renderStatus(); renderReservations(); }

initBtn.addEventListener("click", () => {
  if (!confirm("建立/覆蓋 A、B 日 13:00~17:00 的時段，容量=3，並將 count 歸零。確定？")) return;
  const data = lsGet() || { slots: {}, reservations: [] };
  data.slots = data.slots || {};
  for (const d of DATES) {
    data.slots[d] = data.slots[d] || {};
    for (const h of HOURS) {
      data.slots[d][fmtHour(h)] = { capacity: DEFAULT_CAPACITY, count: 0 };
    }
  }
  lsSet(data);
  alert("初始化完成（僅此瀏覽器）。");
  loadAll();
});

resetBtn.addEventListener("click", () => {
  if (!confirm("⚠️ 將清空此瀏覽器所有預約與時段資料。確定？")) return;
  localStorage.removeItem("bookingData");
  ensureInitialized();
  loadAll();
});

refreshBtn.addEventListener("click", loadAll);

exportBtn.addEventListener("click", () => {
  const data = lsGet() || { slots: {}, reservations: [] };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `booking_export_${Date.now()}.json`; 
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

importFile.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== "object") throw new Error("格式錯誤");
      if (!data.slots || !data.reservations) throw new Error("缺少 slots / reservations");
      lsSet(data);
      alert("匯入完成。");
      loadAll();
    } catch (err) {
      alert("匯入失敗：" + (err.message || err));
    }
  };
  reader.readAsText(file);
});

// 啟動
loadAll();
