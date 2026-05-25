import { get, post, del } from "../utils/request";

export interface CreatePlanRequest {
  userMedicineId: number;
  frequency: number;
  times: string[];
  doseValue?: string;
  doseUnit?: string;
  doseText?: string;
  repeatMode?: string;
  customWeekdays?: string[];
  mealTiming?: string;
}

export interface TakeResult {
  ok: boolean;
  duplicated: boolean;
  totalAmountText: string | null;
  pointsDelta: number;
  pointsBalance: number;
  pointsReason: string;
  pointsReasonText: string;
}

export function createPlan(data: CreatePlanRequest) {
  return post<any[]>("/api/reminder/plan", data);
}

export function listReminders(targetOpenid?: string) {
  const query = targetOpenid ? `?targetOpenid=${targetOpenid}` : "";
  return get<any[]>(`/api/reminder/list${query}`);
}

export function getReminderById(id: number) {
  return get<any>(`/api/reminder/${id}`);
}

export function deleteReminder(id: number) {
  return del(`/api/reminder/${id}`);
}

export function takeMedicine(reminderId: number, date: string) {
  return post<TakeResult>("/api/reminder/take", { reminderId, date });
}

export function getDrugDetailRule(userMedicineId: number) {
  return get<any[]>(`/api/reminder/drug-detail-rule?userMedicineId=${userMedicineId}`);
}
