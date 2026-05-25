import { get } from "../utils/request";

export function getWallet(): Promise<{ pointsBalance: number }> {
  return get<{ pointsBalance: number }>("/api/points/wallet");
}

export function formatPointsError(err: unknown): string {
  return err instanceof Error ? err.message : "请求失败，请稍后再试";
}
