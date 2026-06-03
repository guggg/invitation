# Secret Archive Photo Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished "秘密收藏室" photo-upload section for friends and family pages, storing one representative guest image per name+phone in Google Drive via Apps Script.

**Architecture:** Add a shared photo-upload domain module, a shared React upload component with friend/family variants, and a dedicated Apps Script receiver for Drive writes. Friends page gets the full sealed-envelope interaction after the gallery and before shuttle; family page gets a simpler archive card immediately before RSVP.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Testing Library, GSAP/CSS animations, Google Apps Script `DriveApp`.

---

## File Structure

- Create `src/lib/photo-upload.ts`: validation, phone normalization reuse, payload creation, localStorage helpers, submit function.
- Create `src/components/PhotoUploadExperience.tsx`: shared client component with `variant="friend" | "family"`.
- Create `apps-script/PhotoUpload.gs`: dedicated Apps Script web app for Google Drive photo upload.
- Create `src/test/photo-upload.test.ts`: unit tests for validation, payload, submit response handling, localStorage.
- Create `src/test/photo-upload-experience.test.tsx`: component tests for friend/family variants.
- Create `src/test/photo-upload-apps-script.test.ts`: VM tests for `PhotoUpload.gs`.
- Modify `src/components/FriendsExperience.tsx`: insert section after `ProjectGallery`, before shuttle.
- Modify `src/components/friends/friendSections.ts`: add `密件` section after gallery and shift downstream section order.
- Modify `src/components/FamilyExperience.tsx`: insert simplified upload section before `family-rsvp`.
- Modify `src/app/page.tsx` and `src/app/family/page.tsx`: pass photo upload endpoint/token props.
- Modify `src/app/globals.css`: friend sealed-envelope visuals, family archive-card visuals, reduced-motion fallback.
- Modify `.env.example`: add `NEXT_PUBLIC_PHOTO_UPLOAD_ENDPOINT` and `NEXT_PUBLIC_PHOTO_UPLOAD_TOKEN`.
- Modify `docs/google-apps-script.md`: add photo upload setup with `PHOTO_UPLOAD_FOLDER_ID` and `PHOTO_UPLOAD_TOKEN`.

## Task 1: Photo Upload Domain Module

**Files:**
- Create: `src/lib/photo-upload.ts`
- Test: `src/test/photo-upload.test.ts`

- [ ] **Step 1: Write failing validation tests**

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildPhotoUploadPayload,
  PHOTO_UPLOAD_STORAGE_KEY,
  readPhotoUploadState,
  submitPhotoUpload,
  validatePhotoUploadFile,
  writePhotoUploadState
} from "@/lib/photo-upload";

afterEach(() => {
  vi.unstubAllEnvs();
  localStorage.clear();
});

function imageFile(name = "avatar.jpg", type = "image/jpeg", size = 1024) {
  return new File([new Uint8Array(size)], name, { type });
}

describe("photo upload validation", () => {
  it("accepts supported image files under 8MB", () => {
    expect(validatePhotoUploadFile(imageFile()).ok).toBe(true);
  });

  it("rejects non-image files", () => {
    expect(validatePhotoUploadFile(new File(["x"], "note.txt", { type: "text/plain" }))).toMatchObject({
      ok: false,
      message: "目前只接受照片檔案。"
    });
  });

  it("rejects files over 8MB", () => {
    expect(validatePhotoUploadFile(imageFile("large.jpg", "image/jpeg", 8 * 1024 * 1024 + 1))).toMatchObject({
      ok: false,
      message: "照片檔案太大，請選擇 8MB 以下的照片。"
    });
  });
});

describe("photo upload payload", () => {
  it("builds a normalized payload with base64 data", async () => {
    vi.stubEnv("NEXT_PUBLIC_PHOTO_UPLOAD_TOKEN", "photo-token");
    const payload = await buildPhotoUploadPayload({
      sourceRoute: "/",
      name: " 王小明 ",
      phone: "0912 345 678",
      consent: true,
      file: imageFile("me.jpg", "image/jpeg", 3),
      now: new Date("2026-06-03T00:00:00.000Z")
    });

    expect(payload).toMatchObject({
      token: "photo-token",
      sourceRoute: "/",
      name: "王小明",
      phone: "0912345678",
      consent: true,
      fileName: "me.jpg",
      mimeType: "image/jpeg",
      fileSizeBytes: 3,
      submittedAt: "2026-06-03T00:00:00.000Z"
    });
    expect(payload.dataBase64).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  it("requires consent", async () => {
    await expect(
      buildPhotoUploadPayload({
        sourceRoute: "/",
        name: "王小明",
        phone: "0912345678",
        consent: false,
        file: imageFile()
      })
    ).rejects.toThrow("請先確認照片使用同意。");
  });
});

describe("photo upload submit", () => {
  it("treats Apps Script ok:false as failure", async () => {
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ ok: false, error: "Drive failed" }) }) as Response);
    await expect(submitPhotoUpload("https://example.com", {} as never, fetcher as typeof fetch)).rejects.toThrow("Drive failed");
  });

  it("stores and reads local submitted state", () => {
    writePhotoUploadState({ name: "王小明", phone: "0912345678", fileName: "王小明_0912345678.jpg", submittedAt: "2026-06-03T00:00:00.000Z" });
    expect(localStorage.getItem(PHOTO_UPLOAD_STORAGE_KEY)).toContain("王小明");
    expect(readPhotoUploadState()).toMatchObject({ submitted: true, fileName: "王小明_0912345678.jpg" });
  });
});
```

- [ ] **Step 2: Run test and verify RED**

Run:

```bash
npm test -- src/test/photo-upload.test.ts
```

Expected: fail because `src/lib/photo-upload.ts` does not exist.

- [ ] **Step 3: Implement `src/lib/photo-upload.ts`**

```ts
import { isValidTaiwanMobilePhone, normalizePhoneNumber } from "@/lib/rsvp";

export const PHOTO_UPLOAD_STORAGE_KEY = "wedding-photo-upload";
export const PHOTO_UPLOAD_MAX_BYTES = 8 * 1024 * 1024;
export const PHOTO_UPLOAD_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"] as const;

export type PhotoUploadSourceRoute = "/" | "/family";

export type PhotoUploadPayload = {
  token: string;
  sourceRoute: PhotoUploadSourceRoute;
  name: string;
  phone: string;
  consent: true;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  dataBase64: string;
  submittedAt: string;
};

export type PhotoUploadStoredState = {
  submitted: true;
  name: string;
  phone: string;
  fileName: string;
  submittedAt: string;
};

export function validatePhotoUploadFile(file: File): { ok: true } | { ok: false; message: string } {
  if (!PHOTO_UPLOAD_ALLOWED_TYPES.includes(file.type as (typeof PHOTO_UPLOAD_ALLOWED_TYPES)[number])) {
    return { ok: false, message: "目前只接受照片檔案。" };
  }
  if (file.size > PHOTO_UPLOAD_MAX_BYTES) {
    return { ok: false, message: "照片檔案太大，請選擇 8MB 以下的照片。" };
  }
  return { ok: true };
}

export async function buildPhotoUploadPayload(input: {
  sourceRoute: PhotoUploadSourceRoute;
  name: string;
  phone: string;
  consent: boolean;
  file: File;
  now?: Date;
}): Promise<PhotoUploadPayload> {
  const name = input.name.trim();
  const phone = normalizePhoneNumber(input.phone);
  if (!name) throw new Error("請填寫名字。");
  if (!isValidTaiwanMobilePhone(phone)) throw new Error("請填寫正確手機號碼。");
  if (!input.consent) throw new Error("請先確認照片使用同意。");
  const fileValidation = validatePhotoUploadFile(input.file);
  if (!fileValidation.ok) throw new Error(fileValidation.message);

  return {
    token: process.env.NEXT_PUBLIC_PHOTO_UPLOAD_TOKEN ?? "",
    sourceRoute: input.sourceRoute,
    name,
    phone,
    consent: true,
    fileName: input.file.name,
    mimeType: input.file.type,
    fileSizeBytes: input.file.size,
    dataBase64: await fileToBase64(input.file),
    submittedAt: (input.now ?? new Date()).toISOString()
  };
}

export async function submitPhotoUpload(endpoint: string, payload: PhotoUploadPayload, fetcher: typeof fetch = fetch) {
  if (!endpoint) throw new Error("照片上傳尚未開放，請稍後再試。");
  const response = await fetcher(endpoint, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("送出失敗，請稍後再試。");
  const result = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; fileName?: string } | null;
  if (result?.ok === false) throw new Error(result.error || "送出失敗，請稍後再試。");
  return result ?? { ok: true };
}

export function readPhotoUploadState(): PhotoUploadStoredState | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(PHOTO_UPLOAD_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PhotoUploadStoredState;
    return parsed.submitted ? parsed : null;
  } catch {
    return null;
  }
}

export function writePhotoUploadState(state: Omit<PhotoUploadStoredState, "submitted">) {
  localStorage.setItem(PHOTO_UPLOAD_STORAGE_KEY, JSON.stringify({ submitted: true, ...state }));
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("照片讀取失敗，請重新選擇。"));
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(file);
  });
}
```

- [ ] **Step 4: Run test and verify GREEN**

Run:

```bash
npm test -- src/test/photo-upload.test.ts
```

Expected: pass.

## Task 2: Apps Script Photo Upload Receiver

**Files:**
- Create: `apps-script/PhotoUpload.gs`
- Test: `src/test/photo-upload-apps-script.test.ts`

- [ ] **Step 1: Write failing Apps Script tests**

```ts
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

type Harness = {
  files: Array<{ name: string; mimeType: string; bytes: Uint8Array; trashed?: boolean }>;
  doPost: (event: { postData: { contents: string } }) => { content: string };
};

function loadScript(): Harness {
  const files: Harness["files"] = [];
  const folder = {
    createFile(blob: { name: string; mimeType: string; bytes: Uint8Array }) {
      files.push(blob);
      return blob;
    },
    getFiles() {
      let index = 0;
      return {
        hasNext: () => index < files.length,
        next: () => ({
          getName: () => files[index]!.name,
          setTrashed: (value: boolean) => {
            files[index]!.trashed = value;
            index += 1;
          }
        })
      };
    }
  };
  const sandbox = {
    Utilities: {
      base64Decode: (value: string) => Uint8Array.from(Buffer.from(value, "base64")),
      newBlob: (bytes: Uint8Array, mimeType: string, name: string) => ({ bytes, mimeType, name })
    },
    DriveApp: { getFolderById: () => folder },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key: string) => (key === "PHOTO_UPLOAD_TOKEN" ? "token" : key === "PHOTO_UPLOAD_FOLDER_ID" ? "folder-id" : "")
      })
    },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (content: string) => ({ content, setMimeType() { return this; } })
    }
  };
  vm.runInNewContext(readFileSync("apps-script/PhotoUpload.gs", "utf8"), sandbox);
  return { files, doPost: sandbox.doPost };
}

function payload(overrides = {}) {
  return {
    token: "token",
    sourceRoute: "/",
    name: "王小明",
    phone: "0912345678",
    consent: true,
    fileName: "me.jpg",
    mimeType: "image/jpeg",
    fileSizeBytes: 3,
    dataBase64: Buffer.from("abc").toString("base64"),
    submittedAt: "2026-06-03T00:00:00.000Z",
    ...overrides
  };
}

describe("PhotoUpload Apps Script", () => {
  it("writes a sanitized name_phone image file", () => {
    const { files, doPost } = loadScript();
    const response = JSON.parse(doPost({ postData: { contents: JSON.stringify(payload()) } }).content);
    expect(response).toMatchObject({ ok: true, fileName: "王小明_0912345678.jpg" });
    expect(files[0]).toMatchObject({ name: "王小明_0912345678.jpg", mimeType: "image/jpeg" });
  });

  it("rejects invalid token and non-image types", () => {
    const { files, doPost } = loadScript();
    expect(JSON.parse(doPost({ postData: { contents: JSON.stringify(payload({ token: "bad" })) } }).content).ok).toBe(false);
    expect(JSON.parse(doPost({ postData: { contents: JSON.stringify(payload({ mimeType: "text/plain" })) } }).content).ok).toBe(false);
    expect(files).toHaveLength(0);
  });

  it("trashes existing same-name-phone image before saving replacement", () => {
    const { files, doPost } = loadScript();
    doPost({ postData: { contents: JSON.stringify(payload()) } });
    doPost({ postData: { contents: JSON.stringify(payload({ fileName: "new.png", mimeType: "image/png" })) } });
    expect(files[0]?.trashed).toBe(true);
    expect(files[1]?.name).toBe("王小明_0912345678.png");
  });
});
```

- [ ] **Step 2: Run test and verify RED**

Run:

```bash
npm test -- src/test/photo-upload-apps-script.test.ts
```

Expected: fail because `apps-script/PhotoUpload.gs` does not exist.

- [ ] **Step 3: Implement `apps-script/PhotoUpload.gs`**

```js
const PHOTO_UPLOAD_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const PHOTO_UPLOAD_MAX_BYTES = 8 * 1024 * 1024;

function doPost(e) {
  try {
    const payload = JSON.parse((e.postData && e.postData.contents) || "{}");
    validatePayload(payload);
    const folder = DriveApp.getFolderById(getRequiredProperty("PHOTO_UPLOAD_FOLDER_ID"));
    const extension = extensionFromMimeType(payload.mimeType);
    const baseName = sanitizeFilename(payload.name) + "_" + normalizePhone(payload.phone);
    const fileName = baseName + "." + extension;
    trashExistingFiles(folder, baseName);
    const bytes = Utilities.base64Decode(payload.dataBase64);
    folder.createFile(Utilities.newBlob(bytes, payload.mimeType, fileName));
    return jsonResponse({ ok: true, fileName: fileName });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function validatePayload(payload) {
  if (payload.token !== getRequiredProperty("PHOTO_UPLOAD_TOKEN")) throw new Error("token is invalid");
  if (payload.sourceRoute !== "/" && payload.sourceRoute !== "/family") throw new Error("sourceRoute is invalid");
  if (typeof payload.name !== "string" || !payload.name.trim()) throw new Error("name is required");
  if (!/^09\d{8}$/.test(normalizePhone(payload.phone))) throw new Error("phone is invalid");
  if (payload.consent !== true) throw new Error("consent is required");
  if (PHOTO_UPLOAD_ALLOWED_TYPES.indexOf(payload.mimeType) === -1) throw new Error("mimeType is invalid");
  if (typeof payload.fileSizeBytes !== "number" || payload.fileSizeBytes < 1 || payload.fileSizeBytes > PHOTO_UPLOAD_MAX_BYTES) throw new Error("fileSizeBytes is invalid");
  if (typeof payload.dataBase64 !== "string" || !payload.dataBase64) throw new Error("dataBase64 is required");
}

function trashExistingFiles(folder, baseName) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();
    if (name.indexOf(baseName + ".") === 0) {
      file.setTrashed(true);
    }
  }
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 10);
}

function sanitizeFilename(value) {
  return String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|#%{}$!'@+`=]/g, "")
    .replace(/\s+/g, "")
    .slice(0, 40) || "guest";
}

function extensionFromMimeType(mimeType) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/heic") return "heic";
  if (mimeType === "image/heif") return "heif";
  return "jpg";
}

function getRequiredProperty(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) throw new Error(key + " is not configured");
  return value;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
```

- [ ] **Step 4: Run test and verify GREEN**

Run:

```bash
npm test -- src/test/photo-upload-apps-script.test.ts
```

Expected: pass.

## Task 3: Shared Photo Upload Component

**Files:**
- Create: `src/components/PhotoUploadExperience.tsx`
- Test: `src/test/photo-upload-experience.test.tsx`

- [ ] **Step 1: Write failing component tests**

```tsx
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhotoUploadExperience } from "@/components/PhotoUploadExperience";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

function imageFile() {
  return new File([new Uint8Array([1, 2, 3])], "me.jpg", { type: "image/jpeg" });
}

describe("PhotoUploadExperience", () => {
  it("blocks submit until name phone image and consent are present", () => {
    render(<PhotoUploadExperience endpoint="https://example.com/photo" sourceRoute="/" variant="friend" />);
    expect(screen.getByRole("button", { name: "封存密件" })).toBeDisabled();
  });

  it("uploads a photo and shows collected state", async () => {
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, fileName: "Yuan_0912345678.jpg" }) }) as Response);
    render(<PhotoUploadExperience endpoint="https://example.com/photo" sourceRoute="/" variant="friend" fetcher={fetcher as typeof fetch} />);

    fireEvent.click(screen.getByRole("button", { name: "打開密件信封" }));
    fireEvent.change(screen.getByLabelText("名字"), { target: { value: "Yuan" } });
    fireEvent.change(screen.getByLabelText("聯絡電話"), { target: { value: "0912345678" } });
    fireEvent.change(screen.getByLabelText("選擇照片"), { target: { files: [imageFile()] } });
    fireEvent.click(screen.getByLabelText(/我同意提供這張照片/));
    fireEvent.click(screen.getByRole("button", { name: "封存密件" }));

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    expect(screen.getByText("密件已收藏")).toBeInTheDocument();
  });

  it("renders family variant with simpler copy", () => {
    render(<PhotoUploadExperience endpoint="https://example.com/photo" sourceRoute="/family" variant="family" />);
    expect(screen.getByText("上傳一張代表您的照片")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test and verify RED**

Run:

```bash
npm test -- src/test/photo-upload-experience.test.tsx
```

Expected: fail because `PhotoUploadExperience` does not exist.

- [ ] **Step 3: Implement component**

Create `PhotoUploadExperience` as a client component that:

- Uses `useState` for open/closed, selected file, preview URL, fields, consent, status, message.
- Uses `readPhotoUploadState` on mount.
- Uses `buildPhotoUploadPayload` and `submitPhotoUpload` on submit.
- Writes localStorage on success.
- Renders a real file input with label `選擇照片`.
- Renders friend variant as sealed-envelope archive markup.
- Renders family variant as simplified card markup.
- Uses `aria-live` for message/status.

The submit handler must be:

```ts
async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (!file) {
    setMessage("請先選擇一張照片。");
    return;
  }
  setStatus("submitting");
  setMessage("");
  try {
    const payload = await buildPhotoUploadPayload({ sourceRoute, name, phone, consent, file });
    const result = await submitPhotoUpload(endpoint, payload, fetcher);
    const fileName = result.fileName ?? `${name.trim()}_${normalizePhoneNumber(phone)}.${file.name.split(".").pop() ?? "jpg"}`;
    writePhotoUploadState({ name: name.trim(), phone: normalizePhoneNumber(phone), fileName, submittedAt: payload.submittedAt });
    setStoredState(readPhotoUploadState());
    setStatus("success");
  } catch (error) {
    setStatus("error");
    setMessage(error instanceof Error ? error.message : "送出失敗，請稍後再試。");
  }
}
```

- [ ] **Step 4: Run component tests**

Run:

```bash
npm test -- src/test/photo-upload-experience.test.tsx
```

Expected: pass.

## Task 4: Page Integration and Styling

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/family/page.tsx`
- Modify: `src/components/FriendsExperience.tsx`
- Modify: `src/components/FamilyExperience.tsx`
- Modify: `src/components/friends/friendSections.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add endpoint props**

Update route components:

```tsx
export default function HomePage() {
  return (
    <FriendsExperience
      endpoint={process.env.NEXT_PUBLIC_RSVP_ENDPOINT ?? ""}
      photoUploadEndpoint={process.env.NEXT_PUBLIC_PHOTO_UPLOAD_ENDPOINT ?? ""}
    />
  );
}
```

```tsx
export default function FamilyPage() {
  return (
    <FamilyExperience
      endpoint={process.env.NEXT_PUBLIC_FAMILY_RSVP_ENDPOINT ?? process.env.NEXT_PUBLIC_RSVP_ENDPOINT ?? ""}
      photoUploadEndpoint={process.env.NEXT_PUBLIC_PHOTO_UPLOAD_ENDPOINT ?? ""}
    />
  );
}
```

- [ ] **Step 2: Insert friends section after gallery**

In `FriendsExperience`, import `PhotoUploadExperience`, accept `photoUploadEndpoint`, and insert after `<ProjectGallery />`:

```tsx
<section
  id="secret-archive"
  className="friends-v2-section secret-archive-section"
  data-friend-section="6"
  data-section-label="密件"
>
  <PhotoUploadExperience endpoint={photoUploadEndpoint} sourceRoute="/" variant="friend" />
</section>
```

Then increment shuttle to `data-friend-section="7"`, RSVP to `8`, finale to `9`.

- [ ] **Step 3: Update section rail**

In `friendSections`, insert:

```ts
{ id: "secret-archive", label: "密件", title: "交給我們一張代表你的密件" },
```

between gallery and shuttle.

- [ ] **Step 4: Insert family section before RSVP**

In `FamilyExperience`, accept `photoUploadEndpoint`, import `PhotoUploadExperience`, and add before `<section id="rsvp"...>`:

```tsx
<section className="family-section family-photo-upload">
  <PhotoUploadExperience endpoint={photoUploadEndpoint} sourceRoute="/family" variant="family" />
</section>
```

- [ ] **Step 5: Add CSS**

Add CSS classes:

- `.secret-archive-section`
- `.photo-upload-archive`
- `.photo-upload-envelope`
- `.photo-upload-letter`
- `.photo-upload-dropzone`
- `.photo-upload-preview`
- `.photo-upload-consent`
- `.photo-upload-success`
- `.family-photo-upload`

Required CSS behaviors:

- Friend variant dark archive background.
- Envelope/letter transforms only when no reduced motion.
- Mobile layout stacks text and upload frame.
- Family variant uses cream paper, burgundy border, larger controls.
- `@media (prefers-reduced-motion: reduce)` disables envelope transforms and shows open card statically.

## Task 5: Env and Documentation

**Files:**
- Modify: `.env.example`
- Modify: `docs/google-apps-script.md`

- [ ] **Step 1: Add env examples**

```env
NEXT_PUBLIC_PHOTO_UPLOAD_ENDPOINT=https://script.google.com/macros/s/YOUR_PHOTO_UPLOAD_DEPLOYMENT_ID/exec
NEXT_PUBLIC_PHOTO_UPLOAD_TOKEN=replace-with-the-same-token-as-photo-upload-apps-script
```

- [ ] **Step 2: Add Apps Script setup docs**

Add section:

```md
## Photo Upload Apps Script

1. Create or choose a Google Drive folder.
2. Copy the folder ID from the URL.
3. Create a new Apps Script project.
4. Paste `apps-script/PhotoUpload.gs`.
5. In `Project Settings > Script Properties`, set:
   - `PHOTO_UPLOAD_FOLDER_ID`
   - `PHOTO_UPLOAD_TOKEN`
6. Deploy as Web App:
   - Execute as: Me
   - Who has access: Anyone
7. Set website env:
   - `NEXT_PUBLIC_PHOTO_UPLOAD_ENDPOINT`
   - `NEXT_PUBLIC_PHOTO_UPLOAD_TOKEN`
```

## Task 6: Full Verification

**Files:**
- All files changed above.

- [ ] **Step 1: Run targeted tests**

```bash
npm test -- src/test/photo-upload.test.ts src/test/photo-upload-experience.test.tsx src/test/photo-upload-apps-script.test.ts
```

Expected: all pass.

- [ ] **Step 2: Run full checks**

```bash
npm run test
npm run lint
npm run typecheck
npm run build
```

Expected:

- Vitest all test files pass.
- ESLint exits 0.
- TypeScript exits 0.
- Next build exits 0.

- [ ] **Step 3: Browser QA**

Open `http://localhost:3000/`:

- Confirm section appears after gallery and before shuttle.
- Confirm envelope opens.
- Confirm file preview appears.
- Confirm submit disabled until valid.
- Confirm success state appears with mocked endpoint or local fetch stub.

Open `http://localhost:3000/family`:

- Confirm photo upload appears before RSVP.
- Confirm controls are large and readable.
- Confirm copy is simplified.

