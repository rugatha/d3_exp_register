// 後台檢視（無後端 / localStorage）
const DATES = ["A", "B"];
const HOURS = [13, 14, 15, 16, 17];
const DEFAULT_CAPACITY = 3;
const ADMIN_PASSWORD = "admin123"; // ⚠️ 請自行更改

const loginPanel = document.getElementById("loginPanel");
const adminPanel = document.getElementById("adminPanel");
const passInput = document.getElementById("adminPass");
const loginBtn = document.getElementById("loginBtn");

const initBtn = document.getElementById("initSlots");
const refreshBtn = document.getElementById("refresh");
const resetBtn = document.getElementById("resetAll");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");

const slotStatus = document.getElementById("slotStatus");   // 每時段人數
const slotPeople = document.getElementById("slotPeople");   // 每時段報名者名單
const reservationList = document.getElementById("reservationList"); // 全部清單

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

function requireLogin() {
  adminPanel.classList.add("hidden");
  loginPanel.classList.remove("hidden");
}
function loginOk() {
  loginPanel.classList.add("hidden");
  adminPanel.classList.remove("hidden");
}

// Login handler
loginBtn.addEventListener("click", () => {
  if (passInput.value === ADMIN_PASSWORD) {
    loginOk();
    loadAll();
  } else {
    alert("密碼錯誤");
  }
});

// Render status: counts per slot
function renderStatus() {
  slotStatus.innerHTML = "";
  const data = lsGet();
  for (const d of DATES) {
    const title = document.createElement("h3");
    title.textContent = `日期 ${d}`;
    slotStatus.appendChild(title);
    for (const h of HOURS) {
      const key = fmtHour(h);
      const s = data.slots[d][key];
      const left = Math.max(0, (s.capacity ?? DEFAULT_CAPACITY) - (s.count ?? 0));
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `<div>${key}</div><div class="badge">${s.count}/${s.capacity}（剩 ${left}）</div>`;
      slotStatus.appendChild(row);
    }
  }
}

// Render people per slot (grouped)
function renderPeopleBySlot() {
  slotPeople.innerHTML = "";
  const data = lsGet();
  for (const d of DATES) {
    const h2 = document.createElement("h3");
    h2.textContent = `日期 ${d}`;
    slotPeople.appendChild(h2);

    for (const h of HOURS) {
      const key = fmtHour(h);
      const group = data.reservations.filter(r => r.date === d && r.slot === key);
      const wrap = document.createElement("div");
      wrap.className = "row";
      const names = group.length ? group.map(r => `${r.name}${r.email ? " <" + r.email + ">" : ""}`).join("、") : "（無）";
      wrap.innerHTML = `<div>${key}</div><div style="text-align:right;">${names}</div>`;
      slotPeople.appendChild(wrap);
    }
  }
}

// Render full reservation list
function renderReservations() {
  reservationList.innerHTML = "";
  const data = lsGet();
  if (!data.reservations.length) {
    reservationList.innerHTML = "<div class='row'>尚無資料</div>";
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

function loadAll() {
  ensureInitialized();
  renderStatus();
  renderPeopleBySlot();
  renderReservations();
}

// Buttons
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

refreshBtn.addEventListener("click", loadAll);
resetBtn.addEventListener("click", () => {
  if (!confirm("⚠️ 將清空此瀏覽器所有預約與時段資料。確定？")) return;
  localStorage.removeItem("bookingData");
  ensureInitialized();
  loadAll();
});

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

// Start
requireLogin();
