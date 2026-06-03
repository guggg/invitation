# Google Apps Script RSVP Setup

1. 建立 Google Sheet。
2. 開啟 `Extensions > Apps Script`。
3. 將 `apps-script/Code.gs` 的內容貼到 Apps Script。
4. 在 Apps Script 的 `Project Settings > Script Properties` 新增 `RSVP_TOKEN`，填入一組不容易猜到的字串。
5. Deploy 選 `New deployment`，類型選 `Web app`。
6. Execute as 選 `Me`。
7. Who has access 選 `Anyone`。
8. 複製 Web App URL，填入部署環境變數：

```bash
NEXT_PUBLIC_RSVP_ENDPOINT=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
NEXT_PUBLIC_FAMILY_RSVP_ENDPOINT=https://script.google.com/macros/s/YOUR_FAMILY_DEPLOYMENT_ID/exec
NEXT_PUBLIC_RSVP_TOKEN=同一組 RSVP_TOKEN
```

表單使用 `text/plain;charset=utf-8` 送出 JSON，Google Sheet 會以 append-only 方式新增每一筆 RSVP。Apps Script 會驗證 `RSVP_TOKEN`、手機格式、出席人數、兒童座椅、接駁車人數，並在寫入前避免公式字元被當成試算表公式執行。

## Google Drive 照片上傳 Setup

1. 建立一個 Google Drive 資料夾，用來收賓客上傳照片。
2. 開啟一個新的 Apps Script 專案。
3. 將 `apps-script/PhotoUpload.gs` 的內容貼到 Apps Script。
4. 在 Apps Script 的 `Project Settings > Script Properties` 新增：

```text
PHOTO_UPLOAD_FOLDER_ID=Google Drive 資料夾 ID
PHOTO_UPLOAD_TOKEN=同一組照片上傳 token
```

5. Deploy 選 `New deployment`，類型選 `Web app`。
6. Execute as 選 `Me`。
7. Who has access 選 `Anyone`。
8. 複製 Web App URL，填入部署環境變數：

```bash
NEXT_PUBLIC_PHOTO_UPLOAD_ENDPOINT=https://script.google.com/macros/s/YOUR_PHOTO_UPLOAD_DEPLOYMENT_ID/exec
NEXT_PUBLIC_PHOTO_UPLOAD_TOKEN=同一組 PHOTO_UPLOAD_TOKEN
```

照片上傳會使用 `text/plain;charset=utf-8` 送出 JSON。Apps Script 會驗證 token、手機格式、照片 MIME type 與 小於 10MB 大小限制，並用 `姓名_手機號碼.副檔名` 存進 Drive。若同一組姓名與手機再次上傳，舊檔案會先移到垃圾桶，Drive 內保留最新檔案。
