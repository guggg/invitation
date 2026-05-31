"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const palettes = [
  ["#F7F6F2", "#F6D6DC", "#B7C7D9"],
  ["#F6D6DC", "#E6E0D6", "#B8C4B1"],
  ["#B7C7D9", "#F7F6F2", "#E6E0D6"],
  ["#B8C4B1", "#F7F6F2", "#F6D6DC"],
  ["#E6E0D6", "#B7C7D9", "#B8C4B1"],
  ["#F7F6F2", "#B8C4B1", "#F6D6DC"],
  ["#F6D6DC", "#B7C7D9", "#E6E0D6"]
];

export function LivingBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      mount.dataset.reducedMotion = "true";
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      mount.dataset.webglFallback = "true";
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uColorA: { value: new THREE.Color(palettes[0][0]) },
      uColorB: { value: new THREE.Color(palettes[0][1]) },
      uColorC: { value: new THREE.Color(palettes[0][2]) },
      uIntensity: { value: 0.5 }
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uPointer;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;
        uniform float uIntensity;

        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float blob(vec2 p, vec2 center, float scale) {
          vec2 d = p - center;
          return exp(-dot(d, d) * scale);
        }

        void main() {
          vec2 uv = vUv;
          vec2 flow = uv + vec2(sin(uTime * 0.08 + uv.y * 5.0), cos(uTime * 0.07 + uv.x * 4.0)) * 0.06;
          float b1 = blob(flow, vec2(0.26 + sin(uTime * 0.14) * 0.08, 0.54), 12.0);
          float b2 = blob(flow, vec2(0.76, 0.40 + cos(uTime * 0.12) * 0.12), 10.0);
          float b3 = blob(flow, uPointer, 18.0);
          float grain = noise(uv * 800.0 + uTime) * 0.075;
          vec3 color = mix(uColorA, uColorB, b1 * uIntensity);
          color = mix(color, uColorC, b2 * 0.42);
          color += b3 * uColorB * 0.24;
          color += grain;
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });

    scene.add(new THREE.Mesh(geometry, material));

    const pointer = new THREE.Vector2(0.5, 0.5);
    const targetColors = palettes[0].map((color) => new THREE.Color(color));
    let frame = 0;

    const onPointerMove = (event: PointerEvent) => {
      pointer.set(event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight);
    };

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const onSectionChange = (event: Event) => {
      const index = (event as CustomEvent<{ index?: number }>).detail?.index ?? 0;
      const palette = palettes[index % palettes.length];
      targetColors[0].set(palette[0]);
      targetColors[1].set(palette[1]);
      targetColors[2].set(palette[2]);
      uniforms.uIntensity.value = index === 4 ? 0.56 : 0.5;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("resize", onResize);
    window.addEventListener("friend-section-change", onSectionChange);

    const render = () => {
      frame = requestAnimationFrame(render);
      uniforms.uTime.value += 0.018;
      uniforms.uPointer.value.lerp(pointer, 0.08);
      uniforms.uColorA.value.lerp(targetColors[0], 0.024);
      uniforms.uColorB.value.lerp(targetColors[1], 0.024);
      uniforms.uColorC.value.lerp(targetColors[2], 0.024);
      renderer.render(scene, camera);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("friend-section-change", onSectionChange);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="living-background" ref={mountRef} aria-hidden="true">
      <div className="living-background-fallback" />
      <div className="living-background-noise" />
    </div>
  );
}
