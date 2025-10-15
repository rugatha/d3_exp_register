# 預約系統（無後端版 / 多席次勾選）

- 使用者頁：`index.html`（不含後台連結）
- 後台頁：`admin.html`（密碼 `admin123`，可在 `admin.js` 更改）
- 可一次勾選多個席位、跨時段、跨日期後「一次送出」
- 主色：`#445f56`

## 資料結構（localStorage: bookingData）
```jsonc
{
  "slots": {
    "A": { "13:00": { "capacity": 3, "seats": [ { "name": "...", "email": "...", "createdAt": "..." }, null, ... ] }, ... },
    "B": { ... }
  },
  "reservations": [
    { "name":"...", "email":"...", "createdAt":"...", "seats":[ { "date":"A", "slot":"13:00", "seatIndex":0 }, ... ] }
  ]
}
```

## GitHub Pages
1. 建公開 repo，上傳所有檔案到根目錄。
2. Settings → Pages → Source: Deploy from a branch → main / (root)
3. 前台：`https://<帳號>.github.io/<repo>/`
4. 後台：`https://<帳號>.github.io/<repo>/admin.html`（需密碼）
