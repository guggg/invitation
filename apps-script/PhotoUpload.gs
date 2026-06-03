const PHOTO_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
const PHOTO_UPLOAD_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const PHOTO_UPLOAD_EXTENSION_BY_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif"
};

function doGet() {
  return photoJsonResponse({ ok: true, service: "4J & Yuan Photo Upload" });
}

function doPost(e) {
  try {
    const payload = JSON.parse((e.postData && e.postData.contents) || "{}");
    validatePhotoPayload(payload);

    const folder = DriveApp.getFolderById(getPhotoUploadFolderId());
    const outputFileName = buildOutputFileName(payload);
    trashExistingGuestFiles(folder, outputFileName.replace(/\.[^.]+$/, ""));

    const bytes = Utilities.base64Decode(payload.dataBase64);
    const blob = Utilities.newBlob(bytes, payload.mimeType, outputFileName);
    const file = folder.createFile(blob).setName(outputFileName);

    return photoJsonResponse({
      ok: true,
      fileName: file.getName ? file.getName() : outputFileName
    });
  } catch (error) {
    return photoJsonResponse({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function validatePhotoPayload(payload) {
  validatePhotoToken(payload.token);
  requirePhotoString(payload.name, "name");
  requirePhotoTaiwanMobile(payload.phone);
  requirePhotoEnum(payload.sourceRoute, "sourceRoute", ["/", "/family"]);

  if (payload.consent !== true) {
    throw new Error("consent is required");
  }

  requirePhotoString(payload.fileName, "fileName");
  requirePhotoString(payload.dataBase64, "dataBase64");
  requirePhotoEnum(payload.mimeType, "mimeType", PHOTO_UPLOAD_ALLOWED_TYPES);

  if (
    typeof payload.fileSizeBytes !== "number" ||
    !isFinite(payload.fileSizeBytes) ||
    payload.fileSizeBytes < 1 ||
    payload.fileSizeBytes >= PHOTO_UPLOAD_MAX_BYTES
  ) {
    throw new Error("fileSizeBytes is invalid");
  }
}

function validatePhotoToken(value) {
  const expectedToken = getPhotoUploadToken();
  if (expectedToken && value !== expectedToken) {
    throw new Error("photo upload token is invalid");
  }
}

function getPhotoUploadToken() {
  return PropertiesService.getScriptProperties().getProperty("PHOTO_UPLOAD_TOKEN") || "";
}

function getPhotoUploadFolderId() {
  const folderId = PropertiesService.getScriptProperties().getProperty("PHOTO_UPLOAD_FOLDER_ID") || "";
  if (!folderId) {
    throw new Error("PHOTO_UPLOAD_FOLDER_ID is not configured");
  }
  return folderId;
}

function buildOutputFileName(payload) {
  const name = sanitizePhotoFileSegment(payload.name);
  const phone = String(payload.phone).replace(/\D/g, "");
  const extension = PHOTO_UPLOAD_EXTENSION_BY_MIME[payload.mimeType] || "jpg";
  return name + "_" + phone + "." + extension;
}

function trashExistingGuestFiles(folder, baseName) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const fileName = file.getName();
    if (fileName === baseName || fileName.indexOf(baseName + ".") === 0) {
      file.setTrashed(true);
    }
  }
}

function sanitizePhotoFileSegment(value) {
  const text = String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|#%{}~&]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80);

  return text || "guest";
}

function requirePhotoString(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(fieldName + " is required");
  }
}

function requirePhotoTaiwanMobile(value) {
  if (typeof value !== "string" || !/^09\d{8}$/.test(value.replace(/\D/g, ""))) {
    throw new Error("phone is invalid");
  }
}

function requirePhotoEnum(value, fieldName, allowedValues) {
  if (allowedValues.indexOf(value) === -1) {
    throw new Error(fieldName + " is invalid");
  }
}

function photoJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
