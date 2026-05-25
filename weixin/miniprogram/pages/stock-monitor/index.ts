import { getViewInfo } from "../../utils/view";
import { getMedicineList, getDrugDetailRule } from "../../api/family";

type StockLevel = "low" | "warning" | "enough" | "unknown";

type StockItem = {
  userMedicineId: string;
  medicineId: string;
  name: string;
  totalAmountText: string;
  doseText: string;
  unit: string;
  remainAmount: number | null;
  dailyUseAmount: number;
  daysLeft: number | null;
  level: StockLevel;
  levelText: string;
};

function parseAmountAndUnit(text: string): { amount: number; unit: string } | null {
  const s = String(text || "").replace(/\s+/g, "");
  if (!s) return null;
  const m = s.match(/(\d+(?:\.\d+)?)(片|粒|袋|包|瓶|支|贴|滴|克|g|mg|毫升|ml|mL|次)/i);
  if (!m) return null;
  return {
    amount: Number(m[1]),
    unit: String(m[2]).toLowerCase(),
  };
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

function levelFromDays(daysLeft: number | null): { level: StockLevel; text: string } {
  if (daysLeft == null || !Number.isFinite(daysLeft)) return { level: "unknown", text: "无法估算" };
  if (daysLeft <= 3) return { level: "low", text: "余量紧急" };
  if (daysLeft <= 7) return { level: "warning", text: "余量偏低" };
  return { level: "enough", text: "余量充足" };
}

Component({
  data: {
    loading: false,
    viewLabel: "本人",
    list: [] as StockItem[],
    lastLowToastAt: "",
    heroTitle: "药品余量监控",
    heroSubtitle: "按当前视角统计可量化药品的预计剩余天数。",
    emptyText: "暂无可量化药品",
    unsetText: "未设置",
    unknownDailyUseText: "未配置或无法估算",
  },
  pageLifetimes: {
    show() {
      (this as any).loadList?.();
    },
  },
  methods: {
    async loadList() {
      this.setData({ loading: true });
      try {
        const v = getViewInfo();
        this.setData({ viewLabel: v.isSelf ? "本人" : v.label });
        const list = await getMedicineList(v.viewOpenid);
        const quantList = (list || []).filter((x: any) => !!x.isQuantifiable);
        const mapped: StockItem[] = [];
        for (const item of quantList) {
          const totalAmountText = String(item.totalAmountText || "").trim();
          const totalParsed = parseAmountAndUnit(totalAmountText);

          let dailyUseAmount = 0;
          try {
            const reminders = (await getDrugDetailRule({
              targetOpenid: v.viewOpenid,
              userMedicineId: String(item.id || ""),
              medicineId: String(item.medicineId || ""),
              medicineName: String(item.name || ""),
            })) as any[];
            reminders.forEach((r) => {
              const dose = parseDoseFromReminder(r);
              if (!dose || !totalParsed) return;
              if (dose.unit !== totalParsed.unit) return;
              dailyUseAmount += dose.amount * perDayFactor(r);
            });
          } catch {}

          const remainAmount = totalParsed ? totalParsed.amount : null;
          const daysLeft = remainAmount != null && dailyUseAmount > 0 ? remainAmount / dailyUseAmount : null;
          const lv = levelFromDays(daysLeft);

          mapped.push({
            userMedicineId: String(item.id || ""),
            medicineId: String(item.medicineId || ""),
            name: String(item.name || "药品"),
            totalAmountText: totalAmountText || "未填写总量",
            doseText: String(item.doseText || ""),
            unit: totalParsed?.unit || "",
            remainAmount,
            dailyUseAmount: Number(dailyUseAmount.toFixed(3)),
            daysLeft: daysLeft == null ? null : Number(daysLeft.toFixed(1)),
            level: lv.level,
            levelText: lv.text,
          });
        }

        mapped.sort((a, b) => {
          const da = a.daysLeft == null ? Number.POSITIVE_INFINITY : a.daysLeft;
          const db = b.daysLeft == null ? Number.POSITIVE_INFINITY : b.daysLeft;
          return da - db;
        });
        this.setData({ list: mapped }, () => {
          const lowCount = mapped.filter((x) => x.level === "low").length;
          if (lowCount <= 0) return;
          const today = new Date();
          const key = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
          if ((this.data as any).lastLowToastAt === key) return;
          this.setData({ lastLowToastAt: key });
          wx.showToast({ icon: "none", title: `有 ${lowCount} 个药品余量紧急` });
        });
      } catch (err) {
        console.error("stock-monitor loadList error", err);
        wx.showToast({ icon: "none", title: "加载失败" });
      } finally {
        this.setData({ loading: false });
      }
    },
    onOpenSetting(e: WechatMiniprogram.BaseEvent) {
      const { name, medicineid } = e.currentTarget.dataset as { name?: string; medicineid?: string };
      wx.navigateTo({
        url: `/pages/reminder-setting/index?name=${encodeURIComponent(name || "")}&id=${encodeURIComponent(medicineid || "")}`,
      });
    },
  },
});
