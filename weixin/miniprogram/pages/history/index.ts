type HistoryItem = {
  id: string; // reminder_logs 文档 id
  name: string; // 药品名称
  time: string; // 例如 2026-03-08 08:00
  status: "ok" | "missed"; // 已服用 或 漏服
};

import { getViewInfo } from "../../utils/view";
import { getHistory } from "../../api/dashboard";

Component({
  data: {
    list: [] as HistoryItem[],
    viewLabel: "本人",
    heroTitle: "服药历史记录",
    heroSubtitle: "记录每次是否按时服用。",
    emptyText: "暂无记录",
    okText: "已服用",
    missedText: "漏服",
    // 时间范围筛选
    daysRange: [7, 14, 30] as number[],
    selectedDays: 7,
    daysLabel: "近 7 天",
  },
  pageLifetimes: {
    show() {
      (this as any).refresh?.();
    },
  },
  methods: {
    onDaysChange(e: WechatMiniprogram.CustomEvent<{ value: string | number }>) {
      const v = parseInt(String(e.detail.value || "7"), 10) || 7;
      this.setData({ selectedDays: v, daysLabel: `近 ${v} 天` });
      (this as any).refresh?.();
    },
    async refresh() {
      try {
        const v = getViewInfo();
        const days = this.data.selectedDays || 7;
        const data = await getHistory(v.viewOpenid, days);
        const rawList = Array.isArray(data) ? data : (data?.list || []);
        // 标准化状态字段：兼容仅返回 "ok" 的旧数据
        const list: HistoryItem[] = (rawList as any[]).map((item: any) => ({
          id: item.id || item._id || "",
          name: item.name || "",
          time: item.time || "",
          status: (item.status === "missed" ? "missed" : "ok") as "ok" | "missed",
        }));
        this.setData({ list, viewLabel: v.isSelf ? "本人" : v.label });
      } catch (err) {
        console.error("history refresh error", err);
        const v = getViewInfo();
        this.setData({ list: [], viewLabel: v.isSelf ? "本人" : v.label });
      }
    },
  },
});
