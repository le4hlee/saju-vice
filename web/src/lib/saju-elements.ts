export type FiveElement = "wood" | "fire" | "earth" | "metal" | "water";

export const STEM_TO_ELEMENT: Record<string, FiveElement> = {
  甲: "wood",
  乙: "wood",
  丙: "fire",
  丁: "fire",
  戊: "earth",
  己: "earth",
  庚: "metal",
  辛: "metal",
  壬: "water",
  癸: "water",
};

/** Primary element from branch main qi (classical mapping). */
export const BRANCH_TO_ELEMENT: Record<string, FiveElement> = {
  子: "water",
  丑: "earth",
  寅: "wood",
  卯: "wood",
  辰: "earth",
  巳: "fire",
  午: "fire",
  未: "earth",
  申: "metal",
  酉: "metal",
  戌: "earth",
  亥: "water",
};

export function stemElement(hanja: string): FiveElement | "" {
  return STEM_TO_ELEMENT[hanja] ?? "";
}

export function branchElement(hanja: string): FiveElement | "" {
  return BRANCH_TO_ELEMENT[hanja] ?? "";
}

export function elementBadge(
  el: FiveElement | "",
  lang: "english" | "korean",
): { className: string; label: string } {
  const base =
    "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium ring-1 ring-inset";

  switch (el) {
    case "fire":
      return {
        className: `${base} bg-red-50 text-red-800 ring-red-200/80 dark:bg-red-950/50 dark:text-red-200 dark:ring-red-900/40`,
        label: lang === "korean" ? "화(火)" : "Fire 火",
      };
    case "water":
      return {
        className: `${base} bg-blue-50 text-blue-800 ring-blue-200/80 dark:bg-blue-950/50 dark:text-blue-200 dark:ring-blue-900/40`,
        label: lang === "korean" ? "수(水)" : "Water 水",
      };
    case "metal":
      return {
        className: `${base} bg-yellow-50 text-yellow-900 ring-yellow-200/80 dark:bg-yellow-950/50 dark:text-yellow-100 dark:ring-yellow-900/40`,
        label: lang === "korean" ? "금(金)" : "Metal 金",
      };
    case "wood":
      return {
        className: `${base} bg-green-50 text-green-800 ring-green-200/80 dark:bg-green-950/50 dark:text-green-200 dark:ring-green-900/40`,
        label: lang === "korean" ? "목(木)" : "Wood 木",
      };
    case "earth":
      return {
        className: `${base} bg-amber-50 text-amber-900 ring-amber-200/80 dark:bg-amber-950/50 dark:text-amber-100 dark:ring-amber-900/40`,
        label: lang === "korean" ? "토(土)" : "Earth 土",
      };
    default:
      return {
        className: `${base} bg-zinc-50 text-zinc-500 ring-zinc-200 dark:bg-white/5 dark:text-zinc-400 dark:ring-white/10`,
        label: "—",
      };
  }
}

export const PILLAR_LABELS = {
  hour: { ko: "시주", en: "Hour pillar" },
  day: { ko: "일주", en: "Day pillar" },
  month: { ko: "월주", en: "Month pillar" },
  year: { ko: "연주", en: "Year pillar" },
} as const;

export const ROW_LABELS = {
  stem: { ko: "천간", en: "Heavenly stem" },
  branch: { ko: "지지", en: "Earthly branch" },
} as const;

export const ELEMENT_ORDER: FiveElement[] = ["wood", "fire", "earth", "metal", "water"];

export const ELEMENT_NAMES = {
  wood: { ko: "목(木)", en: "Wood 木" },
  fire: { ko: "화(火)", en: "Fire 火" },
  earth: { ko: "토(土)", en: "Earth 土" },
  metal: { ko: "금(金)", en: "Metal 金" },
  water: { ko: "수(水)", en: "Water 水" },
} as const;

type PillarSlot = { ganElement: FiveElement | ""; jiElement: FiveElement | "" };

export type OhangBalance = {
  counts: Record<FiveElement, number>;
  totalSlots: number;
  /** Present in chart with relatively high frequency (≥2, or tied for max when max ≥2). */
  abundant: FiveElement[];
  /** Not present in any stem/branch counted. */
  lacking: FiveElement[];
  /** Present once, not classified as abundant. */
  moderate: FiveElement[];
};

export function analyzeOhangBalance(manseryeok: {
  year: PillarSlot;
  month: PillarSlot;
  day: PillarSlot;
  hour?: PillarSlot;
}): OhangBalance {
  const counts: Record<FiveElement, number> = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };

  const pillars = [manseryeok.year, manseryeok.month, manseryeok.day, manseryeok.hour].filter(
    Boolean,
  ) as PillarSlot[];

  for (const p of pillars) {
    if (p.ganElement) counts[p.ganElement]++;
    if (p.jiElement) counts[p.jiElement]++;
  }

  const totalSlots = pillars.length * 2;
  const maxCount = Math.max(...ELEMENT_ORDER.map((e) => counts[e]));

  const lacking = ELEMENT_ORDER.filter((e) => counts[e] === 0);
  const abundant = ELEMENT_ORDER.filter((e) => {
    if (counts[e] === 0) return false;
    if (counts[e] >= 2) return true;
    return counts[e] === maxCount && maxCount >= 2;
  });
  const moderate = ELEMENT_ORDER.filter(
    (e) => counts[e] > 0 && !abundant.includes(e),
  );

  return { counts, totalSlots, abundant, lacking, moderate };
}
