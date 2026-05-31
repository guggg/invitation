"use client";

import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";

const phrases = ["Yuan & 4J's Wedding", "2026.10.3", "優聖美地"];

const transitionFrames = [
  String.raw`
        .-""""-.
      .'  .--.  '.
     /   /    \   \
    |   |  ()  |   |
     \   \____/   /
      '.        .'
        '-.__.-'
  `,
  String.raw`
       __        __
    __/  \__  __/  \__
   /  \__/  \/  \__/  \
   \__/  \__/ \__/  \_/
      \__/      \__/
  `,
  String.raw`
       .-.
      (   )   .-.
       '-'   (   )
        \     '-'
         \    /
          \  /
           ||
           ||
  `,
  String.raw`
     @@@@       @@@@       @@@@
   @@@@@@@   @@@@@@@@   @@@@@@@
    @@@@@     @@@@@@     @@@@@
      |         ||         |
   \  |  /   \  ||  /   \  |  /
    \ | /     \ || /     \ | /
  `,
  String.raw`
    *   .     '      *      .
       '   *     .      '       *
   .      '   4J & Yuan   .   '
       *       2026.10.3      *
   '       .    優聖美地    '    .
  `
];

export function AsciiIntro() {
  const [phase, setPhase] = useState<"idle" | "transition" | "done">("idle");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [speed, setSpeed] = useState(1600);

  useEffect(() => {
    if (phase !== "idle") {
      return;
    }

    const timer = window.setInterval(() => {
      setPhraseIndex((index) => (index + 1) % phrases.length);
    }, speed);

    return () => window.clearInterval(timer);
  }, [phase, speed]);

  useEffect(() => {
    if (phase !== "transition") {
      return;
    }

    const timer = window.setInterval(() => {
      setFrameIndex((index) => {
        if (index >= transitionFrames.length - 1) {
          window.setTimeout(() => setPhase("done"), 900);
          return index;
        }
        return index + 1;
      });
    }, 780);

    return () => window.clearInterval(timer);
  }, [phase]);

  const words = useMemo(() => phrases[phraseIndex].split(" "), [phraseIndex]);

  if (phase === "done") {
    return null;
  }

  return (
    <div
      className={clsx("ascii-intro", phase === "transition" && "is-transitioning")}
      onMouseMove={(event) => {
        const movement = Math.abs(event.movementX) + Math.abs(event.movementY);
        setSpeed(movement > 20 ? 540 : 1600);
      }}
    >
      {phase === "idle" ? (
        <>
          <div className="ascii-phrase" aria-label={phrases[phraseIndex]}>
            {words.map((word, wordIndex) => (
              <span className="ascii-word" key={`${word}-${wordIndex}`}>
                {Array.from(word).map((letter, letterIndex) => (
                  <span
                    key={`${letter}-${letterIndex}`}
                    style={{ "--i": wordIndex * 6 + letterIndex } as React.CSSProperties}
                  >
                    {letter}
                  </span>
                ))}
              </span>
            ))}
          </div>
          <button type="button" className="ascii-enter" onClick={() => setPhase("transition")}>
            請點擊
          </button>
        </>
      ) : (
        <pre className="ascii-frame" aria-hidden="true">
          {transitionFrames[frameIndex]}
        </pre>
      )}
    </div>
  );
}
