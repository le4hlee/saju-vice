import { NextResponse } from "next/server";
import { calculateBaziChart } from "@openfate/bazi-engine";
import { analyzeOhangBalance, branchElement, stemElement, type OhangBalance } from "@/lib/saju-elements";

type DetailLevel = "simple" | "deep";

type ReadingRequest = {
  birthDate: string; // YYYY-MM-DD
  birthTime?: string; // HH:MM (24h)
  timezone: string; // IANA name, e.g. America/New_York
  sex: "female" | "male" | "other";
  detail: DetailLevel;
};

type DayPillarPart = {
  title: string;
  bullets: string[];
};

type DayPillarExplanation = {
  heavenlyStem: DayPillarPart;
  earthlyBranch: DayPillarPart;
  together?: string;
};

type ReadingResponse = {
  ok: true;
  detail: DetailLevel;
  generatedAt: string;
  input: ReadingRequest;
  result: {
    manseryeok?: {
      year: {
        ganHanja: string;
        ganHangul: string;
        ganRoman: string;
        jiHanja: string;
        jiHangul: string;
        jiRoman: string;
        ganElement: string;
        jiElement: string;
      };
      month: {
        ganHanja: string;
        ganHangul: string;
        ganRoman: string;
        jiHanja: string;
        jiHangul: string;
        jiRoman: string;
        ganElement: string;
        jiElement: string;
      };
      day: {
        ganHanja: string;
        ganHangul: string;
        ganRoman: string;
        jiHanja: string;
        jiHangul: string;
        jiRoman: string;
        ganElement: string;
        jiElement: string;
      };
      hour?: {
        ganHanja: string;
        ganHangul: string;
        ganRoman: string;
        jiHanja: string;
        jiHangul: string;
        jiRoman: string;
        ganElement: string;
        jiElement: string;
      };
      notes?: string;
    };
    koreanSummary?: string;
    englishSummary?: string;
    dayPillar?: {
      korean?: DayPillarExplanation;
      english: DayPillarExplanation;
    };
    ohangBalance?: OhangBalance;
    korean?: {
      headline: string;
      tlDr: string[];
      sections: Array<{
        title: string;
        bullets: string[];
      }>;
    };
    english: {
      headline: string;
      tlDr: string[];
      sections: Array<{
        title: string;
        bullets: string[];
      }>;
      glossary?: Array<{
        term: string;
        hangul?: string;
        meaning: string;
      }>;
    };
    disclaimer: string;
    rawModelText?: string;
  };
};

function isValidIanaTimeZone(tz: string): boolean {
  try {
    // Will throw RangeError for invalid IANA time zones.
    Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

const STEM_HANJA = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const STEM_HANGUL = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;
const STEM_ROMAN = ["gap", "eul", "byeong", "jeong", "mu", "gi", "gyeong", "sin", "im", "gye"] as const;
const BRANCH_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const BRANCH_HANGUL = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"] as const;
const BRANCH_ROMAN = ["ja", "chuk", "in", "myo", "jin", "sa", "o", "mi", "sin", "yu", "sul", "hae"] as const;

function hanjaStemToHangul(stem: string): string {
  const idx = STEM_HANJA.indexOf(stem as any);
  return idx >= 0 ? STEM_HANGUL[idx] : stem;
}
function hanjaStemToRoman(stem: string): string {
  const idx = STEM_HANJA.indexOf(stem as any);
  return idx >= 0 ? STEM_ROMAN[idx] : stem;
}
function hanjaBranchToHangul(branch: string): string {
  const idx = BRANCH_HANJA.indexOf(branch as any);
  return idx >= 0 ? BRANCH_HANGUL[idx] : branch;
}
function hanjaBranchToRoman(branch: string): string {
  const idx = BRANCH_HANJA.indexOf(branch as any);
  return idx >= 0 ? BRANCH_ROMAN[idx] : branch;
}

function getTimeZoneOffsetHours(ianaTz: string, y: number, m: number, d: number, hh: number, mm: number): number {
  // We compute offset by comparing the "same wall clock" interpreted as UTC vs in target tz.
  // This is a standard trick to avoid needing extra deps.
  const utcGuess = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: ianaTz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(utcGuess);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const zy = Number(get("year"));
  const zm = Number(get("month"));
  const zd = Number(get("day"));
  const zhh = Number(get("hour"));
  const zmm = Number(get("minute"));
  const zss = Number(get("second"));
  const asIfUtc = Date.UTC(zy, zm - 1, zd, zhh, zmm, zss);
  const guessUtc = utcGuess.getTime();
  // If formatting a UTC date into tz yields local components, the difference tells the offset.
  const offsetMs = asIfUtc - guessUtc;
  return offsetMs / 36e5;
}

function computeManseryeok(input: ReadingRequest) {
  const [yStr, mStr, dStr] = input.birthDate.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  const [hhStr, mmStr] = (input.birthTime ?? "12:00").split(":");
  const hh = Number(hhStr);
  const mm = Number(mmStr);

  const tzHours = getTimeZoneOffsetHours(input.timezone, y, m, d, hh, mm);
  const longitude = tzHours * 15; // Approximate: timezone standard meridian

  const chart = calculateBaziChart({
    year: y,
    month: m,
    day: d,
    hour: input.birthTime ? hh : undefined,
    minute: input.birthTime ? mm : undefined,
    gender: input.sex === "male" ? "male" : "female",
    timezone: tzHours,
    longitude,
    enableTrueSolarTime: Boolean(input.birthTime), // only meaningful with an hour
    dayBoundaryMode: "MIDNIGHT_00",
    calendarType: "solar",
  } as any);

  const p = chart.pillars;
  const pack = (pillar: any) => {
    const ganHanja = String(pillar.stem ?? "");
    const jiHanja = String(pillar.branch ?? "");
    return {
      ganHanja,
      ganHangul: hanjaStemToHangul(ganHanja),
      ganRoman: hanjaStemToRoman(ganHanja),
      jiHanja,
      jiHangul: hanjaBranchToHangul(jiHanja),
      jiRoman: hanjaBranchToRoman(jiHanja),
      ganElement: stemElement(ganHanja),
      jiElement: branchElement(jiHanja),
    };
  };

  const notes =
    input.birthTime
      ? `Computed from birth time in **${input.timezone}** (UTC${tzHours >= 0 ? "+" : ""}${tzHours}).`
      : "Birth time was not provided, so **시주(Hour pillar)** is omitted. The reading can change if the true birth time crosses an hour boundary.";

  return {
    year: pack(p.year),
    month: pack(p.month),
    day: pack(p.day),
    hour: input.birthTime && p.hour ? pack(p.hour) : undefined,
    notes,
  };
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function geminiApiKey(): string {
  // Back-compat: user may have set OPENAI_API_KEY following earlier instructions.
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || "";
}

function safeJsonParse(text: string): unknown | undefined {
  try {
    return JSON.parse(text);
  } catch {
    // Sometimes models wrap JSON in ```json ...```
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
    const candidates = [fenced, text].filter(Boolean) as string[];

    for (const candidate of candidates) {
      // 1) Direct parse.
      try {
        return JSON.parse(candidate);
      } catch {
        // continue
      }

      // 2) Try to extract the first JSON object/array from the text.
      const firstBrace = candidate.indexOf("{");
      const lastBrace = candidate.lastIndexOf("}");
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        const slice = candidate.slice(firstBrace, lastBrace + 1);
        try {
          return JSON.parse(slice);
        } catch {
          // continue
        }
      }

      const firstBracket = candidate.indexOf("[");
      const lastBracket = candidate.lastIndexOf("]");
      if (firstBracket >= 0 && lastBracket > firstBracket) {
        const slice = candidate.slice(firstBracket, lastBracket + 1);
        try {
          return JSON.parse(slice);
        } catch {
          // continue
        }
      }
    }

    return undefined;
  }
}

function parseDayPillarPart(part: unknown, fallbackTitle: string): DayPillarPart {
  const p = part as { title?: string; bullets?: unknown[] } | undefined;
  return {
    title: String(p?.title ?? fallbackTitle),
    bullets: Array.isArray(p?.bullets) ? p.bullets.map(String) : [],
  };
}

function parseDayPillarExplanation(lang: unknown): DayPillarExplanation | undefined {
  if (!lang || typeof lang !== "object") return undefined;
  const o = lang as {
    heavenlyStem?: unknown;
    earthlyBranch?: unknown;
    together?: string;
  };
  return {
    heavenlyStem: parseDayPillarPart(o.heavenlyStem, "Day pillar — Heavenly stem"),
    earthlyBranch: parseDayPillarPart(o.earthlyBranch, "Day pillar — Earthly branch"),
    together: typeof o.together === "string" ? o.together : undefined,
  };
}

function buildPrompt(input: ReadingRequest): string {
  const timeLine = input.birthTime ? `Birth time: ${input.birthTime}` : `Birth time: (unknown)`;
  const deepExtras =
    input.detail === "deep"
      ? [
          "",
          "DEEP DIVE REQUIREMENTS:",
          "- Include sections that explicitly cover: 십신(ten gods) overview, 귀인(benefactors) only when derivable, 살(신살) only when derivable, and practical interpretations for love/career/health habits (no medical claims).",
          "- DO NOT name a specific element as 용신(用神) or 기신(忌神). Do NOT claim 'your useful element is X' or 'your clashing element is Y'. These require full strength/season analysis and differ by school. Instead, if needed, add ONE short section titled 'About Useful vs Clashing Elements (용신·기신)' that explains the concept generally and states this reading does not determine them.",
          "- CRITICAL ACCURACY RULE: Do NOT list specific 귀인/신살 unless you can derive them directly from the PROVIDED 만세력 using a clear, standard rule you state in the same bullet. If unsure, omit them entirely.",
          "- If you mention a Korean technical term, include the Hangul in parentheses at least once.",
        ].join("\n")
      : "";

  return [
    "You are a bilingual Korean/English 사주(四柱) interpreter and writer.",
    "Task: explain a 사주 reading in both Korean and clear English for a beginner.",
    "DO NOT compute pillars yourself. Use the PROVIDED 만세력 pillars as the ground truth.",
    "",
    "IMPORTANT CONSTRAINTS:",
    "- Return ONLY a single JSON object. No markdown, no backticks, no commentary, no leading/trailing text.",
    "- If birth time is unknown, say so and explain how that affects confidence/precision.",
    "- Avoid deterministic or medical/legal/financial advice. Use a gentle, reflective tone.",
    `- Detail level: ${input.detail} (simple = shorter, deep = more nuance, more sections).`,
    deepExtras,
    "",
    "REQUIRED — Day pillar (일주) explanation:",
    "- You MUST include a `dayPillar` object with separate explanations for the day pillar heavenly stem (일주 천간 / Day Master 일간) and earthly branch (일주 지지).",
    "- Use the exact day-pillar characters and elements from PROVIDED 만세력 (do not change them).",
    "- heavenlyStem: what the stem represents (core self / Day Master), its element & yin-yang tone, 3-5 beginner-friendly bullets.",
    "- earthlyBranch: what the branch represents (inner rhythm, relationship/spouse palace in traditional terms), its element, 3-5 bullets.",
    "- together: 1-2 sentences on how stem + branch work as a pair (optional but encouraged).",
    "",
    "INPUT:",
    `Birth date: ${input.birthDate}`,
    timeLine,
    `Time zone: ${input.timezone}`,
    `Sex: ${input.sex}`,
    "",
    "PROVIDED 만세력 (must use exactly; do not change):",
    "{{MANSE_RYEOK_JSON}}",
    "",
    "PROVIDED 오행 balance (counts/abundant/lacking — use exactly; do not change which elements are abundant or lacking):",
    "{{OHANG_BALANCE_JSON}}",
    "",
    "- Include a section in BOTH korean.sections and english.sections titled '오행 균형' / 'Five Elements balance' that interprets the PROVIDED abundant/lacking lists in 3-5 bullets (reflective tone, no medical claims).",
    "",
    "OUTPUT JSON SHAPE (must match keys exactly):",
    JSON.stringify(
      {
        // NOTE: manseryeok is provided by the server and will be merged in.
        koreanSummary: "Optional short Korean summary of the computed pillars/keywords.",
        englishSummary: "Short English summary of the computed pillars/keywords (used when showing English UI).",
        dayPillar: {
          korean: {
            heavenlyStem: { title: "일주 천간 (일간) — 갑(甲)", bullets: ["bullet"] },
            earthlyBranch: { title: "일주 지지 — 자(子)", bullets: ["bullet"] },
            together: "How stem and branch combine as one day pillar.",
          },
          english: {
            heavenlyStem: { title: "Day pillar — Heavenly stem (Day Master)", bullets: ["bullet"] },
            earthlyBranch: { title: "Day pillar — Earthly branch", bullets: ["bullet"] },
            together: "How stem and branch combine.",
          },
        },
        korean: {
          headline: "한 문장 요약 헤드라인",
          tlDr: ["3-7개의 짧은 핵심 bullet"],
          sections: [{ title: "섹션 제목", bullets: ["bullet", "bullet"] }],
        },
        english: {
          headline: "One sentence headline",
          tlDr: ["3-7 short bullets"],
          sections: [{ title: "Section title", bullets: ["bullet", "bullet"] }],
          glossary: [{ term: "Ten Gods", hangul: "십신", meaning: "Plain English meaning" }],
        },
        disclaimer:
          "Short disclaimer about reflective/entertainment nature + uncertainty, especially if time unknown.",
      },
      null,
      2,
    ),
  ].join("\n");
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = geminiApiKey();
  if (!apiKey) throw new Error("Missing environment variable: GEMINI_API_KEY (or GOOGLE_API_KEY)");

  const configuredModel = process.env.GEMINI_MODEL?.trim();
  const defaultModel = "gemini-2.0-flash";
  const modelCandidates = [configuredModel, defaultModel].filter(Boolean) as string[];

  async function generateWithModel(model: string): Promise<{ ok: true; data: any } | { ok: false; status: number; text: string }> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      return { ok: false, status: res.status, text: await res.text() };
    }
    return { ok: true, data: await res.json() };
  }

  async function listGenerateContentModels(): Promise<string[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return [];
    const json = (await res.json()) as any;
    const models = Array.isArray(json?.models) ? json.models : [];
    return models
      .filter((m: any) => Array.isArray(m?.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent"))
      .map((m: any) => String(m?.name ?? ""))
      .filter(Boolean)
      .map((name: string) => name.replace(/^models\//, "")); // API accepts both, but we normalize.
  }

  let lastError: { status: number; text: string } | null = null;

  // 1) Try configured/default model(s).
  for (const model of modelCandidates) {
    const attempt = await generateWithModel(model);
    if (attempt.ok) {
      const data = attempt.data;
      const text =
        data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join("") ??
        data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text || typeof text !== "string") throw new Error("LLM response missing text");
      return text;
    }
    lastError = { status: attempt.status, text: attempt.text };
  }

  // 2) If model not found, discover available models and retry.
  if (lastError?.status === 404) {
    const available = await listGenerateContentModels();
    const preferred =
      available.find((m) => /flash/i.test(m)) ??
      available.find((m) => /gemini/i.test(m)) ??
      available[0];

    if (preferred) {
      const attempt = await generateWithModel(preferred);
      if (attempt.ok) {
        const data = attempt.data;
        const text =
          data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join("") ??
          data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text || typeof text !== "string") throw new Error("LLM response missing text");
        return text;
      }
      lastError = { status: attempt.status, text: attempt.text };
    }
  }

  throw new Error(`LLM request failed (${lastError?.status ?? 500}): ${lastError?.text ?? "Unknown error"}`);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ReadingRequest>;

    if (!body.birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.birthDate)) {
      return NextResponse.json({ ok: false, error: "birthDate must be YYYY-MM-DD" }, { status: 400 });
    }
    if (body.birthTime && !/^\d{2}:\d{2}$/.test(body.birthTime)) {
      return NextResponse.json({ ok: false, error: "birthTime must be HH:MM (24h)" }, { status: 400 });
    }
    if (!body.timezone || typeof body.timezone !== "string") {
      return NextResponse.json({ ok: false, error: "timezone is required" }, { status: 400 });
    }
    if (!isValidIanaTimeZone(body.timezone)) {
      return NextResponse.json(
        { ok: false, error: "timezone must be a valid IANA zone (e.g. America/New_York)" },
        { status: 400 },
      );
    }
    if (!body.sex || !["female", "male", "other"].includes(body.sex)) {
      return NextResponse.json({ ok: false, error: "sex must be female|male|other" }, { status: 400 });
    }
    const detail: DetailLevel = body.detail === "deep" ? "deep" : "simple";

    const input: ReadingRequest = {
      birthDate: body.birthDate,
      birthTime: body.birthTime,
      timezone: body.timezone,
      sex: body.sex,
      detail,
    };

    const manseryeok = computeManseryeok(input);
    const ohangBalance = analyzeOhangBalance(manseryeok);
    const prompt = buildPrompt(input)
      .replace("{{MANSE_RYEOK_JSON}}", JSON.stringify(manseryeok, null, 2))
      .replace("{{OHANG_BALANCE_JSON}}", JSON.stringify(ohangBalance, null, 2));
    const rawText = await callGemini(prompt);
    const parsed = safeJsonParse(rawText);

    const now = new Date().toISOString();

    if (!parsed || typeof parsed !== "object") {
      const fallback: ReadingResponse = {
        ok: true,
        detail,
        generatedAt: now,
        input,
        result: {
          english: {
            headline: "Your reading (raw)",
            tlDr: ["The model did not return valid JSON; showing raw output below."],
            sections: [{ title: "Raw output", bullets: [rawText] }],
          },
          disclaimer:
            "This is a reflective, entertainment-style reading. It may be inaccurate, especially if birth time is unknown.",
          rawModelText: rawText,
        },
      };
      return NextResponse.json(fallback);
    }

    const obj = parsed as any;

    const response: ReadingResponse = {
      ok: true,
      detail,
      generatedAt: now,
      input,
      result: {
        manseryeok,
        ohangBalance,
        koreanSummary: typeof obj.koreanSummary === "string" ? obj.koreanSummary : undefined,
        englishSummary: typeof obj.englishSummary === "string" ? obj.englishSummary : undefined,
        dayPillar: (() => {
          const en = parseDayPillarExplanation(obj.dayPillar?.english);
          const ko = parseDayPillarExplanation(obj.dayPillar?.korean);
          if (!en) return undefined;
          return { english: en, korean: ko };
        })(),
        korean: obj.korean
          ? {
              headline: String(obj.korean?.headline ?? "사주 해석"),
              tlDr: Array.isArray(obj.korean?.tlDr) ? obj.korean.tlDr.map(String) : [],
              sections: Array.isArray(obj.korean?.sections)
                ? obj.korean.sections.map((s: any) => ({
                    title: String(s?.title ?? "섹션"),
                    bullets: Array.isArray(s?.bullets) ? s.bullets.map(String) : [],
                  }))
                : [],
            }
          : undefined,
        english: {
          headline: String(obj.english?.headline ?? "Your 사주 reading"),
          tlDr: Array.isArray(obj.english?.tlDr) ? obj.english.tlDr.map(String) : [],
          sections: Array.isArray(obj.english?.sections)
            ? obj.english.sections.map((s: any) => ({
                title: String(s?.title ?? "Section"),
                bullets: Array.isArray(s?.bullets) ? s.bullets.map(String) : [],
              }))
            : [],
          glossary: Array.isArray(obj.english?.glossary)
            ? obj.english.glossary.map((g: any) => ({
                term: String(g?.term ?? ""),
                hangul: typeof g?.hangul === "string" ? g.hangul : undefined,
                meaning: String(g?.meaning ?? ""),
              }))
            : undefined,
        },
        disclaimer: String(
          obj.disclaimer ??
            "This is a reflective, entertainment-style reading. It may be inaccurate, especially if birth time is unknown.",
        ),
        rawModelText: rawText,
      },
    };

    return NextResponse.json(response);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

