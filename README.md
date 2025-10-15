# 預約系統（無後端版 / 使用者頁 + 後台頁）

- 使用者頁：`index.html`（不含任何後台連結）
- 後台頁：`admin.html`（密碼：`admin123`，請在 `admin.js` 更改）
- 主色：`#445f56`

## 功能
- 日期：A / B
- 時段：13:00、14:00、15:00、16:00、17:00（每時段顯示容量 3；此無後端版不強制限制）
- 儲存：localStorage（僅本機瀏覽器）

## 後台檢視
- 各時段報名人數（A/B × 5 個時段）
- 各時段報名者清單（姓名＋Email）
- 全部報名清單（新到舊）
- 初始化、清空、匯出/匯入 JSON

## GitHub Pages
1. 建公開 repo，上傳所有檔案到根目錄。
2. Settings → Pages → Source: Deploy from a branch → main / (root)
3. 前台：`https://<帳號>.github.io/<repo>/`
4. 後台：`https://<帳號>.github.io/<repo>/admin.html`（需密碼）
