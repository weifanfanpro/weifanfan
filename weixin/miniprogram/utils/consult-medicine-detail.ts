/** 咨询「关联药品」详情页展示模型 */

export type ConsultDetailVm = {
  name: string;
  tagTimes: string;
  tagDose: string;
  tagWhen: string;
  usageFull: string;
  indication: string;
  precautions: string;
  precautionsLines: string[];
  contraindications: string;
  viewLabel: string;
};

export function inferUsageTags(usage: string): Pick<ConsultDetailVm, "tagTimes" | "tagDose" | "tagWhen"> {
  const u = String(usage || "");
  let tagTimes = "见用法用量";
  const d1 = u.match(/当前计划每日提醒次数[：:]?\s*(\d+)/);
  const d2 = u.match(/每日\s*(\d+)\s*次/);
  const d3 = u.match(/每天\s*(\d+)\s*次/);
  if (d1) tagTimes = `每日 ${d1[1]} 次`;
  else if (d2) tagTimes = `每日 ${d2[1]} 次`;
  else if (d3) tagTimes = `每日 ${d3[1]} 次`;

  let tagDose = "见用法用量";
  const e1 = u.match(/每次用量（提醒中）[：:]?\s*([^\n]+)/);
  const e2 = u.match(/每次\s*([^，。\n]{1,30})/);
  if (e1) tagDose = e1[1].trim().slice(0, 36);
  else if (e2) tagDose = `每次 ${e2[1].trim()}`;

  let tagWhen = "见说明书";
  const mt = u.match(/与进食关系[：:]\s*([^\n]+)/);
  if (mt) {
    const x = mt[1];
    if (x.includes("饭后")) tagWhen = "饭后";
    else if (x.includes("饭前")) tagWhen = "饭前";
    else if (x.includes("空腹")) tagWhen = "空腹";
  } else {
    if (u.includes("饭前")) tagWhen = "饭前";
    else if (u.includes("饭后")) tagWhen = "饭后";
    else if (u.includes("空腹")) tagWhen = "空腹";
  }

  return { tagTimes, tagDose, tagWhen };
}

type ConsultStruct = {
  name?: string;
  viewLabel?: string;
  detail?: { usageDosage?: string; indication?: string; precautions?: string; contraindications?: string };
};

export function buildVmFromConsultMedicine(cm: ConsultStruct): ConsultDetailVm {
  const usageFull = String(cm.detail?.usageDosage || "").trim();
  const tags = inferUsageTags(usageFull);
  const prec = String(cm.detail?.precautions || "").trim();
  return {
    name: String(cm.name || "药品").trim() || "药品",
    ...tags,
    usageFull: usageFull || "暂无用法用量摘要，请以说明书或医嘱为准。",
    indication: String(cm.detail?.indication || "").trim() || "暂无，请参考说明书或医嘱。",
    precautions: prec,
    precautionsLines: prec ? prec.split(/[；;]\s*/).filter(Boolean) : [],
    contraindications: String(cm.detail?.contraindications || "").trim() || "暂无，请咨询医生或药师。",
    viewLabel: String(cm.viewLabel || "").trim(),
  };
}

/** 从 buildConsultBlock 生成的正文解析（历史消息仅有 consultAttach 文本时） */
export function parseConsultBlockToVm(block: string): ConsultDetailVm {
  const b = String(block || "");
  const map: Record<string, string> = {};
  for (const line of b.split(/\r?\n/)) {
    const m = line.match(/^(.+?)[：:]\s*(.*)$/);
    if (!m) continue;
    map[m[1].trim()] = m[2].trim();
  }
  const name = map["药品名称"] || "药品";
  const usageFull = map["用法用量（最重要）"] || map["用法用量"] || "";
  const indication = map["主治功能"] || "";
  const precautions = map["注意事项"] || "";
  const contraindications = map["禁忌/慎用人群"] || map["禁忌"] || "";
  const viewLabel = map["当前咨询视角"] || "";
  const tags = inferUsageTags(usageFull);
  const prec = precautions;
  const fallbackUsage =
    usageFull ||
    (b.length > 20 ? `（以下为关联上下文原文，便于核对）\n\n${b.slice(0, 4000)}` : "未能解析到结构化字段。");
  return {
    name,
    ...tags,
    usageFull: fallbackUsage,
    indication: indication || "暂无。",
    precautions: prec,
    precautionsLines: prec ? prec.split(/[；;]\s*/).filter(Boolean) : [],
    contraindications: contraindications || "暂无。",
    viewLabel,
  };
}
