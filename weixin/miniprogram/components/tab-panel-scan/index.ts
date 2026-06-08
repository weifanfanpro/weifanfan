import Toast from "tdesign-miniprogram/toast/index";
import { uploadAndRecognizeMedicine } from "../../utils/recognize-medicine-consult";
import { isAuthed } from "../../utils/user";
import { getViewInfo } from "../../utils/view";

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
    flashOn: false,
    flashMode: "off" as "off" | "torch",
    recognizing: false,
    viewIsSelf: true,
    viewLabel: "本人",
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
        wx.reLaunch({
          url: `/pages/login/index?redirect=${encodeURIComponent("/pages/tab-shell/index?tab=1")}`,
        });
        return;
      }
      const v = getViewInfo();
      this.setData({ viewIsSelf: v.isSelf, viewLabel: v.isSelf ? "本人" : v.label });
    },
    noop() {},
    /** 识别成功 → 扫药结果页（AI 咨询请用「咨询 → 扫描药品」独立页） */
    afterRecognizeSuccess(data: {
      id?: number;
      medicineId?: string;
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
    }) {
      const v = getViewInfo();
      const app = getApp<IAppOption>();
      // 兼容后端返回 id 或 medicineId
      const medId = String(data.id || data.medicineId || "").trim();
      (app.globalData as any).scanResult = {
        result: {
          name: data.name,
          indication: data.indication,
          dosage: data.dosage,
          usageMethod: data.usageMethod || "other",
          usageMethodText: data.usageMethodText || "",
          isQuantifiable: Boolean(data.isQuantifiable),
          doseText: data.doseText || "",
          totalAmountText:
            data.totalAmountText === null || typeof data.totalAmountText === "undefined"
              ? null
              : String(data.totalAmountText),
          warnings: data.warnings || [],
          contraindications: data.contraindications || "",
        },
        medicineId: medId,
        viewIsSelf: v.isSelf,
        viewLabel: v.isSelf ? "本人" : v.label,
      };
      wx.navigateTo({ url: "/pages/scan-result/index" });
    },
    async ensureCameraPermission() {
      try {
        const setting = await wx.getSetting();
        const granted = Boolean((setting as any)?.authSetting?.["scope.camera"]);
        if (granted) return true;

        // 关键：进入页面时用户可能拒绝，这里在“开始识别”再次触发授权弹窗
        await wx.authorize({ scope: "scope.camera" });
        return true;
      } catch (e) {
        // 用户再次拒绝：禁止使用拍照识别（仍可从相册选择）
        Toast({
          context: this,
          message: "未授权相机，无法拍照识别。可在设置中开启权限，或使用“从相册选择”。",
        });
        try {
          wx.showModal({
            title: "相机权限未开启",
            content: "你已拒绝相机授权，无法使用拍照识别。可前往设置开启后再试。",
            confirmText: "去设置",
            cancelText: "知道了",
            success: (res) => {
              if (res.confirm) wx.openSetting?.({});
            },
          });
        } catch {}
        return false;
      }
    },
    onToggleFlash() {
      const on = !this.data.flashOn;
      this.setData({ flashOn: on, flashMode: on ? "torch" : "off" });
    },
    onCameraError(e: WechatMiniprogram.CameraError) {
      console.error("camera error", e);
      Toast({ context: this, message: "相机不可用，请检查权限或使用相册识别" });
    },

    onOpenMedicineLibrary() {
      wx.navigateTo({ url: "/pages/medicine-library/index" });
    },

    /**
     * 上传图片并调用 recognizeMedicine 云函数
     */
    uploadAndRecognize(tempFilePath: string) {
      return uploadAndRecognizeMedicine(tempFilePath);
    },

    /**
     * 使用相机拍照并识别
     */
    async onStartRecognize() {
      if (this.data.recognizing) return;

      try {
        const ok = await (this as any).ensureCameraPermission?.();
        if (!ok) return;
        this.setData({ recognizing: true });
        // 使用 <camera> 拍照：支持闪光灯 torch/off
        let tempFilePath = "";
        try {
          const ctx = wx.createCameraContext();
          const photo = await new Promise<WechatMiniprogram.CameraContextTakePhotoSuccessCallbackResult>((resolve, reject) => {
            ctx.takePhoto({
              quality: "high",
              success: resolve,
              fail: reject,
            });
          });
          tempFilePath = photo.tempImagePath;
        } catch (camErr) {
          // 兜底：部分环境 camera 不可用时退回 chooseMedia
          console.warn("takePhoto failed, fallback to chooseMedia", camErr);
          const chooseRes = await wx.chooseMedia({
            count: 1,
            mediaType: ["image"],
            sourceType: ["camera"],
          });
          tempFilePath = chooseRes.tempFiles[0].tempFilePath;
        }

        const data = await this.uploadAndRecognize(tempFilePath);

        this.setData({ recognizing: false });
        (this as any).afterRecognizeSuccess?.(data);
      } catch (err) {
        console.error("onStartRecognize error", err);
        this.setData({ recognizing: false });
        const msg =
          err instanceof Error && err.message
            ? err.message
            : "识别失败，请稍后再试";
        Toast({ context: this, message: msg });
      }
    },

    /**
     * 从相册选择图片并识别
     */
    async onChooseFromAlbum() {
      if (this.data.recognizing) return;

      try {
        const chooseRes = await wx.chooseMedia({
          count: 1,
          mediaType: ["image"],
          sourceType: ["album"],
        });

        if (!chooseRes.tempFiles || !chooseRes.tempFiles.length) {
          Toast({ context: this, message: "未选择图片" });
          return;
        }

        const tempFilePath = chooseRes.tempFiles[0].tempFilePath;

        this.setData({ recognizing: true });
        const data = await this.uploadAndRecognize(tempFilePath);

        this.setData({ recognizing: false });
        (this as any).afterRecognizeSuccess?.(data);
      } catch (err) {
        console.error("onChooseFromAlbum error", err);
        this.setData({ recognizing: false });
        const msg =
          err instanceof Error && err.message
            ? err.message
            : "识别失败或未选择图片";
        Toast({ context: this, message: msg });
      }
    },
  },
});

