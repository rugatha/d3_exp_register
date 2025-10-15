// 使用者頁（無後端 / localStorage）
const DATES = ["A", "B"];
const HOURS = [13, 14, 15, 16, 17];
const DEFAULT_CAPACITY = 3;

const slotsEl = document.getElementById("slots");
const tabs = document.querySelectorAll(".tab");
const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");

let currentDate = "A";

function fmtHour(h) { return `${h.toString().padStart(2, "0")}:00`; }
function lsGet() {
  try { return JSON.parse(localStorage.getItem("bookingData")); } catch { return null; }
}
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

async function render(date) {
  ensureInitialized();
  slotsEl.innerHTML = "";
  const data = lsGet();
  for (const h of HOURS) {
    const s = data.slots[date][fmtHour(h)];
    const left = Math.max(0, (s.capacity ?? DEFAULT_CAPACITY) - (s.count ?? 0));
    const card = document.createElement("div");
    card.className = "slot";
    card.innerHTML = `
      <h3>${fmtHour(h)}</h3>
      <div class="meta">已預約：${s.count} / ${s.capacity}（剩 ${left}）</div>
      <button class="btn ${left>0? 'primary': ''}" data-hour="${h}">預約</button>
    `;
    slotsEl.appendChild(card);
  }
}

function book(date, hour) {
  const name = (nameInput.value || "").trim();
  const email = (emailInput.value || "").trim();
  if (!name) { alert("請先填寫你的稱呼"); return; }

  const data = lsGet();
  const slotKey = fmtHour(hour);

  // 不限制上限：單純 +1 並新增一筆
  const slot = data.slots[date][slotKey];
  slot.count = (slot.count ?? 0) + 1;
  data.slots[date][slotKey] = slot;

  data.reservations.unshift({
    date, slot: slotKey, name, email: email || null, createdAt: new Date().toISOString(),
  });
  lsSet(data);
  alert("預約已送出（僅儲存在此瀏覽器）。");
  render(currentDate);
}

// 綁定
slotsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-hour]");
  if (!btn) return;
  const hour = Number(btn.dataset.hour);
  book(currentDate, hour);
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentDate = tab.dataset.date;
    render(currentDate);
  });
});

// 啟動
ensureInitialized();
render(currentDate);
