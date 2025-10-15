# 預約系統（無後端版 / GitHub Pages 可用）

這是一個 **純前端、無任何雲端後端** 的最小可用預約系統：
- 日期：**A 日**、**B 日**
- 時段：**13:00、14:00、15:00、16:00、17:00**
- 每時段名額：顯示 `3`（**不強制限制**，可重複預約）
- 資料儲存：**瀏覽器 localStorage**（只存在使用者自己的瀏覽器）。

> 適合：個人展示、Demo、線下單機使用。多人同時使用**不會同步**、不同裝置互相看不到彼此資料。

---

## 檔案結構
```
index.html   # 前台：選 A/B 日、查看時段名額、建立預約（寫入本機）
admin.html   # 管理：初始化、查看統計、匯出/匯入 JSON、清空本機資料
styles.css   # 樣式
app.js       # 前台邏輯（localStorage）
admin.js     # 後台邏輯（localStorage）
README.md
```

---

## 部署（GitHub Pages）
1. 建立 GitHub 公開 repo（例如 `booking-no-backend`）。  
2. 上傳以上檔案到 repo 根目錄。  
3. Repo → **Settings** → **Pages**：
   - Source: **Deploy from a branch**
   - Branch: **main** / Folder: **/**(root)** → Save
4. 等待 30–90 秒，打開提供的 URL：
   - `https://<你的帳號>.github.io/booking-no-backend/`（前台）
   - `https://<你的帳號>.github.io/booking-no-backend/admin.html`（管理）

---

## 使用方式
- **前台**：輸入名稱（必填）、Email（選填），選擇 A/B 分頁後，點各時段的「預約」按鈕即可，在此瀏覽器裡會顯示已預約/剩餘名額（純展示）。
- **管理**：
  - 「初始化」：建立/覆蓋 A/B 日 13:00~17:00 的時段，容量=3，計數歸零。
  - 「重新整理」：重繪統計與清單。
  - 「清空所有資料」：刪除本機 localStorage 紀錄。
  - 「匯出 / 匯入 JSON」：在不同裝置間手動搬移資料（需手動上傳到對方裝置）。

---

## 限制
- **無多人同步**、**無真實上限控制**、**無使用者帳號**。
- 更改瀏覽器或清除網站資料即會遺失（除非使用匯出/匯入）。

---

## 想升級？
- 接雲端（例如 Firebase、Supabase、Appwrite）：即可多人同步、限制名額、防超賣。
- 加入表單驗證（email 必填）、避免重複預約、加入取消機制等。
