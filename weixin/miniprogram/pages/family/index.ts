import Toast from "tdesign-miniprogram/toast/index";
import { isAuthed } from "../../utils/user";
import { listPending, listSentPending, activatePending, ignorePending } from "../../api/family";

const FAMILY_PENDING_BADGE_KEY = "family_pending_badge_count";

type Status = "pending" | "activated" | "ignored";
type Mode = "received" | "sent";
type ReceivedFilter = "pending" | "activated" | "ignored";

type FamilyItem = {
  id: string;
  name: string;
  desc: string;
  status: Status;
  ownerName?: string;
  actorName?: string;
  createdAtText?: string;
  handledAtText?: string;
};

function statusText(s: Status) {
  if (s === "activated") return "已激活";
  if (s === "ignored") return "已忽略";
  return "待处理";
}

Component({
  data: {
    mode: "received" as Mode,
    receivedFilter: "pending" as ReceivedFilter,
    receivedList: [] as FamilyItem[],
    receivedVisibleList: [] as FamilyItem[],
    sentList: [] as FamilyItem[],
  },
  pageLifetimes: {
    show() {
      if (!isAuthed()) {
        wx.reLaunch({ url: `/pages/login/index?redirect=${encodeURIComponent("/pages/family/index")}` });
        return;
      }
      (this as any).refresh?.();
    },
  },
  methods: {
    onModeChange(e: WechatMiniprogram.BaseEvent) {
      const { mode } = e.currentTarget.dataset as { mode?: Mode };
      if (!mode) return;
      this.setData({ mode });
    },

    onReceivedFilterChange(e: WechatMiniprogram.BaseEvent) {
      const { value } = e.currentTarget.dataset as { value?: ReceivedFilter };
      if (!value) return;
      this.setData({ receivedFilter: value }, () => {
        (this as any).syncReceivedVisibleList?.();
      });
    },

    buildItem(x: any): FamilyItem {
      const status = (String(x.status || "pending") as Status);
      return {
        id: String(x.id ?? x._id ?? ""),
        name: x.name || "药品",
        desc: x.desc || "由家人代添加",
        status,
        ownerName: x.ownerName || "",
        actorName: x.actorName || "",
        createdAtText: x.createdAtText || "",
        handledAtText: x.handledAtText || "",
      };
    },

    async refresh() {
      try {
        const [receivedRaw, sentRaw] = await Promise.all([
          listPending(),
          listSentPending(),
        ]);
        const receivedList = (receivedRaw || []).map((x: any) => (this as any).buildItem(x));
        const pendingCount = receivedList.filter((x: FamilyItem) => x.status === "pending").length;
        try {
          wx.setStorageSync(FAMILY_PENDING_BADGE_KEY, pendingCount);
        } catch {}
        this.setData({
          receivedList,
          sentList: (sentRaw || []).map((x: any) => (this as any).buildItem(x)),
        }, () => (this as any).syncReceivedVisibleList?.());
      } catch (e) {
        console.error("family refresh error", e);
        this.setData({ receivedList: [], receivedVisibleList: [], sentList: [] });
        try {
          wx.setStorageSync(FAMILY_PENDING_BADGE_KEY, 0);
        } catch {}
      }
    },

    syncReceivedVisibleList() {
      const f = (this.data as any).receivedFilter as ReceivedFilter;
      const list = ((this.data as any).receivedList || []) as FamilyItem[];
      this.setData({ receivedVisibleList: list.filter((x) => x.status === f) });
    },

    async onActivate(e: WechatMiniprogram.BaseEvent) {
      const { id } = e.currentTarget.dataset as { id?: string };
      if (!id) return;

      // 激活时同步触发订阅授权（必须由家属本人点击允许，后端才能发提醒）
      try {
        const tmplId = "awEHVSQ2Pm-2waMrf1XmYMaIPTYA4cTJo5etli7yYGU";
        if (tmplId) {
          await new Promise<void>((resolve) => {
            wx.requestSubscribeMessage({ tmplIds: [tmplId], complete: () => resolve() });
          });
        }
      } catch {}

      try {
        wx.showLoading({ title: "激活中…" });
        await activatePending(Number(id));
        wx.hideLoading();
        Toast({ context: this, message: "已激活，将开始提醒" });
        (this as any).refresh?.();
      } catch (e) {
        console.error("activatePending error", e);
        try { wx.hideLoading(); } catch {}
        Toast({ context: this, message: "激活失败，请稍后重试" });
      }
    },

    async onIgnore(e: WechatMiniprogram.BaseEvent) {
      const { id } = e.currentTarget.dataset as { id?: string };
      if (!id) return;
      try {
        wx.showLoading({ title: "处理中…" });
        await ignorePending(Number(id));
        wx.hideLoading();
        Toast({ context: this, message: "已忽略" });
        (this as any).refresh?.();
      } catch (e) {
        console.error("ignorePending error", e);
        try { wx.hideLoading(); } catch {}
        Toast({ context: this, message: "操作失败，请稍后重试" });
      }
    },
  },
});

