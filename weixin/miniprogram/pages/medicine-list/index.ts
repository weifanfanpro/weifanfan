type MedicineItem = {
  id: number;
  medicineId: number | null;
  name: string;
  rule: string;
  doseText?: string;
  isQuantifiable?: boolean;
  totalAmountText?: string | null;
  active: boolean;
  displayRule: string;
};

import { getViewInfo } from "../../utils/view";
import { getMedicineList } from "../../api/family";
import { deleteMedicine } from "../../api/user-medicine";

Component({
  data: {
    list: [] as MedicineItem[],
    viewLabel: "本人",
    heroTitle: "我的药品清单",
    heroSubtitle: "当前视角药单与首页提醒保持一致。",
    emptyText: "暂无药品，先添加一个吧",
    activeText: "提醒中",
    inactiveText: "未设置",
    // 滑动删除相关
    touchingId: "",
    touchStartX: 0,
    touchStartY: 0,
    touchDeltaX: 0,
    swipedId: "",
  },
  pageLifetimes: {
    // 每次进入页面时，从云数据库拉取"我的药单"
    show() {
      (this as any).loadList?.();
    },
  },
  methods: {
    async loadList() {
      try {
        const v = getViewInfo();
        this.setData({ viewLabel: v.isSelf ? "本人" : v.label });
        const rows = await getMedicineList(v.viewOpenid);
        const list: MedicineItem[] = (rows || []).map((x: any) => ({
          id: x.id,
          medicineId: x.medicineId ?? null,
          name: x.name || "药品",
          rule: x.rule || "请根据医生建议设置详细规则",
          doseText: x.doseText || "",
          isQuantifiable: !!x.isQuantifiable,
          totalAmountText: x.totalAmountText ?? null,
          active: false,
          displayRule: x.doseText || x.rule || "请根据医生建议设置详细规则",
        }));
        this.setData({ list, swipedId: "" });
      } catch (err) {
        console.error("loadList error", err);
      }
    },
    onAdd() {
      wx.navigateTo({ url: "/pages/add-medicine/index" });
    },
    onOpen(e: WechatMiniprogram.BaseEvent) {
      const { name, id } = e.currentTarget.dataset as { name?: string; id?: string };
      // 如果当前有滑动展开的项，先收回
      if (this.data.swipedId) {
        this.setData({ swipedId: "" });
        return;
      }
      const queryName = encodeURIComponent(name || "");
      const queryId = id ? "&id=" + encodeURIComponent(id) : "";
      wx.navigateTo({
        url: "/pages/drug-detail/index?name=" + queryName + queryId,
      });
    },

    // --- 滑动手势处理 ---
    onTouchStart(e: WechatMiniprogram.TouchEvent) {
      const { uid } = e.currentTarget.dataset as { uid?: string };
      if (!uid) return;
      const touch = e.touches[0];
      this.setData({
        touchingId: uid,
        touchStartX: touch.clientX,
        touchStartY: touch.clientY,
        touchDeltaX: 0,
      });
    },

    onTouchMove(e: WechatMiniprogram.TouchEvent) {
      const { uid } = e.currentTarget.dataset as { uid?: string };
      const touch = e.touches[0];
      const deltaX = touch.clientX - this.data.touchStartX;
      const deltaY = touch.clientY - this.data.touchStartY;
      // 如果垂直滑动距离大于水平，不处理（让页面滚动）
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaX) < 20) return;
      // 仅允许向左滑动，最大 -160rpx（对应删除按钮宽度）
      const clamped = Math.max(-160, Math.min(0, deltaX));
      this.setData({ touchDeltaX: clamped });
    },

    onTouchEnd() {
      const { touchDeltaX, touchingId } = this.data;
      // 滑动超过一半（-80px），展开删除；否则收回
      if (touchDeltaX < -80 && touchingId) {
        this.setData({ swipedId: touchingId, touchDeltaX: 0, touchingId: "" });
      } else {
        this.setData({ touchDeltaX: 0, touchingId: "", swipedId: "" });
      }
    },

    onSwipeDelete(e: WechatMiniprogram.BaseEvent) {
      const { uid, name, id } = e.currentTarget.dataset as {
        uid?: string;
        name?: string;
        id?: string;
      };
      this.doDelete(uid, name, id);
    },

    async doDelete(uid?: string, name?: string, id?: string) {
      if (!uid) return;
      const itemName = name || "该药品";
      try {
        const v = getViewInfo();
        const ok = await new Promise<boolean>((resolve) => {
          wx.showModal({
            title: "确认删除",
            content: v.isSelf
              ? `将从药单中删除「${itemName}」，并同时删除该药的提醒与打卡记录。此操作不可恢复。`
              : `你正在以「${v.label}」视角操作。将删除 TA 的药品「${itemName}」及提醒记录，且不可恢复。`,
            confirmText: "删除",
            confirmColor: "#E34D59",
            cancelText: "取消",
            success: (res) => resolve(!!res.confirm),
            fail: () => resolve(false),
          });
        });
        if (!ok) return;

        // 家属视角删除需要二次确认
        if (!v.isSelf) {
          const ok2 = await new Promise<boolean>((resolve) => {
            wx.showModal({
              title: "再次确认",
              content: "此操作会影响家人的用药计划，请确认你真的要删除。",
              confirmText: "确认删除",
              confirmColor: "#E34D59",
              cancelText: "取消",
              success: (res) => resolve(!!res.confirm),
              fail: () => resolve(false),
            });
          });
          if (!ok2) return;
        }

        wx.showLoading({ title: "删除中…" });
        await deleteMedicine(Number(uid));
        wx.hideLoading();
        wx.showToast({ icon: "success", title: "已删除" });
        this.setData({ swipedId: "" });
        (this as any).loadList?.();
      } catch (err) {
        console.error("delete error", err);
        wx.showToast({ icon: "none", title: "删除失败" });
      } finally {
        try {
          wx.hideLoading();
        } catch {}
      }
    },

    // 长按也保留作为备选交互
    async onLongPress(e: WechatMiniprogram.BaseEvent) {
      const { uid, name, id } = e.currentTarget.dataset as {
        uid?: string;
        name?: string;
        id?: string;
      };
      if (!uid) return;

      const itemName = name || "该药品";
      try {
        const action = await new Promise<number>((resolve, reject) => {
          wx.showActionSheet({
            itemList: ["设置提醒", "删除药品（含提醒记录）"],
            success: (res) => resolve(res.tapIndex),
            fail: () => reject(new Error("cancel")),
          });
        });

        if (action === 0) {
          const queryName = encodeURIComponent(itemName);
          const queryId = id ? "&id=" + encodeURIComponent(id) : "";
          wx.navigateTo({
            url: "/pages/reminder-setting/index?name=" + queryName + queryId,
          });
          return;
        }

        if (action === 1) {
          (this as any).doDelete(uid, name, id);
        }
      } catch {
        // 用户取消
      }
    },
  },
});
