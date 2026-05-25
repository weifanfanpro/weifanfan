import Toast from "tdesign-miniprogram/toast/index";
import { getOpenId } from "../../utils/user";
import { getViewInfo } from "../../utils/view";
import { switchMainTab } from "../../utils/main-tab";
import type { MedicationRepeatMode } from "../../utils/sync-medication-calendar";
import {
  buildMedicationCalendarItems,
  canSyncMedicationToCalendar,
  syncMedicationCalendarToPhone,
} from "../../utils/sync-medication-calendar";
import { getMedicineById, getMedicineByName } from "../../api/medicine";
import { addMedicine, updateMedicine, getMedicineById as getUserMedicineById } from "../../api/user-medicine";
import { listReminders, createPlan } from "../../api/reminder";
import { createPending } from "../../api/family";
import { checkReminderPlan } from "../../api/ai-chat";
type RepeatMode = "everyday" | "weekday" | "custom";
type NotifyKey = "wechat" | "ring" | "vibrate";
type UsageMethod = "oral" | "topical" | "eye" | "nose" | "inhalation" | "injection" | "other";

type AiSuggestion = {
  reasonable: boolean;
  summary: string;
  suggestedDailyFrequency: string;
  suggestedTimes: string[];
  suggestedDoseText: string;
  suggestedMealTiming: string;
  notes: string;
};

function extractDoseTextFromAiText(text: string): string {
  const s = String(text || "");
  if (!s) return "";
  const normalized = s.replace(/\s+/g, "");
  const direct =
    normalized.match(/(每次[^，。；\n]{0,24}(?:片|粒|袋|包|瓶|支|贴|滴|克|g|mg|毫升|ml|mL))/i) ||
    normalized.match(/(一次[^，。；\n]{0,24}(?:片|粒|袋|包|瓶|支|贴|滴|克|g|mg|毫升|ml|mL))/i);
  if (direct && direct[1]) return direct[1];
  const unitOnly = normalized.match(/(?:单次用量|单次用量单位|每次用量)[^:：\n]{0,8}[:：]?(?:建议为)?(\d+(?:\.\d+)?(?:片|粒|袋|包|瓶|支|贴|滴|克|g|mg|毫升|ml|mL))/i);
  if (unitOnly && unitOnly[1]) return `每次${unitOnly[1]}`;
  return "";
}

function inferQuantifiableFromDoseText(text: string): boolean {
  const s = String(text || "").replace(/\s+/g, "");
  if (!s) return false;
  if (/(适量|按需|遵医嘱)/.test(s)) return false;
  return /(每次|一次).{0,20}(\d+(\.\d+)?)(片|粒|袋|包|瓶|支|贴|滴|克|g|mg|毫升|ml|mL|次)/i.test(s);
}

function buildDoseTextFromLegacy(perDoseAmount: unknown, perDoseUnit: unknown, dosageSummary: unknown): string {
  const amount = perDoseAmount != null ? String(perDoseAmount).trim() : "";
  const unit = perDoseUnit != null ? String(perDoseUnit).trim() : "";
  if (amount && unit) return `每次${amount}${unit}`;
  const summary = String(dosageSummary || "").trim();
  return extractDoseTextFromAiText(summary) || "";
}

function cleanSuggestedDoseText(raw: string): string {
  return String(raw || "")
    .replace(/[\r\n\t]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/["']?\s*,\s*["']?suggested[A-Za-z0-9_]*[\s\S]*$/i, "")
    .replace(/[，。；,;]\s*(suggested|notes|summary)\b[\s\S]*$/i, "")
    .trim();
}

function getPageOptions(): Record<string, string> {
  const pages = getCurrentPages();
  const current = pages[pages.length - 1] as unknown as { options?: Record<string, string> };
  return current?.options || {};
}

function weekdaysText(mode: RepeatMode, custom: string[]) {
  if (mode === "everyday") return "每天";
  if (mode === "weekday") return "周一到周五";
  if (custom.length === 0) return "自定义（未选择）";
  const map: Record<string, string> = { "0": "日", "1": "一", "2": "二", "3": "三", "4": "四", "5": "五", "6": "六" };
  return "每周 " + custom.map((k) => map[k] || k).join("、");
}

const WEEKDAY_OPTIONS = [
  { value: "1", label: "周一" },
  { value: "2", label: "周二" },
  { value: "3", label: "周三" },
  { value: "4", label: "周四" },
  { value: "5", label: "周五" },
  { value: "6", label: "周六" },
  { value: "0", label: "周日" },
];

function parseManualPresetFromOptions(opts: Record<string, string>) {
  const name = opts.name ? decodeURIComponent(opts.name) : "";
  const id = opts.id ? decodeURIComponent(opts.id) : "";
  const rule = opts.rule ? decodeURIComponent(opts.rule) : "";
  const fromManualAdd = String(opts.from || "") === "manual";
  const qRaw = String(opts.isQuantifiable || "").trim();
  const hasPreset = qRaw === "1" || qRaw === "0";
  const preset = hasPreset ? qRaw === "1" : null;
  const seedDoseText = opts.doseText ? decodeURIComponent(opts.doseText) : "";
  const seedTotalAmountText = opts.totalAmountText ? decodeURIComponent(opts.totalAmountText) : "";
  const hasSeed = Boolean(seedDoseText) || Boolean(seedTotalAmountText) || hasPreset;
  return { name, id, rule, fromManualAdd, hasPreset, preset, hasSeed, seedDoseText, seedTotalAmountText };
}

function buildWeekdaySelectedMap(values: string[]): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  (values || []).forEach((v) => {
    map[String(v)] = true;
  });
  return map;
}

Component({
  data: {
    viewLabel: "本人",
    drugName: "",
    /** medicines 集合的 _id，从药品详情/扫药传入；手动添加时为空 */
    medicineId: "",
    /** user_medicines 文档 _id，保存提醒时必填 */
    userMedicineId: "",
    /** 用药方式：自动推断，仅展示 */
    usageMethod: "other" as UsageMethod,
    usageMethodLabel: "其他",
    /** 用药方式文本：允许用户手动输入修改 */
    usageMethodText: "",
    /** 单位选项：根据用药方式自动切换 */
    unitOptions: ["次"] as string[],
    /** 每日次数（1~4 次/日），存字符串方便和 t-radio 对齐 */
    dailyFrequency: "1",
    /** 预设 4 个时间点，实际使用前 dailyFrequency 决定展示/提交多少个 */
    timeList: ["08:00", "12:00", "18:00", "22:00"] as string[],
    doseValue: "1",
    doseUnit: "次",
    /** 用量自然语言文本：由 qwen 生成，用户可编辑 */
    doseText: "",
    /** 可量化/不可量化：决定是否展示“总量” */
    isQuantifiable: false,
    /** 药品总量自然语言文本：仅可量化时有值 */
    totalAmountText: "" as string | null,
    /** 手动添加入口可指定可量化标记，避免被自动识别覆盖 */
    quantifiablePreset: null as boolean | null,
    fromManualAdd: false,
    repeatMode: "everyday" as RepeatMode,
    customWeekdays: ["1", "2", "3", "4", "5"] as string[],
    weekdayOptions: WEEKDAY_OPTIONS,
    weekdaySelected: {} as Record<string, boolean>,
    notify: {
      wechat: true,
      ring: false,
      vibrate: true,
    } as Record<NotifyKey, boolean>,
    phoneNotifyFake: false,
    /** 弹层：每日次数选择 */
    dailyFreqPopupVisible: false,
    /** 用药与进食关系：none / before / after / empty */
    mealTiming: "none",
    mealTimingLabel: "参考说明书或医生建议",
    /** 弹层：饭前/饭后/空腹 选择 */
    mealPopupVisible: false,
    /** AI 合理性检查 */
    aiCheckLoading: false,
    aiCheckResult: "",
    aiCheckReasoning: "",
    aiSuggestion: null as AiSuggestion | null,
    resolvingUserMedicineId: false,
    calendarSyncSupported: false,
    calendarSyncing: false,
    pageTimeText: "",
  },
  lifetimes: {
    attached() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const opts = getPageOptions();
      const view = getViewInfo();
      const { name, id, rule, fromManualAdd, hasPreset, preset, hasSeed, seedDoseText, seedTotalAmountText } =
        parseManualPresetFromOptions(opts);
      const defaultDoseText = hasPreset ? (preset ? "每次 1 次" : "每次适量") : "";
      this.setData(
        {
          calendarSyncSupported: canSyncMedicationToCalendar(),
          pageTimeText: `${hh}:${mm} 今日生效`,
          viewLabel: view.isSelf ? "本人" : view.label,
          drugName: name || "",
          medicineId: id,
          fromManualAdd,
          quantifiablePreset: preset,
          weekdaySelected: buildWeekdaySelectedMap((this.data as any).customWeekdays || []),
          // 如果有 rule 参数且 usageMethodText 未设置，用 rule 作为 usageMethodText 的默认值
          ...(rule && !(this.data as any).usageMethodText
            ? { usageMethodText: rule }
            : {}),
          ...(hasPreset
            ? {
                isQuantifiable: Boolean(preset),
                doseText: defaultDoseText,
                totalAmountText: preset ? String((this.data as any).totalAmountText || "") : null,
              }
            : {}),
          ...(hasSeed
            ? {
                isQuantifiable: preset == null ? Boolean((this.data as any).isQuantifiable) : Boolean(preset),
                doseText: String(seedDoseText || defaultDoseText || (this.data as any).doseText || ""),
                totalAmountText:
                  (preset == null ? Boolean((this.data as any).isQuantifiable) : Boolean(preset))
                    ? String(seedTotalAmountText || (this.data as any).totalAmountText || "")
                    : null,
              }
            : {}),
        },
        () => {
          this.refreshSummary();
          // 先确保路由参数（可量化预设）已落到 data，再做后续读取/建档
          (this as any).loadMedicineInfo?.();
          const v = getViewInfo();
          if (v.isSelf) {
            (this as any).resolveUserMedicineId?.();
          }
        },
      );
    },
  },
  pageLifetimes: {
    show() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const opts = getPageOptions();
      const view = getViewInfo();
      const { name, id, rule, fromManualAdd, hasPreset, preset, hasSeed, seedDoseText, seedTotalAmountText } =
        parseManualPresetFromOptions(opts);
      const data = this.data as any;
      const updates: Record<string, any> = {};
      updates.viewLabel = view.isSelf ? "本人" : view.label;
      // 每次 show 都尽量用路由参数刷新（避免页面复用导致不回填）
      if (name) updates.drugName = name;
      if (id) updates.medicineId = id;
      if (fromManualAdd) updates.fromManualAdd = true;
      if (rule && !data.usageMethodText) updates.usageMethodText = rule;
      if (hasPreset) {
        updates.quantifiablePreset = preset;
        updates.isQuantifiable = Boolean(preset);
        updates.doseText = preset ? (String((this.data as any).doseText || "").trim() || "每次 1 次") : "每次适量";
        updates.totalAmountText = preset ? String((this.data as any).totalAmountText || "") : null;
      }
      if (hasSeed) {
        const isQ = preset == null ? Boolean((this.data as any).isQuantifiable) : Boolean(preset);
        updates.doseText = String(seedDoseText || (this.data as any).doseText || "");
        updates.totalAmountText = isQ ? String(seedTotalAmountText || (this.data as any).totalAmountText || "") : null;
      }
      // 兜底刷新星期选中态（避免 UI 不更新）
      updates.weekdaySelected = buildWeekdaySelectedMap((updates.customWeekdays || (this.data as any).customWeekdays) as string[]);
      updates.calendarSyncSupported = canSyncMedicationToCalendar();
      updates.pageTimeText = `${hh}:${mm} 今日生效`;
      this.setData(updates, () => {
        (this as any).loadMedicineInfo?.();
        // 家属视角：不回表 owner 的真实提醒（需要对方激活后才会生效）
        if (!view.isSelf) return;
        // 关键：二次进入时重新解析 userMedicineId 并回表回填
        (this as any).resolveUserMedicineId?.();
        // 如果 userMedicineId 已存在，也直接回填一次（兜底）
        if ((this.data as any).userMedicineId) {
          (this as any).loadExistingPlan?.((this.data as any).userMedicineId);
        }
      });
    },
  },
  methods: {
    noop() {},
    onPhoneNotifyFakeChange(e: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
      const next = Boolean(e.detail?.value);
      if (next) {
        Toast({ context: this, message: "电话提醒正在接入中，敬请期待" });
      }
      // 假按钮：永远保持关闭
      this.setData({ phoneNotifyFake: false });
    },
    getUnitOptions(method: UsageMethod) {
      if (method === "oral") return ["片", "粒", "毫升"];
      if (method === "topical") return ["次", "克", "贴"];
      if (method === "eye") return ["滴", "次"];
      if (method === "nose") return ["滴", "次"];
      if (method === "inhalation") return ["吸", "次"];
      if (method === "injection") return ["毫升", "支", "次"];
      return ["次"];
    },
    getUsageMethodLabel(method: UsageMethod) {
      if (method === "oral") return "口服";
      if (method === "topical") return "外用";
      if (method === "eye") return "滴眼";
      if (method === "nose") return "滴鼻";
      if (method === "inhalation") return "吸入";
      if (method === "injection") return "注射";
      return "其他";
    },
    inferUsageMethodFromText(text: string): UsageMethod {
      const s = String(text || "").toLowerCase();
      if (s.includes("口服")) return "oral";
      if (s.includes("外用") || s.includes("涂抹") || s.includes("涂于")) return "topical";
      if (s.includes("滴眼") || s.includes("滴入眼")) return "eye";
      if (s.includes("滴鼻") || s.includes("滴入鼻")) return "nose";
      if (s.includes("吸入")) return "inhalation";
      if (s.includes("注射") || s.includes("肌注") || s.includes("静脉")) return "injection";
      return "other";
    },
    ensureDefaultDoseText() {
      const isQ = Boolean((this.data as any).isQuantifiable);
      const cur = String((this.data as any).doseText || "").trim();
      if (cur) return;
      this.setData({
        doseText: isQ ? "每次 1 次" : "每次适量",
      });
    },
    async applyManualPresetToUserMedicine(userMedicineId: string) {
      const preset = (this.data as any).quantifiablePreset as boolean | null;
      if (!(this.data as any).fromManualAdd || preset == null || !userMedicineId) return;
      const nextDoseText = preset ? String((this.data as any).doseText || "").trim() || "每次 1 次" : "每次适量";
      const nextTotal = preset ? String((this.data as any).totalAmountText || "") : null;
      this.setData({
        isQuantifiable: preset,
        doseText: nextDoseText,
        totalAmountText: preset ? nextTotal : null,
      });
      try {
        await updateMedicine(Number(userMedicineId), {
          isQuantifiable: preset,
          doseText: nextDoseText,
          totalAmountText: preset ? (nextTotal || null) : null,
        });
      } catch {}
    },
    async loadMedicineInfo() {
      try {
        const { medicineId, drugName } = this.data as any;

        let doc: any = null;
        if (medicineId) {
          doc = await getMedicineById(Number(medicineId));
        } else if (drugName) {
          if ((this.data as any).fromManualAdd) return;
          doc = await getMedicineByName(drugName);
          if (doc && doc.id) this.setData({ medicineId: String(doc.id) });
        }
        if (!doc) return;
        const name = doc.name || this.data.drugName;
        const combined = `${doc.dosageSummary || ""}\n${doc.indication || ""}\n${doc.rawText || ""}`;
        // 优先使用云端存储的 usageMethod（由 AI 推断）；没有则本地兜底推断
        const method =
          (doc.usageMethod as UsageMethod) ||
          ((this as any).inferUsageMethodFromText(combined) as UsageMethod) ||
          "other";

        // AI 推荐的每次用量（数值 + 单位），作为默认值回填；优先 medicines 中的结构化字段
        const aiDoseValue =
          doc.perDoseAmount != null && String(doc.perDoseAmount).trim() !== ""
            ? String(doc.perDoseAmount)
            : "";
        const aiDoseUnit = doc.perDoseUnit != null ? String(doc.perDoseUnit) : "";
        const aiDailyFrequency =
          doc.dailyFrequency != null && Number(doc.dailyFrequency) > 0
            ? String(Math.min(4, Math.max(1, Number(doc.dailyFrequency))))
            : "";
        const hasExplicitQuantifiable = typeof doc.isQuantifiable === "boolean";
        const inferredIsQ =
          inferQuantifiableFromDoseText(String(doc.doseText || "")) ||
          inferQuantifiableFromDoseText(String(doc.dosageSummary || ""));
        // 根源兜底：云端误标 false 但文案明显可量化时，必须纠正
        const aiIsQuantifiable = hasExplicitQuantifiable
          ? (Boolean(doc.isQuantifiable) === false && inferredIsQ ? true : Boolean(doc.isQuantifiable))
          : inferredIsQ;
        const aiDoseTextRaw = doc.doseText != null ? String(doc.doseText) : "";
        const legacyDoseText = aiIsQuantifiable
          ? buildDoseTextFromLegacy(doc.perDoseAmount, doc.perDoseUnit, doc.dosageSummary)
          : "";
        const aiDoseText = aiDoseTextRaw || legacyDoseText;
        const aiTotalAmountText =
          doc.totalAmountText === null || typeof doc.totalAmountText === "undefined"
            ? null
            : String(doc.totalAmountText);

        this.setData(
          {
            drugName: name,
          },
          () => {
            (this as any).setUsageMethod(method);
            if (!(this.data as any).usageMethodText) {
              this.setData({ usageMethodText: (this as any).getUsageMethodLabel(method) || "其他" });
            }
            // 仅在尚未回填过提醒方案时，使用 AI 的默认值（避免覆盖用户已保存的设置）
            const hasPlan = Boolean((this.data as any).userMedicineId);
            const updates: Record<string, any> = {};
            if (!hasPlan) {
              if (aiDoseValue) updates.doseValue = aiDoseValue;
              if (aiDoseUnit) updates.doseUnit = aiDoseUnit;
              if (aiDailyFrequency) updates.dailyFrequency = aiDailyFrequency;
              updates.isQuantifiable = aiIsQuantifiable;
              if (aiDoseText) updates.doseText = aiDoseText;
              updates.totalAmountText = aiIsQuantifiable ? (aiTotalAmountText || "") : null;
              const aiMeal = doc.mealTiming;
              if (aiMeal === "before" || aiMeal === "after" || aiMeal === "empty") {
                updates.mealTiming = aiMeal;
                updates.mealTimingLabel =
                  aiMeal === "before" ? "饭前" : aiMeal === "after" ? "饭后" : "空腹";
              }
            }
            // unitOptions 里没有 AI 单位时补进去，保证展示一致
            if (aiDoseUnit) {
              const opts = ((this.data as any).unitOptions || []) as string[];
              if (Array.isArray(opts) && !opts.includes(aiDoseUnit)) {
                updates.unitOptions = [aiDoseUnit, ...opts];
              }
            }
            if (Object.keys(updates).length) this.setData(updates);
            (this as any).ensureDefaultDoseText?.();
          },
        );
      } catch (err) {
        console.error("loadMedicineInfo error", err);
      }
    },
    /** 解析出 userMedicineId：先查 user_medicines，没有则调 API 创建 */
    async resolveUserMedicineId() {
      if ((this.data as any).resolvingUserMedicineId) return;
      if ((this.data as any).userMedicineId) return;
      this.setData({ resolvingUserMedicineId: true });
      try {
        const { medicineId, drugName } = this.data as any;
        const v = getViewInfo();
        const ownerOpenid = v.viewOpenid || getOpenId();

        const applyUid = (uid: string) => {
          this.setData({ userMedicineId: uid }, () => {
            (this as any).applyManualPresetToUserMedicine?.(uid);
            (this as any).loadExistingPlan?.(uid);
          });
        };

        // Try to find existing user medicine by medicineId or name
        try {
          const list = await import("../../api/user-medicine").then((m) =>
            m.listMedicines(ownerOpenid)
          );
          const match = medicineId
            ? list.find((x: any) => String(x.medicineId) === String(medicineId))
            : list.find((x: any) => String(x.name || "") === String(drugName || ""));
          if (match && match.id) {
            applyUid(String(match.id));
            return;
          }
        } catch {}

        // Not found — create via API
        try {
          const ret = await addMedicine({
            medicineId: medicineId || "",
            name: drugName || "",
            rule: "待设置",
            targetOpenid: ownerOpenid,
            isQuantifiable: Boolean((this.data as any).isQuantifiable),
            doseText: String((this.data as any).doseText || ""),
            totalAmountText: (this.data as any).isQuantifiable
              ? String((this.data as any).totalAmountText || "")
              : null,
          });
          if (ret?.userMedicineId) {
            applyUid(String(ret.userMedicineId));
            return;
          }
        } catch {}

        // Retry lookup after creation
        try {
          const list2 = await import("../../api/user-medicine").then((m) =>
            m.listMedicines(ownerOpenid)
          );
          const match2 = medicineId
            ? list2.find((x: any) => String(x.medicineId) === String(medicineId))
            : list2.find((x: any) => String(x.name || "") === String(drugName || ""));
          if (match2 && match2.id) {
            applyUid(String(match2.id));
          }
        } catch {}
      } finally {
        this.setData({ resolvingUserMedicineId: false });
      }
    },
    refreshSummary() {
      // 当前页面主要信息在各个控件中直观展示，暂不需要额外汇总文案
    },

    /** 已有提醒方案的回表查询，用于二次进入时回填表单 */
    async loadExistingPlan(uid?: string) {
      const userMedicineId = uid || (this.data as any).userMedicineId;
      if (!userMedicineId) return;
      try {
        const rawList = await listReminders(userMedicineId);
        const list = (rawList || []) as any[];
        if (!list.length) return;

        list.sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));

        const times = list.map((r) => r.time || "08:00");
        const uniqTimes = Array.from(new Set(times)).slice(0, 4);
        const first = list[0];

        const dailyFrequency = String(uniqTimes.length || 1);
        const doseValue = String(first.doseValue || "1");
        const doseUnit = String(first.doseUnit || "片");
        const repeatMode = (first.repeatMode as RepeatMode) || "everyday";
        const customWeekdays = (first.customWeekdays as string[]) || [];
        const notify = first.notify || { wechat: true, ring: false, vibrate: true };
        const mealTiming = first.mealTiming || "none";

        let mealTimingLabel = "参考说明书或医生建议";
        if (mealTiming === "before") mealTimingLabel = "饭前";
        else if (mealTiming === "after") mealTimingLabel = "饭后";
        else if (mealTiming === "empty") mealTimingLabel = "空腹";

        const base = (this.data as any).timeList.slice() as string[];
        uniqTimes.forEach((t, idx) => {
          if (idx < base.length) base[idx] = t;
        });

        this.setData({
          dailyFrequency,
          timeList: base,
          doseValue,
          doseUnit,
          repeatMode,
          customWeekdays,
          notify,
          mealTiming,
          mealTimingLabel,
        });
        // 额外回填 user_medicines 的“用量文本/总量/用药方式文本”
        (this as any).loadUserMedicineMeta?.(userMedicineId);
      } catch (err) {
        console.error("loadExistingPlan error", err);
      }
    },

    async loadUserMedicineMeta(userMedicineId: string) {
      try {
        const doc = await getUserMedicineById(Number(userMedicineId)) as any;
        if (!doc) return;
        const preset = (this.data as any).quantifiablePreset as boolean | null;
        const fallbackIsQ = preset == null ? Boolean((this.data as any).isQuantifiable) : preset;
        const fallbackDoseText = String((this.data as any).doseText || "");
        const docDoseText = doc.doseText != null ? String(doc.doseText) : "";
        const inferredIsQ = inferQuantifiableFromDoseText(docDoseText || fallbackDoseText);
        const isQ =
          preset == null
            ? (typeof doc.isQuantifiable === "boolean"
                ? (Boolean(doc.isQuantifiable) === false && inferredIsQ ? true : Boolean(doc.isQuantifiable))
                : (fallbackIsQ || inferredIsQ))
            : preset;
        const nextDoseText = isQ ? (docDoseText || fallbackDoseText || "每次 1 次") : "每次适量";
        this.setData(
          {
            isQuantifiable: isQ,
            doseText: nextDoseText,
            totalAmountText: isQ ? (doc.totalAmountText == null ? "" : String(doc.totalAmountText)) : null,
            usageMethodText: doc.usageMethodText != null ? String(doc.usageMethodText) : (this.data as any).usageMethodText,
          },
          () => (this as any).ensureDefaultDoseText?.(),
        );
      } catch {}
    },

    openDailyFreqPopup() {
      this.setData({ dailyFreqPopupVisible: true });
    },
    closeDailyFreqPopup() {
      this.setData({ dailyFreqPopupVisible: false });
    },


    openMealPopup() {
      this.setData({ mealPopupVisible: true });
    },
    closeMealPopup() {
      this.setData({ mealPopupVisible: false });
    },

    setUsageMethod(method: UsageMethod) {
      const options = (this as any).getUnitOptions(method) as string[];
      const currentUnit = String((this.data as any).doseUnit || "");
      const nextUnit = options.includes(currentUnit) ? currentUnit : options[0];
      this.setData(
        {
          usageMethod: method,
          unitOptions: currentUnit && !options.includes(currentUnit) ? [currentUnit, ...options] : options,
          doseUnit: nextUnit,
          usageMethodLabel: (this as any).getUsageMethodLabel(method),
        },
        () => this.refreshSummary(),
      );
    },

    onDailyFrequencyChange(e: WechatMiniprogram.CustomEvent<{ value: string | number }>) {
      // t-radio-group 会回传字符串，这里统一存为字符串，保证和 wxml 中的 value="1" 等完全匹配
      const v = String(e.detail.value || "1");
      const n = parseInt(v, 10);
      const clamped = !Number.isFinite(n) || n < 1 ? "1" : n > 4 ? "4" : String(n);
      this.setData({ dailyFrequency: clamped }, () => this.refreshSummary());
    },

    onTimeChange(e: WechatMiniprogram.PickerChange) {
      const value = String(e.detail.value || "08:00");
      const { idx } = e.currentTarget.dataset as { idx?: number };
      const index = typeof idx === "number" ? idx : 0;
      const list = (this.data as any).timeList.slice() as string[];
      if (index >= 0 && index < list.length) {
        list[index] = value;
      }
      this.setData({ timeList: list }, () => this.refreshSummary());
    },

    onDoseTextChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ doseText: String(e.detail.value || "") }, () => this.refreshSummary());
    },

    onTotalAmountTextChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ totalAmountText: String(e.detail.value || "") }, () => this.refreshSummary());
    },

    onUsageMethodTextChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ usageMethodText: String(e.detail.value || "") }, () => this.refreshSummary());
    },

    onRepeatModeChange(e: WechatMiniprogram.CustomEvent<{ value: RepeatMode }>) {
      const mode = e.detail.value;
      this.setData({ repeatMode: mode }, () => this.refreshSummary());
    },

    onToggleCustomWeekday(e: WechatMiniprogram.BaseEvent) {
      const { value } = e.currentTarget.dataset as { value?: string };
      const next = String(value || "");
      if (!next) return;
      const current = Array.isArray((this.data as any).customWeekdays) ? [ ...(this.data as any).customWeekdays ] : [];
      const exists = current.includes(next);
      const result = exists ? current.filter((item) => item !== next) : current.concat(next);
      const sorted = result.sort((a, b) => {
        const order = ["1", "2", "3", "4", "5", "6", "0"];
        return order.indexOf(a) - order.indexOf(b);
      });
      this.setData({ customWeekdays: sorted, weekdaySelected: buildWeekdaySelectedMap(sorted) }, () => this.refreshSummary());
    },

    onNotifyChange(e: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
      const { key } = e.currentTarget.dataset as { key?: NotifyKey };
      if (!key) return;
      const path = `notify.${key}` as const;
      this.setData({ [path]: Boolean(e.detail.value) }, () => this.refreshSummary());
    },

    async onSyncToPhoneCalendar() {
      if (!canSyncMedicationToCalendar()) {
        Toast({
          context: this,
          message: "当前微信版本或环境不支持写入系统日历，请升级微信或在真机使用",
        });
        return;
      }
      if ((this.data as any).calendarSyncing) return;

      const repeatMode = (this.data as any).repeatMode as MedicationRepeatMode;
      const customWeekdays = ((this.data as any).customWeekdays || []) as string[];
      if (repeatMode === "custom" && (!customWeekdays.length || !customWeekdays.some(Boolean))) {
        Toast({ context: this, message: "请先选择自定义星期" });
        return;
      }

      const freqNum = parseInt(String((this.data as any).dailyFrequency || "1"), 10) || 1;
      const timeList = ((this.data as any).timeList || []) as string[];
      const validTimes = timeList
        .slice(0, Math.max(1, freqNum))
        .map((t) => String(t || "").trim())
        .filter((t) => /^\d{2}:\d{2}$/.test(t));
      const drugName = String((this.data as any).drugName || "用药").trim();
      const doseText = String((this.data as any).doseText || "").trim();
      const mealTimingLabel = String((this.data as any).mealTimingLabel || "").trim();

      const items = buildMedicationCalendarItems({
        drugName,
        times: validTimes.length ? validTimes : ["08:00"],
        repeatMode,
        customWeekdays,
        doseText,
        mealTimingLabel,
      });
      if (items.length === 0) {
        Toast({ context: this, message: "没有可同步的用药时间" });
        return;
      }

      this.setData({ calendarSyncing: true });
      wx.showLoading({ title: "写入日历…", mask: true });
      try {
        const { ok, fail, lastErr } = await syncMedicationCalendarToPhone(items);
        if (ok > 0) {
          try {
            wx.setStorageSync("reminderLastCalendarSyncAt", Date.now());
          } catch {
            /* ignore */
          }
        }
        if (fail === 0) {
          Toast({ context: this, message: `已添加 ${ok} 条日历提醒` });
        } else if (ok > 0) {
          Toast({
            context: this,
            message: `部分完成：成功 ${ok}，失败 ${fail}${lastErr ? `（${String(lastErr).slice(0, 36)}）` : ""}`,
          });
        } else {
          const cancel = /cancel|取消/i.test(String(lastErr || ""));
          Toast({
            context: this,
            message: cancel ? "已取消或未授权" : `同步失败：${String(lastErr || "").slice(0, 48)}`,
          });
        }
      } catch {
        Toast({ context: this, message: "同步失败，请稍后重试" });
      } finally {
        try {
          wx.hideLoading();
        } catch {
          /* ignore */
        }
        this.setData({ calendarSyncing: false });
      }
    },

    onMealTimingChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const v = String(e.detail.value || "none");
      let label = "参考说明书或医生建议";
      if (v === "before") label = "饭前";
      else if (v === "after") label = "饭后";
      else if (v === "empty") label = "空腹";
      this.setData({ mealTiming: v, mealTimingLabel: label });
    },

    async onAiCheck() {
      if (this.data.aiCheckLoading) return;
      const {
        drugName,
        dailyFrequency,
        timeList,
        mealTimingLabel,
        repeatMode,
        customWeekdays,
        usageMethodLabel,
        usageMethodText,
        doseText,
      } = this.data as any;
      const freqNum = parseInt(String(dailyFrequency || "1"), 10) || 1;
      const times = ((timeList as string[]) || []).slice(0, Math.max(1, freqNum));

      this.setData({
        aiCheckLoading: true,
        aiCheckResult: "",
        aiCheckReasoning: "",
        aiSuggestion: null,
      });

      try {
        const result = await checkReminderPlan({
          enableThinking: true,
          enableSearch: true,
          plan: {
            drugName: drugName || "（未命名药品）",
            usageMethodLabel: String(usageMethodText || usageMethodLabel || ""),
            dailyFrequency: String(freqNum),
            times,
            doseText: String(doseText || ""),
            mealTimingLabel: mealTimingLabel || "",
            repeatWeekdaysText: weekdaysText(repeatMode as RepeatMode, (customWeekdays as string[]) || []),
          },
        });

        const msg = (result as any).message as { content?: string; reasoning?: string } | undefined;
        const suggestion = (result as any).suggestion as AiSuggestion | null | undefined;

        this.setData({
          aiCheckResult: (msg && msg.content) || "",
          aiCheckReasoning: (msg && msg.reasoning) || "",
          aiSuggestion: suggestion && typeof suggestion === "object" ? suggestion : null,
        });

        if (!(msg && (msg.content || msg.reasoning))) {
          Toast({ context: this, message: "未返回有效内容，请重试" });
        }
      } catch (e) {
        const raw = e instanceof Error ? e.message : String(e);
        Toast({ context: this, message: raw || "检查失败，请稍后再试" });
      } finally {
        this.setData({ aiCheckLoading: false });
      }
    },

    onAdoptAiSuggestion() {
      const s = this.data.aiSuggestion as AiSuggestion | null;
      if (!s) {
        Toast({ context: this, message: "暂无可采纳的结构化建议" });
        return;
      }

      const n = parseInt(String(s.suggestedDailyFrequency || "1"), 10) || 1;
      const clampedFreq = n < 1 ? 1 : n > 4 ? 4 : n;
      const freqStr = String(clampedFreq);

      const base = ((this.data as any).timeList as string[]).slice() as string[];
      const incoming = Array.isArray(s.suggestedTimes) ? s.suggestedTimes : [];
      const timeRe = /^\d{2}:\d{2}$/;
      for (let i = 0; i < clampedFreq; i++) {
        const t = incoming[i];
        if (typeof t === "string" && timeRe.test(t.trim())) base[i] = t.trim();
      }

      const suggestedDoseText = cleanSuggestedDoseText(String(s.suggestedDoseText || ""));
      const inferredDoseText = extractDoseTextFromAiText(String((this.data as any).aiCheckResult || ""));
      let nextDoseText = suggestedDoseText || inferredDoseText;
      const isQ = Boolean((this.data as any).isQuantifiable);
      if (!nextDoseText && !isQ) nextDoseText = "每次适量";
      if (isQ && /(适量|按需|遵医嘱)/.test(nextDoseText) && inferredDoseText) {
        nextDoseText = inferredDoseText;
      }

      let mealTiming = String(s.suggestedMealTiming || "none");
      if (!["none", "before", "after", "empty"].includes(mealTiming)) mealTiming = "none";
      let mealLabel = "参考说明书或医生建议";
      if (mealTiming === "before") mealLabel = "饭前";
      else if (mealTiming === "after") mealLabel = "饭后";
      else if (mealTiming === "empty") mealLabel = "空腹";

      this.setData(
        {
          dailyFrequency: freqStr,
          timeList: base,
          doseText: nextDoseText || String((this.data as any).doseText || ""),
          mealTiming,
          mealTimingLabel: mealLabel,
        },
        () => {
          Toast({ context: this, message: "已填入 AI 建议，请确认后点「保存提醒」" });
        },
      );
    },

    async onSave() {
      const v = getViewInfo();
      const {
        userMedicineId,
        drugName,
        dailyFrequency,
        timeList,
        doseValue,
        doseUnit,
        repeatMode,
        customWeekdays,
        notify,
        mealTiming,
      } = this.data as any;
      const doseText = String((this.data as any).doseText || "").trim();
      const isQuantifiable = Boolean((this.data as any).isQuantifiable) || inferQuantifiableFromDoseText(doseText);
      const usageMethodText = String((this.data as any).usageMethodText || "").trim();
      const totalAmountTextRaw = (this.data as any).totalAmountText;
      const totalAmountText =
        isQuantifiable ? String(totalAmountTextRaw == null ? "" : totalAmountTextRaw).trim() : null;

      // 家属视角：提交为“待激活”，不直接写入对方首页提醒/药单
      if (!v.isSelf) {
        const freqNum = parseInt(String(dailyFrequency || "1"), 10) || 1;
        const allTimes: string[] = Array.isArray(timeList) ? timeList.slice(0, Math.max(1, freqNum)) : [];
        const validTimes = allTimes
          .map((t) => String(t || "").trim())
          .filter((t) => /^\d{2}:\d{2}$/.test(t));
        const finalTimes = validTimes.length > 0 ? validTimes : ["08:00"];
        try {
          await createPending({
            ownerOpenid: v.viewOpenid,
            medicineId: (this.data as any).medicineId || "",
            name: drugName,
            rule: "待激活",
            isQuantifiable,
            doseText,
            totalAmountText: isQuantifiable ? (totalAmountText || null) : null,
            draftPlan: {
              times: finalTimes,
              perDoseAmount: doseValue || "1",
              perDoseUnit: doseUnit || "片",
              repeatMode: repeatMode || "everyday",
              customWeekdays: Array.isArray(customWeekdays) ? customWeekdays : [],
              notify: notify || { wechat: true, ring: false, vibrate: true },
              mealTiming: mealTiming || "none",
            },
          });
          Toast({ context: this, message: `已提交给「${v.label}」，等待对方在【家属】页激活并订阅` });
          setTimeout(() => wx.navigateTo({ url: "/pages/family/index" }), 500);
        } catch (e) {
          console.error("createPending from reminder-setting fail", e);
          const msg = e instanceof Error && e.message ? e.message : "提交失败，请稍后重试";
          Toast({ context: this, message: msg.length > 28 ? msg.slice(0, 28) + "…" : msg });
        }
        return;
      }
      if (!userMedicineId) {
        Toast({ context: this, message: "正在获取药单信息，请稍候再保存" });
        await (this as any).resolveUserMedicineId();
        const uid = (this.data as any).userMedicineId;
        if (!uid) {
          Toast({ context: this, message: "无法关联到药单，请返回重试" });
          return;
        }
      }
      const uid = userMedicineId || (this.data as any).userMedicineId;

      // 组装本次方案的所有时间点（根据 dailyFrequency 截取，并做格式校验）
      const freqNum = parseInt(String(dailyFrequency || "1"), 10) || 1;
      const allTimes: string[] = Array.isArray(timeList)
        ? timeList.slice(0, Math.max(1, freqNum))
        : [];
      const validTimes = allTimes
        .map((t) => String(t || "").trim())
        .filter((t) => /^\d{2}:\d{2}$/.test(t));
      const finalTimes = validTimes.length > 0 ? validTimes : ["08:00"];

      try {
        // 保存提醒前，引导开启“微信服务通知”订阅授权（用户拒绝不影响保存）
        try {
          if (notify && notify.wechat) {
            // TODO：把下面的模板ID换成你在公众平台创建的模板ID（或改成从云端下发）
            const tmplId = "awEHVSQ2Pm-2waMrf1XmYMaIPTYA4cTJo5etli7yYGU";
            if (tmplId) {
              await new Promise<void>((resolve) => {
                wx.requestSubscribeMessage({
                  tmplIds: [tmplId],
                  complete: () => resolve(),
                });
              });
            }
          }
        } catch {}

        await createPlan({
          userMedicineId: uid,
          medicineId: (this.data as any).medicineId || "",
          medicineName: drugName,
          targetOpenid: getViewInfo().viewOpenid,
          dailyFrequency: finalTimes.length,
          perDoseAmount: doseValue || "1",
          perDoseUnit: doseUnit || "片",
          doseText,
          times: finalTimes,
          repeatMode: repeatMode || "everyday",
          customWeekdays: Array.isArray(customWeekdays) ? customWeekdays : [],
          notify: notify || { wechat: true, ring: false, vibrate: true },
          mealTiming: mealTiming || "none",
        });
        Toast({ context: this, message: "已保存提醒" });
        // 成功后直接回到首页，更符合用户习惯
        setTimeout(() => {
          switchMainTab(0);
        }, 600);

        // 同步回写 user_medicines：用量文案/总量/用药方式文本
        try {
          await updateMedicine(Number(uid), {
            isQuantifiable,
            doseText,
            totalAmountText: isQuantifiable ? (totalAmountText || null) : null,
            usageMethodText,
          });
        } catch {}
      } catch (err) {
        console.error("onSave reminder error", err);
        Toast({ context: this, message: "保存失败，请稍后重试" });
      }
    },
  },
});

