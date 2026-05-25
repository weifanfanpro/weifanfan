import { wxLogin } from "./api/auth";

App<IAppOption>({
  globalData: {
    scanResult: null as {
      result: {
        name: string;
        indication: string;
        dosage: string;
        usageMethod?: string;
        usageMethodText?: string;
        isQuantifiable?: boolean;
        doseText?: string;
        totalAmountText?: string | null;
        warnings?: string[];
        contraindications?: string;
      };
      medicineId: string;
      viewIsSelf: boolean;
      viewLabel: string;
    } | null,
    aiConsultMedicine: null,
    consultMedicineDetailEntry: null as IAppOption["globalData"]["consultMedicineDetailEntry"],
  },
  onLaunch() {
    this.doLogin();
  },

  onShow() {
    const token = wx.getStorageSync("token");
    if (!token) {
      this.doLogin();
    } else {
      this.checkAccountChange();
    }

    const profile = wx.getStorageSync("user_profile");
    const authed = Boolean(profile && profile.nickName && profile.avatarUrl);
    if (!authed) {
      const pages = getCurrentPages();
      const current = pages[pages.length - 1] as any;
      const route = current?.route ? `/${current.route}` : "/pages/tab-shell/index";
      if (route !== "/pages/login/index") {
        wx.reLaunch({
          url: `/pages/login/index?redirect=${encodeURIComponent(route)}`,
        });
      }
      return;
    }
  },

  doLogin() {
    wx.login({
      success: (res) => {
        if (!res.code) return;
        wxLogin(res.code)
          .then((data) => {
            wx.setStorageSync("token", data.token);
            wx.setStorageSync("openid", data.user.id);
            wx.setStorageSync("user_profile", data.user);
          })
          .catch((err) => {
            console.error("login failed", err);
          });
      },
    });
  },

  checkAccountChange() {
    wx.login({
      success: (res) => {
        if (!res.code) return;
        wxLogin(res.code)
          .then((data) => {
            const newOpenid = data.user.id;
            const oldOpenid = wx.getStorageSync("openid");
            if (oldOpenid && oldOpenid !== newOpenid) {
              wx.setStorageSync("current_view_openid", newOpenid);
              wx.setStorageSync("current_view_label", "我自己");
              wx.removeStorageSync("user_profile");
            }
            wx.setStorageSync("token", data.token);
            wx.setStorageSync("openid", newOpenid);
            wx.setStorageSync("user_profile", data.user);
          })
          .catch(() => {});
      },
    });
  },
});
