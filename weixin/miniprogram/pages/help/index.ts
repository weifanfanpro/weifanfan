Component({
  data: {
    opened: "start",
    heroTitle: "帮助中心",
    heroSubtitle: "使用教程（简明、易懂）。",
  },
  methods: {
    onTogglePanel(e: WechatMiniprogram.BaseEvent) {
      const val = String((e.currentTarget as any)?.dataset?.value || "");
      this.setData({ opened: this.data.opened === val ? "" : val });
    },
    back() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack();
      } else {
        wx.reLaunch({ url: "/pages/mine/index" });
      }
    },
    onNearby() {
      wx.navigateTo({ url: "/pages/nearby-pharmacy/index" });
    },
  },
});
