import Toast from "tdesign-miniprogram/toast/index";
import { getViewInfo } from "../../utils/view";
import { addMedicine } from "../../api/user-medicine";
import { createPending } from "../../api/family";

type ScanResult = {
  name: string;
  indication: string;
  dosage: string;
  usageMethod?: string;
  usageMethodText?: string;
  isQuantifiable?: boolean;
  doseText?: string;
  totalAmountText?: string | null;
  warnings?: string[];
  contraindications?: string;
};

function usageMethodToLabel(method: string): string {
  const m = String(method || "").toLowerCase().trim();
  if (m === "oral") return "口服";
  if (m === "topical") return "外用";
  if (m === "eye") return "滴眼";
  if (m === "nose") return "滴鼻";
  if (m === "inhalation") return "吸入";
  if (m === "injection") return "注射";
  return "其他";
}

function extractQuantifiedDoseText(text: string): string {
  const s = String(text || "").replace(/\s+/g, "");
  if (!s) return "";
  const hit =
    s.match(/(每次[^，。；\n]{0,24}(?:\d+(?:\.\d+)?)(?:片|粒|袋|包|瓶|支|贴|滴|克|g|mg|毫升|ml|mL))/i) ||
    s.match(/(一次[^，。；\n]{0,24}(?:\d+(?:\.\d+)?)(?:片|粒|袋|包|瓶|支|贴|滴|克|g|mg|毫升|ml|mL))/i);
  return hit && hit[1] ? hit[1] : "";
}

function normalizeWarnings(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) =>
      String(item || "")
        .replace(/\\n/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

function normalizeDoseText(result: ScanResult): ScanResult {
  const rawDoseText = String(result.doseText || "").trim();
  const dosage = String(result.dosage || "").trim();
  const inferredDoseText = extractQuantifiedDoseText(rawDoseText) || extractQuantifiedDoseText(dosage);
  const isQuantifiable = Boolean(result.isQuantifiable) || Boolean(inferredDoseText);
  let doseText = rawDoseText;

  if (!isQuantifiable) doseText = "每次适量";
  else if (!doseText || /(适量|按需|遵医嘱)/.test(doseText)) {
    doseText = inferredDoseText || dosage || "每次 1 次";
  }

  return {
    ...result,
    usageMethodText: String(result.usageMethodText || "").trim() || usageMethodToLabel(String(result.usageMethod || "other")),
    isQuantifiable,
    doseText,
    totalAmountText: isQuantifiable ? (result.totalAmountText ?? null) : null,
    warnings: normalizeWarnings(result.warnings),
  };
}

Page({
  _adding: false,
  data: {
    result: {
      name: "",
      indication: "",
      dosage: "",
      isQuantifiable: false,
      doseText: "",
      totalAmountText: null,
      warnings: [] as string[],
      contraindications: "",
    } as ScanResult,
    medicineId: "",
    viewIsSelf: true,
    viewLabel: "本人",
    scanTimeText: "",
    hasRiskWarning: false,
  },

  onLoad() {
    const app = getApp<{ globalData?: { scanResult?: any } }>();
    const scan = app.globalData?.scanResult;
    if (!scan || !scan.medicineId) {
      Toast({ message: "无识别结果，请重新扫描" });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }
    const normalizedResult = normalizeDoseText((scan.result || {}) as ScanResult);
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    this.setData({
      result: normalizedResult,
      medicineId: scan.medicineId,
      viewIsSelf: scan.viewIsSelf ?? true,
      viewLabel: scan.viewLabel || "本人",
      scanTimeText: `${hh}:${mm} 识别完成`,
      hasRiskWarning: Boolean(String(normalizedResult.contraindications || "").trim()),
    });
  },

  async onAddAndSetReminder() {
    const { result, medicineId } = this.data as any;
    if (!medicineId) {
      Toast({ context: this, message: "缺少药品ID，请重新识别" });
      return;
    }
    if (this._adding) return;
    this._adding = true;
    try {
      const v = getViewInfo();
      if (!v.isSelf) {
        wx.navigateTo({
          url:
            "/pages/reminder-setting/index?name=" +
            encodeURIComponent(result.name) +
            "&id=" +
            encodeURIComponent(medicineId),
        });
        return;
      }
      await addMedicine({
        medicineId: Number(medicineId),
        name: result.name,
        rule: result.dosage,
        isQuantifiable: Boolean(result.isQuantifiable),
        doseText: String(result.doseText || ""),
        totalAmountText: Boolean(result.isQuantifiable) ? (result.totalAmountText == null ? undefined : String(result.totalAmountText)) : undefined,
      });
      Toast({ context: this, message: "已加入药单" });
      const isQ = Boolean(result.isQuantifiable);
      const nextDoseText = encodeURIComponent(String(result.doseText || ""));
      const nextTotalAmountText = encodeURIComponent(String(result.totalAmountText == null ? "" : result.totalAmountText));
      wx.navigateTo({
        url:
          "/pages/reminder-setting/index?name=" +
          encodeURIComponent(result.name) +
          "&id=" +
          encodeURIComponent(medicineId) +
          "&isQuantifiable=" +
          (isQ ? "1" : "0") +
          "&doseText=" +
          nextDoseText +
          "&totalAmountText=" +
          nextTotalAmountText,
      });
    } catch (err) {
      console.error("onAddAndSetReminder error", err);
      Toast({ context: this, message: "添加失败，请稍后再试" });
    } finally {
      this._adding = false;
    }
  },

  async onAddOnly() {
    const { result, medicineId } = this.data as any;
    if (!medicineId) {
      Toast({ context: this, message: "缺少药品ID，请重新识别" });
      return;
    }
    if (this._adding) return;
    this._adding = true;
    try {
      const v = getViewInfo();
      if (!v.isSelf) {
        await createPending({
          ownerOpenid: v.viewOpenid,
          name: result.name,
          isQuantifiable: Boolean(result.isQuantifiable),
          doseText: String(result.doseText || ""),
          totalAmountText: Boolean(result.isQuantifiable) ? (result.totalAmountText == null ? undefined : String(result.totalAmountText)) : undefined,
          rule: result.dosage,
        });
        Toast({ context: this, message: `已提交给「${v.label}」，等待对方在【家属】页激活` });
        wx.navigateTo({ url: "/pages/family/index" });
        return;
      }
      await addMedicine({
        medicineId: Number(medicineId),
        name: result.name,
        rule: result.dosage,
        isQuantifiable: Boolean(result.isQuantifiable),
        doseText: String(result.doseText || ""),
        totalAmountText: Boolean(result.isQuantifiable) ? (result.totalAmountText == null ? undefined : String(result.totalAmountText)) : undefined,
      });
      Toast({ context: this, message: "已加入药单" });
      wx.navigateTo({ url: "/pages/medicine-list/index" });
    } catch (err) {
      console.error("onAddOnly error", err);
      Toast({ context: this, message: "添加失败，请稍后再试" });
    } finally {
      this._adding = false;
    }
  },

  onViewDetail() {
    const { result, medicineId } = this.data as any;
    if (medicineId) {
      wx.navigateTo({
        url: "/pages/drug-detail/index?name=" + encodeURIComponent(result.name || "") + "&id=" + encodeURIComponent(medicineId),
      });
    } else {
      wx.navigateTo({
        url: "/pages/drug-detail/index?name=" + encodeURIComponent(result.name || ""),
      });
    }
  },

  onAiConsult() {
    const { result, medicineId } = this.data as any;
    // 将扫描结果存入 globalData，供 AI 对话页读取
    const app = getApp<{ globalData?: { aiConsultMedicine?: any } }>();
    if (app.globalData) {
      app.globalData.aiConsultMedicine = {
        medicineId: medicineId || "",
        name: result.name || "",
        indication: result.indication || "",
        dosage: result.dosage || "",
      };
    }
    wx.navigateTo({
      url: "/pages/ai-chat/index?from=scan&medicine=" + encodeURIComponent(result.name || ""),
    });
  },
});
