"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

function emitSection(index: number, label: string) {
  window.dispatchEvent(new CustomEvent("friend-section-change", { detail: { index, label } }));
}

export function FriendsMotionController() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.registerPlugin(ScrollTrigger);

    let lenis: Lenis | null = null;
    const tick = (time: number) => {
      lenis?.raf(time * 1000);
    };

    if (!reduceMotion) {
      lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 0.85 });
      if (document.querySelector(".ascii-portal")) {
        lenis.stop();
      }
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    const handlePhaseChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ phase: string }>;
      const phase = customEvent.detail.phase;
      if (phase !== "done") {
        lenis?.stop();
      } else {
        lenis?.start();
      }
    };
    window.addEventListener("portal-phase-change", handlePhaseChange);

    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-friend-section]").forEach((section) => {
        const index = Number(section.dataset.friendSection ?? 0);
        const label = section.dataset.sectionLabel ?? "";
        ScrollTrigger.create({
          trigger: section,
          start: "top 52%",
          end: "bottom 52%",
          onEnter: () => emitSection(index, label),
          onEnterBack: () => emitSection(index, label)
        });
      });

      if (!reduceMotion) {
        gsap.utils.toArray<HTMLElement>("[data-fx='blur-reveal']").forEach((element) => {
          gsap.fromTo(
            element,
            { autoAlpha: 0, y: 60, filter: "blur(18px)", scale: 0.96 },
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              scale: 1,
              duration: 1.15,
              ease: "power3.out",
              scrollTrigger: { trigger: element, start: "top 82%" }
            }
          );
        });
      } else {
        gsap.utils.toArray<HTMLElement>("[data-fx='blur-reveal']").forEach((element) => {
          gsap.set(element, { autoAlpha: 1, y: 0, filter: "blur(0px)", scale: 1 });
        });
      }

      gsap.utils.toArray<HTMLElement>("[data-fx='drift']").forEach((element, index) => {
        gsap.to(element, {
          x: index % 2 === 0 ? -44 : 48,
          y: index % 2 === 0 ? 34 : -28,
          rotate: index % 2 === 0 ? -3 : 3,
          ease: "none",
          scrollTrigger: {
            trigger: element,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8
          }
        });
      });

      const gallery = document.querySelector<HTMLElement>(".project-gallery");
      const stage = document.querySelector<HTMLElement>(".project-gallery-stage");
      if (gallery && stage && !reduceMotion && window.innerWidth > 860) {
        ScrollTrigger.create({
          trigger: gallery,
          start: "top top",
          end: "+=2600",
          pin: stage,
          scrub: true,
          onUpdate: (self) => {
            window.dispatchEvent(
              new CustomEvent("friend-gallery-progress", { detail: { progress: self.progress } })
            );
          }
        });
      }
    });

    emitSection(0, "開場");

    return () => {
      context.revert();
      gsap.ticker.remove(tick);
      lenis?.destroy();
      window.removeEventListener("portal-phase-change", handlePhaseChange);
    };
  }, []);

  return null;
}
