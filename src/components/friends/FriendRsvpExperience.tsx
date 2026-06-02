"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { Check, Minus, Plus, Send } from "lucide-react";
import {
  buildRsvpPayload,
  submitRsvp,
  type Attendance,
  type RsvpPayload
} from "@/lib/rsvp";

type FriendRsvpExperienceProps = {
  endpoint: string;
  fetcher?: typeof fetch;
};

type WizardStep = "intent" | "identity" | "details" | "card";

type WizardData = {
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

const defaultData: WizardData = {
  attendance: "attending",
  name: "",
  phone: "",
  vegetarianCount: 0,
  adultCount: 1,
  childCountUnder4: 0,
  childCount4to8: 0,
  needsChildSeat: false,
  childSeatCount: 0,
  attendsCeremony: true,
  needsShuttle: true
};

export function FriendRsvpExperience({ endpoint, fetcher }: FriendRsvpExperienceProps) {
  const [step, setStep] = useState<WizardStep>("intent");
  const [data, setData] = useState<WizardData>(defaultData);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const payload = useMemo<RsvpPayload | null>(() => {
    if (step !== "card") {
      return null;
    }

    try {
      return buildRsvpPayload(data, {
        sourceRoute: "/",
        userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent
      });
    } catch {
      return null;
    }
  }, [data, step]);

  function chooseAttendance(attendance: Attendance) {
    setData((current) => ({
      ...current,
      attendance,
      ...(attendance === "declined"
        ? {
            vegetarianCount: 0,
            adultCount: 0,
            childCountUnder4: 0,
            childCount4to8: 0,
            needsChildSeat: false,
            childSeatCount: 0,
            attendsCeremony: false,
            needsShuttle: false
          }
        : {
            adultCount: Math.max(current.adultCount, 1)
          })
    }));
    setNameError("");
    setPhoneError("");
    setStep("identity");
  }

  function updateField(field: keyof WizardData, value: string | number | boolean) {
    setData((current) => ({ ...current, [field]: value }));
  }

  function updateCount(
    field: keyof Pick<WizardData, "vegetarianCount" | "adultCount" | "childCountUnder4" | "childCount4to8" | "childSeatCount">,
    delta: number
  ) {
    setData((current) => ({ ...current, [field]: Math.max(0, Number(current[field]) + delta) }));
  }

  function validateName(value: string): string {
    return value.trim() ? "" : "請填寫名字";
  }

  function validatePhone(value: string): string {
    return value.trim().length >= 6 ? "" : "請填寫聯絡電話（至少 6 碼）";
  }

  function handleNameBlur(event: React.FocusEvent<HTMLInputElement>) {
    setNameError(validateName(event.target.value));
  }

  function handlePhoneBlur(event: React.FocusEvent<HTMLInputElement>) {
    setPhoneError(validatePhone(event.target.value));
  }

  function continueFromIdentity() {
    setMessage("");
    const nErr = validateName(data.name);
    const pErr = validatePhone(data.phone);
    setNameError(nErr);
    setPhoneError(pErr);
    if (nErr || pErr) {
      return;
    }

    setStep(data.attendance === "attending" ? "details" : "card");
  }

  function generateCard() {
    setMessage("");
    try {
      buildRsvpPayload(data, { sourceRoute: "/" });
      setStep("card");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "請確認回覆內容");
    }
  }

  async function submitCard() {
    if (!payload || !endpoint) {
      return;
    }

    setStatus("submitting");
    setMessage("");
    try {
      await submitRsvp(endpoint, payload, fetcher);
      setStatus("success");
      setMessage("回覆已送出，我們收到你的回覆了。");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "送出失敗，請稍後再試");
    }
  }

  function handleBack() {
    setMessage("");
    setNameError("");
    setPhoneError("");
    if (step === "identity") {
      setStep("intent");
    } else if (step === "details") {
      setStep("identity");
    } else if (step === "card") {
      setStep(data.attendance === "attending" ? "details" : "identity");
    }
  }

  return (
    <div className="friend-rsvp-experience">
      <div className="rsvp-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="rsvp-stage-label">
        <span>出席回覆</span>
        <strong>{step === "intent" ? "01" : step === "identity" ? "02" : step === "details" ? "03" : "04"}</strong>
      </div>

      {step === "intent" ? (
        <div className="rsvp-intent">
          <button type="button" aria-label="我會到場" onClick={() => chooseAttendance("attending")}>
            <span>我會到場</span>
            <small>一起見證這一天</small>
          </button>
          <button type="button" aria-label="這次無法參加" onClick={() => chooseAttendance("declined")}>
            <span>這次無法參加</span>
            <small>把祝福送到</small>
          </button>
        </div>
      ) : null}

      {step === "identity" ? (
        <div className="rsvp-identity">
          <label htmlFor="rsvp-name">
            <span>名字</span>
            <input
              id="rsvp-name"
              autoComplete="name"
              value={data.name}
              onChange={(event) => {
                updateField("name", event.target.value);
                if (nameError) setNameError(validateName(event.target.value));
              }}
              onBlur={handleNameBlur}
              placeholder="請輸入姓名"
              aria-invalid={nameError ? true : false}
              aria-describedby={nameError ? "rsvp-name-error" : undefined}
            />
            {nameError ? (
              <span id="rsvp-name-error" className="rsvp-field-error" role="alert">
                {nameError}
              </span>
            ) : null}
          </label>
          <label htmlFor="rsvp-phone">
            <span>聯絡電話</span>
            <input
              id="rsvp-phone"
              autoComplete="tel"
              inputMode="tel"
              value={data.phone}
              onChange={(event) => {
                updateField("phone", event.target.value);
                if (phoneError) setPhoneError(validatePhone(event.target.value));
              }}
              onBlur={handlePhoneBlur}
              placeholder="0912 345 678"
              aria-invalid={phoneError ? true : false}
              aria-describedby={phoneError ? "rsvp-phone-error" : undefined}
            />
            {phoneError ? (
              <span id="rsvp-phone-error" className="rsvp-field-error" role="alert">
                {phoneError}
              </span>
            ) : null}
          </label>
          <div className="rsvp-buttons">
            <button className="rsvp-back" type="button" onClick={handleBack}>
              上一頁
            </button>
            <button className="rsvp-next" type="button" onClick={continueFromIdentity}>
              {data.attendance === "attending" ? "下一步" : "確認回覆內容"}
            </button>
          </div>
        </div>
      ) : null}

      {step === "details" ? (
        <div className="rsvp-details">
          <Stepper label="請問有幾位大人呢？" value={data.adultCount} onMinus={() => updateCount("adultCount", -1)} onPlus={() => updateCount("adultCount", 1)} />
          <Stepper label="0-4 歲的小寶貝有幾位？" value={data.childCountUnder4} onMinus={() => updateCount("childCountUnder4", -1)} onPlus={() => updateCount("childCountUnder4", 1)} />
          <Stepper label="4-8 歲的小夥伴有幾位？" value={data.childCount4to8} onMinus={() => updateCount("childCount4to8", -1)} onPlus={() => updateCount("childCount4to8", 1)} />
          <Stepper label="我們也想替吃素的朋友準備好，有幾位呢？" value={data.vegetarianCount} onMinus={() => updateCount("vegetarianCount", -1)} onPlus={() => updateCount("vegetarianCount", 1)} />

          <label className="rsvp-seat-toggle">
            <input
              checked={data.needsChildSeat}
              onChange={(event) => updateField("needsChildSeat", event.target.checked)}
              type="checkbox"
            />
            <span>需要兒童座椅</span>
          </label>

          {data.needsChildSeat ? (
            <Stepper
              label="兒童座椅數量"
              value={data.childSeatCount}
              onMinus={() => updateCount("childSeatCount", -1)}
              onPlus={() => updateCount("childSeatCount", 1)}
            />
          ) : null}

          <div className="rsvp-option-grid">
            <label className="rsvp-seat-toggle">
              <input
                checked={data.attendsCeremony}
                onChange={(event) => updateField("attendsCeremony", event.target.checked)}
                type="checkbox"
              />
              <span>會不會一起來見證證婚時刻？</span>
            </label>
            <label className="rsvp-seat-toggle">
              <input
                checked={data.needsShuttle}
                onChange={(event) => updateField("needsShuttle", event.target.checked)}
                type="checkbox"
              />
              <span>要不要和大家一起搭接駁車過來？</span>
              <small>強烈推薦喔！</small>
            </label>
          </div>

          <div className="rsvp-buttons">
            <button className="rsvp-back" type="button" onClick={handleBack}>
              上一頁
            </button>
            <button className="rsvp-next" type="button" onClick={generateCard}>
              確認回覆內容
            </button>
          </div>
        </div>
      ) : null}

      {step === "card" ? (
        <div className="rsvp-card-preview">
          <p>{payload?.attendance === "attending" ? "出席確認" : "不克出席"}</p>
          <h3>{data.name}</h3>
          <div className="rsvp-card-lines">
            <span>{data.attendance === "attending" ? `吃素 ${data.vegetarianCount}` : "已收到心意"}</span>
            {data.attendance === "attending" ? <span>{`大人 ${data.adultCount} / 0-4 歲 ${data.childCountUnder4} / 4-8 歲 ${data.childCount4to8}`}</span> : null}
            {data.needsChildSeat ? <span>{`兒童座椅 ${data.childSeatCount}`}</span> : null}
            {data.attendance === "attending" && data.attendsCeremony ? <span>參加證婚</span> : null}
            {data.attendance === "attending" && data.needsShuttle ? <span>搭乘接駁車</span> : null}
            {payload?.isLate ? <span>較晚回覆</span> : <span>2026/7/7 前回覆</span>}
          </div>

          {!endpoint ? <p className="rsvp-unavailable">出席回覆尚未開放，請稍後再回來填寫。</p> : null}
          {message ? (
            <p className={clsx("rsvp-wizard-message", status)} role="status">
              {status === "success" ? <Check size={18} aria-hidden="true" /> : null}
              {message}
            </p>
          ) : null}
          <div className="rsvp-buttons">
            {status !== "success" && (
              <button
                className="rsvp-back"
                type="button"
                disabled={status === "submitting"}
                onClick={handleBack}
              >
                上一頁
              </button>
            )}
            <button
              className="rsvp-confirm"
              type="button"
              disabled={!endpoint || status === "submitting" || status === "success"}
              onClick={submitCard}
            >
              {endpoint ? <Send size={18} aria-hidden="true" /> : null}
              {!endpoint ? "出席回覆尚未開放" : status === "submitting" ? "送出中" : "確認送出"}
            </button>
          </div>
        </div>
      ) : null}

      {message && step !== "card" && step !== "identity" ? (
        <p className="rsvp-wizard-message error" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}

type StepperProps = {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
};

function Stepper({ label, value, onMinus, onPlus }: StepperProps) {
  return (
    <div className="rsvp-stepper">
      <span>{label}</span>
      <div>
        <button type="button" onClick={onMinus} aria-label={`${label} -`}>
          <Minus size={16} aria-hidden="true" />
        </button>
        <strong>{value}</strong>
        <button type="button" onClick={onPlus} aria-label={`${label} +`}>
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
