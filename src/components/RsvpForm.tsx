"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { clsx } from "clsx";
import { Check, Send } from "lucide-react";
import {
  buildRsvpPayload,
  submitRsvp,
  type Attendance,
  type SourceRoute
} from "@/lib/rsvp";

type FormValues = {
  attendance: Attendance;
  name: string;
  phone: string;
  meatCount?: number;
  vegetarianCount?: number;
  adultCount?: number;
  childCount?: number;
  needsChildSeat?: boolean;
  childSeatCount?: number;
  attendsCeremony?: boolean;
  needsShuttle?: boolean;
};

type RsvpFormProps = {
  endpoint: string;
  sourceRoute: SourceRoute;
  variant: "experimental" | "classic";
};

export function RsvpForm({ endpoint, sourceRoute, variant }: RsvpFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const {
    handleSubmit,
    register,
    reset,
    control,
    formState: { isSubmitting }
  } = useForm<FormValues>({
    defaultValues: {
      attendance: "attending",
      meatCount: 1,
      vegetarianCount: 0,
      adultCount: 1,
      childCount: 0,
      needsChildSeat: false,
      childSeatCount: 0,
      attendsCeremony: true,
      needsShuttle: true
    },
    shouldUnregister: true
  });

  const attendance = useWatch({ control, name: "attendance" });
  const needsChildSeat = useWatch({ control, name: "needsChildSeat" });
  const isAttending = attendance === "attending";
  const disabled = !endpoint || isSubmitting || status === "submitting";

  const formTone = useMemo(
    () =>
      variant === "experimental"
        ? "border-[#f2ead7]/30 bg-[#10131d]/75 text-[#f7eddc] shadow-[0_32px_90px_rgba(0,0,0,0.28)]"
        : "border-[#c8a45d]/35 bg-[#fff8ec] text-[#800020] shadow-[0_18px_50px_rgba(128,0,32,0.12)]",
    [variant]
  );

  async function onSubmit(values: FormValues) {
    setStatus("submitting");
    setMessage("");

    try {
      const payload = buildRsvpPayload(values, {
        sourceRoute,
        userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent
      });

      await submitRsvp(endpoint, payload);
      setStatus("success");
      setMessage(payload.isLate ? "已收到回覆。提醒：這筆回覆已超過出席回覆截止日。" : "已收到回覆，謝謝你。");
      reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "送出失敗，請稍後再試");
    }
  }

  return (
    <form
      className={clsx("rsvp-form rounded-[8px] border p-5 sm:p-7", formTone)}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="rsvp-choice" role="radiogroup" aria-label="出席意願">
        <label>
          <input type="radio" value="attending" {...register("attendance")} />
          <span>出席</span>
        </label>
        <label>
          <input type="radio" value="declined" {...register("attendance")} />
          <span>不克出席</span>
        </label>
      </div>

      <div className="form-grid">
        <label>
          <span>名字</span>
          <input autoComplete="name" placeholder="請輸入姓名" {...register("name", { required: true })} />
        </label>
        <label>
          <span>聯絡電話</span>
          <input
            autoComplete="tel"
            inputMode="tel"
            placeholder="0912 345 678"
            {...register("phone", { required: true })}
          />
        </label>
      </div>

      {isAttending ? (
        <>
          <div className="form-grid compact">
            <NumberField label="葷食份數" registration={register("meatCount", { valueAsNumber: true })} />
            <NumberField label="素食份數" registration={register("vegetarianCount", { valueAsNumber: true })} />
            <NumberField label="大人人數" registration={register("adultCount", { valueAsNumber: true })} />
            <NumberField label="小孩人數" registration={register("childCount", { valueAsNumber: true })} />
          </div>

          <label className="child-seat-toggle">
            <input type="checkbox" {...register("needsChildSeat")} />
            <span>需要兒童座椅</span>
          </label>

          {needsChildSeat ? (
            <div className="form-grid compact">
              <NumberField label="兒童座椅數量" registration={register("childSeatCount", { valueAsNumber: true })} />
            </div>
          ) : null}

          <div className="rsvp-option-grid">
            <label className="child-seat-toggle">
              <input type="checkbox" {...register("attendsCeremony")} />
              <span>參加證婚</span>
            </label>
            <label className="child-seat-toggle">
              <input type="checkbox" {...register("needsShuttle")} />
              <span>搭乘接駁車（推薦搭乘）</span>
            </label>
          </div>
        </>
      ) : null}

      {!endpoint ? <p className="form-note">出席回覆尚未開放，請稍後再回來填寫。</p> : null}

      {message ? (
        <p className={clsx("form-message", status === "success" ? "success" : "error")} role="status">
          {status === "success" ? <Check size={18} aria-hidden="true" /> : null}
          {message}
        </p>
      ) : null}

      <button className="rsvp-submit" type="submit" disabled={disabled}>
        {endpoint ? <Send size={18} aria-hidden="true" /> : null}
        {!endpoint ? "出席回覆尚未開放" : isSubmitting || status === "submitting" ? "送出中" : "送出回覆"}
      </button>
    </form>
  );
}

type NumberFieldProps = {
  label: string;
  registration: UseFormRegisterReturn;
};

function NumberField({ label, registration }: NumberFieldProps) {
  return (
    <label>
      <span>{label}</span>
      <input inputMode="numeric" min={0} type="number" {...registration} />
    </label>
  );
}
