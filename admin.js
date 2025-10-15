// 後台檢視（無後端 / localStorage）
const DATES = ["A", "B"];
const HOURS = [13, 14, 15, 16, 17];
const DEFAULT_CAPACITY = 3;
const ADMIN_PASSWORD = "admin123"; // 可在此更改；頁面不顯示密碼

const loginPanel = document.getElementById("loginPanel");
const adminPanel = document.getElementById("adminPanel");
const passInput = document.getElementById("adminPass");
const loginBtn = document.getElementById("loginBtn");

const initBtn = document.getElementById("initSlots");
const refreshBtn = document.getElementById("refresh");
const resetBtn = document.getElementById("resetAll");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");

const slotStatus = document.getElementById("slotStatus");
const slotPeople = document.getElementById("slotPeople");
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
      if (!data.slots[d][key]) data.slots[d][key] = { capacity: DEFAULT_CAPACITY, seats: Array(DEFAULT_CAPACITY).fill(null) };
      if (data.slots[d][key].count !== undefined) {
        const count = data.slots[d][key].count;
        const cap = data.slots[d][key].capacity ?? DEFAULT_CAPACITY;
        const seats = Array(cap).fill(null);
        for (let i = 0; i < Math.min(count, cap); i++) seats[i] = { name: "(migrated)", email: null, createdAt: new Date().toISOString() };
        data.slots[d][key] = { capacity: cap, seats };
      }
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

loginBtn.addEventListener("click", () => {
  if (passInput.value === ADMIN_PASSWORD) {
    loginOk();
    loadAll();
  } else {
    alert("密碼錯誤");
  }
});

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
      const taken = s.seats.filter(Boolean).length;
      const left = (s.capacity ?? DEFAULT_CAPACITY) - taken;
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `<div>${key}</div><div class="badge">${taken}/${s.capacity}（剩 ${left}）</div>`;
      slotStatus.appendChild(row);
    }
  }
}

function renderPeopleBySlot() {
  slotPeople.innerHTML = "";
  const data = lsGet();
  for (const d of DATES) {
    const t = document.createElement("h3");
    t.textContent = `日期 ${d}`;
    slotPeople.appendChild(t);
    for (const h of HOURS) {
      const key = fmtHour(h);
      const s = data.slots[d][key];
      const names = s.seats.map((p, idx) => p ? `#${idx+1}: ${p.name}${p.email ? " <"+p.email+">" : ""}` : `#${idx+1}: （空）`).join("、 ");
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `<div>${key}</div><div style="text-align:right;">${names}</div>`;
      slotPeople.appendChild(row);
    }
  }
}

function renderReservations() {
  reservationList.innerHTML = "";
  const data = lsGet();
  if (!data.reservations.length) {
    reservationList.innerHTML = "<div class='row'>尚無資料</div>";
    return;
  }
  for (const r of data.reservations) {
    const when = new Date(r.createdAt).toLocaleString();
    const seats = (r.seats || []).map(s => `${s.date}日 ${s.slot} 位#${s.seatIndex+1}`).join("、 ");
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `<div>${r.name} ${r.email ? `&lt;${r.email}&gt;` : ""}</div><div>${seats || "(無席位資訊)"}</div><div class="badge">${when}</div>`;
    reservationList.appendChild(row);
  }
}

function loadAll() {
  ensureInitialized();
  renderStatus();
  renderPeopleBySlot();
  renderReservations();
}

initBtn.addEventListener("click", () => {
  if (!confirm("建立/覆蓋 A/B 日 13:00~17:00 的時段，容量=3，並清空所有席位。確定？")) return;
  const data = lsGet() || { slots: {}, reservations: [] };
  data.slots = data.slots || {};
  for (const d of DATES) {
    data.slots[d] = data.slots[d] || {};
    for (const h of HOURS) {
      data.slots[d][fmtHour(h)] = { capacity: DEFAULT_CAPACITY, seats: Array(DEFAULT_CAPACITY).fill(null) };
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
