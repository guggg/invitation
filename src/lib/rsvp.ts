import { z } from "zod";

export const RSVP_DEADLINE_TAIPEI = "2026-07-07";

export type Attendance = "attending" | "declined";
export type SourceRoute = "/" | "/family";

export type RsvpFormData = {
  attendance: Attendance;
  name: string;
  phone: string;
  vegetarianCount: number;
  adultCount: number;
  childCountUnder4: number;
  childCount4to8: number;
  needsChildSeat: boolean;
  childSeatCount: number;
  attendsCeremony: boolean;
  needsShuttle: boolean;
};

export type RsvpPayload = RsvpFormData & {
  sourceRoute: SourceRoute;
  submittedAt: string;
  isLate: boolean;
  userAgent: string;
};

const countField = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return Number(value);
}, z.number().int().min(0));

const rawRsvpSchema = z.object({
  attendance: z.enum(["attending", "declined"]),
  name: z.string().trim().min(1, "請填寫名字"),
  phone: z.string().trim().min(6, "請填寫聯絡電話"),
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
      vegetarianCount: 0,
      adultCount: 0,
      childCountUnder4: 0,
      childCount4to8: 0,
      needsChildSeat: false,
      childSeatCount: 0,
      attendsCeremony: false,
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
  const totalChildCount = data.childCountUnder4! + data.childCount4to8!;

  if (totalGuestCount < 1) {
    throw new Error("請至少填寫一位大人或小孩");
  }

  if (data.vegetarianCount! > totalGuestCount) {
    throw new Error("吃素份數不能大於大人與小孩總人數");
  }

  if (data.needsChildSeat && (!childSeatCount || childSeatCount < 1)) {
    throw new Error("請填寫兒童座椅數量");
  }

  if (childSeatCount > totalChildCount) {
    throw new Error("兒童座椅數量不能大於小朋友總人數");
  }

  return {
    attendance: data.attendance,
    name: data.name,
    phone: data.phone,
    vegetarianCount: data.vegetarianCount!,
    adultCount: data.adultCount!,
    childCountUnder4: data.childCountUnder4!,
    childCount4to8: data.childCount4to8!,
    needsChildSeat: data.needsChildSeat,
    childSeatCount,
    attendsCeremony: data.attendsCeremony,
    needsShuttle: data.needsShuttle
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

  const response = await fetcher(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("送出失敗，請稍後再試");
  }
}
