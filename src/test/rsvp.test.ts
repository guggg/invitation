import { describe, expect, it } from "vitest";
import {
  buildRsvpPayload,
  isLateSubmission,
  parseRsvpForm,
  RSVP_DEADLINE_TAIPEI
} from "@/lib/rsvp";

describe("RSVP deadline", () => {
  it("marks submissions after 2026-07-07 Taipei time as late", () => {
    expect(isLateSubmission(new Date("2026-07-07T15:59:59+08:00"))).toBe(false);
    expect(isLateSubmission(new Date("2026-07-08T00:00:00+08:00"))).toBe(true);
    expect(RSVP_DEADLINE_TAIPEI).toBe("2026-07-07");
  });
});

describe("RSVP form parsing", () => {
  it("accepts regrets without meal and guest details", () => {
    const parsed = parseRsvpForm({
      attendance: "declined",
      name: "王小明",
      phone: "0912345678"
    });

    expect(parsed.attendance).toBe("declined");
    expect(parsed.vegetarianCount).toBe(0);
    expect(parsed.adultCount).toBe(0);
    expect(parsed.childCountUnder4).toBe(0);
    expect(parsed.childCount4to8).toBe(0);
    expect(parsed.needsChildSeat).toBe(false);
    expect(parsed.childSeatCount).toBe(0);
    expect(parsed.attendsCeremony).toBe(false);
    expect(parsed.needsShuttle).toBe(false);
  });

  it("requires attending guests to provide guest counts", () => {
    expect(() =>
      parseRsvpForm({
        attendance: "attending",
        name: "王小明",
        phone: "0912345678"
      })
    ).toThrow(/吃素|大人|小朋友/);
  });

  it("rejects vegetarian count larger than total guest count", () => {
    expect(() =>
      parseRsvpForm({
        attendance: "attending",
        name: "王小明",
        phone: "0912345678",
        vegetarianCount: 3,
        adultCount: 1,
        childCountUnder4: 1,
        childCount4to8: 0
      })
    ).toThrow(/吃素份數不能大於大人與小孩總人數/);
  });

  it("builds an append-only sheet payload with source route and user agent", () => {
    const payload = buildRsvpPayload(
      {
        attendance: "attending",
        name: "Yuan",
        phone: "0912345678",
        vegetarianCount: 2,
        adultCount: 3,
        childCountUnder4: 1,
        childCount4to8: 1,
        needsChildSeat: true,
        childSeatCount: 1,
        attendsCeremony: true,
        needsShuttle: true
      },
      {
        sourceRoute: "/family",
        now: new Date("2026-07-08T09:00:00+08:00"),
        userAgent: "vitest"
      }
    );

    expect(payload).toMatchObject({
      isLate: true,
      sourceRoute: "/family",
      attendance: "attending",
      name: "Yuan",
      phone: "0912345678",
      vegetarianCount: 2,
      adultCount: 3,
      childCountUnder4: 1,
      childCount4to8: 1,
      needsChildSeat: true,
      childSeatCount: 1,
      attendsCeremony: true,
      needsShuttle: true,
      userAgent: "vitest"
    });
    expect(payload.submittedAt).toBe("2026-07-08T01:00:00.000Z");
  });
});
