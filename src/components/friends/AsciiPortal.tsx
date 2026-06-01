"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { clsx } from "clsx";
import {
  PORTAL_AUDIO_CUE_PHASE,
  PORTAL_INTRO_ENTER_EVENT,
  PORTAL_PHASE_CHANGE_EVENT
} from "@/lib/portal-events";

type PortalPhase = "idle" | "transition" | "done";

type GridSize = {
  cols: number;
  rows: number;
};

const introPhrases = ["Yuan & 4J's Wedding", "2026.10.3", "4J & Yuan's Wedding", "優聖美地"];
const CHAR_WIDTH = 7.2;
const LINE_HEIGHT = 13;
const TRANSITION_MS = 8100;
const AUDIO_CUE_MS_BEFORE_END = 1000;
const RAMP = " .`':-=/+<>!?235689AON";
const NOISE = ".,-:;_+/<>=!?123456890AONN";

type PortalObject = {
  name: PortalSceneName;
  start: number;
  end: number;
};

type PortalSceneName = "rings" | "shoes" | "balloons" | "flowers" | "petals" | "title";

const LEGACY_FIELD_OBJECT_SCENES_ENABLED = false;

const LEGACY_FIELD_OBJECTS: PortalObject[] = [
  { name: "rings", start: 0.1, end: 0.31 },
  { name: "shoes", start: 0.27, end: 0.47 },
  { name: "balloons", start: 0.43, end: 0.62 },
  { name: "flowers", start: 0.58, end: 0.78 },
  { name: "petals", start: 0.76, end: 0.91 }
];

const PORTAL_OBJECTS: PortalObject[] = [
  // Legacy generated-field object scenes are intentionally disabled while the new
  // specimen renderers handle the visible wedding objects.
  ...(LEGACY_FIELD_OBJECT_SCENES_ENABLED ? LEGACY_FIELD_OBJECTS : []),
  { name: "title", start: 0.75, end: 0.99 }
];

const SCENE_RAMPS: Record<PortalSceneName, string> = {
  rings: " .,:-=/+<>OOO000@@",
  shoes: " .,:-_//\\\\||LL77",
  balloons: " .,:`'()oOO00@@",
  flowers: " .,:;+*xXoO@@",
  petals: " .`',:;~*+=-",
  title: " .,:;+=*#%@@"
};

const RINGS_TEMPLATE = [
  "                    /\\                    ",
  "                   /  \\                   ",
  "                  /____\\                  ",
  "                 /\\    /\\                 ",
  "                /__\\__/__\\                ",
  "                                             ",
  "        .----------------.  .----------------.        ",
  "      .'                  \\/                  '.      ",
  "     /                    /\\                    \\     ",
  "    |                    /  \\                    |    ",
  "    |                   /    \\                   |    ",
  "     \\                 /      \\                 /     ",
  "      '.             .'        '.             .'      ",
  "        '-----------'            '-----------'        ",
  "                                             ",
  "             .------------------------.             ",
  "           .'                          '.           ",
  "          /                              \\          ",
  "          \\                              /          ",
  "           '.                          .'           ",
  "             '------------------------'             "
];

const SHOES_TEMPLATE = [
  "                                                         ",
  "          ___..---.                         ___..---.          ",
  "       .-'        \\__                    .-'        \\__       ",
  "      /              \\__                /              \\__     ",
  "     /      .----.      \\              /      .----.      \\    ",
  "    /______/      \\______\\            /______/      \\______\\   ",
  "         /          \\                      /          \\         ",
  "        /            \\                    /            \\        ",
  "       /              \\                  /              \\       ",
  "      /                \\                /                \\      ",
  " ____/__________________\\____      ____/__________________\\____ ",
  "/____________________________\\    /____________________________\\",
  "           ||                                  ||               ",
  "           ||                                  ||               ",
  "           ||                                  ||               ",
  "           ||                                  ||               "
];

const BALLOONS_TEMPLATE = [
  "            .------------.      .------------.      .------------.            ",
  "          .'              '.  .'              '.  .'              '.          ",
  "         /                  \\/                  \\/                  \\         ",
  "        |                   /\\                  /\\                   |        ",
  "        |                  /  \\                /  \\                  |        ",
  "         \\                /    \\              /    \\                /         ",
  "          '.            .'      '.          .'      '.            .'          ",
  "            '----------'          '--------'          '----------'            ",
  "                 \\                    |                    /                 ",
  "                  \\                   |                   /                  ",
  "                   \\                  |                  /                   ",
  "                    \\                 |                 /                    ",
  "                     \\                |                /                     ",
  "                      \\               |               /                      ",
  "                       \\              |              /                       ",
  "                        \\             |             /                        ",
  "                         \\            |            /                         ",
  "                          \\           |           /                          "
];

const FLOWERS_TEMPLATE = [
  "                   @@@        @@@        @@@                   ",
  "                 @@   @@    @@   @@    @@   @@                 ",
  "              @@@  @@@  @@@@  @@@  @@@@  @@@  @@@              ",
  "             @@      @@@@      @@@@      @@@@      @@           ",
  "              @@@  @@@  @@@@  @@@  @@@@  @@@  @@@              ",
  "                 @@   @@    @@   @@    @@   @@                 ",
  "                   @@@        @@@        @@@                   ",
  "                     \\          |          /                    ",
  "                      \\         |         /                     ",
  "                       \\        |        /                      ",
  "                        \\       |       /                       ",
  "             @@@         \\      |      /         @@@            ",
  "           @@   @@        \\     |     /        @@   @@          ",
  "        @@@  @@@  @@@      \\    |    /      @@@  @@@  @@@       ",
  "       @@      @@@@      @@@ \\   |   / @@@      @@@@      @@     ",
  "        @@@  @@@  @@@       \\  |  /       @@@  @@@  @@@        ",
  "           @@   @@           \\ | /           @@   @@           ",
  "             @@@              \\|/              @@@             ",
  "                  .----------------------------.                ",
  "                .'                              '.              ",
  "               /                                  \\             ",
  "               '----------------------------------'             "
];

const PETALS_TEMPLATE = [
  "       `        '            .          `        '         ",
  "              .        `          '             .          ",
  "    '                 .             `                      ",
  "            `                '                .            ",
  "                   .                `                      ",
  "      .                    '                   `           ",
  "                                                           ",
  "                                                           ",
  "          .      `      .       '      `      .            ",
  "       `     .      '       .      `      .       '        ",
  "    .     `      .      `      .      '      .      `      ",
  "  -------------------------------------------------------  ",
  "    .  `   .   '   .  `   .   '   .  `   .   '   .       ",
  "      -------------------------------------------------    "
];

const BOUQUET_SPECIMEN_FALLBACK = String.raw`
                                      .                 .                 .
                         .:;i|\/|i;:.          .:;i|\/|i;:.          .:;i|\/|i;:.
                     .;i|/    _.._   \|i;.  .;i|/   _.._    \|i;.  .;i|/   _.._    \|i;.
                  .;i|/   .oO@@@@@Oo.  \|ii|/  .oO@@@@@Oo.   \|ii|/  .oO@@@@@Oo.   \|i;.
                .i|/    .O@@8#####8@@O.  \/  .O@@8#####8@@O.   \/  .O@@8#####8@@O.   \|i.
              .i|/     O@@#  .---.  #@@O     O@@#  .---.  #@@O     O@@#  .---.  #@@O    \|i.
             i|/      O@@#  /@@@@@\  #@@O   O@@#  /@@@@@\  #@@O   O@@#  /@@@@@\  #@@O     \|i
            /|        8@@#  |@@ @@|  #@@8   8@@#  |@@ @@|  #@@8   8@@#  |@@ @@|  #@@8      |\
           /|     .:. O@@#  \@@@@@/  #@@O . O@@#  \@@@@@/  #@@O . O@@#  \@@@@@/  #@@O .:.  |\
          /|    .:oOo:.O@@8#'-----'#8@@O.:o:.O@@8#'-----'#8@@O.:o:.O@@8#'-----'#8@@O.:oOo:. |\
              .:oO@@@Oo:'O@@@@@@@@@@O'.:oO@Oo:'O@@@@@@@@@@O'.:oO@Oo:'O@@@@@@@@@@O'.:oO@@@Oo:.
            .:O@@8#8@@O:.  'oO@@@Oo'  .:O@@@O:.  'oO@@@Oo'  .:O@@@O:.  'oO@@@Oo'  .:O@@8#8@@O:.
           :O@@#  |  #@@O:    .|.    :O@@# #@@O:    .|.    :O@@# #@@O:    .|.    :O@@#  |  #@@O:
          :8@@#  \|/  #@@8:  \ | /  :8@@#   #@@8:  \ | /  :8@@#   #@@8:  \ | /  :8@@#  \|/  #@@8:
          :O@@# --+-- #@@O: --\|/-- :O@@#   #@@O: --\|/-- :O@@#   #@@O: --\|/-- :O@@# --+-- #@@O:
           :O@@8_/|\_8@@O:    /|\    :O@@8_8@@O:    /|\    :O@@8_8@@O:    /|\    :O@@8_/|\_8@@O:
            ':O@@@@@@@@O:'   / | \    ':O@@@@O:'   / | \    ':O@@@@O:'   / | \    ':O@@@@@@@@O:'
        .       ':oOo:'        |         ':o:'       |         ':o:'       |          ':oOo:'       .
      .:|\:.        .      .---+---.         .   .---+---.         .   .---+---.        .       .:/|\:.
    .:/ | \:.    .:/|\:.  /  .oOo.  \    .:/|\:/  .oOo.  \:/|\:.    /  .oOo.  \  .:/|\:.    .:/ | \:.
  .:/  / \  \:..:/  |  \:.\ :O@@@O: /:..:/  |  \:.\:O@@@O:/:/ | \:..:\ :O@@@O: /.:/  |  \:..:/  / \  \:.
 .:   /   \   :.    |     :.:8@/|\@8:.     / \     :8@/|\@8:   / \     .:8@/|\@8:.    |    .:   /   \   :.
     / .:. \       / \      :8@\|/@8:     / . \    :8@\|/@8:  / . \    :8@\|/@8:     / \       / .:. \
    /.:ooo:.\     / . \      ':O@O:'     /.:o:.\    ':O@O:'  /.:o:.\    ':O@O:'     / . \     /.:ooo:.\
    :oO@@@Oo:    /.:o:.\       |         :oO@Oo:      |      :oO@Oo:      |        /.:o:.\    :oO@@@Oo:
    :O@/|\@O:    :oO@Oo:      \|/        :O/|\O:     \|/     :O/|\O:     \|/       :oO@Oo:    :O@/|\@O:
     :O\|/O:     :O/|\O:      /|\         ':|:'      /|\      ':|:'      /|\       :O/|\O:     :O\|/O:
      ':|:'       ':|:'      / | \          |       / | \       |       / | \       ':|:'       ':|:'
        |           |         /|\           |         /|\        |        /|\          |           |
       \|/         \|/   .--//|\\--.      \|/   .--//|\\--.   \|/   .--//|\\--.     \|/         \|/
        |           |  .://///|\\\\\:.     |  .://///|\\\\\:.  |  .://///|\\\\\:.    |           |
         \          | .://////|\\\\\\:.   /  .://////|\\\\\\:.\   .://////|\\\\\\:.  |          /
          \         |.:///////|\\\\\\\:._/_.:///////|\\\\\\\:. \_.:///////|\\\\\\\:. |         /
           \        ://///////|\\\\\\\\\:   :////////|\\\\\\\\:   ://///////|\\\\\\\\\:        /
            \        '/////// | \\\\\\\'     '////// | \\\\\\'     '/////// | \\\\\\\'        /
             \          '///  |  \\\'          '///  |  \\\'          '///  |  \\\'          /
              \              \|/                    \|/                    \|/              /
               \              |                      |                      |              /
                \             |                      |                      |             /
                 \            |                      |                      |            /
                  \           |                      |                      |           /
                   \          |                      |                      |          /
                    \         |                      |                      |         /
                     \        |                      |                      |        /
                      \       |                      |                      |       /
                       \      |                      |                      |      /
                        \     |                      |                      |     /
                         \    |                      |                      |    /
                          \   |                      |                      |   /
                           \  |                      |                      |  /
                            \ |                      |                      | /
                             \|                      |                      |/
                              |                      |                      |
                              |                      |                      |
                              |                  .---+---.                  |
                              |                 /===/+\\===\                 |
                              |                /===//|\\===\                |
                              |                \===\\|//===/                |
                              |                 '---\|/---'                 |
                              |                     \|/                     |
`.replace(/^\n/, "").replace(/\n$/, "");

function specimenHash(x: number, y: number, seed = 0) {
  return Math.abs(Math.sin(x * 29.371 + y * 61.913 + seed * 11.17) * 9317.13) % 1;
}

type SpecimenSceneName = "rings" | "shoes" | "balloons" | "bouquet";

type SpecimenScene = {
  name: SpecimenSceneName;
  start: number;
  end: number;
};

const SPECIMEN_SCENES: SpecimenScene[] = [
  { name: "rings", start: 0.1, end: 0.28 },
  // { name: "shoes", start: 0.27, end: 0.45 },
  { name: "balloons", start: 0.35, end: 0.53 },
  { name: "bouquet", start: 0.60, end: 0.78 }
];

function createSpecimenCanvas(progress: number, time: number, pointer: { x: number; y: number }, revealStart: number) {
  const cols = 150;
  const rows = 76;
  const reveal = smoothstep(revealStart, revealStart + 0.075, progress);
  const scanY = -0.92 + reveal * 1.92;
  const scanIntensity = 1 - smoothstep(revealStart + 0.055, revealStart + 0.085, progress);
  const pointerX = pointer.x * 2 - 1;
  const pointerY = pointer.y * 2 - 1;
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => " "));
  const weight = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
  const swayX = Math.round((pointerX * 1.45 + Math.sin(time * 1.1) * 0.55) * 1.35);
  const swayY = Math.round(pointerY * 0.75 + Math.sin(time * 0.8) * 0.35);

  const toCol = (x: number) => Math.round(((x + 1) / 2) * (cols - 1)) + swayX;
  const toRow = (y: number) => Math.round(((y + 1) / 2) * (rows - 1)) + swayY;
  const revealAllows = (row: number) => (row / (rows - 1)) * 2 - 1 <= scanY + 0.05;

  const put = (col: number, row: number, char: string, priority = 1) => {
    if (row < 0 || row >= rows || col < 0 || col >= cols || !revealAllows(row)) {
      return;
    }
    const flicker = specimenHash(col, row, Math.floor(time * 5));
    const nextChar = flicker > 0.965 && ".:,".includes(char) ? ":" : char;
    if (priority >= weight[row][col]) {
      grid[row][col] = nextChar;
      weight[row][col] = priority;
    }
  };

  const putNorm = (x: number, y: number, char: string, priority = 1) => put(toCol(x), toRow(y), char, priority);

  const putTextureNorm = (x: number, y: number, char: string, priority = 1) => {
    const col = toCol(x);
    const row = toRow(y);
    if (row < 0 || row >= rows || col < 0 || col >= cols || !revealAllows(row) || grid[row][col] !== " ") {
      return;
    }
    put(col, row, char, priority);
  };

  const erase = (col: number, row: number, priority = 9) => {
    if (row < 0 || row >= rows || col < 0 || col >= cols || !revealAllows(row)) {
      return;
    }
    if (priority >= weight[row][col]) {
      grid[row][col] = " ";
      weight[row][col] = priority;
    }
  };

  const lineChar = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (Math.abs(dx) < Math.abs(dy) * 0.35) {
      return "|";
    }
    if (Math.abs(dy) < Math.abs(dx) * 0.18) {
      return ".";
    }
    return dx * dy > 0 ? "\\" : "/";
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, priority = 3, char?: string) => {
    const c1 = toCol(x1);
    const r1 = toRow(y1);
    const c2 = toCol(x2);
    const r2 = toRow(y2);
    const steps = Math.max(Math.abs(c2 - c1), Math.abs(r2 - r1), 1);
    const nextChar = char ?? lineChar(x1, y1, x2, y2);
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      put(Math.round(c1 + (c2 - c1) * t), Math.round(r1 + (r2 - r1) * t), nextChar, priority);
    }
  };

  const drawQuadratic = (
    x1: number,
    y1: number,
    cx: number,
    cy: number,
    x2: number,
    y2: number,
    priority = 4,
    char?: string
  ) => {
    let previousX = x1;
    let previousY = y1;
    for (let step = 0; step <= 64; step += 1) {
      const t = step / 64;
      const inv = 1 - t;
      const x = inv * inv * x1 + 2 * inv * t * cx + t * t * x2;
      const y = inv * inv * y1 + 2 * inv * t * cy + t * t * y2;
      putNorm(x, y, char ?? lineChar(previousX, previousY, x, y), priority);
      previousX = x;
      previousY = y;
    }
  };

  const drawEllipse = (cx: number, cy: number, rx: number, ry: number, priority = 4, angleOffset = 0) => {
    const points = Math.max(38, Math.round(Math.max(rx, ry) * cols * 2.35));
    for (let index = 0; index < points; index += 1) {
      const angle = (index / points) * Math.PI * 2;
      const wobble = 1 + Math.sin(angle * 5 + cx * 7 + time * 0.45 + angleOffset) * 0.055;
      const x = cx + Math.cos(angle) * rx * wobble;
      const y = cy + Math.sin(angle) * ry * (1 + Math.cos(angle * 3 + angleOffset) * 0.035);
      const char =
        Math.abs(Math.cos(angle)) > 0.55
          ? Math.cos(angle) > 0
            ? ")"
            : "("
          : Math.abs(Math.sin(angle)) > 0.68
            ? ":"
            : ".";
      putNorm(x, y, char, priority);
    }
  };

  const drawRotatedEllipse = (cx: number, cy: number, rx: number, ry: number, angle: number, priority = 4) => {
    const points = Math.max(42, Math.round(Math.max(rx, ry) * cols * 2.15));
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    for (let index = 0; index < points; index += 1) {
      const theta = (index / points) * Math.PI * 2;
      const lx = Math.cos(theta) * rx;
      const ly = Math.sin(theta) * ry;
      const x = cx + lx * cos - ly * sin;
      const y = cy + lx * sin + ly * cos;
      const char = Math.abs(Math.cos(theta)) > 0.6 ? (Math.cos(theta) > 0 ? ")" : "(") : ".";
      putNorm(x, y, char, priority);
    }
  };

  const drawTextureEllipse = (
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    angle: number,
    seed: number,
    options: { inner?: number; outer?: number; threshold?: number; digits?: boolean } = {}
  ) => {
    const outer = options.outer ?? 0.96;
    const inner = options.inner ?? 0;
    const threshold = options.threshold ?? 0.23;
    const radius = Math.max(rx, ry) * 1.15;
    const minCol = Math.max(0, toCol(cx - radius) - 2);
    const maxCol = Math.min(cols - 1, toCol(cx + radius) + 2);
    const minRow = Math.max(0, toRow(cy - radius) - 2);
    const maxRow = Math.min(rows - 1, toRow(cy + radius) + 2);
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);

    for (let row = minRow; row <= maxRow; row += 1) {
      for (let col = minCol; col <= maxCol; col += 1) {
        const x = ((col - swayX) / (cols - 1)) * 2 - 1;
        const y = ((row - swayY) / (rows - 1)) * 2 - 1;
        const localX = (x - cx) * cos - (y - cy) * sin;
        const localY = (x - cx) * sin + (y - cy) * cos;
        const distance = Math.hypot(localX / rx, localY / ry);
        if (distance >= outer || distance <= inner) {
          continue;
        }
        const contour = smoothstep(outer, outer - 0.16, distance);
        const stripe = Math.abs(Math.sin(localX * 38 + localY * 12 + seed));
        const roll = specimenHash(col, row, seed + Math.floor(time * 2) * 0.29);
        if (roll > threshold + contour * 0.2 + smoothstep(0.12, 0.02, stripe) * 0.13) {
          continue;
        }
        const charRoll = specimenHash(col, row, seed + 7);
        const char = options.digits && charRoll > 0.82 ? "0" : charRoll > 0.62 ? ":" : ".";
        putTextureNorm(x, y, char);
      }
    }
  };

  const eraseRotatedEllipse = (cx: number, cy: number, rx: number, ry: number, angle: number, priority = 9) => {
    const radius = Math.max(rx, ry) * 1.15;
    const minCol = Math.max(0, toCol(cx - radius) - 2);
    const maxCol = Math.min(cols - 1, toCol(cx + radius) + 2);
    const minRow = Math.max(0, toRow(cy - radius) - 2);
    const maxRow = Math.min(rows - 1, toRow(cy + radius) + 2);
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);

    for (let row = minRow; row <= maxRow; row += 1) {
      for (let col = minCol; col <= maxCol; col += 1) {
        const x = ((col - swayX) / (cols - 1)) * 2 - 1;
        const y = ((row - swayY) / (rows - 1)) * 2 - 1;
        const localX = (x - cx) * cos - (y - cy) * sin;
        const localY = (x - cx) * sin + (y - cy) * cos;
        if (Math.hypot(localX / rx, localY / ry) <= 1) {
          erase(col, row, priority);
        }
      }
    }
  };

  const drawStar = (cx: number, cy: number, size: number, seed: number) => {
    const pulse = 1 + Math.sin(time * 1.8 + seed) * 0.12;
    drawLine(cx - size * pulse, cy, cx + size * pulse, cy, 5, ".");
    drawLine(cx, cy - size * pulse, cx, cy + size * pulse, 5, "|");
    drawLine(cx - size * 0.55, cy - size * 0.55, cx + size * 0.55, cy + size * 0.55, 4);
    drawLine(cx - size * 0.55, cy + size * 0.55, cx + size * 0.55, cy - size * 0.55, 4);
  };

  const finish = () => {
    if (scanIntensity > 0) {
      const scanRow = toRow(scanY);
      for (let col = Math.floor(cols * 0.22); col < Math.ceil(cols * 0.78); col += 1) {
        if (specimenHash(col, scanRow, time) > 0.18) {
          put(col, scanRow, specimenHash(col, scanRow, 2) > 0.5 ? "-" : "=", 6);
        }
      }
    }
    return grid.map((line) => line.join("")).join("\n");
  };

  return {
    cols,
    rows,
    putNorm,
    putTextureNorm,
    drawLine,
    drawQuadratic,
    drawEllipse,
    drawRotatedEllipse,
    drawTextureEllipse,
    eraseRotatedEllipse,
    drawStar,
    finish
  };
}

export function renderRingSpecimen(progress: number, time: number, pointer: { x: number; y: number }) {
  const canvas = createSpecimenCanvas(progress, time, pointer, 0.1);

  canvas.drawEllipse(0, 0.26, 0.65, 0.37, 5, 1);
  canvas.drawEllipse(0, 0.26, 0.47, 0.25, 5, 2);
  canvas.drawEllipse(0, 0.26, 0.56, 0.31, 3, 3);
  canvas.drawTextureEllipse(0, 0.26, 0.65, 0.37, 0, 11, { inner: 0.58, outer: 1.03, threshold: 0.62, digits: true });
  canvas.eraseRotatedEllipse(0, 0.26, 0.45, 0.23, 0, 9);
  canvas.drawEllipse(0, 0.26, 0.47, 0.25, 10, 2);

  canvas.drawLine(-0.12, -0.06, -0.05, -0.2, 5);
  canvas.drawLine(0.12, -0.06, 0.05, -0.2, 5);
  canvas.drawLine(-0.14, -0.06, 0.14, -0.06, 5, ".");
  canvas.drawLine(-0.06, -0.2, 0.06, -0.2, 5, ".");
  canvas.drawLine(-0.16, -0.2, 0, -0.48, 5);
  canvas.drawLine(0.16, -0.2, 0, -0.48, 5);
  canvas.drawLine(-0.16, -0.2, 0.16, -0.2, 5, ".");
  canvas.drawLine(-0.08, -0.34, 0.08, -0.34, 4, ".");
  canvas.drawLine(-0.08, -0.34, 0, -0.48, 4);
  canvas.drawLine(0.08, -0.34, 0, -0.48, 4);
  canvas.drawTextureEllipse(0, -0.29, 0.16, 0.2, 0, 12, { threshold: 0.58, digits: true });

  [
    [-0.5, -0.28, 0.045],
    [-0.14, 0.58, 0.035],
    [0.48, -0.08, 0.04],
    [0.36, 0.5, 0.028],
    [0.26, -0.52, 0.05]
  ].forEach(([x, y, size], index) => canvas.drawStar(x, y, size, index + 1));

  return canvas.finish();
}

export function renderShoesSpecimen(progress: number, time: number, pointer: { x: number; y: number }) {
  const canvas = createSpecimenCanvas(progress, time, pointer, 0.27);

  const drawLowShoe = (cx: number, cy: number, scale: number, seed: number) => {
    canvas.drawLine(cx - 0.48 * scale, cy + 0.2 * scale, cx + 0.44 * scale, cy + 0.23 * scale, 5, ".");
    canvas.drawQuadratic(cx - 0.48 * scale, cy + 0.16 * scale, cx - 0.3 * scale, cy - 0.1 * scale, cx - 0.05 * scale, cy - 0.14 * scale, 5);
    canvas.drawQuadratic(cx - 0.05 * scale, cy - 0.14 * scale, cx + 0.2 * scale, cy - 0.08 * scale, cx + 0.44 * scale, cy + 0.18 * scale, 5);
    canvas.drawQuadratic(cx - 0.35 * scale, cy + 0.06 * scale, cx - 0.08 * scale, cy - 0.04 * scale, cx + 0.2 * scale, cy + 0.04 * scale, 5, ".");
    canvas.drawQuadratic(cx - 0.23 * scale, cy - 0.02 * scale, cx - 0.05 * scale, cy - 0.11 * scale, cx + 0.12 * scale, cy - 0.04 * scale, 4);
    canvas.drawTextureEllipse(cx - 0.05 * scale, cy + 0.08 * scale, 0.45 * scale, 0.2 * scale, -0.05, seed, {
      outer: 0.98,
      threshold: 0.62,
      digits: true
    });
    canvas.eraseRotatedEllipse(cx - 0.08 * scale, cy + 0.03 * scale, 0.18 * scale, 0.06 * scale, -0.12, 9);
    canvas.drawQuadratic(cx - 0.26 * scale, cy + 0.04 * scale, cx - 0.08 * scale, cy - 0.08 * scale, cx + 0.12 * scale, cy + 0.02 * scale, 10, ".");
    canvas.drawLine(cx - 0.32 * scale, cy + 0.17 * scale, cx + 0.26 * scale, cy + 0.15 * scale, 4, ":");
  };

  const drawHighHeel = (cx: number, cy: number, scale: number, seed: number) => {
    canvas.drawLine(cx - 0.26 * scale, cy + 0.18 * scale, cx + 0.34 * scale, cy + 0.22 * scale, 5, ".");
    canvas.drawQuadratic(cx - 0.26 * scale, cy + 0.15 * scale, cx - 0.14 * scale, cy - 0.28 * scale, cx + 0.02 * scale, cy - 0.3 * scale, 5);
    canvas.drawQuadratic(cx + 0.02 * scale, cy - 0.3 * scale, cx + 0.25 * scale, cy - 0.2 * scale, cx + 0.34 * scale, cy + 0.18 * scale, 5);
    canvas.drawQuadratic(cx - 0.13 * scale, cy + 0.02 * scale, cx + 0.07 * scale, cy - 0.11 * scale, cx + 0.22 * scale, cy + 0.04 * scale, 5, ".");
    canvas.drawLine(cx + 0.22 * scale, cy + 0.19 * scale, cx + 0.28 * scale, cy + 0.55 * scale, 5);
    canvas.drawLine(cx + 0.33 * scale, cy + 0.2 * scale, cx + 0.4 * scale, cy + 0.55 * scale, 5);
    canvas.drawLine(cx + 0.23 * scale, cy + 0.56 * scale, cx + 0.43 * scale, cy + 0.56 * scale, 5, ".");
    canvas.drawTextureEllipse(cx + 0.04 * scale, cy + 0.03 * scale, 0.34 * scale, 0.38 * scale, 0.12, seed, {
      outer: 0.94,
      threshold: 0.56,
      digits: true
    });
    canvas.eraseRotatedEllipse(cx + 0.06 * scale, cy - 0.02 * scale, 0.14 * scale, 0.11 * scale, 0.2, 9);
    canvas.drawQuadratic(cx - 0.1 * scale, cy + 0.02 * scale, cx + 0.06 * scale, cy - 0.13 * scale, cx + 0.22 * scale, cy + 0.04 * scale, 10, ".");
  };

  drawLowShoe(-0.27, 0.13, 0.98, 20);
  drawHighHeel(0.34, 0.03, 0.9, 28);

  [
    [-0.58, -0.2, 0.036],
    [-0.34, 0.42, 0.025],
    [0.06, -0.43, 0.032],
    [0.55, -0.32, 0.045],
    [0.67, 0.24, 0.03]
  ].forEach(([x, y, size], index) => canvas.drawStar(x, y, size, index + 5));

  return canvas.finish();
}

export function renderBalloonSpecimen(progress: number, time: number, pointer: { x: number; y: number }) {
  const canvas = createSpecimenCanvas(progress, time, pointer, 0.35);
  const balloons = [
    [-0.36, -0.3, 0.15, 0.24],
    [-0.22, -0.62, 0.13, 0.23],
    [-0.08, -0.27, 0.14, 0.2],
    [0.08, -0.64, 0.15, 0.23],
    [0.22, -0.27, 0.13, 0.2],
    [0.34, -0.61, 0.13, 0.23],
    [0.43, -0.3, 0.14, 0.2],
    [-0.26, -0.02, 0.12, 0.18],
    [0.03, 0.02, 0.12, 0.19],
    [0.26, -0.02, 0.12, 0.18]
  ] as const;
  const knot = { x: 0.02, y: 0.86 };

  balloons.forEach(([x, y, rx, ry], index) => {
    const drift = Math.sin(time * 0.75 + index) * 0.01;
    canvas.drawEllipse(x + drift, y, rx, ry, 5, index);
    canvas.drawTextureEllipse(x + drift, y, rx, ry, 0, index + 44, {
      inner: 0.12,
      outer: 0.92,
      threshold: 0.28,
      digits: true
    });
    canvas.drawLine(x + drift, y + ry * 0.95, knot.x + (index - 4.5) * 0.012, knot.y, 3);
    canvas.drawLine(x + drift - 0.02, y + ry * 0.62, x + drift - 0.06, y + ry * 0.25, 4, ".");
  });

  canvas.drawEllipse(knot.x, knot.y, 0.07, 0.05, 5);
  for (let ribbon = 0; ribbon < 7; ribbon += 1) {
    const offset = (ribbon - 3) * 0.026;
    canvas.drawLine(knot.x + offset, knot.y + 0.02, knot.x + offset * 1.7, 1.02, 3);
  }

  [
    [-0.48, -0.06, 0.032],
    [-0.42, 0.46, 0.04],
    [-0.02, -0.72, 0.026],
    [0.42, -0.7, 0.03],
    [0.46, 0.28, 0.042]
  ].forEach(([x, y, size], index) => canvas.drawStar(x, y, size, index + 12));

  return canvas.finish();
}

type BouquetRenderMode = "linework" | "hybrid";

export function renderBouquetLineworkSpecimen(progress: number, time: number, pointer: { x: number; y: number }) {
  return generateBouquetSpecimen(BOUQUET_SPECIMEN_FALLBACK, progress, time, pointer, "linework");
}

export function renderBouquetHybridSpecimen(progress: number, time: number, pointer: { x: number; y: number }) {
  return generateBouquetSpecimen(BOUQUET_SPECIMEN_FALLBACK, progress, time, pointer, "hybrid");
}

export function renderBouquetSpecimen(progress: number, time: number, pointer: { x: number; y: number }) {
  return renderBouquetHybridSpecimen(progress, time, pointer);
}

function generateBouquetSpecimen(
  fallback: string,
  progress = 0.2,
  time = 0,
  pointer = { x: 0.5, y: 0.5 },
  mode: BouquetRenderMode = "hybrid"
) {
  const cols = 150;
  const rows = 76;
  const reveal = smoothstep(0.105, 0.19, progress);
  const scanY = -0.92 + reveal * 1.92;
  const scanIntensity = 1 - smoothstep(0.17, 0.195, progress);
  const pointerX = pointer.x * 2 - 1;
  const pointerY = pointer.y * 2 - 1;
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => " "));
  const weight = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
  const swayX = Math.round((pointerX * 1.8 + Math.sin(time * 1.1) * 0.65) * 1.4);
  const swayY = Math.round(pointerY * 0.9 + Math.sin(time * 0.8) * 0.4);

  const toCol = (x: number) => Math.round(((x + 1) / 2) * (cols - 1)) + swayX;
  const toRow = (y: number) => Math.round(((y + 1) / 2) * (rows - 1)) + swayY;
  const revealAllows = (row: number) => (row / (rows - 1)) * 2 - 1 <= scanY + 0.05;

  const put = (col: number, row: number, char: string, priority = 1) => {
    if (row < 0 || row >= rows || col < 0 || col >= cols || !revealAllows(row)) {
      return;
    }
    const flicker = specimenHash(col, row, Math.floor(time * 5));
    const nextChar = flicker > 0.965 && ".:".includes(char) ? ":" : char;
    if (priority >= weight[row][col]) {
      grid[row][col] = nextChar;
      weight[row][col] = priority;
    }
  };

  const putNorm = (x: number, y: number, char: string, priority = 1) => put(toCol(x), toRow(y), char, priority);

  const putTextureNorm = (x: number, y: number, char: string) => {
    const col = toCol(x);
    const row = toRow(y);
    if (row < 0 || row >= rows || col < 0 || col >= cols || !revealAllows(row)) {
      return;
    }
    if (grid[row][col] !== " ") {
      return;
    }
    put(col, row, char, 1);
  };

  const lineChar = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (Math.abs(dx) < Math.abs(dy) * 0.35) {
      return "|";
    }
    return dx * dy > 0 ? "\\" : "/";
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, priority = 2) => {
    const c1 = toCol(x1);
    const r1 = toRow(y1);
    const c2 = toCol(x2);
    const r2 = toRow(y2);
    const steps = Math.max(Math.abs(c2 - c1), Math.abs(r2 - r1), 1);
    const char = lineChar(x1, y1, x2, y2);
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      put(Math.round(c1 + (c2 - c1) * t), Math.round(r1 + (r2 - r1) * t), char, priority);
    }
  };

  const drawEllipse = (cx: number, cy: number, rx: number, ry: number, priority = 3) => {
    const points = Math.max(30, Math.round(rx * cols * 1.8));
    for (let index = 0; index < points; index += 1) {
      const angle = (index / points) * Math.PI * 2;
      const wobble = 1 + Math.sin(angle * 5 + cx * 7 + time * 0.4) * 0.08;
      const x = cx + Math.cos(angle) * rx * wobble;
      const y = cy + Math.sin(angle) * ry * (1 + Math.cos(angle * 3) * 0.04);
      const char =
        Math.abs(Math.cos(angle)) > 0.55
          ? Math.cos(angle) > 0
            ? ")"
            : "("
          : Math.abs(Math.sin(angle)) > 0.68
            ? ":"
            : ".";
      putNorm(x, y, char, priority);
    }
  };

  const drawRose = (cx: number, cy: number, r: number, seed: number) => {
    const rx = r * 0.86;
    const ry = r * 1.08;
    drawEllipse(cx, cy, rx, ry, 4);
    drawEllipse(cx - r * 0.14, cy + r * 0.02, rx * 0.58, ry * 0.42, 4);
    drawEllipse(cx + r * 0.15, cy - r * 0.02, rx * 0.54, ry * 0.38, 4);

    for (let t = 0; t < Math.PI * 4.6; t += 0.18) {
      const radius = (t / (Math.PI * 4.6)) * r * 0.9;
      const x = cx + Math.cos(t + seed) * radius * 0.82;
      const y = cy + Math.sin(t + seed) * radius * 1.02;
      const char = t % 0.72 < 0.26 ? (Math.cos(t + seed) > 0 ? ")" : "(") : t > Math.PI * 2.2 ? ":" : ".";
      putNorm(x, y, char, 5);
    }

    const digits = ["0", "6", "8", "9", "1"];
    for (let dot = 0; dot < 18; dot += 1) {
      const a = specimenHash(dot, seed, 1) * Math.PI * 2;
      const rr = specimenHash(dot, seed, 2) * r * 0.95;
      const x = cx + Math.cos(a) * rr * 0.82;
      const y = cy + Math.sin(a) * rr * 1.02;
      const char = specimenHash(dot, seed, time) > 0.48 ? ":" : digits[(dot + Math.floor(time * 2)) % digits.length];
      putNorm(x, y, char, char === ":" ? 2 : 3);
    }
  };

  const drawLeaf = (cx: number, cy: number, rx: number, ry: number, angle: number) => {
    const tipA = { x: cx + Math.cos(angle) * ry, y: cy + Math.sin(angle) * ry };
    const tipB = { x: cx - Math.cos(angle) * ry, y: cy - Math.sin(angle) * ry };
    drawLine(tipA.x, tipA.y, tipB.x, tipB.y, 2);
    for (let side = -1; side <= 1; side += 2) {
      for (let t = 0; t <= 1; t += 0.08) {
        const baseX = tipA.x + (tipB.x - tipA.x) * t;
        const baseY = tipA.y + (tipB.y - tipA.y) * t;
        const bulge = Math.sin(t * Math.PI) * rx * side;
        const x = baseX + Math.cos(angle + Math.PI / 2) * bulge;
        const y = baseY + Math.sin(angle + Math.PI / 2) * bulge;
        putNorm(x, y, side < 0 ? "/" : "\\", 2);
      }
    }
    putNorm(cx, cy, ":", 1);
  };

  const drawRoseTexture = (cx: number, cy: number, r: number, seed: number) => {
    const rx = r * 0.82;
    const ry = r * 1.02;
    const minCol = Math.max(0, toCol(cx - rx * 1.38) - 2);
    const maxCol = Math.min(cols - 1, toCol(cx + rx * 1.38) + 2);
    const minRow = Math.max(0, toRow(cy - ry * 1.38) - 2);
    const maxRow = Math.min(rows - 1, toRow(cy + ry * 1.38) + 2);

    for (let row = minRow; row <= maxRow; row += 1) {
      for (let col = minCol; col <= maxCol; col += 1) {
        const x = ((col - swayX) / (cols - 1)) * 2 - 1;
        const y = ((row - swayY) / (rows - 1)) * 2 - 1;
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        const distance = Math.hypot(dx, dy);
        if (distance >= 1.16 || distance <= 0.18) {
          continue;
        }

        const angle = Math.atan2(dy, dx);
        const petalBand = Math.abs(Math.sin(angle * 3.1 + distance * 8.5 + seed * 0.7));
        const bandStrength = smoothstep(0.45, 0.08, petalBand);
        const interior = smoothstep(1.08, 0.36, distance) * (1 - smoothstep(0.26, 0.18, distance));
        const outerAir = smoothstep(1.16, 0.92, distance) * (1 - smoothstep(0.92, 0.72, distance));
        const breath = Math.sin(time * 1.6 + seed + distance * 5) * 0.025;
        const threshold = 0.18 + interior * 0.34 + bandStrength * 0.16 + outerAir * 0.16 + breath;
        const roll = specimenHash(col, row, seed + Math.floor(time * 2) * 0.37);
        if (roll > threshold) {
          continue;
        }

        const charRoll = specimenHash(col, row, seed + 8);
        const char = charRoll > 0.88 ? ":" : charRoll > 0.42 ? "." : ",";
        putTextureNorm(x, y, char);
      }
    }

    for (let dot = 0; dot < 36; dot += 1) {
      const angle = specimenHash(dot, seed, 12) * Math.PI * 2 + Math.sin(time * 0.55 + seed) * 0.06;
      const radius = r * (0.24 + specimenHash(dot, seed, 13) * 0.74);
      const x = cx + Math.cos(angle) * radius * 0.82;
      const y = cy + Math.sin(angle) * radius * 1.02;
      const roll = specimenHash(dot, seed, 14 + Math.floor(time * 2) * 0.19);
      if (roll > 0.82) {
        continue;
      }
      putTextureNorm(x, y, roll > 0.58 ? ":" : ".");
    }
  };

  const drawLeafTexture = (cx: number, cy: number, rx: number, ry: number, angle: number, seed: number) => {
    const radius = Math.max(rx, ry) * 1.12;
    const minCol = Math.max(0, toCol(cx - radius) - 1);
    const maxCol = Math.min(cols - 1, toCol(cx + radius) + 1);
    const minRow = Math.max(0, toRow(cy - radius) - 1);
    const maxRow = Math.min(rows - 1, toRow(cy + radius) + 1);
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);

    for (let row = minRow; row <= maxRow; row += 1) {
      for (let col = minCol; col <= maxCol; col += 1) {
        const x = ((col - swayX) / (cols - 1)) * 2 - 1;
        const y = ((row - swayY) / (rows - 1)) * 2 - 1;
        const localX = (x - cx) * cos - (y - cy) * sin;
        const localY = (x - cx) * sin + (y - cy) * cos;
        const mask = Math.hypot(localX / rx, localY / ry);
        if (mask >= 0.9 || mask <= 0.15) {
          continue;
        }

        const midrib = smoothstep(0.18, 0.02, Math.abs(localX / rx));
        const threshold = 0.16 + midrib * 0.18;
        if (specimenHash(col, row, seed + Math.floor(time * 2) * 0.21) > threshold) {
          continue;
        }
        putTextureNorm(x, y, specimenHash(col, row, seed + 4) > 0.62 ? ":" : ".");
      }
    }
  };

  const roses = [
    [-0.34, -0.63, 0.095],
    [-0.1, -0.7, 0.11],
    [0.16, -0.64, 0.105],
    [0.38, -0.55, 0.09],
    [-0.48, -0.36, 0.1],
    [-0.22, -0.34, 0.11],
    [0.05, -0.36, 0.115],
    [0.31, -0.32, 0.1],
    [-0.12, -0.11, 0.095],
    [0.16, -0.11, 0.09]
  ] as const;

  for (const rose of roses) {
    const [x, y, r] = rose;
    drawLine(x * 0.55, y + r * 0.5, 0.01, 0.7, 1);
  }

  const sprigs = [
    [-0.05, 0.1, -0.55, -0.9],
    [0, 0.12, -0.25, -0.96],
    [0.04, 0.1, 0.2, -0.98],
    [0.08, 0.08, 0.55, -0.82],
    [-0.13, 0.04, -0.66, -0.22],
    [0.14, 0.04, 0.66, -0.2]
  ] as const;
  for (const [index, sprig] of sprigs.entries()) {
    const [x1, y1, x2, y2] = sprig;
    drawLine(x1, y1, x2, y2, 2);
    for (let bud = 1; bud <= 6; bud += 1) {
      const t = bud / 7;
      const x = x1 + (x2 - x1) * t + Math.sin(bud + index) * 0.018;
      const y = y1 + (y2 - y1) * t + Math.cos(bud * 1.4 + index) * 0.014;
      putNorm(x, y, bud % 2 === 0 ? "0" : ".", 3);
      drawLeaf(x, y, 0.018, 0.045, Math.atan2(y2 - y1, x2 - x1) + (bud % 2 === 0 ? 0.9 : -0.9));
    }
  }

  const leaves = [
    [-0.55, -0.5, 0.035, 0.12, -0.9],
    [-0.4, -0.1, 0.04, 0.13, -0.62],
    [-0.28, 0.04, 0.04, 0.13, 0.42],
    [0.26, 0.03, 0.04, 0.13, -0.42],
    [0.48, -0.1, 0.035, 0.12, 0.64],
    [0.55, -0.42, 0.035, 0.12, 0.88]
  ] as const;
  for (const leaf of leaves) {
    const [x, y, rx, ry, angle] = leaf;
    drawLeaf(x, y, rx, ry, angle);
  }

  roses.forEach(([x, y, r], index) => drawRose(x, y, r, index + 1));

  if (mode === "hybrid") {
    roses.forEach(([x, y, r], index) => drawRoseTexture(x, y, r, index + 13));
    leaves.forEach(([x, y, rx, ry, angle], index) => drawLeafTexture(x, y, rx, ry, angle, index + 31));
  }

  drawEllipse(0, 0.66, 0.15, 0.045, 5);
  drawEllipse(0, 0.72, 0.07, 0.06, 5);
  drawLine(-0.18, 0.67, -0.04, 0.72, 4);
  drawLine(0.18, 0.67, 0.04, 0.72, 4);
  drawLine(-0.02, 0.72, -0.04, 0.96, 3);
  drawLine(0.03, 0.72, 0.02, 0.96, 3);
  drawLine(-0.08, 0.8, -0.02, 0.96, 2);
  drawLine(0.08, 0.8, 0.02, 0.96, 2);

  if (scanIntensity > 0) {
    const scanRow = toRow(scanY);
    for (let col = Math.floor(cols * 0.24); col < Math.ceil(cols * 0.76); col += 1) {
      if (specimenHash(col, scanRow, time) > 0.18) {
        put(col, scanRow, specimenHash(col, scanRow, 2) > 0.5 ? "-" : "=", 6);
      }
    }
  }

  return grid.map((line) => line.join("")).join("\n") || fallback;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function hash(x: number, y: number, seed: number) {
  return Math.abs(Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123) % 1;
}

function charForDensity(density: number, x: number, y: number, seed: number, ramp = RAMP) {
  if (density <= 0.05) {
    return " ";
  }

  const jitter = (hash(x, y, seed) - 0.5) * 0.11;
  const index = Math.floor(clamp(density + jitter) * (ramp.length - 1));
  return ramp[index] ?? " ";
}

function noiseChar(x: number, y: number, seed: number) {
  return NOISE[Math.floor(hash(x, y, seed) * NOISE.length)] ?? ".";
}

function createTextMask(cols: number, rows: number, label: string | string[]) {
  if (typeof document === "undefined") {
    return new Uint8ClampedArray(cols * rows);
  }
  if (typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom")) {
    return new Uint8ClampedArray(cols * rows);
  }

  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  let context: CanvasRenderingContext2D | null = null;
  try {
    context = canvas.getContext("2d", { willReadFrequently: true });
  } catch {
    return new Uint8ClampedArray(cols * rows);
  }
  if (!context) {
    return new Uint8ClampedArray(cols * rows);
  }

  context.clearRect(0, 0, cols, rows);
  context.fillStyle = "#000";
  context.textAlign = "center";
  context.textBaseline = "middle";
  const labels = Array.isArray(label) ? label : [label];
  const longest = Math.max(...labels.map((line) => line.length));
  const fontSize = Math.max(10, Math.min(Math.floor(rows * 0.18), Math.floor(cols / (longest * 0.58))));
  const lineHeight = fontSize * 1.4;
  const startY = rows / 2 - ((labels.length - 1) * lineHeight) / 2;
  context.font = `900 ${fontSize}px system-ui, "PingFang TC", "Microsoft JhengHei", "Courier New", monospace`;
  labels.forEach((line, index) => {
    context.fillText(line, cols / 2, startY + index * lineHeight);
  });

  const data = context.getImageData(0, 0, cols, rows).data;
  const mask = new Uint8ClampedArray(cols * rows);
  for (let index = 0; index < mask.length; index += 1) {
    mask[index] = data[index * 4 + 3];
  }
  return mask;
}

function ainoLikeFigure(nx: number, ny: number, time: number, pointerX: number, pointerY: number) {
  const sway = Math.sin(time * 0.8 + ny * 5.2) * 0.035 + (pointerX - 0.5) * 0.035;
  const y = ny + (pointerY - 0.5) * 0.08;
  const x = nx - sway;
  const waist = 0.09 + 0.33 * Math.pow(Math.abs(y), 1.35);
  const torso = smoothstep(waist, waist - 0.055, Math.abs(x)) * smoothstep(1.08, 0.82, Math.abs(y));
  const edge = smoothstep(waist + 0.035, waist - 0.01, Math.abs(x)) - smoothstep(waist - 0.095, waist - 0.15, Math.abs(x));
  const head = smoothstep(0.19, 0.02, Math.hypot(x * 1.2, y + 0.78));
  const lower = smoothstep(0.28, 0.02, Math.hypot((x + 0.03) * 0.92, (y - 0.82) * 1.2));
  const armLeft = smoothstep(0.025, 0, Math.abs(y + 0.18 - (-1.25 * (x + 0.42)))) * smoothstep(0.48, 0.08, Math.abs(x + 0.46));
  const armRight = smoothstep(0.025, 0, Math.abs(y + 0.08 - (1.15 * (x - 0.43)))) * smoothstep(0.5, 0.08, Math.abs(x - 0.47));

  return clamp(torso * 0.76 + edge * 0.5 + head * 0.75 + lower * 0.38 + armLeft * 0.5 + armRight * 0.42);
}

function diagonalWake(nx: number, ny: number, time: number) {
  const a = Math.abs(ny + 0.78 - (nx + 0.9) * -0.78);
  const b = Math.abs(ny - 0.12 - (nx - 0.12) * 0.48);
  const c = Math.abs(ny + 0.58 + (nx - 0.58) * 0.34);
  return (
    smoothstep(0.032, 0, a) * smoothstep(0.95, 0.1, Math.abs(nx + 0.35)) +
    smoothstep(0.025, 0, b) * 0.7 +
    smoothstep(0.02, 0, c) * 0.58 +
    Math.max(0, Math.sin((nx - ny) * 42 + time * 2.6)) * 0.035
  );
}

function sceneWindow(progress: number, start: number, end: number) {
  return smoothstep(start, start + 0.045, progress) * (1 - smoothstep(end - 0.055, end, progress));
}

function lineDensity(nx: number, ny: number, ax: number, ay: number, bx: number, by: number, thickness = 0.025) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = nx - ax;
  const wy = ny - ay;
  const lengthSq = vx * vx + vy * vy;
  const t = lengthSq === 0 ? 0 : clamp((wx * vx + wy * vy) / lengthSq);
  const px = ax + vx * t;
  const py = ay + vy * t;
  return smoothstep(thickness * 2.6, thickness * 0.45, Math.hypot(nx - px, ny - py));
}

function ellipseFill(nx: number, ny: number, cx: number, cy: number, rx: number, ry: number) {
  return smoothstep(1.08, 0.78, Math.hypot((nx - cx) / rx, (ny - cy) / ry));
}

function templateGlyphDensity(char: string) {
  if (char === " ") {
    return 0;
  }
  if ("@#%80O".includes(char)) {
    return 1;
  }
  if ("\\/|()[]{}<>".includes(char)) {
    return 0.88;
  }
  if ("_-=".includes(char)) {
    return 0.76;
  }
  if ("+*xX".includes(char)) {
    return 0.72;
  }
  if (".'`,".includes(char)) {
    return 0.48;
  }
  return 0.66;
}

function templateDensity(
  nx: number,
  ny: number,
  template: string[],
  options: { centerX?: number; centerY?: number; scaleX?: number; scaleY?: number } = {}
) {
  const centerX = options.centerX ?? 0;
  const centerY = options.centerY ?? 0;
  const scaleX = options.scaleX ?? 1;
  const scaleY = options.scaleY ?? 1;
  const x = (nx - centerX) / scaleX;
  const y = (ny - centerY) / scaleY;
  if (Math.abs(x) > 1 || Math.abs(y) > 1) {
    return 0;
  }

  const height = template.length;
  const width = Math.max(...template.map((line) => line.length));
  const tx = ((x + 1) / 2) * (width - 1);
  const ty = ((y + 1) / 2) * (height - 1);
  const baseCol = Math.round(tx);
  const baseRow = Math.round(ty);
  let density = 0;

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      const row = baseRow + rowOffset;
      const col = baseCol + colOffset;
      if (row < 0 || row >= height || col < 0 || col >= width) {
        continue;
      }
      const line = template[row] ?? "";
      const char = line[col] ?? " ";
      const distance = Math.hypot(tx - col, ty - row);
      density = Math.max(density, templateGlyphDensity(char) * smoothstep(1.55, 0.08, distance));
    }
  }

  return density;
}

function ringOutline(nx: number, ny: number, centerX: number, centerY: number, radiusX: number, radiusY: number) {
  const distance = Math.hypot((nx - centerX) / radiusX, (ny - centerY) / radiusY);
  return smoothstep(0.16, 0.018, Math.abs(distance - 1));
}

function diamondDensity(nx: number, ny: number) {
  const x = Math.abs(nx);
  const y = Math.abs(ny + 0.36);
  const body = smoothstep(0.32, 0.03, x + y * 0.95);
  const cutLeft = lineDensity(nx, ny, -0.2, -0.55, 0, -0.17, 0.018);
  const cutRight = lineDensity(nx, ny, 0.2, -0.55, 0, -0.17, 0.018);
  const top = lineDensity(nx, ny, -0.22, -0.55, 0.22, -0.55, 0.02);
  return clamp(body * 0.55 + cutLeft * 0.35 + cutRight * 0.35 + top * 0.45);
}

function ringsDensity(nx: number, ny: number, time: number) {
  const drift = Math.sin(time * 1.4) * 0.01;
  const leftRing = ringOutline(nx, ny - drift, -0.28, 0.08, 0.22, 0.34);
  const rightRing = ringOutline(nx, ny + drift, 0.28, 0.08, 0.22, 0.34);
  const diamond = diamondDensity(nx, ny) * 0.78;
  const prongs = lineDensity(nx, ny, -0.08, -0.12, -0.04, -0.28, 0.018) + lineDensity(nx, ny, 0.08, -0.12, 0.04, -0.28, 0.018);
  const template = templateDensity(nx, ny, RINGS_TEMPLATE, { centerY: 0.02, scaleX: 0.92, scaleY: 0.86 });
  return clamp(template * 0.02 + leftRing + rightRing + diamond * 0.95 + prongs * 0.62);
}

function shoeDensity(nx: number, ny: number, cx: number) {
  const sole = lineDensity(nx, ny, cx - 0.38, 0.36, cx + 0.42, 0.36, 0.028);
  const toe = lineDensity(nx, ny, cx + 0.16, 0.18, cx + 0.42, 0.36, 0.03);
  const heel = lineDensity(nx, ny, cx - 0.33, 0.0, cx - 0.42, 0.36, 0.028);
  const strap = lineDensity(nx, ny, cx - 0.28, 0.08, cx - 0.05, -0.18, 0.024);
  const collar = lineDensity(nx, ny, cx - 0.18, -0.14, cx + 0.08, -0.14, 0.025);
  const back = lineDensity(nx, ny, cx + 0.08, -0.16, cx + 0.18, 0.28, 0.024);
  const body = lineDensity(nx, ny, cx - 0.18, 0.22, cx + 0.18, 0.22, 0.03);
  return clamp(sole + toe + heel + strap + collar + back + body);
}

function shoesDensity(nx: number, ny: number) {
  const template = templateDensity(nx, ny, SHOES_TEMPLATE, { centerY: 0.06, scaleX: 0.96, scaleY: 0.72 });
  return clamp(template * 0.96 + shoeDensity(nx, ny, -0.28) * 0.5 + shoeDensity(nx, ny, 0.34) * 0.52 + lineDensity(nx, ny, -0.06, 0.36, 0.12, 0.36, 0.02) * 0.25);
}

function balloonsDensity(nx: number, ny: number, time: number) {
  const sway = Math.sin(time * 1.5) * 0.025;
  const left = ringOutline(nx, ny, -0.48 + sway, -0.34, 0.2, 0.28) + ellipseFill(nx, ny, -0.48 + sway, -0.34, 0.16, 0.22) * 0.7;
  const middle = ringOutline(nx, ny, 0, -0.4, 0.22, 0.3) + ellipseFill(nx, ny, 0, -0.4, 0.17, 0.24) * 0.62;
  const right = ringOutline(nx, ny, 0.46 - sway, -0.3, 0.2, 0.28) + ellipseFill(nx, ny, 0.46 - sway, -0.3, 0.16, 0.22) * 0.7;
  const strings =
    lineDensity(nx, ny, -0.48 + sway, -0.08, -0.07, 0.42, 0.016) +
    lineDensity(nx, ny, 0, -0.1, 0, 0.42, 0.016) +
    lineDensity(nx, ny, 0.46 - sway, -0.04, 0.08, 0.42, 0.016);
  const template = templateDensity(nx, ny, BALLOONS_TEMPLATE, { centerY: 0.02, scaleX: 0.98, scaleY: 0.78 });
  return clamp(template * 0.94 + left * 0.9 + middle * 0.9 + right * 0.9 + strings * 0.42);
}

function flowerHeadDensity(nx: number, ny: number, cx: number, cy: number) {
  const petals =
    ellipseFill(nx, ny, cx - 0.09, cy, 0.08, 0.055) +
    ellipseFill(nx, ny, cx + 0.09, cy, 0.08, 0.055) +
    ellipseFill(nx, ny, cx, cy - 0.09, 0.055, 0.08) +
    ellipseFill(nx, ny, cx, cy + 0.09, 0.055, 0.08) +
    ellipseFill(nx, ny, cx - 0.06, cy - 0.06, 0.06, 0.055) +
    ellipseFill(nx, ny, cx + 0.06, cy + 0.06, 0.06, 0.055);
  const center = ellipseFill(nx, ny, cx, cy, 0.045, 0.045);
  return clamp(petals * 0.68 + center);
}

function flowersDensity(nx: number, ny: number) {
  const heads =
    flowerHeadDensity(nx, ny, -0.38, -0.2) +
    flowerHeadDensity(nx, ny, -0.05, -0.28) +
    flowerHeadDensity(nx, ny, 0.3, -0.16) +
    flowerHeadDensity(nx, ny, 0.58, -0.26) * 0.8;
  const stems =
    lineDensity(nx, ny, -0.38, -0.08, -0.18, 0.48, 0.018) +
    lineDensity(nx, ny, -0.05, -0.14, 0.0, 0.5, 0.018) +
    lineDensity(nx, ny, 0.3, -0.04, 0.14, 0.5, 0.018) +
    lineDensity(nx, ny, 0.58, -0.14, 0.34, 0.48, 0.018);
  const leaves =
    lineDensity(nx, ny, 0.2, 0.24, 0.42, 0.12, 0.022) +
    lineDensity(nx, ny, -0.22, 0.24, -0.46, 0.12, 0.022);
  const bed = lineDensity(nx, ny, -0.62, 0.5, 0.62, 0.5, 0.026);
  const template = templateDensity(nx, ny, FLOWERS_TEMPLATE, { centerY: 0.04, scaleX: 0.96, scaleY: 0.82 });
  return clamp(template * 0.94 + heads * 0.78 + stems * 0.34 + leaves * 0.42 + bed * 0.28);
}

function petalDensity(nx: number, ny: number, cx: number, cy: number, rotate = 0) {
  const cos = Math.cos(rotate);
  const sin = Math.sin(rotate);
  const x = (nx - cx) * cos + (ny - cy) * sin;
  const y = -(nx - cx) * sin + (ny - cy) * cos;
  return ellipseFill(x, y, 0, 0, 0.04, 0.012);
}

function petalsDensity(nx: number, ny: number, time: number) {
  const falling =
    petalDensity(nx, ny, -0.36, 0.28, -0.35) +
    petalDensity(nx, ny, -0.36, 0.28 + Math.sin(time) * 0.02, -0.35) +
    petalDensity(nx, ny, -0.12, 0.05 + Math.cos(time * 1.1) * 0.03, 0.42) +
    petalDensity(nx, ny, 0.18, 0.24 + Math.sin(time * 1.4) * 0.025, -0.2) +
    petalDensity(nx, ny, 0.44, 0.12 + Math.cos(time * 0.9) * 0.03, 0.3);
  const floor =
    lineDensity(nx, ny, -0.72, 0.7, 0.72, 0.7, 0.026) +
    lineDensity(nx, ny, -0.62, 0.77, 0.62, 0.77, 0.019) * 0.6 +
    petalDensity(nx, ny, -0.46, 0.68, 0.14) +
    petalDensity(nx, ny, -0.1, 0.72, -0.2) +
    petalDensity(nx, ny, 0.28, 0.68, 0.24);
  const template = templateDensity(nx, ny, PETALS_TEMPLATE, { centerY: 0.2, scaleX: 0.98, scaleY: 0.8 });
  return clamp(template * 0.9 + falling * 0.42 + floor * 0.48);
}

export function getPortalSceneStrength(progress: number, name: PortalSceneName) {
  const object = PORTAL_OBJECTS.find((item) => item.name === name);
  return object ? sceneWindow(progress, object.start, object.end) : 0;
}

export function getPortalSceneName(progress: number) {
  const active = PORTAL_OBJECTS.map((object) => ({
    ...object,
    opacity: sceneWindow(progress, object.start, object.end)
  })).reduce<(PortalObject & { opacity: number }) | null>((best, object) => {
    if (!best || object.opacity > best.opacity) {
      return object;
    }
    return best;
  }, null);

  return active && active.opacity > 0.04 ? active.name : null;
}

function getSpecimenSceneStrength(progress: number, scene: SpecimenScene) {
  return sceneWindow(progress, scene.start, scene.end);
}

function getSpecimenPortalStrength(progress: number) {
  return SPECIMEN_SCENES.reduce((strength, scene) => Math.max(strength, getSpecimenSceneStrength(progress, scene)), 0);
}

export function getSpecimenFieldOpacity(progress: number) {
  return 1 - getSpecimenPortalStrength(progress) * 0.93;
}

export function getSpecimenPortalSceneName(progress: number) {
  const active = SPECIMEN_SCENES.map((scene) => ({
    ...scene,
    opacity: getSpecimenSceneStrength(progress, scene)
  })).reduce<(SpecimenScene & { opacity: number }) | null>((best, scene) => {
    if (!best || scene.opacity > best.opacity) {
      return scene;
    }
    return best;
  }, null);

  return active && active.opacity > 0.05 ? active.name : null;
}

function titleDensity(textMask: Uint8ClampedArray, size: GridSize, row: number, col: number) {
  return (textMask[row * size.cols + col] ?? 0) / 255;
}

function getSceneDensityByName(scene: PortalSceneName, nx: number, ny: number, time: number) {
  if (scene === "rings") {
    return ringsDensity(nx, ny, time);
  }
  if (scene === "shoes") {
    return shoesDensity(nx, ny);
  }
  if (scene === "balloons") {
    return balloonsDensity(nx, ny, time);
  }
  if (scene === "flowers") {
    return flowersDensity(nx, ny);
  }
  if (scene === "petals") {
    return petalsDensity(nx, ny, time);
  }
  return 0;
}

function renderSpecimenByScene(scene: SpecimenSceneName, progress: number, time: number, pointer: { x: number; y: number }) {
  if (scene === "rings") {
    return renderRingSpecimen(progress, time, pointer);
  }
  if (scene === "shoes") {
    return renderShoesSpecimen(progress, time, pointer);
  }
  if (scene === "balloons") {
    return renderBalloonSpecimen(progress, time, pointer);
  }
  return renderBouquetSpecimen(progress, time, pointer);
}

const SPECIMEN_HUD: Record<
  SpecimenSceneName,
  { leftTop: string; leftMid: string; rightTop: string; rightMid: string; bottomLeft: string }
> = {
  rings: {
    leftTop: `///SYS:WED_RING
MODE: ASCII/GLYPH
TYPE: UNION_02
STAT: ONLINE
_`,
    leftMid: `>[LOVE_PROTOCOL]
( 1 0 1 0 )
/BOND:ACTIVE/
/VOW:LOCKED/
/HEART:SYNCED/
/FOREVER:TRUE/
_`,
    rightTop: `%_CEREMONY://v01
UNION: TWO_AS_ONE
TRUST:  100%
DEVOTION:  ++
ETERNITY:  ++
PROMISE:   ++
_`,
    rightMid: `/SIGNAL--RAW//
>> 0x7FEEAA77
>> 0x1ACC0E47
>> 0xADF00A11
>> 0x1E5A5A5E
>> 0xFEEDBEEF
_`,
    bottomLeft: `[-DATA-STREAM-]
7A 1F C9 3B A0 F1
5D 6E 22 9A 7C 11
C0 3F 98 6D 44 EE
_`
  },
  shoes: {
    leftTop: `///SYS:WED_SHOES
MODE: ASCII/GLYPH
TYPE: PAIR_02
STAT: ONLINE
_`,
    leftMid: `>[LOVE_PROTOCOL]
( 1 0 1 0 )
/PAIR:READY/
/STEP:SYNCED/
/AISLE:OPEN/
/FOREVER:TRUE/
_`,
    rightTop: `%_CEREMONY://v02
PAIR: TWO_AS_ONE
TRUST:  100%
DEVOTION:  ++
ETERNITY:  ++
PROMISE:   ++
_`,
    rightMid: `/SIGNAL--RAW//
>> 0x7FEEAA77
>> 0x1ACC0E47
>> 0xADF000A1
>> 0x1E5A5A5E
>> 0xFEEDBEEF
_`,
    bottomLeft: `[-DATA-STREAM-]
7A 1F C9 3B A0 F1
50 6E 22 9A 7C 11
C3 2C 98 60 A4 EE
_`
  },
  balloons: {
    leftTop: `///SYS:BALLOONS
MODE: ASCII/GLYPH
TYPE: AIR_10
STAT: ONLINE
_`,
    leftMid: `>[JOY_PROTOCOL]
( 1 1 0 1 )
/FLOAT:ACTIVE/
/STRING:LOCKED/
/ROOM:BRIGHT/
/CELEBRATE:TRUE/
_`,
    rightTop: `%_CEREMONY://v03
LIFT:  OPTIMAL
JOY:   100%
AIR:   ++
LIGHT: ++
VOW:   ++
_`,
    rightMid: `/SIGNAL--RAW//
>> 0x7FEEAA77
>> 0x1ACC0E47
>> 0xADF20BA1
>> 0x1E5A5A5E
>> 0xFEE0BEEF
_`,
    bottomLeft: `[-DATA-STREAM-]
7A 1F C9 38 A0 F1
50 6E 22 9A 7C 11
C3 2C 98 60 A4 EE
_`
  },
  bouquet: {
    leftTop: `///SYS:04
MODE: ASCII/FLWR
TYPE: BOUQUET_01
STAT: ONLINE
_`,
    leftMid: `>[POTENTIAL]
( 1 0 0 % )
/ROOTS:DEEP/
/STEM:STABLE/
/BLOOM:ACTIVE/
_`,
    rightTop: `%_GARDEN://+01
SEED_Y4J:PLANT
GROWTH : 100%
HEALTH : OPTIMAL
LIGHT  : ++
WATER  : ++
_`,
    rightMid: `/SIGNAL::RAW//
>> 0xFFEAA77
>> 0x1BCC0E47
>> 0xBADF0001
>> 0xD15E5A5E
>> 0xFEEDBEEF
_`,
    bottomLeft: `[-DATA-STREAM-]
3A 6F 2B 10 9E FF
7C A1 30 00 5B 8E
91 2F 6C AA 07 3C
_`
  }
};

export function getPortalSceneDensity(nx: number, ny: number, progress: number, time: number) {
  const scene = getPortalSceneName(progress);
  return scene ? getSceneDensityByName(scene, nx, ny, time) : 0;
}

function portalBurst(nx: number, ny: number, progress: number, pointerX: number, pointerY: number, time: number) {
  const originX = pointerX * 2 - 1;
  const originY = pointerY * 2 - 1;
  const distance = Math.hypot(nx - originX, ny - originY);
  const radius = progress * 2.35;
  const edge = smoothstep(0.08, 0, Math.abs(distance - radius));
  const spokes = Math.max(0, Math.sin(Math.atan2(ny - originY, nx - originX) * 18 + time * 2.2)) * 0.18;
  return edge * (1 - smoothstep(0.1, 0.18, progress)) + spokes * smoothstep(0.03, 0.13, progress) * (1 - smoothstep(0.15, 0.22, progress));
}

function generateField(size: GridSize, time: number, phase: PortalPhase, progress: number, pointer: { x: number; y: number }, textMask: Uint8ClampedArray) {
  const lines: string[] = [];
  const pointerX = pointer.x;
  const pointerY = pointer.y;
  const activeScene = phase === "transition" ? getPortalSceneName(progress) : null;
  const objectFocus = activeScene ? getPortalSceneStrength(progress, activeScene) : 0;
  const specimenFocus = phase === "transition" ? getSpecimenPortalStrength(progress) : 0;
  const chaos = phase === "transition" ? Math.sin(Math.PI * clamp(progress)) : 0;
  const exitFade = phase === "transition" ? 1 - smoothstep(0.92, 1, progress) : 1;

  for (let row = 0; row < size.rows; row += 1) {
    let line = "";
    const ny = (row / Math.max(1, size.rows - 1)) * 2 - 1;

    for (let col = 0; col < size.cols; col += 1) {
      const nx = (col / Math.max(1, size.cols - 1)) * 2 - 1;
      const n = hash(col, row, time * 0.8);
      const wave = Math.sin(col * 0.17 + row * 0.11 + time * 1.45) * 0.05;
      let density = 0;

      if (phase === "idle") {
        density = ainoLikeFigure(nx, ny, time, pointerX, pointerY);
        density += diagonalWake(nx, ny, time) * 0.42;
        density += n > 0.985 ? 0.28 : 0;
      }

      if (phase === "transition") {
        let sceneDensity = 0;
        for (const scene of PORTAL_OBJECTS) {
          const strength = sceneWindow(progress, scene.start, scene.end);
          if (strength <= 0.01) {
            continue;
          }
          const raw =
            scene.name === "title"
              ? titleDensity(textMask, size, row, col)
              : scene.name === "rings" && specimenFocus > 0.05
                ? 0
                : getSceneDensityByName(scene.name, nx, ny, time);
          sceneDensity = clamp(sceneDensity + raw * strength);
        }
        if (specimenFocus > 0.05) {
          density = 0;
        } else {
          const burst = portalBurst(nx, ny, progress, pointerX, pointerY, time);
          const edgeDust = n > 0.997 ? 0.12 : 0;
          const dissolve = n < chaos * 0.026 ? 0.16 * (1 - objectFocus * 0.7) : 0;
          const contour = Math.max(0, Math.sin((nx * 9 + ny * 12 + time * 1.4) * Math.PI)) * sceneDensity * 0.08;
          const wake =
            diagonalWake(nx, ny, time) *
            smoothstep(0.02, 0.14, progress) *
            (1 - smoothstep(0.16, 0.25, progress)) *
            (1 - objectFocus * 0.95) *
            0.34;

          density =
            burst +
            wake +
            sceneDensity * 1.85 +
            contour +
            edgeDust * (1 - objectFocus * 0.45) +
            dissolve;
        }
      }

      density = clamp((density + wave * Math.min(1, density * 2.2)) * exitFade);
      if (phase === "transition" && chaos > 0.12 && n < chaos * 0.05 * (1 - objectFocus * 0.6) && density > 0.04) {
        line += noiseChar(col, row, time);
      } else {
        line += charForDensity(density, col, row, time, activeScene ? SCENE_RAMPS[activeScene] : RAMP);
      }
    }
    lines.push(line);
  }

  return lines.join("\n");
}

function AsciiSpecimenStage({ progress, time, pointer }: { progress: number; time: number; pointer: { x: number; y: number } }) {
  const strength = getSpecimenPortalStrength(progress);
  const scene = getSpecimenPortalSceneName(progress);
  const sceneConfig = scene ? SPECIMEN_SCENES.find((item) => item.name === scene) : null;
  const sceneStart = sceneConfig?.start ?? 0.1;
  const sceneEnd = sceneConfig?.end ?? 0.78;
  const dissolve = smoothstep(sceneEnd - 0.06, sceneEnd, progress);
  const entry = smoothstep(sceneStart, sceneStart + 0.07, progress);
  const scan = smoothstep(sceneStart + 0.005, sceneStart + 0.085, progress);
  const scanOpacity = clamp(
    smoothstep(sceneStart + 0.005, sceneStart + 0.04, progress) *
    (1 - smoothstep(sceneStart + 0.055, sceneStart + 0.085, progress))
  );
  const opacity = clamp(strength * (1 - dissolve * 0.2));
  const specimen = scene ? renderSpecimenByScene(scene, progress, time, pointer) : "";
  const hud = scene ? SPECIMEN_HUD[scene] : SPECIMEN_HUD.bouquet;

  if (opacity <= 0.03 || !scene) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={clsx("ascii-specimen-stage", `ascii-specimen-stage--${scene}`)}
      style={
        {
          "--specimen-opacity": opacity,
          "--specimen-entry": entry,
          "--specimen-dissolve": dissolve,
          "--specimen-scan-y": `${14 + scan * 52}%`,
          "--specimen-scan-opacity": scanOpacity
        } as CSSProperties
      }
    >
      <pre className="ascii-specimen-hud ascii-specimen-hud--left-top">{hud.leftTop}</pre>
      <pre className="ascii-specimen-hud ascii-specimen-hud--left-mid">{hud.leftMid}</pre>
      <pre className="ascii-specimen-hud ascii-specimen-hud--right-top">{hud.rightTop}</pre>
      <pre className="ascii-specimen-hud ascii-specimen-hud--right-mid">{hud.rightMid}</pre>
      <pre className="ascii-specimen-hud ascii-specimen-hud--bottom-left">{hud.bottomLeft}</pre>
      <pre className="ascii-specimen-art">{specimen}</pre>
      <div className="ascii-specimen-scan" />
    </div>
  );
}

export function AsciiPortal() {
  const [phase, setPhase] = useState<PortalPhase>("idle");
  const [field, setField] = useState("");
  const [size, setSize] = useState<GridSize>({ cols: 120, rows: 70 });
  const [progress, setProgress] = useState(0);
  const [specimenTime, setSpecimenTime] = useState(0);
  const [clickPosition, setClickPosition] = useState({ x: 16, y: 50 });
  const [pointerPosition, setPointerPosition] = useState({ x: 0.16, y: 0.5 });
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [motionBoost, setMotionBoost] = useState(false);
  const phaseRef = useRef<PortalPhase>("idle");
  const pointerRef = useRef({ x: 0.16, y: 0.5 });
  const startRef = useRef(0);
  const audioCueSentRef = useRef(false);
  const textMaskRef = useRef(new Uint8ClampedArray(size.cols * size.rows));

  useEffect(() => {
    phaseRef.current = phase;
    document.body.dataset.portalPhase = phase;
    window.dispatchEvent(new CustomEvent(PORTAL_PHASE_CHANGE_EVENT, { detail: { phase } }));

    if (phase !== "done") {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "idle") {
      return;
    }

    const interval = window.setInterval(() => {
      setPhraseIndex((index) => (index + 1) % introPhrases.length);
      setMotionBoost(false);
    }, motionBoost ? 520 : 1500);

    return () => window.clearInterval(interval);
  }, [motionBoost, phase]);

  useEffect(() => {
    const resize = () => {
      const next = {
        cols: Math.max(82, Math.floor(window.innerWidth / CHAR_WIDTH)),
        rows: Math.max(44, Math.floor(window.innerHeight / LINE_HEIGHT))
      };
      setSize(next);
      textMaskRef.current = createTextMask(next.cols, next.rows, ["Yuan & 4J", "2026.10.3", "優聖美地"]);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    let frame = 0;
    let lastPaint = 0;

    const render = (now: number) => {
      frame = window.requestAnimationFrame(render);
      if (now - lastPaint < 42) {
        return;
      }
      lastPaint = now;

      const currentPhase = phaseRef.current;
      const nextProgress =
        currentPhase === "transition" ? clamp((now - startRef.current) / TRANSITION_MS) : 0;

      setProgress(nextProgress);
      setSpecimenTime(now / 1000);
      if (currentPhase !== "transition") {
        return;
      }

      setField(
        generateField(
          size,
          now / 1000,
          currentPhase,
          nextProgress,
          pointerRef.current,
          textMaskRef.current
        )
      );

      if (
        !audioCueSentRef.current &&
        nextProgress >= (TRANSITION_MS - AUDIO_CUE_MS_BEFORE_END) / TRANSITION_MS
      ) {
        audioCueSentRef.current = true;
        document.body.dataset.portalPhase = PORTAL_AUDIO_CUE_PHASE;
        window.dispatchEvent(
          new CustomEvent(PORTAL_PHASE_CHANGE_EVENT, { detail: { phase: PORTAL_AUDIO_CUE_PHASE } })
        );
      }

      if (currentPhase === "transition" && nextProgress >= 1) {
        phaseRef.current = "done";
        setPhase("done");
      }
    };

    frame = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(frame);
  }, [size]);

  function enter() {
    if (phaseRef.current !== "idle") {
      return;
    }

    startRef.current = performance.now();
    phaseRef.current = "transition";
    audioCueSentRef.current = false;
    window.dispatchEvent(new CustomEvent(PORTAL_INTRO_ENTER_EVENT));
    setPhase("transition");
  }

  if (phase === "done") {
    return null;
  }

  const words = introPhrases[phraseIndex].split(" ");
  const specimenPresence = phase === "transition" ? getSpecimenPortalStrength(progress) : 0;
  const specimenFieldOpacity = phase === "transition" ? getSpecimenFieldOpacity(progress) : 1;

  return (
    <div
      className={clsx("ascii-portal", phase === "idle" && "is-idle", phase === "transition" && "is-transitioning")}
      style={
        {
          "--specimen-presence": specimenPresence,
          "--specimen-field-opacity": specimenFieldOpacity
        } as CSSProperties
      }
      onPointerMove={(event) => {
        const x = (event.clientX / Math.max(1, window.innerWidth)) * 100;
        const y = (event.clientY / Math.max(1, window.innerHeight)) * 100;
        pointerRef.current = {
          x: x / 100,
          y: y / 100
        };
        setPointerPosition(pointerRef.current);
        setClickPosition({ x, y });
        if (phase === "idle") {
          setMotionBoost(Math.abs(event.movementX) + Math.abs(event.movementY) > 18);
        }
      }}
    >
      {phase === "idle" ? (
        <>
          <div className="ascii-portal-grid" aria-hidden="true" />
          <div className="ascii-portal-idle">
            <p>歡迎來到我們的婚禮</p>
            <div className="ascii-portal-phrase" aria-label={introPhrases[phraseIndex]}>
              {words.map((word, wordIndex) => (
                <span className="ascii-portal-word" key={`${word}-${wordIndex}`}>
                  {Array.from(word).map((letter, letterIndex) => (
                    <span
                      key={`${letter}-${letterIndex}`}
                      style={{ "--i": wordIndex * 8 + letterIndex } as CSSProperties}
                    >
                      {letter}
                    </span>
                  ))}
                </span>
              ))}
            </div>
            <button type="button" onClick={enter}>
              請點擊
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="ascii-portal-nav" aria-hidden="true">
            <span>4J&Yuan</span>
            <span>時間</span>
            <span>地點</span>
            <span>照片</span>
            <span>回覆</span>
          </div>
          <pre className="ascii-field" aria-hidden="true">
            {field}
          </pre>
          <AsciiSpecimenStage progress={progress} time={specimenTime} pointer={pointerPosition} />
          <button
            className="ascii-click"
            style={
              {
                "--x": `${clickPosition.x}%`,
                "--y": `${clickPosition.y}%`
              } as CSSProperties
            }
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              enter();
            }}
          >
            請點擊
          </button>
          <div className="ascii-progress" aria-hidden="true">
            {`${Math.round(progress * 100)}%`}
          </div>
        </>
      )}
    </div>
  );
}
