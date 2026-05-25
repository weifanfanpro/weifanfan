/** 把 reminders 集合文档转成「咨询上下文」里的可读段落（不含 ID） */

const WEEKDAY_LABEL: Record<string, string> = {
  "0": "周日",
  "1": "周一",
  "2": "周二",
  "3": "周三",
  "4": "周四",
  "5": "周五",
  "6": "周六",
};

function formatRepeatRule(first: any): string {
  const mode = String(first?.repeatMode || "everyday");
  if (mode === "weekday") return "工作日（周一至周五）";
  if (mode === "custom") {
    const cw = Array.isArray(first?.customWeekdays) ? first.customWeekdays : [];
    const labels = cw.map((d: string) => WEEKDAY_LABEL[String(d)] || String(d)).filter(Boolean);
    return labels.length ? `自定义：${labels.join("、")}` : "自定义周期";
  }
  return "每天";
}

function formatMealTiming(mt: string): string {
  if (mt === "before") return "饭前";
  if (mt === "after") return "饭后";
  if (mt === "empty") return "空腹";
  return "未指定（参考说明书或医嘱）";
}

function formatNotify(n: any): string {
  if (!n || typeof n !== "object") return "未记录";
  const parts: string[] = [];
  if (n.wechat) parts.push("微信服务通知");
  if (n.ring) parts.push("铃声");
  if (n.vibrate) parts.push("震动");
  return parts.length ? parts.join("、") : "未开启上述通知项";
}

/** 无提醒时返回空数组；有提醒时返回多行文案（含标题与说明） */
export function reminderPlanConsultLines(reminders: any[]): string[] {
  if (!Array.isArray(reminders) || !reminders.length) return [];
  const sorted = [...reminders].sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));
  const times = sorted.map((r) => r.time).filter(Boolean);
  if (!times.length) return [];

  const first = sorted[0];
  const lines: string[] = [
    "",
    "【已保存的用药提醒（小程序内）】",
    "以下为用户在本小程序中为该药品配置的提醒方案。若用户询问提醒时间、频次、用量或通知方式是否合理，请结合上方药品说明与医学常识分析，并提醒最终以医嘱与说明书为准。",
    `重复周期：${formatRepeatRule(first)}`,
    `各次提醒时间：${times.join("、")}`,
    `与进食关系：${formatMealTiming(String(first.mealTiming || "none"))}`,
  ];

  const doseStrs = sorted.map((r) => `${String(r.doseValue ?? "1")}${String(r.doseUnit || "次")}`);
  const uniqDose = Array.from(new Set(doseStrs));
  if (uniqDose.length === 1) {
    lines.push(`每次用量（提醒中）：${uniqDose[0]}`);
  } else {
    lines.push("各时间点用量（提醒中）：");
    sorted.forEach((r) => {
      if (r.time) lines.push(`  · ${r.time}：每次 ${r.doseValue ?? "1"} ${r.doseUnit || "次"}`);
    });
  }

  const startDates = Array.from(new Set(sorted.map((r) => r.startDate).filter(Boolean)));
  if (startDates.length) lines.push(`提醒生效参考日期：${startDates.join("；")}`);

  lines.push(`通知方式：${formatNotify(first.notify)}`);
  lines.push(`当前计划每日提醒次数：${sorted.length} 次`);

  return lines;
}
