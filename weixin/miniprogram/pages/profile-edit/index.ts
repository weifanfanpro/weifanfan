import Toast from "tdesign-miniprogram/toast/index";
import { getUserProfile, setUserProfile } from "../../utils/user";
import { upload } from "../../utils/request";
import { put } from "../../utils/request";

Component({
  data: {
    profile: {
      nickName: "",
      avatarUrl: "/assets/icons/user-default.png",
    },
    avatarPreviewUrl: "",
    loading: false,
    heroSubtitle: "支持手动修改昵称和头像。",
  },
  lifetimes: {
    attached(this: any) {
      const p = getUserProfile();
      if (p) {
        this.setData({
          profile: {
            nickName: p.nickName || "未设置",
            avatarUrl: p.avatarUrl || "/assets/icons/user-default.png",
          },
          avatarPreviewUrl: p.avatarUrl || "/assets/icons/user-default.png",
        });
      }
    },
  },
  methods: {
    onBack(this: any) {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack();
      } else {
        wx.reLaunch({ url: "/pages/mine/index" });
      }
    },

    async uploadAvatar(this: any, path: string) {
      if (!path) return;
      this.setData({ "profile.avatarUrl": path, avatarPreviewUrl: path });
      wx.showLoading({ title: "上传中…" });
      try {
        const result = await upload<{ url: string }>("/api/user/avatar", path);
        if (result?.url) {
          this.setData({ "profile.avatarUrl": result.url, avatarPreviewUrl: result.url });
          await (this as any).saveProfilePartial({ avatarUrl: result.url });
          Toast({ context: this, message: "头像已更新" });
        }
      } catch (err) {
        console.error("upload avatar failed", err);
        Toast({ context: this, message: "头像上传失败，请稍后重试" });
      } finally {
        try { wx.hideLoading(); } catch {}
      }
    },

    async saveProfilePartial(this: any, patch: Partial<{ nickName: string; avatarUrl: string }>) {
      const nextNick = String(patch.nickName != null ? patch.nickName : this.data.profile.nickName).trim();
      const nextAvatar = String(patch.avatarUrl != null ? patch.avatarUrl : this.data.profile.avatarUrl).trim();
      if (!nextNick || !nextAvatar) return;
      await put("/api/user/profile", { nickName: nextNick, avatarUrl: nextAvatar, gender: 0 });
      const user = { nickName: nextNick, avatarUrl: nextAvatar, gender: 0 };
      setUserProfile(user);
      this.setData({
        profile: { nickName: user.nickName, avatarUrl: user.avatarUrl },
        avatarPreviewUrl: user.avatarUrl,
      });
    },

    onChooseAvatarFromAlbum(this: any) {
      if (this.data.loading) return;
      wx.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album"],
        success: (res) => {
          const path = res.tempFilePaths[0];
          if (!path) return;
          (this as any).uploadAvatar(path);
        },
      });
    },

    onNicknameInput(this: any, e: WechatMiniprogram.Input) {
      const nickName = String(e.detail.value || "").trim();
      this.setData({ "profile.nickName": nickName });
    },

    onSave(this: any) {
      if (this.data.loading) return;
      this.setData({ loading: true });

      const { nickName, avatarUrl } = this.data.profile;
      if (!nickName || !avatarUrl) {
        this.setData({ loading: false });
        Toast({ context: this, message: "请先设置头像和昵称" });
        return;
      }

      put("/api/user/profile", { nickName, avatarUrl, gender: 0 })
        .then(() => {
          const user = { nickName, avatarUrl, gender: 0 };
          setUserProfile(user);
          this.setData({ profile: { nickName: user.nickName, avatarUrl: user.avatarUrl } });
          Toast({ context: this, message: "资料已更新" });
        })
        .catch((err) => {
          console.error("updateUserProfile failed", err);
          Toast({ context: this, message: "更新失败，请稍后重试" });
        })
        .finally(() => {
          this.setData({ loading: false });
        });
    },
  },
});
