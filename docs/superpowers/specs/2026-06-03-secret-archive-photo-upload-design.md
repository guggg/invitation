# Secret Archive Photo Upload Design

## Objective

Add a photo-upload section where each guest can submit one representative image for wedding-related use. The feature must feel like a polished interactive experience, not a plain upload form. It should not disclose the eventual use for wedding favors, but it must clearly tell guests that the submitted photo may be seen by other wedding guests.

The selected concept is **「秘密收藏室」封蠟信封**.

## Scope

This feature applies to both invitation experiences:

- Friends page: full interactive "secret archive" experience with a sealed-envelope visual, staged reveal, image preview, consent, and completion animation.
- Family page: simplified, readable archive-card version with minimal animation and larger controls.

Each guest may submit one image. If the same name and phone number submit again, the latest upload replaces the previous file without warning before upload. The page copy states that duplicate submissions with the same name and phone will use the latest photo.

## Placement

Friends page placement:

- Add the section after the existing photo/gallery section and before shuttle/RSVP.
- Add a section rail item with label `密件`.
- The section should feel like a transition from viewing the couple's photos to leaving one representative image of oneself.

Family page placement:

- Add a simplified block immediately before the RSVP form.
- Keep it task-oriented and avoid heavy scroll effects.

## Visual Direction

Friends page:

- Dark, quiet archive-room mood with warm paper, wax seal, subtle gold highlights, and restrained blur/glow.
- A sealed envelope appears first, not the form.
- The envelope opens into a letter/photo frame that contains the upload interface.
- The selected image slides into the letter frame as a preview.
- On success, the envelope closes or seals again with a "collected" state.

Family page:

- Cream paper card with burgundy/gold accents matching the family page.
- Clear title, simple preview frame, large file button, large consent checkbox, large submit button.
- No complex animation beyond a small preview fade.

## Friends Interaction Sequence

1. Section enters viewport: archive-room background fades in.
2. Headline appears: `交給我們一張代表你的密件`.
3. Sealed envelope slides or floats into the center.
4. User scrolls slightly or clicks the envelope: envelope opens.
5. The upload frame, name field, phone field, consent checkbox, and rules appear as letter contents.
6. User chooses an image: image preview slides into the letter frame.
7. User submits: submit button shows uploading state.
8. Success: envelope seals and shows `密件已收藏`.
9. After success, localStorage records submission. Reloading on the same browser shows the completed state and a discreet re-upload affordance.

## Copy

Friends title:

> 交給我們一張代表你的密件

Friends body:

> 可以是你本人，也可以是寵物、小物、icon，或任何會讓我們想到你的畫面。

Visibility reminder:

> 這張照片之後可能會在婚禮相關內容中被其他賓客看見；如果不想露臉，請選擇不含人臉的照片。

Repeat upload rule:

> 一人限上傳一張。若使用相同姓名與電話再次上傳，系統會以最後一次收到的照片為準。

Consent checkbox:

> 我同意提供這張照片給新人於婚禮相關內容中使用，並理解照片可能被其他賓客看見。

Success state:

> 密件已收藏
>
> 我們收到你的照片了。若你稍後用相同姓名與電話重新上傳，系統會以最後一次收到的照片為準。

Family copy can use the same content, simplified:

> 上傳一張代表您的照片
>
> 可以是本人、寵物、喜歡的小物，或任何能代表您的照片。這張照片之後可能會在婚禮相關內容中讓賓客一起看見。

## Upload Rules

Allowed file types:

- `image/jpeg`
- `image/png`
- `image/webp`
- `image/heic`
- `image/heif`

Default size limit:

- 8 MB per image.

Required fields:

- Name
- Taiwan mobile phone, normalized to `09xxxxxxxx`
- One image file
- Consent checked

Client-side validation:

- Reject non-image files before upload.
- Reject files over the size limit.
- Format phone input as `0912 345 678`.
- Disable submit until all required fields are valid.

Server-side validation in Apps Script:

- Verify upload token.
- Verify name and phone.
- Verify consent is `true`.
- Verify MIME type starts with `image/` and is in the allowed list.
- Verify `fileSizeBytes` is present and no larger than the configured limit.
- Sanitize filename.

## Data Flow

Use a dedicated photo upload endpoint, separate from RSVP:

```text
PhotoUploadSection
  -> POST text/plain JSON to NEXT_PUBLIC_PHOTO_UPLOAD_ENDPOINT
  -> Apps Script PhotoUpload.gs
  -> Google Drive folder from PHOTO_UPLOAD_FOLDER_ID
```

The client sends:

```json
{
  "token": "public shared upload token",
  "name": "王小明",
  "phone": "0912345678",
  "consent": true,
  "fileName": "original.jpg",
  "mimeType": "image/jpeg",
  "fileSizeBytes": 1234567,
  "dataBase64": "...",
  "submittedAt": "2026-06-03T00:00:00.000Z",
  "sourceRoute": "/"
}
```

The Apps Script responds:

```json
{ "ok": true, "fileName": "王小明_0912345678.jpg" }
```

On error:

```json
{ "ok": false, "error": "請選擇照片" }
```

The frontend must parse the JSON response. HTTP 200 with `{ "ok": false }` is treated as failure.

## Google Drive Storage

Implementation requires a Google Drive folder ID. If the user provides a folder URL, extract the ID during setup and store only the ID in Apps Script properties.

Apps Script properties:

- `PHOTO_UPLOAD_FOLDER_ID`
- `PHOTO_UPLOAD_TOKEN`

Frontend env:

- `NEXT_PUBLIC_PHOTO_UPLOAD_ENDPOINT`
- `NEXT_PUBLIC_PHOTO_UPLOAD_TOKEN`

Filename rule:

```text
{sanitizedName}_{normalizedPhone}.{extension}
```

Examples:

```text
王小明_0912345678.jpg
Yuan_0912345678.png
```

Overwrite behavior:

- Before saving a new file, Apps Script searches the target folder for files whose base name matches `{sanitizedName}_{normalizedPhone}` with any image extension.
- Matching files are moved to trash.
- The new file is created.
- The user is not warned at upload time. Page copy already states that repeat uploads with the same name and phone use the latest photo.

## LocalStorage Behavior

After successful upload, store:

```json
{
  "submitted": true,
  "name": "王小明",
  "phone": "0912345678",
  "fileName": "王小明_0912345678.jpg",
  "submittedAt": "2026-06-03T00:00:00.000Z"
}
```

Storage key:

```text
wedding-photo-upload
```

Reload behavior:

- If localStorage says submitted, show the success state.
- Provide a discreet `重新上傳` action, with the reminder that it will replace the previous upload for the same name and phone.
- This is only a convenience barrier. Users can still upload again from another browser or device.

## Error States

Client errors:

- Missing photo: `請先選擇一張照片。`
- Unsupported type: `目前只接受照片檔案。`
- Oversized file: `照片檔案太大，請選擇 小於 10MB的照片。`
- Missing consent: `請先確認照片使用同意。`
- Invalid phone: `請填寫正確手機號碼。`

Server errors:

- Token invalid: show generic `送出失敗，請稍後再試。`
- Drive folder missing or inaccessible: show generic `送出失敗，請稍後再試。`
- Invalid payload: show user-facing validation message when safe.

## Accessibility

- Upload control must be reachable by keyboard.
- The envelope click target must also be a real button.
- Consent checkbox must use a real checkbox input.
- Upload progress and success/error states must use `aria-live`.
- Reduced motion users should see a static archive card and no scroll-driven envelope animation.

## Testing

Unit tests:

- Phone normalization and validation.
- Client upload payload building.
- File type and size validation.
- localStorage submitted-state handling.
- Apps Script receiver rejects invalid token, missing consent, non-image MIME, and oversized payload.
- Apps Script overwrites existing matching filenames.
- Apps Script escapes/sanitizes unsafe filename characters.

Component tests:

- Friends upload section blocks submit until file, name, phone, and consent are valid.
- Preview appears after selecting an image.
- Success state appears after `{ ok: true }`.
- Error state appears after `{ ok: false }`.
- Family simplified upload section uses the same validation and endpoint behavior.

Browser QA:

- Desktop friends page animation sequence.
- Mobile friends page layout without clipped controls.
- Family page readability and large tap targets.
- Reduced-motion fallback.

## Non-Goals

- Do not reveal the wedding favor / poker-card use.
- Do not build a public gallery of uploaded photos.
- Do not add user authentication.
- Do not guarantee duplicate prevention across all devices; Drive overwrite by name and phone is the source of truth.
- Do not perform face detection.

## Implementation Notes

- Use existing GSAP/scroll animation patterns for friends-page reveal.
- Keep the upload component logic shared between friends and family variants.
- Keep Apps Script photo upload separate from RSVP Apps Script to avoid mixing sheet append logic with Drive file writes.
- If HEIC support is unreliable during implementation, omit HEIC from allowed types and mention accepted formats in UI.
