export type TypewriterStep = {
  text: string;
  delayMs: number;
};

type TypewriterPlanOptions = {
  random?: () => number;
  typoRate?: number;
  typoGlyphs?: string[];
};

const DEFAULT_TYPO_GLYPHS = ["欸", "啊", "嗯", "ㄟ"];

export const weddingWelcomeMessages = [
  "歡迎你",
  "我很期待你來",
  "一起來跟我們玩",
  "那天見",
  "記得留時間給我們",
  "來吃飯、拍照、說說話",
  "把那天留給我們一點點"
] as const;

function createDelay(random: () => number): number {
  return Math.round(40 + random() * 180);
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}

export function createTypewriterPlan(message: string, options: TypewriterPlanOptions = {}): TypewriterStep[] {
  const random = options.random ?? Math.random;
  const typoRate = options.typoRate ?? 0.24;
  const typoGlyphs = options.typoGlyphs ?? DEFAULT_TYPO_GLYPHS;
  const steps: TypewriterStep[] = [];
  let text = "";

  if (random() < typoRate) {
    text = pick(typoGlyphs, random);
    steps.push({ text, delayMs: createDelay(random) });
    text = "";
    steps.push({ text, delayMs: createDelay(random) });
  }

  for (const glyph of Array.from(message)) {
    text += glyph;
    steps.push({ text, delayMs: createDelay(random) });
  }

  return steps;
}

export function pickWeddingWelcomeMessage(random: () => number = Math.random): string {
  return pick(weddingWelcomeMessages, random);
}
