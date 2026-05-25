import Toast from "tdesign-miniprogram/toast/index";
import { buildAiConsultMedicineAfterRecognition, uploadAndRecognizeMedicine } from "../../utils/recognize-medicine-consult";
import { switchMainTab } from "../../utils/main-tab";
import { isAuthed } from "../../utils/user";
import { getViewInfo } from "../../utils/view";

type RecognizePayload = {
  medicineId: string;
  name: string;
  indication: string;
  dosage: string;
  warnings?: string[];
  contraindications?: string;
};

Page({
  data: {
    flashOn: false,
    flashMode: "off" as "off" | "torch",
    recognizing: false,
    viewLabel: "本人",
  },

  onShow() {
    const v = getViewInfo();
    this.setData({ viewLabel: v.isSelf ? "本人" : v.label });
    if (!isAuthed()) {
      wx.reLaunch({
        url: `/pages/login/index?redirect=${encodeURIComponent("/pages/ai-chat-scan-medicine/index")}`,
      });
    }
  },

  noop() {},

  async finishForConsult(data: RecognizePayload, source: "scan" | "album") {
    const v = getViewInfo();
    const app = getApp<IAppOption>();
    if (!app.globalData) return;

    const mid = String(data.medicineId || "").trim();
    if (mid) wx.showLoading({ title: "加载提醒…", mask: true });
    try {
      app.globalData.aiConsultMedicine = await buildAiConsultMedicineAfterRecognition(data, v, source);
    } finally {
      if (mid) wx.hideLoading();
    }

    wx.navigateBack({
      fail: () => switchMainTab(2),
    });
  },

  async ensureCameraPermission() {
    try {
      const setting = await wx.getSetting();
      const granted = Boolean(setting.authSetting?.["scope.camera"]);
      if (granted) return true;
      await wx.authorize({ scope: "scope.camera" });
      return true;
    } catch {
      Toast({
        context: this,
        selector: "#t-toast",
        message: "未授权相机，请使用「从相册选择」。",
      });
      try {
        wx.showModal({
          title: "相机权限未开启",
          content: "可前往设置开启相机，或使用相册选择图片。",
          confirmText: "去设置",
          cancelText: "知道了",
          success: (res) => {
            if (res.confirm) wx.openSetting?.({});
          },
        });
      } catch {
        /* noop */
      }
      return false;
    }
  },

  onToggleFlash(e: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
    const on = Boolean(e.detail.value);
    this.setData({ flashOn: on, flashMode: on ? "torch" : "off" });
  },

  onCameraError(e: WechatMiniprogram.CameraError) {
    console.error("camera error", e);
    Toast({ context: this, selector: "#t-toast", message: "相机不可用，请使用相册选择" });
  },

  async onStartRecognize() {
    if (this.data.recognizing) return;
    try {
      const ok = await this.ensureCameraPermission();
      if (!ok) return;
      this.setData({ recognizing: true });
      let tempFilePath = "";
      try {
        const ctx = wx.createCameraContext();
        const photo = await new Promise<WechatMiniprogram.TakePhotoSuccessCallbackResult>((resolve, reject) => {
          ctx.takePhoto({
            quality: "high",
            success: resolve,
            fail: reject,
          });
        });
        tempFilePath = photo.tempImagePath;
      } catch (camErr) {
        console.warn("takePhoto failed, fallback chooseMedia", camErr);
        const chooseRes = await wx.chooseMedia({
          count: 1,
          mediaType: ["image"],
          sourceType: ["camera"],
        });
        tempFilePath = chooseRes.tempFiles[0].tempFilePath;
      }

      const data = await uploadAndRecognizeMedicine(tempFilePath);
      this.setData({ recognizing: false });
      await this.finishForConsult(data, "scan");
    } catch (err) {
      console.error("onStartRecognize", err);
      this.setData({ recognizing: false });
      const msg = err instanceof Error && err.message ? err.message : "识别失败，请稍后再试";
      Toast({ context: this, selector: "#t-toast", message: msg });
    }
  },

  async onChooseFromAlbum() {
    if (this.data.recognizing) return;
    try {
      const chooseRes = await wx.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: ["album"],
      });
      if (!chooseRes.tempFiles?.length) {
        Toast({ context: this, selector: "#t-toast", message: "未选择图片" });
        return;
      }
      const tempFilePath = chooseRes.tempFiles[0].tempFilePath;
      this.setData({ recognizing: true });
      const data = await uploadAndRecognizeMedicine(tempFilePath);
      this.setData({ recognizing: false });
      await this.finishForConsult(data, "album");
    } catch (err) {
      console.error("onChooseFromAlbum", err);
      this.setData({ recognizing: false });
      const msg = err instanceof Error && err.message ? err.message : "识别失败或未选择图片";
      Toast({ context: this, selector: "#t-toast", message: msg });
    }
  },
});
