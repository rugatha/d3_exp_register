// 無後端版：使用 localStorage 當資料來源（僅限本機瀏覽器，無多人同步）
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
  const raw = localStorage.getItem("bookingData");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
function lsSet(data) { localStorage.setItem("bookingData", JSON.stringify(data)); }

// 初始化資料結構（若不存在）
function ensureInitialized() {
  let data = lsGet();
  if (!data) {
    data = { slots: {}, reservations: [] };
  }
  if (!data.slots) data.slots = {};
  for (const d of DATES) {
    if (!data.slots[d]) data.slots[d] = {};
    for (const h of HOURS) {
      const key = fmtHour(h);
      if (!data.slots[d][key]) {
        data.slots[d][key] = { capacity: DEFAULT_CAPACITY, count: 0 };
      }
    }
  }
  if (!Array.isArray(data.reservations)) data.reservations = [];
  lsSet(data);
}

function getSlot(date, hour) {
  const data = lsGet();
  const key = fmtHour(hour);
  return data?.slots?.[date]?.[key] ?? { capacity: DEFAULT_CAPACITY, count: 0 };
}

function setSlot(date, hour, obj) {
  const data = lsGet() || {};
  data.slots = data.slots || {};
  data.slots[date] = data.slots[date] || {};
  data.slots[date][fmtHour(hour)] = obj;
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
      <button class="btn ${left>0? 'primary': ''}" data-hour="${h}">
        預約
      </button>
    `;
    slotsEl.appendChild(card);
  }
}

async function book(date, hour) {
  const name = (nameInput.value || "").trim();
  const email = (emailInput.value || "").trim();
  if (!name) { alert("請先填寫你的稱呼"); return; }

  const data = lsGet();
  const slotKey = fmtHour(hour);
  // 簡化版：不阻擋超賣；單純 +1 並新增一筆 reservation
  const slot = data.slots[date][slotKey];
  slot.count = (slot.count ?? 0) + 1;
  data.slots[date][slotKey] = slot;

  data.reservations.unshift({
    date,
    slot: slotKey,
    name,
    email: email || null,
    createdAt: new Date().toISOString(),
  });

  lsSet(data);
  alert("預約成功！（無後端版：僅儲存在此瀏覽器）");
  await render(currentDate);
}

// 綁定
slotsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-hour]");
  if (!btn) return;
  const hour = Number(btn.dataset.hour);
  book(currentDate, hour);
});

tabs.forEach((tab) => {
  tab.addEventListener("click", async () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentDate = tab.dataset.date;
    await render(currentDate);
  });
});

// 啟動
ensureInitialized();
render(currentDate);
