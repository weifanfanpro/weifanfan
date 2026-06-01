Component({
  options: {
    multipleSlots: true,
  },
  properties: {
    title: {
      type: String,
      value: '',
    },
    showBack: {
      type: Boolean,
      value: true,
    },
    showPlaceholder: {
      type: Boolean,
      value: true,
    },
  },
  data: {
    statusBarHeight: 20,
  },
  lifetimes: {
    attached() {
      const sysInfo = wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: sysInfo.statusBarHeight || 20,
      });
    },
  },
  methods: {
    onBack() {
      wx.navigateBack({ delta: 1 });
    },
  },
});
