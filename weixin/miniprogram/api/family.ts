import { get, post, del } from "../utils/request";

type MedicineRow = {
  id: number;
  medicineId: number | null;
  name: string;
  rule: string;
  isQuantifiable?: boolean;
  doseText?: string;
  totalAmountText?: string;
};

export async function getMedicineList(targetOpenid?: string): Promise<MedicineRow[]> {
  const query = targetOpenid ? `?targetOpenid=${targetOpenid}` : "";
  const list = await get<any[]>(`/api/user-medicine/list${query}`);
  return (list || []).map((x: any) => ({
    id: x.id,
    medicineId: x.medicineId ?? null,
    name: x.name || "药品",
    rule: x.rule || "请根据医生建议设置详细规则",
    isQuantifiable: x.isQuantifiable,
    doseText: x.doseText,
    totalAmountText: x.totalAmountText,
  }));
}

export async function getDrugDetailRule(params: {
  targetOpenid?: string;
  medicineId?: string;
  medicineName?: string;
  userMedicineId?: string;
}): Promise<any[]> {
  if (params.userMedicineId) {
    return get<any[]>(`/api/reminder/drug-detail-rule?userMedicineId=${params.userMedicineId}`);
  }
  return [];
}

export function getRelations() {
  return get<any[]>("/api/family/relations");
}

export function bindFamily(targetOpenid: string) {
  return post("/api/family/bind", { targetOpenid });
}

export function unbind(relationId: number) {
  return del(`/api/family/unbind/${relationId}`);
}

export function createPending(data: {
  ownerOpenid: string;
  name: string;
  isQuantifiable?: boolean;
  doseText?: string;
  totalAmountText?: string;
  rule?: string;
  draftPlan?: any;
}) {
  return post("/api/family/pending", data);
}

export function listPending() {
  return get<any[]>("/api/family/pending/inbox");
}

export function listSentPending() {
  return get<any[]>("/api/family/pending/sent");
}

export function activatePending(id: number) {
  return post(`/api/family/pending/${id}/activate`);
}

export function ignorePending(id: number) {
  return post(`/api/family/pending/${id}/ignore`);
}

export function formatFamilyError(err: unknown): string {
  return err instanceof Error ? err.message : "请求失败，请稍后再试";
}
