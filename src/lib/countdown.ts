export type CountdownParts = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  isComplete: boolean;
};

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

export function createCountdownParts(target: Date, now = new Date()): CountdownParts {
  const distance = Math.max(0, target.getTime() - now.getTime());

  return {
    days: pad(Math.floor(distance / DAY)),
    hours: pad(Math.floor((distance % DAY) / HOUR)),
    minutes: pad(Math.floor((distance % HOUR) / MINUTE)),
    seconds: pad(Math.floor((distance % MINUTE) / SECOND)),
    isComplete: distance === 0
  };
}
