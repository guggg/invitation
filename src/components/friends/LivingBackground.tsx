"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const palettes = [
  ["#F8E7EA", "#F4DADF", "#EEF0F1"],
  ["#F3ECE5", "#EAE4DD", "#EFF1F0"],
  ["#E8EDF0", "#DDE5EA", "#F0E9E3"],
  ["#E7DED5", "#D8CFC4", "#F1E7E1"],
  ["#EEE9E2", "#E4E0D9", "#DEE7EC"],
  ["#E4EBEF", "#D6E0E8", "#ECE5DF"],
  ["#E3EAE9", "#D4DBD4", "#ECE3DA"],
  ["#F3E3E5", "#EAE0DB", "#E4EAED"],
  ["#F1E6E1", "#E8DDD7", "#ECEFF0"]
];
const POINTER_EFFECT_SCALE = 0.67;

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
          color += b3 * uColorB * (0.24 * ${POINTER_EFFECT_SCALE.toFixed(2)});
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
      const palette = palettes[index] ?? palettes[palettes.length - 1];
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
