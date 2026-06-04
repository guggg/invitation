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

      const scheduleCards = gsap.utils.toArray<HTMLElement>("[data-fx='schedule-card']");
      const scheduleTheatre = document.querySelector<HTMLElement>(".schedule-theatre");
      const scheduleScenes = document.querySelector<HTMLElement>(".schedule-scenes");
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

        if (scheduleTheatre && scheduleScenes && window.innerWidth > 860) {
          const activateScheduleScene = (activeIndex: number) => {
            scheduleCards.forEach((card, index) => {
              card.classList.toggle("is-scroll-active", index === activeIndex);
            });
          };

          const scheduleScrollLength = Math.max(1800, scheduleCards.length * 720);

          ScrollTrigger.create({
            trigger: scheduleTheatre,
            start: "top top",
            end: `+=${scheduleScrollLength}`,
            pin: true,
            scrub: true,
            onEnter: () => {
              scheduleTheatre.classList.add("is-scroll-driven");
              activateScheduleScene(-1);
            },
            onEnterBack: () => {
              scheduleTheatre.classList.add("is-scroll-driven");
            },
            onLeave: () => {
              scheduleTheatre.classList.remove("is-scroll-driven");
              activateScheduleScene(scheduleCards.length - 1);
            },
            onLeaveBack: () => {
              scheduleTheatre.classList.remove("is-scroll-driven");
              activateScheduleScene(-1);
            },
            onUpdate: (self) => {
              const progress = Math.max(0, Math.min(self.progress, 0.9999));
              const activationThreshold = 0.045;
              const activeIndex =
                progress < activationThreshold
                  ? -1
                  : Math.min(
                      scheduleCards.length - 1,
                      Math.floor(((progress - activationThreshold) / (1 - activationThreshold)) * scheduleCards.length)
                    );
              activateScheduleScene(activeIndex);
            }
          });

          gsap.to(scheduleScenes, {
            "--schedule-line-scale": 1,
            "--schedule-line-opacity": 1,
            ease: "none",
            scrollTrigger: {
              trigger: scheduleTheatre,
              start: "top top",
              end: `+=${scheduleScrollLength}`,
              scrub: true
            }
          });
        } else {
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
        }
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
