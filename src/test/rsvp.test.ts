import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildRsvpPayload,
  formatPhoneInput,
  isLateSubmission,
  isValidTaiwanMobilePhone,
  normalizePhoneNumber,
  parseRsvpForm,
  RSVP_DEADLINE_TAIPEI,
  submitRsvp
} from "@/lib/rsvp";

afterEach(() => {
  vi.unstubAllEnvs();
});

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
      phone: "0912 345 678"
    });

    expect(parsed.attendance).toBe("declined");
    expect(parsed.needsPhysicalInvitation).toBe(false);
    expect(parsed.vegetarianCount).toBe(0);
    expect(parsed.adultCount).toBe(0);
    expect(parsed.childCountUnder4).toBe(0);
    expect(parsed.childCount4to8).toBe(0);
    expect(parsed.needsChildSeat).toBe(false);
    expect(parsed.childSeatCount).toBe(0);
    expect(parsed.attendsCeremony).toBe(false);
    expect(parsed.transportMode).toBe("");
    expect(parsed.selfTransportMode).toBe("");
    expect(parsed.shuttleOutboundCount).toBe(0);
    expect(parsed.shuttleReturnCount).toBe(0);
    expect(parsed.needsShuttle).toBe(false);
  });

  it("requires attending guests to provide guest counts", () => {
    expect(() =>
      parseRsvpForm({
        attendance: "attending",
        name: "王小明",
        phone: "0912 345 678"
      })
    ).toThrow(/吃素|大人|小朋友/);
  });

  it("accepts spaced phone input and normalizes it", () => {
    const parsed = parseRsvpForm({
      attendance: "declined",
      name: "王小明",
      phone: "0912 345 678"
    });

    expect(parsed.phone).toBe("0912345678");
  });

  it("rejects invalid phone formats", () => {
    expect(() =>
      parseRsvpForm({
        attendance: "declined",
        name: "王小明",
        phone: "0812 345 678"
      })
    ).toThrow(/請填寫正確手機號碼/);
  });

  it("rejects vegetarian count larger than total guest count", () => {
    expect(() =>
      parseRsvpForm({
        attendance: "attending",
        name: "王小明",
        phone: "0912 345 678",
        vegetarianCount: 3,
        adultCount: 1,
        childCountUnder4: 1,
        childCount4to8: 0,
        transportMode: "shuttle",
        shuttleOutboundCount: 1,
        shuttleReturnCount: 1
      })
    ).toThrow(/吃素份數不能大於大人與小孩總人數/);
  });

  it("rejects child seat count larger than 0-4 child count", () => {
    expect(() =>
      parseRsvpForm({
        attendance: "attending",
        name: "王小明",
        phone: "0912 345 678",
        vegetarianCount: 0,
        adultCount: 2,
        childCountUnder4: 1,
        childCount4to8: 1,
        needsChildSeat: true,
        childSeatCount: 2,
        transportMode: "shuttle",
        shuttleOutboundCount: 2,
        shuttleReturnCount: 2
      })
    ).toThrow(/兒童座椅數量不能大於 0-4 歲小朋友人數/);
  });

  it("requires self-arranged guests to specify whether they drive or take a car service", () => {
    expect(() =>
      parseRsvpForm({
        attendance: "attending",
        name: "王小明",
        phone: "0912 345 678",
        vegetarianCount: 1,
        adultCount: 1,
        childCountUnder4: 0,
        childCount4to8: 0,
        transportMode: "self-arranged"
      })
    ).toThrow(/請選擇自行前往方式/);
  });

  it("requires shuttle guests to provide at least one seat count", () => {
    expect(() =>
      parseRsvpForm({
        attendance: "attending",
        name: "王小明",
        phone: "0912 345 678",
        vegetarianCount: 1,
        adultCount: 1,
        childCountUnder4: 0,
        childCount4to8: 0,
        transportMode: "shuttle",
        shuttleOutboundCount: 0,
        shuttleReturnCount: 0
      })
    ).toThrow(/至少填寫去程或回程人數/);
  });

  it("builds an append-only sheet payload with source route and user agent", () => {
    const payload = buildRsvpPayload(
      {
        attendance: "attending",
        name: "Yuan",
        phone: "0912 345 678",
        needsPhysicalInvitation: true,
        vegetarianCount: 2,
        adultCount: 3,
        childCountUnder4: 1,
        childCount4to8: 1,
        needsChildSeat: true,
        childSeatCount: 1,
        attendsCeremony: true,
        transportMode: "shuttle",
        shuttleOutboundCount: 3,
        shuttleReturnCount: 2
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
      needsPhysicalInvitation: true,
      vegetarianCount: 2,
      adultCount: 3,
      childCountUnder4: 1,
      childCount4to8: 1,
      needsChildSeat: true,
      childSeatCount: 1,
      attendsCeremony: true,
      transportMode: "shuttle",
      selfTransportMode: "",
      shuttleOutboundCount: 3,
      shuttleReturnCount: 2,
      needsShuttle: true,
      userAgent: "vitest"
    });
    expect(payload.submittedAt).toBe("2026-07-08T01:00:00.000Z");
  });

  it("formats and validates Taiwan mobile numbers", () => {
    expect(formatPhoneInput("0912345678")).toBe("0912 345 678");
    expect(normalizePhoneNumber("0912 345 678")).toBe("0912345678");
    expect(isValidTaiwanMobilePhone("0912 345 678")).toBe(true);
    expect(isValidTaiwanMobilePhone("1234567890")).toBe(false);
  });
});

describe("RSVP submission", () => {
  it("rejects Apps Script JSON failures even when HTTP status is successful", async () => {
    const payload = buildRsvpPayload(
      {
        attendance: "declined",
        name: "王小明",
        phone: "0912 345 678"
      },
      { sourceRoute: "/" }
    );
    const fetcher = async () =>
      ({
        ok: true,
        json: async () => ({ ok: false, error: "Sheet append failed" })
      }) as Response;

    await expect(submitRsvp("https://example.com", payload, fetcher as typeof fetch)).rejects.toThrow(
      "Sheet append failed"
    );
  });

  it("includes the configured RSVP token without storing it in the sheet payload type", async () => {
    vi.stubEnv("NEXT_PUBLIC_RSVP_TOKEN", "shared-secret");
    const payload = buildRsvpPayload(
      {
        attendance: "declined",
        name: "王小明",
        phone: "0912 345 678"
      },
      { sourceRoute: "/" }
    );
    const fetcher = vi.fn(
      async (...args: Parameters<typeof fetch>) => {
        void args;
        return { ok: true, json: async () => ({ ok: true }) } as Response;
      }
    );

    await submitRsvp("https://example.com", payload, fetcher as typeof fetch);

    const [, request] = fetcher.mock.calls[0];
    expect(JSON.parse((request as RequestInit).body as string)).toMatchObject({
      name: "王小明",
      rsvpToken: "shared-secret"
    });
  });
});
