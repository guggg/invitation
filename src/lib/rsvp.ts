import { z } from "zod";

export const RSVP_DEADLINE_TAIPEI = "2026-07-07";

export type Attendance = "attending" | "declined";
export type SourceRoute = "/" | "/family";

export type RsvpFormData = {
  attendance: Attendance;
  name: string;
  phone: string;
  meatCount: number;
  vegetarianCount: number;
  adultCount: number;
  childCount: number;
  needsChildSeat: boolean;
  childSeatCount: number;
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
  meatCount: countField.optional(),
  vegetarianCount: countField.optional(),
  adultCount: countField.optional(),
  childCount: countField.optional(),
  needsChildSeat: z
    .preprocess((value) => value === true || value === "true" || value === "on", z.boolean())
    .default(false),
  childSeatCount: countField.optional()
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
      meatCount: 0,
      vegetarianCount: 0,
      adultCount: 0,
      childCount: 0,
      needsChildSeat: false,
      childSeatCount: 0
    };
  }

  const missingMessages = [
    data.meatCount === undefined ? "葷食份數" : null,
    data.vegetarianCount === undefined ? "素食份數" : null,
    data.adultCount === undefined ? "大人人數" : null,
    data.childCount === undefined ? "小孩人數" : null
  ].filter(Boolean);

  if (missingMessages.length > 0) {
    throw new Error(`請填寫${missingMessages.join("、")}`);
  }

  const childSeatCount = data.needsChildSeat ? (data.childSeatCount ?? 0) : 0;

  if (data.meatCount! + data.vegetarianCount! < 1) {
    throw new Error("請至少填寫一份葷食或素食");
  }

  if (data.adultCount! + data.childCount! < 1) {
    throw new Error("請至少填寫一位大人或小孩");
  }

  if (data.needsChildSeat && (!childSeatCount || childSeatCount < 1)) {
    throw new Error("請填寫兒童座椅數量");
  }

  return {
    attendance: data.attendance,
    name: data.name,
    phone: data.phone,
    meatCount: data.meatCount!,
    vegetarianCount: data.vegetarianCount!,
    adultCount: data.adultCount!,
    childCount: data.childCount!,
    needsChildSeat: data.needsChildSeat,
    childSeatCount
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
