type WeeklyItem = {
  day: string; // 如 周一
  desc: string; // 提醒次数描述
  missed: number; // 当天漏服次数
  date?: string;
  isToday?: boolean;
  isFuture?: boolean;
  dateShort?: string;
};

type Stats = {
  total: number; // 7 天内应提醒总次数
  ok: number; // 实际已服用次数
  missed: number; // 漏服次数
  rate: number; // 按时率（百分比）
};

type RiskLevel = "low" | "mid" | "high";

type MissedStatsPayload = {
  stats: Stats;
  weekly: WeeklyItem[];
  riskScore?: number;
  streakMissedDays?: number;
  highRiskSlots?: string[];
  suggestions?: string[];
  weeklyBrief?: {
    totalMissed: number;
    topRiskSlotText: string;
    improveDays: number;
    message: string;
  } | null;
  lastWeek?: any;
};

import { getViewInfo } from "../../utils/view";
import { getMissedStats, getWeeklyStats, getWeeklyStatById } from "../../api/dashboard";
import Toast from "tdesign-miniprogram/toast/index";

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function formatDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function weekdayLabel(day: number) {
  const map = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return map[day] || "";
}

/** 某一天是否命中该提醒的重复规则 */
function matchesDay(repeatMode: string, customWeekdays: string[], day: number): boolean {
  if (repeatMode === "everyday") return true;
  if (repeatMode === "weekday") return day >= 1 && day <= 5;
  if (repeatMode === "custom") return customWeekdays.includes(String(day));
  return true;
}

Page({
  data: {
    heroTitle: "漏服统计",
    heroSubtitle: "查看近期按时服药情况。",
    viewLabel: "本人",
    stats: {
      total: 0,
      ok: 0,
      missed: 0,
      rate: 0,
    } as Stats,
    weekly: [] as WeeklyItem[],
    selectedDay: null as WeeklyItem | null,
    riskScore: 100,
    streakMissedDays: 0,
    riskLevel: "low" as RiskLevel,
    highRiskSlots: [] as string[],
    highRiskSlotText: "暂无",
    suggestions: [] as string[],
    weeklyBrief: null as {
      totalMissed: number;
      topRiskSlotText: string;
      improveDays: number;
      message: string;
    } | null,
    lastWeek: null as any,
    lastWeekVisible: false,
    weeklyHistory: [] as any[],
    historyVisible: false,
    historyDetail: null as any,
    historyLoading: false,
  },
  onShow() {
    (this as any).refresh?.();
  },

  // methods
    levelByRisk(score: number): RiskLevel {
      if (score < 60) return "high";
      if (score < 80) return "mid";
      return "low";
    },

    slotText(slots: string[]): string {
      const map: Record<string, string> = {
        morning: "早上",
        noon: "中午",
        evening: "晚上",
        bed: "睡前",
      };
      if (!Array.isArray(slots) || slots.length === 0) return "暂无";
      return slots.map((s) => map[s] || s).join("、");
    },

    async refresh() {
      try {
        const v = getViewInfo();
        const data = (await getMissedStats(v.viewOpenid)) as any as MissedStatsPayload;
        const viewLabel = v.isSelf ? "本人" : v.label;
        const riskScore = Number(data.riskScore || 100);
        const weekly = data.weekly || [];
        const weeklyWithShort = weekly.map((x) => ({
          ...x,
          dateShort: String(x.date || "").slice(5),
        }));
        const slotText = (this as any).slotText(Array.isArray(data.highRiskSlots) ? data.highRiskSlots : []);
        this.setData({
          stats: data.stats || { total: 0, ok: 0, missed: 0, rate: 0 },
          viewLabel,
          weekly: weeklyWithShort,
          selectedDay: weeklyWithShort.find((x) => x.isToday) || weeklyWithShort[0] || null,
          riskScore,
          streakMissedDays: Number(data.streakMissedDays || 0),
          riskLevel: (this as any).levelByRisk(riskScore),
          highRiskSlots: Array.isArray(data.highRiskSlots) ? data.highRiskSlots : [],
          highRiskSlotText: slotText,
          suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
          weeklyBrief: data.weeklyBrief || null,
          lastWeek: data.lastWeek || null,
        });

        // 预加载周报历史（用于“历史周报”）
        ;(this as any).loadWeeklyHistory?.(v.viewOpenid);
      } catch (err) {
        console.error("missed-stats refresh error", err);
        const v = getViewInfo();
        this.setData({
          viewLabel: v.isSelf ? "本人" : v.label,
          stats: { total: 0, ok: 0, missed: 0, rate: 0 },
          weekly: [],
          selectedDay: null,
          riskScore: 100,
          streakMissedDays: 0,
          riskLevel: "low",
          highRiskSlots: [],
          highRiskSlotText: "暂无",
          suggestions: [],
          weeklyBrief: null,
          lastWeek: null,
          weeklyHistory: [],
          historyDetail: null,
          historyVisible: false,
          historyLoading: false,
        });
      }
    },

    async loadWeeklyHistory(targetOpenid: string) {
      try {
        this.setData({ historyLoading: true });
        const data = (await getWeeklyStats()) as any;
        const list = Array.isArray(data) ? data : (data?.list || []);
        this.setData({ weeklyHistory: list });
      } catch (e) {
        console.warn("loadWeeklyHistory fail", e);
        this.setData({ weeklyHistory: [] });
      } finally {
        this.setData({ historyLoading: false });
      }
    },

    onPickDay(e: WechatMiniprogram.BaseEvent) {
      const { date } = e.currentTarget.dataset as { date?: string };
      if (!date) return;
      const one = ((this.data as any).weekly || []).find((x: WeeklyItem) => x.date === date);
      if (!one) return;
      this.setData({ selectedDay: one });
    },

    onOpenLastWeek() {
      const lw = (this.data as any).lastWeek;
      if (!lw) {
        Toast({ context: this, message: "暂无上周记录" });
        return;
      }
      this.setData({ lastWeekVisible: true });
    },
    onCloseLastWeek() {
      this.setData({ lastWeekVisible: false });
    },

    onOpenHistory() {
      const list = (this.data as any).weeklyHistory || [];
      if (!Array.isArray(list) || list.length === 0) {
        Toast({ context: this, message: "暂无周报历史" });
        return;
      }
      this.setData({ historyVisible: true, historyDetail: null });
    },

    onCloseHistory() {
      this.setData({ historyVisible: false, historyDetail: null });
    },

    async onPickHistory(e: WechatMiniprogram.BaseEvent) {
      const { id } = e.currentTarget.dataset as { id?: string };
      if (!id) return;
      try {
        this.setData({ historyLoading: true });
        const data = await getWeeklyStatById(id);
        this.setData({ historyDetail: data || null });
      } catch (e: any) {
        Toast({ context: this, message: e?.message || "获取失败" });
      } finally {
        this.setData({ historyLoading: false });
      }
    },

    onCopyWeeklyBrief() {
      const brief = (this.data as any).weeklyBrief;
      if (!brief) {
        Toast({ context: this, message: "暂无可复制内容" });
        return;
      }
      const text =
        `上周关怀周报\n` +
        `漏服总数：${brief.totalMissed} 次\n` +
        `高风险时段：${brief.topRiskSlotText}\n` +
        `连续改善天数：${brief.improveDays} 天\n` +
        `建议：${brief.message}`;
      wx.setClipboardData({
        data: text,
        success: () => Toast({ context: this, message: "已复制关怀话术" }),
      });
    },
});

