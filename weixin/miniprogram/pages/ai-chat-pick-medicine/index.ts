import { reminderPlanConsultLines } from "../../utils/ai-consult-reminders";
import { switchMainTab } from "../../utils/main-tab";
import { isAuthed } from "../../utils/user";
import { getViewInfo } from "../../utils/view";
import { getMedicineList, getDrugDetailRule } from "../../api/family";
import { getMedicineById } from "../../api/medicine";

type Row = { id: number; medicineId: number | null; name: string; rule: string };

/** 读药品档案（说明书类字段），与药品详情页同源 */
async function loadMedicineDoc(medicineId: string | number): Promise<Record<string, unknown> | null> {
  const mid = Number(medicineId);
  if (!mid) return null;
  try {
    return await getMedicineById(mid);
  } catch {
    return null;
  }
}

/** 组装传给 AI 的可读字段（不含任何数据库 ID） */
async function buildConsultDetailFromPick(params: {
  targetOpenid: string;
  medicineId: string;
  listName: string;
  listRule: string;
  userMedicineId: string;
}) {
  const med = await loadMedicineDoc(params.medicineId);
  const displayName = String((med?.name as string) || params.listName || "药品").trim();
  const listRule = String(params.listRule || "").trim();

  const usageLines: string[] = [];
  if (listRule) usageLines.push(`药单中的记录：${listRule}`);

  const reminders = await getDrugDetailRule({
    targetOpenid: params.targetOpenid,
    medicineId: params.medicineId,
    medicineName: displayName,
    userMedicineId: params.userMedicineId,
  });
  usageLines.push(...reminderPlanConsultLines(reminders));

  const dosageSummary = String(med?.dosageSummary || "").trim();
  if (dosageSummary) usageLines.push(`说明书/档案中的用法摘要：${dosageSummary}`);

  const indication = String(med?.indication || "").trim();
  const rawWarnings = med?.warnings;
  const warnings = Array.isArray(rawWarnings)
    ? rawWarnings.map((w) => String(w || "").trim()).filter(Boolean)
    : [];
  const precautions = warnings.join("；");
  const contraindications = String(med?.contraindications || "").trim();

  return {
    name: displayName,
    usageDosage: usageLines.join("\n"),
    indication,
    precautions,
    contraindications,
  };
}

Page({
  data: {
    viewLabel: "本人",
    list: [] as Row[],
    loading: true,
  },

  onLoad() {
    if (!isAuthed()) {
      wx.reLaunch({
        url: `/pages/login/index?redirect=${encodeURIComponent("/pages/ai-chat-pick-medicine/index")}`,
      });
      return;
    }
    this.loadList();
  },

  async loadList() {
    const v = getViewInfo();
    this.setData({ viewLabel: v.isSelf ? "本人" : v.label, loading: true });
    try {
      const list = await getMedicineList(v.viewOpenid);
      this.setData({ list, loading: false });
    } catch (e) {
      console.error("ai-chat-pick-medicine loadList", e);
      wx.showToast({ icon: "none", title: "加载药单失败" });
      this.setData({ list: [], loading: false });
    }
  },

  async onPick(e: WechatMiniprogram.TouchEvent) {
    const { id, medicineId, name, rule } = e.currentTarget.dataset as {
      id?: string;
      medicineId?: string;
      name?: string;
      rule?: string;
    };
    if (!id) return;
    const v = getViewInfo();
    wx.showLoading({ title: "加载药品信息…", mask: true });
    try {
      const detail = await buildConsultDetailFromPick({
        targetOpenid: v.viewOpenid,
        medicineId: medicineId || "",
        listName: name || "药品",
        listRule: rule || "",
        userMedicineId: id,
      });
      wx.hideLoading();
      const app = getApp<IAppOption>();
      if (app.globalData) {
        app.globalData.aiConsultMedicine = {
          source: "list",
          name: detail.name,
          viewLabel: v.isSelf ? "本人" : v.label,
          detail: {
            usageDosage: detail.usageDosage,
            indication: detail.indication,
            precautions: detail.precautions,
            contraindications: detail.contraindications,
          },
        };
      }
      wx.navigateBack({
        fail: () => switchMainTab(2),
      });
    } catch (err) {
      wx.hideLoading();
      console.error("ai-chat-pick-medicine onPick", err);
      const msg = err instanceof Error && err.message ? err.message : "加载失败，请重试";
      wx.showToast({ icon: "none", title: msg.length > 20 ? `${msg.slice(0, 20)}…` : msg });
    }
  },
});
