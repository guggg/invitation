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
  meatCount: number;
  vegetarianCount: number;
  adultCount: number;
  childCount: number;
  needsChildSeat: boolean;
  childSeatCount: number;
};

const defaultData: WizardData = {
  attendance: "attending",
  name: "",
  phone: "",
  meatCount: 1,
  vegetarianCount: 0,
  adultCount: 1,
  childCount: 0,
  needsChildSeat: false,
  childSeatCount: 0
};

export function FriendRsvpExperience({ endpoint, fetcher }: FriendRsvpExperienceProps) {
  const [step, setStep] = useState<WizardStep>("intent");
  const [data, setData] = useState<WizardData>(defaultData);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

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
            meatCount: 0,
            vegetarianCount: 0,
            adultCount: 0,
            childCount: 0,
            needsChildSeat: false,
            childSeatCount: 0
          }
        : {
            meatCount: Math.max(current.meatCount, 1),
            adultCount: Math.max(current.adultCount, 1)
          })
    }));
    setStep("identity");
  }

  function updateField(field: keyof WizardData, value: string | number | boolean) {
    setData((current) => ({ ...current, [field]: value }));
  }

  function updateCount(field: keyof Pick<WizardData, "meatCount" | "vegetarianCount" | "adultCount" | "childCount" | "childSeatCount">, delta: number) {
    setData((current) => ({ ...current, [field]: Math.max(0, Number(current[field]) + delta) }));
  }

  function continueFromIdentity() {
    setMessage("");
    if (!data.name.trim() || !data.phone.trim()) {
      setMessage("請先填寫名字與聯絡電話。");
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
          <label>
            <span>名字</span>
            <input
              autoComplete="name"
              value={data.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="請輸入姓名"
            />
          </label>
          <label>
            <span>聯絡電話</span>
            <input
              autoComplete="tel"
              inputMode="tel"
              value={data.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="0912 345 678"
            />
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
          <Stepper label="葷食份數" value={data.meatCount} onMinus={() => updateCount("meatCount", -1)} onPlus={() => updateCount("meatCount", 1)} />
          <Stepper label="素食份數" value={data.vegetarianCount} onMinus={() => updateCount("vegetarianCount", -1)} onPlus={() => updateCount("vegetarianCount", 1)} />
          <Stepper label="大人人數" value={data.adultCount} onMinus={() => updateCount("adultCount", -1)} onPlus={() => updateCount("adultCount", 1)} />
          <Stepper label="小孩人數" value={data.childCount} onMinus={() => updateCount("childCount", -1)} onPlus={() => updateCount("childCount", 1)} />

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
            <span>{data.attendance === "attending" ? `葷食 ${data.meatCount} / 素食 ${data.vegetarianCount}` : "已收到心意"}</span>
            {data.attendance === "attending" ? <span>{`大人 ${data.adultCount} / 小孩 ${data.childCount}`}</span> : null}
            {data.needsChildSeat ? <span>{`兒童座椅 ${data.childSeatCount}`}</span> : null}
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

      {message && step !== "card" ? (
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
