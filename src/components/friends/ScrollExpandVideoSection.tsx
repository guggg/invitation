"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type ScrollExpandVideoSectionProps = {
  src: string;
  poster?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  caption?: string;
  className?: string;
};

export function ScrollExpandVideoSection({
  src,
  poster,
  eyebrow = "婚禮之前",
  title = "把一小段時間，先留在這裡",
  description = "在那天到來以前，我們想把一段小小的畫面，放進這份邀請裡。",
  caption = "",
  className
}: ScrollExpandVideoSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoFrameRef = useRef<HTMLDivElement>(null);
  const introTextRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = mainVideoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, [src]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const videoFrame = videoFrameRef.current;
      const introText = introTextRef.current;
      const captionEl = captionRef.current;
      const background = backgroundRef.current;

      if (!section || !videoFrame) return;

      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) {
        gsap.set([videoFrame, introText, captionEl, background].filter(Boolean), {
          clearProps: "all"
        });
        return;
      }

      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        const getDesktopStageHeight = () => Math.min(window.innerHeight * 0.86, 920);
        const getDesktopStageWidth = () => getDesktopStageHeight() * (9 / 16);

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=170%",
            scrub: true,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true
          }
        });

        tl.to(
          videoFrame,
          {
            width: () => `${getDesktopStageWidth()}px`,
            height: () => `${getDesktopStageHeight()}px`,
            borderRadius: "22px",
            boxShadow: "0 16px 60px rgba(58, 47, 38, 0.08)",
            ease: "none"
          },
          0
        );
        tl.to(videoFrame, { y: "-5vh", ease: "none" }, 0.86);

        if (introText) {
          tl.to(
            introText,
            {
              opacity: 0,
              y: -32,
              scale: 0.96,
              ease: "none"
            },
            0
          );
        }

        if (background) {
          tl.to(
            background,
            {
              opacity: 0.44,
              scale: 1.08,
              ease: "none"
            },
            0.15
          );
        }

        if (captionEl) {
          tl.fromTo(
            captionEl,
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, ease: "none" },
            0.58
          );
          tl.to(captionEl, { opacity: 0.68, y: -18, ease: "none" }, 0.86);
        }
      });

      mm.add("(max-width: 767px)", () => {
        const getMobileStageWidth = () => window.innerWidth;
        const getMobileStageHeight = () => window.innerHeight;
        const getMobileStageY = () => -videoFrame.offsetTop;
        const getMobileReleaseY = () => getMobileStageY() - window.innerHeight * 0.08;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=130%",
            scrub: true,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true
          }
        });

        tl.to(
          videoFrame,
          {
            width: () => `${getMobileStageWidth()}px`,
            height: () => `${getMobileStageHeight()}px`,
            y: () => `${getMobileStageY()}px`,
            borderRadius: "0px",
            boxShadow: "none",
            ease: "none"
          },
          0
        );
        tl.to(videoFrame, { y: () => `${getMobileReleaseY()}px`, ease: "none" }, 0.86);

        if (introText) {
          tl.to(
            introText,
            {
              opacity: 0,
              y: -24,
              ease: "none"
            },
            0
          );
        }

        if (captionEl) {
          tl.fromTo(
            captionEl,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, ease: "none" },
            0.62
          );
          tl.to(captionEl, { opacity: 0.72, y: -16, ease: "none" }, 0.86);
        }
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  if (!src) return null;

  return (
    <section
      ref={sectionRef}
      className={`scroll-expand-video-section ${className ?? ""}`}
      aria-labelledby="scroll-expand-video-title"
    >
      <div className="scroll-expand-video-stage">
        <div ref={backgroundRef} className="scroll-expand-video-atmosphere" aria-hidden="true">
          <video
            className="scroll-expand-video-atmosphere-media"
            src={src}
            poster={poster}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            tabIndex={-1}
          />
          <div className="scroll-expand-video-atmosphere-overlay" />
        </div>

        <div ref={introTextRef} className="scroll-expand-video-copy">
          <p>{eyebrow}</p>
          <h2 id="scroll-expand-video-title">{title}</h2>
          <span>{description}</span>
        </div>

        <div ref={videoFrameRef} className="scroll-expand-video-frame">
          <video
            ref={mainVideoRef}
            className="scroll-expand-video-media"
            src={src}
            poster={poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        </div>

        <div ref={captionRef} className="scroll-expand-video-caption" aria-hidden="true">
          {caption}
        </div>
      </div>
    </section>
  );
}
