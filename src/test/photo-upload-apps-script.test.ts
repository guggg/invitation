import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

type StoredFile = {
  blob: { bytes: number[]; mimeType: string; name: string };
  name: string;
  trashed: boolean;
};

type AppsScriptHarness = {
  doPost: (event: { postData: { contents: string } }) => { content: string };
  files: StoredFile[];
};

type AppsScriptSandbox = {
  ContentService: unknown;
  DriveApp: unknown;
  PropertiesService: unknown;
  Utilities: unknown;
  doPost?: AppsScriptHarness["doPost"];
};

function iterator<T>(items: T[]) {
  let index = 0;
  return {
    hasNext: () => index < items.length,
    next: () => items[index++]
  };
}

function loadPhotoUploadScript(options: { token?: string; folderId?: string; existingFiles?: StoredFile[] } = {}) {
  const files = options.existingFiles ?? [];
  const folder = {
    createFile: (blob: StoredFile["blob"]) => {
      const file = {
        blob,
        name: blob.name,
        trashed: false,
        setName(name: string) {
          this.name = name;
          this.blob.name = name;
          return this;
        },
        getName() {
          return this.name;
        },
        setTrashed(value: boolean) {
          this.trashed = value;
          return this;
        }
      };
      files.push(file);
      return file;
    },
    getFiles: () =>
      iterator(
        files.map((file) => ({
          getName: () => file.name,
          setTrashed: (value: boolean) => {
            file.trashed = value;
            return file;
          }
        }))
      )
  };

  const sandbox: AppsScriptSandbox = {
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (content: string) => ({
        content,
        setMimeType() {
          return this;
        }
      })
    },
    DriveApp: {
      getFolderById: (id: string) => {
        if (id !== (options.folderId ?? "folder-1")) {
          throw new Error("folder not found");
        }
        return folder;
      }
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key: string) => {
          if (key === "PHOTO_UPLOAD_TOKEN") return options.token ?? "";
          if (key === "PHOTO_UPLOAD_FOLDER_ID") return options.folderId ?? "folder-1";
          return "";
        }
      })
    },
    Utilities: {
      base64Decode: (value: string) => Array.from(Buffer.from(value, "base64")),
      newBlob: (bytes: number[], mimeType: string, name: string) => ({ bytes, mimeType, name })
    }
  };

  vm.runInNewContext(readFileSync("apps-script/PhotoUpload.gs", "utf8"), sandbox);

  if (!sandbox.doPost) {
    throw new Error("PhotoUpload doPost was not loaded");
  }

  return { doPost: sandbox.doPost, files };
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    token: "photo-token",
    sourceRoute: "/",
    name: "王小明",
    phone: "0912345678",
    consent: true,
    fileName: "me.jpg",
    mimeType: "image/jpeg",
    fileSizeBytes: 3,
    dataBase64: Buffer.from([1, 2, 3]).toString("base64"),
    submittedAt: "2026-06-03T00:00:00.000Z",
    ...overrides
  };
}

describe("PhotoUpload Apps Script receiver", () => {
  it("rejects requests without the configured token", () => {
    const { doPost, files } = loadPhotoUploadScript({ token: "photo-token" });
    const response = JSON.parse(
      doPost({ postData: { contents: JSON.stringify(validPayload({ token: "wrong-token" })) } }).content
    );

    expect(response.ok).toBe(false);
    expect(response.error).toBe("photo upload token is invalid");
    expect(files).toHaveLength(0);
  });

  it("stores the uploaded photo with sanitized name and phone", () => {
    const { doPost, files } = loadPhotoUploadScript({ token: "photo-token" });
    const response = JSON.parse(doPost({ postData: { contents: JSON.stringify(validPayload()) } }).content);

    expect(response).toMatchObject({ ok: true, fileName: "王小明_0912345678.jpg" });
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({
      name: "王小明_0912345678.jpg",
      trashed: false,
      blob: { bytes: [1, 2, 3], mimeType: "image/jpeg" }
    });
  });

  it("trashes prior files with the same name and phone before writing the latest one", () => {
    const existingFiles: StoredFile[] = [
      { name: "王小明_0912345678.jpg", trashed: false, blob: { bytes: [], mimeType: "image/jpeg", name: "" } },
      { name: "王小明_0912345678.png", trashed: false, blob: { bytes: [], mimeType: "image/png", name: "" } },
      { name: "其他人_0912345678.jpg", trashed: false, blob: { bytes: [], mimeType: "image/jpeg", name: "" } }
    ];
    const { doPost, files } = loadPhotoUploadScript({ token: "photo-token", existingFiles });
    const response = JSON.parse(
      doPost({ postData: { contents: JSON.stringify(validPayload({ fileName: "new.webp", mimeType: "image/webp" })) } })
        .content
    );

    expect(response).toMatchObject({ ok: true, fileName: "王小明_0912345678.webp" });
    expect(files[0].trashed).toBe(true);
    expect(files[1].trashed).toBe(true);
    expect(files[2].trashed).toBe(false);
    expect(files.at(-1)?.name).toBe("王小明_0912345678.webp");
  });

  it("rejects non-image uploads", () => {
    const { doPost, files } = loadPhotoUploadScript({ token: "photo-token" });
    const response = JSON.parse(
      doPost({ postData: { contents: JSON.stringify(validPayload({ mimeType: "text/plain" })) } }).content
    );

    expect(response.ok).toBe(false);
    expect(response.error).toBe("mimeType is invalid");
    expect(files).toHaveLength(0);
  });
});
