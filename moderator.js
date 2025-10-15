// moderator v7g — clean build (no login).
// Renders status, people, and reservations directly.

const DATES = ["12/13（六）", "12/14（日）"];
const HOURS = [13, 14, 15, 16, 17];
const DEFAULT_CAPACITY = 3;

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
        for (let i = 0; i < Math.min(count, cap); i++) seats[i] = { name: "(migrated)", phone: null, createdAt: new Date().toISOString() };
        data.slots[d][key] = { capacity: cap, seats };
      }
    }
  }
  if (!Array.isArray(data.reservations)) data.reservations = [];
  lsSet(data);
  return data;
}

function renderStatus() {
  slotStatus.innerHTML = "";
  const data = ensureInitialized();
  for (const d of DATES) {
    const title = document.createElement("h3");
    title.textContent = d;
    slotStatus.appendChild(title);
    for (const h of HOURS) {
      const key = fmtHour(h);
      const s = data.slots[d][key];
      const taken = s.seats.filter(Boolean).length;
      const left = (s.capacity ?? DEFAULT_CAPACITY) - taken;
      const pct = Math.round((taken / s.capacity) * 100);
      const row = document.createElement("div");
      row.className = "row progress";
      row.dataset.date = d; row.dataset.slot = key;
      row.style.setProperty("--pct", pct + "%");
      row.innerHTML = `<div style="min-width:70px; z-index:1;">${key}</div>
        <div style="flex:1; display:flex; justify-content:flex-end; gap:10px; z-index:1;">
          <span class="badge">${taken}/${s.capacity}${left>=0?`（剩 ${left}）`:"（已滿）"}</span>
        </div>`;
      slotStatus.appendChild(row);
    }
  }
}

function removeSeat(date, slot, seatIndex) {
  const data = ensureInitialized();
  const slotObj = data.slots[date][slot];
  if (!slotObj || !slotObj.seats[seatIndex]) return false;
  slotObj.seats[seatIndex] = null; // free seat only; keep reservation history
  lsSet(data);
  return true;
}

function renderPeopleBySlot() {
  slotPeople.innerHTML = "";
  const data = ensureInitialized();
  for (const d of DATES) {
    const t = document.createElement("h3");
    t.textContent = d;
    slotPeople.appendChild(t);
    for (const h of HOURS) {
      const key = fmtHour(h);
      const s = data.slots[d][key];
      const row = document.createElement("div");
      row.className = "row";
      row.dataset.date = d; row.dataset.slot = key;
      const left = document.createElement("div");
      left.style.minWidth = "70px"; left.textContent = key;
      const right = document.createElement("div");
      right.style.flex = "1"; right.style.textAlign = "right";
      s.seats.forEach((p, idx) => {
        const line = document.createElement("div");
        line.className = "seatline";
        if (!p) {
          line.textContent = `#${idx+1}: （空）`;
        } else {
          line.innerHTML = `#${idx+1}: <span class="name-phone">${p.name}${p.phone ? " &lt;"+p.phone+"&gt;" : ""}</span> <button class="btn danger" data-date="${d}" data-slot="${key}" data-idx="${idx}">移除</button>`;
        }
        right.appendChild(line);
      });
      row.appendChild(left); row.appendChild(right);
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
        const ok = removeSeat(date, slot, idx);
        if (ok) {
          alert("已移除（保留在所有報名紀錄中）。");
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
  const data = ensureInitialized();
  if (!data.reservations.length) {
    reservationList.innerHTML = "<div class='row'>尚無資料</div>";
    return;
  }
  for (const r of data.reservations) {
    const when = new Date(r.createdAt).toLocaleString();
    const seats = (r.seats || []).map(s => `${s.date} ${s.slot} #${s.seatIndex+1}`).join("　");
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `<div>${r.name} ${r.phone ? `&lt;${r.phone}&gt;` : ""}</div><div style="flex:1;text-align:right;">${seats || "(無席位)"}</div><div class="badge">${when}</div>`;
    reservationList.appendChild(row);
  }
}

function loadAll() {
  try {
    renderStatus();
    renderPeopleBySlot();
    renderReservations();
  } catch (e) {
    console.error("moderator load error:", e);
    alert("主持頁面載入時發生錯誤，請開啟 Console 查看詳細。");
  }
}

document.addEventListener("DOMContentLoaded", ()=>{ loadAll(); syncRowHeights(); });

function syncRowHeights() {
  // For each date+slot pair, set both rows to same height
  const leftRows = slotStatus.querySelectorAll('.row.progress');
  leftRows.forEach(lr => {
    const d = lr.dataset.date, s = lr.dataset.slot;
    const rr = slotPeople.querySelector(`.row[data-date="${d}"][data-slot="${s}"]`);
    if (rr) {
      const h = Math.max(lr.getBoundingClientRect().height, rr.getBoundingClientRect().height);
      lr.style.minHeight = rr.style.minHeight = h + 'px';
    }
  });
}

function clearReservationsOnly() {
  let data;
  try { data = JSON.parse(localStorage.getItem('bookingData')) || {slots:{}, reservations:[]}; } catch { data = {slots:{}, reservations:[]}; }
  data.reservations = [];
  localStorage.setItem('bookingData', JSON.stringify(data));
  renderReservations();
}


// Hook clear logs button
document.addEventListener('DOMContentLoaded', ()=>{
  const btn = document.getElementById('clearLogs');
  if (btn) btn.addEventListener('click', ()=>{
    if (confirm('確定要清空所有報名紀錄嗎？（不影響已佔用席位）')) {
      clearReservationsOnly();
    }
  });
});

// Re-sync heights after redraws
const origLoadAll = loadAll;
loadAll = function(){ origLoadAll(); syncRowHeights(); };
