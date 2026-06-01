import { describe, expect, it } from "vitest";
import { createCountdownParts } from "@/lib/countdown";

describe("createCountdownParts", () => {
  it("returns padded Taipei wedding countdown parts before the ceremony", () => {
    const now = new Date("2026-10-02T15:29:30+08:00");
    const target = new Date("2026-10-03T16:30:00+08:00");

    expect(createCountdownParts(target, now)).toEqual({
      days: "01",
      hours: "01",
      minutes: "00",
      seconds: "30",
      isComplete: false
    });
  });

  it("returns zeroed parts after the ceremony starts", () => {
    const now = new Date("2026-10-03T16:30:01+08:00");
    const target = new Date("2026-10-03T16:30:00+08:00");

    expect(createCountdownParts(target, now)).toEqual({
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
      isComplete: true
    });
  });
});
