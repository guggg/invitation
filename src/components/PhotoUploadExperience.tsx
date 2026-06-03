"use client";

import { useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import { Check, ImagePlus, LockKeyhole, Send, Sparkles } from "lucide-react";
import {
  buildPhotoUploadPayload,
  formatPhotoUploadPhone,
  readPhotoUploadState,
  submitPhotoUpload,
  validatePhotoUploadFile,
  writePhotoUploadState,
  type PhotoUploadSourceRoute,
  type PhotoUploadStoredState
} from "@/lib/photo-upload";

type PhotoUploadExperienceProps = {
  endpoint: string;
  sourceRoute: PhotoUploadSourceRoute;
  variant: "friend" | "family";
  fetcher?: typeof fetch;
};

export function PhotoUploadExperience({ endpoint, sourceRoute, variant, fetcher }: PhotoUploadExperienceProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [storedState, setStoredState] = useState<PhotoUploadStoredState | null>(() => readPhotoUploadState());
  const archiveVisualRef = useRef<HTMLDivElement | null>(null);
  const pointerStateRef = useRef({ x: 0, y: 0, time: 0 });

  const isFriend = variant === "friend";
  const selectedFileLabel = useMemo(() => {
    if (!file) {
      return isFriend ? "尚未放入照片" : "尚未選擇照片";
    }

    return `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  }, [file, isFriend]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setMessage("");
    setStatus("idle");

    if (!nextFile) {
      setFile(null);
      return;
    }

    const validation = validatePhotoUploadFile(nextFile);
    if (!validation.ok) {
      setFile(null);
      setStatus("error");
      setMessage(validation.message);
      event.target.value = "";
      return;
    }

    setFile(nextFile);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!file) {
      setStatus("error");
      setMessage("請選擇一張照片。");
      return;
    }

    setStatus("submitting");

    try {
      const payload = await buildPhotoUploadPayload({
        sourceRoute,
        name,
        phone,
        consent,
        file
      });
      const result = await submitPhotoUpload(endpoint, payload, fetcher);
      const storedFileName = result?.fileName || `${payload.name}_${payload.phone}`;

      writePhotoUploadState({
        name: payload.name,
        phone: payload.phone,
        fileName: storedFileName,
        submittedAt: payload.submittedAt
      });
      setStoredState({
        submitted: true,
        name: payload.name,
        phone: payload.phone,
        fileName: storedFileName,
        submittedAt: payload.submittedAt
      });
      setStatus("success");
      setMessage(isFriend ? "照片已封存，我們收到這張代表你的密件了。" : "照片已收到，謝謝您。");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "送出失敗，請稍後再試。");
    }
  }

  function handleArchivePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!archiveVisualRef.current) {
      return;
    }

    const rect = archiveVisualRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = x / rect.width - 0.5;
    const centerY = y / rect.height - 0.5;
    const previous = pointerStateRef.current;
    const elapsed = Math.max(event.timeStamp - previous.time, 16);
    const distance = Math.hypot(x - previous.x, y - previous.y);
    const speed = Math.min(distance / elapsed, 2.4);

    pointerStateRef.current = { x, y, time: event.timeStamp };
    archiveVisualRef.current.style.setProperty("--archive-rotate-y", `${centerX * 18 + speed * 2.2}deg`);
    archiveVisualRef.current.style.setProperty("--archive-rotate-x", `${centerY * -14}deg`);
    archiveVisualRef.current.style.setProperty("--archive-lift", `${Math.min(speed * 10, 18)}px`);
    archiveVisualRef.current.style.setProperty("--archive-glint-x", `${x}px`);
    archiveVisualRef.current.style.setProperty("--archive-glint-y", `${y}px`);
  }

  function handleArchivePointerLeave() {
    if (!archiveVisualRef.current) {
      return;
    }

    archiveVisualRef.current.style.setProperty("--archive-rotate-y", "0deg");
    archiveVisualRef.current.style.setProperty("--archive-rotate-x", "0deg");
    archiveVisualRef.current.style.setProperty("--archive-lift", "0px");
  }

  return (
    <div className={clsx("photo-upload-experience", isFriend ? "photo-upload-friend" : "photo-upload-family")}>
      {isFriend ? (
        <div
          className="photo-archive-visual"
          aria-hidden="true"
          onPointerLeave={handleArchivePointerLeave}
          onPointerMove={handleArchivePointerMove}
          ref={archiveVisualRef}
        >
          <div className="photo-archive-envelope">
            <span className="photo-archive-flap" />
            <span className="photo-archive-letter" />
            <span className="photo-archive-script">4J & Yuan</span>
            <span className="photo-archive-stamp">one photo<br />one secret</span>
            <span className="photo-archive-postmark">2026.10.03</span>
            <span className="photo-archive-wax">
              <LockKeyhole size={18} />
            </span>
          </div>
          <span className="photo-archive-thread thread-one" />
          <span className="photo-archive-thread thread-two" />
        </div>
      ) : null}

      <div className="photo-upload-content">
        <div className="photo-upload-copy">
          <span className="photo-upload-kicker">
            {isFriend ? <Sparkles size={16} aria-hidden="true" /> : <ImagePlus size={18} aria-hidden="true" />}
            {isFriend ? "Secret Archive" : "照片上傳"}
          </span>
          <h3>{isFriend ? "秘密收藏室" : "照片上傳"}</h3>
          <p>
            {isFriend
              ? "交給我們一張代表你的照片。它可能會在婚禮相關的小驚喜中被參與的嘉賓一起看見，所以請挑一張你願意被大家記住的畫面。"
              : "請上傳一張代表您的照片。照片之後可能會讓參與的親友一起看見，請挑選您願意分享的照片。"}
          </p>
          <ul className="photo-upload-note">
            <li>不一定要有人臉，也可以是寵物、物件、手寫符號、icon，或任何能代表你的畫面。</li>
            <li>每人一張，送出後若用相同姓名與手機重複上傳，系統會以最新檔案覆蓋。</li>
            <li>如果收到的照片數量超過實際需要，我們會依照整體製作需求挑選，可能不會使用到每一張照片。</li>
          </ul>
          {storedState ? (
            <p className="photo-upload-receipt">
              <Check size={16} aria-hidden="true" />
              這個瀏覽器已上傳過：{storedState.fileName}
            </p>
          ) : null}
        </div>

        <form className="photo-upload-form" onSubmit={handleSubmit}>
          <div className="photo-upload-grid">
            <label>
              <span>名字</span>
              <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="請輸入姓名" />
            </label>
            <label>
              <span>手機號碼</span>
              <input
                autoComplete="tel"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(formatPhotoUploadPhone(event.target.value))}
                placeholder="0912 345 678"
              />
            </label>
          </div>

          <label className="photo-upload-dropzone">
            <input aria-label="選擇一張照片" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" type="file" onChange={handleFileChange} />
            <span className="photo-upload-drop-icon">
              <ImagePlus size={24} aria-hidden="true" />
            </span>
            <strong>{isFriend ? "把照片放進信封" : "選擇一張照片"}</strong>
            <small>{selectedFileLabel}</small>
          </label>

          <label className="photo-upload-consent">
            <input checked={consent} type="checkbox" onChange={(event) => setConsent(event.target.checked)} />
            <span>我同意提供這張照片作為婚禮相關使用，並了解參與嘉賓之後也可能一起看見。</span>
          </label>

          {message ? (
            <p className={clsx("photo-upload-message", status === "error" ? "is-error" : "is-success")} role="status">
              {message}
            </p>
          ) : null}

          <button className="photo-upload-submit" disabled={!endpoint || status === "submitting"} type="submit">
            {status === "submitting" ? (
              "封存中..."
            ) : (
              <>
                <Send size={18} aria-hidden="true" />
                {isFriend ? "封存這張照片" : "送出照片"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
