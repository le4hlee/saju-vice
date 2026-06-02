"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ELEMENT_NAMES,
  ELEMENT_ORDER,
  elementBadge,
  PILLAR_LABELS,
  ROW_LABELS,
  type FiveElement,
  type OhangBalance,
} from "@/lib/saju-elements";

type Detail = "simple" | "deep";

type ElementName = "wood" | "fire" | "earth" | "metal" | "water";

type ApiOk = {
  ok: true;
  detail: Detail;
  generatedAt: string;
  result: {
    manseryeok?: {
      year: {
        ganHanja: string;
        ganHangul: string;
        ganRoman: string;
        jiHanja: string;
        jiHangul: string;
        jiRoman: string;
        ganElement: ElementName;
        jiElement: ElementName;
      };
      month: {
        ganHanja: string;
        ganHangul: string;
        ganRoman: string;
        jiHanja: string;
        jiHangul: string;
        jiRoman: string;
        ganElement: ElementName;
        jiElement: ElementName;
      };
      day: {
        ganHanja: string;
        ganHangul: string;
        ganRoman: string;
        jiHanja: string;
        jiHangul: string;
        jiRoman: string;
        ganElement: ElementName;
        jiElement: ElementName;
      };
      hour?: {
        ganHanja: string;
        ganHangul: string;
        ganRoman: string;
        jiHanja: string;
        jiHangul: string;
        jiRoman: string;
        ganElement: ElementName;
        jiElement: ElementName;
      };
      notes?: string;
    };
    koreanSummary?: string;
    englishSummary?: string;
    dayPillar?: {
      korean?: {
        heavenlyStem: { title: string; bullets: string[] };
        earthlyBranch: { title: string; bullets: string[] };
        together?: string;
      };
      english: {
        heavenlyStem: { title: string; bullets: string[] };
        earthlyBranch: { title: string; bullets: string[] };
        together?: string;
      };
    };
    ohangBalance?: OhangBalance;
    korean?: {
      headline: string;
      tlDr: string[];
      sections: Array<{ title: string; bullets: string[] }>;
    };
    english: {
      headline: string;
      tlDr: string[];
      sections: Array<{ title: string; bullets: string[] }>;
      glossary?: Array<{ term: string; hangul?: string; meaning: string }>;
    };
    disclaimer: string;
  };
};

type ApiErr = { ok: false; error: string };
type ApiResponse = ApiOk | ApiErr;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{children}</div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{children}</h3>;
}

function PillarCard({
  label,
  gan,
  ji,
  ganElement,
  jiElement,
}: {
  label: string;
  gan: string;
  ji: string;
  ganElement: string;
  jiElement: string;
}) {
  const ganS = elementBadge(ganElement as any, "korean");
  const jiS = elementBadge(jiElement as any, "korean");

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-black">
      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">천간</div>
          <div className="mt-1 text-lg font-semibold tracking-tight">{gan || "—"}</div>
          <div className={ganS.className}>{ganS.label}</div>
        </div>
        <div className="rounded-xl border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">지지</div>
          <div className="mt-1 text-lg font-semibold tracking-tight">{ji || "—"}</div>
          <div className={jiS.className}>{jiS.label}</div>
        </div>
      </div>
    </div>
  );
}

function ManseryeokGrid({
  m,
  language,
}: {
  language: "english" | "korean";
  m: {
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
  };
}) {
  const lang = language;
  const cols = [
    { key: "hour", label: PILLAR_LABELS.hour[lang === "korean" ? "ko" : "en"], value: m.hour },
    { key: "day", label: PILLAR_LABELS.day[lang === "korean" ? "ko" : "en"], value: m.day },
    { key: "month", label: PILLAR_LABELS.month[lang === "korean" ? "ko" : "en"], value: m.month },
    { key: "year", label: PILLAR_LABELS.year[lang === "korean" ? "ko" : "en"], value: m.year },
  ] as const;
  const stemRow = ROW_LABELS.stem[lang === "korean" ? "ko" : "en"];
  const branchRow = ROW_LABELS.branch[lang === "korean" ? "ko" : "en"];

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/15 dark:bg-black">
      <div className="grid grid-cols-4">
        {cols.map((c) => {
          const v = c.value;
          const style = elementBadge((v?.ganElement ?? "") as any, lang);
          const sub =
            v && lang === "english"
              ? `(${v.ganRoman})`
              : v
                ? `(${v.ganHangul}, ${v.ganRoman})`
                : null;
          return (
            <div key={c.key} className="border-r border-black/10 p-3 last:border-r-0 dark:border-white/10">
              <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                {c.label} · {stemRow}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <div className="text-2xl font-semibold tracking-tight">{v?.ganHanja ?? "—"}</div>
                {sub ? <div className="text-xs text-zinc-600 dark:text-zinc-400">{sub}</div> : null}
              </div>
              <div className={style.className}>{style.label}</div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-4 border-t border-black/10 dark:border-white/10">
        {cols.map((c) => {
          const v = c.value;
          const style = elementBadge((v?.jiElement ?? "") as any, lang);
          const sub =
            v && lang === "english"
              ? `(${v.jiRoman})`
              : v
                ? `(${v.jiHangul}, ${v.jiRoman})`
                : null;
          return (
            <div key={c.key} className="border-r border-black/10 p-3 last:border-r-0 dark:border-white/10">
              <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                {c.label} · {branchRow}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <div className="text-2xl font-semibold tracking-tight">{v?.jiHanja ?? "—"}</div>
                {sub ? <div className="text-xs text-zinc-600 dark:text-zinc-400">{sub}</div> : null}
              </div>
              <div className={style.className}>{style.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OhangBalancePanel({
  balance,
  language,
}: {
  balance: OhangBalance;
  language: "english" | "korean";
}) {
  const lang = language;
  const name = (el: FiveElement) => ELEMENT_NAMES[el][lang === "korean" ? "ko" : "en"];
  const max = Math.max(...ELEMENT_ORDER.map((e) => balance.counts[e]), 1);

  const listLabel = (els: FiveElement[]) =>
    els.length ? els.map(name).join(", ") : lang === "korean" ? "없음" : "None";

  return (
    <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/15 dark:bg-zinc-950">
      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {lang === "korean" ? "오행(五行) 분포 — 많음 / 부족" : "Five Elements — abundant vs lacking"}
      </div>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        {lang === "korean"
          ? `만세력 천간·지지 ${balance.totalSlots}칸 기준으로 오행 개수를 셉니다.`
          : `Counted across ${balance.totalSlots} stem/branch slots in your Four Pillars.`}
      </p>

      <div className="mt-4 grid gap-2">
        {ELEMENT_ORDER.map((el) => {
          const count = balance.counts[el];
          const badge = elementBadge(el, lang);
          const pct = Math.round((count / max) * 100);
          const status = balance.abundant.includes(el)
            ? lang === "korean"
              ? "많음"
              : "Abundant"
            : balance.lacking.includes(el)
              ? lang === "korean"
                ? "부족"
                : "Lacking"
              : lang === "korean"
                ? "보통"
                : "Moderate";

          return (
            <div key={el} className="flex items-center gap-3">
              <div className={"shrink-0 " + badge.className}>{badge.label}</div>
              <div className="flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-zinc-400 dark:bg-zinc-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="w-16 shrink-0 text-right text-xs text-zinc-600 dark:text-zinc-400">
                ×{count} · {status}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-2 text-sm">
        <div className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-black">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {lang === "korean" ? "많은 오행" : "Abundant"}
          </span>
          <span className="text-zinc-700 dark:text-zinc-300"> — {listLabel(balance.abundant)}</span>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-black">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {lang === "korean" ? "부족한 오행" : "Lacking"}
          </span>
          <span className="text-zinc-700 dark:text-zinc-300"> — {listLabel(balance.lacking)}</span>
        </div>
        {balance.moderate.length ? (
          <div className="rounded-xl border border-dashed border-black/15 bg-white/50 p-3 text-zinc-600 dark:border-white/15 dark:bg-black/50 dark:text-zinc-400">
            <span className="font-medium">{lang === "korean" ? "보통" : "Moderate"}</span>
            <span> — {listLabel(balance.moderate)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DayPillarExplanation({
  expl,
  language,
}: {
  expl: NonNullable<ApiOk["result"]["dayPillar"]>;
  language: "english" | "korean";
}) {
  const content = language === "korean" ? expl.korean ?? expl.english : expl.english;
  if (!content) return null;

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-black">
      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {language === "english" ? "Day pillar (일주) explained" : "일주(日柱) 해설"}
      </div>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        {language === "english"
          ? "Your core chart identity comes from the day pillar: heavenly stem (천간) + earthly branch (지지)."
          : "사주에서 ‘나’의 중심은 일주입니다. 천간(일간)과 지지를 나눠서 봅니다."}
      </p>

      <div className="mt-4 flex flex-col gap-4">
        <div>
          <SectionTitle>{content.heavenlyStem.title}</SectionTitle>
          {content.heavenlyStem.bullets.length ? (
            <ul className="mt-2 list-disc pl-5 text-sm text-zinc-700 dark:text-zinc-300">
              {content.heavenlyStem.bullets.map((b, i) => (
                <li key={i}>
                  <Md text={b} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <SectionTitle>{content.earthlyBranch.title}</SectionTitle>
          {content.earthlyBranch.bullets.length ? (
            <ul className="mt-2 list-disc pl-5 text-sm text-zinc-700 dark:text-zinc-300">
              {content.earthlyBranch.bullets.map((b, i) => (
                <li key={i}>
                  <Md text={b} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {content.together ? (
          <div className="rounded-xl border border-black/10 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {language === "english" ? "Stem + branch together" : "천간 + 지지 함께"}
            </div>
            <div className="mt-1">
              <Md text={content.together} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Md({ text }: { text: string }) {
  return (
    <ReactMarkdown
      // No raw HTML; only basic markdown like **bold**, _italic_, etc.
      components={{
        strong: ({ children }) => <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        p: ({ children }) => <p className="leading-6">{children}</p>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

function getTimeZones(): string[] {
  // Modern browsers (Chromium/Firefox/Safari 17+) support this.
  const supportedValuesOf = (Intl as any)?.supportedValuesOf as undefined | ((key: string) => string[]);
  if (supportedValuesOf) {
    try {
      const tzs = supportedValuesOf("timeZone");
      if (Array.isArray(tzs) && tzs.length) return tzs;
    } catch {
      // ignore
    }
  }

  // Fallback: common zones (covers most users).
  return [
    "UTC",
    "America/Los_Angeles",
    "America/Denver",
    "America/Chicago",
    "America/New_York",
    "America/Sao_Paulo",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Moscow",
    "Africa/Johannesburg",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Bangkok",
    "Asia/Singapore",
    "Asia/Shanghai",
    "Asia/Taipei",
    "Asia/Tokyo",
    "Asia/Seoul",
    "Australia/Sydney",
    "Pacific/Auckland",
  ];
}

export default function Home() {
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [timezone, setTimezone] = useState("");
  const [sex, setSex] = useState<"female" | "male" | "other">("female");
  const [detail, setDetail] = useState<Detail>("simple");
  const [language, setLanguage] = useState<"english" | "korean">("english");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiOk | null>(null);

  const guessedTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      return "";
    }
  }, []);

  const timeZones = useMemo(() => getTimeZones(), []);

  useEffect(() => {
    // Make timezone “actually work” by defaulting to a real IANA zone immediately.
    if (!timezone && guessedTz) setTimezone(guessedTz);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guessedTz]);

  const tzValue = timezone || guessedTz;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setData(null);
    setLoading(true);
    try {
      const res = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate,
          birthTime: birthTime || undefined,
          timezone: tzValue,
          sex,
          detail,
        }),
      });

      const json = (await res.json()) as ApiResponse;
      if (!json.ok) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Saju → English / Korean</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Enter birth info, then get a structured explanation in English or Korean.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-zinc-950">
            <form className="flex flex-col gap-4" onSubmit={onSubmit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <FieldLabel>Birth date</FieldLabel>
                  <input
                    className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/15 dark:bg-black dark:focus:ring-white/15"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <FieldLabel>Birth time (optional)</FieldLabel>
                  <input
                    className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/15 dark:bg-black dark:focus:ring-white/15"
                    type="time"
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value)}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2">
                <FieldLabel>Time zone</FieldLabel>
                <input
                  className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/15 dark:bg-black dark:focus:ring-white/15"
                  list="timezones"
                  placeholder={guessedTz || "America/New_York"}
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
                <datalist id="timezones">
                  {timeZones.map((tz) => (
                    <option key={tz} value={tz} />
                  ))}
                </datalist>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Defaulted to your browser’s IANA zone:{" "}
                  <span className="font-medium">{guessedTz || "unknown"}</span>
                </div>
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <FieldLabel>Sex</FieldLabel>
                  <select
                    className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/15 dark:bg-black dark:focus:ring-white/15"
                    value={sex}
                    onChange={(e) => setSex(e.target.value as "female" | "male" | "other")}
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <div className="flex flex-col gap-2">
                  <FieldLabel>Explanation depth</FieldLabel>
                  <div className="grid grid-cols-2 rounded-xl border border-black/10 bg-white p-1 text-sm dark:border-white/15 dark:bg-black">
                    <button
                      type="button"
                      onClick={() => setDetail("simple")}
                      className={[
                        "h-9 rounded-lg transition",
                        detail === "simple"
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                          : "text-zinc-700 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10",
                      ].join(" ")}
                    >
                      Simple
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetail("deep")}
                      className={[
                        "h-9 rounded-lg transition",
                        detail === "deep"
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                          : "text-zinc-700 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10",
                      ].join(" ")}
                    >
                      Deep dive
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !tzValue}
                className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                {loading ? "Generating…" : "Generate reading"}
              </button>

              {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-200">
                  {error}
                </div>
              ) : null}
            </form>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-zinc-950">
            {!data ? (
              <div className="flex h-full flex-col justify-center gap-2 text-zinc-600 dark:text-zinc-400">
                <div className="text-base font-medium text-zinc-900 dark:text-zinc-100">Your result will appear here.</div>
                <div className="text-sm">
                  Tip: if you don’t know birth time, leave it blank—your reading will be less precise, but still useful.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Showing: <span className="font-medium">{language === "english" ? "English" : "Korean"}</span>
                  </div>
                  <div className="grid grid-cols-2 rounded-xl border border-black/10 bg-white p-1 text-sm dark:border-white/15 dark:bg-black">
                    <button
                      type="button"
                      onClick={() => setLanguage("english")}
                      className={[
                        "h-9 rounded-lg px-3 transition",
                        language === "english"
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                          : "text-zinc-700 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10",
                      ].join(" ")}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage("korean")}
                      disabled={!data.result.korean}
                      className={[
                        "h-9 rounded-lg px-3 transition disabled:cursor-not-allowed disabled:opacity-60",
                        language === "korean"
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                          : "text-zinc-700 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10",
                      ].join(" ")}
                    >
                      한국어
                    </button>
                  </div>
                </div>

                {data.result.manseryeok ? (
                  <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/15 dark:bg-zinc-950">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {language === "english"
                        ? "Four Pillars (Year · Month · Day · Hour)"
                        : "만세력 (연주 · 월주 · 일주 · 시주)"}
                    </div>
                    {data.result.manseryeok.notes ? (
                      <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                        <Md text={data.result.manseryeok.notes} />
                      </div>
                    ) : null}
                    <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                      {language === "english" ? (
                        <>
                          Order (right → left):{" "}
                          <span className="font-medium">Hour · Day · Month · Year</span>
                        </>
                      ) : (
                        <>
                          표시 순서 (오른쪽 → 왼쪽):{" "}
                          <span className="font-medium">시주 · 일주 · 월주 · 연주</span>
                        </>
                      )}
                    </div>
                    <ManseryeokGrid m={data.result.manseryeok} language={language} />
                  </div>
                ) : null}

                {data.result.dayPillar ? (
                  <DayPillarExplanation expl={data.result.dayPillar} language={language} />
                ) : null}

                {data.result.ohangBalance ? (
                  <OhangBalancePanel balance={data.result.ohangBalance} language={language} />
                ) : null}

                {language === "english" && data.result.englishSummary ? (
                  <div className="rounded-xl border border-black/10 bg-white p-3 text-sm text-zinc-700 dark:border-white/15 dark:bg-black dark:text-zinc-300">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">Pillars summary</div>
                    <div className="mt-1">
                      <Md text={data.result.englishSummary} />
                    </div>
                  </div>
                ) : null}

                {language === "korean" && data.result.koreanSummary ? (
                  <div className="rounded-xl border border-black/10 bg-white p-3 text-sm text-zinc-700 dark:border-white/15 dark:bg-black dark:text-zinc-300">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">요약</div>
                    <div className="mt-1 whitespace-pre-wrap">{data.result.koreanSummary}</div>
                  </div>
                ) : null}

                {language === "korean" && data.result.korean ? (
                  <>
                    <div className="flex flex-col gap-2">
                      <h2 className="text-xl font-semibold tracking-tight">{data.result.korean.headline}</h2>
                      {data.result.korean.tlDr.length ? (
                        <ul className="list-disc pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                          {data.result.korean.tlDr.map((b, i) => (
                            <li key={i}>
                              <Md text={b} />
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    {data.result.korean.sections.map((s, idx) => (
                      <div key={idx} className="flex flex-col gap-2">
                        <SectionTitle>{s.title}</SectionTitle>
                        {s.bullets.length ? (
                          <ul className="list-disc pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                            {s.bullets.map((b, i) => (
                              <li key={i}>
                                <Md text={b} />
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-sm text-zinc-600 dark:text-zinc-400">내용이 제공되지 않았어요.</div>
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-2">
                      <h2 className="text-xl font-semibold tracking-tight">{data.result.english.headline}</h2>
                      {data.result.english.tlDr.length ? (
                        <ul className="list-disc pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                          {data.result.english.tlDr.map((b, i) => (
                            <li key={i}>
                              <Md text={b} />
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    {data.result.english.sections.map((s, idx) => (
                      <div key={idx} className="flex flex-col gap-2">
                        <SectionTitle>{s.title}</SectionTitle>
                        {s.bullets.length ? (
                          <ul className="list-disc pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                            {s.bullets.map((b, i) => (
                              <li key={i}>
                                <Md text={b} />
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-sm text-zinc-600 dark:text-zinc-400">No details provided.</div>
                        )}
                      </div>
                    ))}
                  </>
                )}

                {data.result.english.glossary?.length ? (
                  <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/15 dark:bg-black">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Glossary</div>
                    <div className="mt-3 grid gap-3">
                      {data.result.english.glossary.map((g, i) => (
                        <div key={i} className="text-sm">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            {g.term}
                            {g.hangul ? <span className="text-zinc-500 dark:text-zinc-400"> · {g.hangul}</span> : null}
                          </div>
                          <div className="text-zinc-700 dark:text-zinc-300">{g.meaning}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-xl border border-black/10 bg-white p-3 text-xs text-zinc-600 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-400">
                  {data.result.disclaimer}
                </div>
              </div>
            )}
          </section>
        </div>

        <footer className="mt-10 text-xs text-zinc-500 dark:text-zinc-500">
          Powered by your configured LLM API. No accounts required.
        </footer>
      </main>
    </div>
  );
}
