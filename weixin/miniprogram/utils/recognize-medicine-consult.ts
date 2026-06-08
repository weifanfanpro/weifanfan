/**
 * 上传并调用 recognizeMedicine：阿里 OCR → DeepSeek 整理为结构化字段。
 */
import { reminderPlanConsultLines } from "./ai-consult-reminders";
import type { ViewInfo } from "./view";
import { recognizeMedicine } from "../api/medicine";
import { getDrugDetailRule } from "../api/family";
import { upload } from "./request";

export type RecognizeMedicineResult = {
  id: number;
  name: string;
  indication: string;
  dosage: string;
  dosageSummary?: string;
  usageMethod?: string;
  usageMethodText?: string;
  isQuantifiable?: boolean;
  doseText?: string;
  totalAmountText?: string | null;
  warnings?: string[];
  contraindications?: string;
};

export type AiConsultFromRecognitionSource = "scan" | "album";

/** 上传临时文件并调用 recognizeMedicine */
export async function uploadAndRecognizeMedicine(tempFilePath: string): Promise<RecognizeMedicineResult> {
  const result = await upload<RecognizeMedicineResult>("/api/medicine/recognize", tempFilePath);
  return result;
}

/**
 * 识别结果 + 当前视角下的提醒方案 → 咨询页 globalData / 展示用结构（不含 list 来源）
 */
export async function buildAiConsultMedicineAfterRecognition(
  data: RecognizeMedicineResult,
  v: ViewInfo,
  source: AiConsultFromRecognitionSource,
): Promise<{
  source: AiConsultFromRecognitionSource;
  name: string;
  viewLabel?: string;
  detail?: {
    usageDosage: string;
    indication: string;
    precautions: string;
    contraindications: string;
  };
}> {
  const usageLines: string[] = [];
  const dosage = String(data.dosage || data.dosageSummary || "").trim();
  const dosageLinePrefix = source === "album" ? "图片识别的用法用量：" : "扫描识别的用法用量：";
  if (dosage) usageLines.push(`${dosageLinePrefix}${dosage}`);

  const mid = data.id;
  if (mid) {
    try {
      const reminders = await getDrugDetailRule({
        targetOpenid: v.viewOpenid,
        medicineId: String(mid),
        medicineName: String(data.name || "").trim(),
        userMedicineId: "",
      });
      usageLines.push(...reminderPlanConsultLines(reminders || []));
    } catch (e) {
      console.warn("buildAiConsultMedicineAfterRecognition: getDrugDetailRule failed", e);
    }
  }

  return {
    source,
    name: data.name,
    viewLabel: v.isSelf ? "本人" : v.label,
    detail: {
      usageDosage: usageLines.join("\n").trim(),
      indication: String(data.indication || "").trim(),
      precautions: Array.isArray(data.warnings)
        ? data.warnings.map((w) => String(w || "").trim()).filter(Boolean).join("；")
        : "",
      contraindications: String(data.contraindications || "").trim(),
    },
  };
}
