// 後台檢視（無後端 / localStorage）— 手動移除報名
const DATES = ["12/13（六）", "12/14（日）"];
const HOURS = [13, 14, 15, 16, 17];
const DEFAULT_CAPACITY = 3;
const ADMIN_PASSWORD = "admin123"; // 頁面不顯示

const loginPanel = document.getElementById("loginPanel");
const adminPanel = document.getElementById("adminPanel");
const passInput = document.getElementById("adminPass");
const loginBtn = document.getElementById("loginBtn");

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

// Remove a single seat (by date, slot, seatIndex)
function removeSeat(date, slot, seatIndex) {
  const data = lsGet();
  const slotObj = data.slots[date][slot];
  if (!slotObj || !slotObj.seats[seatIndex]) return false;

  const seat = slotObj.seats[seatIndex];
  slotObj.seats[seatIndex] = null;

  // also prune from reservations
  for (let i = data.reservations.length - 1; i >= 0; i--) {
    const r = data.reservations[i];
    const before = r.seats.length;
    r.seats = r.seats.filter(s => !(s.date === date && s.slot === slot && s.seatIndex === seatIndex));
    if (r.seats.length === 0) {
      data.reservations.splice(i, 1);
    } else if (r.seats.length !== before) {
      // keep reservation but updated
      data.reservations[i] = r;
    }
  }

  lsSet(data);
  return seat;
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
      const row = document.createElement("div");
      row.className = "row";

      const entries = s.seats.map((p, idx) => {
        if (!p) return `#${idx+1}: （空）`;
        const rmId = `rm_${d}_${key}_${idx}`.replace(/[^\\w]/g,'');
        return `#${idx+1}: <span class="name-email">${p.name}${p.email ? " &lt;"+p.email+"&gt;" : ""}</span> <button class="btn danger" data-date="${d}" data-slot="${key}" data-idx="${idx}">移除</button>`;
      }).join("　");

      row.innerHTML = `<div style="flex:1">${key}</div><div style="text-align:right; flex:3">${entries}</div>`;
      slotPeople.appendChild(row);
    }
  }

  // bind remove buttons
  slotPeople.querySelectorAll("button.btn.danger").forEach(btn => {
    btn.addEventListener("click", () => {
      const date = btn.dataset.date;
      const slot = btn.dataset.slot;
      const idx = Number(btn.dataset.idx);
      if (confirm(`確認移除 ${date} ${slot} 的 #${idx+1} 名額？`)) {
        const removed = removeSeat(date, slot, idx);
        if (removed) {
          alert("已移除。");
          loadAll();
        } else {
          alert("移除失敗或該席位為空。");
        }
      }
    });
  });
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
    const seats = (r.seats || []).map(s => `${s.date} ${s.slot} #${s.seatIndex+1} <button class="btn danger sm" data-date="${s.date}" data-slot="${s.slot}" data-idx="${s.seatIndex}">移除</button>`).join("　");
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `<div>${r.name} ${r.email ? `&lt;${r.email}&gt;` : ""}</div><div style="flex:1;text-align:right;">${seats || "(無席位)"}</div><div class="badge">${when}</div>`;
    reservationList.appendChild(row);
  }

  // bind remove buttons in reservation list
  reservationList.querySelectorAll("button.btn.danger").forEach(btn => {
    btn.addEventListener("click", () => {
      const date = btn.dataset.date;
      const slot = btn.dataset.slot;
      const idx = Number(btn.dataset.idx);
      if (confirm(`確認移除 ${date} ${slot} 的 #${idx+1} 名額？`)) {
        const removed = removeSeat(date, slot, idx);
        if (removed) {
          alert("已移除。");
          loadAll();
        } else {
          alert("移除失敗或該席位為空。");
        }
      }
    });
  });
}

function loadAll() {
  ensureInitialized();
  renderStatus();
  renderPeopleBySlot();
  renderReservations();
}

// Start
function start() {
  requireLogin();
}
start();
