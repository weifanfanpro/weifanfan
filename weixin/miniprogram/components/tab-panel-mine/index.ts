import { getOpenId, getUserProfile, isAuthed } from "../../utils/user";
import { getViewInfo, setViewInfo, resetViewToSelf } from "../../utils/view";
import { getRelations, listPending } from "../../api/family";
import { getWallet } from "../../api/points";

type MenuItem = {
  title: string;
  icon: string;
  url: string;
};

Component({
  properties: {
    active: { type: Boolean, value: false },
  },
  observers: {
    active(active: boolean) {
      if (active) (this as any).onTabPanelShow?.();
    },
  },
  data: {
    user: {
      nickName: "未登录",
      avatarUrl: "/assets/icons/user-default.png",
    } as { nickName: string; avatarUrl: string },
    isAuthed: false,
    perspectiveLabel: "本人",
    pointsBalance: 0,
    familyMemberCount: 0,
    familyPendingCount: 0,
    menuGroupSubtitle: "药品、记录、风险与余量",
    menuItems: [
      { title: "我的药品清单", icon: "/assets/icons/medicine-list.png", url: "/pages/medicine-list/index" },
      { title: "服药历史记录", icon: "/assets/icons/history.png", url: "/pages/history/index" },
      { title: "漏服统计", icon: "/assets/icons/stats.png", url: "/pages/missed-stats/index" },
      { title: "药品余量监控", icon: "/assets/icons/stock-monitor.png", url: "/pages/stock-monitor/index" },
    ] as MenuItem[],
    supportGroupSubtitle: "周边与帮助服务入口",
    supportItems: [
      { title: "积分商城", icon: "/assets/icons/points-mall.png", url: "/pages/points-mall/index" },
      { title: "附近药店", icon: "/assets/icons/nearby-pharmacy.png", url: "/pages/nearby-pharmacy/index" },
      { title: "帮助中心", icon: "/assets/icons/help.png", url: "/pages/help/index" },
      { title: "关于 / 反馈", icon: "/assets/icons/feedback.png", url: "/pages/about/index" },
      { title: "家人账号绑定", icon: "/assets/icons/fimily-bind.png", url: "/pages/family-bind/index" },
      { title: "复制用户ID", icon: "/assets/icons/user-default.png", url: "action://copy-user-id" },
    ] as MenuItem[],
  },
  pageLifetimes: {
    show() {
      if (!this.properties.active) return;
      (this as any).onTabPanelShow?.();
    },
  },
  methods: {
    onTabPanelShow() {
      if (!isAuthed()) {
        this.setData({
          user: { nickName: "未登录", avatarUrl: "/assets/icons/user-default.png" },
          isAuthed: false,
        });
        return;
      }
      this.loadProfile();
      this.loadFamilyData();
      this.loadPointsBalance();
      this.loadPerspective();
    },

    loadProfile() {
      const profile = getUserProfile();
      if (profile && profile.nickName && profile.avatarUrl) {
        this.setData({
          user: { nickName: profile.nickName, avatarUrl: profile.avatarUrl },
          isAuthed: true,
        });
      } else {
        this.setData({
          user: { nickName: "未登录", avatarUrl: "/assets/icons/user-default.png" },
          isAuthed: false,
        });
      }
    },

    async loadFamilyData() {
      try {
        const [relationsRes, pendingRes] = await Promise.all([
          getRelations(),
          listPending(),
        ]);
        const memberCount = Array.isArray((relationsRes as any)?.asMember)
          ? (relationsRes as any).asMember.length
          : 0;
        const pendingList = Array.isArray((pendingRes as any)?.list)
          ? (pendingRes as any).list
          : [];
        const pendingCount = pendingList.filter(
          (x: any) => String(x?.status || "pending") === "pending",
        ).length;
        this.setData({
          familyMemberCount: memberCount,
          familyPendingCount: pendingCount,
        });
      } catch {
        this.setData({ familyMemberCount: 0, familyPendingCount: 0 });
      }
    },

    async loadPointsBalance() {
      try {
        const cached = Number(wx.getStorageSync("points_balance_cache"));
        if (Number.isFinite(cached) && cached > 0) {
          this.setData({ pointsBalance: cached });
        }
      } catch {}
      try {
        const wallet = await getWallet();
        const balance = Number((wallet as any)?.pointsBalance || 0);
        this.setData({ pointsBalance: Math.max(0, balance) });
        try { wx.setStorageSync("points_balance_cache", balance); } catch {}
      } catch {
        // ignore
      }
    },

    onNavItemTap(e: WechatMiniprogram.BaseEvent) {
      const { url } = e.currentTarget.dataset as { url?: string };
      if (!url) return;
      if (url === "action://copy-user-id") {
        const openid = getOpenId();
        if (!openid) {
          wx.showToast({ title: "请先登录", icon: "none" });
          return;
        }
        wx.setClipboardData({
          data: openid,
          success() { wx.showToast({ title: "已复制", icon: "success" }); },
        });
        return;
      }
      wx.navigateTo({ url });
    },

    onEditProfile() {
      wx.navigateTo({ url: "/pages/profile-edit/index" });
    },

    onGoFamily() {
      wx.navigateTo({ url: "/pages/family/index" });
    },

    loadPerspective() {
      const info = getViewInfo();
      this.setData({ perspectiveLabel: info.isSelf ? "本人" : info.label || "家人" });
    },

    async onSwitchPerspective() {
      const selfOpenid = getOpenId();
      if (!selfOpenid) return;

      let relations: any[] = [];
      try {
        const res = await getRelations();
        relations = Array.isArray(res) ? res : [];
      } catch {}

      const items = ["本人"];
      const opens = [selfOpenid];
      for (const r of relations) {
        const otherOpenid = r.ownerOpenid === selfOpenid ? r.memberOpenid : r.ownerOpenid;
        const name = r.nickName || "家人";
        items.push(name);
        opens.push(otherOpenid);
      }

      wx.showActionSheet({
        itemList: items,
        success: (res) => {
          const idx = res.tapIndex;
          const selectedOpenid = opens[idx];
          const label = items[idx];
          if (selectedOpenid === selfOpenid) {
            resetViewToSelf();
            this.setData({ perspectiveLabel: "本人" });
          } else {
            setViewInfo(selectedOpenid, label);
            this.setData({ perspectiveLabel: label });
          }
          wx.showToast({ title: `已切换至${label}`, icon: "none" });
        },
      });
    },

    onGoPointsMall() {
      wx.navigateTo({ url: "/pages/points-mall/index" });
    },
  },
});
