"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { clsx } from "clsx";
import { Check, Minus, Plus, Send } from "lucide-react";
import {
  buildRsvpPayload,
  formatPhoneInput,
  submitRsvp,
  type Attendance,
  type GuestSide,
  type SelfTransportMode,
  type SourceRoute
} from "@/lib/rsvp";

type FormValues = {
  attendance: Attendance;
  name: string;
  phone: string;
  guestSide: GuestSide | "";
  needsPhysicalInvitation?: boolean;
  physicalInvitationAddress?: string;
  vegetarianCount?: number;
  adultCount?: number;
  childCountUnder4?: number;
  childCount4to8?: number;
  needsChildSeat?: boolean;
  childSeatCount?: number;
  attendsCeremony?: boolean;
  transportMode?: "shuttle" | "self-arranged" | "";
  selfTransportMode?: SelfTransportMode;
  shuttleOutboundCount?: number;
  shuttleReturnCount?: number;
};

type RsvpFormProps = {
  endpoint: string;
  sourceRoute: SourceRoute;
  variant: "experimental" | "classic";
};

type CountFieldName =
  | "vegetarianCount"
  | "adultCount"
  | "childCountUnder4"
  | "childCount4to8"
  | "childSeatCount"
  | "shuttleOutboundCount"
  | "shuttleReturnCount";

export function RsvpForm({ endpoint, sourceRoute, variant }: RsvpFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const {
    handleSubmit,
    register,
    reset,
    setValue,
    control,
    formState: { isSubmitting }
  } = useForm<FormValues>({
    defaultValues: {
      attendance: "attending",
      guestSide: "",
      needsPhysicalInvitation: false,
      physicalInvitationAddress: "",
      vegetarianCount: 0,
      adultCount: 1,
      childCountUnder4: 0,
      childCount4to8: 0,
      needsChildSeat: false,
      childSeatCount: 0,
      attendsCeremony: true,
      transportMode: "shuttle",
      selfTransportMode: "",
      shuttleOutboundCount: 0,
      shuttleReturnCount: 0
    },
    shouldUnregister: true
  });

  const attendance = useWatch({ control, name: "attendance" });
  const needsChildSeat = useWatch({ control, name: "needsChildSeat" });
  const needsPhysicalInvitation = useWatch({ control, name: "needsPhysicalInvitation" });
  const transportMode = useWatch({ control, name: "transportMode" });
  const adultCount = numberOrZero(useWatch({ control, name: "adultCount" }));
  const childCountUnder4 = numberOrZero(useWatch({ control, name: "childCountUnder4" }));
  const childCount4to8 = numberOrZero(useWatch({ control, name: "childCount4to8" }));
  const vegetarianCount = numberOrZero(useWatch({ control, name: "vegetarianCount" }));
  const childSeatCount = numberOrZero(useWatch({ control, name: "childSeatCount" }));
  const shuttleOutboundCount = numberOrZero(useWatch({ control, name: "shuttleOutboundCount" }));
  const shuttleReturnCount = numberOrZero(useWatch({ control, name: "shuttleReturnCount" }));
  const isAttending = attendance === "attending";
  const disabled = !endpoint || isSubmitting || status === "submitting";
  const totalGuestCount = adultCount + childCountUnder4 + childCount4to8;

  const formTone = useMemo(
    () =>
      variant === "experimental"
        ? "border-[#f2ead7]/30 bg-[#10131d]/75 text-[#f7eddc] shadow-[0_32px_90px_rgba(0,0,0,0.28)]"
        : "border-[#c8a45d]/35 bg-[#fff8ec] text-[#800020] shadow-[0_18px_50px_rgba(128,0,32,0.12)]",
    [variant]
  );

  useEffect(() => {
    if (vegetarianCount > totalGuestCount) {
      setValue("vegetarianCount", totalGuestCount, { shouldDirty: true, shouldValidate: true });
    }

    if (childSeatCount > childCountUnder4) {
      setValue("childSeatCount", childCountUnder4, { shouldDirty: true, shouldValidate: true });
    }

    if (transportMode === "shuttle") {
      if (shuttleOutboundCount > totalGuestCount) {
        setValue("shuttleOutboundCount", totalGuestCount, { shouldDirty: true, shouldValidate: true });
      }

      if (shuttleReturnCount > totalGuestCount) {
        setValue("shuttleReturnCount", totalGuestCount, { shouldDirty: true, shouldValidate: true });
      }
    }
  }, [
    childCountUnder4,
    childSeatCount,
    setValue,
    shuttleOutboundCount,
    shuttleReturnCount,
    totalGuestCount,
    transportMode,
    vegetarianCount
  ]);

  function updateCount(field: CountFieldName, delta: number, max?: number) {
    const current = getCountValue(field);
    const next = Math.max(0, max === undefined ? current + delta : Math.min(max, current + delta));
    setValue(field, next, { shouldDirty: true, shouldValidate: true });
  }

  function getCountValue(field: CountFieldName): number {
    const values = {
      vegetarianCount,
      adultCount,
      childCountUnder4,
      childCount4to8,
      childSeatCount,
      shuttleOutboundCount,
      shuttleReturnCount
    };

    return values[field];
  }

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
      <input type="hidden" {...register("adultCount", { valueAsNumber: true })} />
      <input type="hidden" {...register("childCountUnder4", { valueAsNumber: true })} />
      <input type="hidden" {...register("childCount4to8", { valueAsNumber: true })} />
      <input type="hidden" {...register("vegetarianCount", { valueAsNumber: true })} />
      <input type="hidden" {...register("childSeatCount", { valueAsNumber: true })} />
      <input type="hidden" {...register("shuttleOutboundCount", { valueAsNumber: true })} />
      <input type="hidden" {...register("shuttleReturnCount", { valueAsNumber: true })} />

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
            {...register("phone", {
              required: true,
              onChange: (event) => {
                event.target.value = formatPhoneInput(event.target.value);
              }
            })}
          />
        </label>
      </div>

      <div className="rsvp-option-grid" role="radiogroup" aria-label="親友來源">
        <label className="child-seat-toggle">
          <input type="radio" value="groom" {...register("guestSide")} />
          <span>男方親友</span>
        </label>
        <label className="child-seat-toggle">
          <input type="radio" value="bride" {...register("guestSide")} />
          <span>女方親友</span>
        </label>
      </div>

      {isAttending ? (
        <>
          <label className="child-seat-toggle rsvp-physical-invite-toggle">
            <input type="checkbox" {...register("needsPhysicalInvitation")} />
            <span>需要實體喜帖</span>
          </label>
          {needsPhysicalInvitation ? (
            <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <label htmlFor="rsvp-address">
                <span>喜帖寄送地址</span>
                <input
                  id="rsvp-address"
                  autoComplete="street-address"
                  placeholder="請輸入寄送地址"
                  {...register("physicalInvitationAddress", { required: !!needsPhysicalInvitation })}
                />
              </label>
            </div>
          ) : null}
          <div className="form-grid compact rsvp-count-grid !grid-cols-2 max-[560px]:!grid-cols-1">
            <NumberField label="大人人數" value={adultCount} variant={variant} onMinus={() => updateCount("adultCount", -1)} onPlus={() => updateCount("adultCount", 1)} />
            <NumberField label="0-4 歲人數" value={childCountUnder4} variant={variant} onMinus={() => updateCount("childCountUnder4", -1)} onPlus={() => updateCount("childCountUnder4", 1)} />
            <NumberField label="4-8 歲人數" value={childCount4to8} variant={variant} onMinus={() => updateCount("childCount4to8", -1)} onPlus={() => updateCount("childCount4to8", 1)} />
            <NumberField label="吃素份數" value={vegetarianCount} variant={variant} max={totalGuestCount} onMinus={() => updateCount("vegetarianCount", -1, totalGuestCount)} onPlus={() => updateCount("vegetarianCount", 1, totalGuestCount)} />
          </div>

          <label className="child-seat-toggle">
            <input type="checkbox" {...register("needsChildSeat")} />
            <span>需要兒童座椅</span>
          </label>

          {needsChildSeat ? (
            <div className="form-grid compact rsvp-count-grid !grid-cols-2 max-[560px]:!grid-cols-1">
              <NumberField label="兒童座椅數量" value={childSeatCount} variant={variant} max={childCountUnder4} onMinus={() => updateCount("childSeatCount", -1, childCountUnder4)} onPlus={() => updateCount("childSeatCount", 1, childCountUnder4)} />
            </div>
          ) : null}

          <div className="rsvp-transport-callout">
            <strong>交通提醒</strong>
            <p>場地位於山區，沿途山路較蜿蜒，現場停車位也非常有限。如果方便的話，真心推薦優先搭乘接駁車，會比自行找車位輕鬆很多。</p>
          </div>

          <div className="rsvp-transport-choice" role="radiogroup" aria-label="交通方式">
            <label className={transportMode === "shuttle" ? "is-active" : undefined}>
              <input type="radio" value="shuttle" {...register("transportMode")} />
              <span>強烈推薦：搭乘接駁車</span>
              <small>免找車位、上下山更輕鬆、也更適合和親友一起抵達</small>
            </label>
            <label className={transportMode === "self-arranged" ? "is-active" : undefined}>
              <input type="radio" value="self-arranged" {...register("transportMode")} />
              <span>自行前往</span>
              <small>若不得不自行前往，再幫我們選擇開車或搭車方式</small>
            </label>
          </div>

          {transportMode === "shuttle" ? (
            <div className="form-grid compact rsvp-count-grid !grid-cols-2 max-[560px]:!grid-cols-1">
              <NumberField label="去程搭乘人數" value={shuttleOutboundCount} variant={variant} max={totalGuestCount} onMinus={() => updateCount("shuttleOutboundCount", -1, totalGuestCount)} onPlus={() => updateCount("shuttleOutboundCount", 1, totalGuestCount)} />
              <NumberField label="回程搭乘人數" value={shuttleReturnCount} variant={variant} max={totalGuestCount} onMinus={() => updateCount("shuttleReturnCount", -1, totalGuestCount)} onPlus={() => updateCount("shuttleReturnCount", 1, totalGuestCount)} />
            </div>
          ) : null}

          {transportMode === "self-arranged" ? (
            <>
              <p className="rsvp-transport-note">
                由於山區停車位非常有限，如果方便的話，我們仍然很推薦改搭接駁車。
              </p>
              <div className="rsvp-option-grid">
                <label className="child-seat-toggle">
                  <input type="radio" value="drive" {...register("selfTransportMode")} />
                  <span>自行開車</span>
                </label>
                <label className="child-seat-toggle">
                  <input type="radio" value="taxi" {...register("selfTransportMode")} />
                  <span>自行安排</span>
                </label>
              </div>
            </>
          ) : null}

          <div className="rsvp-option-grid">
            <label className="child-seat-toggle">
              <input type="checkbox" {...register("attendsCeremony")} />
              <span>參加證婚</span>
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
  value: number;
  variant: "experimental" | "classic";
  max?: number;
  onMinus: () => void;
  onPlus: () => void;
};

function NumberField({ label, value, variant, max, onMinus, onPlus }: NumberFieldProps) {
  const cannotMinus = value <= 0;
  const cannotPlus = max !== undefined && value >= max;
  const buttonTone =
    variant === "experimental" ? "bg-[#f7eddc] text-[#10131d]" : "bg-[#800020] text-[#fff8ec]";

  return (
    <div className="rsvp-number-field grid gap-[9px]" role="group" aria-label={label}>
      <span className="text-[0.9rem] font-black">{label}</span>
      <div
        className="rsvp-number-control min-h-[62px] overflow-hidden rounded-[8px] border border-current bg-white/10"
        style={{ display: "flex" }}
      >
        <button
          className={clsx(
            "inline-flex min-h-[62px] w-[64px] shrink-0 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-45",
            buttonTone
          )}
          type="button"
          disabled={cannotMinus}
          onClick={onMinus}
          aria-label={`${label} -`}
        >
          <Minus size={28} strokeWidth={3.2} aria-hidden="true" />
        </button>
        <output
          className="inline-flex min-h-[62px] min-w-[58px] flex-1 items-center justify-center text-[1.45rem] font-black tabular-nums"
          aria-live="polite"
        >
          {value}
        </output>
        <button
          className={clsx(
            "inline-flex min-h-[62px] w-[64px] shrink-0 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-45",
            buttonTone
          )}
          type="button"
          disabled={cannotPlus}
          onClick={onPlus}
          aria-label={`${label} +`}
        >
          <Plus size={28} strokeWidth={3.2} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
