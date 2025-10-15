# Rugatha D&D 跑團體驗活動報名（無後端 / v5）

- 使用者頁：`index.html`（標題置中、12/13（六）與 12/14（日）；各時段以**下拉選單**選擇數量）
- 後台頁：`admin.html`（標題置中為「報名清單」，移除頂部工具列，支援**手動移除席位**；各時段顯示名稱與 Email）
- 主視覺：整體底色 `#445f56`

## 部署（GitHub Pages）
1. 建公開 repo，上傳這些檔案到根目錄。
2. Settings → Pages → Source: Deploy from a branch → main / (root)
3. 前台：`https://<帳號>.github.io/<repo>/`
4. 後台：`https://<帳號>.github.io/<repo>/admin.html`（登入密碼請在 `admin.js` 的 `ADMIN_PASSWORD` 調整）
