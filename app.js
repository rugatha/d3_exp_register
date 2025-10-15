// 使用者頁（無後端 / localStorage / 數量下拉選單，多時段合併提交 / 使用 phone 欄位）
const DATES = ["12/13（六）", "12/14（日）"];
const HOURS = [13, 14, 15, 16, 17];
const DEFAULT_CAPACITY = 3;

const slotsEl = document.getElementById("slots");
const tabs = document.querySelectorAll(".tab");
const nameInput = document.getElementById("nameInput");
const phoneInput = document.getElementById("phoneInput");
const submitBtn = document.getElementById("submitSel");
const clearBtn = document.getElementById("clearSel");
const selCountEl = document.getElementById("selCount");

let currentDate = "12/13（六）";
let selectionQuantities = {}; // { "12/13（六）|13:00": 2, ... }

function fmtHour(h) { return `${h.toString().padStart(2, "0")}:00`; }
function keyOf(date, slotKey) { return `${date}|${slotKey}`; }
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
}

function computeTotalSelected() {
  return Object.values(selectionQuantities).reduce((a,b)=>a+(b||0), 0);
}

function makeSelect(max, current) {
  const opts = Array.from({length: max+1}, (_,i)=>`<option value="${i}" ${i===current?'selected':''}>${i}</option>`).join("");
  return `<select class="qty" data-type="qty">${opts}</select>`;
}

function render(date) {
  ensureInitialized();
  slotsEl.innerHTML = "";
  const data = lsGet();

  for (const h of HOURS) {
    const slotKey = fmtHour(h);
    const slotObj = data.slots[date][slotKey];
    const taken = slotObj.seats.filter(Boolean).length;
    const left = Math.max(0, (slotObj.capacity ?? DEFAULT_CAPACITY) - taken);

    const currentQty = selectionQuantities[keyOf(date, slotKey)] || 0;
    const selectHtml = makeSelect(left, currentQty);

    const card = document.createElement("div");
    card.className = "slot";
    card.innerHTML = `
      <h3>${slotKey}</h3>
      <div class="meta">已預約：${taken} / ${slotObj.capacity}（剩 ${left}）</div>
      <div class="controls">
        <label>我要報名 ${selectHtml} 位</label>
      </div>
    `;
    const selectEl = card.querySelector("select.qty");
    selectEl.dataset.date = date;
    selectEl.dataset.slot = slotKey;
    slotsEl.appendChild(card);
  }

  selCountEl.textContent = computeTotalSelected();
}

slotsEl.addEventListener("change", (e) => {
  const el = e.target.closest("select.qty[data-slot]");
  if (!el) return;
  const date = el.dataset.date;
  const slot = el.dataset.slot;
  const val = Math.max(0, Number(el.value || 0));
  selectionQuantities[keyOf(date, slot)] = val;
  selCountEl.textContent = computeTotalSelected();
});

clearBtn.addEventListener("click", () => {
  selectionQuantities = {};
  selCountEl.textContent = "0";
  render(currentDate);
});

submitBtn.addEventListener("click", () => {
  const name = (nameInput.value || "").trim();
  const phone = (phoneInput.value || "").trim();
  if (!name || !phone) { alert("請填寫 冒險者名稱 與 手機號碼"); return; }
  const total = computeTotalSelected();
  if (total <= 0) { alert("尚未選擇任何名額"); return; }

  const data = lsGet();
  const bookedSeats = [];

  for (const [k, qty] of Object.entries(selectionQuantities)) {
    if (!qty) continue;
    const [date, slot] = k.split("|");
    const slotObj = data.slots[date][slot];
    let remaining = qty;
    for (let i=0; i<slotObj.seats.length && remaining>0; i++) {
      if (!slotObj.seats[i]) {
        slotObj.seats[i] = { name, phone: phone || null, createdAt: new Date().toISOString() };
        bookedSeats.push({ date, slot, seatIndex: i });
        remaining--;
      }
    }
  }

  if (bookedSeats.length === 0) {
    alert("沒有可用的名額（可能已被佔滿）。");
    return;
  }

  data.reservations.unshift({
    name, phone: phone || null, createdAt: new Date().toISOString(),
    seats: bookedSeats
  });
  lsSet(data);

  alert(`已報名 ${bookedSeats.length} 個名額！`);
  selectionQuantities = {};
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
