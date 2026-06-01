import { isAuthed } from "../../utils/user";
import { listPending } from "../../api/family";

const FAMILY_PENDING_BADGE_KEY = "family_pending_badge_count";

function parseTabIndex(opt?: Record<string, string | undefined>): number {
  const t = Number(opt?.tab);
  if (!Number.isFinite(t)) return 0;
  if (t < 0 || t > 3) return 0;
  return Math.floor(t);
}

function titleForTab(i: number) {
  if (i === 1) return "扫药";
  if (i === 2) return "咨询";
  if (i === 3) return "我的";
  return "首页";
}

function setTitle(i: number) {
  try {
    wx.setNavigationBarTitle({ title: titleForTab(i) });
  } catch {}
}

type TabIconItem = {
  value: number;
  defaultIcon: string;
  activeIcon: string;
};

Page({
  data: {
    tabIndex: 0,
    familyPendingCount: 0,
    list: [
      { value: 0, defaultIcon: "/assets/icons/home-default.png", activeIcon: "/assets/icons/home-active.png" },
      { value: 1, defaultIcon: "/assets/icons/scan-default.png", activeIcon: "/assets/icons/scan-active.png" },
      { value: 2, defaultIcon: "/assets/icons/ai-default.png", activeIcon: "/assets/icons/ai-active.png" },
      { value: 3, defaultIcon: "/assets/icons/user-default.png", activeIcon: "/assets/icons/user-active.png" },
    ] as TabIconItem[],
  },

  onLoad(opt: Record<string, string | undefined>) {
    if (!isAuthed()) {
      const back = opt?.tab !== undefined && opt.tab !== "" ? `${"/pages/tab-shell/index"}?tab=${opt.tab}` : "/pages/tab-shell/index";
      wx.reLaunch({
        url: `/pages/login/index?redirect=${encodeURIComponent(back)}`,
      });
      return;
    }
    const tabIndex = parseTabIndex(opt);
    (this as unknown as { __setMainTab?: (i: number) => void }).__setMainTab = (idx: number) => {
      const n = Math.max(0, Math.min(3, Math.floor(idx)));
      if (this.data.tabIndex === n) return;
      this.setData({ tabIndex: n });
    };
    this.setData({ tabIndex });
    setTitle(tabIndex);
    (this as any).refreshFamilyPendingCount?.();
  },

  onShow() {
    if (!isAuthed()) {
      const pages = getCurrentPages();
      const cur = pages[pages.length - 1];
      const route = cur?.route ? `/${cur.route}` : "";
      if (route !== "/pages/login/index") {
        wx.reLaunch({
          url: `/pages/login/index?redirect=${encodeURIComponent(route || "/pages/tab-shell/index")}`,
        });
      }
    }
    (this as any).refreshFamilyPendingCount?.();
    setTitle(this.data.tabIndex);
    // 等待 app 的 checkAccountChange 完成后再刷新 mine 资料
    if (this.data.tabIndex === 3) {
      const app = getApp();
      const ready = (app as any).__accountReady as Promise<void> | undefined;
      const doRefresh = () => {
        const minePanel = this.selectComponent("#mine-panel") as any;
        minePanel?.loadProfile?.();
      };
      if (ready && typeof ready.then === "function") {
        ready.then(doRefresh);
      } else {
        doRefresh();
      }
    }
  },

  onSwiperChange(e: WechatMiniprogram.SwiperChange) {
    const cur = e.detail?.current;
    if (typeof cur !== "number" || cur === this.data.tabIndex) return;
    this.setData({ tabIndex: cur });
    setTitle(cur);
  },

  onTabBarChange(e: WechatMiniprogram.CustomEvent<{ value: number | string }>) {
    const nextValue = Number(e.detail?.value);
    if (Number.isNaN(nextValue) || nextValue === this.data.tabIndex) return;
    this.setData({ tabIndex: nextValue });
    setTitle(nextValue);
    if (nextValue === 0 || nextValue === 3) {
      (this as any).refreshFamilyPendingCount?.();
    }
  },
  async refreshFamilyPendingCount() {
    // 先用缓存秒开，再异步纠正
    try {
      const cached = Number(wx.getStorageSync(FAMILY_PENDING_BADGE_KEY) || 0);
      this.setData({ familyPendingCount: Number.isFinite(cached) ? Math.max(0, cached) : 0 });
    } catch {}
    try {
      const list = await listPending();
      const count = Array.isArray(list) ? list.filter((x: any) => String(x?.status || "pending") === "pending").length : 0;
      this.setData({ familyPendingCount: count });
      try {
        wx.setStorageSync(FAMILY_PENDING_BADGE_KEY, count);
      } catch {}
    } catch {
      // ignore: 保留缓存值
    }
  },
});
