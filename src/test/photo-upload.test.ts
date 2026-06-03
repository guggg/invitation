import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildPhotoUploadPayload,
  PHOTO_UPLOAD_STORAGE_KEY,
  readPhotoUploadState,
  submitPhotoUpload,
  validatePhotoUploadFile,
  writePhotoUploadState
} from "@/lib/photo-upload";

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    removeItem: vi.fn((key: string) => values.delete(key)),
    setItem: vi.fn((key: string, value: string) => values.set(key, value))
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function imageFile(name = "avatar.jpg", type = "image/jpeg", size = 1024) {
  return new File([new Uint8Array(size)], name, { type });
}

describe("photo upload validation", () => {
  it("accepts supported image files under 10MB", () => {
    expect(validatePhotoUploadFile(imageFile()).ok).toBe(true);
  });

  it("rejects non-image files", () => {
    expect(validatePhotoUploadFile(new File(["x"], "note.txt", { type: "text/plain" }))).toMatchObject({
      ok: false,
      message: "目前只接受照片檔案。"
    });
  });

  it("rejects files that are 10MB or larger", () => {
    expect(validatePhotoUploadFile(imageFile("large.jpg", "image/jpeg", 10 * 1024 * 1024))).toMatchObject({
      ok: false,
      message: "照片檔案太大，請選擇小於 10MB 的照片。"
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

  it("requires a Taiwan mobile phone", async () => {
    await expect(
      buildPhotoUploadPayload({
        sourceRoute: "/",
        name: "王小明",
        phone: "0223456789",
        consent: true,
        file: imageFile()
      })
    ).rejects.toThrow("請填寫正確手機號碼。");
  });
});

describe("photo upload submit", () => {
  it("treats Apps Script ok:false as failure", async () => {
    const fetcher = vi.fn(
      async () =>
        ({
          ok: true,
          json: async () => ({ ok: false, error: "Drive failed" })
        }) as Response
    );

    await expect(submitPhotoUpload("https://example.com", {} as never, fetcher as typeof fetch)).rejects.toThrow(
      "Drive failed"
    );
  });

  it("stores and reads local submitted state", () => {
    writePhotoUploadState({
      name: "王小明",
      phone: "0912345678",
      fileName: "王小明_0912345678.jpg",
      submittedAt: "2026-06-03T00:00:00.000Z"
    });

    expect(localStorage.getItem(PHOTO_UPLOAD_STORAGE_KEY)).toContain("王小明");
    expect(readPhotoUploadState()).toMatchObject({ submitted: true, fileName: "王小明_0912345678.jpg" });
  });
});
