/**
 * 将用药方案映射为 wx.addPhoneRepeatCalendar 参数（中国时区与 createReminderPlan 规则对齐）。
 * 须由用户点击触发同步，勿在定时器或云回调中调用。
 */

export type MedicationRepeatMode = "everyday" | "weekday" | "custom";

export interface MedicationCalendarInput {
  drugName: string;
  /** HH:mm */
  times: string[];
  repeatMode: MedicationRepeatMode;
  /** "0".."6"，仅 repeatMode === "custom" 时使用 */
  customWeekdays?: string[];
  doseText?: string;
  mealTimingLabel?: string;
}

export interface PhoneRepeatCalendarItem {
  title: string;
  description: string;
  /** Unix 时间戳，秒（与微信文档「自 1970-01-01 起经过的秒数」一致） */
  startTime: number;
  repeatInterval: "day" | "week";
  alarm: boolean;
  alarmOffset: number;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function getChinaNowParts(date = new Date()) {
  const cn = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const year = cn.getUTCFullYear();
  const month = cn.getUTCMonth() + 1;
  const day = cn.getUTCDate();
  const hour = cn.getUTCHours();
  const minute = cn.getUTCMinutes();
  const weekDay = cn.getUTCDay();
  const dateStr = `${year}-${pad2(month)}-${pad2(day)}`;
  const nowMin = hour * 60 + minute;
  return { dateStr, weekDay, nowMin, hour, minute };
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = String(dateStr).split("-").map((x) => Number(x));
  const base = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  const next = new Date(base.getTime() + Number(days || 0) * 24 * 60 * 60 * 1000);
  return `${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}-${pad2(next.getUTCDate())}`;
}

function timeToMinutes(hhmm: string): number {
  const parts = String(hhmm || "").split(":");
  if (parts.length !== 2) return -1;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return h * 60 + m;
}

function matchesDay(repeatMode: MedicationRepeatMode, customWeekdays: string[], day: number): boolean {
  if (repeatMode === "everyday") return true;
  if (repeatMode === "weekday") return day >= 1 && day <= 5;
  if (repeatMode === "custom") return Array.isArray(customWeekdays) && customWeekdays.includes(String(day));
  return true;
}

/** 与 cloudfunctions/createReminderPlan 中 nextActiveDateStr 一致 */
function nextActiveDateStr(
  cn: ReturnType<typeof getChinaNowParts>,
  t: string,
  repeatMode: MedicationRepeatMode,
  customWeekdays: string[],
): string {
  const targetMin = timeToMinutes(t);
  const passedToday = targetMin >= 0 && cn.nowMin > targetMin;
  for (let offset = 0; offset <= 14; offset += 1) {
    const day = (cn.weekDay + offset) % 7;
    const dateStr = addDays(cn.dateStr, offset);
    const ok = matchesDay(repeatMode, customWeekdays, day);
    if (!ok) continue;
    if (offset === 0 && passedToday) continue;
    return dateStr;
  }
  return addDays(cn.dateStr, 1);
}

/**
 * 指定星期几（0=周日…6=周六）与时间的首次触发日（中国日期 YYYY-MM-DD）
 */
function firstOccurrenceForWeekday(
  cn: ReturnType<typeof getChinaNowParts>,
  targetWd: number,
  hhmm: string,
  repeatMode: MedicationRepeatMode,
  customWeekdays: string[],
): string {
  const targetMin = timeToMinutes(hhmm);
  const passedToday = targetMin >= 0 && cn.nowMin > targetMin;
  for (let offset = 0; offset <= 366; offset += 1) {
    const day = (cn.weekDay + offset) % 7;
    if (day !== targetWd) continue;
    const dateStr = addDays(cn.dateStr, offset);
    if (!matchesDay(repeatMode, customWeekdays, day)) continue;
    if (offset === 0 && passedToday) continue;
    return dateStr;
  }
  return addDays(cn.dateStr, 7);
}

/** 中国墙钟日期 + HH:mm → Unix 秒 */
export function chinaDateTimeToUnixSeconds(dateStr: string, hhmm: string): number {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  const utcMs = Date.UTC(y, mo - 1, d, h, mi, 0) - 8 * 60 * 60 * 1000;
  return Math.floor(utcMs / 1000);
}

function buildDescription(input: MedicationCalendarInput): string {
  const parts: string[] = [];
  const dose = String(input.doseText || "").trim();
  if (dose) parts.push(dose);
  const meal = String(input.mealTimingLabel || "").trim();
  if (meal && meal !== "参考说明书或医生建议") parts.push(meal);
  parts.push("用药提醒（由小程序同步）");
  return parts.join("；").slice(0, 450);
}

export function buildMedicationCalendarItems(input: MedicationCalendarInput): PhoneRepeatCalendarItem[] {
  const times = (input.times || [])
    .map((t) => String(t || "").trim())
    .filter((t) => /^\d{2}:\d{2}$/.test(t));
  if (times.length === 0) return [];

  const cn = getChinaNowParts();
  const repeatMode = input.repeatMode || "everyday";
  const customWeekdays = Array.isArray(input.customWeekdays) ? input.customWeekdays.map(String) : [];
  const shortName = String(input.drugName || "用药").trim().slice(0, 16);

  const out: PhoneRepeatCalendarItem[] = [];

  if (repeatMode === "everyday") {
    for (const t of times) {
      const dateStr = nextActiveDateStr(cn, t, "everyday", []);
      const startTime = chinaDateTimeToUnixSeconds(dateStr, t);
      out.push({
        title: `吃药提醒：${shortName}`,
        description: buildDescription(input),
        startTime,
        repeatInterval: "day",
        alarm: true,
        alarmOffset: 0,
      });
    }
    return out;
  }

  if (repeatMode === "weekday") {
    const wds = [1, 2, 3, 4, 5];
    for (const t of times) {
      for (const wd of wds) {
        const dateStr = firstOccurrenceForWeekday(cn, wd, t, "weekday", []);
        const startTime = chinaDateTimeToUnixSeconds(dateStr, t);
        out.push({
          title: `吃药：${shortName} ${t}`,
          description: buildDescription(input),
          startTime,
          repeatInterval: "week",
          alarm: true,
          alarmOffset: 0,
        });
      }
    }
    return out;
  }

  const wdsCustom = customWeekdays
    .map((x) => Number(x))
    .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6);
  const uniqWds = Array.from(new Set(wdsCustom)).sort((a, b) => a - b);
  if (uniqWds.length === 0) return [];

  for (const t of times) {
    for (const wd of uniqWds) {
      const dateStr = firstOccurrenceForWeekday(cn, wd, t, "custom", customWeekdays);
      const startTime = chinaDateTimeToUnixSeconds(dateStr, t);
      out.push({
        title: `吃药：${shortName} ${t}`,
        description: buildDescription(input),
        startTime,
        repeatInterval: "week",
        alarm: true,
        alarmOffset: 0,
      });
    }
  }
  return out;
}

export function canSyncMedicationToCalendar(): boolean {
  try {
    return typeof wx !== "undefined" && wx.canIUse("addPhoneRepeatCalendar");
  } catch {
    return false;
  }
}

export async function syncMedicationCalendarToPhone(
  items: PhoneRepeatCalendarItem[],
  options?: { gapMs?: number },
): Promise<{ ok: number; fail: number; lastErr?: string }> {
  const gap = options?.gapMs ?? 380;
  let ok = 0;
  let fail = 0;
  let lastErr = "";
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    try {
      await new Promise<void>((resolve, reject) => {
        wx.addPhoneRepeatCalendar({
          title: it.title,
          startTime: it.startTime,
          description: it.description,
          repeatInterval: it.repeatInterval,
          alarm: it.alarm,
          alarmOffset: it.alarmOffset,
          success: () => resolve(),
          fail: (e) => reject(e),
        });
      });
      ok += 1;
    } catch (e: unknown) {
      fail += 1;
      const err = e as { errMsg?: string };
      lastErr = err?.errMsg || String(e);
    }
    if (i < items.length - 1 && gap > 0) {
      await new Promise((r) => setTimeout(r, gap));
    }
  }
  return { ok, fail, lastErr };
}
