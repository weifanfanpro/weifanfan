import { isAuthed } from "../../utils/user";
import { getViewInfo } from "../../utils/view";
import { switchMainTab } from "../../utils/main-tab";
import { getDashboard, getMissedStats, getLowStockSummary } from "../../api/dashboard";
import { takeMedicine } from "../../api/reminder";

type TakeStatus = "notYet" | "due" | "overdue" | "taken";

type MedItem = {
  id: string; // reminder _id，用于已服用记录
  medicineId: string; // medicines 的 _id，用于跳转药品详情
  name: string;
  dose: string;
  time: string; // HH:mm
  status: TakeStatus;
  actionText: string;
  actionDisabled: boolean;
  actionStyle: string;
  actionClass: string;
  actionIcon: string;
  actionPulse: boolean;
  statusLabel: string;
  statusClass: TakeStatus;
};

type Section = {
  key: string;
  label: string;
  subLabel: string;
  items: MedItem[];
};

function parseAmountAndUnit(text: string): { amount: number; unit: string } | null {
  const s = String(text || "").replace(/\s+/g, "");
  if (!s) return null;
  const m = s.match(/(\d+(?:\.\d+)?)(片|粒|袋|包|瓶|支|贴|滴|克|g|mg|毫升|ml|mL|次)/i);
  if (!m) return null;
  return { amount: Number(m[1]), unit: String(m[2]).toLowerCase() };
}

function parseDoseFromReminder(reminder: any): { amount: number; unit: string } | null {
  const fromText = parseAmountAndUnit(String(reminder?.doseText || ""));
  if (fromText) return fromText;
  const value = Number(reminder?.doseValue);
  const unit = String(reminder?.doseUnit || "").trim().toLowerCase();
  if (!Number.isFinite(value) || value <= 0 || !unit) return null;
  return { amount: value, unit };
}

function perDayFactor(reminder: any): number {
  const mode = String(reminder?.repeatMode || "everyday");
  if (mode === "everyday") return 1;
  if (mode === "weekday") return 5 / 7;
  if (mode === "custom") {
    const arr = Array.isArray(reminder?.customWeekdays) ? reminder.customWeekdays : [];
    return Math.max(0, Math.min(7, arr.length)) / 7;
  }
  return 1;
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function formatTodayCN(date: Date) {
  const weekMap = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"] as const;
  return `${date.getMonth() + 1} 月${date.getDate()}日 ${weekMap[date.getDay()]}`;
}

function timeToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map((v) => Number(v));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

function computeStatus(now: Date, time: string, taken: boolean): TakeStatus {
  if (taken) return "taken";
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const target = timeToMinutes(time);
  // 当前时间早于服药时间：未到时间
  if (nowMin < target) return "notYet";
  // 当前时间晚于服药时间，但在服药时间后 30 分钟之前：尽快服用（记为 due）
  if (nowMin <= target + 30) return "due";
  // 剩余情况：超过服药时间 30 分钟以上，视为“漏服”（overdue）
  return "overdue";
}

function actionForStatus(status: TakeStatus) {
  if (status === "taken") {
    return {
      actionText: "已服用",
      actionDisabled: true,
      actionStyle: "",
      actionClass: "task-action-btn--taken",
      actionIcon: "✓",
      actionPulse: false,
    };
  }
  if (status === "overdue") {
    return {
      actionText: "漏服",
      actionDisabled: true,
      actionStyle: "",
      actionClass: "task-action-btn--overdue",
      actionIcon: "!",
      actionPulse: true,
    };
  }
  if (status === "due") {
    return {
      actionText: "尽快服用",
      actionDisabled: false,
      actionStyle: "",
      actionClass: "task-action-btn--due",
      actionIcon: "⚡",
      actionPulse: true,
    };
  }
  return {
    actionText: "未到时间",
    actionDisabled: true,
    actionStyle: "",
    actionClass: "task-action-btn--notYet",
    actionIcon: "⏱",
    actionPulse: false,
  };
}

function statusLabel(status: TakeStatus) {
  if (status === "taken") return "已完成";
  if (status === "overdue") return "漏服";
  if (status === "due") return "尽快";
  return "未到时";
}

/** 根据 HH:mm 归到时段：早上 / 中午 / 晚上 / 睡前 */
function slotKey(time: string): string {
  const m = timeToMinutes(time);
  if (m >= 5 * 60 && m < 10 * 60) return "morning";
  if (m >= 10 * 60 && m < 14 * 60) return "noon";
  if (m >= 14 * 60 && m < 20 * 60) return "evening";
  return "bed";
}

const SLOT_LABELS: Record<string, string> = {
  morning: "早上（05:00 ~ 09:59）",
  noon: "中午（10:00 ~ 13:59）",
  evening: "晚上（14:00 ~ 19:59）",
  bed: "睡前（20:00 ~ 次日 04:59）",
};

/** 今天是否命中该提醒的重复规则 */
function matchesToday(repeatMode: string, customWeekdays: string[], todayDay: number): boolean {
  if (repeatMode === "everyday") return true;
  if (repeatMode === "weekday") return todayDay >= 1 && todayDay <= 5;
  if (repeatMode === "custom") return customWeekdays.includes(String(todayDay));
  return true;
}

Component({
  properties: {
    active: { type: Boolean, value: false },
  },
  observers: {
    active(active: boolean) {
      if (active) (this as any).onTabPanelShow?.();
    },
  },
  data: {
    dateText: "",
    viewLabel: "本人",
    pendingCount: 0,
    sections: [] as Section[],
    dayProgress: 0, // 0~100，模拟电量：今天已过去的比例
    riskScore: 100,
    riskLevel: "low",
    riskHint: "",
    lowStockCount: 0,
    lowStockTop: [] as { name: string; daysLeft: number; alreadyNotifiedToday?: boolean }[],
    heroTimeText: "",
    riskLevelText: "风险较低",
    heroTiltStyle: "",
    emptyTiltStyle: "",
    metricSwiperIndex: 0,
  },
  // 组件挂载时启动一个定时器，定期刷新当天用药状态
  lifetimes: {
    attached() {
      const that = this as any;
      // 首次进入页面立即刷新一次
      if (typeof that.refresh === "function") {
        that.refresh();
      }
      // 防止重复创建定时器
      if (that._refreshTimer) {
        clearInterval(that._refreshTimer);
      }
      // 每 10 秒自动刷新一次（只在当前页面处于前台时有效）
      that._refreshTimer = setInterval(() => {
        if (typeof that.refresh === "function") {
          that.refresh();
        }
      }, 10000);
    },
    detached() {
      const that = this as any;
      if (that._refreshTimer) {
        clearInterval(that._refreshTimer);
        that._refreshTimer = null;
      }
    },
  },
  pageLifetimes: {
    show() {
      if (!this.properties.active) return;
      (this as any).onTabPanelShow?.();
    },
  },
  methods: {
    async estimateLowStockCount(_targetOpenid: string): Promise<number> {
      try {
        const res = await getLowStockSummary();
        return Number(res?.count || 0);
      } catch {
        return 0;
      }
    },

    onTabPanelShow() {
      if (!isAuthed()) {
        wx.reLaunch({
          url: `/pages/login/index?redirect=${encodeURIComponent("/pages/tab-shell/index?tab=0")}`,
        });
        return;
      }
      (this as any).refresh?.();
    },
    setTiltStyle(tiltKey: string, style: string, sectionKey?: string) {
      if (tiltKey === "hero") {
        this.setData({ heroTiltStyle: style });
        return;
      }
      if (tiltKey === "empty") {
        this.setData({ emptyTiltStyle: style });
        return;
      }
    },
    onTiltTouchStart(e: WechatMiniprogram.TouchEvent) {
      (this as any).onTiltTouchMove?.(e);
    },
    onTiltTouchMove(e: WechatMiniprogram.TouchEvent) {
      const touch = e.touches && e.touches[0];
      if (!touch) return;
      const dataset = e.currentTarget.dataset as { tiltId?: string; tiltKey?: string; sectionKey?: string };
      const { tiltId, tiltKey, sectionKey } = dataset;
      if (!tiltId || !tiltKey) return;
      const now = Date.now();
      const that = this as any;
      that._tiltTick = that._tiltTick || {};
      if (that._tiltTick[tiltId] && now - that._tiltTick[tiltId] < 16) return;
      that._tiltTick[tiltId] = now;
      const selector = `#${tiltId}`;
      wx.createSelectorQuery()
        .in(this)
        .select(selector)
        .boundingClientRect((rect) => {
          if (!rect) return;
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const nx = Math.max(-1, Math.min(1, (touch.clientX - cx) / (rect.width / 2)));
          const ny = Math.max(-1, Math.min(1, (touch.clientY - cy) / (rect.height / 2)));
          const rx = Number((-ny * 7).toFixed(2));
          const ry = Number((nx * 8).toFixed(2));
          const sx = Number((50 + nx * 16).toFixed(2));
          const sy = Number((50 + ny * 16).toFixed(2));
          const style = `--tilt-rx:${rx}deg;--tilt-ry:${ry}deg;--shine-x:${sx}%;--shine-y:${sy}%;--tilt-scale:1.01;`;
          (this as any).setTiltStyle?.(tiltKey, style, sectionKey);
        })
        .exec();
    },
    onTiltTouchEnd(e: WechatMiniprogram.TouchEvent) {
      const dataset = e.currentTarget.dataset as { tiltKey?: string; sectionKey?: string };
      const { tiltKey, sectionKey } = dataset;
      if (!tiltKey) return;
      (this as any).setTiltStyle?.(tiltKey, "", sectionKey);
    },
    onMetricSwiperChange(e: WechatMiniprogram.SwiperChange) {
      const cur = e.detail?.current;
      if (typeof cur === "number") {
        this.setData({ metricSwiperIndex: cur });
      }
    },
    async refresh() {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
      const todayDay = now.getDay();
      const hh = pad2(now.getHours());
      const mm = pad2(now.getMinutes());
      const v = getViewInfo();
      const viewLabel = v.isSelf ? "本人" : v.label;
      const dayProgress = Math.max(
        0,
        Math.min(
          100,
          Math.round(((now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400) * 100),
        ),
      );

      try {
        const [dashboardData, statsData, stockData] = await Promise.all([
          getDashboard(v.viewOpenid),
          getMissedStats(v.viewOpenid),
          getLowStockSummary(v.viewOpenid),
        ]);
        const riskScore = Number(statsData?.riskScore || 100);
        const riskLevel = riskScore < 60 ? "high" : riskScore < 80 ? "mid" : "low";
        const riskHint =
          riskLevel === "high"
            ? `本周漏服风险较高（${riskScore}分），建议家属今天主动关怀。`
            : riskLevel === "mid"
              ? `本周漏服风险中等（${riskScore}分），建议重点关注易漏服时段。`
              : "";
        const reminders = (dashboardData?.reminders || []) as any[];
        const takenSet = new Set<string>(((dashboardData?.logs || []) as any[]).map((log) => log.reminderId));

        const items: MedItem[] = [];
        for (const r of reminders) {
          if (!matchesToday(r.repeatMode, r.customWeekdays || [], todayDay)) continue;
          if (r.startDate && String(r.startDate) > String(todayStr)) continue;
          const taken = takenSet.has(String(r.id ?? r._id ?? ""));
          const status = computeStatus(now, r.time || "08:00", taken);
          items.push({
            id: String(r.id ?? r._id ?? ""),
            medicineId: String(r.medicineId || ""),
            name: r.medicineName || "药品",
            dose: `${r.doseValue || "1"}${r.doseUnit || "片"}`,
            time: r.time || "08:00",
            status,
            statusLabel: statusLabel(status),
            statusClass: status,
            ...actionForStatus(status),
          });
        }
        items.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

        const bySlot: Record<string, MedItem[]> = { morning: [], noon: [], evening: [], bed: [] };
        for (const m of items) {
          const key = slotKey(m.time);
          bySlot[key].push(m);
        }
        const sections: Section[] = ["morning", "noon", "evening", "bed"]
          .filter((k) => bySlot[k].length > 0)
          .map((key) => ({ key, label: SLOT_LABELS[key], subLabel: `共 ${bySlot[key].length} 条任务`, items: bySlot[key] }));

        const pendingCount = items.filter((m) => m.status !== "taken").length;
        const lowStockCount = Number(stockData?.count || 0);
        const lowStockTop = Array.isArray(stockData?.top) ? stockData.top : [];

        this.setData({
          dateText: formatTodayCN(now),
          viewLabel,
          pendingCount,
          sections,
          dayProgress,
          riskScore,
          riskLevel,
          riskLevelText: riskLevel === "high" ? "高风险" : riskLevel === "mid" ? "中风险" : "风险较低",
          riskHint,
          lowStockCount,
          lowStockTop,
          heroTimeText: `${hh}:${mm}`,
        });
      } catch (err) {
        console.error("index refresh error", err);
        this.setData({
          dateText: formatTodayCN(now),
          viewLabel,
          pendingCount: 0,
          sections: [],
          dayProgress,
          riskScore: 100,
          riskLevel: "low",
          riskLevelText: "风险较低",
          riskHint: "",
          lowStockCount: 0,
          lowStockTop: [],
          heroTimeText: `${hh}:${mm}`,
        });
      }
    },

    onAddMedicine() {
      wx.navigateTo({ url: "/pages/add-medicine/index" });
    },

    onGoScan() {
      switchMainTab(1);
    },

    onNearbyPharmacy() {
      wx.navigateTo({ url: "/pages/nearby-pharmacy/index" });
    },

    onOpenStockMonitor() {
      wx.navigateTo({ url: "/pages/stock-monitor/index" });
    },

    onOpenDrugDetail(e: WechatMiniprogram.BaseEvent) {
      const { medicineId, name } = e.currentTarget.dataset as { medicineId?: string; name?: string };
      const q = `?id=${encodeURIComponent(medicineId || "")}&name=${encodeURIComponent(name || "")}`;
      wx.navigateTo({ url: `/pages/drug-detail/index${q}` });
    },

    async onTake(e: WechatMiniprogram.BaseEvent) {
      const { id, disabled } = e.currentTarget.dataset as { id?: string; disabled?: boolean };
      if (disabled) return;
      if (!id) return;
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
      try {
        const v = getViewInfo();
        if (!v.isSelf) {
          wx.showToast({ icon: "none", title: "当前不是本人，不能代替服用" });
          return;
        }
        const ret = await takeMedicine({ reminderId: id, date: todayStr, targetOpenid: v.viewOpenid });
        if (Number.isFinite(Number(ret?.pointsBalance))) {
          try {
            wx.setStorageSync("points_balance_cache", Number(ret.pointsBalance));
          } catch {}
        }
        if (Number(ret?.pointsDelta || 0) > 0) {
          wx.showToast({ icon: "success", title: `积分 +${ret.pointsDelta}` });
        } else if (String(ret?.pointsReason || "") && String(ret?.pointsReason || "") !== "awarded") {
          wx.showToast({ icon: "none", title: String(ret?.pointsReasonText || "本次未获得积分").slice(0, 16) });
        } else {
          wx.showToast({ icon: "none", title: "本次未获得积分" });
        }
        (this as any).refresh?.();
      } catch (err) {
        console.error("onTake error", err);
        const msg = String((err as any)?.message || (err as any)?.errMsg || "记录失败").trim();
        wx.showToast({ icon: "none", title: (msg || "记录失败").slice(0, 16) });
      }
    },
  },
});
