import { get } from "../utils/request";

export interface ReminderItem {
  id: number;
  medicineName: string;
  time: string;
  doseText: string;
  status: string;
  mealTiming: string;
}

export interface LogItem {
  reminderId: number;
  date: string;
  takenAt: string | null;
}

export interface DashboardData {
  reminders: ReminderItem[];
  logs: LogItem[];
  totalReminders: number;
  takenCount: number;
  overdueCount: number;
}

export interface DayStat {
  date: string;
  total: number;
  taken: number;
  missed: number;
}

export interface MissedStatsData {
  riskScore: number;
  totalReminders: number;
  takenCount: number;
  missedCount: number;
  onTimeRate: number;
  dailyStats: DayStat[];
}

export interface LowStockSummary {
  thresholdDays: number;
  count: number;
  top: Array<{ id: number; name: string; daysLeft: number; totalAmountText: string }>;
}

export function getDashboard(targetOpenid?: string) {
  const query = targetOpenid ? `?targetOpenid=${targetOpenid}` : "";
  return get<DashboardData>(`/api/dashboard${query}`);
}

export function getMissedStats(targetOpenid?: string) {
  const query = targetOpenid ? `?targetOpenid=${targetOpenid}` : "";
  return get<MissedStatsData>(`/api/dashboard/missed-stats${query}`);
}

export function getLowStockSummary(targetOpenid?: string) {
  const query = targetOpenid ? `?targetOpenid=${targetOpenid}` : "";
  return get<LowStockSummary>(`/api/dashboard/low-stock-summary${query}`);
}

export function getHistory(targetOpenid?: string, days?: number) {
  const params: string[] = [];
  if (targetOpenid) params.push(`targetOpenid=${targetOpenid}`);
  if (days) params.push(`days=${days}`);
  const query = params.length ? `?${params.join("&")}` : "";
  return get<any[]>(`/api/dashboard/history${query}`);
}

export function getWeeklyStats() {
  return get<any[]>("/api/dashboard/weekly-stats");
}

export function getWeeklyStatById(id: string) {
  return get<any>(`/api/dashboard/weekly-stats/${id}`);
}
