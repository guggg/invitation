# Google Apps Script RSVP Setup

1. 建立 Google Sheet。
2. 開啟 `Extensions > Apps Script`。
3. 將 `apps-script/Code.gs` 的內容貼到 Apps Script。
4. Deploy 選 `New deployment`，類型選 `Web app`。
5. Execute as 選 `Me`。
6. Who has access 選 `Anyone`。
7. 複製 Web App URL，填入 Vercel 環境變數：

```bash
NEXT_PUBLIC_RSVP_ENDPOINT=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

表單使用 `text/plain;charset=utf-8` 送出 JSON，Google Sheet 會以 append-only 方式新增每一筆 RSVP。
