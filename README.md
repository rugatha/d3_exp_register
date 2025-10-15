# Rugatha D&D 跑團體驗活動報名（無後端 / v6）

前台（index.html）
- 頂部置中插入活動圖片。
- A/B 改為 12/13（六）與 12/14（日）。
- 各時段改為上下排列。
- 欄位改為「冒險者名稱」「手機號碼」（皆必填）。
- 以下拉選單選擇各時段報名數量。

後台（moderator.html）
- 標題置中「報名清單」。無頂部工具列。
- 「各時段報名人數」以進度條 + 數字呈現。
- 「各時段報名者」區列出姓名與手機，並提供「移除」按鈕（僅釋放席位；**保留**在「所有報名」紀錄中）。
- 移除「日期」字樣，只顯示如「12/13（六）」。
- 「所有報名」標題不含括號說明。

## 部署（GitHub Pages）
1. 建公開 repo，上傳這些檔案到根目錄。
2. Settings → Pages → Source: Deploy from a branch → main / (root)
3. 前台：`https://<帳號>.github.io/<repo>/`
4. 後台：`https://<帳號>.github.io/<repo>/moderator.html`


> 這版移除了密碼保護，直接以 `moderator.html` 作為主持檢視頁。