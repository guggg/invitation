const SHEET_NAME = "RSVP";
const HEADERS = [
  "submittedAt",
  "isLate",
  "sourceRoute",
  "attendance",
  "name",
  "phone",
  "needsPhysicalInvitation",
  "vegetarianCount",
  "adultCount",
  "childCountUnder4",
  "childCount4to8",
  "needsChildSeat",
  "childSeatCount",
  "attendsCeremony",
  "transportMode",
  "selfTransportMode",
  "shuttleOutboundCount",
  "shuttleReturnCount",
  "needsShuttle",
  "userAgent"
];

function doGet() {
  return jsonResponse({ ok: true, service: "4J & Yuan RSVP" });
}

function doPost(e) {
  try {
    const payload = JSON.parse((e.postData && e.postData.contents) || "{}");
    validatePayload(payload);
    const sheet = getSheet();
    ensureHeaders(sheet);
    sheet.appendRow(HEADERS.map((header) => sanitizeCell(payload[header])));
    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders(sheet) {
  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = HEADERS.every((header, index) => firstRow[index] === header);

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function validatePayload(payload) {
  validateToken(payload.rsvpToken);
  requireString(payload.name, "name");
  requireTaiwanMobile(payload.phone);
  requireBoolean(payload.needsPhysicalInvitation, "needsPhysicalInvitation");
  requireEnum(payload.sourceRoute, "sourceRoute", ["/", "/family"]);
  requireEnum(payload.attendance, "attendance", ["attending", "declined"]);

  if (payload.attendance === "declined") {
    return;
  }

  const adultCount = requireCount(payload.adultCount, "adultCount");
  const childCountUnder4 = requireCount(payload.childCountUnder4, "childCountUnder4");
  const childCount4to8 = requireCount(payload.childCount4to8, "childCount4to8");
  const vegetarianCount = requireCount(payload.vegetarianCount, "vegetarianCount");
  const totalGuestCount = adultCount + childCountUnder4 + childCount4to8;

  if (totalGuestCount < 1) {
    throw new Error("guest count must be at least 1");
  }

  if (vegetarianCount > totalGuestCount) {
    throw new Error("vegetarianCount exceeds total guests");
  }

  if (payload.needsChildSeat === true) {
    const childSeatCount = requireCount(payload.childSeatCount, "childSeatCount");
    if (childSeatCount < 1) {
      throw new Error("childSeatCount is required");
    }
    if (childSeatCount > childCountUnder4) {
      throw new Error("childSeatCount exceeds 0-4 child count");
    }
  }

  requireEnum(payload.transportMode, "transportMode", ["shuttle", "self-arranged"]);

  if (payload.transportMode === "shuttle") {
    const shuttleOutboundCount = requireCount(payload.shuttleOutboundCount, "shuttleOutboundCount");
    const shuttleReturnCount = requireCount(payload.shuttleReturnCount, "shuttleReturnCount");

    if (shuttleOutboundCount + shuttleReturnCount < 1) {
      throw new Error("shuttle count is required");
    }

    if (shuttleOutboundCount > totalGuestCount || shuttleReturnCount > totalGuestCount) {
      throw new Error("shuttle count exceeds total guests");
    }
  }

  if (payload.transportMode === "self-arranged") {
    requireEnum(payload.selfTransportMode, "selfTransportMode", ["drive", "taxi"]);
  }
}

function validateToken(value) {
  const expectedToken = getExpectedToken();
  if (expectedToken && value !== expectedToken) {
    throw new Error("rsvpToken is invalid");
  }
}

function getExpectedToken() {
  return PropertiesService.getScriptProperties().getProperty("RSVP_TOKEN") || "";
}

function requireString(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(fieldName + " is required");
  }
}

function requireTaiwanMobile(value) {
  if (typeof value !== "string" || !/^09\d{8}$/.test(value.replace(/\D/g, ""))) {
    throw new Error("phone is invalid");
  }
}

function requireEnum(value, fieldName, allowedValues) {
  if (allowedValues.indexOf(value) === -1) {
    throw new Error(fieldName + " is invalid");
  }
}

function requireBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw new Error(fieldName + " is invalid");
  }
}

function requireCount(value, fieldName) {
  if (typeof value !== "number" || !isFinite(value) || Math.floor(value) !== value || value < 0) {
    throw new Error(fieldName + " is invalid");
  }

  return value;
}

function sanitizeCell(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmedStart = value.trimStart();
  if (/^[=+\-@]/.test(trimmedStart)) {
    return "'" + value;
  }

  return value;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
