import { z } from "zod";

export const RSVP_DEADLINE_TAIPEI = "2026-07-07";

export type Attendance = "attending" | "declined";
export type SourceRoute = "/" | "/family";
export type TransportMode = "shuttle" | "self-arranged" | "";
export type SelfTransportMode = "drive" | "taxi" | "";

export type RsvpFormData = {
  attendance: Attendance;
  name: string;
  phone: string;
  needsPhysicalInvitation: boolean;
  vegetarianCount: number;
  adultCount: number;
  childCountUnder4: number;
  childCount4to8: number;
  needsChildSeat: boolean;
  childSeatCount: number;
  attendsCeremony: boolean;
  transportMode: TransportMode;
  selfTransportMode: SelfTransportMode;
  shuttleOutboundCount: number;
  shuttleReturnCount: number;
  needsShuttle: boolean;
};

export type RsvpPayload = RsvpFormData & {
  sourceRoute: SourceRoute;
  submittedAt: string;
  isLate: boolean;
  userAgent: string;
};

const TAIWAN_MOBILE_REGEX = /^09\d{8}$/;

export function normalizePhoneNumber(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function formatPhoneInput(value: string): string {
  const digits = normalizePhoneNumber(value);
  const first = digits.slice(0, 4);
  const second = digits.slice(4, 7);
  const third = digits.slice(7, 10);

  return [first, second, third].filter(Boolean).join(" ");
}

export function isValidTaiwanMobilePhone(value: string): boolean {
  return TAIWAN_MOBILE_REGEX.test(normalizePhoneNumber(value));
}

const countField = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return Number(value);
}, z.number().int().min(0));

const rawRsvpSchema = z.object({
  attendance: z.enum(["attending", "declined"]),
  name: z.string().trim().min(1, "請填寫名字"),
  phone: z
    .string()
    .trim()
    .min(1, "請填寫聯絡電話")
    .refine(isValidTaiwanMobilePhone, "請填寫正確手機號碼")
    .transform(normalizePhoneNumber),
  needsPhysicalInvitation: z
    .preprocess((value) => value === true || value === "true" || value === "on", z.boolean())
    .default(false),
  vegetarianCount: countField.optional(),
  adultCount: countField.optional(),
  childCountUnder4: countField.optional(),
  childCount4to8: countField.optional(),
  needsChildSeat: z
    .preprocess((value) => value === true || value === "true" || value === "on", z.boolean())
    .default(false),
  childSeatCount: countField.optional(),
  attendsCeremony: z
    .preprocess((value) => value === true || value === "true" || value === "on", z.boolean())
    .default(true),
  transportMode: z.enum(["shuttle", "self-arranged", ""]).default("shuttle"),
  selfTransportMode: z.enum(["drive", "taxi", ""]).default(""),
  shuttleOutboundCount: countField.optional(),
  shuttleReturnCount: countField.optional(),
  needsShuttle: z
    .preprocess((value) => value === true || value === "true" || value === "on", z.boolean())
    .default(true)
});

export function isLateSubmission(now: Date): boolean {
  const deadlineEnd = new Date(`${RSVP_DEADLINE_TAIPEI}T23:59:59.999+08:00`).getTime();
  return now.getTime() > deadlineEnd;
}

export function parseRsvpForm(input: unknown): RsvpFormData {
  const parsed = rawRsvpSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("、"));
  }

  const data = parsed.data;

  if (data.attendance === "declined") {
    return {
      attendance: data.attendance,
      name: data.name,
      phone: data.phone,
      needsPhysicalInvitation: data.needsPhysicalInvitation,
      vegetarianCount: 0,
      adultCount: 0,
      childCountUnder4: 0,
      childCount4to8: 0,
      needsChildSeat: false,
      childSeatCount: 0,
      attendsCeremony: false,
      transportMode: "",
      selfTransportMode: "",
      shuttleOutboundCount: 0,
      shuttleReturnCount: 0,
      needsShuttle: false
    };
  }

  const missingMessages = [
    data.vegetarianCount === undefined ? "吃素份數" : null,
    data.adultCount === undefined ? "大人人數" : null,
    data.childCountUnder4 === undefined ? "0-4 歲小朋友人數" : null,
    data.childCount4to8 === undefined ? "4-8 歲小朋友人數" : null
  ].filter(Boolean);

  if (missingMessages.length > 0) {
    throw new Error(`請填寫${missingMessages.join("、")}`);
  }

  const childSeatCount = data.needsChildSeat ? (data.childSeatCount ?? 0) : 0;
  const totalGuestCount = data.adultCount! + data.childCountUnder4! + data.childCount4to8!;
  const shuttleOutboundCount = data.transportMode === "shuttle" ? (data.shuttleOutboundCount ?? 0) : 0;
  const shuttleReturnCount = data.transportMode === "shuttle" ? (data.shuttleReturnCount ?? 0) : 0;
  const selfTransportMode = data.transportMode === "self-arranged" ? data.selfTransportMode : "";

  if (totalGuestCount < 1) {
    throw new Error("請至少填寫一位大人或小孩");
  }

  if (data.vegetarianCount! > totalGuestCount) {
    throw new Error("吃素份數不能大於大人與小孩總人數");
  }

  if (data.needsChildSeat && (!childSeatCount || childSeatCount < 1)) {
    throw new Error("請填寫兒童座椅數量");
  }

  if (childSeatCount > data.childCountUnder4!) {
    throw new Error("兒童座椅數量不能大於 0-4 歲小朋友人數");
  }

  if (data.transportMode === "shuttle" && shuttleOutboundCount + shuttleReturnCount < 1) {
    throw new Error("若搭乘接駁車，請至少填寫去程或回程人數");
  }

  if (shuttleOutboundCount > totalGuestCount || shuttleReturnCount > totalGuestCount) {
    throw new Error("接駁車人數不能大於大人與小孩總人數");
  }

  if (!data.transportMode) {
    throw new Error("請選擇交通方式");
  }

  if (data.transportMode === "self-arranged" && !selfTransportMode) {
    throw new Error("請選擇自行前往方式");
  }

  return {
    attendance: data.attendance,
    name: data.name,
    phone: data.phone,
    needsPhysicalInvitation: data.needsPhysicalInvitation,
    vegetarianCount: data.vegetarianCount!,
    adultCount: data.adultCount!,
    childCountUnder4: data.childCountUnder4!,
    childCount4to8: data.childCount4to8!,
    needsChildSeat: data.needsChildSeat,
    childSeatCount,
    attendsCeremony: data.attendsCeremony,
    transportMode: data.transportMode,
    selfTransportMode,
    shuttleOutboundCount,
    shuttleReturnCount,
    needsShuttle: data.transportMode === "shuttle"
  };
}

export function buildRsvpPayload(
  formData: unknown,
  options: {
    sourceRoute: SourceRoute;
    now?: Date;
    userAgent?: string;
  }
): RsvpPayload {
  const now = options.now ?? new Date();
  const parsed = parseRsvpForm(formData);

  return {
    ...parsed,
    sourceRoute: options.sourceRoute,
    submittedAt: now.toISOString(),
    isLate: isLateSubmission(now),
    userAgent: options.userAgent ?? ""
  };
}

export async function submitRsvp(
  endpoint: string,
  payload: RsvpPayload,
  fetcher: typeof fetch = fetch
): Promise<void> {
  if (!endpoint) {
    throw new Error("出席回覆尚未開放，請稍後再試");
  }

  const rsvpToken = process.env.NEXT_PUBLIC_RSVP_TOKEN;
  const body = rsvpToken ? { ...payload, rsvpToken } : payload;

  const response = await fetcher(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error("送出失敗，請稍後再試");
  }

  const result = await response
    .json()
    .catch(() => null) as { ok?: boolean; error?: string } | null;

  if (result?.ok === false) {
    throw new Error(result.error || "送出失敗，請稍後再試");
  }
}
