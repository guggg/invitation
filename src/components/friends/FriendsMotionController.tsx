"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

function emitSection(index: number, label: string) {
  window.dispatchEvent(new CustomEvent("friend-section-change", { detail: { index, label } }));
}

function lockSectionRail(index: number | null) {
  window.dispatchEvent(new CustomEvent("friend-section-lock", { detail: { index } }));
}

function setSectionRailHidden(hidden: boolean) {
  window.dispatchEvent(new CustomEvent("friend-section-rail-visibility", { detail: { hidden } }));
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
    const disposers: Array<() => void> = [];

    const context = gsap.context(() => {
      let lockedSectionIndex: number | null = null;

      const setLockedSection = (index: number | null, label = "") => {
        lockedSectionIndex = index;
        lockSectionRail(index);
        if (typeof index === "number") {
          emitSection(index, label);
        }
      };

      const emitUnlockedSection = (index: number, label: string) => {
        if (lockedSectionIndex !== null && index !== lockedSectionIndex) {
          return;
        }
        emitSection(index, label);
      };
      const sectionTriggers: ScrollTrigger[] = [];

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

      const scheduleCards = gsap.utils.toArray<HTMLElement>("[data-fx='schedule-card']");
      if (!reduceMotion) {
        gsap.fromTo(
          scheduleCards,
          {
            autoAlpha: 0,
            x: (index) => (index === 0 ? -110 : index === 2 ? 110 : 0),
            y: (index) => (index === 1 ? 96 : 62),
            rotateX: 12,
            rotateY: (index) => (index === 0 ? -10 : index === 2 ? 10 : 0),
            z: -120,
            filter: "blur(18px)",
            scale: 0.88
          },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            rotateX: 0,
            rotateY: 0,
            z: 0,
            filter: "blur(0px)",
            scale: 1,
            duration: 1.2,
            stagger: 0.14,
            ease: "expo.out",
            scrollTrigger: {
              trigger: ".schedule-scenes",
              start: "top 78%",
              once: true
            }
          }
        );

        gsap.fromTo(
          ".schedule-scenes",
          { "--schedule-line-scale": 0, "--schedule-line-opacity": 0 },
          {
            "--schedule-line-scale": 1,
            "--schedule-line-opacity": 1,
            duration: 1.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".schedule-scenes",
              start: "top 76%",
              once: true
            }
          }
        );
      } else {
        gsap.set(scheduleCards, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          rotateX: 0,
          rotateY: 0,
          z: 0,
          filter: "blur(0px)",
          scale: 1
        });
        gsap.set(".schedule-scenes", { "--schedule-line-scale": 1, "--schedule-line-opacity": 1 });
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

      const objectRiseTargets = gsap.utils.toArray<HTMLElement>(
        [
          ".dress-code-swatch",
          ".dress-code-notes",
          ".project-meta",
          ".project-thumb-rail",
          ".photo-upload-friend",
          ".shuttle-board-wrap",
          ".shuttle-tips-card",
          ".shuttle-picker-card"
        ].join(", ")
      );

      if (!reduceMotion) {
        objectRiseTargets.forEach((element, index) => {
          gsap.fromTo(
            element,
            {
              autoAlpha: 0,
              y: 42,
              rotate: index % 2 === 0 ? -1.6 : 1.6,
              filter: "blur(12px)",
              scale: 0.985
            },
            {
              autoAlpha: 1,
              y: 0,
              rotate: 0,
              filter: "blur(0px)",
              scale: 1,
              duration: 0.95,
              ease: "power3.out",
              scrollTrigger: {
                trigger: element,
                start: "top 84%",
                once: true
              }
            }
          );
        });
      } else {
        gsap.set(objectRiseTargets, { autoAlpha: 1, y: 0, rotate: 0, filter: "blur(0px)", scale: 1 });
      }

      const gallery = document.querySelector<HTMLElement>(".project-gallery");
      const stage = document.querySelector<HTMLElement>(".project-gallery-stage");
      if (gallery && stage && !reduceMotion && window.innerWidth > 860) {
        ScrollTrigger.create({
          trigger: gallery,
          start: "top top",
          end: "+=2600",
          pin: stage,
          scrub: true,
          onEnter: () => {
            setLockedSection(5, "照片");
            setSectionRailHidden(true);
          },
          onEnterBack: () => {
            setLockedSection(5, "照片");
            setSectionRailHidden(true);
          },
          onLeave: () => {
            setLockedSection(null);
            setSectionRailHidden(false);
          },
          onLeaveBack: () => {
            setLockedSection(null);
            setSectionRailHidden(false);
          },
          onUpdate: (self) => {
            window.dispatchEvent(
              new CustomEvent("friend-gallery-progress", { detail: { progress: self.progress } })
            );
          }
        });
      }

      gsap.utils.toArray<HTMLElement>("[data-friend-section]").forEach((section) => {
        const index = Number(section.dataset.friendSection ?? 0);
        const label = section.dataset.sectionLabel ?? "";
        sectionTriggers.push(
          ScrollTrigger.create({
            trigger: section,
            start: "top 52%",
            end: "bottom 52%",
            onEnter: () => emitUnlockedSection(index, label),
            onEnterBack: () => emitUnlockedSection(index, label)
          })
        );
      });

      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });

    });

    emitSection(0, "開場");
    lockSectionRail(null);
    setSectionRailHidden(false);

    return () => {
      disposers.forEach((dispose) => dispose());
      context.revert();
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lockSectionRail(null);
      setSectionRailHidden(false);
      window.removeEventListener("portal-phase-change", handlePhaseChange);
    };
  }, []);

  return null;
}
