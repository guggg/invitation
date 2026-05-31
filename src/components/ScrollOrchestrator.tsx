"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

export function ScrollOrchestrator() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.registerPlugin(ScrollTrigger);

    const shell = document.querySelector<HTMLElement>(".friends-shell");
    const applyTheme = (section: HTMLElement) => {
      if (!shell) {
        return;
      }

      shell.style.setProperty("--surface", section.dataset.surface ?? "#10131d");
      shell.style.setProperty("--ink", section.dataset.ink ?? "#f7eddc");
    };

    let lenis: Lenis | null = null;
    const tick = (time: number) => {
      lenis?.raf(time * 1000);
    };

    if (!prefersReducedMotion) {
      lenis = new Lenis({
        lerp: 0.085,
        wheelMultiplier: 0.88
      });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 46, filter: "blur(12px)" },
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 78%"
            }
          }
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-scale-reveal]").forEach((element) => {
        gsap.fromTo(
          element,
          { scale: 0.86, autoAlpha: 0 },
          {
            scale: 1,
            autoAlpha: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: element,
              start: "top 82%",
              end: "bottom 64%",
              scrub: 0.7
            }
          }
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-surface]").forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          start: "top 42%",
          end: "bottom 42%",
          onEnter: () => applyTheme(section),
          onEnterBack: () => applyTheme(section)
        });
      });

      const gallerySection = document.querySelector<HTMLElement>(".gallery-scroll");
      const galleryTrack = document.querySelector<HTMLElement>(".gallery-track");
      if (gallerySection && galleryTrack && !prefersReducedMotion) {
        gsap.to(galleryTrack, {
          x: () => -Math.max(0, galleryTrack.scrollWidth - window.innerWidth + 48),
          ease: "none",
          scrollTrigger: {
            trigger: gallerySection,
            start: "top top",
            end: () => `+=${Math.max(900, galleryTrack.scrollWidth - window.innerWidth + 320)}`,
            scrub: true,
            pin: true,
            invalidateOnRefresh: true
          }
        });
      }
    });

    return () => {
      context.revert();
      gsap.ticker.remove(tick);
      lenis?.destroy();
    };
  }, []);

  return null;
}
