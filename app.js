// 使用者頁（無後端 / localStorage / 多席次勾選與跨時段）
const DATES = ["A", "B"];
const HOURS = [13, 14, 15, 16, 17];
const DEFAULT_CAPACITY = 3;

const slotsEl = document.getElementById("slots");
const tabs = document.querySelectorAll(".tab");
const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const submitBtn = document.getElementById("submitSel");
const clearBtn = document.getElementById("clearSel");
const selCountEl = document.getElementById("selCount");

let currentDate = "A";
// selection: array of {date, slot("HH:00"), seatIndex}
let selection = [];

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
      // seats: fixed-length array (capacity) of null or {name,email,createdAt}
      if (!data.slots[d][key]) data.slots[d][key] = { capacity: DEFAULT_CAPACITY, seats: Array(DEFAULT_CAPACITY).fill(null) };
      // migrate old count-based schema if exists
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

// Helpers
function isSeatTaken(slotObj, idx) { return !!slotObj.seats[idx]; }
function toggleSelection(date, slotKey, idx, checked) {
  const key = `${date}|${slotKey}|${idx}`;
  const exists = selection.findIndex(s => `${s.date}|${s.slot}|${s.seatIndex}` === key);
  if (checked && exists === -1) {
    selection.push({ date, slot: slotKey, seatIndex: idx });
  } else if (!checked && exists !== -1) {
    selection.splice(exists, 1);
  }
  selCountEl.textContent = selection.length;
}

function isSelected(date, slotKey, idx) {
  return selection.some(s => s.date === date && s.slot === slotKey && s.seatIndex === idx);
}

function render(date) {
  ensureInitialized();
  slotsEl.innerHTML = "";
  const data = lsGet();
  for (const h of HOURS) {
    const slotKey = fmtHour(h);
    const s = data.slots[date][slotKey];
    const taken = s.seats.filter(Boolean).length;
    const left = Math.max(0, (s.capacity ?? DEFAULT_CAPACITY) - taken);

    const card = document.createElement("div");
    card.className = "slot";
    const seatsHtml = s.seats.map((seat, idx) => {
      const id = `ck_${date}_${slotKey}_${idx}`.replace(/[:]/g,"");
      const disabled = seat ? "disabled" : "";
      const checked = isSelected(date, slotKey, idx) ? "checked" : "";
      const label = seat ? `${idx+1}（已被 ${seat.name}）` : `${idx+1}`;
      return `<label class="seat"><input type="checkbox" id="${id}" data-date="${date}" data-slot="${slotKey}" data-idx="${idx}" ${disabled} ${checked}/>位 ${label}</label>`;
    }).join("");

    card.innerHTML = `
      <h3>${slotKey}</h3>
      <div class="meta">已預約：${taken} / ${s.capacity}（剩 ${left}）</div>
      <div class="seats">${seatsHtml}</div>
    `;
    slotsEl.appendChild(card);
  }
}

// Event: seat selection
slotsEl.addEventListener("change", (e) => {
  const ck = e.target.closest("input[type='checkbox'][data-slot]");
  if (!ck) return;
  const date = ck.dataset.date;
  const slot = ck.dataset.slot;
  const idx = Number(ck.dataset.idx);
  toggleSelection(date, slot, idx, ck.checked);
});

// Clear selection
clearBtn.addEventListener("click", () => {
  selection = [];
  selCountEl.textContent = "0";
  render(currentDate);
});

// Submit selection
submitBtn.addEventListener("click", () => {
  const name = (nameInput.value || "").trim();
  const email = (emailInput.value || "").trim();
  if (!name) { alert("請先填寫你的稱呼"); return; }
  if (selection.length === 0) { alert("尚未選擇任何席位"); return; }

  const data = lsGet();
  // assign seats
  for (const sel of selection) {
    const slotObj = data.slots[sel.date][sel.slot];
    if (!slotObj.seats[sel.seatIndex]) {
      slotObj.seats[sel.seatIndex] = { name, email: email || null, createdAt: new Date().toISOString() };
    }
  }
  // add a consolidated reservation record
  data.reservations.unshift({
    name, email: email || null, createdAt: new Date().toISOString(),
    seats: selection.map(s => ({ date: s.date, slot: s.slot, seatIndex: s.seatIndex }))
  });
  lsSet(data);

  alert(`已報名 ${selection.length} 個位置！`);
  selection = [];
  selCountEl.textContent = "0";
  render(currentDate);
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentDate = tab.dataset.date;
    render(currentDate);
  });
});

// Start
ensureInitialized();
render(currentDate);
