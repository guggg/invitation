"use client";

import { motion } from "framer-motion";

type MusicToggleButtonProps = {
  isPlaying: boolean;
  onToggle: () => void;
  heights: number[];
  hint?: string | null;
  label: string;
};

export function MusicToggleButton({
  isPlaying,
  onToggle,
  heights,
  hint,
  label
}: MusicToggleButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={isPlaying}
      initial={{ padding: "14px 14px" }}
      whileHover={{ padding: "18px 22px" }}
      whileTap={{ padding: "18px 22px" }}
      transition={{ duration: 1, bounce: 0.6, type: "spring" }}
      className="music-skiper-toggle"
    >
      <motion.span
        initial={{ opacity: 0, filter: "blur(4px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, filter: "blur(4px)" }}
        transition={{ type: "spring", bounce: 0.35 }}
        className="music-skiper-toggle-core"
      >
        {heights.map((height, index) => (
          <motion.span
            key={index}
            className="music-skiper-toggle-bar"
            initial={{ height: 1 }}
            animate={{ height: Math.max(4, height * 14) }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
          />
        ))}
      </motion.span>
      {hint ? <span className="music-skiper-toggle-hint">{hint}</span> : null}
    </motion.button>
  );
}

