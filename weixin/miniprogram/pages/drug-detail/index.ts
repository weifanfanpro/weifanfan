import { getViewInfo } from "../../utils/view";
import { getMedicineById, getMedicineByName } from "../../api/medicine";
import { getDrugDetailRule } from "../../api/family";

type DrugDetail = {
  id?: number;
  name: string;
  rule: {
    timesPerDay: string;
    doseEach: string;
    when: string;
    isQuantifiable?: boolean;
    totalAmountText?: string | null;
  };
  function: string;
  notices: string[];
  contraindications: string;
};

Page({
  data: {
    opened: "dose",
    viewLabel: "本人",
    heroSubtitle: "核心用药信息已整理，展开下方可查看完整说明。",
    fallbackFunctionText: "暂无主治功能信息，请参考药品说明书或咨询医生。",
    fallbackNoticeText: "暂无注意事项信息，请参考药品说明书。",
    fallbackContraText: "暂无禁忌信息，请参考药品说明书。",
    drug: {
      name: "药品名称",
      rule: {
        timesPerDay: "请按医生医嘱",
        doseEach: "参考说明书剂量",
        when: "参考说明书或医生建议",
      },
      function: "请根据药品说明书或医生建议了解本品的主治功能。",
      notices: [
        "请严格按照医生或说明书的用法用量服用。",
        "如出现明显不适或过敏反应，请立即就医。",
        "如同时服用其他药物，请咨询医生或药师。",
      ],
      contraindications: "如有严重肝肾功能不全、孕妇、哺乳期或儿童等特殊人群，请先咨询医生后使用本品。",
    } as DrugDetail,
  },
  onLoad(options: Record<string, string>) {
    const view = getViewInfo();
    this.setData({ viewLabel: view.isSelf ? "本人" : view.label });
    const name = options?.name ? decodeURIComponent(options.name) : "";
    const id = options?.id ? decodeURIComponent(options.id) : "";

    // 优先从 app.globalData.scanResult 读取（扫描结果页跳转过来的场景）
    const app = getApp<{ globalData?: { scanResult?: any } }>();
    const scan = app.globalData?.scanResult;
    if (scan && scan.medicineId && (!id || String(scan.medicineId) === id)) {
      const r = scan.result || {};
      const dosageSummary = String(r.dosage || "");
      const doseText = r.doseText || dosageSummary || "参考说明书剂量";
      const isQuantifiable = Boolean(r.isQuantifiable);
      const totalAmountText = r.totalAmountText != null ? String(r.totalAmountText) : null;

      let timesPerDay = "请按医生医嘱";
      let when = "参考说明书或医生建议";
      if (dosageSummary.includes("饭前") || dosageSummary.includes("餐前")) when = "饭前";
      else if (dosageSummary.includes("饭后") || dosageSummary.includes("餐后")) when = "饭后";
      else if (dosageSummary.includes("空腹")) when = "空腹";

      this.setData({
        drug: {
          id: Number(scan.medicineId),
          name: r.name || name || this.data.drug.name,
          rule: { timesPerDay, doseEach: doseText, when, isQuantifiable, totalAmountText },
          function: r.indication || this.data.drug.function,
          notices: Array.isArray(r.warnings) && r.warnings.length > 0 ? r.warnings : this.data.drug.notices,
          contraindications: r.contraindications || this.data.drug.contraindications,
        },
      });
      // 如果有 id，仍然尝试从云端加载以获取更完整的信息
      if (scan.medicineId) {
        this.loadFromCloud(String(scan.medicineId), r.name || name);
      }
      return;
    }

    if (id) {
      this.loadFromCloud(id, name);
    } else if (name) {
      this.loadFromCloudByName(name);
    }
  },
  onShow() {
    const view = getViewInfo();
    this.setData({ viewLabel: view.isSelf ? "本人" : view.label });
  },
  extractWhenText(summary: string): string {
    const s = String(summary || "");
    if (!s) return "参考说明书或医生建议";
    if (s.includes("饭前") || s.includes("餐前")) return "饭前";
    if (s.includes("饭后") || s.includes("餐后")) return "饭后";
    if (s.includes("空腹")) return "空腹";
    return "参考说明书或医生建议";
  },
  async loadFromCloud(id: string, fallbackName?: string) {
    try {
      const doc = await getMedicineById(Number(id));

      const dosageSummary: string = doc.dosageSummary || "";
      const dailyFrequency: number | null = typeof doc.dailyFrequency === "number" ? doc.dailyFrequency : null;
      const perDoseAmount = doc.perDoseAmount;
      const perDoseUnit = doc.perDoseUnit;
      const doseText = doc.doseText != null ? String(doc.doseText) : "";
      const isQuantifiable = Boolean(doc.isQuantifiable);
      const totalAmountText =
        doc.totalAmountText === null || typeof doc.totalAmountText === "undefined" ? null : String(doc.totalAmountText);

      let timesPerDay = dailyFrequency && dailyFrequency > 0 ? `每日 ${dailyFrequency} 次` : "请按医生医嘱";
      let doseEach =
        perDoseAmount != null && perDoseUnit
          ? `每次 ${perDoseAmount} ${perDoseUnit}`
          : dosageSummary || "参考说明书剂量";
      let when = this.extractWhenText(dosageSummary);
      if (doseText) doseEach = doseText;

      try {
        const v = getViewInfo();
        const rs = await getDrugDetailRule({
          targetOpenid: v.viewOpenid,
          medicineId: id,
          medicineName: doc.name || fallbackName || "",
        });
        if (Array.isArray(rs) && rs.length > 0) {
          const uniqueTimes = Array.from(new Set(rs.map((r: any) => r.time).filter(Boolean)));
          if (uniqueTimes.length > 0) timesPerDay = `每日 ${uniqueTimes.length} 次`;
          const first = rs[0];
          if (first && typeof first.doseText === "string" && first.doseText.trim()) {
            doseEach = first.doseText.trim();
          } else if (first && (first.doseValue || first.doseUnit)) {
            doseEach = `每次 ${first.doseValue || "1"} ${first.doseUnit || "次"}`;
          }
          if (first && first.mealTiming) {
            if (first.mealTiming === "before") when = "饭前";
            else if (first.mealTiming === "after") when = "饭后";
            else if (first.mealTiming === "empty") when = "空腹";
          }
        }
      } catch (remErr) {
        console.warn("loadFromCloud: read reminders fail", remErr);
      }

      this.setData({
        drug: {
          id: doc.id,
          name: doc.name || fallbackName || this.data.drug.name,
          rule: { timesPerDay, doseEach, when, isQuantifiable, totalAmountText },
          function: doc.indication || this.data.drug.function,
          notices:
            Array.isArray(doc.warnings) && doc.warnings.length > 0
              ? doc.warnings
              : this.data.drug.notices,
          contraindications: doc.contraindications || this.data.drug.contraindications,
        },
      });
    } catch (err) {
      console.error("loadFromCloud error", err);
      if (fallbackName) {
        this.setData({
          drug: { ...this.data.drug, id: Number(id), name: fallbackName },
        });
      }
    }
  },
  async loadFromCloudByName(name: string) {
    try {
      const doc = await getMedicineByName(name);
      if (!doc) {
        this.setData({ drug: { ...this.data.drug, name } });
        return;
      }
      await this.loadFromCloud(String(doc.id), name);
    } catch (err) {
      console.error("loadFromCloudByName error", err);
      this.setData({ drug: { ...this.data.drug, name } });
    }
  },
  onTogglePanel(e: WechatMiniprogram.BaseEvent) {
    const val = String((e.currentTarget as any)?.dataset?.value || "");
    this.setData({ opened: this.data.opened === val ? "" : val });
  },
  onSetReminder() {
    const name = encodeURIComponent(this.data.drug.name);
    const id = this.data.drug.id ? "&id=" + encodeURIComponent(this.data.drug.id) : "";
    wx.navigateTo({
      url: "/pages/reminder-setting/index?name=" + name + id,
    });
  },
});
