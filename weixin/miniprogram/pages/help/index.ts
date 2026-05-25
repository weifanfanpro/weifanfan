Component({
  data: {
    opened: ["start"] as string[],
    heroTitle: "帮助中心",
    heroSubtitle: "使用教程（简明、易懂）。",
  },
  methods: {
    onChange(e: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
      this.setData({ opened: e.detail.value });
    },
    back() {
      wx.navigateBack();
    },
    onNearby() {
      wx.navigateTo({ url: "/pages/nearby-pharmacy/index" });
    },
  },
});

