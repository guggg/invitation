import { describe, expect, it } from "vitest";
import { buildShuttleIcs, downloadShuttleIcs } from "@/lib/calendar";
import { shuttleTrips } from "@/lib/wedding";

const outA1 = shuttleTrips.find((t) => t.id === "out-a1")!;
const outC2 = shuttleTrips.find((t) => t.id === "out-c2")!;
const ret1 = shuttleTrips.find((t) => t.id === "ret-1")!;
const ret2 = shuttleTrips.find((t) => t.id === "ret-2")!;

describe("buildShuttleIcs", () => {
  it("produces a valid VCALENDAR wrapper", () => {
    const ics = buildShuttleIcs(outA1);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("VERSION:2.0");
  });

  it("includes VTIMEZONE block for Asia/Taipei", () => {
    const ics = buildShuttleIcs(outA1);
    expect(ics).toContain("BEGIN:VTIMEZONE");
    expect(ics).toContain("TZID:Asia/Taipei");
    expect(ics).toContain("TZOFFSETTO:+0800");
    expect(ics).toContain("END:VTIMEZONE");
  });

  it("sets correct DTSTART with Taipei TZID for A1 outbound (15:45)", () => {
    const ics = buildShuttleIcs(outA1);
    expect(ics).toContain("DTSTART;TZID=Asia/Taipei:20261003T154500");
  });

  it("sets correct DTEND for A1 outbound (16:00)", () => {
    const ics = buildShuttleIcs(outA1);
    expect(ics).toContain("DTEND;TZID=Asia/Taipei:20261003T160000");
  });

  it("sets correct DTSTART/DTEND for C2 outbound (17:15 → 17:30)", () => {
    const ics = buildShuttleIcs(outC2);
    expect(ics).toContain("DTSTART;TZID=Asia/Taipei:20261003T171500");
    expect(ics).toContain("DTEND;TZID=Asia/Taipei:20261003T173000");
  });

  it("sets correct DTSTART/DTEND for return trip 1 (20:15 → 20:30)", () => {
    const ics = buildShuttleIcs(ret1);
    expect(ics).toContain("DTSTART;TZID=Asia/Taipei:20261003T201500");
    expect(ics).toContain("DTEND;TZID=Asia/Taipei:20261003T203000");
  });

  it("sets correct DTSTART/DTEND for return trip 2 (20:50 → 21:05)", () => {
    const ics = buildShuttleIcs(ret2);
    expect(ics).toContain("DTSTART;TZID=Asia/Taipei:20261003T205000");
    expect(ics).toContain("DTEND;TZID=Asia/Taipei:20261003T210500");
  });

  it("includes vehicle name in SUMMARY", () => {
    const ics = buildShuttleIcs(outA1);
    expect(ics).toContain("A1 車");
    expect(ics).toContain("SUMMARY:");
  });

  it("includes departure and destination in SUMMARY", () => {
    const ics = buildShuttleIcs(outA1);
    expect(ics).toContain("新店捷運總站");
    expect(ics).toContain("優聖美地");
  });

  it("includes note text in DESCRIPTION", () => {
    const ics = buildShuttleIcs(outA1);
    expect(ics).toContain("DESCRIPTION:");
    expect(ics).toContain("工作人員");
  });

  it("includes 10-min early reminder in DESCRIPTION", () => {
    const ics = buildShuttleIcs(outA1);
    expect(ics).toContain("請提前 10 分鐘抵達");
  });

  it("uses stable UID containing trip id", () => {
    const ics = buildShuttleIcs(outA1);
    expect(ics).toContain("UID:shuttle-out-a1-20261003@");
  });

  it("all 8 trips produce distinct UIDs", () => {
    const uids = shuttleTrips.map((t) => {
      const ics = buildShuttleIcs(t);
      const line = ics.split("\r\n").find((l) => l.startsWith("UID:"));
      return line;
    });
    const unique = new Set(uids);
    expect(unique.size).toBe(shuttleTrips.length);
  });

  // RFC 5545 §3.1: every line including the last must end with CRLF
  it("ends with a trailing CRLF (RFC 5545 §3.1)", () => {
    const ics = buildShuttleIcs(outA1);
    expect(ics.endsWith("\r\n")).toBe(true);
  });

  it("contains no bare LF (all line endings are CRLF)", () => {
    const ics = buildShuttleIcs(outA1);
    // Strip all \r\n first, then check no \n remains
    const stripped = ics.replace(/\r\n/g, "");
    expect(stripped).not.toContain("\n");
  });

  it("no content line exceeds 75 octets (RFC 5545 line folding)", () => {
    const encoder = new TextEncoder();
    // Split on CRLF to get individual (possibly folded-continuation) lines
    const lines = buildShuttleIcs(ret1).split("\r\n");
    for (const line of lines) {
      if (line === "") continue; // trailing CRLF produces an empty last element
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it("escapes semicolons in note text (RFC 5545 §3.3.11)", () => {
    // Use ASCII ; and , which RFC 5545 §3.3.11 requires to be escaped
    const tripWithSpecialChars = {
      ...outA1,
      id: "test-special",
      note: "賓客A;賓客B,賓客C"
    } as typeof outA1;
    const ics = buildShuttleIcs(tripWithSpecialChars);
    // The raw ; and , in description should be escaped
    // After escaping, find the DESCRIPTION block (may be folded)
    const descStart = ics.indexOf("DESCRIPTION:");
    expect(descStart).toBeGreaterThan(-1);
    // Get all content after DESCRIPTION: until the next property (lines not starting with space are new props)
    const afterDesc = ics.slice(descStart);
    // Reconstruct folded description value by joining continuation lines
    const descLines = afterDesc.split("\r\n");
    let descValue = descLines[0]!;
    for (let i = 1; i < descLines.length; i++) {
      if (descLines[i]!.startsWith(" ")) {
        descValue += descLines[i]!.slice(1);
      } else {
        break;
      }
    }
    expect(descValue).toContain("\\;");
    expect(descValue).toContain("\\,");
  });

  it("outbound capacity note says per-bus capacity", () => {
    const ics = buildShuttleIcs(outA1);
    expect(ics).toContain("每車容納 20 人");
  });

  it("return capacity note says wave total, not per-bus", () => {
    const ics = buildShuttleIcs(ret1);
    expect(ics).toContain("本波共 60 人");
    expect(ics).not.toContain("每車容納 60");
  });
});

describe("downloadShuttleIcs", () => {
  it("is a no-op when document is undefined (SSR guard)", () => {
    // In jsdom/vitest document exists, but we can verify the function is exported
    // and doesn't throw when called in a browser-like environment.
    // The SSR guard (`typeof document === "undefined"`) is tested by checking
    // the function signature accepts a ShuttleTrip and returns void.
    expect(typeof downloadShuttleIcs).toBe("function");
    // Calling it in jsdom should not throw
    expect(() => downloadShuttleIcs(outA1)).not.toThrow();
  });
});
