import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

type AppsScriptHarness = {
  appendRows: unknown[][];
  doPost: (event: { postData: { contents: string } }) => { content: string };
};

type AppsScriptSandbox = {
  SpreadsheetApp: unknown;
  ContentService: unknown;
  PropertiesService: unknown;
  doPost?: AppsScriptHarness["doPost"];
};

function loadAppsScript(expectedToken = ""): AppsScriptHarness {
  const appendRows: unknown[][] = [];
  const sheet = {
    appendRow: (row: unknown[]) => appendRows.push(row),
    getRange: () => ({
      getValues: () => [
        [
          "submittedAt",
          "isLate",
          "sourceRoute",
          "attendance",
          "name",
          "phone",
          "guestSide",
          "needsPhysicalInvitation",
          "physicalInvitationAddress",
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
        ]
      ],
      setValues: () => undefined
    })
  };
  const sandbox: AppsScriptSandbox = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: () => sheet,
        insertSheet: () => sheet
      })
    },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (content: string) => ({
        content,
        setMimeType() {
          return this;
        }
      })
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key: string) => (key === "RSVP_TOKEN" ? expectedToken : "")
      })
    }
  };

  vm.runInNewContext(readFileSync("apps-script/Code.gs", "utf8"), sandbox);

  if (!sandbox.doPost) {
    throw new Error("Apps Script doPost was not loaded");
  }

  return { appendRows, doPost: sandbox.doPost };
}

describe("Apps Script RSVP receiver", () => {
  it("rejects invalid direct posts before writing to the sheet", () => {
    const { appendRows, doPost } = loadAppsScript();
    const response = JSON.parse(
      doPost({
        postData: {
          contents: JSON.stringify({
            attendance: "attending",
            name: "Spam",
            phone: "not-a-phone",
            adultCount: 0,
            childCountUnder4: 0,
            childCount4to8: 0
          })
        }
      }).content
    );

    expect(response.ok).toBe(false);
    expect(appendRows).toHaveLength(0);
  });

  it("rejects direct posts without the configured RSVP token", () => {
    const { appendRows, doPost } = loadAppsScript("shared-secret");
    const response = JSON.parse(
      doPost({
        postData: {
          contents: JSON.stringify({
            submittedAt: "2026-07-01T00:00:00.000Z",
            isLate: false,
            sourceRoute: "/",
            attendance: "declined",
            name: "王小明",
            phone: "0912345678",
            guestSide: "groom",
            needsPhysicalInvitation: false
          })
        }
      }).content
    );

    expect(response.ok).toBe(false);
    expect(appendRows).toHaveLength(0);
  });

  it("escapes formula-like cell values before appending", () => {
    const { appendRows, doPost } = loadAppsScript();
    const response = JSON.parse(
      doPost({
        postData: {
          contents: JSON.stringify({
            submittedAt: "2026-07-01T00:00:00.000Z",
            isLate: false,
            sourceRoute: "/",
            attendance: "declined",
            name: "=IMPORTXML(\"https://example.com\")",
            phone: "0912345678",
            guestSide: "bride",
            needsPhysicalInvitation: true,
            userAgent: "+agent"
          })
        }
      }).content
    );

    expect(response.ok).toBe(true);
    expect(appendRows).toHaveLength(1);
    expect(appendRows[0][4]).toBe("'=IMPORTXML(\"https://example.com\")");
    expect(appendRows[0][6]).toBe("bride");
    expect(appendRows[0][7]).toBe(true);
    expect(appendRows[0][21]).toBe("'+agent");
  });
});
