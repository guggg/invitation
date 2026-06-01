const SHEET_NAME = "RSVP";
const HEADERS = [
  "submittedAt",
  "isLate",
  "sourceRoute",
  "attendance",
  "name",
  "phone",
  "meatCount",
  "vegetarianCount",
  "adultCount",
  "childCount",
  "needsChildSeat",
  "childSeatCount",
  "attendsCeremony",
  "needsShuttle",
  "userAgent"
];

function doGet() {
  return jsonResponse({ ok: true, service: "4J & Yuan RSVP" });
}

function doPost(e) {
  try {
    const payload = JSON.parse((e.postData && e.postData.contents) || "{}");
    const sheet = getSheet();
    ensureHeaders(sheet);
    sheet.appendRow(HEADERS.map((header) => payload[header] ?? ""));
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

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
