import Toast from "tdesign-miniprogram/toast/index";
import { getOpenId } from "../../utils/user";

Component({
  data: {
    openid: "",
    qrValue: "",
    qrPx: 200,
  },
  lifetimes: {
    attached() {
      const openid = getOpenId();
      const qrValue = openid ? `family://bind?code=${openid}` : "";
      // t-qrcode 的 size 单位是 px，这里给一个适中尺寸
      this.setData({ openid, qrValue, qrPx: 220 });
    },
  },
  methods: {
    onCopy() {
      const openid = String((this.data as any).openid || "");
      if (!openid) return;
      wx.setClipboardData({
        data: openid,
        success: () => Toast({ context: this, message: "已复制绑定码" }),
      });
    },
    onCopyCode() {
      const openid = String((this.data as any).openid || "");
      if (!openid) return;
      wx.setClipboardData({
        data: openid,
        success: () => Toast({ context: this, message: "已复制绑定码" }),
      });
    },
  },
});

