import { get, post, del } from "../utils/request";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  displayContent?: string;
  reasoning?: string;
};

type SessionInfo = {
  id: number;
  sessionId: number;
  title: string;
  updatedAt?: unknown;
};

type SessionDetail = {
  id: number;
  sessionId: number;
  title: string;
  messages: ChatMessage[];
};

export async function getSessions(): Promise<SessionInfo[]> {
  return get<SessionInfo[]>("/api/ai-chat/sessions");
}

export async function getSession(sessionId: number): Promise<SessionDetail> {
  return get<SessionDetail>(`/api/ai-chat/sessions/${sessionId}`);
}

export async function createSession(): Promise<number> {
  return 0;
}

export async function deleteSession(sessionId: number) {
  return del(`/api/ai-chat/sessions/${sessionId}`);
}

export async function sendMessage(params: {
  sessionId?: number;
  userContent: string;
  userDisplayContent?: string;
  consultAttach?: string;
  enableThinking?: boolean;
  enableSearch?: boolean;
  consultMedicineId?: number;
}): Promise<{ sessionId: number; message: ChatMessage }> {
  const data: any = {
    message: params.userContent,
    deepThinking: params.enableThinking || false,
    webSearch: params.enableSearch || false,
  };
  if (params.sessionId) data.sessionId = params.sessionId;
  if (params.consultMedicineId) data.consultMedicineId = params.consultMedicineId;

  const r = await post<any>("/api/ai-chat/send", data, 300000);
  return {
    sessionId: r.sessionId,
    message: { role: "assistant", content: r.content, reasoning: r.reasoning },
  };
}

export async function checkReminderPlan(params: {
  enableThinking?: boolean;
  enableSearch?: boolean;
  plan: {
    drugName: string;
    usageMethodLabel: string;
    dailyFrequency: string;
    times: string[];
    doseText: string;
    mealTimingLabel: string;
    repeatWeekdaysText: string;
  };
}) {
  return post<any>("/api/ai-chat/check-reminder-plan", params, 300000);
}

export function formatChatError(err: unknown): string {
  return err instanceof Error ? err.message : "请求失败，请稍后再试";
}
