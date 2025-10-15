# 預約系統（無後端版 / 數量選擇）

- 使用者頁：`index.html`（不顯示任何報名者姓名）
- 後台頁：`admin.html`（頁面不顯示密碼提示；可在 `admin.js` 修改 `ADMIN_PASSWORD`）
- 主視覺底色：`#445f56`

## 特色
- A / B 兩日；時段：13:00、14:00、15:00、16:00、17:00
- 使用者在**每個時段輸入要報名的人數**（0~剩餘名額），可跨時段一次送出。
- 純前端 / localStorage，無多人同步。

## 部署（GitHub Pages）
1. 建公開 repo，上傳檔案到根目錄。
2. Settings → Pages → Source: Deploy from a branch → main / (root)
3. 前台：`https://<帳號>.github.io/<repo>/`
4. 後台：`https://<帳號>.github.io/<repo>/admin.html`
