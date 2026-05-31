"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createGalleryProjects } from "@/components/friends/friendSections";
import { galleryPhotos } from "@/lib/photos";

export function ProjectGallery() {
  const projects = useMemo(() => createGalleryProjects(galleryPhotos), []);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeProject = projects[activeIndex];

  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

  useEffect(() => {
    const onProgress = (event: Event) => {
      const progress = (event as CustomEvent<{ progress?: number }>).detail?.progress ?? 0;
      const nextIndex = Math.min(projects.length - 1, Math.floor(progress * projects.length));
      setActiveIndex(nextIndex);
    };

    window.addEventListener("friend-gallery-progress", onProgress);
    return () => window.removeEventListener("friend-gallery-progress", onProgress);
  }, [projects.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const diffX = touchStartX - endX;
    const diffY = touchStartY - endY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        setActiveIndex((prev) => Math.min(projects.length - 1, prev + 1));
      } else {
        setActiveIndex((prev) => Math.max(0, prev - 1));
      }
    }
  };

  return (
    <section
      id="gallery"
      className="project-gallery"
      data-friend-section="4"
      data-section-label="照片"
      aria-labelledby="gallery-title"
    >
      <div
        className="project-gallery-stage"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
          <div className="project-copy">
          <p data-fx="blur-reveal">婚紗照</p>
          <h2 id="gallery-title" key={activeProject.id}>
            {activeProject.title}
          </h2>
          <span>{activeProject.titleAlt}</span>
        </div>

        <div className="project-media-shell" data-fx="drift">
          <div className="project-media-glow" />
          <Image
            key={activeProject.photo.id}
            src={activeProject.photo.src}
            alt={activeProject.photo.alt}
            width={activeProject.photo.width}
            height={activeProject.photo.height}
            sizes="(max-width: 768px) 86vw, 46vw"
            priority={activeIndex === 0}
          />
        </div>

        <div className="project-meta">
          <p>{activeProject.mood}</p>
          <ul>
            {activeProject.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </div>

        <div className="project-thumb-rail" aria-label="婚紗照場景選擇">
          {projects.map((project, index) => (
            <button
              className={index === activeIndex ? "active" : ""}
              type="button"
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
              key={project.id}
              aria-label={project.title}
            >
              <Image
                src={project.photo.src}
                alt=""
                width={project.photo.width}
                height={project.photo.height}
                sizes="56px"
              />
              <span>{String(index + 1).padStart(2, "0")}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
