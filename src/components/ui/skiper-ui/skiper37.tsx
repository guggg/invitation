"use client";

import NumberFlow from "@number-flow/react";

type AnimatedNumberProps = {
  value: number;
  padDigits?: number;
  className?: string;
};

export function AnimatedNumber({ value, padDigits = 2, className }: AnimatedNumberProps) {
  return (
    <NumberFlow
      value={value}
      className={className}
      format={{
        minimumIntegerDigits: padDigits,
        useGrouping: false
      }}
      trend={0}
      transformTiming={{
        duration: 650,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)"
      }}
      spinTiming={{
        duration: 650,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)"
      }}
      opacityTiming={{
        duration: 380,
        easing: "ease-out"
      }}
    />
  );
}
