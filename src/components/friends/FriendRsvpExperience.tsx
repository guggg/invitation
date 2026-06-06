"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { Check, Minus, Plus, Send } from "lucide-react";
import { LineOfficialCta } from "@/components/LineOfficialCta";
import {
  buildRsvpPayload,
  formatPhoneInput,
  isValidTaiwanMobilePhone,
  submitRsvp,
  type Attendance,
  type RsvpPayload
} from "@/lib/rsvp";

type FriendRsvpExperienceProps = {
  endpoint: string;
  fetcher?: typeof fetch;
  lineAddFriendUrl: string;
  lineQrCodeSrc: string;
};

type WizardStep = "intent" | "identity" | "details" | "transport" | "card";

type WizardData = {
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
  transportMode: "shuttle" | "self-arranged" | "";
  selfTransportMode: "drive" | "taxi" | "";
  shuttleOutboundCount: number;
  shuttleReturnCount: number;
  needsShuttle: boolean;
};

const defaultData: WizardData = {
  attendance: "attending",
  name: "",
  phone: "",
  needsPhysicalInvitation: false,
  vegetarianCount: 0,
  adultCount: 1,
  childCountUnder4: 0,
  childCount4to8: 0,
  needsChildSeat: false,
  childSeatCount: 0,
  attendsCeremony: true,
  transportMode: "shuttle",
  selfTransportMode: "",
  shuttleOutboundCount: 1,
  shuttleReturnCount: 1,
  needsShuttle: true
};

export function FriendRsvpExperience({
  endpoint,
  fetcher,
  lineAddFriendUrl,
  lineQrCodeSrc
}: FriendRsvpExperienceProps) {
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
            transportMode: "",
            selfTransportMode: "",
            shuttleOutboundCount: 0,
            shuttleReturnCount: 0,
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
    setData((current) => {
      if (field === "transportMode") {
        const transportMode = value as WizardData["transportMode"];
        return {
          ...current,
          transportMode,
          selfTransportMode: transportMode === "self-arranged" ? current.selfTransportMode : "",
          shuttleOutboundCount: transportMode === "shuttle" ? Math.max(current.shuttleOutboundCount, 1) : 0,
          shuttleReturnCount: transportMode === "shuttle" ? Math.max(current.shuttleReturnCount, 1) : 0,
          needsShuttle: transportMode === "shuttle"
        };
      }

      if (field === "selfTransportMode") {
        return { ...current, selfTransportMode: value as WizardData["selfTransportMode"] };
      }

      return { ...current, [field]: value };
    });
  }

  function updateCount(
    field: keyof Pick<WizardData, "vegetarianCount" | "adultCount" | "childCountUnder4" | "childCount4to8" | "childSeatCount" | "shuttleOutboundCount" | "shuttleReturnCount">,
    delta: number
  ) {
    setData((current) => {
      const next = { ...current, [field]: Math.max(0, Number(current[field]) + delta) };
      return clampDependentCounts(next);
    });
  }

  function clampDependentCounts(current: WizardData): WizardData {
    const totalGuestCount = current.adultCount + current.childCountUnder4 + current.childCount4to8;
    return {
      ...current,
      vegetarianCount: Math.min(current.vegetarianCount, totalGuestCount),
      childSeatCount: Math.min(current.childSeatCount, current.childCountUnder4),
      shuttleOutboundCount: current.transportMode === "shuttle" ? Math.min(current.shuttleOutboundCount, totalGuestCount) : 0,
      shuttleReturnCount: current.transportMode === "shuttle" ? Math.min(current.shuttleReturnCount, totalGuestCount) : 0
    };
  }

  function validateName(value: string): string {
    return value.trim() ? "" : "請填寫名字";
  }

  function validatePhone(value: string): string {
    if (!value.trim()) {
      return "請填寫聯絡電話";
    }

    return isValidTaiwanMobilePhone(value) ? "" : "請填寫正確手機號碼";
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
    } else if (step === "transport") {
      setStep("details");
    } else if (step === "card") {
      setStep(data.attendance === "attending" ? "transport" : "identity");
    }
  }

  const stepIndex = step === "intent" ? 1 : step === "identity" ? 2 : step === "details" ? 3 : step === "transport" ? 4 : 5;
  const totalGuestCount = data.adultCount + data.childCountUnder4 + data.childCount4to8;
  const stepTitle =
    step === "intent"
      ? "先告訴我們，你會不會來"
      : step === "identity"
        ? "留下你的名字，讓這張回函寫上稱呼"
        : step === "details"
          ? "先把同行與餐食，慢慢填進來"
          : step === "transport"
            ? "最後確認交通，讓我們幫你安排座位"
            : "最後，生成一張只屬於你的回函";

  return (
    <div className="friend-rsvp-experience rsvp-luxe-stage">
      <div className="rsvp-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="rsvp-stage-shell">
        <div className="rsvp-stage-label">
          <span>RSVP Reply Card</span>
          <strong>{stepIndex.toString().padStart(2, "0")}</strong>
        </div>

        <div className="rsvp-stage-hero">
          <p>出席回覆</p>
          <h3>{stepTitle}</h3>
        </div>

        <div className="rsvp-ribbon-progress" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className={`rsvp-ribbon-segment ${stepIndex >= index + 1 ? "is-done" : ""}`} />
          ))}
          <i className={`rsvp-ribbon-marker step-${stepIndex}`} />
        </div>
      </div>

      {step === "intent" ? (
        <div className="rsvp-intent rsvp-luxe-panel">
          <button type="button" aria-label="我會到場" onClick={() => chooseAttendance("attending")}>
            <span>我會到場</span>
            <small>想把那天的花、晚餐和擁抱，都留在同一個傍晚</small>
          </button>
          <button type="button" aria-label="這次無法參加" onClick={() => chooseAttendance("declined")}>
            <span>這次無法參加</span>
            <small>把祝福先送到，我們會把心意好好收下</small>
          </button>
        </div>
      ) : null}

      {step === "identity" ? (
        <div className="rsvp-identity rsvp-luxe-panel">
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
                const formattedPhone = formatPhoneInput(event.target.value);
                updateField("phone", formattedPhone);
                if (phoneError) setPhoneError(validatePhone(formattedPhone));
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
          <label className="rsvp-seat-toggle rsvp-physical-invite-toggle">
            <input
              checked={data.needsPhysicalInvitation}
              onChange={(event) => updateField("needsPhysicalInvitation", event.target.checked)}
              type="checkbox"
            />
            <span>需要實體喜帖</span>
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
        <div className="rsvp-details rsvp-luxe-panel">
          <Stepper label="請問有幾位大人呢？" value={data.adultCount} onMinus={() => updateCount("adultCount", -1)} onPlus={() => updateCount("adultCount", 1)} />
          <Stepper label="0-4 歲的小寶貝有幾位？" value={data.childCountUnder4} onMinus={() => updateCount("childCountUnder4", -1)} onPlus={() => updateCount("childCountUnder4", 1)} />
          <Stepper label="4-8 歲的小夥伴有幾位？" value={data.childCount4to8} onMinus={() => updateCount("childCount4to8", -1)} onPlus={() => updateCount("childCount4to8", 1)} />
          <Stepper label="我們也想替吃素的朋友準備好，有幾位呢？" value={data.vegetarianCount} max={totalGuestCount} onMinus={() => updateCount("vegetarianCount", -1)} onPlus={() => updateCount("vegetarianCount", 1)} />

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
              max={data.childCountUnder4}
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
          </div>

          <div className="rsvp-buttons">
            <button className="rsvp-back" type="button" onClick={handleBack}>
              上一頁
            </button>
            <button className="rsvp-next" type="button" onClick={() => setStep("transport")}>
              下一步
            </button>
          </div>
        </div>
      ) : null}

      {step === "transport" ? (
        <div className="rsvp-transport rsvp-luxe-panel">
          <div className="rsvp-transport-callout">
            <strong>交通提醒</strong>
            <p>場地位於山區，山路較蜿蜒，現場停車位也真的很有限。如果可以的話，我們真心推薦優先搭接駁車，會比自行找車位輕鬆很多。</p>
          </div>

          <div className="rsvp-transport-choice" role="radiogroup" aria-label="交通方式">
            <label className={data.transportMode === "shuttle" ? "is-active" : undefined}>
              <input
                checked={data.transportMode === "shuttle"}
                onChange={() => updateField("transportMode", "shuttle")}
                type="radio"
                name="friend-transport-mode"
              />
              <span>強烈推薦：搭乘接駁車</span>
              <small>免找車位、上下山更輕鬆，也能和親友一起出發</small>
            </label>
            <label className={data.transportMode === "self-arranged" ? "is-active" : undefined}>
              <input
                checked={data.transportMode === "self-arranged"}
                onChange={() => updateField("transportMode", "self-arranged")}
                type="radio"
                name="friend-transport-mode"
              />
              <span>自行前往</span>
              <small>若真的比較方便再選這個，我們會再請你選擇方式</small>
            </label>
          </div>

          {data.transportMode === "shuttle" ? (
            <>
              <Stepper label="去程要幫你保留幾個接駁座位？" value={data.shuttleOutboundCount} max={totalGuestCount} onMinus={() => updateCount("shuttleOutboundCount", -1)} onPlus={() => updateCount("shuttleOutboundCount", 1)} />
              <Stepper label="回程要幫你保留幾個接駁座位？" value={data.shuttleReturnCount} max={totalGuestCount} onMinus={() => updateCount("shuttleReturnCount", -1)} onPlus={() => updateCount("shuttleReturnCount", 1)} />
            </>
          ) : null}

          {data.transportMode === "self-arranged" ? (
            <>
              <p className="rsvp-transport-note">「由於山區停車位真的有限，如果方便的話，我們仍然很推薦改搭接駁車。」</p>
              <div className="rsvp-option-grid">
                <label className="rsvp-seat-toggle">
                  <input
                    checked={data.selfTransportMode === "drive"}
                    onChange={() => updateField("selfTransportMode", "drive")}
                    type="radio"
                    name="friend-self-transport-mode"
                  />
                  <span>自行開車</span>
                </label>
                <label className="rsvp-seat-toggle">
                  <input
                    checked={data.selfTransportMode === "taxi"}
                    onChange={() => updateField("selfTransportMode", "taxi")}
                    type="radio"
                    name="friend-self-transport-mode"
                  />
                  <span>自行安排</span>
                </label>
              </div>
            </>
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
        <div className="rsvp-card-preview rsvp-art-card">
          <div className="rsvp-art-card-veil" aria-hidden="true" />
          <div className="rsvp-card-heading">
            <span className="rsvp-card-stamp">{payload?.attendance === "attending" ? "Ready To Send" : "Blessing Saved"}</span>
          </div>
          <div className="rsvp-art-headline">
            <h3>{data.name}</h3>
            <p>{data.attendance === "attending" ? "會帶著回覆，走進我們那天的晚風裡。" : "雖然這次無法出席，但祝福已經送到。"}</p>
          </div>
          <div className="rsvp-card-sheet">
            <div className="rsvp-card-row">
              <span className="rsvp-card-label">聯絡電話</span>
              <strong className="rsvp-card-value">{data.phone}</strong>
            </div>
            <div className="rsvp-card-row">
              <span className="rsvp-card-label">實體喜帖</span>
              <strong className="rsvp-card-value">{data.needsPhysicalInvitation ? "需要" : "不需要"}</strong>
            </div>
            <div className="rsvp-card-row">
              <span className="rsvp-card-label">出席意願</span>
              <strong className="rsvp-card-value">{data.attendance === "attending" ? "我會到場" : "這次無法參加"}</strong>
            </div>
            {data.attendance === "attending" ? (
              <>
                <div className="rsvp-art-stats">
                  <article>
                    <span>同行</span>
                    <strong>{data.adultCount + data.childCountUnder4 + data.childCount4to8}</strong>
                    <small>位賓客</small>
                  </article>
                  <article>
                    <span>吃素</span>
                    <strong>{data.vegetarianCount}</strong>
                    <small>位</small>
                  </article>
                  <article>
                    <span>接駁</span>
                    <strong>{data.transportMode === "shuttle" ? data.shuttleOutboundCount + data.shuttleReturnCount : 0}</strong>
                    <small>個座位</small>
                  </article>
                </div>
                <div className="rsvp-art-detail-grid">
                  <div className="rsvp-card-row">
                    <span className="rsvp-card-label">同行組成</span>
                    <strong className="rsvp-card-value">{`大人 ${data.adultCount} / 0-4 歲 ${data.childCountUnder4} / 4-8 歲 ${data.childCount4to8}`}</strong>
                  </div>
                  <div className="rsvp-card-row">
                    <span className="rsvp-card-label">兒童座椅</span>
                    <strong className="rsvp-card-value">{data.needsChildSeat ? `${data.childSeatCount} 張` : "不需要"}</strong>
                  </div>
                  <div className="rsvp-card-row">
                    <span className="rsvp-card-label">證婚時刻</span>
                    <strong className="rsvp-card-value">{data.attendsCeremony ? "會一起見證" : "這次不參加"}</strong>
                  </div>
                  <div className="rsvp-card-row">
                    <span className="rsvp-card-label">交通方式</span>
                    <strong className="rsvp-card-value">
                      {data.transportMode === "shuttle"
                        ? "搭乘接駁車"
                        : data.selfTransportMode === "drive"
                          ? "自行開車"
                          : "計程車／包車（自費🙏）"}
                    </strong>
                  </div>
                  {data.transportMode === "shuttle" ? (
                    <>
                      <div className="rsvp-card-row">
                        <span className="rsvp-card-label">去程接駁座位</span>
                        <strong className="rsvp-card-value">{data.shuttleOutboundCount} 位</strong>
                      </div>
                      <div className="rsvp-card-row">
                        <span className="rsvp-card-label">回程接駁座位</span>
                        <strong className="rsvp-card-value">{data.shuttleReturnCount} 位</strong>
                      </div>
                    </>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="rsvp-card-row">
                <span className="rsvp-card-label">回覆狀態</span>
                <strong className="rsvp-card-value">已收到心意</strong>
              </div>
            )}
          </div>
          <div className="rsvp-card-meta">
            {payload?.isLate ? <span>較晚回覆</span> : <span>2026/7/7 前回覆</span>}
          </div>

          {!endpoint ? <p className="rsvp-unavailable">出席回覆尚未開放，請稍後再回來填寫。</p> : null}
          {message ? (
            <p className={clsx("rsvp-wizard-message", status)} role="status">
              {status === "success" ? <Check size={18} aria-hidden="true" /> : null}
              {message}
            </p>
          ) : null}
          {status === "success" ? (
            <LineOfficialCta
              variant="rsvp-success"
              lineAddFriendUrl={lineAddFriendUrl}
              qrCodeSrc={lineQrCodeSrc}
            />
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
  max?: number;
  onMinus: () => void;
  onPlus: () => void;
};

function Stepper({ label, value, max, onMinus, onPlus }: StepperProps) {
  const cannotMinus = value <= 0;
  const cannotPlus = max !== undefined && value >= max;

  return (
    <div className="rsvp-stepper">
      <span>{label}</span>
      <div>
        <button type="button" onClick={onMinus} disabled={cannotMinus} aria-label={`${label} -`}>
          <Minus size={16} aria-hidden="true" />
        </button>
        <strong>{value}</strong>
        <button type="button" onClick={onPlus} disabled={cannotPlus} aria-label={`${label} +`}>
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
