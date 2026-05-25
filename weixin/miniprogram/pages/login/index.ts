import Toast from "tdesign-miniprogram/toast/index";
import { setUserProfile } from "../../utils/user";
import { launchMainShellFromRedirect } from "../../utils/main-tab";
import { wxLogin } from "../../api/auth";

function getPageOptions(): Record<string, string> {
  const pages = getCurrentPages();
  const current = pages[pages.length - 1] as unknown as { options?: Record<string, string> };
  return current?.options || {};
}

function decodeQ(v: string | undefined) {
  return v ? decodeURIComponent(v) : "";
}

Component({
  data: {
    redirect: "" as string,
    loading: false,
  },
  lifetimes: {
    attached() {
      const opts = getPageOptions();
      this.setData({ redirect: decodeQ(opts.redirect) || "" });
    },
  },
  methods: {
    goBackOrRedirect() {
      const target = this.data.redirect || "/pages/tab-shell/index";
      launchMainShellFromRedirect(target);
    },

    onWxLogin() {
      if (this.data.loading) return;
      this.setData({ loading: true });

      wx.getUserProfile({
        desc: "用于展示头像和昵称",
        success: (res) => {
          const ui = res.userInfo;
          wx.login({
            success: (loginRes) => {
              if (!loginRes.code) {
                this.setData({ loading: false });
                Toast({ context: this, message: "获取登录凭证失败" });
                return;
              }

              const existingProfile = wx.getStorageSync("user_profile") || {};
              const hasCustom = !!(existingProfile.nickName || existingProfile.avatarUrl);
              const nickName = hasCustom ? existingProfile.nickName : ui.nickName;
              const avatarUrl = hasCustom ? existingProfile.avatarUrl : ui.avatarUrl;

              wxLogin(loginRes.code, nickName, avatarUrl)
                .then((data) => {
                  wx.setStorageSync("token", data.token);
                  wx.setStorageSync("openid", data.user.id);
                  const user = data.user || { nickName, avatarUrl, gender: 0 };
                  setUserProfile(user);
                  Toast({ context: this, message: "登录成功" });
                  setTimeout(() => this.goBackOrRedirect(), 350);
                })
                .catch((err) => {
                  console.error("login failed", err);
                  Toast({ context: this, message: "登录失败，请稍后重试" });
                })
                .finally(() => {
                  this.setData({ loading: false });
                });
            },
            fail: () => {
              this.setData({ loading: false });
              Toast({ context: this, message: "获取登录凭证失败" });
            },
          });
        },
        fail: () => {
          this.setData({ loading: false });
          Toast({ context: this, message: "你取消了授权" });
        },
      });
    },
  },
});
