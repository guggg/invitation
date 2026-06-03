import { formatPhoneInput, isValidTaiwanMobilePhone, normalizePhoneNumber } from "@/lib/rsvp";

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

export function formatPhotoUploadPhone(value: string): string {
  return formatPhoneInput(value);
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

  if (!name) {
    throw new Error("請填寫名字。");
  }

  if (!isValidTaiwanMobilePhone(phone)) {
    throw new Error("請填寫正確手機號碼。");
  }

  if (!input.consent) {
    throw new Error("請先確認照片使用同意。");
  }

  const fileValidation = validatePhotoUploadFile(input.file);
  if (!fileValidation.ok) {
    throw new Error(fileValidation.message);
  }

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

export async function submitPhotoUpload(
  endpoint: string,
  payload: PhotoUploadPayload,
  fetcher: typeof fetch = fetch
): Promise<{ ok?: boolean; fileName?: string } | null> {
  if (!endpoint) {
    throw new Error("照片上傳尚未開放，請稍後再試。");
  }

  const response = await fetcher(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("送出失敗，請稍後再試。");
  }

  const result = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; fileName?: string } | null;

  if (result?.ok === false) {
    throw new Error(result.error || "送出失敗，請稍後再試。");
  }

  return result;
}

export function readPhotoUploadState(): PhotoUploadStoredState | null {
  if (typeof localStorage === "undefined" || typeof localStorage.getItem !== "function") {
    return null;
  }

  const raw = safeStorageRead();
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PhotoUploadStoredState;
    return parsed.submitted ? parsed : null;
  } catch {
    return null;
  }
}

export function writePhotoUploadState(state: Omit<PhotoUploadStoredState, "submitted">): void {
  if (typeof localStorage === "undefined" || typeof localStorage.setItem !== "function") {
    return;
  }

  try {
    localStorage.setItem(PHOTO_UPLOAD_STORAGE_KEY, JSON.stringify({ submitted: true, ...state }));
  } catch {
    // Browsers may disable localStorage in private or restricted contexts.
  }
}

function safeStorageRead(): string | null {
  try {
    return localStorage.getItem(PHOTO_UPLOAD_STORAGE_KEY);
  } catch {
    return null;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("照片讀取失敗，請重新選擇。"));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.split(",")[1] ?? "");
    };

    reader.readAsDataURL(file);
  });
}
